const path      = require('path'),
      marked    = require('marked').setOptions({smartypants: true}),
      i         = require('../utils/interpolate'),
      validTags = new RegExp(i(
        /<(%s)\b([^>]*)>(?:([\s\S]*?)<\/\1>)?/,
        'script|link|style'
      ), 'gi'),
      SSIPattern = /<!--#include file=[\"\']?(.+?)[\"\']? -->/g;
let tmpFiles;

function flattenAttrs(attrs) {
  return Object.keys(attrs).map((key) => {
    if (attrs[key] === true || !attrs[key]) return key;
    const value = (attrs[key] || '').replace(/"/g, '\"');
    return `${key}="${value}"`;
  }).join(' ');
}
function getAttrs(str) {
  const r = {},
        search = /\b([\w\-]+)\b=?(?:(["'])([\s\S]+?)\2|([^ ]+)|)/g;
  str.replace(search, (m, key, sep, value, altValue) => {
    if (!value && !altValue) {
      r[key] = true;
    } else {
      r[key] = value || altValue;
    }
  });
  return r;
}
function stripCommentsExceptSSI(str) {
  return str.replace(/<!--(?!#include)[\s\S]*?-->/gmi, '');
}

function parse(match, tag, attrs, textContent, index, content) {

  attrs = getAttrs(attrs);

  if (attrs['data-dev']) return '';

  const file   = this,
        src    = attrs.src || attrs.href,
        line   = (content.substr(0, index).match(/\n/g) || []).length + 1, //non-zero based count
        column = match.indexOf(textContent) + 1, //non-zero based count
        inline = src && attrs['data-inline'],
        meta   = {};

  let fileType, tmpFilename;

  if (attrs.type) {
    // parse type attribute such type=text/less
    fileType = attrs.type.split('/')[1];
    if (fileType === 'ld+json') {
      fileType = 'json';
    } else {
      // need to remove or rename type attributes
      // otherwise DOM won't interpret `text/less` correctly
      delete attrs.type;
    }
  }

  if (inline) {
    delete attrs.src;
    delete attrs.href;
    delete attrs['data-inline'];
    file.includes = file.includes || [];
    file.includes.push(src);
  }

  attrs = flattenAttrs(attrs);

  if (tag.match(/style|script/) && textContent) {
    const name = path.basename(file.name).replace(path.extname(file.name), ''),
          ext = fileType || (tag === 'style' ? 'css' : 'js');
    tmpFilename = `${name}-${tag}-${line}_${column}.${ext}`;
    tmpFiles[tmpFilename] = textContent;
    meta.line = line;
    meta.column = column;
    tmpFiles[`${tmpFilename}_meta`] = meta;
    return `<${tag} ${attrs}>@${tmpFilename}</${tag}>`;
  }

  if (tag.match(/link|script/) && inline) {
    const nodeName = tag === 'link' ? 'style' : 'script';
    return `<${nodeName} ${attrs}>@${src}</${nodeName}>`;
  }

  /* AMD require.js support */
  if (tag === 'script' && attrs['data-main']) {
    attrs.src = `__amd_${attrs['data-main']}`;
    if (!path.extname(attrs.src)) attrs.src += '.js';
    delete attrs['data-main'];
    return `<script ${attrs}></script>`;
  }

  return match;
}

function parseSSI(m, filePath) {
  const file = this;
  // assign the inclusion on the vFile
  file.includes = file.includes || [];
  file.includes.push(filePath);
  return `@${filePath}`;
}

exports.setContent = function (content, file) {
  // need to clean cache once it persists accross instances
  tmpFiles = {};

  // if markdown, convert to html
  if (path.extname(file.name) === '.md') content = marked(content);

  return stripCommentsExceptSSI(content)
         .replace(validTags, parse.bind(file))
         .replace(SSIPattern, parseSSI.bind(file));
};

exports.setResource = function (file, parent) {
  file = JSON.parse(JSON.stringify(file));
  const basename = path.basename(file.name);
  if (tmpFiles[basename]) {
    file.contents   = tmpFiles[basename];
    file.parentHref = parent.name;
  }
  // assign extra info added during the setContent method
  if (tmpFiles[basename + '_meta']) {
    Object.assign(file, tmpFiles[basename + '_meta']);
  }
  return file;
};
