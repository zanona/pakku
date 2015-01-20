/*global exports*/
exports.getType = function(ext) {
    if (ext.match(/\.(html|svg)$/)) { return 'html'; }
    if (ext.match(/\.(png|gif|jpg)$/)) { return 'img'; }
    if (ext.match(/\.(css|less|scss|sass)$|^(link|style)$/)) { return 'css'; }
    if (ext.match(/\.(js)$|^(script)$/)) { return 'js'; }
    return ext;
};

exports.resolveSrc = function(src) {
    if (src.match(/\.\w{2,6}$/)) { return src; }
    return src + '.js';
};
