import axios, { CancelTokenSource } from 'axios';
import { API_BASE_URL } from 'consts';

/**
 * Fetches currently used Mavlink port from backend.
 *
 * @returns {Promise}
 */
export const getMavlinkPort = () => {
  return axios.get(`${API_BASE_URL}/config`);
};

/**
 * Updates Mavlink port in backend.
 *
 * @param mavlinkPort MAVLINK port to use
 */
export const postMavlinkPort = (
  mavlinkPort: number,
  source?: CancelTokenSource
) => {
  return axios.post(
    `${API_BASE_URL}/config`,
    { mavlinkPort },
    { cancelToken: source?.token }
  );
};
