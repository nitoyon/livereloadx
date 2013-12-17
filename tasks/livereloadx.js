/*
 * livereloadx
 * https://github.com/nitoyon/livereloadx
 *
 * Copyright (c) 2013 nitoyon
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.registerTask('livereloadx', 'LiveReloadX server', function() {
    // initialize log
    var log_mod = require('../lib/log')
      , config_mod = require('../lib/config');
    log_mod.cli = true;
    if (grunt.option('debug') || grunt.option('verbose')) {
      log_mod.verbose = true;
    }

    // get config
    var log = log_mod('grunt');
    try {
      var config = config_mod.setDefaultValue(grunt.config(this.name));
      config_mod.dump(log.info.bind(log), config);
    } catch (e) {
      grunt.log.error(e);
      return false;
    }

    // start server
    var server = require('../')(config);
    server.listen().watch();
    grunt.log.writeln('LiveReloadX started.');
  });
};
