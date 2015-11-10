import React, { PropTypes, Component } from 'react';
import { render } from 'react-dom';

import withStyles from '../../decorators/withStyles';
import styles from './SignUpPage.less';

@withStyles(styles)
class SignUpPage extends Component {
  render() {
    return(
      <div className="col-xs-12 register">
      <div className="container">
        <div className="row">
          <div className="col-sm-10 col-sm-offset-2">
            <h1>Sign Up</h1>
          </div>
        </div>
        <div className="row">
          <htmlForm className="htmlForm-horizontal">
            <div className="htmlForm-group">
              <label htmlFor="reg-username" className="col-sm-2 control-label">Username</label>
              <div className="col-sm-10">
                <input type="text" className="htmlForm-control" id="reg-username" placeholder="Username" />
              </div>
            </div>
            <div className="htmlForm-group">
              <label htmlFor="reg-email" className="col-sm-2 control-label">Email</label>
              <div className="col-sm-10">
                <input type="email" className="htmlForm-control" id="reg-email" placeholder="Email" data-trigger="focus" data-container="body" data-toggle="popover" data-placement="bottom" data-content="Enter your email address." />
              </div>
            </div>
            <div className="htmlForm-group">
              <label htmlFor="reg-password" className="col-sm-2 control-label">Password</label>
              <div className="col-sm-10">
                <input type="password" className="htmlForm-control" id="reg-password" placeholder="Password" />
              </div>
            </div>
            <div className="htmlForm-group">
              <label htmlFor="reg-password-again" className="col-sm-2 control-label">Password again</label>
              <div className="col-sm-10">
                <input type="password" className="htmlForm-control" id="reg-password-again" placeholder="Password again"/>
              </div>
            </div>
            <div className="htmlForm-group">
              <div className="col-sm-offset-2 col-sm-10">
                <button type="submit" className="btn btn-default">Sign up</button>
              </div>
            </div>
          </htmlForm>
        </div>
      </div>
    </div>
    );
  }
}

export default SignUpPage;
