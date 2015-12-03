import React, { PropTypes, Component } from 'react';
import { Router, Route, Link, IndexRoute } from 'react-router';
import withStyles from '../../decorators/withStyles';
import styles from './App.less';

import createBrowserHistory from 'history/lib/createBrowserHistory'

import GatePage from '../GatePage';
import Marketing from '../Marketing';
import SignUp from '../SignUp';
import Verify from '../Verify';
import Forgot from '../Forgot';
import Home from '../Home';
import Chat from '../Chat';
import Room from '../Room';
import Profile from '../Profile';

import ApiClient from '../../core/ApiClient';

import Header from '../Header';
import Footer from '../Footer';


let socket = null;

const Layout = React.createClass({

  componentDidMount() {
    console.log("Header mounted");
  },

  getSocket() {
    return socket;
  },

  setSocket(_socket) {
    console.log("Setting socket");
    socket = _socket;
  },

  render: function(){
    return (
      <div>
        <Header {...this.props} />
        {this.props.children && React.cloneElement(
          this.props.children, { setSocket: this.setSocket, getSocket: this.getSocket }) }
        <Footer />
      </div>
    );
  }
});

@withStyles(styles)
class App extends Component {

  constructor() {
    super();

    this.state = {
      user: ApiClient.getUser()
    };

  }

  static defaultProps = {
    history: createBrowserHistory()
  }

  componentWillMount() {
    //ApiClient.onChange = this.updateAuth.bind(this);
    ApiClient.login();
  }

  componentWillUnmount() {
    //ApiClient.onChange = () => {};
  }

  componentDidMount() {
  }

  updateAuth(err, user) {
    this.setState({
      user: user
    });
  }

  authenticate(nextState, replaceState) {

    if(!ApiClient.loggedIn()) {
      replaceState({ nextPathname: nextState.location.pathname }, '/gate');
    }

  }

  enterChat(nextState, replaceState) {
    console.log("Entering chat");
  }

  getUser() {
    return ApiClient.getUser();
  }

  async login(email, password) {
    const user = await ApiClient.login.call(ApiClient, email, password);
    console.log(`${user.nickname} logged in`);
    return user;
  }

  async verify(forgot, token) {
    console.log(`Verify: sending token`);
    const resp = await ApiClient.verify.call(ApiClient, forgot, token);
  }

  async logout() {
    await ApiClient.logout.call(ApiClient);
  }

  render() {
    function createElement(Component, props) {
      // make sure you pass all the props in!
      return <Component {...props}
        getUser={this.getUser.bind(this)}
        logout={this.logout.bind(this)}
        login={this.login.bind(this)}
        verify={this.verify.bind(this)}
        />
    }
    return (

      <div className="container">
        <Router createElement={createElement.bind(this)}>
          <Route path="/" component={Layout} >
            <IndexRoute component={Home} onEnter={this.authenticate.bind(this)}/>
            <Route path="home" component={Home} onEnter={this.authenticate.bind(this)}>
              <Route path="chat/:roomid" component={Chat} />
              <Route path="pm/:userid" component={Chat} />
              <Route path="room/:roomid" component={Room} />
              <Route path="profile(/:userid)" component={Profile} />
            </Route>
            <Route path="gate" component={GatePage}>
              <IndexRoute component={Marketing} />
              <Route path="verify/:token(/:forgot)" component={Verify} />
              <Route path="signup" component={SignUp} />
              <Route path="forgot" component={Forgot} />
            </Route>
          </Route>
        </Router>
      </div>
    );
  };
}

export default App;
