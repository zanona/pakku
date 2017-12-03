# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.4.0"></a>
# [1.4.0](https://github.com/zanona/pakku/compare/v1.3.1...v1.4.0) (2017-12-03)


### Bug Fixes

* **build:** file creation callback as promise ([34fc835](https://github.com/zanona/pakku/commit/34fc835))
* **build:** skip error checking on removing build dir ([7cd10d2](https://github.com/zanona/pakku/commit/7cd10d2))
* **compiler/js:** use browserify global transform for imported modules ([0c0429f](https://github.com/zanona/pakku/commit/0c0429f))
* **core:** exiting with error (1) whenever crashing ([3aea4ef](https://github.com/zanona/pakku/commit/3aea4ef))
* **core:** only run link rewriting if files are passed ([8d5d8da](https://github.com/zanona/pakku/commit/8d5d8da))
* **core:** replace Object.entries to support node 6 ([a2b4e79](https://github.com/zanona/pakku/commit/a2b4e79))
* **logger:** safe guard undefined err.stack ([fc5fdc5](https://github.com/zanona/pakku/commit/fc5fdc5))
* **parser/js:** hasImports discovery for modules without extension ([03eb106](https://github.com/zanona/pakku/commit/03eb106))
* **parser/js:** prevent module paths from being rewritten ([cbbdc54](https://github.com/zanona/pakku/commit/cbbdc54))
* **sourcemaps:** failing to resolve absolute urls ([c50e30b](https://github.com/zanona/pakku/commit/c50e30b))
* **sourcemaps:** regression on sourcemaps generation ([fea6a2f](https://github.com/zanona/pakku/commit/fea6a2f))
* **sourcemaps:** regression while sourcemapping inline scripts ([019f74c](https://github.com/zanona/pakku/commit/019f74c))
* **sourcemaps:** use absolute URL for sourceMappingURL ([9ef76db](https://github.com/zanona/pakku/commit/9ef76db))
* **utils:** path normalization on win32 ([92c5b25](https://github.com/zanona/pakku/commit/92c5b25))
* **vfiles:** check for git repo before sha hashing ([8acb2a5](https://github.com/zanona/pakku/commit/8acb2a5))
* **vfiles:** regression on vname and link rewriting ([84ebb47](https://github.com/zanona/pakku/commit/84ebb47))


### Features

* **compiler/js:** add ability to use nodejs `process.env` variables ([ab2ea4b](https://github.com/zanona/pakku/commit/ab2ea4b))
* **compiler/js:** add support for babel preset-stage-3 ([6167ee8](https://github.com/zanona/pakku/commit/6167ee8))
* **core:** allow programatic access as event emitter ([e399b03](https://github.com/zanona/pakku/commit/e399b03))
* **sourcemaps:** add cli flag for enabling sourcemap generation ([a9b1117](https://github.com/zanona/pakku/commit/a9b1117))
* **sourcemaps:** add sourcemap support ([4c244c6](https://github.com/zanona/pakku/commit/4c244c6))
* **sourcemaps:** add support for browserified scripts ([f4cf96d](https://github.com/zanona/pakku/commit/f4cf96d))
* **sourcemaps:** add support for sourcemapping external scripts with `data-inline` ([09ed665](https://github.com/zanona/pakku/commit/09ed665))


### Performance Improvements

* **compiler/img:** update compression logic ([9742f2a](https://github.com/zanona/pakku/commit/9742f2a))
* **compiler/js:** browserify only necessary files ([ca52b2a](https://github.com/zanona/pakku/commit/ca52b2a))
