/*jslint node:true*/
module.exports = function (files) {
    'use strict';
    var fs = require('fs'),
        vm = require('vm'),
        Q = require('q'),
        browserify = require('browserify'),
        requirejs = require('requirejs'),
        uglifyjs =  require('uglify-js'),
        almondPath = require.resolve('almond'),
        log = require('../utils').log;

    function jsonify(data, cb) {
        cb(null, data.replace(/\n+/g, '').replace(/(\s+)/, '$1'));
    }

    function uglify(data, cb) {
        var options = {
                fromString: true,
                output: { inline_script: true, beautify: false }
            },
            result;

        setTimeout(function () {
            try {
                result = uglifyjs.minify(data, options);
                cb(null, result.code);
            } catch (e) {
                cb(e);
            }
        });
    }

    function findRequireJSConfig(content, cb) {
        var configSearch = /require(?:js)?\.config(\([\s\S]+?\))/,
            config = content.match(configSearch);

        if (config && config[1]) {
            try {
                return vm.runInNewContext(config[1]);
            } catch (e) {  cb(e); }
        }
        return {};
    }

    function rjs(file, cb) {
        /*jslint stupid:true*/
        var almond = fs.readFileSync(almondPath).toString(),
            options = findRequireJSConfig(file.contents, cb);

        options.name = 'almond';
        options.include = ['main'];
        options.insertRequire = ['main'];
        options.rawText = {'almond': almond, 'main': file.contents};
        options.wrap = true;
        options.optimize = 'none';
        options.out = function (text) { uglify(text, cb); };

        requirejs.optimize(options, null, function (error) {
            cb(new Error(error));
        });
    }

    function brwsrfy(file, cb) {
        browserify(file.name).bundle(function (error, buffer) {
            if (error) { return cb(new Error(error)); }
            uglify(buffer.toString(), cb);
        });
    }

    function run(file) {
        var df = Q.defer();

        function cb(e, script) {
            if (e) {
                e.filename = file.name;
                e.stack = file.contents;
                return df.reject(e);
            }
            file.contents = script;
            df.resolve(file);
        }

        if (file.name.match(/\.js$/)) {
            if (file.amd) {
                rjs(file, cb);
            } else if (file.contents.match(/\brequire\(/)) {
                brwsrfy(file, cb);
            } else {
                uglify(file.contents, cb);
            }
        } else if (file.name.match(/\.json$/)) {
            jsonify(file.contents, cb);
        } else {
            log.warn(
                '[' + file.name + ']',
                'Only javascript files supported for now.',
                'Skipping…'
            );
            cb(null, file.contents);
        }

        return df.promise;
    }

    function main() {
        var d = Q.defer();
        if (!files.map) { files = [files]; }
        Q.all(files.map(run)).then(d.resolve, d.reject);
        return d.promise;
    }

    return main();
};
