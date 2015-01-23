/*global module, require, console, setTimeout, process*/
/*eslint no-console: 0*/
module.exports = (function () {
    var fs = require('fs'),
        Q = require('q'),
        requirejs = require('requirejs'),
        uglifyjs =  require('uglify-js'),
        almondPath = require.resolve('almond');

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
           } catch (e) { cb(e); }
       });
    }

    function rjs(data, cb) {
        var almond = fs.readFileSync(almondPath).toString(),
            options = {
                baseUrl: process.AMD_PATH || './',
                name: 'almond',
                include: ['main'],
                insertRequire: ['main'],
                rawText: {'almond': almond, 'main': data},
                wrap: true,
                optimize: 'none',
                out: function (text) { uglify(text, cb); }
            };

        requirejs.optimize(options, null, function (error) {
            cb(new Error(error));
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
                rjs(file.contents, cb);
            } else {
                uglify(file.contents, cb);
            }
        } else {
            console.warn('WARNING [%s]: Only JS files supported for now. Skipping…', file.name);
        }

        return df.promise;
    }

    function main(f) {
        var d = Q.defer();
        if (!f.map) { f = [f]; }
        Q.all(f.map(run)).then(d.resolve).catch(d.reject);
        return d.promise;
    }

    return main;
}());
