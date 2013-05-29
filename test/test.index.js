var should = require('should')
  , livereloadx = require('../');

describe('livereloadx', function() {
  it('should be callable', function() {
    should.exists(livereloadx());
  });
});
