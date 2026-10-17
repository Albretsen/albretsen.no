// Long Light: motion helpers (no dependencies). Pairs with motion.css.
//   import { daylong, horizonRise, sunsetSwitch, SWITCH_SVG } from './motion.js'

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollTimelines = CSS.supports('animation-timeline: scroll()');

// Stops of the sky through the day (same as extras/sky-hours.json and the @keyframes in motion.css)
export const DAY = [
  [0.00, '#1B3557', '#F2A35E'], [0.12, '#6F93BF', '#F6C27A'], [0.28, '#8DB6DD', '#F3E3C7'], [0.44, '#6FA3D6', '#D6E7F2'],
  [0.60, '#8CB2D2', '#F1DDB8'], [0.74, '#A8B7C9', '#F3A55E'], [0.86, '#6B4C7E', '#F2A07A'], [1.00, '#1E2F55', '#8A6E95'],
];
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => 'rgb(' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t)).join(',') + ')';
export function skyAt(p) {
  p = Math.min(1, Math.max(0, p));
  let i = DAY.findIndex(s => s[0] >= p); if (i <= 0) return { top: DAY[0][1], horizon: DAY[0][2] };
  const [a, b] = [DAY[i - 1], DAY[i]], t = (p - a[0]) / (b[0] - a[0]);
  return { top: mix(a[1], b[1], t), horizon: mix(a[2], b[2], t) };
}

// 1. DAYLONG: fallback for browsers without scroll timelines; also calls onProgress (e.g. to drive Sunline's sun)
export function daylong({ target = document.documentElement, onProgress } = {}) {
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    if (!scrollTimelines) { const s = skyAt(p); target.style.setProperty('--sky-top', s.top); target.style.setProperty('--sky-horizon', s.horizon); }
    onProgress?.(p);
  };
  const on = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); update();
  return () => { removeEventListener('scroll', on); removeEventListener('resize', on); };
}

// 3. HORIZON RISE: wraps each line of a heading and raises it when it enters the view.
//    <h2 class="horizon-rise" data-lines="Quiet software|that pays for itself">
export function horizonRise(root = document) {
  const els = [...root.querySelectorAll('.horizon-rise')];
  for (const el of els) {
    if (el.dataset.lines && !el.querySelector('.line')) {
      const label = el.dataset.lines.replace(/\|/g, ' ');
      el.setAttribute('aria-label', label);
      el.innerHTML = el.dataset.lines.split('|').map(l => `<span class="line" aria-hidden="true"><span>${l}</span></span>`).join('');
    }
  }
  if (reduced()) { els.forEach(e => e.classList.add('is-up')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-up'); io.unobserve(e.target); } }), { threshold: 0.35 });
  els.forEach(e => io.observe(e));
}

// 4. SUNSET SWITCH: the icon (a sun that sinks under a horizon, a moon that rises) and the circular theme reveal.
export const SWITCH_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true">
  <defs><clipPath id="ss-above"><rect x="0" y="0" width="40" height="25"/></clipPath></defs>
  <g clip-path="url(#ss-above)">
    <g class="sun"><circle cx="20" cy="22" r="7" fill="currentColor"/>
      <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M20 9.5v2.6M11.2 13.2l1.8 1.8M28.8 13.2l-1.8 1.8M7.5 22h2.6M29.9 22h2.6"/></g></g>
    <g class="moon"><path d="M23.5 11.5a8 8 0 1 0 6 12.3 6.4 6.4 0 1 1-6-12.3z" fill="currentColor"/></g>
  </g>
  <path d="M5 25.5h30" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M12 29.5h16M16 33h8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>
</svg>`;

export function sunsetSwitch(button, { onChange, storageKey = 'albretsen-theme' } = {}) {
  const root = document.documentElement;
  if (!button.innerHTML.trim()) button.innerHTML = SWITCH_SVG;
  let saved = null; try { saved = localStorage.getItem(storageKey); } catch {}
  const forced = new URLSearchParams(location.search).get('theme');  // ?theme=day|night for screenshots and links
  const initial = (forced === 'day' || forced === 'night') ? forced : saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day');
  root.dataset.theme = initial;
  const label = () => button.setAttribute('aria-label', root.dataset.theme === 'night' ? 'Switch to day' : 'Switch to night');
  label(); onChange?.(initial, { instant: true });
  button.addEventListener('click', async e => {
    const next = root.dataset.theme === 'night' ? 'day' : 'night';
    const apply = () => { root.dataset.theme = next; label(); try { localStorage.setItem(storageKey, next); } catch {} onChange?.(next, {}); };
    if (!document.startViewTransition || reduced()) return apply();
    const r = button.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(apply);
    await t.ready;
    root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 1100, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' });
  });
}
