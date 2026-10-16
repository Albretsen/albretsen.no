// Sodium Orbit — design 51. The hero game is the introduction: four lamps, one
// per product, wired to the four parts of the opening sentence.
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import { createIgnite, DEFAULT_LAMPS } from './assets/game/ignite.js';
import { strike, emberHover, orbitWipe, afterglow, countUp, EASE } from './assets/motion.js';
import { sound } from './sound.js';

const $ = (s, r = document) => r.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const byId = Object.fromEntries(content.products.map((p) => [p.id, p]));
const figureOf = (id) => (byId[id]?.figure ? `${byId[id].figure.value} ${byId[id].figure.label}` : '');

/* ---------------- header ---------------- */
const top = $('#top');
const onScroll = () => top.classList.toggle('scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

const soundBtn = $('#sound');
soundBtn.addEventListener('click', () => {
  const on = sound.toggle();
  soundBtn.setAttribute('aria-pressed', String(on));
  $('.sound-label', soundBtn).textContent = on ? 'Sound on' : 'Sound off';
  if (on) sound.strike(0.6);
});

/* ---------------- hero game ---------------- */
const hero = $('#hero');
const canvas = $('#game');
const labels = $('#labels');
const intro = $('#intro');
const segs = [...intro.querySelectorAll('.seg')];
const narrow = matchMedia('(max-width: 640px)').matches;
const game = createIgnite(canvas, narrow ? { markAt: [0.5, 0.27], markScale: 0.6 } : { markAt: [0.68, 0.46], markScale: 0.6 });
let litSegs = 0;

const btnWrap = $('#lamp-buttons');
for (const l of DEFAULT_LAMPS) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'lamp-btn'; b.dataset.id = l.id;
  b.setAttribute('aria-pressed', 'false');
  b.innerHTML = `${l.name}<span class="sr"> lamp</span>`;
  b.addEventListener('click', () => game.strike(l.id));
  btnWrap.append(b);
}

function lightSegment() {
  const s = segs[litSegs];
  if (!s) return;
  litSegs++;
  s.classList.add('on');
  intro.dataset.lit = String(litSegs);
  const root = getComputedStyle(document.documentElement);
  if (!reduced) strike(s, { rest: root.getPropertyValue(litSegs === 4 ? '--sodium' : '--moon').trim(), duration: 1500 });
}

function placeLabel(id, name) {
  const pos = game.positionOf(id);
  if (!pos) return;
  const el = document.createElement('div');
  el.className = 'label ' + ((narrow ? { 'fun-libs': 'below' } : { 'fun-libs': 'below', harbor: 'left', toolrails: 'right' })[id] || '');
  el.dataset.id = id;
  el.style.left = pos[0] * 100 + '%'; el.style.top = pos[1] * 100 + '%';
  el.innerHTML = `<b>${name}</b><span>${id === 'play-2016' ? 'since 2016' : figureOf(id)}</span>`;
  labels.append(el);
  if (!reduced) { strike(el.querySelector('b')); strike(el.querySelector('span'), { delay: 120 }); }
}
// keep labels on their lamps when the canvas resizes
new ResizeObserver(() => {
  for (const el of labels.children) {
    const p = game.positionOf(el.dataset.id); if (p) { el.style.left = p[0] * 100 + '%'; el.style.top = p[1] * 100 + '%'; }
  }
}).observe(canvas);

canvas.addEventListener('ignite:strike', ({ detail }) => {
  $('#lit-count').textContent = `${Math.min(detail.litCount, 4)} / 4`;
  btnWrap.querySelector(`[data-id="${detail.id}"]`)?.setAttribute('aria-pressed', 'true');
  placeLabel(detail.id, detail.name);
  if (detail.id !== 'play-2016') lightSegment();
  sound.strike(detail.id === 'play-2016' ? 1.4 : 1);
});
canvas.addEventListener('ignite:complete', () => {
  hero.classList.add('complete');
  const h = $('.hint-fine');
  h.textContent = 'All four lit. The products are just below.';
  if (!reduced) strike(h);
  sound.chord();
});

/* Easter egg: type 2016 or the Konami code (handled inside ignite.js). */
canvas.addEventListener('ignite:secret', () => {
  const s = $('#secret');
  s.textContent = 'A fifth lamp. Published on Google Play since 2016.';
  sound.meteor();
  document.documentElement.classList.add('secret-on');
  if (!reduced) {
    s.animate([{ opacity: 0, letterSpacing: '.7em', filter: 'blur(8px)' }, { opacity: 1, letterSpacing: '.32em', filter: 'blur(0)', offset: .18 }, { opacity: 1, offset: .82 }, { opacity: 0 }],
      { duration: 5200, easing: EASE.outExpo });
    $('.sticker')?.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(2turn) scale(1.15)', offset: .7 }, { transform: 'rotate(2turn) scale(1)' }], { duration: 2400, easing: EASE.outExpo });
  } else s.style.opacity = 1;
  burstGround(14, true);
});

// #lit lights every lamp (a shareable finished state); #secret also opens the fifth lamp
if (location.hash === '#lit' || location.hash === '#secret') { DEFAULT_LAMPS.forEach((l) => game.strike(l.id)); game.advance(2600); }
if (location.hash === '#secret') setTimeout(() => game.secret(), 1200);

if (reduced) {
  // calm, static, finished state: every lamp lit, every word lit
  // (ignite.js already draws its lamps lit and still, so mirror that in the DOM)
  DEFAULT_LAMPS.forEach((l) => {
    btnWrap.querySelector(`[data-id="${l.id}"]`)?.setAttribute('aria-pressed', 'true');
    placeLabel(l.id, l.name); lightSegment();
  });
  $('#lit-count').textContent = '4 / 4';
  hero.classList.add('complete');
  $('.hint-fine').textContent = 'All four lit. The products are just below.';
}

/* ---------------- ground lights: the live feed as city flashes ---------------- */
// Brightest city clusters in earth-limb (fractions of the photo), found by
// sampling the image. Flashes are placed through the same object-fit maths.
const CITIES = [[0.715, 0.617], [0.5, 0.37], [0.465, 0.605], [0.597, 0.728], [0.424, 0.333], [0.549, 0.444], [0.597, 0.37], [0.667, 0.42], [0.208, 0.691], [0.139, 0.877], [0.688, 0.963], [0.882, 0.975]];
const ground = $('#ground');
const limb = $('#limb');
function fitGround() {
  const W = hero.clientWidth, H = hero.clientHeight, iw = 1440, ih = 810;
  const sc = Math.max(W / iw, H / ih), w = iw * sc, h = ih * sc;
  const pos = narrow ? [0.64, 0.4] : [0.3, 0.4];
  Object.assign(ground.style, { width: w + 'px', height: h + 'px', left: (W - w) * pos[0] + 'px', top: (H - h) * pos[1] + 'px' });
}
new ResizeObserver(fitGround).observe(hero); fitGround();

function flash(i, neon = false) {
  if (reduced) return;
  const [x, y] = CITIES[i % CITIES.length];
  const el = document.createElement('i');
  if (neon) el.className = 'neon';
  el.style.left = x * 100 + '%'; el.style.top = y * 100 + '%';
  ground.append(el);
  const a = el.animate([{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)', offset: .12 }, { opacity: .5, offset: .2 }, { opacity: 1, offset: .3 }, { opacity: 0, transform: 'scale(1.6)' }],
    { duration: 2400, easing: 'ease-out', pseudoElement: undefined });
  a.finished.then(() => el.remove());
}
function burstGround(n, neon) { for (let k = 0; k < n; k++) setTimeout(() => flash(Math.floor(Math.random() * CITIES.length), neon), k * 120); }

const feed = createFeed();
const list = $('#feed');
const fmtTime = (d) => d.toTimeString().slice(0, 8);
function row(e) {
  const li = document.createElement('li');
  const meta = e.ms ? `${e.ms} ms` : e.country || e.city || (e.sha ?? '');
  li.innerHTML = `<span class="p">${e.label}</span><span class="t">${e.text}</span><span class="m">${meta}</span>`;
  li.title = fmtTime(e.time);
  return li;
}
for (const e of feed.recent(6)) list.append(row(e));
feed.subscribe((e) => {
  const li = row(e);
  list.prepend(li);
  while (list.children.length > 6) list.lastChild.remove();
  if (!reduced) li.animate([{ opacity: 0, transform: 'translateY(-8px)', color: 'oklch(0.92 0.09 88)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: EASE.outExpo });
  flash(Math.abs(hash(e.id)) % CITIES.length);
  sound.tick();
});
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
// a few ambient flashes so the ground feels alive from the first second
if (!reduced) { let k = 0; const amb = setInterval(() => { flash(k++ * 5); if (k > 3) clearInterval(amb); }, 1400); }

/* ---------------- products console (Radix-style tabs) ---------------- */
const LIVE = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor'];
const LOGOS = {
  'mcp-emails': '../_shared/products/mcp-emails/icon.png',
  'fun-libs': '../_shared/products/fun-libs/icon.png',
  toolrails: '../_shared/products/toolrails/icon.svg',
  harbor: 'assets/_src/harbor-tile.svg', // the real Harbor mark, in its own banner colours
};
const STATUS = { live: 'Lit · live', building: 'Striking · building', paused: 'Dimmed · paused' };
const ALT = {
  'mcp-emails': 'The MCP Emails app icon on a glass tile, orbited by molten sparks, over a city at night seen from orbit.',
  'fun-libs': 'The Fun Libs app icon on a glass tile, orbited by molten sparks, over a lit city grid seen from orbit.',
  toolrails: 'The Toolrails icon on a glass tile, orbited by sparks, over New York at night seen from orbit.',
  harbor: 'The Harbor mark on a dimmed blue tile, because Harbor is paused, over the night horizon.',
};
const tabs = $('#tabs'), glow = $('#tab-glow'), readout = $('#readout');
const frame = $('#stage-frame');
let current = 'mcp-emails';

LIVE.forEach((id, i) => {
  const p = byId[id];
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'tab mag-soft'; b.role = 'tab'; b.id = `tab-${id}`;
  b.dataset.id = id; b.dataset.status = p.status;
  b.setAttribute('aria-controls', 'readout');
  b.setAttribute('aria-selected', String(id === current)); b.tabIndex = id === current ? 0 : -1;
  b.innerHTML = `<span class="logo"><img src="${LOGOS[id]}" alt="" width="40" height="40" loading="lazy"></span><span class="name">${p.name}</span><span class="st">${STATUS[p.status]}</span>`;
  b.addEventListener('click', (e) => select(id, e));
  tabs.append(b);
});
tabs.addEventListener('keydown', (e) => {
  const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
  let i = LIVE.indexOf(current);
  if (e.key in keys) i = (i + keys[e.key] + LIVE.length) % LIVE.length;
  else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = LIVE.length - 1; else return;
  e.preventDefault(); e.stopPropagation();
  select(LIVE[i]); $(`#tab-${LIVE[i]}`).focus();
});

function moveGlow(animate = true) {
  const t = $(`#tab-${current}`);
  const vertical = getComputedStyle(tabs).gridAutoFlow !== 'column';
  const to = vertical
    ? { top: t.offsetTop + 'px', height: t.offsetHeight + 'px', left: '6px', width: `calc(100% - 12px)` }
    : { top: t.offsetTop + 'px', height: t.offsetHeight + 'px', left: t.offsetLeft + 'px', width: t.offsetWidth + 'px' };
  if (animate && !reduced) {
    const from = { top: glow.style.top, height: glow.style.height, left: glow.style.left, width: glow.style.width };
    glow.animate([from, to], { duration: 650, easing: EASE.spring });
  }
  Object.assign(glow.style, to);
}
new ResizeObserver(() => moveGlow(false)).observe(tabs);

function renderReadout(id, first = false) {
  const p = byId[id];
  readout.dataset.status = p.status;
  readout.setAttribute('aria-labelledby', `tab-${id}`);
  const host = p.url ? new URL(p.url).host : '';
  readout.innerHTML = `
    <div><div class="fig" id="fig">${p.figure.value}</div><span class="fig-label mono">${p.figure.label} · since ${p.since}</span></div>
    <div><h3>${p.line}</h3><ul class="chips">${(p.facts || []).map((f) => `<li>${f}</li>`).join('')}</ul>
    ${p.url ? `<a class="go" href="${p.url}" rel="noopener" target="_blank">${host} <span aria-hidden="true">↗</span></a>` : ''}</div>`;
  if (!first) countUp($('#fig'));
}

function setImage(id, img) {
  img.src = `assets/products/lamp-${id}-1600.webp`;
  img.srcset = `assets/products/lamp-${id}-800.webp 800w, assets/products/lamp-${id}-1600.webp 1600w`;
  img.alt = ALT[id];
}

function select(id, ev) {
  if (id === current) return;
  current = id;
  for (const b of tabs.querySelectorAll('.tab')) { const on = b.dataset.id === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }
  moveGlow();
  renderReadout(id);
  sound.tick(1.6);
  // Orbit Wipe: the next lamp is revealed by a circle growing from the click point
  const layer = document.createElement('picture');
  layer.style.cssText = 'position:absolute;inset:0;display:block';
  const img = new Image(); img.decoding = 'async'; img.sizes = '(min-width: 1000px) 60vw, 100vw';
  img.style.cssText = 'width:100%;height:100%;object-fit:cover';
  setImage(id, img); layer.append(img);
  frame.insertBefore(layer, frame.querySelector('.spot'));
  // start the wipe from the spark position on the tile (its orbiting ember sits right of centre)
  const r = frame.getBoundingClientRect();
  const x = r.width * 0.56, y = r.height * 0.55;
  const done = () => { setImage(id, $('#stage-img')); setTimeout(() => layer.remove(), 80); };
  const go = () => { const a = orbitWipe(layer, x, y); a ? a.finished.then(done) : done(); };
  img.complete ? go() : (img.onload = go, img.onerror = done);
}
renderReadout(current, true);
setImage(current, $('#stage-img'));
requestAnimationFrame(() => moveGlow(false));

// spotlight + Ember Lift tilt on the stage
frame.addEventListener('pointermove', (e) => {
  const r = frame.getBoundingClientRect();
  frame.style.setProperty('--x', `${e.clientX - r.left}px`); frame.style.setProperty('--y', `${e.clientY - r.top}px`);
});
emberHover(frame, { lift: 4, tilt: 4 });
afterglow(frame);
// first time the figure comes into view, count it up
new IntersectionObserver((en, io) => { if (en[0].isIntersecting) { countUp($('#fig')); io.disconnect(); } }, { threshold: 0.6 }).observe(readout);

/* ---------------- retired accordion ---------------- */
const RETIRED_ICON = { luma: 'assets/products/retired/luma.webp' };
const grid = $('#retired-grid');
for (const p of content.products.filter((q) => q.status === 'retired')) {
  const li = document.createElement('li');
  const src = RETIRED_ICON[p.id] || `assets/products/retired/${p.id}.svg`;
  li.innerHTML = `<img src="${src}" alt="" width="64" height="64" loading="lazy"><div><b>${p.name}</b><span>${p.line}</span><em>${p.since}${p.figure ? ` · ${p.figure.value} ${p.figure.label}` : ''}</em></div>`;
  grid.append(li);
}
const details = $('#retired'), body = $('#retired-body');
details.querySelector('summary').addEventListener('click', (e) => {
  if (reduced) return;
  e.preventDefault();
  body.classList.remove('opening', 'closing');
  if (!details.open) {
    details.open = true;
    body.style.setProperty('--content-h', body.scrollHeight + 'px');
    body.classList.add('opening');
    sound.tick(0.8);
    grid.querySelectorAll('li').forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(12px)', filter: 'brightness(2.4)' }, { opacity: 1, transform: 'none', filter: 'none' }], { duration: 700, delay: 60 + i * 45, easing: EASE.outExpo, fill: 'backwards' }));
  } else {
    body.style.setProperty('--content-h', body.scrollHeight + 'px');
    body.classList.add('closing');
    body.addEventListener('animationend', () => { details.open = false; body.classList.remove('closing'); }, { once: true });
  }
});
body.addEventListener('animationend', () => body.classList.remove('opening'));

/* ---------------- scroll reveals ---------------- */
document.querySelectorAll('.sec-head, .console, .retired, .map-scroll, .glass-copy, .foot-grid').forEach((el) => el.classList.add('rise'));
if (!CSS.supports('animation-timeline: view()') && !reduced) {
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.animate([{ opacity: 0, transform: 'translateY(30px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'none' }], { duration: 900, easing: EASE.outExpo });
    io.unobserve(en.target);
  }), { threshold: 0.12 });
  document.querySelectorAll('.rise').forEach((el) => io.observe(el));
}
document.querySelectorAll('#map .map-scroll img, .foot-bg').forEach((el) => afterglow(el));

/* ---------------- the glass orb (three.js, lazy) ---------------- */
const orbWrap = $('#orb-wrap');
let orbLoading = false;
const hasWebGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
if (hasWebGL) {
  new IntersectionObserver(async (en, io) => {
    if (!en[0].isIntersecting || orbLoading) return;
    orbLoading = true; io.disconnect();
    try {
      const { mountOrb } = await import('./assets/orb/sodium-orb.js');
      const orb = await mountOrb($('#orb'), { particles: narrow ? 5000 : 10000 });
      orbWrap.classList.add('live');
      $('#orb canvas')?.addEventListener('pointerup', () => sound.strike(0.8));
      $('#orb canvas')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') sound.strike(0.8); });
      if (reduced) orb.renderAt(4000);
    } catch (err) { /* poster stays */ }
  }, { rootMargin: '300px' }).observe(orbWrap);
}

/* ---------------- footer: copy the MCP command ---------------- */
const cmd = $('#cmd'), hint = $('#cmd-hint');
cmd.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(content.mcpCommand); hint.textContent = 'Copied'; }
  catch { hint.textContent = 'Select it'; }
  sound.strike(0.5);
  if (!reduced) {
    strike(hint);
    cmd.animate([{ boxShadow: '0 0 0 0 oklch(0.76 0.165 60 / .6), inset 0 0 0 0 transparent' }, { boxShadow: '0 0 0 14px oklch(0.76 0.165 60 / 0), inset 0 0 40px oklch(0.76 0.165 60 / .15)' }], { duration: 900, easing: EASE.outExpo });
  }
  setTimeout(() => (hint.textContent = 'Copy'), 2200);
});


/* ---------------- magnetic hover (nav + email) ---------------- */
if (!reduced && matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.mag').forEach((el) => {
    let anim;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.22, dy = (e.clientY - r.top - r.height / 2) * 0.32;
      anim?.cancel();
      anim = el.animate([{ transform: `translate(${dx}px, ${dy}px)` }], { duration: 300, easing: EASE.outExpo, fill: 'forwards' });
    });
    el.addEventListener('pointerleave', () => {
      const from = getComputedStyle(el).transform;
      anim?.cancel(); anim = null;
      el.animate([{ transform: from === 'none' ? 'translate(0,0)' : from }, { transform: 'translate(0,0)' }], { duration: 800, easing: EASE.spring });
    });
  });
}
