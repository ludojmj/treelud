var fs = require('fs');
var path = require('path');

var err_msg = require('./err_msg');

var walk = function (dir, done) {
  var dirList = [];
  var fileList = [];
  var results = { 'fileList': fileList, 'dirList': dirList };
  fs.readdir(dir, function (err, list) {
    if (err) {
      results.fileList.push(err);
      return done(null, results);
    }
    var pending = list.length;
    if (!pending) return done(null, results);

    list.forEach(function (file) {
      file = path.resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (err) {
          results.fileList.push(err);
        } else {
          if (stat && stat.isDirectory()) {
            results.dirList.push(file);
          } else {
            results.fileList.push(file);
          }
        }
        if (!--pending) done(null, results);
      });
    });
  });
};

module.exports = function (dir, callback) {
  walk(dir, function (err, list) {
    var results = { 'path': dir, 'isfolder': true, 'isopen': true, 'children': [] };

    list.dirList.sort();
    list.dirList.forEach(function (file) {
      results['children'].push({ 'path': file, 'isfolder': true, 'isopen': false });
    });
    list.fileList.sort();
    list.fileList.forEach(function (file) {
      var locked = false;
      if (file.errno) {
        file = err_msg(file);
        locked = true;
      }
      results['children'].push({ 'path': file, 'isfolder': false, 'isopen': false, 'islocked': locked });
    });
    callback(null, results);
  });
};
