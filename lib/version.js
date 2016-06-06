/*eslint indent:[1,4]*/
var Q    = require('q'),
    fs   = require('fs'),
    exec = require('child_process').execSync;

module.exports = function (files) {
    function run(file) {
        var df = Q.defer(),
            cmd;

        function apply(e, o) {
            if (o && o.mtime && new Date(o.mtime)) {
                o = new Date(o.mtime).valueOf().toString(36);
            }

            if (file.type !== 'html' || !file.name.match(/\.html$/)) {
                file.vname = file.name
                    .replace(/\//g, '-')
                    .replace(/(\.\w+$)/, o ? ('-' + o + '$1') : '$1');
            }
            if (file.type === 'css') {
                file.vname = file
                    .vname
                    .replace(/\.(less|scss|sass)$/, '.css');
            }
            df.resolve(file);
        }

        try {
            cmd = exec('git log -1 --pretty=format:%h -- ' + file.name);
            cmd = cmd.toString();
            if (cmd) {
                apply(null, cmd);
            } else {
                throw new Error('hello');
            }
        } catch (e) {
            fs.stat(file.name, apply);
        }

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
