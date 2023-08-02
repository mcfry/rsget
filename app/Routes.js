/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes.json';
import App from './containers/App';
import HomePage from './containers/HomePage';
import TrackerPage from './containers/TrackerPage';
import NightPage from './containers/NightPage';
// import RegisterPage from './containers/RegisterPage';
//<Route path={routes.REGISTER} component={RegisterPage} />

export default () => (
  <App>
    <Switch>
      <Route path={routes.TRACKER} component={TrackerPage} />
      <Route path={routes.NIGHT} component={NightPage} />
      <Route path={routes.HOME} component={HomePage} />
    </Switch>
  </App>
);
