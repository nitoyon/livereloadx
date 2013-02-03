"use strict";

var httpProxy = require('http-proxy')
  , inject = require('./html').inject
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
  var isHtml = /html/.test(headers['content-type'])
    , isCompressed = /^(gzip|deflate)$/.test(headers['content-encoding']);
  log.debug('%s: isHtml=%d, isCompressed=%d', this.req.url, isHtml, isCompressed);
  if (isHtml && !isCompressed) {
    log.debug("%s: start injecting", this.req.url);
    this.injecting = true;
    this.tmpBuffer = [];
  } else {
    if (isHtml && isCompressed) {
      log.warn('Compression is not supported. Failed to add <script>: %s',
        this.req.url);
    }

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
  if (this.injecting) {
    if (chunk) this.write(chunk, encoding);

    log.debug('%s: call injected end', this.req.url);
    this.finish(this.getNewBuffer());
  } else {
    log.debug('%s: call original end', this.req.url, chunk, encoding);
    ServerResponse.prototype.end.call(this.res, chunk, encoding);
  }
};

ServerResponseWrapper.prototype.getNewBuffer = function() {
  // inject html
  var oldBuf = Buffer.concat(this.tmpBuffer);
  var newBuf = inject(oldBuf, this.port);

  log.debug('%s: content-length changed: %s -> %d', this.req.url, 
    oldBuf, newBuf);
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
