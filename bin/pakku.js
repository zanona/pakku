#!/usr/bin/env node
const options = parseOptions(process.argv.splice(2))
const log = require('../lib/utils/log')
const pkg = require('../package')
const run = require('../lib')

function parseOptions (args) {
  return args.reduce((opts, opt) => {
    if (!opt.match(/^-+/)) return opts.args.push(opt) && opts
    const kv = opt.split('=')
    const k = kv[0].replace(/-+/, '').trim()
    const v = kv[1] ? kv[1].trim() : true
    opts[k] = v
    return opts
  }, {args: []})
}
function version () {
  log.info(
    '%s - %s \nVersion: %s',
    pkg.name.replace(/^\w/, (m) => m.toUpperCase()),
    pkg.description,
    pkg.version
  )
}
function help () {
  version()
  log.info(
    'Usage:',
    'pakku <path-to-index-page.html> <build-directory>'
  )
}

if (options.v) version()
if (options.h || !options.args.length) help()

run(options.args[0], options.args[1], options)
