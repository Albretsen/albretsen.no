// Lamplighter page glue: the HTML around the game, the products, the feed, sound and the HUD.
import { content } from '../../_shared/content.js';
import { createAudio } from './audio.js';

const $ = (s) => document.querySelector(s);
const Q = new URLSearchParams(location.search);
const params = Object.fromEntries(Q.entries());
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const hero = $('.hero');
const audio = createAudio();
if (params.shot) document.documentElement.classList.add('shot');
if (params.ui) document.documentElement.classList.add('keepui');
if (params.flat) document.documentElement.classList.add('flat');
if (params.debug) {
  const pre = document.createElement('pre');
  pre.style.cssText = 'position:fixed;left:0;top:0;z-index:99;color:#fff;background:#000c;font:12px monospace;max-width:100%;white-space:pre-wrap;margin:0;padding:6px';
  document.body.appendChild(pre);
  const log = (m) => { pre.textContent += m + '\n'; };
  addEventListener('error', (e) => log('ERR ' + e.message + ' ' + e.filename + ':' + e.lineno));
  addEventListener('unhandledrejection', (e) => log('REJ ' + (e.reason?.stack || e.reason)));
  const ce = console.error.bind(console), cw = console.warn.bind(console);
  console.error = (...a) => { log('E ' + a.map((x) => x?.stack || x).join(' ')); ce(...a); };
  console.warn = (...a) => { log('W ' + a.join(' ')); cw(...a); };
  window.__log = log;
}

const LOGOS = {
  'mcp-emails': '../_shared/products/mcp-emails/logo-mark.svg',
  'fun-libs': '../_shared/products/fun-libs/icon.png',
  toolrails: '../_shared/products/toolrails/icon.svg',
  harbor: '../_shared/products/harbor/harbor-mark.svg',
};
const WHERE = { 'fun-libs': 'The seafront arcade', 'mcp-emails': 'The post office', toolrails: 'The workshop', harbor: 'The library on the hill' };
const current = content.products.filter((p) => ['live', 'building', 'paused'].includes(p.status));
const retired = content.products.filter((p) => p.status === 'retired');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ------------------------------------------------------------------ static content
{
  const n = (s) => current.filter((p) => p.status === s).length;
  const words = ['no', 'one', 'two', 'three', 'four'];
  $('#work-sub').textContent = `${words[n('live')][0].toUpperCase() + words[n('live')].slice(1)} products are live, ${words[n('building')]} is being built and ${words[n('paused')]} is paused. Each one has a building in the town.`;
  $('#products').innerHTML = current.map((p) => `
    <a class="prod" href="${p.url}" rel="noopener">
      <span class="where">${WHERE[p.id] || ''}</span>
      <div class="head"><img src="${LOGOS[p.id]}" alt="" width="48" height="48" loading="lazy"><div><h3>${esc(p.name)}</h3><span class="status ${p.status}">${p.status}</span></div></div>
      ${p.figure ? `<p class="fig">${esc(p.figure.value)} <small>${esc(p.figure.label)}</small></p>` : ''}
      <p>${esc(p.line)}</p>
      ${p.facts ? `<ul class="facts">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      <span class="url">${p.url.replace('https://', '')} →</span>
    </a>`).join('');
  $('#chips').innerHTML = current.map((p) => `<li><a href="${p.url}" rel="noopener"><img src="${LOGOS[p.id]}" alt="" width="22" height="22"><span>${esc(p.name)}</span>${p.figure ? `<b>${esc(p.figure.value)} <small>${esc(p.figure.label)}</small></b>` : ''}</a></li>`).join('');
  $('#retired').innerHTML = retired.map((p) => `<li><b>${esc(p.name)}</b>${esc(p.line)}<i>${p.since}</i></li>`).join('');
  $('#mcp').textContent = content.mcpCommand;
  $('#copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(content.mcpCommand); $('#copy').textContent = 'Copied'; } catch { $('#copy').textContent = 'Select and copy'; }
    setTimeout(() => { $('#copy').textContent = 'Copy'; }, 2200);
  });
}

// header gets a backdrop once the hero is behind us
new IntersectionObserver(([e]) => $('.top').classList.toggle('scrolled', !e.isIntersecting), { threshold: 0.08 }).observe(hero);

// ------------------------------------------------------------------ sound
const soundBtn = $('#sound');
soundBtn.addEventListener('click', async () => {
  const on = !audio.on;
  await audio.set(on);
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.querySelector('span').textContent = on ? 'on' : 'off';
});

// ------------------------------------------------------------------ feed (live, or clearly labelled demo)
let latest = {};
const feedList = $('#feed');
const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const LABEL = { 'mcp-emails': 'MCP Emails', 'fun-libs': 'Fun Libs', toolrails: 'Toolrails', harbor: 'Harbor', 'albretsen.no': 'albretsen.no' };
function renderFeed(list, demo) {
  $('#feed-tag').textContent = demo ? 'demo data' : 'live';
  if (!list.length) { feedList.innerHTML = '<li class="empty">Quiet right now.</li>'; return; }
  feedList.innerHTML = list.slice(0, 8).map((e) => `<li><time>${fmtTime(e.time)}</time><span>${esc(LABEL[e.product] || e.product)}</span>${esc(e.text)}</li>`).join('');
  const line = list[0];
  $('#feedline').textContent = `${demo ? 'Demo feed' : 'Live'} · ${LABEL[line.product] || line.product}: ${line.text}`;
}
function noteLatest(list, demo) {
  for (const e of [...list].reverse()) latest[e.product] = { text: e.text, demo };
  game?.setFeed(latest);
}
async function startFeed() {
  let events = [];
  try {
    const r = await fetch('https://albretsen.no/api/events?limit=12', { signal: AbortSignal.timeout?.(5000) });
    const j = await r.json();
    events = (j.events || []).map((e) => ({ ...e, time: new Date(e.time || e.ts || Date.now()), text: e.text || e.label || e.kind || 'event' }));
  } catch { /* offline or blocked: fall through to demo */ }
  if (events.length) { renderFeed(events, false); noteLatest(events, false); return; }
  const { createFeed } = await import('../../_shared/feed.js');
  const feed = createFeed();
  let list = feed.recent(12);
  renderFeed(list, true); noteLatest(list, true);
  if (!reduced) feed.subscribe((e) => { list = [e, ...list].slice(0, 12); renderFeed(list, true); noteLatest([e], true); });
}
startFeed();

// ------------------------------------------------------------------ HUD
const ui = {
  progress(f) { $('#play .load i').style.width = Math.round(Math.min(1, f) * 100) + '%'; },
  audio,
  sky(t, e) {
    $('#sunpip').style.left = (t * 100).toFixed(2) + '%';
    const name = e > 0.5 ? 'Golden' : e > -1 ? 'Sunset' : e > -6 ? 'Blue hour' : 'Night';
    const txt = `Sun ${e >= 0 ? '' : '−'}${Math.abs(e).toFixed(1)}° · ${name}`;
    if (ui._skyTxt !== txt) { ui._skyTxt = txt; $('#elev').textContent = txt; }
  },
  lamp(n, total) {
    const b = $('#lit'); b.textContent = n; $('#total').textContent = total;
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    if (n === 1) hint('The light spreads into the windows near each lamp.', 3500);
  },
  district(d) {
    const p = d.product; if (!p) return;
    const el = document.createElement('a');
    el.className = 'pcard'; el.href = p.url; el.target = '_blank'; el.rel = 'noopener';
    el.innerHTML = `<img src="${LOGOS[p.id]}" alt=""><span class="nm">${esc(p.name)}${p.figure ? `<span class="fig">${esc(p.figure.value)} ${esc(p.figure.label)}</span>` : ''}</span><span class="ln">${esc(p.line)}</span><span class="st">${esc(p.status)} · ${esc(WHERE[p.id] || '')}</span>`;
    const box = $('#cards');
    box.prepend(el);
    // on small screens keep only the newest card open
    const small = matchMedia('(max-width: 699px)').matches;
    [...box.children].forEach((c, i) => { c.classList.toggle('compact', i > 0); if (small && i > 0) c.remove(); });
    if (small) setTimeout(() => el.classList.add('compact'), 6000);
    if (game && game.state.mode === 'play') {
      const left = game.districts.filter((x) => !x.lit).length;
      if (left) hint(`${p.name} is lit. ${left === 1 ? 'One district' : `${left} districts`} to go, up the stairs.`, 4200);
    }
  },
  arrow(a) {
    const el = $('#arrow');
    if (!a.on) { el.classList.remove('on'); return; }
    const r = hero.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    let dx = a.x - r.left - cx, dy = a.y - r.top - cy;
    if (a.behind) { dx = -dx; dy = -dy; }
    const ang = Math.atan2(dy, dx);
    const m = 34, k = Math.min((cx - m) / Math.abs(Math.cos(ang) || 1e-3), (cy - m - 30) / Math.abs(Math.sin(ang) || 1e-3));
    const ax = cx + Math.cos(ang) * k, ay = Math.max(132, Math.min(r.height - 44, cy + Math.sin(ang) * k));
    el.style.transform = `translate(${ax}px, ${ay}px) rotate(${ang}rad)`;
    el.classList.add('on');
  },
  stick(s) {
    const el = $('#stick');
    if (!s.on) { el.classList.remove('on'); return; }
    const r = hero.getBoundingClientRect();
    el.style.left = s.x - r.left + 'px'; el.style.top = s.y - r.top + 'px';
    el.querySelector('i').style.transform = `translate(${s.dx}px, ${s.dy}px)`;
    el.classList.add('on');
  },
  hint(t) { hint(t); },
  playing() {
    hint(coarse ? 'Drag to walk, or tap a lamp. Walk past a lamp to light it.' : 'Walk past a lamp to light it. WASD, arrows, or click where to go.', 5200);
    $('#scene').focus({ preventScroll: true });
  },
  finish({ lit, total, seconds, reason }) {
    hero.classList.remove('playing'); hero.classList.add('done');
    const m = Math.floor(seconds / 60), s = String(seconds % 60).padStart(2, '0');
    $('#stat').textContent = reason === 'skip' && lit === 0 ? 'Skipped to the end. Play again to light the lamps yourself.'
      : reason === 'night' ? `Night fell with ${lit} of ${total} lamps lit by hand. The town finished the rest.`
      : `You lit all ${total} lamps in ${m}:${s}, before full dark.`;
    $('#finale-eyebrow').textContent = reason === 'done' ? 'Every lamp lit' : 'Night, and the town is lit';
    $('#arrow').classList.remove('on');
    setTimeout(() => { $('#finale').hidden = false; }, reason === 'skip' ? 600 : 3800);
    if (reason === 'done') { try { const best = +localStorage.getItem('lamplighter-best') || Infinity; if (seconds < best) localStorage.setItem('lamplighter-best', String(seconds)); } catch { /* storage off */ } }
  },
};
let hintTimer = 0;
function hint(text, ms = 4000) {
  const el = $('#hint');
  clearTimeout(hintTimer);
  if (!text || !hero.classList.contains('playing')) { el.classList.remove('on'); return; }
  el.textContent = text; el.classList.add('on');
  hintTimer = setTimeout(() => el.classList.remove('on'), ms);
}

// ------------------------------------------------------------------ game boot
let game = null, booting = null, wantStart = false, wantSkip = false;
const playBtn = $('#play');

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2')); } catch { return false; }
}

function boot() {
  if (booting) return booting;
  if (!webglOK()) { playBtn.disabled = true; playBtn.querySelector('.label').textContent = 'Needs WebGL 2'; return Promise.resolve(null); }
  playBtn.classList.add('loading');
  booting = (async () => {
    await document.fonts?.ready;
    const { createGame } = await import('./game.js');
    game = await createGame({ canvas: $('#scene'), products: current, ui, params, reduced, coarse });
    game.setFeed(latest);
    document.fonts?.load('86px "Poiret One"').then(() => game.redrawScreens());
    playBtn.classList.remove('loading');
    $('#total').textContent = game.total;
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('ready')));
    if (params.shot) { hero.classList.toggle('playing', params.shot !== 'poster' && params.shot !== 'final'); if (params.shot === 'final') ui.finish({ lit: 0, total: game.total, seconds: 0, reason: 'skip' }); if (params.shot === 'play') { $('#hud').hidden = false; ui.playing(); } }
    if (wantSkip) game.skip();
    else if (wantStart) begin();
    return game;
  })().catch((err) => {
    console.error(err);
    playBtn.classList.remove('loading');
    playBtn.querySelector('.label').textContent = 'The town could not load';
    playBtn.disabled = true;
    return null;
  });
  return booting;
}

function begin() {
  if (!game) { wantStart = true; boot(); return; }
  hero.classList.add('playing');
  $('#hud').hidden = false;
  game.start();
  hero.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}

playBtn.addEventListener('click', begin);
const skipAll = () => {
  wantSkip = true;
  hero.classList.add('done'); hero.classList.remove('playing');
  if (game) game.skip();
  else { boot(); ui.finish({ lit: 0, total: 16, seconds: 0, reason: 'skip' }); }
};
$('#skip0').addEventListener('click', skipAll);
$('#skip').addEventListener('click', skipAll);
$('#again').addEventListener('click', () => { const u = new URL(location.href); u.search = '?play=1'; location.href = u.href; });
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && game?.state.mode === 'play') skipAll();
});

if (params.scroll) addEventListener('load', () => document.getElementById(params.scroll)?.scrollIntoView());

// Load the town once the page has painted. Reduced motion or data saver: wait for a click.
const saveData = navigator.connection?.saveData;
if (params.shot || params.play) { if (params.play) wantStart = true; boot(); }
else if (!reduced && !saveData) {
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 600));
  addEventListener('load', () => idle(() => boot(), { timeout: 2000 }));
}
