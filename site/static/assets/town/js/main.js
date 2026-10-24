// Living Town · albretsen.no (design 91). Product facts and figures come from ./content.js,
// which the build generates from site/data.ts.
// The page paints a still poster first. The clock works straight away; the town loads
// after first paint and fades in over the poster.
import { content, dialogUrl } from './content.js';
import { elevation, osloHour, fmtHour, phase, wrap24, SUNRISE, SUNSET } from './time.js';
import { createFigures, openSocket } from './figures.js';

const Q = new URLSearchParams(location.search);
const SHOT = Q.get('shot');                 // 'poster' hides the UI; any value skips fades and the intro
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (id) => document.getElementById(id);
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

// ------------------------------------------------------------------ the clock
// ?t=19.45 or ?hour=19.45 (or ?hour=19:27) fixes the clock for a review link
const HOUR_Q = Q.get('t') ?? Q.get('hour');
const fixedHour = HOUR_Q == null ? null : HOUR_Q.includes(':') ? +HOUR_Q.split(':')[0] + (+HOUR_Q.split(':')[1] || 0) / 60 : +HOUR_Q;
const clock = {
  live: !Number.isFinite(fixedHour),
  hour: Number.isFinite(fixedHour) ? wrap24(fixedHour) : osloHour(),
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
const feed = { events: [], demo: false, onEvent: () => {}, stopDemo: null };
const evKey = (e) => e.id || `${e.time}|${e.product}|${e.text}`;
// keep the ticker calm: at most one new line every few seconds, the newest wins
const FEED_GAP = 6500;
let feedShownAt = 0, feedQueued = null, feedTimer = 0;
function queueEvent(e) {
  const wait = feedShownAt + FEED_GAP - performance.now();
  if (wait <= 0 && !feedTimer) { showEvent(e); return; }
  feedQueued = e;
  if (!feedTimer) feedTimer = setTimeout(() => { feedTimer = 0; const q = feedQueued; feedQueued = null; if (q) showEvent(q); }, Math.max(0, wait));
}
/** A real product event (poll or socket): the demo feed steps aside for good. */
function realEvent(e) {
  if (!e || !e.product || !e.text) return;
  if (feed.demo) { feed.demo = false; feed.stopDemo?.(); feed.events = []; }
  if (feed.events.some((x) => evKey(x) === evKey(e))) return;
  feed.events.unshift(e); feed.events.length = Math.min(feed.events.length, 30);
  queueEvent(e);
}
function describeEvent(e) {
  const tail = e.ms ? `${e.ms} ms` : e.country ? e.country : e.city ? e.city : '';
  const label = e.label || e.product || '';
  return `${label}${label ? ': ' : ''}${e.text || e.kind || 'event'}${tail ? ' · ' + tail : ''}`;
}
function showEvent(e) {
  feedShownAt = performance.now();
  feedEl.innerHTML = '';
  feedEl.append(document.createTextNode(describeEvent(e)));
  if (feed.demo) { const s = document.createElement('span'); s.className = 'demo'; s.textContent = 'demo'; feedEl.append(s); }
  feedLine.classList.remove('flash'); void feedLine.offsetWidth; feedLine.classList.add('flash');
  feed.onEvent(e);
}
async function startFeed() {
  let real = [];
  try {
    const r = await fetch('/api/events?limit=12', { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); real = Array.isArray(j) ? j : j.events || []; }
  } catch {}
  // the poll keeps going either way: the first real event replaces the demo feed
  setInterval(async () => {
    try {
      const r = await fetch('/api/events?limit=12', { cache: 'no-store' });
      const j = await r.json(); const list = Array.isArray(j) ? j : j.events || [];
      for (const e of list.slice().reverse()) realEvent(e);
    } catch {}
  }, 30000);
  if (real.length) {
    feed.events = real.slice(0, 30);
    showEvent(real[0]);
    return;
  }
  // nothing live yet: keep the town moving with the simulated feed, labelled as demo data
  const { createFeed } = await import('./kit/feed.js');
  if (feed.events.length) return;   // a real event arrived over the socket meanwhile
  const f = createFeed();
  feed.demo = true;
  feed.events = f.recent(12);
  showEvent(feed.events[0]);
  const off = f.subscribe((e) => { if (!feed.demo) return; feed.events.unshift(e); feed.events.length = Math.min(feed.events.length, 30); queueEvent(e); });
  feed.stopDemo = () => { off(); f.stop(); };
}

// ------------------------------------------------------------------ live figures
const figures = createFigures(content.products);
const figureEls = [];   // [{ id, b, lab, fresh }] in the products section
// '10,203 NOK' -> ['10,203', 'NOK']: the number is set large, its unit small beside the label, so a figure
// with a currency reads as one line ('10,203' NOK MRR) at the same size as the others
const splitFigure = (text) => { const m = /^(.*\d\+?)\s+([A-Za-z]{1,8})$/.exec(String(text)); return m ? [m[1], m[2]] : [String(text), '']; };
const unitLabel = (unit, label) => [unit, label].filter(Boolean).join(' ');
let screensDirty = () => {};
function paintFresh(el, f) { el.textContent = f.fresh; el.hidden = !f.fresh; el.classList.toggle('is-live', f.fresh === 'live'); }
function paintFigures() {
  for (const { id, b, lab, fresh } of figureEls) {
    const f = figures.get(id); if (!f) continue;
    const [num, unit] = splitFigure(f.text), l = ' ' + unitLabel(unit, f.label);
    if (b.textContent !== num) b.textContent = num;
    if (lab.textContent !== l) lab.textContent = l;
    b.classList.toggle('long', num.length > 8);
    if (f.exact) b.title = f.exact; else b.removeAttribute('title');
    paintFresh(fresh, f);
  }
  const s = cardFor && T ? T.world.sites[cardFor] : null;
  const f = s && figures.get(s.product);
  if (f) {
    const val = $('card-value'), [num, unit] = splitFigure(f.text);
    if (val.textContent !== num) val.textContent = num;
    if (f.exact) val.title = f.exact; else val.removeAttribute('title');
    $('card-label').textContent = unitLabel(unit, f.label);
    paintFresh($('card-fresh'), f);
  }
}
const SITE_PRODUCT = { mcp: 'mcp-emails', funlibs: 'fun-libs', toolrails: 'toolrails', harbor: 'harbor' };
document.querySelectorAll('.pcard').forEach((li) => {
  const id = SITE_PRODUCT[li.dataset.site], b = li.querySelector('.figure b');
  if (!id || !b) return;
  const fresh = document.createElement('small'); fresh.className = 'fresh'; fresh.hidden = true;
  // the unit and label after the number, in a span of their own so a live figure can change them
  const lab = document.createElement('span');
  while (b.nextSibling) lab.append(b.nextSibling);
  b.after(lab);
  b.parentNode.append(fresh);
  figureEls.push({ id, b, lab, fresh });
});
let rollRaf = 0;
function rollFigures() {
  paintFigures();
  screensDirty();
  rollRaf = figures.rolling() ? requestAnimationFrame(rollFigures) : 0;
}
figures.subscribe(() => { if (!rollRaf) rollRaf = requestAnimationFrame(rollFigures); });
setInterval(paintFigures, 30000);   // "updated N min ago" moves on
setInterval(() => figures.load(), 5 * 60000);

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


// ------------------------------------------------------------------ boot the town
const stage = $('stage');
// the stage size, kept by a ResizeObserver (reading clientWidth every frame forced a style and layout pass)
let stageW = stage.clientWidth, stageH = stage.clientHeight;
let heroOn = true;   // the town is on screen (set by the frame loop's IntersectionObserver)
function webgl2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } }

let T = null;
let keepStill = () => {};
async function boot() {
  const loader = $('loader'), fill = $('loader-fill');
  loader.hidden = false;
  if (SHOT) loader.hidden = true;
  const lite = Q.has('lite') || matchMedia('(max-width: 760px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  let mod;
  try {
    import('./dialog.js').then((m) => { dialog = m; }, () => {});
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
  if (Q.get('say')) { const p = T.life.byId[Q.get('say')]; if (p) { for (let i = 0; i < 30; i++) T.frame(0.05); focusPerson(T, p, true); showBubble(T, p); if (bubble) bubble.until = Infinity; } }
  if (Q.has('perf')) window.__T = T;   // review: lets a profiler read draw calls and timings
  if (Q.has('stats')) setInterval(() => { const i = T.renderer.info.render; $('feed').textContent = `${i.calls} draws · ${(i.triangles / 1000).toFixed(0)}k tris · dpr ${T.renderer.getPixelRatio()}`; }, 1000);
  if (!SHOT && !reduced && !Q.has('cam') && !Q.has('view') && !Q.has('say') && Q.get('intro') !== '0') {
    const H = T.HOME_VIEW;
    T.cam.set({ target: [H.target[0] - 4, H.target[1], H.target[2]], yaw: H.yaw - 0.22, pitch: H.pitch + 0.08, dist: H.dist * 1.3 });
    T.cam.moveTo(H, 5.0);
  }
  if (!SHOT && store.get('lt-coach') !== 'done') setTimeout(() => coachShow(0), reduced ? 600 : 4200);

  // The GPU took the context away. Chrome paints a lost canvas white with a placeholder at once, so the
  // canvas goes out at once too (no fade through white), and a small copy of the last frame stands in:
  // same hour, same view. Until a copy exists, the poster does. When the town is back, the copy fades.
  const still = document.createElement('canvas');
  still.className = 'still'; still.hidden = true; still.setAttribute('aria-hidden', 'true');
  stage.after(still);
  let stillAt = performance.now(), stillOk = false;   // the first copy once the town has settled (4 s in)
  keepStill = (now) => {
    if (now - stillAt < 4000 || T.lost) return;
    stillAt = now;
    const w = Math.max(1, stage.width >> 2), h = Math.max(1, stage.height >> 2);
    if (still.width !== w || still.height !== h) { still.width = w; still.height = h; }
    try { still.getContext('2d').drawImage(stage, 0, 0, w, h); stillOk = true; } catch { stillOk = false; }
  };
  stage.addEventListener('webglcontextlost', () => {
    stage.style.transition = 'none';
    stage.classList.remove('on');
    if (stillOk) { still.classList.remove('gone'); still.hidden = false; }
  });
  stage.addEventListener('webglcontextrestored', () => setTimeout(() => {
    if (still.hidden) { stage.style.transition = SHOT ? 'none' : ''; stage.classList.add('on'); return; }
    stage.classList.add('on');   // at once, under the copy
    setTimeout(() => {
      still.classList.add('gone');
      setTimeout(() => { still.hidden = true; stage.style.transition = SHOT ? 'none' : ''; }, 700);
    }, 100);
  }, 250));
  let visible = true;
  new IntersectionObserver(([en]) => { visible = heroOn = en.isIntersecting; }, { threshold: 0.02 }).observe(stage);
  // a resized window or a turned phone: match the drawing buffer to the new size (it used to stay at
  // the size it started with, stretched), just before the next frame renders, since a resize clears it
  let sized = stageW + 'x' + stageH;
  new ResizeObserver(() => { stageW = stage.clientWidth; stageH = stage.clientHeight; }).observe(stage);
  function loop(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;   // a frame's timestamp can precede the boot's performance.now()
    if (visible && !document.hidden) {
      if (stageW + 'x' + stageH !== sized) { sized = stageW + 'x' + stageH; T.resize(); }
      tickClock(dt);
      T.life.hurry = performance.now() < clock.hurryUntil;
      T.setHour(clock.hour);
      T.frame(dt);
      keepStill(now);
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
let bubble = null, hoverTag = null;   // bubble: the one a click opened
const bubbles = [];                    // everyone speaking right now (never more than two)
const notes = [];
let THREE_ = null;
let dialog = null;                     // js/dialog.js, loaded with the town
const recentLines = new Set();

function speechKind(p) {
  const c = p.actor.current?.getClip().name || '';
  return /talk|phone|rail_call|wave|yes|no/.test(c) || p.state === 'travel' ? 'say' : 'think';
}

/** People within reach of p, for two-person exchanges. Yusuf brings Biscuit. */
function nearbyOf(T, p, r = 4.5) {
  const out = [];
  for (const o of T.life.people) {
    if (o === p || o.state === 'inside' || o.state === 'entering' || o.opacity < 0.9) continue;
    if (Math.hypot(o.pos.x - p.pos.x, o.pos.z - p.pos.z) < r) out.push(o.id);
  }
  if (p.dog && p.state !== 'inside') out.push('dog');
  return out;
}

/** Something for p to say now: the dialog bank first (hour, activity, who is near), their schedule line otherwise. */
function lineFor(T, p) {
  if (dialog) {
    dialog.ensure(p.id, dialogUrl);
    for (const id of nearbyOf(T, p)) dialog.ensure(id, dialogUrl);
    const r = dialog.pick(p.id, { hour: clock.hour, activity: dialog.activityOf(p.act, p.state), nearby: nearbyOf(T, p), recent: recentLines });
    if (r && r.text) return r;
  }
  const text = p.line();
  return text ? { text, reply: null } : null;
}

/** Who a line belongs to: a person, or Biscuit (who speaks in stage directions). */
function speakerOf(T, id, by) {
  if (id === 'dog') return by?.dog ? { anchor: by.dog.obj, p: null, h: 0.9, name: 'Biscuit', role: 'Yusuf’s terrier', gone: () => by.state === 'inside' } : null;
  const p = T.life.byId[id];
  if (!p) return null;
  return { anchor: null, p, h: p.def.model === 'child' ? 1.45 : 2.05, name: p.def.name, role: p.def.role, gone: () => p.state === 'inside' };
}

function makeBubble(sp, text, { think = false, soft = false, until } = {}) {
  const el = document.createElement('div');
  el.className = 'bubble' + (think ? ' think' : '') + (soft ? ' soft' : '');
  const name = document.createElement('b');
  name.textContent = sp.name + ' ';
  const role = document.createElement('i'); role.textContent = sp.role; name.append(role);
  el.append(name, document.createTextNode(text));
  el.style.visibility = 'hidden';
  tagsEl.append(el);
  const b = { el, sp, p: sp.p, soft, until: until ?? performance.now() + Math.max(4500, text.length * 70) };
  bubbles.push(b);
  return b;
}
function dropBubble(b) {
  const i = bubbles.indexOf(b); if (i >= 0) bubbles.splice(i, 1);
  if (bubble === b) bubble = null;
  b.el.classList.add('out'); setTimeout(() => b.el.remove(), b.soft ? 700 : 400);
}
let replyTimer = 0;
function clearAll() { clearTimeout(replyTimer); for (const b of [...bubbles]) dropBubble(b); }

/** The reply half of an exchange, a beat after the first line. */
function scheduleReply(T, by, reply, first, soft) {
  clearTimeout(replyTimer);
  replyTimer = setTimeout(() => {
    if (!bubbles.includes(first) || bubbles.length >= 2) return;
    const sp = speakerOf(T, reply.id, by);
    if (!sp || sp.gone()) return;
    const b = makeBubble(sp, reply.text, { soft, until: first.until === Infinity ? Infinity : performance.now() + Math.max(4500, reply.text.length * 75) });
    b.pairedWith = first;
    first.until = Math.max(first.until, b.until - 1200);
  }, soft ? 2000 : 1500);
}

function showBubble(T, p) {
  const said = lineFor(T, p);
  if (!said) return;
  clearAll();
  bubble = makeBubble(speakerOf(T, p.id), said.text, { think: !said.reply && speechKind(p) === 'think' });
  if (said.reply) scheduleReply(T, p, said.reply, bubble, false);
}
function clearBubble() { if (bubble) { clearTimeout(replyTimer); const b = bubble; for (const x of [...bubbles]) if (x === b || x.pairedWith === b) dropBubble(x); } }

// When the camera is close, people now and then say something on their own: one line at a time
// (two with a reply), spaced out, never over the panels, and never while someone is being read.
const CHAT = !SHOT || Q.has('chat');
const chat = { next: performance.now() + 6000 };
const UI_SEL = ['.title', '.nav', '#clock', '#tools', '#feed-line', '#card', '#coach', '.scroll-cue'];
function uiRects() {
  const out = [];
  for (const sel of UI_SEL) {
    const el = document.querySelector(sel);
    if (!el || el.hidden) continue;
    const r = el.getBoundingClientRect();
    if (r.width && r.height) out.push(r);
  }
  return out;
}
const hits = (r, x0, y0, x1, y1) => x0 < r.right + 10 && x1 > r.left - 10 && y0 < r.bottom + 10 && y1 > r.top - 10;
function bubbleClear(x, y, rects, sr, w = 260, h = 96) {
  const x0 = sr.left + x - w / 2, x1 = x0 + w, y1 = sr.top + y, y0 = y1 - h;
  if (x0 < sr.left + 12 || x1 > sr.right - 12 || y0 < sr.top + 12 || y1 > sr.bottom - 12) return false;
  return !rects.some((r) => hits(r, x0, y0, x1, y1));
}
function ambientChat(T, now) {
  if (!CHAT || !dialog || now < chat.next) return;
  chat.next = now + 4500 + Math.random() * 4500;
  if (bubbles.length || cardFor) return;
  const focus = T.state.focusOn;
  if (T.cam.cur.dist > 34 && !focus) return;          // zoomed out: the town keeps to itself
  const W = stage.clientWidth, H = stage.clientHeight, sr = stage.getBoundingClientRect(), rects = uiRects();
  const v = new T.THREE.Vector3(), camPos = T.camera.position;
  const cands = [];
  for (const p of T.life.people) {
    if (p.state === 'inside' || p.state === 'entering' || p.opacity < 0.95) continue;
    if (camPos.distanceTo(p.root.position) > 42) continue;
    v.copy(p.root.position); v.y = p.def.model === 'child' ? 1.45 : 2.05; v.project(T.camera);
    if (v.z > 1) continue;
    if (!bubbleClear((v.x + 1) / 2 * W, (1 - v.y) / 2 * H, rects, sr)) continue;
    const centred = 1 - Math.min(1, Math.hypot(v.x, v.y * 1.3) / 1.2);
    // whoever spoke last lets someone else have a turn, unless the camera is following them
    cands.push({ p, w: (0.2 + centred + (focus && p.root === focus ? 1.5 : 0)) * (p === chat.last && p.root !== focus ? 0.25 : 1) });
  }
  if (!cands.length) return;
  let r = Math.random() * cands.reduce((s, c) => s + c.w, 0), who = cands[0].p;
  for (const c of cands) { r -= c.w; if (r < 0) { who = c.p; break; } }
  const said = lineFor(T, who);
  if (!said) return;
  chat.last = who;
  const b = makeBubble(speakerOf(T, who.id), said.text, { soft: true, think: !said.reply && speechKind(who) === 'think', until: now + Math.max(4800, said.text.length * 75) });
  if (said.reply) scheduleReply(T, who, said.reply, b, true);
  chat.next = Math.max(chat.next, b.until + 2200 + (said.reply ? 3800 : 0));
}

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
const LOGOS = content.logos;
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
  const [num, unit] = splitFigure(p.figure?.value || '');
  $('card-value').textContent = num;
  $('card-label').textContent = unitLabel(unit, p.figure?.label);
  $('card-fresh').hidden = true;
  paintFigures();
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
      chat.next = Math.max(chat.next, performance.now() + 9000);
      if (bubble && bubble.p === p) { showBubble(T, p); return; }
      showBubble(T, p); focusPerson(T, p); closeCard(); coachStep('person');
      return;
    }
    const s = pickSite(rr);
    if (s) { clearAll(); focusSite(T, s.id); return; }
    clearAll(); closeCard();
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
  T.cam.onDouble = () => { closeCard(); clearAll(); T.state.focusOn = null; T.cam.moveTo(T.HOME_VIEW, 1.4); };

  $('zoom-in').addEventListener('click', () => T.cam.zoom(0.75));
  $('zoom-out').addEventListener('click', () => T.cam.zoom(1.33));
  $('sea').addEventListener('click', () => { closeCard(); clearAll(); T.state.focusOn = null; T.cam.follow = null; T.cam.moveTo(SEA_VIEW, 2.2); });
  $('reset').addEventListener('click', () => { closeCard(); clearAll(); T.state.focusOn = null; T.cam.follow = null; T.cam.moveTo(T.HOME_VIEW, 1.4); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCard(); clearAll(); T.state.focusOn = null; T.cam.follow = null; T.cam.moveTo(T.HOME_VIEW, 1.4); } });
  document.querySelectorAll('.see').forEach((b) => b.addEventListener('click', () => {
    document.getElementById('top').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => focusSite(T, b.dataset.site), reduced ? 0 : 500);
  }));

  // someone got home: their window lights up
  T.life.onLight = (site, person, on, own = false) => {
    if (site.kind === 'away') return;
    const dark = elevation(clock.hour) < 3;
    if (on && !own) site.lightAt = performance.now() + 1100;   // a window of one's own keeps its own timing
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
  const W = stageW, H = stageH;
  const v = new T.THREE.Vector3();
  const place = (el, pos) => {
    v.copy(pos).project(T.camera);
    const on = v.z < 1 && v.x > -1.2 && v.x < 1.2 && v.y > -1.2 && v.y < 1.3;
    el.style.visibility = on ? 'visible' : 'hidden';
    if (on) el.style.transform = `translate(${((v.x + 1) / 2 * W).toFixed(1)}px, ${((1 - v.y) / 2 * H).toFixed(1)}px) translate(-50%, -100%)`;
  };
  const now = performance.now();
  const placed = [];
  let rects = null, sr = null;
  for (const b of [...bubbles]) {
    if (now > b.until || b.sp.gone()) { dropBubble(b); continue; }
    v.copy((b.sp.anchor || b.sp.p.root).position); v.y = b.sp.h;
    v.project(T.camera);
    const on = v.z < 1 && v.x > -1.04 && v.x < 1.04 && v.y > -1.2 && v.y < 1.3;
    if (!on) { b.el.style.visibility = 'hidden'; continue; }
    // a bubble's size only changes with the stage width: measure it once per width, not every frame
    if (b.sizedAt !== W) { b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; b.sizedAt = W; }
    const w = b.w, h = b.h;
    // near the edge of the screen a bubble slides inward rather than being cut off
    const x = Math.min(Math.max((v.x + 1) / 2 * W, w / 2 + 8), Math.max(w / 2 + 8, W - w / 2 - 8));
    let y = (1 - v.y) / 2 * H;
    // two bubbles side by side: lift the later one clear of the first
    for (const o of placed) if (Math.abs(o.x - x) < (o.w + w) / 2 + 8 && y > o.y - o.h - 12 && y - h < o.y) y = o.y - o.h - 12;
    placed.push({ x, y, w, h });
    // a line said on its own that drifts under the panels bows out early
    if (b.soft && !b.leaving) {
      rects ??= uiRects(); sr ??= stage.getBoundingClientRect();
      if (!bubbleClear(x, y, rects, sr, w + 8, h + 14)) { b.leaving = true; b.until = Math.min(b.until, now + 250); }
    }
    b.el.style.visibility = 'visible';
    b.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  }
  ambientChat(T, now);
  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i];
    if (performance.now() > n.until) { n.el.remove(); notes.splice(i, 1); continue; }
    place(n.el, n.pos);
    // a note that would hang off the edge of the screen is not shown cut in half
    if (n.el.style.visibility === 'visible') {
      n.w ??= n.el.offsetWidth;
      const x = (v.x + 1) / 2 * W;
      if (x - n.w / 2 < 6 || x + n.w / 2 > W - 6) n.el.style.visibility = 'hidden';
    }
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
    const f = figures.get(p.id);
    if (f) {
      // the figure, at 96 px unless a long live value needs a little less room
      ctx.font = '22px "Instrument Sans", sans-serif';
      const lw = ctx.measureText(f.label || '').width;
      ctx.font = '96px "Poiret One", Federo, serif';
      const fw = ctx.measureText(f.text).width;
      const px = Math.max(56, Math.min(96, Math.floor(96 * (380 - 12 - lw) / Math.max(1, fw))));   // no wider than "113,000+ installs" (a hanging lamp sits by the post office screen)
      ctx.fillStyle = '#ffd27a'; ctx.font = `${px}px "Poiret One", Federo, serif`; ctx.textBaseline = 'alphabetic';
      ctx.fillText(f.text, 26, 200);
      const w = ctx.measureText(f.text).width;
      ctx.fillStyle = 'rgba(244,234,219,.8)'; ctx.font = '22px "Instrument Sans", sans-serif';
      ctx.fillText(f.label || '', 26 + w + 12, 196);
      if (f.fresh) {
        // freshness, top right: a lamplight dot when the figure came over the socket just now
        ctx.font = '600 13px "Instrument Sans", sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
        ctx.fillStyle = f.fresh === 'live' ? '#ffd27a' : 'rgba(244,234,219,.6)';
        ctx.fillText(f.fresh.toUpperCase(), W - 24, 34);
        if (f.fresh === 'live') { const tw = ctx.measureText('LIVE').width; ctx.beginPath(); ctx.arc(W - 24 - tw - 10, 34, 4, 0, Math.PI * 2); ctx.fill(); }
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
    }
    const ev = feed.events.find((e) => e.product === p.id);
    ctx.font = '16px "Instrument Sans", sans-serif'; ctx.fillStyle = 'rgba(244,234,219,.7)';
    const line = ev ? `${feed.demo ? 'demo · ' : ''}${ev.text}${ev.ms ? ' · ' + ev.ms + ' ms' : ev.country ? ' · ' + ev.country : ''}` : p.line;
    ctx.fillText(line.length > 52 ? line.slice(0, 51) + '…' : line, 26, 252);
    tex.needsUpdate = true;
  };
  for (const s of sites) draw(s);
  // one screen at a time, only while someone can see them; all of them again on the way back
  let away = false;
  setInterval(() => {
    if (!sites.length) return;
    if (!heroOn || document.hidden) { away = true; return; }
    if (away) { away = false; sites.forEach(draw); return; }
    draw(sites[i++ % sites.length]);
  }, 700);
  // a figure rolling to a new value redraws its screen every frame until it lands
  screensDirty = () => { for (const s of sites) if (figures.get(s.product)?.rolling) draw(s); };
  figures.subscribe((id) => { for (const s of sites) if (s.product === id) draw(s); });
  document.fonts?.ready.then(() => sites.forEach(draw));
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

// ------------------------------------------------------------------ go
renderClock();
setInterval(() => { if (!T) { tickClock(1); renderClock(); } }, 1000);
startFeed();
figures.load();
openSocket({ onFigure: (f) => figures.push(f), onEvent: realEvent });
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
