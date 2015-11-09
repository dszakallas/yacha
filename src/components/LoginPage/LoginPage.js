import React, { PropTypes, Component } from 'react';
import { render } from 'react-dom';

import Login from '../Login'
import Marketing from '../Marketing'

class LoginPage extends Component {

  render() {
    return(
      <div className="row">
        <Login />
        <Marketing />
      </div>
    );
  }
}

export default LoginPage;
