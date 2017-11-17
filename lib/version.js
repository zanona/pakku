const {stat} = require('fs'),
      {exec} = require('child_process');

function getCommitHash(filename) {
  return new Promise((resolve, reject) => {
    const cmd = `git log -1 --pretty=format:%h -- ${filename}`;
    exec(cmd, (err, stdout) => {
      if (!stdout) return reject();
      resolve(stdout);
    });
  });
}
function getTimestampHash(filename) {
  return new Promise((resolve, reject) => {
    stat(filename, (err, stats) => {
      if (err) return reject();
      resolve(new Date(stats.mtime).valueOf().toString(36));
    });
  });
}
function denormalizeURL(src) { return src.replace(/\//g, '-'); }

function updateFilename(file, hash) {
  file.vname = denormalizeURL(file.name).replace(/\.(\w+)$/, `-${hash}.$1`);
  return file;
}
function run(file) {
  return getCommitHash(file.name)
    .catch(getTimestampHash.bind(this, file.parentHref || file.name))
    .then(updateFilename.bind(this, file));
}
module.exports = (files) => Promise.all(files.map(run));
