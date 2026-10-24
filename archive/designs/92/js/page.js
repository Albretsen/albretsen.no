// Enter world · Albretsen AS (design 92). Page wiring: facts, the live feed,
// sound, and the world itself, which loads after first paint.
import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';
import { audio } from './audio.js';

const $ = (s, r = document) => r.querySelector(s);
const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('reduced');
const touchy = matchMedia('(pointer: coarse)').matches || params.get('touch') === '1';
document.documentElement.classList.toggle('is-touch', touchy);
if (params.has('shot')) document.documentElement.classList.add('is-shot');
if (params.has('below')) document.querySelector('.hero').hidden = true; // headless: the page under the hero
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ── Facts from content.js; the HTML carries the same text so the page works without JS. */
const STATUS = { live: 'Live', building: 'Being built', paused: 'Paused', retired: 'Retired' };
const byId = Object.fromEntries(content.products.map((p) => [p.id, p]));
document.querySelectorAll('.card[data-id]').forEach((card) => {
  const p = byId[card.dataset.id]; if (!p) return;
  const set = (sel, v) => { const el = $(sel, card); if (el && v != null) el.textContent = v; };
  set('.js-name', p.name); set('.js-line', p.line); set('.js-since', p.since); set('.js-status', STATUS[p.status]);
  $('.status', card).dataset.status = p.status;
  if (p.figure) { set('.js-value', p.figure.value); set('.js-label', p.figure.label); }
  if (p.url) $('.js-name', card).href = p.url;
  if (p.facts) $('.js-facts', card).replaceChildren(...p.facts.map((f) => Object.assign(document.createElement('li'), { textContent: f })));
});
$('#retired').innerHTML = content.products.filter((p) => p.status === 'retired')
  .map((p) => `<li><b>${esc(p.name)}</b><span>${p.since}</span><p>${esc(p.line)}</p></li>`).join('');

/* ── Copy the MCP line. */
$('#copy').addEventListener('click', async () => {
  let ok = false;
  try { await navigator.clipboard.writeText(content.mcpCommand); ok = true; } catch {}
  $('#copy').textContent = ok ? 'Copied' : 'Select it';
  $('#copy-status').textContent = ok ? 'Copied to the clipboard.' : 'Copy failed. Select the line.';
  setTimeout(() => { $('#copy').textContent = 'Copy'; }, 2400);
});

/* ── Live events: the real feed when it has anything, otherwise labelled demo data. */
const LABELS = { 'mcp-emails': 'MCP Emails', 'fun-libs': 'Fun Libs', toolrails: 'Toolrails', harbor: 'Harbor', 'albretsen.no': 'albretsen.no' };
const feed = (() => {
  let events = [], mode = 'demo', demo = null;
  const subs = new Set();
  const norm = (e, i) => {
    if (!e || typeof e !== 'object') return null;
    const product = e.product || e.source || 'albretsen.no';
    const time = new Date(e.time || e.ts || e.at || e.created_at || Date.now());
    return { id: e.id ?? `${time.getTime()}-${i}`, product, label: e.label || LABELS[product] || product, text: e.text || e.message || e.kind || 'event', time, country: e.country, ms: e.ms };
  };
  const startDemo = () => {
    if (demo) return;
    demo = createFeed();
    events = demo.recent(30);
    demo.subscribe((e) => { if (mode !== 'demo') return; events = [e, ...events].slice(0, 40); subs.forEach((f) => f(e)); });
    subs.forEach((f) => f(events[0]));
  };
  const poll = async () => {
    try {
      const r = await fetch('https://albretsen.no/api/events?limit=12', { cache: 'no-store' });
      const j = await r.json();
      const list = (Array.isArray(j) ? j : j.events || []).map(norm).filter(Boolean);
      if (list.length) {
        const fresh = list[0].id !== events[0]?.id;
        mode = 'live'; events = list;
        if (fresh) subs.forEach((f) => f(events[0]));
      } else if (mode !== 'live') startDemo();
    } catch { if (mode !== 'live') startDemo(); }
  };
  poll(); setInterval(poll, 30000);
  return { events: () => events, mode: () => mode, subscribe: (f) => subs.add(f) };
})();

const feedEl = $('#feed');
let lastShown = 0;
feed.subscribe((e) => {
  if (!e) return;
  const now = performance.now(); if (now - lastShown < 4500) return; lastShown = now;
  const text = `${feed.mode() === 'live' ? '' : 'Demo data · '}${e.label} · ${e.text}${e.ms ? ` · ${e.ms} ms` : ''}`;
  if (reduced) { feedEl.textContent = text; return; }
  feedEl.classList.add('is-out');
  setTimeout(() => { feedEl.textContent = text; feedEl.classList.remove('is-out'); }, 500);
});

/* ── Sound: off until asked, one switch in the nav and one in the HUD. */
const soundBtns = [$('#sound'), $('#hud-sound')];
let soundOn = false;
const setSound = (v) => { soundOn = v; audio.enable(v); soundBtns.forEach((b) => b.setAttribute('aria-pressed', String(v))); };
soundBtns.forEach((b) => b.addEventListener('click', () => setSound(!soundOn)));

/* ── The world. Loads after first paint (or on the button), renders only when seen. */
const canvas = $('#world');
const hero = $('.hero');
const enterBtn = $('#enter');
const meter = $('#meter');
const note = $('#enter-note');
let world = null, game = null, booting = null, wantEnter = false;

function webglOK() { try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; } }
function pickTier() {
  const q = params.get('q'); if (q) return q;
  const small = Math.min(innerWidth, innerHeight) < 600;
  const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  if (touchy && small) return 'low';
  if (touchy || mem < 4 || cores < 4) return 'mid';
  return 'high';
}

function boot() {
  if (booting) return booting;
  if (!webglOK()) { note.textContent = 'This browser cannot draw the 3D world. The products are all below.'; enterBtn.disabled = true; return Promise.resolve(); }
  hero.classList.add('is-loading');
  booting = (async () => {
    const [{ createWorld }, { createGame, hourOf, fmtDeg, HERO_E0 }] = await Promise.all([import('./world.js'), import('./game.js')]);
    const tier = pickTier();
    world = await createWorld({ canvas, tier, params, onProgress: (k) => { meter.style.transform = `scaleX(${k.toFixed(3)})`; } });
    const t = params.get('t');
    const e0 = t != null ? -7 + 22 * +t : reduced ? -1.6 : HERO_E0;
    world.setElevation(e0);
    if (t != null) world.settleLights();
    world.sw.onClick = (s, d, on) => { if (d < 90) audio.tick(d, on); };
    game = createGame(world, {
      audio, feed, reduced, params,
      onEnter: () => {
        document.documentElement.classList.add('in-world');
        window.scrollTo({ top: 0, behavior: 'instant' });
      },
      onLeave: () => {
        document.documentElement.classList.remove('in-world');
        enterBtn.focus({ preventScroll: true });
      },
    });
    game.sunTarget = e0;
    if (t != null || reduced) game.sunAuto = false;
    // live readout under the hero
    const deg = $('#deg'), hour = $('#hour');
    let lastTxt = '';
    readout = () => {
      const txt = fmtDeg(world.elevation);
      if (txt !== lastTxt) { lastTxt = txt; deg.textContent = txt; hour.textContent = hourOf(world.elevation); }
    };
    hero.classList.remove('is-loading');
    hero.classList.add('is-ready');
    start();
    const shot = params.get('shot');
    if (shot && shot !== 'hero' && shot !== 'poster') game.shot(shot);
    if (shot === 'poster') { document.documentElement.classList.add('is-poster'); if (world.grade) world.grade.uniforms.uGrain.value = 0; }
    if (wantEnter) game.enter();
  })().catch((err) => {
    console.error(err);
    hero.classList.remove('is-loading');
    note.textContent = 'The world did not load this time. The products are all below.';
  });
  return booting;
}
let readout = () => {};

enterBtn.addEventListener('click', () => {
  if (game) { game.enter(); return; }
  wantEnter = true;
  enterBtn.classList.add('is-waiting');
  enterBtn.querySelector('.enter-label').textContent = 'Loading the town…';
  boot();
});

/* ── Render loop: the hero renders while it is on screen, the world always while you are in it. */
let raf = 0, last = 0, visible = true, adaptT = 0, slow = 0, frames = 0;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { threshold: 0.02 }).observe(hero);
document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
function start() {
  if (!world || raf) return;
  last = performance.now();
  raf = requestAnimationFrame(loop);
}
function loop(now) {
  raf = 0;
  const inWorld = document.documentElement.classList.contains('in-world');
  if (document.hidden || (!visible && !inWorld)) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  world.resize(w, h);
  try { game.tick(dt); world.render(); } catch (err) { console.error('frame', err?.stack || err); }
  readout();
  if (!hero.classList.contains('is-live') && ++frames > 2) hero.classList.add('is-live');
  // adaptive resolution: keep it smooth on slower laptops
  adaptT += dt; if (dt > 1 / 40) slow++;
  if (adaptT > 3) {
    const dpr = world.renderer.getPixelRatio();
    if (slow > 3 * 40 * 0.5 && dpr > 1) world.resize(w, h, Math.max(1, dpr - 0.25));
    adaptT = 0; slow = 0;
  }
  raf = requestAnimationFrame(loop);
}

/* ── Load the world once the page is idle, unless the connection asks us not to. */
const conn = navigator.connection;
const frugal = conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''));
if (params.has('still')) { /* poster only */ }
else if (!frugal || params.has('shot')) {
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
  const go = () => idle(() => boot(), { timeout: 1500 });
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
} else note.textContent = 'The 3D world loads when you ask for it (about 3 MB).';
