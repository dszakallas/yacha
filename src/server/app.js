/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

import React, { Component } from 'react';
import ReactDOM from 'react-dom/server';
import { Router } from 'express';

import { googleAnalyticsId } from './config';

class App extends Component {

  trackingCode() {
    return ({__html:
      `(function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=` +
      `function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;` +
      `e=o.createElement(i);r=o.getElementsByTagName(i)[0];` +
      `e.src='https://www.google-analytics.com/analytics.js';` +
      `r.parentNode.insertBefore(e,r)}(window,document,'script','ga'));` +
      `ga('create','${googleAnalyticsId}','auto');ga('send','pageview');`,
    });
  }

  render() {
    return (
      <html className="no-js" lang="">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>Yacha</title>
        <meta name="description" content="Yet Another CHat App" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" />
      </head>
      <body>
        <div id="app" />
        <script src="app.js" />
        <script dangerouslySetInnerHTML={this.trackingCode()} />
      </body>
      </html>
    );
  }
}

const app = new Router();

app.get('*', (req, res) => {
  const html = ReactDOM.renderToStaticMarkup(<App />);
  res.send(html);
});

export default app;
