"use strict";

var http = require('http')
  , debug = require('debug')('livereloadx:server')
  , url = require('url')
  , fs = require('fs')
  , Watcher = require('./watcher')
  , WebSocketHandler = require('./websocket');


// Static file '/livereload.js' handler
function LiveReloadJsHandler() {
}

LiveReloadJsHandler.prototype = {
  handle: function(request, response) {
    if (url.parse(request.url).pathname === "/livereload.js") {
      debug("livereload requested");
      response.writeHead(200, { 'Content-Type': 'text/javascript' });
      response.write(fs.readFileSync(__dirname + '/../contrib/livereload.js'));
      response.end();
      return true;
    }
    return false;
  }
};

exports.LiveReloadJsHandler = LiveReloadJsHandler;


function Server(config, watcher) {
  this.config = require('./config').setDefaultValue(config);

  this.watcher = watcher || new Watcher();
}

Server.prototype = {
  init: function() {
    var self = this;

    var handlers = [
      new LiveReloadJsHandler()
    ];

    var server = http.createServer(function(request, response) {
      for (var i = 0; i < handlers.length; i++) {
        if (handlers[i].handle(request, response)) {
          return;
        }
      }
      response.writeHead(404);
      response.write("File not found");
      response.end();
      debug("404 %s", request.url);
    }).listen(this.config.port);

    this.webSocket = new WebSocketHandler(this.config, { server: server });
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
  debug("startServer", config);
  var server = new Server(config || {});
  server.init();
  return server;
}
