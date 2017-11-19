module.exports = function () {
  const EventEmitter = require('events').EventEmitter,
        self         = new EventEmitter(),
        fs           = require('fs');

  self.parse = function (file) {
    try {
      if (!file.contents) file.contents = fs.readFileSync(file.name);
      if (!file.type.match(/img|other/)) {
        file.contents = file.contents.toString();
        require('./general')(file, self);
      }
      file.done = true;
      //emit start and end sync previous
      //actions happen synchronously
      self.emit('resource', file);
      //step-up queue
      self.emit('ready');
    } catch (e) { self.emit('error', e, file); }
    return self;
  };
  return self;
};
