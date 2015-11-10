import React, { PropTypes, Component } from 'react';
import { render } from 'react-dom';

import LoginForm from '../LoginForm'
import Marketing from '../Marketing'

class LoginPage extends Component {

  render() {
    return(
      <div className="row">
        <LoginForm />
        <Marketing />
      </div>
    );
  }
}

export default LoginPage;
