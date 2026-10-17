/* motion.js — design 39 "Cold Boot" motion study. ES module, no required dependencies.
 * Lenis is loaded lazily (pinned) only if you call smoothScroll().
 *
 *   import { coldBoot, lens, dispersion, prismWipe, smoothScroll } from './motion.js'
 *
 * References (researched, see ASSETS.md):
 *  - COLD BOOT: the system-boot loader on heronaiapp.com (Awwwards SOTD, Oct 2026): numbered
 *    init steps and a percentage before the page appears. Here the log is the content index,
 *    and the page resolves out of the light (hero/boot-focus.webm) rather than cutting in.
 *  - LENS: cursor-driven radial mask reveal (Codrops "Dynamic CSS Masks with Custom Properties
 *    and GSAP"; the mask-image radial-gradient pattern), eased with a spring instead of lerp.
 *  - ECHO: CSS scroll-driven animations, view() timelines with entry/cover ranges (MDN, Codrops
 *    "A Practical Introduction to Scroll-Driven Animations"). Pure CSS, see motion.css.
 *  - PRISM WIPE: View Transitions API with a clip-path sweep.
 *  - Smooth scroll: Lenis (darkroom.engineering), as used by many Awwwards sites.
 */
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------ 1. COLD BOOT
 * lines: array of strings; wrap words in <b> for emphasis, prefix "ok " to get an [ ok ] tag.
 * Resolves when the page has booted. Adds .is-booted to <html>. */
export function coldBoot(bootEl, lines, { lineMs = 110, holdMs = 380, video } = {}) {
  const log = bootEl.querySelector('.boot-log');
  const bar = bootEl.querySelector('.boot-bar');
  const html = document.documentElement;
  if (reduce()) { bootEl.remove(); html.classList.add('is-booted'); return Promise.resolve(); }
  log.innerHTML = lines.map((l, i) => {
    const ok = l.startsWith('ok ');
    const body = ok ? l.slice(3) : l;
    return `<li style="--i:${i}">${ok ? '<span class="ok">ok</span> ' : '      '}${body}</li>`;
  }).join('');
  const total = lines.length * lineMs;
  const t0 = performance.now();
  return new Promise(resolve => {
    function tick(now) {
      const p = Math.min(1, (now - t0) / total);
      bar && bar.style.setProperty('--p', p.toFixed(3));
      if (p < 1) return requestAnimationFrame(tick);
      setTimeout(() => {
        if (video) { video.currentTime = 0; video.play().catch(() => {}); }
        bootEl.classList.add('is-done');
        html.classList.add('is-booted');
        bootEl.addEventListener('animationend', e => { if (e.target === bootEl) { bootEl.remove(); resolve(); } });
      }, holdMs);
    }
    requestAnimationFrame(tick);
  });
}

/* ------------------------------------------------------------ 2. LENS
 * Springs the lens radius open on enter and the centre toward the pointer. */
export function lens(el, { radius = 120, stiffness = 170, damping = 20 } = {}) {
  const s = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, r: 0, vr: 0, tr: 0 };
  let raf = 0, last = 0;
  const set = () => { el.style.setProperty('--x', s.x.toFixed(1) + 'px'); el.style.setProperty('--y', s.y.toFixed(1) + 'px'); el.style.setProperty('--r', Math.max(0, s.r).toFixed(1) + 'px'); };
  function tick(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now; raf = 0;
    for (const [p, v, t] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty'], ['r', 'vr', 'tr']]) {
      s[v] += ((s[t] - s[p]) * stiffness - s[v] * damping) * dt; s[p] += s[v] * dt;
    }
    set();
    if (Math.abs(s.vr) + Math.abs(s.vx) + Math.abs(s.vy) > .05 || Math.abs(s.tr - s.r) > .1) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const pos = e => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  el.addEventListener('pointerenter', e => { const [x, y] = pos(e); s.x = s.tx = x; s.y = s.ty = y; s.tr = radius; if (reduce()) { s.r = radius; set(); } else kick(); });
  el.addEventListener('pointermove', e => { [s.tx, s.ty] = pos(e); if (reduce()) { s.x = s.tx; s.y = s.ty; set(); } else kick(); });
  el.addEventListener('pointerleave', () => { s.tr = 0; if (reduce()) { s.r = 0; set(); } else kick(); });
  // touch: tap toggles a centred lens
  el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { const [x, y] = pos(e); s.tx = x; s.ty = y; s.tr = s.tr ? 0 : radius; kick(); } });
}

/* ------------------------------------------------------------ 5. DISPERSION
 * Sets --dx from the pointer's horizontal position relative to the element's centre. */
export function dispersion(root = document) {
  root.querySelectorAll('.disperse').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--dx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    });
  });
}

/* ------------------------------------------------------------ 4. PRISM WIPE */
export function prismWipe(update) {
  if (!document.startViewTransition || reduce()) { update(); return Promise.resolve(); }
  return document.startViewTransition(update).finished;
}

/* ------------------------------------------------------------ smooth scroll (Lenis, pinned) */
export async function smoothScroll(opts = {}) {
  if (reduce()) return null;
  const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.3.23/+esm');
  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, ...opts });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  return lenis;
}
