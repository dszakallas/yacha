import React, { PropTypes, Component } from 'react';
import { render } from 'react-dom';

import withStyles from '../../decorators/withStyles';
import styles from './Marketing.less';

import cats from './c1.jpg';
import catdog from './c3.jpg'

import { Link } from 'react-router';

import { Carousel, CarouselItem } from 'react-bootstrap';

@withStyles(styles)
class Marketing extends Component {

  render() {
    return(
      <div className="marketing">
        <div className="col-xs-12 marketing-small">
          <div className="jumbotron">
            <div className="container">
              <h1>New to Yacha?</h1>
              <p><Link className="btn btn-primary btn-lg" to={'/gate/signup'} role="button">Sign up now &raquo;</Link></p>
            </div>
          </div>
        </div>

        <div className="col-md-8 marketing-big">
          <Carousel>
            <CarouselItem>
              <img width={900} height={500} src={cats} alt="A bunch of cats"/>
              <div className="carousel-caption">
                <h1>All your friends in one place</h1>
                <p><Link className="btn btn-lg btn-success" to={'/gate/signup'} role="button">Sign up today</Link></p>
              </div>
            </CarouselItem>
            <CarouselItem>
              <img width={900} height={500} src={catdog} alt="A cat and a dog"/>
              <div className="carousel-caption cat-dog">
                <h1>Theyve found each other on Yacha</h1>
                <p><a className="btn btn-lg btn-success" href="#" role="button">Sign up today</a></p>
              </div>
            </CarouselItem>
          </Carousel>
        </div>
      </div>
    );
  }
}

export default Marketing;
