/*eslint indent:[1,4]*/
var Q = require('q');
module.exports = function (cache) {
    function perFile(origin, target) {
        if (target.type === 'html') { return target.name; }
        if (origin.type === 'html') { return target.vname; }
        if (target.type === 'img')  { return target.vname; }
        if (origin.type === 'js')   { return target.vname; }
        return target.vname;
    }
    function run(file) {
        if (file.type === 'img' || !file.contents) { return; }
        var re = /!@(f?)\{([\w\.\-\+\/@]+?)\}/g,
            env = /\$ENV\[['"]?([\w\.\-\/@]+?)['"]?\]/g;
        file.contents = file.contents.replace(re, function (m, link, name) {
            var expanded = cache[name], newContent;
            if (!expanded) { return name; }
            if (link) { return perFile(file, expanded); }

            run(expanded);
            newContent  = expanded.contents;

            if (file.type === 'js' && expanded.type.match(/html|css/)) {
                newContent = newContent
                    .replace(/([\s\n])+/g  , '$1')
                    .replace(/\\/g         , '\\\\')
                    .replace(/(["'])/g     , '\\$1')
                    .replace(/\\\\(["'])/g , '\\$1');
            }
            return newContent;
        });
        file.contents = file.contents.replace(env, function (m, v) {
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
