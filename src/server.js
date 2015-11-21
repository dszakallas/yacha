/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

import 'babel-core/polyfill';
import path from 'path';
import express from 'express';
import React from 'react';
import ReactDOM from 'react-dom/server';

import Html from './components/Html';

const server = global.server = express();

server.set('port', (process.env.PORT || 5000));

//
// Attach prerendered static files
//
server.use(express.static(path.join(__dirname, 'public')));

//
// Register API middleware
// -----------------------------------------------------------------------------
server.use('/api', require('./api/content'));

server.get('*', async (req,res,next) => {
  const html = ReactDOM.renderToStaticMarkup(<Html />);
  res.send('<!doctype html>\n' + html);
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
