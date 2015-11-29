import React, { PropTypes, Component } from 'react';

import profile from './profile.png';

import { Link } from 'react-router';

import { hash } from '../../utils/utils';

class Profile extends Component {

  constructor() {
    super();
    this.state = {

    };
  }

  componentDidMount() {

    if(!this.props.params.userid) {
      let user = this.props.getUser();

      this.setState ({
        id: hash(user.email),
        email: user.email,
        nickname: user.nickname
      });
    } else {

    }
  }

  render() {
    return(
      <div>
        <div className="row">
          <h2> {this.state.nickname + "'s profile"} </h2>
        </div>

        <div className="row" >
          <div className="col-xs-12 col-md-4"><img className="img-responsive" src={profile} alt="placeholder"></img></div>
          <div className="col-xs-12 col-md-8">
            <div className="row">
              <h3> Nickname </h3>
              <h2> Davidka </h2>
            </div>
            <div className="row">
              <h3> Email </h3>
              <h2> davidka@mailinator.com </h2>
            </div>
            <div className="row">
              <div className="col-xs-6">
                <button className="btn btn-lg btn-primary"> Friend request </button>
                <button className="btn btn-lg btn-primary"> Private message </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Profile;
