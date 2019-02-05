---
layout: default
---
# LiveReloadX

![Edit & Reload](images/title.png)

Edit files, and browsers are reloaded automatically.

_LiveReloadX_ is a command line tool based on [LiveReload 2.X](http://livereload.com/) source code. LiveReloadX is:

* easy to install (Windows, Mac and Linux are supported)
* easy to run (Completely free of charge)
* written with simple and readable source code


## How does this work?

![Diagram](images/how.png)

  1. Type `livereloadx path/to/dir` on your command line, then LiveReloadX starts:
     * watching `path/to/dir`
     * running as a web server on port `35729` which serves `livereload.js` and acts as a WebSocket server.
  2. When a browser load `livereload.js`, it connects to the LiveReloadX server using WebSocket.
  3. If you modify files under `path/to/dir`, the server tells all clients to reload by themselves.
     * When the modified file is CSS or images, the file is updated dynamically without reloading the browser.

If you're not familliar with a command line interface, we recommend the [official version of LiveReload 2](http://livereload.com/) which has GUI,


## Install

1. Download and install [Node.js](http://nodejs.org/)
2. Run `npm install -g livereloadx`
3. Choose how to embed a JavaScript snippet (see the next section for details)


## Embed a JavaScript snippet

You have to embed a JavaScript snippet in HTML pages to enable live reloading.

Choose one of the following methods to embed the JavaScript snippet.

   * Add manually.
   * Install the [browser extensions](http://livereload.com/extensions/) (Safari, Chrome and Firefox only).
   * Use static mode
   * Use proxy mode


### Add manually

![manually](images/manual.png)

Add the following snippet to your HTML files manually. If you use an HTML template framework, add to HTML template files.

```html
<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
':35729/livereload.js?snipver=2"></' + 'script>')</script>
```

### Install the browser extensions

![extensions](images/extension.png)

Install the browser extensions from [How do I install and use the browser extensions? – LiveReload Help & Support](http://feedback.livereload.com/knowledgebase/articles/86242-how-do-i-install-and-use-the-browser-extensions-). Safari, Chrome and Firefox on PC is supported.

Enable these extensions  by clicking the LiveReload toolbar button, then the JavaScript snippet is automatically added to the current page.


### Use static mode

![extensions](images/static.png)

If your site is static (not generated dynamically), this method would be useful.

In order to enable static mode, run with `-s` or `--static` option.

```bash
$ livereloadx -s [-p 35729] [path/to/dir]
```

In static mode, LiveReloadX works as a **static web server** whose document root is `path/to/dir`. An access to `http://localhost:35729/foo/` refers to `path/to/dir/foo/index.html`. What's more, LiveReloadX automatically adds the JavaScript snippet to an HTML document.


### Use proxy mode

![extensions](images/proxy.png)

If you don't want to edit HTML and install the browser extension and your site is dynamic, this option would be useful.

In order to enable proxy mode, run with `-y http://example.com/` or `--proxy http://example.com/` option.

```
$ livereloadx -y http://example.com/ [-p 35729] [-l] [path/to/dir]
```

In proxy mode, LiveReloadX works as a **reverse proxy server** that retrieves resources from `http://example.com/`. For example, an access to `http://localhost:35729/foo/` are forwarded to `http://example.com/foo/`, and then, the resources are returned to the client. What's more, LiveReloadX automatically adds the JavaScript snippet to an HTML document.

If `-l` or `--prefer-local` flag is enabled, LiveReloadX prefers local files to remote resources. For example, when LiveReloadX get an access to `http://localhost:35729/foo/`, it first checks `path/to/dir/foo/index.html`. If it exists, LiveReloadX returns its content, otherwise, LiveReloadX retrieves the content from `http://example.com/foo/`.


## Usage

```
$ livereloadx [-s | -y] [-l] [-p 35927]  [path/to/dir]

  Usage: livereloadx [options] [dir]

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    --exclude <pattern>  exclude file matching pattern
    --include <pattern>  don't exclude file matching pattern
    -p, --port <port>    change wait port
    -l, --prefer-local   return a local file if it exists (proxy mode only)
    -s, --static         enable static server mode
    -v, --verbose        enable verbose log
    -y, --proxy <url>    enable proxy server mode
    -C, --no-liveCSS     disable liveCSS
    -I, --no-liveImg     disable liveImg
    --delay <ms>         delay livereload after milliseconds when file change detected
```


## Run as a Grunt Task

_LiveReloadX_ also works as a [Grunt](http://gruntjs.com/) task. Although [grunt-contrib-watch](https://github.com/gruntjs/grunt-contrib-watch) supports LiveReload, it supports only "add manually" method and "browser extension" method. With _LiveReloadX_, you can use "static mode" and "proxy mode".

### How to Start

1. Setup Grunt environment by following [Getting started - Grunt: The JavaScript Task Runner](http://gruntjs.com/getting-started).
2. Install LiveReloadX with the command `npm install livereloadx --save-dev`.
3. Edit `Gruntfile.js`. Here is a sample.

```javascript
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    livereloadx: {
      static: true,
      dir: 'public'
    }
  });

  grunt.loadNpmTasks('livereloadx');
  grunt.registerTask('default', ['livereloadx']);
};
```

For a more complex example, see [`Gruntfile.js` of this site](https://github.com/nitoyon/livereloadx/blob/gh-pages/Gruntfile.js)


### Setting Grunt Task

On the previous example, we initialized the _LiveReloadX_ task with `static` and `dir` properties. 

Here is the list of options available.

| Name       | Type    | Default | Detail                                             |
|------------|---------|---------|----------------------------------------------------|
|dir         |string   |`"."`    |Watch target directory.                             |
|port        |number   |`35729`  |Change wait port (static mode or proxy mode only).  |
|filter      |object   |`{...}`  |Files to be watched. (described later) |
|prefer-local|boolean  |`false`  |Return a local file if it exists (proxy mode only). |
|static      |boolean  |`false`  |Enable static server mode.                          |
|verbose     |boolean  |`false`  |Enable verbose log.                                 |
|proxy       |string   |`false`  |enable proxy server mode. <url> must be specified.  |
|liveCSS     |boolean  |`true`   |Enable or disable liveCSS.                          |
|liveImg     |boolean  |`true`   |Enable or disable liveImg.                          |

#### filter option

`filter` options should be an array of object which has `type` and `pattern` property. `type` property should be either `'include'` or `'exclude'`. `pattern` property is a pattern string. Filters is evaluated like an rsync.

The default rules are as follows:

```javascript
  filter: [
    {type: 'exclude', pattern: '.{git,svn}/'},
    {type: 'include', pattern: '*/'},
    {type: 'include', pattern: '*.{html,shtml,tmpl,xml,css,js,json,jpeg,jpg,gif,png,ico,cgi,php,py,pl,pm,rb}'},
    {type: 'exclude', pattern: '*'}
  ],
```

This means:

  * `.git` and `.svn` directories are ignored.
  * All directories are included, (we checks recursively).
  * The files which has `html`, `shtml`, ... extensions are watched.
  * The files which don't meet the above rules are ignored.

If you specify `filter` option, these default rules are overwritten.


#### Examples

Run as normal mode (embed snippet or browser extension)

```javascript
    livereloadx: {
      dir: 'public'
    }
```

Run as static mode.

```javascript
    livereloadx: {
      static: true,
      dir: 'public'
    }
```


Run as proxy mode.

```javascript
    livereloadx: {
      proxy: "http://example.com/path/",
      'prefer-local': true,
      dir: 'public'
    }
```

Specify filters.

```javascript
    livereloadx: {
      dir: 'public',
      filter: [
        { type: 'include', pattern: '*' }
      ]
    }
```


License
-------

This code is released under the MIT license.
