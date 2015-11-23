import React, { PropTypes, Component } from 'react';
import { Router, Route, Link, IndexRoute } from 'react-router';
import withStyles from '../../decorators/withStyles';
import styles from './App.less';

import createBrowserHistory from 'history/lib/createBrowserHistory'

import GatePage from '../GatePage';
import Marketing from '../Marketing';
import SignUp from '../SignUp';
import { Forgot, Verify } from '../Activation';
import Home from '../Home';

import ApiClient from '../../core/ApiClient';

import Header from '../Header';
import Footer from '../Footer';

const Layout = React.createClass({
  render: function(){
    console.log(this.props.logout);
    return (

      <div>
        <Header {...this.props} />
        {this.props.children}
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
    };

  }

  static defaultProps = {
    history: createBrowserHistory()
  }

  componentDidMount() {
    console.log(this.state);

    ApiClient.user().then(
      (user) => {
        console.log(`${user.nickname} authenticated`);
        this.setState({ user: user});
      },
      (err) => {
        if(err.status === 401) {
          console.log("No user authenticated for this agent");
        } else {
          console.warn(`AppRouter: Server returned error ${err}`);
        }
      });
  }

  enterHome(nextState, replaceState) {
    if(!this.state.user) {
      replaceState({ nextPathname: nextState.location.pathname }, '/gate');
    }
  }

  login(email, password) {
    ApiClient.login(email, password).then(
      (user) => {
        console.log(`${user.nickname} logged in`);
        this.setState({ user: user});
        this.props.history.replaceState(null, "/home");
      },
      (err) => {
        if(err.status === 401) {
          console.log("No user authenticated for this agent");
        } else {
          console.warn(`AppRouter: Server returned error ${err}`);
        }
      });

  }

  logout() {
    ApiClient.logout().then(
      () => {
        console.log(`${this.state.user.nickname} logged out`);
        this.setState({ user: null });
        this.props.history.replaceState(null, "/gate");
      },
      (err) => {
        console.warn(`Couldnt log out user`);
    });
  }

  render() {
    function createElement(Component, props) {
      // make sure you pass all the props in!
      return <Component {...props} user={this.state.user} logout={this.logout.bind(this)} login={this.login.bind(this)} />
    }
    return (
      <div className="container">
        <Router history={this.props.history} createElement={createElement.bind(this)}>
          <Route path="/" component={Layout} >
            <IndexRoute component={Home} onEnter={this.enterHome.bind(this)}/>
            <Route path="home" component={Home} onEnter={this.enterHome.bind(this)}/>
            <Route path="gate" component={GatePage}>
              <IndexRoute component={Marketing} />
              <Route path="verify/:token/(:forgot)" component={Verify} />
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
