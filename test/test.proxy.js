/*jshint expr: true*/
'use strict';

var should = require('should')
  , http = require('http')
  , ProxyHandler = require('../lib/proxy')
  , url = require('url')
  , zlib = require('zlib');

describe('ProxyHandler', function() {
  var server, remoteServer, config, remoteConfig;
  var handled, handleResult;
  beforeEach(function() {
    config = {
      dir: __dirname + '/public',
      port: 8000,
      proxy: 'http://localhost:8001'
    };

    server = http.createServer(function(req, res) {
      if (!new ProxyHandler(config).handle(req, res)) {
        res.writeHead(500);
        res.write("static is disabled");
        res.end();
      }
    }).listen(8000);

    remoteConfig = {};
    remoteServer = http.createServer(function(req, res) {
      var path = url.parse(req.url).pathname;
      if (remoteConfig[path]) {
        var c = remoteConfig[path];
        res.writeHead(c.statusCode, c.headers);
        res.write(c.content);
        res.end();
      } else {
        res.writeHead(404);
        res.write("File not found");
        res.end();
      }
    }).listen(8001);
  });

  afterEach(function() {
    server.close();
    remoteServer.close();
  });

  it('should not handle if proxy is not set', function(done) {
    config.proxy = '';
    http.get('http://localhost:8000/test.txt', function(res) {
      res.should.have.status(500);
      done();
    });
  });

  it('should handle not found', function(done) {
    http.get('http://localhost:8000/not_found.txt', function(res) {
      res.should.have.status(404);
      done();
    });
  });

  it('should handle text file', function(done) {
    remoteConfig = {
      '/test.txt': {
        statusCode: 200,
        headers: { 'content-type': 'text/plain' },
        content: 'This is plain text'
      }
    };
    http.get('http://localhost:8000/test.txt', function(res) {
      res.should.have.status(200);
      res.should.have.header('content-type', 'text/plain');
      res.on('data', function(chunk) {
        chunk.toString().should.eql('This is plain text');
        done();
      });
    });
  });

  it('should handle html (without <body>)', function(done) {
    remoteConfig = {
      '/test.html': {
        statusCode: 200,
        headers: {
          'content-type': 'text/html',
          'content-length': '11'},
        content: '<p>test</p>'
      }
    };
    http.get('http://localhost:8000/test.html', function(res) {
      res.should.have.status(200);
      res.should.have.header('content-type', 'text/html');
      res.headers['content-length'].should.be.above(11);
      res.on('data', function(chunk) {
        chunk.toString().should.match(/<\/p><script>/);
        done();
      });
    });
  });

  it('should handle html (with <body>)', function(done) {
    remoteConfig = {
      '/test.html': {
        statusCode: 200,
        headers: {
          'content-type': 'text/html',
          'content-length': '24'},
        content: '<body><p>test</p></body>'
      }
    };
    http.get('http://localhost:8000/test.html', function(res) {
      res.should.have.status(200);
      res.should.have.header('content-type', 'text/html');
      res.headers['content-length'].should.be.above(24);
      res.on('data', function(chunk) {
        chunk.toString().should.match(/<\/p><script>/);
        done();
      });
    });
  });

  it('should handle html (gzip)', function(done) {
    zlib.gzip('<p>test</p>', function(error, buffer) {
      remoteConfig = {
        '/test.html': {
          statusCode: 200,
          headers: {
            'content-type': 'text/html',
            'content-encoding': 'gzip',
            'content-length': buffer.length},
          content: buffer
        }
      };
      http.get('http://localhost:8000/test.html', function(res) {
        res.should.have.status(200);
        res.should.have.header('content-type', 'text/html');
        res.headers.should.not.have.property('content-encoding');
        res.on('data', function(chunk) {
          chunk.toString().should.match(/<\/p><script>/);
          done();
        });
      });
    });
  });

  it('should handle redirect', function(done) {
    remoteConfig = {
      '/redirect.html': {
        statusCode: 302,
        headers: {
          'location': 'http://localhost:8001/test.html'},
        content: ''
      }
    };
    http.get('http://localhost:8000/redirect.html', function(res) {
      res.should.have.status(302);
      res.should.have.header('location', 'http://localhost:8000/test.html');
      done();
    });
  });

  describe('with --prefer-local flag on', function() {
    it('should handle text file (local file is found)', function(done) {
      config['preferLocal'] = true;
      http.get('http://localhost:8000/test.txt', function(res) {
        res.should.have.status(200);
        res.should.have.header('content-type', 'text/plain; charset=UTF-8');
        res.on('data', function(chunk) {
          chunk.toString().should.match(/This is test\.txt/);
          done();
        });
      });
    });

    it('should pass through POST req even if local file found', function(done) {
      config['preferLocal'] = true;
      remoteConfig = {
        '/test.txt': {
          statusCode: 200,
          headers: { 'content-type': 'text/plain' },
          content: 'remote file'
        }
      };

      var options = {
        hostname: 'localhost',
        port: 8000,
        path: '/test.txt',
        method: 'POST'
      };
      var req = http.request(options, function(res) {
        res.should.have.status(200);
        res.should.have.header('content-type', 'text/plain');
        res.on('data', function(chunk) {
          chunk.toString().should.match(/remote file/);
          done();
        });
      });

      req.write('\n');
      req.end();
    });

    it('should handle text file (local file is not found)', function(done) {
      remoteConfig = {
        '/test-on-remote.txt': {
          statusCode: 200,
          headers: { 'content-type': 'text/plain' },
          content: 'This is plain text'
        }
      };
      config['preferLocal'] = true;
      http.get('http://localhost:8000/test-on-remote.txt', function(res) {
        res.should.have.status(200);
        res.should.have.header('content-type', 'text/plain');
        res.on('data', function(chunk) {
          chunk.toString().should.eql('This is plain text');
          done();
        });
      });
    });
  });
});
