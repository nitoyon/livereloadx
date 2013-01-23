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

### JavaScript snippet

```html
<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
':35729/livereload.js?snipver=2"></' + 'script>')</script>
```


Usage
-----

Start server on your command line.

```
$ livereloadx path/to/dir
```

Open the site. If you chose to use browser extensions, enable LiveReload by clicking the LiveReload toolbar button.

Now, when you modify any files under `path/to/dir`, your browser is automatically updated. Especially, the modified files are CSS or images, these files are updated dynamically without reloading your browser.


### Static mode

Use `-s` or `--static` option to start sever in static mode.

```
livereloadx -s [-p 35729] path/to/dir
```

In static mode, _LiveReloadX_ works as a static web server whose document root is `path/to/dir`. An access to `http://localhost:35729/` refers to `path/to/dir/index.html`. What's more, _LiveReloadX_ automatically add [JavaScript snippet](#javascript-snippet) to HTML file.


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