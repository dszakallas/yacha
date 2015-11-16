import React, { PropTypes, Component } from 'react';
import { Router, Route, Link, IndexRoute } from 'react-router';

import App from '../App';
import GatePage from '../GatePage';
import Marketing from '../Marketing';
import SignUp from '../SignUp';
import Forgot from '../Forgot';

class AppRouter extends Component {
  render() {
    return(
      <Router>
        <Route path="/" component={App}>
          <IndexRoute component={GatePage} />
          <Route path="gate" component={GatePage}>
            <IndexRoute component={Marketing} />
            <Route path="marketing" component={Marketing} />
            <Route path="signup" component={SignUp} />
            <Route path="forgot/:key" component={Forgot} />
          </Route>
        </Route>
      </Router>
    );
  }
}

export default AppRouter;
