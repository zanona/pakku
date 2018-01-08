const less = require('less')
const autoprefixer = require('autoprefixer')({browsers: ['last 2 versions', 'safari >= 8', 'ie >= 11']})
const flexfix = require('postcss-flexbugs-fixes')
const postcss = require('postcss')
const CleanCSS = require('clean-css')
const log = require('../utils').log

function autoprefix(file) {
	return new Promise((resolve, reject) => {
		postcss([flexfix, autoprefixer]).process(file.contents)
      .then(output => {
	file.contents = output.css
	resolve(file)
}).catch(reject)
	})
}
function cleanCSS(file) {
	return new Promise((resolve, reject) => {
		const ps = new CleanCSS({keepSpecialComments: 0})
		try {
			file.contents = ps.minify(file.contents).styles
			resolve(file)
		} catch (err) {
			reject(err)
		}
	})
}
function lessify(file) {
	return new Promise((resolve, reject) => {
		less.render(file.contents, (e, output) => {
			if (e) {
				return reject(e)
			}
			file.contents = output.css
			resolve(file)
		})
	})
}
function run(file) {
	if (!file.ext.match(/less|css/)) {
		file.skip = true
		log.warn(`[${file.name}]`, 'Only LESS/CSS files are supported.', 'Skipping…')
	}
	if (file.skip) {
		return file
	}

	const transpile = file.ext === 'less' ? lessify(file) : Promise.resolve(file)
	return transpile.then(autoprefix)
                  .then(cleanCSS)
                  .catch(log.error.bind(file))
}
module.exports = files => Promise.all(files.map(run))
