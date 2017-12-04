const {mkdir}        = require('fs'),
      {exec}         = require('child_process'),
      platform       = require('os').platform(),
      path           = require('path'),
      filendir       = require('filendir'),
      log            = require('../utils').log;

function run(file) {
  const dir = this.toString(),
        p   = path.resolve(dir, file.vname);
  return new Promise((resolve, reject) => {
    return filendir.writeFile(p, file.contents, (err) => {
      if (err) {
        err.fileName = file.name;
        reject(err);
      }
      log.info(`SAVING: ${file.name} → ${file.vname}`);
      resolve(file);
    });
  });
}

function createBuildDir(dir) {
  return new Promise((resolve, reject) => {
    const cmd = platform === 'win32' ? 'rmdir /s /q 2>nul' : 'rm -rf';
    exec(`${cmd} ${dir}`, () => {
      mkdir(dir, (mkErr) => {
        if (mkErr) return reject(mkErr);
        resolve();
      });
    });
  });
}

module.exports = function (targetDir, files) {
  if (!targetDir) throw new Error('No Build dir specified');
  return createBuildDir(targetDir).then(() => {
    return Promise.all(files.map(run, targetDir));
  });
};
