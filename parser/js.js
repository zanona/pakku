exports.setContent = function (content) {
    'use strict';
    return content;
};

exports.setResource = function (file, parent) {
    'use strict';
    var resolve = require('../utils/resolve');
    if (!parent.name.match(/-html-/)) {
        file = resolve(file.href, './');
    }
    return file;
};
