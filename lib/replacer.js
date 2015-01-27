/*global module, require*/
module.exports = function (cache) {

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
        return target.name;
    }

    function run(file) {
        if (file.type === 'img' || !file.contents) { return; }
        var re = /!@(f?){([\w\.\-\/]+?)}/g;

        file.contents = file.contents.replace(re, function (m, link, name) {
            var expanded = cache[name], newContent;
            if (!expanded) { return name; }
            if (link) { return perFile(file, expanded); }
            run(expanded);
            newContent  = expanded.contents;
            if (file.type === 'js' && expanded.type === 'html') {
                newContent = newContent
                .replace(/([\s\n])+/g, '$1')
                .replace(/\n/g, '\\n')
                .replace(/<\/script/g, '<\\/script')
                .replace(/(["'])/g, '\\$1')
                .replace(/\\\\(["'])/g, '\\$1');
            }
            return newContent;
        }).replace(/stylesheet\/less/g, 'stylesheet');
        return file;
    }

    function main(f) {
        var d = Q.defer();
        if (!f.map) { f = [f]; }
        Q.all(f.map(run)).then(d.resolve);
        return d.promise;
    }

    return main;
};
