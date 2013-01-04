(function() {
	"use strict";

	var fsmonitor = require('fsmonitor')
	  , util = require('util')
	  , EventEmitter = require('events').EventEmitter;

	function Watcher() {
		EventEmitter.call(this);
	}
	util.inherits(Watcher, EventEmitter);

	Watcher.prototype.watch = function(dir) {
		var self = this;
		fsmonitor.watch(dir, null, function(change) {
			console.log("Change: " + change);
			change.modifiedFiles.concat(change.addedFiles).forEach(function(file) {
				self.emit("change", file);
			});
		});
	};

	module.exports = Watcher;
})();
