import React, { PropTypes, Component } from 'react';
import { render } from 'react-dom';
import withStyles from '../../decorators/withStyles';
import styles from './GatePage.less'

import LoginForm from '../LoginForm'
import Marketing from '../Marketing'

@withStyles(styles)
class GatePage extends Component {


  render() {
    return(
      <div className="row">
        <div className="col-xs-12 col-md-4">
           <div className="gate-login">
            <LoginForm />
           </div>
        </div>
        <div className="col-xs-12 col-md-8">
          <div className="gate-content">
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

export default GatePage;
