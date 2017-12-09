const path = require('path'),
      fileCacher = require('./file-cacher.js'),
      nodeModules  = fileCacher.duplicateFSInMemory('node_modules');
function rebasePathForFiles(files, baseDir) {
  return Object.keys(files).reduce((p, c) => {
    const f = files[c];
    if (baseDir && c !== 'node_modules') c = path.join(baseDir, c);
    p[c] = f;
    return p;
  }, {});
}
exports.generateFiles = (baseDir) => {
  const files = {
    node_modules: nodeModules,
    'index.html': `
      <link rel=stylesheet href=lib/meta/index.less>
      <script src=lib/meta/index.js></script>
    `,
    'lib/meta/index.js': `
      const msg = 'hello world';
      console.log(\`\${msg}\`);
    `,
    'lib/meta/picture.svg': `
      <svg viewBox='0 0 100 100' version='1.1' xmlns='http://www.w3.org/2000/svg'>
        <circle fill='#000000' cx='50' cy='50' r='50'></circle>
      </svg>
    `,
    'lib/meta/index.less': `
      @color: red;
      body{ background: @color url(picture.svg); }
    `
  };
  return rebasePathForFiles(files, baseDir);
};
