const fileCacher = require('./file-cacher.js'),
      nodeModules  = fileCacher.duplicateFSInMemory('node_modules');
module.exports = {
  node_modules: nodeModules,
  'index.html': `
    <link rel=stylesheet href=lib/meta/index.less>
    <script src=lib/meta/index.js></script>
  `,
  'lib/meta/index.js': `
    const msg = 'hello world';
    console.log(\`\${msg}\`);
  `,
  'lib/meta/index.less': `
    @color: red;
    body{ background: @color; }
  `
};
