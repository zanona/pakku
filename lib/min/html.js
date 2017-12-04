const minify = require('html-minifier').minify,
      log    = require('../utils').log;

function run(file) {
  try {
    file.contents = minify(file.contents, {
      collapseWhitespace:    true,
      preserveLineBreaks:    true,
      removeComments:        true,
      removeAttributeQuotes: true
    });
  } catch (e) {
    log.warn('[%s] Error minifying HTML: %s', file.name, e.message.split('\n')[0]);
  }
  return file;
}
module.exports = (files) => Promise.all(files.map(run));
