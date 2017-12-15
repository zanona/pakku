/**
  * mock-fs doesn't support aliasing real files
  * This script allows caching those in memory previously to
  * importing mock-fs
  * source: https://github.com/tschaub/mock-fs/issues/62#issuecomment-179854354
  */
const fs = require('fs')
const path = require('path')

/**
 * loads all files from specific directory and assign their contents
 * to a dictionary object
 * @param {string} dir to lookup files
 * @param {object} obj to expand file contents
 * @returns {void}
 */
function attachFilesFromDirToObj (dir, obj) {
  fs.readdirSync(dir).forEach(function (basename) {
    const filename = path.join(dir, basename)
    const stat = fs.statSync(filename)
    if (stat.isDirectory()) {
      process(obj, dir, basename)
    } else {
      obj[basename] = readFile(filename)
    }
  })
}
/**
 * Function to traverse the directory tree
 * @param {Object} obj  - model of fs
 * @param {String} root - root dirname
 * @param {String} dir  - dirname
 * @returns {void}
 */
function process (obj, root, dir) {
  const dirname = dir ? path.join(root, dir) : root
  const name = dir || root
  const additionObj = obj[name] = {}
  attachFilesFromDirToObj(dirname, additionObj)
}
/**
 * Helper for reading file.
 * For text files calls a function to delete /r symbols
 * @param {String} filename - filename
 * @returns {*} file contents
 */
function readFile (filename) {
  const ext = path.extname(filename)
  if (['.gif', '.png', '.jpg', '.jpeg', '.svg'].indexOf(ext) !== -1) {
    return fs.readFileSync(filename)
  }
  return fs.readFileSync(filename, 'utf-8')
}
module.exports = {
  /**
   * Duplicate of the real file system for passed dir, used for mock fs for tests
   * @param {String} dir – filename of directory (full path to directory)
   * @returns {Object} - object with duplicating fs
   */
  duplicateFSInMemory: function (dir) {
    const obj = {}
    attachFilesFromDirToObj(dir, obj)
    return obj
  },

  /**
   * 1. Remove all css comments, because they going to remove after @import stylus
   * 2. Remove all spaces and white lines
   * @param {String} contents - file contents
   * @returns {String} - normalized file contents
   */
  normalizeFile: function (contents) {
    return contents
      .replace(/(\r\n|\n|\r)/gm, '') // remove line breaks
      .replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '') // spaces
      .trim()
  },
  readFile: readFile
}
