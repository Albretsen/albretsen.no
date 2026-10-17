// Specimen Atlas — albretsen.no, design 40.
// Hand-rolled springs (assets/motion.js), DOM drag/flip/stack, a brass loupe
// that reads Haeckel's engraving under the render, and the sun over Oslo.
import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';
import { Spring, loop, settle, loupe as loupeTilt, specimenStack, daylight, PHASE_CAPTION } from '../assets/motion.js';
import { sound } from './sound.js';

const $ = (s, r = document) => r.querySelector(s);
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const pinned = root.dataset.pinned || null;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ------------------------------------------------------------------ */
/* Daylight: the page reads the sun over Oslo every minute             */
/* ------------------------------------------------------------------ */
root.addEventListener('daylight', () => {
  if (!pinned) return;
  root.dataset.phase = pinned;
  document.querySelectorAll('[data-daylight]').forEach(el => { el.textContent = `${PHASE_CAPTION[pinned]} · pinned for review`; });
});
daylight({ every: 60000 });
const themeMeta = $('meta[name="theme-color"]');
const syncTheme = () => { themeMeta.content = /blåtime|natt/.test(root.dataset.phase) ? '#0f2219' : '#f6f0e0'; };
syncTheme(); root.addEventListener('daylight', syncTheme);

/* ------------------------------------------------------------------ */
/* Hero geometry: where the photographed specimen sits on screen       */
/* ------------------------------------------------------------------ */
const hero = $('#hero'), stage = $('#stage');
const portraitMQ = matchMedia('(max-aspect-ratio: 3/4)');
function geom() {
  const W = hero.clientWidth, H = hero.clientHeight;
  const P = portraitMQ.matches;
  const [iw0, ih0, fy, fd] = P ? [1290, 2200, 0.41, 0.9] : [1440, 900, 0.427, 0.48];
  const s = Math.max(W / iw0, H / ih0), iw = iw0 * s, ih = ih0 * s;
  const ox = (W - iw) / 2, oy = (H - ih) / 2;
  return { W, H, cx: ox + iw / 2, cy: oy + ih * fy, D: iw * fd };
}
let G = geom();
function placeStage() {
  const side = G.D / 0.78;
  Object.assign(stage.style, { width: side + 'px', height: side + 'px', transform: `translate(${G.cx - side / 2}px, ${G.cy - side / 2}px)` });
}
placeStage();

/* ------------------------------------------------------------------ */
/* The brass loupe: drag it (springs, momentum), it shows the 1887 plate */
/* ------------------------------------------------------------------ */
const lt = $('#loupe'), lensImg = $('.lens-img', lt), hint = $('#loupe-hint');
const ENGR = { w: 1200, h: 1331, cx: 600, cy: 665, span: 1080 }; // engraving centre and spine span (px)
const MAG = 1.7;
const follow = { stiffness: 520, damping: 34, mass: 1 }, glide = { stiffness: 110, damping: 17, mass: 1 };
const lx = new Spring(0, follow), ly = new Spring(0, follow), lr = new Spring(0, { stiffness: 260, damping: 16 }), lz = new Spring(1, { stiffness: 380, damping: 22 });
let rel = portraitMQ.matches ? { u: 0.38, v: -0.3 } : { u: 0.42, v: 0.2 }; // loupe position relative to the specimen, in diameters
let R = 0, loupeRunning = false;
function boundsFor(x, y) {
  const m = R * 0.6;
  return [clamp(x, m, G.W - m), clamp(y, m + 40, G.H - m)];
}
function renderLoupe() {
  const x = lx.value, y = ly.value;
  lt.style.transform = `translate(${x - R}px, ${y - R}px) rotate(${lr.value}deg) scale(${lz.value})`;
  // engraving under the lens: same organism, same place, magnified
  const s = G.D / ENGR.span, k = s * MAG, inner = R * 0.9;
  const ix = ENGR.cx + (x - G.cx) / s, iy = ENGR.cy + (y - G.cy) / s;
  lensImg.style.backgroundSize = `${ENGR.w * k}px ${ENGR.h * k}px`;
  lensImg.style.backgroundPosition = `${inner - ix * k}px ${inner - iy * k}px`;
  lensImg.style.transform = `rotate(${-lr.value}deg)`;
  if (!hint.classList.contains('gone')) {
    const hw = hint.offsetWidth, left = x - R - hw - 14;
    hint.style.transform = left > 12 ? `translate(${left}px, ${y - 8}px)` : `translate(${clamp(x - hw / 2, 12, G.W - hw - 12)}px, ${y + R + 10}px)`;
  }
}
function runLoupe() {
  if (loupeRunning) return; loupeRunning = true;
  loop(dt => { const a = lx.step(dt), b = ly.step(dt), c = lr.step(dt), d = lz.step(dt); renderLoupe(); return (loupeRunning = a || b || c || d); });
}
function placeLoupe(jump) {
  R = lt.offsetWidth / 2;
  const [x, y] = boundsFor(G.cx + rel.u * G.D, G.cy + rel.v * G.D);
  if (jump) { lx.jump(x); ly.jump(y); renderLoupe(); } else { lx.set(x); ly.set(y); runLoupe(); }
}
placeLoupe(true); lt.classList.add('ready');
const remember = () => { rel = { u: (lx.target - G.cx) / G.D, v: (ly.target - G.cy) / G.D }; };
{
  let drag = null;
  lt.addEventListener('pointerdown', e => {
    lt.setPointerCapture(e.pointerId);
    drag = { dx: e.clientX - lx.value, dy: e.clientY - ly.value, px: e.clientX, py: e.clientY, t: performance.now(), vx: 0, vy: 0 };
    Object.assign(lx, follow); Object.assign(ly, follow);
    lz.set(1.06); hint.classList.add('gone'); sound.play('lift'); runLoupe();
  });
  lt.addEventListener('pointermove', e => {
    if (!drag) return;
    const now = performance.now(), dt = Math.max(8, now - drag.t);
    drag.vx = drag.vx * 0.6 + ((e.clientX - drag.px) / dt * 1000) * 0.4;
    drag.vy = drag.vy * 0.6 + ((e.clientY - drag.py) / dt * 1000) * 0.4;
    drag.px = e.clientX; drag.py = e.clientY; drag.t = now;
    const [x, y] = boundsFor(e.clientX - drag.dx, e.clientY - drag.dy);
    if (reduce) { lx.jump(x); ly.jump(y); } else { lx.set(x); ly.set(y); }
    lr.set(clamp(drag.vx * 0.012, -14, 14));
    runLoupe();
  });
  const up = () => {
    if (!drag) return;
    const { vx, vy } = drag; drag = null;
    if (!reduce) {
      Object.assign(lx, glide); Object.assign(ly, glide);
      const [x, y] = boundsFor(lx.value + vx * 0.16, ly.value + vy * 0.16);
      lx.set(x); ly.set(y); lx.velocity = vx * 0.5; ly.velocity = vy * 0.5;
    }
    lr.set(0); lz.set(1); sound.play('set'); remember(); runLoupe();
  };
  lt.addEventListener('pointerup', up); lt.addEventListener('pointercancel', up);
  lt.addEventListener('keydown', e => {
    const step = e.shiftKey ? 80 : 20, map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!map) return;
    e.preventDefault(); hint.classList.add('gone');
    Object.assign(lx, glide); Object.assign(ly, glide);
    const [x, y] = boundsFor(lx.target + map[0] * step, ly.target + map[1] * step);
    lx.set(x); ly.set(y); lr.set(map[0] * 4); setTimeout(() => { lr.set(0); runLoupe(); }, 120);
    remember(); runLoupe();
  });
}

let resizeT = 0;
new ResizeObserver(() => { cancelAnimationFrame(resizeT); resizeT = requestAnimationFrame(() => { G = geom(); placeStage(); placeLoupe(true); }); }).observe(hero);

/* ------------------------------------------------------------------ */
/* Photograph / Live: the still defocuses and the specimen comes alive  */
/* ------------------------------------------------------------------ */
const modes = $('.modes'), pill = $('.modes-pill'), modeBtns = [...modes.querySelectorAll('[data-mode]')];
const pillX = new Spring(0, { stiffness: 380, damping: 30 }), pillW = new Spring(0, { stiffness: 380, damping: 30 });
let pillRun = false;
function movePill(btn, jump) {
  const x = btn.offsetLeft - 3, w = btn.offsetWidth;
  if (jump || reduce) { pillX.jump(x); pillW.jump(w); } else { pillX.set(x); pillW.set(w); }
  if (pillRun) return; pillRun = true;
  loop(dt => { const a = pillX.step(dt), b = pillW.step(dt); pill.style.transform = `translateX(${pillX.value}px)`; pill.style.width = pillW.value + 'px'; return (pillRun = a || b); });
}
let live = null, liveLoading = null, mode = 'still';
async function mountLive() {
  if (live) return live;
  if (liveLoading) return liveLoading;
  liveLoading = (async () => {
    const { mountSpecimen } = await import('../assets/3d/specimen.js');
    live = await mountSpecimen(stage, { phase: pinned || 'auto', autoRotate: reduce ? 0 : 0.12 });
    root.addEventListener('daylight', e => live.setPhase(pinned || e.detail.phase));
    return live;
  })().catch(err => { console.warn('Live specimen unavailable', err); modes.hidden = true; return null; });
  return liveLoading;
}
async function setMode(m) {
  mode = m;
  modeBtns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.mode === m)));
  movePill(modeBtns.find(b => b.dataset.mode === m));
  if (m === 'live') { const ok = await mountLive(); if (ok && mode === 'live') { hero.classList.add('is-live'); stage.removeAttribute('aria-hidden'); sound.play('focus'); } }
  else { hero.classList.remove('is-live'); stage.setAttribute('aria-hidden', 'true'); }
}
modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
modes.addEventListener('keydown', e => {
  if (!/Arrow(Left|Right|Up|Down)/.test(e.key)) return;
  e.preventDefault(); const next = mode === 'still' ? 'live' : 'still';
  setMode(next); modeBtns.find(b => b.dataset.mode === next).focus();
});
modeBtns.forEach(b => b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1);
modes.addEventListener('click', () => modeBtns.forEach(b => b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1));
const checkedBtn = () => modeBtns.find(b => b.getAttribute('aria-checked') === 'true');
document.fonts.ready.then(() => movePill(checkedBtn(), true));
movePill(checkedBtn(), true);
// grabbing the specimen itself brings it to life
stage.addEventListener('pointerdown', () => { if (mode !== 'live') setMode('live'); });

const capable = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
if (!capable) modes.hidden = true;
else if (params.get('live') === '1') setMode('live');
else if (!reduce && !navigator.connection?.saveData && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  // desktop: warm the live specimen while the visitor looks at the photograph
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200));
  addEventListener('load', () => idle(() => mountLive(), { timeout: 3000 }));
}

/* ------------------------------------------------------------------ */
/* Copy the MCP command (origin-aware tooltip)                          */
/* ------------------------------------------------------------------ */
document.querySelectorAll('[data-copy]').forEach(btn => {
  const tip = $('#' + btn.getAttribute('aria-describedby'));
  let t = 0;
  btn.addEventListener('click', async () => {
    const text = $(btn.dataset.copy).textContent.trim();
    let ok = true; try { await navigator.clipboard.writeText(text); } catch { ok = false; }
    tip.textContent = ok ? 'Copied' : 'Select and copy';
    tip.classList.remove('hide'); void tip.offsetWidth; tip.classList.add('show'); sound.play('tick');
    clearTimeout(t); t = setTimeout(() => { tip.classList.replace('show', 'hide'); setTimeout(() => { tip.textContent = ''; tip.classList.remove('hide'); }, 160); }, 1500);
  });
});

/* ------------------------------------------------------------------ */
/* Signal: one line of the live feed                                    */
/* ------------------------------------------------------------------ */
{
  const el = $('#signal-text'), dot = $('.signal-dot'), feed = createFeed();
  const fmt = e => {
    const where = e.country || e.city;
    const extra = where ? ` · ${where}` : e.ms ? ` · ${e.ms} ms` : e.sha ? ` · ${e.sha}` : '';
    return `${e.label} · ${e.text}${extra}`;
  };
  const show = (e, animate) => {
    if (!animate || reduce) { el.textContent = fmt(e); return; }
    el.classList.add('out');
    setTimeout(() => { el.textContent = fmt(e); el.classList.remove('out'); dot.classList.remove('ping'); void dot.offsetWidth; dot.classList.add('ping'); }, 220);
  };
  const first = feed.recent(1)[0]; if (first) show(first, false);
  feed.subscribe(e => show(e, true));
}

/* ------------------------------------------------------------------ */
/* The atlas: a stack of plates you can drag, flick and turn over       */
/* ------------------------------------------------------------------ */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const plates = content.products.filter(p => ['live', 'building', 'paused'].includes(p.status));
const allNo = id => String(content.products.findIndex(p => p.id === id) + 1).padStart(2, '0');
const host = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const stackEl = $('#stack'), indexEl = $('#index-list'), detailEl = $('#detail');
stackEl.innerHTML = plates.map((p, i) => `
  <article class="plate" aria-label="Plate ${ROMAN[i]}: ${esc(p.name)}, ${p.status}">
    <div class="plate-front">
      <img src="assets/products/plate-${p.id}.webp" srcset="assets/products/plate-${p.id}.webp 800w, assets/products/plate-${p.id}@2x.webp 1600w" sizes="(max-width: 860px) 92vw, 640px"
        width="800" height="600" alt="${esc(p.name)} specimen plate: the real ${esc(p.name)} logo printed on a cream specimen card, a brass loupe over the ${p.status} stamp." draggable="false" ${i ? 'loading="lazy"' : ''} decoding="async">
      <div class="cap mono"><span>Pl. ${ROMAN[i]}</span><span>${esc(p.name)}</span></div>
    </div>
    <div class="plate-back">
      <div><span class="mono">Specimen No. ${allNo(p.id)} · Coll. ${p.since} · ${p.status}</span><h3>${esc(p.name)}</h3><p>${esc(p.line)}</p></div>
      <div>${p.figure ? `<div class="bfig">${esc(p.figure.value)}<small>${esc(p.figure.label)}</small></div>` : ''}
        <ul>${(p.facts || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
      <div class="mono">${p.url ? esc(host(p.url)) : ''}</div>
      <img class="lattice" src="assets/identity/logo-mark.svg" alt="" width="64" height="64">
    </div>
  </article>`).join('');
indexEl.innerHTML = plates.map((p, i) => `
  <li><button type="button" data-i="${i}"><span class="bar" aria-hidden="true"></span><span class="no">Pl. ${ROMAN[i]}</span><span class="nm">${esc(p.name)}</span><span class="st">${p.status}</span></button></li>`).join('');
const idxBtns = [...indexEl.querySelectorAll('button')];

const dOp = new Spring(1, { stiffness: 300, damping: 30 });
let top = 0, detailRun = false;
function renderDetail(i) {
  const p = plates[i];
  return `<div class="d-in">
    <div class="d-meta mono"><span class="d-status ${p.status === 'live' ? 'live' : ''}">${p.status}</span><span>Specimen No. ${allNo(p.id)}</span><span>Since ${p.since}</span></div>
    <p class="d-line">${esc(p.line)}</p>
    ${p.figure ? `<p class="d-fig"><b>${esc(p.figure.value)}</b><span class="mono">${esc(p.figure.label)}</span></p>` : ''}
    <ul class="d-facts">${(p.facts || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    ${p.url ? `<a class="visit magnetic" href="${p.url}" rel="noopener">${esc(host(p.url))} <span class="ar" aria-hidden="true">↗</span></a>` : ''}
  </div>`;
}
function showDetail(i, animate) {
  idxBtns.forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
  if (!animate || reduce) { detailEl.innerHTML = renderDetail(i); magnetize(detailEl); return; }
  // out: quick fade with blur (hides the crossfade seam), in: settle spring
  const old = $('.d-in', detailEl);
  if (old) { old.style.transition = 'opacity .12s ease-in, filter .12s ease-in'; old.style.opacity = 0; old.style.filter = 'blur(4px)'; }
  setTimeout(() => {
    detailEl.innerHTML = renderDetail(i); magnetize(detailEl);
    const el = $('.d-in', detailEl);
    dOp.jump(0); dOp.set(1);
    if (detailRun) return; detailRun = true;
    loop(dt => {
      const go = dOp.step(dt), v = dOp.value, cur = $('.d-in', detailEl);
      if (cur) { cur.style.opacity = Math.min(1, v * 1.3); cur.style.transform = `translateY(${(1 - v) * 14}px)`; cur.style.filter = v < .97 ? `blur(${(1 - v) * 5}px)` : ''; }
      return (detailRun = go);
    });
    void el;
  }, 120);
}
const stackApi = specimenStack(stackEl, {
  onChange: t => { if (t === top && detailEl.innerHTML) return; const first = !detailEl.innerHTML; top = t; showDetail(t, !first); if (!first) sound.play('paper'); },
});
// the plate turn gets its own sound
stackEl.addEventListener('pointerup', () => setTimeout(() => sound.play('flip'), 0));
idxBtns.forEach(b => b.addEventListener('click', () => {
  const i = +b.dataset.i, n = plates.length, fwd = (i - top + n) % n;
  if (!fwd) { stackApi.flip(); sound.play('flip'); return; }
  const back = fwd > n / 2, steps = back ? n - fwd : fwd;
  for (let k = 0; k < steps; k++) setTimeout(() => (back ? stackApi.prev() : stackApi.next()), k * 110);
}));

/* ------------------------------------------------------------------ */
/* The drawer: retired tags you can pick up and throw                   */
/* ------------------------------------------------------------------ */
const retired = content.products.filter(p => p.status === 'retired');
const tagsEl = $('#tags'), drawer = $('#drawer');
tagsEl.innerHTML = retired.map(p => {
  const label = `${p.name}, ${p.since}, retired. ${p.line}`;
  if (p.id === 'luma') return `<li class="tag" tabindex="0" aria-label="${esc(label)} Arrow keys move the tag.">
    <div class="luma-tag"><div class="body"><span class="mono">No. ${allNo(p.id)} · ${p.since}</span><img src="../_shared/products/luma/logo.png" alt="" width="782" height="217" loading="lazy"><span class="mono ret">Retired</span></div></div></li>`;
  return `<li class="tag" tabindex="0" aria-label="${esc(label)} Arrow keys move the tag."><img src="assets/retired/${p.id}.svg" alt="" width="420" height="210" loading="lazy" decoding="async"></li>`;
}).join('');
{
  const tags = [...tagsEl.children];
  const R = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(0xf57ae7);
  const held = { stiffness: 600, damping: 38 }, thrown = { stiffness: 90, damping: 16 };
  const st = tags.map((el, i) => ({ el, x: new Spring(0, held), y: new Spring(0, held), r: new Spring(0, { stiffness: 200, damping: 14 }), s: new Spring(1, { stiffness: 400, damping: 24 }), base: (R() - .5) * 14, jx: R() - .5, jy: R() - .5, z: i + 1 }));
  let Z = tags.length + 1, W = 0, H = 0, tw = 0, th = 0, running = false;
  const render = () => st.forEach(t => { t.el.style.transform = `translate(${t.x.value}px, ${t.y.value}px) rotate(${t.r.value}deg) scale(${t.s.value})`; t.el.style.zIndex = t.z; });
  const run = () => { if (running) return; running = true; loop(dt => { let m = false; st.forEach(t => { m = t.x.step(dt) | t.y.step(dt) | t.r.step(dt) | t.s.step(dt) || m; }); render(); return (running = m); }); };
  const inBounds = (x, y) => [clamp(x, -tw * 0.08, W - tw * 0.92), clamp(y, -th * 0.1, H - th * 0.9)];
  function layout() {
    drawer.classList.add('physics');
    tw = tags[0].offsetWidth; th = tw / 2; W = tagsEl.clientWidth || drawer.clientWidth - 36;
    const cols = clamp(Math.floor(W / (tw * 1.08)), 1, 4), rows = Math.ceil(tags.length / cols);
    const cw = W / cols, ch = th * (cols === 1 ? 0.78 : 1.35);
    H = rows * ch + th * (cols === 1 ? 0.5 : 0.15);
    tagsEl.style.height = H + 'px';
    st.forEach((t, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = c * cw + (cw - tw) / 2 + t.jx * Math.max(0, cw - tw) * 0.7 + (cols === 1 ? t.jx * 40 : 0), y = r * ch + t.jy * th * 0.25 + 6;
      const [bx, by] = inBounds(x, y);
      t.x.jump(bx); t.y.jump(by); t.r.jump(t.base);
    });
    render();
  }
  layout();
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; layout(); } });
  // a gentle settle when the drawer first scrolls into view: tags drop in
  if (!reduce) new IntersectionObserver(([e], io) => { if (!e.isIntersecting) return; io.disconnect();
    st.forEach((t, i) => { const y = t.y.target; t.y.jump(y - 60 - i * 8); t.r.jump(t.base + (i % 2 ? 12 : -12)); t.y.stiffness = 140; t.y.damping = 14; setTimeout(() => { t.y.set(y); t.r.set(t.base); run(); setTimeout(() => Object.assign(t.y, held), 900); }, i * 60); });
    render();
  }, { threshold: .3 }).observe(drawer);

  let drag = null;
  st.forEach(t => {
    t.el.addEventListener('pointerdown', e => {
      t.el.setPointerCapture(e.pointerId);
      t.z = ++Z; t.el.classList.add('held');
      Object.assign(t.x, held); Object.assign(t.y, held);
      drag = { t, dx: e.clientX - t.x.value, dy: e.clientY - t.y.value, px: e.clientX, py: e.clientY, tm: performance.now(), vx: 0, vy: 0 };
      t.s.set(1.05); sound.play('lift'); run();
    });
    t.el.addEventListener('pointermove', e => {
      if (!drag || drag.t !== t) return;
      const now = performance.now(), dt = Math.max(8, now - drag.tm);
      drag.vx = drag.vx * .6 + (e.clientX - drag.px) / dt * 1000 * .4; drag.vy = drag.vy * .6 + (e.clientY - drag.py) / dt * 1000 * .4;
      drag.px = e.clientX; drag.py = e.clientY; drag.tm = now;
      const [x, y] = inBounds(e.clientX - drag.dx, e.clientY - drag.dy);
      t.x.set(x); t.y.set(y); t.r.set(t.base + clamp(drag.vx * 0.02, -20, 20)); run();
    });
    const up = () => {
      if (!drag || drag.t !== t) return;
      const { vx, vy } = drag; drag = null; t.el.classList.remove('held');
      if (!reduce) { Object.assign(t.x, thrown); Object.assign(t.y, thrown); }
      const [x, y] = inBounds(t.x.value + vx * 0.2, t.y.value + vy * 0.2);
      t.x.set(x); t.y.set(y); t.base = clamp(t.base + vx * 0.004, -16, 16); t.r.set(t.base); t.s.set(1); sound.play('set'); run();
    };
    t.el.addEventListener('pointerup', up); t.el.addEventListener('pointercancel', up);
    t.el.addEventListener('keydown', e => {
      const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!map) return; e.preventDefault(); t.z = ++Z;
      const k = e.shiftKey ? 80 : 24, [x, y] = inBounds(t.x.target + map[0] * k, t.y.target + map[1] * k);
      Object.assign(t.x, thrown); Object.assign(t.y, thrown); t.x.set(x); t.y.set(y); run();
    });
  });
}

/* ------------------------------------------------------------------ */
/* Magnetic links: they lean toward the pointer on a spring             */
/* ------------------------------------------------------------------ */
function magnetize(scope = document) {
  if (reduce || !matchMedia('(hover: hover)').matches) return;
  scope.querySelectorAll('.magnetic:not([data-mag])').forEach(el => {
    el.dataset.mag = '1';
    const x = new Spring(0, { stiffness: 220, damping: 18 }), y = new Spring(0, { stiffness: 220, damping: 18 });
    let on = false;
    const run = () => { if (on) return; on = true; loop(dt => { const a = x.step(dt), b = y.step(dt); el.style.transform = `translate(${x.value}px, ${y.value}px)`; return (on = a || b); }); };
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * 0.22); y.set((e.clientY - r.top - r.height / 2) * 0.3); run(); });
    el.addEventListener('pointerleave', () => { x.set(0); y.set(0); run(); });
  });
}
magnetize();

/* ------------------------------------------------------------------ */
/* Settle entrances, Loupe tilt on the figures, sound toggle            */
/* ------------------------------------------------------------------ */
settle(document, { stagger: 80 });
if (matchMedia('(hover: hover)').matches) document.querySelectorAll('.fig.loupe, .drawer-print.loupe').forEach(el => loupeTilt(el, { max: 5 }));
{
  const btn = $('[data-sound]'), lab = $('.sound-label', btn);
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    sound.enable(on); btn.setAttribute('aria-pressed', String(on)); lab.textContent = on ? 'Sound on' : 'Sound off';
    if (on) sound.play('tick');
  });
}
