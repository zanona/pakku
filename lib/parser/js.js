const path    = require('path'),
      resolve = require('../utils/resolve');

exports.setContent = function (file) {
  /*
   * replace require or import statements module names ending with
   * .js or .json so these won't get renamed by the general parser
   */
  const requireMatch = /require\((['"])(.*?)(?:\.js|\.json)?\1\)/gm,
        importMatch  = /import((?:.*?from)? +)(["'])(.+?)(?:\.js|\.json)?\2/gm,
        content      = file.contents;

  if (requireMatch.test(content) || importMatch.test(content)) {
    file.hasImports = true;
  }

  return content.replace(requireMatch, 'require($1$2$1)')
                .replace(importMatch,  'import$1$2$3$2');
};
exports.setResource = function (file, parent) {
  if (path.extname(parent.parentHref || '') !== '.html') {
    file = resolve(file.name);
  }
  return file;
};
