"use strict";

var program = require('commander')
  , fs = require('fs');

program
  .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version)
  .usage('[options] [dir]')
  .option('-p, --port <port>', 'change wait port', parseInt)
  .option('-l, --prefer-local', 'return a local file if it exists (proxy mode only)')
  .option('-s, --static', 'enable static server mode')
  .option('-v, --verbose', 'enable verbose log')
  .option('-y, --proxy <url>', 'enable proxy server mode')
  .option('-C, --no-liveCSS', 'disable liveCSS')
  .option('-I, --no-liveImg', 'disable liveImg');

var defaultValues = {
  cli: false,
  dir: './',
  static: false,
  port: 35729,
  preferLocal: false,
  proxy: '',
  verbose: false,
  liveCSS: true,
  liveImg: true
};

function copyValues(dst, src) {
  for (var key in defaultValues) {
    dst[key] = src[key];
  }
  return dst;
}

var parseArgv = exports.parseArgv = function(argv) {
  // set default value
  copyValues(program, defaultValues);

  // HACK: avoid commander.js's bug
  // (https://github.com/visionmedia/commander.js/pull/121)
  // program.parse() doesn't fail when unknown option and args are given.
  // So we call program.parseOptions() instead of program.parse().
  program._name = 'livereloadx';
  var parsed = program.parseOptions(program.normalize(argv.slice(2)));
  program.args = parsed.args;

  // handle unknown options
  if (parsed.unknown.length > 0) {
    program.parseArgs([], parsed.unknown);
  }

  // handle <dir>
  if (program.args.length == 1) {
    program.dir = program.args[0];
  } else if (program.args.length == 0) {
    program.dir = '.';
  } else if (program.args.length > 1) {
    throw "Too much arguments";
  }

  // copy program to Object
  return validate(copyValues({}, program));
};

var setDefaultValue = exports.setDefaultValue = function(conf) {
  for (var key in defaultValues) {
    if (!(key in conf)) {
      conf[key] = defaultValues[key];
    }
  }
  return validate(conf);
};

var validate = exports.validate = function(conf) {
  for (var key in conf) {
    if (!(key in defaultValues)) {
      throw "Invalid key: " + key;
    }
    if (typeof defaultValues[key] != typeof conf[key]) {
      throw "Invalid type: " + key + " should be " + typeof defaultValues[key];
    }
    if (typeof conf[key] == 'number' && isNaN(conf[key])) {
      throw "Invalid value: " + key + " is NaN";
    }

    if (conf.static && conf.proxy != '') {
      throw 'The "static" option cannot be specified together with "proxy" option';
    }
    if (conf.preferLocal && conf.proxy == '') {
      throw 'The "prefer-local" option must be specified with "proxy" option';
    }
  }
  return conf;
};
