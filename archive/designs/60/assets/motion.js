// Pocket Planet — motion helpers (design 60). Pairs with motion.css.
//
//   import { observeSling, tilt, wormhole, popMark } from './motion.js'
//   observeSling()                      // SLINGSHOT: adds .is-in to .pp-sling elements as they enter the viewport
//   tilt(el)                            // TILT + PARALLAX: sets --tx/--ty (-1..1) from pointer or device orientation
//   wormhole(event, () => update())     // WORMHOLE: View Transition from the pointer (falls back to an instant update)
//   popMark(el)                         // POP-OUT: replays the mark's voxel pop

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function observeSling(root = document, { threshold = 0.2 } = {}) {
  const els = root.querySelectorAll('.pp-sling:not(.is-in)');
  if (reduce() || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return () => {}; }
  const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold });
  els.forEach(e => io.observe(e));
  return () => io.disconnect();
}

export function replaySling(root) {
  root.querySelectorAll('.pp-sling').forEach(e => { e.classList.remove('is-in'); void e.offsetWidth; requestAnimationFrame(() => e.classList.add('is-in')); });
}

// Pointer on desktop, gyroscope on phones (iOS asks permission on the first tap). Smoothed with a critically damped lerp.
export function tilt(el, { scope = window, ease = 0.12 } = {}) {
  el.classList.add('pp-tilt');
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0, alive = true;
  const move = e => { const r = el.getBoundingClientRect(); tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)); ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2)); };
  const leave = () => { tx = 0; ty = 0; };
  const orient = e => { if (e.gamma == null) return; tx = Math.max(-1, Math.min(1, e.gamma / 25)); ty = Math.max(-1, Math.min(1, (e.beta - 40) / 25)); };
  const askGyro = () => { const D = window.DeviceOrientationEvent; if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {}); };
  scope.addEventListener('pointermove', move, { passive: true }); el.addEventListener('pointerleave', leave);
  window.addEventListener('deviceorientation', orient); el.addEventListener('click', askGyro, { once: true });
  const loop = () => { if (!alive) return; x += (tx - x) * ease; y += (ty - y) * ease; el.style.setProperty('--tx', x.toFixed(4)); el.style.setProperty('--ty', y.toFixed(4)); raf = requestAnimationFrame(loop); };
  if (!reduce()) loop();
  el.querySelectorAll('[data-depth]').forEach(n => n.style.setProperty('--d', n.dataset.depth));
  return () => { alive = false; cancelAnimationFrame(raf); scope.removeEventListener('pointermove', move); window.removeEventListener('deviceorientation', orient); };
}

export function wormhole(event, update, { types = [] } = {}) {
  const x = event?.clientX ?? innerWidth / 2, y = event?.clientY ?? innerHeight / 2;
  if (!document.startViewTransition || reduce()) { update(); return Promise.resolve(); }
  const root = document.documentElement;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.style.setProperty('--wx', x + 'px'); root.style.setProperty('--wy', y + 'px'); root.style.setProperty('--wr', r + 'px');
  root.classList.add('pp-wormhole');
  let vt;
  try { vt = document.startViewTransition({ update, types }); } catch { vt = document.startViewTransition(update); }
  return vt.finished.finally(() => root.classList.remove('pp-wormhole'));
}

export function popMark(el) { el.classList.remove('is-popping'); void el.getBoundingClientRect(); el.classList.add('is-popping'); setTimeout(() => el.classList.remove('is-popping'), 950); }
