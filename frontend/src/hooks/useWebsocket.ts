import { useEffect, useRef, useState } from 'react';

export const useWebsocket = (websocketAddress: string): [boolean, string | null] => {
    const [connected, setConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!ws.current) {
            ws.current = new WebSocket(websocketAddress);
            ws.current!.onopen = () => {
                console.log('Connected to websocket at ' + websocketAddress);
                setConnected(true);
            };
            ws.current!.onmessage = (message) => {
                setLastMessage(message.data);
            };
        }

        return () => {
            if (!!ws.current) {
                ws.current.close();
                setConnected(false);
                ws.current = null;
                console.log('Closed websocket connection to ' + websocketAddress);
            }
        };
    }, []);

    return [connected, lastMessage];
};
