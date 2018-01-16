/*jshint expr: true*/
'use strict';

var should = require('should')
  , EventEmitter = require('events').EventEmitter
  , http = require('http')
  , StaticHandler = require('../lib/static');

describe('StaticHandler', function() {
  var server, config;
  var handled, handleResult;
  beforeEach(function() {
    config = {
      dir: __dirname + '/public',
      port: 8000
    };

    server = http.createServer(function(req, res) {
      if (!new StaticHandler(config).handle(req, res)) {
        res.writeHead(500);
        res.write("static is disabled");
        res.end();
      }
    }).listen(8000);
  });

  afterEach(function() {
    server.close();
  });

  it('should handle /test.txt', function(done) {
    http.get('http://localhost:8000/test.txt', function(res) {
      res.should.have.status(200);
      res.on('data', function(chunk) {
        chunk.toString().should.match(/test\.txt content/);
        chunk.toString().should.not.match(/<script>/);
        done();
      });
    });
  });

  it('should handle /has-body.html', function(done) {
    http.get('http://localhost:8000/has-body.html', function(res) {
      res.should.have.status(200);
      res.should.be.html;
      res.on('data', function(chunk) {
        chunk.toString().should.match(/<html>/);
        chunk.toString().should.match(/:8000\/livereload.js\?snipver=2&port=8000">/);
        chunk.toString().should.match(/script>'\)<\/script><\/body>/);
        done();
      });
    });
  });

  it('should handle /has-no-body.html', function(done) {
    http.get('http://localhost:8000/has-no-body.html', function(res) {
      res.should.have.status(200);
      res.should.be.html;
      res.on('data', function(chunk) {
        chunk.toString().should.match(/<\/p>\r?\n<script>/);
        chunk.toString().should.match(/script>'\)<\/script>$/);
        done();
      });
    });
  });

  it('should handle /utf8.html', function(done) {
    http.get('http://localhost:8000/utf8.html', function(res) {
      res.should.have.status(200);
      res.should.be.html;
      res.on('data', function(chunk) {
        chunk.toString().should.match(/:8000\/livereload.js/);
        done();
      });
    });
  });

  it('should handle /euc-jp.html', function(done) {
    http.get('http://localhost:8000/euc-jp.html', function(res) {
      res.should.have.status(200);
      res.should.be.html;
      res.on('data', function(chunk) {
        chunk.toString().should.match(/:8000\/livereload.js/);

        // find A3 C5 A3 D5 A3 C3 A1 DD A3 CA A3 D0
        for (var i = 0; i < chunk.length; i++) {
          if (chunk[i] === 0xA3) {
            break;
          }
        }
        i.should.not.eql(chunk.length);
        chunk[i +  1].should.be.eql(0xC5);
        chunk[i +  2].should.be.eql(0xA3);
        chunk[i +  3].should.be.eql(0xD5);
        chunk[i +  4].should.be.eql(0xA3);
        chunk[i +  5].should.be.eql(0xC3);
        chunk[i +  6].should.be.eql(0xA1);
        chunk[i +  7].should.be.eql(0xDD);
        chunk[i +  8].should.be.eql(0xA3);
        chunk[i +  9].should.be.eql(0xCA);
        chunk[i + 10].should.be.eql(0xA3);
        chunk[i + 11].should.be.eql(0xD0);
        done();
      });
    });
  });

  it('should handle /empty.htm', function(done) {
    http.get('http://localhost:8000/empty.htm', function(res) {
      res.should.have.status(200);
      res.should.be.html;
      res.on('data', function(chunk) {
        chunk.toString().should.match(/:8000\/livereload.js/);
        done();
      });
    });
  });
});

describe('StaticHandler#SPA', function() {
  var server, config;
  var handled, handleResult;
  beforeEach(function() {
    config = {
      dir: __dirname + '/public',
      spa: true,
      filter: [{type: 'include', pattern: '*/'}, {type: 'include', pattern: '*.{html,js}'}, {type: 'exclude', pattern: '*'}],
      port: 8000
    };

    server = http.createServer(function(req, res) {
      if (!new StaticHandler(config).handle(req, res)) {
        res.writeHead(500);
        res.write("static is disabled");
        res.end();
      }
    }).listen(8000);
  });

  afterEach(function() {
    server.close();
  });

  it('should handle /rewrite', function(done) {
    http.get('http://localhost:8000/rewrite', function(res) {
      res.should.have.status(200);
      res.should.be.html;
      res.on('data', function(chunk) {
        chunk.toString().should.match(/<html>/);
        chunk.toString().should.match(/<p>index<\/p>/);
        chunk.toString().should.match(/:8000\/livereload.js\?snipver=2&port=8000">/);
        chunk.toString().should.match(/script>'\)<\/script><\/body>/);
        done();
      });
    });
  });

  it('should handle /rewrite/me', function(done) {
    http.get('http://localhost:8000/rewrite/me', function(res) {
      res.should.have.status(200);
      res.should.be.html;
      res.on('data', function(chunk) {
        chunk.toString().should.match(/<html>/);
        chunk.toString().should.match(/<p>index<\/p>/);
        chunk.toString().should.match(/:8000\/livereload.js\?snipver=2&port=8000">/);
        chunk.toString().should.match(/script>'\)<\/script><\/body>/);
        done();
      });
    });
  });

  it('should not handle /rewrite.js', function(done) {
    http.get('http://localhost:8000/rewrite.js', function(res) {
      res.should.have.status(404);
      res.on('data', function(chunk) {
        done();
      });
    });
  });
});
