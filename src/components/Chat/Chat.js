import React, { Component } from 'react';
import { Modal, Button, Dropdown } from 'react-bootstrap';
import update from 'react-addons-update';
import ApiClient from '../../core/ApiClient';
import withStyles from '../../decorators/withStyles';
import styles from './Chat.less';

import io from 'socket.io-client';

@withStyles(styles)
class Chat extends Component {

  constructor() {
    super();

    this.state = {

    };
  }

  async refreshRoom() {

  }

  async componentDidMount() {
    try {
      let users = [];
      const room = ApiClient.room(this.props.id);
      const messages = ApiClient.messages(id);
      for(let id of (await room).admins) {
        try {
          const user = await ApiClient.users(id);
          users.push(Object.assign({ admin:true }, user));
        } catch (err) {
          console.warn(`Failed to identify user ${id}`);
        }
      }
      this.setState({ room: await room, messages: await messages, users: users });
    } catch (err) {
      console.warn(`Error while fetching initial room data from server: ${err.status}`);
      console.warn(err);
    }

    this.socket = io.connect();

    socket.on('connect', () => {
      console.log("SocketClient connected to server");

      socket.emit('enterRoom', this.props.id);

    });

    // socket.on('updateChat', (message) => {
    //   if(message.User !== this.props.user.email) {
    //     let found = null;
    //     for(let cached of this.state.users) {
    //       if(cached.email === message.User)
    //         found = cached;
    //     }
    //     if(!found) {
    //       //try to resolve, maybe a new user.
    //
    //     }
    //     this.setState({
    //       update(
    //         this.state.users,
    //         { $push: [] })
    //       })
    //   }
    // }
  }

  // tryFetchUser(userId) {
  //   for(let admin of admins) {
  //     if(admin. === userId)
  //   }
  // }

  renderChatList() {

    this.state.timeline.map( (element) => {
      const user = this.tryFetchUser.call(this, element.User);
      return (
        <div className="chat-row">
          {
            element.status
              ?
                <p className="chat-status">
                  <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                  <em>{ user.nickname } { user.admin ? <span className="glyphicon glyphicon-star" aria-hidden="true"></span> : null }</em> joined the room
                </p>
              :
                <div>
                 <p className="chat-author">{ user.nickname } { user.admin ? <span className="glyphicon glyphicon-star" aria-hidden="true"></span> : null }</p>
                 <p className="chat-message">{ element.Message }</p>
                </div>
          }
        </div>
      );
    });

  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-xs-12">
            { this.renderChatList.call(this) }
          </div>
        </div>
        <hr></hr>
        <div className="row">
          <div className="col-xs-10">
            <textarea className="form-control" rows="3"></textarea>
          </div>
          <div className="col-xs-2">
            <div className="row">
              <div className="col-sm-10">
                <button className="btn btn-primary">Send</button>
                <button className="btn"><span className="glyphicon glyphicon-cog" aria-hidden="true" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export default Chat;
