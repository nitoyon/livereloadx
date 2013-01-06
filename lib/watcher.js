(function() {
	"use strict";

	var fsmonitor = require('fsmonitor')
	  , debug = require('debug')('livereloadx:watcher')
	  , util = require('util')
	  , EventEmitter = require('events').EventEmitter;

	function Watcher() {
		EventEmitter.call(this);
	}
	util.inherits(Watcher, EventEmitter);

	Watcher.prototype.watch = function(dir) {
		var self = this;
		fsmonitor.watch(dir, null, function(change) {
			debug("Change %s", change);
			change.modifiedFiles.concat(change.addedFiles).forEach(function(file) {
				self.emit("change", file.replace(/\\/g, '/'));
			});
		});
	};

	module.exports = Watcher;
})();
