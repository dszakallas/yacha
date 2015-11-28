import React, { PropTypes, Component } from 'react';
import { Alert } from 'react-bootstrap';
import { Link } from 'react-router';
import ApiClient from '../../core/ApiClient';

class Verify extends Component {

  constructor() {
    super();

    this.state = {
      submitted: false,
      error: false
    };
  }

  async componentWillMount() {
    await this.verify.call(this);
  }

  async verify() {
    const forgot = this.props.params.forgot ? true : false;

    try {
      await this.props.verify(forgot, this.props.params.token);
    } catch (err) {
      console.warn(`Verify: server returned error: ${err}`);
      this.setState({ error: true });
    }

    this.setState({ submitted: true });

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
              <Alert bsStyle="info">
                <h4><span className="glyphicon glyphicon-ok" aria-hidden="true"></span>Verifying</h4>
                <p>Please wait... </p>
              </Alert>
          }
        </div>
      </div>
    );
  }
}

export default Verify;
