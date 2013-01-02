node-livereloadx
================

An implementation of the LiveReload 2 server in Node.js.

* Easy to install
* Easy to run
* Easy to read code
* Completely free of charge

If you're not familliar with a command line interface, [official version of LiveReload 2](http://livereload.com/) is strongly recommended.


Install
-------

Install [Node.js](http://nodejs.org/).

Install `node-livereloadx`.

Install dependant modules.

```
$ cd path/to/node-livereloadx
$ npm install
```

Choose one of following method to embed JavaScript snippet.

  * Embed JavaScript snippet in your HTML files.
  * Install [browser extensions](http://feedback.livereload.com/knowledgebase/articles/86242-how-do-i-install-and-use-the-browser-extensions-) (Safari, Chrome and Firefox only).

JavaScript snippet:

```html
<script>if (location.hostname == "localhost") { document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=2"></' + 'script>') }</script>
```


Run
---

Start server on your command line.

```
$ node livereloadx.js path/to/dir
```

Open the site. If you chose to use browser extensions, enable LiveReload by clicking the LiveReload toolbar button.

Now, when you modify any files under `path/to/dir`, your browser is automatically updated. Especially, the modified files are CSS or images, these files are updated dynamically without reloading your browser.


Related Projects
----------------

* [livereload](https://github.com/livereload/): Official version.
* [josh/node-livereload](https://github.com/josh/node-livereload): Reimplementation of LiveReload 1.X server in node.js
* [clonn/simple-livereload](https://github.com/clonn/simple-livereload): Another reimplementation of LiveReload 1.X server in node.js
* [usualoma/node-livereload-hub](https://github.com/usualoma/node-livereload-hub): Yet another reimplementation of LiveReload 1.X server (Reload via the HTTP request)
* [guard/guard-livereload](https://github.com/guard/guard-livereload): Ruby implementation running with guard.


License
-------

his code is released under the MIT license.