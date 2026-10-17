/* Ground Glass — homepage behaviour (design 81)
 * One focus value drives everything: the live three.js scene, the blur on the
 * headline (type that lives on its own depth plane), the focus-ring scale and
 * the readout. All motion runs on the kit's hand-rolled springs (../assets/motion.js).
 */
import { Spring, presets, reduced, rackFocusOnView, paperLift, shutter, developSheet, flashKey } from '../assets/motion.js';
import { createFeed, describe } from '../../_shared/feed.js';

const $ = s => document.querySelector(s);
const vf = $('#vf'), stage = $('#stage'), canvas = $('#scene'), still = $('#still');
const subject = $('#subject'), ring = $('#ring'), scale = $('#scale');
const announce = $('#announce');

/* ------------------------------------------------------------ planes */
// focus value (0..1) of each paper plane in the scene, with the distance the
// readout shows. The headline sits on the plane the frame opens on.
const PLANES = [
  { id: 'near',  at: 0.00, label: '2 m',    spoken: '2 metres, the treeline' },
  { id: 'mid',   at: 0.42, label: '40 m',   spoken: '40 metres, the headland' },
  { id: 'water', at: 0.62, label: '300 m',  spoken: '300 metres, the water' },
  { id: 'far',   at: 0.78, label: '1.2 km', spoken: '1.2 kilometres, the peaks' },
  { id: 'moon',  at: 1.00, label: '∞',      spoken: 'infinity, the moon' },
];
const portrait = () => innerWidth / innerHeight < 0.8;
const HOME = portrait() ? 0.42 : 0.78;          // matches the baked still
const HOME_EV = portrait() ? 0.25 : 0;
const STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];
const AP_OF = { 1.4: 1, 2: 0.78, 2.8: 0.55, 4: 0.4, 5.6: 0.28, 8: 0.18, 11: 0.1, 16: 0.03 };
const SHUTTERS = [8, 15, 30, 60, 125, 250, 500];

let cam = null;                   // the live scene, once loaded
let stopIdx = 2;                  // ƒ/2.8
let frameNo = 24;
let soundOn = false, actx = null;

/* ------------------------------------------------------------ the master springs */
const st = { f: HOME, ap: AP_OF[2.8], ev: HOME_EV };
const focus = new Spring(HOME, { ...presets.focus, onUpdate: v => { st.f = v; cam?.setFocusNow(v); paint(); } });
const aper = new Spring(st.ap, { ...presets.iris, onUpdate: v => { st.ap = v; cam?.setApertureNow(v); paint(); } });
const expo = new Spring(HOME_EV, { ...presets.focus, onUpdate: v => { st.ev = v; paint(); } });

function nearestPlane(f) { return PLANES.reduce((a, b) => Math.abs(b.at - f) < Math.abs(a.at - f) ? b : a); }
function distanceLabel(f) {
  const p = nearestPlane(f);
  return Math.abs(p.at - f) < 0.03 ? p.label : '';
}

let ringW = 340, scaleW = 760;
function measure() { ringW = ring.clientWidth; scaleW = scale.offsetWidth; paint(); }

let lastPlane = '';
function paint() {
  const W = vf.clientWidth;
  // same depth-of-field law as the shader: blur grows with distance from focus,
  // and with how wide the aperture is
  const k = (W > 900 ? 26 : 18) * (0.15 + st.ap * 1.25);
  const blur = Math.min(9, Math.abs(st.f - HOME) * k * 0.42);
  subject.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
  subject.style.opacity = String(1 - Math.min(0.45, blur / 18));

  scale.style.transform = `translate3d(${(ringW / 2 - scaleW * st.f).toFixed(1)}px,0,0)`;
  const p = nearestPlane(st.f);
  if (p.id !== lastPlane) {
    lastPlane = p.id;
    scale.querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', PLANES[i] === p));
  }
  ring.setAttribute('aria-valuenow', String(Math.round(st.f * 100)));
  ring.setAttribute('aria-valuetext', p.spoken);

  // exposure: shutter speed + needle; the still gets the same push when 3D is not up
  const evStops = st.ev * 1.35;
  $('#ev').textContent = `${evStops >= 0 ? '+' : '−'}${Math.abs(evStops).toFixed(1)} EV`;
  $('#evn').style.setProperty('--ev', `${(st.ev * 32).toFixed(1)}px`);
  const sp = 60 / Math.pow(2, evStops);
  $('#shut').textContent = '1/' + SHUTTERS.reduce((a, b) => Math.abs(b - sp) < Math.abs(a - sp) ? b : a);
  if (!cam) still.style.filter = Math.abs(st.ev - HOME_EV) > 0.01 ? `brightness(${Math.pow(2, (st.ev - HOME_EV) * 1.1).toFixed(3)})` : '';
  cam?.setExposure(st.ev);
}

/* ------------------------------------------------------------ focus ring: drag with spring hand-off */
(function bindRing() {
  let dragging = false, lastX = 0, lastT = 0, vel = 0;
  ring.addEventListener('pointerdown', e => {
    dragging = true; ring.setPointerCapture(e.pointerId);
    lastX = e.clientX; lastT = performance.now(); vel = 0;
    ensureScene();
  });
  ring.addEventListener('pointermove', e => {
    if (!dragging) return;
    const now = performance.now(), dx = e.clientX - lastX;
    const df = -dx / scaleW;
    const f = Math.min(1, Math.max(0, focus.value + df));
    vel = 0.8 * vel + 0.2 * (df / Math.max(1, now - lastT) * 1000);
    lastX = e.clientX; lastT = now;
    focus.jump(f);
  });
  const end = () => {
    if (!dragging) return; dragging = false;
    // throw: project where the ring would coast to, then settle on that plane's detent
    const projected = Math.min(1, Math.max(0, focus.value + vel * 0.18));
    const p = nearestPlane(projected);
    focus.velocity = vel; focus.set(p.at);
  };
  ring.addEventListener('pointerup', end);
  ring.addEventListener('pointercancel', end);
  ring.addEventListener('keydown', e => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const map = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step };
    if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); cyclePlane(e.key === 'PageUp' ? 1 : -1); return; }
    if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); focus.set(e.key === 'Home' ? 0 : 1); ensureScene(); return; }
    if (!(e.key in map)) return;
    e.preventDefault(); ensureScene();
    focus.set(Math.min(1, Math.max(0, focus.target + map[e.key])));
  });
})();

function cyclePlane(dir = 1) {
  const i = PLANES.indexOf(nearestPlane(focus.target));
  const order = [3, 4, 0, 1, 2];                       // peaks → moon → treeline → headland → water
  const j = order.indexOf(i);
  const next = PLANES[order[(j + dir + order.length) % order.length]];
  focus.set(next.at); say(`Focus ${next.spoken}`);
}

/* ------------------------------------------------------------ tap to focus */
const af = $('#af');
const afX = new Spring(0, { ...presets.paper, onUpdate: v => af.style.left = v + 'px' });
const afY = new Spring(0, { ...presets.paper, onUpdate: v => af.style.top = v + 'px' });
const afS = new Spring(0, { ...presets.iris, onUpdate: v => { af.style.opacity = String(Math.min(1, Math.max(0, v))); af.style.transform = `scale(${1.6 - 0.6 * v})`; } });
let afTimer = 0, afPlaced = false;
stage.addEventListener('click', async e => {
  const r = vf.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  if (!afPlaced) { afX.jump(x); afY.jump(y); afPlaced = true; } else { afX.set(x); afY.set(y); }
  af.classList.remove('ok'); afS.jump(0); afS.set(1);
  const c = await ensureScene();
  const id = c ? c.pick(e.clientX, e.clientY) : (y / r.height < 0.36 ? 'moon' : y / r.height < 0.58 ? 'far' : y / r.height < 0.82 ? 'water' : 'near');
  const p = PLANES.find(q => q.id === id) || PLANES[3];
  focus.set(p.at);
  setTimeout(() => { af.classList.add('ok'); beep(); }, reduced ? 0 : 260);
  say(`Focus ${p.spoken}`);
  clearTimeout(afTimer); afTimer = setTimeout(() => afS.set(0), 1600);
});

/* ------------------------------------------------------------ live scene (after first paint) */
let scenePromise = null;
// ?static (gallery thumbnails) and Save-Data keep the baked still and skip WebGL
const noLive = new URLSearchParams(location.search).has('static') || navigator.connection?.saveData === true;
function ensureScene() {
  if (scenePromise) return scenePromise;
  if (noLive) return (scenePromise = Promise.resolve(null));
  scenePromise = (async () => {
    try {
      const probe = document.createElement('canvas');
      if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return null;
      const { mountScene } = await import('./scene.js');
      const c = await mountScene(canvas, {
        focus: st.f, aperture: st.ap, exposure: st.ev,
        maxDpr: innerWidth < 760 ? 1.5 : 2,
      });
      cam = c;
      c.setFocusNow(st.f); c.setApertureNow(st.ap); c.setExposure(st.ev);
      still.style.filter = '';
      requestAnimationFrame(() => canvas.classList.add('on'));
      return c;
    } catch (err) { console.warn('[ground glass] live scene unavailable', err); return null; }
  })();
  return scenePromise;
}
const idle = window.requestIdleCallback || (fn => setTimeout(fn, 600));
const boot = () => idle(() => ensureScene(), { timeout: 2500 });
if (!reduced) {
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot, { once: true });
}
// reduced motion: the still stays until the visitor touches a control

/* ------------------------------------------------------------ shutter: take an exposure */
const print = $('#print');
const printImg = print.querySelector('img');
const printCap = print.querySelector('figcaption');
const dev = new Spring(0, { stiffness: 30, damping: 11, onUpdate: v => {
  // develop: the print comes up from black and settles in tone
  const t = Math.min(1, Math.max(0, v));
  printImg.style.filter = `brightness(${(0.05 + t * 0.95).toFixed(3)}) contrast(${(1.6 - t * 0.6).toFixed(3)})`;
}});
const lift = new Spring(0, { ...presets.sheet, onUpdate: v => {
  print.style.opacity = String(Math.min(1, Math.max(0, v)));
  print.style.visibility = v < 0.01 ? 'hidden' : 'visible';
  print.style.transform = `translate3d(0, ${(1 - v) * 40}px, 0) rotate(${(-3 + (1 - v) * 5).toFixed(2)}deg)`;
}});
let printTimer = 0;
function expose() {
  shutter(vf);
  click();
  frameNo = frameNo >= 36 ? 1 : frameNo + 1;
  $('#frame').textContent = String(frameNo).padStart(2, '0');
  let src = '';
  if (cam) { try { cam.render(); src = canvas.toDataURL('image/jpeg', 0.82); } catch {} }
  printImg.src = src || still.currentSrc || still.src;
  printCap.textContent = `${String(frameNo).padStart(2, '0')} · ${$('#fnum').textContent} · ${$('#shut').textContent} · ${distanceLabel(st.f) || '—'}`;
  dev.jump(0); dev.set(1);
  lift.set(1);
  clearTimeout(printTimer); printTimer = setTimeout(() => lift.set(0), 5200);
  say(`Frame ${frameNo} exposed.`);
}

/* ------------------------------------------------------------ sound (opt-in, synthesised) */
function audio() { actx ||= new (window.AudioContext || window.webkitAudioContext)(); return actx; }
function click() {
  if (!soundOn) return;
  const a = audio(), t = a.currentTime;
  const len = Math.floor(a.sampleRate * 0.05), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  const src = a.createBufferSource(); src.buffer = buf;
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.9;
  const g = a.createGain(); g.gain.value = 0.35;
  src.connect(bp).connect(g).connect(a.destination); src.start(t);
}
function beep() {
  if (!soundOn) return;
  const a = audio(), t = a.currentTime;
  [0, 0.09].forEach(dt => {
    const o = a.createOscillator(), g = a.createGain();
    o.frequency.value = 3150; o.type = 'sine';
    g.gain.setValueAtTime(0.0001, t + dt); g.gain.exponentialRampToValueAtTime(0.06, t + dt + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.06);
    o.connect(g).connect(a.destination); o.start(t + dt); o.stop(t + dt + 0.07);
  });
}
function toggleSound() {
  soundOn = !soundOn;
  $('#snd-state').textContent = soundOn ? 'on' : 'off';
  if (soundOn) { audio().resume?.(); beep(); }
  say(`Sound ${soundOn ? 'on' : 'off'}`);
}

/* ------------------------------------------------------------ aperture, exposure, rack */
function stop(dir = 1) {
  stopIdx = (stopIdx + dir + STOPS.length) % STOPS.length;
  const f = STOPS[stopIdx];
  $('#fnum').textContent = `ƒ/${f}`;
  aper.set(AP_OF[f]); ensureScene(); say(`Aperture f ${f}`);
}
function exposure(d) { expo.set(Math.max(-1, Math.min(1, expo.target + d))); ensureScene(); }
let rackT = [];
function rackThrough() {
  rackT.forEach(clearTimeout);
  const seq = [0, 0.42, 0.62, 1, HOME];
  seq.forEach((v, i) => rackT.push(setTimeout(() => focus.set(v), i * (reduced ? 0 : 700))));
  ensureScene();
}

/* ------------------------------------------------------------ cheat sheet + keys */
const sheet = developSheet($('#sheet'));
const hint = $('#hint');
function toggleSheet(force) {
  sheet.toggle(force);
  hint.setAttribute('aria-expanded', String(sheet.open));
}
hint.addEventListener('click', () => toggleSheet());
// the chip steps aside over the footer so it never covers the sign-off
new IntersectionObserver(([e]) => hint.classList.toggle('away', e.isIntersecting && !sheet.open), { threshold: 0.35 }).observe(document.querySelector('.foot'));

const KEYS = {
  f: e => cyclePlane(e.shiftKey ? -1 : 1),
  '[': () => exposure(-0.22), ']': () => exposure(0.22),
  a: e => stop(e.shiftKey ? -1 : 1),
  Space: () => expose(),
  r: () => rackThrough(),
  s: () => toggleSound(),
  '?': () => toggleSheet(),
  Escape: () => toggleSheet(false),
  1: () => jump(1), 2: () => jump(2), 3: () => jump(3), 4: () => jump(4),
};
addEventListener('keydown', e => {
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (k === 'Space' && t && /^(BUTTON|A)$/.test(t.tagName)) return;     // let buttons and links work
  if (k === 'Escape' && !sheet.open) return;
  const fn = KEYS[k];
  if (!fn) return;
  e.preventDefault(); fn(e);
  flashKey(e.shiftKey && k === 'a' ? 'A' : k);
});

/* ------------------------------------------------------------ products */
function jump(n) {
  const card = $(`#p${n}`);
  card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  card.querySelector('h3 a').focus({ preventScroll: true });
}
document.querySelectorAll('.card').forEach(c => paperLift(c, { lift: 8, tilt: 3 }));
rackFocusOnView('[data-rack]');

// copy the MCP command
$('#copy').addEventListener('click', async () => {
  const b = $('#copy');
  try { await navigator.clipboard.writeText($('#cmd').textContent); b.textContent = 'Copied'; }
  catch { getSelection().selectAllChildren($('#cmd')); b.textContent = 'Selected'; }
  b.classList.add('done');
  setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('done'); }, 1800);
});

/* ------------------------------------------------------------ the live feed, as a camera status line */
const feed = createFeed();
const feedEl = $('#feed'), dot = document.querySelector('.feed-dot');
const showEvent = e => {
  feedEl.textContent = `${e.label} · ${describe(e)}`;
  dot.classList.remove('ping'); void dot.offsetWidth; dot.classList.add('ping');
};
showEvent(feed.recent(1)[0]);
feed.subscribe(showEvent);

/* ------------------------------------------------------------ misc */
function say(t) { announce.textContent = t; }
$('#year').textContent = String(new Date().getFullYear());
new ResizeObserver(measure).observe(ring);
measure();
