// Totality — Albretsen AS homepage. Vanilla ES modules, Web Animations API only.
import { develop, fracture, developOnView, rakingLight, EASE } from './assets/motion.js';
import { createFeed } from '../_shared/feed.js';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const idle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200));
const store = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch {} } };

const hero = $('.hero');
const canvas = $('.corona');
const plate = $('.plate');
const ring = $('.ring');
const bead = $('.bead');
const title = $('.name');
const chrome = $$('[data-chrome]');
const skipBtn = $('.skip-intro');

// ------------------------------------------------------------------ corona (WebGL, lazy)
let corona = null, coronaP = null;
function loadCorona() { return (coronaP ||= mount()); }
async function mount() {
  try {
    const { mountCorona } = await import('./assets/interactive/corona.js');
    const small = innerWidth * Math.min(devicePixelRatio || 1, 1.5) < 1100;
    // zoom 1: the shader cover-fits exactly like the <picture> crops, so the switch is invisible
    corona = await mountCorona(canvas, { plate: `assets/hero/totality-${small ? 960 : 1600}.webp`, zoom: 1, intro: 1 });
  } catch (e) { corona = null; }
  return corona;
}

// Our own develop driver (instead of corona.play) so the intro can be skipped cleanly.
let devRaf = 0, devDone = null;
function drive(c, duration, delay = 0) {
  cancelAnimationFrame(devRaf);
  if (reduce) { c.set({ intro: 1 }); return Promise.resolve(); }
  const start = performance.now() + delay;
  return new Promise((res) => {
    devDone = () => { cancelAnimationFrame(devRaf); c.set({ intro: 1 }); devDone = null; res(); };
    const step = (now) => {
      const x = Math.max(0, Math.min(1, (now - start) / duration));
      c.set({ intro: x < 1 ? 1 - Math.pow(2, -9 * x) * (1 - x) : 1 });
      if (x < 1) devRaf = requestAnimationFrame(step); else devDone?.();
    };
    devRaf = requestAnimationFrame(step);
  });
}

// The intro, composed from the motion study's signatures as one cancellable timeline.
// 0-0.9 s ring traced · 0.6 s bead ignites · 0.8-5 s plate develops brightest light first ·
// 2.2 s the name fractures in from two inks · 3.0 s nav and captions, last and quiet.
let introRunning = false;
async function playIntro() {
  if (introRunning) return;
  introRunning = true;
  // never hold the visitor in the dark: if the shader is not ready in 1.2 s, develop the <picture> instead
  const c = await Promise.race([loadCorona(), new Promise((r) => setTimeout(() => r(null), 1200))]);
  if (!c) loadCorona().then((late) => { if (late) { late.set({ intro: 1 }); setTimeout(() => canvas.classList.add('on'), 5200); } });
  const ringPath = ring.querySelector('.ring-path');
  const opt = (duration, delay, easing = EASE.exposure) => ({ duration, delay, easing, fill: 'both' });
  title.getAnimations({ subtree: true }).forEach((a) => a.cancel());

  const waits = [];
  ring.style.opacity = 1;
  waits.push(ringPath.animate([{ strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: .33 }, { strokeDashoffset: 0, opacity: 0 }],
    { duration: 2700, easing: EASE.shutter, fill: 'both' }).finished);
  waits.push(bead.animate([
    { opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.8)', offset: .18 },
    { opacity: 1, transform: 'scale(1)', offset: .4 }, { opacity: 0, transform: 'scale(.6)' },
  ], opt(3200, 600)).finished);
  if (c) {
    c.set({ intro: 0 }); canvas.classList.add('on');
    plate.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 5200, fill: 'both' });
    waits.push(drive(c, 4200, 800));
  } else {
    waits.push(develop(plate, { delay: 800, duration: 2600 })?.finished);
  }
  waits.push(fracture(title, { delay: 2200 }));
  chrome.forEach((n, i) => waits.push(n.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
    opt(900, 3000 + i * 90)).finished));
  root.classList.remove('pre-intro');   // every element now holds its own start state

  skipBtn.hidden = false;
  skipBtn.animate([{ opacity: 0 }, { opacity: 1 }], opt(600, 500));
  await Promise.all(waits.map((p) => p?.catch?.(() => {})));
  endIntro();
}
function endIntro() {
  introRunning = false;
  store.set('totality', '1');
  skipBtn.hidden = true;
  root.classList.remove('pre-intro');
  devDone?.();
}
function skipIntro() {
  // finish every running animation at once: the last frame is the page
  [...hero.getAnimations({ subtree: true }), ...chrome.flatMap((n) => n.getAnimations())]
    .forEach((a) => { try { a.finish(); } catch { a.cancel(); } });
  endIntro();
}
skipBtn.addEventListener('click', skipIntro);
addEventListener('keydown', (e) => { if (introRunning && e.key === 'Escape') skipIntro(); });

if (root.classList.contains('pre-intro')) {
  // the intro starts as soon as the module runs; the plate texture is small
  playIntro();
} else {
  // revisit or reduced motion: the resolved frame is already painted; the live corona arrives after idle
  idle(async () => {
    if (reduce) return;
    const c = await loadCorona();
    if (c) { c.set({ intro: 1 }); canvas.classList.add('on'); }
  });
}

// Pressing the moon replays totality (the cursor readout says so).
$('.moon').addEventListener('click', () => {
  if (introRunning) return;
  if (reduce) { fracture(title); return; }
  // a moment of darkness first, then the whole sequence again
  hero.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(.2)' }, { filter: 'brightness(1)' }], { duration: 700, easing: EASE.shutter });
  setTimeout(playIntro, 260);
});

// ------------------------------------------------------------------ copy the MCP line
const copyBtn = $('.copy');
copyBtn.addEventListener('click', async () => {
  const text = $('#cmd').textContent.trim();
  try { await navigator.clipboard.writeText(text); copyBtn.textContent = 'Copied'; }
  catch { const r = document.createRange(); r.selectNodeContents($('#cmd')); getSelection().removeAllRanges(); getSelection().addRange(r); copyBtn.textContent = 'Selected'; }
  copyBtn.classList.add('done');
  if (!reduce) copyBtn.animate([{ scale: .92 }, { scale: 1 }], { duration: 420, easing: EASE.exposure });
  setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('done'); }, 1800);
});

// ------------------------------------------------------------------ observation log (live feed)
const feed = createFeed();
const logTime = $('.log-time'), logText = $('.log-text'), logLine = $('.log-line');
const fmt = (d) => d.toTimeString().slice(0, 8);
function describe(e) {
  let extra = '';
  if (e.ms) extra = ` · ${e.ms} ms`;
  else if (e.country) extra = ` · ${e.country}`;
  else if (e.city) extra = ` · ${e.city}`;
  else if (e.sha) extra = ` · ${e.sha}`;
  return `${e.label} — ${e.text}${extra}`;
}
function showEvent(e, animate = true) {
  const set = () => { logTime.textContent = fmt(e.time); logText.textContent = describe(e); };
  if (!animate || reduce) return set();
  logLine.animate([{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(3px)' }], { duration: 240, easing: EASE.shutter }).finished.then(() => {
    set();
    logLine.animate([
      { opacity: 0, textShadow: '.12em 0 0 #ca6fd3, -.12em 0 0 #fdf8fd' },
      { opacity: 1, textShadow: '0 0 0 #ca6fd3, 0 0 0 #fdf8fd' },
    ], { duration: 700, easing: EASE.exposure });
  });
}
const first = feed.recent(1)[0];
if (first) showEvent(first, false);
feed.subscribe((e) => showEvent(e));

// ------------------------------------------------------------------ plates
developOnView('[data-develop]');
$$('.frame').forEach((f) => rakingLight(f));

// The loupe: a round aperture that reads the plate at 2.4x from the 1200 px scan.
// Fine pointers only; the high-resolution file loads on first approach.
if (matchMedia('(pointer: fine)').matches) {
  $$('.frame').forEach((frame) => {
    const lens = $('.loupe', frame), read = $('.loupe-read', frame);
    const hi = frame.dataset.hi; let loaded = false;
    const Z = 2.4, size = 168;
    frame.addEventListener('pointerenter', () => {
      if (!loaded) { loaded = true; lens.style.backgroundImage = `url(${hi})`; }
      frame.classList.add('lens');
    });
    frame.addEventListener('pointerleave', () => frame.classList.remove('lens'));
    frame.addEventListener('pointermove', (e) => {
      const r = frame.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      lens.style.transform = `translate(${x}px, ${y}px)`;
      lens.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      lens.style.backgroundPosition = `${-(x * Z - size / 2)}px ${-(y * Z - size / 2)}px`;
      read.textContent = `x ${(x / r.width).toFixed(3)}  y ${(y / r.height).toFixed(3)}  ×${Z}`;
    }, { passive: true });
  });
}

// ------------------------------------------------------------------ the aperture cursor (after first paint)
idle(async () => {
  const { mountCursor } = await import('./assets/interactive/cursor.js');
  mountCursor();
});
