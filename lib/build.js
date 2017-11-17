const {mkdir}        = require('fs'),
      {exec}         = require('child_process'),
      platform       = require('os').platform(),
      path           = require('path'),
      filendir       = require('filendir'),
      log            = require('../utils').log;

function run(file) {
  const dir = this.toString(),
        p   = path.resolve(dir, file.vname);
  return filendir.writeFile(p, file.contents, (err) => {
    if (err) {
      err.fileName = file.name;
      throw err;
    }
    log.info(`SAVING: ${file.name} → ${file.vname}`);
    return file;
  });
}

function createBuildDir(dir) {
  return new Promise((resolve, reject) => {
    const cmd = platform === 'win32' ? 'rmdir /s /q' : 'rm -rf';
    exec(`${cmd} ${dir}`, (rmErr) => {
      if (rmErr) return reject(rmErr);
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
