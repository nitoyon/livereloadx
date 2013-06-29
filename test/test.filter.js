/*jshint expr: true*/
'use strict';

var should = require('should')
  , filter = require('../lib/filter');

describe('Filter', function() {
  it('should handle include', function() {
    var f = new filter.Filter({type: 'include', pattern: "foo"});
    f.type.should.equal('include');
    f.is_include.should.be.true;
    f.is_exclude.should.be.false;
  });

  it('should handle exclude', function() {
    var f = new filter.Filter({type: 'exclude', pattern: "foo"});
    f.type.should.equal('exclude');
    f.is_include.should.be.false;
    f.is_exclude.should.be.true;
  });

  it('should handle "foo"', function() {
    var f = new filter.Filter({type: 'include', pattern: "foo"});
    f.match('foo', true).should.be.true;
    f.match('foo', false).should.be.true;
    f.match('foofoo', true).should.be.false;
    f.match('bar/foo', true).should.be.true;
    f.match('bar/foo', false).should.be.true;
    f.match('bar').should.be.false;
    f.match('foo/bar').should.be.false;
  });

  it('should handle "foo/"', function() {
    var f = new filter.Filter({type: 'include', pattern: "foo/"});
    f.match('foo', true).should.be.true;
    f.match('foo', false).should.be.false;
    f.match('bar/foo', true).should.be.true;
    f.match('bar/foo', false).should.be.false;
    f.match('bar').should.be.false;
    f.match('foo/bar').should.be.false;
  });

  it('should handle "/foo"', function() {
    var f = new filter.Filter({type: 'include', pattern: "/foo"});
    f.match('foo', true).should.be.true;
    f.match('foo', false).should.be.true;
    f.match('foofoo', false).should.be.false;
    f.match('bar/foo', true).should.be.false;
    f.match('bar/foo', false).should.be.false;
    f.match('bar').should.be.false;
    f.match('foo/bar').should.be.false;
  });

  it('should handle "/foo/"', function() {
    var f = new filter.Filter({type: 'include', pattern: "/foo/"});
    f.match('foo', true).should.be.true;
    f.match('foo', false).should.be.false;
    f.match('foofoo', false).should.be.false;
    f.match('bar/foo', true).should.be.false;
    f.match('bar/foo', false).should.be.false;
    f.match('bar').should.be.false;
    f.match('foo/bar').should.be.false;
  });

  it('should handle "*.js"', function() {
    var f = new filter.Filter({type: 'include', pattern: "*.js"});
    f.match('test.js').should.be.true;
    f.match('test.jsssss').should.be.false;
    f.match('test.txt').should.be.false;
    f.match('test.js/bar').should.be.false;
    f.match('foo/test.js').should.be.true;
    f.match('.git/test.js').should.be.true;
  });

  it('should handle "foo/*.js"', function() {
    var f = new filter.Filter({type: 'include', pattern: "foo/*.js"});
    f.match('test.js').should.be.false;
    f.match('foo/test.js').should.be.true;
    f.match('bar/foo/test.js').should.be.true;
    f.match('foo/bar/test.js').should.be.false;
  });

  it('should handle "foo/**/*.js"', function() {
    var f = new filter.Filter({type: 'include', pattern: "foo/**/*.js"});
    f.match('test.js').should.be.false;
    f.match('foo/test.js').should.be.false;
    f.match('foo/bar/test.js').should.be.true;
    f.match('foo/bar/baz/test.js').should.be.true;
    f.match('bar/foo/test.js').should.be.false;
    f.match('bar/foo/baz/test.js').should.be.true;
  });

  it('should handle "*.{js,css,html}"', function() {
    var f = new filter.Filter({type: 'include', pattern: "*.{js,css,html}"});
    f.match('test.js').should.be.true;
    f.match('test.css').should.be.true;
    f.match('test.html').should.be.true;
    f.match('test').should.be.false;
    f.match('test.txt').should.be.false;
    f.match('foo/test.html').should.be.true;
  });

  it('should handle "{/foo,bar}"', function() {
    var f = new filter.Filter({type: 'include', pattern: "{/foo,bar}"});
    f.match('foo').should.be.true;
    f.match('bar').should.be.true;
    f.match('baz/foo').should.be.false;
    f.match('baz/bar').should.be.true;
  });
});

describe('getFilter()', function() {
  it('should handle all include', function() {
    var matcher = new filter.getMatcher([{type: 'include', pattern: "*"}]);
    matcher('foo').should.be.true;
    matcher('foo/bar').should.be.true;
    matcher('.git/HEAD').should.be.true;
  });

  it('should handle all exclude', function() {
    var matcher = new filter.getMatcher([{type: 'exclude', pattern: "*"}]);
    matcher('foo').should.be.false;
    matcher('foo/bar').should.be.false;
  });

  it('should handle include *.js', function() {
    var matcher = new filter.getMatcher([
      {type: 'include', pattern: "*.js"},
      {type: 'include', pattern: "*/"},
      {type: 'exclude', pattern: "*"},
    ]);
    matcher('foo').should.be.false;
    matcher('foo.js').should.be.true;
    matcher('foo/bar').should.be.false;
    matcher('foo/bar.js').should.be.true;
  });

  it('should handle exclude *.js', function() {
    var matcher = new filter.getMatcher([
      {type: 'exclude', pattern: "*.js"},
      {type: 'include', pattern: "*"},
    ]);
    matcher('foo').should.be.true;
    matcher('foo.js').should.be.false;
    matcher('foo/bar').should.be.true;
    matcher('foo/bar.js').should.be.false;
  });

  it('should handle exclude /*.js', function() {
    var matcher = new filter.getMatcher([
      {type: 'exclude', pattern: "/*.js"},
      {type: 'include', pattern: "*"},
    ]);
    matcher('foo').should.be.true;
    matcher('foo.js').should.be.false;
    matcher('foo/bar').should.be.true;
    matcher('foo/bar.js').should.be.true;
  });

  it('should handle exclude .{git,svn}/', function() {
    var matcher = new filter.getMatcher([
      {type: 'exclude', pattern: ".{git,svn}/"},
    ]);
    matcher('.git/COMMIT_MESSAGES').should.be.false;
    matcher('aa.svn/').should.be.true;
  });
});
