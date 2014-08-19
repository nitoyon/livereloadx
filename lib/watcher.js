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
  var watcher = fsmonitor.watch(dir, null, function(change) {
    log.debug("Change %s", change);
    change.modifiedFiles.concat(change.addedFiles).forEach(function(file) {
      self.emit("change", file.replace(/\\/g, '/'));
    });
  });

  log.info('Watching "%s"...', require('path').resolve(dir));
  return watcher;
};

module.exports = Watcher;
