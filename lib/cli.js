"use strict";

exports.run = function() {
  var config = require('./config').parseArgv(process.argv);

  // enable CLI mode
  var log = require('./log');
  log.cli = true;

  // enable verbose output
  if (config.verbose) {
    log.verbose = true;
  }

  require('./server').startServer(config).watch();
}
