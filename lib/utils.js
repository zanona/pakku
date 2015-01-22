/*global exports*/
exports.getType = function(ext) {
    if (ext.match(/\.(html)$/)) { return 'html'; }
    if (ext.match(/\.(png|gif|jpg|svg)$/)) { return 'img'; }
    if (ext.match(/\.(css|less|scss|sass)$|^(link|style)$/)) { return 'css'; }
    if (ext.match(/\.(js)$|^(script)$/)) { return 'js'; }
    return ext;
};

exports.isExternal = function(src) {
    return src.match(/^http|^\/\/|^mailto/);
};

exports.resolveSrc = function(src) {
    var r = src;
    // default to .js in case no extension
    if (!src.match(/\.\w{2,6}$/)) { r = src + '.js'; }
    // remove relative marks ./file
    // remove anchors file#anchor
    r = r.replace(/^\.\//, '').split('#')[0];
    return r;
};
