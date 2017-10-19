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
        build   = require('./lib/build')(buildDir);

    process.chdir(path.dirname(index));
    index = path.basename(index || 'index.html');

    function checkQueue(file) {
        return queue.filter(function (item) {
            return item.name === file.name;
        }).length;
    }

    function onError(e) {
        log.error('[%s] %s', e.filename, e.message);
        if (Object.keys(e).length) { log.error(e); }
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
            other: []
        };

        Object.keys(cache).forEach(function (key) {
            var file = cache[key];
            t[file.type].push(file);
            if (file.type !== 'img') { t.docs.push(file); }
            t.all.push(file);
            if (!file.inline && !file.skip) { t.build.push(file); }
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

            .then(() => {
              /*
               * 1. get all js/source maps
               * 2. if `inline=true`, merge all from same parent by order of ln
               * 3. adjust `sources` on source map reflecting href/parentHref
               * 4. create vFiles (*.map) and push to t.build with dir prefix
               *    set in --source-map option or default
               * example source map file:
               * {version: 3, sources: ['index.html'], mappings: '…'}
               */
              function clone(obj) { return Object.assign({}, obj); }
              function getParentDetails(js) {
                const source = js.sourceMap.sources[0];
                return t.html
                  .filter((h)  => {
                    return h.includes && h.includes.indexOf(source) >= 0
                        || h.href === source;
                  }).map((h) => {
                    // line and col on source mapp offset are based
                    // on the minified/final file, not the original
                    const lines  = h.contents.substr(0, h.contents.indexOf(js.contents)).split('\n'),
                          line   = lines.length - 1,
                          column = lines.pop().length - 1;
                    return {file: h.href, script: js.name, line, column};
                  });
              }
              function analyseScript(js) {
                js.sourceMap = JSON.parse(js.sourceMap);
                if (js.inline) {
                  if (js.parentHref) js.sourceMap.sources = [js.parentHref];
                  return getParentDetails(js);
                } else {
                  return [{file: js.href, script: js.name}];
                }
              }
              function flatten (p, c) {
                p = p.concat(...c);
                return p;
              }
              function groupByFile (p, c) {
                p[c.file] = p[c.file] || [];
                p[c.file].push(c);
                p[c.file].sort((a, b) => a.line > b.line);
                return p;
              }
              function expandHTMLSourceContent(source) {
                return require('fs').readFileSync(source).toString();
              }
              function generateSourceMap(fileHref, sources) {
                return {
                  version: 3,
                  file: fileHref,
                  sections: sources.map((f) => {
                    const map = clone(cache[f.script].sourceMap);
                    map.sourcesContent = map.sources.map(expandHTMLSourceContent);
                    map.sources = map.sources.map((source) => {
                      return `/${source}${source.endsWith('.js') ? '' : '.js'}`;
                    });
                    return {
                      offset: { line: f.line || 0, column: f.column || 0 },
                      map
                    };
                  })
                };
              }
              const r = t.js.map(analyseScript)
                         .reduce(flatten)
                         .reduce(groupByFile, {}),
                    maps = Object.keys(r).map((k) => generateSourceMap(k, r[k]));
              maps
                .filter((m) => {
                  // only build flagged files (present in t.build)
                  return t.build.indexOf(cache[m.file]) >= 0;
                })
                .forEach((m) => {
                  const name     = `sourcemaps/${m.file.replace(/\//g, '-')}.map`,
                        contents = JSON.stringify(m, null, 2),
                        file     = cache[m.file],
                        ref      = `\n//# sourceMappingURL=${name}\n`;
                  if (file.type === 'html') file.contents += `\n<script>${ref}<\/script>`;
                  if (file.type === 'js')   file.contents += ref;
                  t.build.push({name, contents});
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
