// motion.js — companion to motion.css. No dependencies.
// - tilt(el): pointer + device-orientation parallax, writes --tx/--ty (-1..1) on el.
// - pointerVars(el): writes --px/--py for LIFT hover direction.
// - drop(root): DROP entrance via IntersectionObserver.
// - scissorTo(update): SCISSOR WIPE page transition via View Transitions.
// - Minimal Radix-shaped primitives for demos (dialog, tabs, accordion, tooltip,
//   hover card). With real Radix you only need the CSS; these mirror its
//   data-state / data-side attributes and wait for exit animations before hiding.

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function tilt(el, { ease = 0.08, gyro = true } = {}) {
  const t = { x: 0, y: 0 }, c = { x: 0, y: 0 }; let raf = 0;
  const loop = () => { c.x += (t.x - c.x) * ease; c.y += (t.y - c.y) * ease;
    el.style.setProperty('--tx', c.x.toFixed(4)); el.style.setProperty('--ty', c.y.toFixed(4));
    raf = Math.abs(t.x - c.x) + Math.abs(t.y - c.y) > 0.0005 ? requestAnimationFrame(loop) : 0; };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const move = (e) => { const b = el.getBoundingClientRect(); t.x = ((e.clientX - b.left) / b.width) * 2 - 1; t.y = ((e.clientY - b.top) / b.height) * 2 - 1; kick(); };
  const leave = () => { t.x = t.y = 0; kick(); };
  const orient = (e) => { if (e.gamma == null) return; t.x = Math.max(-1, Math.min(1, e.gamma / 25)); t.y = Math.max(-1, Math.min(1, (e.beta - 45) / 25)); kick(); };
  if (reduce()) return () => {};
  el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
  if (gyro) addEventListener('deviceorientation', orient);
  return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); removeEventListener('deviceorientation', orient); cancelAnimationFrame(raf); };
}
// iOS needs a user gesture before deviceorientation fires.
export async function askGyro() { try { if (typeof DeviceOrientationEvent?.requestPermission === 'function') return (await DeviceOrientationEvent.requestPermission()) === 'granted'; } catch {} return true; }

export function pointerVars(el) {
  el.addEventListener('pointermove', (e) => { const b = el.getBoundingClientRect(); el.style.setProperty('--px', (((e.clientX - b.left) / b.width) * 2 - 1).toFixed(3)); el.style.setProperty('--py', (((e.clientY - b.top) / b.height) * 2 - 1).toFixed(3)); });
  el.addEventListener('pointerleave', () => { el.style.setProperty('--px', 0); el.style.setProperty('--py', 0); });
}

export function drop(root = document) {
  const els = [...root.querySelectorAll('[data-drop]')];
  els.forEach((e, i) => { if (!e.style.getPropertyValue('--i')) e.style.setProperty('--i', i % 12); });
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { threshold: 0.15 });
  els.forEach((e) => io.observe(e));
}

export function scissorTo(update) {
  if (!document.startViewTransition || reduce()) return update();
  return document.startViewTransition(update);
}

// Wait for the element's exit animation, then hide (what Radix Presence does).
function presence(el, open) {
  el.dataset.state = open ? (el.classList.contains('peel') ? 'delayed-open' : 'open') : 'closed';
  if (open) { el.hidden = false; return; }
  const names = getComputedStyle(el).animationName;
  if (!names || names === 'none' || reduce()) { el.hidden = true; return; }
  el.addEventListener('animationend', () => { if (el.dataset.state === 'closed') el.hidden = true; }, { once: true });
}

export function dialog(trigger, overlay, content) {
  const set = (o) => { presence(overlay, o); presence(content, o); trigger.setAttribute('aria-expanded', o); if (o) content.querySelector('button,[href],input')?.focus(); else trigger.focus(); };
  trigger.addEventListener('click', () => set(true));
  overlay.addEventListener('click', () => set(false));
  content.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => set(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && content.dataset.state === 'open') set(false); });
}

export function tabs(root) {
  const list = root.querySelector('[role=tablist]'), triggers = [...list.querySelectorAll('[role=tab]')], ink = list.querySelector('.shuffle-ink');
  const select = (t) => {
    triggers.forEach((x) => { const on = x === t; x.dataset.state = on ? 'active' : 'inactive'; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
      const p = root.querySelector('#' + x.getAttribute('aria-controls')); p.hidden = !on; p.dataset.state = on ? 'active' : 'inactive'; });
    if (ink) { list.style.setProperty('--ink-x', t.offsetLeft + 'px'); list.style.setProperty('--ink-w', t.offsetWidth + 'px'); }
  };
  triggers.forEach((t, i) => { t.addEventListener('click', () => select(t)); t.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { const n = triggers[(i + d + triggers.length) % triggers.length]; n.focus(); select(n); } }); });
  select(triggers.find((t) => t.dataset.state === 'active') ?? triggers[0]);
}

export function accordion(root) {
  root.querySelectorAll('[data-acc-item]').forEach((item) => {
    const btn = item.querySelector('button'), panel = item.querySelector('.tear');
    btn.addEventListener('click', () => {
      const open = item.dataset.state !== 'open';
      panel.hidden = false; panel.style.setProperty('--radix-accordion-content-height', panel.scrollHeight + 'px');
      item.dataset.state = open ? 'open' : 'closed'; btn.dataset.state = item.dataset.state; btn.setAttribute('aria-expanded', open); presence(panel, open);
    });
  });
}

export function tooltip(trigger, tip, { delay = 350 } = {}) {
  let to; tip.dataset.side = tip.dataset.side || 'top';
  const show = () => { clearTimeout(to); to = setTimeout(() => presence(tip, true), delay); };
  const hide = () => { clearTimeout(to); if (!tip.hidden) presence(tip, false); };
  trigger.addEventListener('pointerenter', show); trigger.addEventListener('pointerleave', hide);
  trigger.addEventListener('focus', show); trigger.addEventListener('blur', hide);
}

export function hoverCard(trigger, card, { open = 300, close = 200 } = {}) {
  let to; card.dataset.side = card.dataset.side || 'bottom';
  const on = () => { clearTimeout(to); to = setTimeout(() => presence(card, true), open); };
  const off = () => { clearTimeout(to); to = setTimeout(() => { if (!card.hidden) presence(card, false); }, close); };
  [trigger, card].forEach((x) => { x.addEventListener('pointerenter', on); x.addEventListener('pointerleave', off); });
  trigger.addEventListener('focus', on); trigger.addEventListener('blur', off);
}
