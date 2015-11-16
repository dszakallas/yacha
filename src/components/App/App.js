import React, { PropTypes, Component } from 'react';
import { Router, Route, Link } from 'react-router';
import withStyles from '../../decorators/withStyles';
import styles from './App.less';

import Header from '../Header';
import Footer from '../Footer';

@withStyles(styles)
class App extends Component {

  render() {
    return (
      <div className="container">
        <Header />
        {this.props.children}
        <Footer />
      </div>
    );
  }

}

export default App;
