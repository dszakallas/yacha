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


@withStyles(styles)
class App extends Component {

  constructor() {
    super();

    this.state = {};

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


  render() {
    let history = createBrowserHistory();
    let app = this;
    const Layout = React.createClass({
      render: function(){
        return (
          <div>
            <Header user={ app.state.user ? app.state.user : null } history={this.props.history}/>
            {this.props.children}
            <Footer />
          </div>
        );
      }
    });
    return (
      <div className="container">
        <Router history={history}>
          <Route path="/" component={Layout} >
            <IndexRoute component={Home} />
            <Route path="home" component={Home} />
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
