const url  = require('url'),
      path = require('path'),
      ft   = require('./filetype');

/**
 * Resolve path for file
 * @param {string} [href=./] - current file path
 * @param {string} [parentSrc=./] - parent file path
 * @returns {object} location
*/
function main(href = './', parentSrc = './') {

  const parentDir = path.dirname(parentSrc);
  let adjustedHref = href;

  /* if path is / assume html and fallback to index file */
  if (adjustedHref === '/') adjustedHref = '/index.html';

  /* if path starts with / prepend process.cwd */
  if (adjustedHref.match(/^\/\w/)) {
    adjustedHref = process.cwd() + adjustedHref;
    adjustedHref = path.relative(parentDir, adjustedHref);
  }

  const resolvedPath = url.resolveObject(parentSrc, adjustedHref); //eslint-disable-line one-var
  return {
    name:     resolvedPath.pathname,
    external: !!(resolvedPath.slashes || resolvedPath.protocol),
    type:     ft(adjustedHref),
    href:     adjustedHref,
    query:    (resolvedPath.search || '') + (resolvedPath.hash || '')
  };
}

module.exports = main;
