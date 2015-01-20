/*global module, require*/
module.exports = function (file, emitter) {
    var utils = require('./utils'),
        re = /(@)?([\w\-\/\:\.]+)\.(jpg|png|gif|svg|less|css|js|html)\b/gi;
    return file.contents.replace(re, function (m, expand) {
        m = m.replace(/^@/, '');
        if (m.match(/^http|^\/\//)) { return m; }
        var f = { name: m, type: utils.getType(m) };
        if (expand) { f.inline = true; }
        if (f.type !== 'img') { f.skip = true; }
        emitter.emit('resource', f);
        return '!@' + (expand ? '' : 'f') +  '{' + m + '}';
    });
};
