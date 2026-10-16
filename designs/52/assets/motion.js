// Design 52 · Violet Cabinet · motion.js
// Pairs with motion.css. No framework; Lenis is loaded lazily from a pinned CDN URL.
//
//   import { initMotion } from './assets/motion.js';
//   const motion = await initMotion();            // Lenis + magnetic + fallbacks
//   motion.onChapter((index, progress) => { ... }); // drive crystal-morph / scan-bust from scroll
//
// Signature animations implemented here:
//   03 magnetic-facet  — elements with [data-magnetic] (or .m-magnetic) lean toward the pointer
//                        inside a 1.6x hit radius, label moves 1.6x further than the shell
//                        (two-layer parallax, after Osmo's "magnetic hover" and Aceternity's
//                        magnetic button), springs back with an overshoot on leave.
//   08 chapter-scrub   — sections with [data-chapter] report a continuous chapter index
//                        (e.g. 2.35 = 35% through chapter 3) so SVG morphs scrub with scroll.

const LENIS_URL = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export async function initLenis() {
  if (reduce) return null;
  const { default: Lenis } = await import(LENIS_URL);
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true, anchors: true });
  // honour deep links: land on the hash target immediately
  if (location.hash) {
    const t = document.querySelector(location.hash);
    if (t) lenis.scrollTo(t, { immediate: true, force: true });
  }
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  return lenis;
}

/** 03 magnetic-facet */
export function magnetic(root = document, { strength = 0.32, labelStrength = 0.55, radius = 1.6 } = {}) {
  const items = [...root.querySelectorAll('[data-magnetic], .m-magnetic')];
  const state = new Map();
  const springBack = 'transform .9s linear(0, .3 6%, .78 16%, 1.04 26%, 1.1 32%, 1.05 42%, .99 56%, 1)';
  for (const elx of items) {
    const label = elx.querySelector('.m-magnetic-label');
    state.set(elx, { label, x: 0, y: 0, tx: 0, ty: 0, active: false });
  }
  if (reduce || !items.length) return () => {};
  let raf = 0;
  const onMove = (e) => {
    for (const [elx, s] of state) {
      const r = elx.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const inside = Math.abs(dx) < (r.width / 2) * radius && Math.abs(dy) < (r.height / 2) * radius;
      if (inside) {
        s.tx = dx * strength; s.ty = dy * strength;
        elx.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        elx.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        if (!s.active) { s.active = true; elx.style.transition = 'none'; if (s.label) s.label.style.transition = 'none'; }
      } else if (s.active) {
        s.active = false; s.tx = 0; s.ty = 0;
        elx.style.transition = springBack; if (s.label) s.label.style.transition = springBack;
        elx.style.transform = ''; if (s.label) s.label.style.transform = '';
        s.x = 0; s.y = 0;
      }
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const tick = () => {
    raf = 0;
    let moving = false;
    for (const [elx, s] of state) {
      if (!s.active) continue;
      s.x += (s.tx - s.x) * 0.2; s.y += (s.ty - s.y) * 0.2;
      elx.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0)`;
      if (s.label) s.label.style.transform = `translate3d(${(s.x * labelStrength).toFixed(2)}px, ${(s.y * labelStrength).toFixed(2)}px, 0)`;
      if (Math.abs(s.tx - s.x) > 0.1 || Math.abs(s.ty - s.y) > 0.1) moving = true;
    }
    if (moving) raf = requestAnimationFrame(tick);
  };
  addEventListener('pointermove', onMove, { passive: true });
  return () => removeEventListener('pointermove', onMove);
}

/** Fallback for browsers without scroll-driven animations: toggles .is-in */
export function revealFallback(root = document) {
  if (CSS.supports('animation-timeline: view()')) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('is-in')), { threshold: 0.2 });
  root.querySelectorAll('.m-develop, .m-scan, .m-chapter').forEach((n) => io.observe(n));
}

/** 08 chapter-scrub: continuous chapter index from scroll position */
export function chapters(selector = '[data-chapter]') {
  const secs = [...document.querySelectorAll(selector)];
  const subs = new Set();
  let last = -1;
  const read = () => {
    const vh = innerHeight;
    let idx = 0;
    secs.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.5 - r.top) / r.height));
      if (r.top < vh * 0.5) idx = i + p;
    });
    if (Math.abs(idx - last) > 0.0005) { last = idx; subs.forEach((f) => f(idx)); }
    requestAnimationFrame(read);
  };
  requestAnimationFrame(read);
  return (fn) => subs.add(fn);
}

export async function initMotion() {
  const lenis = await initLenis();
  const stopMagnetic = magnetic();
  revealFallback();
  const onChapter = chapters();
  return { lenis, onChapter, stopMagnetic };
}
