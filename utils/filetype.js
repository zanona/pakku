module.exports = function (ext) {
    'use strict';
    if (ext.match(/\.(html|xml)$/)) { return 'html'; }
    if (ext.match(/\.(png|gif|jpg|svg)$/)) { return 'img'; }
    if (ext.match(/\.(css|less|scss|sass)$/)) { return 'css'; }
    if (ext.match(/\.(js|json|ld\+json)$/)) { return 'js'; }
    if (ext.match(/\.(txt|md|mdown|markdown|rtf)$/)) { return 'txt'; }
    return 'other';
};
