/*global module, require, console*/
/*eslint no-console:0*/
module.exports = (function () {
    var Q = require('q'),
        fs = require('fs'),
        exec = require('child_process').exec,
        path = require('path'),
        dir;

    function run(file) {
        var p = path.resolve(dir, file.vname || file.name);
        fs.writeFileSync(p, file.contents);
        console.log('SAVING: %s', file.name);
        return file;
    }

    function main(f) {
        var d = Q.defer();
        if (!f.map) { f = [f]; }
        Q.all(f.map(run)).then(d.resolve).catch(d.reject);
        return d.promise;
    }

    function init (bdir) {
        dir = path.resolve(bdir || 'build');
        exec('rm -r ' + dir, function () { fs.mkdirSync(dir); });
        return main;
    }

    return init;
}());
