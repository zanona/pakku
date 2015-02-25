/*global require, module, console, process*/
/*eslint no-console:0*/
module.exports = function(index, buildDir) {
    'use strict';
   //process.on('uncaughtException', onError);

    var cache = {},
        queue = [],
        path = require('path'),
        log  = require('./lib/log'),
        min = {
            html: require('./min/html'),
            css: require('./min/css'),
            js: require('./min/js'),
            img: require('./min/img')
        },
        version = require('./lib/version'),
        replace = require('./lib/replacer')(cache),
        parser = require('./lib/parser'),
        build = require('./lib/build')(buildDir);

    process.chdir(path.dirname(index));
    index = path.basename(index || 'index.html');

    function checkQueue(file) {
        return queue.filter(function (item) {
            return item.name === file.name;
        }).length;
    }

    function onError(e) {
        log.error('[%s] %s', e.filename, e.message);
        if (Object.keys(e).length) {
            log.error(e);
        }
    }

    function onFilesCached() {
        var t = { all: [], docs: [], build: [], html: [], css: [], js: [], img: [], other: [] };

        Object.keys(cache).forEach(function (key) {
            var file = cache[key];
            t[file.type].push(file);
            if (file.type !== 'img') { t.docs.push(file); }
            t.all.push(file);
            if (!file.inline && !file.skip) { t.build.push(file); }
        });

        log.info('VERSIONING FILES…');
        version(t.all)
            .tap(function  () { log.info('EXPANDING CSS…'); })
            .then(function () { return replace(t.css); })
            .tap(function  () { log.info('MINIFYING CSS…'); })
            .then(min.css)
            .tap(function  () { log.info('EXPANDING JS…'); })
            .then(function () { return replace(t.js); })
            .tap(function  () { log.info('MINIFYING JS…'); })
            .then(min.js)
            .tap(function  () { log.info('EXPANDING HTML…'); })
            .then(function () { return replace(t.html); })
            .tap(function  () { log.info('MINIFYING HTML…'); })
            .then(min.html)
            .tap(function  () { log.info('COMPRESSING IMAGES…'); })
            .then(function () { return t.img; })
            .then(min.img)
            .tap(function  () { log.info('SAVING FILES…'); })
            .then(function () { return build(t.build); })
            .then(function () { log.success('PROCESS FINISHED'); })
            .catch(onError);
    }

    function onResourceFound(file) {
        if (cache[file.name]) { return; }
        if (file.done) {
            cache[file.name] = file;
            log.success('CACHED %s', file.name);
        } else if (!checkQueue(file)) {
            queue.push(file);
        }
    }

    function onFileComplete() {
        if (queue.length) {
            var next = queue.shift();
            parser.parse(next);
        } else {
            onFilesCached();
        }
    }

    function onFileError(e, file) {
        log.warn('[%s] %s, skipping…', file.name, e.message);
        onFileComplete();
    }

    parser
        .on('resource', onResourceFound)
        .on('ready', onFileComplete)
        .on('error', onFileError)
        .parse({name: index, type: 'html'});
};
