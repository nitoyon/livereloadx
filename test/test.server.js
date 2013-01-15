var should = require('should')
  , ServerResponse = require('http').ServerResponse
  , server = require('../lib/server');

describe('LiveReloadJsHandler', function() {
  var handler = new server.LiveReloadJsHandler();
  var req = {
    'url': '/livereload.js',
    'method': 'GET',
    'httpVersionMajor': 1,
    'httpVersionMinor': 1 };

  it('should handle /livereload.js', function() {
    var response = new ServerResponse(req);

    handler.handle(req, response).should.be.true;
    response.statusCode.should.equal(200);
    response.output[0].indexOf("Content-Type: text/javascript").should.above(0);
  });

  it('should skip /', function() {
    req.url = '/';
    var response = new ServerResponse(req);

    handler.handle(req, response).should.be.false;
    response.output.should.have.length(0);
  });
});
