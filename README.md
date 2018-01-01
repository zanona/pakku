Pakku | パック
===
[![Maintainability](https://img.shields.io/codeclimate/maintainability/zanona/pakku.svg?style=flat-square)](https://codeclimate.com/github/zanona/pakku/maintainability)
[![Test Coverage](https://img.shields.io/codeclimate/c/zanona/pakku.svg?style=flat-square)](https://codeclimate.com/github/zanona/pakku/test_coverage)
[![Travis CI](https://img.shields.io/travis/zanona/pakku/master.svg?style=flat-square)](https://travis-ci.org/zanona/pakku)
[![AppVeyor](https://img.shields.io/appveyor/ci/zanona/pakku/master.svg?label=build+(win32)&style=flat-square)](https://ci.appveyor.com/project/zanona/pakku/branch/master)
[![NPM Version](https://img.shields.io/npm/v/pakku.svg?style=flat-square)](https://npmjs.com/package/pakku)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-XO-brightgreen.svg?style=flat-square)](https://github.com/sindresorhus/xo)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square)](https://conventionalcommits.org)


A Command-line application for packing web sites and applications into a directory full of goodness and performance improvements.

## What does it do?
- Searches through your whole web site/application, looking for assets, links, pages, images, and what not.
- Offers helper functions to improve your development.
- Replaces them with versionized names using last Git commit Id — _Bye bye “Please clean your browser cache!”_
- Optmise and minify all things! (HTML, Javascript, CSS, Less, JPG, GIF, PNG, SVG)
- A flavoursome directory files will be created with all the nifty files inside.

## Installation
Install this command via npm through:

    npm install pakku

_(standard `-g` `-S` flags apply depending on your needs)_

## Usage

While in the project directory, run:

    pakku <path-to-index-page> <output-dir>

**Please notice that the output directory is removed and re-created for every build/command ran, so choose wisely before deleting something you don't want to.**

Now sit back, relax, and watch the magic happen.

---
## Helpers
I have created a few helpers which are here to enchance development experience, for now they are:

#### HTML
- `data-dev`: Every tag having this attribute will be stripped out of your build.
- `data-inline`: Instead of update the file name reference it will instead, replaced with the expanded and minfied file contents.
    - `<link rel=stylesheet href=main.css>` becomes `<style>...main.css contents...</style>`
    - `<script src=main.js></script>` becomes `<script>...main.js contents...</script>`

#### Javascript
- Strings with filenames prefixed with `@` will be expanded and inlined. _i.e: `var src = '@main.html';`_

---
## Bugs
You will probably find a lot of it. It still in early development _(0.x.x)_, but you are more than welcome to [fill a bug report](https://github.com/zanona/pakku/issues) letting me know how things are or aren't working for you. I appreciate your time to contribute to the project for a better future.

---
## License
MIT and new BSD.
