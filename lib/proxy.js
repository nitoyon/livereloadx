"use strict";

var httpProxy = require('http-proxy')
  , inject = require('./html').inject
  , zlib = require('zlib')
  , log = require('./log')('proxy')
  , ServerResponse = require('http').ServerResponse
  , url = require('url');

// inspired by webxl/grunt-reload/tasks/reload.js
function ServerResponseWrapper(req, res, port) {
  this.req = req;
  this.res = res;
  this.port = port;

  res.writeHead = this.writeHead.bind(this);
  res.write = this.write.bind(this);
  res.end = this.end.bind(this);
}

ServerResponseWrapper.prototype.writeHead = function(statusCode, headers) {
  this.statusCode = statusCode;
  this.headers = headers;

  log.debug("%s: status=%d, header=", this.req.url, statusCode, headers);
  var isHtml = /html/.test(headers['content-type']);
  log.debug('%s: isHtml=%d', this.req.url, isHtml);
  if (isHtml) {
    log.debug("%s: start injecting", this.req.url);
    this.injecting = true;
    this.tmpBuffer = [];
  } else {
    log.debug("%s: not injected", this.req.url);
    this.injecting = false;
    ServerResponse.prototype.writeHead.call(this.res, statusCode, headers);
  }
};

ServerResponseWrapper.prototype.write = function(chunk, encoding) {
  if (this.injecting) {
    log.debug("%s: add to tmpBuffer", this.req.url);
    this.tmpBuffer.push(new Buffer(chunk, encoding));
  } else {
    log.debug("%s: call original write", this.req.url);
    ServerResponse.prototype.write.call(this.res, chunk, encoding);
  }
},

ServerResponseWrapper.prototype.end = function(chunk, encoding) {
  if (!this.injecting) {
    log.debug('%s: call original end', this.req.url, chunk, encoding);
    ServerResponse.prototype.end.call(this.res, chunk, encoding);
    return;
  }

  // get remote response body
  if (chunk) this.write(chunk, encoding);
  var buffer = Buffer.concat(this.tmpBuffer);

  if (/^(gzip|deflate)$/.test(this.headers['content-encoding'])) {
    // It's compressed.
    log.debug('%s: end() called. decompress buffer', this.req.url);
    var self = this;
    this.decompress(buffer, function(err, buf) {
      if (err) {
        log.error('%s: error on decompressing: ', self.req.url, err);
        self.finish(buffer);
      } else {
        log.debug('%s: decompress finished. inject snippet', self.req.url);
        delete self.headers['content-encoding'];
        self.finish(self.getSnippetInjectedBuffer(buf));
      }
    });
  } else {
    // Modify response and returns it to client
    log.debug('%s: end() called. inject snippet', this.req.url);
    this.finish(this.getSnippetInjectedBuffer(buffer));
  }
};

ServerResponseWrapper.prototype.decompress = function(buffer, callback) {
  if (this.headers['content-encoding'] === 'gzip') {
    zlib.gunzip(buffer, callback);
  } else if (this.headers['content-encoding'] === 'deflate') {
    zlib.inflate(buffer, callback);
  } else {
    throw new Error('Invalid encoding: ' + this.headers['content-encoding']);
  }
};

ServerResponseWrapper.prototype.getSnippetInjectedBuffer = function(oldBuf) {
  // inject html
  var newBuf = inject(oldBuf, this.port);

  log.debug('%s: content-length changed: %d -> %d', this.req.url,
    oldBuf.length, newBuf.length);
  return newBuf;
};

ServerResponseWrapper.prototype.finish = function(buffer) {
  this.headers['content-length'] = buffer.length.toString();

  log.debug('%s: finish', this.req.url);
  log.debug('  - header: ', this.headers);
  ServerResponse.prototype.writeHead.call(this.res, this.statusCode, this.headers);
  ServerResponse.prototype.write.call(this.res, buffer);
  ServerResponse.prototype.end.call(this.res);
};

function wrapResponse(req, res, port) {
  new ServerResponseWrapper(req, res, port);
}

function ProxyHandler(config) {
  this.config = config;
  this.init();
}

ProxyHandler.prototype.init = function() {
  log.debug('proxy: ', this.config.proxy);
  if (this.config.proxy == '') {
    return;
  }

  var proxyUrl = url.parse(this.config.proxy);
  if (!proxyUrl.protocol) {
    throw new Error("proxy URL protocol is not specified:" + this.config.proxy);
  }

  var isHttps = (proxyUrl.protocol == 'https:');
  var port = proxyUrl.port || (isHttps ? 443 : 80);
  if (!isHttps && proxyUrl.protocol != 'http:') {
    throw new Error("proxy URL protocol is invalid: " + this.config.proxy);
  }
  if (proxyUrl.path != '/') {
    log.warn("proxy URL path '%s' is ignored", proxyUrl.path);
  }
  this.proxy = new httpProxy.HttpProxy({
    target: {
      host: proxyUrl.hostname,
      port: port,
      https: isHttps
    },
    enable: {
      xforward: false
    },
    changeOrigin: true
  });

  log.info("Enabled proxy mode. (proxy to '%s//%s:%d/')", proxyUrl.protocol, 
    proxyUrl.hostname, port);
}

ProxyHandler.prototype.handle = function(req, res) {
  if (!this.proxy) {
    return false;
  }

  // hook response
  wrapResponse(req, res, this.config.port);

  // pass to http-proxy
  log.info("process: %s", req.url);
  this.proxy.proxyRequest(req, res);
  return true;
}

module.exports = ProxyHandler;
