const {readFile} = require('fs')
const {EventEmitter} = require('events')
const sendToParser = require('./general')

function getFileContents(file) {
	return new Promise((resolve, reject) => {
		if (file.contents) {
			return resolve(file)
		}
		readFile(file.name, (err, data) => {
			if (err) {
				return reject(err)
			}
			if (file.type !== 'img' && file.type !== 'other') {
				data = data.toString()
			}
			file.contents = data
			resolve(file)
		})
	})
}
function routeFile(file) {
  // Skip parsing non textual files (i.e: images)
	if (Buffer.isBuffer(file.contents)) {
		return file
	}
	return sendToParser(file, this)
}
function markFileAsDone(file) {
	file.done = true
	return file
}

function parse(file) {
	getFileContents(file)
      .then(() => routeFile.call(this, file))
      .then(() => markFileAsDone(file))
      .then(() => this.emit('resource', file))
      .then(() => this.emit('ready'))
    .catch(err => this.emit('error', err, file))
	return this
}

module.exports = function () {
	const self = new EventEmitter()
	self.parse = parse.bind(self)
	return self
}
