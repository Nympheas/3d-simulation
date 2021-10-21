import useUpdateEffect from 'hooks/useUpdateEffect';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import axios, { CancelTokenSource } from 'axios';
import debounce from 'lodash/debounce';
import { getMavlinkPort, postMavlinkPort } from 'services/config';
import { MAVLINK_PORT } from 'consts';

const state = {
  doConnect: true,
  isConnected: false,
  mavlinkError: '',
  mavlinkPortValue: MAVLINK_PORT + '',
  mavlinkStatus: '',
};

const methods = {
  connect() {},
  disconnect() {},
  setDoConnect(value: boolean) {},
  setIsConnected(value: boolean) {},
  setMavlinkPort(port: number) {},
  setMavlinkPortValue(port: string) {},
};

const SettingsContext = createContext({ methods, state });

interface Props {
  children: any;
}

/**
 * Provides the context with main app settings such as Mavlink port.
 *
 * @param props component properties
 * @returns {JSX.Element}
 */
export const Provider = ({ children }: Props) => {
  const [doConnect, setDoConnect] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [mavlinkError, setMavlinkError] = useState('');
  const [mavlinkPort, setMavlinkPort] = useState(MAVLINK_PORT);
  const [mavlinkPortValue, setMavlinkPortValue] = useState(MAVLINK_PORT + '');
  const [mavlinkStatus, setMavlinkStatus] = useState('');
  const [cancelSource, setCancelSource] = useState<CancelTokenSource | null>(
    null
  );

  const methods = useMemo(
    () => ({
      connect() {
        setDoConnect(true);
      },
      disconnect() {
        setDoConnect(false);
      },
      setDoConnect,
      setIsConnected,
      setMavlinkPort(port: number) {
        setMavlinkPort(port);
        setMavlinkStatus('');
      },
      setMavlinkPortValue,
    }),
    []
  );

  useEffect(() => {
    getMavlinkPort()
      .then((response) => {
        const { mavlinkPort, mavlinkStatus } = response.data;
        setMavlinkPort(+mavlinkPort);
        setMavlinkPortValue(mavlinkPort + '');
        setMavlinkStatus(mavlinkStatus);
        if (mavlinkStatus === 'error') {
          setMavlinkError('Mavlink connection is down.');
        }
      })
      .catch((error) => {
        setMavlinkError(
          `Unable to receive Mavlink port status. ${error.toString()}`
        );
      });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateMavlinkPort = useCallback(
    debounce(
      (port: number) => {
        cancelSource?.cancel();
        const source = axios.CancelToken.source();
        setCancelSource(source);
        postMavlinkPort(port, source)
          .then((response) => {
            setMavlinkError('');
            setMavlinkStatus(response.data.mavlinkStatus);
            console.log(
              `Switched Mavlink to port ${response.data.mavlinkPort}`
            );
            setCancelSource(null);
          })
          .catch((error) => {
            if (axios.isCancel(error)) {
              return;
            }
            let response = error.response;
            setMavlinkError(response.data.error.message);
            setMavlinkStatus(response.data.mavlinkStatus);
            setCancelSource(null);
          });
      },
      500,
      { leading: false }
    ),
    [cancelSource]
  );

  useUpdateEffect(() => {
    if (!mavlinkStatus) {
      updateMavlinkPort(mavlinkPort);
    }
  }, [mavlinkPort, mavlinkStatus]);

  return (
    <SettingsContext.Provider
      children={children}
      value={{
        methods,
        state: {
          doConnect,
          isConnected,
          mavlinkError,
          mavlinkPortValue,
          mavlinkStatus,
        },
      }}
    />
  );
};

export default SettingsContext;
