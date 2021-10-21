import styles from './App.module.scss';
import React from 'react';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';
import { Provider as SettingsProvider } from 'contexts/Settings';
import { Provider as NavigationProvider } from 'contexts/Navigation';
import Dashboard from 'routes/Dashboard';
import Map from 'routes/Map';

const App = () => (
  <div className={styles.app}>
    <SettingsProvider>
      <NavigationProvider>
        <Router>
          <Switch>
            <Route path="/dashboard">
              <Dashboard />
            </Route>
            <Route path="/">
              <Map />
            </Route>
            <Route path="*">
              <Redirect to="/" />
            </Route>
          </Switch>
        </Router>
      </NavigationProvider>
    </SettingsProvider>
  </div>
);

export default App;
