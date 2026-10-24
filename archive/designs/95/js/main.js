// Town through time: page wiring. The poster paints first; the 3D world loads after,
// then a short time-lapse plays from 2016 to today unless motion is reduced.
import { PRODUCTS, STATUS_LABEL, Y0, Y1, TODAY, yearCaption, todayCaption, product, LOGOS } from './data.js';
import { createSound } from './sound.js';

const Q = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const sim = document.querySelector('.sim');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || Q.has('reduced');
const coarse = matchMedia('(pointer: coarse)').matches;
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
const sound = createSound();
const REST_HOUR = 20.9;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ------------------------------------------------------------------ static wiring (works without 3D)
$('sound').addEventListener('click', () => { const on = sound.toggle(); $('sound').setAttribute('aria-pressed', String(on)); });
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('mcp-cmd').textContent); $('copied').textContent = 'Copied'; }
  catch { $('copied').textContent = 'Select and copy the line'; }
  setTimeout(() => { $('copied').textContent = ''; }, 2400);
});
if (Q.has('poster')) root.classList.add('poster-mode');
if (Q.has('shortsim')) root.classList.add('shortsim');

function webglOK() { try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; } }
if (!webglOK()) { root.classList.add('no-webgl'); }
else boot();

// ------------------------------------------------------------------ boot
async function boot() {
  const canvas = $('scene');
  const quality = Q.get('quality') || (coarse || Math.min(screen.width, screen.height) < 600 ? 'low' : 'high');
  // let the poster and text paint before any 3D work starts
  await new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 400 }) : setTimeout(r, 60)));
  const { createWorld } = await import('./world.js');
  let world;
  try {
    world = await createWorld(canvas, {
      quality, reduced, preserve: Q.has('shot'), shot: Q.has('shot'), noBloom: Q.has('nobloom'),
      onProgress: (p) => { $('loader-fill').style.width = (p * 100).toFixed(0) + '%'; $('loader-text').textContent = p < 0.5 ? 'Laying foundations' : p < 0.95 ? 'Raising the town' : 'Switching on the lights'; },
    });
  } catch (err) {
    console.error(err); root.classList.add('no-webgl'); return;
  }
  window.__world = world;
  const W = world;

  // initial state from the URL (for screenshots), else today at blue hour, matching the poster
  const qYear = Q.get('year');
  const startV = qYear == null ? TODAY : qYear === 'today' ? TODAY : clamp(+qYear + (Q.has('mid') ? 0.5 : 1), Y0, TODAY);
  const startHour = Q.has('hour') ? clamp(+Q.get('hour'), 16, 26) : REST_HOUR;
  W.setYear(startV, true); W.setHour(startHour, true);
  if (Q.get('cam')) { const [x, y, z, yaw, pitch, dist] = Q.get('cam').split(',').map(Number); W.setView({ target: [x, y, z], yaw, pitch, dist }); }
  if (Q.get('focus')) { W.focus(Q.get('focus')); W.setView({}); }
  document.fonts?.ready.then(() => W.refreshScreens());

  // first frame, then fade in
  W.renderOnce(); W.renderOnce();
  W.start();
  requestAnimationFrame(() => sim.classList.add('is-live'));
  $('hud').hidden = false;
  if (!Q.has('people') || Q.get('people') !== '0') W.loadPeople(quality === 'low' ? 14 : 24).catch((e) => console.warn(e));
  W.loadTraffic().catch((e) => console.warn(e));
  setupUI(W);
  setupFeed(W);
  if (Q.has('debug')) { console.log('debug boot'); W.hooks.debug = () => { const st = W.state; let on = 0, tot = 0; for (const b of W.buildings) for (const x of b.sets) { tot++; if (x.level > 0.5) on++; } console.log('debug ' + JSON.stringify(W.renderer.info.render) + ' night ' + st.night.toFixed(2) + ' hour ' + st.hour.toFixed(2) + ' Y ' + st.Y.toFixed(2) + ' sets ' + on + '/' + tot + ' p0 ' + W.buildings[0].p + ' frames ' + st.frames); }; }
  if (Q.get('card')) openCard(Q.get('card'));

  const autoIntro = !reduced && qYear == null && !Q.has('poster') && !Q.has('nointro');
  if (autoIntro) setTimeout(() => intro.start(), 1300);
  else if (!Q.has('poster') && !Q.has('shot')) setTimeout(() => coach.start(), 900);
}

// ------------------------------------------------------------------ UI
let W = null;
const playState = { playing: false, V: TODAY, rate: 0.72, cycle: true, onEnd: null };
const intro = {
  active: false,
  start() {
    if (!W) return;
    this.active = true; $('skipintro').hidden = false;
    W.setYear(Y0);                         // rewind: the town sinks back into the hill
    this.t = setTimeout(() => { playState.V = Y0; play(true, () => this.end()); }, 1700);
  },
  end(skip = false) {
    if (!this.active) return;
    this.active = false; clearTimeout(this.t); $('skipintro').hidden = true;
    if (skip) { play(false); W.setYear(TODAY); playState.V = TODAY; W.home(); }
    W.setHour(REST_HOUR);
    setTimeout(() => coach.start(), 700);
  },
};

function play(on, onEnd = null) {
  playState.playing = on; playState.onEnd = onEnd;
  $('play').classList.toggle('playing', on);
  $('play').setAttribute('aria-label', on ? 'Pause' : 'Play the years from 2016');
  if (on && playState.V >= TODAY - 0.01) playState.V = Y0;
  if (!on) W.setHour(W.state.hourTarget);
}

const pins = {};
function setupUI(world) {
  W = world;
  const track = $('track'), ticks = $('ticks'), handle = $('handle');
  const toX = (V) => (V - Y0) / (TODAY - Y0);
  const fromX = (x) => Y0 + x * (TODAY - Y0);
  // ticks: one per year (at the end of that year) plus Today; product marks above their year
  for (let y = Y0; y <= Y1 + 1; y++) {
    const li = document.createElement('li');
    const isToday = y === Y1 + 1;
    li.style.left = (toX(isToday ? TODAY : y + 1) * 100) + '%';
    li.dataset.v = isToday ? TODAY : y + 1;
    const marks = document.createElement('span'); marks.className = 'marks';
    for (const p of PRODUCTS.filter((p) => p.since === y)) { const i = document.createElement('i'); i.dataset.status = p.status; i.title = p.name; marks.append(i); }
    li.append(marks, Object.assign(document.createElement('span'), { className: 'notch' }), Object.assign(document.createElement('span'), { className: 'lab', textContent: isToday ? 'Today' : (y === Y0 ? String(y) : "'" + String(y).slice(2)) }));
    ticks.append(li);
  }
  track.setAttribute('aria-valuemin', String(Y0)); track.setAttribute('aria-valuemax', String(Y1 + 1));
  const stops = [Y0, ...Array.from({ length: Y1 - Y0 + 1 }, (_, i) => Y0 + i + 1), TODAY];
  const snap = (V) => stops.reduce((a, b) => (Math.abs(b - V) < Math.abs(a - V) ? b : a));
  let dragging = false;
  const setFromPointer = (e) => {
    const r = track.getBoundingClientRect();
    const V = fromX(clamp((e.clientX - r.left) / r.width, 0, 1));
    playState.V = V; W.setYear(V);
  };
  track.addEventListener('pointerdown', (e) => { intro.end(); play(false); dragging = true; track.classList.add('drag'); track.setPointerCapture(e.pointerId); setFromPointer(e); coach.did('years'); });
  track.addEventListener('pointermove', (e) => { if (dragging) setFromPointer(e); });
  const endDrag = () => { if (!dragging) return; dragging = false; track.classList.remove('drag'); const s = snap(playState.V); playState.V = s; W.setYear(s); };
  track.addEventListener('pointerup', endDrag); track.addEventListener('pointercancel', endDrag);
  const stepYear = (d) => {
    intro.end(); play(false);
    const i = stops.indexOf(snap(playState.V));
    const s = stops[clamp(i + d, 0, stops.length - 1)]; playState.V = s; W.setYear(s); coach.did('years');
  };
  track.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 3, PageDown: -3 }[e.key];
    if (k) { e.preventDefault(); stepYear(k); }
    if (e.key === 'Home') { e.preventDefault(); stepYear(-99); }
    if (e.key === 'End') { e.preventDefault(); stepYear(99); }
  });
  $('play').addEventListener('click', () => { intro.end(); play(!playState.playing); coach.did('years'); });
  $('skipintro').addEventListener('click', () => intro.end(true));

  // sun dial
  const dial = $('dial'), knob = $('sun'), svg = dial.querySelector('svg');
  const H = [16, 20.3, 26], A = [165, 0, -150];
  const h2a = (h) => h <= H[1] ? A[0] + (A[1] - A[0]) * (h - H[0]) / (H[1] - H[0]) : A[1] + (A[2] - A[1]) * (h - H[1]) / (H[2] - H[1]);
  const a2h = (a) => {
    a = clamp(a, -150, 165);
    return a >= 0 ? H[0] + (H[1] - H[0]) * (A[0] - a) / (A[0] - A[1]) : H[1] + (H[2] - H[1]) * (a - A[1]) / (A[2] - A[1]);
  };
  let sunDrag = false;
  const sunFromPointer = (e) => {
    const r = svg.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = -(e.clientY - (r.top + r.height / 2));
    let a = Math.atan2(dy, dx) * 180 / Math.PI;           // -180..180
    if (a < -150 && a > -180) a = a < -165 ? 180 : -150;   // the gap at lower left
    if (a > 165) a = 165;
    if (a === 180) a = 165;
    W.setHour(a2h(a), reduced); coach.did('sun');
  };
  for (const el of [svg, knob]) {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); intro.end(); sunDrag = true; knob.classList.add('drag'); el.setPointerCapture(e.pointerId); sunFromPointer(e); });
    el.addEventListener('pointermove', (e) => { if (sunDrag) sunFromPointer(e); });
    el.addEventListener('pointerup', () => { sunDrag = false; knob.classList.remove('drag'); });
    el.addEventListener('pointercancel', () => { sunDrag = false; knob.classList.remove('drag'); });
  }
  const stepSun = (d) => { intro.end(); W.setHour(clamp(W.state.hourTarget + d, 16, 26), reduced); coach.did('sun'); };
  knob.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1 / 6, ArrowUp: -1 / 6, ArrowLeft: -1 / 6, ArrowDown: 1 / 6, PageUp: -1, PageDown: 1 }[e.key];
    if (k) { e.preventDefault(); stepSun(k); }
    if (e.key === 'Home') { e.preventDefault(); W.setHour(16, reduced); }
    if (e.key === 'End') { e.preventDefault(); W.setHour(26, reduced); }
  });

  // global keys while the sim is on screen
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, [role="slider"], .card')) { if (e.key === 'Escape') closeCard(); return; }
    if (sim.getBoundingClientRect().bottom < innerHeight * 0.4) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); stepYear(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); stepYear(-1); }
    else if (e.key === ']') stepSun(1 / 4);
    else if (e.key === '[') stepSun(-1 / 4);
    else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); intro.end(); play(!playState.playing); }
    else if (e.key === 'Escape') closeCard();
  });

  $('zoom-in').addEventListener('click', () => W.zoom(0.8));
  $('zoom-out').addEventListener('click', () => W.zoom(1.25));
  $('cam-home').addEventListener('click', () => { closeCard(); W.home(); });

  // pins
  const pinWrap = $('pins');
  for (const p of PRODUCTS) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pin'; b.dataset.id = p.id;
    b.innerHTML = `<span class="dot"></span><span>${p.id === 'early-apps' ? 'Early apps' : p.id === 'joke-central' ? 'Joke Central' : p.name}</span><small>${p.since}</small>` +
      (p.figure && p.status !== 'retired' ? `<b class="fig">${p.figure.value} <i>${p.figure.label}</i></b>` : '');
    b.setAttribute('aria-label', `${p.name}, since ${p.since}. Open its card.`);
    b.addEventListener('click', () => { intro.end(); openCard(p.id); });
    b.addEventListener('focus', () => b.classList.add('focus')); b.addEventListener('blur', () => b.classList.remove('focus'));
    pinWrap.append(b); pins[p.id] = b;
  }

  // world hooks
  const tip = $('tip');
  W.hooks.interact = () => { intro.active && intro.end(); };
  W.hooks.build = (b) => { sound.build(b.row || 0); };
  W.hooks.toggle = (b, on) => { sound.click(on); coach.did('click'); };
  W.hooks.click = (b) => { if (b && b.id) { openCard(b.id); coach.did('click'); } };
  W.hooks.hover = (b, x, y) => {
    if (!b) { tip.hidden = true; return; }
    const r = sim.getBoundingClientRect();
    tip.hidden = false; tip.style.left = (x - r.left) + 'px'; tip.style.top = (y - r.top) + 'px';
    tip.textContent = b.id ? `${product(b.id).name} · open the card` : b.kind === 'gate' ? 'The town gate' : `A house · click to ${b.lit ? 'switch its lights off' : 'switch its lights on'}`;
  };

  let lastYearLabel = '', lastClock = '', lastPhase = '', lastHour = -1, frameN = 0;
  const fmt = (h) => { const m = Math.round(h * 60) % (24 * 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  let last = performance.now();
  W.hooks.frame = (f) => {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    // playback: one year about every 1.4 s, each year a quick evening so the lights come and go
    if (playState.playing) {
      playState.V = Math.min(TODAY, playState.V + dt * playState.rate);
      W.setYear(playState.V);
      if (playState.cycle && !reduced) W.setHour(20.5 + 2.6 * (0.5 - 0.5 * Math.cos(2 * Math.PI * (playState.V - Y0))));
      if (playState.V >= TODAY) { const cb = playState.onEnd; play(false); W.setHour(REST_HOUR); cb && cb(); }
      if (intro.active) {
        // a slow crane shot while the town grows: low and close at first, pulling back to the whole bay
        const k = (playState.V - Y0) / (TODAY - Y0), H0 = W.home0;
        W.glide({ yaw: H0.yaw - 0.22 + 0.22 * k, pitch: H0.pitch - 0.03 + 0.03 * k, dist: H0.dist * (0.78 + 0.22 * k) });
      }
    }
    // year readout
    const V = f.Y;
    const label = V >= TODAY - 0.5 ? 'Today' : String(clamp(Math.ceil(V - 1e-6) - 1, Y0, Y1));
    const tx = (V - Y0) / (TODAY - Y0);
    handle.style.left = (tx * 100) + '%'; $('track-fill').style.width = (tx * 100) + '%';
    // a tick label the handle sits on steps down out of its way
    for (const li of ticks.children) li.classList.toggle('under', Math.abs(+li.dataset.v - V) < 0.32);
    if (label !== lastYearLabel) {
      lastYearLabel = label;
      $('ledger-year').textContent = label;
      $('handle-label').textContent = label;
      const ly = $('ledger-year'); ly.classList.remove('bump'); void ly.offsetWidth; ly.classList.add('bump');
      const notes = label === 'Today' ? todayCaption() : yearCaption(+label);
      $('ledger-notes').innerHTML = (notes.length ? notes : ['No new products this year. The town fills in.']).map((t) => `<li>${t}</li>`).join('');
      track.setAttribute('aria-valuenow', label === 'Today' ? String(Y1 + 1) : label);
      track.setAttribute('aria-valuetext', label === 'Today' ? 'Today' : label);
      // the highlighted tick is the year the ledger shows (tick y sits at the end of year y)
      for (const li of ticks.children) li.classList.toggle('cur', label === 'Today' ? +li.dataset.v === TODAY : +li.dataset.v === +label + 1);
      sound.tick();
      if (card.id) fillCard(card.id);
    }
    // dial
    const a = h2a(f.hour) * Math.PI / 180, r = svg.getBoundingClientRect();
    const R = r.width * 44 / 120, cx = r.width / 2, cy = r.height / 2;
    knob.style.setProperty('--kx', (cx + Math.cos(a) * R).toFixed(1) + 'px');
    knob.style.setProperty('--ky', (cy - Math.sin(a) * R).toFixed(1) + 'px');
    knob.classList.toggle('moon', f.e < -0.5);
    const clock = fmt(f.hour);
    if (clock !== lastClock) { lastClock = clock; $('clock').textContent = clock; }
    const phase = f.e >= 6 ? 'Afternoon' : f.e >= 0.4 ? 'Golden hour' : f.e >= -6.5 ? 'Blue hour' : f.hour < 23.2 ? 'Evening' : 'The town is asleep';
    if (phase !== lastPhase) { lastPhase = phase; $('phase').textContent = phase; }
    if (Math.abs(f.hour - lastHour) > 0.05) { lastHour = f.hour; knob.setAttribute('aria-valuenow', f.hour.toFixed(2)); knob.setAttribute('aria-valuetext', `${clock}, ${phase.toLowerCase()}`); sound.evening(f.night); }
    // pins: nudge overlapping labels apart (simple greedy pass, top to bottom)
    const placed = [], simW = sim.clientWidth;
    for (const p of [...f.pins].sort((a, b) => a.y - b.y)) {
      if (!p.on) continue;
      const wPin = (pins[p.id]?.offsetWidth || 110) + 6;
      p.x = clamp(p.x, wPin / 2 + 4, simW - wPin / 2 - 4); // keep labels on screen
      let y = p.y;
      for (let k = 0; k < 6; k++) {
        const hit = placed.find((q) => Math.abs(q.x - p.x) < (q.w + wPin) / 2 && Math.abs(q.y - y) < 26);
        if (!hit) break; y = hit.y - 27;
      }
      p.y = y; placed.push({ x: p.x, y, w: wPin });
    }
    for (const p of f.pins) {
      const el = pins[p.id]; if (!el) continue;
      el.classList.toggle('on', p.on);
      el.classList.toggle('hover', !!p.hover);
      el.classList.toggle('sel', p.id === card.id);
      if (el.dataset.status !== p.status) el.dataset.status = p.status;
      el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -100%)`;
      el.tabIndex = p.on ? 0 : -1;
    }
    sim.classList.toggle('zoomed', f.dist < 120);
    if (++frameN === 120) { const i = W.renderer.info.render; $('perf').textContent = `This frame: ${i.calls} draw calls, ${Math.round(i.triangles / 1000)}k triangles.`; }
  };

  // the products list links back into the town
  document.querySelectorAll('[data-show]').forEach((b) => b.addEventListener('click', () => {
    intro.end(); play(false); playState.V = TODAY; W.setYear(TODAY);
    sim.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setTimeout(() => openCard(b.dataset.show), reduced ? 0 : 450);
  }));
  $('card-close').addEventListener('click', closeCard);
  $('card-next').addEventListener('click', () => {
    const order = [...PRODUCTS].sort((a, b) => a.since - b.since);
    const i = order.findIndex((p) => p.id === card.id);
    openCard(order[(i + 1) % order.length].id);
  });

  // pause rendering when the sim is off screen or the tab is hidden
  const io = new IntersectionObserver(([en]) => { en.isIntersecting && !document.hidden ? W.start() : W.stop(); }, { threshold: 0.02 });
  io.observe(sim);
  document.addEventListener('visibilitychange', () => { document.hidden ? W.stop() : sim.getBoundingClientRect().bottom > 0 && W.start(); });
  addEventListener('resize', () => W.resize(), { passive: true });
}

// ------------------------------------------------------------------ story card
const card = { id: null };
function fillCard(id) {
  const p = product(id); if (!p) return;
  const el = $('card');
  el.dataset.status = p.status;
  $('card-dot').parentElement.dataset.status = p.status;
  $('card-status').textContent = STATUS_LABEL[p.status];
  $('card-since').textContent = p.since;
  $('card-name').textContent = p.name;
  const logo = $('card-logo'); if (LOGOS[id]) { logo.src = LOGOS[id]; logo.hidden = false; } else logo.hidden = true;
  const fig = $('card-figure');
  fig.hidden = !p.figure;
  if (p.figure) { $('card-value').textContent = p.figure.value; $('card-label').textContent = p.figure.label; }
  $('card-line').textContent = p.line;
  $('card-facts').innerHTML = (p.facts || []).map((f) => `<li>${f}</li>`).join('');
  const place = PRODUCTS.find((x) => x.id === id)?.place?.building || '';
  const shut = p.status === 'retired' ? ' Retired, so its shutters are closed and its lights stay off.' : '';
  $('card-building').textContent = (place + shut).trim();
  const link = $('card-link');
  if (p.url) { link.hidden = false; link.href = p.url; link.textContent = p.url.replace(/^https?:\/\//, '') + ' →'; }
  else link.hidden = true;
}
function openCard(id) {
  if (!product(id)) return;
  card.id = id; fillCard(id);
  const el = $('card'); el.hidden = false; sim.classList.add('carded');
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  W && W.focus(id);
  sound.chime();
  el.focus({ preventScroll: true });
}
function closeCard() { if (!card.id) return; card.id = null; $('card').hidden = true; sim.classList.remove('carded'); W && W.clearFocus(); }

// ------------------------------------------------------------------ onboarding
const coach = {
  steps: [
    { key: 'years', text: 'Drag the years. Each product rises in the year it started.', anchor: () => $('track') },
    { key: 'sun', text: 'Drag the sun. Windows switch on at dusk and off again as the town goes to bed.', anchor: () => $('dial') },
    { key: 'click', text: 'Click a product to read its story. Click any other house to flick its lights.', anchor: null },
  ],
  i: -1, done: new Set(),
  start() {
    if (store.get('tt95-coach') === 'done' || Q.has('nocoach')) return;
    this.i = -1; this.next();
    $('coach-next').onclick = () => this.next();
  },
  next() {
    this.i++;
    while (this.i < this.steps.length && this.done.has(this.steps[this.i].key)) this.i++;
    const el = $('coach');
    if (this.i >= this.steps.length) { el.hidden = true; store.set('tt95-coach', 'done'); return; }
    const s = this.steps[this.i];
    $('coach-text').textContent = s.text;
    $('coach-next').textContent = this.i === this.steps.length - 1 ? 'Done' : 'Next';
    el.hidden = false; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    const a = s.anchor && s.anchor();
    if (a) {
      const r = a.getBoundingClientRect(), sr = sim.getBoundingClientRect();
      const w = el.offsetWidth, x = clamp(r.left + r.width / 2 - sr.left, w / 2 + 12, sr.width - w / 2 - 12);
      el.style.left = x + 'px'; el.style.bottom = (sr.bottom - r.top + 14) + 'px';
      el.style.setProperty('--ax', clamp(r.left + Math.min(r.width / 2, 60) - (x - w / 2) - sr.left, 16, w - 16) + 'px');
    } else { el.style.left = '50%'; el.style.bottom = ''; el.style.setProperty('--ax', '50%'); }
  },
  did(key) {
    this.done.add(key);
    if (this.i >= 0 && this.i < this.steps.length && this.steps[this.i].key === key) setTimeout(() => this.next(), 900);
  },
};

// ------------------------------------------------------------------ live events (or labelled demo events)
async function setupFeed(world) {
  const show = (e, demo) => {
    const el = $('feed'); el.hidden = false;
    const label = { 'mcp-emails': 'MCP Emails', 'fun-libs': 'Fun Libs', toolrails: 'Toolrails' }[e.product] || e.label || e.product;
    el.innerHTML = `<span class="dot"></span><span>${label} · ${e.text || e.kind}</span>${demo ? '<small>demo</small>' : ''}`;
    if (world.state.today) {
      world.pulse(e.product);
      if (e.product === 'mcp-emails' || e.product === 'toolrails' || e.product === 'fun-libs') world.setScreenExtra(e.product, (demo ? 'demo · ' : '') + (e.text || e.kind));
    }
  };
  let events = [];
  try {
    const r = await fetch('https://albretsen.no/api/events?limit=12', { mode: 'cors' });
    if (r.ok) { const j = await r.json(); events = Array.isArray(j) ? j : j.events || []; }
  } catch { /* offline or blocked */ }
  if (events.length) {
    show(events[0], false);
    let seen = new Set(events.map((e) => e.id));
    setInterval(async () => {
      try {
        const j = await (await fetch('https://albretsen.no/api/events?limit=12')).json();
        for (const e of (j.events || j).slice().reverse()) if (!seen.has(e.id)) { seen.add(e.id); show(e, false); }
      } catch { /* keep the last one */ }
    }, 20000);
    return;
  }
  const { createFeed } = await import('../../_shared/feed.js');
  const feed = createFeed();
  const first = feed.recent(1)[0]; if (first) show(first, true);
  feed.subscribe((e) => show(e, true));
}
