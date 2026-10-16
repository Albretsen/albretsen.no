// prism-lattice.js — Albretsen AS / design 34 "Tension Prism"
// Rasterises any word onto an equilateral-triangle lattice. Every glyph becomes
// a field of small crystal facets. Used by the static wordmark build AND by the
// live hero (prism-wordmark.js). No dependencies.

export const SQRT3_2 = Math.sqrt(3) / 2;

/**
 * @param {string} text
 * @param {object} o
 *   rows      lattice rows across the cap height (default 9)
 *   side      triangle side in px (default 24)
 *   font      CSS font (family only), drawn at weight/width set by fontSpec
 *   fontSpec  full canvas font string override
 *   tracking  extra spacing between letters, in triangle sides
 * @returns {{tris: Array<{k:number,j:number,up:boolean,pts:number[],cx:number,cy:number}>, width:number, height:number, side:number}}
 */
export function latticeFor(text, o = {}) {
  const rows = o.rows ?? 9;
  const s = o.side ?? 24;
  const h = s * SQRT3_2;
  const capPx = rows * h;
  const pad = h * 2; // exact multiple of the row height: baseline + cap line land on lattice rows
  // Canvas: draw glyphs so the cap height spans exactly `rows` lattice rows.
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const fontPx = capPx / 0.72; // Anybody cap height ≈ 0.72em
  const font = o.fontSpec || `900 ${fontPx}px ${o.font || '"Anybody", "Arial Black", sans-serif'}`;
  ctx.font = font;
  if ('fontStretch' in ctx) ctx.fontStretch = o.stretch || 'expanded';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${(o.tracking ?? 0.35) * s}px`;
  const w = Math.ceil(ctx.measureText(text).width + pad * 2);
  c.width = w; c.height = Math.ceil(capPx + pad * 2 + 1);
  ctx.font = font;
  if ('fontStretch' in ctx) ctx.fontStretch = o.stretch || 'expanded';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${(o.tracking ?? 0.35) * s}px`;
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, pad, pad + capPx);
  const img = ctx.getImageData(0, 0, c.width, c.height).data;
  const at = (x, y) => {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= c.width || y >= c.height) return 0;
    return img[(y * c.width + x) * 4 + 3] / 255;
  };
  const tris = [];
  const nRows = Math.ceil(c.height / h);
  const nCols = Math.ceil((c.width / s) * 2) + 2;
  for (let j = 0; j < nRows; j++) {
    const y0 = j * h, y1 = y0 + h;
    for (let k = -1; k < nCols; k++) {
      const x0 = k * s / 2;
      const up = ((k + j) & 1) === 0;
      // three sample points near the centroid → coverage vote
      const cx = x0 + s / 2;
      const cy = up ? y0 + h * 2 / 3 : y0 + h / 3;
      const r = s * 0.18;
      const cov = (at(cx, cy) * 2 + at(cx - r, cy + (up ? r * .5 : -r * .5)) + at(cx + r, cy + (up ? r * .5 : -r * .5)) + at(cx, cy + (up ? -r : r))) / 5;
      if (cov < 0.5) continue;
      const pts = up ? [x0, y1, x0 + s / 2, y0, x0 + s, y1] : [x0, y0, x0 + s, y0, x0 + s / 2, y1];
      tris.push({ k, j, up, pts, cx, cy });
    }
  }
  // trim to bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const t of tris) for (let i = 0; i < 6; i += 2) {
    minX = Math.min(minX, t.pts[i]); maxX = Math.max(maxX, t.pts[i]);
    minY = Math.min(minY, t.pts[i + 1]); maxY = Math.max(maxY, t.pts[i + 1]);
  }
  // snap offset to the lattice so different words share one grid
  const ox = Math.floor(minX / s) * s, oy = Math.floor(minY / (2 * h)) * 2 * h;
  for (const t of tris) {
    for (let i = 0; i < 6; i += 2) { t.pts[i] -= ox; t.pts[i + 1] -= oy; }
    t.cx -= ox; t.cy -= oy;
  }
  return { tris, width: maxX - ox, height: maxY - oy, side: s };
}

/** Facet shade 0..1 for a triangle: a fixed key light from the upper left,
 *  up/down facets catch it differently, plus a little crystal noise. */
export function facetShade(t, W, H) {
  const n = Math.sin(t.k * 12.9898 + t.j * 78.233) * 43758.5453;
  const noise = n - Math.floor(n);
  const base = t.up ? 0.94 : 0.74;
  const grad = 0.12 * (1 - (t.cx / W) * 0.6 - (t.cy / H) * 0.4);
  return Math.max(0.45, Math.min(1, base + grad + (noise - 0.5) * 0.1));
}

/** Is this facet inside the diagonal "beam" (the refracted band of primary)? */
export function inBeam(t, W, H, at = 0.62, width = 0.03) {
  const u = (t.cx / W) * 0.8 + (1 - t.cy / H) * 0.2; // shallow diagonal
  return Math.abs(u - at) < width;
}

export function shrink(pts, cx, cy, f) {
  const out = new Array(6);
  for (let i = 0; i < 6; i += 2) { out[i] = cx + (pts[i] - cx) * f; out[i + 1] = cy + (pts[i + 1] - cy) * f; }
  return out;
}
