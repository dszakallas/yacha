/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

import 'babel-core/polyfill';
import path from 'path';
import express from 'express';
import React from 'react';
import ReactDOM from 'react-dom/server';
import io from 'socket.io';
import Html from './components/Html';

import api from './server/api';
import socket from './server/socket';

const server = global.server = express();

server.set('port', (process.env.PORT || 5000));

//
// Attach prerendered static files
//
server.use(express.static(path.join(__dirname, 'public')));

//
// Register API middleware
// -----------------------------------------------------------------------------
server.use('/api', api);

server.get('*', (req,res,next) => {
  const html = ReactDOM.renderToStaticMarkup(<Html />);
  res.send(html);
});

//
// Launch the server
// -----------------------------------------------------------------------------

let httpserver = server.listen(server.get('port'), () => {
  /* eslint-disable no-console */
  console.log('The server is running at http://localhost:' + server.get('port'));
  if (process.send) {
    process.send('online');
  }
});

socket(io.listen(httpserver));
