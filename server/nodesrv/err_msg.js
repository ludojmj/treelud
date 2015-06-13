var errno = require('errno');

module.exports = function start(err) {
  var result = '[Errno ';
  // if it's a libuv error then get the description from errno
  if (errno.errno[err.errno]) {
    result += err.errno + '] ' + errno.errno[err.errno].description;
  } else {
    result += err.message;
  }

  // if it's a fs error then it'll have a 'path' property
  if (err.path) {
    result += ': "' + err.path + '"';
  }

  return result;
};
