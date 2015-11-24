import React, { Component } from 'react';

import { Modal, Button, Dropdown } from 'react-bootstrap';


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

      addFriendModalOpen: false

    }
  }

  async loadStateFromServer() {
    let rooms, friends;
    try {
      rooms = await ApiClient.rooms();
      friends = await ApiClient.friends();
      this.setState({rooms: rooms, friends: friends});
    } catch (err) {
      console.warn(`Home error ${err}`);
    }

  }

  componentDidMount() {
    this.loadStateFromServer.call(this);
    setInterval(this.loadStateFromServer.bind(this), 30000);
  }

  createRoomModalOpen() {
    this.setState({ createRoomModalOpen: true });
  }

  createRoomModalClose() {
    this.setState({ createRoomModalOpen: false, createRoomNameInput: '' });
  }

  async createRoom() {
    let room;
    try {
      room = await ApiClient.createRoom(this.state.createRoomNameInput);
      let new_ = this.state.rooms;
      new_.push(room);
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
    let rooms = this.state.rooms.map((room) => {
      return(
        <tr key={room.id} >
          <td><Link to={`/home/chat/${room.id}`}>{room.name}</Link></td>
          { room.admin ? <td><span className="glyphicon glyphicon-star" aria-hidden="true"></span></td> : null }
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
              <h1>Online friends</h1>
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
                    <th className="col-sm-10"></th>
                    <th className="col-sm-1"></th>
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
          <Modal.Title>Create a new room</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>Enter a name for the room</h4>
          <label htmlFor="createRoomInputRoomName" className="sr-only">Room name</label>
          <input
            type="text"
            className="form-control"
            id="createRoomInputRoomName"
            placeholder="Room name"
            value={this.state.createRoomNameInputRoomName}
            onChange={(e) => this.setState({ createRoomNameInputRoomName: e.target.value})} />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.createRoomModalClose.bind(this)}>Close</Button>
          <Button className ="btn btn-primary" onClick={this.createRoom.bind(this)}>Create</Button>
        </Modal.Footer>
      </Modal>
      <Modal show={this.state.createRoomModalOpen} onHide={this.createRoomModalClose.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Create a new room</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Enter a name for the room</h4>
            <label htmlFor="createRoomInputRoomName" className="sr-only">Room name</label>
            <input
              type="text"
              className="form-control"
              id="createRoomInputRoomName"
              placeholder="Room name"
              value={this.state.createRoomNameInputRoomName}
              onChange={(e) => this.setState({ createRoomNameInputRoomName: e.target.value})} />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.createRoomModalClose.bind(this)}>Close</Button>
            <Button className ="btn btn-primary" onClick={this.createRoom.bind(this)}>Create</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default Home;
