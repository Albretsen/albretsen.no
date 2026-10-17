// Habit — motion study (pairs with motion.css). No dependencies.
//
//   import { inkIn, typeTurn, lightsOut, pageTurn, inlineSvg } from './motion.js';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fetch an SVG file and inline it (so CSS can reach its groups, e.g. the lamp's #cord). */
export async function inlineSvg(url, into, cls = '', keepSize = false) {
  const txt = await (await fetch(url)).text();
  into.innerHTML = txt;
  const svg = into.querySelector('svg');
  if (cls) svg.classList.add(...cls.split(' '));
  if (!keepSize) { svg.removeAttribute('width'); svg.removeAttribute('height'); }
  return svg;
}

/** 1. INK-IN — draw every [data-ink] SVG (and .ink-develop image) when it enters the viewport. */
export function inkIn(root = document, { threshold = 0.25 } = {}) {
  const els = [...root.querySelectorAll('[data-ink], .ink-develop')];
  els.forEach(el => {
    el.querySelectorAll?.('path, circle, line, polyline').forEach((p, i) => {
      p.setAttribute('pathLength', '1');
      if (!p.style.getPropertyValue('--i')) p.style.setProperty('--i', i);
    });
  });
  // ?still renders everything finished (handy for screenshots and print)
  if (reduce() || /[?&]still/.test(location.search)) { els.forEach(el => el.classList.add('is-inked')); return; }
  // clipped elements (.ink-develop) are observed through their parent: an element
  // clipped to nothing never reports as intersecting.
  const target = new Map(els.map(el => [el.classList.contains('ink-develop') ? el.parentElement : el, el]));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { target.get(e.target)?.classList.add('is-inked'); io.unobserve(e.target); }
  }), { threshold });
  // two frames so the undrawn state paints first
  requestAnimationFrame(() => requestAnimationFrame(() => target.forEach((_, obs) => io.observe(obs))));
}

/** 2. TYPING TURN — play a list of turns into `log`, each with a typing beat.
 *  turns: [{ from: 'site'|'you', html: '...' }]. Returns a promise. */
export async function typeTurn(log, turns, { cps = 38, min = 450, max = 1500, gap = 380 } = {}) {
  for (const t of turns) {
    const el = document.createElement('div');
    el.className = 'turn'; el.dataset.from = t.from || 'site';
    el.innerHTML = `<span class="typing" aria-hidden="true"><i></i><i></i><i></i></span><span class="turn-text">${t.html}</span>`;
    log.appendChild(el);
    if (!reduce() && el.dataset.from === 'site') {
      el.dataset.state = 'typing';
      const len = el.querySelector('.turn-text').textContent.length;
      await sleep(Math.max(min, Math.min(max, len / cps * 1000)));
    }
    el.dataset.state = 'open';
    await sleep(reduce() ? 0 : gap);
  }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Wobbly circle as a CSS polygon() — same point count at every radius so WAAPI can interpolate. */
function wobblyCircle(cx, cy, r, seed = 1, n = 64) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const w = 1 + 0.035 * Math.sin(a * 3 + seed) + 0.02 * Math.sin(a * 7 + seed * 2.3) + 0.012 * Math.sin(a * 13 + seed * 4.1);
    pts.push(`${(cx + Math.cos(a) * r * w).toFixed(1)}px ${(cy + Math.sin(a) * r * w).toFixed(1)}px`);
  }
  return `polygon(${pts.join(',')})`;
}

/** 4. LIGHTS OUT — theme switch as a View Transition revealed from the lamp.
 *  apply(next) must update the DOM synchronously (e.g. set data-theme). */
export function lightsOut(lampEl, apply) {
  return async function toggle(ev) {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    lampEl.classList.add('is-pulled'); setTimeout(() => lampEl.classList.remove('is-pulled'), 300);
    if (!document.startViewTransition || reduce()) { apply(next); return; }
    const b = lampEl.getBoundingClientRect();
    const x = ev?.clientX ?? b.left + b.width / 2, y = b.top + b.height * 0.45;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 1.08;
    root.classList.add('lights-switching');
    const vt = document.startViewTransition(() => apply(next));
    await vt.ready;
    const seed = Math.random() * 10;
    const frames = [0, 0.12, 0.3, 0.55, 0.8, 1].map(k => ({ clipPath: wobblyCircle(x, y, Math.max(0.5, R * k), seed + k * 2) }));
    root.animate(frames, { duration: 900, easing: 'cubic-bezier(.65,0,.25,1)', pseudoElement: '::view-transition-new(root)' });
    await vt.finished;
    root.classList.remove('lights-switching');
  };
}

/** 5. PAGE TURN — wrap a DOM update in a View Transition; elements with
 *  view-transition-name: page turn, named elements morph. */
export function pageTurn(update) {
  if (!document.startViewTransition || reduce()) return update();
  return document.startViewTransition(update).finished;
}
