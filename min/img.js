const imagemin         = require('imagemin'),
      imageminJpegtran = require('imagemin-jpegtran'),
      imageminPngquant = require('imagemin-pngquant'),
      imageminSvgo     = require('imagemin-svgo'),
      batchPromises    = require('batch-promises'),
      plugins = [
        imageminJpegtran(),
        imageminPngquant({quality: '90'}),
        imageminSvgo()
      ],
      log = require('../utils').log;

function run(file) {
  return imagemin.buffer(file.contents, {plugins}).then((cFile) => {
    const originalSize   = file.contents.length,
          compressedSize = cFile.length,
          compression    = 100 - Math.ceil((compressedSize * 100) / originalSize);
    file.contents = cFile;
    if (compression) log.info('[%s] compressed in %s%', file.name, compression);
    return file;
  }).catch((e) => {
    e.fileName = file.name;
    throw e;
  });
}
module.exports = (files) => batchPromises(10, files, run);

