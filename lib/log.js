"use strict";

var util = require('util');

// Logger constructor
function Logger(transport) {
  this.transport = transport;
}

// Core logging method
Logger.prototype.log = function(level, args) {
  this.transport.apply(this.transport, arguments);
};

//  Define prototype methods for each log level
//  e.g. logger.log('info', msg) <=> logger.info(msg)
['error', 'warn', 'info', 'debug', 'trace'].forEach(function(level) {
  Logger.prototype[level] = function(args) {
    args = Array.prototype.slice.call(arguments);
    args.unshift(level);
    this.log.apply(this, args);
  };
});


// winston compatible transport
function createConsoleTransport(name) {
  var esc = String.fromCharCode(0x1b);
  var levelMap = {
    'error': esc + '[31merror' + esc + '[39m: ', // red
    'warn':  esc + '[33mwarn'  + esc + '[39m:  ', // yellow
    'info':  esc + '[32minfo'  + esc + '[39m:  ', // green
    'debug': esc + '[34mdebug' + esc + '[39m: ', // white
    'trace': esc + '[36mtrace' + esc + '[39m: ' // blue
  };

  function getNowString() {
    function pad2(n) {
      return n < 10 ? "0" + n : n.toString();
    }

    var d = new Date();
    return util.format('%s-%s-%s %s:%s:%s',
      d.getFullYear(), pad2(d.getMonth() + 1), pad2(d.getDate()),
      pad2(d.getHours()), pad2(d.getMinutes()), pad2(d.getSeconds()));
  }

  return function() {
    var args = Array.prototype.slice.call(arguments);

    // level filter
    var level = args.shift();
    if (level === 'trace') {
      return;
    }
    if (!module.exports.verbose && level === 'debug') {
      return;
    }

    // add time and colorize level
    args[0] = (getNowString()) + ' - ' + levelMap[level] + args[0];

    console.log.apply(console, args);
  };
}

// debug.js transport
function createDebugTransport(name) {
  var debug = require('debug')('livereloadx:' + name);
  return function(level, args) {
    args = Array.prototype.slice.call(arguments);
    args.shift();
    debug.apply(debug, args);
  };
}

// debug compatible interface
module.exports = function(name) {
  var transport = null;
  if (module.exports.cli) {
    transport = createConsoleTransport(name);
  } else {
    transport = createDebugTransport(name);
  }
  return new Logger(transport);
};

module.exports.cli = false;
