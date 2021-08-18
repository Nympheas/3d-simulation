import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import ReactJson from 'react-json-view';
import { useWebsocket } from '../hooks/useWebsocket';
import './Dashboard.css';

const websocketAddress = 'ws://127.0.0.1:8081';

/**
 * The main page of the application. Connects to the webserver through a websocket,
 * and displays any received mavlink message.
 *
 * The number of displayed messages are limited for performance reasons.
 */
export const Dashboard = () => {
    const [connected, lastMessage] = useWebsocket(websocketAddress);
    const [messages, setMessages] = useState<object[]>([]);
    const [limit, setLimit] = useState(20);
    const [paused, setPaused] = useState(false);
    const [mavlinkPort, setMavlinkPort] = useState(14550);

    // Add any incoming message to the list of messages
    useEffect(() => {
        if (!!lastMessage) {
            const data = JSON.parse(lastMessage);
            if (!paused) {
                setMessages((messages) => [data, ...messages].slice(0, limit));
            }
        }
    }, [limit, paused, lastMessage]);

    // Call configure endpoint with the Mavlink port
    const configure = () => {
        setMessages([]);
        axios
            .post('/configure', {
                mavlinkPort,
            })
            .catch((error) => setMessages([error.response.data]));
    };

    if (connected) {
        // Map each message to a ReactJson component, which can display the JSON objects in a nice way
        const messageNodes = messages.map((msg: any, idx) => (
            <li key={idx}>
                <ReactJson src={msg.payload} collapsed={true} name={msg.type} />
            </li>
        ));

        return (
            <div>
                <button onClick={() => setPaused(!paused)}>{paused ? 'Start' : 'Pause'}</button>
                <div>
                    <label>Limit the number of messsages:</label>
                    <input
                        id="limit"
                        name="limit"
                        type="number"
                        value={limit}
                        onChange={(event) => setLimit(parseInt(event.target.value))}
                    ></input>
                </div>
                <div>
                    <div>
                        <label>Mavlink port</label>
                        <input
                            type="number"
                            value={mavlinkPort}
                            onChange={(event) => setMavlinkPort(parseInt(event.target.value))}
                        />
                    </div>
                    <button onClick={() => configure()}>Configure</button>
                </div>

                <h2>Connected to: {websocketAddress}. Recent messages: </h2>
                <ul>{messageNodes}</ul>
            </div>
        );
    } else {
        return <h2>Trying to connect to: {websocketAddress} </h2>;
    }
};
