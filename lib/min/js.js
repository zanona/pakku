const path = require('path')
const stream = require('stream')
const browserify = require('browserify')
const babel = require('babel-core')
const babelTransform = require('babelify')
const babelEnv = require('babel-preset-env')
const babelStage3 = require('babel-preset-stage-3')
const uglifyjs = require('uglify-js')
const log = require('../utils').log

function getOffsetContent (file) {
  // adjust inline script contents with the line number it was located
  if (!file.inline) return file.contents
  // using zero-base index to match with source map spec
  const fmtLine = file.line ? file.line - 1 : 0
  const fmtCol = file.column ? file.column - 1 : 0
  return Array(fmtLine).fill('\n').join('') +
    Array(fmtCol).fill(' ').join('') +
    file.contents
}
function replaceNodeEnvVars (file) {
  const nodePattern = /process.env(?:\.(.+?)\b|\[(["'])(.+?)\2\])/g
  file.contents = file.contents.replace(nodePattern, (m, v1, _, v3) => {
    return `'${process.env[v1 || v3] || ''}'`
  })
  return Promise.resolve(file)
}
function splitContentAndSourceMap (content) {
  const split = content.toString().split('//# sourceMappingURL=data:application/json;charset=utf-8;base64,')
  return {
    contents: split[0],
    sourceMap: Buffer.from(split[1] || '', 'base64').toString()
  }
}
function rerouteSourceMap (file) {
  if (!file.sourceMap) return file
  const map = file.sourceMap = JSON.parse(file.sourceMap)
  const base = file.parentHref || file.name

  map.sources = map.sources.map((source) => {
    if (source === '_stream_0.js') return base
    if (source.match('node_modules')) return source.split(/(?=node_modules)/)[1]
    if (file.hasImports) return path.join(path.dirname(base), source)
    return base
  })
  return file
}
function minifyJSON (file) {
  return new Promise((resolve, reject) => {
    try {
      file.contents = file.contents.replace(/\n+/g, '').replace(/(\s)+/g, '$1')
      resolve(file)
    } catch (e) {
      reject(e)
    }
  })
}
function brwsrfy (file) {
  return new Promise((resolve, reject) => {
    const s = new stream.Readable()
    const filePath = path.parse(process.cwd() + '/' + file.name)
    s.push(file.contents)
    s.push(null)
    // send alterred file stream to browserify
    browserify(s, { basedir: filePath.dir, debug: true })
      .transform(babelTransform, {
        filename: file.name,
        presets: [babelEnv, babelStage3],
        global: true
      })
      .bundle(function (error, buffer) {
        if (error) return reject(error)
        const result = splitContentAndSourceMap(buffer)
        file.contents = result.contents
        file.sourceMap = result.sourceMap
        resolve(file)
      })
  })
}
function babelify (file) {
  return new Promise((resolve, reject) => {
    try {
      const transpiled = babel
        .transform(getOffsetContent(file), {
          filename: file.name,
          presets: [babelEnv, babelStage3],
          sourceMaps: true
        })
      file.sourceMap = transpiled.map
      file.contents = transpiled.code
      resolve(file)
    } catch (e) {
      reject(e)
    }
  })
}
function uglify (file) {
  var options = {
    output: { inline_script: true, beautify: false },
    sourceMap: {
      content: file.sourceMap
      /*
       * need to set the `url` param based on cmd option
       * such as --source-map-expose=true, which will then
       * print //# sourceMapURL at the end of scripts
       */
      //, url: `sourcemaps/${file.name}.map`
    }
  }

  return new Promise((resolve, reject) => {
    const minified = uglifyjs.minify(file.contents, options)
    if (minified.error) return reject(minified.error)
    file.sourceMap = minified.map
    file.contents = minified.code
    resolve(file)
  })
}
function run (file) {
  const isDependency = file.name.match(/vendor|bower_components|node_modules/)
  // this is likely to fail to to text in strings
  // also lacking export.foo = fn
  const isModule = file.contents.match(/module.exports/)
  if (isDependency || isModule) return file
  if (file.ext === 'json') return minifyJSON(file, log.error.bind(file))
  if (file.ext === 'js') {
    const transpile = file.hasImports ? brwsrfy(file) : babelify(file)
    return transpile.then(replaceNodeEnvVars)
                    .then(uglify)
                    .then(rerouteSourceMap)
                    .catch(log.error.bind(file))
  }

  log.warn(`[${file.name}]`, 'Only javascript files are supported', 'Skipping…')
  return file
}
module.exports = (files) => Promise.all(files.map(run))
