// Albretsen AS / design 47 "Stille" — motion study (pairs with motion.css). No dependencies.
//
//   import { flatbed, stamp, reshelve, vitrine } from './assets/motion.js'
//   flatbed('.flatbed')                       // FLATBED: scan-in images as they enter the viewport
//   stamp('.stamp')                           // STAMP: aniline square presses in
//   reshelve(document.querySelector('.reshelve'), { onReorder: ids => {} })   // RESHELVE: drag to rearrange
//   vitrine(thumbEl, () => openDetail())      // VITRINE: shared-element morph into a detail plate
//
// Everything degrades: no View Transitions API → instant reorder / swap; reduced motion → no animation.

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const vt = (fn) => (document.startViewTransition && !reduced() ? document.startViewTransition(fn) : (fn(), null));

function onEnter(sel, cls = 'is-in', opts = { threshold: 0.25 }) {
  const els = typeof sel === 'string' ? document.querySelectorAll(sel) : sel;
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add(cls); io.unobserve(e.target); }
  }), opts);
  els.forEach((el) => io.observe(el));
  return io;
}
export const flatbed = (sel = '.flatbed') => onEnter(sel);
export const stamp = (sel = '.stamp') => onEnter(sel, 'is-in', { threshold: 1 });

/** RESHELVE — drag (mouse, pen, touch) or Alt+Arrow to rearrange the children of `list`.
 *  Children need a stable data-id. Others glide via the View Transitions API; the dropped one kicks and settles. */
export function reshelve(list, { onReorder } = {}) {
  const kids = () => [...list.children];
  const vtName = (el) => 'shelf-' + el.dataset.id.replace(/[^a-z0-9-]/gi, '');
  kids().forEach((el, i) => {
    el.dataset.id ||= 'item-' + i;
    el.style.viewTransitionName = vtName(el);
    el.style.viewTransitionClass = 'shelf-item';
    el.tabIndex = 0; el.setAttribute('role', 'listitem');
    el.addEventListener('dragstart', (e) => e.preventDefault());
  });
  list.setAttribute('role', 'list');
  list.setAttribute('aria-roledescription', 'rearrangeable shelf');
  const emit = () => onReorder && onReorder(kids().map((k) => k.dataset.id));

  let drag = null, startX = 0, startY = 0, running = null;
  const move = (el, before) => {
    if (running) running.skipTransition?.();
    const t = vt(() => list.insertBefore(el, before));
    running = t; t?.finished.finally(() => { if (running === t) running = null; });
  };

  list.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.reshelve > *'); if (!el || e.button > 0) return;
    drag = el; startX = e.clientX; startY = e.clientY;
    el.setPointerCapture(e.pointerId);
  });
  list.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (!drag.classList.contains('is-dragging')) { if (Math.hypot(dx, dy) < 6) return; drag.classList.add('is-dragging'); drag.style.viewTransitionName = 'none'; }
    drag.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.max(-6, Math.min(6, dx / 40))}deg)`;
    // neighbour swap when the pointer crosses a sibling's midpoint
    const r = drag.getBoundingClientRect(), cx = r.left + r.width / 2;
    const sibs = kids().filter((k) => k !== drag);
    const target = sibs.find((k) => { const b = k.getBoundingClientRect(); return cx > b.left && cx < b.right; });
    if (!target) return;
    const tb = target.getBoundingClientRect(), after = cx > tb.left + tb.width / 2;
    const ref = after ? target.nextElementSibling : target;
    if (ref === drag || ref === drag.nextElementSibling) return;
    const before = drag.getBoundingClientRect().left;
    move(drag, ref);
    const shift = drag.getBoundingClientRect().left - before; // keep it under the pointer after the DOM move
    startX += shift;
    drag.style.transform = `translate(${e.clientX - startX}px, ${dy}px)`;
  });
  const end = () => {
    if (!drag) return;
    const el = drag; drag = null;
    if (!el.classList.contains('is-dragging')) return;
    el.style.viewTransitionName = vtName(el);
    el.style.viewTransitionClass = 'shelf-dropped';
    vt(() => { el.classList.remove('is-dragging'); el.style.transform = ''; })?.finished.finally(() => (el.style.viewTransitionClass = 'shelf-item'));
    if (!document.startViewTransition || reduced()) el.style.viewTransitionClass = 'shelf-item';
    emit();
  };
  list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);
  list.addEventListener('keydown', (e) => {
    const el = e.target.closest('.reshelve > *'); if (!el || !e.altKey) return;
    if (e.key === 'ArrowLeft' && el.previousElementSibling) { e.preventDefault(); move(el, el.previousElementSibling); }
    else if (e.key === 'ArrowRight' && el.nextElementSibling) { e.preventDefault(); move(el, el.nextElementSibling.nextElementSibling); }
    else return;
    el.focus(); emit();
  });
}

/** VITRINE — morph `fromEl` into whatever element `update()` renders with the same name. */
export function vitrine(fromEl, update, name = 'vitrine') {
  fromEl.style.viewTransitionName = name;
  const t = vt(async () => { fromEl.style.viewTransitionName = ''; await update(); });
  return t ? t.finished : Promise.resolve();
}
