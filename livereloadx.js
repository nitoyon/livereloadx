"use strict";

var http = require('http');
var url = require('url');
var ws = require('websocket.io');
var fs = require('fs');
var fsmonitor = require('fsmonitor');
var path = require('path');

if (process.argv.length < 3) {
	console.error("invalid arguments");
	process.exit(1);
}
var dir = process.argv[2];

var server = http.createServer(function(request, response) {
	if (url.parse(request.url).pathname == "/livereload.js") {
		console.log("livereload requested");
		response.writeHead(200, { 'Content-Type': 'text/javascript' });
		response.write(fs.readFileSync(__dirname + '/contrib/livereload.js'));
	} else {
		response.writeHead(404);
		response.write("File not found");
		console.log("404 " + request.url);
	}
	response.end();
}).listen(35729);

var webSocket = ws.attach(server);
var clients = [];
webSocket.on('connection', function(socket) {
	console.log("on connection");
	clients.push(socket);
	socket.on('message', function(message) {
		console.log("on message: " + message);
		var msg = JSON.parse(message);
		if (msg.command == 'hello') {
			socket.send(JSON.stringify({
				command: 'hello',
				protocols: [
					'http://livereload.com/protocols/official-7'
				],
				serverName: 'LiveReload 2x'
			}));
		}
	});
	socket.on('close', function() {
		console.log("on close");
		clients.push(socket);
	});
});


fsmonitor.watch(dir, null, function(change) {
	console.log("Change: " + change);
	change.modifiedFiles.concat(change.addedFiles).forEach(function(file) {
		console.info("notify file '%s' has changed", file);
		clients.forEach(function(socket) {
			socket.send(JSON.stringify({
				command: 'reload',
				path: file,
				liveCSS: true
			}));
		});
	});
});

console.info("Server started");