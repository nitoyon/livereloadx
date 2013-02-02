"use strict";

var log = require('./log')('html');

var inject = exports.inject = function(options) {
  var html = options.html
    , port = (options.port || 35729)
    , length = options.length;

  // get snippet
  var snippet = "<script>document.write('<script src=\"http://' + (location.host || 'localhost').split(':')[0] + ':"
    + port + "/livereload.js?snipver=2\"></' + 'script>')</script>";

  // set length
  if (options.length !== undefined) {
    options.length += snippet.length;
  }

  // inject snippet
  var pos = html.toLowerCase().lastIndexOf('</body>');
  if (pos >= 0) {
    log.debug('insert snippet at %d', pos);
    options.html = html.substring(0, pos) + snippet + html.substring(pos);
  } else {
    log.debug('append snippet');
    options.html += snippet;
  }

  return options;
};
