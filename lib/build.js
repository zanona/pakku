var Q        = require('q'),
    fs       = require('fs'),
    execSync = require('child_process').execSync,
    path     = require('path'),
    log      = require('../utils').log;

module.exports = function (bdir) {
    var dir;

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

    function main(files) {
        var d = Q.defer();
        if (!files.map) { files = [files]; }

        try {
            fs.readdirSync(dir);
            execSync('rm -rf ' + dir);
        } catch (_) {
            log.info('…');
        }

        fs.mkdirSync(dir);
        Q.all(files.map(run)).then(d.resolve, d.reject);
        return d.promise;
    }

    //DO NOT FALLBACK BDIR DUE SAFETY REASONS
    if (!bdir) { throw new Error('No Build dir specified'); }
    dir = path.resolve(bdir);
    return main;
};
