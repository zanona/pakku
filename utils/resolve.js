module.exports = function (href, parentSrc) {
    'use strict';

    href      = (href || './').toString();
    parentSrc = (parentSrc || './').toString();

    var url = require('url'),
        //path = require('path'),
        ft = require('./filetype'),
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

    /* {
        name: 'index.html',
        external: false,
        type: 'html',
        href: 'index.html?q=1#test,
        query: '?q=1#test',
        path: '/Users/name/Desktop/lib/test/index.html'
    }*/
    //external: /^[\w\-]+:|^\/{2}|^[^\.\w]/.test(href)

    return file;
};
