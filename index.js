const cache        = {},
      queue        = [],
      path         = require('path'),
      log          = require('./utils').log,
      resolve      = require('./utils').resolve,
      min          = require('./min'),
      vname        = require('./lib/vname'),
      linkRewriter = require('./lib/link-rewriter'),
      parser       = require('./parser')(),
      sourcemaps   = require('./lib/sourcemaps'),
      build        = require('./lib/build');

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
function renameFiles(files) {
  log.info('RENAMING FILES');
  return vname(files).then(() => files);
}
function rewriteLinksInFiles(allFiles, files) {
  if (!files.length) return files;
  const type = files[0].type.toUpperCase();
  log.info(`REWRITING LINKS IN ${type} FILES`);
  return linkRewriter(files, allFiles).then(() => files);
}
function processFiles(type, message, files) {
  log.info(message);
  return getFilesByType(files, type)
    .then(rewriteLinksInFiles.bind(this, files))
    .then(min[type])
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
  e.filename = file.name;
  const at = e.stack.split('\n')[1].trim();
  log.warn(`[${file.name}] ${e.message} ${at}, skipping…`);
  if (checkQueue(file)) onFileComplete();
}
function onParserDone() {
  return getFilesArray(cache)
    .then(renameFiles)
    .then(processFiles.bind(this, 'css',  'BEAUTIFYING YOUR STYLES…'))
    .then(processFiles.bind(this, 'js',   'CRANKING YOUR SCRIPTS…'))
    .then(processFiles.bind(this, 'html', 'BOOKING YOUR PAGES'))
    .then(processSourceMaps)
    .then(processImages)
    .then(buildFiles)
    .then(() => log.success('MAGIC FINISHED'))
    .catch(onError);
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
        .on('end',      onParserDone)
        .parse(resolve(index));
};
