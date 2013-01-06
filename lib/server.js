(function() {
	"use strict";

	var http = require('http')
	  , url = require('url')
	  , ws = require('websocket.io')
	  , fs = require('fs')
	  , Watcher = require('./watcher');

	function Server(config, watcher) {
		this.config = require('./config').setDefaultValue(config);

		this.watcher = watcher || new Watcher();
	}
	Server.prototype = {
		init: function() {
			var server = http.createServer(function(request, response) {
				if (url.parse(request.url).pathname == "/livereload.js") {
					console.log("livereload requested");
					response.writeHead(200, { 'Content-Type': 'text/javascript' });
					response.write(fs.readFileSync(__dirname + '/../contrib/livereload.js'));
				} else {
					response.writeHead(404);
					response.write("File not found");
					console.log("404 " + request.url);
				}
				response.end();
			}).listen(this.config.port);

			var webSocket = ws.attach(server);
			this.clients = [];
			var self = this;
			webSocket.on('connection', function(socket) {
				console.log("on connection");
				self.clients.push(socket);
				socket.on('message', function(message) {
					console.log("on message: " + message);
					var msg = JSON.parse(message);
					if (msg.command == 'hello') {
						socket.send(JSON.stringify({
							command: 'hello',
							protocols: [
								'http://livereload.com/protocols/official-7'
							],
							serverName: 'livereloadx'
						}));
					}
				});
				socket.on('close', function() {
					console.log("on close");
					var i = self.clients.indexOf(socket);
					if (i >= 0) {
						self.clients.splice(i, 1);
					}
				});
			});
		},

		notifyFileChange: function(file) {
			var msg = JSON.stringify({
				command: 'reload',
				path: file,
				liveCSS: this.config.liveCSS,
				liveImg: this.config.liveImg
			});

			this.clients.forEach(function(socket) {
				socket.send(msg);
			});
		},

		watch: function() {
			this.watcher.watch(this.config.dir);

			var self = this;
			this.watcher.on('change', function(file) {
				self.notifyFileChange(file);
			});
		}
	};

	exports.Server = Server;
	exports.startServer = function(config) {
		var server = new Server(config || {});
		server.init();
		return server;
	}
})();
