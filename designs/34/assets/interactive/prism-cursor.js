// prism-cursor.js — the brand cursor of design 34 "Tension Prism".
//
// A small glass prism (outlined triangle) that follows the pointer on a
// spring, turns its apex into the direction of travel, and *disperses*: a mint
// ghost and a white ghost trail behind it, separated by speed — like light
// splitting in a prism. Over anything interactive it fills mint, grows and
// shows an optional label (data-cursor="View"). Pressing compresses it
// (tension) and releases three tiny shards.
//
// Usage: import { initPrismCursor } from './prism-cursor.js'; const off = initPrismCursor();
// Opt-in targets: a, button, [role=button], [data-cursor], [data-cursor="Label"].
// Disabled automatically on touch / coarse pointers and with reduced motion.

const MINT = '#39FD9E';

export function initPrismCursor({ root = document.body, selector = 'a,button,[role="button"],[role="tab"],summary,[data-cursor]' } = {}) {
  if (!matchMedia('(pointer: fine)').matches) return () => {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrap = document.createElement('div');
  wrap.className = 'pc';
  wrap.setAttribute('aria-hidden', 'true');
  const tri = (cls) => `<svg class="${cls}" viewBox="-20 -20 40 40" width="40" height="40"><path d="M0 -13 L11.26 6.5 L-11.26 6.5 Z"/></svg>`;
  wrap.innerHTML = `${tri('pc-ghost pc-ghost-w')}${tri('pc-ghost pc-ghost-m')}${tri('pc-main')}<span class="pc-label"></span>`;
  const style = document.createElement('style');
  style.textContent = `
  .pc{position:fixed;inset:0;pointer-events:none;z-index:2147483000}
  .pc svg{position:absolute;left:0;top:0;margin:-20px 0 0 -20px;overflow:visible;will-change:transform}
  .pc-main path{fill:transparent;stroke:#fff;stroke-width:1.6;stroke-linejoin:round;transition:fill .25s,stroke .25s}
  .pc-ghost path{fill:none;stroke-width:1.2;stroke-linejoin:round}
  .pc-ghost-m path{stroke:${MINT}}
  .pc-ghost-w path{stroke:#fff;opacity:.5}
  .pc.is-hover .pc-main path{fill:${MINT};stroke:${MINT}}
  .pc.is-hover .pc-ghost{opacity:0}
  .pc-ghost{transition:opacity .2s}
  .pc-label{position:absolute;left:0;top:0;font:600 11px/1 'Geist Mono',ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;
    color:#060807;background:${MINT};padding:6px 8px 5px;border-radius:2px;opacity:0;transform:translate(18px,14px) scale(.9);transform-origin:0 0;transition:opacity .2s,transform .3s cubic-bezier(.2,1.4,.4,1);white-space:nowrap}
  .pc.has-label .pc-label{opacity:1}
  .pc-shard{position:absolute;left:0;top:0;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:7px solid ${MINT}}
  html.pc-on, html.pc-on *{cursor:none!important}
  @media (prefers-reduced-motion: reduce){.pc-ghost{display:none}}`;
  document.head.append(style);
  root.append(wrap);
  document.documentElement.classList.add('pc-on');
  const [gw, gm, main] = wrap.querySelectorAll('svg');
  const label = wrap.querySelector('.pc-label');
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, vx = 0, vy = 0;
  let ang = 0, scale = 1, tScale = 1, press = 1, visible = false;
  const onMove = (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!visible) { x = tx; y = ty; visible = true; wrap.style.opacity = 1; }
    const t = e.target.closest?.(selector);
    wrap.classList.toggle('is-hover', !!t);
    const lab = t?.getAttribute?.('data-cursor');
    if (lab && lab !== '' && lab !== 'true') { label.textContent = lab; wrap.classList.add('has-label'); }
    else wrap.classList.remove('has-label');
    tScale = t ? 1.9 : 1;
  };
  const onDown = (e) => {
    press = 0.7;
    if (reduced) return;
    for (let i = 0; i < 3; i++) {
      const s = document.createElement('i'); s.className = 'pc-shard'; wrap.append(s);
      const a = ang + Math.PI + (i - 1) * 0.6, d = 26 + Math.random() * 14;
      s.animate([
        { transform: `translate(${e.clientX - 4}px,${e.clientY - 4}px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${e.clientX - 4 + Math.cos(a) * d}px,${e.clientY - 4 + Math.sin(a) * d}px) rotate(${(Math.random() - .5) * 360}deg)`, opacity: 0 },
      ], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => s.remove();
    }
  };
  const onUp = () => { press = 1; };
  const onLeave = () => { visible = false; wrap.style.opacity = 0; };
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerdown', onDown);
  addEventListener('pointerup', onUp);
  document.addEventListener('pointerleave', onLeave);
  let raf;
  const tick = () => {
    const k = reduced ? 1 : 0.32;
    const nx = x + (tx - x) * k, ny = y + (ty - y) * k;
    vx = nx - x; vy = ny - y; x = nx; y = ny;
    const sp = Math.hypot(vx, vy);
    if (sp > 0.4) {
      const target = Math.atan2(vy, vx) + Math.PI / 2; // apex leads
      let dA = target - ang; dA = Math.atan2(Math.sin(dA), Math.cos(dA));
      ang += dA * 0.18;
    }
    scale += (tScale * press - scale) * 0.2;
    const spread = Math.min(sp * 0.9, 16); // dispersion grows with speed
    const ux = sp ? vx / sp : 0, uy = sp ? vy / sp : 0;
    const T = (ox, oy, s) => `translate(${x + ox}px,${y + oy}px) rotate(${ang}rad) scale(${s})`;
    main.style.transform = T(0, 0, scale);
    gm.style.transform = T(-ux * spread, -uy * spread, scale * 0.96);
    gw.style.transform = T(-ux * spread * 1.9 + uy * spread * 0.3, -uy * spread * 1.9 - ux * spread * 0.3, scale * 0.92);
    label.style.translate = `${x}px ${y}px`;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onDown); removeEventListener('pointerup', onUp);
    document.removeEventListener('pointerleave', onLeave);
    wrap.remove(); style.remove(); document.documentElement.classList.remove('pc-on');
  };
}
