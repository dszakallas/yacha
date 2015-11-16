import React, { PropTypes, Component } from 'react';
import { render } from 'react-dom';

import LoginForm from '../LoginForm'
import Marketing from '../Marketing'

class GatePage extends Component {


  render() {
    return(
      <div className="row">
        <div className="col-xs-12 col-md-4">
          <LoginForm />
        </div>
        <div className="col-xs-12 col-md-8">
        {this.props.children}
        </div>
      </div>
    );
  }
}

export default GatePage;
