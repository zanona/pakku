const {test}  = require('ava'),
      html    = require('../../lib/parser/html');

test('should strip rel atrr from expanded style tags', (t) => {
  const content = html.setContent({
    name: 'index.html',
    contents: '<link data-inline rel=stylesheet href=index.less>'
  });
  t.false(/rel="stylesheet"/.test(content));
});
