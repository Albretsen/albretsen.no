// Plate Nocturne · design 55 · page runtime.
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import { initMotion, seamTo, scrollTo } from './assets/motion/motion.js';
import { sound, bindSoundToggle } from './assets/interactive/sound.js';

const A = (p) => `assets/${p}`;
const P = (p) => `../_shared/products/${p}`;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------- plates (Met Open Access, CC0)
const PLATES = {
  spark:  { file: 'emulsion-spark-1886.webp',  aspect: 1100 / 1658, photoH: 1.3,  subjectX: .56, cat: 'Plate 287289', who: 'Moussette',     when: '12.05.1886' },
  corona: { file: 'emulsion-corona-1883.webp', aspect: 1100 / 1086, photoH: .74,  subjectX: .5,  cat: 'Plate 786870', who: 'H. A. Lawrence', when: '06.05.1883', product: 'mcp-emails' },
  moon:   { file: 'emulsion-moon-1857.webp',   aspect: 1100 / 1361, photoH: .84,  subjectX: .5,  cat: 'Plate 262301', who: 'J. A. Whipple',  when: '1857–60',    product: 'fun-libs' },
  cygnus: { file: 'emulsion-cygnus-1885.webp', aspect: 1100 / 1378, photoH: 1.35, subjectX: .5,  cat: 'Plate 283255', who: 'Paul Henry',     when: '13.08.1885', product: 'toolrails' },
  lyra:   { file: 'emulsion-lyra-1885.webp',   aspect: 1100 / 1622, photoH: 1.0,  subjectX: .5,  cat: 'Plate 266895', who: 'Paul Henry',     when: 'ca. 1885',   product: 'harbor' },
};
const PRODUCT_PLATE = { 'mcp-emails': 'corona', 'fun-libs': 'moon', toolrails: 'cygnus', harbor: 'lyra' };
const byId = Object.fromEntries(content.products.map((p) => [p.id, p]));

// ---------------------------------------------------------------- hero: the light table
const table = $('#table');
let hero = null, current = 'spark', mountLoosePanes = null;

function paneConfig() {
  const narrow = table.clientWidth < 700;
  return narrow
    ? { focus: [0.56, 0.72], panes: [
        { x: .07, y: .52, w: .58, h: .19, dx: .055, dy: 0, s: 1.05, label: 'Pane i · crown' },
        { x: .36, y: .68, w: .56, h: .15, dx: -.04, dy: .01, s: 1.03, label: 'Pane ii · flint' } ] }
    : { focus: [0.66, 0.5], panes: [
        { x: .535, y: .22, w: .2, h: .38, dx: .026, dy: 0, s: 1.05, label: 'Pane i · crown' },
        { x: .62, y: .52, w: .2, h: .28, dx: -.02, dy: .006, s: 1.03, label: 'Pane ii · flint' } ] };
}
async function mountHero(name) {
  if (!mountLoosePanes) ({ mountLoosePanes } = await import('./assets/interactive/loose-panes.js'));
  const p = PLATES[name], cfg = paneConfig();
  // decode the photograph and the ember field first, so the poster is only covered by finished pixels
  await Promise.all([A(`museum/${p.file}`), A('extras/ember-field@2x.webp')].map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); }));
  if (name !== current) return;
  hero = mountLoosePanes(table, {
    photo: A(`museum/${p.file}`), aspect: p.aspect, photoH: p.photoH * (table.clientWidth < 700 ? .85 : 1),
    subjectX: p.subjectX, focus: cfg.focus, panes: cfg.panes, sound,
  });
}
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
const startPlate = new URLSearchParams(location.search).get('plate');
addEventListener('load', () => idle(() => {
  const b = startPlate && PLATES[startPlate] && document.querySelector(`[data-plate="${startPlate}"]`);
  if (b && startPlate !== current) choose(b, false, true); else mountHero(current);
}), { once: true });

// plate switcher: radio group with roving focus and a sliding glass indicator
const group = $('#plates'), ind = $('.plates-ind', group), radios = $$('[role=radio]', group);
function placeIndicator() {
  const on = radios.find((r) => r.getAttribute('aria-checked') === 'true');
  group.style.setProperty('--x', on.offsetLeft + 'px');
  group.style.setProperty('--w', on.offsetWidth + 'px');
}
function choose(btn, focus, instant) {
  const name = btn.dataset.plate; if (name === current) return;
  radios.forEach((r) => { const on = r === btn; r.setAttribute('aria-checked', on); r.tabIndex = on ? 0 : -1; });
  if (focus) btn.focus();
  requestAnimationFrame(placeIndicator);
  current = name; if (!instant) sound.slide();
  const p = PLATES[name];
  const swap = async () => {
    $('[data-cat]').textContent = p.cat; $('[data-who]').textContent = p.who; $('[data-when]').textContent = p.when;
    const paired = $('#paired');
    if (p.product) { paired.hidden = false; paired.href = `#p-${p.product}`; paired.textContent = `Paired with ${byId[p.product].name} ↓`; }
    else paired.hidden = true;
    if (hero) hero.destroy();
    await mountHero(name);
  };
  instant ? swap() : seamTo(swap);
}
radios.forEach((r, i) => {
  r.addEventListener('click', () => choose(r));
  r.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return; e.preventDefault();
    choose(radios[(i + d + radios.length) % radios.length], true);
  });
});
placeIndicator();
document.fonts?.ready.then(placeIndicator);
new ResizeObserver(placeIndicator).observe(group);

// re-mount with the right pane layout when crossing the phone breakpoint
let wasNarrow = innerWidth < 700;
addEventListener('resize', () => {
  const n = table.clientWidth < 700;
  if (n !== wasNarrow && hero) { wasNarrow = n; hero.destroy(); mountHero(current); }
});

// copy the MCP command
const copyBtn = $('#copy'), tip = $('#copy-tip');
copyBtn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(content.mcpCommand); tip.textContent = 'Copied to clipboard'; }
  catch { tip.textContent = 'Select and copy'; }
  copyBtn.classList.add('is-done'); copyBtn.firstElementChild.textContent = 'Copied'; tip.classList.add('is-on'); sound.tink(1.25);
  clearTimeout(copyBtn._t);
  copyBtn._t = setTimeout(() => { copyBtn.classList.remove('is-done'); copyBtn.firstElementChild.textContent = 'Copy'; tip.classList.remove('is-on'); }, 1800);
});
$('#cmd-text').textContent = content.mcpCommand;

// exposure log (live feed)
const feed = createFeed(), logEl = $('#log');
const two = (n) => String(n).padStart(2, '0');
const hhmm = (d) => `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
const tail = (e) => e.ms ? `${e.ms} ms` : e.country || (e.city ? `${e.city} · ${e.kb} KB` : e.sha ? `${e.sha}` : '');
const row = (e) => `<span>${hhmm(e.time)}</span><b>${esc(e.label)}</b><span>${esc(e.text)}${tail(e) ? ' · ' + esc(tail(e)) : ''}</span>`;
logEl.innerHTML = feed.recent(4).map((e) => `<li>${row(e)}</li>`).join('');
feed.subscribe((e) => {
  const li = document.createElement('li'); li.className = 'is-new'; li.innerHTML = row(e);
  logEl.prepend(li); while (logEl.children.length > 4) logEl.lastElementChild.remove();
});

// ---------------------------------------------------------------- products
const HARBOR = `<svg class="logo" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M12 26Q12 14 24 14L28.5 14L32 19.5L35.5 14L40 14Q52 14 52 26L52 40Q52 52 40 52L24 52Q12 52 12 40Z" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><circle cx="32" cy="35" r="3" fill="currentColor"/></svg>`;
const LOGO = {
  'mcp-emails': `<img class="logo" src="${P('mcp-emails/icon.png')}" alt="" width="30" height="30">`,
  'fun-libs': `<img class="logo" src="${P('fun-libs/icon.png')}" alt="" width="30" height="30">`,
  toolrails: `<img class="logo" src="${P('toolrails/icon.svg')}" alt="" width="30" height="30">`,
  harbor: HARBOR,
};
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused' };
const ARROW = `<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 8 8 2M3.5 2H8v4.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`;
const live = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor'].map((id) => byId[id]);
$('#stack').innerHTML = live.map((p, i) => {
  const plate = PLATES[PRODUCT_PLATE[p.id]];
  const src = (n) => A(`products/product-${p.id}-bare@${n}x.webp`);
  return `<article class="pane-card" id="p-${p.id}" aria-labelledby="pn-${p.id}">
    <div class="p-card">
      <div class="glass sheen" data-tink>
        <picture class="develop"><img class="glass-img" src="${src(1)}" srcset="${src(1)} 800w, ${src(2)} 1600w" sizes="(max-width: 1080px) 92vw, 54vw"
          alt="${esc(p.name)} logo set in a block of glass before ${plate.who}'s ${plate.when} glass-negative photograph" width="800" height="500" loading="lazy" decoding="async"></picture>
      </div>
      <div class="p-body">
        <div class="p-top"><span class="k">No. 0${i + 1} · ${plate.cat}</span><span class="k status" data-s="${p.status}">${STATUS[p.status]} · ${p.since}</span></div>
        <h3 class="p-name" id="pn-${p.id}">${LOGO[p.id]}${esc(p.name)}</h3>
        <p class="p-line">${esc(p.line)}</p>
        <ul class="p-facts">${(p.facts || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        <div class="p-fig"><span class="num">${esc(p.figure.value)}</span><span class="k unit">${esc(p.figure.label)}</span></div>
        <a class="p-link" href="${p.url}" rel="noopener" data-magnetic>${p.url.replace('https://', '')} ${ARROW}</a>
      </div>
    </div>
  </article>`;
}).join('');

// retired archive
const retired = content.products.filter((p) => p.status === 'retired');
const artFor = (p) => p.id === 'luma' ? P('luma/logo.png') : A(`products/retired-${p.id}.svg`);
$('#ret-list').innerHTML = retired.map((p) => `<li>
  <div class="ret-row" tabindex="0" data-id="${p.id}" aria-label="${esc(p.name)}, ${p.since}, retired. ${esc(p.line)}">
    ${p.id === 'luma'
      ? `<span class="thumb luma-thumb"><img src="${artFor(p)}" alt=""></span>`
      : `<img class="thumb" src="${artFor(p)}" alt="" width="56" height="70" loading="lazy">`}
    <span class="yr">${p.since}</span>
    <span><span class="nm">${esc(p.name)}</span><span class="ln">${esc(p.line)}</span></span>
    ${p.figure ? `<span class="fg">${esc(p.figure.value)}<small>${esc(p.figure.label)}</small></span>` : '<span></span>'}
  </div></li>`).join('');

// the plate that follows the cursor over the archive (after motion.dev "Cursor: Image hover")
const peek = $('#peek');
if (finePointer) {
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false;
  const tick = () => {
    x += (tx - x) * (reduce ? 1 : .16); y += (ty - y) * (reduce ? 1 : .16);
    const tilt = reduce ? 0 : Math.max(-10, Math.min(10, (tx - x) * .08));
    peek.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${-4 + tilt}deg) scale(${on ? 1 : .85})`;
    raf = (on || Math.abs(tx - x) > .5) ? requestAnimationFrame(tick) : 0;
  };
  const show = (row, px, py) => {
    const p = byId[row.dataset.id];
    peek.innerHTML = p.id === 'luma' ? `<span class="luma"><img src="${artFor(p)}" alt=""></span>` : `<img src="${artFor(p)}" alt="" width="240" height="300">`;
    if (!on) { x = px; y = py; }
    tx = px; ty = py; on = true; peek.classList.add('is-on');
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const hide = () => { on = false; peek.classList.remove('is-on'); };
  $$('.ret-row').forEach((row) => {
    row.addEventListener('pointerenter', (e) => { show(row, e.clientX + 130, e.clientY - 20); sound.tink(.8); });
    row.addEventListener('pointermove', (e) => { tx = e.clientX + 130; ty = e.clientY - 20; if (!raf) raf = requestAnimationFrame(tick); });
    row.addEventListener('pointerleave', hide);
    row.addEventListener('focus', () => { const r = row.getBoundingClientRect(); show(row, r.right - 120, r.top + r.height / 2); });
    row.addEventListener('blur', hide);
  });
  addEventListener('scroll', hide, { passive: true });
}

// glass tink on product hover
$$('[data-tink]').forEach((el) => el.addEventListener('pointerenter', () => sound.tink(.9 + Math.random() * .2)));

// ---------------------------------------------------------------- magnetic hovers
if (finePointer && !reduce) {
  $$('[data-magnetic]').forEach((el) => {
    const pull = el.classList.contains('mail') ? .22 : .32;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.transition = 'transform .18s cubic-bezier(.2,.7,.2,1)';
      el.style.transform = `translate(${dx * pull}px, ${dy * pull * 1.2}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .9s cubic-bezier(.16,1.4,.3,1)';
      el.style.transform = '';
    });
  });
}

// ?only=zoom|stack|retired|contact renders one block at the top (used for headless screenshots)
const only = new URLSearchParams(location.search).get('only');
if (only) {
  const keep = { zoom: '#zoom', stack: '#stack', retired: '#retired', contact: '#contact' }[only];
  ['.hero', '#zoom', '#stack', '#retired', '#contact'].forEach((s) => { if (s !== keep) $(s).style.display = 'none'; });
}

// ---------------------------------------------------------------- motion + sound
bindSoundToggle($('[data-sound-toggle]'));
initMotion({ smooth: !new URLSearchParams(location.search).has('still') });
// in-page anchors glide through Lenis when it is present
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href'); if (id.length < 2) return;
  const t = $(id); if (!t) return;
  e.preventDefault();
  scrollTo(id);
  history.replaceState(null, '', id);
}));
