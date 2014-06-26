"use strict";

var program = require('commander')
  , fs = require('fs');

var defaultValues = {
  cli: false,
  dir: './',
  filter: [
    {type: 'exclude', pattern: '.{git,svn}/'},
    {type: 'include', pattern: '*/'},
    {type: 'include', pattern: '*.{html,shtml,tmpl,xml,css,js,json,jpeg,jpg,gif,png,ico,cgi,php,py,pl,pm,rb}'},
    {type: 'exclude', pattern: '*'}
  ],
  static: false,
  port: 35729,
  preferLocal: false,
  proxy: '',
  verbose: false,
  liveCSS: true,
  liveImg: true
};

program
  .version(JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version)
  .usage('[options] [dir]')
  .option('--exclude <pattern>', 'exclude file matching pattern')
  .option('--include <pattern>', 'don\'t exclude file matching pattern')
  .option('-p, --port <port>', 'change wait port', function(val){ return parseInt(val, 10); })
  .option('-l, --prefer-local', 'return a local file if it exists (proxy mode only)')
  .option('-s, --static', 'enable static server mode')
  .option('-v, --verbose', 'enable verbose log')
  .option('-y, --proxy <url>', 'enable proxy server mode')
  .option('-C, --no-liveCSS', 'disable liveCSS')
  .option('-I, --no-liveImg', 'disable liveImg');

program.on('include', function(val) {
  program.filter.splice(program.filter.length - defaultValues.filter.length, 0,
    {type: 'include', pattern: val});
});
program.on('exclude', function(val) {
  program.filter.splice(program.filter.length - defaultValues.filter.length, 0,
    {type: 'exclude', pattern: val});
});

function copyValues(dst, src) {
  for (var key in defaultValues) {
    // deep copy
    dst[key] = JSON.parse(JSON.stringify(src[key]));
  }
  return dst;
}

var validate = exports.validate = function(conf) {
  for (var key in conf) {
    if (!(key in defaultValues)) {
      throw "Invalid key: " + key;
    }
    if (typeof defaultValues[key] !== typeof conf[key]) {
      throw "Invalid type: " + key + " should be " + typeof defaultValues[key];
    }
    if (typeof conf[key] === 'number' && isNaN(conf[key])) {
      throw "Invalid value: " + key + " should be a number";
    }

    if (conf.static && conf.proxy !== '') {
      throw 'The "static" option cannot be specified together with "proxy" option';
    }
    if (conf.preferLocal && conf.proxy === '') {
      throw 'The "prefer-local" option must be specified with "proxy" option';
    }
  }
  return conf;
};

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
  if (program.args.length === 1) {
    program.dir = program.args[0];
  } else if (program.args.length === 0) {
    program.dir = '.';
  } else if (program.args.length > 1) {
    throw "Too much arguments";
  }

  // delete include and exclude
  delete program.include;
  delete program.exclude;

  // copy program to Object
  return validate(copyValues({}, program));
};

var setDefaultValue = exports.setDefaultValue = function(conf) {
  for (var key in defaultValues) {
    if (!(key in conf)) {
      // deep copy
      conf[key] = JSON.parse(JSON.stringify(defaultValues[key]));
    }
  }
  return validate(conf);
};

var dump = exports.dump = function(log, conf) {
  log('Config:');
  log('  - mode:   %s', conf.static ? 'static' : conf.proxy !== '' ? 'proxy' : 'default');
  if (conf.proxy) {
    log('    url:  %s', conf.proxy);
    log('    prefer local: %s', conf.preferLocal ? 'ON' : 'OFF');
  }
  log('  - port:   %d', conf.port);
  log('  - filter:');
  conf.filter.forEach(function(filter, i) {
    log('    %d: %s "%s"', i + 1, filter.type, filter.pattern);
  });
};