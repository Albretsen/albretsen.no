// Plate Nocturne: motion runtime. Pairs with motion.css.
//   import { initMotion, seamTo, replayRay } from './motion.js'
//   initMotion()                       // Lenis + fallbacks; call once
//   seamTo(() => swapContent())        // view transition with the amber seam
//
// Lenis is loaded lazily from a pinned CDN build and skipped entirely for reduced-motion visitors.

const LENIS = 'https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.mjs';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis = null;

export async function initMotion({ smooth = true, lerp = 0.09 } = {}) {
  // 1. Lenis smooth scroll. CSS scroll timelines read the native scroll position Lenis drives.
  if (smooth && !reduce) {
    try {
      const { default: Lenis } = await import(LENIS);
      lenis = new Lenis({ lerp, wheelMultiplier: 0.9, smoothWheel: true });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      document.documentElement.classList.add('lenis');
    } catch (e) { /* offline or blocked: native scroll is fine */ }
  }
  // 2. Fallback for browsers without animation-timeline: run "develop" on intersection instead.
  if (!CSS.supports('animation-timeline: view()')) {
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.2 });
    document.querySelectorAll('.develop').forEach(el => io.observe(el));
  }
  // 3. stagger index for stacked panes
  document.querySelectorAll('.pane-stack').forEach(s => [...s.children].forEach((c, i) => c.style.setProperty('--i', i)));
  return lenis;
}

// "seam": wraps a DOM update in a view transition with a hairline of light that opens into the new state.
export function seamTo(update) {
  if (reduce || !document.startViewTransition) { update(); return Promise.resolve(); }
  const line = document.createElement('div'); line.className = 'seam-line';
  document.body.appendChild(line);
  const vt = document.startViewTransition(update);
  vt.finished.finally(() => line.remove());
  return vt.finished;
}

// "ray": restart the mark drawing (e.g. on logo hover)
export function replayRay(svg) {
  svg.classList.remove('ray-draw'); void svg.getBoundingClientRect(); svg.classList.add('ray-draw');
}

export function scrollTo(target) { lenis ? lenis.scrollTo(target, { duration: 1.4 }) : document.querySelector(target)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
