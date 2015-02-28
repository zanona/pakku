var tmpFiles;

exports.setContent = function (content) {
    'use strict';
    //NEED TO CLEAN CACHE ONCE IT PERSISTS ACCROSS INSTANCES
    tmpFiles = {};

    /*jslint regexp:true*/
    var i = require('../utils/interpolate'),
        validTags = new RegExp(i(
            /<(%s)\b([^>]*)>(?:([\s\S]*?)<\/\1>)?/,
            'script|link|style'
        ), 'gi');

    function flattenAttrs(attrs) {
        var r = Object.keys(attrs).map(function (key) {
            var value = attrs[key];
            if (value === true || !value) { return key; }
            return i('%s="%s"', key, value.replace(/"/g, '\"'));
        }).join(' ');
        return r;
    }

    function getAttrs(str) {
        var r = {},
            search = /\b([\w\-]+)\b=?(?:(["'])([\s\S]+?)\2|([^ ]+)|)/g;

        str.replace(search, function (m, key, sep, value, altValue) {
            /*jslint unparam:true*/
            if (!value && !altValue) {
                r[key] = true;
            } else {
                r[key] = value || altValue;
            }
        });

        return r;
    }

    function parse(match, tag, attrs, content, index) {

        attrs = getAttrs(attrs);

        if (attrs['data-dev']) { return ''; }

        var src = attrs.src || attrs.href,
            inline = src && attrs['data-inline'],
            main = attrs['data-main'],
            tmpFilename;

        if (tag === 'script' && main) {
            attrs.src = '__amd_' + main.replace(/\.js$/, '') + '.js';
            delete attrs['data-main'];
        }
        if (inline) {
            delete attrs.src;
            delete attrs.href;
            delete attrs['data-inline'];
        }

        attrs = flattenAttrs(attrs);

        if (tag.match(/style|script/) && content) {
            tmpFilename = i(
                '%s-%s.%s',
                tag,
                index,
                tag === 'style' ? 'css' : 'js'
            );
            tmpFiles[tmpFilename] = content;
            return i(
                '<%s %s>@%s</%s>',
                tag,
                attrs,
                tmpFilename,
                tag
            );
        }
        if (tag.match(/link|script/) && inline) {
            return i(
                '<%s %s>@%s</%s>',
                tag === 'link' ? 'style' : 'script',
                attrs,
                src,
                tag === 'link' ? 'style' : 'script'
            );
        }
        if (tag === 'script' && main) {
            return i('<script %s></script>', attrs);
        }

        return match;
    }

    content = content.replace(validTags, parse);
    return content;
};

exports.setResource = function (file, parent) {
    'use strict';
    file = JSON.parse(JSON.stringify(file));
    file.name = file.name.replace(/^__amd_/, function () {
        file.amd = true;
        return '';
    });
    if (tmpFiles[file.href]) {
        file.name = parent.name.replace(/\./g, '-') + '-' + file.href;
        file.contents = tmpFiles[file.href];
    }
    return file;
};
