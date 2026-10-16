// Cloud Chamber — motion study (JS half). GSAP 3.13.0 + ScrollTrigger (both free).
// Load gsap + ScrollTrigger first (UMD from jsDelivr, see preview.html), then:
//   import { decode, settle, tilt, filmIn, fractureReveal, initMotion } from './assets/motion.js';
//   initMotion();   // wires every [data-cc-*] attribute on the page
//
// Signature animations
//  1. decode(el)        "Decode"  — text resolves out of a churn of glyphs, left to right,
//                        each character locking in like a measurement settling. Researched:
//                        Aceternity "Encrypted Text", GSAP ScrambleTextPlugin, osmo.supply
//                        text-scramble. Ours is dependency-free and uses the brand glyph set.
//  2. settle(els)       "Settle"  — entrance: elements drop in with a little spin and one
//                        soft overshoot, staggered, as if released into the chamber.
//                        Researched: matter.js falling-text components (shadcn.io Falling Text,
//                        Framer Text Pile Scatter); calmer than a bounce ease.
//  3. tilt(el)          "Tilt + Sheen" — hover: pointer-tracked 3D tilt, chrome sheen sweep
//                        (CSS .cc-sheen). Researched: Aceternity 3D Card, Evervault card.
//  4. filmIn(els)       "Film"    — image load-in through a thin-film hue swing (CSS .cc-film).
//                        Researched: typohypergraphicobject.page via hoverstat.es.
//  5. fractureReveal(el)"Fracture"— section transition: opens along the logo's break line,
//                        scrubbed by ScrollTrigger (CSS .cc-fracture).

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const G = () => window.gsap;

export const GLYPHS = 'ALBRETSN0123456789/+·:—×';

export function decode(el, { text = el.dataset.text || el.textContent, duration = 1.1, delay = 0, glyphs = GLYPHS } = {}) {
  el.classList.add('cc-decode');
  el.setAttribute('aria-label', text);
  if (reduce()) { el.textContent = text; return Promise.resolve(); }
  const chars = [...text];
  const start = performance.now() + delay * 1000;
  // each char locks at a staggered time; spaces lock immediately
  const lockAt = chars.map((c, i) => (c === ' ' ? 0 : (i / chars.length) * duration * 0.75 + Math.random() * duration * 0.25));
  return new Promise(res => {
    function tick(now) {
      const t = (now - start) / 1000;
      if (t < 0) { requestAnimationFrame(tick); return; }
      let html = '', done = true;
      chars.forEach((c, i) => {
        if (t >= lockAt[i]) html += c === '<' ? '&lt;' : c;
        else { done = false; html += `<span class="is-scrambling" aria-hidden="true">${glyphs[(Math.random() * glyphs.length) | 0]}</span>`; }
      });
      el.innerHTML = html;
      if (!done) requestAnimationFrame(tick); else { el.textContent = text; res(); }
    }
    requestAnimationFrame(tick);
  });
}

export function settle(targets, { stagger = 0.06, y = -60, scrollTrigger } = {}) {
  const gsap = G(); if (!gsap || reduce()) return;
  return gsap.from(targets, {
    y, rotation: () => gsap.utils.random(-14, 14), opacity: 0, transformOrigin: '50% 100%',
    duration: 0.95, ease: 'back.out(1.4)', stagger: { each: stagger, from: 'random' },
    scrollTrigger,
  });
}

export function tilt(el, { max = 8 } = {}) {
  el.classList.add('cc-tilt');
  if (reduce()) return;
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.classList.add('is-tracking');
    el.style.setProperty('--ry', `${x * max}deg`); el.style.setProperty('--rx', `${-y * max}deg`);
  });
  el.addEventListener('pointerleave', () => { el.classList.remove('is-tracking'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
}

export function filmIn(els) {
  const list = typeof els === 'string' ? document.querySelectorAll(els) : els;
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const img = e.target; const go = () => img.classList.add('is-in');
    if (img.tagName !== 'IMG' || (img.complete && img.naturalWidth)) go();
    else { img.addEventListener('load', go, { once: true }); setTimeout(go, 1800); } // never leave an image hidden
    io.unobserve(img);
  }), { rootMargin: '0px 0px -10% 0px' });
  list.forEach(el => { el.classList.add('cc-film'); io.observe(el); });
}

export function fractureReveal(el, { start = 'top 85%', end = 'top 30%' } = {}) {
  el.classList.add('cc-fracture');
  const gsap = G();
  if (!gsap || !window.ScrollTrigger || reduce()) { el.style.setProperty('--f', 1); return; }
  el.style.setProperty('--f', 0);
  gsap.to(el, { '--f': 1, ease: 'none', scrollTrigger: { trigger: el, start, end, scrub: 0.6 } });
}

export function initMotion(root = document) {
  if (window.gsap && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { decode(e.target); io.unobserve(e.target); } }), { threshold: 0.6 });
  root.querySelectorAll('[data-cc-decode]').forEach(el => io.observe(el));
  root.querySelectorAll('[data-cc-settle]').forEach(group => settle(group.children, { scrollTrigger: { trigger: group, start: 'top 80%' } }));
  root.querySelectorAll('[data-cc-tilt]').forEach(el => tilt(el));
  filmIn(root.querySelectorAll('[data-cc-film]'));
  root.querySelectorAll('[data-cc-fracture]').forEach(el => fractureReveal(el));
}
