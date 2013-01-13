"use strict";

var debug = require('debug')('livereloadx:websocket')
  , WebSocketServer = require('ws').Server;


// WebSocket server
function WebSocketHandler(config, options) {
  this.config = config;
  this.clients = [];

  this.wsServer = new WebSocketServer(options);
  this.wsServer.on('connection', this.onConnection.bind(this));
}

WebSocketHandler.prototype = {
  send: function(file, msg) {
    this.info("notify: %s", file);
    this.clients.forEach(function(socket) {
      socket.send(msg);
    });
  },

  info: function() {
    if (this.config.cli) {
      console.log.apply(console, arguments);
    } else {
      debug.apply(debug, arguments);
    }
  },

  close: function() {
    this.wsServer.close();
  },

  onConnection: function(socket) {
    debug("on connection");
    var remoteAddress = "(unknown)";
    var self = this;

    if (socket._socket) {
      remoteAddress = socket._socket.remoteAddress;
    }
    self.info("connection from %s", remoteAddress);

    this.clients.push(socket);

    socket.on('message', function(message) {
      self.onMessage(socket, message);
    });
    socket.on('close', function() {
      self.onClose(socket, remoteAddress);
    });
  },

  onMessage: function(socket, message) {
    debug("on message: %s", message);
    var msg = JSON.parse(message);
    if (msg.command == 'hello') {
      socket.send(JSON.stringify({
        command: 'hello',
        protocols: [
          'http://livereload.com/protocols/official-7'
        ],
        serverName: 'livereloadx'
      }));
    }
  },

  onClose: function(socket, remoteAddress) {
    debug("on close");
    this.info("client (%s) disconnected", remoteAddress);

    var i = this.clients.indexOf(socket);
    if (i >= 0) {
      this.clients.splice(i, 1);
    }
  }
};

module.exports = WebSocketHandler;
