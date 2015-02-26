module.exports = function (files) {
    'use strict';
    var Q = require('q'),
        less = require('less'),
        CleanCSS = require('clean-css');

    function cleanCSS(data, cb) {
        var ps = new CleanCSS({ keepSpecialComments: 0 });
        ps.minify(data, function (e, output) {
            cb(e, output.styles);
        });
    }

    function lessify(data, cb) {
        less.render(data, function (e, output) {
            if (e) { return cb(e); }
            cleanCSS(output.css, cb);
        });
    }

    function run(file) {
        var df = Q.defer();

        function cb(e, css) {
            if (e) {
                e.filename = file.name;
                e.stack = file.contents;
                return df.reject(e);
            }
            file.contents = css;
            df.resolve(file);
        }

        if (file.skip) { return file; }

        if (file.name.match(/\.less$/)) {
            lessify(file.contents, cb);
        } else if (file.name.match(/\.css$/)) {
            cleanCSS(file.contents, cb);
        } else {
            console.warn(
                '[' + file.name + ']',
                'Only LESS and CSS files supported for now.',
                'Skipping…'
            );
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
