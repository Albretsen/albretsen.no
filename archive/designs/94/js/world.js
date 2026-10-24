// Evening post: the world. Sky, sea, light, the town from the shared kit, the four product
// landmarks, street lamps and a coarse height field the plane uses to skim the roofs.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { loadKit, createTown, mergeStatic } from '../../_shared/3d/architecture/town.js';
import { content } from '../../_shared/content.js';

const SHARED = new URL('../../_shared/3d/', import.meta.url).href;
export const SEED = 7;

// ---------------------------------------------------------------- sky ramps (design 64), keyed by sun elevation (deg)
const KEYS = [-7, -2.5, 0.5, 4, 9, 15];
const C = (a) => a.map((h) => new THREE.Color(h));
const RAMP = {
  zenith:  C(['#141b40', '#26346c', '#4d64a4', '#7d9fd0', '#9fc0e2', '#a8c8e6']),
  mid:     C(['#2e3a74', '#6f6aa8', '#c58eb0', '#eeaab0', '#efc2b6', '#c6d8e8']),
  horizon: C(['#6c5a8e', '#e08f98', '#f39a55', '#f5b25c', '#f4cf8c', '#f3dfb8']),
  key:     C(['#20284f', '#5a4472', '#e0784e', '#f09a62', '#f4cfa4', '#fff0d8']),
  amb:     C(['#323c78', '#5d5e9c', '#8f80b0', '#a6a8cc', '#b9c7dc', '#c6d5e5']),
  water:   C(['#141d45', '#28336c', '#3c4c86', '#4f6ea4', '#6893c2', '#76a5cf']),
};
export function rampAt(name, e, out = new THREE.Color()) {
  const r = RAMP[name];
  if (e <= KEYS[0]) return out.copy(r[0]);
  for (let i = 0; i < KEYS.length - 1; i++) if (e <= KEYS[i + 1]) {
    const f = (e - KEYS[i]) / (KEYS[i + 1] - KEYS[i]);
    return out.copy(r[i]).lerp(r[i + 1], f * f * (3 - 2 * f));
  }
  return out.copy(r[r.length - 1]);
}
export const SUN_AZ = 2.42; // the sun sets over the bay, to the right of the town

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- sky dome
function makeSky() {
  const u = {
    uZ: { value: new THREE.Color() }, uM: { value: new THREE.Color() }, uH: { value: new THREE.Color() },
    uSun: { value: new THREE.Vector3(0, 0.1, 1) }, uSunCol: { value: new THREE.Color() }, uNight: { value: 0 }, uTime: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
    fragmentShader: `
      uniform vec3 uZ, uM, uH, uSun, uSunCol; uniform float uNight, uTime; varying vec3 vD;
      float hash(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main(){
        vec3 d = normalize(vD);
        float h = clamp(d.y, 0., 1.);
        float t = pow(h, .45);
        vec3 c = mix(uH, uM, smoothstep(0., .38, t));
        c = mix(c, uZ, smoothstep(.32, 1., t));
        vec3 s = normalize(uSun);
        float sd = max(dot(d, s), 0.);
        // warm glow around the sun, wider along the horizon
        float hz = exp(-abs(d.y) * 9.);
        c += uSunCol * (pow(sd, 6.) * .22 + pow(sd, 64.) * .35) * (.6 + .4 * hz);
        c += uH * hz * .12 * pow(max(dot(normalize(vec2(d.x, d.z)), normalize(vec2(s.x, s.z))), 0.), 3.);
        // the disc itself, HDR so the bloom catches it
        float disc = smoothstep(.99955, .99975, sd);
        c = mix(c, uSunCol * 2.5 + vec3(1.6, 1.1, .7), disc * smoothstep(-.012, .004, d.y));
        // stars at blue hour
        vec3 g = floor(d * 220.);
        vec3 f = fract(d * 220.) - .5;
        float st = step(.9972, hash(g)) * smoothstep(.1, .5, d.y) * uNight * smoothstep(.32, .05, length(f));
        st *= .55 + .45 * sin(uTime * 1.7 + hash(g + 3.) * 40.);
        c += vec3(st) * 1.4;
        // below the horizon (seen only past the sea's edge)
        if (d.y < 0.) c = mix(uH, uM * .6, smoothstep(0., -.2, d.y));
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -10;
  return { mesh, u };
}

// ---------------------------------------------------------------- sea with moving facets and a glitter path
function makeSea() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x3c4c86, roughness: 0.2, metalness: 0.0, envMapIntensity: 1.0 });
  const shader = { u: { uTime: { value: 0 } } };
  mat.onBeforeCompile = (s) => {
    s.uniforms.uTime = shader.u.uTime;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float uTime;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          vec2 p = vWP.xz;
          float t = uTime;
          vec2 w = vec2(0.);
          w += vec2(.9, .4) * cos(dot(p, vec2(.09, .05)) * 1. + t * .9) * .5;
          w += vec2(-.3, 1.) * cos(dot(p, vec2(-.04, .17)) + t * 1.3) * .35;
          w += vec2(.6, -.8) * cos(dot(p, vec2(.31, .22)) + t * 2.1) * .2;
          w += vec2(1., .2) * cos(dot(p, vec2(.7, -.5)) + t * 3.) * .12;
          float fade = 1. / (1. + length(vWP.xz - cameraPosition.xz) * .004);
          vec3 pw = vec3(w.x, 0., w.y) * .16 * fade;
          normal = normalize(normal + (viewMatrix * vec4(pw, 0.)).xyz);
        }`);
  };
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(4000, 96), mat);
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = -0.55; mesh.receiveShadow = true;
  return { mesh, u: shader.u };
}

// ---------------------------------------------------------------- low-poly clouds lit by the sunset
function makeClouds(R) {
  // long thin streaks low over the bay, lit from below by the sun
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false, depthWrite: false });
  const geo = new THREE.IcosahedronGeometry(1, 2);
  for (let i = 0; i < 14; i++) {
    const a = SUN_AZ + (R() - 0.5) * 2.4;
    const dist = 1600 + R() * 1400;
    const y = dist * (0.035 + R() * 0.07);
    const cl = new THREE.Group();
    const n = 2 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) {
      const m = new THREE.Mesh(geo, mat);
      const s = 50 + R() * 70;
      m.scale.set(s * (3 + R() * 3), s * (0.06 + R() * 0.05), s * 0.5);
      m.position.set((k - n / 2) * s * 2.2 + R() * 60, (R() - 0.5) * 14, R() * 40);
      cl.add(m);
    }
    cl.position.set(Math.sin(a) * dist, y, -Math.cos(a) * dist);
    cl.lookAt(0, y, 0);
    group.add(cl);
  }
  group.renderOrder = -5;
  return { group, mat };
}

// ---------------------------------------------------------------- landmark screens
function screenCanvas() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 288;
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace;
  return { cv, tex };
}

// Which kit building each product replaces (indices are stable for SEED 7), with a scale so the
// landmarks read as civic buildings next to the houses.
export const LANDMARKS = [
  { id: 'mcp-emails', file: 'lm_mcpemails', replace: 14, scale: 1.3, x: -12.4 },
  { id: 'toolrails', file: 'lm_toolrails', replace: 24, scale: 1.55, x: 39 },
  { id: 'fun-libs', file: 'lm_funlibs', replace: 38, scale: 1.2, x: 24.8 },
  { id: 'harbor', file: 'lm_harbor', replace: 35, scale: 1.25, x: 0.6 },
];

export async function buildWorld({ renderer, quality, onProgress = () => {} }) {
  const scene = new THREE.Scene();
  const R = (() => { let s = 99; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();

  const sky = makeSky(); scene.add(sky.mesh);
  const sea = makeSea(); scene.add(sea.mesh);
  const clouds = makeClouds(R); scene.add(clouds.group);
  scene.fog = new THREE.Fog(0xffffff, 140, 900);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = quality.shadows;
  if (quality.shadows) {
    sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
    const sc = sun.shadow.camera; sc.left = -95; sc.right = 95; sc.top = 95; sc.bottom = -95; sc.near = 10; sc.far = 700;
  }
  sun.target.position.set(-5, 0, -35);
  scene.add(sun, sun.target);

  // ---------------- town
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let loaded = 0; const total = 33 + 4 + 2 + 4;
  const tick = () => onProgress(++loaded / total);
  const kitP = loadKit({ THREE, GLTFLoader: class extends GLTFLoader { loadAsync(u) { return super.loadAsync(u).then((g) => (tick(), g)); } }, MeshoptDecoder, base: SHARED + 'architecture/' });
  const lmP = Promise.all(LANDMARKS.map((l) => loader.loadAsync(SHARED + 'props/' + l.file + '.glb').then((g) => (tick(), g))));
  const lampP = Promise.all(['lamp_riviera', 'lamp_paris'].map((n) => loader.loadAsync(SHARED + 'props/' + n + '.glb').then((g) => (tick(), g))));
  const TREES = ['cypress', 'cypress_small', 'olive', 'palm'];
  const treeP = Promise.all(TREES.map((n) => loader.loadAsync(SHARED + 'props/' + n + '.glb').then((g) => (tick(), g.scene)).catch(() => null)));
  const [kit, lmG, lampG, treeG] = await Promise.all([kitP, lmP, lampP, treeP]);
  const treeModels = Object.fromEntries(TREES.map((n, i) => [n, treeG[i]]));

  const town = createTown({ THREE, kit, seed: SEED, merge: false });
  if (!quality.shadows) town.group.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });

  // landmarks replace four houses
  const landmarks = [];
  const removed = new Set(LANDMARKS.map((l) => l.replace));
  const box = new THREE.Box3();
  LANDMARKS.forEach((l, i) => {
    const old = town.buildings[l.replace];
    const row = old.row;
    old.object.removeFromParent();
    const root = lmG[i].scene;
    root.scale.setScalar(l.scale);
    const emissive = [], screens = [];
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = quality.shadows; o.receiveShadow = quality.shadows;
      const m = o.material;
      if (m && m.name && m.name.startsWith('emissive_')) {
        m.userData.on = m.name.includes('sign') ? 0.85 : 1.25;
        m.emissiveIntensity = 0;
        if (!emissive.includes(m)) emissive.push(m);
      }
      if (o.name === 'screen' || o.parent?.name === 'screen') {
        const s = screenCanvas();
        const p = content.products.find((q) => q.id === l.id);
        const g = s.cv.getContext('2d');
        g.fillStyle = '#141a3a'; g.fillRect(0, 0, 512, 288);
        g.fillStyle = '#f0ad62'; g.font = '600 30px Federo, Georgia, serif'; g.fillText(p.name.toUpperCase(), 30, 56);
        g.fillStyle = '#ffd27a'; g.font = '400 108px "Poiret One", Georgia, serif'; g.fillText(p.figure.value, 26, 182);
        g.fillStyle = '#f4eadb'; g.font = '500 26px "Instrument Sans", sans-serif'; g.fillText(p.figure.label, 30, 236);
        s.tex.needsUpdate = true;
        o.material = new THREE.MeshBasicMaterial({ map: s.tex, toneMapped: false, fog: false });
        o.material.color.setScalar(0);
        screens.push({ ...s, mesh: o });
      }
    });
    const front = town.rowFront(row) - 2.4;
    root.position.set(l.x, town.rowY(row), front);
    root.updateMatrixWorld(true); box.setFromObject(root);
    root.position.z += front - box.max.z;
    scene.add(root);
    root.updateMatrixWorld(true); box.setFromObject(root);
    landmarks.push({ ...l, row, root, emissive, screens, box: box.clone(), level: 0 });
  });

  const merged = mergeStatic(THREE, town.group);
  if (!quality.shadows) merged.forEach((m) => { m.castShadow = false; m.receiveShadow = false; });
  scene.add(town.group);

  // building records (kept ones) with boxes and a front-centre point
  const houses = [];
  town.buildings.forEach((b, i) => {
    if (removed.has(i) || b.kind === 'civic') return;
    b.object.updateMatrixWorld(true);
    box.setFromObject(b.object);
    houses.push({ i, b, row: b.row, box: box.clone(), level: 0, lit: 0, delivered: false, base: town.rowY(b.row ?? 0) });
  });
  const gate = town.buildings.find((b) => b.kind === 'civic');

  // ---------------- lamps: riviera lamps along the coast road, Paris lamps on two lanes
  const lamps = [];
  const addLamp = (g, x, y, z, ry) => {
    const o = g.scene.clone(true);
    const mats = [];
    o.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = false; m.receiveShadow = false;
      if (m.material.name.startsWith('emissive_')) { m.material = m.material.clone(); m.material.emissiveIntensity = 0; mats.push(m.material); }
    });
    o.position.set(x, y, z); o.rotation.y = ry;
    scene.add(o);
    lamps.push({ o, mats, x, y, z, level: 0, lit: 0 });
  };
  const rz = town.road.z;
  for (let x = -66; x <= 66; x += 12) addLamp(lampG[0], x, 0, rz + 4.2, -Math.PI / 2);
  for (const ln of [town.lanes[1], town.lanes[3]]) for (let x = ln.x0 + 6; x < ln.x1 - 4; x += 15) addLamp(lampG[1], x + (ln.row * 3 % 7), ln.y, ln.z + 0.6, 0);

  // ---------------- height field: tops of buildings, terraces and the hillside
  const HF = { x0: -110, z0: -130, cell: 1, nx: 220, nz: 260 };
  HF.h = new Float32Array(HF.nx * HF.nz);
  const rowAt = (z) => Math.floor((9 - z) / 14);
  for (let j = 0; j < HF.nz; j++) for (let i = 0; i < HF.nx; i++) {
    const x = HF.x0 + i, z = HF.z0 + j;
    let g = z > 9 ? 0.6 : 3 * Math.min(6, Math.max(0, rowAt(z)));
    if (z < -100) g = 18 + (-100 - z) * 0.32;
    g += Math.max(0, Math.abs(x) - 62) * 0.15;
    HF.h[j * HF.nx + i] = g;
  }
  const stamp = (b, pad = 1.5) => {
    const i0 = Math.max(0, Math.floor(b.min.x - pad - HF.x0)), i1 = Math.min(HF.nx - 1, Math.ceil(b.max.x + pad - HF.x0));
    const j0 = Math.max(0, Math.floor(b.min.z - pad - HF.z0)), j1 = Math.min(HF.nz - 1, Math.ceil(b.max.z + pad - HF.z0));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * HF.nx + i; HF.h[k] = Math.max(HF.h[k], b.max.y); }
  };
  houses.forEach((h) => stamp(h.box));
  landmarks.forEach((l) => stamp(l.box));
  if (gate) { gate.object.updateMatrixWorld(true); stamp(box.setFromObject(gate.object)); }
  town.buildings.forEach((b) => { if (b.name === 'church') { box.setFromObject(b.object); stamp(box); } });
  HF.at = (x, z) => {
    const i = Math.round(x - HF.x0), j = Math.round(z - HF.z0);
    if (i < 0 || j < 0 || i >= HF.nx || j >= HF.nz) return z > 9 ? -0.5 : 30;
    return HF.h[j * HF.nx + i];
  };

  // ---------------- the lit windows smear into the bay: one shimmering streak per building
  const reflSrc = [...houses.map((h) => ({ box: h.box, get: () => h.level })), ...landmarks.map((l) => ({ box: l.box, get: () => l.level }))];
  const reflLv = { value: new Float32Array(64) };
  const reflTime = { value: 0 };
  {
    const pos = [], idx = [], id = [], uvs = [];
    reflSrc.forEach((r, k) => {
      const cx = (r.box.min.x + r.box.max.x) / 2, w = (r.box.max.x - r.box.min.x) * 0.32;
      const z0 = 18.2, L = 26 + r.box.max.y * 1.6;
      const v = pos.length / 3;
      pos.push(cx - w, 0, z0, cx + w, 0, z0, cx - w * 1.6, 0, z0 + L, cx + w * 1.6, 0, z0 + L);
      uvs.push(0, 0, 1, 0, 0, 1, 1, 1);
      id.push(k, k, k, k);
      idx.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setAttribute('hid', new THREE.Float32BufferAttribute(id, 1));
    g.setIndex(idx);
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uLv: reflLv, uTime: reflTime },
      vertexShader: `attribute float hid; varying float vH; varying vec2 vUv; varying vec3 vW;
        void main(){ vH = hid; vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uLv[64]; uniform float uTime; varying float vH; varying vec2 vUv; varying vec3 vW;
        void main(){
          float lv = uLv[int(vH + .5)];
          float across = 1. - abs(vUv.x - .5) * 2.;
          float bands = .5 + .5 * sin(vW.z * 1.7 + sin(vW.z * .31 + uTime * .9) * 3. + uTime * 1.3);
          bands *= .5 + .5 * sin(vW.z * 4.3 - uTime * 2.1 + vW.x);
          float a = lv * smoothstep(0., .6, across) * pow(1. - vUv.y, 1.6) * (.6 + .4 * bands);
          gl_FragColor = vec4(vec3(1., .66, .32) * a * .42, 1.);
        }`,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.y = -0.48; mesh.frustumCulled = false; mesh.renderOrder = 1;
    scene.add(mesh);
  }

  // ---------------- environment map from the sky, refreshed as the sun moves
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = new THREE.Mesh(sky.mesh.geometry, sky.mesh.material);
  envScene.add(envSky);
  let envRT = null, envE = 99;
  function refreshEnv(e) {
    if (Math.abs(e - envE) < 0.6) return;
    envE = e;
    const old = envRT;
    envRT = pmrem.fromScene(envScene, 0.03);
    scene.environment = envRT.texture;
    if (old) old.dispose();
  }

  // ---------------------------------------------------------------- time of day
  const tmp = new THREE.Color(), sunDir = new THREE.Vector3();
  const state = { e: 4, night: 0 };
  function setSun(e, t = 0) {
    state.e = e;
    const er = THREE.MathUtils.degToRad(e);
    sunDir.set(Math.sin(SUN_AZ) * Math.cos(er), Math.sin(er), -Math.cos(SUN_AZ) * Math.cos(er)).normalize();
    sky.u.uZ.value.copy(rampAt('zenith', e)); sky.u.uM.value.copy(rampAt('mid', e)); sky.u.uH.value.copy(rampAt('horizon', e));
    sky.u.uSun.value.copy(sunDir);
    sky.u.uSunCol.value.copy(rampAt('key', e)).lerp(tmp.set('#ffb070'), 0.4).multiplyScalar(smooth(-3.5, 0.5, e) * 0.9 + 0.1);
    sky.u.uNight.value = smooth(-0.5, -5, e);
    sky.u.uTime.value = t;
    scene.fog.color.copy(rampAt('horizon', e)).lerp(rampAt('mid', e), 0.45);
    const key = rampAt('key', e);
    sun.color.copy(key);
    sun.intensity = 0.25 + 2.6 * smooth(-3, 7, e);
    const ld = Math.max(er, 0.06);
    sun.position.set(Math.sin(SUN_AZ) * Math.cos(ld), Math.sin(ld), -Math.cos(SUN_AZ) * Math.cos(ld)).multiplyScalar(320).add(sun.target.position);
    hemi.color.copy(rampAt('amb', e)).lerp(rampAt('zenith', e), 0.35);
    hemi.groundColor.copy(rampAt('horizon', e)).multiplyScalar(0.45);
    hemi.intensity = 0.75 + 0.55 * smooth(-7, 8, e);
    sea.mesh.material.color.copy(rampAt('water', e));
    clouds.mat.color.copy(rampAt('mid', e)).lerp(rampAt('key', e), 0.55 * smooth(-4, 1, e)).multiplyScalar(0.85 + 0.35 * smooth(-3, 2, e));
    clouds.mat.opacity = 0.55 + 0.3 * smooth(-5, 0, e);
    state.night = smooth(3.5, -4.5, e);
    renderer.toneMappingExposure = 1.0 + 0.12 * state.night;
    refreshEnv(e);
  }

  // ---------------------------------------------------------------- lights, driven every frame
  // Each house: global night threshold, plus a "you flew past" kick and a full pop when delivered.
  // Once it is properly dark the town lives: now and then someone leaves a room and a house drops
  // to one floor of light, then switches back on a few seconds later.
  let toggleT = 1.5;
  function updateLights(dt, plane) {
    const n = state.night;
    toggleT -= dt;
    if (n > 0.45 && toggleT <= 0) {
      toggleT = 0.5 + Math.random() * 1.3;
      const lit = houses.filter((h) => h.level > 0.7 && !(h.offT > 0));
      const h = lit[Math.floor(Math.random() * lit.length)];
      if (h) h.offT = 1.6 + Math.random() * 3.4;
    }
    for (const h of houses) {
      const near = plane ? Math.hypot(plane.x - (h.box.min.x + h.box.max.x) / 2, plane.z - h.box.max.z) : 999;
      if (n > 0.18 && near < 26) h.lit = Math.max(h.lit, 0.55 + 0.45 * smooth(0.18, 0.7, n));
      let target = Math.max(smooth(h.b.threshold * 0.8 + 0.25, h.b.threshold * 0.8 + 0.75, n), h.lit, h.delivered ? 1 : 0);
      let rate = h.delivered ? 1.3 : 0.7;
      if (h.offT > 0) { h.offT -= dt; target = Math.min(target, 0.3); rate = 5; if (h.offT <= 0) h.backT = 0.6; }
      if (h.backT > 0) { h.backT -= dt; rate = 2.2; }
      h.level += Math.sign(target - h.level) * Math.min(Math.abs(target - h.level), dt * rate);
      h.b.setLights(h.level, 1.25 + 0.6 * n);
    }
    for (const l of lamps) {
      const near = plane ? Math.hypot(plane.x - l.x, plane.z - l.z) : 999;
      if (n > 0.22 && near < 34) l.lit = 1;
      const target = Math.max(l.lit, smooth(0.75, 0.95, n));
      l.level += Math.sign(target - l.level) * Math.min(Math.abs(target - l.level), dt * 3);
      // a quick flicker on the way up, like a sodium lamp striking
      const f = l.level > 0 && l.level < 1 ? (0.6 + 0.4 * Math.sin(l.level * 60)) : 1;
      for (const m of l.mats) m.emissiveIntensity = l.level * f * 1.6;
    }
    for (const lm of landmarks) {
      const target = Math.max(lm.delivered ? 1 : 0, smooth(0.35, 0.9, n) * 0.7);
      lm.level += Math.sign(target - lm.level) * Math.min(Math.abs(target - lm.level), dt * 1.2);
      for (const m of lm.emissive) m.emissiveIntensity = lm.level * m.userData.on;
      for (const s of lm.screens) s.mesh.material.color.setScalar(0.25 + 0.75 * lm.level);
    }
    if (gate) gate.setLights(smooth(0.3, 0.8, n));
    reflSrc.forEach((r, k) => { reflLv.value[k] = r.get() * (0.35 + 0.65 * n); });
  }

  return {
    scene, sky, sea, sun, hemi, town, houses, landmarks, lamps, HF, state, sunDir, treeModels,
    setSun, updateLights,
    tick(t) { sea.u.uTime.value = t; sky.u.uTime.value = t; reflTime.value = t; },
  };
}
