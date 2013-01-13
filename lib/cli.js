"use strict";

exports.run = function() {
  var config = require('./config').parseArgv(process.argv);

  // enable CLI mode
  config.cli = true;

  // enable verbose output
  if (config.verbose) {
    process.env.DEBUG = (process.env.DEBUG || '') + ' livereloadx:*';
  }

  require('./server').startServer(config).watch();
  console.log("Waiting on port %d...", config.port);
}
