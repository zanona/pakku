# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.4.0-rc1.0"></a>
# [1.4.0-rc1.0](https://github.com/zanona/pakku/compare/v1.3.1...v1.4.0-rc1.0) (2017-11-19)


### Bug Fixes

* **compiler/js:** use browserify global transform for imported modules ([0c0429f](https://github.com/zanona/pakku/commit/0c0429f))
* **core:** exiting with error (1) whenever crashing ([3aea4ef](https://github.com/zanona/pakku/commit/3aea4ef))
* **parser/js:** hasImports discovery for modules without extension ([03eb106](https://github.com/zanona/pakku/commit/03eb106))
* **parser/js:** prevent module paths from being rewritten ([cbbdc54](https://github.com/zanona/pakku/commit/cbbdc54))
* **sourcemaps:** failing to resolve absolute urls ([c50e30b](https://github.com/zanona/pakku/commit/c50e30b))
* **sourcemaps:** regression on sourcemaps generation ([fea6a2f](https://github.com/zanona/pakku/commit/fea6a2f))
* **sourcemaps:** regression while sourcemapping inline scripts ([019f74c](https://github.com/zanona/pakku/commit/019f74c))
* **utils:** path normalization on win32 ([92c5b25](https://github.com/zanona/pakku/commit/92c5b25))
* **vfiles:** regression on vname and link rewriting ([84ebb47](https://github.com/zanona/pakku/commit/84ebb47))


### Features

* **compiler/js:** add ability to use nodejs `process.env` variables ([ab2ea4b](https://github.com/zanona/pakku/commit/ab2ea4b))
* **compiler/js:** add support for babel preset-stage-3 ([6167ee8](https://github.com/zanona/pakku/commit/6167ee8))
* **sourcemaps:** add cli flag for enabling sourcemap generation ([a9b1117](https://github.com/zanona/pakku/commit/a9b1117))
* **sourcemaps:** add sourcemap support ([4c244c6](https://github.com/zanona/pakku/commit/4c244c6))
* **sourcemaps:** add support for browserified scripts ([f4cf96d](https://github.com/zanona/pakku/commit/f4cf96d))
* **sourcemaps:** add support for sourcemapping external scripts with `data-inline` ([09ed665](https://github.com/zanona/pakku/commit/09ed665))


### Performance Improvements

* **compiler/img:** update compression logic ([9742f2a](https://github.com/zanona/pakku/commit/9742f2a))
* **compiler/js:** browserify only necessary files ([ca52b2a](https://github.com/zanona/pakku/commit/ca52b2a))
