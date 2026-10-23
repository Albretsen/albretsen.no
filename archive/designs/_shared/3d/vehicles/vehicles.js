// Heure Bleue vehicles: loader helpers + a drop-in arcade car controller.
// three.js r170. Vehicles face +Z, left side is +X, origin on the ground under the centre.
//
//   import * as THREE from 'three';
//   import { loadVehicle, ArcadeCar, CarInput, ChaseCamera } from './vehicles.js';
//   const car = await loadVehicle('hero_car.glb');      // { root, wheels, steering, doors, anchors, setLights, setDoor }
//   scene.add(car.root);
//   const drive = new ArcadeCar(car, { groundY: (x, z) => 0 });
//   const input = new CarInput({ touch: document.body });  // keyboard + on-screen joystick
//   const cam = new ChaseCamera(camera, car);
//   // per frame:
//   drive.update(dt, input.state());  cam.update(dt);  car.setLights(duskAmount);
//
// Needs 'three' and 'three/addons/' in an import map (the files are meshopt-compressed).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const BASE = new URL('./', import.meta.url).href;
export const VEHICLE_FILES = {
  hero: 'hero_car.glb', heroMustard: 'hero_car_mustard.glb', citycar: 'city_car.glb',
  van: 'van.glb', scooter: 'scooter.glb', bicycle: 'bicycle.glb',
};

let _loader;
function loader() {
  if (!_loader) { _loader = new GLTFLoader(); _loader.setMeshoptDecoder(MeshoptDecoder); }
  return _loader;
}
const _cache = new Map();

/** Load a vehicle (file name from VEHICLE_FILES, or a URL). Each call returns an independent clone.
 *  opts.posterColors: set true if your scene runs with THREE.ColorManagement.enabled = false,
 *  so material colours are converted back to the palette's sRGB values.
 *  opts.paint: optional colour for the 'paint' material (e.g. '#d9a42b'). */
export async function loadVehicle(nameOrUrl, opts = {}) {
  const file = VEHICLE_FILES[nameOrUrl] || nameOrUrl;
  const url = /^(https?:|\/|\.)/.test(file) ? file : BASE + file;
  if (!_cache.has(url)) _cache.set(url, loader().loadAsync(url));
  const gltf = await _cache.get(url);
  return prepareVehicle(gltf.scene.clone(true), opts);
}

/** Find the named parts of a vehicle scene and give it switchable lights. */
export function prepareVehicle(scene, opts = {}) {
  const root = new THREE.Group();
  root.name = 'vehicle';
  const model = scene.children.length === 1 ? scene.children[0] : scene;
  root.add(model);
  const by = (n) => model.getObjectByName(n) || null;
  const mats = new Map();
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    const cloned = list.map((m) => {
      if (!mats.has(m)) {
        const c = m.clone();
        if (opts.posterColors) { c.color.convertLinearToSRGB(); c.emissive.convertLinearToSRGB(); }
        if (c.name === 'paint' && opts.paint) c.color.set(opts.paint);
        if (c.name === 'glass') { c.transparent = true; c.depthWrite = false; }
        mats.set(m, c);
      }
      return mats.get(m);
    });
    o.material = Array.isArray(o.material) ? cloned : cloned[0];
  });
  const all = [...mats.values()];
  const emissive = all.filter((m) => m.name.startsWith('emissive_'));
  emissive.forEach((m) => { m.userData.base = m.emissive.clone(); m.emissiveIntensity = 0; });
  const wheels = {};
  for (const k of ['fl', 'fr', 'rl', 'rr', 'f', 'r']) { const w = by('wheel_' + k); if (w) wheels[k] = w; }
  for (const w of Object.values(wheels)) { w.rotation.order = 'YXZ'; w.userData.r = wheelRadius(w); }
  const handlebar = by('handlebar'), crank = by('crank');
  const steering = by('steering_wheel');
  if (steering) steering.userData.rest = steering.quaternion.clone();
  const doors = { l: by('door_l'), r: by('door_r') };
  for (const d of Object.values(doors)) if (d) d.userData.rest = d.rotation.y;
  const anchors = {};
  model.traverse((o) => { if (!o.isMesh && o !== model && o.children.length === 0) anchors[o.name] = o; });

  // Everything except the wheels sits in a chassis group so it can lean in corners.
  const chassis = new THREE.Group();
  chassis.name = 'chassis';
  for (const c of [...model.children]) if (!/^wheel_/.test(c.name) && c !== handlebar && c !== crank) chassis.add(c);
  model.add(chassis);

  let lights = 0, brake = 0;
  const beams = [];
  const applyLights = () => {
    for (const b of beams) b.intensity = lights * b.userData.max;
    for (const m of emissive) {
      let k = lights;
      if (m.name === 'emissive_taillight') k = Math.max(lights * 0.7, brake * 1.6);
      if (m.name === 'emissive_headlight') k = lights * 1.6;
      m.emissiveIntensity = k;
    }
  };
  const twoWheeler = !!(wheels.f && wheels.r);
  let crankAngle = 0;
  return {
    root, model, chassis, wheels, steering, handlebar, crank, doors, anchors, materials: all, emissive, twoWheeler,
    /** Spin wheels (and pedals) for a distance travelled, and turn the front wheels / bars. */
    roll(dist, steer = 0) {
      for (const k in wheels) {
        const w = wheels[k];
        w.rotation.x += dist / w.userData.r;
        if (k === 'fl' || k === 'fr') w.rotation.y = steer;
        if (k === 'f' && handlebar) w.rotation.y = 0;
      }
      if (handlebar) handlebar.rotation.y = steer * 0.8;
      if (wheels.f && handlebar) { wheels.f.rotation.y = steer * 0.8; }
      if (crank) { crankAngle += dist / 0.75; crank.rotation.x = crankAngle; }
      if (steering) steering.quaternion.copy(steering.userData.rest).multiply(_q.setFromAxisAngle(_z, -steer * 2.6));
    },
    /** 0 = off (day), 1 = full (night). */
    setLights(k) { lights = k; applyLights(); },
    setBrake(k) { brake = k; applyLights(); },
    /** side 'l' | 'r', open 0..1 */
    setDoor(side, open) {
      const d = doors[side]; if (!d) return;
      d.rotation.y = d.userData.rest + (side === 'l' ? -1 : 1) * open * 1.15;
    },
    /** Real light from the headlamps (SpotLights on the light_head* anchors). Costly: use on the hero only. */
    addBeams({ intensity = 30, distance = 28, angle = 0.5, color = '#ffe2b0', shadows = false } = {}) {
      for (const [n, a] of Object.entries(anchors)) {
        if (!/^light_head/.test(n)) continue;
        const s = new THREE.SpotLight(color, 0, distance, angle, 0.6, 1.4);
        s.userData.max = intensity; s.castShadow = shadows;
        s.target.position.set(0, -0.6, 8);
        a.add(s, s.target); beams.push(s);
      }
      applyLights();
      return beams;
    },
    setPaint(hex) { all.filter((m) => m.name === 'paint').forEach((m) => m.color.set(hex)); },
  };
}

function wheelRadius(w) {
  const b = new THREE.Box3().setFromObject(w);
  return Math.max(0.05, (b.max.y - b.min.y) / 2);
}

const _q = new THREE.Quaternion(), _z = new THREE.Vector3(0, 0, 1);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

/** Minimal arcade car: throttle, brake/reverse, steer. No drift: velocity follows the heading.
 *  opts: maxSpeed (m/s), accel, brakeDecel, reverseSpeed, wheelbase, maxSteer (rad),
 *        groundY(x,z) -> y, canMove(x,z) -> bool (blocks movement, e.g. buildings or water). */
export class ArcadeCar {
  constructor(vehicle, opts = {}) {
    this.v = vehicle;
    this.o = Object.assign({ maxSpeed: 16, accel: 6.5, brakeDecel: 14, reverseSpeed: 5, drag: 0.35,
      wheelbase: 2.25, maxSteer: 0.6, steerRate: 3.2, groundY: () => 0, canMove: () => true, lean: 1 }, opts);
    this.speed = 0; this.steer = 0; this.heading = vehicle.root.rotation.y; this.enabled = true;
    this.lean = 0; this.pitch = 0;
  }
  get position() { return this.v.root.position; }
  /** input: { throttle 0..1, brake 0..1, steer -1..1 (positive = left) } */
  update(dt, input = {}) {
    dt = Math.min(dt, 0.05);
    const o = this.o, thr = this.enabled ? input.throttle || 0 : 0, brk = this.enabled ? input.brake || 0 : 0;
    const prev = this.speed;
    if (thr > 0) this.speed += (this.speed < 0 ? o.brakeDecel : o.accel * (1 - Math.max(0, this.speed) / o.maxSpeed)) * thr * dt;
    if (brk > 0) {
      if (this.speed > 0.2) this.speed = Math.max(0, this.speed - o.brakeDecel * brk * dt);
      else this.speed = Math.max(-o.reverseSpeed, this.speed - o.accel * 0.6 * brk * dt);
    }
    if (!thr && !brk) this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), (o.drag + Math.abs(this.speed) * 0.04) * dt * 3);
    // steering eases in, and tightens less at speed
    const target = clamp(this.enabled ? input.steer || 0 : 0, -1, 1) * o.maxSteer / (1 + Math.abs(this.speed) * 0.06);
    this.steer = damp(this.steer, target, o.steerRate, dt);
    this.heading += (this.speed / o.wheelbase) * Math.tan(this.steer) * dt;
    const r = this.v.root, nx = r.position.x + Math.sin(this.heading) * this.speed * dt,
      nz = r.position.z + Math.cos(this.heading) * this.speed * dt;
    if (o.canMove(nx, nz)) { r.position.x = nx; r.position.z = nz; } else this.speed *= -0.25;
    r.position.y = o.groundY(r.position.x, r.position.z);
    r.rotation.y = this.heading;
    // body lean + pitch on the chassis, wheel spin + steer
    const acc = (this.speed - prev) / Math.max(dt, 1e-4);
    this.lean = damp(this.lean, -this.steer * this.speed * 0.012 * o.lean, 6, dt);
    this.pitch = damp(this.pitch, clamp(-acc * 0.004, -0.04, 0.04) * o.lean, 5, dt);
    this.v.chassis.rotation.set(this.pitch, 0, this.lean);
    this.v.roll(this.speed * dt, this.steer);
    this.v.setBrake(brk > 0 && this.speed > 0.1 ? 1 : 0);
  }
  /** Place the car. */
  set(x, z, heading = 0) { this.v.root.position.set(x, this.o.groundY(x, z), z); this.heading = heading; this.speed = 0; this.v.root.rotation.y = heading; }
}

/** Ambient traffic: drive a vehicle around a closed loop of points at a steady speed.
 *  const bus = new PathFollower(van, [[x, z], ...], { speed: 6, groundY }); bus.update(dt); */
export class PathFollower {
  constructor(vehicle, points, { speed = 6, groundY = () => 0, closed = true, offset = 0 } = {}) {
    this.v = vehicle; this.speed = speed; this.groundY = groundY;
    this.curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], 0, p[1])), closed, 'centripetal');
    this.len = this.curve.getLength(); this.d = offset * this.len; this.prevHeading = null; this.paused = false;
  }
  update(dt) {
    const step = this.paused ? 0 : this.speed * Math.min(dt, 0.05);
    this.d = (this.d + step) % this.len;
    const u = this.d / this.len, p = this.curve.getPointAt(u), t = this.curve.getTangentAt(u);
    const r = this.v.root, h = Math.atan2(t.x, t.z);
    r.position.set(p.x, this.groundY(p.x, p.z), p.z);
    let dh = this.prevHeading === null ? 0 : h - this.prevHeading;
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    this.prevHeading = h; r.rotation.y = h;
    const steer = step > 0 ? clamp((dh / step) * 2.2, -0.6, 0.6) : 0;
    this.v.roll(step, steer);
    if (this.v.twoWheeler) this.v.model.rotation.z = damp(this.v.model.rotation.z, -steer * 0.35, 4, dt);
  }
}

/** Keyboard (WASD / arrows, Space = brake, E = action) + an on-screen joystick for touch. */
export class CarInput {
  constructor({ touch = null, keyboard = true } = {}) {
    this.keys = new Set(); this.joy = { x: 0, y: 0 }; this.actionQueued = false;
    this._kd = (e) => { if (/^(Arrow|Key[WASDE]|Space|Enter)/.test(e.code)) { if (e.code === 'KeyE' || e.code === 'Enter') this.actionQueued = true; this.keys.add(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); } };
    this._ku = (e) => this.keys.delete(e.code);
    if (keyboard) { addEventListener('keydown', this._kd); addEventListener('keyup', this._ku); addEventListener('blur', () => this.keys.clear()); }
    if (touch) this.joystick = createJoystick(touch, this.joy);
  }
  state() {
    const k = this.keys, up = k.has('KeyW') || k.has('ArrowUp'), dn = k.has('KeyS') || k.has('ArrowDown') || k.has('Space');
    const lf = k.has('KeyA') || k.has('ArrowLeft'), rt = k.has('KeyD') || k.has('ArrowRight');
    const jy = this.joy.y, jx = this.joy.x;
    return {
      throttle: Math.max(up ? 1 : 0, jy > 0.15 ? jy : 0),
      brake: Math.max(dn ? 1 : 0, jy < -0.15 ? -jy : 0),
      steer: clamp((lf ? 1 : 0) - (rt ? 1 : 0) - jx, -1, 1),
      // walking: x/z in -1..1, same keys
      moveX: clamp((rt ? 1 : 0) - (lf ? 1 : 0) + jx, -1, 1), moveY: clamp((up ? 1 : 0) - (dn ? 1 : 0) + jy, -1, 1),
    };
  }
  /** True once after E / Enter / the joystick's action button. */
  consumeAction() { const a = this.actionQueued; this.actionQueued = false; return a; }
  dispose() { removeEventListener('keydown', this._kd); removeEventListener('keyup', this._ku); this.joystick?.remove(); }
}

/** A thumb joystick (bottom-left) + an action button (bottom-right). Shown only on touch devices. */
export function createJoystick(container, out, { actionLabel = 'E' } = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:auto 0 0 0;height:0;pointer-events:none;z-index:5';
  const pad = document.createElement('div');
  pad.style.cssText = 'position:absolute;left:24px;bottom:24px;width:120px;height:120px;border-radius:50%;background:rgba(244,234,219,.18);border:1.5px solid rgba(244,234,219,.55);pointer-events:auto;touch-action:none;backdrop-filter:blur(4px)';
  const knob = document.createElement('div');
  knob.style.cssText = 'position:absolute;left:38px;top:38px;width:44px;height:44px;border-radius:50%;background:#f4eadb;box-shadow:0 2px 8px rgba(35,44,87,.35)';
  pad.appendChild(knob);
  const btn = document.createElement('button');
  btn.textContent = actionLabel;
  btn.style.cssText = 'position:absolute;right:28px;bottom:40px;width:64px;height:64px;border-radius:50%;border:1.5px solid rgba(244,234,219,.6);background:rgba(35,44,87,.45);color:#f4eadb;font:600 16px system-ui;pointer-events:auto;touch-action:none';
  wrap.append(pad, btn);
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  container.appendChild(wrap);
  const touchy = matchMedia('(pointer: coarse)').matches;
  wrap.style.display = touchy ? '' : 'none';
  let id = null;
  const move = (e) => {
    const r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / 50, dy = (e.clientY - cy) / 50; const l = Math.hypot(dx, dy);
    if (l > 1) { dx /= l; dy /= l; }
    out.x = dx; out.y = -dy; knob.style.transform = `translate(${dx * 38}px,${dy * 38}px)`;
  };
  pad.addEventListener('pointerdown', (e) => { id = e.pointerId; pad.setPointerCapture(id); move(e); });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
  const end = (e) => { if (e.pointerId !== id) return; id = null; out.x = 0; out.y = 0; knob.style.transform = ''; };
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); out.action = true; container.dispatchEvent(new CustomEvent('vehicle-action')); });
  wrap.show = (v) => { wrap.style.display = v ? '' : 'none'; };
  return wrap;
}

/** Smooth chase / cockpit camera. mode: 'chase' | 'cockpit'. */
export class ChaseCamera {
  constructor(camera, vehicle, { distance = 7.6, height = 2.5, mode = 'chase', cockpitFov = 62 } = {}) {
    Object.assign(this, { camera, vehicle, distance, height, mode, cockpitFov });
    this._pos = new THREE.Vector3(); this._look = new THREE.Vector3(); this._init = false;
  }
  update(dt) {
    const r = this.vehicle.root, cam = this.camera;
    r.updateMatrixWorld();
    if (this._fov0 === undefined) this._fov0 = cam.fov;
    const fov = this.mode === 'cockpit' ? this.cockpitFov : this._fov0;
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    if (this.mode === 'cockpit' && this.vehicle.anchors.seat_driver) {
      const eye = this.vehicle.anchors.seat_driver.getWorldPosition(this._pos);
      cam.position.copy(eye);
      this._look.set(0, 0.95, 12).applyMatrix4(r.matrixWorld);
      this._look.y = eye.y - 0.9;
      cam.lookAt(this._look);
      this._init = false;
      return;
    }
    const want = new THREE.Vector3(0, this.height, -this.distance).applyMatrix4(r.matrixWorld);
    const look = new THREE.Vector3(0, 1.0, 4.5).applyMatrix4(r.matrixWorld);
    if (!this._init) { this._pos.copy(want); this._look.copy(look); this._init = true; }
    this._pos.lerp(want, 1 - Math.exp(-4 * dt)); this._look.lerp(look, 1 - Math.exp(-8 * dt));
    cam.position.copy(this._pos); cam.lookAt(this._look);
  }
}
