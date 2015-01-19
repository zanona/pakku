function build(d, v, flags, buildDir) {
    /*global require, module*/

    buildDir = (buildDir || 'build') + '/';

    var include = flags['--include'] || flags['-i'],
        fpath = require('path'),
        requirejs = require('requirejs'),
        colors = v.require('colors'),
        Q = v.require('q'),
        files = {},
        tmpDir,
        dependencies = {};

    function createTmpDir() {
        return v.exec('mktemp -dt XXXXXX').then(function (p) {
            tmpDir =  p.replace(/\n/, '');
            return tmpDir;
        });
    }

    function getAttrs(str) {
        str = (str.match(/<\w+\s?([^>]*)\s?>/) || ['', ''])[1];
        str = str.split(/\s/);
        var attrs = { 'bp-original': str.join(' ') };

        str.forEach(function (p) {
            p = p.split('=');
            attrs[p[0]] = (p[1] || '').replace(/["']/g, '') || true;
        });
        attrs['bp-update'] = function () {
            var r = Object.keys(attrs).map(function (k) {
                if (k.match('bp-')) { return ''; }
                if (attrs[k] === true) { return k; }
                return k + '=' + '"' + attrs[k] + '"';
            }).join(' ').replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ');
            return r;
        };
        return attrs;
    }

    function checkDeps(file, fileDf) {
        var df = Q.defer(),
            deps = [];
        file.deps = file.deps || [];

        function complete() {
            console.log('continuing', file.name);
            df.resolve(file);
            return fileDf.promise;
        }

        file.contents.replace(/\B@([\w-]+\.\w+)\b/g, function (m, dep) {
            console.log('found', dep);
            file.deps.push(dep);
            if (!files[dep] || !files[dep].content) {
               dependencies[dep] = dependencies[dep] || [];
               dependencies[dep].push(file.name);
               deps.push(dep);
            }
        });

        if (deps.length) {
            console.log('still needs', deps);
            files[file.name] = files[file.name] || {};
            files[file.name].continue = complete;
            return df.promise;
        }

        complete();
        return df.promise;
    }

    function updateFileName(file) {
        return v.exec('git log -1 --pretty=format:%h -- ' + 'src/' + file.name).then(function (p) {
            file.vName = file.name
                .replace(/\.(\w+)$/, (p ? ('-' + p) : '') + '.$1')
                .replace(/\.less$/, '.css')
                .replace(/\//g, '-');
            return file;
        });
    }

    function buildFile(file) {
        var df = Q.defer(),
            cts;

        function manageImports(moduleName, path, contents) {
            path = fpath.relative('src', path);
            if (file.deps && file.deps.length) {
                var pattern = new RegExp('@(' + file.deps.join('|') + ')', 'gi');
                contents = contents.replace(pattern, function (m, f) {
                    var c = files[f].contents
                         .replace(/[\s\n]{2,}/g, '')
                         .replace(/\n/g, '\\n')
                         .replace(/'/g, '\\\'')
                         .replace(/"/g, '\\"');
                    return c;
                });
            }
            return contents;
        }

        function uglifyJS(data) {
            var uglify = v.require('uglify-js'),
                jsp = uglify.parser,
                pro = uglify.uglify,
                ast = jsp.parse(v.read(data.path));

            ast = pro.ast_mangle(ast, { mangle: true });
            ast = pro.ast_squeeze(ast, { no_warnings: true });
            ast = pro.ast_squeeze_more(ast);
            file.contents = pro.gen_code(ast, {inline_script: true, beautify: false});
            files[file.name] = file;
            df.resolve(file);
        }

        function cssify(src) {
            v.shell('n.lessc -x src/' + src).then(function (data) {
                file.contents = data;
                files[file.name] = file;
                df.resolve(file);
            });
        }

        if (file.name.match('.js')) {
            if (!file.amd) {
                cts = manageImports(null, fpath.resolve('./src', file.name), file.contents);
                v.write(tmpDir + '/' + file.vName, cts);
                uglifyJS({path: tmpDir + '/' + file.vName});
            } else {
                requirejs.optimize({
                    baseUrl: 'src/vendor',
                    name: 'almond',
                    include: ['main'],
                    insertRequire: ['main'],
                    paths: { main: '../' + file.name.replace('.js', '') },
                    out: tmpDir + '/' + file.name,
                    wrap: true,
                    onBuildWrite: manageImports,
                    onModuleBundleComplete: uglifyJS
                });
            }
        }
        if (file.name.match('.less')) { cssify(file.name); }

        return df.promise;
    }

    function saveBuildDir(fls) {
        console.log('save build dir', fls);
        v.rm(buildDir);
        v.mkdir(buildDir);
        Object.keys(files).forEach(function (k) {
            if (files[k].build) {
                v.write(buildDir + files[k].vName, files[k].contents);
            }
        });
        if (include) {
            Q.all(include.split(',').map(function (path) {
                console.log('including %s to build directory', path);
                return v.exec('cp -r ' + path + ' ' + buildDir + '/' + fpath.relative('src', path));
            }))
            .then(function () {
                d.resolve(colors.rainbow('Project successfully built to ' + buildDir));
            })
            .catch(d.reject);
        } else {
            d.resolve(colors.rainbow('Project successfully built to ' + buildDir));
        }
    }

    function handleFile(filename, amd) {
        var df = Q.defer(),
            file = files[filename] || { name: filename, amd: !!amd };

        if (file.contents) { df.resolve(file); return df.promise; }
        file.contents = v.read('src/' + file.name);

        checkDeps(file, df)
            .then(updateFileName)
            .then(buildFile)
            .then(df.resolve)
            .fail(df.reject);
        return df.promise;
    }

    function handleTag(tag) {
        var df = Q.defer(),
            type = tag.match(/<([^\s\>]*)/)[1],
            attrs = getAttrs(tag),
            source = type === 'link' ? 'href' : 'src',
            file = attrs['data-main'] || attrs[source];

        if (attrs['data-dev']) { df.resolve(''); return df.promise; }
        if (!file) {
            tag = tag.replace('/less', '');
            var match = tag.match(/([\w\.-]+\.less)/g);
            // find and replace less src in files in case no
            // source is provided
            if (match) {
                Q.all(match.map(function (m) {
                    return handleFile(m).then(function (info) {
                        info.build = true;
                        tag = tag.replace(m, info.vName);
                    });
                }))
                .then(function () { df.resolve(tag); })
                .fail(d.reject);
            } else {
                df.resolve(tag);
            }
            return df.promise;
        }
        if (!/\.\w+$/.test(file)) { file += '.js';}

        if (attrs['data-inline']) {
            handleFile(file, attrs['data-main']).then(function (info) {
                delete attrs['data-inline'];
                delete attrs[source];
                delete attrs['data-main'];
                delete attrs.rel;
                if (type === 'link') { type = 'style'; }
                var nAttrs = attrs['bp-update'](),
                    nTag = '<' + type + (nAttrs ? ' ' + nAttrs : '') + '>' + info.contents + '</' + type + '>';
                df.resolve(nTag);
                return df.promise;
            });
            return df.promise;
        }

        if (attrs['data-main']) {
            attrs[source] = file;
            //delete attrs['data-main'];
        }

        if (attrs[source]) {
            //skip src having :// or // (urls) or not html,js,less
            if (attrs[source].match(/:?\/\//) || !attrs[source].match(/\.(js|less|html)/)) {
                df.resolve(tag);
                return df.promise;
            }
            handleFile(file, attrs['data-main']).then(function (info) {
                attrs[source] = info.vName;
                delete attrs['data-main'];
                // file becomes needed for build
                // as soon as it is defined as source
                files[file].build = true;
                var nAttrs = attrs['bp-update'](),
                    nTag = '<' + type + (nAttrs ? ' ' + nAttrs : '') + '>';

                if (type === 'link') {
                    nTag = nTag.replace('/less', '').replace('.less', '.css');
                }
                if (type === 'script') { nTag += '</script>'; }
                df.resolve(nTag);
            });
        }
        return df.promise;
    }

    function onHTML(file) {
        var df = Q.defer(),
            tdf = Q.defer(),
            contents = v.read(file),
            tags = contents.match(/<(script|link)[^>]*>(?:([^<]+)?<\/\1>)?/gi);

        function handleTags(tags) {
            var first = (tags || []).shift();
            if (!first) { tdf.resolve(contents); return tdf.promise; }

            handleTag(first)
                .then(function (tagReplacement) {
                    //console.log('handle tag done'.green, first, 'for'.red, tagReplacement);
                    contents = contents.replace(first, tagReplacement);
                    return handleTags(tags);
                })
                .fail(tdf.reject);

            return tdf.promise;
        }

        handleTags(tags).then(function (newContent) {
            file = require('path').relative('src', file);
            files[file] = { vName: file, contents: newContent, build: true };
            return file;
        }).then(function (fileName) {
            var ds = dependencies[fileName] || [];
            if (ds.length) {
                Q.all(ds.map(function (d) {
                    console.log('waiting', fileName, dependencies);
                    return files[d].continue();
                })).then(function () {
                    console.log('all deps finished');
                    df.resolve(fileName);
                });
            } else {
                console.log('clear', fileName);
                df.resolve(fileName);
            }
        });

        return df.promise;
    }

   createTmpDir().then(function () {
        Q
        .all(v.getFilteredFileList('src', /\.html$/, null, /vendor/).map(onHTML))
        .then(saveBuildDir);
    });
}

module.exports = {
    summary: 'Build production version of project',
    run: build
};
