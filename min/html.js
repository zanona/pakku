/*global module, require*/
module.exports = (function () {
    var Q = require('q');

    function run(file) {
        var contents = file.contents;
        // FIX compressing lines in
        // <input name=test
        //        type=text
        //        require>
        // Will compact to <input name=testtype=textrequire>
        //contents = contents
        //    .replace(/(\n|\s){2,}/g, '');

        file.contents = contents;
        return file;
    }

    function main(f) {
        var d = Q.defer();
        if (!f.map) { f = [f]; }
        Q.all(f.map(run)).then(d.resolve).catch(d.reject);
        return d.promise;
    }

    return main;
}());
