import React, { Component } from 'react';
import { Modal, Button, Dropdown, Alert } from 'react-bootstrap';
import { Link } from 'react-router';
import ApiClient from '../../core/ApiClient';
import { hash } from '../../utils/utils';
import { UserLink } from '../Links';

class Room extends Component {

  constructor(){
    super();

    this.state = {
      room: {
        members: [],
        admins: [],
        name: ''
      },

      adminFormRoomNameInput: '',
      adminFormRoomError: '',
      adminInviteUserInput: '',
      adminInviteUserError: '',
      adminInviteUserSuccess: '',

      leaveRoomModalOpen: false,
      deleteRoomModalOpen: false,
      cannotLeave: false

    };
  }

  async componentDidMount() {
    let user = this.props.getUser();
    const room = await ApiClient.room(this.props.params.roomid);

    if(room.admins.map(admin => {return admin.email}).indexOf(user.email)!==-1) {
      this.setState({ admin: true });
    }
    this.setState({ room: room });

  }

  async submitInvite() {
    if(!this.state.adminInviteUserInput) {
      this.setState({ adminInviteUserError: 'Field empty' });
    } else if(this.state.adminInviteUserInput.indexOf("@") === -1) {
      this.setState({ adminInviteUserError: 'Enter an email address'});
    } else {
      try {
        await ApiClient.invite(this.state.room.id ,hash(this.state.adminInviteUserInput));
        this.setState({ adminInviteUserSuccess: `An email has been sent to ${this.state.adminInviteUserInput}` });
        this.setState({ adminInviteUserError: '' });
      } catch(err) {

        if(err.status == 400) {
          if(err.body.reasonCode == 0) {
            this.setState({ adminInviteUserError: `${this.state.adminInviteUserInput} is not a registered account`});
          } else if(err.body.reasonCode == 1) {
            this.setState({ adminInviteUserError: `${this.state.adminInviteUserInput} is already a member`});
          } else {
            console.error(error);
          }
        } else {
          console.error(error);
        }
      }
    }
    this.setState({ adminInviteUserinput: ''});
  }

  async deleteRoom() {
    try {
      await ApiClient.deleteRoom(this.state.room.id);
      this.props.history.replaceState(null, '/home');
    } catch(err) {
      console.error(err);
    }
  }

  async leaveRoom() {
    try {
      await ApiClient.leave(this.state.room.id);
      this.props.history.replaceState(null, '/home');
    } catch(err) {
      if(err.status == 400 && err.body.reason == 10) {
        this.setState({ cannotLeave: true });
      } else {
        console.error(err);
      }
    }
  }

  leaveRoomModalOpen() {
    this.setState({ leaveRoomModalOpen: true });
  }

  leaveRoomModalClose() {
    this.setState({ leaveRoomModalOpen: false, adminFormRoomNameInput: '' });
    this.setState({ cannotLeave: false });
  }

  deleteRoomModalOpen() {
    console.log("Called");
    this.setState({ deleteRoomModalOpen: true });
  }

  deleteRoomModalClose() {
    this.setState({ deleteRoomModalOpen: false });
  }

  rename() {
    if(!this.state.adminFormRoomNameInput) {
      this.setState({ adminFormRoomNameError: 'Name cannot be empty' });
    } else {
      //TODO
    }
  }

  renderMembers() {

    let adminEmails = this.state.room.admins.map((admin) => {
      return admin.email;
    });
    return (
      <tbody>
        {
          this.state.room.members.map((member) => {
            return(
              <tr key={member.email}>
                <td>{ adminEmails.indexOf(member.email) === -1 ? null : <span className="glyphicon glyphicon-star" aria-hidden="true"></span> }</td>
                <td><UserLink email={member.email}>{member.nickname}</UserLink></td>
                <td>{member.email}</td>
              </tr>
            );
          })
        }
      </tbody>
    );
  }

  renderLeaveRoomModal() {
    return (
      <Modal show={this.state.leaveRoomModalOpen} onHide={this.leaveRoomModalClose.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            { this.state.cannotLeave
              ? <Alert bsStyle="danger" >{ "You are the only admin in this room, so you can't leave. If you want to delete this room, you can do it from the Admin menu."}</Alert>
              : <p>Are you sure you want to leave <strong>{this.state.room.name}</strong>?</p>
            }
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.leaveRoomModalClose.bind(this)}>Close</Button>
            <Button disabled={this.state.cannotLeave ? true : false} className ="btn btn-danger" onClick={this.leaveRoom.bind(this)}>Leave</Button>
          </Modal.Footer>
        </Modal>
    );
  }

  renderDeleteRoomModal() {
    return (
      <Modal show={this.state.deleteRoomModalOpen} onHide={this.deleteRoomModalClose.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete <strong>{this.state.room.name}</strong>?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.deleteRoomModalClose.bind(this)}>Close</Button>
            <Button className ="btn btn-danger" onClick={this.deleteRoom.bind(this)}>Delete</Button>
          </Modal.Footer>
        </Modal>
    );
  }


  renderAdmin() {
    return(
      <div>
        <h3> Admin </h3>
        <div className="row">
          <div className="col-xs-12">
            <form>
              <div className="form-group">
                <label htmlFor="roomName">Rename room</label>
                <input
                  type="text"
                  className="form-control"
                  id="roomName"
                  placeholder="New name"
                  onChange={(e) => { this.setState({ adminFormRoomNameInput: e.target.value })}}
                  value={this.state.adminFormRoomNameInput}
                  ></input>
              </div>
              <button type="button" onClick={this.rename.bind(this)} className="btn btn-default">Rename</button>
            </form>
          </div>
        </div>
        <hr></hr>
        <div className="row">
          <div className="col-xs-12">
            <form>
              <div className="form-group">
                <label htmlFor="inviteUser">Invite user</label>
                <input
                  type="text"
                  className="form-control"
                  id="inviteUser"
                  placeholder="Email of the user"
                  onChange={(e) => { this.setState({ adminInviteUserInput: e.target.value })}}
                  value={this.state.adminInviteUserInput}
                  >
                  </input>
              </div>
              { this.state.adminInviteUserSuccess ? <Alert bsStyle="success">{this.state.adminInviteUserSuccess}</Alert> : null }
              { this.state.adminInviteUserError ? <Alert bsStyle="danger">{this.state.adminInviteUserError}</Alert> : null }
              <button type="button" id="exampleInputFile" onClick={this.submitInvite.bind(this)} className="btn btn-info">Invite User</button>
            </form>
          </div>
        </div>
        <hr></hr>
        <div className="row">
          <div className="col-xs-12">
            <input
              type="button"
              id="exampleInputFile"
              className="btn btn-danger"
              onClick={this.deleteRoomModalOpen.bind(this)}
              value="Delete Room" >
            </input>
          </div>
        </div>
      </div>
    );

  }

  render() {
    return (
      <div>
        { this.renderLeaveRoomModal.call(this) }
        { this.renderDeleteRoomModal.call(this) }
        <div className="row">
          <h2>Manage { this.state.room.name } </h2>
        </div>

        <div className="row" >
          <div className="col-xs-12 col-md-6">
            <div className="alert alert-warning">
              <div>
                <button type="button" onClick={this.leaveRoomModalOpen.bind(this)} className="btn btn-danger" data-toggle="modal" data-target="#leave-modal">Leave</button>
              </div>
              { this.state.admin ? this.renderAdmin.call(this) : null }
            </div>
          </div>
          <div className="col-xs-12 col-md-6 alert alert-info">
            <div className="row ">
              <div className="col-xs-6">
                <h3>Members</h3>
              </div>
            </div>
            <div className="row">
              <div className="col-xs-12">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th className="col-sm-1"></th>
                        <th className="col-sm-4" >Nickname</th>
                        <th className="col-sm-7" >Email</th>
                      </tr>
                    </thead>
                    { this.renderMembers.call(this) }
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Room;
