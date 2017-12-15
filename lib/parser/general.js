const fs = require('fs')
const utils = require('../utils')
const parser = {
  html: require('./html'),
  css: require('./css'),
  js: require('./js')
}
const resolve = utils.resolve
const whitelist = new RegExp(utils.interpolate(
  /(@)?([\\\w\-/:.@]+)\.(%s)\b(?=[^=(])/,
  'jpg|png|gif|svg|ico|less|css|js|json|ld\\+json|html|xml|eot|ttf|woff|otf|pdf|vcf|md|markdown|mdown'
), 'ig')

function sanitizeSrc (src) {
  // Remove expansion flag and backslases
  return src.replace(/^@/, '').replace(/\\/g, '')
}

function onURL (href, expand) {
  const {file, emitter} = this
  const fileParser = parser[file.type]
  const parentSrc = file.ext === 'js' ? '' : file.name
  let found = resolve(sanitizeSrc(href), parentSrc)

  if (found.external) return found.name
  if (fileParser) found = fileParser.setResource(found, file)
  if (expand) found.inline = true

  /* if file exists, tokenize it otherwise re-apply original name */
  try {
    if (!found.contents) fs.openSync(found.name, 'r')
    emitter.emit('resource', found)
    const f = found.inline ? '' : 'f'
    return `!@${f}{${found.name}}`
  } catch (e) {
    emitter.emit('error', e, file)
    return href
  }
}

module.exports = function (file, emitter) {
  const fileParser = parser[file.type]
  if (fileParser) file.contents = fileParser.setContent(file)
  file.contents = file.contents.replace(whitelist, onURL.bind({file, emitter}))
  return file
}
