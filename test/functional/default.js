const {test} = require('ava'),
      mockFsHelper = require('../mock-fs-helper.js'),
      nodeModules  = mockFsHelper.duplicateFSInMemory('node_modules'),
      mock   = require('mock-fs'),
      pakku  = require('../../'),
      files  = {
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

test.before('setting up fs', mock.bind(this, files));

test.cb('check for built files', (t) => {
  pakku('index.html', 'build', {sourcemaps: true})
    .on('after_build', (cache) => {
      console.log(cache.map((f) => f.name));
      const file = cache.find((f) => f.name === 'index.html');
      t.true(file.done);
      t.end();
    })
    .on('fatal', t.end);
});

test.after('cleaning up fs', () => {
  console.log('cleaning up');
  mock.restore();
});
