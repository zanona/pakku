/*eslint-env node*/
module.exports = (function () {
    var fs = require('fs'),
        Q = require('q'),
        requirejs = require('requirejs'),
        uglifyjs = require('uglify-js'),
        exec = require('child_process').exec;

    function uglify(data, cb) {
       var result = uglifyjs.minify(data, {
           fromString: true,
           output: { inline_script: true, beautify: false }
       });
       setTimeout(function () { cb(result.code); });
    }

    function rjs(data, cb) {
        //THIS HAS TO HAPPEN THROUGH STREAMS INSTEAD FS
        var tmpIn = parseInt(process.hrtime().join('')).toString(36) + '.js',
            options = {
                baseUrl: 'vendor',
                name: 'almond',
                include: ['main'],
                insertRequire: ['main'],
                paths: { main: '../' + tmpIn.replace(/\.js$/, '') },
                wrap: true,
                //out: file,
                //onBuildWrite: manageImports,
                onModuleBundleComplete: function (d) {
                    d = fs.readFileSync(d.path).toString();
                    fs.unlinkSync(tmpIn);
                    uglify(d, cb);
                }
            };

        exec('mktemp -t XXX', function (e, o) {
            if (e) { throw e; }
            options.out = o;
            fs.writeFileSync(tmpIn, data);
            requirejs.optimize(options);
        });
    }

    function run(file) {
        var df = Q.defer();

        function cb(script) {
            file.contents = script;
            df.resolve(file);
        }

        if (file.name.match(/\.js$/)) {
            if (file.amd) {
                rjs(file.contents, cb);
            } else {
                uglify(file.contents, cb);
            }
        } else {
            console.warn('WARNING [%s]: Only JS files supported for now. Skipping…', file.name);
        }

        return df.promise;
    }

    function main(f) {
        var d = Q.defer();
        if (!f.map) { f = [f]; }
        Q.all(f.map(run)).then(d.resolve);
        return d.promise;
    }

    return main;
}());
