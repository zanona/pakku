/*global require, module*/
module.exports = (function () {
    'use strict';

    var EventEmitter = require('events').EventEmitter,
        self = new EventEmitter(),
        fs = require('fs');

    self.parse = function(file) {
        try {
            if (!file.contents) { file.contents = fs.readFileSync(file.name); }
            if (file.type === 'html') {
                file.contents = file.contents.toString();
                file.contents = require('./html')(file, self);
            } else if (file.type !== 'img') {
                file.contents = file.contents.toString();
                file.contents = require('./general')(file, self);
            }
            file.done = true;
            self.emit('resource', file);
            self.emit('ready');
        } catch (e) {
            self.emit('error', e, file);
        }
        return self;
    };

    return self;
}());
