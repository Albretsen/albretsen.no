// Uranographia — motion study (Web Animations API). Pair with ../motion.css.
//
//   import { ignite, rise, precess, morph, drawOn } from './assets/js/motion.js';
//   ignite({ until: myAppReadyPromise });     // 1. IGNITION   — the loading moment
//   rise(document.querySelectorAll('[data-rise]'));  // 2. PLATE RISE — entrance
//   precess(() => swapContent());             // 6. PRECESSION — page transition
//   morph(pathEl, fromD, toD, { duration });  // SVG path morph (WAAPI `d`, JS fallback)
//
// References studied: Apple MacBook Pro (start/end-frame reveals, clip + blur settle),
// Radix Primitives (measured-height collapsibles, origin-aware popovers),
// Codrops page preloaders (progress tied to real load), stroke-dashoffset line drawing.

import { ASTERISM, PRODUCTS, rng } from './sky-data.js';
import { NS, el, sparklePath, gapSeg } from './draw.js';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const OUT = 'cubic-bezier(.16,1,.3,1)';
const INOUT = 'cubic-bezier(.65,0,.35,1)';
const GRAVITY = 'cubic-bezier(.55,0,.9,.4)'; // accelerating fall
const ORBIT = 'cubic-bezier(.34,1.56,.64,1)';

/* ------------------------------------------------------------------ morph */
const supportsD = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('d', 'path("M0 0")');
const nums = (d) => d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi).map(Number);
/** Morph an SVG path between two `d` strings with identical command structure. */
export function morph(path, from, to, { duration = 900, delay = 0, easing = INOUT, fill = 'both' } = {}) {
  if (supportsD) return path.animate([{ d: `path("${from}")` }, { d: `path("${to}")` }], { duration, delay, easing, fill });
  // Fallback (Safari): drive interpolation from a WAAPI timeline on a detached element.
  const a = nums(from), b = nums(to); let i = 0;
  const tmpl = from.replace(/-?\d*\.?\d+(?:e-?\d+)?/gi, () => `{${i++}}`);
  const proxy = document.createElement('i');
  const anim = proxy.animate([{ opacity: 0 }, { opacity: 1 }], { duration, delay, easing, fill });
  const step = () => {
    const t = anim.effect.getComputedTiming().progress ?? (anim.playState === 'finished' ? 1 : 0);
    path.setAttribute('d', tmpl.replace(/\{(\d+)\}/g, (_, k) => (a[k] + (b[k] - a[k]) * t).toFixed(2)));
    if (anim.playState !== 'finished') requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return anim;
}

/** Draw-on for any stroked element (uses pathLength=1 if present). */
export function drawOn(node, { duration = 900, delay = 0, easing = OUT } = {}) {
  if (!node.getAttribute('pathLength')) node.setAttribute('pathLength', 1);
  node.style.strokeDasharray = '1 1';
  return node.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration, delay, easing, fill: 'both' });
}

/* --------------------------------------------------------------- 1. IGNITION */
/**
 * The loading moment. Dust falls under gravity into the six stars of the asterism; the five
 * figure lines arrive fractured and morph whole; the dotted vector extends; the wordmark rises;
 * then the night collapses into the apex star, revealing the page.
 * A counter tallies the 716 stars the site plots (17 + 10 + 15 + 12 figure stars, 113 + 549 field stars).
 */
export function ignite({ until = Promise.resolve(), minimum = 2300, maximum = 6000, word = 'Albretsen', parent = document.body } = {}) {
  const ov = document.createElement('div');
  ov.className = 'u-ignition';
  ov.setAttribute('role', 'progressbar'); ov.setAttribute('aria-label', 'Loading');
  ov.innerHTML = `<div class="u-ign-meta"><span>Albretsen AS · Catalogue of works</span><span class="u-ign-count">0000 / 0716 stars</span></div>`;
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '-8 -8 80 80');
  ov.appendChild(svg);
  const w = document.createElement('div'); w.className = 'u-ign-word';
  w.innerHTML = [...word].map((c) => `<span>${c}</span>`).join('');
  ov.appendChild(w);
  parent.appendChild(ov);
  const count = ov.querySelector('.u-ign-count');
  const TOTAL = 716;

  if (reduce()) {
    return Promise.race([until, new Promise((r) => setTimeout(r, maximum))]).then(() =>
      ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }).finished.then(() => ov.remove()));
  }

  const S = ASTERISM.stars;
  const R = { 1: 2.6, 2: 2.3, 3: 1.6, 4: 1.1 };
  const r = rng(0xc4bb0d);
  // dust
  const dust = el('g', { fill: '#eceaee' }, svg);
  const falls = [];
  for (let i = 0; i < 66; i++) {
    const target = S[i % S.length];
    const a = r() * Math.PI * 2, d = 46 + r() * 50;
    const sx = 32 + Math.cos(a) * d, sy = 32 + Math.sin(a) * d;
    const c = el('circle', { cx: 0, cy: 0, r: .25 + r() * .55, opacity: 0 }, dust);
    const delay = r() * 420;
    falls.push(c.animate([
      { transform: `translate(${sx}px,${sy}px)`, opacity: 0 },
      { opacity: .9, offset: .25 },
      { transform: `translate(${target[0]}px,${target[1]}px)`, opacity: .2 },
    ], { duration: 980 + r() * 260, delay, easing: GRAVITY, fill: 'forwards' }));
  }
  // lines: fractured -> whole (path morph, identical command structure)
  const lg = el('g', { stroke: '#eceaee', 'stroke-width': 1.25, 'stroke-linecap': 'round', fill: 'none' }, svg);
  ASTERISM.lines.forEach(([ia, ib], k) => {
    const [x1, y1, x2, y2] = gapSeg(S[ia], S[ib], ia === 0 ? 6.2 : 3.4, ib === 1 || ib === 2 ? 4.6 : 3.4);
    const pts = [0, .34, .36, .66, .68, 1].map((t) => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    const whole = `M${pts[0]}L${pts[1]}M${pts[2]}L${pts[3]}M${pts[4]}L${pts[5]}`.replace(/,/g, ' ');
    const nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny);
    const j = (s) => [s * nx / L * (1.5 + r() * 2.5), s * ny / L * (1.5 + r() * 2.5)];
    const sh = [j(1), j(-1), j(1)];
    const broken = `M${pts[0][0] + sh[0][0] - 1} ${pts[0][1] + sh[0][1]}L${pts[1][0] + sh[0][0]} ${pts[1][1] + sh[0][1] + 1.2}` +
      `M${pts[2][0] + sh[1][0]} ${pts[2][1] + sh[1][1] - 1}L${pts[3][0] + sh[1][0] + 1} ${pts[3][1] + sh[1][1]}` +
      `M${pts[4][0] + sh[2][0]} ${pts[4][1] + sh[2][1] + 1}L${pts[5][0] + sh[2][0] - 1.4} ${pts[5][1] + sh[2][1]}`;
    const p = el('path', { d: broken, opacity: 0 }, lg);
    p.animate([{ opacity: 0 }, { opacity: .75 }], { duration: 300, delay: 950 + k * 70, fill: 'forwards' });
    morph(p, broken, whole, { duration: 820, delay: 1000 + k * 70, easing: ORBIT });
  });
  // vector (dotted) + its endpoint
  const [vx1, vy1, vx2, vy2] = gapSeg(S[4], S[5], 3.2, 2.6);
  const vec = el('line', { x1: vx1, y1: vy1, x2: vx2, y2: vy2, stroke: '#eceaee', 'stroke-width': 1.25, 'stroke-linecap': 'round', 'stroke-dasharray': '0.01 2.6', opacity: .75 }, svg);
  vec.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 600, delay: 1650, easing: OUT, fill: 'both' });
  // stars
  const sg = el('g', { fill: '#eceaee' }, svg);
  S.forEach(([x, y, m], i) => {
    const g = el('g', { transform: `translate(${x} ${y})` }, sg);
    const inner = el('g', {}, g);
    if (m === 1) el('path', { d: sparklePath(0, 0, 7.6, 1.5) }, inner);
    else el('circle', { r: R[m] }, inner);
    inner.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 700, delay: i === 5 ? 2050 : 820 + i * 60, easing: ORBIT, fill: 'both' });
    if (m === 1) inner.animate([{ transform: 'rotate(-90deg)' }, { transform: 'rotate(0)' }], { duration: 1400, delay: 820, easing: OUT, composite: 'add' });
  });
  // wordmark
  [...w.children].forEach((s, i) => s.animate([{ transform: 'translateY(.6em)', opacity: 0, filter: 'blur(8px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }],
    { duration: 900, delay: 1500 + i * 45, easing: OUT, fill: 'both' }));
  // counter tied to elapsed time and real readiness
  const t0 = performance.now(); let ready = false; let done = false;
  until.then(() => { ready = true; });
  const tickCount = () => {
    const t = Math.min(1, (performance.now() - t0) / minimum);
    const n = Math.round(TOTAL * (ready ? t : Math.min(t, .92)));
    count.textContent = `${String(n).padStart(4, '0')} / 0716 stars`;
    if (!done) requestAnimationFrame(tickCount);
  };
  requestAnimationFrame(tickCount);

  const wait = Promise.all([until, new Promise((res) => setTimeout(res, minimum))]);
  return Promise.race([wait, new Promise((res) => setTimeout(res, maximum))]).then(() => {
    done = true; count.textContent = '0716 / 0716 stars';
    // collapse the night into the apex star
    const box = svg.getBoundingClientRect();
    const ax = box.left + (S[0][0] + 8) / 80 * box.width, ay = box.top + (S[0][1] + 8) / 80 * box.height;
    const at = `at ${ax}px ${ay}px`;
    return ov.animate([{ clipPath: `circle(150% ${at})` }, { clipPath: `circle(0% ${at})` }],
      { duration: 1100, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished.then(() => ov.remove());
  });
}

/* ------------------------------------------------------------- 2. PLATE RISE */
export function rise(nodes, { stagger = 90, threshold = .18 } = {}) {
  const list = [...nodes];
  if (reduce()) return;
  list.forEach((n) => { n.style.opacity = 0; });
  const io = new IntersectionObserver((entries) => {
    let k = 0;
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target); e.target.style.opacity = '';
      e.target.animate([
        { clipPath: 'inset(100% 0 0 0)', transform: 'translateY(28px) scale(1.04)', filter: 'blur(10px) brightness(.6)' },
        { filter: 'blur(0) brightness(1.05)', offset: .6 },
        { clipPath: 'inset(0 0 0 0)', transform: 'none', filter: 'none' },
      ], { duration: 1300, delay: k++ * stagger, easing: OUT, fill: 'backwards' });
    });
  }, { threshold });
  list.forEach((n) => io.observe(n));
  return io;
}

/* ------------------------------------------------------------ 6. PRECESSION */
/** Page/section transition: the whole sky turns a few degrees about a pivot (the apex star). */
export function precess(update, { pivot = '50% 0%', degrees = 7 } = {}) {
  if (!document.startViewTransition || reduce()) { update(); return Promise.resolve(); }
  const vt = document.startViewTransition(update);
  vt.ready.then(() => {
    const opts = { duration: 900, easing: INOUT, fill: 'both' };
    document.documentElement.animate([{ transform: 'rotate(0)', opacity: 1, transformOrigin: pivot }, { transform: `rotate(${-degrees}deg)`, opacity: 0, transformOrigin: pivot }], { ...opts, pseudoElement: '::view-transition-old(root)' });
    document.documentElement.animate([{ transform: `rotate(${degrees}deg)`, opacity: 0, transformOrigin: pivot }, { transform: 'rotate(0)', opacity: 1, transformOrigin: pivot }], { ...opts, pseudoElement: '::view-transition-new(root)' });
  });
  return vt.finished;
}
