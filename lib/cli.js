(function() {
	"use strict";

	exports.run = function() {
		var config = require('./config').parseArgv(process.argv);
		config.cli = true;
		require('./server').startServer(config).watch();
		console.log("Waiting on port %d...", config.port);
	}
})();
