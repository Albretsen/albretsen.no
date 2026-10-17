// The signature: drag the sun. Loads the kit's three.js scene over the baked
// still (same renderer, so the swap does not jump), then wires a keyboard
// slider, a readout, the page's --day tint and the optional chime.
import { createHeureBleue } from '../assets/3d/heure-bleue.js';

const REST = 0.245;                    // -1.6°: the sun's sliver on the sea
const e2t = (e) => (e + 7) / 22;       // elevation (deg) -> scene time
const t2e = (t) => -7 + t * 22;

const hourOf = (e) => e >= 6 ? 'Afternoon' : e >= 0.4 ? 'Golden hour' : e >= -4.2 ? 'Blue hour' : 'Lamplight';
const say = (e) => {
  const a = Math.abs(e).toFixed(1);
  const where = e > 0.05 ? `${a} degrees above the horizon` : e < -0.05 ? `${a} degrees below the horizon` : 'on the horizon';
  return `${where}, ${hourOf(e).toLowerCase()}`;
};
const fmt = (e) => `${e > 0.05 ? '+' : e < -0.05 ? '−' : ''}${Math.abs(e).toFixed(1)}°`;

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export function startSun({ sound } = {}) {
  if (!webglOK()) return;
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('scene');
  const handle = document.getElementById('sun');
  const deg = document.getElementById('deg');
  const hour = document.getElementById('hour');
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const s = createHeureBleue(canvas, { time: REST, animate: !reduce });
  let lastText = '', lastHour = '', lastE = t2e(REST), back = 0, focused = false;

  function sync(t) {
    const e = t2e(t);
    const p = s.sunScreen();
    handle.style.setProperty('--sx', `${p.x.toFixed(1)}px`);
    handle.style.setProperty('--sy', `${p.y.toFixed(1)}px`);
    const text = fmt(e);
    if (text !== lastText) {
      lastText = text; deg.textContent = text;
      handle.setAttribute('aria-valuenow', e.toFixed(1));
      handle.setAttribute('aria-valuetext', say(e));
    }
    const h = hourOf(e);
    if (h !== lastHour) { lastHour = h; hour.textContent = h; }
    const day = Math.min(1, Math.max(0, (e + 1.6) / 10));
    root.style.setProperty('--day', day.toFixed(3));
    if (sound) {
      if ((lastE < 0) !== (e < 0)) sound.chime(0.8);
      sound.daylight(day);
    }
    lastE = e;
  }

  function goHomeLater() {
    clearTimeout(back);
    if (reduce) return; // nothing moves on its own when motion is reduced
    back = setTimeout(() => { if (!focused) s.setTime(REST); }, 6000);
  }

  function touched() { handle.classList.add('is-touched'); }

  s.onFrame = sync;
  s.onTime = (t) => {
    touched();
    if (reduce) { s.setTime(t, true); sync(t); }
    goHomeLater();
  };

  // On touch screens the canvas keeps vertical page scroll (pan-y). A touch that
  // starts on the sun belongs to the sun, so stop the page from taking it.
  canvas.addEventListener('touchstart', (ev) => {
    const r = canvas.getBoundingClientRect(), p = s.sunScreen(), t = ev.touches[0];
    if (Math.hypot(t.clientX - r.left - p.x, t.clientY - r.top - p.y) < Math.max(56, r.height * 0.09)) ev.preventDefault();
  }, { passive: false });

  // Keyboard: the sun is a vertical slider (APG slider pattern).
  handle.addEventListener('keydown', (ev) => {
    const e = t2e(s.time);
    const step = { ArrowUp: 0.5, ArrowRight: 0.5, ArrowDown: -0.5, ArrowLeft: -0.5, PageUp: 3, PageDown: -3 }[ev.key];
    let next = null;
    if (step != null) next = e + step;
    else if (ev.key === 'Home') next = -7;
    else if (ev.key === 'End') next = 15;
    if (next == null) return;
    ev.preventDefault();
    next = Math.min(15, Math.max(-7, next));
    s.setTime(e2t(next), reduce);
    if (reduce) sync(e2t(next));
    touched();
    goHomeLater();
  });
  handle.addEventListener('focus', () => { focused = true; clearTimeout(back); });
  handle.addEventListener('blur', () => { focused = false; goHomeLater(); });

  // Reveal once the first live frame is on screen.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    sync(s.time);
    handle.hidden = false;
    hero.classList.add('is-live');
  }));
  addEventListener('resize', () => requestAnimationFrame(() => sync(s.time)), { passive: true });
  return s;
}
