"use strict";

var log = require('./log')('websocket')
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
    log.info("notify: %s (%d client)", file, this.clients.length, 
      this.clients.length > 2 ? 's' : '');
    this.clients.forEach(function(socket) {
      socket.send(msg);
    });
  },

  close: function() {
    this.wsServer.close();
  },

  onConnection: function(socket) {
    log.debug("on connection");
    var remoteAddress = "(unknown)";
    var self = this;

    if (socket._socket) {
      remoteAddress = socket._socket.remoteAddress;
    }
    log.info("%s - new connection to websocket server", remoteAddress);

    this.clients.push(socket);

    socket.on('message', function(message) {
      self.onMessage(socket, message);
    });
    socket.on('close', function() {
      self.onClose(socket, remoteAddress);
    });
  },

  onMessage: function(socket, message) {
    log.debug("on message: %s", message);
    var msg = JSON.parse(message);
    if (msg.command === 'hello') {
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
    log.debug("on close");
    log.info("%s - websocket connection closed", remoteAddress);

    var i = this.clients.indexOf(socket);
    if (i >= 0) {
      this.clients.splice(i, 1);
    }
  }
};

module.exports = WebSocketHandler;
