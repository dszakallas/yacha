import React, { Component } from 'react'
import ApiClient from '../../core/ApiClient'
import withStyles from '../../decorators/withStyles'
import styles from './Chat.less'
import { Link } from 'react-router'

@withStyles(styles)
class Chat extends Component {

  constructor () {
    super()
    this.state = {
      initialMessages: [],
      timeline: [],
      message: ''
    }
  }

  async getRoomData (id, Private) {
    console.log('getRoomData called')
    try {
      const messages = await ApiClient.messages(id, Private)
      this.setState({ initialMessages: messages.reverse() })
      if (!Private) {
        const room = await ApiClient.room(id)
        this.setState({ room: room })
      }
    } catch (err) {
      console.error(`Error while fetching initial room data from server: ${err.status}`)
      console.error(err)
    }
  }

  setupSockets (id, Private) {
    this.props.setUserJoined((m) => {
      this.setState({timeline: this.state.timeline.concat([m])})
    })
    this.props.setUserLeft((m) => {
      this.setState({timeline: this.state.timeline.concat([m])})
    })
    this.props.setChatUpdated((m) => {
      this.setState({timeline: this.state.timeline.concat([m])})
    })

    console.log('Handlers set. Joining room')

    this.props.socket.emit('join', {id: id, Private: Private})
  }

  async componentDidMount () {
    let Private
    let id

    if (this.props.params.roomid) {
      console.log('Mounting chat room')
      Private = false
      id = this.props.params.roomid

    } else if (this.props.params.userid) {
      console.log('Mounting pm room')
      Private = true
      id = this.props.params.userid
    } else {
      console.error('Invalid room')
    }

    this.setState({ Private: Private })

    this.getRoomData(id, Private)

    this.setupSockets(id, Private)

  }

  async componentWillUnmount () {
    console.log('Chat room unmounting...');

    this.props.setUserJoined()
    this.props.setUserLeft()
    this.props.setChatUpdated()

    console.log('Handlers torn down. Leaving room...')

    this.props.socket.emit('leave')
  }

  renderStatus (element) {
    if (element.Status === 'join') {
      return (
        <p className="chat-status">
          <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
          <em>{ element.User.nickname } </em> joined the room
        </p>
      )
    } else if (element.Status === 'leave') {
      return (
        <p className="chat-status">
          <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
          <em>{ element.User.nickname } </em> left the room
        </p>
      )
    }
  }

  renderChatList () {
    return (
      <div>
      {
        this.state.initialMessages.concat(this.state.timeline).map((element) => {
          return (
            <div key={element.ServerTimestamp} className="chat-row">
              {
                element.Status
                  ? this.renderStatus(element)
                  : <div>
                     <p className="chat-author">{ element.User.nickname } @ {element.ServerTimestamp}</p>
                     <p className="chat-message">{ element.Message } </p>
                    </div>
              }
            </div>
          )
        })
      }
      </div>
    )
  }

  sendMessage (e) {
    e.preventDefault()
    let message = this.state.message
    this.props.socket.emit('updateChat', { Message: message, ClientTimestamp: new Date() })
    this.setState({ message: '' })
  }

  render () {
    return (
      <div>
        <div className="row">
          <div className="col-xs-12">
            { this.renderChatList() }
          </div>
        </div>
        <hr></hr>
        <div className="row">
          <div className="col-xs-10">
            <textarea className="form-control" rows="3" value={this.state.message} onChange={(e) => this.setState({ message: e.target.value })}></textarea>
          </div>
          <div className="col-xs-2">
            <div className="row">
              <div className="col-sm-10">
                <button disabled={ !this.state.message } className="btn btn-primary" onClick={this.sendMessage.bind(this)}>Send</button>
                { this.state.Private
                  ? null
                  : <button className="btn"><Link to={`/home/room/${encodeURIComponent(this.props.params.roomid)}`}> <span className="glyphicon glyphicon-cog" aria-hidden="true" /></Link></button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Chat
