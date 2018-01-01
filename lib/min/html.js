const minify = require('html-minifier').minify
const log = require('../utils').log

function run(file) {
	try {
		file.contents = minify(file.contents, {
			collapseWhitespace: true,
			preserveLineBreaks: true,
			removeComments: true,
			removeAttributeQuotes: true
		})
	} catch (err) {
		log.warn('[%s] Error minifying HTML: %s', file.name, err.message.split('\n')[0])
	}
	return file
}
module.exports = files => Promise.all(files.map(run))
