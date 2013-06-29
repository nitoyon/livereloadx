/*
 * livereloadx
 * https://github.com/nitoyon/livereloadx
 *
 * Copyright (c) nitoyon 2013 
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'lib/*.js',
        '<%= mochaTest.test.src %>'
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Unit tests.
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/test.*.js']
      }
    },

    watch: {
      all: {
        files: ['<%= jshint.all %>', '.jshintrc'],
        tasks: ['default']
      }
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('default', ['jshint', 'mochaTest']);
  grunt.registerTask('test', ['mochaTest']);
};
