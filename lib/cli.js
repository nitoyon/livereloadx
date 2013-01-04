(function() {
	"use strict";

	exports.run = function() {
		var config = require('./config').parseArgv(process.argv);
		require('./server').startServer(config).watch();
		console.log("Waiting on port %d...", config.port);
	}
})();
