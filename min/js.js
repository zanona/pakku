/*eslint indent:4*/
module.exports = function (files) {
    'use strict';
    var fs = require('fs'),
        vm = require('vm'),
        Q = require('q'),
        browserify = require('browserify'),
        babel      = require('babel-core'),
        babelTransform = require('babelify'),
        es2015     = require('babel-preset-es2015'),
        uglifyjs =  require('uglify-js'),
        regenerator = require('regenerator'),
        log = require('../utils').log;

    function minifyJSON(file) {
        return new Promise((resolve, reject) => {
            try {
                file.contents = file.contents
                    .replace(/\n+/g, '')
                    .replace(/(\s)+/g, '$1');
                resolve(file);
            } catch (e) {
                reject(e);
            }
        });
    }
    function uglify(file) {
        var options = {
            fromString: true,
            output: { inline_script: true, beautify: false }
        };

        return new Promise((resolve, reject) => {
            try {
                file.contents = uglifyjs.minify(file.contents, options).code;
                resolve(file);
            } catch (e) {
                reject(e);
            }
        });
    }
    function brwsrfy(file) {
        return new Promise((resolve, reject) => {
            const importMatch = /^(?:\s*)?import\b|\brequire\(/gm;
            if (!file.contents.match(importMatch)) { return resolve(file); }
            var s = new require('stream').Readable(),
                path = require('path').parse(process.cwd() + '/' + file.name);
            s.push(file.contents);
            s.push(null);
            //send alterred file stream to browserify
            browserify(s, { basedir: path.dir })
                .transform(regenerator)
                .transform(babelTransform, {
                    filename: file.name,
                    presets: [es2015]
                })
                .bundle(function (error, buffer) {
                    if (error) { return reject(error); }
                    file.contents = buffer.toString();
                    resolve(file);
                });
        });
    }
    function babelify(file) {
        return new Promise((resolve, reject) => {
            try {
                file.contents = babel
                    .transform(file.contents, {
                        filename: file.name,
                        presets: [es2015]
                    }).code;
                resolve(file);
            } catch (e) {
                reject(e);
            }
        });
    }
    function regenerate(file) {
        return new Promise((resolve, reject) => {
            try {
                file.contents = regenerator.compile(file.contents).code;
                resolve(file);
            } catch (e) {
                reject(e);
            }
        });
    }

    function run(file) {

        function formatError(e) {
            e.filename = file.name;
            e.stack = file.contents;
            throw e;
        }
        //skip dependency files
        if (file.name.match(/bower_components|node_modules/)) {
            return file;
        }

        if (file.name.match(/\.js$/)) {
            return regenerate(file)
                .then(babelify)
                .then(brwsrfy)
                .then(uglify)
                .catch(formatError);
        } else if (file.name.match(/\.(json|ld\+json)$/)) {
            return minifyJSON(file, formatError);
        } else {
            log.warn(
                '[' + file.name + ']',
                'Only javascript files supported for now.',
                'Skipping…'
            );
            return file;
        }
    }

    function main() {
        var d = Q.defer();
        if (!files.map) { files = [files]; }
        Q.all(files.map(run)).then(d.resolve, d.reject);
        return d.promise;
    }

    return main();
};
