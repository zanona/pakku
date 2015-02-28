module.exports = function (file, emitter) {
    'use strict';

    /*jslint regexp:true*/
    var fs    = require('fs'),
        utils = require('../utils'),
        html  = require('./html'),
        css   = require('./css'),
        js    = require('./js'),
        i     = utils.interpolate,
        resolvePath = utils.resolve,
        whitelist = new RegExp(i(
            /(@)?([\w\-\/\:\.]+)\.(%s)\b(?=[^=(])/,
            'jpg|png|gif|svg|less|css|js|json|html|xml'
        ), 'ig');

    if (file.type === 'html') {
        file.contents = html.setContent(file.contents);
    }
    if (file.type === 'css') { file.contents = css.setContent(file.contents); }

    function onURL(href, expand) {
        // Remove expansion flag
        href = href.replace(/^@/, '');
        var parent = file.name,
            found;

        found = resolvePath(href, parent);

        if (found.external) { return found.href; }

        if (file.type === 'html') { found = html.setResource(found, file); }
        if (file.type === 'css') { found = css.setResource(found); }
        if (file.type === 'js') { found = js.setResource(found); }
        if (expand) { found.inline = true; }

        /* IF FILE EXISTS, TOKENIZE IT
         * OTHERWISE RE-APPLY ORIGINAL NAME */

        try {
            /*jslint stupid: true*/
            if (!found.contents) { fs.openSync(found.name, 'r'); }
            emitter.emit('resource', found);
            return i(
                '!@%s{%s}%s',
                found.inline ? '' : 'f',
                found.name,
                found.query
            );
        } catch (e) {
            emitter.emit('error', e, file);
            return found.href;
        }
    }

    file.contents = file.contents.replace(whitelist, onURL);
    return file;
};
