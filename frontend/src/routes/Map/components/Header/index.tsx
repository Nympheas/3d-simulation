import styles from './styles.module.scss';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import cn from 'classnames';
import Toggle from 'components/Toggle';
import IntegerField from 'components/IntegerField';
import SettingsContext from 'contexts/Settings';
import { isIntegerString, preventDefault } from 'utils/misc';

interface Props {
  className?: string;
}

const Header = ({ className }: Props) => {
  const {
    methods: { setDoConnect, setMavlinkPort, setMavlinkPortValue },
    state: {
      doConnect,
      isConnected,
      mavlinkError,
      mavlinkPortValue,
      mavlinkStatus,
    },
  } = useContext(SettingsContext);

  return (
    <div className={cn(styles.container, className)}>
      <Link className={styles.logo} to="/" />
      <form className={styles.form} action="#" onSubmit={preventDefault}>
        <label className={styles.portFieldLabel}>Mavlink Port:</label>
        <IntegerField
          className={styles.portField}
          name="port"
          onChange={setMavlinkPortValue}
          onCommit={setMavlinkPort}
          value={mavlinkPortValue}
        />
        <div className={styles.portStatus}>
          {!mavlinkStatus || !isIntegerString(mavlinkPortValue) ? (
            <div className={styles.warningMark} />
          ) : mavlinkError ? (
            <div className={styles.portError}>
              <div className={styles.errorMark} />
              <div className={styles.portErrorMessage}>{mavlinkError}</div>
            </div>
          ) : (
            <div className={styles.successMark} />
          )}
        </div>
        <div
          className={cn(styles.onlineLabel, { [styles.isOnline]: isConnected })}
        >
          {isConnected ? 'Online' : 'Offline'}
        </div>
        <Toggle
          className={styles.onlineToggle}
          isOn={doConnect}
          name="is_online"
          onChange={setDoConnect}
        />
      </form>
    </div>
  );
};

export default Header;
