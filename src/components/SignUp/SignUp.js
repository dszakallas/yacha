import React, { PropTypes, Component } from 'react';

import withStyles from '../../decorators/withStyles';
import SignUpForm from '../SignUpForm'

class SignUp extends Component {
  render() {
    return (
      <div>
        <div className="row">
          <div className="col-sm-10 col-sm-offset-2">
            <h1>Sign Up</h1>
          </div>
        </div>
        <div className="row">
          <SignUpForm />
        </div>
      </div>
    );
  }
}

export default SignUp;
