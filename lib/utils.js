/*global module, require, process*/
function getType(ext) {
    if (ext.match(/\.(html|xml)$/)) { return 'html'; }
    if (ext.match(/\.(png|gif|jpg|svg)$/)) { return 'img'; }
    if (ext.match(/\.(css|less|scss|sass)$|^(link|style)$/)) { return 'css'; }
    if (ext.match(/\.(js|json)$|^(script)$/)) { return 'js'; }
    return 'other';
}

function isExternal(src) {
    return src.match(/^[\w\-]+:|^\/{2}|^[^\.\w]/);
}

function resolveSrc(href, parentSrc) {
    if (isExternal(href)) { return { raw: href }; }
    var path = require('path'),
        src = { raw: href.replace(/(\/?[#?])/, '¿?$1').split('¿?') };

    if (src.raw.length > 1) { src.query = src.raw[1]; }
    src.path = src.raw[0];
    if (!src.path) { return { raw: href }; }
    src.basename = path.basename(src.path);
    src.extname = path.extname(src.basename);
    src.type = getType(src.extname);

    src.dirname = path
        .resolve(path.dirname(parentSrc), path.dirname(src.path))
        .replace(process.cwd(), '')
        .replace(/^\//, '');

    src.path = path.join(src.dirname, src.basename);
    src.raw = src.raw.join('');

    return src;
}

module.exports = {
    getType: getType,
    isExternal: isExternal,
    resolveSrc: resolveSrc
};
