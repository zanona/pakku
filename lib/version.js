module.exports = function (files) {
    'use strict';
    var Q = require('q'),
        fs  = require('fs'),
        exec = require('child_process').exec;

    function run(file) {
        var df = Q.defer();

        function apply(e, o) {
            /*jslint unparam:true*/
            if (o && o.mtime && new Date(o.mtime)) {
                o = new Date(o.mtime).valueOf().toString(36);
            }

            file.vname = file.name.replace(/\//g, '-');
            if (file.type !== 'html' || !file.name.match(/\.html$/)) {
                file.vname = file
                    .vname
                    .replace(/(\.\w+$)/, o ? ('-' + o + '$1') : '$1');
            }
            if (file.type === 'css') {
                file.vname = file
                    .vname
                    .replace(/\.(less|scss|sass)$/, '.css');
            }
            df.resolve(file);
        }

        exec(
            'git log -1 --pretty=format:%h -- ' + file.name,
            function (e, o) {
                if (e || !o) { return fs.stat(file.name, apply); }
                apply(null, o);
            }
        );

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
