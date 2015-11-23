import React, { PropTypes, Component } from 'react';
import { Router, Route, Link } from 'react-router'

import withStyles from '../../decorators/withStyles';
import styles from './Header.less';

import ApiClient from '../../core/ApiClient';

@withStyles(styles)
class Header extends Component {


  appNav() {
    return (
      <ul className="nav nav-pills pull-right">
        <li className="btn"><Link to={`/home/profile`}>{this.props.user.nickname}</Link></li>
        <li className="btn"><a onClick={this.props.logout}>Logout</a></li>
      </ul>
    );
  }

  gateNav() {
    return (
      <ul className="nav nav-pills pull-right">
        <li className="btn"><Link to={`/gate`}>Sign in</Link></li>
        <li className="btn"><Link to={`/gate/signup`}>Sign up</Link></li>
        <li className="btn"><a href="#">Contact</a></li>
      </ul>
    );
  }

  render() {
    console.log("logout: " + this.props.logout);
    return (
      <div className="header">
        { this.props.user ? this.appNav.call(this) : this.gateNav.call(this) }
        <h3 className="text-muted">Yacha</h3>
      </div>
    );
  }

}

export default Header;
