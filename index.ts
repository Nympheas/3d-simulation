import { MavEsp8266, common, MavLinkPacketParser } from 'node-mavlink';
import { minimal, ardupilotmega, uavionix, icarous } from 'node-mavlink';
import WebSocket, { Server as WebSocketServer } from 'ws';
import express, { response } from 'express';
import { Application } from 'express-serve-static-core';
import path from 'path';
import bodyParser from 'body-parser';

let wss: WebSocketServer | null = null;
let mavlinkPort: MavEsp8266 | null = null;

/**
 * This is the entry point of the application.
 * It configures an expressjs server to serve the frontend application,
 * and configures the websocket server to setup the mavlink communication with the frontend.
 */
async function main() {
    setupWebserver(8080);

    wss = setupWebsocketServer(8081);
    mavlinkPort = await setupMavlink();
}

/**
 * Setup an expressjs web server which will:
 * - Serve the static files for the frontend application
 * - Serve the configuration API endpoint
 */
function setupWebserver(port: number): Application {
    const app = express();

    app.use(bodyParser.json());
    // Setup express to serve the static files of the frontend application
    app.use(express.static(path.join(__dirname, 'frontend/')));

    // Configuration endpoint to configure mavlink port
    app.post('/configure', async (request, response) => {
        const port = request.body.mavlinkPort;

        if (!!mavlinkPort) {
            mavlinkPort.removeAllListeners();
        }

        try {
            mavlinkPort = await setupMavlink(port);
            console.log(`Successful Mavlink connection on port ${port}.`);
            response.sendStatus(200);
        } catch(exception) {
            const message = `Unable to receive messages on port ${port}. ${exception}`;
            console.log(message);
            response.status(500).contentType('application/json').send(JSON.stringify(message));
        }
    });

    app.get('*', (request, response) => {
        response.sendFile(path.join(__dirname, 'frontend/index.html'));
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
    const wss = new WebSocketServer({
        port,
    });

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
async function setupMavlink(port?: number): Promise<MavEsp8266> {
    const mavlinkPort = new MavEsp8266();

    // start the communication
    await mavlinkPort.start(port);

    // send incomming packets over the websocket to all subscribed clients
    mavlinkPort.on('data', packet => mavlinkPacketHandler(packet));

    return mavlinkPort;
}

/**
 * Parse a Mavlink packet, and publish it to the frontend.
 */
function mavlinkPacketHandler(packet: any) {
    // create a registry of mappings between a message id and a data class
    const REGISTRY: any = {
        ...minimal.REGISTRY,
        ...common.REGISTRY,
        ...ardupilotmega.REGISTRY,
        ...uavionix.REGISTRY,
        ...icarous.REGISTRY,
    };

    const clazz = REGISTRY[packet.header.msgid];
    if (clazz) {
        const data = packet.protocol.data(packet.payload, clazz);
        wss?.clients.forEach((client:any ) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(serializeMessage({
                    type: clazz['MSG_NAME'],
                    payload: data
                }));
            }
        });
    } else {
        console.log('Unknown packet: ', packet);
    }
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

main();
