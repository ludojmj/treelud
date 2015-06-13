var config = require('./config');

module.exports = function (dir, ssh_conn, callback) {
  var results = { 'path': dir, 'isfolder': true, 'isopen': true, 'children': [] };

  var dirList = [];
  var fileList = [];

  ssh_conn.on('connect', function () {
    // console.log('Connection :: connect');
  });
  ssh_conn.on('ready', function () {
    // console.log('Connection :: ready');
    ssh_conn.sftp(function (err, sftp) {
      if (err) {
        return callback(err);
      }

      sftp.readdir(dir, function (err, list) {
        if (err) {
          if (!list) list = [];
          list.push({ 'filename': 'err¤err' + err, 'longname': '-' });
        }

        list.forEach(function (fileObj) {
          var file = fileObj['filename'];
          if (file.indexOf('err¤err') < 0) file = dir + '/' + file;

          if (fileObj['longname'].substring(0, 1) === 'd') {
            dirList.push(file);
          } else {
            fileList.push(file);
          }
        });
        ssh_conn.end();

        dirList.sort();
        dirList.forEach(function (file) {
          results['children'].push({ 'path': file, 'isfolder': true, 'isopen': false });
        });
        fileList.sort();
        fileList.forEach(function (file) {
          var locked = false;
          if (file.indexOf('err¤err') > -1) {
            file = file.replace('err¤err', '');
            locked = true;
          }
          results['children'].push({ 'path': file, 'isfolder': false, 'isopen': false, 'islocked': locked });
        });

        callback(null, results);
      });
    });
  });
  ssh_conn.on('error', function (err) {
    // console.log('Connection :: error :: ' + err);
    callback(err);
  });
  ssh_conn.on('end', function () {
    // console.log('Connection :: end');
  });
  ssh_conn.on('close', function (had_error) {
    // console.log('Connection :: close');
  });
  ssh_conn.connect({
    host: config.SSH_SERVER,
    port: config.SSH_PORT,
    username: config.SSH_USER,
    password: config.SSH_PASSW
  });
};
