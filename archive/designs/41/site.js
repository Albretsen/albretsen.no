// Key Frame — design 41. Page wiring for the hero (camera field + live A +
// exposure sheet), the cuts (rearrangeable product cels) and the morgue
// (matter.js light table). Motion (motion.dev 12) is vendored as window.Motion.
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import { smearIn, installBoil, pegLift, impactFrame, multiplane, rearrangeable } from './assets/motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const M = () => window.Motion;
const pad = (n, w = 2) => String(n).padStart(w, '0');
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const state = { onTwos: true, sound: false, takes: 0, frame: 0, obj: null, table: null };

installBoil();

/* ---------------------------------------------------------------- sound
   Off until the visitor turns it on. Synthesised, no files: a cel "thwack"
   for impacts and a pencil tick for edits.                                */
let ctx = null;
function audio() {
  if (!state.sound) return null;
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function thwack(power = 1) {
  const a = audio(); if (!a) return;
  const len = 0.14, buf = a.createBuffer(1, a.sampleRate * len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500 + 1400 * Math.min(1, power);
  const g = a.createGain(); g.gain.value = 0.18 + 0.3 * Math.min(1, power);
  const o = a.createOscillator(); o.frequency.setValueAtTime(140, a.currentTime); o.frequency.exponentialRampToValueAtTime(48, a.currentTime + 0.12);
  const og = a.createGain(); og.gain.setValueAtTime(0.25 * Math.min(1, power), a.currentTime); og.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.14);
  src.connect(f).connect(g).connect(a.destination); o.connect(og).connect(a.destination);
  src.start(); o.start(); o.stop(a.currentTime + 0.15);
}
function tick(freq = 1320) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'square'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.05, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.04);
  o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + 0.05);
}

/* ---------------------------------------------------------------- switches (Radix-style) */
function bindSwitch(el, initial, onChange) {
  const set = v => { el.setAttribute('aria-checked', v); el.dataset.state = v ? 'checked' : 'unchecked'; };
  set(initial);
  el.addEventListener('click', () => { const v = el.getAttribute('aria-checked') !== 'true'; set(v); onChange(v); });
}
state.onTwos = store.get('kf-twos', true) && !reduced;
bindSwitch($('#sw-twos'), state.onTwos, v => {
  state.onTwos = v; store.set('kf-twos', v);
  state.obj?.setOnTwos(v); state.table?.setOnTwos(v);
  document.documentElement.classList.toggle('on-ones', !v);
  tick(v ? 1320 : 990);
});
bindSwitch($('#sw-sound'), false, v => { state.sound = v; if (v) { audio(); tick(1760); } });

/* ---------------------------------------------------------------- timecode, 24 fps, drawn on twos */
const tcEl = $('#tc'), t0 = performance.now();
setInterval(() => {
  const f = Math.floor((performance.now() - t0) / 1000 * 24);
  const ff = f % 24, s = Math.floor(f / 24);
  tcEl.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(ff - (ff % 2))}`;
}, reduced ? 1000 : 83);

/* ---------------------------------------------------------------- exposure sheet (live feed) */
const rows = $('#xs-rows'), countEl = $('#xs-count');
const CEL = { 'mcp-emails': 'MCP Emails', 'fun-libs': 'Fun Libs', toolrails: 'Toolrails', 'albretsen.no': 'albretsen.no' };
const dial = e => e.ms ? `${e.ms}ms` : e.country ? e.country : e.sha ? e.sha : e.kb ? `${e.kb}KB` : '';
const MAX_ROWS = 8;
function row({ act, cel, dl, take = false, title = '' }) {
  state.frame++;
  const li = document.createElement('li');
  if (take) li.className = 'is-take';
  li.title = title || act;
  li.innerHTML = `<span class="fr">${pad(state.frame % 1000, 3)}</span><span class="act"></span><span class="cl"></span><span class="dial"></span>`;
  li.querySelector('.act').textContent = act;
  li.querySelector(".cl").textContent = cel;
  li.querySelector('.dial').textContent = dl;
  countEl.textContent = pad(state.frame % 1000, 3);
  return li;
}
function push(li) {
  rows.prepend(li);
  while (rows.children.length > MAX_ROWS) rows.lastElementChild.remove();
  smearIn(li);
}
const feed = createFeed();
feed.recent(MAX_ROWS).reverse().forEach(e => rows.prepend(row({ act: e.text, cel: CEL[e.product] || e.label, dl: dial(e) })));
feed.subscribe(e => { push(row({ act: e.text, cel: CEL[e.product] || e.label, dl: dial(e) })); });

/* ---------------------------------------------------------------- drag anything (stickers, the sheet) */
function draggable(el) {
  const key = `kf-drag:${el.dataset.drag}`;
  let pos = store.get(key, { x: 0, y: 0 }), d = null;
  const apply = () => { el.style.translate = `${pos.x}px ${pos.y}px`; };
  apply();
  if (el.tagName !== 'IMG') el.tabIndex = 0;
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('a,button')) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    d = { sx: e.clientX - pos.x, sy: e.clientY - pos.y, moved: false };
    el.classList.add('is-held'); el.style.zIndex = 30;
    if (!reduced && M()) M().animate(el, { scale: 1.06 }, { duration: 0.17, ease: M().steps(2, 'end') });
  });
  el.addEventListener('pointermove', e => {
    if (!d) return;
    pos = { x: e.clientX - d.sx, y: e.clientY - d.sy }; d.moved = true;
    apply();
  });
  const end = () => {
    if (!d) return; d = null;
    el.classList.remove('is-held'); el.style.zIndex = '';
    if (!reduced && M()) M().animate(el, { scale: [1.06, 0.94, 1.02, 1] }, { duration: 0.33, ease: M().steps(4, 'end') });
    store.set(key, pos); tick(1100);
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('keydown', e => {
    const s = e.shiftKey ? 48 : 16, k = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key];
    if (!k) return; e.preventDefault(); pos = { x: pos.x + k[0], y: pos.y + k[1] }; apply(); store.set(key, pos);
  });
}
$$('[data-drag]').forEach(draggable);

/* ---------------------------------------------------------------- MCP copy */
$('#mcp-copy').addEventListener('click', async () => {
  const btn = $('#mcp-copy span'), box = $('#mcp');
  try { await navigator.clipboard.writeText(content.mcpCommand); }
  catch { const r = document.createRange(); r.selectNodeContents($('#mcp-cmd')); getSelection().removeAllRanges(); getSelection().addRange(r); }
  btn.textContent = 'Copied';
  box.classList.remove('stamped'); void box.offsetWidth; box.classList.add('stamped');
  thwack(0.5);
  setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
});

/* ---------------------------------------------------------------- magnetic hovers (fine pointers only) */
if (finePointer && !reduced) {
  $$('.mag').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.35;
      M()?.animate(el, { x, y }, { type: 'spring', stiffness: 600, damping: 20 });
    });
    el.addEventListener('pointerleave', () => M()?.animate(el, { x: 0, y: 0 }, { type: 'spring', stiffness: 380, damping: 12 }));
  });
}

/* ---------------------------------------------------------------- hero: the live A */
const field = $('#field'), stand = $('#stand'), poster = $('#poster'), flash = $('.flash'), takesEl = $('#takes'), hint = $('#grab-hint');
let lastImpact = 0;
async function mountA() {
  if (reduced || state.obj) return;
  try {
    const t = document.createElement('canvas');
    if (!(t.getContext('webgl2') || t.getContext('webgl'))) return;
    const { mountCelObject } = await import('./assets/interactive/cel-object.js');
    const obj = await mountCelObject(stand, { shape: 'A', onTwos: state.onTwos, scale: innerWidth < 860 ? 1.7 : 1.4, autoSpin: 0.4, pose: [-0.22, 0.62, 0.06] });
    state.obj = obj;
    // on touch screens, vertical swipes still scroll the page; sideways flicks throw the A
    if (!finePointer) obj.canvas.style.touchAction = 'pan-y';
    obj.on('impact', ({ speed, side }) => {
      const now = performance.now();
      if (now - lastImpact < 160) return; lastImpact = now;
      state.takes++; takesEl.textContent = pad(state.takes, 3);
      impactFrame(field);
      flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
      $('.flash img').style.rotate = side === 'left' || side === 'right' ? '0deg' : '90deg';
      thwack(Math.min(1, speed / 14));
      push(row({ act: `the A hit the ${side} edge`, cel: 'Key · A', dl: `take ${state.takes}`, take: true }));
    });
    obj.on('grab', () => { hint.classList.add('gone'); tick(1500); });
    // two drawings later, replace the key drawing with the live one: a stepped diagonal wipe
    requestAnimationFrame(() => requestAnimationFrame(() => {
      field.classList.add('is-live');
      if (M()) {
        M().animate(poster, { clipPath: ['polygon(0 0, 130% 0, 100% 100%, -30% 100%)', 'polygon(130% 0, 130% 0, 100% 100%, 100% 100%)'] },
          { duration: 0.66, ease: M().steps(8, 'end') }).then(() => { poster.style.visibility = 'hidden'; });
      } else poster.style.visibility = 'hidden';
      // a little welcome throw so people know it moves
      setTimeout(() => obj.fling(innerWidth < 860 ? 5 : 9, 4, 7), 700);
    }));
  } catch (err) { /* keep the key drawing */ }
}
const idle = window.requestIdleCallback || (f => setTimeout(f, 300));
if (document.readyState === 'complete') idle(mountA); else addEventListener('load', () => idle(mountA), { once: true });

multiplane();

/* ---------------------------------------------------------------- gallop band: scroll scrubs Muybridge */
const band = $('#gallop'), horse = $('.gb-horse');
function gallop() {
  const r = band.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
  const travel = band.clientWidth - horse.clientWidth;
  const x = reduced ? travel * 0.5 : p * travel;
  horse.style.translate = `${x.toFixed(0)}px 0`;
  const stride = horse.clientWidth / 5; // one drawing per fifth of a body length
  horse.style.setProperty('--f', reduced ? 4 : Math.floor(x / stride) % 12);
}
let gq = false;
addEventListener('scroll', () => { if (!gq) { gq = true; requestAnimationFrame(() => { gq = false; gallop(); }); } }, { passive: true });
addEventListener('resize', gallop); gallop();

/* ---------------------------------------------------------------- phenakistiscope: drag to spin */
(() => {
  const disc = $('#disc'), img = $('#disc img');
  let ang = 0, vel = 0, drag = null, playing = false, raf = 0, last = 0;
  const show = () => {
    // fast spins snap to one slot (30deg) per drawing, so the 1840 figures animate again
    const shown = Math.abs(vel) > 220 ? Math.round(ang / 30) * 30 : ang;
    img.style.transform = `rotate(${shown}deg)`;
  };
  const loop = t => {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!drag) {
      if (playing) { ang += 360 * dt; vel = 360; }
      else { ang += vel * dt; vel *= Math.pow(0.32, dt); }
    }
    show();
    if (playing || drag || Math.abs(vel) > 4) raf = requestAnimationFrame(loop); else { raf = 0; vel = 0; }
  };
  const run = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const angleAt = e => { const r = disc.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
  disc.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    disc.setPointerCapture(e.pointerId); disc.classList.add('is-held');
    drag = { a: angleAt(e), t: performance.now(), moved: 0 }; playing = false; vel = 0; run();
  });
  disc.addEventListener('pointermove', e => {
    if (!drag) return;
    const a = angleAt(e); let da = a - drag.a; if (da > 180) da -= 360; if (da < -180) da += 360;
    const now = performance.now(), dt = Math.max(8, now - drag.t) / 1000;
    ang += da; vel = vel * 0.4 + (da / dt) * 0.6; drag.a = a; drag.t = now; drag.moved += Math.abs(da);
  });
  const up = () => {
    if (!drag) return;
    const click = drag.moved < 4; drag = null; disc.classList.remove('is-held');
    if (click) { playing = !playing && !reduced; vel = playing ? 360 : 0; tick(playing ? 1700 : 900); }
    vel = Math.max(-1440, Math.min(1440, vel)); run();
  };
  disc.addEventListener('pointerup', up); disc.addEventListener('pointercancel', up);
  disc.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); ang += e.key === 'ArrowRight' ? 30 : -30; vel = 0; show(); }
  });
  disc.addEventListener('click', e => { if (e.detail === 0) { playing = !playing && !reduced; vel = playing ? 360 : 0; run(); } });
})();

/* ---------------------------------------------------------------- the cuts (products) */
const live = content.products.filter(p => ['live', 'building', 'paused'].includes(p.status));
const STATUS = { live: 'Live', building: 'In production', paused: 'On hold' };
const ART_ALT = {
  'mcp-emails': 'MCP Emails logo raised as a cel over Marey’s gull in flight',
  'fun-libs': 'Fun Libs icon raised as a cel over an 1840 phenakistiscope disc',
  toolrails: 'Toolrails icon raised as a cel over drawn speed lines',
  harbor: 'Harbor mark on its own tile over a painted cloud sea',
};
const reel = $('#reel');
function celHTML(p) {
  const host = p.url ? new URL(p.url).host : '';
  return `
  <li class="cel" data-id="${p.id}" tabindex="0" aria-roledescription="draggable cel" style="view-transition-name: cel-${p.id}">
    <div class="cel-art">
      <picture>
        <img src="assets/products/cel-${p.id}-800.webp" srcset="assets/products/cel-${p.id}-800.webp 800w, assets/products/cel-${p.id}-1600.webp 1600w"
          sizes="(max-width: 860px) 100vw, 50vw" width="800" height="600" alt="${ART_ALT[p.id] || p.name}" loading="lazy" decoding="async" draggable="false">
      </picture>
    </div>
    <div class="cel-body">
      <p class="cel-slate"><span class="sc">Sc. 01</span><span class="st ${p.status}">${STATUS[p.status]}</span><span>Since ${p.since}</span><span class="grip" aria-hidden="true"><i></i><i></i><i></i></span></p>
      <h3>${p.name}</h3>
      <p class="line">${p.line}</p>
      ${p.figure ? `<p class="fig"><b>${p.figure.value}</b><span>${p.figure.label}</span></p>` : ''}
      ${p.facts ? `<ul class="facts">${p.facts.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}
      ${p.url ? `<a class="go" href="${p.url}" rel="noopener">${host} <span aria-hidden="true">↗</span></a>` : ''}
    </div>
  </li>`;
}
reel.innerHTML = live.map(celHTML).join('');
const renumber = (announce) => {
  const items = [...reel.children];
  items.forEach((el, i) => { el.querySelector('.sc').textContent = `Sc. ${pad(i + 1)}`; });
  if (announce) $('#cut-status').textContent = `New cut: ${items.map(el => el.querySelector('h3').textContent).join(', ')}.`;
};
const cut = rearrangeable(reel, { onChange: () => { renumber(true); tick(1240); } });
renumber(false);
pegLift('.cel');
$('#recut').addEventListener('click', () => {
  cut.reset();
  const before = new Map([...reel.children].map(e => [e, e.getBoundingClientRect()]));
  live.forEach(p => reel.appendChild(reel.querySelector(`[data-id="${p.id}"]`)));
  if (!reduced && M()) [...reel.children].forEach(e => {
    const a = before.get(e), b = e.getBoundingClientRect();
    if (a.left - b.left || a.top - b.top) M().animate(e, { x: [a.left - b.left, 0], y: [a.top - b.top, 0] }, { type: 'spring', stiffness: 420, damping: 30 });
  });
  renumber(true); tick(990);
});

/* view toggle: Radix-style radio group, roving focus, view transition on twos */
(() => {
  const group = $('.tgroup'), btns = $$('button', group), ind = $('.tgroup-ind', group);
  const place = () => { const b = btns.find(x => x.getAttribute('aria-checked') === 'true'); group.style.setProperty('--x', `${b.offsetLeft - 3}px`); group.style.setProperty('--w', `${b.offsetWidth}px`); };
  const select = (b, focus) => {
    if (b.getAttribute('aria-checked') === 'true') return;
    btns.forEach(x => { const on = x === b; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
    if (focus) b.focus();
    place(); tick(1400);
    const go = () => { reel.dataset.view = b.dataset.view; store.set('kf-view', b.dataset.view); };
    if (document.startViewTransition && !reduced) document.startViewTransition(go); else go();
  };
  btns.forEach(b => b.addEventListener('click', () => select(b)));
  group.addEventListener('keydown', e => {
    const i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    const n = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (n) { e.preventDefault(); select(btns[(i + n + btns.length) % btns.length], true); }
  });
  const saved = store.get('kf-view', 'reel');
  if (saved === 'sheet') { btns.forEach(x => { const on = x.dataset.view === 'sheet'; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; }); reel.dataset.view = 'sheet'; }
  document.fonts?.ready.then(place); place();
  addEventListener('resize', place);
})();

/* ---------------------------------------------------------------- the morgue (retired products on the light table) */
const STANDIN = id => `assets/products/retired/standin-${id}.svg`;
const retired = content.products.filter(p => p.status === 'retired');
const short = { 'joke-central': 'Joke Central', 'early-apps': 'Early apps' };
const tray = $('#table-items');
tray.innerHTML = retired.map(p => `
  <li class="tile" data-cel title="${p.name}: ${p.line}">
    <span class="logo ${p.id === 'luma' ? 'luma' : ''}"><img src="${p.id === 'luma' ? '../_shared/products/luma/logo.png' : STANDIN(p.id)}" alt="" loading="lazy" draggable="false"></span>
    <b>${short[p.id] || p.name}</b><span>${p.since} · ${p.line.length > 34 ? p.line.split(/[:.,]/)[0] : p.line.replace(/\.$/, '')}</span>
  </li>`).join('') + `
  <li class="prop-disc" data-cel data-shape="circle" aria-hidden="true"><img src="assets/extras/phenakistiscope-600.webp" alt="" loading="lazy" draggable="false"></li>
  <li class="prop" data-cel aria-hidden="true"><img src="assets/extras/sticker-on-twos.svg" width="200" height="48" alt="" loading="lazy" draggable="false"></li>
  <li class="prop" data-cel aria-hidden="true"><img src="assets/extras/sticker-sparkle.svg" width="64" height="64" alt="" loading="lazy" draggable="false"></li>`;

function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
const tableEl = $('#table');
let tableStarted = false;
async function startTable() {
  if (tableStarted) return; tableStarted = true;
  try {
    await loadScript('assets/vendor/matter-0.20.0.min.js');
    await Promise.all($$('img', tray).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    const { mountCelTable } = await import('./assets/interactive/cel-table.js');
    const cels = $$('[data-cel]', tray);
    const cols = Math.max(3, Math.floor(tableEl.clientWidth / 190));
    cels.forEach((el, i) => {
      el.dataset.x = (((i % cols) + 0.5) / cols * 0.9 + 0.02).toFixed(3);
      el.dataset.y = reduced ? (0.08 + Math.floor(i / cols) * 0.36).toFixed(2) : (-0.15 - i * 0.12).toFixed(2);
      el.dataset.angle = (((i * 37) % 21) - 10).toString();
    });
    tableEl.classList.add('is-physics');
    const t = mountCelTable(tableEl, { persist: 'morgue', onTwos: state.onTwos, settle: false, restitution: 0.3 });
    state.table = t;
    let lastHit = 0;
    t.on('impact', ({ speed }) => {
      const now = performance.now(); if (now - lastHit < 90) return; lastHit = now;
      thwack(Math.min(1, speed / 24));
      if (speed > 22) impactFrame(tableEl);
    });
    t.on('grab', () => tick(1500));
    $('#shake').onclick = () => { t.shake(16); thwack(0.6); };
    $('#redrop').onclick = () => { t.reset(); tick(900); };
  } catch { tableStarted = false; }
}
$('#shake').onclick = () => startTable();
$('#redrop').onclick = () => startTable();
new IntersectionObserver((ents, io) => { if (ents.some(e => e.isIntersecting)) { io.disconnect(); startTable(); } }, { rootMargin: '0px 0px -25% 0px' }).observe(tableEl);
