/*global module, require, process*/
module.exports = function (file, emitter) {
    var utils = require('./utils'),
        re = /(@)?([\w\-\/\:\.]+)\.(jpg|png|gif|svg|less|css|js|html)\b(?=[^=(])/gi,
        amdBaseURL;

    if (file.type === 'css') {
        file.contents = file.contents
            .replace(/@import(?: url)?[ \(\'"]+(.+)\b[ \(\'";\)]+/g, function (m, f) {
                if (utils.isExternal(f)) { return m; }
                return f;
            });
    }

    if (file.type === 'js') {
       amdBaseURL = file.contents
           .match(/require(?:js)?\.config(?:[\s\S]+?)baseUrl: ?['"](.+)['"]/i);
       if (amdBaseURL) { process.AMD_PATH = amdBaseURL[1]; }
    }

    return file.contents.replace(re, function (m, expand) {
        m = m.replace(/^@/, '');//remove expansion flag
        m = utils.resolveSrc(m);
        var f = { name: m, type: utils.getType(m) };
        if (utils.isExternal(m)) { return m; }
        if (file.type === 'css' && f.type === 'css') { expand = true; }
        if (file.type === 'css' && f.type !== 'img') { f.skip = true; }
        if (expand) { f.inline = true; }

        emitter.emit('resource', f);
        return  '!@' + (expand ? '' : 'f') +  '{' + m + '}';
    });
};
