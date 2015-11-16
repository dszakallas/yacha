import React, { PropTypes, Component } from 'react';

import { OverlayTrigger, Popover, Alert } from 'react-bootstrap';

class SignUpForm extends Component {

  constructor() {
    super();
    this.state = {
      //make it as shallow as possible
      //setState does shallow merge
      nicknameTouched: false,
      nicknameValue: '',
      nicknameError: "Shouldn't be empty",
      nicknameLastTried: '',

      emailTouched: false,
      emailValue: '',
      emailError: "Shouldn't be empty",
      emailLastTried: '',

      passwordTouched: false,
      passwordValue: '',
      passwordError: "Shouldn't be empty",

      repasswordTouched: false,
      repasswordValue: '',
      repasswordError: "Shouldn't be empty",

    };
  }

  nicknameChanged(e) {
    const newValue = e.target.value;
    this.setState({ nicknameValue: newValue });
    this.setState({ nicknameTouched: true });

    if( newValue.length === 0) {
      this.setState({ nicknameError: "Shouldn't be empty" });
    } else if(newValue.length < 5 ) {
      this.setState({ nicknameError: 'Nickname too short' });
    } else if (newValue === this.state.nicknameLastTried) {
      this.setState({ nicknameError: `${this.state.nicknameLastTried} is already taken` });
    } else {
      //OK
      this.setState({ nicknameError: '' });
    }

  }

  nicknameBlurred(e) {
    this.setState({ nicknameTouched: true });
  }

  emailChanged(e) {
    const newValue = e.target.value;
    this.setState({ emailValue: newValue });
    this.setState({ emailTouched: true });

    if(newValue.length === 0) {
      this.setState({ emailError: "Shouldn't be empty" });
    } else if(newValue.lastIndexOf('@') === -1 ) {
      this.setState({ emailError: "This is not an email address. Email addresses contain an '@'" });
    } else if (newValue === this.state.emailLastTried) {
      this.setState({ emailError: `${this.state.emailLastTried} is already in use. Did you forgot your password?` });
    } else {
      //OK
      this.setState({ emailError: '' });
    }

  }

  emailBlurred(e) {
    this.setState({ emailTouched: true });
  }

  passwordChanged(e) {
    const newValue = e.target.value;
    this.setState({ passwordValue: newValue });
    this.setState({ passwordTouched: true });

    if(newValue.length === 0) {
      this.setState({ passwordError: "Shouldn't be empty" });
    } else if(newValue.length < 6 ) {
      this.setState({ passwordError: 'Password too short' });
    } else {
      //OK
      this.setState({ passwordError: '' });
      if( newValue !== this.state.repasswordValue) {
        this.setState({ repasswordError: "Passwords don't match" });
      } else {
        this.setState({ repasswordError: '' });
      }
    }
  }

  passwordBlurred(e) {
    this.setState({ passwordTouched: true });
  }

  repasswordChanged(e) {
    const newValue = e.target.value;
    this.setState({ repasswordValue: newValue });
    this.setState({ repasswordTouched: true });

    if(newValue.length === 0) {
      this.setState({ repasswordError: "Shouldn't be empty" });
    } else if(newValue !== this.state.passwordValue ) {
      this.setState({ repasswordError: "Passwords don't match" });
    } else {
      //OK
      this.setState({ repasswordError: '' });
    }
  }

  repasswordBlurred() {
    this.setState({ repasswordTouched: true });
  }

  submitable() {
    return (
      !this.state.nicknameError &&
      !this.state.emailError &&
      !this.state.passwordError &&
      !this.state.repasswordError
    )
  }

  submit(e) {
    e.preventDefault();
    if(this.submitable()) {
      console.log("submitted");
    }
  }

  renderNicknameInput() {
    return (
      <input
        type="text"
        className="form-control"
        id="reg-username"
        placeholder="Nickname"
        onChange={this.nicknameChanged.bind(this)}
        onBlur={this.nicknameBlurred.bind(this)}
        />
    );
  }

  renderEmailInput() {
    return (
      <input
        type="email"
        className="form-control"
        id="reg-email"
        placeholder="Email"
        onChange={this.emailChanged.bind(this)}
        onBlur={this.emailBlurred.bind(this)}
         />
    );
  }

  renderPasswordInput() {
    return (
      <input
        type="password"
        className="form-control"
        id="reg-password"
        placeholder="Password"
        onChange={this.passwordChanged.bind(this)}
        onBlur={this.passwordBlurred.bind(this)}
         />
    );
  }

  renderRepasswordInput() {
    return (
      <input
        type="password"
        className="form-control"
        id="reg-repassword"
        placeholder="Password again"
        onChange={this.repasswordChanged.bind(this)}
        onBlur={this.repasswordBlurred.bind(this)}
         />
    );
  }

  render() {
    return (
      <form className="form-horizontal" onSubmit={this.submit.bind(this)}>
        <div className={ this.state.nicknameError && this.state.nicknameTouched ? "has-error" : null }>
          <div className="form-group">
            <label htmlFor="reg-username" className="col-sm-2 control-label">Nickname</label>
            <div className="col-sm-10">
              <OverlayTrigger
                trigger="click" rootClose
                placement="top"
                overlay={
                  <Popover id="reg-username-popover"
                    title="Nickname">{"This is the name others will see when they interact with you. Must be at least 5 characters long."}
                  </Popover>
                }
              >
                <div>{ this.renderNicknameInput.call(this) }</div>
              </OverlayTrigger>
              { this.state.nicknameError && this.state.nicknameTouched ? <Alert bsStyle="danger" >{this.state.nicknameError}</Alert> : '' }
            </div>
          </div>
        </div>
        <div className={ this.state.emailError && this.state.emailTouched ? "has-error" : null }>
          <div className="form-group">
            <label htmlFor="reg-email" className="col-sm-2 control-label">Email</label>
            <div className="col-sm-10">
              <OverlayTrigger
                trigger="click" rootClose
                placement="top"
                overlay={
                  <Popover id="reg-email-popover"
                    title="Email">{"You have to provide a valid email address. We send a confirmation email here."}
                  </Popover>
                }
              >
                <div>{ this.renderEmailInput.call(this) }</div>
              </OverlayTrigger>
              { this.state.emailError && this.state.emailTouched ? <Alert bsStyle="danger" >{this.state.emailError}</Alert> : '' }
            </div>
          </div>
        </div>
        <div className={ this.state.passwordError && this.state.passwordTouched ? "has-error" : null }>
          <div className="form-group">
            <label htmlFor="reg-password" className="col-sm-2 control-label">Password</label>
            <div className="col-sm-10">
              <OverlayTrigger
                trigger="click" rootClose
                placement="top"
                overlay={
                  <Popover id="reg-password-popover"
                    title="Password">{"You have to remember this and keep it secret."}
                  </Popover>
                }
              >
                <div>{ this.renderPasswordInput.call(this) }</div>
              </OverlayTrigger>
              { this.state.passwordError && this.state.passwordTouched ? <Alert bsStyle="danger" >{this.state.passwordError}</Alert> : '' }
            </div>
          </div>
        </div>
        <div className={ this.state.repasswordError && this.state.repasswordTouched ? "has-error" : null }>
          <div className="form-group">
            <label htmlFor="reg-repassword" className="col-sm-2 control-label">Password again</label>
            <div className="col-sm-10">
              <OverlayTrigger
                trigger="click" rootClose
                placement="top"
                overlay={
                  <Popover id="reg-repassword-popover"
                    title="Password confirmation">{"Enter your password once more."}
                  </Popover>
                }
              >
                <div>{ this.renderRepasswordInput.call(this) }</div>
              </OverlayTrigger>
              { this.state.repasswordError && this.state.repasswordTouched ? <Alert bsStyle="danger" >{this.state.repasswordError}</Alert> : '' }
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="col-sm-offset-2 col-sm-10">
            <button disabled={this.submitable.call(this) ? false : true} type="submit" className="btn btn-default">Sign up</button>
          </div>
        </div>
      </form>
    );
  }
}

export default SignUpForm;
