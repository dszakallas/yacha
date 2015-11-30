import React, { PropTypes, Component } from 'react';

import profile from './profile.png';
import { Link } from 'react-router';
import { ChatLink } from '../Links';
import { hash } from '../../utils/utils';
import ApiClient from '../../core/ApiClient';

class Profile extends Component {

  constructor() {
    super();
    this.state = {

    };
  }

  async componentDidMount() {

    let user;
    let me = true;

    if(!this.props.params.userid
      || this.props.params.userid == hash(this.props.getUser())
    ) {
      user = this.props.getUser();
    } else {
      me = false;
      try {
        user = await ApiClient.user(this.props.params.userid);
      } catch(err) {
        console.error(err);
      }
    }

    this.setState ({
      id: hash(user.email),
      email: user.email,
      nickname: user.nickname,

      me: me
    });

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
              <h2> { this.state.nickname } </h2>
            </div>
            <div className="row">
              <h3> Email </h3>
              <h2> { this.state.email } </h2>
            </div>
            { this.state.me
              ?
                null
              :
                <div className="row">
                  <div className="col-xs-6">
                    <ChatLink Private={true} id={this.state.id}> <button className="btn btn-lg btn-primary">Private message </button></ChatLink>
                  </div>
                </div>
            }
          </div>
        </div>
      </div>
    );
  }
}

export default Profile;
