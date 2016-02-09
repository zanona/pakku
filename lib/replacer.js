/*jslint node:true*/
module.exports = function (cache) {
    'use strict';

    var Q = require('q');

    function perFile(origin, target) {
        if (origin.type === 'html') {
            return target.vname;
        }
        if (target.type === 'img') {
            return target.vname;
        }
        if (origin.type === 'js') {
            return target.vname;
        }
        return target.vname;
    }

    function run(file) {
        if (file.type === 'img' || !file.contents) { return; }
        var re = /!@(f?)\{([\w\.\-\/@]+?)\}/g,
            env = /\$ENV\[['"]?([\w\.\-\/@]+?)['"]?\]/g;

        file.contents = file.contents.replace(re, function (m, link, name) {
            /*jslint unparam:true*/
            var expanded = cache[name], newContent;
            if (!expanded) { return name; }
            if (link) { return perFile(file, expanded); }

            run(expanded);
            newContent  = expanded.contents;

            if (file.type === 'js' && expanded.type.match(/html|css/)) {
                newContent = newContent
                    .replace(/([\s\n])+/g, '$1')
                    .replace(/\n/g, '\\n')
                    .replace(/<\/script/g, '<\\/script')
                    .replace(/\\/g, '\\\\')
                    .replace(/(["'])/g, '\\$1')
                    .replace(/\\\\(["'])/g, '\\$1');
            }

            return newContent;

        });

        file.contents = file.contents.replace(env, function (m, v) {
            /*jslint unparam:true*/
            return process.env[v];
        });

        return file;
    }

    function main(files) {
        var d = Q.defer();
        if (!files.map) { files = [files]; }
        Q.all(files.map(run)).then(d.resolve, d.reject);
        return d.promise;
    }

    return main;
};
