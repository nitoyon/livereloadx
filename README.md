LiveReloadX
===========

An implementation of the LiveReload 2 server in Node.js.

* Easy to install
* Easy to run
* Easy to read code
* Completely free of charge

If you're not familliar with a command line interface, [official version of LiveReload 2](http://livereload.com/) is strongly recommended.


Install
-------

1. Install [Node.js](http://nodejs.org/).

2. Install `livereloadx`.
```
$ npm -g install livereloadx
```

3. Choose one of following method to embed JavaScript snippet.
   * Embed [JavaScript snippet](#javascript-snippet) in your HTML files.
   * Install [browser extensions](http://feedback.livereload.com/knowledgebase/articles/86242-how-do-i-install-and-use-the-browser-extensions-) (Safari, Chrome and Firefox only).
   * Run _LiveReloadX_ in [static mode](#static-mode) (Static HTML only).
   * Run _LiveReloadX_ in [proxy mode](#proxy-mode)

### JavaScript snippet

```html
<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
':35729/livereload.js?snipver=2"></' + 'script>')</script>
```


Usage
-----

Start _LiveReloadX_ server.

```
$ livereloadx [path/to/dir]
```

If you chose to use browser extensions, enable LiveReload by clicking the LiveReload toolbar button.

When you open a page with JavaScript snippet, it connects to _LiveReloadX_ server using WebSocket. Now, when you modify any files under `path/to/dir`, your browser is automatically updated. Especially, the modified files are CSS or images, these files are updated dynamically without reloading your browser.


### Static mode

Use `-s` or `--static` option to run _LiveReloadX_ sever in static mode.

```
livereloadx -s [-p 35729] [path/to/dir]
```

In static mode, _LiveReloadX_ works as a static web server whose document root is `path/to/dir`. An access to `http://localhost:35729/` refers to `path/to/dir/index.html`. What's more, _LiveReloadX_ automatically add [JavaScript snippet](#javascript-snippet) to HTML file.


### Proxy mode

Use `-y http://example.com/` or `--proxy http://example.com/` option to run _LiveReloadX_ sever in proxy mode.

```
livereloadx -y http://example.com/ [-p 35729] [-l] [path/to/dir]
```

In proxy mode, _LiveReloadX_ works as a reverse proxy server that retrieves resources from `http://example.com/`. For example, an access to `http://localhost:35729/foo/` are forwarded to `http://example.com/foo/`, and then, the resources are returned to the client. What's more, _LiveReloadX_ automatically add [JavaScript snippet](#javascript-snippet) to HTML content.

If `-l` or `--prefer-local` option is set, _LiveReloadX_ prefers local files to remote resources. For example, when _LiveReloadX_ get an access to `http://localhost:35729/foo/`, it first checks `path/to/dir/foo/index.html`. If the file exists, it returns the content of the file, otherwise, it retrieves the content from `http://example.com/foo/`.


Running tests
-------------

To run tests, install devDependency modules.

```
npm install --dev
```

Run mocha.

```
./node_modules/.bin/mocha
```


Related Projects
----------------

* [livereload](https://github.com/livereload/): Official version.
* [josh/node-livereload](https://github.com/josh/node-livereload), [clonn/simple-livereload](https://github.com/clonn/simple-livereload), [khoomeister/livereloaded](https://github.com/khoomeister/livereloaded): Reimplementation of LiveReload 1.X server in node.js
* [usualoma/node-livereload-hub](https://github.com/usualoma/node-livereload-hub): Yet another reimplementation of LiveReload 1.X server (Reload via the HTTP request)
* [guard/guard-livereload](https://github.com/guard/guard-livereload): Ruby implementation running with guard.


License
-------

This code is released under the MIT license.