// Albretsen AS / design 86 "Airglow" — motion study (JS half). No dependencies.
//
//   import { magnetic, orbitScrub } from './motion.js'
//   magnetic()                                  // every [data-magnetic] on the page
//   orbitScrub(document.querySelector('.scrub'), { onProduct: i => ... })
//
// MAGNETIC PULL
//   Reference: Cuberto's magnetic cursor component and the magnetic CTAs on
//   lusion.co. The element leans toward the pointer inside a halo around it
//   (strength ~0.3 of the offset), its label leans a little further (parallax
//   inside the button), and both settle back on a critically damped spring, not a
//   bounce: serene, not toy-like. Pointer-fine devices only; off for reduced motion.
//
// ORBIT SCRUB
//   Reference: Apple's AirPods Pro / iPhone product pages: pre-rendered frames,
//   scroll progress -> frame index, drawn into a <canvas> (no video seeking).
//   Frames are the three.js roster baked at 1280x720 (72) and 720x1280 (48).
//   Loading: the first frame is a poster <img>; the rest load after first paint,
//   nearest-to-current first, so the sequence is usable before it is complete.

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function magnetic(root = document, { strength = 0.3, label = 0.18, halo = 1.6 } = {}) {
  if (reduce() || !matchMedia('(pointer: fine)').matches) return () => {};
  const items = [...root.querySelectorAll('[data-magnetic]')].map(el => {
    const lab = el.querySelector('.magnetic__label');
    const s = +(el.dataset.magnetic || strength);
    return { el, lab, s, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
  });
  let raf = 0, px = -1e4, py = -1e4;
  const onMove = e => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(step); };
  function step() {
    raf = 0; let moving = false;
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - it.x, cy = r.top + r.height / 2 - it.y;
      const dx = px - cx, dy = py - cy;
      const reach = Math.max(r.width, r.height) / 2 * halo;
      const inside = Math.hypot(dx / (r.width / 2 * halo), dy / (r.height / 2 * halo)) < 1 || Math.hypot(dx, dy) < reach * 0.6;
      it.tx = inside ? dx * it.s : 0; it.ty = inside ? dy * it.s : 0;
      // critically damped spring (k=0.12, damping=2*sqrt(k))
      const k = 0.12, d = 2 * Math.sqrt(k);
      it.vx += (it.tx - it.x) * k - it.vx * d; it.vy += (it.ty - it.y) * k - it.vy * d;
      it.x += it.vx; it.y += it.vy;
      it.el.style.transform = `translate3d(${it.x.toFixed(2)}px, ${it.y.toFixed(2)}px, 0)`;
      if (it.lab) it.lab.style.transform = `translate3d(${(it.x * label / it.s * 0.6).toFixed(2)}px, ${(it.y * label / it.s * 0.6).toFixed(2)}px, 0)`;
      if (Math.abs(it.tx - it.x) > 0.05 || Math.abs(it.ty - it.y) > 0.05) moving = true;
    }
    if (moving) raf = requestAnimationFrame(step);
  }
  addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', () => { px = py = -1e4; if (!raf) raf = requestAnimationFrame(step); });
  return () => removeEventListener('pointermove', onMove);
}

// Same easing as roster.js plateau(): linger on each product, glide between.
export function plateau(t, n = 4, hold = 0.42) {
  const x = Math.min(Math.max(t, 0), 1) * (n - 1), i = Math.floor(x), f = x - i, a = hold / 2;
  let e = f < a ? 0 : f > 1 - a ? 1 : (f - a) / (1 - 2 * a);
  return Math.min(i + e * e * (3 - 2 * e), n - 1);
}

export function orbitScrub(section, {
  base = new URL('./roster/frames/', import.meta.url).href,
  onProduct = () => {}, onProgress = () => {},
} = {}) {
  const stage = section.querySelector('.scrub__stage');
  const canvas = stage.querySelector('canvas') || stage.appendChild(document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  const sets = { land: { dir: 'land', n: 72, w: 1280, h: 720 }, port: { dir: 'port', n: 48, w: 720, h: 1280 } };
  let set, frames = [], current = -1, product = -1, want = 0;

  function pick() {
    const s = stage.clientWidth / stage.clientHeight < 0.9 ? sets.port : sets.land;
    if (s !== set) { set = s; frames = new Array(s.n); current = -1; load(); }
  }
  function src(i) { return `${base}${set.dir}/f${String(i).padStart(3, '0')}.webp`; }
  function load() {
    // nearest-first queue around the wanted frame, 6 in flight
    const order = [...Array(set.n).keys()].sort((a, b) => Math.abs(a - want) - Math.abs(b - want));
    let inflight = 0, q = order.slice();
    const mySet = set;
    const next = () => {
      while (inflight < 6 && q.length) {
        const i = q.shift(); if (frames[i]) continue;
        const img = new Image(); img.decoding = 'async'; inflight++;
        img.onload = () => { inflight--; if (set !== mySet) return; frames[i] = img; if (Math.abs(i - want) < 2) draw(true); next(); };
        img.onerror = () => { inflight--; next(); };
        img.src = src(i);
      }
    };
    (window.requestIdleCallback || setTimeout)(next);
  }
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(stage.clientWidth * dpr); canvas.height = Math.round(stage.clientHeight * dpr);
    pick(); current = -1; draw(true);
  }
  function draw(force) {
    let i = want;
    if (!frames[i]) { // fall back to the nearest loaded frame
      for (let d = 1; d < set.n; d++) { if (frames[i - d]) { i = i - d; break; } if (frames[i + d]) { i = i + d; break; } }
    }
    if (!frames[i] || (i === current && !force)) return;
    current = i;
    const img = frames[i], cw = canvas.width, ch = canvas.height;
    const sc = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * sc, h = img.naturalHeight * sc;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const r = section.getBoundingClientRect();
      const t = Math.min(Math.max(-r.top / (r.height - innerHeight), 0), 1);
      // frames were baked with linear progress, so the frame index is linear in t;
      // the plateau easing is already inside the render.
      want = Math.round(t * (set.n - 1));
      draw();
      onProgress(t);
      const p = Math.round(plateau(t));
      if (p !== product) { product = p; onProduct(p); }
    });
  }
  size();
  addEventListener('resize', size);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  return { destroy() { removeEventListener('resize', size); removeEventListener('scroll', onScroll); } };
}
