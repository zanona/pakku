/*global module, require, process*/
module.exports = function (file, emitter) {
    var fs = require('fs'),
        utils = require('./utils'),
        re = /(@)?([\w\-\/\:\.]+)\.(jpg|png|gif|svg|less|css|js|json|html|xml)\b(?=[^=(])/gi,
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

    return file.contents.replace(re, function (src, expand) {
        src = src.replace(/^@/, '');//remove expansion flag
        src =  utils.resolveSrc(src, file.name);
        if (!src.path) { return src.raw; }
        var f = { name: src.path, type: src.type};
        if (file.type === 'css' && f.type === 'css') { expand = true; }
        if (file.type === 'css' && f.type !== 'img') { f.skip = true; }
        if (expand) { f.inline = true; }

        //If file exists, tokenize it
        //otherwise re-apply original name;
        //REVIEW THIS WORKFLOW SINCE ERROR CHECKING IS BEING
        //DONE ON PARSER.JS ALREADY
        try {
            /*jslint stupid: true*/
            fs.openSync(f.name, 'r');
            emitter.emit('resource', f);
            return '!@'
                + (expand ? '' : 'f')
                + '{' + f.name + '}'
                + (src.query || '');
        } catch (e) {
            console.warn(require('colors').yellow('WARNING'.bold + ' [' + file.name + '] ' +  e.message + ', skipping…'));
            return src.raw;
        }
    });
};
