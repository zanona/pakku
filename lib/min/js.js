const path = require('path')
const rollup = require('rollup').rollup
const json = require('rollup-plugin-json')
const replace = require('rollup-plugin-re')
const commonjs = require('rollup-plugin-commonjs')
const nodeResolve = require('rollup-plugin-node-resolve')
const builtins = require('rollup-plugin-node-builtins')
const globals = require('rollup-plugin-node-globals')
const nodent = require('rollup-plugin-nodent')
const buble = require('rollup-plugin-buble')
const terser = require('rollup-plugin-terser').terser
const log = require('../utils').log

function fmtBundleName(filename) {
	filename = filename.replace(/\.js$/, '')
	const paths = filename.split(/[/\-_]/)
	return paths.reduce((p, c, index) => {
		if (index > 0) {
			c = c.replace(/./, m => m.toUpperCase())
		}
		p += c
		return p
	}, '')
}
function hasExports(contents) {
	const pattern = /^\s*(module\.exports|exports\.|export )/gm
	return pattern.test(contents)
}
function getOffsetContent(file) {
  // Using zero-base index to match with source map spec
	const fmtLine = file.line ? file.line - 1 : 0
	const fmtCol = file.column ? file.column - 1 : 0
	return Array(fmtLine).fill('\n').join('') +
			Array(fmtCol).fill(' ').join('') +
			file.contents
}
function rerouteSourceMap(file) {
	if (!file.sourceMap) {
		return file
	}
	const map = file.sourceMap
	const base = file.parentHref || file.name

	map.sources = map.sources.map(source => {
		const relativeSrc = path.relative(process.cwd(), source)
		if (source.match('node_modules')) {
			return relativeSrc.split(/(?=node_modules)/)[1]
		}
		if (file.hasImports) {
			return path.join(path.dirname(base), relativeSrc)
		}
		return base
	})
	return file
}
function replaceNodeEnvVars() {
	return replace({
		patterns: [{
			test: /process.env(?:\.(.+?)\b|\[(["'])(.+?)\2\])/g,
			replace: (m, v1, _, v3) => JSON.stringify(process.env[v1 || v3] || '')
		}]
	})
}
function virtualInput(files) {
	return {
		name: 'rollup-plugin-virtual-input',
		load: id => {
			const relative = path.relative(process.cwd(), id)
			const cached = files.find(f => f.name === relative)
			if (cached && cached.inline) {
				return getOffsetContent(cached)
			}
			if (cached) {
				return cached.contents
			}
		},
		resolveId: id => {
			const cached = files.find(f => {
				return id === (path.isAbsolute(id) ? `/${f.vname}` : f.name)
			})
			return cached && cached.name
		}
	}
}
function transpile(file, files) {
	return rollup({
		input: file.name,
		plugins: [
			virtualInput(files),
			json(),
			nodeResolve({
				preferBuiltins: true,
				browser: true,
				jsnext: true,
				extensions: ['.js', '.json']
			}),
			commonjs(),
			builtins(),
			replaceNodeEnvVars(),
			nodent({promises: true, noRuntime: true}),
			buble(),
			globals(),
			terser()
		]
	})
	.then(bundle => {
		return bundle.generate({
			name: fmtBundleName(file.name),
			format: 'iife',
			sourcemap: true
		})
	})
	.then(bundle => {
		file.contents = bundle.code
		file.sourceMap = bundle.map
		return file
	})
}
function minifyJSON(file) {
	return new Promise((resolve, reject) => {
		try {
			file.contents = file.contents.replace(/\n+/g, '').replace(/(\s)+/g, '$1')
			resolve(file)
		} catch (err) {
			reject(err)
		}
	})
}
function run(file, index, array) {
	if (file.ext === 'json') {
		return minifyJSON(file, log.error.bind(file))
	}
	if (file.ext === 'js' && hasExports(file.contents)) {
		return file
	}
	if (file.ext === 'js') {
		return transpile(file, array)
			.then(rerouteSourceMap)
			.catch(err => {
				err.fileName = file.name
				throw err
			})
	}
	log.warn(`[${file.name}]`, 'Only javascript files are supported', 'Skipping…')
	return file
}
module.exports = files => Promise.all(files.map(run))
