// Vivarium motion study — Albretsen AS (design 54). Pairs with motion.css.
// import { germinate, growOnView, bellJar, leafTurn } from './motion.js'

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 1. GERMINATE: add .is-grown to .germinate elements as they enter the view. */
export function growOnView(root = document, { threshold = 0 } = {}) {
  const els = root.querySelectorAll('.germinate, .germinate-line');
  if (!('IntersectionObserver' in window) || reduced()) { els.forEach(e => e.classList.add('is-grown')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-grown'); io.unobserve(en.target); }
  }), { threshold });
  els.forEach(e => {
    // anything already on screen grows now; the rest waits for the observer
    const r = e.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) requestAnimationFrame(() => e.classList.add('is-grown')); else io.observe(e);
  });
  return () => io.disconnect();
}

/** 2. BELL JAR: pointer-driven tilt (CSS 3D only) for every .belljar. */
export function bellJar(root = document, { max = 7 } = {}) {
  if (reduced()) return;
  root.querySelectorAll('.belljar').forEach(card => {
    const body = card.querySelector('.belljar__body') || card;
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      body.style.setProperty('--ry', `${(x - 0.5) * max * 2}deg`);
      body.style.setProperty('--rx', `${(0.5 - y) * max * 2}deg`);
      body.style.setProperty('--gx', `${x * 100}%`); body.style.setProperty('--gy', `${y * 100}%`);
    });
    card.addEventListener('pointerleave', () => { body.style.setProperty('--rx', '0deg'); body.style.setProperty('--ry', '0deg'); });
  });
}

/** 3. LEAF TURN: run a DOM update as a page-turn. Uses View Transitions when present. */
export function leafTurn(update, el) {
  if (reduced()) return update();
  if (document.startViewTransition) return document.startViewTransition(update);
  if (!el) return update();
  el.classList.add('leaf-turn', 'is-leaving');
  setTimeout(() => { update(); el.classList.replace('is-leaving', 'is-arriving'); setTimeout(() => el.classList.remove('is-arriving'), 900); }, 700);
}

/**
 * 5. GERMINATION LOADER.
 * Plays the intro of sprout-loader.json (frames 0-120), idles (120-180) until
 * `ready` resolves and `minDuration` has passed, ticks a 000-100 counter, then
 * lifts the sheet away (.is-done). Needs lottie-web (window.lottie) on the page.
 */
export async function germinate(el, { src, ready = Promise.resolve(), minDuration = 2200, frame = null } = {}) {
  const jar = el.querySelector('[data-lottie]'), count = el.querySelector('[data-count]');
  const anim = window.lottie.loadAnimation({ container: jar, renderer: 'svg', loop: false, autoplay: false, path: src });
  await new Promise(r => anim.addEventListener('DOMLoaded', r));
  if (frame !== null) { anim.goToAndStop(frame, true); if (count) count.textContent = String(Math.min(100, Math.round(frame / 1.2))).padStart(3, '0'); return anim; }
  const t0 = performance.now();
  if (reduced()) anim.goToAndStop(120, true); else anim.playSegments([0, 120], true);
  anim.addEventListener('complete', () => anim.playSegments([120, 180], true));
  let done = false;
  const tick = () => {
    const p = Math.min(1, (performance.now() - t0) / minDuration);
    if (count) count.textContent = String(Math.round((done ? 1 : p * 0.96) * 100)).padStart(3, '0');
    if (!done) requestAnimationFrame(tick);
  };
  tick();
  await Promise.all([ready, new Promise(r => setTimeout(r, minDuration))]);
  done = true; if (count) count.textContent = '100';
  await new Promise(r => setTimeout(r, 260));
  el.classList.add('is-done');
  setTimeout(() => anim.destroy(), 1400);
  return anim;
}
