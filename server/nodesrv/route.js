var os = require('os');
var opener = require('opener');
var fs = require('fs');
var Client = require('ssh2').Client;

var config = require('./config');
var pagin_local_fs = require('./pagin_local_fs');
var pagin_remote_fs = require('./pagin_remote_fs');
var full_local_fs = require('./full_local_fs');
var full_remote_fs = require('./full_remote_fs');

function info(response) {
  response.send({ 'localServer': config.THIS_HOST + ':' + config.THIS_PORT, 'remoteServer': config.SSH_SERVER + ':' + config.SSH_PORT });
};

function openfile(request, response) {
  opener(request.body.path, function (err) {
    if (err) {
      response.status(400).send({ 'error': '' + err });
    } else {
      response.status(200).send({ 'info': 'File opened successfully.' });
    }
  });
};

function del(request, response) {
  fs.unlink(request.body.path, function (err) {
    if (err) {
      response.status(400).send({ 'error': '' + err });
    } else {
      response.status(200).send({ 'info': 'File deleted successfully.' });
    }
  });

};

function put(response) {
  response.status(400).send({ 'error': 'Not implemented.' });
};

function get(response) {
  response.status(400).send({ 'error': 'Not implemented.' });
};
function notmanaged(response) {
  response.status(400).send({ 'error': 'Invalid client side action...' });
}


function browsedir(request, response) {
  // response.status(400).send({ 'error': 'Not implemented.' });
  var dir;
  var localfs = request.body.localfs;
  var pagination = request.body.pagination;
  try {
    dir = request.body.path.replace(/\\/g, '/');
  } catch (e) {
    dir = '/';
  }
  if (os.platform() === 'win32' && localfs && dir === '/') {
    dir = 'C:/';
  }
  if (pagination && localfs) {
    // Build a local JSON tree
    pagin_local_fs(dir, function (err, result) {
      if (err) {
        response.status(400).send({ 'error': 'Local :: ' + err });
      } else {
        response.send(result);
      }
    });
  }
  if (pagination && !localfs) {
    // Build a remote JSON tree
    var ssh_conn = new Client();
    pagin_remote_fs(dir, ssh_conn, function (err, result) {
      if (err) {
        response.status(400).send({ 'error': 'Remote :: ' + err });
      } else {
        response.send(result);
      }
    });
  }
  if (!pagination && localfs) {
    // Build a remote JSON tree based on full FS
    full_local_fs(dir, function (err, result) {
      response.send(result);
    });
  }
  
  if (!pagination && !localfs) {
    // Build a remote JSON tree based on full FS
    full_remote_fs(dir, function (err, result) {
      response.send(result);
    });
  }
};

function start(request, response) {
  var action = request.body.action;
  /*
  var path = ' ' + request.body.path;
  var serving = request.body.localfs ? ' local FS' : ' remote FS';
  var pagination = request.body.pagination ? ' with pagination on' : ' full';
  console.log(action === 'info' ? '' : action  + path + pagination + serving);
  */
  switch (action) {
    case 'info':
      info(response);
      break;
    case 'openfile':
      openfile(request, response);
      break;
    case 'del':
      del(request, response);
      break;
    case 'put':
      put(response);
      break;
    case 'get':
      get(response);
      break;
    case 'browsedir':
      browsedir(request, response);
      break;
    default:
      notmanaged(response);
      break;
  }
}

exports.start = start;
