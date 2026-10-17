// The Aperture cursor — Albretsen AS signature delight (Web Animations API, no deps).
// A seven-blade iris that follows the pointer with a short lag.
//   rest      : wide open (f/1.4), a hairline ring with the corona bead at 45°
//   over link : the blades close to f/8 around the target and a mono readout names it
//   press     : a shutter blink (blades close fully and reopen, 220 ms)
//   over text : collapses to a thin vertical slit (aperture as caret)
// Only for fine pointers; respects prefers-reduced-motion (no lag, no blink).
// Usage: import { mountCursor } from './cursor.js'; mountCursor();
// Optional data-cursor="Label" on any element overrides the readout text.

const BLADES = 7;
const INK = '#fdf8fd', GLOW = '#ca6fd3';

function irisSVG() {
  const blades = [];
  for (let i = 0; i < BLADES; i++) {
    const a = (360 / BLADES) * i;
    // one blade: a curved shard pivoting at the rim; rotating it closes the aperture
    blades.push(`<g transform="rotate(${a} 32 32)"><path class="b" d="M32 6 A26 26 0 0 1 54.5 19 L36 30 Z" fill="${INK}" fill-opacity=".1" stroke="${INK}" stroke-width=".8" stroke-linejoin="round" style="transform-origin:32px 6px"/></g>`);
  }
  return `<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
    <circle cx="32" cy="32" r="27" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width=".8"/>
    <g class="blades">${blades.join('')}</g>
    <circle class="bead" cx="51.1" cy="12.9" r="2.2" fill="${GLOW}"/>
  </svg>`;
}

export function mountCursor({ root = document.body } = {}) {
  if (!matchMedia('(pointer: fine)').matches) return null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = document.createElement('div');
  el.className = 'ap-cursor';
  el.innerHTML = `${irisSVG()}<span class="ap-read"></span>`;
  Object.assign(el.style, {
    position: 'fixed', left: '0', top: '0', width: '64px', height: '64px', margin: '-32px 0 0 -32px',
    pointerEvents: 'none', zIndex: '9999', mixBlendMode: 'difference', opacity: '0', willChange: 'transform',
  });
  const read = el.querySelector('.ap-read');
  Object.assign(read.style, {
    position: 'absolute', left: '62px', top: '24px', whiteSpace: 'nowrap', color: INK,
    font: '500 10px/1 "Geist Mono", ui-monospace, monospace', letterSpacing: '.16em', textTransform: 'uppercase', opacity: '0',
  });
  root.appendChild(el);
  const style = document.createElement('style');
  style.textContent = `@media (pointer: fine){ html.ap-on, html.ap-on a, html.ap-on button, html.ap-on [data-cursor] { cursor: none } }`;
  document.head.appendChild(style);
  document.documentElement.classList.add('ap-on');

  const blades = [...el.querySelectorAll('.b')];
  const svg = el.querySelector('svg');
  let x = innerWidth / 2, y = innerHeight / 2, mode = 'open', shown = false;

  // aperture states: blade rotation (deg) and overall scale
  const STATES = { open: { r: 0, s: 1, f: '1.4' }, link: { r: 28, s: 0.82, f: '8' }, text: { r: 44, s: 0.5, f: '22' } };
  const setMode = (m, label) => {
    if (m === mode && !label) return;
    mode = m;
    const st = STATES[m];
    blades.forEach((b, i) => b.animate([{ transform: `rotate(${st.r}deg)` }], {
      duration: reduce ? 0 : 420, delay: reduce ? 0 : i * 14, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }));
    svg.animate([{ transform: `scale(${st.s}) ${m === 'text' ? 'scaleX(.35)' : ''}` }], {
      duration: reduce ? 0 : 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    read.textContent = label || (m === 'link' ? `ƒ/${st.f}` : '');
    read.animate([{ opacity: label || m === 'link' ? 1 : 0, transform: 'translateX(0)' }], { duration: 260, fill: 'forwards' });
  };

  const move = (e) => {
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; el.animate([{ opacity: 1 }], { duration: 300, fill: 'forwards' }); }
    // a short lag, done as a WAAPI tween each move (compositor-friendly)
    el.animate([{ transform: `translate(${x}px, ${y}px)` }], { duration: reduce ? 0 : 140, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
    const t = e.target.closest?.('a, button, [data-cursor], input, label, summary');
    if (t) setMode('link', t.dataset.cursor || (t.textContent || '').trim().slice(0, 28));
    else if (e.target.closest?.('p, h1, h2, h3, li, blockquote')) setMode('text');
    else setMode('open');
  };
  const down = () => {
    if (reduce) return;
    // shutter blink: blades sweep shut and reopen
    blades.forEach((b) => b.animate([
      { transform: `rotate(${STATES[mode].r}deg)` }, { transform: 'rotate(58deg)', offset: .45 }, { transform: `rotate(${STATES[mode].r}deg)` },
    ], { duration: 220, easing: 'ease-in-out', composite: 'replace' }));
    el.querySelector('.bead').animate([{ r: 2.2, opacity: 1 }, { r: 5, opacity: .2 }, { r: 2.2, opacity: 1 }], { duration: 380 });
  };
  addEventListener('pointermove', move, { passive: true });
  addEventListener('pointerdown', down);
  document.addEventListener('pointerleave', () => el.animate([{ opacity: 0 }], { duration: 200, fill: 'forwards' }) && (shown = false));

  return { el, destroy() { removeEventListener('pointermove', move); removeEventListener('pointerdown', down); el.remove(); style.remove(); document.documentElement.classList.remove('ap-on'); } };
}
