import React, { PropTypes, Component } from 'react';
import { Router, Route, Link } from 'react-router'

import withStyles from '../../decorators/withStyles';
import styles from './Footer.less';

@withStyles(styles)
class Footer extends Component {

  render() {
    return(
      <footer>
        <p>&copy; Yacha 2015</p>
      </footer>
    );
  }
}

export default Footer;
