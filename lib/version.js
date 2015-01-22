/*global module, require*/
module.exports = (function () {
    var Q = require('q'),
        exec = require('child_process').exec;

    function run(file) {
        var df = Q.defer();
        exec('git log -1 --pretty=format:%h -- ' + file.name, function (e, o) {
            file.vname = file.name .replace(/\//g, '-');
            if (file.type !== 'html') {
                file.vname = file.vname.replace(/(\.\w+$)/, o ? ('-' + o + '$1') : '$1');
            }
            if (file.type === 'css') {
                file.vname = file.vname.replace(/\.(less|scss|sass)$/, '.css');
            }
            df.resolve(file);
        });
        return df.promise;
    }

    function main(f) {
        var d = Q.defer();
        if (!f.map) { f = [f]; }
        Q.all(f.map(run)).then(d.resolve).catch(d.reject);
        return d.promise;
    }

    return main;
}());
