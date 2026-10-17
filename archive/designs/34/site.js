// site.js — design 34 "Tension Prism": hero + products for Albretsen AS.
import { content } from '../_shared/content.js';
import { createFeed, formatTime } from '../_shared/feed.js';
import { PrismWordmark } from './assets/interactive/prism-wordmark.js';
import { initPrismCursor } from './assets/interactive/prism-cursor.js';
import { initMotion } from './assets/motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const host = (u) => u ? new URL(u).host : '';

const P = '../_shared/products/';
const HARBOR_SVG = `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M 12 26 Q 12 14 24 14 L 28.5 14 L 32 19.5 L 35.5 14 L 40 14 Q 52 14 52 26 L 52 40 Q 52 52 40 52 L 24 52 Q 12 52 12 40 Z" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" fill="none"/><circle cx="32" cy="35" r="3" fill="currentColor"/></svg>`;
const LOGO = {
  'mcp-emails': `<span class="pcard-logo"><img src="${P}mcp-emails/favicon.svg" alt="" width="40" height="40"></span>`,
  'fun-libs': `<span class="pcard-logo"><img src="${P}fun-libs/icon.png" alt="" width="40" height="40"></span>`,
  toolrails: `<span class="pcard-logo"><img src="${P}toolrails/icon.svg" alt="" width="40" height="40"></span>`,
  harbor: `<span class="pcard-logo harbor">${HARBOR_SVG}</span>`,
};
const FEED_LOGO = {
  'mcp-emails': `${P}mcp-emails/favicon.svg`, 'fun-libs': `${P}fun-libs/icon.png`,
  toolrails: `${P}toolrails/icon.svg`, 'albretsen.no': 'assets/identity/favicon-small.svg',
};
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' };
const WORD = { 'mcp-emails': 'MCP EMAILS', 'fun-libs': 'FUN LIBS', toolrails: 'TOOLRAILS', harbor: 'HARBOR' };

const live = content.products.filter((p) => p.status !== 'retired');
const retired = content.products.filter((p) => p.status === 'retired');
const byId = Object.fromEntries(content.products.map((p) => [p.id, p]));
const img = (id, sizes) => `<img src="assets/products/${id}.webp" srcset="assets/products/${id}.webp 1200w, assets/products/${id}@2x.webp 2400w" sizes="${sizes}" width="1200" height="750" loading="lazy" alt="${esc(byId[id].name)} icon on black mirror glass beside a glass prism">`;

/* ── render content ─────────────────────────────────── */
function renderProducts() {
  const track = $('#track');
  live.forEach((p, i) => {
    const w = document.createElement('div');
    w.className = 'pcard-wrap ts-crystallize';
    w.style.setProperty('--i', i);
    w.innerHTML = `<article class="pcard ts-glass" id="card-${p.id}" aria-labelledby="h-${p.id}">
      <div class="glare" aria-hidden="true"></div>
      <div class="pcard-img"><span class="status ${p.status}">${STATUS[p.status]}</span>${img(p.id, '(min-width: 900px) 42vw, 100vw')}</div>
      <div class="pcard-body">
        <div class="pcard-id">${LOGO[p.id]}<div><h3 id="h-${p.id}">${esc(p.name)}</h3><span class="since">Since ${p.since} · ${host(p.url)}</span></div></div>
        <p class="pcard-line">${esc(p.line)}</p>
        ${p.facts ? `<ul class="facts">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
        <div class="pcard-row">
          ${p.figure ? `<p class="pcard-fig"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></p>` : '<span></span>'}
          <div class="pcard-actions">
            <button class="btn" type="button" data-ts-dialog-open="#pdlg" data-pid="${p.id}" data-cursor="Open">Details</button>
            <a class="btn primary" href="${p.url}" target="_blank" rel="noopener" data-cursor="Visit">Visit<span aria-hidden="true"> ↗</span><span class="sr-only"> ${esc(p.name)} (opens in a new tab)</span></a>
          </div>
        </div>
      </div>
    </article>`;
    track.append(w);
  });
  // hero spectrum panels
  for (const panel of $$('.spec-panel[data-product]')) {
    const p = byId[panel.dataset.product];
    if (!p) continue;
    panel.innerHTML = `<p class="spec-line">${esc(p.line)}</p>
      <p class="spec-fig"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span>
      <button class="btn" type="button" data-ts-dialog-open="#pdlg" data-pid="${p.id}" data-cursor="Open">${STATUS[p.status]} · details</button></p>`;
  }
  // retired
  $('#retired-count').textContent = `${retired.length} products`;
  $('#retired').innerHTML = retired.map((p) => `<article class="rcard ts-glass">
      <div class="rcard-img ${p.id === 'luma' ? 'luma' : ''}">${p.id === 'luma'
        ? `<img src="${P}luma/logo.png" alt="Luma logo" loading="lazy">`
        : `<img src="assets/retired/${p.id}.svg" alt="" loading="lazy" width="320" height="320">`}</div>
      <h4>${esc(p.name)}</h4>
      <p>${esc(p.line)}</p>
      <span class="yr">${p.since}${p.figure ? ` · ${esc(p.figure.value)} ${esc(p.figure.label)}` : ''}</span>
    </article>`).join('');
  $('#dayjob').innerHTML = content.dayJob.map((d) => `<li class="ts-glass">${esc(d)}</li>`).join('');
}

/* ── product dialog (Radix-style, ts-prism-split) ───── */
function fillDialog(id) {
  const p = byId[id];
  $('#pdlg').innerHTML = `<div class="pdlg ts-glass">
    <button class="pdlg-x" type="button" data-ts-dialog-close aria-label="Close"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13"/></svg></button>
    <div class="pdlg-img">${img(p.id, '560px').replace('loading="lazy"', '')}</div>
    <div class="pdlg-body">
      <div class="pcard-id">${LOGO[p.id]}<h2 id="pdlg-title">${esc(p.name)}</h2></div>
      <p>${esc(p.line)}</p>
      <dl class="pdlg-meta">
        <div><dt>Since</dt><dd>${p.since}</dd></div>
        <div><dt>Status</dt><dd>${STATUS[p.status]}</dd></div>
        ${p.figure ? `<div><dt>${esc(p.figure.label)}</dt><dd>${esc(p.figure.value)}</dd></div>` : ''}
      </dl>
      ${p.facts ? `<ul class="facts">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      <div class="pdlg-actions"><a class="btn primary" href="${p.url}" target="_blank" rel="noopener">Visit ${host(p.url)} ↗</a><button class="btn" type="button" data-ts-dialog-close>Close</button></div>
    </div></div>`;
}

/* ── wordmark + light path ──────────────────────────── */
let pw = null;
const hero = $('.hero');
const rays = $('.rays');
const geom = { hit: null, exit: null, start: null, fanTip: null };

function toHero(x, y) {
  const r = pw.svg.getBoundingClientRect(), h = hero.getBoundingClientRect();
  return { x: r.left - h.left + (x / pw.W) * r.width, y: r.top - h.top + (y / pw.H) * r.height };
}
function apexOf(word) {
  const L = pw.layouts.get(word);
  const minX = Math.min(...L.tris.map((t) => t.cx));
  const left = L.tris.filter((t) => t.cx < minX + pw.o.side * 4);
  const top = left.reduce((a, t) => (t.cy < a.cy ? t : a));
  const maxX = Math.max(...L.tris.map((t) => t.cx));
  const right = L.tris.filter((t) => t.cx > maxX - pw.o.side * 2);
  const out = right.reduce((a, t) => (t.cy > a.cy ? t : a));
  return { hit: { x: top.cx, y: Math.min(...top.pts.filter((_, i) => i % 2)) }, exit: { x: out.cx, y: out.cy } };
}
function layoutRays(animate) {
  if (!pw) return;
  const W = hero.clientWidth, H = hero.clientHeight;
  rays.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const a = apexOf(pw.current || 'ALBRETSEN');
  const hit = toHero(a.hit.x, a.hit.y), ex = toHero(a.exit.x, a.exit.y);
  const phone = W < 700;
  const start = phone ? { x: W * 0.92, y: -10 } : { x: hit.x + Math.min(W * 0.32, 520), y: -10 };
  const tipA = { x: W + 40, y: ex.y + H * (phone ? 0.04 : 0.02) }, tipB = { x: ex.x - W * (phone ? 0.3 : 0.1), y: H + 40 };
  Object.assign(geom, { hit, exit: ex, start, tipA, tipB });
  const inD = `M${start.x.toFixed(1)} ${start.y.toFixed(1)} L${hit.x.toFixed(1)} ${hit.y.toFixed(1)}`;
  const fanD = `M${ex.x.toFixed(1)} ${ex.y.toFixed(1)} L${tipA.x.toFixed(1)} ${tipA.y.toFixed(1)} L${tipB.x.toFixed(1)} ${tipB.y.toFixed(1)} Z`;
  const mid = { x: (tipA.x + tipB.x) / 2, y: (tipA.y + tipB.y) / 2 };
  const coreD = `M${ex.x.toFixed(1)} ${ex.y.toFixed(1)} L${mid.x.toFixed(1)} ${mid.y.toFixed(1)}`;
  geom.mid = mid;
  const fg = $('#fan'); fg.setAttribute('cx', ex.x); fg.setAttribute('cy', ex.y); fg.setAttribute('r', Math.hypot(W, H) * 0.55);
  const set = (sel, d) => { const el = $(sel, rays); el.style.transition = animate && !reduced ? 'd .9s cubic-bezier(.16,1,.3,1)' : 'none'; el.style.d = `path("${d}")`; if (!el.getAttribute('d')) el.setAttribute('d', d); };
  set('.ray-in', inD); set('.ray-in-glow', inD); set('.ray-in-flow', inD); set('.fan', fanD); set('.fan-core', coreD);
}
function drawIn() {
  if (reduced) return;
  for (const el of $$('.ray-in, .ray-in-glow, .fan-core', rays)) {
    const len = el.getTotalLength ? el.getTotalLength() : 1000;
    el.style.setProperty('--len', Math.ceil(len) + 1);
    el.classList.add('ray-draw');
    el.addEventListener('animationend', () => el.classList.remove('ray-draw'), { once: true });
  }
  $('.fan', rays).animate([{ opacity: 0 }, { opacity: 0 }, { opacity: 0.4 }], { duration: 2200, easing: 'ease-out' });
}

/** Light facets near (x, y) in wordmark units. */
function ping(x, y, r, s = 1) {
  if (!pw || reduced) return;
  const hitList = [];
  for (const f of pw.f) {
    const cx = (f.cur[0] + f.cur[2] + f.cur[4]) / 3, cy = (f.cur[1] + f.cur[3] + f.cur[5]) / 3;
    const d = Math.hypot(cx - x, cy - y);
    if (d < r) {
      const q = 1 - d / r;
      f.energy = Math.max(f.energy, 0.36 + 0.64 * q * s);
      f.vy -= q * 1.6 * s; f.vr += (Math.random() - 0.5) * 0.06 * q;
      f.settled = false; hitList.push(f);
    }
  }
  setTimeout(() => hitList.forEach((f) => { f.settled = false; }), 1300);
}
/** A sweep of light through the whole word, apex first. */
function sweep() {
  if (!pw || reduced) return;
  const a = apexOf(pw.current);
  ping(a.hit.x, a.hit.y + pw.o.side, pw.o.side * 3.2, 1);
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    setTimeout(() => {
      const x = a.hit.x + ((a.exit.x - a.hit.x) * i) / steps;
      const y = pw.H * 0.5 + Math.sin(i * 0.9) * pw.H * 0.18;
      ping(x, y, pw.o.side * 2.6, 0.8);
    }, i * 42);
  }
}
function photon(product) {
  tone(product);
  if (reduced || !geom.hit) return;
  const layer = $('.photon-layer', rays);
  const NS = 'http://www.w3.org/2000/svg';
  const dot = document.createElementNS(NS, 'circle');
  dot.setAttribute('r', 3.2); dot.setAttribute('class', 'photon'); dot.setAttribute('filter', 'url(#glow)');
  const core = document.createElementNS(NS, 'circle'); core.setAttribute('r', 2); core.setAttribute('class', 'photon');
  const g = document.createElementNS(NS, 'g'); g.append(dot, core); layer.append(g);
  const { start, hit, exit, mid } = geom;
  g.animate([{ transform: `translate(${start.x}px,${start.y}px)` }, { transform: `translate(${hit.x}px,${hit.y}px)` }], { duration: 620, easing: 'cubic-bezier(.5,0,.9,.6)' }).onfinish = () => {
    g.remove(); sweep();
    setTimeout(() => {
      const fan = $('.fan', rays); fan.classList.add('flash'); setTimeout(() => fan.classList.remove('flash'), 120);
      const m = document.createElementNS(NS, 'circle'); m.setAttribute('r', 3); m.setAttribute('class', 'photon-m'); m.setAttribute('filter', 'url(#glow)');
      layer.append(m);
      m.animate([{ transform: `translate(${exit.x}px,${exit.y}px)`, opacity: 1 }, { transform: `translate(${mid.x}px,${mid.y}px)`, opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => m.remove();
    }, 600);
  };
}

async function mountWordmark() {
  const el = $('#wordmark');
  try {
    pw = await PrismWordmark.mount(el, { words: ['ALBRETSEN', 'MCP EMAILS', 'FUN LIBS', 'TOOLRAILS', 'HARBOR'], radius: 170 });
  } catch (e) { return; }
  el.classList.add('live');
  pw.svg.setAttribute('aria-hidden', 'true');
  requestAnimationFrame(() => { layoutRays(false); drawIn(); });
  new ResizeObserver(() => layoutRays(false)).observe(hero);
  // the lens hint fades after the first interaction
  pw.svg.addEventListener('pointerdown', () => { lastUser = performance.now(); tone('burst'); }, { passive: true });
}

/* ── spectrum tabs → morph ──────────────────────────── */
let lastUser = -1e9;
function wireSpectrum() {
  const tabs = $$('.spec-tabs [role="tab"]');
  const mo = new MutationObserver(() => {
    const active = tabs.find((t) => t.dataset.state === 'active');
    if (!active || !pw || pw.current === active.dataset.word) return;
    pw.morphTo(active.dataset.word);
    setTimeout(() => layoutRays(true), 250);
    setTimeout(sweep, 1250);
  });
  tabs.forEach((t) => {
    mo.observe(t, { attributes: true, attributeFilter: ['data-state'] });
    t.addEventListener('pointerdown', () => { lastUser = performance.now(); });
    t.addEventListener('keydown', () => { lastUser = performance.now(); });
  });
  if (reduced) return;
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.4 }).observe(hero);
  setInterval(() => {
    if (!visible || document.hidden || performance.now() - lastUser < 14000 || !pw) return;
    if (document.activeElement && document.activeElement.closest('.spectrum')) return;
    const i = tabs.findIndex((t) => t.dataset.state === 'active');
    tabs[(i + 1) % tabs.length].click();
  }, 7000);
}

/* ── live feed ──────────────────────────────────────── */
function wireFeed() {
  const feed = createFeed();
  const list = $('.photon-list');
  const item = (e, isNew) => {
    const li = document.createElement('li');
    if (isNew) li.className = 'new';
    const tail = e.ms ? `${e.ms} ms` : e.country || e.city || '';
    li.innerHTML = `<img src="${FEED_LOGO[e.product]}" alt="" width="20" height="20"><span><b class="sr-only">${esc(e.label)}: </b>${esc(e.text)}${tail ? ` <em style="font-style:normal;color:var(--faint)">· ${esc(tail)}</em>` : ''}</span><time datetime="${e.time.toISOString()}">${formatTime(e.time)}</time>`;
    return li;
  };
  feed.recent(5).forEach((e) => list.append(item(e)));
  feed.subscribe((e) => {
    list.prepend(item(e, true));
    while (list.children.length > 5) list.lastElementChild.remove();
    photon(e.product);
  });
  // first photon shortly after the intro, so the idea reads
  setTimeout(() => photon(), 3200);
}

/* ── sound (opt-in) ─────────────────────────────────── */
let actx = null;
const FREQ = { 'mcp-emails': 1318.5, 'fun-libs': 1567.98, toolrails: 1760, 'albretsen.no': 1046.5, burst: 523.25 };
function tone(kind) {
  if (!actx) return;
  const f = FREQ[kind] || 1174.66, t = actx.currentTime;
  const out = actx.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.06, t + 0.01); out.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  out.connect(actx.destination);
  [1, 2.756, 5.404].forEach((m, i) => {
    const o = actx.createOscillator(); o.type = 'sine'; o.frequency.value = f * m;
    const g = actx.createGain(); g.gain.value = [1, 0.35, 0.12][i];
    o.connect(g).connect(out); o.start(t); o.stop(t + 1.5);
  });
}
function wireSound() {
  const b = $('.sound');
  b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on);
    $('.sound-label', b).textContent = on ? 'Sound on' : 'Sound off';
    if (on) { actx = actx || new AudioContext(); actx.resume(); tone('albretsen.no'); } else { actx?.suspend(); actx = null; }
  });
}

/* ── micro-interactions ─────────────────────────────── */
function wireCopy() {
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch { /* clipboard blocked; the text stays visible */ }
    b.classList.add('copied'); setTimeout(() => b.classList.remove('copied'), 1400);
  }));
}
function wireMagnets() {
  if (!finePointer || reduced) return;
  $$('.mag').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}
function wireTilt() {
  if (!finePointer || reduced) return;
  $$('.pcard').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.classList.add('tilting');
      c.style.setProperty('--ry', `${(x - 0.5) * 9}deg`); c.style.setProperty('--rx', `${(0.5 - y) * 7}deg`);
      c.style.setProperty('--mx', `${x * 100}%`); c.style.setProperty('--my', `${y * 100}%`);
    });
    c.addEventListener('pointerleave', () => { c.classList.remove('tilting'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });
}
function wireSeal() {
  if (reduced) return;
  const seal = $('.seal'); let q = false;
  addEventListener('scroll', () => {
    if (q) return; q = true;
    requestAnimationFrame(() => { seal.style.setProperty('--spin', `${scrollY * 0.18}deg`); q = false; });
  }, { passive: true });
}

/* ── 3D crystal, lazy ───────────────────────────────── */
function wireCrystal() {
  const el = $('#crystal');
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    try {
      const { mountPrismScene } = await import('./assets/interactive/prism-scene.js');
      const scene = await mountPrismScene(el, { tension: 0.35 });
      el.classList.add('ready');
      const load = () => { scene.setTension(2.6); tone('burst'); };
      const unload = () => scene.setTension(1);
      el.addEventListener('pointerdown', load);
      el.addEventListener('pointerup', unload);
      el.addEventListener('pointercancel', unload);
    } catch { /* WebGL unavailable: the baked render stays */ }
  }, { rootMargin: '300px' });
  io.observe(el);
}

/* ── stickers: drag with inertia ────────────────────── */
function wireStickers() {
  $$('.sticker').forEach((s) => {
    let x = 0, y = 0, vx = 0, vy = 0, r = +s.dataset.r || 0, base = r, drag = null, raf = 0, lx = 0, ly = 0, lt = 0;
    const apply = () => { s.style.translate = `${x}px ${y}px`; s.style.rotate = `${r}deg`; };
    apply();
    s.addEventListener('pointerdown', (e) => {
      cancelAnimationFrame(raf); s.setPointerCapture(e.pointerId); s.classList.add('dragging');
      drag = { ox: e.clientX - x, oy: e.clientY - y }; lx = e.clientX; ly = e.clientY; lt = performance.now(); vx = vy = 0;
    });
    s.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const now = performance.now(), dt = Math.max(8, now - lt);
      vx = (e.clientX - lx) / dt * 16; vy = (e.clientY - ly) / dt * 16; lx = e.clientX; ly = e.clientY; lt = now;
      x = e.clientX - drag.ox; y = e.clientY - drag.oy; r = base + Math.max(-18, Math.min(18, vx * 0.9)); apply();
    });
    const end = () => {
      if (!drag) return; drag = null; s.classList.remove('dragging');
      if (reduced) { r = base; apply(); return; }
      const step = () => {
        x += vx; y += vy; vx *= 0.9; vy *= 0.9; r += (base - r) * 0.12; apply();
        if (Math.abs(vx) + Math.abs(vy) + Math.abs(base - r) > 0.05) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    s.addEventListener('pointerup', end); s.addEventListener('pointercancel', end);
  });
}

/* ── refracting lens over the ice photograph ────────── */
function wireLens() {
  const sec = $('.lens'), g = $('.lens-glass');
  let tx = 0.62, ty = 0.45, x = tx, y = ty, user = false, t0 = performance.now(), on = false, raf = 0;
  sec.addEventListener('pointermove', (e) => { const r = sec.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; user = true; });
  sec.addEventListener('pointerleave', () => { user = false; });
  const put = () => { g.style.setProperty('--lx', `${(x * 100).toFixed(2)}%`); g.style.setProperty('--ly', `${(y * 100).toFixed(2)}%`); };
  put();
  if (reduced) return;
  const loop = (now) => {
    if (!user) { const t = (now - t0) / 1000; tx = 0.6 + Math.sin(t * 0.35) * 0.22; ty = 0.45 + Math.sin(t * 0.52) * 0.18; }
    x += (tx - x) * 0.12; y += (ty - y) * 0.12; put();
    if (on) raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => { on = e.isIntersecting; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(loop); }).observe(sec);
}

/* ── boot ───────────────────────────────────────────── */
renderProducts();
// fill the shared dialog before motion.js opens it (listeners run in order)
$$('[data-ts-dialog-open]').forEach((b) => b.addEventListener('click', () => fillDialog(b.dataset.pid)));
initMotion(document);
wireSpectrum();
wireFeed();
wireSound();
wireCopy();
wireMagnets();
wireTilt();
wireSeal();
wireCrystal();
wireStickers();
wireLens();
initPrismCursor();
mountWordmark();
