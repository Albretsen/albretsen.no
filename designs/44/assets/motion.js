// Darkfield motion, design 44: GSAP + ScrollTrigger versions of the signature motions,
// plus helpers the site builder can call. Pairs with motion.css (same names, same eases).
//
//   import * as M from './assets/motion.js'
//   await M.ready                         // gsap + ScrollTrigger loaded
//   M.focusPull(document.querySelector('h1'))
//   M.striae(svgElement)                  // prepare a glyph for the hover redraw
//   M.iris(panel, { x: e.clientX, y: e.clientY })
//   M.scrubDissolve(darkfield, '#hero')   // particles peel away as the hero scrolls out
//   M.stageSweep(cards)                   // ScrollTrigger batch: cards slide onto the stage
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger);
// Entrances must finish even when the main thread is busy compiling shaders on first load.
gsap.ticker.lagSmoothing(0);
export { gsap, ScrollTrigger };
export const ready = Promise.resolve();
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const EASE = { focus: 'expo.out', stage: 'sine.inOut', iris: 'power4.inOut' };

/** FOCUS PULL: split an element's text into words and resolve them from blur, staggered. */
export function focusPull(el, { delay = 0, stagger = 0.055, duration = 1.1 } = {}) {
  if (!el) return;
  if (!el.dataset.split) {
    const words = el.textContent.trim().split(/(\s+)/);
    el.textContent = '';
    for (const w of words) {
      if (/^\s+$/.test(w)) { el.append(w); continue; }
      const s = document.createElement('span'); s.className = 'df-w'; s.style.display = 'inline-block'; s.textContent = w; el.append(s);
    }
    el.dataset.split = '1';
    el.setAttribute('aria-label', words.join(''));
  }
  const parts = el.querySelectorAll('.df-w');
  if (reduce()) return gsap.set(parts, { clearProps: 'all' });
  return gsap.fromTo(parts, { opacity: 0, filter: 'blur(14px)', scale: 1.045, y: '0.12em' },
    { opacity: 1, filter: 'blur(0px)', scale: 1, y: 0, duration, ease: EASE.focus, stagger, delay });
}

/** STRIAE: normalise every stroke in a glyph to pathLength 1 and number it, for the CSS hover redraw. */
export function striae(svg) {
  svg.classList.add('df-striae');
  svg.querySelectorAll('path, circle:not(.sig), rect').forEach((n, i) => { n.setAttribute('pathLength', '1'); n.style.setProperty('--n', i % 24); });
  return svg;
}
/** STRIAE (scripted): engrave a glyph once, e.g. when its place comes into view. */
export function engrave(svg, { duration = 1.4, delay = 0 } = {}) {
  striae(svg);
  const strokes = svg.querySelectorAll('path, circle:not(.sig), rect');
  if (reduce()) return;
  gsap.fromTo(strokes, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration, ease: EASE.focus, stagger: { each: 0.02, from: 'center' }, delay });
  gsap.fromTo(svg.querySelectorAll('.sig'), { scale: 0, transformOrigin: 'center' }, { scale: 1, duration: 0.8, ease: 'back.out(3)', delay: delay + duration * 0.6 });
}

/** IRIS: open `el` through a circular aperture centred on a viewport point (or close it). */
export function iris(el, { x = innerWidth / 2, y = innerHeight / 2, open = true, duration = 0.9 } = {}) {
  const r = el.getBoundingClientRect();
  const px = ((x - r.left) / r.width) * 100, py = ((y - r.top) / r.height) * 100;
  const from = `circle(0% at ${px}% ${py}%)`, to = `circle(150% at ${px}% ${py}%)`;
  if (reduce()) { el.style.clipPath = open ? 'none' : from; return; }
  return gsap.fromTo(el, { clipPath: open ? from : to }, { clipPath: open ? to : from, duration, ease: EASE.iris });
}

/** STAGE SWEEP: ScrollTrigger batch; items glide in on the slow stage ease, offset in depth. */
export function stageSweep(targets, { y = 48 } = {}) {
  if (reduce()) return;
  const list = gsap.utils.toArray(targets);
  const reveal = (batch) => gsap.to(batch, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: EASE.focus, stagger: 0.09, overwrite: true });
  // only hide what is below the fold, so nothing already on screen ever blinks out
  const below = list.filter((el) => el.getBoundingClientRect().top > innerHeight * 0.88);
  gsap.set(below, { opacity: 0, y, filter: 'blur(6px)' });
  const st = ScrollTrigger.batch(below, { start: 'top 88%', onEnter: reveal });
  ScrollTrigger.refresh();
  return st;
}

/** SCRUB DISSOLVE: tie the particle specimen's dissolve to the hero leaving the viewport. */
export function scrubDissolve(darkfield, trigger, { max = 0.9 } = {}) {
  const st = { v: 0 };
  return gsap.to(st, {
    v: max, ease: 'none',
    scrollTrigger: { trigger, start: 'top top', end: 'bottom top', scrub: 0.6 },
    onUpdate: () => { darkfield.dissolve = st.v; },
  });
}

/** SIGNAL: a scripted ping ring from an element's centre (for clicks, copies, shortcuts). */
export function signal(atEl, { color = '#f0b871', size = 120 } = {}) {
  if (reduce()) return;
  const r = atEl.getBoundingClientRect();
  const ring = document.createElement('span');
  Object.assign(ring.style, { position: 'fixed', left: `${r.left + r.width / 2 - size / 2}px`, top: `${r.top + r.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px`, borderRadius: '50%', border: `1px solid ${color}`, pointerEvents: 'none', zIndex: 9999 });
  document.body.append(ring);
  gsap.fromTo(ring, { scale: 0.1, opacity: 1 }, { scale: 1, opacity: 0, duration: 1.1, ease: EASE.focus, onComplete: () => ring.remove() });
}
