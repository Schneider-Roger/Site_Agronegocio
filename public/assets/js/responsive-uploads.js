document.addEventListener('DOMContentLoaded', function () {
  const RESPONSIVE_WIDTHS = [480, 768, 1024, 1440, 1920];

  function stripQuery(url) {
    if (!url) return '';
    return url.split('?')[0];
  }

  function buildVariantSrcset(basePath, ext) {
    return RESPONSIVE_WIDTHS
      .map(width => `${basePath}-w${width}.${ext} ${width}w`)
      .join(', ');
  }

  function shouldUpgrade(src) {
    if (!src) return false;
    const clean = stripQuery(src);
    if (!/\/uploads\//i.test(clean)) return false;
    return /\.(avif|webp)$/i.test(clean);
  }

  document.querySelectorAll('img').forEach(img => {
    if (img.closest('picture')) return;
    const src = img.getAttribute('src') || '';
    if (!shouldUpgrade(src)) return;

    const clean = stripQuery(src);
    const basePath = clean.replace(/\.(avif|webp)$/i, '');
    const sizes = img.getAttribute('data-sizes') || '100vw';

    const picture = document.createElement('picture');

    const sourceAvif = document.createElement('source');
    sourceAvif.type = 'image/avif';
    sourceAvif.srcset = buildVariantSrcset(basePath, 'avif');
    sourceAvif.sizes = sizes;
    picture.appendChild(sourceAvif);

    const sourceWebp = document.createElement('source');
    sourceWebp.type = 'image/webp';
    sourceWebp.srcset = buildVariantSrcset(basePath, 'webp');
    sourceWebp.sizes = sizes;
    picture.appendChild(sourceWebp);

    img.src = `${basePath}.webp`;
    img.srcset = buildVariantSrcset(basePath, 'webp');
    img.sizes = sizes;

    img.replaceWith(picture);
    picture.appendChild(img);
  });
});
