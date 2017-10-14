/*eslint indent:[1,4]*/
var marked = require('marked').setOptions({smartypants: true}),
    i = require('../utils/interpolate'),
    validTags = new RegExp(i(
        /<(%s)\b([^>]*)>(?:([\s\S]*?)<\/\1>)?/,
        'script|link|style'
    ), 'gi'),
    SSIPattern = /<!--#include file=[\"\']?(.+?)[\"\']? -->/g,
    tmpFiles;

exports.setContent = function (content, file) {
    //NEED TO CLEAN CACHE ONCE IT PERSISTS ACCROSS INSTANCES
    tmpFiles = {};

    //IF MARKDOWN, CONVERT TO HTML
    if (file.href.match(/\.md$/)) content = marked(content);

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
            if (!value && !altValue) {
                r[key] = true;
            } else {
                r[key] = value || altValue;
            }
        });
        return r;
    }

    function parse(match, tag, attrs, textContent, index) {

        attrs = getAttrs(attrs);

        if (attrs['data-dev']) { return ''; }

        var src = attrs.src || attrs.href,
            lineNumber = (content.substr(0, index).match(/\n/g) || []).length + 1,
            inline = src && attrs['data-inline'],
            main = attrs['data-main'],
            fileType,
            tmpFilename;

        if (attrs.type) {
          //parse type attribute such type=text/less
            fileType = attrs.type.split('/')[1];
            if (!fileType.match(/ld\+json/)) { delete attrs.type; }
        }

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

        if (tag.match(/style|script/) && textContent) {
            tmpFilename = i(
                '%s-%s.%s',
                tag,
                lineNumber,
                fileType || (tag === 'style' ? 'css' : 'js')
            );
            tmpFiles[tmpFilename] = textContent;
            tmpFiles[tmpFilename + '_meta'] = { lineNumber: lineNumber };
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

    function parseSSI(m, filePath) { return '@' + filePath; }

    function stripCommentsExceptSSI(str) {
        return str.replace(/<!--(?!#include)[\s\S]*?-->/gmi, '');
    }

    content = stripCommentsExceptSSI(content)
        .replace(validTags, parse)
        .replace(SSIPattern, parseSSI);
    return content;
};

exports.setResource = function (file, parent) {
    file = JSON.parse(JSON.stringify(file));
    if (tmpFiles[file.href]) {
        file.name = parent.name.replace(/\./g, '-') + '-' + file.href;
        file.contents = tmpFiles[file.href];
        file.parentHref = parent.href;
    }
    // assign extra info added during the setContent method
    if (tmpFiles[file.href + '_meta']) {
        Object.assign(file, tmpFiles[file.href + '_meta']);
    }
    return file;
};
