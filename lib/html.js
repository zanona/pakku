/*global module, require*/
module.exports = function(self, eventEmitter) {

    var utils = require('./utils'),
        re,
        content;

    function getFeatures(str) {
        var features = /\b(rel|href|src|data-main|data-dev|data-inline)\b=?["']?([^\s"']+)?["']?/gi,
            r = {};
        str.replace(features, function (m, key, value) { r[key] = value || true; });
        return r;
    }

    function parse(match, tag, attributes, contents, index) {
        var text     = match,
            pairs    = /\b(rel|href|src|data-main|data-dev|data-inline)\b=?["']?([^\s"']+)?["']?/gi,
            features = getFeatures(attributes),
            src = utils.resolveSrc(features['data-main'] || features.src || features.href || self.name + '-' + index + '.' + utils.getType(tag)),
            file = { name: src, type: utils.getType(src)};

        if (features['data-dev'] ) { return ''; }
        if (features['data-main'] && tag === 'script') { file.amd = true; }
        if (tag !== 'a' && !file.amd && contents) { file.contents = contents; }
        if (features['data-inline'] || (!file.amd && file.contents)) { file.inline = true; }
        if (src.match(/^http|^\/\//)) { return text; }

        attributes = attributes.replace(pairs, '').replace(/\s+/g, ' ');

        // NEED TO RETHINK ABOUT PARAMS
        if (features.rel && features.rel.match('stylesheet')) { features.rel = 'stylesheet'; }

        if (tag === 'link' && !file.inline) {
            text = '<link rel=' + features.rel + ' href=!@f{' + file.name + '} ' + attributes + '>';
        }
        if (tag === 'style' || (tag === 'link' && file.inline)) {
            text = '<style ' + attributes + '>!@{' + file.name + '}</style>';
        }
        if (tag === 'script'  && !file.contents) {
            text = '<script src=!@f{' + file.name + '} ' + attributes + '></script>';
        }
        if ((tag === 'script' && file.inline)) {
            text = '<script ' + attributes + '>!@{' + file.name + '}</script>';
        }
        if (tag === 'a') {
            text = '<a href=!@f{' + file.name + '} ' + attributes + '>' + contents + '</a>';
        }
        if (tag === 'img') {
            text = '<img src=!@f{' + file.name + '} ' +  attributes + '>';
        }

        eventEmitter.emit('resource', file);
        return text
            .replace(/\s{2,}/g, ' ')
            .replace(/\s+>/g, '>');
    }

    re = /<(script|link|style|img|a)([^>]*)>(?:([^<]+)?<\/\1>)?/gi;
    content = self.contents.replace(re, parse);
    return content;
};
