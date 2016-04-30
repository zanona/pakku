var url  = require('url'),
    path = require('path'),
    ft   = require('./filetype');

module.exports = function (href, parentSrc) {
    href      = (href || './').toString();
    parentSrc = (parentSrc || './').toString();

    var dir       = process.cwd(),
        parentDir = path.dirname(parentSrc),
        uri,
        file;

    /* IF PATH IS / ASSUME HTML AND FALLBACK TO INDEX FILE */
    if (href === '/') { href = '/index.html'; }
    /* IF PATH STARTS WITH / PREPEND PROCESS.CWD */
    if (href.match(/^\//)) {
        href = dir + href;
        href = path.relative(parentDir, href);
    }

    uri = url.resolveObject(parentSrc, href),
    file = {
        name: uri.pathname,
        external: !!(uri.slashes || uri.protocol),
        type: ft(href),
        //ext: path.parse(uri.pathname).ext,
        href: href, //uri.href is not the original (path resolved),
        query: (uri.search || '') + (uri.hash || '')
        //path: path.resolve(uri.pathname)
    };
    return file;
    /* {
        name: 'index.html',
        external: false,
        type: 'html',
        href: 'index.html?q=1#test,
        query: '?q=1#test',
        path: '/Users/name/Desktop/lib/test/index.html'
    }*/
    //external: /^[\w\-]+:|^\/{2}|^[^\.\w]/.test(href)
};
