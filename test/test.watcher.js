/*jshint expr: true*/
'use strict';

var should = require('should')
  , fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , Watcher = require('../lib/watcher');

describe('Watcher', function() {
  var dir = __dirname + '/tmp';

  // Convert Windows path to UNIX style
  function r(path) {
    return path.replace(/\\/g, '/');
  }

  // recursive rmdir
  function rmdirRecur(d) {
    var files = fs.readdirSync(d);
    files.forEach(function(file) {
      var path = d + '/' + file;
      var stat = fs.statSync(path);
      if (stat.isDirectory()) {
        rmdirRecur(path);
      } else if (stat.isFile()) {
        fs.unlinkSync(path);
      }
    });
    fs.rmdirSync(d);
  };

  beforeEach(function() {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });

  afterEach(function() {
    rmdirRecur(dir);
  });

  it('should watch the root dir', function(done) {
    var watcher = new Watcher().watch(dir);
    watcher.once('complete', function() {
      fs.appendFileSync(dir + '/test.txt', 'a');
    });
    watcher.on('change', function(changes) {
      r(changes.toString()).should.be.equal('+test.txt\n');

      watcher.close();
      done();
    });
  });

  it('should watch a child dir', function(done) {
    var childDir = dir + '/child';
    fs.mkdirSync(childDir);

    var watcher = new Watcher().watch(dir);
    watcher.once('complete', function() {
      fs.appendFileSync(childDir + '/child_file.txt', 'a');
    });
    watcher.on('change', function(changes) {
      r(changes.toString()).should.be.equal('+child/child_file.txt\n');

      watcher.close();
      done();
    });
  });

  it('should watch a created dir', function(done) {
    var childDir = dir + '/new';
    var count = 0;

    var watcher = new Watcher().watch(dir);
    watcher.once('complete', function() {
      fs.mkdirSync(childDir);
    });
    watcher.on('change', function(changes) {
      count++;
      if (count === 1) {
        r(changes.toString()).should.be.equal('+new/\n');
        fs.appendFileSync(childDir + '/child_file.txt', 'a');
      } else if (count == 2) {
        r(changes.toString()).should.be.equal('+new/child_file.txt\n');
        watcher.close();
        done();
      } else {
        throw new Error('never comes here: ' + changes.toString());
      }
    });
  });
});
