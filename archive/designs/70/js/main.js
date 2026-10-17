// Albretsen AS · 70 · Stucco Hour
// One idea: the room is lit by the real sun over Norway. A thin horizon below it shows today's
// path of the sun over a live, physically based sky; drag the sun and the room follows.
import { mountSky, sunPosition, skyPhase } from '../assets/interactive/sky.js';
import { lightLeak, scrollShadow } from '../assets/motion.js';
import { createFeed } from '../../_shared/feed.js';

const LAT = 59.91, LON = 10.75, TZ = 'Europe/Oslo';
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const $ = id => document.getElementById(id);
const root = document.documentElement;

// ───────────────────────── time helpers (always Norwegian local time)
const hhmm = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function osloMidnight(d) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const g = new Date(day + 'T00:00:00Z');
  const off = new Date(g.toLocaleString('en-US', { timeZone: TZ })) - new Date(g.toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(+g - off);
}
const pinned = window.__sunT && /[?&]t=/.test(location.search) ? window.__sunT : null;
const realNow = () => pinned || new Date();

// ───────────────────────── the four plates of the same room
const PHASES = [['night', -9], ['blue', -3], ['golden', 4], ['day', 16]];
const plates = $('plates');
const plateEls = {};
const ready = new Set();
const sizesFor = p => (p === 'golden' ? [960, 1600, 2400] : [960, 1600]);
{
  const first = plates.querySelector('picture.plate');
  if (first) {
    plateEls[first.dataset.phase] = first;
    const img = first.querySelector('img');
    const mark = () => { ready.add(first.dataset.phase); };
    img.complete ? mark() : img.addEventListener('load', mark, { once: true });
  }
}
function plate(phase) {
  if (plateEls[phase]) return plateEls[phase];
  const pic = document.createElement('picture');
  pic.className = 'plate'; pic.dataset.phase = phase;
  const set = f => sizesFor(phase).map(w => `assets/hero/terrace-${phase}-${w}.${f} ${w}w`).join(', ');
  pic.innerHTML = `<source type="image/avif" sizes="max(100vw, 160vh)" srcset="${set('avif')}"><source type="image/webp" sizes="max(100vw, 160vh)" srcset="${set('webp')}"><img src="assets/hero/terrace-${phase}-1600.jpg" width="1600" height="904" alt="" decoding="async">`;
  const img = pic.querySelector('img');
  img.addEventListener('load', () => { ready.add(phase); applyLight(current.el); }, { once: true });
  plates.appendChild(pic);
  plateEls[phase] = pic;
  return pic;
}
const loadAllPlates = (() => { let done = false; return () => { if (!done) { done = true; PHASES.forEach(([p]) => plate(p)); } }; })();

function weights(el) {
  let i = 0;
  while (i < PHASES.length - 2 && el > PHASES[i + 1][1]) i++;
  const raw = Math.max(0, Math.min(1, (el - PHASES[i][1]) / (PHASES[i + 1][1] - PHASES[i][1])));
  // each plate holds its own light for most of its band; the dissolve happens only near the change,
  // so a still page never shows two suns at once
  const x = Math.max(0, Math.min(1, (raw - 0.36) / 0.28)), t = x * x * (3 - 2 * x);
  return { lo: PHASES[i][0], hi: PHASES[i + 1][0], t };
}
function applyLight(el) {
  const { lo, hi, t } = weights(el);
  // ask for what this light needs; nothing else loads until the visitor reaches for the sun
  if (t > 0.02) plate(hi);
  if (t < 0.98) plate(lo);
  const loReady = ready.has(lo), hiReady = ready.has(hi);
  for (const [p, pic] of Object.entries(plateEls)) {
    let o = 0;
    if (p === lo) o = loReady ? 1 : 0;
    if (p === hi) o = hiReady ? (loReady ? t : 1) : 0;
    if (!loReady && !hiReady && p === window.__plate) o = 1; // keep the first plate until a better one arrives
    pic.style.opacity = o;
  }
  root.dataset.paint = el < -2 ? 'light' : 'ink';
}

// ───────────────────────── the horizon strip
const horizon = $('horizon'), hour = $('hour'), nowBtn = $('now'), hint = $('hint');
const arc = $('arc'), arcDay = arc.querySelector('.arc__day'), arcNight = arc.querySelector('.arc__night');
const HZ = 0.70; // horizon line as a fraction of the strip height (sky.js draws the sea below 30%)
let day = null; // { midnight, samples[], rise, set, k }
const yOf = el => Math.max(0.12, Math.min(0.9, HZ - el * day.k));

function computeDay(d) {
  const midnight = osloMidnight(d);
  const samples = []; let rise = null, set = null, max = -90, prev = null;
  for (let m = 0; m <= 1440; m += 6) {
    const el = sunPosition(new Date(+midnight + m * 60000), LAT, LON).elevation;
    samples.push([m, el]); max = Math.max(max, el);
    if (prev !== null) {
      const cross = (prev[1] + 0.83) / (prev[1] - el); // linear crossing of the -0.83° rise/set line
      if (prev[1] < -0.83 && el >= -0.83) rise = prev[0] + cross * 6;
      if (prev[1] >= -0.83 && el < -0.83) set = prev[0] + cross * 6;
    }
    prev = [m, el];
  }
  day = { midnight, samples, rise, set, k: 0.56 / Math.max(max, 16) };
  const pt = ([m, el]) => `${(m / 1440 * 1440).toFixed(1)} ${(yOf(el) * 100).toFixed(2)}`;
  arcNight.setAttribute('d', 'M' + samples.map(pt).join(' L'));
  let dPath = '', on = false;
  for (const s of samples) {
    if (s[1] >= 0) { dPath += (on ? ' L' : ' M') + pt(s); on = true; } else on = false;
  }
  arcDay.setAttribute('d', dPath);
  const fmtM = m => (m == null ? '—' : hhmm.format(new Date(+midnight + m * 60000)));
  $('rise').textContent = fmtM(rise);
  $('set').textContent = fmtM(set);
}

const PHASE_WORD = { night: 'night', blue: 'blue hour', golden: 'golden hour', day: 'daylight' };
let current = { m: 0, el: window.__sunEl ?? 5, live: true };

function minuteOf(d) { return Math.max(0, Math.min(1439, (d - osloMidnight(d)) / 60000)); }

let sky = null;
function render(m, live) {
  const date = new Date(+day.midnight + m * 60000);
  const el = sunPosition(date, LAT, LON).elevation;
  current = { m, el, live };
  hour.style.setProperty('--x', (m / 1440).toFixed(5));
  hour.style.setProperty('--y', yOf(el).toFixed(4));
  hint.style.setProperty('--x', (m / 1440).toFixed(5));
  const phase = skyPhase(el), t = hhmm.format(date);
  $('readT').textContent = t;
  $('readP').textContent = '· ' + PHASE_WORD[phase];
  $('readK').textContent = live ? 'Now in Norway' : 'In Norway at';
  horizon.classList.toggle('hint-up', yOf(el) > 0.6);
  hour.setAttribute('aria-valuenow', Math.round(m));
  hour.setAttribute('aria-valuetext', `${t}, ${PHASE_WORD[phase]}, sun ${Math.round(el)} degrees${live ? ', now' : ''}`);
  horizon.dataset.paint = el < -1.5 ? 'light' : 'ink';
  nowBtn.hidden = live;
  applyLight(el);
  if (sky) sky.setTime(live ? (pinned || null) : date);
}

function goLive() {
  const d = realNow();
  if (!day || osloMidnight(d) - day.midnight !== 0) computeDay(d);
  render(minuteOf(d), true);
}

// mount the live sky after first paint
const canvas = $('sky');
requestAnimationFrame(() => setTimeout(() => {
  try { sky = mountSky(canvas, { lat: LAT, lon: LON, sea: true, horizon: 1 - HZ, resolution: 0.5, time: pinned || undefined }); }
  catch (e) { /* no WebGL2: the CSS gradient below the canvas stays */ }
  if (!current.live) sky?.setTime(new Date(+day.midnight + current.m * 60000));
}, 0));

goLive();
setInterval(() => { if (current.live) goLive(); }, 60000);

// once the page is idle, fetch the other three plates quietly so the first drag is instant
const idle = window.requestIdleCallback || (f => setTimeout(f, 1800));
addEventListener('load', () => idle(loadAllPlates, { timeout: 4000 }), { once: true });

// ── drag the sun
let dragging = false, tween = 0;
const mFromX = x => { const r = horizon.getBoundingClientRect(); return Math.max(0, Math.min(1439, (x - r.left) / r.width * 1440)); };
function scrubTo(m) { cancelAnimationFrame(tween); plates.classList.add('is-scrubbing'); render(m, false); }
horizon.addEventListener('pointerdown', e => {
  if (e.target === nowBtn || e.button > 0) return;
  loadAllPlates(); hideHint();
  dragging = true; horizon.classList.add('is-dragging'); horizon.setPointerCapture(e.pointerId);
  hour.focus({ preventScroll: true });
  scrubTo(mFromX(e.clientX));
  e.preventDefault();
});
horizon.addEventListener('pointermove', e => { if (dragging) scrubTo(mFromX(e.clientX)); });
const end = () => { if (!dragging) return; dragging = false; horizon.classList.remove('is-dragging'); plates.classList.remove('is-scrubbing'); };
horizon.addEventListener('pointerup', end);
horizon.addEventListener('pointercancel', end);

hour.addEventListener('focus', () => { loadAllPlates(); });
hour.addEventListener('keydown', e => {
  const step = e.shiftKey ? 60 : 10;
  const keys = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 60, PageDown: -60 };
  let m = null;
  if (e.key in keys) m = current.m + keys[e.key];
  else if (e.key === 'Home') m = 0;
  else if (e.key === 'End') m = 1439;
  else if (e.key === 'Escape') { backToNow(); e.preventDefault(); return; }
  if (m === null) return;
  e.preventDefault(); hideHint();
  scrubTo(Math.max(0, Math.min(1439, m)));
  plates.classList.remove('is-scrubbing');
});

// ── back to now: the sun walks home along its path
function backToNow() {
  const target = minuteOf(realNow());
  const from = current.m;
  plates.classList.remove('is-scrubbing');
  if (reduce.matches || Math.abs(target - from) < 2) { goLive(); return; }
  const t0 = performance.now(), dur = Math.min(1600, 500 + Math.abs(target - from) * 1.2);
  const step = now => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    if (k < 1) { render(from + (target - from) * e, false); tween = requestAnimationFrame(step); }
    else goLive();
  };
  cancelAnimationFrame(tween); tween = requestAnimationFrame(step);
}
nowBtn.addEventListener('click', () => { backToNow(); hour.focus({ preventScroll: true }); });

// ── a one-time, quiet hint
let hinted = false;
function hideHint() { hinted = true; horizon.classList.remove('show-hint'); }
setTimeout(() => {
  if (hinted) return;
  horizon.classList.add('show-hint');
  setTimeout(hideHint, 5200);
}, 3200);

// ───────────────────────── copy the MCP line
const copyBtn = $('copy'), label = copyBtn.querySelector('.cmd__label'), status = $('copyStatus');
copyBtn.addEventListener('click', async e => {
  const text = $('cmd').textContent.trim();
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; }
  catch {
    const r = document.createRange(); r.selectNodeContents($('cmd'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    try { ok = document.execCommand('copy'); } catch { ok = false; }
  }
  const b = copyBtn.getBoundingClientRect();
  copyBtn.style.setProperty('--cx', (e.clientX ? (e.clientX - b.left) / b.width * 100 : 50) + '%');
  copyBtn.classList.remove('is-done'); void copyBtn.offsetWidth; copyBtn.classList.add('is-done');
  label.textContent = ok ? 'Copied' : 'Selected';
  status.textContent = ok ? 'Command copied to the clipboard.' : 'Command selected. Press Command or Control C to copy.';
  clearTimeout(copyBtn._t);
  copyBtn._t = setTimeout(() => { label.textContent = 'Copy'; copyBtn.classList.remove('is-done'); }, 2200);
});

// ───────────────────────── the pulse: one line from the live feed, exchanged by fading
const pulse = $('pulse');
const ago = d => { const s = Math.max(0, Math.round((Date.now() - d) / 1000)); return s < 10 ? 'just now' : s < 60 ? `${s} s ago` : `${Math.round(s / 60)} min ago`; };
const say = e => `${e.label}: ${e.text}${e.country ? ', ' + e.country : ''}${e.city ? ', ' + e.city : ''} · ${ago(e.time)}`;
try {
  const feed = createFeed();
  const [last] = feed.recent(1);
  if (last) pulse.textContent = say(last);
  feed.subscribe(e => {
    if (reduce.matches) { pulse.textContent = say(e); return; }
    pulse.classList.add('is-out');
    setTimeout(() => { pulse.textContent = say(e); pulse.classList.remove('is-out'); }, 700);
  });
} catch { /* the static line stays */ }

// ───────────────────────── kit motion: light leaks on the niches, arched reveals, the long louvre shadow
lightLeak('.leak');
// Arch Reveal (kit study 5), observed on the card rather than the clipped image itself:
// a fully clipped element can report no intersection, which would leave it closed for ever.
{
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelector('.arch-reveal')?.classList.add('is-in'); io.unobserve(e.target);
  }), { threshold: 0.15 });
  document.querySelectorAll('.niche').forEach(n => io.observe(n));
}
scrollShadow('.raking');
