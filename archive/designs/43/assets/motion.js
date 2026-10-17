// motion.js — behaviour for the motions in motion.css, plus the keyboard layer.
// import { pressRun, facetSheen, editionTurn, dawnBreak, sparkTrail, shortcuts } from './motion.js'
// No dependencies. Everything degrades: no View Transitions -> instant swap; reduced motion -> no movement.

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 1. press-run: split an element's words into staggered spans. */
export function pressRun(el, { start = 0 } = {}) {
  if (el.dataset.pressed) return;
  el.dataset.pressed = '1';
  let i = start;
  const walk = node => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = part; frag.append(s);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    }
  };
  walk(el);
  el.classList.add('press-run');
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  return i;
}

/** 2. facet-sheen: feed pointer position to the CSS tilt + sheen. */
export function facetSheen(root = document) {
  root.querySelectorAll('.facet-sheen').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width).toFixed(3));
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height).toFixed(3));
    });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--mx'); el.style.removeProperty('--my'); });
  });
}

/** 3. edition-turn: run a DOM update inside a view transition, with a direction. */
export async function editionTurn(update, direction = 'next') {
  const html = document.documentElement;
  if (!document.startViewTransition || reduce()) { await update(); return; }
  html.dataset.turn = direction;
  const t = document.startViewTransition(update);
  try { await t.finished; } finally { delete html.dataset.turn; }
}

/** 4. dawn-break fallback for browsers without scroll-driven animations. */
export function dawnBreak(root = document) {
  if (CSS.supports('animation-timeline: view()')) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-lit'); io.unobserve(e.target); } }), { threshold: 0.15 });
  root.querySelectorAll('.dawn-break').forEach(el => io.observe(el));
}

/** spark trail: a few gold four-point sparks behind the pointer (fine pointers only). */
export function sparkTrail({ every = 46 } = {}) {
  if (reduce() || !matchMedia('(pointer: fine)').matches) return () => {};
  let last = 0;
  const on = e => {
    const now = performance.now();
    if (now - last < every) return; last = now;
    const d = document.createElement('i');
    d.className = 'spark-dot';
    d.style.setProperty('--x', e.clientX - 5 + 'px'); d.style.setProperty('--y', e.clientY - 5 + 'px');
    document.body.append(d);
    d.addEventListener('animationend', () => d.remove());
  };
  addEventListener('pointermove', on, { passive: true });
  return () => removeEventListener('pointermove', on);
}

/**
 * Keyboard layer + cheat sheet (the signature delight).
 * shortcuts({ sheet: dialogEl, trigger: buttonEl, keys: [{ key: 'j', label: 'Next story', run() {} }, …] })
 * "?" opens the sheet (sheet-unfold: the keycap morphs into it), Esc closes.
 * Keys are ignored while typing in inputs. Two-key sequences like "g h" are supported.
 */
export function shortcuts({ sheet, trigger, keys }) {
  let buffer = '', timer = 0;
  const open = () => morph(trigger, sheet, () => sheet.showModal());
  const close = () => morph(sheet, trigger, () => sheet.close());
  function morph(from, to, swap) {
    if (!document.startViewTransition || reduce() || !from || !to) { swap(); return; }
    from.style.viewTransitionName = 'shortcuts';
    const t = document.startViewTransition(() => { from.style.viewTransitionName = ''; swap(); to.style.viewTransitionName = 'shortcuts'; });
    t.finished.finally(() => { to.style.viewTransitionName = ''; });
  }
  trigger?.addEventListener('click', () => (sheet.open ? close() : open()));
  sheet.addEventListener('cancel', e => { e.preventDefault(); close(); });
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  addEventListener('keydown', e => {
    const t = e.target;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (e.key === '?') { e.preventDefault(); sheet.open ? close() : open(); return; }
    if (e.key === 'Escape' && sheet.open) { close(); return; }
    clearTimeout(timer);
    buffer = (buffer + ' ' + e.key.toLowerCase()).trim().split(' ').slice(-2).join(' ');
    timer = setTimeout(() => (buffer = ''), 900);
    const hit = keys.find(k => k.key === buffer) || keys.find(k => k.key === e.key.toLowerCase());
    if (hit) {
      e.preventDefault(); buffer = '';
      if (sheet.open) sheet.close();
      hit.run(e);
      flashKey(hit.key);
    }
  });
  function flashKey(k) {
    const el = sheet.querySelector(`[data-key="${CSS.escape(k)}"]`);
    if (!el) return;
    el.animate([{ background: 'var(--spark, #f8e18a)' }, { background: 'transparent' }], { duration: 600, easing: 'ease-out' });
  }
  return { open, close };
}
