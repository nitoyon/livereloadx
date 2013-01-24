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
      port: 8000,
      static: true
    }

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

  it('should not handle if static is not set', function(done) {
    config.static = false;
    http.get('http://localhost:8000/test.txt', function(res) {
      res.should.have.status(500);
      done();
    });
  });

  it('should handle /test.txt', function(done) {
    http.get('http://localhost:8000/test.txt', function(res) {
      res.should.have.status(200);
      res.on('data', function(chunk) {
        chunk.should.match(/test\.txt content/);
        chunk.should.not.match(/<script>/);
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
        chunk.toString().should.match(/:8000\/livereload.js/);
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
