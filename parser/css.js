/*jslint node:true*/
var path = require('path');
exports.setContent = function (content) {
    'use strict';
    /*jslint regexp:true*/
    var resolve = require('../utils/resolve'),
        imports = /@import(?: url)?[ \(\'"]+(.+)\b[ \(\'";\)]+/g,
        attrSelectors = /\[(?:src|href)[*|\^?]?=(['"])?(.+?)\1?\]/g;

    content = content.replace(imports, function (m, href) {
        if (!path.extname(href)) { href = href + '.less'; }
        if (resolve(href).external) { return m; }
        return href;
    });

    content = content.replace(attrSelectors, function (m, sep, href) {
        /*jslint unparam:true*/
        if (resolve(href).external || !href.match(/\.\w{3,5}$/)) {
            return m;
        }
        return m.replace(href, '__base_' + href);
    });

    return content;
};

exports.setResource = function (file) {
    'use strict';
    //cloning object
    var resolve = require('../utils/resolve');
    file = JSON.parse(JSON.stringify(file));

    if (file.href.match(/^__base_/)) {
        file.href = file.href.replace(/^__base_/, '');
        file = resolve(file.href, './');
    }
    // Skip all css import resources.
    // CSS files are supposed to be merged into the main file
    // hence, skipping and inlining
    if (file.type === 'css') {
        file.skip = true;
        file.inline = true;
    }
    return file;
};
