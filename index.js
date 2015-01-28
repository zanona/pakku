/*global require, module, console, process*/
/*eslint no-console:0*/
module.exports = function(index, buildDir) {
    'use strict';
   //process.on('uncaughtException', onError);

    var cache = {},
        queue = [],
        path = require('path'),
        colors = require('colors'),
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
        console.log('ERROR'.red.bold, ((e.filename ? '[' + e.filename + '] ' : '') + e.message).red);
        if (Object.keys(e).length) {
            console.log(JSON.stringify(e, null, 2).red);
        }
    }

    function onFilesCached() {
        var t = { all: [], docs: [], build: [], html: [], css: [], js: [], img: [] };

        Object.keys(cache).forEach(function (key) {
            var file = cache[key];
            t[file.type].push(file);
            if (file.type !== 'img') { t.docs.push(file); }
            t.all.push(file);
            if (!file.inline && !file.skip) { t.build.push(file); }
        });

        console.log('VERSIONING FILES…'.blue);
        version(t.all)
            .tap(function  () { console.log('EXPANDING CSS…'.blue); })
            .then(function () { return replace(t.css); })
            .tap(function  () { console.log('MINIFYING CSS…'.blue); })
            .then(min.css)
            .tap(function  () { console.log('EXPANDING JS…'.blue); })
            .then(function () { return replace(t.js); })
            .tap(function  () { console.log('MINIFYING JS…'.blue); })
            .then(min.js)
            .tap(function  () { console.log('EXPANDING HTML…'.blue); })
            .then(function () { return replace(t.html); })
            .tap(function  () { console.log('MINIFYING HTML…'.blue); })
            .then(min.html)
            .tap(function  () { console.log('COMPRESSING IMAGES…'.blue); })
            .then(function () { return t.img; })
            .then(min.img)
            .tap(function  () { console.log('SAVING FILES…'.blue); })
            .then(function () { return build(t.build); })
            .then(function () { console.log('PROCESS FINISHED'.rainbow); })
            .catch(onError);
    }

    function onResourceFound(file) {
        if (cache[file.name]) { return; }
        if (file.done) {
            cache[file.name] = file;
            console.log('CACHED'.green.bold + ' ' + file.name);
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
        console.warn(colors.yellow('WARNING'.bold + ' [' + file.name + '] ' +  e.message + ', skipping…'));
        onFileComplete();
    }

    parser
        .on('resource', onResourceFound)
        .on('ready', onFileComplete)
        .on('error', onFileError)
        .parse({name: index, type: 'html'});
};
