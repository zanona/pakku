/*global module, require, console*/
/*eslint no-console:0*/
module.exports = (function () {
    var Q = require('q'),
        Imagemin = require('imagemin');

    function run(file) {
        var df = Q.defer(),
            imagemin = new Imagemin();

        imagemin.src(file.contents).run(function (e, files) {
            var compression = 100 - Math.ceil((files[0].contents.length * 100) / file.contents.length);
            file.contents = files[0].contents;
            console.log('COMPRESSED'.green.bold + ' %s in %s%', file.name, compression);
            df.resolve(df);
        });

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
