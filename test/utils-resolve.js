/*global describe, it*/
const assert  = require('assert'),
      resolve = require('../utils/resolve');

let path;

describe('utils/resolve', () => {
  it('should define remote URLs as external', () => {
    assert.ok(resolve('//data/products.json').external);
    assert.ok(resolve('http://data/products.json').external);
  });
  it('should define email links as external', () => {
    assert.ok(resolve('mailto:email@example.com').external);
  });
  it('should normalize absolute paths', () => {
    path = resolve('/data/products.json', 'lib/products/index.html');
    assert.strictEqual(path.href, 'data/products.json');
  });
  it('should normalize relative paths', () => {
    path = resolve('icons.woff', 'lib/fonts/index.less');
    assert.strictEqual(path.href, 'lib/fonts/icons.woff');
    path = resolve('lib/utils.less', 'lib/similar/index.less');
    assert.strictEqual(path.href, 'lib/utils.less');
  });
});
