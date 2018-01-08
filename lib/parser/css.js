const path = require('path')
const resolve = require('../utils/resolve')

function sanitizeFileName(src, parentName) {
	if (!path.extname(src)) {
		return src + path.extname(parentName)
	}
	return src
}

exports.setContent = function (file) {
	const imports = /@import(?: url)?[ ('"]+(.+)\b[ ('";)]+/g
	const attrSelectors = /\[(?:src|href)[*|^?]?=(['"])?(.+?)\1?\]/g

	let content = file.contents

	content = content.replace(imports, (m, href) => {
		const resolved = resolve(sanitizeFileName(href, file.name))
		if (resolved.external) {
			return m
		}
    // Replace entire @import file.less statement with the file contents
    // this way, the parser doesn't need to look for files elsewhere
		return sanitizeFileName(href, file.name)
    // This allows proper lookup paths
    // return m.replace(href, resolved.name);
	})

	content = content.replace(attrSelectors, (m, sep, href) => {
		if (resolve(href).external || !href.match(/\.\w{3,5}$/)) {
			return m
		}
		return m.replace(href, '__base_' + href)
	})

	return content
}

exports.setResource = function (file) {
	file = JSON.parse(JSON.stringify(file))

	if (file.name.startsWith('__base_')) {
		file.name = file.name.replace(/^__base_/, '')
		file = resolve(file.name)
	}
  // Skip all css import resources.
  // CSS files are supposed to be merged into the main file
  // hence, skipping and inlining
	if (file.type === 'css') {
		file.skip = true
		file.inline = true
	}
	return file
}
