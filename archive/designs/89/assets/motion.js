// Prism Room — motion study (JS half). Lenis smooth scroll + a few signature behaviours.
//   import { initMotion } from './motion.js'; initMotion();
// Lenis is pinned and loaded lazily from jsdelivr; nothing here blocks first paint.

const LENIS = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export async function initMotion({ smooth = true } = {}) {
  const root = document.documentElement;
  let lenis = null;
  if (smooth && !reduce()) {
    const { default: Lenis } = await import(LENIS);
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  }

  // A. VELOCITY SMEAR — Lenis velocity -> --pr-velocity (clamped, eased back to 0 at rest).
  let v = 0;
  const tickV = () => {
    const target = lenis ? Math.max(-1, Math.min(1, lenis.velocity / 40)) : 0;
    v += (target - v) * 0.15; root.style.setProperty('--pr-velocity', v.toFixed(3));
    requestAnimationFrame(tickV);
  };
  if (!reduce()) tickV();

  // B. SCROLL RESOLVE — every <pixel-resolve data-scroll> resolves from pixels to photo as you
  //    scroll from its top to 60% through it. On load it first resolves to `data-rest` (default .35).
  const els = [...document.querySelectorAll('pixel-resolve[data-scroll]')];
  const update = () => {
    for (const el of els) {
      const r = el.getBoundingClientRect(), rest = +(el.dataset.rest ?? .35);
      const p = Math.max(0, Math.min(1, -r.top / (r.height * 0.6)));
      el.resolve = rest + (1 - rest) * p;
    }
  };
  if (els.length) {
    if (reduce()) els.forEach(el => el.resolve = 1);
    else { // boot animation: 0 -> rest over 900ms, ease-out
      const t0 = performance.now();
      const boot = now => { const k = Math.min(1, (now - t0) / 900), e = 1 - (1 - k) ** 3;
        els.forEach(el => el.resolve = (+(el.dataset.rest ?? .35)) * e); if (k < 1) requestAnimationFrame(boot); else update(); };
      requestAnimationFrame(boot);
      (lenis ? lenis.on.bind(lenis, 'scroll') : (f => addEventListener('scroll', f, { passive: true })))(update);
    }
  }

  // C. BULB CHASE — light the photo's 5x4 bulb panel. Pass a 20-char string of palette keys
  //    (p=peach g=gum l=lilac s=sky m=mint .=off) to show a tiny 5x4 picture, or let it chase.
  return { lenis, bulbs: lightBulbs };
}

const KEY = { p: 'var(--pr-peach)', g: 'var(--pr-gum)', l: 'var(--pr-lilac)', s: 'var(--pr-sky)', m: 'var(--pr-mint)', y: 'var(--pr-lemon)' };
export function lightBulbs(container, map, pattern = null) {
  container.querySelectorAll('.pr-bulb').forEach(n => n.remove());
  let i = 0;
  map.rows.forEach(y => map.cols.forEach(x => {
    const ch = pattern ? pattern[i] : 'pglsm'[i % 5];
    const b = document.createElement('i'); b.className = 'pr-bulb';
    b.style.cssText = `left:${x}%;top:${y}%;--r:${map.r}cqw;--i:${(i % 5) + Math.floor(i / 5) * 2};--c:${KEY[ch] || 'transparent'}`;
    if (pattern) { b.style.animation = 'none'; b.style.opacity = ch === '.' ? 0 : 1; }
    container.append(b); i++;
  }));
}
