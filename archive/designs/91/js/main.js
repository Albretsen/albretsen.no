// Living Town · Albretsen AS · design 91
// The page paints a still poster first. The clock works straight away; the town loads
// after first paint and fades in over the poster.
import { content } from '../../_shared/content.js';
import { elevation, osloHour, fmtHour, phase, wrap24, SUNRISE, SUNSET } from './time.js';

const Q = new URLSearchParams(location.search);
const SHOT = Q.get('shot');                 // 'poster' hides the UI; any value skips fades and the intro
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (id) => document.getElementById(id);
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

// ------------------------------------------------------------------ the clock
const clock = {
  live: !Q.has('t'),
  hour: Q.has('t') ? wrap24(+Q.get('t')) : osloHour(),
  tween: null,
  hurryUntil: 0,
};
function hurry(sec = 2.5) { clock.hurryUntil = performance.now() + sec * 1000; }

const dial = $('dial'), sunEl = $('dial-sun');
const X = (h) => (h / 24) * 480;
const Y = (e) => (e >= 0 ? 58 - e * (44 / 48) : 58 - e * (22 / 32));

// sky colours along the day for the dial band (sRGB lerp is fine at this size)
const KEYS = [-18, -10, -6, -2.5, 0.5, 4, 9, 18, 40];
const BAND = ['#0b1230', '#1a2353', '#4a4f8e', '#a57fae', '#e39f8a', '#f0b98a', '#e9cfb0', '#a9c8e6', '#8fbbe8'];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function bandAt(e) {
  let i = 0; while (i < KEYS.length - 2 && e > KEYS[i + 1]) i++;
  const f = Math.max(0, Math.min(1, (e - KEYS[i]) / (KEYS[i + 1] - KEYS[i])));
  const a = hex(BAND[i]), b = hex(BAND[i + 1]);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`;
}
(function buildDial() {
  const svg = $('dial-svg');
  const grad = svg.querySelector('#dial-sky');
  for (let h = 0; h <= 24; h += 0.5) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    s.setAttribute('offset', (h / 24).toFixed(4)); s.setAttribute('stop-color', bandAt(elevation(h)));
    grad.appendChild(s);
  }
  let d = '';
  for (let h = 0; h <= 24.001; h += 0.25) d += (h ? 'L' : 'M') + X(h).toFixed(1) + ' ' + Y(elevation(h)).toFixed(1) + ' ';
  $('dial-arc').setAttribute('d', d);
  const ticks = $('dial-ticks');
  for (const h of [0, 6, 12, 18]) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', X(h) + 6); t.setAttribute('y', 78); t.textContent = String(h).padStart(2, '0');
    ticks.appendChild(t);
  }
})();

function renderClock() {
  const h = clock.hour, e = elevation(h);
  $('clock-time').textContent = fmtHour(h);
  $('clock-phase').textContent = phase(h);
  sunEl.style.left = (X(h) / 480 * 100) + '%';
  sunEl.style.top = (Math.min(80, Y(e)) / 84 * 100) + '%';
  sunEl.classList.toggle('moon', e < -6);
  dial.setAttribute('aria-valuenow', h.toFixed(2));
  dial.setAttribute('aria-valuetext', `${fmtHour(h)}, ${phase(h).toLowerCase()}`);
  $('live').setAttribute('aria-pressed', String(clock.live));
  $('live-label').textContent = clock.live ? 'Oslo time' : `Back to now · ${fmtHour(osloHour())}`;
  document.querySelectorAll('.chips button').forEach((b) => b.removeAttribute('aria-current'));
  // around sunset the sea view is the best seat in town: say so
  const evening = wrap24(h) > 15 && e > -5 && e < 14;
  const sea = $('sea');
  if (sea.classList.contains('golden') !== evening) {
    sea.classList.toggle('golden', evening);
    $('sea-label').textContent = evening ? 'Watch the sunset' : 'Look out to sea';
  }
}

function setManual(h) {
  clock.live = false; clock.tween = null;
  clock.hour = wrap24(h);
  hurry();
  coachStep('time');
}

/** Glide the clock forward to an hour (people reschedule along the way). */
function glideTo(h, { live = false } = {}) {
  let from = clock.hour, to = wrap24(h);
  if (to < from - 0.01) to += 24;
  if (to - from > 18) to -= 24;   // short way back if that is much closer
  const dur = reduced ? 0.01 : Math.min(3.2, 1.0 + Math.abs(to - from) * 0.28);
  clock.live = false;
  clock.tween = { from, to, t: 0, dur, live };
  hurry(dur + 2);
}

let dragging = false;
dial.addEventListener('pointerdown', (e) => {
  dragging = true; dial.setPointerCapture(e.pointerId);
  const r = dial.getBoundingClientRect();
  setManual(((e.clientX - r.left) / r.width) * 24);
});
dial.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const r = dial.getBoundingClientRect();
  setManual(Math.max(0, Math.min(23.99, ((e.clientX - r.left) / r.width) * 24)));
});
dial.addEventListener('pointerup', () => { dragging = false; });
dial.addEventListener('pointercancel', () => { dragging = false; });
dial.addEventListener('keydown', (e) => {
  const step = e.shiftKey ? 1 : 0.25;
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setManual(clock.hour + step);
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setManual(clock.hour - step);
  else if (e.key === 'Home') setManual(0);
  else if (e.key === 'End') setManual(23.75);
  else return;
  e.preventDefault();
});
document.querySelectorAll('.chips button').forEach((b) => b.addEventListener('click', () => { glideTo(+b.dataset.h); coachStep('time'); }));
$('live').addEventListener('click', () => { if (!clock.live) glideTo(osloHour(), { live: true }); });

function tickClock(dt) {
  if (clock.tween) {
    const tw = clock.tween;
    tw.t = Math.min(1, tw.t + dt / tw.dur);
    const k = tw.t < 0.5 ? 2 * tw.t * tw.t : 1 - Math.pow(-2 * tw.t + 2, 2) / 2;
    clock.hour = wrap24(tw.from + (tw.to - tw.from) * k);
    if (tw.t >= 1) { clock.tween = null; if (tw.live) clock.live = true; }
  } else if (clock.live) {
    clock.hour = osloHour();
  } else {
    clock.hour = wrap24(clock.hour + dt / 3600);
  }
}

// ------------------------------------------------------------------ live product events
const feedEl = $('feed'), feedLine = $('feed-line');
const PRODUCT_SITE = { 'mcp-emails': 'mcp', 'fun-libs': 'funlibs', toolrails: 'toolrails', harbor: 'harbor' };
const feed = { events: [], demo: false, onEvent: () => {} };
function describeEvent(e) {
  const tail = e.ms ? `${e.ms} ms` : e.country ? e.country : e.city ? e.city : '';
  const label = e.label || e.product || '';
  return `${label}${label ? ': ' : ''}${e.text || e.kind || 'event'}${tail ? ' · ' + tail : ''}`;
}
function showEvent(e) {
  feedEl.innerHTML = '';
  feedEl.append(document.createTextNode(describeEvent(e)));
  if (feed.demo) { const s = document.createElement('span'); s.className = 'demo'; s.textContent = 'demo'; feedEl.append(s); }
  feedLine.classList.remove('flash'); void feedLine.offsetWidth; feedLine.classList.add('flash');
  feed.onEvent(e);
}
async function startFeed() {
  let real = [];
  try {
    const r = await fetch('https://albretsen.no/api/events?limit=12', { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); real = Array.isArray(j) ? j : j.events || []; }
  } catch {}
  if (real.length) {
    feed.events = real;
    showEvent(real[0]);
    let seen = new Set(real.map((e) => e.id));
    setInterval(async () => {
      try {
        const r = await fetch('https://albretsen.no/api/events?limit=12', { cache: 'no-store' });
        const j = await r.json(); const list = Array.isArray(j) ? j : j.events || [];
        for (const e of list.reverse()) if (!seen.has(e.id)) { seen.add(e.id); feed.events.unshift(e); showEvent(e); }
      } catch {}
    }, 30000);
    return;
  }
  // nothing live yet: keep the town moving with the simulated feed, labelled as demo data
  const { createFeed } = await import('../../_shared/feed.js');
  const f = createFeed();
  feed.demo = true;
  feed.events = f.recent(12);
  showEvent(feed.events[0]);
  f.subscribe((e) => { feed.events.unshift(e); feed.events.length = Math.min(feed.events.length, 30); showEvent(e); });
}

// ------------------------------------------------------------------ onboarding hints
const coach = $('coach'), coachText = $('coach-text');
const TOUCH = matchMedia('(hover: none)').matches;
const STEPS = [
  { id: 'time', text: 'Drag the sun to change the hour. Everyone reschedules.' },
  { id: 'person', text: `${TOUCH ? 'Tap' : 'Click'} anyone to hear what they are up to.` },
  { id: 'sign', text: `The lit signs are real products. ${TOUCH ? 'Tap' : 'Click'} one.` },
];
let coachI = -1, coachTimer = 0;
function coachShow(i) {
  coachI = i;
  if (i >= STEPS.length || SHOT) { coach.hidden = true; store.set('lt-coach', 'done'); return; }
  // already done it: skip ahead
  if ((STEPS[i].id === 'sign' && cardFor) || (STEPS[i].id === 'person' && bubble)) { coachShow(i + 1); return; }
  coachText.textContent = STEPS[i].text;
  coach.hidden = false;
  coach.style.animation = 'none'; void coach.offsetWidth; coach.style.animation = '';
  clearTimeout(coachTimer);
  coachTimer = setTimeout(() => coachShow(coachI + 1), 11000);
}
function coachStep(id) { if (coachI >= 0 && STEPS[coachI] && STEPS[coachI].id === id) coachShow(coachI + 1); }
$('coach-x').addEventListener('click', () => { clearTimeout(coachTimer); coachShow(STEPS.length); });

// ------------------------------------------------------------------ footer copy button
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(content.mcpCommand); $('copy').textContent = 'Copied'; setTimeout(() => ($('copy').textContent = 'Copy'), 1800); } catch {}
});

// ------------------------------------------------------------------ boot the town
const stage = $('stage');
function webgl2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } }

let T = null;
async function boot() {
  const loader = $('loader'), fill = $('loader-fill');
  loader.hidden = false;
  if (SHOT) loader.hidden = true;
  const lite = Q.has('lite') || matchMedia('(max-width: 760px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  let mod;
  try {
    mod = await import('./scene.js');
    T = await mod.createLivingTown(stage, { lite, reduced, adaptive: !SHOT, onProgress: (p) => { fill.style.width = Math.round(p * 100) + '%'; } });
  } catch (err) {
    console.error(err);
    loader.hidden = true;
    document.documentElement.classList.add('no3d');
    return;
  }
  fill.style.width = '100%';
  T.setHour(clock.hour);
  T.life.settle(clock.hour);
  wire(T);
  startScreens(T);
  // first frames, then reveal
  let last = performance.now();
  const firstFrame = () => { T.frame(0.016); };
  firstFrame(); firstFrame();
  stage.classList.add('on');
  if (SHOT) stage.style.transition = 'none';
  loader.classList.add('done');
  setTimeout(() => (loader.hidden = true), 700);
  $('tools').hidden = false;

  applyCamParam(T);
  if (Q.get('say')) { const p = T.life.byId[Q.get('say')]; if (p) { for (let i = 0; i < 30; i++) T.frame(0.05); focusPerson(T, p, true); showBubble(T, p); bubble.until = Infinity; } }
  if (Q.has('stats')) setInterval(() => { const i = T.renderer.info.render; $('feed').textContent = `${i.calls} draws · ${(i.triangles / 1000).toFixed(0)}k tris · dpr ${T.renderer.getPixelRatio()}`; }, 1000);
  if (!SHOT && !reduced && !Q.has('cam') && !Q.has('view') && !Q.has('say') && Q.get('intro') !== '0') {
    const H = T.HOME_VIEW;
    T.cam.set({ target: [H.target[0] - 4, H.target[1], H.target[2]], yaw: H.yaw - 0.22, pitch: H.pitch + 0.08, dist: H.dist * 1.3 });
    T.cam.moveTo(H, 5.0);
  }
  if (!SHOT && store.get('lt-coach') !== 'done') setTimeout(() => coachShow(0), reduced ? 600 : 4200);

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.02 }).observe(stage);
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (visible && !document.hidden) {
      tickClock(dt);
      T.life.hurry = performance.now() < clock.hurryUntil;
      T.setHour(clock.hour);
      T.frame(dt);
      updateOverlays(T);
      if (Math.floor(now / 250) !== Math.floor((now - dt * 1000) / 250)) renderClock();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// Over the shoulders of the people at the railing, out to where the sun sets.
const SEA_VIEW = { target: [-10.8, 1.5, 25.2], yaw: 2.45, pitch: 0.06, dist: 8.6 };

function applyCamParam(T) {
  if (Q.get('view')) { const [tx, ty, tz, yaw, pitch, dist] = Q.get('view').split(',').map(Number); T.cam.set({ target: [tx, ty, tz], yaw, pitch, dist }); T.state.snapFocus = true; return; }
  const c = Q.get('cam');
  if (!c) return;
  const views = {
    sunset: SEA_VIEW,
    cafe: { target: [-4, 1.4, 14], yaw: 0.25, pitch: 0.32, dist: 26 },
    wide: { target: [0, 3, 6], yaw: 0.2, pitch: 0.5, dist: 140 },
  };
  if (views[c]) { T.cam.set(views[c]); T.state.snapFocus = true; }
  else if (T.world.sites[c]) focusSite(T, c, true);
  else if (c.startsWith('person:')) { const p = T.life.byId[c.slice(7)]; if (p) { focusPerson(T, p, true); } }
}

// ------------------------------------------------------------------ people, signs, bubbles
const tagsEl = $('tags');
let bubble = null, hoverTag = null;
const notes = [];
let THREE_ = null;

function speechKind(p) {
  const c = p.actor.current?.getClip().name || '';
  return /talk|phone|rail_call|wave|yes|no/.test(c) || p.state === 'travel' ? 'say' : 'think';
}

function showBubble(T, p) {
  const text = p.line();
  if (!text) return;
  clearBubble();
  const el = document.createElement('div');
  el.className = 'bubble' + (speechKind(p) === 'think' ? ' think' : '');
  const name = document.createElement('b');
  name.textContent = p.def.name + ' ';
  const role = document.createElement('i'); role.textContent = p.def.role; name.append(role);
  el.append(name, document.createTextNode(text));
  tagsEl.append(el);
  bubble = { el, p, until: performance.now() + Math.max(4500, text.length * 70) };
}
function clearBubble() { if (bubble) { const el = bubble.el; el.classList.add('out'); setTimeout(() => el.remove(), 400); bubble = null; } }

function focusPerson(T, p, instant = false) {
  const r = p.root;
  const v = { target: [r.position.x, 1.2, r.position.z], dist: Math.min(T.cam.goal.dist, 24), pitch: Math.min(Math.max(T.cam.goal.pitch, 0.22), 0.42) };
  if (instant) { T.cam.set({ ...v, yaw: T.cam.goal.yaw }); T.state.snapFocus = true; } else T.cam.moveTo(v, 1.3);
  T.cam.follow = r;
  T.state.focusOn = r;
}

function focusSite(T, id, instant = false) {
  const s = T.world.sites[id];
  const wide = window.innerWidth >= 760;
  // a little above the string lights, the shopfront off-centre so the card sits beside it
  // framed by the building's own height; the workshop is seen from a little to the left, clear of the palm
  const ht = s.box.max.y - s.box.min.y;
  const low = id === 'toolrails';   // single storey under a saw-tooth roof: look a little higher and wider
  const yaw = low ? -0.22 : 0.08;
  const v = { target: [s.x + (wide ? ht * 0.48 : 0), ht * (wide ? (low ? 0.55 : 0.4) : 0.3), T.FRONT + 1.5], yaw, pitch: 0.3, dist: (wide ? Math.max(21, ht * 2.5) : Math.max(26, ht * 3.6)) * (low ? 1.15 : 1) };
  T.state.tilt = 0.12;
  if (instant) { T.cam.set(v); T.state.snapFocus = true; } else T.cam.moveTo(v, 1.6);
  T.cam.follow = null; T.state.focusOn = null;
  openCard(T, id);
}

const PRODUCTS = Object.fromEntries(content.products.map((p) => [p.id, p]));
const LOGOS = { 'mcp-emails': '../_shared/products/mcp-emails/logo-mark.svg', 'fun-libs': '../_shared/products/fun-libs/icon.png', toolrails: '../_shared/products/toolrails/icon.svg', harbor: '../_shared/products/harbor/harbor-mark.svg' };
const STATUS = { live: 'Live', building: 'Being built', paused: 'Paused' };
const WHERE = { 'mcp-emails': 'The post office never closes. Its sign brightens each time an agent does something.', 'fun-libs': 'The arcade marquee comes on at dusk.', toolrails: 'The workshop stays lit while the builder is inside.', harbor: 'The library is paused: one reading lamp left on.' };
let cardFor = null;
function openCard(T, siteId) {
  const s = T.world.sites[siteId];
  const p = PRODUCTS[s.product];
  if (!p) return;
  cardFor = siteId;
  $('card-logo').src = LOGOS[p.id];
  $('card-status').textContent = `${STATUS[p.status] || p.status} · since ${p.since}`;
  $('card-name').textContent = p.name;
  $('card-value').textContent = p.figure?.value || '';
  $('card-label').textContent = p.figure?.label || '';
  $('card-line').textContent = p.line;
  const ul = $('card-facts'); ul.innerHTML = '';
  for (const f of p.facts || []) { const li = document.createElement('li'); li.textContent = f; ul.append(li); }
  $('card-live').textContent = WHERE[p.id];
  const a = $('card-link'); a.href = p.url; a.textContent = `Visit ${new URL(p.url).hostname} ↗`;
  $('card').hidden = false;
  coachStep('sign');
}
function closeCard() { $('card').hidden = true; cardFor = null; if (T) T.state.tilt = 0.3; }
$('card-x').addEventListener('click', () => { closeCard(); if (T) T.cam.moveTo(T.HOME_VIEW, 1.6); });

function wire(T) {
  THREE_ = T.THREE;
  const ray = new T.THREE.Raycaster();
  const ndc = new T.THREE.Vector2();
  const rayAt = (e) => {
    const r = stage.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, T.camera);
    return ray.ray;
  };
  const pickSite = (rr) => {
    let best = null, bd = Infinity; const hit = new T.THREE.Vector3();
    for (const s of Object.values(T.world.sites)) {
      if (s.kind !== 'landmark') continue;
      if (rr.intersectBox(s.box, hit)) { const d = hit.distanceTo(rr.origin); if (d < bd) { bd = d; best = s; } }
    }
    return best;
  };
  T.cam.onTap = (e) => {
    const rr = rayAt(e);
    const p = T.life.pick(rr);
    if (p) {
      if (bubble && bubble.p === p) { showBubble(T, p); return; }
      showBubble(T, p); focusPerson(T, p); closeCard(); coachStep('person');
      return;
    }
    const s = pickSite(rr);
    if (s) { clearBubble(); focusSite(T, s.id); return; }
    clearBubble(); closeCard();
    T.state.focusOn = null; T.cam.follow = null;
  };
  let hoverAt = 0;
  T.cam.onHover = (e) => {
    const now = performance.now();
    if (now - hoverAt < 60) return; hoverAt = now;
    const rr = rayAt(e);
    const p = T.life.pick(rr);
    const s = p ? null : pickSite(rr);
    stage.classList.toggle('pointing', !!(p || s));
    if (p || s) {
      if (!hoverTag) { hoverTag = document.createElement('div'); hoverTag.className = 'tag'; tagsEl.append(hoverTag); }
      hoverTag.textContent = p ? `${p.def.name} · ${p.def.role}` : PRODUCTS[s.product]?.name || '';
      const r = stage.getBoundingClientRect();
      hoverTag.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top - 14}px) translate(-50%, -100%)`;
      hoverTag.hidden = !!(bubble && bubble.p === p);
    } else if (hoverTag) { hoverTag.remove(); hoverTag = null; }
  };
  stage.addEventListener('pointerleave', () => { if (hoverTag) { hoverTag.remove(); hoverTag = null; } });
  stage.addEventListener('pointerdown', () => stage.classList.add('grabbing'));
  addEventListener('pointerup', () => stage.classList.remove('grabbing'));
  T.cam.onInteract = () => { T.state.focusOn = null; };
  let wheelHinted = false;
  T.cam.onWheelHint = () => {
    if (wheelHinted || SHOT) return; wheelHinted = true;
    const mac = /Mac|iPhone|iPad/.test(navigator.platform);
    coachText.textContent = `Pinch, or ${mac ? '⌘' : 'Ctrl'} + scroll, to zoom the town.`;
    coach.hidden = false; clearTimeout(coachTimer); coachTimer = setTimeout(() => (coach.hidden = true), 3500);
  };
  T.cam.onDouble = () => { closeCard(); clearBubble(); T.state.focusOn = null; T.cam.moveTo(T.HOME_VIEW, 1.4); };

  $('zoom-in').addEventListener('click', () => T.cam.zoom(0.75));
  $('zoom-out').addEventListener('click', () => T.cam.zoom(1.33));
  $('sea').addEventListener('click', () => { closeCard(); clearBubble(); T.state.focusOn = null; T.cam.follow = null; T.cam.moveTo(SEA_VIEW, 2.2); });
  $('reset').addEventListener('click', () => { closeCard(); clearBubble(); T.state.focusOn = null; T.cam.follow = null; T.cam.moveTo(T.HOME_VIEW, 1.4); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCard(); clearBubble(); T.state.focusOn = null; T.cam.follow = null; T.cam.moveTo(T.HOME_VIEW, 1.4); } });
  document.querySelectorAll('.see').forEach((b) => b.addEventListener('click', () => {
    document.getElementById('top').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => focusSite(T, b.dataset.site), reduced ? 0 : 500);
  }));

  // someone got home: their window lights up
  T.life.onLight = (site, person, on) => {
    if (site.kind === 'away') return;
    const dark = elevation(clock.hour) < 3;
    if (on) site.lightAt = performance.now() + 1100;
    if (!dark || SHOT) return;
    const isHome = site.kind === 'home' || site.kind === 'cafe';
    const text = on ? (isHome ? `${person.def.name} is home` : `${person.def.name} is back at work`) : (isHome ? 'Lights out' : '');
    if (!text) return;
    setTimeout(() => addNote(T, text, site), on ? 1100 : 300);
  };

  // product events flare the matching sign
  feed.onEvent = (e) => { const id = PRODUCT_SITE[e.product]; if (id) T.lights.pulse(id); };
}

function addNote(T, text, site) {
  const el = document.createElement('div');
  el.className = 'note'; el.textContent = text;
  tagsEl.append(el);
  const top = site.box ? site.box.max.y + 0.6 : 7;
  notes.push({ el, pos: new T.THREE.Vector3(site.x, top, T.FRONT - 1), until: performance.now() + 4300 });
}

function updateOverlays(T) {
  const W = stage.clientWidth, H = stage.clientHeight;
  const v = new T.THREE.Vector3();
  const place = (el, pos) => {
    v.copy(pos).project(T.camera);
    const on = v.z < 1 && v.x > -1.2 && v.x < 1.2 && v.y > -1.2 && v.y < 1.3;
    el.style.visibility = on ? 'visible' : 'hidden';
    if (on) el.style.transform = `translate(${((v.x + 1) / 2 * W).toFixed(1)}px, ${((1 - v.y) / 2 * H).toFixed(1)}px) translate(-50%, -100%)`;
  };
  if (bubble) {
    const p = bubble.p;
    if (performance.now() > bubble.until || p.state === 'inside') clearBubble();
    else {
      const r = p.root;
      v.set(0, 0, 0);
      const pos = r.position.clone(); pos.y = p.def.model === 'child' ? 1.45 : 2.05;
      place(bubble.el, pos);
    }
  }
  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i];
    if (performance.now() > n.until) { n.el.remove(); notes.splice(i, 1); continue; }
    place(n.el, n.pos);
  }
}

// ------------------------------------------------------------------ the shop screens
function startScreens(T) {
  const imgs = {};
  for (const [id, src] of Object.entries(LOGOS)) { const im = new Image(); im.src = src; imgs[id] = im; }
  const sites = Object.values(T.world.sites).filter((s) => s.screen);
  let i = 0;
  const draw = (s) => {
    const p = PRODUCTS[s.product]; if (!p) return;
    const { ctx, tex } = s.screen;
    const W = 512, H = 288;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1d2556'); g.addColorStop(1, '#121838');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,210,122,.08)'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    const im = imgs[p.id];
    if (im.complete && im.naturalWidth) { ctx.save(); ctx.fillStyle = '#faf4ea'; roundRect(ctx, 26, 24, 56, 56, 12); ctx.fill(); ctx.drawImage(im, 32, 30, 44, 44); ctx.restore(); }
    ctx.fillStyle = '#f4eadb'; ctx.font = '34px Federo, serif'; ctx.textBaseline = 'middle';
    ctx.fillText(p.name, 98, 46);
    ctx.font = '600 15px "Instrument Sans", sans-serif'; ctx.fillStyle = p.status === 'live' ? '#6fd39b' : p.status === 'building' ? '#d9a42b' : 'rgba(244,234,219,.55)';
    ctx.fillText((STATUS[p.status] || p.status).toUpperCase(), 100, 76);
    if (p.figure) {
      ctx.fillStyle = '#ffd27a'; ctx.font = '96px "Poiret One", Federo, serif'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(p.figure.value, 26, 200);
      const w = ctx.measureText(p.figure.value).width;
      ctx.fillStyle = 'rgba(244,234,219,.8)'; ctx.font = '22px "Instrument Sans", sans-serif';
      ctx.fillText(p.figure.label, 26 + w + 12, 196);
    }
    const ev = feed.events.find((e) => e.product === p.id);
    ctx.font = '16px "Instrument Sans", sans-serif'; ctx.fillStyle = 'rgba(244,234,219,.7)';
    const line = ev ? `${feed.demo ? 'demo · ' : ''}${ev.text}${ev.ms ? ' · ' + ev.ms + ' ms' : ev.country ? ' · ' + ev.country : ''}` : p.line;
    ctx.fillText(line.length > 52 ? line.slice(0, 51) + '…' : line, 26, 252);
    tex.needsUpdate = true;
  };
  for (const s of sites) draw(s);
  setInterval(() => { if (!sites.length) return; draw(sites[i++ % sites.length]); }, 700);
  document.fonts?.ready.then(() => sites.forEach(draw));
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

// ------------------------------------------------------------------ go
renderClock();
setInterval(() => { if (!T) { tickClock(1); renderClock(); } }, 1000);
startFeed();
if (SHOT === 'poster') document.documentElement.classList.add('shot-poster');
if (Q.has('nohero')) document.getElementById('top').style.display = 'none';   // review: screenshot the sections below

const want3d = webgl2() && !Q.has('no3d');
if (!want3d) document.documentElement.classList.add('no3d');
else if ((reduced || navigator.connection?.saveData) && !SHOT) {
  const b = $('open3d'); b.hidden = false;
  document.documentElement.classList.add('no3d');
  b.addEventListener('click', () => { b.hidden = true; document.documentElement.classList.remove('no3d'); boot(); });
} else {
  const go = () => boot();
  if (SHOT) go();
  else if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 600 }); else setTimeout(go, 200);
}
