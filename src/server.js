/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

import 'babel-core/polyfill';
import path from 'path';
import express from 'express';
import React from 'react';
import ReactDOM from 'react-dom/server';

import Html from './components/Html';

import router from './api/content';

const server = global.server = express();

server.set('port', (process.env.PORT || 5000));

//
// Attach prerendered static files
//
server.use(express.static(path.join(__dirname, 'public')));

//
// Register API middleware
// -----------------------------------------------------------------------------
server.use('/api', router);

server.get('*', (req,res,next) => {
  const html = ReactDOM.renderToStaticMarkup(<Html />);
  res.send(html);
});

//
// Launch the server
// -----------------------------------------------------------------------------

server.listen(server.get('port'), () => {
  /* eslint-disable no-console */
  console.log('The server is running at http://localhost:' + server.get('port'));
  if (process.send) {
    process.send('online');
  }
});
