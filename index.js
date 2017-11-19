const cache      = {},
      queue      = [],
      path       = require('path'),
      log        = require('./utils').log,
      resolve    = require('./utils').resolve,
      min        = require('./min'),
      version    = require('./lib/version'),
      replace    = require('./lib/replacer'),
      parser     = require('./parser')(),
      sourcemaps = require('./lib/sourcemaps'),
      build      = require('./lib/build');

function checkOption(options, opt) {
  opt = options[opt];
  if (!opt) return;
  return opt;
}
function getFilesArray(cachedFiles) {
  return Promise.resolve(Object.entries(cachedFiles).map((e) => e[1]));
}
function getFilesByType(files, type) {
  return Promise.resolve(files.filter((f) => f.type === type));
}
function versionFiles(files) {
  if (checkOption('skip-versioning')) return Promise.resolve(files);
  log.info('VERSIONING FILES');
  return version(files).then(() => files);
}
function renameLinkedFiles(files) {
  log.info('RENAMING LINKS IN FILES');
  return replace(files).then(() => files);
}
function processCSS(files) {
  log.info('BEAUTIFYING YOUR STYLES…');
  return getFilesByType(files, 'css')
    .then(min.css)
    .then(() => files);
}
function processJS(files) {
  log.info('CRANKING YOUR SCRIPTS…');
  return getFilesByType(files, 'js')
    .then(min.js)
    .then(() => files);
}
function processHTML(files) {
  log.info('BOOKING YOUR PAGES…');
  return getFilesByType(files, 'html')
      .then(min.html)
      .then(() => files);
}
function processSourceMaps(files) {
  if (!checkOption('sourcemaps')) return Promise.resolve(files);
  log.info('GENERATING SOURCE MAPS…');
  return sourcemaps(files).then((maps) => {
    maps.forEach((m) => files.push(m));
    return maps;
  }).then(() => files);
}
function processImages(files) {
  if (checkOption('no-compress-images')) return Promise.resolve(files);
  log.info('REVEALING YOUR PICTURES…');
  return getFilesByType(files, 'img')
    .then(min.img)
    .then(() => files);
}
function buildFiles(buildDir, files) {
  log.info('STORING YOUR GOODIES…');
  return build(buildDir, files.filter((f) => !f.inline && !f.skip))
    .then(() => files);
}

function processFiles() {
  return getFilesArray(cache)
    .then(versionFiles)
    .then(renameLinkedFiles)
    .then(processCSS)
    .then(processJS)
    .then(processHTML)
    .then(processSourceMaps)
    .then(processImages)
    .then(buildFiles)
    .then(() => log.success('MAGIC FINISHED'))
    .catch(onError);
}

function checkQueue(file) {
  return queue.filter((item) => item.name === file.name).length;
}
function onError(e) {
  log.error(e);
  process.exit(1);
}
function onResourceFound(file) {
  if (cache[file.name]) return;
  if (file.done) {
    cache[file.name] = file;
    log.success(`CACHED ${file.name}`);
  } else if (!checkQueue(file)) {
    queue.push(file);
  }
}
function onFileComplete() {
  if (queue.length) {
    const next = queue.shift();
    parser.parse(next);
  } else {
    parser.emit('end');
  }
}
function onFileError(e, file) {
  log.warn(`[${file.name}] ${e.message}, skipping…`);
  if (checkQueue(file)) onFileComplete();
}

module.exports = function (index, buildDir, options = {}) {
  // move cwd to index location
  process.chdir(path.dirname(index));
  index = path.basename(index || 'index.html');

  checkOption = checkOption.bind(this, options); //eslint-disable-line no-func-assign
  buildFiles  = buildFiles.bind(this, buildDir); //eslint-disable-line no-func-assign

  parser.on('resource', onResourceFound)
        .on('ready',    onFileComplete)
        .on('error',    onFileError)
        .on('end',      processFiles)
        .parse(resolve(index));
};
