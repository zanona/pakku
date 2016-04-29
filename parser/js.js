exports.setContent = function (content) { return content; };
exports.setResource = function (file, parent) {
    var resolve = require('../utils/resolve');
    if (!parent.name.match(/-html-/)) { file = resolve(file.href, './'); }
    return file;
};
