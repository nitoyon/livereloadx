var should = require('should')
  , config = require('../lib/config');

describe('config#parseArgv test', function() {
	it('default result', function() {
		var conf = config.parseArgv(['node', 'livereloadx', 'dir']);
		conf.should.have.property('port', 35729);
		conf.should.have.property('liveCSS', true);
		conf.should.have.property('liveImage', true);
		conf.should.have.property('dir', 'dir');
	});

	it('set port', function() {
		var conf = config.parseArgv(['node', 'livereloadx', '--port', '80', 'dir']);
		conf.should.have.property('port', 80);

		conf = config.parseArgv(['node', 'livereloadx', '-p', '1234', 'dir']);
		conf.should.have.property('port', 1234);
	});

	it('set no-liveCSS', function() {
		var conf = config.parseArgv(['node', 'livereloadx', '-C', 'dir']);
		conf.should.have.property('liveCSS', false);

		conf = config.parseArgv(['node', 'livereloadx', '--no-liveCSS', 'dir']);
		conf.should.have.property('liveCSS', false);
	});

	it('set no-liveImage', function() {
		var conf = config.parseArgv(['node', 'livereloadx', '-I', 'dir']);
		conf.should.have.property('liveImage', false);

		conf = config.parseArgv(['node', 'livereloadx', '--no-liveImage', 'dir']);
		conf.should.have.property('liveImage', false);
	});
});

describe('config#setDefaultValue test', function() {
	it('default result', function() {
		var conf = config.setDefaultValue({});
		conf.should.have.property('port', 35729);
		conf.should.have.property('liveCSS', true);
		conf.should.have.property('liveImage', true);
	});

	it('set port', function() {
		var conf = config.setDefaultValue({port: 80});
		conf.should.have.property('port', 80);
	});

	it('set liveCSS', function() {
		var conf = config.setDefaultValue({liveCSS: false});
		conf.should.have.property('liveCSS', false);
	});

	it('set liveImage', function() {
		var conf = config.setDefaultValue({liveImage: false});
		conf.should.have.property('liveImage', false);
	});

	it('invalid key should throw', function() {
		(function() {
			config.setDefaultValue({invalid_key: 1});
		}).should.throw();
	});

	it('invalid type should throw', function() {
		(function() {
			config.setDefaultValue({port: "80"});
		}).should.throw();
	});
});
