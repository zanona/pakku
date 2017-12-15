function replace (str) {
  const tag = /(red|green|yellow|blue|magenta|cyan|white)\(([\s\S]+?)\)/gi
  const codes = {
    reset: '\u001b[0m',
    bold: '\u001b[1m',
    italic: '\u001b[3m',
    underline: '\u001b[4m',
    blink: '\u001b[5m',
    black: '\u001b[30m',
    red: '\u001b[31m',
    green: '\u001b[32m',
    yellow: '\u001b[33m',
    blue: '\u001b[34m',
    magenta: '\u001b[35m',
    cyan: '\u001b[36m',
    white: '\u001b[37m'
  }
  str = str.replace(tag, (m, code, word) => {
    if (codes[code]) return codes[code] + word + codes.reset
    return word
  })
  return str
}
function init (type, color, args) {
  args = Array.prototype.slice.call(args)
  args = args.map((arg) => {
    if (typeof arg === 'string') return replace(arg)
    if (typeof arg === 'object') {
      return JSON.stringify(arg, null, 2)
                 .replace(/\)/g, '#@#@')
                 .replace(/\\n/g, '\n')
    }
    return arg
  })

  // perhaps add expansion types
  args[0] = args[0].replace(/%(s|d|b)/g, () => args.splice(1, 1))

  return console[type](
    replace(`${color}(${args.join(' ')})`).replace(/#@#@/g, ')')
  )
}
module.exports = {
  info () { init('info', 'cyan', arguments) },
  success () { init('log', 'green', arguments) },
  warn () { init('warn', 'yellow', arguments) },
  error (err = {}) {
    err.fileName = err.fileName || this.name
    if (err.message) err.message = err.message.split('\n')[0]
    if (!err.message) err.message = err.extract
    if (err.stack) err.stack = err.stack.split('\n')[1].trim()
    init('error', 'red', [`[${err.fileName}] ${err.message} ${err.stack}`])
  }
}
