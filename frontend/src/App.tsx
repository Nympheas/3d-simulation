import React from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import './App.css';
import { Dashboard } from './dashboard/Dashboard';

function App() {
    return (
        <div className="App">
            <Router>
                <Switch>
                    <Route exact path=''>
                        <Dashboard />
                    </Route>
                    <Route path='*'>
                        <Redirect to='/'/>
                    </Route>
                </Switch>
            </Router>
        </div>
    );
}

export default App;
