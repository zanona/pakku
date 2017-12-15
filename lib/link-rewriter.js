const fileMatch = /!@(f?)\{([\w.\-+/@]+?)\}/g
const envMatch = /\$ENV\[['"]?([\w.\-/@]+?)['"]?\]/g

let cache = []

function adjustPath (file) {
  const targetSrc = file.type === 'html' ? file.name : file.vname
  return `/${targetSrc}`
}
function replaceFileTags (parent, match, link, name) {
  const file = cache.find((f) => f.name === name)
  if (!file) return name
  if (link) return adjustPath(file)

  run(file)

  let newContent = file.contents

  // support for @filename.ext inside js files
  if (parent.type === 'js' && file.type.match(/html|css/)) {
    // escape //, /replace, \n, ", ' for \\$1
    newContent = newContent.replace(/([\\/\n"'])/g, '\\$1')
  }
  return newContent
}
function replaceEnvTags (m, v) { return process.env[v] || '' }

function run (file) {
  if (!file.contents || !file.contents.replace) return file
  file.contents = file.contents.replace(fileMatch, replaceFileTags.bind(void 0, file))
  file.contents = file.contents.replace(envMatch, replaceEnvTags)
  return file
}

module.exports = (resourceFiles, allFiles) => {
  cache = allFiles
  return Promise.all(resourceFiles.map(run))
}
