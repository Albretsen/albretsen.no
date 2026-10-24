// Town through time: the three.js world.
// A seeded hillside town from the Heure Bleue architecture kit. Every building has a year:
// scrub the years and it rises out of a blueprint; scrub the sun and its windows switch on,
// group by group, then off again when the town goes to bed. Product buildings carry the
// product landmarks and live figures; retired ones close their shutters at "today".
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { loadKit, createTown, place } from '../../_shared/3d/architecture/town.js';
import { Townsfolk, SPEED } from '../../_shared/3d/people/people.js';
import { loadVehicle, PathFollower } from '../../_shared/3d/vehicles/vehicles.js';
import { createSky, createSea, rampAt, elevationAt } from './sky.js';
import { PRODUCTS, Y0, Y1, TODAY, content } from './data.js';

const LIB = new URL('../../_shared/3d/', import.meta.url).href;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const backOut = (t) => { const s = 1.9; t -= 1; return t * t * ((s + 1) * t + s) + 1; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const KIT_NAMES = ['paris_haussmann', 'paris_narrow', 'paris_pink', 'paris_powder', 'paris_rotunda', 'med_cube_small', 'med_cube_stack',
  'med_villa_tiled', 'med_house_gable', 'med_house_gable_mustard', 'med_tower_house', 'church', 'cafe', 'hotel', 'fountain', 'belvedere',
  'town_gate', 'wall_low', 'stairs', 'stairs_wide', 'road_coast', 'terrace_block', 'headland', 'rocks_coast'];
const PROP_NAMES = ['lamp_paris', 'lamp_riviera', 'bench', 'planter_pot', 'planter_versailles', 'planter_box', 'bougainvillea_spill', 'bougainvillea_bush',
  'bougainvillea_wall', 'cypress', 'cypress_small', 'palm', 'palm_tall', 'olive', 'kiosk', 'poster_column', 'parasol', 'parasol_mustard', 'cafe_set',
  'string_lights_span', 'lm_mcpemails', 'lm_funlibs', 'lm_toolrails', 'lm_harbor'];

// ------------------------------------------------------------------------------------------------
// Geometry baking: merge every non-emissive mesh under a root into one vertex-coloured geometry, so a
// building is one draw call plus its switchable lights. Palette-atlas textures are sampled per vertex.
const samplers = new WeakMap();
function sampler(tex) {
  if (!tex || !tex.image) return null;
  if (samplers.has(tex)) return samplers.get(tex);
  const img = tex.image, w = img.width, h = img.height;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const data = cx.getImageData(0, 0, w, h).data;
  const col = new THREE.Color();
  const fn = (u, v, out) => {
    u = u - Math.floor(u); v = v - Math.floor(v);
    const x = Math.min(w - 1, Math.floor(u * w)), y = Math.min(h - 1, Math.floor((tex.flipY ? 1 - v : v) * h));
    const i = (y * w + x) * 4;
    return out.setRGB(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255, THREE.SRGBColorSpace);
  };
  samplers.set(tex, fn);
  return fn;
}
const isLight = (m) => m && m.name && (m.name.startsWith('emissive_') || m.name === 'screen');
function bakeGeometry(root, skip = () => false) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const parts = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || skip(o)) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (isLight(m) || o.userData.keep) return;
    parts.push({ o, m, mat: new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld) });
  });
  let nv = 0, ni = 0;
  for (const { o } of parts) { const g = o.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3(), c = new THREE.Color(), t = new THREE.Color();
  let ov = 0, oi = 0;
  for (const { o, m, mat } of parts) {
    const g = o.geometry, P = g.attributes.position, N = g.attributes.normal, UV = g.attributes.uv, VC = g.attributes.color;
    nm.getNormalMatrix(mat);
    const samp = m.map && UV ? sampler(m.map) : null;
    const base = m.color || new THREE.Color(1, 1, 1);
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(mat); pos[(ov + i) * 3] = v.x; pos[(ov + i) * 3 + 1] = v.y; pos[(ov + i) * 3 + 2] = v.z;
      if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[(ov + i) * 3] = v.x; nor[(ov + i) * 3 + 1] = v.y; nor[(ov + i) * 3 + 2] = v.z; }
      c.copy(base);
      if (samp) c.multiply(samp(UV.getX(i), UV.getY(i), t));
      if (VC) c.multiply(t.setRGB(VC.getX(i), VC.getY(i), VC.getZ(i)));
      col[(ov + i) * 3] = c.r; col[(ov + i) * 3 + 1] = c.g; col[(ov + i) * 3 + 2] = c.b;
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.getX(i) + ov;
    else for (let i = 0; i < P.count; i++) idx[oi + i] = ov + i;
    ov += P.count; oi += g.index ? g.index.count : P.count;
  }
  for (const { o } of parts) o.removeFromParent();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingBox(); geo.computeBoundingSphere();
  return geo;
}
const vcMaterial = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0, flatShading: true });

// Shutters: a world-space wipe from the top floor down, weathered wooden louvres over the window glass
// (a warm brown, so a closed building reads differently from the kit's own teal window glass).
function shutterize(mat, U) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWp;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWp; uniform float uShut, uTop, uSpan; uniform vec3 uShutCol;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float cover = step(uTop - vWp.y, uShut * uSpan);
        float slat = .55 + .45 * smoothstep(.25, .6, fract(vWp.y * 6.));
        diffuseColor.rgb = mix(diffuseColor.rgb, uShutCol * slat, cover);`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= 1. - cover;');
  };
  mat.customProgramCacheKey = () => 'shutter';
}

// Soft round sprite for dust and light pools.
function radialTexture(stops) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}


// Blueprint helpers: a plan grid texture, a vertical fade for the light curtain, and a scaffold
// (corner posts, floor rings every 3 m, a few braces) built at unit height and scaled up.
const BLUE = new THREE.Color(0.55, 0.78, 1.0);
function gridTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(120,170,255,.22)'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(200,225,255,.55)'; g.lineWidth = 2;
  for (let i = 1; i < 8; i++) { const q = i * 32; g.beginPath(); g.moveTo(q, 0); g.lineTo(q, 256); g.moveTo(0, q); g.lineTo(256, q); g.stroke(); }
  g.strokeStyle = 'rgba(235,245,255,1)'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 248);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function fadeTexture() {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 128;
  const g = cv.getContext('2d'); const gr = g.createLinearGradient(0, 128, 0, 0);
  gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.7, 'rgba(255,255,255,.12)'); gr.addColorStop(0.96, 'rgba(255,255,255,.06)'); gr.addColorStop(1, 'rgba(255,255,255,.75)');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let planTex = null, curtainTex = null;
function scaffoldGeometry(w, d, height) {
  const v = [], x = w / 2, z = d / 2;
  const seg = (a, b) => v.push(...a, ...b);
  const C = [[-x, -z], [x, -z], [x, z], [-x, z]];
  for (const [cx, cz] of C) seg([cx, 0, cz], [cx, 1, cz]);
  const floors = Math.max(1, Math.round(height / 3));
  for (let f = 1; f <= floors; f++) { const y = f / floors; for (let i = 0; i < 4; i++) { const [ax, az] = C[i], [bx, bz] = C[(i + 1) % 4]; seg([ax, y, az], [bx, y, bz]); } }
  const y1 = 1 / floors;
  seg([-x, 0, z], [x, y1, z]); seg([x, 0, -z], [-x, y1, -z]); seg([x, 0, z], [x, y1, -z]); seg([-x, 0, -z], [-x, y1, z]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); return g;
}

// ------------------------------------------------------------------------------------------------
export async function createWorld(canvas, opts = {}) {
  const { onProgress = () => {}, quality = 'high', reduced = false } = opts;
  const low = quality === 'low';
  planTex = planTex || gridTexture(); curtainTex = curtainTex || fadeTexture();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1.25 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = low ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.info.autoReset = false;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 4000);

  // post: HDR render target with MSAA, bloom, tone map + sRGB
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: low ? 0 : 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  // guard: degenerate flat-shaded triangles can produce NaN/Inf pixels, which bloom would smear
  // into large white blooms. Clamp and zero them before the bloom pass.
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c.rgb)) || any(isinf(c.rgb))) c.rgb = vec3(0.); gl_FragColor = vec4(clamp(c.rgb, 0., 16.), 1.); }',
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.55, 0.92);
  composer.addPass(bloom);
  if (opts.noBloom) bloom.enabled = false;
  composer.addPass(new OutputPass());

  // ---------------------------------------------------------------- sky, sea, light
  const sky = createSky(); scene.add(sky.mesh);
  const sea = createSea(); scene.add(sea.mesh);
  scene.fog = new THREE.Fog(0xffffff, 260, 1100);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
  const sc = sun.shadow.camera; sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90; sc.near = 10; sc.far = 700;
  sun.target.position.set(-4, 0, -28);
  scene.add(sun, sun.target);
  const moon = new THREE.DirectionalLight(0x8fa3ff, 0); moon.position.set(-60, 120, -40); scene.add(moon);
  const SUN_AZ = new THREE.Vector2(0.86, 0.5).normalize(); // sets toward +X, over the sea on the right

  // ---------------------------------------------------------------- loading
  let done = 0; const total = KIT_NAMES.length + PROP_NAMES.length + 4;
  const tick = () => onProgress(Math.min(1, ++done / total));
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const kitP = loadKit({ THREE, GLTFLoader: class extends GLTFLoader { loadAsync(u, p) { return super.loadAsync(u, p).then((g) => { tick(); return g; }); } }, MeshoptDecoder, base: LIB + 'architecture/', names: KIT_NAMES });
  const props = {};
  const propP = Promise.all(PROP_NAMES.map(async (n) => {
    const g = await loader.loadAsync(LIB + 'props/' + n + '.glb'); tick();
    g.scene.traverse((o) => {
      if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true;
      for (const m of [].concat(o.material)) if (m.name.startsWith('emissive_')) { m.userData.on = m.emissiveIntensity || 1; m.emissiveIntensity = 0; }
    });
    props[n] = g.scene;
  }));
  const [kit] = await Promise.all([kitP, propP]);

  // ---------------------------------------------------------------- the town
  const town = createTown({ THREE, kit, seed: 7, rows: 5, halfWidth: 44, merge: false, backdrop: false });
  const world = new THREE.Group(); scene.add(world);
  world.add(town.group);
  const handles = town.buildings.slice();
  for (const h of handles) h.object.removeFromParent();
  // hillside sampler for tree placement (before baking)
  const hill = town.group.getObjectByName('hillside');
  const ray = new THREE.Raycaster();
  const groundAt = (x, z) => { ray.set(new THREE.Vector3(x, 200, z), new THREE.Vector3(0, -1, 0)); const h = ray.intersectObject(hill, false)[0]; return h ? h.point.y : null; };

  const R = rng(95);
  const buildings = [];
  const byProduct = {};
  const footOf = (obj) => { obj.updateMatrixWorld(true); return new THREE.Box3().setFromObject(obj); };
  const findHandle = ([name, x, row]) => {
    let best = null, bd = 1e9;
    for (const h of handles) { if (h.name !== name || h.row !== row || h.taken) continue; const d = Math.abs(h.object.position.x - x); if (d < bd) { bd = d; best = h; } }
    if (best) best.taken = true;
    return best;
  };

  // sign plaque for kit-based product buildings
  function plaque(text, w = 2.4) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = '#232c57'; g.fillRect(0, 0, 512, 128);
    g.strokeStyle = '#d9a42b'; g.lineWidth = 6; g.strokeRect(10, 10, 492, 108);
    g.fillStyle = '#ffd27a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs = 64; g.font = `${fs}px Federo, Georgia, serif`;
    while (g.measureText(text.toUpperCase()).width > 440 && fs > 24) { fs -= 2; g.font = `${fs}px Federo, Georgia, serif`; }
    g.fillText(text.toUpperCase(), 256, 68);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.6 });
    mat.name = 'emissive_plaque';
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w / 4, 0.08), [new THREE.MeshStandardMaterial({ color: 0x232c57 }), new THREE.MeshStandardMaterial({ color: 0x232c57 }), new THREE.MeshStandardMaterial({ color: 0x232c57 }), new THREE.MeshStandardMaterial({ color: 0x232c57 }), mat, new THREE.MeshStandardMaterial({ color: 0x232c57 })]);
    m.castShadow = true; m.userData.keep = true;
    return { mesh: m, mat };
  }

  function addBuilding({ object, emissive, kind, name, product = null, row, label = null }) {
    const root = new THREE.Group();
    root.position.copy(object.position); root.rotation.copy(object.rotation);
    object.position.set(0, 0, 0); object.rotation.set(0, 0, 0);
    root.add(object);
    world.add(root);
    // switchable materials (own copies)
    const lights = [];
    const mats = new Map();
    object.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const swap = (m) => {
        if (!m.name.startsWith('emissive_')) return m;
        if (!mats.has(m)) { const c = m.clone(); c.userData = { ...m.userData }; mats.set(m, c); }
        return mats.get(m);
      };
      o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
    });
    const box = footOf(root);
    const geo = bakeGeometry(root);
    const body = new THREE.Mesh(geo, vcMaterial()); body.castShadow = true; body.receiveShadow = true;
    root.add(body);
    const b = {
      root, body, kind, name, product, row, label, box, mats: [...mats.values()], sets: [], year: Y0, offset: 0, p: -1,
      height: box.max.y - root.position.y, base: root.position.y, override: null, shut: 0, shutTarget: 0, dim: 1, hover: 0,
      center: box.getCenter(new THREE.Vector3()),
    };
    // light sets by material name
    const thr = 0.12 + R() * 0.6;
    const bed = kind === 'generic' ? 22.6 + R() * 2.6 : 99;
    const owl = kind === 'generic' && R() < 0.22;
    for (const m of b.mats) {
      const n = m.name;
      let set;
      if (/window_1|window_ground|window_warm|arcade/.test(n)) set = { n0: thr, bed: owl ? 25.6 : bed + 0.8, k: 1.38, win: true };
      else if (/window_2|skylight/.test(n)) set = { n0: thr + 0.12, bed: bed + 0.35, k: 1.38, win: true };
      else if (/window_3|window_upper/.test(n)) set = { n0: thr + 0.24, bed, k: 1.38, win: true };
      else set = { n0: 0.06 + R() * 0.08, bed: kind === 'generic' ? bed + 1.2 : 99, k: /sign|marquee/.test(n) ? 0.95 : 1.4, sign: true };
      const base = m.userData.emissiveOn || m.emissive.clone();
      if (m.userData.emissiveOn) m.emissive.copy(m.userData.emissiveOn);
      set.mats = [m]; set.level = 0; set.target = 0; set.base = base;
      b.sets.push(set);
    }
    // shutters on kit window glass
    b.shutU = { uShut: { value: 0 }, uTop: { value: box.max.y }, uSpan: { value: box.max.y - root.position.y }, uShutCol: { value: new THREE.Color('#8a5a3c') } };
    for (const m of b.mats) if (/window/.test(m.name)) shutterize(m, b.shutU);
    // blueprint: a glowing plan on the ground, then a wireframe with floor lines and a soft
    // light curtain that rises to the building's height before the building springs up
    const bw = box.max.x - box.min.x + 0.8, bd = box.max.z - box.min.z + 0.8;
    const ghost = new THREE.Group();
    ghost.position.set(b.center.x, root.position.y + 0.06, b.center.z);
    const plan = new THREE.Mesh(new THREE.PlaneGeometry(bw, bd).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: planTex, color: BLUE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    plan.renderOrder = 3;
    const frame = new THREE.LineSegments(scaffoldGeometry(bw, bd, b.height), new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    const curtainGeo = new THREE.BoxGeometry(bw, 1, bd).translate(0, 0.5, 0);
    curtainGeo.groups = curtainGeo.groups.filter((g, i) => i !== 2 && i !== 3); // no lid, no floor
    const curtain = new THREE.Mesh(curtainGeo, new THREE.MeshBasicMaterial({ map: curtainTex, color: BLUE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
    const scan = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-bw / 2, 0, -bd / 2), new THREE.Vector3(bw / 2, 0, -bd / 2), new THREE.Vector3(bw / 2, 0, bd / 2), new THREE.Vector3(-bw / 2, 0, bd / 2)]), new THREE.LineBasicMaterial({ color: 0xeaf4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    const lift = new THREE.Group(); lift.add(frame, curtain);
    ghost.add(plan, lift, scan);
    for (const o of [ghost, plan, frame, curtain, scan, lift]) o.frustumCulled = false;
    ghost.visible = false;
    world.add(ghost);
    b.ghost = { group: ghost, plan, frame, curtain, scan, lift };
    root.visible = false;
    buildings.push(b);
    return b;
  }

  // landmarks replace a building: front edge kept, centred on the same x
  function landmarkFor(h, lmName, scale = 1, dx = 0) {
    const old = footOf(h.object);
    const lm = props[lmName].clone(true);
    lm.traverse((o) => {
      if (!o.isMesh) return;
      o.material = [].concat(o.material).map((m) => { const c = m.clone(); c.userData = { ...m.userData }; if (c.name.startsWith('emissive_')) { c.userData.emissiveOn = c.emissive.clone(); c.emissiveIntensity = 0; } return c; });
      if (o.material.length === 1) o.material = o.material[0];
    });
    const g = new THREE.Group(); g.add(lm); g.scale.setScalar(scale);
    const lb = footOf(g);
    // front edge (portico, steps, pavement cabinet) lands just inside the old footprint's front edge
    g.position.set(h.object.position.x + dx, h.object.position.y, old.max.z - lb.max.z - 0.3);
    return g;
  }

  const poolTex = radialTexture([[0, 'rgba(255,200,130,1)'], [0.35, 'rgba(255,170,90,.45)'], [1, 'rgba(255,150,80,0)']]);
  const prodState = {}; // id -> { status, since }
  for (const p of PRODUCTS) {
    const pl = p.place; if (!pl) continue;
    prodState[p.id] = p;
    const finds = Array.isArray(pl.find[0]) ? pl.find : [pl.find];
    byProduct[p.id] = [];
    finds.forEach((f, i) => {
      const h = findHandle(f);
      if (!h) { console.warn('no slot for', p.id, f); return; }
      let object, emissive;
      if (pl.landmark) { object = landmarkFor(h, pl.landmark, pl.scale || 1, pl.dx || 0); }
      else { object = h.object; }
      const b = addBuilding({ object, kind: 'product', name: h.name, product: p.id, row: h.row, label: pl.names ? pl.names[i] : p.name });
      b.year = p.since; b.offset = 0.08 + i * 0.14 + (pl.landmark ? 0.12 : R() * 0.3);
      if (pl.landmark) {
        b.landmark = pl.landmark;
        const scr = object.getObjectByName('screen');
        if (scr) {
          const cv = document.createElement('canvas'); cv.width = 512; cv.height = 288;
          const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
          scr.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0x000000 });
          b.screen = { cv, tex, mesh: scr };
        }
      } else {
        // a plaque over the door
        const { mesh, mat } = plaque(b.label, pl.names ? 2.6 : 3.0);
        const bx = b.box;
        mesh.position.set(0, Math.min(4.4, b.height * 0.42), bx.max.z - b.root.position.z + 0.12);
        b.root.add(mesh);
        b.sets.push({ mats: [mat], n0: 0.05, bed: 99, k: 0.9, sign: true, level: 0, target: 0, base: new THREE.Color(1, 1, 1), plaque: true });
      }
      // a warm pool of light on the pavement in front of the door
      const pw = (b.box.max.x - b.box.min.x) * 1.5;
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex, color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      pool.scale.set(pw, 1, Math.min(9, pw * 0.7)); pool.position.set(b.center.x, b.base + 0.08, b.box.max.z + 0.6); pool.renderOrder = 2;
      world.add(pool); b.pool = pool;
      byProduct[p.id].push(b);
    });
  }
  // the rest of the town: church and café are the old core; houses fill in year by year
  const rest = handles.filter((h) => !h.taken);
  const civic = { church: Y0 - 1, cafe: Y0, hotel: 2022, town_gate: content.history.companySince };
  const generic = [];
  for (const h of rest) {
    const b = addBuilding({ object: h.object, kind: h.name === 'town_gate' ? 'gate' : 'generic', name: h.name, row: h.row });
    if (civic[h.name] != null) { b.year = civic[h.name]; b.offset = h.name === 'town_gate' ? 0.05 : 0.2; if (h.name === 'church') b.p = 1; }
    else generic.push(b);
  }
  // growth order: from the middle of the lower terraces outward and up the hill
  generic.sort((a, b) => (Math.abs(a.center.x) * 0.5 + a.row * 7 + R() * 14) - (Math.abs(b.center.x) * 0.5 + b.row * 7 + R() * 14));
  const perYear = [2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 99];
  let gi = 0;
  for (let y = Y0; y <= Y1; y++) for (let k = 0; k < perYear[y - Y0] && gi < generic.length; k++, gi++) { generic[gi].year = y; generic[gi].offset = 0.05 + R() * 0.55; }

  // bake the static landscape (terraces, stairs, roads, walls, ground, hills) into one mesh
  const landGeo = bakeGeometry(town.group);
  const land = new THREE.Mesh(landGeo, vcMaterial()); land.receiveShadow = true; land.castShadow = true;
  town.group.add(land);

  // ---------------------------------------------------------------- street furniture (static) + lamps
  const furn = new THREE.Group(); world.add(furn);
  const lamps = [];
  const putProp = (name, x, y, z, ry = 0, s = 1) => { const o = props[name].clone(true); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); furn.add(o); return o; };
  const stairsTop = town.stairs.map((s) => ({ row: s.to, x: s.x })), stairsBot = town.stairs.map((s) => ({ row: s.from, x: s.x }));
  const nearStair = (row, x, d = 3.5) => stairsTop.some((s) => s.row === row && Math.abs(s.x - x) < d) || stairsBot.some((s) => s.row === row && Math.abs(s.x - x) < d + 1);
  const addLamp = (name, x, y, z, ry) => {
    const o = putProp(name, x, y, z, ry);
    o.traverse((m) => { if (m.isMesh && m.material.name.startsWith('emissive_')) { m.material = m.material.clone(); m.material.emissiveIntensity = 0; m.userData.keep = true; lamps.push({ mat: m.material, n0: 0.16 + R() * 0.3, level: 0, flick: 0, x, y, z, ry }); } });
  };
  for (const lane of town.lanes) {
    const paris = lane.row === 2 || lane.row === 3;
    for (let x = lane.x0 + 7 + R() * 3; x < lane.x1 - 5; x += 13 + R() * 4) {
      if (nearStair(lane.row, x)) continue;
      addLamp(paris ? 'lamp_paris' : 'lamp_riviera', x, lane.y - 0.05, lane.z + 1.15, Math.PI / 2);
    }
  }
  const road = town.road;
  for (let x = -74; x <= 74; x += 15) addLamp('lamp_riviera', x + 4, 0, road.z + 3.7, Math.PI / 2);
  // bougainvillea spilling over the terrace walls, benches facing the bay, planters
  for (let r = 1; r < town.lanes.length; r++) {
    const lane = town.lanes[r];
    for (let x = lane.x0 + 4; x < lane.x1 - 4; x += 5 + R() * 9) {
      if (nearStair(r, x, 4)) continue;
      if (R() < 0.55) putProp('bougainvillea_spill', x, lane.y - 0.05, town.rowFront(r), (R() - 0.5) * 0.2, 0.9 + R() * 0.3);
    }
  }
  for (const [r, xs] of [[1, [-28, 9, 27]], [3, [-8, 24]], [2, [-16, 13]]]) for (const x of xs) {
    const lane = town.lanes[r]; if (!lane || nearStair(r, x)) continue;
    putProp('bench', x, lane.y - 0.05, lane.z + 0.4, Math.PI);
  }
  const glow = (o, k = 1.2) => o.traverse((m) => { if (m.isMesh && m.material.name.startsWith('emissive_')) { m.material = m.material.clone(); m.material.emissiveIntensity = 0; m.userData.keep = true; lamps.push({ mat: m.material, n0: 0.2 + R() * 0.2, level: 0, flick: 0, k }); } });
  glow(putProp('kiosk', -4.2, 0, 7.6, 0.1));
  putProp('poster_column', 27, 0, 7.9);
  for (let i = 0; i < 9; i++) { const lane = town.lanes[i % 3]; const x = lane.x0 + 6 + R() * (lane.x1 - lane.x0 - 12); if (!nearStair(lane.row, x)) putProp(R() < 0.5 ? 'planter_pot' : 'planter_versailles', x, lane.y - 0.05, lane.z - 0.9, 0, 0.8); }
  // string lights over the café terrace
  {
    const s = props.string_lights_span.clone(true); s.position.set(-14, 3.6, 8.4); s.scale.set(1.35, 1, 1); furn.add(s);
    s.traverse((m) => { if (m.isMesh && m.material.name.startsWith('emissive_')) { m.material = m.material.clone(); m.userData.keep = true; lamps.push({ mat: m.material, n0: 0.1, level: 0, flick: 0, k: 1.3 }); } });
  }
  const furnGeo = bakeGeometry(furn);
  const furnMesh = new THREE.Mesh(furnGeo, vcMaterial()); furnMesh.castShadow = true; furnMesh.receiveShadow = true; furn.add(furnMesh);

  // light pools under the lamps (additive, instanced; colour = intensity)
  const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: true, fog: false }), lamps.length);
  pools.frustumCulled = false; pools.renderOrder = 2;
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _col = new THREE.Color();
  lamps.forEach((l, i) => {
    const has = l.x != null;
    _p.set(has ? l.x : 0, has ? l.y + 0.06 : -99, has ? l.z - 0.9 : 0); _s.set(7, 1, 7);
    _m4.compose(_p, _q.identity(), _s); pools.setMatrixAt(i, _m4); pools.setColorAt(i, _col.setRGB(0, 0, 0));
  });
  world.add(pools);

  // ---------------------------------------------------------------- trees: instanced, planted over the years
  const treeKinds = {};
  for (const n of ['cypress', 'cypress_small', 'palm', 'palm_tall', 'olive']) treeKinds[n] = { geo: bakeGeometry(props[n].clone(true)), list: [] };
  const plant = (n, x, y, z, year, s = 1) => treeKinds[n].list.push({ x, y, z, year, s: s * (0.85 + R() * 0.3), ry: R() * 6.28 });
  for (const g of town.gaps) {
    const kinds = g.row === 0 ? ['palm', 'palm_tall', 'olive'] : g.row < 3 ? ['olive', 'cypress_small', 'cypress'] : ['cypress', 'cypress_small'];
    const n = Math.max(1, Math.min(3, Math.floor(g.w / 3.2)));
    for (let i = 0; i < n; i++) plant(kinds[Math.floor(R() * kinds.length)], g.x + (i - (n - 1) / 2) * 2.6, g.y, g.z - R() * 2, Y0 + Math.floor(R() * 11));
  }
  for (let i = 0; i < 70; i++) {
    const side = R() < 0.5 ? -1 : 1;
    const x = side * (52 + R() * 70), z = 6 - R() * 100;
    const y = groundAt(x, z); if (y == null || y < 0.2) continue;
    plant(R() < 0.7 ? 'cypress' : 'olive', x, y - 0.2, z, R() < 0.6 ? Y0 - 1 : Y0 + Math.floor(R() * 11), 0.9 + R() * 0.5);
  }
  for (let i = 0; i < 26; i++) { const x = -40 + R() * 80, z = -64 - R() * 30; const y = groundAt(x, z); if (y != null && Math.abs(x + 2) > 12) plant('cypress', x, y - 0.2, z, R() < 0.5 ? Y0 - 1 : Y0 + Math.floor(R() * 11), 0.9 + R() * 0.4); }
  for (let x = -60; x <= 60; x += 9 + R() * 6) if (Math.abs(x + 14) > 9 && Math.abs(x - 8) > 10) plant('palm', x, 0, road.z + 5.2, Y0 + Math.floor(R() * 8), 0.9);
  const treeMat = vcMaterial();
  for (const k of Object.values(treeKinds)) {
    k.mesh = new THREE.InstancedMesh(k.geo, treeMat, Math.max(1, k.list.length));
    k.mesh.castShadow = true; k.mesh.receiveShadow = true; k.mesh.frustumCulled = false;
    world.add(k.mesh);
  }
  let treeYear = -1;
  function updateTrees(Y) {
    if (Math.abs(Y - treeYear) < 0.004) return; treeYear = Y;
    for (const k of Object.values(treeKinds)) {
      k.list.forEach((t, i) => {
        const g = backOut(clamp((Y - t.year - 0.3) / 0.5));
        _p.set(t.x, t.y, t.z); _q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, t.ry); _s.setScalar(Math.max(0.0001, g * t.s));
        _m4.compose(_p, _q, _s); k.mesh.setMatrixAt(i, _m4);
      });
      k.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------- dust puffs
  const DUST = 700;
  const dustGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(DUST * 3), dVel = new Float32Array(DUST * 3), dLife = new Float32Array(DUST), dSize = new Float32Array(DUST);
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dustGeo.setAttribute('aLife', new THREE.BufferAttribute(dLife, 1));
  dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dSize, 1));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTex: { value: radialTexture([[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]) }, uCol: { value: new THREE.Color('#efe2cf') }, uScale: { value: 400 } },
    vertexShader: 'attribute float aLife; attribute float aSize; varying float vL; uniform float uScale; void main(){ vL = aLife; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * (1.6 - aLife * .6) * uScale / -mv.z; }',
    fragmentShader: 'uniform sampler2D uTex; uniform vec3 uCol; varying float vL; void main(){ if (vL <= 0.) discard; float a = texture2D(uTex, gl_PointCoord).r; gl_FragColor = vec4(uCol, a * vL * .55); }',
  });
  const dust = new THREE.Points(dustGeo, dustMat); dust.frustumCulled = false; world.add(dust);
  let dustHead = 0;
  function puff(b) {
    const bx = b.box, cx = (bx.min.x + bx.max.x) / 2, cz = (bx.min.z + bx.max.z) / 2, w = (bx.max.x - bx.min.x) / 2 + 0.5, d = (bx.max.z - bx.min.z) / 2 + 0.5, y = b.base + 0.3;
    for (let i = 0; i < 46; i++) {
      const j = dustHead = (dustHead + 1) % DUST;
      const a = Math.random() * Math.PI * 2, ex = Math.cos(a), ez = Math.sin(a);
      const k = 1 / Math.max(Math.abs(ex) / w, Math.abs(ez) / d);
      dPos[j * 3] = cx + ex * k; dPos[j * 3 + 1] = y + Math.random() * 0.6; dPos[j * 3 + 2] = cz + ez * k;
      dVel[j * 3] = ex * (1.5 + Math.random() * 2.5); dVel[j * 3 + 1] = 0.6 + Math.random() * 1.4; dVel[j * 3 + 2] = ez * (1.5 + Math.random() * 2.5);
      dLife[j] = 1; dSize[j] = 1.2 + Math.random() * 1.8;
    }
  }
  function updateDust(dt) {
    let any = false;
    for (let j = 0; j < DUST; j++) {
      if (dLife[j] <= 0) continue; any = true;
      dLife[j] -= dt * 0.85;
      dPos[j * 3] += dVel[j * 3] * dt; dPos[j * 3 + 1] += dVel[j * 3 + 1] * dt; dPos[j * 3 + 2] += dVel[j * 3 + 2] * dt;
      dVel[j * 3] *= 0.94; dVel[j * 3 + 2] *= 0.94; dVel[j * 3 + 1] *= 0.96;
    }
    if (any) { dustGeo.attributes.position.needsUpdate = true; dustGeo.attributes.aLife.needsUpdate = true; dustGeo.attributes.aSize.needsUpdate = true; }
  }

  // pulses: a ring of light that rises off a product building when an event arrives
  const ringTex = radialTexture([[0, 'rgba(255,220,150,0)'], [0.62, 'rgba(255,220,150,0)'], [0.8, 'rgba(255,214,140,1)'], [1, 'rgba(255,214,140,0)']]);
  const rings = [];
  function pulse(id) {
    const b = (byProduct[id] || [])[0]; if (!b || b.p < 1) return;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: new THREE.Color(2.2, 1.7, 1.0) }));
    m.position.set(b.center.x, b.box.max.y + 0.4, b.center.z); world.add(m);
    rings.push({ m, t: 0 });
  }
  function updateRings(dt) {
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]; r.t += dt / 1.8;
      r.m.scale.setScalar(2 + r.t * 16); r.m.position.y += dt * 2.2; r.m.material.opacity = 0.75 * Math.sin(Math.PI * Math.min(1, r.t * 1.4)) * (1 - r.t);
      if (r.t >= 1) { r.m.removeFromParent(); r.m.material.dispose(); r.m.geometry.dispose(); rings.splice(i, 1); }
    }
  }

  // ---------------------------------------------------------------- people (loaded after the first frame)
  const folk = new Townsfolk({ base: LIB + 'people/' });
  const actors = [];
  const people = { ready: false };
  async function loadPeople(count) {
    const kinds = ['stroller_dress', 'older_man', 'waiter', 'jogger', 'stroller_linen', 'older_woman', 'child', 'dog_walker', 'cyclist', 'player'];
    const lanes = town.lanes;
    for (let i = 0; i < count; i++) {
      const kind = kinds[i % kinds.length];
      const a = await folk.spawn(kind);
      const lane = lanes[i === 0 ? 0 : (i * 3 + 1) % lanes.length];
      const x0 = lane.x0 + 4, x1 = lane.x1 - 4;
      const p = { a, kind, lane, x0, x1, x: x0 + R() * (x1 - x0), z: lane.z + (R() - 0.5) * 1.4, dir: R() < 0.5 ? -1 : 1, wait: R() * 3, clip: '', target: 0, rank: i, vis: 0, sit: null };
      p.speed = kind === 'jogger' ? SPEED.jog : (kind.startsWith('older') ? SPEED.walk_formal : SPEED.walk);
      p.walk = kind === 'jogger' ? 'jog' : kind.startsWith('older') ? 'walk_formal' : kind === 'waiter' ? 'walk_carry' : 'walk';
      if (kind === 'waiter') a.attach('tray');
      if (kind === 'older_man') a.attach('cane');
      a.object.position.set(p.x, lane.y, p.z);
      a.object.scale.setScalar(0.0001); a.object.visible = false;
      world.add(a.object);
      if (kind === 'dog_walker') {
        const dog = await folk.spawn('dog', { clip: 'walk' });
        world.add(dog.object); dog.object.visible = false; p.dog = dog;
        const leash = folk.leash(a, dog); world.add(leash); p.leash = leash; leash.visible = false;
      }
      actors.push(p);
    }
    people.ready = true;
  }
  const IDLES = ['idle', 'talk', 'phone', 'idle_arms_folded', 'wave', 'yes'];
  function updatePeople(dt, Y, hour) {
    if (!people.ready) return;
    const grow = clamp((Y - Y0 + 0.3) / (Y1 - Y0 + 1));
    let n = Math.round(3 + (actors.length - 3) * Math.pow(grow, 1.2));
    const late = smooth(22.8, 25.6, hour); // the streets empty out late at night
    n = Math.round(n * (1 - late * 0.75));
    for (const p of actors) {
      const want = p.rank < n ? 1 : 0;
      p.vis += (want - p.vis) * Math.min(1, dt * 6);
      const s = p.vis < 0.01 ? 0.0001 : backOut(clamp(p.vis));
      const o = p.a.object;
      o.visible = p.vis > 0.01; o.scale.setScalar(Math.max(0.0001, s));
      if (p.dog) { p.dog.object.visible = o.visible; p.dog.object.scale.setScalar(Math.max(0.0001, s)); p.leash.visible = o.visible && p.vis > 0.9; }
      if (!o.visible) continue;
      if (reduced) { if (p.clip !== 'idle') { p.a.play('idle', 0); p.clip = 'idle'; } o.position.set(p.x, p.lane.y, p.z); continue; }
      if (p.wait > 0) {
        p.wait -= dt;
        if (p.clip !== p.idle) { p.idle = p.idle || 'idle'; p.a.play(p.idle, 0.35); p.clip = p.idle; }
        if (p.wait <= 0) { p.target = p.x0 + R() * (p.x1 - p.x0); p.dir = Math.sign(p.target - p.x) || 1; }
      } else {
        if (p.clip !== p.walk) { p.a.play(p.walk, 0.3); p.clip = p.walk; }
        p.x += p.dir * p.speed * dt;
        if ((p.dir > 0 && p.x >= p.target) || (p.dir < 0 && p.x <= p.target)) {
          p.wait = 1.5 + R() * 5; p.idle = p.kind === 'jogger' ? 'idle' : IDLES[Math.floor(R() * IDLES.length)];
          if (hour > 21.5 && R() < 0.3 && p.kind.startsWith('stroller')) p.idle = 'dance';
        }
      }
      const face = p.wait > 0 ? 0 : (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      const cur = o.rotation.y; let d = face - cur; d = Math.atan2(Math.sin(d), Math.cos(d));
      o.rotation.y = cur + d * Math.min(1, dt * 8);
      o.position.set(p.x, p.lane.y, p.z);
      if (p.dog) {
        const dg = p.dog.object; dg.position.set(p.x + p.dir * 1.3, p.lane.y, p.z + 0.7); dg.rotation.y = o.rotation.y;
        const dc = p.wait > 0 ? 'sit' : 'walk'; if (p.dogClip !== dc) { p.dog.play(dc, 0.3); p.dogClip = dc; }
      }
    }
  }

  // ---------------------------------------------------------------- traffic on the coast road
  const traffic = [];
  async function loadTraffic() {
    const defs = [['citycar', 2017, 7.5, 0], ['van', 2021, 6.5, 0.45], ['heroMustard', 2024, 8.5, 0.7], ['hero', 2026, 9, 0.2]];
    for (const [name, year, speed, offset] of defs) {
      const v = await loadVehicle(name);
      v.root.visible = false; world.add(v.root);
      const L = 130, a = road.lanes[0], b = road.lanes[1];
      const f = new PathFollower(v, [[-L, b], [L, b], [L, a], [-L, a]], { speed, offset });
      traffic.push({ v, f, year });
    }
  }
  function updateTraffic(dt, Y, night) {
    for (const t of traffic) {
      const on = Y >= t.year + 0.5;
      t.v.root.visible = on;
      if (!on) continue;
      if (!reduced) t.f.update(dt);
      t.v.setLights(night > 0.25 ? 1 : 0);
    }
  }

  // ---------------------------------------------------------------- screens on the landmarks
  const screenState = {};
  function drawScreen(b, mode, extra) {
    const s = b.screen; if (!s) return;
    const key = mode + '|' + (extra || '');
    if (screenState[b.product] === key) return; screenState[b.product] = key;
    const p = prodState[b.product];
    const g = s.cv.getContext('2d');
    const W = 512, H = 288;
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1b2148'); bg.addColorStop(1, '#232c57');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,210,122,.35)'; g.lineWidth = 3; g.strokeRect(8, 8, W - 16, H - 16);
    g.fillStyle = '#f4eadb'; g.textBaseline = 'alphabetic';
    g.font = '28px Federo, Georgia, serif'; g.fillText(p.name.toUpperCase(), 30, 56);
    const st = mode === 'today' ? p.status : 'open';
    const dot = { live: '#7fd6a8', building: '#d9a42b', paused: '#a9c6e0', open: '#ffd27a' }[st] || '#ffd27a';
    g.fillStyle = dot; g.beginPath(); g.arc(W - 46, 47, 9, 0, 7); g.fill();
    if (mode === 'today' && p.figure) {
      g.fillStyle = '#ffd27a'; g.font = '104px "Poiret One", Georgia, serif'; g.fillText(p.figure.value, 26, 176);
      g.fillStyle = '#f4eadb'; g.font = '26px "Instrument Sans", system-ui, sans-serif'; g.fillText(p.figure.label + ' · ' + ({ live: 'live', building: 'being built', paused: 'paused' }[p.status] || p.status), 30, 216);
    } else {
      g.fillStyle = '#ffd27a'; g.font = '96px "Poiret One", Georgia, serif'; g.fillText(String(p.since), 26, 172);
      g.fillStyle = '#f4eadb'; g.font = '26px "Instrument Sans", system-ui, sans-serif'; g.fillText('opened ' + p.since, 30, 214);
    }
    if (extra) { g.fillStyle = 'rgba(244,234,219,.75)'; g.font = '20px "Instrument Sans", system-ui, sans-serif'; g.fillText(extra.slice(0, 44), 30, 258); }
    s.tex.needsUpdate = true;
  }

  // ---------------------------------------------------------------- camera
  const view = { target: new THREE.Vector3(-11, 12, -32), yaw: 0.3, pitch: 0.13, dist: 188 };
  const goal = { target: view.target.clone(), yaw: view.yaw, pitch: view.pitch, dist: view.dist };
  const HOME = { target: view.target.clone(), yaw: view.yaw, pitch: view.pitch, dist: view.dist };
  function placeCam() {
    const { target: t, yaw, pitch, dist } = view;
    camera.position.set(t.x + Math.sin(yaw) * Math.cos(pitch) * dist, t.y + Math.sin(pitch) * dist, t.z + Math.cos(yaw) * Math.cos(pitch) * dist);
    camera.lookAt(t);
  }
  const limits = { yaw: [-0.85, 1.0], pitch: [0.1, 0.95], dist: [34, 290] };
  const clampGoal = () => {
    goal.yaw = clamp(goal.yaw, ...limits.yaw); goal.pitch = clamp(goal.pitch, ...limits.pitch); goal.dist = clamp(goal.dist, ...limits.dist);
    goal.target.x = clamp(goal.target.x, -55, 50); goal.target.z = clamp(goal.target.z, -75, 12); goal.target.y = clamp(goal.target.y, 1, 26);
  };

  // ---------------------------------------------------------------- state
  const state = { Y: Y0, Ytarget: TODAY, hour: 20.9, hourTarget: 20.9, today: 0, time: 0, hoverB: null };
  const hooks = { build: () => {}, frame: () => {} };

  function updateBuildings(dt, Y, night, hour) {
    const isToday = Y >= TODAY - 0.5;
    state.today = isToday;
    for (const b of buildings) {
      const start = b.year + b.offset;
      const p = b.year < Y0 ? 1 : clamp((Y - start) / 0.34);
      const pre = clamp((Y - (start - 0.3)) / 0.3);
      if (p > 0.05 && b.p <= 0.05 && b.p >= 0 && Y > state.prevY && !reduced) { puff(b); hooks.build(info(b)); }
      b.p = p;
      const vis = p > 0.001;
      b.root.visible = vis;
      if (vis) {
        const sy = reduced ? 1 : backOut(p);
        const sxz = reduced ? 1 : 1 + (1 - Math.min(1, sy)) * 0.22;
        b.root.scale.set(sxz, Math.max(0.001, sy), sxz);
      }
      // blueprint: the plan fades in, the scaffold and light curtain rise, then it all fades as the building lands
      const gp = pre * (1 - smooth(0.55, 1, p));
      const G = b.ghost;
      G.group.visible = gp > 0.01 && !reduced;
      if (G.group.visible) {
        const rise = smooth(0.25, 1, pre);
        const hy = Math.max(0.05, b.height * rise);
        G.lift.scale.set(1, hy, 1);
        G.scan.position.y = hy;
        G.plan.material.opacity = gp * (0.6 + 0.2 * Math.sin(state.time * 6 + b.center.x));
        G.frame.material.opacity = gp * 0.7 * smooth(0.05, 0.4, pre);
        G.curtain.material.opacity = gp * 0.55 * smooth(0.1, 0.5, pre);
        G.scan.material.opacity = gp * (rise < 0.999 ? 1 : 0.5);
      }
      // status at "today"
      const prod = b.product ? prodState[b.product] : null;
      const status = prod && isToday ? prod.status : 'open';
      b.shutTarget = status === 'retired' ? 1 : 0;
      b.shut = reduced || state.snap > 0 ? b.shutTarget : b.shut + (b.shutTarget - b.shut) * Math.min(1, dt * 1.6);
      b.shutU.uShut.value = b.shut < 0.002 ? 0 : b.shut;
      // lights
      const built = p >= 0.97;
      for (const s of b.sets) {
        let on = built && night >= s.n0 && hour < s.bed ? 1 : 0;
        if (b.override != null && Math.abs(hour - b.overrideHour) > 0.75) b.override = null;
        if (s.win && b.override != null && built) on = b.override;
        if (status === 'retired') on = s.plaque ? 0.18 : 0;
        if (status === 'paused') on = s.sign ? 0.55 : (s.win ? 0 : 0);
        if (status === 'building' && s.win) on = on ? 0.8 : 0;
        if (prod && s.sign && built && status !== 'retired') on = Math.max(on, night > 0.02 ? 1 : 0.35) * (status === 'paused' ? 0.55 : 1);
        s.target = on;
        const rate = reduced || state.snap > 0 ? 600 : (on > s.level ? 9 : 5);
        s.level = state.snap > 0 || reduced ? s.target : s.level + (s.target - s.level) * Math.min(1, dt * rate);
        const k = s.level * s.k * (prod && status !== 'retired' ? 1.18 : 1);
        for (const m of s.mats) if (Math.abs(m.emissiveIntensity - k) > 0.002) m.emissiveIntensity = k;
      }
      if (b.pool) {
        let lv = 0; for (const s of b.sets) if (s.win || s.sign) lv = Math.max(lv, s.level);
        const k = lv * night * (status === 'paused' ? 0.35 : 1);
        b.pool.visible = k > 0.01;
        b.pool.material.color.setRGB(0.55 * k, 0.4 * k, 0.24 * k);
      }
      // hover glow
      // hover glow; the building whose card is open keeps a soft warm wash so it reads even after dark
      const hv = state.hoverB === b ? 1 : state.focusB && state.focusB.product && state.focusB.product === b.product ? 0.75 + 0.6 * night : 0;
      b.hover += (hv - b.hover) * Math.min(1, dt * 6);
      b.body.material.emissive.setRGB(0.09 * b.hover, 0.07 * b.hover, 0.045 * b.hover);
      if (b.screen) {
        const vis2 = built && (!prod || status !== 'retired');
        b.screen.mesh.material.color.setScalar(vis2 ? (0.25 + 0.75 * Math.max(night, 0.35)) * (status === 'paused' ? 0.6 : 1) : 0.05);
        drawScreen(b, isToday ? 'today' : 'open', b.screenExtra);
      }
    }
  }

  function updateLamps(dt, night) {
    lamps.forEach((l, i) => {
      const want = night >= l.n0 ? 1 : 0;
      if (want && l.level < 0.05 && !l.flick && !reduced && !(state.snap > 0)) l.flick = 0.45;
      let k;
      if (l.flick > 0) { l.flick = Math.max(0, l.flick - dt); k = Math.random() < 0.5 ? 1 : 0.1; l.level = l.flick === 0 ? 1 : 0.5; }
      else { l.level = reduced || state.snap > 0 ? want : l.level + (want - l.level) * Math.min(1, dt * 6); k = l.level; }
      if (!want) l.flick = 0;
      const intensity = k * (l.k || 1.6);
      l.mat.emissiveIntensity = intensity;
      pools.setColorAt(i, _col.setRGB(0.32 * k, 0.24 * k, 0.15 * k));
    });
    pools.instanceColor.needsUpdate = true;
  }

  // ---------------------------------------------------------------- lighting per hour
  const tmpA = new THREE.Color(), tmpB = new THREE.Color(), sunDir = new THREE.Vector3();
  function applySky(hour) {
    const e = elevationAt(hour);
    const er = THREE.MathUtils.degToRad(e);
    sunDir.set(SUN_AZ.x * Math.cos(er), Math.sin(er), SUN_AZ.y * Math.cos(er)).normalize();
    const night = smooth(3, -7, e);
    const U = sky.uniforms;
    rampAt('zenith', e, U.uZenith.value); rampAt('mid', e, U.uMid.value); rampAt('horizon', e, U.uHorizon.value); rampAt('sun', e, U.uSunCol.value);
    U.uSunDir.value.copy(sunDir); U.uNight.value = smooth(1, -12, e);
    const S = sea.uniforms;
    rampAt('water', e, S.uWater.value); S.uZenith.value.copy(U.uZenith.value); S.uHorizon.value.copy(U.uHorizon.value); S.uMid.value.copy(U.uMid.value);
    S.uSunCol.value.copy(U.uSunCol.value); S.uSunDir.value.copy(sunDir); S.uSunUp.value = smooth(-1.5, 1.5, e); S.uNight.value = night;
    scene.fog.color.copy(rampAt('horizon', e, tmpA)).lerp(rampAt('mid', e, tmpB), 0.45);
    S.uFog.value.copy(scene.fog.color);
    rampAt('key', e, sun.color); sun.intensity = 3.4 * smooth(-1.2, 7, e);
    sun.position.copy(sunDir).multiplyScalar(320).add(sun.target.position);
    renderer.shadowMap.autoUpdate = e > -1.5;
    rampAt('amb', e, hemi.color).lerp(U.uZenith.value, 0.25);
    rampAt('horizon', e, hemi.groundColor).lerp(hemi.color, 0.5).multiplyScalar(0.45);
    hemi.intensity = 0.55 + 1.35 * smooth(-15, 6, e);
    moon.intensity = 0.55 * smooth(-3, -12, e);
    return { e, night };
  }

  // ---------------------------------------------------------------- input: orbit, click, hover
  const pointers = new Map();
  let drag = null, pinch = null, lastMove = 0;
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    let best = null, bd = Infinity; const hit = new THREE.Vector3();
    for (const b of buildings) {
      if (b.p < 0.6 || b.kind === 'gate') continue;
      if (raycaster.ray.intersectBox(b.box, hit)) { const d = hit.distanceTo(raycaster.ray.origin); if (d < bd) { bd = d; best = b; } }
    }
    return best;
  }
  canvas.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, yaw: goal.yaw, pitch: goal.pitch, moved: 0, button: e.button, target: goal.target.clone(), touch: e.pointerType === 'touch' };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: goal.dist }; drag = null; }
    if (e.pointerType !== 'touch') canvas.setPointerCapture(e.pointerId);
    hooks.interact?.();
  });
  canvas.addEventListener('pointermove', (e) => {
    const pt = pointers.get(e.pointerId); if (pt) { pt.x = e.clientX; pt.y = e.clientY; }
    if (pinch && pointers.size === 2) { const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); goal.dist = pinch.dist * pinch.d / Math.max(20, d); clampGoal(); return; }
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
      if (drag.moved > 4) {
        if (drag.button === 2 || e.shiftKey) {
          const k = goal.dist / 900;
          const right = new THREE.Vector3(Math.cos(goal.yaw), 0, -Math.sin(goal.yaw)), fwd = new THREE.Vector3(-Math.sin(goal.yaw), 0, -Math.cos(goal.yaw));
          goal.target.copy(drag.target).addScaledVector(right, -dx * k).addScaledVector(fwd, dy * k);
        } else {
          goal.yaw = drag.yaw - dx * 0.0042;
          if (!drag.touch) goal.pitch = drag.pitch + dy * 0.003;
        }
        clampGoal();
      }
    } else if (e.pointerType !== 'touch' && performance.now() - lastMove > 40) {
      lastMove = performance.now();
      const b = pick(e.clientX, e.clientY);
      state.hoverB = b;
      canvas.style.cursor = b ? 'pointer' : 'grab';
      hooks.hover?.(b ? info(b) : null, e.clientX, e.clientY);
    }
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (drag && e.type === 'pointerup' && drag.moved <= 6) {
      const b = pick(e.clientX, e.clientY);
      hooks.click?.(b ? info(b) : null);
      if (b) clickBuilding(b);
    }
    if (pointers.size === 0) drag = null;
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', () => { if (!drag) { state.hoverB = null; hooks.hover?.(null); } });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !opts.wheelZoom) return; // plain wheel scrolls the page; pinch / ctrl+wheel zooms
    e.preventDefault(); goal.dist *= Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0012)); clampGoal(); hooks.interact?.();
  }, { passive: false });
  canvas.addEventListener('dblclick', (e) => { const b = pick(e.clientX, e.clientY); if (b) focus(b); else { goal.dist *= 0.7; clampGoal(); } });

  function info(b) {
    return { id: b.product, kind: b.kind, name: b.name, label: b.label, year: b.year, lit: b.sets.some((s) => s.win && s.level > 0.5) };
  }
  function clickBuilding(b) {
    if (b.product) { focus(b); return; }
    // ordinary houses: flick their lights
    const lit = b.sets.some((s) => s.win && s.level > 0.5);
    b.override = lit ? 0 : 1; b.overrideHour = state.hour;
    hooks.toggle?.(info(b), !lit);
  }
  function focus(bOrId) {
    const b = typeof bOrId === 'string' ? (byProduct[bOrId] || [])[0] : bOrId;
    if (!b) return;
    // Frame the building so its front is actually visible: try a handful of camera angles and keep
    // the one whose sight lines to the facade cross the fewest other buildings (the back terraces
    // otherwise hide behind the front row), preferring angles close to the current one.
    const portrait = w / h < 0.8;
    const tgt = new THREE.Vector3(b.center.x, Math.max(3, b.base + b.height * 0.45), b.center.z);
    const dist = clamp(40 + b.height * 2.0, 50, 84) * (portrait ? 1.3 : 1);
    const hw = (b.box.max.x - b.box.min.x) / 2;
    const probes = [[0, 0.45], [0, 0.8], [-0.6, 0.6], [0.6, 0.6], [-0.35, 0.3], [0.35, 0.3]].map(([fx, fy]) => new THREE.Vector3(b.center.x + fx * hw, b.base + b.height * fy, b.box.max.z + 0.2));
    const cam = new THREE.Vector3(), dir = new THREE.Vector3(), hit = new THREE.Vector3(), ray = new THREE.Ray();
    const others = buildings.filter((o) => o !== b && o.p > 0.5 && !(o.product && o.product === b.product));
    let best = null;
    // the story card sits on the right on wide screens and at the bottom on phones: the look-at point is
    // offset so the building stays clear of it, and the camera moves with it, so score the moved camera
    const shift = (yaw) => (w > 860 ? new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(dist * 0.16) : new THREE.Vector3(0, -dist * 0.12, 0));
    for (const yaw of [0.3, 0.12, 0.5, -0.1, 0.7, -0.3, 0.9]) for (const pitch of [0.2, 0.3, 0.42, 0.56, 0.72]) {
      cam.set(tgt.x + Math.sin(yaw) * Math.cos(pitch) * dist, tgt.y + Math.sin(pitch) * dist, tgt.z + Math.cos(yaw) * Math.cos(pitch) * dist).add(shift(yaw));
      let blocked = 0;
      for (const pt of probes) {
        const len = dir.subVectors(pt, cam).length(); dir.normalize(); ray.set(cam, dir);
        for (const o of others) if (ray.intersectBox(o.box, hit) && hit.distanceTo(cam) < len - 0.6) { blocked++; break; }
      }
      const score = blocked * 10 + Math.abs(yaw - 0.3) * 2 + Math.abs(pitch - 0.26) * 3;
      if (!best || score < best.score) best = { score, yaw, pitch };
    }
    goal.target.copy(tgt).add(shift(best.yaw)); goal.dist = dist; goal.yaw = best.yaw; goal.pitch = best.pitch;
    state.focusB = b;
    clampGoal();
  }
  function home() { state.focusB = null; goal.target.copy(HOME.target); goal.yaw = HOME.yaw; goal.pitch = HOME.pitch; goal.dist = HOME.dist; }

  // ---------------------------------------------------------------- frame
  let w = 0, h = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w / h;
    // phones (portrait): widen the view and step back so the whole hillside fits
    camera.fov = w / h < 0.8 ? 44 : 32;
    camera.updateProjectionMatrix();
    dustMat.uniforms.uScale.value = h * renderer.getPixelRatio() * 0.5;
  }
  resize();

  const clock = new THREE.Clock();
  state.prevY = state.Y;
  const proj = new THREE.Vector3();
  let frames = 0, slow = 0, tier = low ? 1 : 0;
  function render() {
    const dt = Math.min(0.05, clock.getDelta());
    state.time += dt;
    if (state.snap > 0 && !opts.shot) state.snap--;
    if (opts.shot) state.snap = 1;
    state.frames = (state.frames || 0) + 1;
    // ease the controls
    const kY = reduced ? 1 : Math.min(1, dt * 3.2);
    state.prevY = state.Y;
    state.Y += (state.Ytarget - state.Y) * kY;
    if (Math.abs(state.Ytarget - state.Y) < 0.001) state.Y = state.Ytarget;
    state.hour += (state.hourTarget - state.hour) * (reduced ? 1 : Math.min(1, dt * 4));
    const { e, night } = applySky(state.hour);
    state.night = night; state.elevation = e;
    sky.uniforms.uTime.value = state.time; sea.uniforms.uTime.value = state.time;
    let lit = 0, all = 0;
    updateBuildings(dt, state.Y, night, state.hour);
    for (const b of buildings) if (b.p > 0.97) { all++; if (b.sets.some((s) => s.win && s.level > 0.5)) lit++; }
    sea.uniforms.uTownLights.value = all ? (lit / all) * night : 0;
    updateLamps(dt, night);
    updateTrees(state.Y);
    updateDust(dt); updateRings(dt);
    updatePeople(dt, state.Y, state.hour);
    folk.update(reduced ? 0 : dt);
    updateTraffic(dt, state.Y, night);
    // camera damping + a slow breathing drift when idle
    const kc = reduced || opts.shot ? 1 : Math.min(1, dt * 4);
    view.yaw += (goal.yaw - view.yaw) * kc; view.pitch += (goal.pitch - view.pitch) * kc; view.dist += (goal.dist - view.dist) * kc;
    view.target.lerp(goal.target, kc);
    if (!reduced && opts.drift !== false && !drag) goal.yaw += Math.sin(state.time * 0.07) * 0.00012;
    const portrait = w / h < 0.8;
    const dist0 = view.dist, tx0 = view.target.x;
    if (portrait) { view.dist = dist0 * 1.1; view.target.x = tx0 + 7 * clamp((dist0 - 90) / 90); }
    placeCam();
    view.dist = dist0; view.target.x = tx0;
    bloom.strength = 0.22 + 0.4 * night;
    renderer.info.reset();
    composer.render(dt);
    // pins for product buildings
    const pins = [];
    for (const id in byProduct) {
      const b = byProduct[id][Math.floor(byProduct[id].length / 2)]; if (!b) continue;
      proj.set(b.center.x, b.base + b.height * Math.min(1, Math.max(0.001, b.root.scale.y)) + 1.8, b.center.z).project(camera);
      pins.push({ id, x: (proj.x + 1) / 2 * w, y: (1 - proj.y) / 2 * h, on: b.p > 0.9 && proj.z < 1 && (1 - proj.y) / 2 * h > 74, status: state.today ? prodState[id].status : 'open', hover: state.hoverB && state.hoverB.product === id });
    }
    if (state.frames % 3 === 1) hooks.debug?.();
    hooks.frame({ Y: state.Y, hour: state.hour, e, night, pins, dist: view.dist, today: state.today, lit, all });
    // adaptive quality: if the first seconds run slow, step down once or twice
    frames++;
    if (frames > 30 && frames < 400) { if (dt > 0.026) slow++; if (slow > 45 && tier < 2) { tier++; slow = 0; frames = 0; downgrade(tier); } }
  }
  function downgrade(t) {
    if (t === 1) { renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25)); sun.shadow.mapSize.set(1024, 1024); sun.shadow.map?.dispose(); sun.shadow.map = null; }
    if (t === 2) { renderer.setPixelRatio(1); bloom.enabled = night0() > 0.3; renderer.shadowMap.type = THREE.PCFShadowMap; }
    resize();
  }
  const night0 = () => state.night || 0;

  let running = false, raf = 0;
  function loop() { raf = requestAnimationFrame(loop); render(); }
  const api = {
    renderer, scene, camera, buildings, byProduct, state, hooks, town,
    start() { if (!running) { running = true; clock.getDelta(); loop(); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    renderOnce: render,
    resize,
    setYear(y, instant = false) { state.Ytarget = clamp(y, Y0, TODAY); if (instant) { state.Y = state.Ytarget; state.prevY = state.Y; state.snap = 3; } },
    setHour(hr, instant = false) { state.hourTarget = clamp(hr, 16, 26); if (instant) { state.hour = state.hourTarget; state.snap = 3; } },
    focus, home, pulse,
    clearFocus() { state.focusB = null; },
    setScreenExtra(id, text) { for (const b of byProduct[id] || []) b.screenExtra = text; },
    refreshScreens() { for (const k in screenState) delete screenState[k]; },
    zoom(f) { goal.dist *= f; clampGoal(); },
    orbit(dyaw) { goal.yaw += dyaw; clampGoal(); },
    glide(v) { if (v.yaw != null) goal.yaw = v.yaw; if (v.pitch != null) goal.pitch = v.pitch; if (v.dist != null) goal.dist = v.dist; if (v.target) goal.target.set(...v.target); clampGoal(); },
    get home0() { return HOME; },
    setView(v) { if (v.target) goal.target.set(...v.target); if (v.yaw != null) goal.yaw = v.yaw; if (v.pitch != null) goal.pitch = v.pitch; if (v.dist != null) goal.dist = v.dist; clampGoal(); view.target.copy(goal.target); Object.assign(view, { yaw: goal.yaw, pitch: goal.pitch, dist: goal.dist }); },
    loadPeople, loadTraffic,
    productCenter(id) { const b = (byProduct[id] || [])[0]; return b ? b.center : null; },
  };
  return api;
}
