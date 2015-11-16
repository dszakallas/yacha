import React, { PropTypes, Component } from 'react';
import { Router, Route, Link } from 'react-router'

import withStyles from '../../decorators/withStyles';
import styles from './Header.less';

@withStyles(styles)
class Header extends Component {

  render() {
    return (
      <div className="header">
        <ul className="nav nav-pills pull-right">
          <li><Link to={`/gate`}>Sign in</Link></li>
          <li><Link to={`/gate/signup`}>Sign up</Link></li>
          <li><a href="#">Contact</a></li>
        </ul>
        <h3 className="text-muted">Yacha</h3>
      </div>
    );
  }

}

export default Header;
