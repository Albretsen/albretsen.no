// Darkfield · design 44 · the page.
// The hero is one infinite glass slide. Products are specimens laid out like a Victorian diatom
// arrangement around a stone of 24,000 grains. Wherever the objective (the centre of the view)
// settles, the grains fly there and become that specimen's glyph. Live signals ripple through them.
import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';
import * as M from '../assets/motion.js';
import { createShortcuts, DEFAULT_GROUPS } from '../assets/shortcuts.js';

const { gsap, ScrollTrigger } = M;
const $ = (s, r = document) => r.querySelector(s);
const ASSETS = new URL('../assets/', import.meta.url);
const SHARED = new URL('../../_shared/products/', import.meta.url);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = () => innerWidth < 761;
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven'];
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' };

const byId = Object.fromEntries(content.products.map((p) => [p.id, p]));
const active = content.products.filter((p) => p.status !== 'retired');
const retired = content.products.filter((p) => p.status === 'retired');
let LATIN = {};

// ------------------------------------------------------------------ the slide (plane)
const stage = $('#stage'), plane = $('#plane'), poster = $('#poster'), canvas = $('#cloud');
const POS = [[0, -1080], [1250, 0], [0, 1100], [-1250, 0]]; // N, E, S, W: a cross, as on a Victorian arranged slide
const places = [];
active.forEach((p, i) => places.push({ id: p.id, kind: 'p', x: POS[i][0], y: POS[i][1], cy: -63, U: 300, s: 0.82, w: 560 }));
retired.forEach((p, i) => {
  const a = (-90 + 24 + i * (360 / retired.length)) * Math.PI / 180;
  places.push({ id: p.id, kind: 'r', x: Math.round(Math.cos(a) * 2550), y: Math.round(Math.sin(a) * 1900), cy: -24, U: 220, s: 1.1, w: 400 });
});
const ORIGIN = { id: 'rock', kind: 'o', x: 0, y: 0, cy: 0, U: 380 };

function shortName(p) { return p.name.split(' / ')[0].split(',')[0]; }
function buildPlane() {
  let html = '';
  places.forEach((pl, i) => {
    const p = byId[pl.id];
    if (pl.kind === 'p') {
      html += `<button type="button" class="place place-p" data-i="${i}" style="left:${pl.x}px;top:${pl.y}px" aria-label="${p.name}: ${p.line} Press to bring it under the objective.">
        <img class="slide" src="${ASSETS}products/slide-${p.id}-800.webp" srcset="${ASSETS}products/slide-${p.id}-800.webp 800w, ${ASSETS}products/slide-${p.id}-1600.webp 1600w" sizes="(max-width: 760px) 60vw, 34vw" width="800" height="1000" alt="" decoding="async" draggable="false">
        <img class="tag" data-tag="${p.id}" src="${ASSETS}extras/tag-${p.status}.svg" alt="" draggable="false">
        <span class="place-key">${i + 1}</span></button>`;
    } else {
      html += `<button type="button" class="place place-r" data-i="${i}" style="left:${pl.x}px;top:${pl.y}px" aria-label="${p.name}, retired: ${p.line}">
        <img src="${ASSETS}products/retired/${p.id}-600.webp" width="600" height="600" alt="" loading="lazy" decoding="async" draggable="false"></button>`;
    }
  });
  const lm = (cls, x, y, w, src, cap, ratio) => `<figure class="landmark ${cls}" style="left:${x}px;top:${y}px;width:${w}px;margin:0"><img src="${ASSETS}${src}" alt="" loading="lazy" decoding="async" draggable="false" width="${w}" height="${Math.round(w * ratio)}"><figcaption>${cap}</figcaption></figure>`;
  html += lm('rosette', 4150, 120, 1250, 'hero/hero-diatom-rosette-1200.webp', 'Landmark · Julius Wiesner, diatom rosette, c. 1870 · The Met', 1);
  html += lm('', -4100, -150, 980, 'museum/atkins-spiraea-aruncus-1000.webp', 'Landmark · Anna Atkins, Spiraea aruncus, 1851–54', 1.346);
  html += lm('', -250, -3150, 900, 'museum/atkins-cystoseira-foeniculacea-1000.webp', 'Landmark · Anna Atkins, c. 1853', 1.068);
  html += lm('', 350, 3200, 900, 'museum/atkins-cystoseira-granulata-1000.webp', 'Landmark · Anna Atkins, c. 1853', 1.068);
  html += lm('', 3300, -2550, 240, 'museum/bertsch-navicula-600.webp', 'Navicula, ×1200', 2.873);
  for (let v = -4000; v <= 4000; v += 1000) if (v) {
    html += `<span class="coord" style="left:${v}px;top:0px">${v > 0 ? '+' : '−'}${Math.abs(v)} µm</span>`;
    html += `<span class="coord" style="left:0px;top:${v}px">${v > 0 ? '+' : '−'}${Math.abs(v)} µm</span>`;
  }
  plane.insertAdjacentHTML('beforeend', html);
}
buildPlane();

// ------------------------------------------------------------------ view state
const view = { x: 0, y: 0, s: 0.34 };
const cloud = { x: 0, y: 0, U: 380 };
let W = stage.clientWidth, H = stage.clientHeight;
const wide = () => W > 1100;
const centre = () => ({ cx: wide() ? W * 0.62 : W / 2, cy: phone() ? H * 0.36 : H * 0.47 });
const homeScale = () => (phone() ? Math.min(0.42, (W * 0.95) / 990) : Math.min(0.4, W / 4400, H / 3100));
const clampS = (s) => Math.min(2.4, Math.max(0.06, s));
const mapEl = $('#map'), mapView = $('#mapView'), magEl = $('#mag'), coordEl = $('#mapCoords'), reticle = $('#reticle');
const MAPB = { x0: -4800, x1: 4800, y0: -3600, y1: 3600, w: 150, h: 74 };
const toMap = (x, y) => [((x - MAPB.x0) / (MAPB.x1 - MAPB.x0)) * MAPB.w, ((y - MAPB.y0) / (MAPB.y1 - MAPB.y0)) * MAPB.h];
mapEl.insertAdjacentHTML('beforeend', [ORIGIN, ...places].map((p) => { const [mx, my] = toMap(p.x, p.y); return `<i class="${p.kind}" style="left:${mx}px;top:${my}px"></i>`; }).join(''));

function apply() {
  plane.style.transform = `translate3d(${view.x}px,${view.y}px,0) scale(${view.s})`;
  const g = 54 * Math.max(0.5, Math.min(2, view.s * 2.6));
  stage.style.backgroundSize = `${g}px ${g}px, 100% 100%`;
  stage.style.backgroundPosition = `${view.x}px ${view.y}px, 0 0`;
  magEl.textContent = `× ${Math.round(view.s * 400)}`;
  const { cx, cy } = centre();
  const wx = (cx - view.x) / view.s, wy = (cy - view.y) / view.s;
  coordEl.textContent = `x ${wx >= 0 ? '+' : '−'}${Math.abs(Math.round(wx))} · y ${wy >= 0 ? '+' : '−'}${Math.abs(Math.round(wy))} µm`;
  const [a, b] = toMap(-view.x / view.s, -view.y / view.s), [c, d] = toMap((W - view.x) / view.s, (H - view.y) / view.s);
  Object.assign(mapView.style, { left: `${a}px`, top: `${b}px`, width: `${Math.max(3, c - a)}px`, height: `${Math.max(3, d - b)}px` });
  reticle.style.transform = `rotate(${(wx * 0.012).toFixed(2)}deg)`;
}
let anim;
function flyTo(x, y, s, dur = 1.4, onDone) {
  const { cx, cy } = centre();
  anim?.kill();
  anim = gsap.to(view, { x: cx - x * s, y: cy - y * s, s, duration: reduce ? 0 : dur, ease: 'expo.inOut', onUpdate: apply, onComplete: () => { settle(); onDone?.(); } });
}
const home = (dur) => { const s = homeScale(); flyTo(0, 0, s, dur); };
function zoomAt(f, px, py) {
  const c = centre(); px ??= c.cx; py ??= c.cy;
  const s = clampS(view.s * f);
  view.x = px - (px - view.x) * (s / view.s); view.y = py - (py - view.y) * (s / view.s); view.s = s;
  apply(); settleSoon();
}
function zoomBy(f) {
  const c = centre(); const s = clampS(view.s * f);
  const wx = (c.cx - view.x) / view.s, wy = (c.cy - view.y) / view.s;
  flyTo(wx, wy, s, 0.7);
}

// ------------------------------------------------------------------ focus: what is under the objective
let focus = ORIGIN, df = null;
const hud = $('.hud-objective');
let settleT;
const settleSoon = () => { clearTimeout(settleT); settleT = setTimeout(settle, 260); };
function settle() {
  const { cx, cy } = centre();
  let best = ORIGIN, bd = Infinity;
  for (const p of places) {
    const d = Math.hypot(view.x + p.x * view.s - cx, view.y + (p.y + p.cy) * view.s - cy);
    if (d < bd) { bd = d; best = p; }
  }
  const limit = Math.max(140, Math.min(W, H) * 0.3);
  setFocus(bd < limit && view.s > 0.26 ? best : ORIGIN);
}
function setFocus(p) {
  if (p === focus) return;
  focus = p;
  plane.querySelectorAll('.place.is-focus').forEach((el) => el.classList.remove('is-focus'));
  if (p !== ORIGIN) plane.querySelector(`.place[data-i="${places.indexOf(p)}"]`)?.classList.add('is-focus');
  gsap.to(cloud, { x: p.x, y: p.y + p.cy, U: p.U, duration: reduce ? 0 : 1.7, ease: 'expo.inOut' });
  df?.morph(p.id, 2.1);
  hud.classList.add('is-swap');
  setTimeout(() => {
    const prod = byId[p.id];
    $('#objName').textContent = prod ? shortName(prod) : 'The stone';
    $('#objLatin').textContent = prod ? `${(LATIN[p.id] || '').split(', ').pop() || ''}${prod.status === 'retired' ? ' · retired' : ''}` : 'Moon rock, as 24,000 grains';
    const fig = prod?.figure;
    $('#objFig').hidden = !fig;
    if (fig) { $('#objFigV').textContent = fig.value; $('#objFigL').textContent = fig.label; }
    hud.classList.remove('is-swap');
  }, reduce ? 0 : 260);
  if (sound.on) sound.ping(p === ORIGIN ? 330 : 495);
}
const order = [ORIGIN, ...places];
const gotoPlace = (p) => p === ORIGIN ? flyTo(0, 0, Math.max(homeScale(), phone() ? 0.36 : 0.5)) : flyTo(p.x, p.y + p.cy, Math.min(p.s, (Math.min(W, H) * 0.92) / (p.kind === 'p' ? 900 : 620)));
const step = (d) => { const i = order.indexOf(focus); gotoPlace(order[(i + d + order.length) % order.length]); };

// ------------------------------------------------------------------ input: drag, click, pinch, wheel
const pointers = new Map();
let drag = null, pinch = null, moved = false;
function localFromScreen(px, py) {
  if (!df) return null;
  const k = worldK(), f = df.points.scale.x || 1;
  const sx = view.x + cloud.x * view.s, sy = view.y + cloud.y * view.s;
  return [((px - sx) * k) / f, (-(py - sy) * k) / f];
}
stage.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.hud')) return;
  if (e.pointerType !== 'mouse' && !stage.classList.contains('is-explore')) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  anim?.kill();
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s }; drag = null;
  } else {
    drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, t: performance.now(), lx: e.clientX, ly: e.clientY, sx: 0, sy: 0 };
    moved = false;
  }
});
addEventListener('pointermove', (e) => {
  const r = stage.getBoundingClientRect();
  if (df && !drag && e.target instanceof Node && stage.contains(e.target)) { const l = localFromScreen(e.clientX - r.left, e.clientY - r.top); if (l) df.setPointer(l[0], l[1], true); }
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const s = clampS(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d);
    zoomAt(s / view.s, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); return;
  }
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!moved && Math.hypot(dx, dy) > 5) { moved = true; stage.classList.add('is-drag'); try { stage.setPointerCapture(e.pointerId); } catch {} }
  if (!moved) return;
  const now = performance.now(), dt = Math.max(1, now - drag.t);
  drag.sx = (e.clientX - drag.lx) / dt; drag.sy = (e.clientY - drag.ly) / dt; drag.t = now; drag.lx = e.clientX; drag.ly = e.clientY;
  view.x = drag.vx + dx; view.y = drag.vy + dy; apply();
});
function endPointer(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (pinch) { if (pointers.size < 2) { pinch = null; settleSoon(); } return; }
  if (!drag) return;
  const d = drag; drag = null; stage.classList.remove('is-drag');
  if (moved) {
    if (performance.now() - d.t > 80 || reduce) { settle(); return; }
    anim = gsap.to(view, { x: view.x + d.sx * 260, y: view.y + d.sy * 260, duration: 1.1, ease: 'expo.out', onUpdate: apply, onComplete: settle });
    return;
  }
  // a click
  const placeEl = e.target.closest?.('.place');
  if (placeEl) { handled = true; placeAction(places[+placeEl.dataset.i]); return; }
  const r = stage.getBoundingClientRect(); const l = localFromScreen(e.clientX - r.left, e.clientY - r.top);
  if (l && df) { df.pulse(l[0], l[1], 1.2); if (sound.on) sound.ping(660); }
}
addEventListener('pointerup', endPointer); addEventListener('pointercancel', endPointer);
stage.addEventListener('pointerleave', () => df?.setPointer(0, 0, false));
let handled = false;
function placeAction(p) { if (focus === p && p.kind === 'p') $(`#spec-${p.id}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); else gotoPlace(p); }
stage.addEventListener('click', (e) => {
  const el = e.target.closest('.place'); if (!el) return;
  e.preventDefault();
  if (!handled) placeAction(places[+el.dataset.i]);
  handled = false;
});
// keyboard users: focusing a place brings it under the objective
plane.addEventListener('focusin', (e) => { const el = e.target.closest('.place'); if (el && el.matches(':focus-visible')) gotoPlace(places[+el.dataset.i]); });
plane.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { const el = e.target.closest('.place'); if (el) { e.preventDefault(); e.stopPropagation(); placeAction(places[+el.dataset.i]); } } });
// pinch on trackpads arrives as ctrl+wheel; cmd+wheel zooms too. A plain wheel scrolls the page.
stage.addEventListener('wheel', (e) => {
  if (!(e.ctrlKey || e.metaKey) && !stage.classList.contains('is-explore')) return;
  e.preventDefault(); anim?.kill();
  const r = stage.getBoundingClientRect();
  if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX - r.left, e.clientY - r.top);
  else { view.x -= e.deltaX; view.y -= e.deltaY; apply(); settleSoon(); }
}, { passive: false });
mapEl.addEventListener('click', (e) => {
  const r = mapEl.getBoundingClientRect();
  const x = MAPB.x0 + ((e.clientX - r.left) / MAPB.w) * (MAPB.x1 - MAPB.x0), y = MAPB.y0 + ((e.clientY - r.top) / MAPB.h) * (MAPB.y1 - MAPB.y0);
  flyTo(x, y, view.s, 1.1);
});
mapEl.parentElement.removeAttribute('aria-hidden');
mapEl.style.cursor = 'pointer';
const explore = $('#explore');
explore.addEventListener('click', () => {
  const on = !stage.classList.contains('is-explore');
  stage.classList.toggle('is-explore', on); explore.setAttribute('aria-pressed', on); explore.textContent = on ? 'Done exploring' : 'Explore the slide';
});
document.querySelectorAll('.obj-btns [data-act]').forEach((b) => b.addEventListener('click', (e) => {
  M.signal(b, { size: 70 });
  ({ prev: () => step(-1), next: () => step(1), 'zoom-in': () => zoomBy(1.4), 'zoom-out': () => zoomBy(1 / 1.4), fit: () => home(1.4) })[b.dataset.act]();
  e.stopPropagation();
}));

// ------------------------------------------------------------------ particles
const worldK = () => (2 * df.camera.position.z * Math.tan((df.camera.fov * Math.PI) / 360)) / H;
function syncCloud() {
  if (!df) return;
  const k = worldK();
  const sx = view.x + cloud.x * view.s, sy = view.y + cloud.y * view.s;
  const f = cloud.U * view.s * k;
  df.points.position.set((sx - W / 2) * k, -(sy - H / 2) * k, 0);
  df.points.scale.setScalar(f);
  df.size = 30 * Math.min(1.5, Math.max(0.5, Math.pow(f, 0.55)));
}
async function startParticles() {
  if (reduce) return;
  try {
    const { createDarkfield } = await import('./particles.js');
    const n = +new URLSearchParams(location.search).get('grains') || undefined;
    df = await createDarkfield(canvas, { base: ASSETS.href, initial: null, ownPointer: false, autoPulse: true, count: n });
    gsap.ticker.add(syncCloud); syncCloud();
    canvas.classList.add('is-ready');
    await df.morph(focus.id, 2.8);
    poster.classList.add('is-gone');
    M.scrubDissolve(df, '#hero');
    new IntersectionObserver(([en]) => (en.isIntersecting ? df.resume() : df.pause())).observe($('#hero'));
  } catch (err) { console.warn('Particles unavailable; the poster stays.', err); df = null; }
}

// ------------------------------------------------------------------ live signals
const sound = {
  on: false, ctx: null,
  ping(freq = 660) {
    if (!this.on) return;
    const c = this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.995, t + 1.2);
    o2.type = 'sine'; o2.frequency.value = freq * 2.01;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g); o2.connect(g); g.connect(c.destination); o.start(t); o2.start(t); o.stop(t + 1.5); o2.stop(t + 1.5);
  },
};
$('#sound').addEventListener('click', (e) => {
  sound.on = !sound.on; const b = e.currentTarget;
  b.setAttribute('aria-pressed', sound.on); b.querySelector('span').textContent = sound.on ? 'Sound on' : 'Sound off';
  if (sound.on) { sound.ctx ??= new (window.AudioContext || window.webkitAudioContext)(); sound.ctx.resume(); sound.ping(495); }
});
const sigEl = $('#signal');
function showEvent(e, live) {
  const hh = e.time.toTimeString().slice(0, 5);
  const extra = e.ms ? ` · ${e.ms} ms` : e.country ? ` · ${e.country}` : e.city ? ` · ${e.city}` : '';
  sigEl.textContent = `${hh} · ${e.label} · ${e.text}${extra}`;
  if (!live) return;
  const tag = plane.querySelector(`[data-tag="${e.product}"]`);
  if (tag) { tag.classList.remove('is-ping'); void tag.offsetWidth; tag.classList.add('is-ping'); }
  if (df && (focus.id === e.product || focus === ORIGIN)) df.pulse((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, focus === ORIGIN ? 0.7 : 1.1);
  if (focus.id === e.product) sound.ping(880);
}
const feed = createFeed();
const last = feed.recent(1)[0]; if (last) showEvent(last, false);
feed.subscribe((e) => showEvent(e, true));

// ------------------------------------------------------------------ hero copy + command
const cmdBtn = $('#cmdCopy');
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 1800); }
async function copyCmd() {
  try { await navigator.clipboard.writeText(content.mcpCommand); } catch { const r = document.createRange(); r.selectNodeContents($('#cmdText')); getSelection().removeAllRanges(); getSelection().addRange(r); }
  cmdBtn.classList.add('is-done'); cmdBtn.querySelector('span').textContent = 'Copied';
  cmdBtn.querySelector('use').setAttribute('href', `${ASSETS}icons/sprite.svg#i-check`);
  M.signal(cmdBtn); toast('MCP command copied');
  df?.pulse(0, 0, 1.4);
  setTimeout(() => { cmdBtn.classList.remove('is-done'); cmdBtn.querySelector('span').textContent = 'Copy'; cmdBtn.querySelector('use').setAttribute('href', `${ASSETS}icons/sprite.svg#i-copy`); }, 1800);
}
cmdBtn.addEventListener('click', copyCmd);
$('#cmdText').textContent = content.mcpCommand;
document.querySelectorAll('[data-email]').forEach((a) => { a.href = `mailto:${content.email}`; a.textContent = content.email; });
$('.foot-avail').lastChild.textContent = ` ${content.availability}`;

// ------------------------------------------------------------------ specimens section
async function buildSpecimens() {
  try { LATIN = (await (await fetch(`${ASSETS}icons/index.json`)).json()).specimens; } catch { LATIN = {}; }
  $('#liveCount').textContent = WORDS[active.length] ?? active.length;
  $('#retiredCount').textContent = (WORDS[retired.length] ?? retired.length).toLowerCase();
  const chip = { 'mcp-emails': 'mcp-emails/icon.png', 'fun-libs': 'fun-libs/icon.png', toolrails: 'toolrails/icon.svg' };
  const glyphs = await Promise.all(active.map((p) => fetch(`${ASSETS}icons/specimens/${p.id}.svg`).then((r) => r.text()).catch(() => '')));
  let harbor = '';
  try { harbor = await (await fetch(`${SHARED}harbor/harbor-mark.svg`)).text(); } catch {}
  $('#specList').innerHTML = active.map((p, i) => {
    const host = p.url ? new URL(p.url).host : '';
    const logo = p.id === 'harbor' ? `<span class="logo-chip harbor" role="img" aria-label="Harbor logo">${harbor.replace(/<\?xml[^>]*>/, '')}</span>` : `<span class="logo-chip"><img src="${SHARED}${chip[p.id]}" alt="${p.name} logo" width="44" height="44" loading="lazy"></span>`;
    const glyph = glyphs[i].replace(/<title>[^<]*<\/title>/, '').replace('<svg ', '<svg class="spec-glyph" aria-hidden="true" focusable="false" ');
    return `<article class="spec" id="spec-${p.id}" aria-labelledby="h-${p.id}">
      <figure class="spec-fig" data-big="${ASSETS}products/slide-${p.id}-1600.webp">
        <img src="${ASSETS}products/slide-${p.id}-800.webp" srcset="${ASSETS}products/slide-${p.id}-800.webp 800w, ${ASSETS}products/slide-${p.id}-1600.webp 1600w" sizes="(max-width: 860px) 92vw, 44vw" width="800" height="1000" loading="lazy" decoding="async" alt="Specimen slide: the ${p.name} logo in a darkfield field of view, with its facts engraved below">
        <img class="tag" src="${ASSETS}extras/tag-${p.status}.svg" alt="" width="84" height="84">
        <span class="loupe" aria-hidden="true"></span>
      </figure>
      <div class="spec-body">
        ${glyph}
        <div class="spec-meta">${logo}<span class="status">No. ${String(i + 1).padStart(2, '0')} · Since ${p.since} · <b>${STATUS[p.status]}</b></span></div>
        <h3 id="h-${p.id}">${p.name}</h3>
        <p class="latin">${(LATIN[p.id] || '').split(', ').pop() || ''}</p>
        <p class="line">${p.line}</p>
        ${p.figure ? `<p class="figure"><b>${p.figure.value}</b><span>${p.figure.label}</span></p>` : ''}
        ${p.facts ? `<ul class="facts">${p.facts.map((f) => `<li>${f}</li>`).join('')}</ul>` : ''}
        ${p.url ? `<a class="visit" href="${p.url}" target="_blank" rel="noopener">${host}<svg aria-hidden="true"><use href="${ASSETS}icons/sprite.svg#i-arrow-ne"/></svg></a>` : ''}
      </div></article>`;
  }).join('');

  $('#archStrip').innerHTML = retired.map((p) => {
    const i = places.findIndex((q) => q.id === p.id);
    const fig = p.figure ? ` ${p.figure.value} ${p.figure.label}.` : '';
    return `<li class="arch">
      <button type="button" class="arch-tile" data-place="${i}" aria-describedby="hc-${p.id}" aria-label="${p.name}: show it on the slide">
        <img src="${ASSETS}products/retired/${p.id}-600.webp" srcset="${ASSETS}products/retired/${p.id}-600.webp 600w, ${ASSETS}products/retired/${p.id}-1200.webp 1200w" sizes="300px" width="600" height="600" alt="" loading="lazy" decoding="async" draggable="false">
      </button>
      <div class="hovercard" id="hc-${p.id}" role="tooltip" data-state="closed" data-side="top"><p class="eyebrow">${p.since} · Retired</p><p>${p.line}${fig}</p></div>
    </li>`;
  }).join('');
  wireSpecimens();
}

function wireSpecimens() {
  // loupe: the 1600px slide under a circular lens with the reticle etched on it
  document.querySelectorAll('.spec-fig').forEach((fig) => {
    const lens = fig.querySelector('.loupe'); const Z = 2.4; let loaded = false;
    fig.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!loaded) { lens.style.backgroundImage = `url(${fig.dataset.big})`; loaded = true; }
      fig.classList.add('is-loupe');
    });
    fig.addEventListener('pointerleave', () => fig.classList.remove('is-loupe'));
    fig.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = fig.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      lens.style.left = `${x}px`; lens.style.top = `${y}px`;
      lens.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      lens.style.backgroundPosition = `${115 - x * Z}px ${115 - y * Z}px`;
    });
  });
  // visit buttons: magnetic, and the fill opens like an iris from where the pointer entered
  document.querySelectorAll('.visit').forEach((a) => {
    const qx = gsap.quickTo(a, 'x', { duration: 0.6, ease: 'expo.out' }), qy = gsap.quickTo(a, 'y', { duration: 0.6, ease: 'expo.out' });
    a.addEventListener('pointerenter', (e) => { const r = a.getBoundingClientRect(); a.style.setProperty('--mx', `${e.clientX - r.left}px`); a.style.setProperty('--my', `${e.clientY - r.top}px`); });
    a.addEventListener('pointermove', (e) => { if (reduce) return; const r = a.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.22); qy((e.clientY - r.top - r.height / 2) * 0.32); });
    a.addEventListener('pointerleave', () => { qx(0); qy(0); });
  });
  // glyphs engrave as their specimen arrives, and again on hover
  document.querySelectorAll('.spec').forEach((spec) => {
    const svg = spec.querySelector('.spec-glyph'); if (!svg) return;
    M.striae(svg);
    ScrollTrigger.create({ trigger: spec, start: 'top 75%', once: true, onEnter: () => M.engrave(svg, { duration: 1.8 }) });
    spec.addEventListener('pointerenter', () => M.engrave(svg, { duration: 0.9 }));
  });
  // archive: Radix-style hover cards (open delay 250ms, close 120ms), focus opens them too
  document.querySelectorAll('.arch').forEach((li) => {
    const card = li.querySelector('.hovercard'), btn = li.querySelector('.arch-tile'); let t;
    const set = (open, delay) => { clearTimeout(t); t = setTimeout(() => { if ((card.dataset.state === 'open') !== open) card.dataset.state = open ? 'open' : 'closed'; }, delay); };
    li.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && set(true, 250));
    li.addEventListener('pointerleave', () => set(false, 120));
    btn.addEventListener('focus', () => set(true, 0)); btn.addEventListener('blur', () => set(false, 0));
    btn.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false, 0); });
    btn.addEventListener('click', () => {
      if (strip.dataset.dragged === '1') return;
      const p = places[+btn.dataset.place];
      scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(() => gotoPlace(p), reduce ? 0 : 500);
    });
  });
  // archive strip: drag to scroll with a little inertia
  const strip = $('#archStrip'); let sd = null;
  strip.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; sd = { x: e.clientX, sl: strip.scrollLeft, v: 0, lx: e.clientX, t: performance.now(), moved: false }; strip.dataset.dragged = '0'; });
  addEventListener('pointermove', (e) => {
    if (!sd) return; const dx = e.clientX - sd.x;
    if (!sd.moved && Math.abs(dx) > 4) { sd.moved = true; strip.classList.add('is-drag'); strip.dataset.dragged = '1'; }
    if (!sd.moved) return;
    const now = performance.now(); sd.v = (e.clientX - sd.lx) / Math.max(1, now - sd.t); sd.lx = e.clientX; sd.t = now;
    strip.scrollLeft = sd.sl - dx;
  });
  addEventListener('pointerup', () => {
    if (!sd) return; const d = sd; sd = null; strip.classList.remove('is-drag');
    if (d.moved && !reduce) gsap.to(strip, { scrollLeft: strip.scrollLeft - d.v * 320, duration: 1, ease: 'expo.out' });
    setTimeout(() => { strip.dataset.dragged = '0'; }, 50);
  });

  sweep(document.querySelectorAll('.spec-fig, .spec-body, .arch, .plate'));
  ScrollTrigger.refresh();
}

// Stage sweep (the kit's motion), driven by an IntersectionObserver so it never strands an element hidden.
function sweep(list) {
  if (reduce) return;
  const below = [...list].filter((el) => el.getBoundingClientRect().top > innerHeight * 0.9);
  gsap.set(below, { opacity: 0, y: 48, filter: 'blur(6px)' });
  let queue = [], raf = 0;
  const io = new IntersectionObserver((ens) => {
    ens.forEach((en) => { if (en.isIntersecting) { queue.push(en.target); io.unobserve(en.target); io.__pending?.delete(en.target); } });
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { gsap.to(queue, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: M.EASE.focus, stagger: 0.09, overwrite: true }); queue = []; });
  }, { rootMargin: '0px 0px -8% 0px' });
  below.forEach((el) => io.observe(el));
  // belt and braces: a passive scroll check reveals anything the observer has not reported yet
  const pending = new Set(below);
  const check = () => {
    for (const el of pending) if (el.getBoundingClientRect().top < innerHeight * 0.95) { pending.delete(el); io.unobserve(el); gsap.to(el, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: M.EASE.focus }); }
    if (!pending.size) removeEventListener('scroll', check);
  };
  io.__pending = pending;
  addEventListener('scroll', check, { passive: true });
}

// ------------------------------------------------------------------ scroll motion
function scrollMotion() {
  document.querySelectorAll('.sec-head h2, .plates-text h2, .arch-head h3').forEach((h) => {
    ScrollTrigger.create({ trigger: h, start: 'top 85%', once: true, onEnter: () => M.focusPull(h, { stagger: 0.045 }) });
  });
  if (reduce) return;
  gsap.to('.hud-title', { y: -90, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 30%', scrub: 0.6 } });
  gsap.to('.hud-objective, .hud-map', { y: -50, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: '30% top', end: 'bottom 40%', scrub: 0.6 } });
  [['.p1 img', 10], ['.p2 img', -6], ['.p3 img', 14]].forEach(([s, v]) => gsap.fromTo(s, { yPercent: v }, { yPercent: -v, ease: 'none', scrollTrigger: { trigger: '.plates', start: 'top bottom', end: 'bottom top', scrub: true } }));
  const nav = $('#nav');
  ScrollTrigger.create({ start: () => innerHeight * 0.8, onToggle: (st) => nav.classList.toggle('is-solid', st.isActive) });
}

// ------------------------------------------------------------------ keys
const heroVisible = () => $('#hero').getBoundingClientRect().bottom > innerHeight * 0.4;
const groups = DEFAULT_GROUPS.map((g) => ({ ...g, items: g.items.map((it) => it.id === 'home' ? { ...it, label: 'Back to the stone' } : it.id === 'goto' ? { ...it, label: 'Go to a specimen (1–4 live)' } : it) }));
const keys = createShortcuts({ groups, on: {
  goto: (n) => { if (!heroVisible()) scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); places[n - 1] && gotoPlace(places[n - 1]); },
  fit: () => home(1.4), 'zoom-in': () => zoomBy(1.4), 'zoom-out': () => zoomBy(1 / 1.4),
  pan: (e) => {
    if (!heroVisible()) { scrollBy({ top: { ArrowUp: -90, ArrowDown: 90 }[e.key] || 0 }); return; }
    const dx = { ArrowLeft: 220, ArrowRight: -220 }[e.key] || 0, dy = { ArrowUp: 220, ArrowDown: -220 }[e.key] || 0;
    anim?.kill(); anim = gsap.to(view, { x: view.x + dx, y: view.y + dy, duration: reduce ? 0 : 0.6, ease: 'expo.out', onUpdate: apply, onComplete: settle });
  },
  next: () => step(1), prev: () => step(-1),
  signal: () => { if (!heroVisible()) { scrollBy({ top: innerHeight * 0.8 }); return; } df?.pulse((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 1.4); sound.ping(660); },
  home: () => gotoPlace(ORIGIN),
  open: () => { const p = byId[focus.id]; if (p?.url && heroVisible()) open(p.url, '_blank', 'noopener'); },
  'copy-mcp': copyCmd,
  mail: () => { location.href = `mailto:${content.email}`; },
  grain: () => { const g = $('#grain'); g.toggleAttribute('hidden'); toast(g.hidden ? 'Grain off' : 'Grain on'); },
} });
$('#footKeys').addEventListener('click', () => keys.open());
const hintStyle = document.createElement('style');
hintStyle.textContent = '@media (max-width: 760px), (hover: none) { body .dfk-hint { display: none; } }';
document.head.append(hintStyle);

// ------------------------------------------------------------------ boot
function resize() {
  const c0 = centre(); const wx = (c0.cx - view.x) / view.s, wy = (c0.cy - view.y) / view.s;
  W = stage.clientWidth; H = stage.clientHeight;
  const c = centre(); view.x = c.cx - wx * view.s; view.y = c.cy - wy * view.s; apply();
}
new ResizeObserver(() => resize()).observe(stage);

(function intro() {
  const s = homeScale();
  if (reduce) { const c = centre(); view.s = s; view.x = c.cx; view.y = c.cy; apply(); const deep = places.find((p) => location.hash === `#at-${p.id}`); if (deep) gotoPlace(deep); return; }
  const c = centre(); const s0 = Math.min(W, H) * (phone() ? 0.95 : 0.8) / 990;
  view.s = s0; view.x = c.cx; view.y = c.cy; apply();
  const deep = places.find((p) => location.hash === `#at-${p.id}`);
  if (deep) { gotoPlace(deep); anim.progress(1); return; }
  setTimeout(() => flyTo(0, 0, s, 3.2), 1300);
})();
M.focusPull($('#hero-title'), { delay: 0.15, stagger: 0.08, duration: 1.4 });
if (!reduce) gsap.from('.hud-title .lede, .hud-title .cmd, .hud-title .eyebrow, .hud-objective, .hud-map, .hud-hint', { opacity: 0, y: 14, filter: 'blur(8px)', duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.5 });
buildSpecimens().then(scrollMotion);
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
if (document.readyState === 'complete') idle(startParticles, { timeout: 1200 }); else addEventListener('load', () => idle(startParticles, { timeout: 1200 }));
