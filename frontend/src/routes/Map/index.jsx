import styles from './styles.module.scss';
import React from 'react';
import { Provider as MapProvider } from 'contexts/Map';
import { Provider as ControlsProvider } from 'contexts/Camera';
import Header from './components/Header';
import Viewport from './components/Viewport';

/**
 * Displays the page with a header and a map.
 *
 * @returns {JSX.Element}
 */
const Map = () => {
  return (
    <MapProvider>
      <ControlsProvider>
        <div className={styles.container}>
          <Header className={styles.header} />
          <Viewport className={styles.content} />
        </div>
      </ControlsProvider>
    </MapProvider>
  );
};

export default Map;
