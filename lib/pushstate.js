"use strict";

var log = require('./log')('static')
  , fs = require('fs')
  , path = require('path')
  , url = require('url');

function PushStateHandler(config) {
  this.config = config;
  this.root = path.resolve(this.config.dir);
  this.init();
}

PushStateHandler.prototype.init = function() {
  log.info('Push state active');
};

PushStateHandler.prototype.handle = function(req) {
  // If the file does not exist, then send back / and let the client side
  // router handle the path
  var filePath = url.parse(req.url).pathname;
  if (!fs.existsSync(path.join(this.root, filePath))) {
    req.url = '/';
  }
  // Let the static file handler figure out what to return
  return false;
};

module.exports = PushStateHandler;
