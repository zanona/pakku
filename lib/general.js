/*global module, require*/
module.exports = function (file, emitter) {
    var utils = require('./utils'),
        re = /(@)?([\w\-\/\:\.]+)\.(jpg|png|gif|svg|less|css|js|html)\b/gi;

    if (file.type === 'css') {
        file.contents = file.contents
            .replace(/@import[ \(\'"]+([\w\.\/\-]+)[ \(\'";\)]+/g, '$1');
    }

    return file.contents.replace(re, function (m, expand) {
        m = m.replace(/^@/, '');
        var f = { name: m, type: utils.getType(m) };

        if (m.match(/^http|^\/\//)) { return m; }
        if (file.type === 'css' && f.type === 'css') { expand = true; }
        if (file.type === 'css' && f.type !== 'img') { f.skip = true; }
        if (expand) { f.inline = true; }

        emitter.emit('resource', f);
        return  '!@' + (expand ? '' : 'f') +  '{' + m + '}';
    });
};
