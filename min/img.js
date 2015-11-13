/*jslint node:true*/
module.exports = function (files) {
    'use strict';
    var Q = require('q'),
        Imagemin = require('imagemin'),
        log = require('../utils').log;

    function run(file) {
        var df = Q.defer(),
            imagemin = new Imagemin(),
            originalSize = file.contents.length;

        imagemin.src(file.contents).run(function (e, files) {
            if (e) {
                log.error(e);
                log.error('[%s] ERROR on compression, skipping', file.name);
                return df.resolve(df);
                //return df.reject(e);
            }

            var compressedSize = files[0].contents.length,
                compression = 100
                    - Math.ceil((compressedSize * 100) / originalSize);

            file.contents = files[0].contents;
            if (compression) {
                log.info('[%s] compressed in %s%', file.name, compression);
            }
            df.resolve(df);
        });

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
