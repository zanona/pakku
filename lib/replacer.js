/*global module, require*/
module.exports = function (cache) {

    var Q = require('q');

    function run(file) {
        if (file.type === 'img' || !file.contents) { return; }
        var re = /!@(f?){([\w\.\-\/]+?)}/g;

        file.contents = file.contents.replace(re, function (m, link, name) {
            if (!cache[name]) { return name; }
            if (link) { return cache[name].vname || cache[name].name; }
            run(cache[name]);
            return cache[name].contents
                .replace(/[\s\n]{2,}/g, '')
                .replace(/\n/g, '\\n')
                .replace(/([^\\])(['"])/g, '\\$2');
        });

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
