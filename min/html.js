module.exports = function (files) {
    'use strict';
    var Q = require('q'),
        minify = require('html-minifier').minify;

    function run(file) {
        file.contents = minify(file.contents, {
            removeComments: true,
            removeAttributeQuotes: true
        });
        return file;
    }

    function main() {
        var d = Q.defer();
        if (!files.map) { files = [files]; }
        Q.all(files.map(run)).then(d.resolve, d.reject);
        return d.promise;
    }

    return main();
};
