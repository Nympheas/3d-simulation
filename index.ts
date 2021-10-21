import fs from 'fs';
import constants from 'constants';
import {
  ardupilotmega,
  common,
  icarous,
  MavEsp8266,
  minimal,
  uavionix,
} from 'node-mavlink';
import WebSocket, { Server as WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import { Application } from 'express-serve-static-core';
import path from 'path';

const APPMODE = process.env.APPMODE || 'prod'; // use 'demo' for sending fake messages
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const GOOGLE_MAP_ID = process.env.GOOGLE_MAP_ID || '';
const MAVLINK_PORT = +process.env.MAVLINK_PORT! || 14550;

const FORWARDED_MSG_NAME_SET = new Set(['GLOBAL_POSITION_INT', 'SIMSTATE']);

// create a registry of mappings between a message id and a data class
const REGISTRY: any = {
  ...minimal.REGISTRY,
  ...common.REGISTRY,
  ...ardupilotmega.REGISTRY,
  ...uavionix.REGISTRY,
  ...icarous.REGISTRY,
};

let websocketServer: WebSocketServer | null = null;
let mavlinkConnection: MavEsp8266 | null = null;
let mavlinkPort = MAVLINK_PORT;
let mavlinkStatus = '';
let connectionAttempt = 0;

// used for computing fake lat, lng
let timeStart = Date.now();
let velocity = 1e3;
let cycle = 0;

main();

/**
 * This is the entry point of the application.
 * It configures an expressjs server to serve the frontend application,
 * and configures the websocket server to setup the mavlink communication with the frontend.
 */
async function main() {
  let attempt = ++connectionAttempt;
  try {
    setupWebserver(8080);
    websocketServer = setupWebsocketServer(8081);

    mavlinkConnection = await setupMavlink(MAVLINK_PORT);
    if (APPMODE === 'demo') {
      setupFakeMavlink();
    }
  } catch (error) {
    console.error(error);
    if (attempt === connectionAttempt) {
      mavlinkStatus = 'error';
    }
    return;
  }
  if (attempt === connectionAttempt) {
    mavlinkStatus = 'ok';
  }
}

/**
 * Setup an expressjs web server which will:
 * - Serve the static files for the frontend application
 * - Serve the configuration API endpoint
 */
function setupWebserver(port: number): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  // Setup express to serve the static files of the frontend application
  app.use(express.static(path.join(__dirname, 'frontend/')));

  app.get('/api/maps-params', (req, res) => {
    let apiKey = GOOGLE_API_KEY || '';
    // a very secure way of encrypting API key
    let buf = Buffer.from(apiKey);
    apiKey = buf.toString('base64').split('').reverse().join('');
    res.json({ apiKey, mapId: GOOGLE_MAP_ID });
  });

  app.get('/api/config', (req, res) => {
    res.json({ mavlinkPort, mavlinkStatus });
  });

  // Configuration endpoint to configure mavlink port
  app.post('/api/config', async (req, res) => {
    const port = +req.body.mavlinkPort;
    if (!port || port !== Math.trunc(port)) {
      res
        .status(400)
        .json({ error: { message: 'Invalid port number' }, mavLinkPort: port });
      return;
    }
    mavlinkPort = port;

    if (!!mavlinkConnection) {
      mavlinkConnection.removeAllListeners();
    }
    let attempt = ++connectionAttempt;
    try {
      mavlinkConnection = await setupMavlink(+port);
    } catch (error: any) {
      if (attempt === connectionAttempt) {
        mavlinkStatus = 'error';
      }
      const message = `Unable to receive messages on port ${port}.`;
      console.error(message);
      res.status(500).json({
        error: { exception: error.toString(), message },
        mavlinkPort: port,
        mavlinkStatus,
      });
      return;
    }
    if (attempt === connectionAttempt) {
      mavlinkStatus = 'ok';
    }
    console.log(`Successful Mavlink connection on port ${port}.`);
    res.json({ mavlinkPort: port, mavlinkStatus });
  });

  app.get('*', (req, res) => {
    const filePath = path.join(__dirname, 'frontend', 'index.html');
    fs.access(filePath, constants.R_OK, (err) => {
      if (err) {
        res.sendStatus(404);
        return;
      }
      res.sendFile(filePath);
    });
  });

  app.listen(port, () => {
    console.log(`Application listening on port ${port}`);
  });

  return app;
}

/**
 * Setup websocket server, which is used to send mavlink messages to the frontend application.
 */
function setupWebsocketServer(port: number): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (connection) => {
    console.log('New client connected');

    connection.on('close', () => {
      console.log('Client connection closed');
    });
  });

  return wss;
}

/**
 * Setup mavlink connection. Mavproxy sends UDP messages to a specific port on localhost,
 * 14550, and 14551.
 *
 * This function starts listening on those ports by default, and publishes any new message
 * to the frontend application via the websocket connection.
 *
 * The listening port can be configured by passing the port number as parameter.
 */
async function setupMavlink(port?: number): Promise<MavEsp8266 | null> {
  if (APPMODE === 'demo') {
    return null;
  }
  const connection = new MavEsp8266();

  // start the communication
  await connection.start(port);

  // send incomming packets over the websocket to all subscribed clients
  connection.on('data', mavlinkPacketHandler);

  return connection;
}

/**
 * Parse a Mavlink packet, and publish it to the frontend.
 */
function mavlinkPacketHandler(packet: any) {
  const clients = websocketServer?.clients;
  if (!clients) {
    return;
  }
  const clazz = REGISTRY[packet.header.msgid];
  if (!clazz) {
    console.log('Unknown packet: ', packet);
    return;
  }
  const type = clazz['MSG_NAME'];
  if (!FORWARDED_MSG_NAME_SET.has(type)) {
    return;
  }
  const payload = packet.protocol.data(packet.payload, clazz);
  clients.forEach((client: any) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(serializeMessage({ type, payload }));
    }
  });
}

/**
 * Starts the process of sending fake GLOBAL_POSITION_INT and SIMSTATE messages
 * to clients connected to WebSocket server.
 */
function setupFakeMavlink() {
  setTimeout(sendFakeMessage, 50);
}

/**
 * Repeatedly sends fake messages to clients connected to WebSocket server.
 */
function sendFakeMessage() {
  setTimeout(sendFakeMessage, 50);
  const clients = websocketServer?.clients;
  if (!clients) {
    return;
  }
  let ms = Date.now();
  let time = (ms - timeStart) / 1e3;
  const type = ++cycle % 2 ? 'SIMSTATE' : 'GLOBAL_POSITION_INT';
  let lat = Math.round(-353635360 - (time * velocity) / 2);
  let lng = Math.round(1491649330 - time * velocity);
  let alt = 50e3;
  const payload =
    type === 'SIMSTATE'
      ? { lat, lng }
      : { alt, hdg: 0, lat, lon: lng, relativeAlt: alt };
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(serializeMessage({ type, payload }));
    }
  });
}

/**
 * Serialize a JSON object. This function is necessary because the mavlink message contains
 * bigint values, which cannot be serialized by default. We are serializing bigint as strings.
 */
function serializeMessage(message: any) {
  return JSON.stringify(message, (key, value) => {
    return typeof value === 'bigint' ? value.toString() + 'n' : value;
  });
}
