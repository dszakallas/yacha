import React, { PropTypes, Component } from 'react';
import { render } from 'react-dom';
import { Router, Route, Link, IndexRoute } from 'react-router';

import App from '../App';
import LoginPage from '../LoginPage';
import SignUpPage from '../SignUpPage';

class AppRouter extends Component {
  render() {
    return(
      <Router>
        <Route path="/" component={App}>
          <IndexRoute component={LoginPage} />
          <Route path="login" component={LoginPage} />
          <Route path="signup" component={SignUpPage} />
        </Route>
      </Router>
    );
  }
}

export default AppRouter;
