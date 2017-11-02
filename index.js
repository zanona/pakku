module.exports = function (index, buildDir) {
    var options = Array.prototype.slice.call(arguments).slice(2).join(' '),
        cache   = {},
        queue   = [],
        path    = require('path'),
        Q       = require('q'),
        log     = require('./utils').log,
        resolve = require('./utils').resolve,
        min     = require('./min'),
        version = require('./lib/version'),
        replace = require('./lib/replacer')(cache),
        parser  = require('./parser')(),
        build   = require('./lib/build')(buildDir),
        sourcemaps = require('./lib/sourcemaps');

    process.chdir(path.dirname(index));
    index = path.basename(index || 'index.html');

    function checkQueue(file) {
        return queue.filter(function (item) {
            return item.name === file.name;
        }).length;
    }

    function onError(e) {
        console.log(e);
        log.error('[%s] %s', e.filename, e.message);
        if (Object.keys(e).length) { log.error(e); }
        process.exit(1);
    }

    function onFilesCached() {
        var t = {
            all:   [],
            docs:  [],
            build: [],
            html:  [],
            css:   [],
            js:    [],
            img:   [],
            txt:   [],
            map:   [],
            other: []
        };

        Object.keys(cache).forEach(function (key) {
            var file = cache[key];
            t[file.type].push(file);
            if (file.type !== 'img') { t.docs.push(file); }
            t.all.push(file);
        });

        Q.resolve()
            .then(function (a) {
                if (!options.match('--no-versioning')) {
                    return Q.resolve(a)
                        .thenResolve('VERSIONING FILES').tap(log.info)
                        .thenResolve(t.all).then(version);
                }
                return Q.resolve(a)
                    .thenResolve('SKIPPING FILE VERSIONING').tap(log.info);
            })

            .thenResolve('BEAUTIFYING YOUR STYLES…').tap(log.info)
            .thenResolve(t.css).then(replace).then(min.css)

            .thenResolve('CRANKING YOUR SCRIPTS…').tap(log.info)
            .thenResolve(t.js).then(replace).then(min.js)

            .thenResolve('BOOKING YOUR PAGES…').tap(log.info)
            .thenResolve(t.html).then(replace).then(min.html)

            .then((a) => {
              if (!options.match('--sourcemaps')) return a;
              return Q.resolve()
                .thenResolve('GENERATING SOURCE MAPS…').tap(log.info)
                .thenResolve(t.all).then(sourcemaps).then((files) => {
                  console.log(files.map((f) => f.name));
                  t.all = t.all.concat(...files);
                  t.map = t.map.concat(...files);
                  return files;
                });
            })

            .then(function (a) {
                if (!options.match('--no-compress-images')) {
                    return Q.resolve(a)
                        .thenResolve('REVEALING YOUR PICTURES…').tap(log.info)
                        .thenResolve(t.img).then(min.img);
                }

                return Q.resolve(a)
                    .thenResolve('SKIPPING IMAGE COMPRESSION').tap(log.info);
            })

            .thenResolve('STORING YOUR GOODIES…').tap(log.info)
            .then(() => {
              t.all.forEach((file) => {
                if (!file.inline && !file.skip) t.build.push(file);
              });
            })
            .thenResolve(t.build).then(build)

            .thenResolve('MAGIC FINISHED').tap(log.success)
            .catch(onError);
    }

    function onResourceFound(file) {
        if (cache[file.name]) { return; }
        if (file.done) {
            cache[file.name] = file;
            log.success('CACHED %s', file.name);
        } else if (!checkQueue(file)) {
            queue.push(file);
        }
    }

    function onFileComplete() {
        if (queue.length) {
            var next = queue.shift();
            parser.parse(next);
        } else {
            onFilesCached();
        }
    }

    function onFileError(e, file) {
        log.warn('[%s] %s, skipping…', file.name, e.message);
        if (checkQueue(file)) { onFileComplete(); }
    }

    parser
        .on('resource', onResourceFound)
        .on('ready', onFileComplete)
        .on('error', onFileError)
        .parse(resolve(index));
};
