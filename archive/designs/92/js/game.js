// "Enter world": the game layer over the world. Hero view, the cinematic into
// the driver's seat, driving, stepping out, walking, the product cards, the
// onboarding coach, the HUD and the way back to the page.
import * as THREE from 'three';
import { ArcadeCar } from '../../_shared/3d/vehicles/vehicles.js';
import { SPEED } from '../../_shared/3d/people/people.js';
import { ROAD, STOPS, START, LM_FRONT } from './layout.js';
import { content } from '../../_shared/content.js';
import { STATUS, ago } from './screens.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const HERO = {
  wide: { pos: V(-165, 36, -58), look: V(10, -3, 30), fov: 36 },
  tall: { pos: V(-150, 40, -66), look: V(20, -4, 40), fov: 62 },
};
export const HERO_E0 = 1.2; // the poster is rendered at this elevation, so the live scene takes over without a jump
export const hourOf = (e) => (e >= 6 ? 'Afternoon' : e >= 0.4 ? 'Golden hour' : e >= -4.2 ? 'Blue hour' : 'Lamplight');
export const fmtDeg = (e) => `${e > 0.05 ? '+' : e < -0.05 ? '−' : ''}${Math.abs(e).toFixed(1)}°`;

// ------------------------------------------------------------------ input
class Input {
  constructor() {
    this.keys = new Set(); this.joy = { x: 0, y: 0, on: false }; this.queue = [];
    this.look = { dx: 0, dy: 0, active: false };
    this.kd = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const c = e.code;
      if (/^(Arrow|Key[WASD]|Space|Shift)/.test(c)) { this.keys.add(c); if (c.startsWith('Arrow') || c === 'Space') e.preventDefault(); }
      if (!e.repeat) {
        if (c === 'KeyE' || c === 'Enter' && e.target === document.body) this.queue.push('action');
        if (c === 'KeyC') this.queue.push('camera');
        if (c === 'KeyH') this.queue.push('horn');
        if (c === 'KeyL') this.queue.push('lights');
        if (c === 'Escape') this.queue.push('escape');
        if (c === 'BracketLeft') this.queue.push('sunDown');
        if (c === 'BracketRight') this.queue.push('sunUp');
      }
    };
    this.ku = (e) => this.keys.delete(e.code);
    this.blur = () => this.keys.clear();
    addEventListener('keydown', this.kd); addEventListener('keyup', this.ku); addEventListener('blur', this.blur);
  }
  state() {
    const k = this.keys;
    const up = k.has('KeyW') || k.has('ArrowUp'), dn = k.has('KeyS') || k.has('ArrowDown');
    const lf = k.has('KeyA') || k.has('ArrowLeft'), rt = k.has('KeyD') || k.has('ArrowRight');
    const sp = k.has('Space') || this.brakeBtn;
    const jx = this.joy.x, jy = this.joy.y;
    return {
      throttle: Math.max(up ? 1 : 0, jy > 0.12 ? jy : 0),
      brake: Math.max(dn || sp ? 1 : 0, jy < -0.12 ? -jy : 0),
      handbrake: sp,
      steer: clamp((lf ? 1 : 0) - (rt ? 1 : 0) - jx * 1.1, -1, 1),
      moveX: clamp((rt ? 1 : 0) - (lf ? 1 : 0) + jx, -1, 1),
      moveY: clamp((up ? 1 : 0) - (dn ? 1 : 0) + jy, -1, 1),
      run: k.has('ShiftLeft') || k.has('ShiftRight'),
      analog: this.joy.on,
    };
  }
  take() { const q = this.queue; this.queue = []; return q; }
}

// ------------------------------------------------------------------ the game
export function createGame(world, { audio, feed, reduced = false, params = new URLSearchParams(), onLeave, onEnter } = {}) {
  const { camera, car, player, stops } = world;
  const canvas = world.renderer.domElement;
  const input = new Input();
  const touch = matchMedia('(pointer: coarse)').matches || params.get('touch') === '1';
  const ui = {
    root: $('#game'), coach: $('#coach'), prompt: $('#prompt'), speedo: $('#speedo'), speedVal: $('#speedo b'),
    way: $('#waypoint'), card: $('#card'), route: $('#route'), car: $('#route-car'), sun: $('#hud-sun'), hour: $('#hud-hour'),
    camBtn: $('#hud-cam'), fade: $('#fade'), toast: $('#toast'), touch: $('#touch'), knob: $('#joy-knob'),
  };

  const drive = new ArcadeCar(car, { maxSpeed: 19, accel: 7.2, brakeDecel: 15, reverseSpeed: 5, steerRate: 4, maxSteer: 0.58, groundY: () => ROAD.y, canMove: () => true });
  drive.set(START.x, START.z, START.heading);

  // modes: hero | cine | drive | walk | out
  let mode = 'hero', camMode = 'cockpit', time = 0;
  let sunTarget = world.elevation, sunAuto = !reduced && !params.has('t');
  const heroT0 = performance.now();
  let cine = null;
  const lookOff = { yaw: 0, pitch: 0 };
  const walk = { x: 0, z: 0, heading: 0, speed: 0, camYaw: 0, camPitch: 0.2, clip: 'idle' };
  let cardStop = null, arrivedAt = null, visited = new Set(), coachStep = -1, coachT = 0, steerHeld = 0, doorT = 0, doorTarget = 0;
  let shake = 0, lastBump = 0, flash = 0;
  const camPos = V(), camLook = V(), tmp = V(), tmp2 = V();
  let fovNow = 36;
  const camQ = params.get('cam')?.split(',').map(Number);
  const heroPose = () => camQ ? { pos: V(camQ[0], camQ[1], camQ[2]), look: V(camQ[3], camQ[4], camQ[5]), fov: camQ[6] || 34 } : (camera.aspect < 1.05 ? HERO.tall : HERO.wide);

  // ---------------------------------------------------------------- coach (onboarding)
  const K = (k) => `<kbd>${k}</kbd>`;
  const STEPS = [
    { id: 'drive', html: () => touch ? 'Push the stick forward to drive' : `${K('W')} or ${K('↑')} to drive` },
    { id: 'steer', html: () => touch ? 'Lean the stick left and right to steer' : `${K('A')} ${K('D')} or ${K('←')} ${K('→')} to steer` },
    { id: 'brake', html: () => touch ? 'Pull the stick back, or hold <b>Brake</b>' : `${K('S')} or ${K('Space')} to brake. Keep holding to reverse` },
    { id: 'cam', html: () => touch ? 'The <b>View</b> button switches between the driver’s seat and the chase camera' : `${K('C')} switches between the driver’s seat and the chase camera` },
    { id: 'stop', html: () => `Slow down and stop in the lit bay outside <b>${esc(nextName())}</b>` },
    { id: 'exit', html: () => touch ? 'Tap <b>E</b> to step out' : `Press ${K('E')} to step out` },
    { id: 'walk', html: () => touch ? 'Use the stick to walk up to the door' : `${K('W')}${K('A')}${K('S')}${K('D')} to walk, hold ${K('Shift')} to run. Walk up to the door` },
    { id: 'back', html: () => touch ? 'Walk back to the car and tap <b>E</b> to drive on. Three more stops along the road' : `Back at the car, ${K('E')} drives on. Three more stops along the road. ${K('Esc')} returns to the page` },
  ];
  const nextName = () => content.products.find((p) => p.id === (waypoint || stops[0]).id).name;
  let coached = false;
  try { coached = localStorage.getItem('hb92-coached') === '1'; } catch {}
  if (params.has('coach')) coached = false;
  if (params.has('nocoach')) coached = true;
  function coach(i) {
    coachStep = i; coachT = 0;
    if (i < 0 || i >= STEPS.length) { ui.coach.classList.remove('is-on'); if (i >= STEPS.length) { try { localStorage.setItem('hb92-coached', '1'); } catch {} } return; }
    ui.coach.classList.remove('is-on');
    setTimeout(() => {
      if (coachStep !== i) return;
      ui.coach.innerHTML = `<span class="coach-n">${i + 1}/${STEPS.length}</span><span class="coach-t">${STEPS[i].html()}</span><button type="button" class="coach-skip" data-skip>Skip tips</button>`;
      ui.coach.classList.add('is-on');
    }, 220);
  }
  ui.coach.addEventListener('click', (e) => { if (e.target.closest('[data-skip]')) { coached = true; coach(STEPS.length); } });
  const stepIs = (id) => coachStep >= 0 && coachStep < STEPS.length && STEPS[coachStep].id === id;
  const nextStep = () => coach(coachStep + 1);

  function toast(html, ms = 2600) {
    ui.toast.innerHTML = html; ui.toast.classList.add('is-on');
    clearTimeout(toast.t); toast.t = setTimeout(() => ui.toast.classList.remove('is-on'), ms);
  }
  function setPrompt(html) {
    if (ui.prompt._html === html) return;
    ui.prompt._html = html;
    if (!html) { ui.prompt.classList.remove('is-on'); return; }
    ui.prompt.innerHTML = html; ui.prompt.classList.add('is-on');
  }

  // ---------------------------------------------------------------- route strip
  const X0 = -ROAD.driveX, X1 = ROAD.driveX;
  const pct = (x) => ((x - X0) / (X1 - X0)) * 100;
  ui.route.querySelector('.route-stops').innerHTML = STOPS.map((s, i) => {
    const p = content.products.find((q) => q.id === s.id);
    // neighbours closer than ~a label's width lean away from each other so the names never collide
    const gapL = i > 0 ? s.x - STOPS[i - 1].x : 1e9, gapR = i < STOPS.length - 1 ? STOPS[i + 1].x - s.x : 1e9;
    const lean = gapR < 80 && gapR < gapL ? 'l' : gapL < 80 ? 'r' : '';
    return `<li style="--x:${pct(s.x).toFixed(2)}%"${lean ? ` data-lean="${lean}"` : ''}><button type="button" data-stop="${i}" aria-label="Go to ${esc(p.name)}"><i></i><span>${esc(p.name)}</span></button></li>`;
  }).join('');
  ui.route.querySelector('.route-town').style.cssText = `--a:${pct(-64)}%;--b:${pct(64)}%`;
  ui.route.addEventListener('click', (e) => {
    const b = e.target.closest('[data-stop]'); if (!b || (mode !== 'drive' && mode !== 'walk')) return;
    jumpTo(+b.dataset.stop);
  });
  function jumpTo(i) {
    const s = stops[i];
    fadeThen(() => {
      if (mode === 'walk') boardCar(true);
      closeCard();
      drive.set(s.x - 9, ROAD.laneE, Math.PI / 2);
      drive.speed = 0;
      camInit = false;
      if (stepIs('stop') && i !== 0) { /* the coach still wants the first bay; let them choose */ }
    });
  }
  function fadeThen(fn) {
    ui.fade.classList.add('is-on');
    setTimeout(() => { fn(); setTimeout(() => ui.fade.classList.remove('is-on'), 120); }, reduced ? 60 : 380);
  }

  // ---------------------------------------------------------------- product card
  function openCard(s) {
    if (cardStop === s) return;
    cardStop = s;
    const p = content.products.find((q) => q.id === s.id);
    const host = p.url ? new URL(p.url).hostname : '';
    const evs = feed.events().filter((e) => e.product === s.id).slice(0, 3);
    ui.card.innerHTML = `
      <button type="button" class="card-close" data-close aria-label="Close">${touch ? 'Close' : 'Esc'}</button>
      <img class="card-logo" src="${LOGO[s.id]}" alt="" width="56" height="56">
      <p class="card-status" data-status="${p.status}"><i></i>${STATUS[p.status]} · since ${p.since}</p>
      <h2 class="card-name">${esc(p.name)}</h2>
      ${p.figure ? `<p class="card-fig"><b>${esc(p.figure.value)}</b> ${esc(p.figure.label)}</p>` : ''}
      <p class="card-line">${esc(p.line)}</p>
      ${p.facts ? `<ul class="card-facts">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      <div class="card-events"><p class="card-ev-h">${feed.mode() === 'live' ? 'Latest events' : 'Demo events <span>(no live data yet)</span>'}</p>
        <ol>${evs.length ? evs.map((e) => `<li><span>${esc(e.text)}${e.country ? ' · ' + esc(e.country) : ''}</span><time>${ago(e.time)}</time></li>`).join('') : `<li><span>${p.status === 'paused' ? `No recent events. ${esc(p.name)} is paused.` : 'No events in the last while.'}</span></li>`}</ol></div>
      ${p.url ? `<a class="card-link" href="${p.url}" target="_blank" rel="noopener">Visit ${host} <span aria-hidden="true">↗</span></a>` : ''}`;
    ui.card.classList.add('is-on'); ui.root.classList.add('has-card');
    ui.card.setAttribute('aria-hidden', 'false');
    audio?.chime(0.5);
    if (!visited.has(s.id)) {
      visited.add(s.id); renderVisited();
      if (visited.size === STOPS.length) setTimeout(() => {
        rippleLights();
        toast(`All four stops visited. ${touch ? '<b>Lights</b>' : K('L')} sends a wave through the town’s lights, any time.`, 7000);
      }, 1200);
    }
    if (stepIs('walk')) nextStep();
  }
  function closeCard() {
    if (!cardStop) return;
    cardStop = null; ui.card.classList.remove('is-on'); ui.root.classList.remove('has-card'); ui.card.setAttribute('aria-hidden', 'true');
  }
  ui.card.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) { closeCard(); cardDismissed = true; } });
  let cardDismissed = false;
  const LOGO = {
    'mcp-emails': '../_shared/products/mcp-emails/logo-mark.svg', 'fun-libs': '../_shared/products/fun-libs/icon.png',
    toolrails: '../_shared/products/toolrails/icon.svg', harbor: '../_shared/products/harbor/harbor-mark.svg',
  };
  function renderVisited() {
    ui.route.querySelectorAll('[data-stop]').forEach((b) => b.classList.toggle('is-visited', visited.has(STOPS[+b.dataset.stop].id)));
  }

  // ---------------------------------------------------------------- touch controls
  if (touch) {
    ui.touch.hidden = false;
    const pad = ui.touch.querySelector('.joy');
    let id = null;
    const move = (e) => {
      const r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = (e.clientX - cx) / (r.width * 0.42), dy = (e.clientY - cy) / (r.height * 0.42); const l = Math.hypot(dx, dy);
      if (l > 1) { dx /= l; dy /= l; }
      input.joy.x = dx; input.joy.y = -dy; input.joy.on = true;
      ui.knob.style.transform = `translate(${dx * r.width * 0.32}px,${dy * r.height * 0.32}px)`;
    };
    pad.addEventListener('pointerdown', (e) => { id = e.pointerId; pad.setPointerCapture(id); move(e); });
    pad.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
    const end = (e) => { if (e.pointerId !== id) return; id = null; input.joy.x = input.joy.y = 0; input.joy.on = false; ui.knob.style.transform = ''; };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
    ui.touch.querySelector('[data-act="e"]').addEventListener('pointerdown', (e) => { e.preventDefault(); input.queue.push('action'); });
    const brake = ui.touch.querySelector('[data-act="brake"]');
    brake.addEventListener('pointerdown', (e) => { e.preventDefault(); input.brakeBtn = true; });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) brake.addEventListener(ev, () => { input.brakeBtn = false; });
  }
  ui.camBtn.addEventListener('click', () => input.queue.push('camera'));
  $('#hud-lights').addEventListener('click', () => input.queue.push('lights'));
  // the signature: every light in town goes dark and comes back, in a wave out from you
  let lastRipple = -99;
  function rippleLights() {
    if (time - lastRipple < 4) return;
    lastRipple = time;
    const p = mode === 'walk' ? walk : car.root.position;
    world.ripple(p.x, p.z);
    audio?.chord();
  }
  // HUD buttons give focus back after a click, so Space (brake) never presses them again
  ui.root.addEventListener('pointerup', (e) => { const b = e.target.closest('button'); if (b) setTimeout(() => b.blur(), 0); });
  $('#leave').addEventListener('click', () => leave());
  $('#hud-sun-down').addEventListener('click', () => nudgeSun(-1));
  $('#hud-sun-up').addEventListener('click', () => nudgeSun(1));
  function nudgeSun(d) { sunAuto = false; sunTarget = clamp(sunTarget + d * 1, -7, 12); clearTimeout(nudgeSun.t); nudgeSun.t = setTimeout(() => { sunAuto = !reduced; }, 20000); }

  // drag to look around (in the car) or orbit (on foot)
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (mode === 'hero') return heroDown(e);
    if (mode !== 'drive' && mode !== 'walk') return;
    if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.45) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (mode === 'hero') return heroMove(e);
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    if (mode === 'walk') { walk.camYaw -= dx * 0.006; walk.camPitch = clamp(walk.camPitch + dy * 0.004, -0.15, 0.85); walk.dragT = 2.5; }
    else { lookOff.yaw = clamp(lookOff.yaw - dx * 0.005, -2.2, 2.2); lookOff.pitch = clamp(lookOff.pitch - dy * 0.004, -0.5, 0.5); }
  });
  const endDrag = () => { drag = null; heroDrag = false; };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

  // ---------------------------------------------------------------- hero: drag the sun
  let heroDrag = false;
  const sunScreen = () => {
    tmp.copy(world.sunDir).multiplyScalar(2000).add(camera.position).project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + (tmp.x + 1) / 2 * r.width, y: r.top + (1 - tmp.y) / 2 * r.height, z: tmp.z };
  };
  function heroDown(e) {
    const s = sunScreen();
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < Math.max(60, canvas.clientHeight * 0.08)) {
      heroDrag = true; sunAuto = false; canvas.setPointerCapture(e.pointerId); e.preventDefault();
      drag = null;
    }
  }
  function heroMove(e) {
    const s = sunScreen();
    if (!heroDrag) { canvas.style.cursor = Math.hypot(e.clientX - s.x, e.clientY - s.y) < 60 ? 'grab' : ''; return; }
    canvas.style.cursor = 'grabbing';
    // pixels to degrees from the camera's vertical field of view
    const degPerPx = camera.fov / canvas.clientHeight;
    sunTarget = clamp(sunTarget - (e.movementY || 0) * degPerPx, -7, 12);
  }
  canvas.addEventListener('touchstart', (e) => {
    if (mode !== 'hero') return;
    const s = sunScreen(), t = e.touches[0];
    if (Math.hypot(t.clientX - s.x, t.clientY - s.y) < 64) e.preventDefault();
  }, { passive: false });

  // ---------------------------------------------------------------- enter / leave
  let camInit = false;
  function seatEye(out) { car.root.updateMatrixWorld(true); return car.anchors.seat_driver.getWorldPosition(out); }
  function carFwd(out) { return out.set(Math.sin(drive.heading), 0, Math.cos(drive.heading)); }

  function enter({ instant = false } = {}) {
    if (mode !== 'hero' && mode !== 'out') return;
    onEnter?.();
    document.activeElement?.blur?.();
    ui.root.hidden = false;
    requestAnimationFrame(() => ui.root.classList.add('is-on'));
    world.focusSpan = 55;
    closeCard();
    if (mode === 'out' && walk.onFoot) boardCar(true);
    placePlayerInCar();
    camMode = 'cockpit'; lookOff.yaw = lookOff.pitch = 0;
    ui.camBtn.textContent = 'View: driver’s seat';
    if (instant || reduced) {
      if (reduced && !instant) fadeThen(() => { mode = 'drive'; camInit = false; startCoach(); });
      else { mode = 'drive'; camInit = false; startCoach(); }
      return;
    }
    const P0 = camera.position.clone(), L0 = camLook.clone();
    const C = car.root.position.clone(), f = carFwd(V()), side = V(-f.z, 0, f.x); // side: toward the sea when heading +X
    const E = seatEye(V());
    const pos = new THREE.CatmullRomCurve3([P0, P0.clone().lerp(C, 0.3).add(V(0, 9, 0)), C.clone().addScaledVector(f, -26).addScaledVector(side, -12).add(V(0, 9, 0)),
      C.clone().addScaledVector(f, -7.5).addScaledVector(side, -2.2).add(V(0, 2.6, 0)), E], false, 'centripetal');
    const look = new THREE.CatmullRomCurve3([L0, L0.clone().lerp(C, 0.6), C.clone().addScaledVector(f, 6).add(V(0, 0.5, 0)),
      C.clone().addScaledVector(f, 9).add(V(0, 1.2, 0)), E.clone().addScaledVector(f, 12).add(V(0, -0.9, 0))], false, 'centripetal');
    cine = { t: 0, dur: 5.4, pos, look, fov0: camera.fov, fov1: cockpitFov(), kind: 'in' };
    mode = 'cine';
    audio?.whoosh();
  }
  function startCoach() {
    if (!coached && coachStep < 0) coach(0);
    else if (coached) toast(`${touch ? 'Stick to drive · <b>E</b> at a stop' : `${K('W')}${K('A')}${K('S')}${K('D')} drive · ${K('C')} view · ${K('E')} at a stop · ${K('H')} horn · ${K('L')} lights · ${K('Esc')} back to the page`}`, 5200);
  }
  function leave() {
    if (mode !== 'drive' && mode !== 'walk') return;
    closeCard(); setPrompt('');
    ui.coach.classList.remove('is-on');
    const P0 = camera.position.clone(), L0 = camLook.clone();
    const H = heroPose();
    const pos = new THREE.CatmullRomCurve3([P0, P0.clone().add(V(0, 14, 0)).lerp(H.pos, 0.35), H.pos.clone()], false, 'centripetal');
    const look = new THREE.CatmullRomCurve3([L0, L0.clone().lerp(H.look, 0.5).add(V(0, 6, 0)), H.look.clone()], false, 'centripetal');
    walk.onFoot = mode === 'walk';
    cine = { t: 0, dur: reduced ? 0.01 : 3.2, pos, look, fov0: camera.fov, fov1: H.fov, kind: 'out' };
    mode = 'cine';
    ui.root.classList.remove('is-on');
    audio?.engine(0, 0);
  }

  // ---------------------------------------------------------------- car <-> on foot
  function placePlayerInCar() {
    player.object.visible = camMode !== 'cockpit';
    player.play('drive', 0);
    walk.onFoot = false;
  }
  function syncPlayerSeat() {
    const eye = seatEye(tmp);
    const f = carFwd(tmp2);
    player.object.position.copy(eye).addScaledVector(f, 0.12); player.object.position.y = eye.y - 1.12;
    player.object.rotation.y = drive.heading;
  }
  function stepOut() {
    const ex = car.anchors.exit_l ? car.anchors.exit_l.getWorldPosition(V()) : car.root.position.clone().add(V(0, 0, -1.6));
    mode = 'walk';
    walk.x = ex.x; walk.z = clamp(ex.z, ROAD.z - 4.5, ROAD.z + 4.2); walk.speed = 0;
    // face the stop's door, with the camera behind you, so W walks you straight up to it
    const st = arrivedAt || stops.reduce((a, b) => (Math.abs(b.x - walk.x) < Math.abs(a.x - walk.x) ? b : a));
    const toDoor = Math.atan2(st.door.x - walk.x, st.door.z - walk.z);
    walk.heading = toDoor; walk.camYaw = toDoor + Math.PI; walk.dragT = 0; walk.boom = undefined;
    walk.onFoot = true;
    player.object.visible = true;
    player.object.position.set(walk.x, ROAD.y, walk.z); player.object.rotation.y = walk.heading;
    player.play('idle', 0.2);
    doorTarget = 1; setTimeout(() => { doorTarget = 0; }, 1300);
    audio?.door();
    drive.enabled = false; drive.speed = 0;
    world.focusSpan = 40;
    if (stepIs('exit')) nextStep();
  }
  function boardCar(instant = false) {
    mode = 'drive'; walk.onFoot = false; drive.enabled = true;
    closeCard(); cardDismissed = false;
    placePlayerInCar();
    if (!instant) { doorTarget = 1; setTimeout(() => { doorTarget = 0; }, 900); audio?.door(); }
    camInit = false; world.focusSpan = 55;
    if (stepIs('back')) nextStep();
  }

  // ---------------------------------------------------------------- cameras
  function heroCamera(dt) {
    const H = heroPose();
    const t = time;
    const sway = reduced ? 0 : 1;
    camera.position.copy(H.pos).add(tmp.set(Math.sin(t * 0.09) * 0.6 * sway, Math.sin(t * 0.13) * 0.25 * sway, 0));
    camLook.copy(H.look);
    camera.lookAt(camLook);
    setFov(H.fov);
  }
  // when a product card covers the right of a wide screen, shift the lens so the scene centres in what is left
  let lensK = 0;
  function lens(dt) {
    const want = cardStop && innerWidth > 760 ? Math.min(0.17, 420 / innerWidth / 2 + 0.01) : 0;
    lensK = damp(lensK, want, 4, dt);
    const fo = lensK < 1e-4 ? 0 : lensK * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * camera.getFilmWidth();
    if (Math.abs(fo - camera.filmOffset) > 1e-4) { camera.filmOffset = fo; camera.updateProjectionMatrix(); }
  }
  // the driver's view keeps a ~80° horizontal field on any screen shape (a fixed vertical FOV
  // made the wheel and the windscreen frame swallow wide screens)
  function cockpitFov() {
    const v = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(40)) / camera.aspect);
    return clamp(THREE.MathUtils.radToDeg(v), 50, 78);
  }
  function setFov(f) { if (Math.abs(camera.fov - f) > 0.01) { camera.fov = f; camera.updateProjectionMatrix(); } fovNow = f; }

  function driveCamera(dt) {
    const f = carFwd(tmp2);
    const spd = Math.abs(drive.speed);
    if (!drag) { lookOff.yaw = damp(lookOff.yaw, 0, 1.6, dt); lookOff.pitch = damp(lookOff.pitch, 0, 2, dt); }
    shake = Math.max(0, shake - dt * 2.5);
    const sh = reduced ? 0 : shake;
    if (camMode === 'cockpit') {
      const eye = seatEye(tmp); eye.y -= 0.03;
      const bob = reduced ? 0 : Math.sin(time * 31) * 0.003 * smooth(1, 15, spd);
      camera.position.copy(eye).add(V(0, bob + (Math.random() - 0.5) * sh * 0.06, 0));
      const yaw = drive.heading + lookOff.yaw - drive.steer * 0.25;
      camLook.set(eye.x + Math.sin(yaw) * 10, eye.y - 0.72 + lookOff.pitch * 10, eye.z + Math.cos(yaw) * 10);
      camera.lookAt(camLook);
      setFov(damp(fovNow, cockpitFov() + spd * 0.3, 3, dt));
      camInit = false;
      return;
    }
    const yaw = drive.heading + lookOff.yaw;
    const dist = 6.6 + spd * 0.06, hgt = 2.35 + spd * 0.015;
    const want = tmp.set(car.root.position.x - Math.sin(yaw) * dist, car.root.position.y + hgt, car.root.position.z - Math.cos(yaw) * dist);
    const lk = V(car.root.position.x + f.x * (4 + spd * 0.25), car.root.position.y + 1.05 + lookOff.pitch * 6, car.root.position.z + f.z * (4 + spd * 0.25));
    if (!camInit) { camPos.copy(want); camLook.copy(lk); camInit = true; }
    camPos.x = damp(camPos.x, want.x, 6, dt); camPos.z = damp(camPos.z, want.z, 6, dt); camPos.y = damp(camPos.y, want.y, 4, dt);
    camLook.lerp(lk, 1 - Math.exp(-10 * dt));
    camera.position.copy(camPos).add(V((Math.random() - 0.5) * sh * 0.2, (Math.random() - 0.5) * sh * 0.2, 0));
    camera.lookAt(camLook);
    setFov(damp(fovNow, 52 + spd * 0.7, 3, dt));
  }

  function walkCamera(dt) {
    if (walk.dragT > 0) walk.dragT -= dt;
    else if (walk.speed > 0.5 && !cardStop) walk.camYaw += angDiff(walk.camYaw, walk.heading + Math.PI) * (1 - Math.exp(-1.1 * dt));
    // when a card is open, ease toward a view of the landmark's screen
    let dist = 4.6, hgt = 1.4, look = V(walk.x, ROAD.y + 1.45, walk.z);
    if (cardStop && !walk.dragT && walk.speed < 0.3) {
      const s = cardStop;
      const yawTo = Math.atan2(walk.x - s.look.x, walk.z - s.look.z) + 0.35;
      walk.camYaw += angDiff(walk.camYaw, yawTo) * (1 - Math.exp(-2 * dt));
      look.lerp(s.look, 0.55);
      dist = 8.6; hgt = 1.9;
      // phones: the card is a bottom sheet, so frame the building in the top half of the screen
      if (innerWidth <= 760) { look.y -= 1.1; hgt = 3; dist = 10; }
    }
    // keep the camera out of walls: pull in along the boom to the last clear point
    const bx = Math.sin(walk.camYaw) * Math.cos(walk.camPitch), bz = Math.cos(walk.camYaw) * Math.cos(walk.camPitch);
    let free = dist;
    for (let i = 1; i <= 12; i++) { const d = (dist * i) / 12; if (world.solidAt(walk.x + bx * d, walk.z + bz * d)) { free = Math.max(1.3, d - 0.5); break; } }
    walk.boom = damp(walk.boom ?? free, free, free < (walk.boom ?? free) ? 14 : 3, dt);
    dist = walk.boom;
    const want = V(walk.x + bx * dist, ROAD.y + hgt + Math.sin(walk.camPitch) * dist, walk.z + bz * dist);
    if (!camInit) { camPos.copy(want); camLook.copy(look); camInit = true; }
    camPos.lerp(want, 1 - Math.exp(-7 * dt)); camLook.lerp(look, 1 - Math.exp(-9 * dt));
    camera.position.copy(camPos); camera.lookAt(camLook);
    setFov(damp(fovNow, camera.aspect < 1 ? 66 : 55, 3, dt));
  }

  // ---------------------------------------------------------------- per-mode logic
  function updateDrive(dt, inp) {
    drive.update(dt, inp);
    const r = car.root.position;
    // keep to the carriageway: scrape along the kerb, ease the heading back along the road
    const lim = ROAD.half - 0.95;
    if (Math.abs(r.z - ROAD.z) > lim) {
      r.z = ROAD.z + Math.sign(r.z - ROAD.z) * lim;
      drive.speed *= 1 - 1.8 * dt;
      const along = Math.cos(drive.heading - Math.PI / 2) >= 0 ? Math.PI / 2 : -Math.PI / 2;
      drive.heading += angDiff(drive.heading, along) * (1 - Math.exp(-3 * dt));
      if (time - lastBump > 0.6 && Math.abs(drive.speed) > 4) { lastBump = time; shake = 0.5; audio?.scrape(); }
    }
    if (Math.abs(r.x) > ROAD.driveX) {
      r.x = Math.sign(r.x) * ROAD.driveX; if (Math.abs(drive.speed) > 1) { drive.speed *= -0.2; shake = 0.6; }
      if (time - (toast.edge || 0) > 6) { toast.edge = time; toast('The tunnel is closed tonight. Turn around: hold ' + (touch ? 'the stick back' : K('S')) + ' to reverse'); }
    }
    // bumping into traffic
    for (const c of world.cars) {
      const dx = c.v.root.position.x - r.x, dz = c.v.root.position.z - r.z;
      if (Math.abs(dz) < 1.75 && Math.abs(dx) < (c.len + 4.1) / 2) {
        r.x -= Math.sign(dx) * ((c.len + 4.1) / 2 - Math.abs(dx));
        if (time - lastBump > 0.5) { lastBump = time; shake = 1; audio?.bump(); drive.speed *= -0.3; c.speed *= 0.3; }
      }
    }
    car.root.rotation.y = drive.heading;
    syncPlayerSeat();
    // coach
    const spd = Math.abs(drive.speed);
    if (stepIs('drive') && spd > 5) nextStep();
    if (stepIs('steer') && Math.abs(inp.steer) > 0.3 && spd > 2) { steerHeld += dt; if (steerHeld > 0.6) nextStep(); }
    if (stepIs('brake') && inp.brake > 0.3 && spd > 1) nextStep();
    if (stepIs('cam') && coachT > 9) nextStep();
    // stops
    arrivedAt = null;
    let next = null, nextD = Infinity;
    for (const s of stops) {
      const dx = r.x - s.bay.x, dz = r.z - s.bay.z;
      if (Math.abs(dx) < 4.8 && Math.abs(dz) < 2.6 && spd < 1.2) arrivedAt = s;
      const ahead = (s.x - r.x) * Math.sign(Math.sin(drive.heading) || 1);
      if (!visited.has(s.id) && ahead > -6 && Math.abs(s.x - r.x) < nextD) { next = s; nextD = Math.abs(s.x - r.x); }
    }
    if (stepIs('cam') && next && Math.abs(next.x - r.x) < 70) nextStep();
    if (stepIs('stop') && arrivedAt) nextStep();
    if (arrivedAt) {
      if (!arrivedAt._chimed) { arrivedAt._chimed = true; audio?.chime(0.4); }
      setPrompt(`<b>${esc(content.products.find((p) => p.id === arrivedAt.id).name)}</b> ${touch ? 'Tap <kbd>E</kbd> to step out' : `${K('E')} Step out`}`);
    } else {
      for (const s of stops) if (Math.abs(r.x - s.bay.x) > 12) s._chimed = false;
      setPrompt(spd < 0.5 && stops.some((s) => Math.abs(r.x - s.x) < 14) ? 'Pull into the lit bay to stop here' : '');
    }
    waypoint = next || stops.find((s) => !visited.has(s.id)) || null;
    audio?.engine(spd / 19, inp.throttle);
  }

  function updateWalk(dt, inp) {
    // camera-relative movement
    const mx = inp.moveX, my = inp.moveY;
    const mag = Math.min(1, Math.hypot(mx, my));
    let target = 0;
    if (mag > 0.08) {
      const yaw = walk.camYaw + Math.PI; // forward = away from the camera
      const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = -fz, rz = fx;
      const dx = fx * my - rx * mx, dz = fz * my - rz * mx;
      const h = Math.atan2(dx, dz);
      walk.heading += angDiff(walk.heading, h) * (1 - Math.exp(-12 * dt));
      target = inp.run ? SPEED.run : inp.analog && mag < 0.55 ? SPEED.walk * 1.15 : SPEED.jog;
    }
    walk.speed = damp(walk.speed, target * (mag > 0.08 ? 1 : 0), 10, dt);
    const nx = walk.x + Math.sin(walk.heading) * walk.speed * dt, nz = walk.z + Math.cos(walk.heading) * walk.speed * dt;
    if (world.walkable(nx, nz)) { walk.x = nx; walk.z = nz; }
    else if (world.walkable(nx, walk.z)) walk.x = nx;
    else if (world.walkable(walk.x, nz)) walk.z = nz;
    // the hero car is solid too
    const cp = car.root.position;
    const lx = walk.x - cp.x, lz = walk.z - cp.z;
    const ca = Math.cos(drive.heading), sa = Math.sin(drive.heading);
    const along = lx * sa + lz * ca, across = lx * ca - lz * sa;
    if (Math.abs(along) < 2.3 && Math.abs(across) < 1.1) {
      const push = Math.sign(across || 1) * (1.1 - Math.abs(across));
      walk.x += ca * push; walk.z -= sa * push;
    }
    const clip = walk.speed < 0.3 ? 'idle' : walk.speed < 2 ? 'walk' : walk.speed < 4 ? 'jog' : 'run';
    if (clip !== walk.clip) { walk.clip = clip; player.play(clip, 0.25); }
    if (player.current) player.current.setEffectiveTimeScale(clip === 'idle' ? 1 : clamp(walk.speed / SPEED[clip], 0.6, 1.6));
    player.object.position.set(walk.x, ROAD.y, walk.z);
    player.object.rotation.y = walk.heading;

    // product card near a door; the car near its door
    let near = null;
    for (const s of stops) if (Math.hypot(walk.x - s.door.x, walk.z - s.door.z) < 2.7) near = s;
    if (near && !cardDismissed) openCard(near);
    if (!near) { cardDismissed = false; if (cardStop && Math.hypot(walk.x - cardStop.door.x, walk.z - cardStop.door.z) > 5) closeCard(); }
    const ex = car.anchors.exit_l ? car.anchors.exit_l.getWorldPosition(tmp) : car.root.position;
    const nearCar = Math.hypot(walk.x - ex.x, walk.z - ex.z) < 2.8;
    setPrompt(nearCar ? (touch ? 'Tap <kbd>E</kbd> to drive' : `${K('E')} Drive`) : '');
    if (stepIs('back') && coachT > 12) nextStep();
    waypoint = near ? null : stops.reduce((a, s) => (Math.abs(s.x - walk.x) < Math.abs(a.x - walk.x) ? s : a), stops[0]);
    if (waypoint && Math.abs(waypoint.x - walk.x) > 30) waypoint = null;
    return nearCar;
  }

  // ---------------------------------------------------------------- HUD
  let waypoint = null, hudT = 1;
  function hud(dt) {
    hudT += dt;
    const spd = Math.abs(drive.speed) * 3.6;
    if (mode === 'drive') { ui.speedVal.textContent = Math.round(spd); ui.speedo.classList.add('is-on'); } else ui.speedo.classList.remove('is-on');
    const x = mode === 'walk' ? walk.x : car.root.position.x;
    ui.car.style.left = pct(clamp(x, X0, X1)).toFixed(2) + '%';
    ui.car.classList.toggle('is-walk', mode === 'walk');
    if (hudT > 0.25) {
      hudT = 0;
      ui.sun.textContent = fmtDeg(world.elevation); ui.hour.textContent = hourOf(world.elevation);
    }
    if (waypoint && (mode === 'drive' || mode === 'walk')) {
      tmp.set(waypoint.x, waypoint.id === 'toolrails' ? 8 : 12.5, LM_FRONT - 2).project(camera);
      const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
      if (vis) {
        const d = Math.abs(waypoint.x - (mode === 'walk' ? walk.x : car.root.position.x));
        const narrow = innerWidth < 760;
        ui.way.style.transform = `translate(${clamp((tmp.x + 1) / 2 * innerWidth, 70, innerWidth - 70).toFixed(1)}px, ${Math.max(narrow ? 226 : 130, (1 - tmp.y) / 2 * innerHeight).toFixed(1)}px)`;
        const name = content.products.find((p) => p.id === waypoint.id).name;
        const txt = `${name}|${d < 12 ? 'here' : Math.round(d / 5) * 5 + ' m'}`;
        if (ui.way._t !== txt) { ui.way._t = txt; ui.way.innerHTML = `<b>${esc(name)}</b><span>${d < 12 ? 'here' : Math.round(d / 5) * 5 + ' m'}</span>`; }
        ui.way.classList.add('is-on');
      } else ui.way.classList.remove('is-on');
    } else ui.way.classList.remove('is-on');
  }

  // ---------------------------------------------------------------- screens with live data
  let screenT = 1;
  function screens(dt) {
    screenT += dt; if (screenT < 0.5) return; screenT = 0;
    const evs = feed.events(), m = feed.mode();
    const fx = mode === 'walk' ? walk.x : mode === 'hero' ? 9999 : car.root.position.x;
    for (const s of stops) {
      const d = Math.abs(s.x - fx);
      if (d < 140 || mode === 'hero') s.screen.draw({ events: evs, mode: m, hot: smooth(30, 4, d), clock: time });
      // the bay glows until you have visited; brighter as you come close
      s.marker.set(visited.has(s.id) ? 0.25 : mode === 'hero' ? 0.6 : 0.55 + 0.45 * smooth(120, 20, d), smooth(14, 40, d) * (visited.has(s.id) ? 0.25 : 1));
      // a stop wakes up when you arrive: every light on, whatever the hour
      const welcome = d < 45 && mode !== 'hero';
      for (const w of s.switches) w.forced = welcome ? 1 : null;
    }
  }

  // ---------------------------------------------------------------- main tick
  function tick(dt) {
    time += dt; coachT += dt;
    // the sun: in the hero it sets over ~50 s, in the world it keeps setting while you play
    if (sunAuto) {
      if (mode === 'hero') {
        const k = (performance.now() - heroT0) / 1000;
        sunTarget = HERO_E0 - Math.min(5, k * 0.11);
      } else if (mode === 'drive' || mode === 'walk') sunTarget = Math.max(-6.8, sunTarget - dt * 0.045);
    }
    const e = damp(world.elevation, sunTarget, heroDrag ? 8 : 2.2, dt);
    if (Math.abs(e - world.elevation) > 1e-4) world.setElevation(e);

    for (const a of input.take()) {
      if (a === 'escape') { if (cardStop) { closeCard(); cardDismissed = true; } else if (mode === 'drive' || mode === 'walk') leave(); }
      if (a === 'camera' && mode === 'drive') {
        camMode = camMode === 'chase' ? 'cockpit' : 'chase';
        ui.camBtn.textContent = camMode === 'chase' ? 'View: chase' : 'View: driver’s seat';
        player.object.visible = camMode !== 'cockpit';
        if (stepIs('cam')) nextStep();
      }
      if (a === 'horn' && mode === 'drive') { audio?.horn(); flash = 0.35; }
      if (a === 'lights' && (mode === 'drive' || mode === 'walk')) rippleLights();
      if (a === 'sunDown') nudgeSun(-1);
      if (a === 'sunUp') nudgeSun(1);
      if (a === 'action') {
        if (mode === 'drive' && arrivedAt) stepOut();
        else if (mode === 'walk' && nearCarNow) boardCar();
      }
    }
    const inp = input.state();
    let focus = null;
    if (mode === 'hero') { heroCamera(dt); focus = V(10, 0, -10); world.focusSpan = 130; }
    else if (mode === 'cine') {
      if (!cine.hold) cine.t += dt / cine.dur;
      const k = ease(Math.min(1, cine.t));
      cine.pos.getPoint(k, camera.position); cine.look.getPoint(k, camLook); camera.lookAt(camLook);
      setFov(cine.fov0 + (cine.fov1 - cine.fov0) * k);
      if (cine.kind === 'in') { syncPlayerSeat(); player.object.visible = k < 0.85; }
      focus = cine.kind === 'in' ? car.root.position.clone().lerp(V(10, 0, -10), 1 - k) : car.root.position.clone().lerp(V(10, 0, -10), k);
      world.focusSpan = cine.kind === 'in' ? 130 - 75 * k : 55 + 75 * k;
      if (cine.t >= 1) {
        if (cine.kind === 'in') { mode = 'drive'; camInit = false; player.object.visible = false; startCoach(); }
        else { mode = 'out'; ui.root.hidden = true; onLeave?.(); }
        cine = null;
      }
    } else if (mode === 'drive') { updateDrive(dt, inp); driveCamera(dt); focus = car.root.position; }
    else if (mode === 'walk') { nearCarNow = updateWalk(dt, inp); walkCamera(dt); focus = player.object.position; drive.update(dt, {}); syncDoor(dt); }
    else if (mode === 'out') { heroCamera(dt); focus = V(10, 0, -10); world.focusSpan = 130; }
    if (mode !== 'walk') syncDoor(dt);
    if (flash > 0) { flash -= dt; car.setLights(flash > 0 && Math.floor(flash * 12) % 2 ? 1 : world.carLight()); }
    if (mode === 'walk' || mode === 'drive' || mode === 'cine') hud(dt);
    lens(dt);
    screens(dt);
    world.update(reduced && (mode === 'hero' || mode === 'out') ? 0 : dt, focus, {
      playerCar: mode === 'drive' || mode === 'walk' ? { x: car.root.position.x, z: car.root.position.z, speed: drive.speed, heading: drive.heading } : null,
      playerOnFoot: mode === 'walk' ? { x: walk.x, z: walk.z } : null,
    });
  }
  let nearCarNow = false;
  function syncDoor(dt) {
    doorT = damp(doorT, doorTarget, 7, dt);
    car.setDoor('l', doorT);
  }

  // ---------------------------------------------------------------- shots for headless screenshots
  function shot(kind) {
    const si = +(params.get('stop') ?? 0);
    if (kind === 'drive' || kind === 'cockpit' || kind === 'chase') {
      const x = +(params.get('x') ?? START.x + 30);
      drive.set(x, ROAD.laneE, Math.PI / 2); enter({ instant: true });
      camMode = kind === 'cockpit' ? 'cockpit' : 'chase'; player.object.visible = camMode !== 'cockpit';
      drive.speed = +(params.get('v') ?? (kind === 'cockpit' ? 0 : 9));
    } else if (kind === 'stop') {
      drive.set(stops[si].x - 2, ROAD.laneE, Math.PI / 2); enter({ instant: true }); camMode = 'chase'; player.object.visible = true;
      if (!coached) coach(5);
    } else if (kind === 'walk' || kind === 'card') {
      drive.set(stops[si].x - 2, ROAD.laneE, Math.PI / 2); enter({ instant: true }); stepOut();
      walk.x = stops[si].door.x + 1.2; walk.z = kind === 'card' ? stops[si].door.z + 1 : ROAD.z - 1; walk.heading = Math.PI; walk.camYaw = 0.3;
      if (!coached) coach(kind === 'card' ? 7 : 6);
    }
    // deep links drop the car anywhere: move traffic that would sit on top of it
    for (const c of world.cars) if (Math.abs(c.x - car.root.position.x) < 14) c.x += c.dir * -30;
    if (params.has('rip')) { const p = mode === 'walk' ? walk : car.root.position; world.ripple(p.x, p.z); world.sw.ripple.t -= +params.get('rip'); }
    if (kind === 'cine') {
      heroCamera(0); enter(); cine.t = +(params.get('p') ?? 0.5); cine.hold = true;
    }
  }

  return { tick, enter, leave, shot, get mode() { return mode; }, set sunTarget(v) { sunTarget = v; }, get sunTarget() { return sunTarget; }, set sunAuto(v) { sunAuto = v; }, camLook };
}
