/*global module, require, console, process*/
/*eslint no-console:0*/
module.exports = (function () {
    var fs = require('fs'),
        Q = require('q'),
        requirejs = require('requirejs'),
        uglifyjs = require('uglify-js'),
        exec = require('exec-sync');

    function uglify(data, cb) {
       var result = uglifyjs.minify(data, {fromString: true, 'inline-script': true, beautify: false});
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
                //out: tmpOut,
                wrap: true,
                //onBuildWrite: manageImports,
                onModuleBundleComplete: function (d) {
                    d = fs.readFileSync(d.path).toString();
                    fs.unlinkSync(tmpIn);
                    uglify(d, cb);
                }
            };

        try {
            options.out = exec('mktemp -t XXXX');
            fs.writeFileSync(tmpIn, data);
            requirejs.optimize(options);
        } catch (e) {
            //THINK ABOUT THIS
            fs.unlinkSync(tmpIn);
            throw e;
        }
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
            console.warn('WARNING [%s]: Only JS files supported for now. Skipping…'.yellow, file.name);
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
