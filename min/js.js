/*eslint indent:4*/
module.exports = function (files) {
    'use strict';
    var fs = require('fs'),
        path = require('path'),
        vm = require('vm'),
        Q = require('q'),
        browserify     = require('browserify'),
        babel          = require('babel-core'),
        babelTransform = require('babelify'),
        esPresets      = require('babel-preset-env'),
        uglifyjs       =  require('uglify-js'),
        regenerator    = require('regenerator'),
        log = require('../utils').log;

    function replaceNodeEnvVars(file) {
        const nodePattern = /process.env(?:\.(.+?)\b|\[(["'])(.+?)\2\])/g;
        file.contents = file.contents.replace(nodePattern, (m,v1,_,v3) => {
            return `'${process.env[v1 || v3] || ''}'`;
        });
        return Promise.resolve(file);
    }
    function extractInlineSourceMap(contents) {
        const sourceMap = contents.split('//# sourceMappingURL=data:application/json;charset:utf-8;base64,')[1];
        return Buffer(sourceMap || '', 'base64').toString();
    }
    function rerouteSourceMap(file) {
      if (!file.sourceMap) return file;
      const map = file.sourceMap = JSON.parse(file.sourceMap),
            base = file.parentHref || file.name;

      map.sources = map.sources.map((source) => {
        if (source === '_stream_0.js') return base;
        if (source.match('node_modules')) return source.split(/(?=node_modules)/)[1];
        if (file.hasImports) return path.join(path.dirname(base), source);
        return base;
      });
      return file;
    }
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
            output: {
              inline_script: true,
              beautify: false
            }
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
            var s = new require('stream').Readable(),
                path = require('path').parse(process.cwd() + '/' + file.name);
            s.push(file.contents);
            s.push(null);
            //send alterred file stream to browserify
            browserify(s, { basedir: path.dir, debug: true })
                .transform(regenerator, {global: true})
                .transform(babelTransform, {
                    filename: file.name,
                    presets: [esPresets],
                    global: true
                })
                .bundle(function (error, buffer) {
                    if (error) { return reject(error); }
                    file.contents = buffer.toString();
                    file.sourceMap = extractInlineSourceMap(file.contents);
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
                        presets: [esPresets]
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
        if (file.name.match(/vendor|bower_components|node_modules/)) {
            return file;
        }

        if (file.name.match(/\.js$/)) {
            if (file.contents.match(/module.exports/)) return file;
            let transpile;
            if (file.hasImports) {
                transpile = brwsrfy(file);
            } else {
                transpile = regenerate(file).then(babelify);
            }
            return transpile.then(replaceNodeEnvVars)
                            .then(uglify)
                            .then(rerouteSourceMap)
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
