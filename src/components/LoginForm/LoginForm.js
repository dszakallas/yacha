import React, { PropTypes, Component } from 'react';
import { Alert } from 'react-bootstrap';
import withStyles from '../../decorators/withStyles';
import styles from './LoginForm.less'


@withStyles(styles)
class LoginForm extends Component {

  constructor() {
    super();

    this.state = {
      error: "",

      loginName: "",
      password: "",
      remember: true
    };
  }

  submit(e) {
    e.preventDefault();
    if(!this.state.loginName || !this.state.password) {
      this.setState({ error: "Fill in both fields" });
    } else {
      this.setState({ error: '' });
      console.log("submitting form");
    }
  }

  render() {

    return (
      <form className="login" onSubmit={this.submit.bind(this)}>
        { this.state.error ? <Alert bsStyle="danger" >{this.state.error}</Alert> : '' }
        <div className={ this.state.error ? "has-error" : null }>
          <div className="form-group">
            <label htmlFor="login" className="sr-only">Login name or email</label>
            <input type="text"
              className="form-control"
              id="login"
              placeholder="Username or email"
              value={this.state.loginName}
              onChange={(e) => this.setState({ loginName: e.target.value }) } />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="sr-only">Password</label>
            <input type="password"
              className="form-control"
              id="password"
              placeholder="Password"
              value={this.state.password}
              onChange={(e) => this.setState({ password: e.target.value})} />
          </div>
        </div>
        <div className="checkbox">
          <label>
            <input type="checkbox"
              id="remember"
              value={this.state.remember}
              onChange={(e) => this.setState({ remember: e.target.value}) }  />
              Remember me
          </label>
          <Link href={this.}>Forgot your password?</Link>
        </div>
        <button type="submit" className="btn btn-default">Sign in</button>
      </form>
    );
  }
}

export default LoginForm;
