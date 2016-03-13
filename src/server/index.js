import 'babel-core/polyfill';
import path from 'path';
import express from 'express';
import io from 'socket.io';

import config from './config';
import app from './app';
import api from './api';
import socket from './socket';
import { prettyLog } from './utils';

const server = express();

server.set('port', config.port);

server.use(express.static(path.join(__dirname, 'public')));
server.use('/api', api);
server.use('/', app);

//
// Launch the server
// -----------------------------------------------------------------------------

const httpserver = server.listen(server.get('port'), () => {
  prettyLog(`Yacha server running at :${server.get('port')}`);
  if (process.send) {
    process.send('online');
  }
});

socket(io(httpserver));
