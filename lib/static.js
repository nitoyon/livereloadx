"use strict";

var EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , inject = require('./html').inject
  , log = require('./log')('static')
  , send = require('send')
  , url = require('url')
  , util = require('util');


// Static file handler
function StaticHandler(config) {
  this.config = config;
  this.root = require('path').resolve(this.config.dir);
  log.debug('root dir: %s', this.root);
  EventEmitter.call(this);
}

// inherits from EventEmitter
util.inherits(StaticHandler, EventEmitter);

// Handle request
StaticHandler.prototype.handle = function(req, res) {
  if (!this.config.static) {
    return false;
  }

  var path = url.parse(req.url).pathname;
  var self = this;

  log.debug('path: %s', path);
  var sendStream = send(req, path)

  if (path.match(/(\/|\.html?)$/)) {
    // hook SendStream.send()
    var self = this;
    sendStream.send = function(path, stat) {
      // HTML -> call sendWithInjection()
      self.sendWithInjection(path, stat, this);
    };
  }

  sendStream
    .root(this.root)
    .on('end', function() { log.debug('end'); self.emit('end'); })
    .pipe(res)
  return true;
};


// Inserts LiveReload snippet and returns to client
StaticHandler.prototype.sendWithInjection = function(path, stat, stream) {
  // read file to end
  var self = this;
  fs.readFile(path, function(err, data) {
    if (err) {
      stream.error(500, err);
      return;
    }

    var snippet = "<script>document.write('<script src=\"http://' + (location.host || 'localhost').split(':')[0] + ':"
      + self.config.port + "/livereload.js?snipver=2\"></' + 'script>')</script>";

    // set header
    stream.setHeader(stat);
    stream.res.setHeader('Content-Type', 'text/html');

    // inject snippet
    var result = inject({
      html: data.toString(),
      length: stat.size,
      port: self.config.port
    });

    // write to stream
    stream.res.setHeader('Content-Length', result.length);
    stream.res.write(result.html);
    stream.res.end();
  });
};

module.exports = StaticHandler;
