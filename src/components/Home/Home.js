import React, { Component } from 'react';

import { Modal, Button, Dropdown, Alert } from 'react-bootstrap';


import { Link } from 'react-router';

import ApiClient from '../../core/ApiClient';

import withStyles from '../../decorators/withStyles';
import styles from './Home.less';

@withStyles(styles)
class Home extends Component {

  constructor() {
    super();

    this.state = {
      rooms: [],
      friends: [],

      createRoomModalOpen: false,
      createRoomNameInput: '',
      joinRoomTokenInput: '',
      joinRoomTokenError: '',

      addFriendModalOpen: false,

      socketReconnect: false

    }
  }

  async loadStateFromServer() {
    let rooms, friends;
    try {
      rooms = await ApiClient.rooms();
      friends = await ApiClient.friends();
      this.setState({rooms: rooms, friends: friends});
    } catch (err) {

    }

  }

  componentDidMount() {
    console.log("Mounting home");
    this.loadStateFromServer.call(this);
  }

  createRoomModalOpen() {
    this.setState({ createRoomModalOpen: true });
  }

  createRoomModalClose() {
    this.setState({
      createRoomModalOpen: false,
      createRoomNameInput: '',
      joinRoomTokenInput: '',
      joinRoomTokenError: ''
    });
  }

  async joinRoom() {
    if(this.state.joinRoomTokenInput) {
      try {
        console.log("join room called");
        const room = await ApiClient.joinRoom(this.state.joinRoomTokenInput);
        let new_ = this.state.rooms.splice(0, this.state.rooms.length);
        new_.push(Object.assign(room, {admin: true}));
        this.setState({ rooms: new_ });
      } catch(err) {
        if(err.status == 400) {
          if(err.body.reasonCode == 11) {
            this.setState( { joinRoomTokenError: 'You are already a member'});
          } else if(err.body.reasonCode == 12) {
            this.setState( { joinRoomTokenError: 'Invalid token'} );
          } else {
            console.error(err);
          }
        } else if (err.status == 404) {
          this.setState( { joinRoomTokenError: 'This room was probably deleted'});
        } else {
          console.error(err);
        }
      }
    } else {
      this.setState( { joinRoomTokenError: 'Enter your token'});
    }
  }

  async createRoom() {
    try {
      console.log("Create room called");
      const room = await ApiClient.createRoom(this.state.createRoomNameInput);
      let new_ = this.state.rooms.splice(0, this.state.rooms.length);
      new_.push(Object.assign(room, {admin: true}));
      this.setState({ rooms: new_ });
    } catch(err) {
      console.warn(`Home: Server returned ${err}`);
    }
    this.createRoomModalClose.call(this);

  }

  renderSearch() {
    return (
      <div className="row">
       <div className="col-xs-12">
         <Dropdown id="search-dropdown">
            <div className="input-group" bsRole="toggle">
              <input
                type="text"
                className="form-control"
                aria-label="..."
                aria-haspopup="true"
                aria-expanded="false"
                placeholder="Find users..."></input>
              <div className="input-group-addon">
                <span className="glyphicon glyphicon-search"></span>
              </div>
            </div>
            <ul bsRole="menu" className="dropdown-menu search-dropdown">
              <li><a href="#">Action</a></li>
              <li><a href="#">Another action</a></li>
              <li><a href="#">Something else here</a></li>
              <li role="separator" className="divider"></li>
              <li><a href="#">Separated link</a></li>
            </ul>
          </Dropdown>
        </div>
      </div>
    );
  }

  render() {
    return this.props.children ? this.props.children : this.renderHome.call(this);
  }


  renderHome() {
    let rooms = this.state.rooms.map((room) => {
      return(
        <tr key={room.id} >
          { room.admin ? <td><span className="glyphicon glyphicon-star" aria-hidden="true"></span></td> : <td></td> }
          <td><Link to={`/home/chat/${encodeURIComponent(room.id)}`}>{room.name}</Link></td>
          <td><Link to={`/home/room/${encodeURIComponent(room.id)}`}><span className="glyphicon glyphicon-cog" aria-hidden="true"></span></Link></td>
        </tr>
      );
    });

    let friends = this.state.friends.map((friend) => {
      return(
        <tr>
          <td>friend.nickname</td>
        </tr>
      );
    });

    return (
    <div>
      {this.renderSearch.call(this)}
      <div className="row">
        <div className="col-xs-12 col-md-6">
          <div className="row">
            <div className="col-xs-6">
              <h1>Friends</h1>
            </div>
            <div className="col-xs-6 table-ops">
              <h1 className="btn btn-default"><span className="glyphicon glyphicon-plus" aria-hidden="true"></span></h1>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                  </thead>
                  <tbody>
                  { friends }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xs-12 col-md-6">
          <div className="row">
            <div className="col-xs-6">
              <h1>Rooms</h1>
            </div>
            <div className="col-xs-6 table-ops">
              <h1 className="btn btn-default" onClick={this.createRoomModalOpen.bind(this)}><span className="glyphicon glyphicon-plus" aria-hidden="true"></span></h1>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th className="col-sm-1"></th>
                    <th className="col-sm-10"></th>
                    <th className="col-sm-1"></th>
                  </tr>
                </thead>
                <tbody>
                { rooms }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Modal show={this.state.createRoomModalOpen} onHide={this.createRoomModalClose.bind(this)}>
        <Modal.Header closeButton>
          <Modal.Title>Add a room</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>You can create a new room by entering a name</h4>
          <label htmlFor="createRoomInputRoomName" className="sr-only">Room name</label>
          <input
            type="text"
            className="form-control"
            id="createRoomInputRoomName"
            placeholder="Room name"
            value={this.state.createRoomNameInput}
            onChange={(e) => this.setState({ createRoomNameInput: e.target.value})} />
          <Button className ="btn btn-primary" onClick={this.createRoom.bind(this)}>Create</Button>
          <hr></hr>
          <h4>{"... or enter your token here, if someone invited you someplace"}</h4>
          { this.state.joinRoomTokenError ? <Alert bsStyle="danger" >{this.state.joinRoomTokenError}</Alert> : '' }
          <label htmlFor="joinRoomInputRoomToken" className="sr-only">Token</label>
          <input
            type="text"
            className="form-control"
            id="joinRoomInputRoomToken"
            placeholder="Token"
            value={this.state.joinRoomTokenInput}
            onChange={(e) => this.setState({ joinRoomTokenInput: e.target.value})} />
          <Button className ="btn btn-success" onClick={this.joinRoom.bind(this)}>Join</Button>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.createRoomModalClose.bind(this)}>Close</Button>

        </Modal.Footer>
      </Modal>
    </div>
    );
  }
}

export default Home;
