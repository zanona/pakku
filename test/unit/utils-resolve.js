const {test} = require('ava')
const resolve = require('../../lib/utils/resolve')

let path

test('should define remote URLs as external', (t) => {
  t.true(resolve('//data/products.json').external)
  t.true(resolve('http://data/products.json').external)
})
test('should define email links as external', (t) => {
  t.true(resolve('mailto:email@example.com').external)
})
test('should normalize absolute paths', (t) => {
  path = resolve('/data/products.json', 'lib/products/index.html')
  t.is(path.name, 'data/products.json')
})
test('should stack relative paths', (t) => {
  path = resolve('icons.woff', 'lib/fonts/index.less')
  t.is(path.name, 'lib/fonts/icons.woff')
  path = resolve('lib/utils.less', 'lib/similar/index.less')
  t.is(path.name, 'lib/similar/lib/utils.less')
})
