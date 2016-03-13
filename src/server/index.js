import 'babel-core/polyfill';
import path from 'path';
import express from 'express';
import React from 'react';
import ReactDOM from 'react-dom/server';
import io from 'socket.io';

import App from './app';
import api from './api';
import socket from './socket';
import config from './config';
import { prettyLog } from './utils';

const server = express();

server.set('port', config.port);
server.use(express.static(path.join(__dirname, 'public')));
server.use('/api', api);
server.get('*', (req, res) => {
  const html = ReactDOM.renderToStaticMarkup(<App />);
  res.send(html);
});

//
// Launch the server
// -----------------------------------------------------------------------------

const httpserver = server.listen(server.get('port'), () => {
  /* eslint-disable no-console */
  prettyLog('The server is running at http://localhost:' + server.get('port'));
  if (process.send) {
    process.send('online');
  }
});

socket(io(httpserver));
