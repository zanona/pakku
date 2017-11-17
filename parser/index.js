const {readFile}     = require('fs'),
      {EventEmitter} = require('events'),
      sendToParser   = require('./general');

function getFileContents(file) {
  return new Promise((resolve, reject) => {
    if (file.contents) return resolve(file);
    readFile(file.name, (err, data) => {
      if (err) return reject(err);
      if (file.type !== 'img' && file.type !== 'other') data = data.toString();
      file.contents = data;
      resolve(file);
    });
  });
}
function routeFile(file) {
  // skip parsing non textual files (i.e: images)
  if (Buffer.isBuffer(file.contents)) return file;
  return sendToParser(file, this);
}

function parse(file) {
  return getFileContents(file)
      .then(() => routeFile.call(this, file))
      .then(() => file.done = true)
      .then(() => this.emit('resource', file))
      .then(() => this.emit('ready'))
    .catch((e) => this.emit('error', e, file));
}

module.exports = function () {
  const self = new EventEmitter();
  self.parse = parse.bind(self);
  return self;
};
