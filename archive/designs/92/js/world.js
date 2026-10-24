// The world for "Enter world" (design 92): the shared Heure Bleue kit (town,
// props, landmarks, vehicles, townsfolk) laid out along a coast road, lit by a
// setting sun, with lights that switch on one by one as dusk falls.
//
//   const world = await createWorld({ canvas, tier, onProgress })
//   world.setElevation(-1.6)       // sun elevation in degrees
//   world.update(dt, focus)        // animation, traffic, people, lights
//   world.render()
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { loadKit, createTown, place } from '../../_shared/3d/architecture/town.js';
import { loadVehicle } from '../../_shared/3d/vehicles/vehicles.js';
import { Townsfolk, SPEED } from '../../_shared/3d/people/people.js';
import { createSky, SKY_U, rampAt } from './sky.js';
import { createScreen } from './screens.js';
import { ROAD, STOPS, LM_FRONT, START, SUN_AZ, TOWN, groundH, roadY, rowFront } from './layout.js';

const SHARED = new URL('../../_shared/3d/', import.meta.url).href;
const KIT_NAMES = ['paris_haussmann', 'paris_narrow', 'paris_pink', 'paris_powder', 'paris_rotunda',
  'med_cube_small', 'med_cube_stack', 'med_villa_tiled', 'med_house_gable', 'med_house_gable_mustard', 'med_tower_house',
  'church', 'cafe', 'hotel', 'fountain', 'belvedere', 'town_gate', 'wall_low', 'stairs', 'stairs_wide',
  'road_coast', 'terrace_block', 'headland', 'hill_backdrop', 'rocks_coast'];
const PROP_NAMES = ['lamp_riviera', 'lamp_paris', 'palm', 'palm_tall', 'cypress', 'cypress_small', 'olive', 'bench',
  'cafe_set', 'parasol', 'parasol_mustard', 'kiosk', 'string_lights', 'bougainvillea_bush', 'bougainvillea_spill',
  'planter_pot', 'planter_versailles', 'poster_column', 'lm_mcpemails', 'lm_funlibs', 'lm_toolrails', 'lm_harbor'];

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp1 = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Palette textures are flat colour patches, so a vertex's colour is the texel under its UV.
const texCache = new Map();
function texSampler(tex) {
  const img = tex.image;
  if (texCache.has(img)) return texCache.get(img);
  const w = img.width, h = img.height;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const d = cx.getImageData(0, 0, w, h).data;
  const f = (u, v) => {
    const x = Math.min(w - 1, Math.floor((((u % 1) + 1) % 1) * w)), y = Math.min(h - 1, Math.floor((((v % 1) + 1) % 1) * h));
    const i = (y * w + x) * 4; return [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255];
  };
  texCache.set(img, f); return f;
}

/** Bake meshes into one: parts = [{ g, m, mat }] with m the matrix into the target space.
 *  With vc, each part's material colour (and palette texel) is baked into vertex colours,
 *  so meshes of many materials become a single draw call. */
function bake(parts, material, { vc = false } = {}) {
  let nv = 0, ni = 0;
  const hasUv = !vc && parts.every(({ g }) => g.attributes.uv);
  for (const { g } of parts) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = hasUv ? new Float32Array(nv * 2) : null, col = vc ? new Float32Array(nv * 3) : null;
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3(), cc = new THREE.Color();
  let ov = 0, oi = 0;
  for (const { g, m, mat } of parts) {
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, Cc = g.attributes.color;
    const samp = vc && mat.map && U && mat.map.image ? texSampler(mat.map) : null;
    nm.getNormalMatrix(m);
    for (let i = 0; i < P.count; i++) {
      const k = ov + i;
      v.fromBufferAttribute(P, i).applyMatrix4(m); pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = v.z;
      if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[k * 3] = v.x; nor[k * 3 + 1] = v.y; nor[k * 3 + 2] = v.z; }
      if (uv) { uv[k * 2] = U.getX(i); uv[k * 2 + 1] = U.getY(i); }
      if (col) {
        const base = TINT[mat.name] || mat.color;
        let r = base.r, gg = base.g, bb = base.b;
        if (samp) { const t = samp(U.getX(i), U.getY(i)); cc.setRGB(t[0], t[1], t[2], THREE.SRGBColorSpace); r *= cc.r; gg *= cc.g; bb *= cc.b; }
        if (Cc && mat.vertexColors) { r *= Cc.getX(i); gg *= Cc.getY(i); bb *= Cc.getZ(i); }
        col[k * 3] = r; col[k * 3 + 1] = gg; col[k * 3 + 2] = bb;
      }
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.getX(i) + ov;
    else for (let i = 0; i < P.count; i++) idx[oi + i] = ov + i;
    ov += P.count; oi += g.index ? g.index.count : P.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere(); geo.computeBoundingBox();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

// Baked colour overrides. The kit's asphalt (#5b6080) reads as a blue carpet under the
// dusk sky once ACES and the blue hemisphere light push it; a greyer slate keeps the dusk feel.
const TINT = { asphalt: new THREE.Color('#55586c') };

// One shared vertex-colour material per shading style and side.
const VC = new Map();
function vcMaterial(flat, side) {
  const k = (flat ? 'f' : 's') + side;
  if (!VC.has(k)) VC.set(k, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: flat, roughness: 0.88, metalness: 0, side, name: 'vc_' + k }));
  return VC.get(k);
}

/** Merge the static, non-emissive meshes under root into one vertex-coloured mesh per chunk.
 *  Chunks keep frustum culling useful (the shadow pass only draws what is near). */
function mergeStaticChunks(root, { chunk = () => '', shadow = () => true } = {}) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const buckets = new Map(), drop = [], c = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || Array.isArray(o.material) || o.userData.noMerge) return;
    const mat = o.material, n = mat.name || '';
    if (n.startsWith('emissive_') || n === 'screen' || mat.transparent || !mat.isMeshStandardMaterial) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    c.copy(o.geometry.boundingSphere.center).applyMatrix4(o.matrixWorld);
    const ck = chunk(c);
    const key = (mat.flatShading ? 'f' : 's') + mat.side + '|' + ck;
    if (!buckets.has(key)) buckets.set(key, { material: vcMaterial(mat.flatShading, mat.side), parts: [], ck });
    buckets.get(key).parts.push({ g: o.geometry, m: new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), mat });
    drop.push(o);
  });
  for (const { material, parts, ck } of buckets.values()) {
    const mesh = bake(parts, material, { vc: true });
    mesh.castShadow = shadow(ck);
    root.add(mesh);
  }
  for (const o of drop) o.removeFromParent();
}
const chunkX = (w = 70) => (c) => Math.floor((c.x + 350) / w) + (c.z < -26 ? 'h' : '');

/** Merge a vehicle's static body parts into one vertex-coloured mesh (doors, wheels, the
 *  steering wheel, glass and lights stay as they are). */
function mergeVehicle(v, shadows = true) {
  const ch = v.chassis;
  v.root.updateMatrixWorld(true);
  const inv = ch.matrixWorld.clone().invert();
  const skip = new Set();
  for (const n of ['door_l', 'door_r', 'steering_wheel']) v.model.getObjectByName(n)?.traverse((x) => skip.add(x));
  const parts = [], drop = [];
  let flat = false;
  ch.traverse((o) => {
    if (!o.isMesh || skip.has(o) || Array.isArray(o.material)) return;
    const m = o.material;
    if (m.name.startsWith('emissive_') || m.transparent || !m.isMeshStandardMaterial) return;
    flat = flat || m.flatShading;
    parts.push({ g: o.geometry, m: new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), mat: m, shadow: m.name === 'shadow' });
    drop.push(o);
  });
  const body = parts.filter((p) => !p.shadow), blob = parts.filter((p) => p.shadow);
  if (body.length) { const m = bake(body, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.08, flatShading: flat, side: THREE.DoubleSide }), { vc: true }); m.castShadow = shadows; ch.add(m); }
  // each wheel becomes one mesh too (it spins as a unit)
  for (const w of Object.values(v.wheels)) {
    w.updateMatrixWorld(true);
    const wi = w.matrixWorld.clone().invert(), wp = [], wd = [];
    w.traverse((o) => { if (o.isMesh && !Array.isArray(o.material) && !o.material.transparent && !o.material.name.startsWith('emissive_')) { wp.push({ g: o.geometry, m: new THREE.Matrix4().multiplyMatrices(wi, o.matrixWorld), mat: o.material }); wd.push(o); } });
    if (wp.length > 1) { const m = bake(wp, vcMaterial(false, THREE.DoubleSide), { vc: true }); m.castShadow = shadows; w.add(m); for (const o of wd) o.removeFromParent(); }
  }
  if (blob.length) { const m = bake(blob, blob[0].mat); m.castShadow = false; ch.add(m); }
  for (const o of drop) o.removeFromParent();
  if (!shadows) v.model.traverse((o) => { if (o.isMesh) o.castShadow = false; });
}

// ---------------------------------------------------------------- light switches
// Every window group, sign and lamp is a switch with its own threshold on the
// night curve. Switching on is a quick ramp, sometimes with a fluorescent stutter;
// late at night a few switch off again and others come on, so the town keeps living.
// The lights wave: a dark ring runs out from you (every light inside it off), and the
// town relights behind it. Its speed and width are shared by windows, signs and lamps.
const RIPPLE_SPEED = 42, RIPPLE_DARK = 0.95;
const rippleDelay = (dx, dz) => 0.15 + Math.hypot(dx, dz) / RIPPLE_SPEED;
/** 0 while the ring passes over (dx, dz), 1 after it, null before it arrives. */
function rippleMask(rp, now, x, z) {
  if (!rp) return null;
  const k = now - rp.t - rippleDelay(x - rp.x, z - rp.z);
  if (k < 0 || k > 9) return null;
  if (k < RIPPLE_DARK) return 0;
  const j = k - RIPPLE_DARK; // relight with a little stutter
  return j < 0.05 ? 0.8 : j < 0.1 ? 0.15 : j < 0.18 ? 1 : 1;
}

class Switchboard {
  constructor() { this.list = []; this.clock = 0; this.onClick = null; }
  add(mat, { thr = 0.5, on = 1.25, stutter = false, live = true, pos = null } = {}) {
    const s = { mat, thr, on, stutter, live, pos, state: 0, level: 0, t0: -9, forced: null, nextFlip: 0 };
    mat.emissiveIntensity = 0;
    this.list.push(s); return s;
  }
  update(dt, night, focus) {
    this.clock += dt;
    const t = this.clock;
    if (this.ripple && t > this.ripple.t + 16) this.ripple = null;
    for (const s of this.list) {
      let want = s.forced ?? (night >= s.thr + (s.state ? -0.015 : 0.015) ? 1 : 0);
      // a ripple: every light goes dark and comes back on, in a wave out from one point
      if (this.ripple && s.pos) {
        const a = this.ripple.t + rippleDelay(s.pos.x - this.ripple.x, s.pos.z - this.ripple.z);
        if (t > a && t < a + RIPPLE_DARK) want = 0; else if (t >= a + RIPPLE_DARK && t < a + 9) want = 1;
      }
      // late-night life: lit windows sometimes go dark for a while, then come back
      if (s.live && s.forced == null && want && night > 0.82) {
        if (!s.nextFlip) s.nextFlip = t + 6 + Math.random() * 40;
        if (t > s.nextFlip) { s.dark = !s.dark; s.nextFlip = t + (s.dark ? 8 + Math.random() * 20 : 15 + Math.random() * 50); }
        if (s.dark) want = 0;
      } else if (!want) { s.dark = false; s.nextFlip = 0; }
      if (want !== s.state) {
        s.state = want; s.t0 = t;
        if (this.onClick && s.pos && focus) this.onClick(s, focus.distanceTo(s.pos), want);
      }
      const k = t - s.t0;
      let lv;
      if (s.state) {
        if (s.stutter && k < 0.45) lv = k < 0.06 ? 0.9 : k < 0.12 ? 0.1 : k < 0.2 ? 0.75 : k < 0.27 ? 0.25 : 1;
        else lv = Math.min(1, k / 0.09);
      } else lv = Math.max(0, 1 - k / 0.14);
      if (lv !== s.level) { s.level = lv; s.mat.emissiveIntensity = lv * s.on; }
    }
  }
}

export async function createWorld({ canvas, tier = 'high', onProgress = () => {}, params = new URLSearchParams() }) {
  const hi = tier === 'high', lo = tier === 'low';
  // ---------------------------------------------------------------- renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  const baseDpr = Math.min(window.devicePixelRatio || 1, hi ? 1.6 : lo ? 1 : 1.25);
  renderer.setPixelRatio(baseDpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const tm = params.get('tm') || 'aces';
  renderer.toneMapping = tm === 'none' ? THREE.NoToneMapping : tm === 'agx' ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = +(params.get('exp') || 1.18);
  renderer.shadowMap.enabled = !lo;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 16 / 9, 0.2, 6500);
  scene.fog = new THREE.Fog(0xffffff, 220, 2600);

  // ---------------------------------------------------------------- loading
  let total = 0, done = 0;
  const track = (p, w = 1) => { total += w; p.then(() => { done += w; onProgress(done / total); }); return p; };
  const gl = new GLTFLoader(); gl.setMeshoptDecoder(MeshoptDecoder);
  const loadProp = (n) => gl.loadAsync(SHARED + 'props/' + n + '.glb').then((g) => {
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      for (const m of [].concat(o.material)) if (m.name.startsWith('emissive_')) { m.userData.emissiveOn = 1; m.emissiveIntensity = 0; }
    });
    return [n, g.scene];
  });
  const folk = new Townsfolk({ base: SHARED + 'people/' });
  const kitP = Promise.all(KIT_NAMES.map((n) => track(loadKit({ THREE, GLTFLoader, MeshoptDecoder, base: SHARED + 'architecture/', names: [n] }), 1)))
    .then((parts) => Object.assign({}, ...parts));
  const propsP = Promise.all(PROP_NAMES.map((n) => track(loadProp(n), 0.8))).then((e) => Object.fromEntries(e));
  const carP = track(loadVehicle('hero'), 2);
  const trafficP = Promise.all(['citycar', 'van', 'scooter', 'heroMustard', 'citycar'].map((n, i) =>
    track(loadVehicle(n, i === 4 ? { paint: '#a9c6e0' } : {}), 1)));
  track(folk.library(), 3); track(folk.props(), 0.5);
  const [kit, props, car, traffic] = await Promise.all([kitP, propsP, carP, trafficP]);

  // ---------------------------------------------------------------- sky, sea, light
  const { sky, sea, seaU } = createSky();
  scene.add(sky, sea);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = !lo;
  sun.shadow.mapSize.set(hi ? 2048 : 1024, hi ? 2048 : 1024);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
  scene.add(hemi, sun, sun.target);
  // lamplight around you: one warm light that follows the focus once the lamps are on,
  // standing in for the street lamps nearest the car or the player
  const near = new THREE.PointLight('#ffc27a', 0, 22, 1.4);
  scene.add(near);

  // ---------------------------------------------------------------- town
  const town = createTown({ THREE, kit, seed: TOWN.seed, rows: TOWN.rows, halfWidth: TOWN.halfWidth, merge: false, ground: false });
  scene.add(town.group);
  // clear room in the first row for the two landmarks that stand in town
  const solids = []; // walking obstacles: { x0, x1, z0, z1 }
  const box = new THREE.Box3();
  for (const st of STOPS.filter((s) => s.inTown)) {
    for (const b of town.buildings) {
      if (b.row !== 0 || !b.object.parent) continue;
      box.setFromObject(b.object);
      if (box.max.x > st.x - 6.2 && box.min.x < st.x + 6.2) { b.object.removeFromParent(); b.removed = true; }
    }
  }
  town.group.updateMatrixWorld(true);
  for (const b of town.buildings) {
    if (b.removed || b.row !== 0) continue;
    box.setFromObject(b.object);
    if (box.max.z > 0) solids.push({ x0: box.min.x + 0.3, x1: box.max.x - 0.3, z0: -40, z1: Math.min(box.max.z, 8.7) });
  }
  const gate = town.buildings.find((b) => b.name === 'town_gate');
  mergeStaticChunks(town.group, { chunk: chunkX(60) });

  // extend the coast road to the tunnel portals
  const extra = new THREE.Group(); extra.name = 'road-extra';
  for (let x = -285; x < -90; x += 10) { const { object } = place(kit, 'road_coast'); object.position.set(x + 5, 0, ROAD.z); object.rotation.y = -Math.PI / 2; extra.add(object); }
  for (let x = 90; x < 285; x += 10) { const { object } = place(kit, 'road_coast'); object.position.set(x + 5, 0, ROAD.z); object.rotation.y = -Math.PI / 2; extra.add(object); }
  scene.add(extra); mergeStaticChunks(extra, { chunk: chunkX(100) });

  // ---------------------------------------------------------------- outskirts: houses thin out along the coast
  const outskirts = new THREE.Group(); outskirts.name = 'outskirts';
  const outHouses = [];
  {
    const Rh = rng(7);
    const MED = ['med_cube_small', 'med_house_gable', 'med_villa_tiled', 'med_house_gable_mustard', 'med_cube_stack', 'med_tower_house'];
    const addHouse = (name, x, z, ry) => {
      const { object, emissive } = place(kit, name, { ownLights: true });
      object.position.set(x, groundH(x, z), z); object.rotation.y = ry;
      outskirts.add(object);
      outHouses.push({ object, emissive, threshold: 0.1 + Rh() * 0.8 });
      return object;
    };
    // a loose row facing the road
    for (let x = -236; x <= 236; x += 15 + Rh() * 10) {
      if (Math.abs(x) < 78 || STOPS.some((s) => Math.abs(s.x - x) < 21) || Math.abs(x) > 232) continue;
      const o = addHouse(MED[Math.floor(Rh() * MED.length)], x, -1.5 - Rh() * 3, (Rh() - 0.5) * 0.12);
      o.updateMatrixWorld(true); box.setFromObject(o);
      solids.push({ x0: box.min.x, x1: box.max.x, z0: box.min.z, z1: box.max.z });
    }
    // scattered up the hills
    for (let i = 0; i < (tier === 'low' ? 14 : 34); i++) {
      const x = (Rh() < 0.5 ? -1 : 1) * (80 + Rh() * 150), z = -24 - Rh() * 70;
      addHouse(MED[Math.floor(Rh() * MED.length)], x, z, (Rh() - 0.5) * 0.5);
    }
  }
  scene.add(outskirts);
  // (merged below, after the emissive windows are gathered)

  // ---------------------------------------------------------------- ground
  {
    const W = 340, zB = -230, zF = 64, cell = lo ? 6 : 4;
    const nx = Math.round(2 * W / cell), nz = Math.round((zF - zB) / cell);
    const pos = [], col = [];
    const cG = ['#9aa274', '#8e9a6c', '#a7ab7c', '#97a070'].map((h) => new THREE.Color(h));
    const cGd = new THREE.Color('#86915f'), cE = new THREE.Color('#d9b8a0'), cR = new THREE.Color('#c99f8b'), cS = new THREE.Color('#e8d5bf');
    const hsh = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const vtx = (i, j) => { const x = -W + i * cell, z = zB + j * cell; return [x, groundH(x, z) + (hsh(i, j) - 0.5) * 0.35 * smooth(-12, -30, z), z]; };
    const n = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const p00 = vtx(i, j), p10 = vtx(i + 1, j), p01 = vtx(i, j + 1), p11 = vtx(i + 1, j + 1);
      for (const tri of [[p00, p01, p11], [p00, p11, p10]]) {
        a.fromArray(tri[1]).sub(b.fromArray(tri[0])); n.fromArray(tri[2]).sub(b); n.cross(a).normalize(); if (n.y < 0) n.negate();
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cz = (tri[0][2] + tri[1][2] + tri[2][2]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        const c = cy < -0.7 ? cR : n.y < 0.5 ? cE : (cz > 4 && cz < 9.5 && Math.abs(cx) > 66) ? cS : n.y < 0.9 ? cGd : cG[Math.floor(hsh(Math.round(cx / 9), Math.round(cz / 9)) * 4)];
        for (const p of tri) { pos.push(...p); col.push(c.r, c.g, c.b); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
    ground.receiveShadow = true; ground.name = 'ground';
    scene.add(ground);
  }

  // ---------------------------------------------------------------- tunnel portals
  const stone = new THREE.MeshStandardMaterial({ color: '#e3cdb0', roughness: 0.95, flatShading: true });
  const stoneDark = new THREE.MeshStandardMaterial({ color: '#b99c86', roughness: 1, flatShading: true });
  const dark = new THREE.MeshBasicMaterial({ color: '#07081a', side: THREE.BackSide, fog: false });
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    const X = s * ROAD.portalX;
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    add(new THREE.BoxGeometry(2.4, 24, 9), stone, X, 6, ROAD.z - 10.3);
    add(new THREE.BoxGeometry(2.4, 24, 9), stone, X, 6, ROAD.z + 10.3);
    add(new THREE.BoxGeometry(2.4, 14, 12), stone, X, 13.5, ROAD.z);
    const arch = add(new THREE.CylinderGeometry(6.4, 6.4, 2.6, 24, 1, true, 0, Math.PI), stoneDark, X, 6.5, ROAD.z);
    arch.rotation.set(Math.PI / 2, 0, Math.PI / 2); arch.material = stoneDark;
    add(new THREE.BoxGeometry(2.6, 0.7, 14), stoneDark, X - s * 0.1, 12.8, ROAD.z);
    const tube = add(new THREE.BoxGeometry(40, 7.2, 11.6), dark, X + s * 20.6, 3.4, ROAD.z);
    tube.castShadow = false;
    scene.add(g);
  }

  // ---------------------------------------------------------------- props and landmarks
  const R = rng(92);
  const decor = new THREE.Group(); decor.name = 'decor';
  const sw = new Switchboard();
  const lampHeads = [];  // { mat, pos, sw }
  const pools = [];      // light pools under lamps
  const put = (name, x, z, ry = 0, s = 1, y = null) => {
    const o = props[name].clone(true);
    o.position.set(x, y ?? groundH(x, z), z); o.rotation.y = ry; o.scale.setScalar(s);
    decor.add(o); return o;
  };
  const ownEmissive = (o) => {
    const mats = {};
    o.traverse((m) => {
      if (!m.isMesh) return;
      m.material = [].concat(m.material).map((mm) => {
        if (!mm.name.startsWith('emissive_')) return mm;
        if (!mats[mm.name]) { mats[mm.name] = mm.clone(); mats[mm.name].emissiveIntensity = 0; }
        return mats[mm.name];
      });
      if (m.material.length === 1) m.material = m.material[0];
    });
    return mats;
  };
  const headPos = (o) => { const p = new THREE.Vector3(); let found = false; o.updateMatrixWorld(true);
    o.traverse((m) => { if (!found && m.isMesh && [].concat(m.material)[0].name.startsWith('emissive_')) { m.geometry.computeBoundingBox(); m.geometry.boundingBox.getCenter(p); m.localToWorld(p); found = true; } });
    return p; };
  const addLamp = (name, x, z, ry) => {
    const o = put(name, x, z, ry, 1, ROAD.y);
    const mats = ownEmissive(o);
    const pos = headPos(o);
    for (const m of Object.values(mats)) lampHeads.push({ mat: m, pos, x });
    pools.push({ x: pos.x, z: pos.z, y: 0.04, r: name === 'lamp_paris' ? 4.6 : 5.6 });
    solids.push({ x0: x - 0.25, x1: x + 0.25, z0: z - 0.25, z1: z + 0.25 });
    return o;
  };
  // the coast road: swan-neck lamps along the sea wall, Paris candelabra on the town side
  for (let x = -240; x <= 240; x += 22) addLamp('lamp_riviera', x, ROAD.z + 4.55, Math.PI / 2);
  for (let x = -229; x <= 240; x += 22) {
    if (STOPS.some((s) => Math.abs(s.x - x) < 5.5)) continue; // keep the doors clear
    if (Math.abs(x) < 64 || STOPS.some((s) => Math.abs(s.x - x) < 26)) addLamp('lamp_paris', x, ROAD.z - 4.35, 0);
  }
  // palms on the town side of the road outside town, cypresses and olives on the hills
  for (let x = -236; x <= 236; x += 14 + R() * 6) {
    if (Math.abs(x) < 70 || STOPS.some((s) => Math.abs(s.x - x) < 15)) continue;
    put(R() < 0.55 ? 'palm_tall' : 'palm', x, ROAD.z - 6.4 - R() * 2.5, R() * 6.28, 0.9 + R() * 0.25);
  }
  for (let i = 0; i < (lo ? 50 : 120); i++) {
    const x = (R() < 0.5 ? -1 : 1) * (72 + R() * 165), z = -16 - R() * 110;
    const pick = R();
    put(pick < 0.45 ? 'cypress' : pick < 0.7 ? 'cypress_small' : pick < 0.9 ? 'olive' : 'palm_tall', x, z, R() * 6.28, 0.8 + R() * 0.5);
  }
  for (const gp of town.gaps) {
    if (gp.row === 0 && STOPS.some((s) => s.inTown && Math.abs(s.x - gp.x) < 9)) continue;
    put(R() < 0.5 ? 'cypress_small' : R() < 0.5 ? 'olive' : 'palm', gp.x, gp.z, R() * 6.28, 0.8 + R() * 0.3, gp.y);
  }
  // benches facing the sea at the road's quiet ends
  for (const x of [-200, -164, -86, 88, 160, 204]) {
    put('bench', x, ROAD.z - 5.6, 0, 1, ROAD.y);
    solids.push({ x0: x - 1, x1: x + 1, z0: ROAD.z - 6.1, z1: ROAD.z - 5.1 });
  }

  // landmarks
  const stops = [];
  for (const st of STOPS) {
    const o = props[st.lm].clone(true);
    o.updateMatrixWorld(true);
    box.setFromObject(o);
    o.position.set(st.x, ROAD.y, LM_FRONT - box.max.z);
    decor.add(o);
    const mats = ownEmissive(o);
    o.updateMatrixWorld(true);
    box.setFromObject(o);
    solids.push({ x0: box.min.x + 0.2, x1: box.max.x - 0.2, z0: box.min.z, z1: box.max.z - (st.id === 'harbor' ? 1.4 : 0.5) });
    const screenMesh = o.getObjectByName('screen');
    const screen = createScreen(st.id);
    if (screenMesh) {
      screenMesh.material = new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false, fog: false });
      screenMesh.userData.noMerge = true;
    }
    const swi = Object.entries(mats).map(([name, m]) => sw.add(m, {
      thr: name.includes('sign') || name.includes('marquee') ? 0.06 + R() * 0.08 : 0.12 + R() * 0.4,
      on: name.includes('sign') ? 0.5 : name.includes('lamp') ? 1.3 : name.includes('marquee') || name.includes('arcade') ? 0.9 : 0.95,
      stutter: name.includes('marquee') || name.includes('arcade') || R() < 0.3, live: false,
      pos: new THREE.Vector3(st.x, 4, LM_FRONT),
    }));
    // forecourt: paving outside town, lamps and a bench either side of the door
    if (!st.inTown) {
      const pave = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 11), new THREE.MeshStandardMaterial({ color: '#eadbc6', roughness: 1 }));
      pave.position.set(st.x, -0.12, LM_FRONT + 0.6); pave.receiveShadow = true; scene.add(pave);
    }
    put('planter_versailles', st.x - 5.6, LM_FRONT + 1.2, 0, 1, ROAD.y);
    put('planter_versailles', st.x + 5.6, LM_FRONT + 1.2, 0, 1, ROAD.y);
    put('bougainvillea_bush', st.x + (st.id === 'harbor' ? -7.2 : 6.8), LM_FRONT - 1.2, 0, 1.1, ROAD.y);
    solids.push({ x0: st.x - 6.2, x1: st.x - 5, z0: LM_FRONT + 0.6, z1: LM_FRONT + 1.8 }, { x0: st.x + 5, x1: st.x + 6.2, z0: LM_FRONT + 0.6, z1: LM_FRONT + 1.8 });
    const door = new THREE.Vector3(st.x, 0, LM_FRONT + 1.5);
    const look = screenMesh ? screenMesh.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(st.x, 3, LM_FRONT);
    stops.push({ ...st, object: o, door, look, screen, switches: swi, bay: { x: st.x, z: ROAD.laneE } });
  }
  // bays on the road and a soft column of light over each stop, so you can find them from afar
  const markerTime = { value: 0 };
  for (const st of stops) {
    const col = new THREE.Color(st.tint);
    const bayMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false,
      uniforms: { uTime: markerTime, uCol: { value: col }, uLevel: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: `uniform float uTime, uLevel; uniform vec3 uCol; varying vec2 vUv;
        float box(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
        void main(){
          vec2 p = (vUv - .5) * vec2(7.4, 3.);
          float d = box(p, vec2(3.4, 1.3), .45);
          float edge = smoothstep(.09, .0, abs(d)) * step(.5, fract((atan(p.y, p.x) / 6.2832) * 28. - uTime * .35));
          float inner = smoothstep(.0, -1.2, d) * .22;
          float chev = smoothstep(.07, 0., abs(fract(p.x * .45 - uTime * .6) - .5 - abs(p.y) * .25) - .05) * step(d, -.25) * .45;
          float a = (edge + inner + chev) * uLevel * (.75 + .25 * sin(uTime * 2.4));
          gl_FragColor = vec4(uCol * a * 1.05, 1.);
        }`,
    });
    const bay = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3), bayMat);
    bay.rotation.x = -Math.PI / 2; bay.position.set(st.bay.x, ROAD.y + 0.05, st.bay.z); bay.renderOrder = 3;
    scene.add(bay);
    const beamMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, toneMapped: false,
      uniforms: { uTime: markerTime, uCol: { value: col }, uLevel: { value: 1 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN, vV; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }',
      fragmentShader: `uniform float uTime, uLevel; uniform vec3 uCol; varying vec2 vUv; varying vec3 vN, vV;
        void main(){ float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 1.5);
          float a = (1. - f) * pow(1. - vUv.y, 1.8) * smoothstep(0., .12, vUv.y) * (.6 + .4 * sin(vUv.y * 40. - uTime * 3.)) * uLevel * .22;
          gl_FragColor = vec4(uCol * a, 1.); }`,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 46, 20, 1, true), beamMat);
    beam.position.set(st.bay.x, 23, st.bay.z); beam.renderOrder = 4;
    scene.add(beam);
    st.marker = { set(bayLevel, beamLevel) { bayMat.uniforms.uLevel.value = bayLevel; beamMat.uniforms.uLevel.value = beamLevel; beam.visible = beamLevel > 0.01; } };
  }

  // a little life around the stops
  put('kiosk', STOPS[0].x - 13, LM_FRONT - 1, 0.25, 1, ROAD.y);
  solids.push({ x0: STOPS[0].x - 15, x1: STOPS[0].x - 11, z0: LM_FRONT - 3, z1: LM_FRONT + 1 });
  put('poster_column', STOPS[3].x + 9, LM_FRONT + 0.5, 0, 1, ROAD.y);
  solids.push({ x0: STOPS[3].x + 8.3, x1: STOPS[3].x + 9.7, z0: LM_FRONT - 0.2, z1: LM_FRONT + 1.2 });
  for (const [dx, dz, p] of [[-9, 1.4, 'parasol'], [9.5, 1.2, 'parasol_mustard']]) {
    put('cafe_set', STOPS[1].x + dx, LM_FRONT + dz, 0, 1, ROAD.y);
    put(p, STOPS[1].x + dx, LM_FRONT + dz, 0, 1, ROAD.y);
    solids.push({ x0: STOPS[1].x + dx - 1, x1: STOPS[1].x + dx + 1, z0: LM_FRONT + dz - 0.6, z1: LM_FRONT + dz + 0.6 });
  }
  // string lights across the café terrace in town
  const stringLights = put('string_lights', -14, 8.3, 0, 1.4, ROAD.y);
  for (const [name, m] of Object.entries(ownEmissive(stringLights))) sw.add(m, { thr: 0.05, on: 1.6, stutter: true, live: false, pos: new THREE.Vector3(-14, 3, 8) });

  scene.add(decor);
  mergeStaticChunks(decor, { chunk: chunkX(80), shadow: (ck) => !String(ck).endsWith('h') });

  // light pools: soft additive discs under every lamp, one instanced draw
  const poolMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: 'attribute float aLevel; varying vec2 vUv; varying float vL; void main(){ vUv = uv; vL = aLevel; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position,1.); }',
    fragmentShader: 'varying vec2 vUv; varying float vL; void main(){ float d = length(vUv - .5) * 2.; float a = pow(max(0., 1. - d), 2.2); gl_FragColor = vec4(vec3(1., .66, .34) * a * vL * .55, 1.); }',
  });
  const poolGeo = new THREE.PlaneGeometry(1, 1); poolGeo.rotateX(-Math.PI / 2);
  const poolLevel = new THREE.InstancedBufferAttribute(new Float32Array(pools.length), 1);
  poolGeo.setAttribute('aLevel', poolLevel);
  const poolMesh = new THREE.InstancedMesh(poolGeo, poolMat, pools.length);
  { const dm = new THREE.Object3D(); pools.forEach((p, i) => { dm.position.set(p.x, p.y, p.z); dm.scale.set(p.r * 2, 1, p.r * 2); dm.updateMatrix(); poolMesh.setMatrixAt(i, dm.matrix); }); }
  poolMesh.frustumCulled = false; poolMesh.renderOrder = 2;
  scene.add(poolMesh);

  // Town and outskirts windows: every emissive mesh gets a threshold on the night curve, then
  // meshes with the same material and (quantised) threshold merge into one switch. The town
  // still lights up window group by window group, at a fraction of the draw calls.
  {
    const buckets = new Map();
    const gather = (obj, threshold, inv) => {
      obj.updateMatrixWorld(true);
      const found = [];
      obj.traverse((o) => { if (o.isMesh && !Array.isArray(o.material) && o.material.name.startsWith('emissive_')) found.push(o); });
      for (const o of found) {
        const name = o.material.name, gi = /window_(\d)/.exec(name);
        const thr = gi ? 0.04 + threshold * 0.55 + (+gi[1] - 1) * 0.11 + R() * 0.05 : 0.04 + R() * 0.12;
        const q = Math.round(thr * 20);
        const key = name + '|' + q + '|' + Math.floor(obj.position.x / 60); // by area too, so a ripple reads as a wave
        if (!buckets.has(key)) buckets.set(key, { material: o.material.clone(), parts: [], q, live: !!gi, x: 0, z: 0, n: 0 });
        const bk = buckets.get(key);
        bk.parts.push({ g: o.geometry, m: o.matrixWorld.clone() });
        bk.x += obj.position.x; bk.z += obj.position.z; bk.n++;
        o.removeFromParent();
      }
    };
    for (const b of town.buildings) if (!b.removed) gather(b.object, b.threshold);
    for (const h of outHouses) gather(h.object, h.threshold);
    for (const bk of buckets.values()) {
      const mesh = bake(bk.parts, bk.material);
      mesh.castShadow = false;
      scene.add(mesh);
      sw.add(bk.material, { thr: bk.q / 20, on: bk.live ? 1.2 : 1.05, stutter: R() < 0.2, live: bk.live, pos: new THREE.Vector3(bk.x / bk.n, 5, bk.z / bk.n) });
    }
  }
  mergeStaticChunks(outskirts, { chunk: chunkX(80), shadow: (ck) => !String(ck).endsWith('h') });

  // ---------------------------------------------------------------- the hero car and the player
  scene.add(car.root);
  mergeVehicle(car, !lo);
  for (const v of traffic) mergeVehicle(v, false);
  car.root.position.set(START.x, ROAD.y, START.z); car.root.rotation.y = START.heading;
  if (hi) car.addBeams({ intensity: 40, distance: 34, angle: 0.48 });
  const player = await folk.spawn('player');
  scene.add(player.object);

  // ---------------------------------------------------------------- traffic
  // Plain lane-following with a lateral offset for overtaking a parked hero car.
  // The two tunnels hide the turnaround.
  const cars = traffic.map((v, i) => {
    scene.add(v.root);
    const dir = i % 2 ? -1 : 1;
    return { v, dir, x: [-90, -150, 60, 120, 185][i], speed: [9, 7, 8.5, 10, 8][i], v0: [9, 7, 8.5, 10, 8][i], off: 0, steer: 0, len: v === traffic[1] ? 4.6 : 3.8 };
  });
  // a cyclist rides the promenade side of the eastbound lane
  const bike = await folk.spawn('bicycle'); const cyclist = await folk.spawn('cyclist');
  cyclist.mount(bike); scene.add(bike.object);
  const bikeT = { x: -40, dir: 1, speed: SPEED.cycle };

  // ---------------------------------------------------------------- townsfolk
  const walkers = [];
  const actorAt = async (name, x, z, ry, clip, prop = null, y = null) => {
    const a = await folk.spawn(name);
    a.object.position.set(x, y ?? roadY(x, z), z); a.object.rotation.y = ry;
    if (prop) await a.attach(prop);
    a.play(clip, 0); if (a.current) a.current.time = R() * 3;
    scene.add(a.object); return a;
  };
  const walker = async (name, clip, path, { prop = null, speed = SPEED[clip] || 1.2, pause = 1.5, start = 0 } = {}) => {
    const a = await actorAt(name, path[0][0], path[0][1], 0, clip, prop);
    walkers.push({ a, clip, path, speed, pause, seg: 0, u: start, dir: 1, wait: 0 });
    return a;
  };
  const seaW = ROAD.walkSea, land = ROAD.walkLand;
  const crowd = [
    walker('stroller_dress', 'walk', [[-160, seaW], [150, seaW]], { start: 0.38 }),
    walker('stroller_linen', 'walk', [[-158.9, seaW - 0.05], [151.1, seaW - 0.05]], { start: 0.38 }),
    walker('jogger', 'jog', [[-236, seaW + 0.1], [236, seaW + 0.1]], { start: 0.15, pause: 0.6 }),
    walker('older_woman', 'walk_formal', [[40, seaW], [110, seaW]], { start: 0.5 }),
    walker('waiter', 'walk_carry', [[-21, 8.1], [-8, 8.1]], { prop: 'tray', pause: 2.5 }),
    walker('dog_walker', 'walk', [[-104, land], [-44, land]], { start: 0.2, pause: 2 }),
    walker('stroller_linen', 'walk', [[66, land], [104, land]], { start: 0.7, prop: 'baguette' }),
    actorAt('stroller_dress', -61, ROAD.z + 4.42, 0, 'lean_rail'),
    actorAt('older_man', -59.8, ROAD.z + 4.42, 0, 'rail_call'),
    actorAt('jogger', 72, ROAD.z + 4.75, 0, 'phone', 'phone'),
    actorAt('child', STOPS[1].x - 3.8, LM_FRONT + 3.2, 0.4, 'dance'),
    actorAt('older_man', STOPS[3].x + 6.4, LM_FRONT + 2.6, -0.5, 'drink', 'coffee_cup'),
    actorAt('older_woman', STOPS[3].x + 7.6, LM_FRONT + 2.2, -1.3, 'talk'),
    actorAt('cyclist', STOPS[2].x - 5.2, LM_FRONT + 2.4, 0.9, 'idle_arms_folded'),
    actorAt('waiter', STOPS[2].x - 3.9, LM_FRONT + 3.1, -2.2, 'talk'),
    actorAt('dog_walker', STOPS[0].x + 5, LM_FRONT + 3.6, 2.6, 'phone', 'phone'),
    actorAt('stroller_dress', STOPS[1].x - 9.3, LM_FRONT + 0.9, 0, 'sit_talk', null, ROAD.y),
    actorAt('stroller_linen', STOPS[1].x - 8.7, LM_FRONT + 1.9, Math.PI, 'drink', 'wine_glass', ROAD.y),
  ];
  if (lo) crowd.length = 10;
  const actors = await Promise.all(crowd);
  const dog = await folk.spawn('dog', { clip: 'walk' }); scene.add(dog.object);
  const dogLeash = folk.leash(actors[5], dog); scene.add(dogLeash);
  for (const a of folk.actors) a.object.traverse((o) => { if (o.isMesh) o.castShadow = !lo; });

  // ---------------------------------------------------------------- post
  let composer = null, bloom = null, grade = null;
  if (!lo) {
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: hi ? 4 : 2 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.45, 0.93);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    grade = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.32 }, uGrain: { value: 0.035 }, uFade: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uVig, uGrain, uFade; varying vec2 vUv;
        float h(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
          vec2 q = vUv - .5; c *= 1. - uVig * smoothstep(.25, .85, length(q * vec2(1.15, 1.)));
          c += (h(gl_FragCoord.xy + fract(uTime) * 91.7) - .5) * uGrain;
          c = mix(c, vec3(.08, .09, .2), uFade);
          gl_FragColor = vec4(c, 1.); }`,
    });
    composer.addPass(grade);
  }

  // ---------------------------------------------------------------- time of day
  let elev = 0, night = 0, lampsOn = false, lampWave = null;
  const tmpC = new THREE.Color();
  const sunDir = new THREE.Vector3();
  function setElevation(e) {
    elev = e;
    const er = THREE.MathUtils.degToRad(e);
    sunDir.set(Math.sin(SUN_AZ) * Math.cos(er), Math.sin(er), Math.cos(SUN_AZ) * Math.cos(er)).normalize();
    SKY_U.uSunDir.value.copy(sunDir);
    rampAt('zenith', e, SKY_U.uZenith.value); rampAt('mid', e, SKY_U.uMid.value); rampAt('horizon', e, SKY_U.uHorizon.value);
    rampAt('sun', e, SKY_U.uSunCol.value); rampAt('water', e, SKY_U.uWater.value);
    SKY_U.uFog.value.copy(SKY_U.uHorizon.value).lerp(SKY_U.uMid.value, 0.45);
    night = smooth(1.5, -6.5, e);
    SKY_U.uNight.value = night; seaU.uTown.value = smooth(0.1, 0.6, night);
    scene.fog.color.copy(SKY_U.uFog.value);
    rampAt('key', e, sun.color);
    sun.intensity = 0.25 + 2.9 * smooth(-3.5, 7, e);
    hemi.color.copy(rampAt('amb', e, tmpC)).lerp(SKY_U.uZenith.value, 0.3);
    hemi.groundColor.copy(SKY_U.uHorizon.value).multiplyScalar(0.55);
    hemi.intensity = 1.05 + 0.75 * smooth(-7, 8, e);
    car.setLights(smooth(0.05, 0.35, night));
    for (const c of cars) c.v.setLights(smooth(0.02, 0.3, night));
    const k = smooth(0.25, 0.7, night);
    for (const a of folk.actors) if (a._lit !== k > 0.5) { a._lit = k > 0.5; a.setLights(a._lit ? 1.2 : 0); }
  }

  // ---------------------------------------------------------------- per frame
  const focus = new THREE.Vector3(START.x, 0, START.z);
  let clock = 0;
  const hidden = new Set();
  function update(dt, f, { playerCar = null, playerOnFoot = null } = {}) {
    clock += dt;
    if (f) focus.copy(f);
    SKY_U.uTime.value = clock; markerTime.value = clock;
    if (grade) grade.uniforms.uTime.value = clock;
    sky.position.copy(camera.position);
    sea.position.x = camera.position.x; sea.position.z = camera.position.z;

    // shadows follow the focus
    const sd = sunDir.y > 0.03 ? sunDir : tmpV.set(sunDir.x, 0.03, sunDir.z).normalize();
    sun.target.position.copy(focus);
    sun.position.copy(focus).addScaledVector(sd, 160);
    const sc = sun.shadow.camera, span = focusSpan;
    if (sc.right !== span) { sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 1; sc.far = 400; sc.updateProjectionMatrix(); }

    // lamps: a wave runs along the road from where you are when dusk arrives
    const wantOn = lampsOn ? elev < 1.2 : elev < 0.6;
    if (wantOn !== lampsOn) { lampsOn = wantOn; lampWave = { t: clock, x: focus.x, on: wantOn }; }
    if (lampWave) {
      let pending = false;
      lampHeads.forEach((l, i) => {
        const at = lampWave.t + Math.abs(l.x - lampWave.x) / 55 + (i % 3) * 0.04;
        if (clock < at) { pending = true; return; }
        const k = clock - at;
        const lv = lampWave.on ? (k < 0.08 ? 0.7 : k < 0.16 ? 0.15 : k < 0.3 ? 0.9 : k < 0.36 ? 0.4 : Math.min(1, 0.4 + k)) : Math.max(0, 1 - k / 0.15);
        l.base = lv * 1.6;
        if (l.state !== lampWave.on) { l.state = lampWave.on; sw.onClick?.({ lamp: true }, Math.abs(l.x - focus.x) + Math.abs(l.pos.z - focus.z), lampWave.on); }
      });
      if (!pending && clock - lampWave.t > 12) lampWave = null;
    }
    // the lights wave reaches the street lamps too (and, in daylight, lights them for a moment)
    const rp = sw.ripple;
    for (const l of lampHeads) {
      const m = rippleMask(rp, sw.clock, l.pos.x, l.pos.z);
      const v = m == null ? (l.base ?? 0) : m * 1.6;
      if (v !== l.mat.emissiveIntensity) l.mat.emissiveIntensity = v;
    }
    for (let i = 0; i < pools.length && i < lampHeads.length; i++) poolLevel.array[i] = lampHeads[i].mat.emissiveIntensity / 1.6;
    poolLevel.needsUpdate = true;

    sw.update(dt, night, focus);
    near.position.set(focus.x, 4.6, focus.z - 2.2);
    const nm = rippleMask(rp, sw.clock, focus.x, focus.z);
    if (nm === 0) near.intensity = 0;
    else near.intensity = damp1(near.intensity, lampsOn ? 26 * smooth(0.1, 0.8, night) : 0, nm == null ? 2 : 9, dt);

    // traffic
    for (const c of cars) {
      const lane = c.dir > 0 ? ROAD.laneE : ROAD.laneW;
      let want = c.v0, offT = 0;
      const obstacles = [];
      if (playerCar) obstacles.push({ x: playerCar.x, z: playerCar.z, still: Math.abs(playerCar.speed) < 2, speed: playerCar.speed * Math.sign(Math.sin(playerCar.heading)) });
      if (playerOnFoot) obstacles.push({ x: playerOnFoot.x, z: playerOnFoot.z, still: false, ped: true });
      for (const o of obstacles) {
        const ahead = (o.x - c.x) * c.dir;
        if (Math.abs(o.z - (lane + c.off)) > 2.3 || ahead < -2 || ahead > 26) continue;
        if (o.ped) { want = Math.min(want, Math.max(0, (ahead - 5) * 0.8)); continue; }
        if (o.still) {
          const oncoming = cars.some((d) => d !== c && d.dir !== c.dir && (d.x - c.x) * c.dir > -6 && (d.x - c.x) * c.dir < 46);
          if (oncoming) want = Math.min(want, Math.max(0, (ahead - 7) * 0.7)); else offT = -c.dir * 3.2;
        } else want = Math.min(want, Math.max(0, (ahead - 8) * 0.8 + Math.max(0, o.speed * c.dir)));
      }
      for (const d of cars) {
        if (d === c || d.dir !== c.dir) continue;
        const ahead = (d.x - c.x) * c.dir;
        if (ahead > 0 && ahead < 18) want = Math.min(want, Math.max(0, (ahead - 7) * 0.9 + d.speed * 0.5));
      }
      c.speed += clamp(want - c.speed, -9 * dt, 3 * dt);
      const prevOff = c.off;
      c.off += clamp(offT - c.off, -1.6 * dt, 1.6 * dt);
      c.x += c.dir * c.speed * dt;
      if (c.x * c.dir > 280) { c.dir = -c.dir; c.x = c.dir * -280; }
      const z = (c.dir > 0 ? ROAD.laneE : ROAD.laneW) + c.off;
      const r = c.v.root;
      r.position.set(c.x, ROAD.y, z);
      const lat = (c.off - prevOff) / Math.max(dt, 1e-3);
      r.rotation.y = Math.atan2(c.dir * c.speed, lat);
      if (c.speed < 0.05) r.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      c.v.roll(c.speed * dt, 0);
      c.v.setBrake(want < c.speed - 0.5 ? 1 : 0);
      if (c.v.twoWheeler) c.v.model.rotation.z = 0;
    }
    // cyclist
    {
      bikeT.x += bikeT.dir * bikeT.speed * dt;
      if (bikeT.x * bikeT.dir > 240) { bikeT.dir = -bikeT.dir; }
      bike.object.position.set(bikeT.x, ROAD.y, bikeT.dir > 0 ? ROAD.laneE + 1.2 : ROAD.laneW - 1.2);
      bike.object.rotation.y = bikeT.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    // walkers
    for (const w of walkers) {
      const o = w.a.object;
      if (w.wait > 0) { w.wait -= dt; if (w.wait <= 0) w.a.play(w.clip, 0.3); continue; }
      const [p0, p1] = w.path;
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      w.u += (w.dir * w.speed * dt) / len;
      if (w.u > 1 || w.u < 0) { w.u = clamp(w.u, 0, 1); w.dir = -w.dir; w.wait = w.pause; w.a.play('idle', 0.3); }
      const x = p0[0] + (p1[0] - p0[0]) * w.u, z = p0[1] + (p1[1] - p0[1]) * w.u;
      o.position.set(x, roadY(x, z), z);
      const ry = Math.atan2((p1[0] - p0[0]) * w.dir, (p1[1] - p0[1]) * w.dir);
      o.rotation.y += Math.atan2(Math.sin(ry - o.rotation.y), Math.cos(ry - o.rotation.y)) * Math.min(1, dt * 8);
    }
    // the dog trots a little ahead of its walker
    {
      const dw = walkers.find((w) => w.a === actors[5]);
      if (dw) {
        const o = dw.a.object;
        dog.object.position.set(o.position.x + Math.sin(o.rotation.y) * 1.4 + 0.5, o.position.y, o.position.z + Math.cos(o.rotation.y) * 1.4 + 0.3);
        dog.object.rotation.y = o.rotation.y;
        const want = dw.wait > 0 ? 'sniff' : 'walk';
        if (dog._clip !== want) { dog._clip = want; dog.play(want, 0.3); }
      }
    }
    // animate people near the camera only
    const cx = camera.position.x, cz = camera.position.z;
    for (const a of folk.actors) {
      const p = a.object.getWorldPosition(tmpV);
      const far = Math.abs(p.x - cx) + Math.abs(p.z - cz) > 230;
      if (a !== player && far !== hidden.has(a)) { far ? hidden.add(a) : hidden.delete(a); a.object.visible = !far; }
      if (!far || a === player) { a.mixer.update(dt); a._updateFollowers(); }
    }
    dogLeash.userData.update();
  }
  const tmpV = new THREE.Vector3();
  let focusSpan = 60;

  function render() {
    if (composer) composer.render(); else renderer.render(scene, camera);
  }
  let w0 = 0, h0 = 0;
  function resize(w, h, dpr = renderer.getPixelRatio()) {
    if (w === w0 && h === h0 && dpr === renderer.getPixelRatio()) return;
    w0 = w; h0 = h;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(dpr); composer.setSize(w, h); bloom.resolution.set(w * dpr / 2, h * dpr / 2); }
  }

  /** Is (x, z) inside a building or another large solid? (Used to keep the walk camera out of walls.) */
  function solidAt(x, z, r = 0.25) {
    for (const b of solids) if (b.x1 - b.x0 > 1.2 && x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return true;
    return false;
  }

  /** Can a walker of radius r stand at (x, z)? The road strip and pavements, the stop forecourts, minus solids. */
  function walkable(x, z, r = 0.35) {
    if (Math.abs(x) > ROAD.driveX + 4) return false;
    if (z > ROAD.z + 4.55) return false;               // the sea wall
    let zMin = ROAD.z - 4.9;                            // inland pavement edge
    for (const s of STOPS) if (Math.abs(x - s.x) < (s.inTown ? 9 : 15)) zMin = LM_FRONT - 4;
    if (Math.abs(x + 14) < 9) zMin = 6;                 // the café terrace
    if (z < zMin) return false;
    for (const b of solids) if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return false;
    return true;
  }

  return {
    THREE, renderer, scene, camera, composer, bloom, grade, town, car, player, cars, folk, stops, sw, gate,
    setElevation, update, render, resize, walkable, solidAt,
    carLight: () => smooth(0.05, 0.35, night),
    /** Jump the lamps to the current hour without the wave (deep links, headless shots). */
    settleLights() {
      lampsOn = elev < 0.6; lampWave = null;
      for (const l of lampHeads) { l.state = lampsOn; l.base = l.mat.emissiveIntensity = lampsOn ? 1.6 : 0; }
      near.intensity = lampsOn ? 26 * smooth(0.1, 0.8, night) : 0;
    },
    ripple(x, z) { sw.ripple = { t: sw.clock, x, z }; },
    get elevation() { return elev; }, get night() { return night; }, get lampsOn() { return lampsOn; },
    set focusSpan(v) { focusSpan = v; }, get focusSpan() { return focusSpan; },
    baseDpr, sunDir,
  };
}
