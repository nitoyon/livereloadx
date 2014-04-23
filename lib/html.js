"use strict";

var log = require('./log')('html');

// Search '</body>' case insensitvely from given Buffer.
function bufLastSearchBody(buffer) {
  // BM method map
  var map = {};
  map['<'.charCodeAt(0)] = 0;
  map['/'.charCodeAt(0)] = 1;
  map['b'.charCodeAt(0)] = map['B'.charCodeAt(0)] = 2;
  map['o'.charCodeAt(0)] = map['O'.charCodeAt(0)] = 3;
  map['d'.charCodeAt(0)] = map['D'.charCodeAt(0)] = 4;
  map['y'.charCodeAt(0)] = map['Y'.charCodeAt(0)] = 5;
  map['>'.charCodeAt(0)] = 6;

  var skip = 0
    , bodyLen = '</body>'.length;

  for (var i = buffer.length - bodyLen; i >= 0; i -= skip) {
    for (var j = 0; j < bodyLen; j++) {
      if (map[buffer[i + j]] !== j) {
        break;
      }
    }
    if (j === bodyLen) {
      return i;
    }
    skip = map[buffer[i]] > 0 ? map[buffer[i]] : bodyLen;
  }
  return -1;
}

var inject = exports.inject = function(buffer, port) {
  // create snippet code
  var snippet = "<script>document.write('<script src=\"http://' + (location.host || 'localhost').split(':')[0] + ':" +
      port + "/livereload.js?snipver=2&port=" + port + "\"></' + 'script>')</script>";

  // find embed position
  var pos = bufLastSearchBody(buffer);

  var ret = new Buffer(buffer.length + snippet.length);
  if (pos >= 0) {
    log.debug('insert snippet at %d', pos);
    buffer.copy(ret, 0, 0, pos);
    ret.write(snippet, pos);
    buffer.copy(ret, pos + snippet.length, pos);
  } else {
    log.debug('append snippet');
    buffer.copy(ret);
    ret.write(snippet, buffer.length);
  }

  return ret;
};
