/*jshint expr: true*/
'use strict';

var should = require('should')
  , ServerResponse = require('http').ServerResponse
  , WebSocket = require('ws')
  , WebSocketHandler = require('../lib/websocket');

describe('WebSocketHandler', function() {
  var handler, ws;

  beforeEach(function() {
    handler = new WebSocketHandler({}, { port: 8000 });
    ws = new WebSocket('ws://localhost:8000');
  });

  afterEach(function() {
    handler.close();
    handler = ws = undefined;
  });

  it('should handle new connection', function(done) {
    handler.clients.should.be.lengthOf(0);

    ws.on('open', function() {
      ws.send('{ "command": "hello" }');
    });
    ws.on('message', function(data, flags) {
      var msg = JSON.parse(data);
      msg.should.have.property('command', 'hello');
      msg.protocols.should.be.an.instanceOf(Array);
      msg.protocols.should.include('http://livereload.com/protocols/official-7');
      handler.clients.should.be.lengthOf(1);
      done();
    });
  });

  it('should notify to clients', function(done) {
    ws.on('open', function() {
      ws.send('{ "command": "hello" }');
    });
    ws.on('message', function(data, flags) {
      var msg = JSON.parse(data);
      if (msg.command === 'hello') {
        handler.send('/test.html', '{ "command": "reload", "path": "/test.html" }');
      } else if (msg.command === 'reload') {
        msg.path.should.equal('/test.html');
        done();
      }
    });
  });
});
