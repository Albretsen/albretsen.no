// Prism Room · page script.
// 1. pick the best photo format, then wake <pixel-resolve> and <drag-room>
// 2. the bulb panel becomes a 20-pixel display of the live feed
// 3. object labels, sparkle on drop, reset, keyboard "open"
// 4. sortable cards and shelf, copy button, opt-in sound, lazy Lenis motion

import { createFeed } from '../../_shared/feed.js';
import { sortable } from './sortable.js';

const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOME = { 'fun-libs': [21.29, 50.09], toolrails: [28.13, 58.6], harbor: [64.06, 70.3], plant: [71.48, 70.98], 'mcp-emails': [88.36, 62.35] };
const COLOR = { 'mcp-emails': 'var(--pr-peach)', 'fun-libs': 'var(--pr-gum)', toolrails: 'var(--pr-sky)', 'albretsen.no': 'var(--pr-mint)', harbor: 'var(--pr-lilac)' };
const BULBS = { cols: [31.02, 34.53, 38.13, 41.64, 45.08], rows: [15.10, 20.44, 25.67, 30.66], r: 1.33 };

// ---------- 1. photo format + components ----------
const AVIF = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAAD5bWV0YQAAAAAAAAAvaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAFBpY3R1cmVIYW5kbGVyAAAAAA5waXRtAAAAAAABAAAAHmlsb2MAAAAARAAAAQABAAAAAQAAASEAAAAdAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUNvbG9yAAAAAGppcHJwAAAAS2lwY28AAAAUaXNwZQAAAAAAAAAQAAAAEAAAABBwaXhpAAAAAAMICAgAAAAMYXYxQ4EADAAAAAATY29scm5jbHgAAgACAAIAAAAAF2lwbWEAAAAAAAAAAQABBAECgwQAAAAlbWRhdAoKAAAAAZ/41fIAgDIPEACXgBBAggAAEABcExAp';
const supportsAvif = () => new Promise(res => { const i = new Image(); i.onload = () => res(i.width > 0); i.onerror = () => res(false); i.src = AVIF; });

async function boot() {
  const avif = await supportsAvif();
  const ext = avif ? 'avif' : 'webp';
  const need = Math.min(innerWidth < 900 ? innerWidth * 1.7 : innerWidth, 2560) * Math.min(devicePixelRatio || 1, 1.5);
  const size = need <= 1280 ? 1280 : need <= 1920 ? 1920 : 2560;
  $('#roomPhoto').setAttribute('src', `assets/hero/room-${size}.${ext}`);
  const wall = $('#wallPhoto');
  wall.setAttribute('src', `assets/hero/sunwall-${innerWidth < 900 ? 1400 : 2000}.${ext}`);

  await import('../assets/interactive/drag-room.js');
  const { PixelResolve } = await import('../assets/interactive/pixel-resolve.js');
  // the footer photo is the same component, but it only wakes (and downloads) near the viewport
  customElements.define('pixel-resolve-lazy', class extends PixelResolve {
    connectedCallback() {
      new IntersectionObserver((es, io) => {
        if (!es.some(e => e.isIntersecting)) return;
        io.disconnect(); super.connectedCallback(); this.resolve = reduce ? 1 : .15; driveWall(this);
      }, { rootMargin: '500px' }).observe(this);
    }
  });
  setupRoom();
  if (!reduce) import('../assets/motion.js').then(m => m.initMotion()).catch(() => {});
  else $('#roomPhoto').resolve = 1;
}

// footer photo resolves as it rises into view
function driveWall(el) {
  if (reduce) return;
  const tick = () => {
    const r = el.getBoundingClientRect(), vh = innerHeight;
    const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * .65)));
    el.resolve = .15 + .85 * p;
  };
  addEventListener('scroll', tick, { passive: true }); tick();
  // Lenis drives scroll via native scrollTo, so the scroll event still fires
}

// ---------- 2. bulbs ----------
const bulbs = [];
function makeBulbs() {
  const host = $('#bulbs'); let i = 0;
  for (const y of BULBS.rows) for (const x of BULBS.cols) {
    const b = document.createElement('i'); b.className = 'pr-bulb';
    b.style.cssText = `left:${x}%;top:${y}%;--r:${BULBS.r}cqw;--i:${i++}`;
    host.append(b); bulbs.push(b);
  }
}
// the prism A: crossbar is the spectrum, like the mark
const A = '..y..' + '.l.l.' + 'pglsm' + 'l...l';
const KEY = { p: 'var(--pr-peach)', g: 'var(--pr-gum)', l: 'var(--pr-lilac)', s: 'var(--pr-sky)', m: 'var(--pr-mint)', y: 'var(--pr-lemon)' };
function showPattern(p) { bulbs.forEach((b, i) => { const c = KEY[p[i]]; b.classList.toggle('on', !!c); if (c) b.style.setProperty('--c', c); }); }
function showEvents(list, fresh) {
  bulbs.forEach((b, i) => { const e = list[i]; b.classList.toggle('on', !!e); if (e) b.style.setProperty('--c', COLOR[e.product] || 'var(--pr-paper)'); });
  if (fresh && !reduce) { const b = bulbs[0]; b.classList.add('pop'); setTimeout(() => b.classList.remove('pop'), 260); }
}
const describe = e => {
  const tail = e.ms ? `${e.ms} ms` : e.country ? e.country : e.city ? `${e.city} · ${e.kb} KB` : e.sha ? e.sha : '';
  return `${e.label} · ${e.text}${tail ? ' · ' + tail : ''}`;
};
function startFeed() {
  const feed = createFeed();
  let events = feed.recent(20);
  const dot = $('#liveDot'), text = $('#liveText');
  const line = (e, animate) => {
    dot.style.setProperty('--c', COLOR[e.product]); text.textContent = describe(e);
    if (animate && !reduce) { text.classList.remove('in'); void text.offsetWidth; text.classList.add('in'); }
  };
  line(events[0], false);
  showPattern(A);
  setTimeout(() => showEvents(events), reduce ? 0 : 2200);
  feed.subscribe(e => { events = [e, ...events].slice(0, 20); showEvents(events, true); line(e, true); blip(660 + Math.random() * 120, .03); });
}

// ---------- 3. the room ----------
function setupRoom() {
  const room = $('#dragRoom'), wrap = $('#room'), tag = $('#tag'), stage = $('#stage');
  const photo = $('#roomPhoto');
  // let the panorama scroll sideways on phones
  room.style.touchAction = 'pan-x pan-y'; photo.style.touchAction = 'pan-x pan-y';
  if (stage.scrollWidth > stage.clientWidth) stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) * .5;

  const showTag = el => {
    const r = el.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    tag.querySelector('.tag-name').textContent = el.dataset.name;
    const s = tag.querySelector('.tag-status'); s.textContent = el.dataset.status === 'decor' ? 'Movable' : el.dataset.status; s.dataset.s = el.dataset.status;
    tag.style.left = `${r.left + r.width / 2 - w.left}px`; tag.style.top = `${r.top - w.top}px`;
    tag.classList.add('show');
  };
  const hideTag = () => tag.classList.remove('show');
  let dragging = false;
  for (const el of room.querySelectorAll('[data-drag]')) {
    el.addEventListener('pointerenter', () => { if (!dragging) showTag(el); });
    el.addEventListener('pointerleave', hideTag);
    el.addEventListener('focus', () => showTag(el));
    el.addEventListener('blur', hideTag);
    el.addEventListener('pointerdown', () => { dragging = true; hideTag(); blip(330, .05, 'square'); });
    el.addEventListener('pointerup', () => { dragging = false; });
    el.addEventListener('keydown', e => {
      if (/^Arrow/.test(e.key)) requestAnimationFrame(() => showTag(el));
      if (e.key === 'Enter' && HOME[el.dataset.id] && el.dataset.id !== 'plant') {
        const card = document.getElementById('p-' + el.dataset.id);
        card?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        card?.querySelector('.grip')?.focus({ preventScroll: true });
      }
    });
  }
  room.addEventListener('arrange', e => {
    const el = room.querySelector(`[data-id="${e.detail.id}"]`);
    // pitch follows depth: nearer objects sound lower
    blip(880 - e.detail.y * 6, .06, 'square');
    sparkle(el, wrap);
  });
  $('#reset').addEventListener('click', () => {
    for (const el of room.querySelectorAll('[data-drag]')) {
      const [x, y] = HOME[el.dataset.id];
      el.style.transition = reduce ? 'none' : 'left .6s cubic-bezier(.2,1.3,.4,1), bottom .6s cubic-bezier(.2,1.3,.4,1), filter .3s';
      el.dataset.x = x; el.dataset.y = y; room._place(el);
    }
    room._save();
    try { localStorage.removeItem('drag-room:prism-room-89'); } catch {}
    blip(520, .05); setTimeout(() => blip(780, .05), 90);
  });
}

function sparkle(el, wrap) {
  if (reduce || !el) return;
  const r = el.getBoundingClientRect(), w = wrap.getBoundingClientRect();
  const s = document.createElement('div'); s.className = 'pr-sparkle sparkle';
  s.style.left = `${r.right - w.left - r.width * .15}px`; s.style.top = `${r.top - w.top + r.height * .1}px`;
  wrap.append(s); setTimeout(() => s.remove(), 620);
}

// ---------- 4. sound (off until asked) ----------
let ctx = null, soundOn = false;
function blip(freq, len = .05, type = 'triangle') {
  if (!soundOn || !ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
  o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 1.5, t + len);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + len + .06);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + len + .08);
}
function setupSound() {
  const btn = $('#sound');
  btn.addEventListener('click', () => {
    soundOn = !soundOn; btn.setAttribute('aria-pressed', soundOn); btn.querySelector('.sound-state').textContent = soundOn ? 'on' : 'off';
    if (soundOn && !ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (soundOn) { ctx.resume(); blip(523, .05); setTimeout(() => blip(784, .07), 80); }
  });
}

// ---------- copy ----------
function setupCopy() {
  document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const txt = $(btn.dataset.copy).textContent.trim(), label = btn.querySelector('span');
    try { await navigator.clipboard.writeText(txt); label.textContent = 'Copied'; btn.classList.add('done'); blip(988, .05); }
    catch { label.textContent = 'Select'; getSelection().selectAllChildren($(btn.dataset.copy)); }
    setTimeout(() => { label.textContent = 'Copy'; btn.classList.remove('done'); }, 1600);
  }));
}

// ---------- go ----------
makeBulbs();
startFeed();
setupSound();
setupCopy();
const live = $('#sortLive');
const announce = m => { live.textContent = ''; requestAnimationFrame(() => live.textContent = m); };
document.querySelectorAll('[data-sortable]').forEach(l => sortable(l, { announce, onPick: () => blip(330, .04, 'square'), onDrop: () => blip(560, .05, 'square') }));
boot();
