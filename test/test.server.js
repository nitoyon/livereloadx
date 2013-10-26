/*jshint expr: true*/
'use strict';

var should = require('should')
  , http = require('http')
  , LiveReloadJsHandler = require('../lib/server').LiveReloadJsHandler;

describe('LiveReloadJsHandler', function() {
  var server;
  beforeEach(function() {
    server = http.createServer(function(req, res) {
      if (!new LiveReloadJsHandler().handle(req, res)) {
        res.writeHead(500);
        res.write('error');
        res.end();
      }
    }).listen(8000);
  });

  afterEach(function() {
    server.close();
  });

  it('should handle /livereload.js', function(done) {
    http.get('http://localhost:8000/livereload.js', function(res) {
      res.should.have.status(200);
      res.should.have.header('content-type', 'application/javascript');
      res.on('data', function(data) {});
      res.on('end', function(chunk) {
        done();
      });
    });
  });

  it('should skip /', function(done) {
    http.get('http://localhost:8000/', function(res) {
      res.should.have.status(500);
      done();
    });
  });
});
