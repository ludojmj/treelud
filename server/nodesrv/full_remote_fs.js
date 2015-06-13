var fs = require('fs');
var path = require('path');

var err_msg = require('./err_msg');
var config = require('./config')

var walk = function (dir, done) {
    var results = { 'path': dir, 'isfolder': true, 'isopen': true, 'children': [] };
    results['children'].push({ 'path': 'Remote Full FS not implemented', 'isfolder': false, 'isopen': false, 'islocked': true });
    return done(null, results);
};

module.exports = walk;