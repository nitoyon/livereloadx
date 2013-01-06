(function() {
	"use strict";

	var program = require('commander')
		.version('0.0.1')
		.usage('[options] <dir>')
		.option('-p, --port <port>', 'change wait port', parseInt)
		.option('-C, --no-liveCSS', 'disable liveCSS')
		.option('-I, --no-liveImg', 'disable liveImg');

	var defaultValues = {
		cli: false,
		dir: './',
		port: 35729,
		liveCSS: true,
		liveImg: true
	};

	function copyValues(dst, src) {
		if (src === undefined) {
			src = defaultValues;
		}
		for (var key in defaultValues) {
			dst[key] = src[key];
		}
		return dst;
	}

	exports.parseArgv = function(argv) {
		copyValues(program);
		program.parse(argv);

		// handle <dir>
		if (program.args.length == 1) {
			program.dir = program.args[0];
		} else if (program.args.length == 0) {
			throw "Watched directory is not specified";
		} else if (program.args.length > 1) {
			throw "Too much arguments";
		}

		// copy program to Object
		return exports.validate(copyValues({}, program));
	};

	exports.setDefaultValue = function(conf) {
		for (var key in defaultValues) {
			if (!(key in conf)) {
				conf[key] = defaultValues[key];
			}
		}
		return exports.validate(conf);
	};

	exports.validate = function(conf) {
		for (var key in conf) {
			if (!(key in defaultValues)) {
				throw "Invalid key: " + key;
			}
			if (typeof defaultValues[key] != typeof conf[key]) {
				throw "Invalid type: " + key + " must be " + typeof defaultValues[key];
			}
		}
		return conf;
	};
})();
