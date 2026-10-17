// motion.js — vanilla controllers for the motion.css study (design 34).
// They emit the same attributes as Radix Primitives (data-state, data-side,
// --radix-accordion-content-height), so the CSS is portable to real Radix.
//
//   import { initMotion } from './motion.js'; initMotion(document);
//
// Markup contracts (all optional, use what you need):
//   Accordion  [data-ts-accordion] > [data-ts-item] > button.ts-acc-trigger + .ts-acc-content
//   Tabs       [data-ts-tabs] > .ts-tabs-list > [role=tab][aria-controls] ... + [role=tabpanel]
//   Tooltip    [data-ts-tooltip="text"]           (creates a .ts-pop bubble)
//   HoverCard  [data-ts-hovercard="#templateId"]  (glass card from a <template>)
//   Dialog     [data-ts-dialog-open="#dialogId"]  on a trigger; <div id=dialogId class=ts-dialog hidden>
//   Entrance   .ts-crystallize (style="--i:n" to stagger)

const ICE = new URL('./texture/ice-normal.webp', import.meta.url).href;

export function injectFilters() {
  if (document.getElementById('ts-filters')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'ts-filters';
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  // ts-refract: the CC0 ambientCG Ice002 normal map drives a displacement —
  // real refraction of whatever sits behind the overlay / hover card.
  svg.innerHTML = `<defs>
    <filter id="ts-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feImage href="${ICE}" x="0" y="0" width="512" height="512" preserveAspectRatio="none" result="map"/>
      <feTile in="map" result="tiled"/>
      <feDisplacementMap in="SourceGraphic" in2="tiled" scale="38" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="ts-refract-strong" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
      <feImage href="${ICE}" x="0" y="0" width="256" height="256" preserveAspectRatio="none" result="map"/>
      <feTile in="map" result="tiled"/>
      <feDisplacementMap in="SourceGraphic" in2="tiled" scale="70" xChannelSelector="R" yChannelSelector="G"/>
    </filter></defs>`;
  document.body.prepend(svg);
}

function accordion(root) {
  root.querySelectorAll('[data-ts-item]').forEach((item) => {
    const trig = item.querySelector('.ts-acc-trigger'), content = item.querySelector('.ts-acc-content');
    const set = (open) => {
      content.hidden = false;
      content.style.setProperty('--radix-accordion-content-height', `${content.scrollHeight}px`);
      trig.dataset.state = content.dataset.state = item.dataset.state = open ? 'open' : 'closed';
      trig.setAttribute('aria-expanded', open);
      if (!open) content.addEventListener('animationend', () => { if (content.dataset.state === 'closed') content.hidden = true; }, { once: true });
    };
    set(item.hasAttribute('data-open'));
    if (!item.hasAttribute('data-open')) content.hidden = true;
    trig.addEventListener('click', () => {
      const open = trig.dataset.state !== 'open';
      if (open && root.dataset.tsAccordion === 'single') root.querySelectorAll('[data-ts-item]').forEach((o) => { if (o !== item && o.dataset.state === 'open') o.querySelector('.ts-acc-trigger').click(); });
      set(open);
    });
  });
}

function tabs(root) {
  const list = root.querySelector('.ts-tabs-list');
  const tabsEls = [...list.querySelectorAll('[role="tab"]')];
  let beam = list.querySelector('.ts-tabs-beam');
  if (!beam) { beam = document.createElement('span'); beam.className = 'ts-tabs-beam'; list.append(beam); }
  let prev = 0;
  const select = (i, focus) => {
    tabsEls.forEach((t, j) => {
      const on = i === j;
      t.dataset.state = on ? 'active' : 'inactive'; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      const p = root.querySelector('#' + t.getAttribute('aria-controls'));
      if (p) { p.dataset.state = on ? 'active' : 'inactive'; p.hidden = !on; }
    });
    const t = tabsEls[i];
    beam.style.setProperty('--x', `${t.offsetLeft}px`); beam.style.setProperty('--w', `${t.offsetWidth}px`);
    beam.style.setProperty('--origin', i > prev ? 'left' : 'right');
    beam.classList.remove('is-moving'); void beam.offsetWidth; if (i !== prev) beam.classList.add('is-moving');
    prev = i; if (focus) t.focus();
  };
  tabsEls.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') select((i + 1) % tabsEls.length, true);
      if (e.key === 'ArrowLeft') select((i - 1 + tabsEls.length) % tabsEls.length, true);
    });
  });
  select(Math.max(0, tabsEls.findIndex((t) => t.hasAttribute('data-default'))));
  new ResizeObserver(() => select(prev)).observe(list);
}

function floating(trigger, build, { delay = 300, closeDelay = 120 } = {}) {
  let el = null, tOpen, tClose;
  const place = () => {
    const r = trigger.getBoundingClientRect(), b = el.getBoundingClientRect();
    const below = r.top < b.height + 20;
    el.dataset.side = below ? 'bottom' : 'top';
    el.style.left = `${Math.max(12, Math.min(innerWidth - b.width - 12, r.left + r.width / 2 - b.width / 2))}px`;
    el.style.top = `${below ? r.bottom + 10 : r.top - b.height - 10}px`;
  };
  const open = (instant) => {
    clearTimeout(tClose);
    tOpen = setTimeout(() => {
      if (!el) { el = build(); el.style.position = 'fixed'; el.style.zIndex = 60; document.body.append(el); el.addEventListener('pointerenter', () => clearTimeout(tClose)); el.addEventListener('pointerleave', close); }
      el.hidden = false; place(); el.dataset.state = instant ? 'instant-open' : 'delayed-open';
    }, instant ? 0 : delay);
  };
  const close = () => {
    clearTimeout(tOpen);
    tClose = setTimeout(() => { if (!el) return; el.dataset.state = 'closed'; el.addEventListener('animationend', () => { if (el.dataset.state === 'closed') el.hidden = true; }, { once: true }); }, closeDelay);
  };
  trigger.addEventListener('pointerenter', () => open(false));
  trigger.addEventListener('pointerleave', close);
  trigger.addEventListener('focus', () => open(true));
  trigger.addEventListener('blur', close);
}

function dialog(trigger) {
  const d = document.querySelector(trigger.dataset.tsDialogOpen);
  if (!d) return;
  let overlay;
  const close = () => {
    d.dataset.state = overlay.dataset.state = 'closed';
    d.addEventListener('animationend', () => { d.hidden = true; overlay.remove(); trigger.focus(); }, { once: true });
    removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  trigger.addEventListener('click', () => {
    overlay = document.createElement('div'); overlay.className = 'ts-overlay'; overlay.dataset.state = 'open';
    overlay.addEventListener('click', close);
    d.before(overlay); d.hidden = false; d.dataset.state = 'open';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    (d.querySelector('[autofocus],button,a') || d).focus();
    addEventListener('keydown', onKey);
    d.querySelectorAll('[data-ts-dialog-close]').forEach((b) => (b.onclick = close));
  });
}

export function crystallize(root = document) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.15 });
  root.querySelectorAll('.ts-crystallize').forEach((el) => io.observe(el));
}

export function initMotion(root = document) {
  injectFilters();
  root.querySelectorAll('[data-ts-accordion]').forEach(accordion);
  root.querySelectorAll('[data-ts-tabs]').forEach(tabs);
  root.querySelectorAll('[data-ts-tooltip]').forEach((t) => floating(t, () => {
    const el = document.createElement('div'); el.className = 'ts-pop ts-tooltip'; el.role = 'tooltip'; el.textContent = t.dataset.tsTooltip; return el;
  }, { delay: 250 }));
  root.querySelectorAll('[data-ts-hovercard]').forEach((t) => floating(t, () => {
    const el = document.createElement('div'); el.className = 'ts-pop ts-hovercard ts-glass';
    el.append(document.querySelector(t.dataset.tsHovercard).content.cloneNode(true)); return el;
  }, { delay: 420, closeDelay: 260 }));
  root.querySelectorAll('[data-ts-dialog-open]').forEach(dialog);
  crystallize(root);
}
