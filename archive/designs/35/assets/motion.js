// Kiln Light — motion.js. Vanilla stand-ins for the Radix primitives that set
// the SAME data-state attributes and CSS variables Radix does, so motion.css
// works unchanged if the builder swaps these for real @radix-ui components.
//
//   import { initMotion } from './motion.js'; initMotion(document);
//
// Markup contracts (see preview.html for live examples):
//   Focus pull:  <h1 data-focus-pull data-letters>  or any [data-focus-pull] (optionally style="--i:2")
//   Kiln glow:   <div class="kiln-glow">
//   Accordion:   [data-strata] > [data-strata-item] > button[data-strata-trigger] + div[data-strata-content]
//   Dialog:      button[data-niche-open="id"]  ...  <div id="id" data-niche hidden> [data-niche-overlay] [data-niche-content] [data-niche-close]
//   Tooltip:     [data-tip="text"]
//   Tabs:        [data-pebble] > [data-pebble-list] > button[role=tab][aria-controls]  + [data-pebble-panel][id]
//   Hover card:  [data-lift-trigger="id"]  +  <div id="id" data-lift hidden>
import { sound } from './sound.js';

const afterAnim = (el, fn) => {
  const names = getComputedStyle(el).animationName;
  if (!names || names === 'none') return fn();
  el.addEventListener('animationend', fn, { once: true });
};

export function focusPull(root = document) {
  root.querySelectorAll('[data-focus-pull][data-letters]').forEach(el => {
    if (el.dataset.split) return; el.dataset.split = 1; el.classList.add('focus-letters');
    const text = el.textContent; el.setAttribute('aria-label', text); el.textContent = '';
    [...text].forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true');
      s.setAttribute('data-focus-pull', ''); s.style.setProperty('--i', i * 0.35); el.append(s); });
    el.removeAttribute('data-focus-pull'); el.style.opacity = 1;
  });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.2 });
  root.querySelectorAll('[data-focus-pull]').forEach(el => io.observe(el));
}

export function kilnGlow(root = document) {
  root.addEventListener('pointermove', e => {
    const el = e.target.closest?.('.kiln-glow'); if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px');
  });
}

export function strata(root = document) {
  root.querySelectorAll('[data-strata-item]').forEach(item => {
    const btn = item.querySelector('[data-strata-trigger]'), c = item.querySelector('[data-strata-content]');
    const set = open => {
      item.dataset.state = btn.dataset.state = c.dataset.state = open ? 'open' : 'closed';
      btn.setAttribute('aria-expanded', open);
      if (open) { c.hidden = false; c.style.setProperty('--radix-accordion-content-height', c.scrollHeight + 'px'); }
      else { c.style.setProperty('--radix-accordion-content-height', c.scrollHeight + 'px'); afterAnim(c, () => { if (c.dataset.state === 'closed') c.hidden = true; }); }
    };
    set(item.hasAttribute('data-open'));
    btn.addEventListener('click', () => { const open = c.dataset.state !== 'open'; set(open); sound.play(open ? 'ting' : 'thum'); });
  });
}

export function niche(root = document) {
  root.querySelectorAll('[data-niche-open]').forEach(btn => {
    const d = document.getElementById(btn.dataset.nicheOpen); if (!d) return;
    const parts = [d.querySelector('[data-niche-overlay]'), d.querySelector('[data-niche-content]')];
    const close = () => { parts.forEach(p => p.dataset.state = 'closed'); sound.play('thum'); afterAnim(parts[1], () => { d.hidden = true; btn.focus(); }); };
    btn.addEventListener('click', () => {
      d.hidden = false; parts.forEach(p => p.dataset.state = 'open'); sound.play('ting');
      d.querySelector('[data-niche-close]')?.focus();
    });
    d.querySelectorAll('[data-niche-close]').forEach(x => x.addEventListener('click', close));
    parts[0].addEventListener('click', close);
    d.addEventListener('keydown', e => e.key === 'Escape' && close());
  });
}

export function drip(root = document) {
  let tip = document.querySelector('.k-tip');
  if (!tip) { tip = document.createElement('div'); tip.className = 'k-tip'; tip.setAttribute('role', 'tooltip'); tip.setAttribute('data-drip', ''); tip.hidden = true; document.body.append(tip); }
  let timer, owner;
  const show = el => {
    owner = el; tip.textContent = el.dataset.tip; tip.hidden = false;
    const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(innerWidth - t.width - 8, r.left + r.width / 2 - t.width / 2)) + 'px';
    tip.style.top = r.top - t.height - 10 + scrollY + 'px';
    tip.style.setProperty('--radix-tooltip-content-transform-origin', `${r.left + r.width / 2 - parseFloat(tip.style.left)}px 100%`);
    tip.dataset.state = 'delayed-open';
  };
  const hide = () => { clearTimeout(timer); if (!owner) return; owner = null; tip.dataset.state = 'closed'; afterAnim(tip, () => { if (!owner) tip.hidden = true; }); };
  root.querySelectorAll('[data-tip]').forEach(el => {
    el.addEventListener('pointerenter', () => { clearTimeout(timer); timer = setTimeout(() => show(el), 280); });
    el.addEventListener('pointerleave', hide); el.addEventListener('focus', () => show(el)); el.addEventListener('blur', hide);
  });
}

export function pebble(root = document) {
  root.querySelectorAll('[data-pebble]').forEach(tabs => {
    const list = tabs.querySelector('[data-pebble-list]'), ind = document.createElement('span');
    ind.setAttribute('data-pebble-indicator', ''); list.prepend(ind);
    const btns = [...list.querySelectorAll('[role="tab"]')];
    const select = (b, silent) => {
      btns.forEach(x => { const on = x === b; x.dataset.state = on ? 'active' : 'inactive'; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        const p = document.getElementById(x.getAttribute('aria-controls')); if (p) { p.dataset.state = on ? 'active' : 'inactive'; p.hidden = !on; } });
      ind.style.setProperty('--x', b.offsetLeft + 'px'); ind.style.setProperty('--w', b.offsetWidth + 'px');
      if (!silent) sound.play('glide');
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(b));
      b.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { const n = btns[(i + d + btns.length) % btns.length]; n.focus(); select(n); } });
    });
    select(btns.find(b => b.hasAttribute('data-default')) || btns[0], true);
    addEventListener('resize', () => select(btns.find(b => b.dataset.state === 'active'), true));
  });
}

export function lift(root = document) {
  root.querySelectorAll('[data-lift-trigger]').forEach(tr => {
    const card = document.getElementById(tr.dataset.liftTrigger); if (!card) return;
    let t;
    const open = () => { clearTimeout(t); t = setTimeout(() => {
      card.hidden = false; const r = tr.getBoundingClientRect();
      card.style.left = Math.min(innerWidth - card.offsetWidth - 12, Math.max(12, r.left)) + 'px'; card.style.top = r.bottom + 10 + scrollY + 'px';
      card.dataset.state = 'open'; sound.play('tok');
    }, 260); };
    const close = () => { clearTimeout(t); t = setTimeout(() => { card.dataset.state = 'closed'; afterAnim(card, () => { if (card.dataset.state === 'closed') card.hidden = true; }); }, 160); };
    [tr, card].forEach(el => { el.addEventListener('pointerenter', open); el.addEventListener('pointerleave', close); });
    tr.addEventListener('focus', open); tr.addEventListener('blur', close);
  });
}

export function initMotion(root = document) {
  focusPull(root); kilnGlow(root); strata(root); niche(root); drip(root); pebble(root); lift(root);
  sound.bind(root);
}
