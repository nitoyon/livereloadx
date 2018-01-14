/*jshint expr: true*/
'use strict';

var should = require('should')
  , config = require('../lib/config');

describe('config#parseArgv', function() {
  var exited = false
    , oldProcessExit = process.exit
    , oldConsoleError = console.error;

  // test process.exit()
  before(function() {
    process.exit = function() {
      exited = true;
      throw new Error();
    };
    console.error = function() {};
  });
  beforeEach(function() {
    exited = false;
  });
  after(function() {
    process.exit = oldProcessExit;
    console.error = oldConsoleError;
  });

  it('default result', function() {
    var conf = config.parseArgv(['node', 'livereloadx']);
    var defaultValues = config.setDefaultValue({});

    conf.should.have.property('port', 35729);
    conf.should.have.property('verbose', false);
    conf.should.have.property('liveCSS', true);
    conf.should.have.property('liveImg', true);
    conf.should.have.property('dir', '.');
    conf.should.have.property('filter');
    conf.filter.should.eql(defaultValues.filter);
  });

  it('set dir', function() {
    var conf = config.parseArgv(['node', 'livereloadx', 'dir']);
    conf.should.have.property('dir', 'dir');

    conf = config.parseArgv(['node', 'livereloadx', '-p', '1234', 'dir']);
    conf.should.have.property('dir', 'dir');
  });

  it('set static', function() {
    var conf = config.parseArgv(['node', 'livereloadx', '-s']);
    conf.should.have.property('static', true);
  });

  it('set spa', function() {
    var conf = config.parseArgv(['node', 'livereloadx', '-a']);
    conf.should.have.property('static', true);
    conf.should.have.property('spa', true);
  });

  it('set proxy', function() {
    var conf = config.parseArgv(['node', 'livereloadx', '-y', 'http://example.com/']);
    conf.should.have.property('proxy', 'http://example.com/');
    conf.should.have.property('preferLocal', false);
  });

  it('set proxy and prefer-local', function() {
    var conf = config.parseArgv(['node', 'livereloadx', '-y', 'http://example.com/', '-l']);
    conf.should.have.property('proxy', 'http://example.com/');
    conf.should.have.property('preferLocal', true);
  });

  it('set port', function() {
    var conf = config.parseArgv(['node', 'livereloadx', '--port', '80', 'dir']);
    conf.should.have.property('port', 80);

    conf = config.parseArgv(['node', 'livereloadx', '-p', '1234', 'dir']);
    conf.should.have.property('port', 1234);
  });

  it('set verbose', function() {
    var conf = config.parseArgv(['node', 'livereloadx', '-v', 'dir']);
    conf.should.have.property('verbose', true);

    conf = config.parseArgv(['node', 'livereloadx', '--verbose', 'dir']);
    conf.should.have.property('verbose', true);
  });

  it('set no-liveCSS', function() {
    var conf = config.parseArgv(['node', 'livereloadx', '-C', 'dir']);
    conf.should.have.property('liveCSS', false);

    conf = config.parseArgv(['node', 'livereloadx', '--no-liveCSS', 'dir']);
    conf.should.have.property('liveCSS', false);
  });

  it('set no-liveImg', function() {
    var conf = config.parseArgv(['node', 'livereloadx', '-I', 'dir']);
    conf.should.have.property('liveImg', false);

    conf = config.parseArgv(['node', 'livereloadx', '--no-liveImg', 'dir']);
    conf.should.have.property('liveImg', false);
  });

  it('set include and exclude', function() {
    var conf = config.parseArgv(['node', 'livereloadx', '--include=a',
      '--exclude=b', '--include=c']);
    conf.should.have.property('filter');
    Array.isArray(conf.filter).should.be.true;
    conf.filter.length.should.be.above(3);
    conf.filter[0].should.eql({type: 'include', pattern: 'a'});
    conf.filter[1].should.eql({type: 'exclude', pattern: 'b'});
    conf.filter[2].should.eql({type: 'include', pattern: 'c'});
  });

  it('invalid port', function() {
    var f = function() {
      config.parseArgv(['node', 'livereloadx', '-p', 'a', 'dir']);
    };
    f.should.throw();
  });

  it('unknown option', function() {
    var f = function() {
      config.parseArgv(['node', 'livereloadx', '--unknown', 'a', 'dir']);
    };
    f.should.throw();
    exited.should.be.true;
  });

  it('static and proxy', function() {
    var f = function() {
      config.parseArgv(['node', 'livereloadx', '-s', '-p', 'http://www.example.com/']);
    };
    f.should.throw();
  });

  it('prefer-lcoal and proxy', function() {
    var f = function() {
      config.parseArgv(['node', 'livereloadx', '-l']);
    };
    f.should.throw();
  });
});

describe('config#setDefaultValue', function() {
  it('default result', function() {
    var conf = config.setDefaultValue({});
    conf.should.have.property('port', 35729);
    conf.should.have.property('liveCSS', true);
    conf.should.have.property('liveImg', true);
  });

  it('set port', function() {
    var conf = config.setDefaultValue({port: 80});
    conf.should.have.property('port', 80);
  });

  it('set liveCSS', function() {
    var conf = config.setDefaultValue({liveCSS: false});
    conf.should.have.property('liveCSS', false);
  });

  it('set liveImg', function() {
    var conf = config.setDefaultValue({liveImg: false});
    conf.should.have.property('liveImg', false);
  });

  it('invalid key should throw', function() {
    var f = function() {
      config.setDefaultValue({invalid_key: 1});
    };
    f.should.throw();
  });

  it('invalid type should throw', function() {
    var f = function() {
      config.setDefaultValue({port: "80"});
    };
    f.should.throw();
  });

  it('should deep copy filter', function() {
    var conf1 = config.setDefaultValue({});
    var conf2 = config.setDefaultValue({});
    conf1.filter.should.not.exactly(conf2.filter);
  });
});
