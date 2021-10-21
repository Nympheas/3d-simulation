export const API_BASE_URL = 'http://localhost:8080/api';
export const WS_CHANNEL_URL = 'ws://127.0.0.1:8081';

export const MAVLINK_PORT = +process.env.MAVLINK_PORT! || 14550;

export const ALTITUDE_MSG_NAME = 'GLOBAL_POSITION_INT';
export const COORDS_MSG_NAME = 'SIMSTATE';
