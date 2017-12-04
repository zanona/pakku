module.exports = (src) => {
  let type = 'other';
  if (src.match(/\.(html|xml|md|mdown|markdown)$/)) type = 'html';
  if (src.match(/\.(png|gif|jpg|svg|ico)$/))        type = 'img';
  if (src.match(/\.(css|less|scss|sass)$/))         type = 'css';
  if (src.match(/\.(js|json|ld\+json)$/))           type = 'js';
  if (src.match(/\.(txt|rtf)$/))                    type = 'txt';
  return type;
};
