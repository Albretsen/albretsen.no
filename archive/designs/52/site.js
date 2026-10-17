// Design 52 · Violet Cabinet · site.js
// Scroll story (five plates), crystal morph centrepiece, discharge bolt, loupe,
// live readings, lazy three.js scan bust, plate tilt, retired drawer, opt-in sound.
import { initLenis, magnetic } from './assets/motion.js';
import { mountCrystalMorph } from './assets/svg/crystal-morph.js';
import { HABITS } from './assets/svg/crystals.js';
import { createFeed } from '../_shared/feed.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const story = $('.story');
const stage = $('.stage');
const layers = $$('.layer', story);
const texts = $$('.t', story);
const railLinks = $$('.rail a', story);
const STAGES = ['cube', 'octahedron', 'quartz', 'dodecahedron', 'mark'];
const LAST = STAGES.length - 1;

/* ------------------------------------------------------------ sound (opt-in) */
let audio = null, soundOn = false;
const sndBtn = $('.snd');
sndBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  sndBtn.setAttribute('aria-pressed', String(soundOn));
  sndBtn.querySelector('b').textContent = soundOn ? 'on' : 'off';
  if (soundOn) { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); crackle(0.5); }
});
function crackle(gain = 0.35) {
  if (!soundOn || !audio) return;
  const t = audio.currentTime, len = 0.22;
  const buf = audio.createBuffer(1, Math.floor(audio.sampleRate * len), audio.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) { // sparse clicks that decay: an electrical crackle
    const k = i / d.length;
    d[i] = (Math.random() < 0.08 + 0.3 * (1 - k) ? (Math.random() * 2 - 1) : 0) * Math.pow(1 - k, 2.2);
  }
  const src = audio.createBufferSource(); src.buffer = buf;
  const bp = audio.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.7;
  const g = audio.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
  const hum = audio.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 50;
  const hg = audio.createGain(); hg.gain.setValueAtTime(gain * 0.12, t); hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  src.connect(bp).connect(g).connect(audio.destination);
  hum.connect(hg).connect(audio.destination);
  src.start(t); hum.start(t); hum.stop(t + 0.36);
}

/* ------------------------------------------------------------ crystal morph */
const morphEl = $('.morph');
let morph = null;
const caption = document.createElement('p');
caption.className = 'case-cap';
$('.case').appendChild(caption);
try {
  $('.morph-static')?.remove();
  morph = mountCrystalMorph(morphEl, { stages: STAGES, labels: false, spin: !reduce });
  morph.setProgress(0);
} catch (e) { console.warn('morph', e); }
function setCaption(i) {
  const name = STAGES[i];
  caption.innerHTML = name === 'mark'
    ? '<i>fig. 5.</i> Twin · 84°33′ · Albretsen AS'
    : `<i>Plate A, fig. ${HABITS[name].fig}.</i> ${HABITS[name].name} · ${HABITS[name].system}`;
}

/* ------------------------------------------------------------ scroll state */
let active = -1, target = 0, smooth = 0;
const storyTop = () => story.getBoundingClientRect().top + scrollY;
const unit = () => document.getElementById("s1").offsetTop || innerHeight; // one scene = one CSS 100vh
function readScroll() {
  target = clamp((scrollY - storyTop()) / unit(), 0, LAST);
  const a = clamp(Math.round(target), 0, LAST);
  if (a !== active) setActive(a);
}
function setActive(a) {
  const first = active === -1;
  active = a;
  story.dataset.active = a;
  layers.forEach((l) => l.classList.toggle('on', l.dataset.for.split(' ').includes(String(a))));
  texts.forEach((t) => t.classList.toggle('on', +t.dataset.s === a));
  railLinks.forEach((r) => (+r.dataset.i === a ? r.setAttribute('aria-current', 'step') : r.removeAttribute('aria-current')));
  setCaption(a);
  if (a >= 3) loadBust();
  if (!first) { discharge(); crackle(); }
}
function frame() {
  smooth += (target - smooth) * (reduce ? 1 : 0.12);
  if (morph) morph.setProgress(reduce ? Math.round(target) : smooth);
  if (bust) { // the beam digitises the bust as you arrive, and finishes as you leave the story
    const raw = (scrollY - storyTop()) / unit();
    const p = raw < 4 ? clamp((raw - 3.35) / 0.65, 0, 1) * 0.62 : 0.62 + clamp((raw - 4) / 0.4, 0, 1) * 0.38;
    bust.setProgress(p + Math.sin(performance.now() / 900) * 0.025);
  }
  requestAnimationFrame(frame);
}
addEventListener('scroll', readScroll, { passive: true });
addEventListener('resize', readScroll);

// keyboard users: focusing something inside a plate brings that plate up
texts.forEach((t) => t.addEventListener('focusin', () => { if (+t.dataset.s !== active) goTo(+t.dataset.s); }));
let lenis = null;
function goTo(i, immediate = false) {
  const y = storyTop() + i * unit();
  if (lenis) lenis.scrollTo(y, { immediate, force: true }); else scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
}
railLinks.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); goTo(+a.dataset.i); }));

/* ------------------------------------------------------------ cover mapping */
// where a point (u,v in 0..1 of the source image) lands on screen, for object-fit: cover
function coverRect(img) {
  const r = img.getBoundingClientRect();
  const nw = img.naturalWidth || +img.getAttribute('width'), nh = img.naturalHeight || +img.getAttribute('height');
  const s = Math.max(r.width / nw, r.height / nh);
  const w = nw * s, h = nh * s;
  const [px, py] = getComputedStyle(img).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
  return { x: r.left + (r.width - w) * px, y: r.top + (r.height - h) * py, w, h };
}
const onImg = (sel, u, v) => { const c = coverRect($(sel)); return [c.x + c.w * u, c.y + c.h * v]; };
const onBox = (sel, u, v) => { const r = $(sel).getBoundingClientRect(); return [r.left + r.width * u, r.top + r.height * v]; };
const TARGETS = [
  () => onImg('.l-cabinet .plate-img', 1250 / 1440, 190 / 900), // the glint on the cabinet quartz
  () => onBox('.funlibs-card', 0.5, 0.1),
  () => onImg('.l-current .plate-img', 378 / 1440, 186 / 900), // Franklin's key
  () => onBox('.tesla-photo', 0.5, 0.17), // the top of the coil
  () => onBox('.bust-live', 0.5, 0.3),
];

/* ------------------------------------------------------------ discharge bolt */
const boltPath = $('.bolt path');
let boltTimer = 0;
function jag(a, b, depth, spread) {
  if (depth === 0) return [a, b];
  const mx = (a[0] + b[0]) / 2 + (Math.random() - 0.5) * spread;
  const my = (a[1] + b[1]) / 2 + (Math.random() - 0.5) * spread;
  return [...jag(a, [mx, my], depth - 1, spread / 2).slice(0, -1), ...jag([mx, my], b, depth - 1, spread / 2)];
}
function discharge() {
  if (reduce) return;
  const sr = stage.getBoundingClientRect();
  const cr = morphEl.getBoundingClientRect();
  const a = [cr.left + cr.width / 2 - sr.left, cr.top + cr.height * 0.2 - sr.top];
  setTimeout(() => { // let the plate settle first
    let b;
    try { b = TARGETS[active](); } catch { return; }
    b = [b[0] - sr.left, b[1] - sr.top];
    const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let n = 0;
    clearInterval(boltTimer);
    boltTimer = setInterval(() => {
      const pts = jag(a, b, 6, dist * 0.32);
      boltPath.setAttribute('d', 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'));
      boltPath.style.opacity = n > 7 ? String(Math.max(0, 1 - (n - 7) / 4)) : (n % 2 ? '1' : '.55');
      if (++n > 11) { clearInterval(boltTimer); boltPath.style.opacity = '0'; }
    }, 55);
  }, 260);
}
const zap = () => { discharge(); crackle(0.5); };
morphEl.addEventListener('click', zap);
morphEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zap(); } });

/* ------------------------------------------------------------ loupe */
const loupe = $('.loupe'), loupeRead = $('.loupe-read');
const ZOOM = 2.6, hiLoaded = new Set();
if (finePointer) {
  stage.addEventListener('pointermove', (e) => {
    const img = active <= 1 ? $('.l-cabinet .plate-img') : active === 2 ? $('.l-current .plate-img') : null;
    const vr = $('.vitrine').getBoundingClientRect();
    const blocked = !img || e.clientX < vr.right + 40 || e.target.closest('.rail, .reading, .specimen-card, a, button');
    if (blocked) { loupe.classList.remove('on'); return; }
    const hi = img.dataset.hi;
    if (!hiLoaded.has(hi)) { hiLoaded.add(hi); const im = new Image(); im.onload = () => (img.dataset.hiReady = '1'); im.src = hi; }
    const src = img.dataset.hiReady ? hi : img.currentSrc;
    const c = coverRect(img), sr = stage.getBoundingClientRect();
    const R = loupe.offsetWidth / 2;
    const u = (e.clientX - c.x) / c.w, v = (e.clientY - c.y) / c.h;
    loupe.style.translate = `${e.clientX - sr.left}px ${e.clientY - sr.top}px`;
    loupe.style.backgroundImage = `url("${src}")`;
    loupe.style.backgroundSize = `${c.w * ZOOM}px ${c.h * ZOOM}px`;
    loupe.style.backgroundPosition = `${-(u * c.w * ZOOM - R)}px ${-(v * c.h * ZOOM - R)}px`;
    loupeRead.textContent = `×${ZOOM} · x ${u.toFixed(3)} · y ${v.toFixed(3)}`;
    loupe.classList.add('on');
  });
  stage.addEventListener('pointerleave', () => loupe.classList.remove('on'));
  addEventListener('scroll', () => loupe.classList.remove('on'), { passive: true });
}

/* ------------------------------------------------------------ the scan bust (three.js, lazy) */
let bustLoading = false, bust = null;
async function loadBust() {
  if (bustLoading || reduce) return;
  bustLoading = true;
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;
    const { mountScanBust } = await import('./assets/3d/scan-bust.js');
    bust = await mountScanBust($('.bust-live'), {});
    $('.l-scan').classList.add('live');
  } catch (e) { console.warn('bust stays a poster', e); }
}

/* ------------------------------------------------------------ live readings */
const list = $('.reading-list');
const ago = (d) => { const s = Math.max(0, Math.round((Date.now() - d) / 1000)); return s < 60 ? `${s}s` : `${Math.round(s / 60)}m`; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const row = (e) => {
  const li = document.createElement('li');
  li.dataset.t = e.time.getTime();
  const where = e.country ? `, ${e.country}` : e.city ? `, ${e.city}` : '';
  li.innerHTML = `<span><b>${esc(e.label)}</b> ${esc(e.text)}${esc(where)}</span><span>${ago(e.time)}</span>`;
  return li;
};
try {
  const feed = createFeed();
  feed.recent(3).forEach((e) => list.appendChild(row(e)));
  feed.subscribe((e) => {
    const li = row(e); if (!reduce) li.classList.add('fresh');
    list.prepend(li);
    while (list.children.length > 3) list.lastElementChild.remove();
  });
  setInterval(() => $$('li', list).forEach((li) => (li.lastElementChild.textContent = ago(+li.dataset.t))), 5000);
} catch (e) { console.warn('feed', e); }

/* ------------------------------------------------------------ copy the MCP line */
$$('.copy').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); } catch { /* clipboard denied: the line is visible to select */ }
  const s = b.querySelector('.copy-state');
  b.classList.add('done'); s.textContent = 'copied';
  setTimeout(() => { b.classList.remove('done'); s.textContent = 'copy'; }, 1800);
}));

/* ------------------------------------------------------------ plate tilt + glare */
if (!reduce && finePointer) {
  $$('.plate-link').forEach((a) => {
    const t = a.querySelector('.plate-tilt');
    a.addEventListener('pointermove', (e) => {
      const r = a.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.setProperty('--rx', `${(x - 0.5) * 14}deg`);
      t.style.setProperty('--ry', `${(0.5 - y) * 12}deg`);
      t.style.setProperty('--gx', `${x * 100}%`); t.style.setProperty('--gy', `${y * 100}%`);
    });
    a.addEventListener('pointerleave', () => { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); });
  });
}

/* ------------------------------------------------------------ retired drawer */
const drawer = $('.drawer'), drawerBtn = $('.drawer-btn');
drawerBtn.addEventListener('click', () => {
  const open = drawer.dataset.state !== 'open';
  drawer.dataset.state = open ? 'open' : 'closed';
  drawerBtn.setAttribute('aria-expanded', String(open));
  if (open) crackle(0.25);
});

/* ------------------------------------------------------------ boot */
readScroll();
requestAnimationFrame(frame);
magnetic(document);
initLenis().then((l) => {
  lenis = l;
  const ch = new URLSearchParams(location.search).get('ch');
  if (ch != null) { goTo(clamp(+ch, 0, LAST), true); readScroll(); smooth = target; }
}).catch(() => {
  const ch = new URLSearchParams(location.search).get('ch');
  if (ch != null) { goTo(clamp(+ch, 0, LAST), true); readScroll(); smooth = target; }
});
// in-page anchors outside the story (header links) go through Lenis when present
$$('a[href^="#"]:not(.rail a)').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  const el = id.length > 1 && document.querySelector(id);
  if (!el) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(el, { offset: -20 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  if (id !== '#top') el.setAttribute('tabindex', '-1'), el.focus({ preventScroll: true });
}));
