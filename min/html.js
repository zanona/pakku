module.exports = function (files) {
    'use strict';
    var Q = require('q');

    function run(file) {
        var contents = file.contents;
        // FIX compressing lines in
        // <input name=test
        //        type=text
        //        require>
        // Will compact to <input name=testtype=textrequire>
        contents = contents
                .replace(/([\s\n])+/g, '$1');

        file.contents = contents;
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
