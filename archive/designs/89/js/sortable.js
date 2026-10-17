// Sortable lists for Prism Room: "drag to rearrange anything", applied to the product cards and
// the retired shelf. Same feel as <drag-room>: lift, tilt with pointer velocity, spring back down.
// Siblings move out of the way with FLIP. Keyboard: focus the grip, Space picks up, arrows move,
// Space drops, Escape puts it back. The order persists per visitor (best effort).

const SPRING = 'transform .5s cubic-bezier(.2,1.5,.4,1)';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const load = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function sortable(list, { announce = () => {}, onPick = () => {}, onDrop = () => {} } = {}) {
  const key = 'sortable:' + list.dataset.sortable;
  const items = () => [...list.children];
  const label = el => el.querySelector('h3, .n')?.textContent.trim() || 'item';

  // restore a saved order
  const saved = load(key);
  if (Array.isArray(saved)) saved.forEach(k => { const el = items().find(i => i.dataset.key === k); if (el) list.append(el); });
  const persist = () => save(key, items().map(i => i.dataset.key));

  // FLIP: record, mutate, then play every sibling (except `skip`) from its old place
  const flip = (mutate, skip) => {
    const before = new Map(items().map(el => [el, el.getBoundingClientRect()]));
    mutate();
    if (reduce()) return;
    for (const el of items()) {
      if (el === skip) continue;
      const a = before.get(el), b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) continue;
      el.style.transition = 'none'; el.style.transform = `translate(${dx}px,${dy}px)`;
      requestAnimationFrame(() => { el.style.transition = 'transform .38s cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; });
    }
  };

  // ---- pointer ----
  list.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const el = e.target.closest('[data-sortable] > *');
    if (!el || el.parentElement !== list) return;
    const onGrip = !!e.target.closest('.grip');
    if (!onGrip && (e.pointerType !== 'mouse' || e.target.closest('a, button, code'))) return; // touch: grip only
    let started = false, vx = 0, lastX = e.clientX;
    const sx = e.clientX, sy = e.clientY, base = [el.offsetLeft, el.offsetTop];
    const move = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!started) {
        if (Math.hypot(dx, dy) < 6) return;
        started = true; el.setPointerCapture(ev.pointerId);
        el.classList.add('is-dragging'); el.style.transition = 'box-shadow .25s'; onPick(el);
      }
      vx = vx * .75 + (ev.clientX - lastX) * .25; lastX = ev.clientX;
      // find the sibling under the pointer and take its slot
      const over = items().find(o => { if (o === el) return false; const r = o.getBoundingClientRect();
        return ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top + r.height * .2 && ev.clientY < r.bottom - r.height * .2; });
      if (over) {
        const all = items(), from = all.indexOf(el), to = all.indexOf(over);
        flip(() => list.insertBefore(el, to > from ? over.nextSibling : over), el);
      }
      const ox = el.offsetLeft - base[0], oy = el.offsetTop - base[1];
      const tilt = reduce() ? 0 : Math.max(-6, Math.min(6, vx * .5));
      el.style.transform = `translate(${dx - ox}px,${dy - oy}px) rotate(${tilt}deg) scale(1.02)`;
    };
    const up = () => {
      list.removeEventListener('pointermove', move); list.removeEventListener('pointerup', up); list.removeEventListener('pointercancel', up);
      if (!started) return;
      el.style.transition = SPRING + ', box-shadow .4s'; el.style.transform = '';
      el.classList.remove('is-dragging'); persist(); onDrop(el);
      announce(`${label(el)} moved to position ${items().indexOf(el) + 1} of ${items().length}.`);
      const swallow = c => { c.stopPropagation(); c.preventDefault(); };
      el.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => el.removeEventListener('click', swallow, { capture: true }), 0);
    };
    list.addEventListener('pointermove', move); list.addEventListener('pointerup', up); list.addEventListener('pointercancel', up);
  });

  // ---- keyboard ----
  let lifted = null, origin = -1;
  list.addEventListener('keydown', e => {
    const grip = e.target.closest('.grip'); if (!grip) return;
    const el = grip.closest('[data-sortable] > *');
    const all = items(), i = all.indexOf(el);
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (lifted === el) { el.classList.remove('is-lifted'); grip.setAttribute('aria-pressed', 'false'); lifted = null; persist(); onDrop(el);
        announce(`${label(el)} dropped at position ${i + 1} of ${all.length}.`); }
      else { lifted?.classList.remove('is-lifted'); lifted = el; origin = i; el.classList.add('is-lifted'); grip.setAttribute('aria-pressed', 'true'); onPick(el);
        announce(`${label(el)} picked up, position ${i + 1} of ${all.length}. Use the arrow keys to move, space to drop.`); }
    } else if (lifted === el && /^Arrow/.test(e.key)) {
      e.preventDefault();
      const d = (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 1, j = i + d;
      if (j < 0 || j >= all.length) return;
      flip(() => list.insertBefore(el, d > 0 ? all[j].nextSibling : all[j]));
      grip.focus({ preventScroll: true });
      announce(`${label(el)}, position ${j + 1} of ${all.length}.`);
    } else if (lifted === el && e.key === 'Escape') {
      flip(() => list.insertBefore(el, items().filter(x => x !== el)[origin] || null));
      el.classList.remove('is-lifted'); grip.setAttribute('aria-pressed', 'false'); lifted = null; grip.focus();
      announce(`${label(el)} put back.`);
    }
  });
  list.addEventListener('focusout', e => { if (lifted && !list.contains(e.relatedTarget)) { lifted.classList.remove('is-lifted'); lifted.querySelector('.grip')?.setAttribute('aria-pressed', 'false'); lifted = null; persist(); } });
}
