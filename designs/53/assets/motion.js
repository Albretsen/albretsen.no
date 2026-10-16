// Halflight motion helpers. Pairs with motion.css. No dependencies.
//
//   import { observe, splitTitle, glint, letterbox, runIntro } from './motion.js'
//   splitTitle(document.querySelector('h1'))   // EXPOSURE
//   observe()                                  // adds .is-in to [data-hl] in view (DEVELOP, EXPOSURE)
//   glint(document.querySelectorAll('.hl-glint'))   // GLINT pointer tracking
//   await letterbox(() => swapScene())         // LETTERBOX transition
//   runIntro(halflightInstance, { title })     // the cinematic intro: bars + spark + title

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise(r => setTimeout(r, reduce() ? 0 : ms));

export function observe(root = document, sel = '[data-hl]') {
  const els = root.querySelectorAll(sel);
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((ents) => ents.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .25, rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
  return io;
}

/** Wraps each character in <span class="hl-ch" style="--i:n"> (keeps words together, keeps aria). */
export function splitTitle(el) {
  if (!el || el.dataset.split) return el;
  const text = el.textContent; el.setAttribute('aria-label', text); el.dataset.split = '1';
  let i = 0;
  el.innerHTML = text.split(/(\s+)/).map(w => /^\s+$/.test(w) ? w :
    `<span style="display:inline-block;white-space:nowrap" aria-hidden="true">${[...w].map(c => `<span class="hl-ch" style="--i:${i++}">${c}</span>`).join('')}</span>`).join('');
  return el;
}

export function glint(els) {
  (els.length != null ? [...els] : [els]).forEach(el => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

function bars() {
  let b = document.querySelector('.hl-bars');
  if (!b) { b = document.createElement('div'); b.className = 'hl-bars'; b.dataset.state = 'open'; b.innerHTML = '<i class="hl-bars-line"></i>'; document.body.append(b); }
  return b;
}
export function setBars(state) { bars().dataset.state = state; }

/** close -> fn() -> open. Returns a promise that resolves when the bars are open again. */
export async function letterbox(fn, { hold = 260 } = {}) {
  const b = bars();
  b.dataset.state = 'closed'; await wait(900);
  await fn?.(); await wait(hold);
  b.dataset.state = 'scope'; await wait(700);
  b.dataset.state = 'open'; await wait(900);
}

/**
 * The cinematic intro. Choreography (about 4.6 s):
 *   0.0  bars closed, a hairline of light across the slit
 *   0.5  the shader's spark ignites on the horizon of the photograph
 *   1.0  bars part to a CinemaScope slit while the dot field pulls focus
 *   3.0  bars open fully; the title racks into focus; page unlocks
 * `hl` is a createHalflight() instance (or null for the still fallback).
 */
export async function runIntro(hl, { title, onDone } = {}) {
  const b = bars();
  if (reduce()) { b.dataset.state = 'open'; title?.classList.add('is-in'); onDone?.(); return; }
  b.dataset.state = 'closed';
  document.documentElement.style.overflow = 'hidden';
  // safety net: never leave the page shuttered, whatever happens to timers or WebGL
  setTimeout(() => { b.dataset.state = 'open'; title?.classList.add('is-in'); document.documentElement.style.overflow = ''; }, 7000);
  await wait(900);
  b.dataset.state = 'scope';
  await (hl ? Promise.race([hl.ready, wait(3200)]) : wait(1800));
  b.dataset.state = 'open';
  await wait(350);
  title?.classList.add('is-in');
  document.documentElement.style.overflow = '';
  onDone?.();
}
