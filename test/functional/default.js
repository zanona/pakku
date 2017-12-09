const {test} = require('ava'),
      fs     = require('fs'),
      mock   = require('mock-fs'),
      pakku  = require('../../lib'),
      files  = require('../lib/files'),
      TARGET_FILE = 'index.html',
      BUILD_DIR = 'build';

let cache;

test.before('setting up fs', mock.bind(this, files));
test.cb.before('running pakku', (t) => {
  pakku(TARGET_FILE, BUILD_DIR, {sourcemaps: true})
    .on('after_build', (c) => (cache = c, t.end()))
    .on('fatal', t.end);
});
test.beforeEach((t) => t.context.cache = cache);

test.cb('check for target build directory', (t) => fs.stat(BUILD_DIR, t.end));

test('check file structure', (t) => {
  const cachedFiles = Object.values(t.context.cache);
  t.plan(cachedFiles.length);
  cachedFiles.forEach(({vname}) => {
    t.notThrows(fs.statSync.bind(this, `${BUILD_DIR}/${vname}`));
  });
});

test('check for built files', (t) => {
  const file = t.context.cache.find((f) => f.name === 'index.html');
  return t.true(file.done);
});

test.after('cleaning up fs', mock.restore);
