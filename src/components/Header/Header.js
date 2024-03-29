import React, { PropTypes, Component } from 'react';
import { Router, Route, Link } from 'react-router'

import withStyles from '../../decorators/withStyles';
import styles from './Header.less';

import ApiClient from '../../core/ApiClient';

@withStyles(styles)
class Header extends Component {

  async logout() {
    await this.props.logout();
    this.props.history.replaceState(null, "/gate");
  }


  appNav() {
    return (
      <ul className="nav nav-pills pull-right">
        <li className="btn"><Link to={`/home/profile`}>{this.props.getUser().nickname}</Link></li>
        <li className="btn"><a onClick={this.logout.bind(this)}>Logout</a></li>
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
    return (
      <div className="header">
        { this.props.getUser() ? this.appNav.call(this) : this.gateNav.call(this) }
        <h3 className="text-muted"><Link to={`/home`}>Yacha</Link></h3>
      </div>
    );
  }

}

export default Header;
