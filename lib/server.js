"use strict";

var fs = require('fs')
  , http = require('http')
  , log = require('./log')('server')
  , ProxyHandler = require('./proxy')
  , send = require('send')
  , StaticHandler = require('./static')
  , url = require('url')
  , Watcher = require('./watcher')
  , WebSocketHandler = require('./websocket');


// Static file '/livereload.js' handler
function LiveReloadJsHandler() {
}

LiveReloadJsHandler.prototype = {
  handle: function(req, res) {
    var path = url.parse(req.url).pathname

    // path should be /livereload.js
    if (path !== "/livereload.js") {
      return false;
    }

    // send /livereload.js
    send(req, path)
      .root(__dirname + '/../contrib/')
      .pipe(res);
    return true;
  }
};

exports.LiveReloadJsHandler = LiveReloadJsHandler;


// Add logging for requests
// (ref) connect/lib/middleware/logger.js
function addLogger(req, res) {
  function remoteAddr(req) {
    if (req.ip) return req.ip;
    var sock = req.socket;
    if (sock.socket) return sock.socket.remoteAddress;
    return sock.remoteAddress;
  }

  var end = res.end;
  res.end = function(chunk, encoding){
    res.end = end;
    res.end(chunk, encoding);

    log.info('%s - "%s %s HTTP/%d.%d" %s %s',
      remoteAddr(req), req.method, req.originalUrl || req.url,
      req.httpVersionMajor, req.httpVersionMinor,
      res.statusCode,
      res._headers && res._headers['content-length'] || '-');
  };
}


function Server(config, watcher) {
  this.config = require('./config').setDefaultValue(config);

  this.watcher = watcher || new Watcher();
}

Server.prototype = {
  init: function() {
    var self = this;

    // setup handlers
    var handlers = [ new LiveReloadJsHandler() ];
    if (this.config.proxy) {
      handlers.push(new ProxyHandler(this.config));
    } else if (this.config.static) {
      handlers.push(new StaticHandler(this.config));
    }

    var server = http.createServer(function(request, response) {
      addLogger(request, response);

      for (var i = 0; i < handlers.length; i++) {
        if (handlers[i].handle(request, response)) {
          return;
        }
      }
      response.writeHead(404);
      response.write("File not found");
      response.end();
      log.debug("404 %s", request.url);
    }).listen(this.config.port);

    this.webSocket = new WebSocketHandler(this.config, { server: server });

    log.info("Waiting on port %d...", this.config.port);
  },

  notifyFileChange: function(file) {
    var msg = JSON.stringify({
      command: 'reload',
      path: file,
      liveCSS: this.config.liveCSS,
      liveImg: this.config.liveImg
    });

    this.webSocket.send(file, msg);
  },

  watch: function() {
    this.watcher.watch(this.config.dir);

    var self = this;
    this.watcher.on('change', function(file) {
      self.notifyFileChange(file);
    });
  }
};

exports.Server = Server;


exports.startServer = function(config) {
  log.debug("startServer", config);
  var server = new Server(config || {});
  server.init();
  return server;
}
