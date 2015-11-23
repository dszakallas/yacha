import React, { PropTypes, Component } from 'react';
import { Alert } from 'react-bootstrap';
import { Link } from 'react-router';
import ApiClient from '../../core/ApiClient';

export class Forgot extends Component {

  constructor() {
    super();

    this.state = {
      value: '',
      error: true,
      touched: false,

      submitted: false
    }
  }

  changed(e) {
    this.setState({ value: e.target.value, touched: true });

    if(!e.target.value || e.target.value.lastIndexOf('@') === -1 )
      this.setState({ error: true });
    else
      this.setState({ error: false });
  }

  blurred() {
    this.setState({ touched: true });
  }

  async submit(e) {
    e.preventDefault();

    try {
      await ApiClient.sendForgot(this.state.value);
    } catch(err) {
      console.warn("Forgot: Server possibly couldnt send the mail");
    }

    this.setState({ submitted: true });

  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-xs-12">
            <h1>Reset your password</h1>
          </div>
        </div>
        <div className="row">
          {
            this.state.submitted
              ?
                <Alert bsStyle="info" >
                  <h4>Email sent</h4>
                  <p>If the address corresponds to an existing account, you should receive an email shortly.</p>
                </Alert>
              :
                <form className="form-horizontal" onSubmit={this.submit.bind(this)}>
                  <p>Enter your email address.</p>
                  <div className={ this.state.error && this.state.touched ? "has-error" : null }>
                    <div className="form-group">
                      <label htmlFor="forgot-email" className="sr-only">Email address</label>
                      <input type="text"
                        className="form-control"
                        id="forgot-email"
                        placeholder="Registered email"
                        value={this.state.value}
                        onChange={this.changed.bind(this)}
                        onBlur={this.blurred.bind(this)}/>
                    </div>
                    <button disabled={this.state.error ? true : false } type="submit" className="btn btn-default">Send</button>
                  </div>
                </form>
          }
        </div>
      </div>
    );
  }
}

export class Verify extends Component {

  constructor() {
    super();

    this.state = {
      submitted: false,
      error: false
    };
  }

  async verify() {
    const forgot = this.props.params.forgot ? true : false;

    if(!this.props.params.token) {
      this.setState({ submitted:true, error: true });
    } else {
      try {
        console.log(`Verify: sending token`);
        const resp = await ApiClient.verify(forgot, this.props.params.token);
        if(forgot)
          this.props.history.pushState('/home');
      } catch (err) {
        console.warn(`Verify: server returned error: ${err}`);
        this.setState({ submitted: true, error: true });
      }
    }
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-xs-12">
            <h1>Verification</h1>
          </div>
        </div>
        <div className="row">
          {
            this.state.submitted
              ?
                this.state.error
                  ?
                    <Alert bsStyle="danger" >
                      <h4><span className="glyphicon glyphicon-remove" aria-hidden="true"></span>Verification failed</h4>
                      <p>Could not verify that email address. You should try again <Link to='gate/forgot'>here</Link>.</p>
                    </Alert>
                  :
                    <Alert bsStyle="success" >
                      <h4><span className="glyphicon glyphicon-ok" aria-hidden="true"></span>Verification successful</h4>
                      <p>You may log in now.</p>
                    </Alert>
              :
              <Alert bsStyle="info" onLoad={this.verify.bind(this)}>
                <h4><span className="glyphicon glyphicon-ok" aria-hidden="true"></span>Verifying</h4>
                <p>Please wait... </p>
              </Alert>
          }
        </div>
      </div>
    );
  }
}
