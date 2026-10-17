// Nocturne Select: motion.js (design 48). Pairs with motion.css.
//   import { initMotion } from './motion.js'
//   const m = await initMotion({ lenis: true })   // smooth scroll + all behaviours below
//   m.wipe(() => swapContent())                  // VERSUS-WIPE around a content change
const LENIS = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export async function initMotion({ lenis = true, root = document } = {}) {
  let smooth = null;
  if (lenis && !reduce()) {
    const { default: Lenis } = await import(LENIS);
    smooth = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    const raf = t => { smooth.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  }
  selectLock(root); powerOn(root); statRoll(root);
  const overlay = Object.assign(document.createElement('div'), { className: 'versus-wipe', ariaHidden: 'true' });
  document.body.appendChild(overlay);
  return {
    lenis: smooth,
    // VERSUS-WIPE: run cb at the moment the blade fully covers the screen.
    wipe(cb) {
      if (reduce()) { cb?.(); return Promise.resolve(); }
      overlay.classList.remove('is-wiping'); void overlay.offsetWidth; overlay.classList.add('is-wiping');
      return new Promise(res => { setTimeout(() => cb?.(), 500); overlay.addEventListener('animationend', () => { overlay.classList.remove('is-wiping'); res(); }, { once: true }); });
    },
  };
}

// SELECT-LOCK: pointer tilt for .select-lock cards (max 7deg).
export function selectLock(root = document) {
  if (reduce() || matchMedia('(pointer: coarse)').matches) return;
  root.querySelectorAll('.select-lock').forEach(el => {
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg'); el.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg'); });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
  });
}

// POWER-ON: elements with [data-power] get .power-on (staggered by --i) when they enter.
export function powerOn(root = document) {
  const els = [...root.querySelectorAll('[data-power]')];
  if (reduce()) return;
  els.forEach(el => el.style.opacity = '0');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const el = e.target; el.style.opacity = ''; el.classList.add('power-on'); io.unobserve(el); } }), { threshold: 0.25 });
  els.forEach((el, i) => { if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i % 6); io.observe(el); });
}

// STAT-ROLL: [data-roll] text like "113,000+" or "$782" rolls up from zero, keeping its format.
export function statRoll(root = document) {
  const els = root.querySelectorAll('[data-roll]');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const el = e.target, final = el.textContent, m = final.match(/[\d,]+/); if (!m || reduce()) return;
    const target = +m[0].replace(/,/g, ''), t0 = performance.now(), dur = 1400;
    const fmt = v => final.replace(m[0], m[0].includes(',') ? Math.round(v).toLocaleString('en-US') : String(Math.round(v)));
    const step = now => { const k = Math.min(1, (now - t0) / dur); const e3 = 1 - Math.pow(1 - k, 4); el.textContent = fmt(target * e3); if (k < 1) requestAnimationFrame(step); else el.textContent = final; };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  els.forEach(el => { el.classList.add('stat-roll'); io.observe(el); });
}
