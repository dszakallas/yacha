import React, { Component } from 'react';
import { Modal, Button, Dropdown } from 'react-bootstrap';
import update from 'react-addons-update';
import ApiClient from '../../core/ApiClient';
import withStyles from '../../decorators/withStyles';
import styles from './Chat.less';



@withStyles(styles)
class Chat extends Component {

  constructor() {
    super();

    this.state = {
      initialMessages: [],
      timeline: [],
      message: ''
    };

  }

  setupSocket() {

    this.props.setUserJoined((m) => {
      this.setState({timeline: this.state.timeline.concat([m])});
    });
    this.props.setUserLeft((m) => {
      this.setState({timeline: this.state.timeline.concat([m])});
    });
    this.props.setChatUpdated((m) => {
      console.log("wat");
      this.setState({ timeline: this.state.timeline.concat([m])});
    });

    console.log("Handlers set. Joining room");

    this.props.socket.emit('join', this.props.params.roomid);
  }

  async getRoomData() {
    try {
      let users = [];

      const room = ApiClient.room(this.props.params.roomid);
      const messages = ApiClient.messages(this.props.params.roomid);
      this.setState({ room: await room, initialMessages: (await messages).reverse() });
    } catch (err) {
      console.error(`Error while fetching initial room data from server: ${err.status}`);
      console.error(err);
    }
  }

  async componentDidMount() {

    console.log('Chatroom mounting');

    this.setupSocket.call(this);

    this.getRoomData.call(this);

  }

  async componentWillUnmount() {
    console.log('Chat room unmounting...');

    this.props.setUserJoined();
    this.props.setUserLeft();
    this.props.setChatUpdated();

    console.log("Handlers torn down. Leaving room...");

    this.props.socket.emit('leave');

  }

  renderStatus(element) {
    if(element.Status === 'join')
      return (
        <p className="chat-status">
          <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
          <em>{ element.User.nickname } </em> joined the room
        </p>
      );
    else if(element.Status === 'leave')
      return (
        <p className="chat-status">
          <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
          <em>{ element.User.nickname } </em> left the room
        </p>
      );
  }

  /*
{ user.admin ? <span className="glyphicon glyphicon-star" aria-hidden="true"></span> : null }
  */



  renderChatList() {
    return (
      <div>
      {
        this.state.initialMessages.concat(this.state.timeline).map( (element) => {
          return(
            <div key={element.ServerTimestamp} className="chat-row">
              {
                element.Status
                  ?
                    this.renderStatus.call(this, element)
                  :
                    <div>
                     <p className="chat-author">{ element.User.nickname } @ {element.ServerTimestamp}</p>
                     <p className="chat-message">{ element.Message } </p>
                    </div>
              }
            </div>
          );
        })
      }
      </div>
    );
  }


  sendMessage(e) {
    e.preventDefault();
    let message = this.state.message;
    this.props.socket.emit('updateChat', { Message: message, ClientTimestamp: new Date()});
    this.setState({ message: '' });
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
            <textarea className="form-control" rows="3" value={this.state.message} onChange={(e) => this.setState({ message: e.target.value})}></textarea>
          </div>
          <div className="col-xs-2">
            <div className="row">
              <div className="col-sm-10">
                <button disabled={this.state.message ? false : true} className="btn btn-primary" onClick={this.sendMessage.bind(this)}>Send</button>
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
