/*global module, require, console*/
/*eslint no-console:0*/
module.exports = (function () {
    var Q = require('q'),
        less = require('less'),
        CleanCSS = require('clean-css');

    function cleanCSS(data, cb) {
        new CleanCSS({keepSpecialComments: 0}).minify(data, function (e, output) {
            cb(output.styles);
        });
    }

    function lessify(data, cb) {
        less.render(data, function (e, output) { cleanCSS(output.css, cb); });
    }

    function run(file) {
        var df = Q.defer();

        function cb(css) { file.contents = css; df.resolve(file); }

        if (file.name.match(/\.less$/)) {
            lessify(file.contents, cb);
        } else if (file.name.match(/\.css$/)) {
            cleanCSS(file.contents, cb);
        } else {
            console.warn('WARNING [%s]: Only LESS and CSS files supported for now. Skipping…'.yellow, file.name);
        }

        return df.promise;
    }

    function main(f) {
        var d = Q.defer();
        if (!f.map) { f = [f]; }
        Q.all(f.map(run)).then(d.resolve);
        return d.promise;
    }

    return main;
}());
