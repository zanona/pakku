const url      = require('url'),
      path     = require('path'),
      filetype = require('./filetype');

/**
 * Check if src is from remote file (i.e: an URL)
 * @param {string} src - The src attribute of a file
 * @returns {boolean} isRemote
*/
function isRemote(src) { return /^(?:\w+:|\/\/)/.test(src); }

/**
 * Resolve path for file
 * @param {string} src - current file path
 * @param {string} parentSrc - parent file path
 * @returns {object} location
*/
function main(src = '', parentSrc = '') {
  if (isRemote(src)) return { href: src, external: true };

  if (!path.extname(src)) src += '/index.html';
  if (path.isAbsolute(src)) {
    src = './' + src;
  } else {
    src = url.resolve(parentSrc, src);
  }

  src = path.normalize(src);

  const r = {
    name:     src,
    href:     src,
    type:     filetype(src),
    ext:      path.extname(src).replace('.', '')
  };
  return r;
}

module.exports = main;
