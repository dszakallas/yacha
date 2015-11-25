import React, { PropTypes, Component } from 'react';
import { Alert } from 'react-bootstrap';

import { Link } from 'react-router';

import ApiClient from '../../core/ApiClient';

class LoginForm extends Component {

  constructor() {
    super();

    this.state = {
      error: "",

      email: "",
      password: "",
      remember: true
    };
  }

  async submit(e) {
    e.preventDefault();
    if(!this.state.email || !this.state.password) {
      this.setState({ error: "Fill in both fields" });
    } else {
      this.setState({ error: '' });
      console.log("submitting form");
      try {
        await this.props.login(this.state.email, this.state.password);
      } catch(err) {
        if(err.status === 401) {
          this.setState({ error: 'Invalid email or password' });
        } else {
          this.setState({ error: 'Something went wrong', email:'', password:'' });
          console.warn(`LoginForm: server returned ${err}`);
        }
      }
    }
  }

  render() {

    return (
      <form onSubmit={this.submit.bind(this)}>
        { this.state.error ? <Alert bsStyle="danger" >{this.state.error}</Alert> : '' }
        <div className={ this.state.error ? "has-error" : null }>
          <div className="form-group">
            <label htmlFor="login" className="sr-only">Login name or email</label>
            <input type="text"
              className="form-control"
              id="login"
              placeholder="Username or email"
              value={this.state.email}
              onChange={(e) => this.setState({ email: e.target.value }) } />
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
          <Link to={'/gate/forgot'}>Forgot your password?</Link>
        </div>
        <button type="submit" className="btn btn-default">Sign in</button>
      </form>
    );
  }
}

export default LoginForm;
