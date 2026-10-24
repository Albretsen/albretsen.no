// Evening post: the page. Facts from content.js, the live feed, lazy 3D, HUD, cards, input.
import { content } from '../../_shared/content.js';
import { createAudio } from './audio.js';

const $ = (s, r = document) => r.querySelector(s);
const Q = new URLSearchParams(location.search);
const SHOT = Q.get('shot');
if (Q.get('view') === 'rest') $('.hero').style.display = 'none'; // screenshot helper: the page below the hero
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const P = Object.fromEntries(content.products.map((p) => [p.id, p]));
const LOGO = {
  'mcp-emails': '../_shared/products/mcp-emails/logo-mark.svg', 'fun-libs': '../_shared/products/fun-libs/icon.png',
  toolrails: '../_shared/products/toolrails/icon.svg', harbor: '../_shared/products/harbor/harbor-mark.svg',
};
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------- facts from content.js (the HTML carries a copy for no-JS)
for (const li of document.querySelectorAll('.prod')) {
  const p = P[li.dataset.id]; if (!p) continue;
  $('h3', li).textContent = p.name;
  if (p.figure) { $('.fig b', li).textContent = p.figure.value; $('.fig span', li).textContent = p.figure.label; }
  $('.line', li).textContent = p.line;
  $('.facts', li).innerHTML = (p.facts || []).map((f) => `<li>${esc(f)}</li>`).join('');
  const st = $('.status', li); st.className = 'status ' + p.status; st.textContent = STATUS[p.status] || p.status;
}
$('#retired').innerHTML = content.products.filter((p) => p.status === 'retired')
  .map((p) => `<li><b>${esc(p.name)}</b><span>${p.since}</span><em>${esc(p.line)}</em></li>`).join('');
document.querySelectorAll('.avail, .pc-avail').forEach((el) => { el.textContent = content.availability; });
document.querySelectorAll('a[href^="mailto:"]').forEach((a) => { a.href = 'mailto:' + content.email; a.textContent = content.email; });
$('.mcp code').textContent = content.mcpCommand;

// ---------------------------------------------------------------- live feed (labelled as demo data when the real one is empty)
const feedEl = $('#feed');
let feedDemo = false, lastEvent = null;
const ago = (t) => { const s = Math.max(1, Math.round((Date.now() - new Date(t).getTime()) / 1000)); return s < 60 ? `${s} s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`; };
function showEvent(e) {
  lastEvent = e;
  const label = e.label || (P[e.product]?.name ?? e.product);
  feedEl.innerHTML = `${esc(label)} &middot; ${esc(e.text || e.kind)} &middot; ${ago(e.time)}${feedDemo ? ' <span class="demo">(demo data)</span>' : ''}`;
}
async function startFeed() {
  try {
    const r = await fetch('https://albretsen.no/api/events?limit=12', { mode: 'cors' });
    const j = await r.json();
    const ev = j.events || j;
    if (Array.isArray(ev) && ev.length) { showEvent(ev[0]); setInterval(() => lastEvent && showEvent(lastEvent), 15000); return; }
  } catch { /* offline or blocked: fall through to the demo */ }
  feedDemo = true;
  const { createFeed } = await import('../../_shared/feed.js');
  const feed = createFeed();
  showEvent(feed.recent(1)[0]);
  if (!reduced) feed.subscribe(showEvent);
}
if (!SHOT) startFeed();

// ---------------------------------------------------------------- sound
const audio = createAudio();
document.querySelectorAll('[data-sound]').forEach((b) => b.addEventListener('click', async () => {
  const on = await audio.toggle();
  document.querySelectorAll('[data-sound]').forEach((x) => x.setAttribute('aria-pressed', String(on)));
}));

// ---------------------------------------------------------------- UI pieces the game calls
const hud = $('#hud'), hintEl = $('#hint'), hintText = $('#hint-text'), card = $('#card'), arrow = $('#arrow'), endEl = $('#end');
let cardTimer = 0;
const ui = {
  hud(h) {
    $('#h-letters').textContent = h.letters; $('#h-total').textContent = h.lettersTotal;
    $('#h-score').textContent = h.score.toLocaleString('en-US');
    $('#h-combo').textContent = h.combo > 2 ? `chain ×${h.combo}` : '';
    const e = h.e;
    $('#h-clock').textContent = h.clock;
    $('#h-sun').textContent = `sun ${e >= 0 ? '+' : '−'}${Math.abs(e).toFixed(1)}°`;
    $('#h-sunbar').style.transform = `scaleX(${Math.max(0, 1 - h.progress).toFixed(3)})`;
    if (game) audio.flight(game.F.speed, game.G.mode === 'play');
  },
  toast(text) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = text;
    $('#toasts').appendChild(t); setTimeout(() => t.remove(), 1300);
  },
  product(id) {
    const p = P[id]; if (!p) return;
    const li = $(`#stamps [data-id="${id}"]`); li?.classList.add('got');
    const live = lastEvent && (lastEvent.product === id) ? `${esc(lastEvent.text)} · ${ago(lastEvent.time)}${feedDemo ? ' (demo data)' : ''}` : '';
    card.innerHTML = `
      <div class="c-top"><img src="${LOGO[id]}" alt=""><div><h3>${esc(p.name)}</h3><span class="status ${p.status}">${STATUS[p.status]}</span></div></div>
      ${p.figure ? `<p class="c-fig">${esc(p.figure.value)}<small>${esc(p.figure.label)}</small></p>` : ''}
      <p>${esc(p.line)}</p>
      <p class="facts">${(p.facts || []).map(esc).join(' · ')}</p>
      <a href="${p.url}" target="_blank" rel="noopener">${p.url.replace('https://', '')}</a>
      ${live ? `<p class="c-live">Latest: ${live}</p>` : ''}`;
    card.hidden = false;
    requestAnimationFrame(() => { if (game?.G.mode !== 'end') card.classList.add('show'); });
    clearTimeout(cardTimer);
    cardTimer = setTimeout(() => { card.classList.remove('show'); }, SHOT === 'card' ? 1e9 : 5200);
  },
  arrow(a) {
    if (!a) { arrow.hidden = true; return; }
    arrow.hidden = false;
    const x = (a.x * 0.5 + 0.5) * innerWidth, y = (-a.y * 0.5 + 0.5) * innerHeight;
    arrow.style.transform = `translate(${x - innerWidth / 2}px, ${y - innerHeight / 2}px) rotate(${-a.a}rad)`;
  },
  started() { hint(coarse ? 'Drag anywhere to steer. Lift your finger and the plane flies itself.' : 'Move the mouse to steer. Leave it still and the plane flies itself.', 5200, 'Fly through the rings of light, and pass close to a glowing window to post its letter.'); },
  end(s) { showEnd(s); },
};
let hintTimer = 0;
function hint(text, ms = 4000, then) {
  hintText.textContent = text; hintEl.classList.remove('off');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => { if (then) hint(then, 4800); else hintEl.classList.add('off'); }, ms);
}

function showEnd(s) {
  const pct = (s.letters / Math.max(1, s.lettersTotal)) * 0.6 + (s.products.length / 4) * 0.25 + (s.rings / Math.max(1, s.ringsTotal)) * 0.15;
  $('#e-rank').textContent = pct >= 0.85 ? 'First class' : pct >= 0.55 ? 'Second class' : 'Postcard rate';
  $('#e-letters').textContent = `${s.letters} of ${s.lettersTotal}`;
  $('#e-products').textContent = `${s.products.length} of 4`;
  $('#e-rings').textContent = `${s.rings} of ${s.ringsTotal}`;
  $('#e-score').textContent = s.score.toLocaleString('en-US');
  $('#e-list').innerHTML = ['mcp-emails', 'toolrails', 'fun-libs', 'harbor'].map((id) => {
    const p = P[id], got = s.products.includes(id);
    return `<li class="${got ? '' : 'miss'}"><b>${esc(p.name)}</b><span>${got ? `${esc(p.figure.value)} ${esc(p.figure.label)}` : 'not delivered'}</span></li>`;
  }).join('');
  const d = new Date();
  $('#e-date').textContent = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  card.classList.remove('show'); hintEl.classList.add('off');
  setTimeout(() => { hud.hidden = true; endEl.hidden = false; requestAnimationFrame(() => endEl.classList.add('show')); $('#again').focus({ preventScroll: true }); }, SHOT ? 0 : 2600);
}

// ---------------------------------------------------------------- 3D, loaded after first paint
let game = null, gameP = null;
const canvas = $('#stage'), fly = $('#fly');
const hasWebGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2')); } catch { return false; } })();
const saveData = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));
const quality = coarse || innerWidth < 760
  ? { dpr: Math.min(devicePixelRatio, 1.5), shadows: true, shadowSize: 1024, bloom: true }
  : { dpr: Math.min(devicePixelRatio, 1.5), shadows: true, shadowSize: 2048, bloom: true };
if (Q.get('q') === 'low') Object.assign(quality, { dpr: 1, shadows: false, bloom: false });

function loadGame() {
  if (gameP) return gameP;
  gameP = import('./game.js').then(({ createGame }) => createGame({
    canvas, quality, reduced, ui, audio,
    onProgress: (k) => { $('#loadbar').style.width = Math.round(k * 100) + '%'; },
  })).then((g) => {
    game = g;
    fly.disabled = false;
    g.renderOnce();
    canvas.classList.add('live');
    if (!reduced) g.start();
    watchVisibility();
    return g;
  }).catch((err) => { console.error(err); fly.hidden = true; $('#how').hidden = true; });
  return gameP;
}
if (hasWebGL && !saveData && Q.get('view') !== 'rest') {
  if (SHOT) loadGame();
  else addEventListener('load', () => (window.requestIdleCallback || setTimeout)(loadGame, { timeout: 1200 }));
} else { fly.hidden = true; $('#how').hidden = true; }

function watchVisibility() {
  let inView = true;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }).observe($('.hero'));
  document.addEventListener('visibilitychange', sync);
  function sync() {
    const playing = document.body.classList.contains('playing');
    if (document.hidden || (!inView && !playing) || (reduced && !playing)) game.stop(); else game.start();
  }
  ui._sync = sync;
}

// ---------------------------------------------------------------- play / skip / again
async function play() {
  const g = await loadGame(); if (!g) return;
  endEl.classList.remove('show'); endEl.hidden = true; card.classList.remove('show');
  document.querySelectorAll('#stamps li').forEach((li) => li.classList.remove('got'));
  if (scrollY > 10) scrollTo({ top: 0, behavior: 'instant' });
  document.body.classList.add('playing');
  hud.hidden = false;
  g.play();
  g.start();
  hint('The evening post is leaving…', 2400);
}
function skip() { if (game && (game.G.mode === 'play' || game.G.mode === 'intro')) game.skip(); }
function leave(toProducts) {
  document.body.classList.remove('playing');
  hud.hidden = true; endEl.classList.remove('show'); endEl.hidden = true; card.classList.remove('show');
  game?.toAttract();
  ui._sync?.();
  if (reduced) game?.renderOnce();
  if (toProducts) requestAnimationFrame(() => $('#products').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));
}
fly.addEventListener('click', play);
$('#skip').addEventListener('click', skip);
$('#again').addEventListener('click', play);
$('#e-products-link').addEventListener('click', (e) => { e.preventDefault(); leave(true); });
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (game?.G.mode === 'play' || game?.G.mode === 'intro') skip(); else if (game?.G.mode === 'end') leave(false); }
});

// ---------------------------------------------------------------- steering: mouse position, a touch stick, or the keys
const keys = new Set();
const stick = $('#stick');
let touch = null;
function setIn(x, y, active) { game?.setInput(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)), active); }
const dz = (v, d = 0.08) => (Math.abs(v) < d ? 0 : (v - Math.sign(v) * d) / (1 - d));
canvas.addEventListener('pointermove', (e) => {
  if (!document.body.classList.contains('playing')) return;
  if (e.pointerType === 'mouse') {
    const x = (e.clientX / innerWidth - 0.5) * 2, y = (e.clientY / innerHeight - 0.5) * 2;
    setIn(dz(x * 1.25), -dz(y * 1.3), true);
  } else if (touch && e.pointerId === touch.id) {
    const dx = (e.clientX - touch.x) / 55, dy = (e.clientY - touch.y) / 55;
    setIn(dz(dx, 0.1), -dz(dy, 0.1), true);
    const m = Math.min(1, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
    $('i', stick).style.transform = `translate(${Math.cos(a) * m * 34}px, ${Math.sin(a) * m * 34}px)`;
  }
});
canvas.addEventListener('pointerdown', (e) => {
  if (!document.body.classList.contains('playing') || e.pointerType === 'mouse') return;
  touch = { id: e.pointerId, x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
  stick.hidden = false; stick.style.left = e.clientX + 'px'; stick.style.top = e.clientY + 'px'; $('i', stick).style.transform = '';
});
const endTouch = (e) => { if (touch && e.pointerId === touch.id) { touch = null; stick.hidden = true; setIn(0, 0, false); } };
canvas.addEventListener('pointerup', endTouch); canvas.addEventListener('pointercancel', endTouch);
canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setIn(0, 0, false); });
function keyIn() {
  const x = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0);
  const y = (keys.has('ArrowUp') || keys.has('w') ? 1 : 0) - (keys.has('ArrowDown') || keys.has('s') ? 1 : 0);
  setIn(x, y, x !== 0 || y !== 0);
}
addEventListener('keydown', (e) => { if (!document.body.classList.contains('playing')) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's'].includes(k)) { keys.add(k); keyIn(); e.preventDefault(); } });
addEventListener('keyup', (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (keys.delete(k)) keyIn(); });

// ---------------------------------------------------------------- headless states for screenshots: ?shot=poster|play|card|end&t=seconds
if (SHOT) {
  document.documentElement.classList.add('shot');
  addEventListener('error', (e) => { document.title = 'ERR ' + e.message; });
  addEventListener('unhandledrejection', (e) => { document.title = 'REJ ' + (e.reason && e.reason.stack || e.reason); });
  loadGame().then(async (g) => {
    g.stop();
    await g.folkReady;
    if (SHOT === 'map') { document.documentElement.classList.add('bare'); document.title = 'MAP ' + JSON.stringify(g.debugMap()); return; }
    if (SHOT === 'poster') {
      if (Q.get('ui') === '0') document.documentElement.classList.add('bare');
      g.simulate(+(Q.get('t') || 3), 'attract');
    } else if (SHOT === 'play' || SHOT === 'card' || SHOT === 'end') {
      document.body.classList.add('playing'); hud.hidden = false;
      const t = +(Q.get('t') || (SHOT === 'end' ? 80 : 12));
      g.simulate(t, 'play');
      if (SHOT === 'card') ui.product(Q.get('id') || 'mcp-emails');
      if (SHOT === 'end' && g.G.mode !== 'end') { g.skip(); g.simulate(4, 'end'); }
      ui.hud(g.hud());
      if (Q.get('ui') === '0') document.documentElement.classList.add('bare');
    }
    g.renderOnce(); g.renderOnce();
    document.title = 'READY ' + JSON.stringify({ ...g.stats(), mode: g.G.mode });
  });
}
