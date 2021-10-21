import { createContext, useContext, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import SettingsContext from 'contexts/Settings';
import { getMapsParams } from 'services/maps';

const state = {
  apiLoadError: null,
  isLoadingApi: true,
  mapId: '',
};

const MapContext = createContext(state);

export default MapContext;

interface Props {
  children: any;
}

/**
 * Provides the context with map parameters such as Map ID.
 *
 * @param props component properties
 */
export const Provider = ({ children }: Props) => {
  const {
    state: { doConnect },
  } = useContext(SettingsContext);
  const [apiKey, setApiKey] = useState('');
  const [apiLoadError, setApiLoadError] = useState(null);
  const [hasLoadedApi, setHasLoadedApi] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [mapId, setMapId] = useState('');

  useEffect(() => {
    if (apiKey || !doConnect) {
      return;
    }
    getMapsParams()
      .then(({ apiKey, mapId }) => {
        setApiKey(apiKey);
        setMapId(mapId);
      })
      .catch(console.error);
  }, [apiKey, doConnect]);

  useEffect(() => {
    if (!apiKey || hasLoadedApi) {
      return;
    }
    let isMounted = true;
    const loader = new Loader({
      apiKey,
      version: 'beta',
    });
    loader
      .load()
      .then(() => {
        console.log('Loaded Google Maps API');
        if (isMounted) {
          setHasLoadedApi(true);
          setIsLoadingApi(false);
        }
      })
      .catch((error) => {
        console.error('Failed to load Google Maps API');
        console.error(error);
        if (isMounted) {
          setApiLoadError(error);
          setIsLoadingApi(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [apiKey, hasLoadedApi]);

  return (
    <MapContext.Provider
      children={children}
      value={{
        apiLoadError,
        isLoadingApi,
        mapId,
      }}
    />
  );
};
