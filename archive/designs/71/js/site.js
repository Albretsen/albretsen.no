// Design 71 · Winter Pavilion. Page behaviour: products from content.js, the live feed,
// the Sky Dial hero (lazy), the day/night theme, the tracking shot and opt-in sound.
import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';
import { signWarmup, iris, trackingShot, snowfall, rise } from '../assets/motion.js';

const $ = s => document.querySelector(s);
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ── facts ─────────────────────────────────────────────── */
document.querySelectorAll('[data-fact="since"]').forEach(el => { el.textContent = content.history.playDeveloperSince; });

/* ── products ───────────────────────────────────────────── */
const STATUS = { live: 'Open', building: 'Under construction', paused: 'Closed for the season' };
const SCENE = {
  'mcp-emails': 'A sky-blue streamline kiosk in morning snow, its fascia carrying the MCP Emails wordmark.',
  'fun-libs': 'A flamingo-pink booth with a stepped parapet at the pink hour, the Fun Libs icon lit on its roof.',
  toolrails: 'A mint ranch-modern pavilion with a deep overhang in low sun, the Toolrails icon on its fascia.',
  harbor: 'A cream gable house at blue hour with its lamps on and the Harbor wordmark sign lit.',
};
const live = content.products.filter(p => p.status !== 'retired');
$('#row').insertAdjacentHTML('beforeend', live.map(p => {
  const host = p.url ? new URL(p.url).host : '';
  const img = `assets/products/${p.id}`;
  return `<li class="card ms-rise" data-status="${p.status}">
    <a class="card__frame" href="${esc(p.url)}" rel="noopener" aria-label="${esc(p.name)}, ${esc(host)}">
      <picture>
        <source type="image/avif" srcset="${img}-800.avif 800w, ${img}-1600.avif 1600w" sizes="(min-width: 960px) 32vw, (min-width: 720px) 46vw, 92vw">
        <source type="image/webp" srcset="${img}-800.webp 800w, ${img}-1600.webp 1600w" sizes="(min-width: 960px) 32vw, (min-width: 720px) 46vw, 92vw">
        <img src="${img}-1200.jpg" width="1200" height="900" loading="lazy" decoding="async" alt="${esc(SCENE[p.id] || p.name)}">
      </picture>
      <span class="card__plate"><i aria-hidden="true"></i>${STATUS[p.status]} &middot; since ${p.since}</span>
    </a>
    <h3 class="card__name">${esc(p.name)}</h3>
    <p class="card__line">${esc(p.line)}</p>
    ${p.figure ? `<p class="card__fig"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></p>` : ''}
    ${p.facts ? `<p class="card__facts">${p.facts.map(esc).join(' &middot; ')}</p>` : ''}
    <a class="card__link" href="${esc(p.url)}" rel="noopener">${esc(host)} &nearr;</a>
  </li>`;
}).join(''));

$('#plaques').innerHTML = content.products.filter(p => p.status === 'retired').map(p => `
  <li class="plaque ms-rise">
    <img src="assets/products/retired/${p.id}.svg" width="320" height="180" loading="lazy" decoding="async" alt="${esc(p.name)}, retired ${p.since}">
    <p>${esc(p.line)}${p.figure ? ` <span class="sr">(${esc(p.figure.value)} ${esc(p.figure.label)})</span>` : ''}</p>
  </li>`).join('');
rise();

/* ── tracking shot (desktop only) ────────────────────────── */
const track = $('#track'), row = $('#row');
const wide = matchMedia('(min-width: 960px) and (min-height: 560px)');
let stopTrack = () => {};
function setupTrack() {
  stopTrack(); track.classList.remove('is-tracking'); track.style.removeProperty('--track-len'); track.style.removeProperty('--track');
  if (reduce || !wide.matches) return;
  track.classList.add('is-tracking');
  row.querySelectorAll('.ms-rise').forEach(el => el.classList.add('is-in'));
  const len = Math.max(0, row.scrollWidth - innerWidth);
  track.style.setProperty('--track-len', `${len}px`);
  stopTrack = trackingShot(track);
}
setupTrack();
wide.addEventListener('change', setupTrack);
let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(setupTrack, 150); });

/* ── the sun: altitude and solar time for a midwinter day at 59.9° N ── */
// The dial's h runs from -0.8 to 0.7. 0.7 is the midwinter noon sun here (6.6°), so the
// scale is honest: altitude = h × 9.5°. The time is the afternoon solar time at that altitude.
const LAT = 59.9 * Math.PI / 180, DEC = -23.44 * Math.PI / 180;
function sunReading(h) {
  const alt = h * 9.5;
  const cosH = (Math.sin(alt * Math.PI / 180) - Math.sin(LAT) * Math.sin(DEC)) / (Math.cos(LAT) * Math.cos(DEC));
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) * 180 / Math.PI;
  const t = 12 + H / 15, hh = Math.floor(t), mm = Math.round((t - hh) * 60);
  const time = `${String(hh + (mm === 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
  const state = h > 0.05 ? 'Low winter sun' : h > -0.08 ? 'Pink hour' : h > -0.35 ? 'Blue hour' : 'Night';
  return { alt, time, state };
}
const hero = $('.hero'), stateEl = $('#state'), readEl = $('#reading'), dot = $('#dialDot');
function showSun(h) {
  const r = sunReading(h);
  stateEl.textContent = r.state;
  readEl.textContent = `Sun ${r.alt < 0 ? '−' : ''}${Math.abs(r.alt).toFixed(1)}° · ${r.time}`;
  dot.style.setProperty('--p', ((6.6 - r.alt) / 14.2).toFixed(4));
  hero.dataset.sky = h > 0.15 ? 'bright' : 'deep';
}

/* ── theme ──────────────────────────────────────────────── */
const sw = $('#switch'), swLabel = sw.querySelector('.switch__label');
let snowStarted = false;
function applyTheme(t) {
  root.dataset.theme = t;
  sw.setAttribute('aria-pressed', String(t === 'night'));
  swLabel.textContent = t === 'night' ? 'Day' : 'Night';
  sw.setAttribute('aria-label', t === 'night' ? 'Switch to day' : 'Switch to night');
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', t === 'night' ? '#18223F' : '#FBF7F2'));
  if (t === 'night' && !snowStarted) { snowStarted = true; snowfall($('#snow')); }
  if (!dial) swapStill(t);
}
// without WebGL the still image is the hero, so it follows the theme
const still = $('#still');
still.querySelectorAll('source').forEach(s => { s.dataset.media = s.media; });
function swapStill(t) {
  still.querySelectorAll('source').forEach(s => {
    const phone = s.dataset.media.includes('aspect-ratio') ? '(max-aspect-ratio: 41/50)' : 'all';
    if (s.dataset.scene === 'night') s.media = t === 'night' ? phone : 'not all';
    else s.media = t === 'night' ? 'not all' : (phone === 'all' ? '' : phone);
  });
  const img = still.querySelector('img');
  const name = t === 'night' ? 'hero-night' : 'hero-pinkhour';
  img.src = `assets/img/${name}-${t === 'night' ? 1600 : 1280}.jpg`;
  img.srcset = t === 'night' ? 'assets/img/hero-night-1600.jpg 1600w' : 'assets/img/hero-pinkhour-640.jpg 640w, assets/img/hero-pinkhour-1280.jpg 1280w, assets/img/hero-pinkhour-1920.jpg 1920w';
}
let dial = null, lockUntil = 0;
applyTheme(root.dataset.theme);
showSun(root.dataset.theme === 'night' ? -0.5 : -0.06);

sw.addEventListener('click', () => {
  const next = root.dataset.theme === 'night' ? 'day' : 'night';
  const r = sw.getBoundingClientRect();
  lockUntil = performance.now() + 1800;
  iris(() => applyTheme(next), r.left + r.width / 2, r.top + r.height / 2);
  chime(next);
  if (dial) dial.set(next === 'night' ? -0.5 : -0.06, { animate: true, dur: 1800 });
  else showSun(next === 'night' ? -0.5 : -0.06);
});

/* ── title: the name warms up like the rooftop sign ─────── */
signWarmup($('#name'), { delay: 500, glow: false });

/* ── hint ───────────────────────────────────────────────── */
const hint = $('#hint');
const retireHint = () => hint.classList.add('is-done');

/* ── Sky Dial, after first paint ────────────────────────── */
async function bootDial() {
  const canvas = $('#sky');
  try {
    const { createSkyDial } = await import('../assets/interactive/sky-dial.js');
    const start = root.dataset.theme === 'night' ? -0.5 : -0.06;
    dial = await createSkyDial(canvas, { base: 'assets/interactive/layers/', scene: 'pavilion', h: start });
    requestAnimationFrame(() => canvas.classList.add('is-ready'));
    canvas.addEventListener('skydial:change', e => {
      const { h, theme } = e.detail;
      showSun(h);
      if (performance.now() > lockUntil && theme !== root.dataset.theme) { applyTheme(theme); chime(theme); }
    });
    canvas.addEventListener('pointerdown', retireHint, { once: true });
    canvas.addEventListener('keydown', retireHint, { once: true });
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => { ticking = false; dial.parallax(Math.min(1, scrollY / innerHeight) * 0.35); });
    }, { passive: true });
    // the hero leaves view: stop drawing nothing; Sky Dial is cheap, but pause the hint bob
  } catch (err) {
    hint.textContent = '';
    hint.hidden = true;
    console.info('Sky Dial unavailable, keeping the still.', err && err.message);
  }
}
const idle = window.requestIdleCallback || (fn => setTimeout(fn, 200));
if (document.readyState === 'complete') idle(bootDial); else addEventListener('load', () => idle(bootDial), { once: true });

/* ── live feed: one quiet line ───────────────────────────── */
const feed = createFeed(), feedEl = $('#feed'), feedText = $('#feedText');
const ago = d => { const s = Math.max(1, Math.round((Date.now() - d) / 1000)); return s < 60 ? `${s}s ago` : `${Math.round(s / 60)} min ago`; };
const line = e => `<b>${esc(e.label)}</b> &middot; ${esc(e.text)}${e.ms ? ` &middot; ${e.ms} ms` : e.country ? ` &middot; ${esc(e.country)}` : ''}`;
let last = feed.recent(1)[0];
function renderFeed(e, animate) {
  const set = () => { feedText.innerHTML = line(e); feedText.classList.remove('is-out'); feedEl.title = ago(e.time); };
  if (!animate || reduce) return set();
  feedText.classList.add('is-out');
  feedEl.classList.remove('is-pulse'); void feedEl.offsetWidth; feedEl.classList.add('is-pulse');
  setTimeout(set, 400);
}
if (last) renderFeed(last, false);
let feedGate = 0;
feed.subscribe(e => { // at most one change every 5 s, so the line never flickers
  last = e; const now = Date.now();
  if (now - feedGate < 5000) return; feedGate = now; renderFeed(e, true);
});

/* ── copy the MCP line ──────────────────────────────────── */
const copyBtn = $('#copy'), copyLabel = copyBtn.querySelector('.cmd__label');
$('#cmd').textContent = content.mcpCommand;
copyBtn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(content.mcpCommand); } catch { const r = document.createRange(); r.selectNodeContents($('#cmd')); getSelection().removeAllRanges(); getSelection().addRange(r); }
  copyBtn.classList.add('is-swap');
  setTimeout(() => { copyLabel.textContent = 'Copied'; copyBtn.classList.remove('is-swap'); copyBtn.classList.add('is-copied'); }, reduce ? 0 : 200);
  setTimeout(() => { copyLabel.textContent = 'Copy'; copyBtn.classList.remove('is-copied'); }, 2200);
  chime('copy');
});

/* ── sound: off until asked for ─────────────────────────── */
const soundBtn = $('#sound');
let ac = null;
soundBtn.addEventListener('click', () => {
  const on = soundBtn.getAttribute('aria-pressed') !== 'true';
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.textContent = `Sound: ${on ? 'on' : 'off'}`;
  if (on && !ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (on) chime('day');
});
// a soft two-note sine chime: rising for day, falling for night (a sign switching on)
function chime(kind) {
  if (!ac || soundBtn.getAttribute('aria-pressed') !== 'true') return;
  const notes = kind === 'night' ? [659.25, 493.88] : kind === 'copy' ? [880] : [523.25, 659.25];
  const t0 = ac.currentTime + 0.02;
  notes.forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f;
    const t = t0 + i * 0.16;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 1.3);
  });
}
