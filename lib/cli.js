"use strict";

exports.run = function() {
  // enable CLI mode
  require('./log').cli = true;
  var log = require('./log')('cli');

  // parse argv
  var config;
  try {
    config = require('./config').parseArgv(process.argv);
  } catch (e) {
    log.error(e.message || e);
    return;
  }

  // enable verbose output
  if (config.verbose) {
    require('./log').verbose = true;
  }

  // dump config
  require('./config').dump(log.info.bind(log), config);

  var server = require('./server').createServer(config);
  server.listen().watch();
};
