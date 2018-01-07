const fs = require('fs')
const path = require('path')
const resolve = require('../utils/resolve')

function discoverModulePath(src, ext) {
	if (ext) {
		return src
	}
	if (fs.existsSync(src + '.js')) {
		return src + '.js'
	}
	if (fs.existsSync(src + '.json')) {
		return src + '.json'
	}
	if (!src.endsWith('index')) {
		return discoverModulePath(path.join(src, 'index'))
	}
}

exports.setContent = function (file) {
  /* Resolve paths for local imported modules and append extension if inexistent */
	const requireMatch = /require\((['"])(.*?)(\.js|\.json)?\1\)/gm
	const importMatch = /import(?:.*?from)? +(["'])(.+?)(\.js|\.json)?\1/gm
	const content = file.contents
	const adjustPath = (m, semi, name, ext) => {
		if (!name.startsWith('.')) {
			return m
		}
		const dir = path.dirname(file.name)
		const resolvedPath = path.resolve(dir, name)
		let src = path.relative(process.cwd(), resolvedPath)
		src = discoverModulePath(src, ext)
		return m.replace(name, src)
	}

	if (requireMatch.test(content) || importMatch.test(content)) {
		file.hasImports = true
	}

	return content
		.replace(requireMatch, adjustPath)
		.replace(importMatch, adjustPath)
}
exports.setResource = function (file, parent) {
	if (path.extname(parent.parentHref || '') !== '.html') {
		file = resolve(file.name)
	}
	return file
}
