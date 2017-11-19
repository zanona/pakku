module.exports = (src) => {
  if (src.match(/\.(html|xml|md|mdown|markdown)$/)) return 'html';
  if (src.match(/\.(png|gif|jpg|svg|ico)$/)) return 'img';
  if (src.match(/\.(css|less|scss|sass)$/)) return 'css';
  if (src.match(/\.(js|json|ld\+json)$/)) return 'js';
  if (src.match(/\.(txt|rtf)$/)) return 'txt';
  return 'other';
};
