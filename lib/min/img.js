const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')
const imageminSvgo = require('imagemin-svgo')
const batchPromises = require('batch-promises')
const log = require('../utils').log

const plugins = [
	imageminJpegtran(),
	imageminPngquant({quality: [0.8,0.9]}),
	imageminSvgo()
]

function run(file) {
	return imagemin.buffer(file.contents, {plugins}).then(cFile => {
		const originalSize = file.contents.length
		const compressedSize = cFile.length
		const compression = 100 - Math.ceil((compressedSize * 100) / originalSize)
		file.contents = cFile
		if (compression) {
			log.info('[%s] compressed in %s%', file.name, compression)
		}
		return file
	}).catch(err => {
		err.fileName = file.name
		throw err
	})
}
module.exports = files => batchPromises(10, files, run)
