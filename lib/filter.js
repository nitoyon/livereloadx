"use strict";

var log = require('./log')('filter')
  , minimatch = require('minimatch');

/**
 * Iniialize a new `Filter` class with given filter
 *
 * @param {Object} filter filter which has `pattern` and `type` property
 */
function Filter(filter) {
  // validate type
  if (filter.type !== 'include' && filter.type !== 'exclude') {
    throw new Error('Invalid filter type: ' + filter.type);
  }

  this.pattern = filter.pattern;
  this.type = filter.type;
  this.is_include = (filter.type === 'include');
  this.is_exclude = !this.is_include;
  this.parse();
}

Filter.prototype.parse = function() {
  // create RegExp with minimatch
  // (ex) foo -> /^foo$/
  var minimatchRe = minimatch.makeRe(this.pattern, {
    dot: true, noext: true, nonegate: true
  });
  if (minimatchRe === false) {
    throw new Error('Invalid pattern: ' + this.pattern);
  }

  // validate the returned RegExp
  var source = minimatchRe.source;
  if (!source.match(/^\^.*\$$/)) {
    throw new Error('Unexpected regexp: "' + this.pattern + '" -> '  + source);
  }

  // change to fit the rsync filtering rules
  // /^xxxx$/ -> /\/(xxxx)$/
  this.re = new RegExp('/(' + source.substr(1, source.length - 2) + ')$');
  log.debug('re: %s', this.re.source);
};

/**
 * Check if `file` matches the filter
 *
 * @param {String] file
 * @param {Boolean} is_dir specify whether `file` is a directory
 * @return {Boolean} Match or not
 */
Filter.prototype.match = function(file, is_dir) {
  file = '//' + file;
  return this.re.test(file) || is_dir && this.re.test(file + '/') || false;
};


/**
 * Return a filtering function with the given `filters`.
 *
 * @param {Array} filters  include or exclude filter.
 *                          (ex) `{ source: '*.js', is_include: true }`
 * @return {Function} filtering function which returns the given pattern is included
 *                    or not.
 */
function getMatcher(filters) {
  filters = filters.map(function(f) { return new Filter(f); });

  return function match(file) {
    var dirs = file.split('/');
    log.trace('%s: filtering start', file);
    for (var i = 0, len = dirs.length; i < len; i++) {
      var name = dirs.slice(0, i + 1).join('/')
        , is_dir = (i < len - 1);

      for (var j = 0, filterLen = filters.length; j < filterLen; j++) {
        if (filters[j].match(name, is_dir)) {
          if (filters[j].is_include) {
            log.trace('%s: include filter %d matches (%s)', name, j, filters[j].re.source);
            break;
          } else {
            log.trace('%s: exclude filter %d matches (%s)', name, j, filters[j].re.source);
            return false;
          }
        }
      }
      if (j === filterLen) {
        log.trace('%s: no filter matches', name);
      }
    }
    log.trace('%s: included', file);
    return true;
  };
}

module.exports.getMatcher = getMatcher;
module.exports.Filter = Filter;
