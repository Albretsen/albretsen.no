// Uranographia — SVG drawing primitives shared by the star chart, the plates and the loader.
// Atlas convention: figure lines stop short of every star; stars are sized by magnitude;
// the brightest star of a figure carries a four-point diffraction sparkle.
import { MAG_R } from './sky-data.js';

export const NS = 'http://www.w3.org/2000/svg';
export const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};

export function sparklePath(cx, cy, R, k = R * 0.2) {
  const f = (n) => Math.round(n * 100) / 100;
  return `M${f(cx)} ${f(cy - R)}C${f(cx + k * .3)} ${f(cy - k)} ${f(cx + k)} ${f(cy - k * .3)} ${f(cx + R)} ${f(cy)}` +
    `C${f(cx + k)} ${f(cy + k * .3)} ${f(cx + k * .3)} ${f(cy + k)} ${f(cx)} ${f(cy + R)}` +
    `C${f(cx - k * .3)} ${f(cy + k)} ${f(cx - k)} ${f(cy + k * .3)} ${f(cx - R)} ${f(cy)}` +
    `C${f(cx - k)} ${f(cy - k * .3)} ${f(cx - k * .3)} ${f(cy - k)} ${f(cx)} ${f(cy - R)}Z`;
}

/** Segment between two points, shortened by gapA/gapB (atlas convention). */
export function gapSeg(a, b, gapA, gapB) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  return [a[0] + ux * gapA, a[1] + uy * gapA, b[0] - ux * gapB, b[1] - uy * gapB];
}

/**
 * Draw a constellation figure into `g`.
 * opts: x, y, size (px of the 0..100 box), ink, lineOpacity, starScale, glow (bool), field (array), fieldInk
 * returns { stars: [circle...], lines: [line...], field: [circle...] }
 */
export function drawFigure(g, fig, opts = {}) {
  const { x = 0, y = 0, size = 100, ink = 'currentColor', lineOpacity = .62, starScale = 1, lineWidth = 1, glow = true, field = null } = opts;
  const s = size / 100;
  const P = fig.stars.map(([px, py, m]) => [x + px * s, y + py * s, m]);
  const out = { stars: [], lines: [], field: [], points: P };
  if (field) {
    const fg = el('g', { class: 'u-field', fill: ink }, g);
    for (const [fx, fy, r] of field) {
      out.field.push(el('circle', { cx: (x + fx * s).toFixed(2), cy: (y + fy * s).toFixed(2), r: (0.35 + r * 0.75) * starScale, opacity: (0.18 + r * 0.45).toFixed(2) }, fg));
    }
  }
  const lg = el('g', { class: 'u-lines', stroke: ink, 'stroke-width': lineWidth, 'stroke-linecap': 'round', opacity: lineOpacity }, g);
  const dashed = new Set(fig.dashed || []);
  fig.lines.forEach(([a, b], i) => {
    const ra = MAG_R[P[a][2]] * starScale * 2 + 2.5, rb = MAG_R[P[b][2]] * starScale * 2 + 2.5;
    const [x1, y1, x2, y2] = gapSeg(P[a], P[b], ra, rb);
    const ln = el('line', { x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2), pathLength: 1 }, lg);
    if (dashed.has(i)) ln.setAttribute('stroke-dasharray', '0.04 0.06');
    out.lines.push(ln);
  });
  const sg = el('g', { class: 'u-stars', fill: ink }, g);
  P.forEach(([px, py, m]) => {
    const r = MAG_R[m] * starScale;
    const gr = el('g', { class: `u-star m${m}`, transform: `translate(${px.toFixed(2)} ${py.toFixed(2)})` }, sg);
    if (glow && m <= 2) el('circle', { r: r * 3.2, fill: 'url(#u-glow)', class: 'u-halo' }, gr);
    if (m === 1) el('path', { d: sparklePath(0, 0, r * 3.4, r * 0.55) }, gr);
    el('circle', { r }, gr);
    out.stars.push(gr);
  });
  return out;
}

/** Shared <defs>: soft radial glow used behind bright stars. */
export function defs(svg, ink = '#eceaee') {
  const d = el('defs', {}, svg);
  const rg = el('radialGradient', { id: 'u-glow' }, d);
  el('stop', { offset: '0', 'stop-color': ink, 'stop-opacity': '.55' }, rg);
  el('stop', { offset: '.35', 'stop-color': ink, 'stop-opacity': '.14' }, rg);
  el('stop', { offset: '1', 'stop-color': ink, 'stop-opacity': '0' }, rg);
  return d;
}

/** Planisphere graticule: declination circles + hour spokes + a degree ring. */
export function graticule(g, cx, cy, R, { ink = 'currentColor', opacity = .22, rings = 5, spokes = 24, ticks = 360 } = {}) {
  const gg = el('g', { class: 'u-graticule', stroke: ink, fill: 'none', opacity }, g);
  for (let i = 1; i <= rings; i++) el('circle', { cx, cy, r: (R * i / rings).toFixed(2), 'stroke-width': i === rings ? .9 : .5, 'stroke-dasharray': i === rings ? '' : '2 5' }, gg);
  for (let i = 0; i < spokes; i++) {
    const a = i / spokes * Math.PI * 2;
    el('line', { x1: (cx + Math.cos(a) * R * .2).toFixed(2), y1: (cy + Math.sin(a) * R * .2).toFixed(2), x2: (cx + Math.cos(a) * R).toFixed(2), y2: (cy + Math.sin(a) * R).toFixed(2), 'stroke-width': .4 }, gg);
  }
  let d = '';
  for (let i = 0; i < ticks; i++) {
    const a = i / ticks * Math.PI * 2, l = i % 15 === 0 ? 10 : i % 5 === 0 ? 6 : 3;
    d += `M${(cx + Math.cos(a) * R).toFixed(1)} ${(cy + Math.sin(a) * R).toFixed(1)}L${(cx + Math.cos(a) * (R + l)).toFixed(1)} ${(cy + Math.sin(a) * (R + l)).toFixed(1)}`;
  }
  el('path', { d, 'stroke-width': .5 }, gg);
  el('circle', { cx, cy, r: R + 10, 'stroke-width': .5 }, gg);
  return gg;
}
