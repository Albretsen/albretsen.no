// motion.js — design 41 "Key Frame"
// Signature motion, built on Motion (motion.dev, vendored as window.Motion,
// vendor/motion-12.23.24.js). Every helper respects prefers-reduced-motion.
//
//   smearIn(targets)        entrance: smear frame + squash, held on twos
//   installBoil()           hover: SVG turbulence "line boil" filters (#kf-boil-0..2)
//   pegLift(selector)       hover: spring lift with a hard ink shadow
//   impactFrame(el)         feedback: two inverted drawings + shake
//   celWipe({dir})          transition: diagonal ink/blue wipe, resolves when covered
//   multiplane(root)        scroll: parallax layers stepped at 12 fps
//   rearrangeable(list)     delight: drag any item to reorder, FLIP reflow on springs
//
const M = () => window.Motion;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const TWO = 1 / 12; // seconds per drawing on twos

/* 1. SMEAR-IN ------------------------------------------------------------ */
export function smearIn(targets, { stagger = 0.06 } = {}) {
  const els = typeof targets === 'string' ? [...document.querySelectorAll(targets)] : [].concat(targets);
  if (reduced() || !M()) { els.forEach(e => (e.style.opacity = 1)); return; }
  const { animate, steps } = M();
  els.forEach((el, i) => {
    el.style.transformOrigin = '50% 100%';
    animate(el, {
      opacity: [0, 1, 1, 1, 1, 1],
      y: [-46, -46, 6, -5, 1, 0],
      scaleX: [0.72, 0.72, 1.16, 0.96, 1.02, 1],
      scaleY: [1.55, 1.55, 0.8, 1.05, 0.98, 1],
    }, { duration: TWO * 6, ease: steps(1, 'end'), delay: i * stagger, times: [0, 0.1666, 0.3333, 0.5, 0.6666, 0.8333] });
  });
}

/* 2. LINE BOIL --------------------------------------------------------- */
export function installBoil({ scale = 2.2 } = {}) {
  if (document.getElementById('kf-boil-defs')) return;
  const seeds = [3, 17, 41];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'kf-boil-defs';
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0';
  svg.innerHTML = seeds.map((s, i) => `
    <filter id="kf-boil-${i}" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${s}"/>
      <feDisplacementMap in="SourceGraphic" scale="${scale}"/>
    </filter>`).join('');
  document.body.appendChild(svg);
}

/* 3. PEG LIFT --------------------------------------------------------- */
export function pegLift(selector) {
  if (!M()) return;
  const { hover, animate } = M();
  hover(selector, el => {
    if (reduced()) return;
    animate(el, { y: -7, x: -3, rotate: -1.2, boxShadow: `10px 12px 0 ${getComputedStyle(el).getPropertyValue('--peg-shadow').trim() || '#011835'}` }, { type: 'spring', stiffness: 520, damping: 18 });
    return () => animate(el, { y: 0, x: 0, rotate: 0, boxShadow: `4px 4px 0 ${getComputedStyle(el).getPropertyValue('--peg-shadow').trim() || '#011835'}` }, { type: 'spring', stiffness: 380, damping: 24 });
  });
}

/* 4. IMPACT FRAME ----------------------------------------------------- */
export function impactFrame(el = document.body) {
  if (reduced()) return;
  el.classList.remove('kf-impact');
  void el.offsetWidth; // restart
  el.classList.add('kf-impact');
  el.addEventListener('animationend', () => el.classList.remove('kf-impact'), { once: true });
}

/* 5. CEL WIPE ---------------------------------------------------------
   const wipe = celWipe(); await wipe.covered; swap content; await wipe.done */
export function celWipe({ dir = 1, duration = 0.62 } = {}) {
  const host = document.createElement('div');
  host.className = 'kf-wipe';
  host.innerHTML = '<i></i><i></i>';
  document.body.appendChild(host);
  const [band, panel] = host.children;
  const off = dir > 0 ? 'polygon(-20% 0, -20% 0, -40% 100%, -40% 100%)' : 'polygon(140% 0, 140% 0, 120% 100%, 120% 100%)';
  const on = 'polygon(-20% 0, 140% 0, 120% 100%, -40% 100%)';
  const out = dir > 0 ? 'polygon(140% 0, 140% 0, 120% 100%, 120% 100%)' : 'polygon(-20% 0, -20% 0, -40% 100%, -40% 100%)';
  if (reduced() || !M()) {
    host.remove();
    return { covered: Promise.resolve(), done: Promise.resolve() };
  }
  const { animate, steps } = M();
  const ease = steps(8, 'end'); // the wipe itself is drawn: 8 drawings across
  const a1 = animate(band, { clipPath: [off, on] }, { duration, ease });
  const a2 = animate(panel, { clipPath: [off, on] }, { duration, ease, delay: TWO * 1.5 });
  const covered = Promise.all([a1, a2]);
  const done = covered.then(() => Promise.all([
    animate(panel, { clipPath: [on, out] }, { duration, ease }),
    animate(band, { clipPath: [on, out] }, { duration, ease, delay: TWO * 1.5 }),
  ])).then(() => host.remove());
  return { covered, done };
}

/* 6. MULTIPLANE ------------------------------------------------------
   <div data-plane="0.3"> moves at 30% of scroll, updated at 12 fps.   */
export function multiplane(root = document) {
  const planes = [...root.querySelectorAll('[data-plane]')];
  if (!planes.length || reduced()) return () => {};
  let lastT = 0, raf;
  const tick = t => {
    raf = requestAnimationFrame(tick);
    if (t - lastT < TWO * 1000) return; lastT = t;
    const y = scrollY;
    planes.forEach(p => { p.style.transform = `translate3d(0, ${(-y * parseFloat(p.dataset.plane)).toFixed(1)}px, 0)`; });
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/* 7. REARRANGEABLE ---------------------------------------------------
   Signature delight: every list on the site can be re-cut by dragging.
   Items lift (peg lift), siblings reflow with FLIP on springs, the order
   persists per list (localStorage key = data-cut). Keyboard: focus an
   item, Alt+Arrow moves it.                                            */
export function rearrangeable(list, { onChange } = {}) {
  const key = list.dataset.cut && `kf-cut:${list.dataset.cut}`;
  const items = () => [...list.children];
  try { // restore saved order
    const saved = key && JSON.parse(localStorage.getItem(key) || 'null');
    if (saved) saved.forEach(id => { const el = items().find(e => e.dataset.id === id); if (el) list.appendChild(el); });
  } catch {}
  const save = () => { try { key && localStorage.setItem(key, JSON.stringify(items().map(e => e.dataset.id))); } catch {} onChange?.(items()); };
  const flip = (mutate) => {
    const before = new Map(items().map(e => [e, e.getBoundingClientRect()]));
    mutate();
    if (reduced() || !M()) return;
    const { animate } = M();
    items().forEach(e => {
      if (e.classList.contains('is-dragging')) return;
      const a = before.get(e), b = e.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) animate(e, { x: [dx, 0], y: [dy, 0] }, { type: 'spring', stiffness: 420, damping: 30 });
    });
  };
  let drag = null;
  const local = (e, el) => { const p = (el.offsetParent || document.body).getBoundingClientRect(); return { x: e.clientX - p.left, y: e.clientY - p.top }; };
  list.addEventListener('pointerdown', e => {
    const el = e.target.closest('[data-id]');
    if (!el || el.parentElement !== list || e.button !== 0 || e.target.closest('a,button,input')) return;
    e.preventDefault();
    const p = local(e, el);
    drag = { el, gx: p.x - el.offsetLeft, gy: p.y - el.offsetTop };
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
    el.style.zIndex = 20;
  });
  list.addEventListener('pointermove', e => {
    if (!drag) return;
    const { el } = drag;
    const place = () => {
      const p = local(e, el);
      const tx = p.x - drag.gx - el.offsetLeft, ty = p.y - drag.gy - el.offsetTop;
      const tilt = Math.max(-6, Math.min(6, (e.movementX || 0) * 0.8));
      el.style.transform = `translate(${tx}px, ${ty}px) rotate(${tilt}deg) scale(1.03)`;
      Object.assign(drag, { tx, ty, tilt });
    };
    place();
    const over = items().find(s => {
      if (s === el) return false;
      const b = s.getBoundingClientRect();
      return e.clientX > b.left && e.clientX < b.right && e.clientY > b.top && e.clientY < b.bottom;
    });
    if (over) {
      const idx = items().indexOf(over), mine = items().indexOf(el);
      flip(() => list.insertBefore(el, idx > mine ? over.nextSibling : over));
      place(); // keep the cel under the hand after the DOM move
    }
  });
  const end = () => {
    if (!drag) return;
    const { el, tx = 0, ty = 0, tilt = 0 } = drag; drag = null;
    el.classList.remove('is-dragging');
    if (M() && !reduced()) {
      el.style.transform = '';
      M().animate(el, { x: [tx, 0], y: [ty, 0], rotate: [tilt, 0], scale: [1.03, 1] }, { type: 'spring', stiffness: 500, damping: 26 })
        .then(() => { el.style.transform = ''; el.style.zIndex = ''; });
    } else { el.style.transform = ''; el.style.zIndex = ''; }
    save();
  };
  list.addEventListener('pointerup', end);
  list.addEventListener('pointercancel', end);
  list.addEventListener('keydown', e => {
    const el = e.target.closest('[data-id]');
    if (!el || !e.altKey) return;
    const i = items().indexOf(el);
    if (['ArrowLeft', 'ArrowUp'].includes(e.key) && i > 0) { e.preventDefault(); flip(() => list.insertBefore(el, items()[i - 1])); el.focus(); save(); }
    if (['ArrowRight', 'ArrowDown'].includes(e.key) && i < items().length - 1) { e.preventDefault(); flip(() => list.insertBefore(items()[i + 1], el)); el.focus(); save(); }
  });
  return { reset() { try { key && localStorage.removeItem(key); } catch {} } };
}
