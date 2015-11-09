import React, { PropTypes, Component } from 'react';
import { render } from 'react-dom';

import withStyles from '../../decorators/withStyles';
import styles from './Login.less'

@withStyles(styles)
class Login extends Component {

  render() {
    return(

      <div className="col-xs-12 col-sm-6 col-md-4">
        <form className="login">
          <div className="form-group">
            <label htmlFor="login" className="sr-only">Login name or email</label>
            <input type="text" className="form-control" id="login" placeholder="Username or email" />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="sr-only">Password</label>
            <input type="password" className="form-control" id="password" placeholder="Password" />
          </div>
          <div className="checkbox">
            <label>
              <input type="checkbox" id="remember" /> Remember me
            </label>
            <a href="...">Forgot your password?</a>
          </div>
          <button type="submit" className="btn btn-default">Sign in</button>
        </form>
      </div>

    );
  }
}

export default Login;
