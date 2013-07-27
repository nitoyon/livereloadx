module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    shell: {
      jekyll_build: {
        command: 'jekyll build'
      }
    },
    livereloadx: {
      static: true,
      dir: '.'
    },
    watch: {
      jekyll: {
        files: ['**/*.md', '_layouts/*.html', 'stylesheets/*', 'scripts/*', 'images/*'],
        tasks: ['shell:jekyll_build']
      }
    }
  });

  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('livereloadx');

  grunt.registerTask('default', ['livereloadx', 'build', 'watch']);
  grunt.registerTask('build', ['shell:jekyll_build']);
};