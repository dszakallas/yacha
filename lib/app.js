'use strict';

var http = require('http');
var express = require('express');

var runAsync = function(port, callback) {

  var app = express();
  var server = http.Server(app);

  app.get('/', function(req, resp) {
    resp.send('It works!');
  });

  server.listen(port, function(){
    console.log('listening on *:' + port);
    
    if(typeof(callback) !== 'undefined')
      callback(server);
  });

};

module.exports = { runAsync: runAsync };