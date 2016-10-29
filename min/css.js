/*eslint indent:[1,4]*/
module.exports = function (files) {
    'use strict';
    var Q = require('q'),
        less = require('less'),
        autoprefixer = require('autoprefixer')({
            browsers: ['last 2 versions', 'safari >= 8', 'ie >= 11']
        }),
        flexfix = require('postcss-flexbugs-fixes'),
        postcss = require('postcss'),
        CleanCSS = require('clean-css');

    function autoprefix(file) {
        return new Promise((resolve, reject) => {
            postcss([flexfix, autoprefixer]).process(file.contents)
            .then(function (output) {
                file.contents = output.css;
                resolve(file);
            }).catch(reject);
        });
    }
    function cleanCSS(file) {
        return new Promise((resolve, reject) => {
            var ps = new CleanCSS({ keepSpecialComments: 0 });
            try {
                file.contents = ps.minify(file.contents).styles;
                resolve(file);
            } catch (e) {
                reject(e);
            }
        });
    }
    function lessify(file) {
        return new Promise((resolve, reject) => {
            less.render(file.contents, function (e, output) {
                if (e) { return reject(e); }
                file.contents = output.css;
                resolve(file);
            });
        });
    }

    function run(file) {
        function parseError(e) {
            if (e) {
                e.filename = file.name;
                e.stack = file.contents;
                throw e;
            }
        }

        if (file.skip) { return file; }

        if (file.name.match(/\.less$/)) {
            return lessify(file)
                .then(autoprefix)
                .then(cleanCSS)
                .catch(parseError);
        } else if (file.name.match(/\.css$/)) {
            return autoprefix(file)
                .then(cleanCSS)
                .catch(parseError);
        } else {
            console.warn(
                '[' + file.name + ']',
                'Only LESS and CSS files supported for now.',
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
