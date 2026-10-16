// cursor.js: the brand cursor (signature delight).
// A small magenta Selector (the Albretsen mark, tilted like an arrow) with an ion dot. Hovering
// anything with [data-select] snaps four corner brackets around it, like a character-select
// highlight, with a tag ("P1", or the element's data-select value). Pressing squeezes the brackets.
// Native cursor stays on touch devices and when prefers-reduced-motion is set (brackets then jump).
//   import { initCursor } from './cursor.js'; initCursor();
const MARK = 'M28.63 11.14Q32.00 5.00 35.37 11.14L57.59 51.62Q60.00 56.00 55.00 56.00L48.00 56.00Q45.00 56.00 43.52 53.39L33.97 36.48Q32.00 33.00 30.03 36.48L20.48 53.39Q19.00 56.00 16.00 56.00L9.00 56.00Q4.00 56.00 6.41 51.62Z';

export function initCursor({ color = '#dc3aec', ion = '#36dcec', paper = '#f8f1f8' } = {}) {
  if (!matchMedia('(pointer: fine)').matches) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = document.createElement('style');
  css.textContent = `
  html.nx-cursor, html.nx-cursor * { cursor: none !important; }
  .nx-ptr { position: fixed; left: 0; top: 0; width: 30px; height: 30px; pointer-events: none; z-index: 2147483647; transform: translate3d(-100px,-100px,0); filter: drop-shadow(0 0 6px ${color}88) drop-shadow(0 2px 2px #0008); transition: scale .18s cubic-bezier(.34,1.56,.64,1); }
  .nx-ptr.down { scale: .82; }
  .nx-ret { position: fixed; left: 0; top: 0; pointer-events: none; z-index: 2147483646; width: 0; height: 0; opacity: 0; transition: opacity .2s; }
  .nx-ret.on { opacity: 1; }
  .nx-ret i { position: absolute; width: 14px; height: 14px; border: 2px solid ${color}; filter: drop-shadow(0 0 6px ${color}); transition: inset .22s cubic-bezier(.2,.9,.1,1); }
  .nx-ret i:nth-child(1) { left: -6px; top: -6px; border-right: 0; border-bottom: 0; border-top-left-radius: 6px; }
  .nx-ret i:nth-child(2) { right: -6px; top: -6px; border-left: 0; border-bottom: 0; border-top-right-radius: 6px; }
  .nx-ret i:nth-child(3) { left: -6px; bottom: -6px; border-right: 0; border-top: 0; border-bottom-left-radius: 6px; }
  .nx-ret i:nth-child(4) { right: -6px; bottom: -6px; border-left: 0; border-top: 0; border-bottom-right-radius: 6px; }
  .nx-ret.down i:nth-child(1) { left: 2px; top: 2px; } .nx-ret.down i:nth-child(2) { right: 2px; top: 2px; }
  .nx-ret.down i:nth-child(3) { left: 2px; bottom: 2px; } .nx-ret.down i:nth-child(4) { right: 2px; bottom: 2px; }
  .nx-ret b { position: absolute; left: -6px; top: -30px; font: 600 10px/1 "Geist Mono", ui-monospace, monospace; letter-spacing: .12em; text-transform: uppercase; color: #0b050c; background: ${color}; padding: 5px 7px 4px; border-radius: 4px; box-shadow: 0 0 16px ${color}99; white-space: nowrap; }
  `;
  document.head.appendChild(css);
  const ptr = document.createElement('div'); ptr.className = 'nx-ptr';
  ptr.innerHTML = `<svg viewBox="0 0 40 40" width="30" height="30"><g transform="translate(3 1) rotate(-28 16 16) scale(.5)"><path d="${MARK}" fill="${color}" stroke="${paper}" stroke-width="3.2" stroke-linejoin="round"/><circle cx="32" cy="50.5" r="4.6" fill="${ion}"/></g></svg>`;
  const ret = document.createElement('div'); ret.className = 'nx-ret'; ret.innerHTML = '<i></i><i></i><i></i><i></i><b>P1</b>';
  document.body.append(ret, ptr); document.documentElement.classList.add('nx-cursor');

  let x = -100, y = -100, rx = 0, ry = 0, rw = 0, rh = 0, tx = 0, ty = 0, tw = 0, th = 0, target = null, raf = 0;
  const label = ret.querySelector('b');
  const move = e => { x = e.clientX; y = e.clientY; ptr.style.transform = `translate3d(${x - 4}px,${y - 3}px,0)`;
    const t = e.target.closest?.('[data-select]');
    if (t !== target) { target = t; ret.classList.toggle('on', !!t); if (t) label.textContent = t.dataset.select || 'P1'; }
    kick(); };
  const measure = () => { if (target) { const r = target.getBoundingClientRect(); tx = r.left; ty = r.top; tw = r.width; th = r.height; } else { tx = x - 12; ty = y - 12; tw = 24; th = 24; } };
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick() { raf = 0; measure(); const k = reduce ? 1 : 0.22; rx += (tx - rx) * k; ry += (ty - ry) * k; rw += (tw - rw) * k; rh += (th - rh) * k;
    ret.style.transform = `translate3d(${rx}px,${ry}px,0)`; ret.style.width = rw + 'px'; ret.style.height = rh + 'px';
    if (Math.abs(tx - rx) + Math.abs(ty - ry) + Math.abs(tw - rw) + Math.abs(th - rh) > 0.3) kick(); }
  const down = () => { ptr.classList.add('down'); ret.classList.add('down'); };
  const up = () => { ptr.classList.remove('down'); ret.classList.remove('down'); };
  const leave = () => { ptr.style.transform = 'translate3d(-100px,-100px,0)'; ret.classList.remove('on'); target = null; };
  addEventListener('pointermove', move, { passive: true }); addEventListener('pointerdown', down); addEventListener('pointerup', up);
  addEventListener('scroll', kick, { passive: true }); document.addEventListener('pointerleave', leave);
  return () => { removeEventListener('pointermove', move); removeEventListener('pointerdown', down); removeEventListener('pointerup', up); removeEventListener('scroll', kick); document.removeEventListener('pointerleave', leave); ptr.remove(); ret.remove(); css.remove(); document.documentElement.classList.remove('nx-cursor'); };
}
