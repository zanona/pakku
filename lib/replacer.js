const fileMatch = /!@(f?)\{([\w\.\-\+\/@]+?)\}/g,
      envMatch  = /\$ENV\[['"]?([\w\.\-\/@]+?)['"]?\]/g;

function adjustPath(file) {
  const targetSrc =  file.ext === 'html' ? file.name : file.vname;
  return `/${targetSrc}`;
}
function replaceFileTags(cache, parent, match, link, name) {
  const file = cache[name];
  if (!file) return name;
  if (link)  return adjustPath(file);

  run.bind(cache)(file);

  let newContent = file.contents;

  //support for @filename.ext inside js files
  if (parent.type === 'js' && file.type.match(/html|css/)) {
    //escape //, /replace, \n, ", ' for \\$1
    newContent = newContent.replace(/([\\\/\n"'])/g, '\\$1');
  }
  return newContent;
}
function replaceEnvTags (m, v) { return process.env[v] || ''; }
function convertFilestoDict(files) {
  return files.reduce((p, c) => {
    p[c.name] = c;
    return p;
  }, {});
}

function run(file) {
  const cache = this;
  if (!file.contents || !file.contents.replace) return file;
  file.contents = file.contents.replace(fileMatch, replaceFileTags.bind(void 0, cache, file));
  file.contents = file.contents.replace(envMatch, replaceEnvTags);
  return file;
}

module.exports = (files) => {
  const cache = convertFilestoDict(files);
  return Promise.all(files.map(run, cache));
};
