exports.setContent = function (content) {
    'use strict';
    return content;
};

exports.setResource = function (file) {
    'use strict';
    var resolve = require('../utils/resolve');
    file = resolve(file.href, './');
    return file;
};
