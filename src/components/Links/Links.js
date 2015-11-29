import React, { Component } from 'react';
import { Link } from 'react-router';
import { hash } from '../../utils/utils';

export class ChatLink extends Component {

  render() {
    let id = encodeURIComponent(this.props.id);
    return (
      <Link to={ this.props.Private ? `home/pm/${id}` : `/home/chat/${id}`}>{ this.props.children }</Link>
    );
  }
}

export class UserLink extends Component {

  render() {
    let userId = encodeURIComponent(hash(this.props.email));
    return (
      <Link to={`/home/profile/${userId}`}>{ this.props.children }</Link>
    );
  }
}
