#!/usr/bin/env node
/*jslint node:true*/
(function () {
    'use strict';
    var log = require('./utils/log'),
        pkg = require('./package'),
        run = require('./'),
        args = process.argv.splice(2);

    function version() {
        log.info(
            '%s - %s \nVersion: %s',
            pkg.name.replace(/^\w/, function (m) { return m.toUpperCase(); }),
            pkg.description,
            pkg.version
        );
    }

    function help() {
        version();
        log.info(
            'Usage:',
            'pakku <path-to-index-page.html> <build-directory>'
        );
    }

    if (args[0] === '-v') { return version(); }
    if (args[0] === '-h' || args.length < 2) { return help(); }

    run.apply(null, args);
}());
