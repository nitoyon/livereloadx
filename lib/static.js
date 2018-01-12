"use strict";

var EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , http = require('http')
  , inject = require('./html').inject
  , log = require('./log')('static')
  , pause = require('pause')
  , send = require('send')
  , url = require('url')
  , util = require('util');


// Static file handler
//   onError: error callback (when an error occur, this callback is called and
//            should call res.end())
function StaticHandler(config, onError) {
  this.config = config;
  this.onError = onError;
  this.root = require('path').resolve(this.config.dir);

  if (this.config.static) {
    log.info("Enabled static mode.");
  }
  if (this.config.spa) {
    log.info("Enabled SPA mode.");
  }
  log.debug('root dir: %s', this.root);

  EventEmitter.call(this);
}

// inherits from EventEmitter
util.inherits(StaticHandler, EventEmitter);

// Handle request
StaticHandler.prototype.handle = function(req, res) {
  if ('GET' !== req.method && 'HEAD' !== req.method) { return false; }

  var path = url.parse(req.url).pathname;
  var _pause = pause(req);
  var self = this;

  log.debug('path: %s', path);
  var sendStream = send(req, path, {root: this.root});

  if (path.match(/(\/|\.html?)$/)) {
    // hook SendStream.send()
    sendStream.send = function(path, stat) {
      // HTML -> call sendWithInjection()
      self.sendWithInjection(path, stat, this);
    };
  }

  // Set error callback
  sendStream.on('error', function(err) {
    if (self.onError) {
      self.onError(req, res, err);

      // replay end & data events
      // (ref) connect/lib/middlewares/static.js
      //       https://gist.github.com/mikedeboer/3047099
      _pause.resume();
      return;
    }

    // send index content in SPA mode
    if (self.config.spa && path.match(/\/[^.\/]+\/?$/)) {
      var baseUrl = 'http://localhost:' + self.config.port + '/';
      log.debug('spa: ' + path + ' to ' + baseUrl);

      http.get(baseUrl, function(rootRes) {
        res.writeHead(rootRes.statusCode);
        rootRes
          .on('data', function(data) { res.write(data); })
          .on('end', function() { res.end(); });
      });
      return;
    }

    // fallback to normal 404
    res.writeHead(404);
    res.write('Not Found');
    res.end();
  });

  sendStream
    .on('end', function() { log.debug('end'); self.emit('end'); })
    .pipe(res);
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
    stream.setHeader(path, stat);
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
