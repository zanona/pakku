module.exports = function () {
  let args = Array.prototype.slice.call(arguments)

  args = args.map(function (arg) {
    if (arg.constructor.name === 'RegExp') {
      return arg.toString().replace(/^\/|\/$/g, '')
    }
    if (arg.constructor.name === 'Object') {
      return JSON.stringify(arg)
    }
    return arg
  })

  args[0] = args[0].replace(/%s/g, function () {
    return args.splice(1, 1) || ''
  })

  return args.join(' ')
}
