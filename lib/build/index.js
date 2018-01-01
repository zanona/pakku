const {mkdir} = require('fs')
const {exec} = require('child_process')
const platform = require('os').platform()
const path = require('path')
const filendir = require('filendir')
const log = require('../utils').log

function run(file) {
	const dir = this.toString()
	const p = path.resolve(dir, file.vname)
	return new Promise((resolve, reject) => {
		return filendir.writeFile(p, file.contents, err => {
			if (err) {
				err.fileName = file.name
				reject(err)
			}
			log.info(`SAVING: ${file.name} → ${path.join(dir, file.vname)}`)
			resolve(file)
		})
	})
}

function createBuildDir(dir) {
	return new Promise((resolve, reject) => {
		const cmd = platform === 'win32' ? 'rmdir /s /q 2>nul' : 'rm -rf'
		exec(`${cmd} ${dir}`, () => {
			mkdir(dir, mkErr => {
				if (mkErr) {
					return reject(mkErr)
				}
				resolve()
			})
		})
	})
}

module.exports = function (targetDir, files) {
	if (!targetDir) {
		throw new Error('No Build dir specified')
	}
	return createBuildDir(targetDir).then(() => {
		return Promise.all(files.map(run, targetDir))
	})
}
