const path = require('path')
const marked = require('marked').setOptions({smartypants: true})
const i = require('../utils/interpolate')

const validTags = new RegExp(i(
  /<(%s)\b([^>]*)>(?:([\s\S]*?)<\/\1>)?/,
  'script|link|style'
), 'gi')
const SSIPattern = /<!--#include file=["']?(.+?)["']? -->/g
let tmpFiles

function flattenAttrs(attrs) {
	return Object.keys(attrs).map(key => {
		if (attrs[key] === true || !attrs[key]) {
			return key
		}
		const value = (attrs[key] || '').replace(/"/g, '"')
		return `${key}="${value}"`
	}).join(' ')
}
function getAttrs(str) {
	const r = {}
	const search = /\b([\w-]+)\b=?(?:(["'])([\s\S]+?)\2|([^ ]+)|)/g
	str.replace(search, (m, key, sep, value, altValue) => {
		if (!value && !altValue) {
			r[key] = true
		} else {
			r[key] = value || altValue
		}
	})
	return r
}
function stripCommentsExceptSSI(str) {
	return str.replace(/<!--(?!#include)[\s\S]*?-->/gmi, '')
}

function getTextIndexLineNumber(content, index) {
	const head = content.substr(0, index).match(/\n/g)
	if (head) {
		return head.length + 1
	}  // Non-zero based count
	return 1
}
function removeInlineAttrs(attrs) {
	delete attrs.src
	delete attrs.href
	delete attrs['data-inline']
}
function appendFileSource(file, src) {
	file.includes = file.includes || []
	file.includes.push(src)
}
function createImportTag(tag, src, attrs) {
	const nodeName = tag === 'link' ? 'style' : 'script'
	if (tag === 'link') {
		delete attrs.rel
	}
	return `<${nodeName} ${flattenAttrs(attrs)}>@${src}</${nodeName}>`
}

/**
  * This method is deprecated and will be removed
  * in favour of browserified modules
  * @param {string} tag tag name
  * @param {string} src script source
  * @param {object} attrs tag html attributes
  * @returns {string} a script tag
* */
function createAMDImportTag(tag, src, attrs) {
	attrs.src = `__amd_${attrs['data-main']}`
	if (!path.extname(attrs.src)) {
		attrs.src += '.js'
	}
	delete attrs['data-main']
	return `<script ${flattenAttrs(attrs)}></script>`
}

function getNameForInlineResource(tag, filename, fileType, line, column) {
	const name = path.basename(filename).replace(path.extname(filename), '')
	const ext = fileType || (tag === 'style' ? 'css' : 'js')
	return `${name}-${tag}-${line}_${column}.${ext}`
}
function registerTagContentsAsFile(name, content, line, column) {
	tmpFiles[name] = content
	tmpFiles[`${name}_meta`] = {line, column}
}
function createInlineTag(tag, src, attrs) {
	return `<${tag} ${flattenAttrs(attrs)}>@${src}</${tag}>`
}

function parse(match, tag, attrs, textContent, index, content) {
	attrs = getAttrs(attrs)

	if (attrs['data-dev']) {
		return ''
	}

	const file = this
	const src = attrs.src || attrs.href
	const inline = src && attrs['data-inline']

	let node = match
	let fileType

	if (attrs.type) {
    // Parse type attribute such type=text/less
		fileType = attrs.type.split('/')[1]
		if (fileType === 'ld+json') {
			fileType = 'json'
		} else {
      // Need to remove or rename type attributes
      // otherwise DOM won't interpret `text/less` correctly
			delete attrs.type
		}
	}

	if (inline) {
		removeInlineAttrs(attrs)
		appendFileSource(file, src)
	}

	if (tag.match(/style|script/) && textContent) {
		const line = getTextIndexLineNumber(content, index)
		const column = match.indexOf(textContent) + 1 // Non-zero based count
		const name = getNameForInlineResource(tag, file.name, fileType, line, column)
		registerTagContentsAsFile(name, textContent, line, column)
		node = createInlineTag(tag, name, attrs)
	}

	if (tag.match(/link|script/) && inline) {
		node = createImportTag(tag, src, attrs)
	}

	if (tag === 'script' && attrs['data-main']) {
		node = createAMDImportTag(tag, src, attrs)
	}

	return node
}

function parseSSI(m, filePath) {
	const file = this
  // Assign the inclusion on the vFile
	file.includes = file.includes || []
	file.includes.push(filePath)
	return `@${filePath}`
}

exports.setContent = function (file) {
	let content = file.contents
  // Need to clean cache once it persists accross instances
	tmpFiles = {}

  // If markdown, convert to html
	if (path.extname(file.name) === '.md') {
		content = marked(content)
	}

	return stripCommentsExceptSSI(content)
         .replace(validTags, parse.bind(file))
         .replace(SSIPattern, parseSSI.bind(file))
}

exports.setResource = function (file, parent) {
	file = JSON.parse(JSON.stringify(file))
	const basename = path.basename(file.name)
	if (tmpFiles[basename]) {
		file.contents = tmpFiles[basename]
		file.parentHref = parent.name
	}
  // Assign extra info added during the setContent method
	if (tmpFiles[basename + '_meta']) {
		Object.assign(file, tmpFiles[basename + '_meta'])
	}
	return file
}
