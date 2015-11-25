import React, { Component } from 'react';
import { Modal, Button, Dropdown } from 'react-bootstrap';
import ApiClient from '../../core/ApiClient';
import withStyles from '../../decorators/withStyles';
import styles from './Chat.less';

@withStyles(styles)
class Chat extends Component {

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-xs-12">
            <div className="row chatbox">
              <div className="chat-row">
                <p className="chat-author">ggergo91</p>
                <p className="chat-message">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.</p>
              </div>
              <div className="chat-row">
                <p className="chat-author">david</p>
                <p className="chat-message">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.</p>
              </div>
              <div className="chat-row">
                <p className="chat-status"><span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span><em>Someone</em> joined the room</p>
              </div>
              <div className="chat-row">
                <p className="chat-author">david</p>
                <p className="chat-message">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.</p>
              </div>
            </div>
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
