import axios from 'axios';
import { API_BASE_URL } from 'consts';

/**
 * Fetches Google Maps API parameters such as Map ID.
 */
export async function getMapsParams() {
  const response = await axios.get(`${API_BASE_URL}/maps-params`);
  const { apiKey = '', mapId } = response.data;
  return { apiKey: atob(apiKey.split('').reverse().join('')), mapId };
}
