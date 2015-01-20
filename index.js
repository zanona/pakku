function main(d, v, flags, index) {
    'use strict';
    /*global require, module, console, process*/
    /*eslint no-console:0*/

    var path = require('path'),
        exec = require('exec-sync'),
        colors = v.require('colors'),
        cache = {},
        queue = [],
        min = {
            css: require('./min/css'),
            js: require('./min/js')
        },
        replace = require('./lib/replacer')(cache),
        parser = require('./lib/parser');

    process.chdir(path.dirname(index));
    index = path.basename(index || 'index.html');

    function versionize(file) {
        var version = exec('git log -1 --pretty=format:%h -- ' + file.name);
        if (version) { file.vname = file.name.replace(/(\.\w+$)/, '-' + version + '$1'); }
        file.vname = file.name;
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

        //min.js(cache['bootstrap.js']).on('ready', function (js) { console.log(js); });
        //min.css(cache['main.less']).on('ready', function (css) { console.log(css); });

        replace(t.css)
            .then(min.css)
            .then(function () { return replace(t.js); })
            .then(min.js)
            .then(function () { return replace(t.html); })
            .then(function () {
                console.log(t.build);
                console.log('PROCESS FINISHED'.rainbow);
            })
            .catch(d.reject);
    }

    function onResource(file) {
        if (cache[file.name]) { return; }
        if (file.done) {
            cache[file.name] = file;
            console.log('CACHED'.green.bold + ' ' + file.name);
        } else if (queue.indexOf(file.name) === -1) {
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
        .on('resource', onResource)
        .on('ready', onFileComplete)
        .on('error', onFileError)
        .parse({name: index, type: 'html'});
}
module.exports = {
    summary: 'Build production version of project',
    run: main
};
