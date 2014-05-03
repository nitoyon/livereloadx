"use strict";

var httpProxy = require('http-proxy')
  , inject = require('./html').inject
  , zlib = require('zlib')
  , log = require('./log')('proxy')
  , ServerResponse = require('http').ServerResponse
  , StaticHandler = require('./static')
  , url = require('url');

// inspired by webxl/grunt-reload/tasks/reload.js
function ServerResponseWrapper(req, res, port) {
  this.req = req;
  this.res = res;
  this.port = port;

  this.origWriteHead = res.writeHead;
  this.origWrite = res.write;
  this.origEnd = res.end;
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

    // setHeader() for logging Content-Length in server.js
    if (headers && headers['content-length']) {
      this.res.setHeader('Content-Length', headers['content-length']);
    }

    this.origWriteHead.call(this.res, statusCode, headers);
  }
};

ServerResponseWrapper.prototype.write = function(chunk, encoding) {
  if (this.injecting) {
    log.debug("%s: add to tmpBuffer", this.req.url);
    this.tmpBuffer.push(new Buffer(chunk, encoding));
  } else {
    log.debug("%s: call original write", this.req.url);
    this.origWrite.call(this.res, chunk, encoding);
  }
},

ServerResponseWrapper.prototype.end = function(chunk, encoding) {
  if (!this.injecting) {
    log.debug('%s: call original end', this.req.url, chunk, encoding);
    this.origEnd.call(this.res, chunk, encoding);
    return;
  }

  // get remote response body
  if (chunk) { this.write(chunk, encoding); }
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
  // set Content-Length header
  // `res.setHeader()` is necessary for logging Content-Length in server.js
  this.headers['content-length'] = buffer.length.toString();
  this.res.setHeader('Content-Length', buffer.length.toString());

  log.debug('%s: finish', this.req.url);
  log.debug('  - header: ', this.headers);
  this.origWriteHead.call(this.res, this.statusCode, this.headers);
  this.origWrite.call(this.res, buffer);
  this.origEnd.call(this.res);
};

function wrapResponse(req, res, port) {
  new ServerResponseWrapper(req, res, port);
}

function rewriteLocation(host, location, proxy) {

    // use target rather than source, because rewrite to http from https has been done already.
    // see ... https://github.com/nodejitsu/node-http-proxy/blob/v0.8.7/lib/node-http-proxy/http-proxy.js#L255
    var scheme = proxy.source.https ? 'https://' : 'http://';
    var fromList = [scheme + proxy.target.host + ':' + proxy.target.port + '/'];
    var rewriteTo = host ? scheme + host : "";

    if (proxy.source.https) {
        if (+proxy.target.port === 443) {
            fromList.push(scheme + proxy.target.host + '/');
        }
    } else {
        if (+proxy.target.port === 80) {
            fromList.push(scheme + proxy.target.host + '/');
        }
    }

    fromList.some(function(from){
        if (location.lastIndexOf(from, 0) === 0) {
            location = rewriteTo + location.substring(from.length - 1);
            return true;
        }
    });

    return location;
}

function wrapRewriteLocation(req, res, proxy) {
  var host = req.headers.host;
  var writeHead = res.writeHead;
  res.writeHead = function(statusCode, headers) {
    if (((statusCode === 301) || (statusCode === 302)) && headers.location) {
      headers.location = rewriteLocation(host, headers.location, proxy);
    }
    return writeHead.call(this, statusCode, headers);
  };
}

function ProxyHandler(config) {
  this.config = config;
  this.init();
}

ProxyHandler.prototype.init = function() {
  log.debug('proxy: ', this.config.proxy);
  if (this.config.proxy === '') {
    return;
  }

  var proxyUrl = url.parse(this.config.proxy);
  if (!proxyUrl.protocol) {
    throw new Error("proxy URL protocol is not specified:" + this.config.proxy);
  }

  // create HttpProxy instance
  var isHttps = (proxyUrl.protocol === 'https:');
  var port = proxyUrl.port || (isHttps ? 443 : 80);
  if (!isHttps && proxyUrl.protocol !== 'http:') {
    throw new Error("proxy URL protocol is invalid: " + this.config.proxy);
  }
  if (proxyUrl.path !== '/') {
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

  // create StaticHandler instance if prefer-local is enabled
  if (this.config.preferLocal) {
    this.staticHandler = new StaticHandler(this.config, this.onError.bind(this));
  }

  log.info("Enabled proxy mode. (proxy to '%s//%s:%d/')", proxyUrl.protocol, 
    proxyUrl.hostname, port);
};

ProxyHandler.prototype.handle = function(req, res) {
  if (!this.proxy) {
    return false;
  }

  if (this.staticHandler) {
    if (this.staticHandler.handle(req, res)) {
      return true;
    }
  }

  this.doProxy(req, res);
  return true;
};

ProxyHandler.prototype.doProxy = function(req, res) {
  // rewrite location header
  wrapRewriteLocation(req, res, this.proxy);

  // hook response
  wrapResponse(req, res, this.config.port);

  // pass to http-proxy
  log.debug("process: %s", req.url);
  this.proxy.proxyRequest(req, res);
  return true;
};

ProxyHandler.prototype.onError = function(req, res, err) {
  if (err.status === 404) {
    // If file not found on local dir, retrieve from remote server
    log.debug("%s: not found on local. load from remote.", req.url);
    this.doProxy(req, res);
  } else {
    // unknown error
    // (ref) connect/lib/proto.js

    // default to 500
    if (res.statusCode < 400) { res.statusCode = 500; }

    // respect err.status
    if (err.status) { res.statusCode = err.status; }

    // gets a basic error message
    var msg = err.stack || err.toString();
    log.error('Failed to read from local: %s, %s', this.req.url, msg);

    if (res.headerSent) { return req.socket.destroy(); }
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', Buffer.byteLength(msg));
    if ('HEAD' === req.method) { return res.end(); }
    res.end(msg);
  }
};

module.exports = ProxyHandler;
