import React, { Component } from 'react';
import { Modal, Button, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router';
import ApiClient from '../../core/ApiClient';

class Room extends Component {


  renderAdmin() {

  }

  render() {
    return (
      <div>
        <div className="row">
          <h2> Manage roomName </h2>
        </div>

        <div className="row" >
          <div className="col-xs-12 col-md-6">
            <div className="alert alert-warning">
              <div >
                <h3> User </h3>
                <button type="button" className="btn btn-danger" data-toggle="modal" data-target="#leave-modal">Leave</button>
              </div>
              <div>
                <h3> Admin </h3>
                <div className="row">
                  <div className="col-xs-12">
                    <form>
                      <div className="form-group">
                        <label htmlFor="roomName">Rename rom</label>
                        <input type="text" className="form-control" id="roomName" placeholder="New name"></input>
                      </div>
                      <button type="submit" className="btn btn-default">Rename</button>
                    </form>
                  </div>
                </div>
                <hr></hr>
                <div className="row">
                  <div className="col-xs-12">
                    <form>
                      <div className="form-group">
                        <label htmlFor="roomName">Invite user</label>
                        <input type="text" className="form-control" id="roomName" placeholder="Email of the user"></input>
                      </div>
                      <button type="button" id="exampleInputFile" className="btn btn-info">Invite User</button>
                    </form>
                  </div>
                </div>
                <hr></hr>
                <div className="row">
                  <div className="col-xs-12">
                    <button type="button" id="exampleInputFile" className="btn btn-danger">Delete Room</button>
                  </div>
                </div>
              </div>
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
                    <tbody>
                      <tr>
                        <td>a</td>
                        <td>sagittis</td>
                        <td>ipsum</td>
                      </tr>
                    </tbody>
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
