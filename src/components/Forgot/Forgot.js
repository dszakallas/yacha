import React, { PropTypes, Component } from 'react';

import withStyles from '../../decorators/withStyles';

class Forgot extends Component {

  render() {
    return (
      <div className="col-xs-8">
        TODO
        { this.props.params.key ? "Key present" : "No key" }
      </div>
    );
  }

}

export default Forgot;
