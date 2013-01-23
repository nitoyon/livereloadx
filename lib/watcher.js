"use strict";

var fsmonitor = require('fsmonitor')
  , log = require('./log')('watcher')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter;

function Watcher() {
  EventEmitter.call(this);
}
util.inherits(Watcher, EventEmitter);

Watcher.prototype.watch = function(dir) {
  var self = this;
  fsmonitor.watch(dir, null, function(change) {
    log.debug("Change %s", change);
    change.modifiedFiles.concat(change.addedFiles).forEach(function(file) {
      self.emit("change", file.replace(/\\/g, '/'));
    });
  });
};

module.exports = Watcher;
