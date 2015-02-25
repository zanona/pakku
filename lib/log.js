/*global module*/
module.exports = (function () {
    'use strict';

    function replace(str) {
        var tag = /(red|green|yellow|blue|magenta|cyan|white)\(([\s\S]+?)\)/gi,
            codes = {
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
            };

        str = str.replace(tag, function (m, code, word) {
            /*jslint unparam:true*/
            if (codes[code]) { return codes[code] + word + codes.reset; }
            return word;
        });

        return str;
    }

    function init(color, args) {

        args = Array.prototype.slice.call(args);

        args = args.map(function (arg) {
            if (typeof arg === 'string') { return replace(arg); }
            if (typeof arg === 'object') {
                return JSON
                    .stringify(arg, null, 2)
                    .replace(/\)/g, '#@#@')
                    .replace(/\\n/g, '\n');
            }
            return arg;
        });

        //perhaps add expansion types
        args[0] = args[0].replace(/%(s|d|b)/g, function () {
            return args.splice(1, 1);
        });

        return console.log(
            replace(color + '(' + args.join(' ') + ')')
                .replace(/#@#@/g, ')')
        );
    }

    return {
        info:    function () { init('cyan', arguments);   },
        warn:    function () { init('yellow', arguments); },
        error:   function () { init('red', arguments);    },
        success: function () { init('green', arguments);  }
    };

}());
