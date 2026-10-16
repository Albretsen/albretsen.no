// Uranographia — the interactive star chart (centrepiece). SVG + Web Animations API, no dependencies.
//
//   import { mountChart } from './assets/js/uranographia.js';
//   const chart = mountChart(document.querySelector('#sky'), { reading: 'sky' });
//   chart.setReading('ledger');   // the same stars, re-read as a dated unit chart
//   chart.setReading('sky');      // back to constellations
//   chart.destroy();
//
// Two readings of one dataset: "sky" (each product a constellation on a planisphere) and
// "ledger" (each star becomes one unit of a dot chart, stacked over the year the product began).
// The pointer is a mass: nearby stars lean toward it (gravity), and a hovered constellation
// redraws its figure lines. Respects prefers-reduced-motion.

import { PRODUCTS, OBSOLETE, fieldPoints, MAG_R } from './sky-data.js';
import { el, NS, defs, graticule, gapSeg, sparklePath } from './draw.js';

const W = 1200, H = 800, CX = 600, CY = 410, R = 330;
const EASE = 'cubic-bezier(.65,0,.35,1)';
const EASE_OUT = 'cubic-bezier(.16,1,.3,1)';

// Where each live figure sits on the sky (box x, y, size)
const PLACE = {
  'mcp-emails': [330, 150, 210],
  'fun-libs': [640, 120, 230],
  'toolrails': [345, 430, 200],
  'harbor': [660, 440, 190],
};

export function mountChart(host, { reading = 'sky', ink = '#eceaee', dim = '#737076', labels = true } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'uranographia');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Star chart: Albretsen AS products drawn as constellations');
  svg.style.cssText = 'width:100%;height:auto;display:block;overflow:visible;touch-action:pan-y';
  host.appendChild(svg);
  defs(svg, ink);

  const sky = el('g', { class: 'u-sky' }, svg);
  const grat = graticule(sky, CX, CY, R, { ink, opacity: .2, rings: 5, spokes: 24 });
  // Ledger reading = a star catalogue: one row per figure, a year axis, the figure's own
  // stars re-laid as a unit strip starting at the year the product began. (hidden in sky reading)
  const allFigs = [...PRODUCTS.map((p) => ({ p, live: true })), ...OBSOLETE.map((p) => ({ p, live: false }))];
  const axis = el('g', { class: 'u-axis', fill: ink, opacity: 0 }, svg);
  const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const AX0 = 420, AX1 = 1010, ROW0 = 118, ROWH = 54;
  const yx = (y) => AX0 + (y - 2016) / 10 * (AX1 - AX0);
  const rowY = (i) => ROW0 + i * ROWH;
  const mono = { 'font-family': 'Geist Mono, monospace', stroke: 'none' };
  const AYB = rowY(allFigs.length) - 14;
  YEARS.forEach((y) => {
    el('line', { x1: yx(y), y1: ROW0 - 40, x2: yx(y), y2: AYB, stroke: ink, 'stroke-width': .5, opacity: y % 5 === 1 ? .32 : .14, 'stroke-dasharray': '2 4' }, axis);
    const t = el('text', { ...mono, x: yx(y), y: ROW0 - 50, 'text-anchor': 'middle', 'font-size': 10.5, 'letter-spacing': 1.4, opacity: .7 }, axis);
    t.textContent = y;
  });
  el('text', { ...mono, x: 110, y: ROW0 - 50, 'font-size': 10, 'letter-spacing': 2.2, opacity: .5 }, axis).textContent = 'CATALOGUE · FIGURE · SINCE';
  el('text', { ...mono, x: 110, y: AYB + 34, 'font-size': 9.5, 'letter-spacing': 2, opacity: .45 }, axis).textContent =
    'SAME STARS, SECOND READING · EACH DOT IS ONE STAR OF ITS CONSTELLATION, LAID FROM THE YEAR IT BEGAN';
  allFigs.forEach(({ p, live }, i) => {
    const y = rowY(i);
    el('line', { x1: 110, y1: y + 22, x2: 1090, y2: y + 22, stroke: ink, 'stroke-width': .5, opacity: .12 }, axis);
    const t = el('text', { x: 110, y: y + 5, fill: live ? ink : dim, 'font-family': live ? 'Instrument Serif, serif' : 'Geist Mono, monospace', 'font-size': live ? 22 : 10.5, 'letter-spacing': live ? 0 : 1.6 }, axis);
    t.textContent = live ? p.name : (p.short || p.name).toUpperCase();
    const t2 = el('text', { ...mono, x: 300, y: y + 4, fill: dim, 'font-size': 9.5, 'letter-spacing': 1.6 }, axis);
    t2.textContent = (live ? p.figure : (p.note || 'retired')).toUpperCase();
    el('path', { d: sparklePath(yx(p.since), y, live ? 5 : 3.5, 1), fill: live ? ink : dim, opacity: .9 }, axis);
  });
  const ledgerPos = (rowIdx, since, i) => [yx(since) + 12 + Math.floor(i / 2) * 8.5, rowY(rowIdx) - 4 + (i % 2) * 8.5];

  // ---- build figures ----
  const figures = [];
  allFigs.forEach(({ p, live }, fi) => {
    let x, y, size;
    if (live) [x, y, size] = PLACE[p.id];
    else { // obsolete figures orbit the rim, small and faint
      const a = (-0.62 + (fi - PRODUCTS.length) * 0.205) * Math.PI;
      const rr = R + 92; size = 74;
      x = CX + Math.cos(a) * rr - size / 2; y = CY + Math.sin(a) * rr * .98 - size / 2;
    }
    const s = size / 100;
    const g = el('g', { class: `u-fig ${live ? 'live' : 'obsolete'}`, 'data-id': p.id, tabindex: live ? 0 : -1 }, sky);
    const col = live ? ink : dim;
    const hit = el('rect', { x, y, width: size, height: size, fill: 'transparent' }, g);
    const lg = el('g', { stroke: col, 'stroke-width': live ? 1.1 : .8, 'stroke-linecap': 'round', opacity: live ? .62 : .5 }, g);
    const P = p.stars.map(([px, py, m]) => [x + px * s, y + py * s, live ? m : Math.min(4, m + 1)]);
    const sc = live ? 1.25 : .9;
    const lines = p.lines.map(([a, b]) => {
      const [x1, y1, x2, y2] = gapSeg(P[a], P[b], MAG_R[P[a][2]] * sc * 2 + 3, MAG_R[P[b][2]] * sc * 2 + 3);
      const ln = el('line', { x1, y1, x2, y2, pathLength: 1, 'stroke-dasharray': live ? '1 1' : '0.05 0.07', 'stroke-dashoffset': 0 }, lg);
      return ln;
    });
    // ledger destination for each star
    const stars = P.map(([px, py, m], i) => {
      const outer = el('g', { class: 'u-star-pos' }, g);
      const inner = el('g', { class: `u-star m${m}`, transform: `translate(${px} ${py})` }, outer);
      const r = MAG_R[m] * sc;
      if (live && m <= 2) el('circle', { r: r * 3.4, fill: 'url(#u-glow)' }, inner);
      if (live && m === 1) el('path', { d: sparklePath(0, 0, r * 3.6, r * .55), fill: col }, inner);
      el('circle', { r, fill: col }, inner);
      const [lx, ly] = ledgerPos(fi, p.since, i);
      return { outer, inner, x: px, y: py, lx, ly, gx: 0, gy: 0, vx: 0, vy: 0 };
    });
    // field (cluster / dust) — ledger reading keeps them as faint texture under the column
    let fieldEls = [];
    if (live && p.field) {
      const fg = el('g', { fill: ink, class: 'u-field' }, g);
      fieldEls = fieldPoints(p, fi + 3).map(([fx, fy, rr]) => el('circle', { cx: x + fx * s, cy: y + fy * s, r: .4 + rr * .7, opacity: .15 + rr * .4 }, fg));
    }
    let label = null;
    if (labels) {
      label = el('g', { class: 'u-label', opacity: live ? .9 : .6 }, g);
      const lx = x + size / 2, ly = y + size + (live ? 26 : 16);
      const t = el('text', { x: lx, y: ly, 'text-anchor': 'middle', fill: live ? ink : dim, 'font-family': live ? 'Instrument Serif, serif' : 'Geist Mono, monospace', 'font-size': live ? 22 : 9, 'letter-spacing': live ? 0 : 1.6 }, label);
      t.textContent = live ? p.name : (p.short || p.name).toUpperCase();
      if (live) {
        const t2 = el('text', { x: lx, y: ly + 16, 'text-anchor': 'middle', fill: dim, 'font-family': 'Geist Mono, monospace', 'font-size': 9.5, 'letter-spacing': 1.8 }, label);
        t2.textContent = `${p.figure.toUpperCase()} · ${p.since}`;
      }
    }
    const fig = { p, live, g, lines, stars, fieldEls, label, box: [x, y, size] };
    figures.push(fig);
    if (live) {
      const redraw = () => drawLines(fig, 900);
      g.addEventListener('pointerenter', redraw);
      g.addEventListener('focus', redraw);
    }
  });

  // ---- animation helpers (WAAPI) ----
  function drawLines(fig, dur = 900, delay = 0) {
    if (reduce) return;
    fig.lines.forEach((ln, i) => ln.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: dur, delay: delay + i * 45, easing: EASE_OUT, fill: 'backwards' }));
    fig.stars.forEach((s, i) => s.inner.firstElementChild && s.inner.animate(
      [{ opacity: .3 }, { opacity: 1 }], { duration: 500, delay: delay + i * 30, fill: 'backwards' }));
  }

  let current = 'sky';
  function setReading(next) {
    if (next === current) return;
    current = next;
    const toLedger = next === 'ledger';
    const dur = reduce ? 0 : 1400;
    figures.forEach((f, fi) => {
      const stagger = fi * 40;
      f.stars.forEach((s, i) => {
        const k = f.live ? .62 : .9;
        const L = `translate(${s.lx}px,${s.ly}px) scale(${k}) translate(${-s.x}px,${-s.y}px)`;
        const I = 'translate(0px,0px) scale(1) translate(0px,0px)';
        const from = toLedger ? I : L, to = toLedger ? L : I;
        s.outer.animate([{ transform: from }, { transform: to }],
          { duration: dur, delay: stagger + i * 14, easing: EASE, fill: 'forwards' });
      });
      f.lines.forEach((ln) => ln.animate([{ opacity: toLedger ? 1 : 0 }, { opacity: toLedger ? 0 : 1 }],
        { duration: dur * .4, delay: toLedger ? 0 : dur * .8, fill: 'forwards' }));
      if (!toLedger && f.live) drawLines(f, 900, dur * .8);
      [...f.fieldEls].forEach((c) => c.animate([{ opacity: toLedger ? +c.getAttribute('opacity') : 0 }, { opacity: toLedger ? 0 : +c.getAttribute('opacity') }],
        { duration: dur * .5, delay: toLedger ? 0 : dur * .7, fill: 'forwards' }));
      if (f.label) {
        const o = f.live ? .9 : .6;
        f.label.animate([{ opacity: toLedger ? o : 0, transform: toLedger ? 'translateY(0)' : 'translateY(8px)' }, { opacity: toLedger ? 0 : o, transform: toLedger ? 'translateY(8px)' : 'translateY(0)' }],
          { duration: dur * .45, delay: toLedger ? 0 : dur * .75, easing: EASE_OUT, fill: 'forwards' });
      }
    });
    grat.animate([{ opacity: toLedger ? .2 : 0, transform: toLedger ? 'rotate(0deg)' : 'rotate(-14deg)' },
      { opacity: toLedger ? 0 : .2, transform: toLedger ? 'rotate(14deg)' : 'rotate(0deg)' }],
      { duration: dur, easing: EASE, fill: 'forwards' });
    grat.style.transformOrigin = `${CX}px ${CY}px`;
    axis.animate([{ opacity: toLedger ? 0 : 1 }, { opacity: toLedger ? 1 : 0 }], { duration: dur * .6, delay: toLedger ? dur * .5 : 0, fill: 'forwards' });
    axis.style.pointerEvents = toLedger ? 'auto' : 'none';
    svg.dispatchEvent(new CustomEvent('reading', { detail: next }));
  }

  // ---- gravity: the pointer is a mass ----
  let px = -1e4, py = -1e4, raf = 0, active = false;
  const pt = svg.createSVGPoint();
  function onMove(e) {
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM(); if (!m) return;
    const p = pt.matrixTransform(m.inverse()); px = p.x; py = p.y;
    if (!active) { active = true; raf = requestAnimationFrame(tick); }
  }
  function onLeave() { px = -1e4; py = -1e4; }
  function tick() {
    let moving = false;
    for (const f of figures) for (const s of f.stars) {
      const bx = current === 'ledger' ? s.lx : s.x, by = current === 'ledger' ? s.ly : s.y;
      const dx = px - bx, dy = py - by, d2 = dx * dx + dy * dy;
      let tx = 0, ty = 0;
      if (d2 < 160 * 160) { const d = Math.sqrt(d2) || 1; const pull = 1600 / (d + 40); tx = dx / d * Math.min(pull, d * .5); ty = dy / d * Math.min(pull, d * .5); }
      s.vx = (s.vx + (tx - s.gx) * .08) * .82; s.vy = (s.vy + (ty - s.gy) * .08) * .82;
      s.gx += s.vx; s.gy += s.vy;
      if (Math.abs(s.vx) + Math.abs(s.vy) > .01 || Math.abs(s.gx - tx) > .05) moving = true;
      s.inner.setAttribute('transform', `translate(${(s.x + s.gx).toFixed(2)} ${(s.y + s.gy).toFixed(2)})`);
    }
    if (moving || px > -1e3) raf = requestAnimationFrame(tick); else active = false;
  }
  if (!reduce) { svg.addEventListener('pointermove', onMove); svg.addEventListener('pointerleave', onLeave); }

  // first reveal: lines draw on, stars fade up by magnitude
  if (!reduce) {
    figures.forEach((f, i) => drawLines(f, 1100, 200 + i * 120));
    grat.animate([{ opacity: 0, transform: 'rotate(-8deg)' }, { opacity: .2, transform: 'rotate(0)' }], { duration: 2200, easing: EASE_OUT, fill: 'backwards' });
    grat.style.transformOrigin = `${CX}px ${CY}px`;
  }
  if (reading === 'ledger') setReading('ledger');

  return {
    svg, setReading, get reading() { return current; },
    toggle() { setReading(current === 'sky' ? 'ledger' : 'sky'); },
    destroy() { cancelAnimationFrame(raf); svg.remove(); },
  };
}
