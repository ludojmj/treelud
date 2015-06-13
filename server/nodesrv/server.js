/* global __dirname */
var express = require('express');
var bodyParser = require('body-parser');
var serveIndex = require('serve-index');
var path = require('path');
var fs = require('fs');

var config = require('./config');
var route = require('./route');

function start() {
  var app = express();
  app.use(bodyParser.json());

  // POST methods only
  app.post('/api', route.start);

  // Locate parent folder to be served 
  var root = path.resolve(__dirname, '../..');
  app.use(express.static(root));
  app.use(serveIndex(root, { 'hidden': true, 'view': 'details' }));

  // Serving http...    
  app.listen(config.THIS_PORT, config.THIS_HOST);
  console.log('Serving HTTP on ' + config.THIS_HOST + ' port ' + config.THIS_PORT + '...');
}

start();
