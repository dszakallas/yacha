'use strict';

var app = require('./lib/app');

var port = 8080;


if(process.argv.length > 2) {
  port = process.argv[2];
}

app.runAsync(port);

