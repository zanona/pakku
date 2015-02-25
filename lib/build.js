/*global module, require, console*/
/*eslint no-console:0*/
module.exports = (function () {
    var Q = require('q'),
        fs = require('fs'),
        exec = require('child_process').exec,
        path = require('path'),
        log = require('../lib/log'),
        dir;

    function run(file) {
        try {
            var p = path.resolve(dir, file.vname || file.name);
            fs.writeFileSync(p, file.contents);
            log.info('SAVING: %s', file.name);
            return file;
        } catch (e) {
            e.filename = file.name;
            throw e;
        }
    }

    function main(f) {
        var d = Q.defer();
        if (!f.map) { f = [f]; }

        function start() {
            fs.mkdirSync(dir);
            Q.all(f.map(run)).then(d.resolve).catch(d.reject);
        }

        if (fs.existsSync(dir)) {
            exec('rm -r ' + dir, function (e) { return e ? d.reject(e) : start(); });
        } else { start(); }

        return d.promise;
    }

    function init (bdir) {
        //DO NOT FALLBACK BDIR DUE SAFETY REASONS
        if (!bdir) { throw new Error('No Build dir specified'); }
        dir = path.resolve(bdir);
        return main;
    }

    return init;
}());
