// Albretsen 70 · motion clocks for motion.css. Each export is independent and tiny.
// The sun moves, everything else is still: these functions only ever write custom properties.
import { sunPosition } from './interactive/sky.js';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Today's sunrise/sunset (minute resolution) by sampling the solar model. */
export function dayArc(date = new Date(), lat = 59.91, lon = 10.75) {
  const d0 = new Date(date); d0.setUTCHours(0, 0, 0, 0);
  let rise = null, set = null, prev = sunPosition(d0, lat, lon).elevation;
  for (let m = 5; m <= 1440; m += 5) {
    const t = new Date(+d0 + m * 60000), e = sunPosition(t, lat, lon).elevation;
    if (prev < -0.83 && e >= -0.83) rise = t;
    if (prev >= -0.83 && e < -0.83) set = t;
    prev = e;
  }
  return { rise, set };
}

/** 1. HELIOTROPE clock: writes --sun-t (0..1 between today's sunrise and sunset in Norway).
 *  Before sunrise/after sunset the sun rests just below the edges (t < 0 or > 1). */
export function sunClock(el = document.documentElement, { lat = 59.91, lon = 10.75, now = () => new Date() } = {}) {
  const tick = () => {
    const n = now(); const { rise, set } = dayArc(n, lat, lon);
    let t = rise && set ? (n - rise) / (set - rise) : (sunPosition(n, lat, lon).elevation > 0 ? 0.5 : -0.1);
    el.style.setProperty('--sun-t', Math.max(-0.1, Math.min(1.1, t)).toFixed(4));
  };
  tick();
  const id = setInterval(tick, 60000);
  return () => clearInterval(id);
}

/** 2. LONG SHADOW clock (fallback for browsers without animation-timeline): --shadow-t per element. */
export function scrollShadow(selector = '.raking') {
  if (CSS.supports('animation-timeline: view()')) return () => {};
  const els = [...document.querySelectorAll(selector)];
  let raf = 0;
  const update = () => {
    raf = 0; const vh = innerHeight;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const t = 1 - (r.bottom) / (vh + r.height);
      el.style.setProperty('--shadow-t', Math.max(0, Math.min(1, t)).toFixed(4));
    }
  };
  const on = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); update();
  return () => { removeEventListener('scroll', on); removeEventListener('resize', on); };
}

/** 4. LIGHT LEAK: the pool of light follows the pointer with a slow, critically damped lag. */
export function lightLeak(selector = '.leak') {
  if (reduce()) return () => {};
  const offs = [];
  for (const el of document.querySelectorAll(selector)) {
    let x = 30, y = 20, tx = 30, ty = 20, raf = 0;
    const step = () => {
      x += (tx - x) * 0.06; y += (ty - y) * 0.06;
      el.style.setProperty('--lx', x.toFixed(2) + '%'); el.style.setProperty('--ly', y.toFixed(2) + '%');
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(step) : 0;
    };
    const move = e => { const r = el.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width * 100; ty = (e.clientY - r.top) / r.height * 100; if (!raf) raf = requestAnimationFrame(step); };
    const enter = () => el.style.setProperty('--lo', 1), leave = () => el.style.setProperty('--lo', 0);
    el.addEventListener('pointermove', move); el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave);
    offs.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave); });
  }
  return () => offs.forEach(f => f());
}

/** 5. ARCH REVEAL: add .is-in once, when a third of the element is visible. */
export function archReveal(selector = '.arch-reveal') {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.33 });
  document.querySelectorAll(selector).forEach(el => io.observe(el));
  return () => io.disconnect();
}

/** One call for a page: real-time sun, scroll shadows, light leaks, arch reveals. */
export function initMotion(opts = {}) {
  const offs = [sunClock(document.documentElement, opts), scrollShadow(), lightLeak(), archReveal()];
  return () => offs.forEach(f => f());
}
