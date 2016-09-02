module.exports = function (ext) {
    'use strict';
    if (ext.match(/\.(html|xml|md|mdown|markdown)$/)) { return 'html'; }
    if (ext.match(/\.(png|gif|jpg|svg|ico)$/)) { return 'img'; }
    if (ext.match(/\.(css|less|scss|sass)$/)) { return 'css'; }
    if (ext.match(/\.(js|json|ld\+json)$/)) { return 'js'; }
    if (ext.match(/\.(txt|rtf)$/)) { return 'txt'; }
    return 'other';
};
