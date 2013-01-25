"use strict";

var program = require('commander')
  .version('0.0.4')
  .usage('[options] [dir]')
  .option('-p, --port <port>', 'change wait port', parseInt)
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

  // parse
  program.parse(argv);

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
  }
  return conf;
};
