/*eslint indent:4*/
module.exports = function (files) {
    'use strict';
    var Q = require('q'),
        log = require('../utils').log,
        minify = require('html-minifier').minify;

    function run(file) {
        try {
            file.contents = minify(file.contents, {
                collapseWhitespace: true,
                preserveLineBreaks: true,
                removeComments: true,
                removeAttributeQuotes: true
            });
        } catch (e) {
            log.error('ERROR: Minifying HTML on', file.name);
        }
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
