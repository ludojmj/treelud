var fs = require('fs');
var path = require('path');

var err_msg = require('./err_msg');
var config = require('./config')

var walk = function (dir, done) {

  var uniqueId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  var results = { 'id': uniqueId, 'path': dir, 'isfolder': true, 'isopen': true, 'children': [] };
  fs.readdir(dir, function (err, folderList) {
    if (err) {
      results['children'].push({ 'path': err_msg(err), 'isfolder': false, 'isopen': false, 'islocked': true });
      return done(null, results);
    }
    
    // Recursive method
    var idxFile = 0;
    (function next() {
      var file = folderList[idxFile++];

      if (!file) return done(null, results);
      file = path.resolve(dir, file);

      fs.stat(file, function (err, stat) {
        if (err) {
          results['children'].push({ 'path': err_msg(err), 'isfolder': false, 'isopen': false, 'islocked': true });
          return next();
        }
        // Getting numbers of files and subfolderd inside directory
        if (stat && stat.isDirectory()) {
          fs.readdir(file, function (err, subFolderList) {
            // Getting numbers of files and subfolderd inside directory
            if (subFolderList && subFolderList.length > config.FULL_FS_MAX_DEPTH) {
              var msgErr = [{ 'path': subFolderList.length + ' folders/files here', 'isfolder': false, 'isopen': false, 'islocked': true }];
              results['children'].push({ 'id': uniqueId, 'path': file, 'isfolder': true, 'isopen': true, children: msgErr });
              next();
            } else {
              walk(file, function (err, res) {
                results['children'] = results['children'].concat(res);
                next();
              });
            }
          });
        } else {
          results['children'].push({ 'path': file, 'isfolder': false, 'isopen': false, 'islocked': false });
          next();
        }
      });
    })();
  });
};

module.exports = walk;