import React, { Component } from 'react';

import { Modal, Button, Dropdown, Alert } from 'react-bootstrap';

import { Link } from 'react-router';

import { hash } from '../../utils/utils';

import { ChatLink, UserLink } from '../Links';

import ApiClient from '../../core/ApiClient';

import io from 'socket.io-client';

import withStyles from '../../decorators/withStyles';
import styles from './Home.less';

@withStyles(styles)
class Home extends Component {

  constructor() {
    super();

    this.state = {
      rooms: [],
      friends: [],
      invites: [],
      requests: [],

      createRoomModalOpen: false,
      createRoomNameInput: '',
      joinRoomTokenInput: '',
      joinRoomTokenError: '',

      addFriendModalOpen: false,
      addFriendModalEmailInput: '',
      addFriendModalEmailError: ''

    }

    this.socket = null;
    this.userJoinedHandler = null;
    this.userLeftHandler = null;
    this.chatUpdatedHandler = null;
  }

  setUserJoined(handler) {

    this.userJoinedHandler = handler ? handler : null;
  }

  setUserLeft(handler) {
    this.userLeftHandler = handler ? handler : null;
  }

  setChatUpdated(handler) {
    this.chatUpdatedHandler = handler ? handler : null;
  }

  setupSocket(socket) {

    socket.on('disconnect', () => {
      console.log("SocketClient disconnected from server ");

    });

    socket.on('connect', () => {
      console.log("SocketClient connected to server");

    });

    socket.on('userJoined', (status) => {
      console.log(status);
      let parsed = JSON.parse(status);
      console.log(`${parsed.User.nickname} joined`);

      if(!this.userJoinedHandler) {
        console.log("No one is listening")
      } else {
        this.userJoinedHandler(parsed);
      }


    });

    socket.on('userLeft', (status) => {
      let parsed = JSON.parse(status);
      console.log(`${parsed.User.nickname} left`);

      if(!this.userLeftHandler) {
        console.log("No one is listening")
      } else {
        this.userLeftHandler(parsed);
      }
    });

    socket.on('chatUpdated', (message) => {
      console.log("Message arrived");
      let parsed = JSON.parse(message);

      if(!this.chatUpdatedHandler) {
        console.log("No one is listening")
      } else {
        this.chatUpdatedHandler(parsed);
      }
    });
  }

  async loadStateFromServer() {
    try {
      let rooms = ApiClient.rooms();
      let friends = ApiClient.friends();
      let invites = ApiClient.invites();
      let requests = ApiClient.requests();

      this.setState({
        rooms: await rooms,
        friends: await friends,
        invites: await invites,
        requests: await requests
      });
    } catch (err) {
      console.error(err);
    }
  }

  componentDidMount() {
    console.log("Mounting home");

    this.loadStateFromServer.call(this);

    let socket = this.socket = io.connect();
    this.setupSocket.call(this, socket);

  }

  componentWillUnmount() {
    console.log("Unmounting home");
    if(this.socket) {
      this.socket.io.disconnect();
    }
  }

  addFriendModalOpen() {
    this.setState({ addFriendModalOpen: true });
  }

  addFriendModalClose() {
    this.setState({
      addFriendModalOpen: false,
      addFriendModalEmailInput: '',
      addFriendModalEmailError: ''
     });
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

  async inviteFriend() {
    console.log("DASDAS");
    if(this.state.addFriendModalEmailInput
      && this.state.addFriendModalEmailInput.indexOf('@') !== -1){
        console.log("Check Ok");
        try {
          await ApiClient.invite(hash(this.state.addFriendModalEmailInput));
          const user = await ApiClient.user(hash(this.state.addFriendModalEmailInput));
          let tmp = this.state.invites.slice(0);
          tmp.push(user);
          this.setState({ invites: tmp });
          this.addFriendModalClose.call(this);
        } catch(err) {
          console.log("Err");
          if(err.status == 404) {
            this.setState({ addFriendModalEmailError: `${this.state.addFriendModalEmailInput} doesn't exist` });
          } else if(err.status == 400) {
            if(err.body.reasonCode == 20)
              this.setState({ addFriendModalEmailError: `${this.state.addFriendModalEmailInput} is already your friend` });
            else if(err.body.reasonCode == 21)
              this.setState({ addFriendModalEmailError: `An invitation for ${this.state.addFriendModalEmailInput} is already pending` });
            else if(err.body.reasonCode == 22)
              this.setState({ addFriendModalEmailError: `${this.state.addFriendModalEmailInput} sent you a request already. Accept that to become friends!` });
            else if(err.body.reasonCode == 23)
              this.setState({ addFriendModalEmailError: `You can't invite yourself!` });
            else {
              console.error(err);
            }
          } else {
            console.log(err);
          }
        }
    } else {
      this.setState({ addFriendModalEmailError: 'Enter a valid email address' });
    }

  }

  async joinRoom() {
    if(this.state.joinRoomTokenInput) {
      try {
        console.log("join room called");
        const room = await ApiClient.joinRoom(this.state.joinRoomTokenInput);
        let new_ = this.state.rooms.slice(0);
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
      let new_ = this.state.rooms.slice(0);
      new_.push(Object.assign(room, {admin: true}));
      this.setState({ rooms: new_ });
    } catch(err) {
      console.warn(`Home: Server returned ${err}`);
    }
    this.createRoomModalClose.call(this);

  }

  async accept(userid) {
    try {
      await ApiClient.accept(userid);
      let newFriends = this.state.requests.filter((user) => {
        return hash(user.email) === userid});
      let newRequests = this.state.requests.filter((user) => {
        return hash(user.email) !== userid});
      let tmp = this.state.friends.concat(newFriends);

      this.setState({ friends: newFriends, requests: newRequests });
    } catch(err) {
      console.error(err);
    }
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
    return this.props.children
      ? React.cloneElement(
        this.props.children,
        {
          setUserJoined: this.setUserJoined.bind(this),
          setUserLeft: this.setUserLeft.bind(this),
          setChatUpdated: this.setChatUpdated.bind(this),
          socket: this.socket
        })
      : this.renderHome.call(this);
  }


  renderHome() {
    let rooms = this.state.rooms.map((room) => {
      return(
        <tr key={room.id} >
          { room.admin ? <td><span className="glyphicon glyphicon-star" aria-hidden="true"></span></td> : <td></td> }
          <td><ChatLink id={room.id}>{room.name}</ChatLink></td>
          <td><Link to={`/home/room/${encodeURIComponent(room.id)}`}><span className="glyphicon glyphicon-cog" aria-hidden="true"></span></Link></td>
        </tr>
      );
    });

    let friends = this.state.friends.map((friend) => {
      return(
        <tr key={friend.email}>
          <td><ChatLink Private={true} id={hash(friend.email)}>{friend.nickname}</ChatLink></td>
          <td></td>
        </tr>
      );
    });

    let requests = this.state.requests.map((request) => {
      console.log(request);
      return(
        <tr className="warning" key={request.email}>
          <td><UserLink email={request.email}>{request.nickname}</UserLink></td>
          <td>
            <button
              onClick={(e) => { this.accept(hash(request.email))} }
              className="btn btn-xs btn-success">
              <span className="glyphicon glyphicon-ok" aria-hidden="true"></span>
            </button>
          </td>
        </tr>
      );
    });

    let invites = this.state.invites.map((invite) => {
      console.log(invite);
      return(
        <tr className="info" key={invite.email}>
          <td><UserLink email={invite.email}>{invite.nickname}</UserLink></td>
          <td><span className="badge">sent</span></td>
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
              <h1 className="btn btn-default" onClick={this.addFriendModalOpen.bind(this)}><span className="glyphicon glyphicon-plus" aria-hidden="true"></span></h1>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              <div className="table-responsive">
                <table className="table table">
                  <thead>
                  <tr>
                    <th className="col-sm-10">Nickname</th>
                    <th className="col-sm-2"></th>
                  </tr>
                  </thead>
                  <tbody>
                  { friends }
                  { invites }
                  { requests }
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
      <Modal show={this.state.addFriendModalOpen} onHide={this.addFriendModalClose.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Invite a friend</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>{"Enter the user's email address"}</h4>
            <label htmlFor="addFriendModalEmailInput" className="sr-only">Email of the user</label>
            <input
              type="email"
              className="form-control"
              id="addFriendModalEmailInput"
              placeholder="Email or nickname"
              noValidate={true}
              value={this.state.addFriendModalEmailInput}
              onChange={(e) => this.setState({ addFriendModalEmailInput: e.target.value})} />
            { this.state.addFriendModalEmailError ? <Alert bsStyle="danger" >{this.state.addFriendModalEmailError}</Alert> : '' }
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.addFriendModalClose.bind(this)}>Close</Button>
            <Button className ="btn btn-primary" onClick={this.inviteFriend.bind(this)}>Invite</Button>
          </Modal.Footer>
        </Modal>
    </div>
    );
  }
}

export default Home;
