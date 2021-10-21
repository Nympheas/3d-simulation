import { createContext, useContext, useEffect, useState } from 'react';
import SettingsContext from 'contexts/Settings';
import { ALTITUDE_MSG_NAME, COORDS_MSG_NAME, WS_CHANNEL_URL } from 'consts';

const navData = {
  alt: 0,
  hdg: 0,
  lat: 0,
  lng: 0,
};

let ws: WebSocket | null = null;

const getNavData = () => navData;

/**
 * Called on 'message' Websocket event.
 * 
 * @param message Websocket message
 */
const onMessage = ({ data }: any) => {
  let type: string;
  let payload: any;
  try {
    ({ type, payload } = JSON.parse(data));
  } catch (error) {
    console.error(error);
    return;
  }
  if (type === COORDS_MSG_NAME) {
    navData.lat = payload.lat / 1e7;
    navData.lng = payload.lng / 1e7;
  } else if (type === ALTITUDE_MSG_NAME) {
    // navData.alt = payload.alt / 1e3;
    navData.alt = payload.relativeAlt / 1e3;
    navData.hdg = (payload.hdg * Math.PI) / 18000;
    // navData.lat = payload.lat / 1e7;
    // navData.lng = payload.lon / 1e7;
  }
};

type State = [boolean, () => typeof navData];

const NavigationContext = createContext<State>([false, getNavData]);

interface Props {
  children: any;
}

/**
 * Provides the context with navigational data.
 *
 * @param props component properties
 */
export const Provider = ({ children }: Props) => {
  const [hasNavData, setHasNavData] = useState(false);
  const { methods, state } = useContext(SettingsContext);
  const { setDoConnect, setIsConnected } = methods;
  const { doConnect } = state;

  useEffect(() => {
    if (doConnect) {
      ws = new WebSocket(WS_CHANNEL_URL);
      ws.onclose = () => {
        console.log('Disconnected from WebSocket server.');
        setDoConnect(false);
        setIsConnected(false);
      };
      ws.onerror = () => {
        setDoConnect(false);
        setIsConnected(false);
      };
      ws.onmessage = (message) => {
        let data: any;
        try {
          data = JSON.parse(message.data);
        } catch (error) {
          console.error(error);
          return;
        }
        if (data.type === COORDS_MSG_NAME) {
          const { lat, lng } = data.payload;
          console.log('Received first message with nav data: ');
          console.log(`Starting coordinates: ${lat / 1e7},${lng / 1e7}`);
          onMessage(message);
          if (ws) {
            ws.onmessage = onMessage;
          }
          setHasNavData(true);
        }
      };
      ws.onopen = () => {
        console.log('Connected to WebSocket server.');
        setIsConnected(true);
      };
    }
    return () => {
      if (ws) {
        ws.close();
        ws = null;
      }
    };
  }, [doConnect, setDoConnect, setIsConnected]);

  return (
    <NavigationContext.Provider
      children={children}
      value={[hasNavData, getNavData]}
    />
  );
};

export default NavigationContext;
