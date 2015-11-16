import React, { PropTypes, Component } from 'react';

import withStyles from '../../decorators/withStyles';
import styles from './SignUp.less';
import SignUpForm from '../SignUpForm'

@withStyles(styles)
class SignUp extends Component {
  render() {
    return (
      <div className="container register">
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
