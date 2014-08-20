"use strict";

var fsmonitor = require('fsmonitor')
  , log = require('./log')('watcher')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter;

function Watcher() {
  EventEmitter.call(this);
}
util.inherits(Watcher, EventEmitter);

Watcher.prototype.watch = function(dir, is_included) {
  var self = this;

  var filter = {
    matches: function() { return true; },
    excludes: function(path) {
      path = path.replace(/\\/g, '/') + '/';
      if (is_included(path)) {
        log.debug("  watching '%s'", path);
        return false;
      } else {
        log.debug("  skipping '%s'", path);
        return true;
      }
    }
  };

  var watcher = fsmonitor.watch(dir, filter, function(change) {
    log.debug("Change %s", change);
    change.modifiedFiles.concat(change.addedFiles).forEach(function(file) {
      self.emit("change", file.replace(/\\/g, '/'));
    });
  });

  log.info('Watching "%s"...', require('path').resolve(dir));
  return watcher;
};

module.exports = Watcher;
