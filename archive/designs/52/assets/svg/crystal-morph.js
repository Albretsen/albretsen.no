// crystal-morph.js — the signature SVG centrepiece of Design 52.
// Kurr's 1859 crystal habits rotate in an SVG plate and morph, chapter by chapter,
// into the Albretsen mark (a Japan-law quartz twin, 84°33'). The outline is one
// <path> resampled to 120 points and interpolated; facet edges redraw themselves
// with stroke-dashoffset, hidden edges stay dotted like the engraving.
//
//   import { mountCrystalMorph } from './crystal-morph.js';
//   const m = mountCrystalMorph(el, { stages: ['cube','octahedron','quartz','dodecahedron','mark'] });
//   m.setProgress(2.4);   // 0..stages-1 (wire it to scroll). m.play() loops by itself.
//
// Options: { stages, ink:'#f3f6ff', spark:'#ddf93c', fill:'rgba(70,46,235,.0)', labels:true, spin:true }

import { HABITS, project, resample } from './crystals.js';

const N = 120;
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent && parent.appendChild(e);
  return e;
};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// ---- the mark, in the same 200x200 plate space ----
function markGeometry() {
  const half = (84.55 / 2) * Math.PI / 180, w = 15, L = 58, tl = 7, apex = [48, 3];
  const tanh = Math.tan(half);
  const legs = [-1, 1].map((side) => {
    const u = [side * Math.sin(half), Math.cos(half)];
    const n = [-side * Math.cos(half), Math.sin(half)];
    const O = (t, k = 0) => [apex[0] + u[0] * t + n[0] * k, apex[1] + u[1] * t + n[1] * k];
    return { I0: O(w / tanh, w), M0: O(w / 2 / tanh, w / 2), Oe: O(L), Ie: O(L, w), Me: O(L, w / 2), T: O(L + tl, w / 2) };
  });
  const [l, r] = legs;
  const faces = [
    [[apex, l.Oe, l.Me, l.M0], '#ffffff'], [[l.M0, l.Me, l.Ie, l.I0], '#d9dcff'],
    [[l.Oe, l.T, l.Me], '#ffffff'], [[l.Me, l.T, l.Ie], '#6f73e0'],
    [[apex, r.Oe, r.Me, r.M0], '#8f95f5'], [[r.M0, r.Me, r.Ie, r.I0], '#c4c8ff'],
    [[r.Oe, r.T, r.Me], '#ffffff'], [[r.Me, r.T, r.Ie], '#6f73e0'],
  ];
  const outline = [apex, r.Oe, r.T, r.Ie, l.I0, l.Ie, l.T, l.Oe];
  const lines = [[apex, l.I0], [l.M0, l.Me], [r.M0, r.Me], [l.Oe, l.Me], [l.Me, l.Ie], [r.Oe, r.Me], [r.Me, r.Ie]];
  const y0 = 38.5, y1 = 42.3, xin = (y) => (y - (apex[1] + w / Math.sin(half))) * tanh;
  const bar = [[48 - xin(y0), y0], [48 + xin(y0), y0], [48 + xin(y1), y1], [48 - xin(y1), y1]];
  const T = ([x, y]) => [(x - 48) * 1.72, (y - 33) * 1.72];
  return { outline: outline.map(T), lines: lines.map((s) => s.map(T)), bar: bar.map(T), faces: faces.map(([p, c]) => [p.map(T), c]) };
}
const MARK = markGeometry();

function stageShape(name, t) {
  if (name === 'mark') return { hull: MARK.outline, edges: MARK.lines.map(([a, b]) => ({ a, b, visible: true })) };
  const h = HABITS[name];
  const pr = project(h, 0.36, 0.62 + t * 0.35, 46);
  return { hull: pr.hull, edges: pr.edges.map((e) => ({ a: pr.pts2d[e.a], b: pr.pts2d[e.b], visible: e.visible })) };
}

function align(A, B) {
  // cyclic shift of B that best matches A
  let best = 0, bestD = Infinity;
  for (let s = 0; s < N; s += 2) {
    let d = 0;
    for (let i = 0; i < N; i += 4) {
      const p = A[i], q = B[(i + s) % N];
      d += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    }
    if (d < bestD) (bestD = d), (best = s);
  }
  return B.map((_, i) => B[(i + best) % N]);
}
const toPath = (P) => 'M' + P.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L') + 'Z';

export function mountCrystalMorph(container, opts = {}) {
  const {
    stages = ['cube', 'octahedron', 'quartz', 'dodecahedron', 'mark'],
    ink = '#f3f6ff', spark = '#ddf93c', fill = 'rgba(23,10,98,.35)', labels = true, spin = true,
  } = opts;
  const svg = el('svg', { viewBox: '-100 -100 200 200', role: 'img', 'aria-label': 'Crystal habits morphing into the Albretsen mark' }, container);
  svg.style.cssText = 'width:100%;height:100%;display:block;overflow:visible';
  const gFaces = el('g', { opacity: 0 }, svg);
  for (const [p, c] of MARK.faces) el('path', { d: toPath(p), fill: c }, gFaces);
  const gEdges = el('g', { fill: 'none', stroke: ink, 'stroke-linecap': 'round' }, svg);
  const outline = el('path', { fill, stroke: ink, 'stroke-width': 1.4, 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' }, svg);
  const bar = el('path', { fill: spark, opacity: 0 }, svg);
  const glint = el('path', { d: 'M0-9C.6-2.4 2.4-.6 9 0 2.4.6.6 2.4 0 9-.6 2.4-2.4.6-9 0-2.4-.6-.6-2.4 0-9Z', fill: spark }, svg);
  const label = labels ? el('text', { x: 0, y: 96, 'text-anchor': 'middle', fill: ink, 'font-family': 'Geist Mono, ui-monospace, monospace', 'font-size': 6.2, 'letter-spacing': 1.1 }, svg) : null;

  let progress = 0, playing = false, raf = 0, t0 = performance.now();
  const lineEls = new Map();
  const getLines = (key, count) => {
    let arr = lineEls.get(key);
    if (!arr) { arr = []; lineEls.set(key, arr); }
    while (arr.length < count) arr.push(el('line', { pathLength: 1, 'vector-effect': 'non-scaling-stroke' }, gEdges));
    return arr;
  };

  function drawEdges(key, edges, amount, fadeOut) {
    const arr = getLines(key, edges.length);
    arr.forEach((ln, i) => {
      const e = edges[i];
      if (!e || amount <= 0.001) { ln.style.display = 'none'; return; }
      ln.style.display = '';
      ln.setAttribute('x1', e.a[0].toFixed(2)); ln.setAttribute('y1', e.a[1].toFixed(2));
      ln.setAttribute('x2', e.b[0].toFixed(2)); ln.setAttribute('y2', e.b[1].toFixed(2));
      // stagger each edge a little: the plate redraws itself line by line
      const k = clamp(amount * 1.6 - (i / edges.length) * 0.6);
      if (e.visible) {
        ln.setAttribute('stroke-width', 1.1);
        ln.setAttribute('stroke-dasharray', fadeOut ? '1 0' : '1 1');
        ln.setAttribute('stroke-dashoffset', fadeOut ? 0 : 1 - k);
        ln.setAttribute('opacity', fadeOut ? k : 1);
      } else {
        ln.setAttribute('stroke-width', 0.7);
        ln.setAttribute('stroke-dasharray', '0.012 0.03');
        ln.setAttribute('stroke-dashoffset', 0);
        ln.setAttribute('opacity', 0.65 * k);
      }
    });
  }

  function render(now) {
    const time = (now - t0) / 1000;
    const p = clamp(progress, 0, stages.length - 1);
    const i = Math.min(Math.floor(p), stages.length - 2);
    const tRaw = p - i;
    const t = ease(clamp((tRaw - 0.15) / 0.7));
    const spinT = spin ? time * 0.6 : 0;
    const A = stageShape(stages[i], spinT), B = stageShape(stages[i + 1], spinT);
    const RA = resample(A.hull, N), RB = align(RA, resample(B.hull, N));
    const P = RA.map((a, k) => [a[0] + (RB[k][0] - a[0]) * t, a[1] + (RB[k][1] - a[1]) * t]);
    outline.setAttribute('d', toPath(P));
    for (const key of lineEls.keys()) if (key !== i && key !== i + 1) drawEdges(key, [], 0);
    drawEdges(i, A.edges, clamp(1 - t * 2), true);
    drawEdges(i + 1, B.edges, clamp(t * 2 - 1), false);
    const isMark = stages[i + 1] === 'mark';
    bar.setAttribute('d', toPath(MARK.bar));
    const markAmt = isMark ? clamp(t * 3 - 2) : stages[i] === 'mark' ? 1 - t : 0;
    bar.setAttribute('opacity', markAmt);
    gFaces.setAttribute('opacity', markAmt);
    outline.setAttribute('fill-opacity', 1 - markAmt);
    // the glint sits on the top-most vertex of the current outline
    let top = P[0];
    for (const q of P) if (q[1] < top[1]) top = q;
    const s = 0.6 + 0.4 * Math.abs(Math.sin(time * 2.2));
    glint.setAttribute('transform', `translate(${top[0].toFixed(2)} ${(top[1] - 2).toFixed(2)}) scale(${s.toFixed(3)})`);
    if (label) {
      const name = tRaw < 0.5 ? stages[i] : stages[i + 1];
      const h = HABITS[name];
      label.textContent = name === 'mark' ? "ALBRETSEN AS · TWIN, 84°33'" : `FIG. ${h.fig} · ${h.name.toUpperCase()} · ${h.system.toUpperCase()}`;
    }
  }

  const loop = (now) => {
    if (playing) progress = ((now - t0) / 1000 / 2.4) % (stages.length - 1 + 0.6);
    render(now);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    svg,
    setProgress(v) { playing = false; progress = v; },
    play() { playing = true; t0 = performance.now(); },
    stop() { playing = false; },
    dispose() { cancelAnimationFrame(raf); svg.remove(); },
  };
}
