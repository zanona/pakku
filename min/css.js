const less         = require('less'),
      autoprefixer = require('autoprefixer')({browsers: ['last 2 versions', 'safari >= 8', 'ie >= 11']}),
      flexfix      = require('postcss-flexbugs-fixes'),
      postcss      = require('postcss'),
      CleanCSS     = require('clean-css'),
      log          = require('../utils').log;

function autoprefix(file) {
  return new Promise((resolve, reject) => {
    postcss([flexfix, autoprefixer]).process(file.contents)
      .then(function (output) {
        file.contents = output.css;
        resolve(file);
      }).catch(reject);
  });
}
function cleanCSS(file) {
  return new Promise((resolve, reject) => {
    const ps = new CleanCSS({ keepSpecialComments: 0 });
    try {
      file.contents = ps.minify(file.contents).styles;
      resolve(file);
    } catch (e) {
      reject(e);
    }
  });
}
function lessify(file) {
  return new Promise((resolve, reject) => {
    less.render(file.contents, function (e, output) {
      if (e) { return reject(e); }
      file.contents = output.css;
      resolve(file);
    });
  });
}
function run(file) {
  if (!file.ext.match(/less|css/)) {
    file.skip = true;
    log.warn(`[${file.name}]`, 'Only LESS/CSS files are supported.', 'Skipping…');
  }
  if (file.skip) return file;

  const transpile = file.ext === 'less' ? lessify(file) : Promise.resolve(file);
  return transpile.then(autoprefix)
                  .then(cleanCSS)
                  .catch(log.error.bind(file));

}
module.exports = (files) => Promise.all(files.map(run));
