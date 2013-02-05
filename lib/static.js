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

  if (this.config.static) {
    log.info("Enabled static mode.");
  }
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

    // set header
    stream.setHeader(stat);
    stream.res.setHeader('Content-Type', 'text/html');

    // inject snippet
    var buffer = inject(data, self.config.port);

    // write to stream
    stream.res.setHeader('Content-Length', buffer.length);
    stream.res.write(buffer);
    stream.res.end();
  });
};

module.exports = StaticHandler;
