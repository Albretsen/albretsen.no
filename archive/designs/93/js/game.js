// Lamplighter: blue hour is falling, the street lamps are out, and you carry the flame.
// Albretsen AS, design 93. three.js r170 (vendored), the shared Heure Bleue 3D library.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { loadKit, createTown, mergeStatic } from '../../_shared/3d/architecture/town.js';
import { Townsfolk } from '../../_shared/3d/people/people.js';
import { loadVehicle, PathFollower } from '../../_shared/3d/vehicles/vehicles.js';
import { createSky, createSea, rampAt, elevationAt, SUN_AZIMUTH } from './sky.js';
import { createWalkMap } from './walk.js';
import { createParticles, lightPool, halo, glowTexture, markerTexture, lightCone } from './fx.js';

const SHARED = new URL('../../_shared/3d/', import.meta.url).href;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const DURATION = 185; // seconds of sky, from golden light to full dark
const PLAY_FROM = 0.26; // the clock the game starts at: the sun touching the sea, about 2 min 15 s of play to full dark
const WIN = 1.0; // window brightness when fully lit

// Districts, bottom of the hill to the top. Each reveals one product.
const DISTRICTS = [
  { id: 'fun-libs', lm: 'lm_funlibs', row: 0, lamp: 'lamp_riviera', name: 'The seafront' },
  { id: 'mcp-emails', lm: 'lm_mcpemails', row: 1, lamp: 'lamp_riviera', name: 'The lower lane' },
  { id: 'toolrails', lm: 'lm_toolrails', row: 2, lamp: 'lamp_paris', name: 'The Paris shelf' },
  { id: 'harbor', lm: 'lm_harbor', row: 3, lamp: 'lamp_paris', name: 'The summit' },
];
const NPCS = [
  ['waiter', 'idle_arms_folded', 'walk_carry', 'tray'], ['stroller_dress', 'phone', 'dance', null],
  ['older_woman', 'idle', 'talk', null], ['older_man', 'idle_arms_folded', 'drink', 'wine_glass'],
  ['dog_walker', 'phone', 'idle', null], ['cyclist', 'idle_arms_folded', 'talk', null],
  ['child', 'idle', 'dance', null], ['stroller_linen', 'phone', 'rail_call', null],
];

export async function createGame({ canvas, products, ui, params = {}, reduced = false, coarse = false }) {
  // ------------------------------------------------------------------ renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const quality = { dpr: Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.5), bloom: true, shadows: !coarse || params.q === 'high' };
  if (params.q === 'low') Object.assign(quality, { dpr: 1, bloom: false, shadows: false });
  renderer.setPixelRatio(quality.dpr);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x8d7495, 70, 520);
  const camera = new THREE.PerspectiveCamera(coarse ? 50 : 38, 1, 0.3, 3000);

  const sky = createSky(); scene.add(sky.mesh);
  const sea = createSea(); scene.add(sea.mesh);

  const hemi = new THREE.HemisphereLight(0xb4b2d0, 0x6a4a4e, 1.2); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb27a, 2.4);
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 220 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  const moon = new THREE.DirectionalLight(0x9fb2f0, 0); moon.position.set(-60, 70, 50); scene.add(moon);

  // ------------------------------------------------------------------ loading
  const manager = THREE.DefaultLoadingManager;
  let seen = 0;
  manager.onProgress = (url, loaded, total) => { seen = Math.max(seen, loaded / Math.max(total, 52)); ui.progress?.(seen); };
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const glb = (p) => loader.loadAsync(SHARED + p).then((g) => g.scene);
  const folk = new Townsfolk({ base: SHARED + 'people/' });

  const [kit, lmScenes, lampScenes, treeScenes, player, van, ...npcActors] = await Promise.all([
    loadKit({ THREE, GLTFLoader, MeshoptDecoder, base: SHARED + 'architecture/' }),
    Promise.all(DISTRICTS.map((d) => glb('props/' + d.lm + '.glb'))),
    Promise.all(['lamp_riviera', 'lamp_paris'].map((n) => glb('props/' + n + '.glb'))),
    Promise.all(['cypress', 'cypress_small', 'olive', 'palm', 'bench', 'planter_pot', 'bougainvillea_bush'].map((n) => glb('props/' + n + '.glb'))),
    folk.spawn('player'),
    loadVehicle('van').catch(() => null),
    ...NPCS.map(([n]) => folk.spawn(n)),
    folk.spawn('dog'),
  ]);
  const dog = npcActors.pop();
  const LAMP_T = { lamp_riviera: lampScenes[0], lamp_paris: lampScenes[1] };
  const TREE_T = Object.fromEntries(['cypress', 'cypress_small', 'olive', 'palm', 'bench', 'planter_pot', 'bougainvillea_bush'].map((n, i) => [n, treeScenes[i]]));

  // ------------------------------------------------------------------ the town
  const town = createTown({ THREE, kit, seed: +(params.seed || 11), rows: 4, halfWidth: 44, merge: false });
  scene.add(town.group);
  const { rowFront, rowY } = town;
  const TOP = town.rows;
  const stairTo = (r) => town.stairs.find((s) => s.to === r);
  const walk = createWalkMap(town);
  const props = new THREE.Group(); props.name = 'props'; scene.add(props);
  const xrayMats = new Set();

  // remove the low garden walls that would sit across a stair corridor
  town.group.traverse((o) => {
    if (o.userData.kit === 'wall_low') {
      const hit = town.stairs.some((s) => Math.abs(o.position.x - s.x) < 4.5 && Math.abs(o.position.y - rowY(s.from)) < 0.5);
      if (hit) o.userData.drop = true;
    }
  });
  town.group.children.filter((o) => o.userData.drop).forEach((o) => o.removeFromParent());

  const removeBuildingsIn = (row, x0, x1) => {
    for (const b of [...town.buildings]) {
      if (b.row !== row || ['hotel', 'cafe', 'church', 'paris_rotunda', 'town_gate'].includes(b.name)) continue;
      const box = new THREE.Box3().setFromObject(b.object);
      if (box.max.x > x0 && box.min.x < x1) {
        b.object.removeFromParent();
        town.buildings.splice(town.buildings.indexOf(b), 1);
      }
    }
  };

  // the café would block the first flight of stairs: move it along the seafront
  const CAFE_X = 31;
  {
    const cafe = town.buildings.find((b) => b.name === 'cafe');
    if (cafe) {
      removeBuildingsIn(0, CAFE_X - 7.6, CAFE_X + 7.6);
      cafe.object.position.x = CAFE_X;
    }
  }

  // the HOTEL rooftop sign is lettered on one face only and reads backwards from the hill:
  // cull its back faces and give the sign a second, correctly lettered face toward the hill
  {
    const hotel = town.buildings.find((b) => b.name === 'hotel');
    let sm = null;
    hotel?.object.traverse((o) => { if (o.isMesh && o.material?.name === 'emissive_sign') sm = o; });
    if (sm) {
      hotel.object.updateMatrixWorld(true);
      sm.material.side = THREE.FrontSide;
      const g = sm.geometry, P = g.attributes.position, I = g.index;
      const v = new THREE.Vector3(), ys = new Float32Array(P.count);
      let top = -Infinity;
      for (let i = 0; i < P.count; i++) { ys[i] = v.fromBufferAttribute(P, i).applyMatrix4(sm.matrixWorld).y; top = Math.max(top, ys[i]); }
      const keep = [], n = I ? I.count : P.count, box = new THREE.Box3();
      for (let t = 0; t < n; t += 3) {
        const a = I ? I.getX(t) : t, b = I ? I.getX(t + 1) : t + 1, c = I ? I.getX(t + 2) : t + 2;
        if (Math.min(ys[a], ys[b], ys[c]) > top - 2.4) { keep.push(a, b, c); for (const k of [a, b, c]) box.expandByPoint(v.fromBufferAttribute(P, k)); }
      }
      if (keep.length) {
        // depth runs along the box's thinnest axis; the letters face +depth (the sea)
        const sz = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
        const ax = sz.x < sz.z ? 'x' : 'z';
        const depth = sz[ax];
        const g2 = g.clone(); g2.setIndex(keep);
        const back = new THREE.Mesh(g2, sm.material);
        const shift = new THREE.Vector3(); shift[ax] = -depth * 2.4;
        back.matrixAutoUpdate = false;
        back.matrix.copy(sm.matrix)
          .multiply(new THREE.Matrix4().makeTranslation(c.x + shift.x, c.y, c.z + shift.z))
          .multiply(new THREE.Matrix4().makeRotationY(Math.PI))
          .multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z));
        sm.parent.add(back);
        // a dark signboard between the two faces hides each one from the other side
        const bw = (ax === 'z' ? sz.x : sz.z) * 1.06, bh = sz.y * 1.3;
        const board = new THREE.Mesh(new THREE.BoxGeometry(ax === 'z' ? bw : depth * 0.5, bh, ax === 'z' ? depth * 0.5 : bw), new THREE.MeshStandardMaterial({ color: 0x2b3046, roughness: 0.7, metalness: 0.2 }));
        board.matrixAutoUpdate = false;
        const bp = c.clone(); bp[ax] -= depth * 1.2;
        board.matrix.copy(sm.matrix).multiply(new THREE.Matrix4().makeTranslation(bp.x, bp.y, bp.z));
        board.castShadow = true;
        sm.parent.add(board);
      }
    }
  }

  // ------------------------------------------------------------------ lamps
  const poolTex = glowTexture(128, [[0, 'rgba(255,255,255,.9)'], [0.35, 'rgba(255,230,190,.45)'], [1, 'rgba(255,200,140,0)']]);
  const haloTex = glowTexture(128);
  const markTex = markerTexture();
  const lamps = [];
  function makeLamp(d, type, x, y, z, row, ry) {
    const obj = LAMP_T[type].clone(true);
    obj.position.set(x, y, z);
    obj.rotation.y = type === 'lamp_riviera' ? ry : 0;
    let mat = null;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      if (o.material.name === 'emissive_lamp') { o.material = mat = o.material.clone(); mat.emissiveIntensity = 0; }
    });
    props.add(obj);
    obj.updateMatrixWorld(true);
    const head = new THREE.Box3().setFromObject(obj.getObjectByName('lamp')).getCenter(new THREE.Vector3());
    const pool = lightPool(4.6, poolTex);
    pool.position.set(head.x, y + 0.04, head.z);
    props.add(pool);
    const h = halo(type === 'lamp_paris' ? 2.6 : 2.2, haloTex);
    h.position.copy(head); props.add(h);
    // a bright core you can see from above, and a soft cone of light down to the ground
    const core = halo(type === 'lamp_paris' ? 0.9 : 0.75, haloTex);
    core.material.color.set(0xfff1d6); core.material.depthTest = true;
    core.position.copy(head).y -= type === 'lamp_paris' ? 0 : 0.12; props.add(core);
    const ch = head.y - y - 0.1;
    const cone = lightCone(ch, ch * (type === 'lamp_paris' ? 0.42 : 0.5));
    cone.position.set(head.x, head.y - (type === 'lamp_paris' ? 0.1 : 0.05), head.z); props.add(cone);
    const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex, transparent: true, depthWrite: false, depthTest: false, opacity: 0, fog: false }));
    mark.scale.setScalar(0.9); mark.position.copy(head).y += 1.1; mark.renderOrder = 20; props.add(mark);
    walk.addPost(x, z, y, 0.32);
    const lamp = { d, obj, mat, head, pool, halo: h, core, cone, mark, row, x, y, z, state: 'dark', k: 0, t: 0, seed: Math.random() * 10, index: lamps.length };
    lamps.push(lamp);
    return lamp;
  }

  // ------------------------------------------------------------------ district layout
  const START = { x: -3, z: rowFront(0) + 2.2 };
  const busy = { 0: [[-1, 17], [CAFE_X - 7.5, CAFE_X + 7.5]] }; // hotel, café
  const lmSize = lmScenes.map((s) => new THREE.Box3().setFromObject(s).getSize(new THREE.Vector3()));
  const districts = DISTRICTS.map((D, i) => ({ ...D, index: i, product: products.find((p) => p.id === D.id), lamps: [], npcs: [], lit: false, buildings: [] }));

  for (const d of districts) {
    const r = d.row, lane = town.lanes[r];
    const a = r === 0 ? START.x : stairTo(r).x;
    const b = stairTo(r + 1).x;
    const size = lmSize[d.index];
    let lmX, lmRow = r, lmZ;
    if (d.id === 'harbor') {
      lmRow = TOP; lmX = 11; lmZ = rowFront(TOP) - 3.2 - size.z / 2;
    } else {
      let best = null, bs = Infinity;
      for (let x = lane.x0 + 9; x <= lane.x1 - 9; x += 1) {
        if (Math.abs(x - b) < 8.5) continue;
        if ((busy[r] || []).some(([c, e]) => x + 5 > c && x - 5 < e)) continue;
        const mid = (a + b) / 2;
        const s = Math.abs(x - mid) + (Math.abs(x - a) < 6 ? 6 : 0) + (r === 0 && x < a ? 3 : 0);
        if (s < bs) { bs = s; best = x; }
      }
      lmX = best ?? (a + b) / 2;
      lmZ = rowFront(r) - 2.7 - size.z / 2;
    }
    removeBuildingsIn(lmRow, lmX - size.x / 2 - 1.2, lmX + size.x / 2 + 1.2);
    d.lmPos = new THREE.Vector3(lmX, rowY(lmRow), lmZ);
    d.lmRow = lmRow;

    // lamps: spread along the lane between the arrival, the landmark and the way up
    const xs = [];
    if (d.id === 'harbor') {
      const lane3 = town.lanes[3];
      const mid = clamp((a + b) / 2, lane3.x0 + 4, lane3.x1 - 4);
      xs.push({ x: Math.abs(mid - b) < 3.5 ? mid + 5 : mid, row: 3 });
      xs.push({ x: -10, row: TOP, z: rowFront(TOP) - 0.8 }, { x: 5.2, row: TOP, z: rowFront(TOP) - 0.8 }, { x: 17, row: TOP, z: rowFront(TOP) - 0.8 });
    } else {
      let lo = Math.min(a, b, lmX) - 3, hi = Math.max(a, b, lmX) + 3;
      if (hi - lo < 26) { const c = (hi + lo) / 2; lo = c - 13; hi = c + 13; }
      lo = Math.max(lo, lane.x0 + 3); hi = Math.min(hi, lane.x1 - 3);
      for (let k = 0; k < 4; k++) {
        let x = lo + ((k + 0.5) / 4) * (hi - lo);
        if (r > 0 && Math.abs(x - a) < 2.8) x = a + Math.sign(x - a || 1) * 2.8;
        if (r === 0) for (const [c, e] of [[-21.5, -6.5]]) if (x > c && x < e && false) x = e + 1;
        xs.push({ x, row: r });
      }
    }
    for (const L of xs) {
      const row = L.row;
      const onRoad = row === 0;
      const z = L.z ?? (onRoad ? rowFront(0) + 0.75 : rowFront(row) - 0.7);
      d.lamps.push(makeLamp(d, onRoad ? 'lamp_riviera' : d.lamp, L.x, rowY(row), z, row, onRoad ? -Math.PI / 2 : Math.PI / 2));
    }
  }

  // ------------------------------------------------------------------ landmarks
  for (const d of districts) {
    const lm = lmScenes[d.index];
    lm.position.copy(d.lmPos);
    const mats = [];
    lm.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const m = o.material;
      if (m.name.startsWith('emissive_')) {
        m.userData.on = /sign/.test(m.name) ? 0.95 : /marquee|arcade|lamp/.test(m.name) ? 1.2 : 1.25;
        m.emissiveIntensity = 0; mats.push(m);
      }
      xrayMats.add(m);
    });
    // live screen
    const screen = lm.getObjectByName('screen');
    const can = Object.assign(document.createElement('canvas'), { width: 512, height: 288 });
    const tex = new THREE.CanvasTexture(can); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const smat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0x000000 });
    if (screen) { screen.material = smat; }
    props.add(lm);
    lm.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(lm);
    walk.addObstacle(box, 0.1);
    const sign = lm.getObjectByName('sign');
    d.signPos = sign ? new THREE.Box3().setFromObject(sign).getCenter(new THREE.Vector3()) : box.getCenter(new THREE.Vector3());
    Object.assign(d, { lm, lmMats: mats, screen: { canvas: can, tex, mat: smat }, reveal: 0, revealT: -1 });
    drawScreen(d, null);
  }

  // obstacles for the big civic buildings near the lanes
  for (const b of town.buildings) {
    if (['hotel', 'cafe', 'paris_rotunda', 'church'].includes(b.name)) walk.addObstacle(new THREE.Box3().setFromObject(b.object), -0.2);
  }
  town.group.traverse((o) => { if (o.userData.kit === 'fountain' || o.userData.kit === 'belvedere') walk.addObstacle(new THREE.Box3().setFromObject(o), 0); });

  // ------------------------------------------------------------------ decor: trees in the gaps
  {
    let n = 0;
    for (const g of town.gaps) {
      if (g.w < 2.4 || n > 26) continue;
      const name = g.row >= 2 ? (g.w > 4 ? 'cypress' : 'cypress_small') : (n % 3 === 0 ? 'palm' : n % 3 === 1 ? 'olive' : 'cypress_small');
      if (town.stairs.some((s) => Math.abs(s.x - g.x) < 3 && (s.from === g.row))) continue;
      const t = TREE_T[name].clone(true);
      t.position.set(g.x, g.y, g.z - 1);
      t.rotation.y = n * 1.7;
      t.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; xrayMats.add(o.material); } });
      props.add(t); n++;
    }
    // a bench and bougainvillea by each landmark, pots on the plaza
    for (const d of districts) {
      const bx = d.lmPos.x + (d.index % 2 ? -5.4 : 5.4), bz = d.lmPos.z + 1;
      const bush = TREE_T.bougainvillea_bush.clone(true); bush.position.set(bx, d.lmPos.y, rowFront(d.lmRow) - 3.2); props.add(bush);
      bush.traverse((o) => { if (o.isMesh) { o.castShadow = true; xrayMats.add(o.material); } });
      void bz;
    }
  }

  // ------------------------------------------------------------------ merge static town
  for (const b of town.buildings) b.object.updateMatrixWorld(true);
  const merged = mergeStatic(THREE, town.group);
  town.group.traverse((o) => { if (o.isMesh) { const ms = [].concat(o.material); ms.forEach((m) => xrayMats.add(m)); } });
  const hillside = town.group.getObjectByName('hillside');

  // ------------------------------------------------------------------ villas on the hills: lights that come on with the dusk
  // Small clusters of warm windows scattered over the slopes around the town. Each has its own moment to switch on as
  // the sky darkens (and as you light the town), and now and then one goes out for a while and comes back.
  const hillLights = (() => {
    const pts = [], R = (() => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
    const rc = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), o = new THREE.Vector3();
    hillside?.updateMatrixWorld(true);
    const townZ = rowFront(TOP) - 8;
    for (let c = 0; c < 170 && hillside; c++) {
      const cx = (R() * 2 - 1) * 170, cz = townZ - 6 - R() * 120 + (Math.abs(cx) > 60 ? 70 : 0);
      if (Math.abs(cx) < 56 && cz > townZ - 8) continue; // the town itself
      const n = 2 + Math.floor(R() * 6), base = R() * 0.85;
      for (let i = 0; i < n; i++) {
        const x = cx + (R() - 0.5) * 6, z = cz + (R() - 0.5) * 5;
        o.set(x, 400, z); rc.set(o, down);
        const hit = rc.intersectObject(hillside, false)[0];
        if (!hit || hit.point.y < 1.5) continue;
        pts.push(x, hit.point.y + 0.5 + R() * 1.4, z, Math.min(0.98, base + R() * 0.15), R() * 6.283, 0.6 + R() * 0.8);
      }
    }
    const n = pts.length / 6;
    const pos = new Float32Array(n * 3), th = new Float32Array(n), ph = new Float32Array(n), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos.set(pts.slice(i * 6, i * 6 + 3), i * 3); th[i] = pts[i * 6 + 3]; ph[i] = pts[i * 6 + 4]; sz[i] = pts[i * 6 + 5]; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('th', new THREE.BufferAttribute(th, 1));
    geo.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
    geo.setAttribute('sz', new THREE.BufferAttribute(sz, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uOn: { value: 0 }, uTime: { value: 0 }, uScale: { value: 400 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */ `
        attribute float th, ph, sz; uniform float uOn, uTime, uScale; varying float vA;
        void main(){
          float on = smoothstep(th, th + .04, uOn);
          // now and then a window goes dark for a while, then comes back
          float away = step(.93, sin(uTime * (.05 + fract(ph * 7.) * .06) + ph * 3.));
          vA = on * (1. - away) * (.85 + .15 * sin(uTime * 1.3 + ph * 11.));
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          gl_PointSize = clamp(sz * 2.2 * uScale / -mv.z, 2.5, 13.) * step(.01, vA);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main(){
          float d = length(gl_PointCoord - .5) * 2.;
          float core = smoothstep(.55, .15, d), glow = smoothstep(1., .2, d) * .35;
          gl_FragColor = vec4(vec3(1., .78, .45) * (core + glow) * vA * 1.4, 1.);
        }`,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false; points.renderOrder = 1;
    scene.add(points);
    return { mat, count: n };
  })();

  // ------------------------------------------------------------------ building light state
  for (const b of town.buildings) {
    b.cur = 0; b.target = 0; b.setLights(0);
    b.pos = b.object.getWorldPosition(new THREE.Vector3());
    b.district = districts.find((d) => d.row === Math.min(b.row ?? 0, 3)) || districts[0];
    if (b.name === 'church') b.district = districts[3];
    b.district.buildings.push(b);
    b.blink = 0;
  }

  // ------------------------------------------------------------------ x-ray: see the lamplighter through houses in front
  const XR = { uHole: { value: new THREE.Vector3(0, 0, 0) }, uHoleY: { value: 0 }, uHoleDist: { value: 0 } };
  const xrayPatch = (sh) => {
    Object.assign(sh.uniforms, XR);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vXW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvXW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vXW; uniform vec3 uHole; uniform float uHoleY; uniform float uHoleDist;
      float bayer4(vec2 p){ vec2 q = mod(floor(p), 4.); int i = int(q.x + q.y * 4.);
        float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.); return (m[i] + .5) / 16.; }`)
      .replace('void main() {', `void main() {
        if (uHole.z > 0. && vXW.y > uHoleY + .35 && distance(vXW, cameraPosition) < uHoleDist - 1.4) {
          vec2 dd = gl_FragCoord.xy - uHole.xy;
          float rr = length(dd / vec2(1.3, 1.)) / uHole.z;
          float below = smoothstep(uHole.z * .35, -uHole.z * .7, dd.y) * (1. - smoothstep(uHole.z * .9, uHole.z * 1.6, abs(dd.x))) * (1. - smoothstep(uHole.z * 1.8, uHole.z * 2.6, -dd.y));
          float cut = max(1. - smoothstep(.55, 1., rr), below * .94);
          if (bayer4(gl_FragCoord.xy) < cut) discard;
        }`);
  };
  for (const m of xrayMats) { if (!m || m.isShaderMaterial) continue; m.onBeforeCompile = xrayPatch; m.needsUpdate = true; }

  // ------------------------------------------------------------------ people
  const pState = { pos: new THREE.Vector3(START.x, 0, START.z), vel: new THREE.Vector3(), heading: Math.PI, speed: 0, route: null, clip: '' };
  scene.add(player.object);
  const lantern = await player.attach('lantern');
  player.setLights(1.4, 0xffc979);
  const lanternLight = new THREE.PointLight(0xffb45e, 0, 9, 1.6);
  scene.add(lanternLight);
  player.play('lantern', 0); pState.clip = 'lantern';

  const npcs = [];
  NPCS.forEach(([name, before, after, prop], i) => {
    const d = districts[Math.floor(i / 2)];
    const a = npcActors[i];
    const side = i % 2 ? 1 : -1;
    const row = d.lmRow;
    let x = d.lmPos.x + side * (lmSize[d.index].x / 2 + 1.6);
    let z = row === 0 ? rowFront(0) - 1.2 : rowFront(row) - 1.9;
    if (walk.blocked(x, z, rowY(row))) x = d.lmPos.x + side * 2.2;
    a.object.position.set(x, rowY(row), z);
    a.object.rotation.y = side * 0.5;
    a.play(before, 0);
    if (before === 'phone') { a.attach('phone').then(() => a.setLights(0.9, 0xbfd8ff)); }
    scene.add(a.object);
    npcs.push({ a, d, after, prop, before, home: new THREE.Vector3(x, rowY(row), z), done: false });
  });
  // the terrier sits by the dog walker
  { const w = npcs[4]; dog.object.position.copy(w.home).add(new THREE.Vector3(0.9, 0, 0.5)); dog.play('sit', 0); scene.add(dog.object); scene.add(folk.leash(w.a, dog)); }

  // a delivery van running the coast road
  let vanFollow = null;
  if (van && town.road) {
    scene.add(van.root);
    const [l0, l1] = town.road.lanes;
    vanFollow = new PathFollower(van, [[-95, l1], [95, l1], [104, (l0 + l1) / 2], [95, l0], [-95, l0], [-104, (l0 + l1) / 2]], { speed: 7.5, offset: 0.62 });
  }

  // ------------------------------------------------------------------ fx
  const fx = createParticles(); scene.add(fx.points);
  const poolLights = Array.from({ length: 4 }, () => { const l = new THREE.PointLight(0xffb867, 0, 11, 1.7); scene.add(l); l.userData.lamp = null; return l; });
  const dest = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 40), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  dest.rotation.x = -Math.PI / 2; dest.renderOrder = 3; scene.add(dest);
  const sparks = []; // flames in flight from the lantern to a lamp

  // ------------------------------------------------------------------ post
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: coarse ? 0 : 4 }));
  composer.addPass(new RenderPass(scene, camera));
  // guard the bloom: a single non-finite or extreme pixel (a specular hit on glass, say) would otherwise
  // bloom into a white sheet across half the screen
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv);
        if (any(isnan(c)) || any(isinf(c))) c = vec4(0., 0., 0., 1.);
        gl_FragColor = vec4(clamp(c.rgb, 0., 12.), c.a); }`,
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.62, 0.5, 0.86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  bloom.enabled = quality.bloom;

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(quality.dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(quality.dpr);
    composer.setSize(w, h);
    bloom.resolution.set(w * quality.dpr * 0.5, h * quality.dpr * 0.5);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 54 : w / h < 1.2 ? 46 : 38;
    camera.updateProjectionMatrix();
    fx.setScale(h * quality.dpr);
    hillLights.mat.uniforms.uScale.value = h * quality.dpr * 0.5;
  }
  resize();
  addEventListener('resize', resize);

  // ------------------------------------------------------------------ state
  const S = {
    mode: 'idle', // idle | intro | play | finale
    sky: params.t != null ? +params.t : 0.06, time: 0, lit: 0, streak: 0, streakT: 0, started: 0, finishedAt: 0,
    auto: false, skipped: false, paused: false, focus: null, pulse: 0,
  };
  const total = lamps.length;
  const queue = [];
  const later = (dt, fn) => queue.push({ at: S.time + dt, fn });

  // ------------------------------------------------------------------ sky and light
  const tmpC = new THREE.Color();
  function applySky(t) {
    const e = elevationAt(t);
    const night = smooth(-1, -8.5, e);
    const sunDir = SUN_AZIMUTH.clone().multiplyScalar(Math.cos(e * Math.PI / 180)); sunDir.y = Math.sin(Math.max(e, -6) * Math.PI / 180);
    sunDir.normalize();
    for (const u of [sky.uniforms, sea.uniforms]) u.uSunDir.value.copy(sunDir);
    rampAt('zenith', e, sky.uniforms.uZenith.value); rampAt('mid', e, sky.uniforms.uMid.value); rampAt('horizon', e, sky.uniforms.uHorizon.value);
    rampAt('sun', e, sky.uniforms.uSunCol.value); sky.uniforms.uNight.value = night;
    sea.uniforms.uZenith.value.copy(sky.uniforms.uZenith.value); sea.uniforms.uHorizon.value.copy(sky.uniforms.uHorizon.value);
    sea.uniforms.uSunCol.value.copy(sky.uniforms.uSunCol.value); rampAt('water', e, sea.uniforms.uWater.value);
    rampAt('fog', e, sea.uniforms.uFog.value); sea.uniforms.uNight.value = night;
    rampAt('fog', e, scene.fog.color);
    rampAt('hemiSky', e, hemi.color); rampAt('hemiGnd', e, hemi.groundColor);
    hemi.intensity = 1.25 - night * 0.3;
    rampAt('key', e, sun.color);
    sun.intensity = 2.6 * smooth(-1.2, 1.5, e);
    sun.userData.dir = sunDir;
    moon.intensity = 0.9 * night;
    renderer.toneMappingExposure = 1.05 + night * 0.4;
    S.night = night; S.elev = e;
    ui.sky?.(t, e);
  }

  // ------------------------------------------------------------------ input
  const keys = new Set();
  const joy = { x: 0, y: 0, id: null, ox: 0, oy: 0, t0: 0, moved: false };
  let drag = null;
  const active = () => S.mode === 'play' && !S.paused;
  const onKey = (e) => {
    if (!active()) return;
    const k = e.code;
    if (/^(Arrow|Key[WASD]|Shift)/.test(k)) {
      if (e.type === 'keydown') keys.add(k); else keys.delete(k);
      if (k.startsWith('Arrow')) e.preventDefault();
      pState.route = null;
    }
  };
  addEventListener('keydown', onKey); addEventListener('keyup', onKey);
  addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (e) => {
    if (!active()) return;
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      if (joy.id !== null) return;
      Object.assign(joy, { id: e.pointerId, ox: e.clientX, oy: e.clientY, t0: performance.now(), moved: false, x: 0, y: 0 });
      ui.stick?.({ on: true, x: e.clientX, y: e.clientY, dx: 0, dy: 0 });
    } else {
      drag = { x: e.clientX, y: e.clientY, yaw: cam.yawUser, moved: false };
    }
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId === joy.id) {
      const dx = e.clientX - joy.ox, dy = e.clientY - joy.oy, l = Math.hypot(dx, dy);
      if (l > 12) { joy.moved = true; pState.route = null; }
      const m = Math.min(1, l / 56), a = Math.atan2(dy, dx);
      joy.x = joy.moved ? Math.cos(a) * m : 0; joy.y = joy.moved ? -Math.sin(a) * m : 0;
      ui.stick?.({ on: true, x: joy.ox, y: joy.oy, dx: Math.cos(a) * Math.min(l, 56), dy: Math.sin(a) * Math.min(l, 56) });
    } else if (drag) {
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 6) drag.moved = true;
      if (drag.moved) cam.yawUser = clamp(drag.yaw - dx * 0.004, -0.75, 0.75);
    }
  });
  const up = (e) => {
    if (e.pointerId === joy.id) {
      if (!joy.moved && performance.now() - joy.t0 < 350) pick(e.clientX, e.clientY);
      joy.id = null; joy.x = joy.y = 0; ui.stick?.({ on: false });
    } else if (drag) {
      if (!drag.moved) pick(e.clientX, e.clientY);
      drag = null;
    }
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tv = new THREE.Vector3(), tv2 = new THREE.Vector3();
  function toScreen(v, out = { x: 0, y: 0, z: 0 }) {
    tv.copy(v).project(camera);
    const r = canvas.getBoundingClientRect();
    out.x = r.left + (tv.x * 0.5 + 0.5) * r.width; out.y = r.top + (-tv.y * 0.5 + 0.5) * r.height; out.z = tv.z;
    return out;
  }
  function pick(cx, cy) {
    // an unlit lamp near the tap?
    let best = null, bd = 46;
    for (const L of lamps) {
      if (L.state !== 'dark') continue;
      const a = toScreen(tv2.set(L.x, L.y + 0.4, L.z)), b = toScreen(L.head);
      if (a.z > 1 || b.z > 1) continue;
      const vx = b.x - a.x, vy = b.y - a.y, len2 = vx * vx + vy * vy || 1;
      const t = clamp(((cx - a.x) * vx + (cy - a.y) * vy) / len2, 0, 1);
      const d = Math.hypot(a.x + vx * t - cx, a.y + vy * t - cy);
      if (d < bd) { bd = d; best = L; }
    }
    let target;
    if (best) {
      const z = best.row === 0 ? best.z + 1.6 : walk.laneZ(best.row);
      target = walk.snap(best.x + 0.6, best.y, z);
    } else {
      const r = canvas.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      let hit = null, hd = Infinity;
      for (const g of walk.regions) {
        const y = g.h((g.x0 + g.x1) / 2, (g.z0 + g.z1) / 2);
        const dy = ray.ray.direction.y; if (Math.abs(dy) < 1e-4) continue;
        const t = (y - ray.ray.origin.y) / dy; if (t < 0 || t > hd) continue;
        const px = ray.ray.origin.x + ray.ray.direction.x * t, pz = ray.ray.origin.z + ray.ray.direction.z * t;
        if (px < g.x0 - 1 || px > g.x1 + 1 || pz < g.z0 - 1 || pz > g.z1 + 1) continue;
        hd = t; hit = { x: px, y, z: pz };
      }
      if (hit) target = walk.snap(hit.x, hit.y, hit.z);
    }
    if (!target) return;
    pState.route = walk.route(pState.pos, target);
    pState.routeStall = 0;
    dest.position.set(target.x, target.y + 0.05, target.z);
    dest.material.opacity = 0.9; dest.scale.setScalar(1.4);
    ui.hint?.(null);
  }

  // ------------------------------------------------------------------ camera
  const cam = { yaw: +(params.cy ?? -0.42), yawUser: 0, pitch: +(params.cp ?? 0.52), dist: +(params.cd ?? 24), pos: new THREE.Vector3(), look: new THREE.Vector3(), tween: null, init: false };
  const INTRO = { pos: new THREE.Vector3(-22, 32, -66), look: new THREE.Vector3(18, 7, 40) };
  const INTRO_TALL = { pos: new THREE.Vector3(-22, 32, -66), look: new THREE.Vector3(34, 9, 26) };
  const FINALE = { pos: new THREE.Vector3(52, 22, 84), look: new THREE.Vector3(-41, 10, -13) };
  const FINALE_TALL = { pos: new THREE.Vector3(26, 36, 100), look: new THREE.Vector3(0, -15, -12) };
  function followPose(out) {
    const portrait = camera.aspect < 0.8;
    const yaw = cam.yaw + cam.yawUser;
    let dist = (portrait ? 21 : cam.dist) - S.pulse * 0.6;
    // look well ahead, up the hill: the lamps still to light are above you, so the lamplighter sits in the lower third
    const ahead = portrait ? 4.2 : 5.6;
    const target = tv.copy(pState.pos).add(tv2.set(pState.vel.x * 0.35 - Math.sin(yaw) * ahead, 2.2, pState.vel.z * 0.35 - Math.cos(yaw) * ahead));
    const look = target.clone();
    if (S.focus) {
      const w = S.focus.w;
      look.lerp(S.focus.point, 0.62 * w);
      dist += 5 * w;
    }
    const pitch = cam.pitch + (portrait ? 0.14 : 0); // phones look down more, so the facades in front do not fill the screen
    out.pos.set(look.x + Math.sin(yaw) * Math.cos(pitch) * dist, look.y + Math.sin(pitch) * dist, look.z + Math.cos(yaw) * Math.cos(pitch) * dist);
    out.look.copy(look);
    return out;
  }
  const poseTmp = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  const sphA = new THREE.Spherical(), sphB = new THREE.Spherical();
  function tweenTo(getPose, dur, done) {
    cam.tween = { from: { pos: cam.pos.clone(), look: cam.look.clone() }, getPose, t: 0, dur: reduced ? 0.001 : dur, done };
  }
  function updateCamera(dt) {
    let want;
    if (S.mode === 'idle') want = camera.aspect < 0.8 ? INTRO_TALL : INTRO;
    else if (S.mode === 'finale') {
      const k = S.time * 0.03;
      const F = camera.aspect < 0.8 ? FINALE_TALL : FINALE;
      want = { pos: F.pos.clone().add(new THREE.Vector3(Math.sin(k) * 6, Math.sin(k * 0.7) * 1.5, 0)), look: F.look };
    } else want = followPose(poseTmp);
    if (cam.tween) {
      const T = cam.tween; T.t += dt;
      const k = ease(clamp(T.t / T.dur, 0, 1));
      const p = T.getPose();
      // orbit rather than slide: swing around the look point in spherical coordinates, lifting a little on the way,
      // so a flight from the hill to the seafront arcs over the roofs instead of diving through them
      const kl = ease(clamp(T.t / (T.dur * 0.8), 0, 1));
      cam.look.lerpVectors(T.from.look, p.look, kl);
      const a = sphA.setFromVector3(tv.subVectors(T.from.pos, T.from.look)), b = sphB.setFromVector3(tv2.subVectors(p.pos, p.look));
      let dth = b.theta - a.theta; dth = Math.atan2(Math.sin(dth), Math.cos(dth));
      const r = THREE.MathUtils.lerp(a.radius, b.radius, k);
      const phi = THREE.MathUtils.lerp(a.phi, b.phi, k) - Math.sin(k * Math.PI) * 0.22;
      cam.pos.setFromSphericalCoords(r, clamp(phi, 0.15, 1.45), a.theta + dth * k).add(cam.look);
      if (T.t >= T.dur) { cam.tween = null; T.done?.(); }
    } else if (!cam.init || S.mode === 'idle') {
      cam.pos.copy(want.pos); cam.look.copy(want.look); cam.init = true;
    } else {
      const kp = S.mode === 'finale' ? 0.6 : 5;
      cam.pos.x = damp(cam.pos.x, want.pos.x, kp, dt); cam.pos.y = damp(cam.pos.y, want.pos.y, kp * 0.8, dt); cam.pos.z = damp(cam.pos.z, want.pos.z, kp, dt);
      cam.look.x = damp(cam.look.x, want.look.x, kp * 1.4, dt); cam.look.y = damp(cam.look.y, want.look.y, kp, dt); cam.look.z = damp(cam.look.z, want.look.z, kp * 1.4, dt);
    }
    if (params.cam) { const c = params.cam.split(',').map(Number); cam.pos.set(c[0], c[1], c[2]); cam.look.set(c[3], c[4], c[5]); }
    camera.position.copy(cam.pos);
    camera.lookAt(cam.look);
    sky.mesh.position.copy(camera.position);
  }

  // ------------------------------------------------------------------ player
  const wish = new THREE.Vector3();
  function updatePlayer(dt) {
    wish.set(0, 0, 0);
    let hurry = keys.has('ShiftLeft') || keys.has('ShiftRight');
    if (active()) {
      const k = keys;
      const mx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) + joy.x;
      const my = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) + joy.y;
      const yaw = cam.yaw + cam.yawUser;
      // screen-relative: right = (cos, -sin), forward = (-sin, -cos)
      wish.x = Math.cos(yaw) * mx - Math.sin(yaw) * my;
      wish.z = -Math.sin(yaw) * mx - Math.cos(yaw) * my;
      if (Math.hypot(joy.x, joy.y) > 0.92) hurry = true;
      if (wish.lengthSq() > 0.0001) { pState.route = null; }
      else if (pState.route && pState.route.length) {
        const [wx, wz] = pState.route[0];
        const dx = wx - pState.pos.x, dz = wz - pState.pos.z, l = Math.hypot(dx, dz);
        if (l < 0.45) { pState.route.shift(); if (!pState.route.length) pState.route = null; }
        else { wish.set(dx / l, 0, dz / l); if (pState.route.length > 1 || l > 6) hurry = true; }
      }
    }
    const len = wish.length();
    if (len > 1) wish.divideScalar(len);
    const maxV = hurry ? 4.6 : 3.2;
    const tvx = wish.x * maxV, tvz = wish.z * maxV;
    const acc = len > 0.01 ? 10 : 14;
    pState.vel.x = damp(pState.vel.x, tvx, acc, dt); pState.vel.z = damp(pState.vel.z, tvz, acc, dt);
    const sp = Math.hypot(pState.vel.x, pState.vel.z);
    if (sp > 0.02) {
      const before = { x: pState.pos.x, z: pState.pos.z };
      const ok = walk.move(pState.pos, pState.vel.x * dt, pState.vel.z * dt);
      const moved = Math.hypot(pState.pos.x - before.x, pState.pos.z - before.z);
      if (!ok || moved < sp * dt * 0.3) {
        pState.vel.multiplyScalar(0.5);
        if (pState.route) { pState.routeStall = (pState.routeStall || 0) + dt; if (pState.routeStall > 0.8) { pState.route.shift(); pState.routeStall = 0; if (!pState.route.length) pState.route = null; } }
      } else pState.routeStall = 0;
      if (len > 0.05) {
        const h = Math.atan2(wish.x, wish.z);
        let dh = h - pState.heading; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
        pState.heading += dh * (1 - Math.exp(-12 * dt));
      }
    }
    const o = player.object;
    o.position.x = pState.pos.x; o.position.z = pState.pos.z;
    o.position.y = damp(o.position.y, pState.pos.y, 18, dt);
    o.rotation.y = pState.heading;
    // locomotion
    const clip = sp < 0.35 ? 'lantern' : sp > 3.9 ? 'run' : sp > 1.9 ? 'jog' : 'walk';
    if (clip !== pState.clip) { player.play(clip, 0.22); pState.clip = clip; }
    if (player.current) player.current.setEffectiveTimeScale(clip === 'walk' ? clamp(sp / 1.2, 0.6, 1.6) : clip === 'jog' ? clamp(sp / 3.2, 0.7, 1.3) : clip === 'run' ? clamp(sp / 4.6, 0.8, 1.2) : 1);
    pState.speed = sp;
    // the lantern's own little light
    lantern.getWorldPosition(lanternLight.position); lanternLight.position.y += 0.35;
    lanternLight.intensity = (2 + S.night * 7) * (0.92 + Math.sin(S.time * 17) * 0.04 + Math.sin(S.time * 7.3) * 0.04);
    dest.material.opacity = damp(dest.material.opacity, pState.route ? 0.75 : 0, 6, dt);
    dest.scale.setScalar(damp(dest.scale.x, 1, 8, dt));
  }

  // ------------------------------------------------------------------ lamps: ignite and spread
  function ignite(L, { instant = false, quiet = false } = {}) {
    if (L.state !== 'dark') return;
    L.state = 'spark';
    const from = lantern.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.3, 0));
    if (instant) { light(L, { quiet }); return; }
    sparks.push({ L, from, t: 0, dur: 0.42 });
  }
  function light(L, { quiet = false } = {}) {
    L.state = 'lit'; L.t = 0;
    S.lit++;
    if (!quiet) {
      S.streak = S.streakT > 0 ? S.streak + 1 : 0; S.streakT = 7;
      ui.audio?.ignite(S.streak + L.d.index * 2);
      fx.burst(L.head, reduced ? 10 : 34);
      S.pulse = 1;
    }
    ui.lamp?.(S.lit, total, L);
    // the light spreads into nearby windows
    const near = town.buildings.map((b) => ({ b, d: Math.hypot(b.pos.x - L.x, b.pos.z - L.z) - Math.abs(b.pos.y - L.y) * 0.5 }))
      .filter((o) => o.d < 17 && Math.abs((o.b.row ?? 0) - L.row) <= 1).sort((a, b) => a.d - b.d);
    near.forEach(({ b, d }, i) => {
      later(quiet ? 0.05 : 0.35 + d * 0.06 + i * 0.05, () => {
        const v = clamp(0.4 + (17 - d) / 17 * 0.5, 0, 1);
        if (v > b.target) { b.target = v; if (!quiet && i < 6) ui.audio?.window(); }
      });
    });
    if (L.d.lamps.every((l) => l.state === 'lit') && !L.d.lit) later(quiet ? 0 : 0.6, () => revealDistrict(L.d, { quiet }));
    if (S.lit === total && S.mode === 'play') later(quiet ? 0 : 2.2, () => finish({ reason: 'done' }));
  }

  function revealDistrict(d, { quiet = false } = {}) {
    if (d.lit) return;
    d.lit = true; d.revealT = 0;
    d.buildings.forEach((b, i) => later((quiet ? 0.02 : 0.25) * i * 0.3 + Math.random() * 0.4, () => { b.target = Math.max(b.target, 0.85 + Math.random() * 0.15); }));
    drawScreen(d, latestFor(d.id));
    if (!quiet) {
      ui.audio?.district(d.index);
      fx.burst(d.signPos, reduced ? 12 : 60, { spread: 4, up: 3 });
      if (!reduced) S.focus = { point: d.signPos.clone(), t: 0, w: 0 };
    }
    // the townsfolk wave, then get on with their evening
    for (const n of npcs) {
      if (n.d !== d || n.done) continue;
      n.done = true;
      later(quiet ? 0 : 0.8 + Math.random() * 0.6, async () => {
        n.a.object.rotation.y = Math.atan2(pState.pos.x - n.home.x, pState.pos.z - n.home.z);
        n.a.detach('phone'); n.a.setLights(0);
        if (!quiet) await n.a.once('wave', n.after);
        else n.a.play(n.after, 0.3);
        if (n.prop) { await n.a.attach(n.prop); }
        if (n.after === 'walk_carry') n.walking = true;
        if (n.after === 'idle' && n.a.name === 'dog_walker') { dog.play('walk', 0.3); n.walking = true; }
      });
    }
    ui.district?.(d);
  }

  // ------------------------------------------------------------------ landmark screens
  let feedLatest = {};
  function latestFor(id) { return feedLatest[id] || null; }
  function drawScreen(d, ev) {
    const p = d.product; if (!p) return;
    const g = d.screen.canvas.getContext('2d');
    const W = 512, H = 288;
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1c2350'); bg.addColorStop(1, '#10152f');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,210,122,.35)'; g.lineWidth = 2; g.strokeRect(10, 10, W - 20, H - 20);
    const col = { live: '#7fc8a9', building: '#d9a42b', paused: '#a9b4cc' }[p.status] || '#a9b4cc';
    g.fillStyle = col; g.beginPath(); g.arc(34, 40, 6, 0, Math.PI * 2); g.fill();
    g.font = '600 15px "Instrument Sans", system-ui, sans-serif'; g.fillStyle = col;
    g.fillText(p.status.toUpperCase(), 48, 45);
    g.font = '30px Federo, serif'; g.fillStyle = '#f4eadb';
    g.fillText(p.name.toUpperCase(), 26, 92);
    if (p.figure) {
      g.font = '86px "Poiret One", serif'; g.fillStyle = '#ffd27a';
      g.fillText(p.figure.value, 24, 186);
      const w = g.measureText(p.figure.value).width;
      g.font = '500 20px "Instrument Sans", system-ui, sans-serif'; g.fillStyle = '#f2b5b8';
      g.fillText(p.figure.label, 34 + w, 184);
    }
    g.font = '18px "Instrument Sans", system-ui, sans-serif'; g.fillStyle = 'rgba(244,234,219,.82)';
    const line = ev ? `${ev.text}${ev.demo ? '  (demo)' : ''}` : p.line;
    g.fillText(line.length > 46 ? line.slice(0, 45) + '…' : line, 26, 246);
    d.screen.tex.needsUpdate = true;
  }

  // ------------------------------------------------------------------ flow
  function start() {
    if (S.mode !== 'idle') return;
    S.mode = 'intro';
    S.skyTarget = Math.max(S.sky, PLAY_FROM);
    tweenTo(() => followPose(poseTmp), 3.6, () => {
      S.mode = 'play'; S.started = S.time; S.sky = Math.max(S.sky, PLAY_FROM); S.skyTarget = null;
      ui.playing?.();
    });
  }

  function finish({ reason = 'done' } = {}) {
    if (S.mode === 'finale') return;
    const was = S.mode;
    S.mode = 'finale'; S.finishedAt = S.time; S.focus = null;
    pState.route = null; keys.clear(); joy.x = joy.y = 0;
    const byHand = S.lit;
    S.auto = reason !== 'done';
    // light whatever is left, rolling outwards from the lamplighter
    const rest = lamps.filter((l) => l.state === 'dark').sort((a, b) => a.obj.position.distanceTo(pState.pos) - b.obj.position.distanceTo(pState.pos));
    const gap = reason === 'skip' ? 0.05 : 0.14;
    rest.forEach((L, i) => later(i * gap, () => { L.state = 'dark'; ignite(L, { instant: true, quiet: reason === 'skip' }); if (reason !== 'skip') fx.burst(L.head, 14); }));
    // then every window in town, a wave down from the church
    const summit = new THREE.Vector3(0, rowY(TOP), rowFront(TOP) - 10);
    later(rest.length * gap + 0.4, () => {
      ui.audio?.bell();
      for (const d of districts) if (!d.lit) revealDistrict(d, { quiet: true });
      for (const b of town.buildings) later(b.pos.distanceTo(summit) * (reason === 'skip' ? 0.008 : 0.03), () => { b.target = 1; });
    });
    if (S.sky < 0.62) S.skyTarget = 0.7;
    tweenTo(() => (camera.aspect < 0.8 ? FINALE_TALL : FINALE), was === 'idle' ? 0.001 : 5.5);
    ui.finish?.({ lit: byHand, total, seconds: Math.round(S.time - (S.started || S.time)), reason });
  }

  // ------------------------------------------------------------------ frame
  const markerFor = new Set();
  let last = performance.now(), frames = 0, slow = 0, raf = 0, visible = true;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible || S.paused) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt);
    composer.render();
    // adapt quality if frames are slow
    frames++;
    if (frames > 90 && frames < 400 && !params.shot) {
      slow = slow * 0.95 + (dt > 0.026 ? 1 : 0) * 0.05;
      if (frames % 90 === 0 && slow > 0.5) {
        if (quality.dpr > 1) { quality.dpr = Math.max(1, quality.dpr - 0.25); resize(); }
        else if (bloom.enabled) bloom.enabled = false;
        else if (sun.castShadow) { renderer.shadowMap.autoUpdate = false; }
        slow = 0;
      }
    }
  }

  function step(dt) {
    S.time += dt;
    // the sky is the timer
    if (S.mode === 'play' && !params.freeze) {
      S.sky = Math.min(1, S.sky + dt / DURATION); // about 2.5 minutes of play from PLAY_FROM
      if (S.sky >= 1) finish({ reason: 'night' });
    } else if (S.skyTarget != null) {
      S.sky = damp(S.sky, S.skyTarget, S.mode === 'intro' ? 1.4 : 0.5, dt);
    }
    applySky(S.sky);

    // scheduled events
    for (let i = queue.length - 1; i >= 0; i--) if (queue[i].at <= S.time) { const q = queue.splice(i, 1)[0]; q.fn(); }

    updatePlayer(dt);
    S.streakT -= dt; S.pulse = damp(S.pulse, 0, 4, dt);

    // proximity ignition
    if (S.mode === 'play') {
      for (const L of lamps) {
        if (L.state !== 'dark') continue;
        if (Math.abs(pState.pos.y - L.y) > 1.3) continue;
        if (Math.hypot(pState.pos.x - L.x, pState.pos.z - L.z) < 2.5) ignite(L);
      }
    }
    // flames in flight
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.t += dt;
      const k = clamp(s.t / s.dur, 0, 1), e = 1 - Math.pow(1 - k, 2);
      tv.lerpVectors(s.from, s.L.head, e); tv.y += Math.sin(k * Math.PI) * 1.1;
      fx.emit({ x: tv.x, y: tv.y, z: tv.z, vx: (Math.random() - 0.5) * 0.4, vy: 0.2, vz: (Math.random() - 0.5) * 0.4, max: 0.35, s: 0.22, grav: 0, drag: 3, r: 1, g: 0.8, b: 0.45 });
      if (k >= 1) { sparks.splice(i, 1); light(s.L); }
    }

    // lamps
    const tNow = S.time;
    for (const L of lamps) {
      if (L.state === 'lit') {
        L.t += dt;
        // overshoot, settle, flicker like a gas mantle
        const ign = L.t < 0.5 ? smooth(0, 0.12, L.t) * (1 + 0.9 * (1 - smooth(0.12, 0.5, L.t))) : 1;
        const flick = 1 + Math.sin(tNow * 13 + L.seed) * 0.03 + Math.sin(tNow * 31 + L.seed * 3) * 0.02;
        L.k = ign * flick;
        L.mat.emissiveIntensity = 1.5 * L.k;
        L.pool.material.opacity = 0.5 * Math.min(1, L.k) * (0.55 + S.night * 0.45);
        L.pool.scale.setScalar(0.6 + 0.4 * smooth(0, 0.8, L.t));
        L.halo.material.opacity = 0.6 * L.k * (0.55 + S.night * 0.45);
        L.core.material.opacity = Math.min(1, 0.85 * L.k);
        L.cone.material.uniforms.uOpacity.value = 0.42 * Math.min(1.3, L.k) * (0.25 + S.night * 0.75);
      } else {
        // a faint pilot light so you can find them in the dusk
        const pilot = S.mode === 'play' || S.mode === 'intro' ? 0.12 + 0.08 * Math.sin(tNow * 3 + L.seed) : 0;
        L.mat.emissiveIntensity = pilot * 0.5;
        L.halo.material.opacity = pilot * 0.4;
        L.core.material.opacity = pilot * 0.6;
        L.cone.material.uniforms.uOpacity.value = 0;
      }
      // markers over the lamps of the district you are in (and the next)
      const want = S.mode === 'play' && L.state === 'dark' && (L.d.index <= currentDistrict() + 0) ? 1 : 0;
      L.mark.material.opacity = damp(L.mark.material.opacity, want * 0.95, 5, dt);
      L.mark.position.y = L.head.y + 1.0 + Math.sin(tNow * 2.4 + L.seed) * 0.12;
    }

    // building windows ease toward their targets, a group at a time
    for (const b of town.buildings) {
      if (Math.abs(b.target - b.cur) > 0.002) {
        b.cur = damp(b.cur, b.target, b.rate || 2.2, dt);
        if (Math.abs(b.target - b.cur) <= 0.002) b.rate = 0;
        b.setLights(b.cur, WIN);
      }
    }
    // after the finale: the town lives. windows go off and on, one at a time
    // during the game too: once a district is lit, its people move from room to room
    const living = S.mode === 'finale' ? S.time - S.finishedAt > 9 : S.mode === 'play' && S.night > 0.15;
    if (living && Math.random() < dt * (S.mode === 'finale' ? 1.6 : 0.9)) {
      const pool = S.mode === 'finale' ? town.buildings : town.buildings.filter((b) => b.district.lit && b.target > 0.2);
      const b = pool[Math.floor(Math.random() * pool.length)];
      if (b && b.name !== 'church') { const v = b.target; b.target = v > 0.7 ? 0.3 + Math.random() * 0.3 : 1; b.rate = 16; }
    }

    // landmarks: sign flickers on like neon, then the windows
    for (const d of districts) {
      if (d.revealT < 0) continue;
      d.revealT += dt;
      const t = d.revealT;
      const neon = t < 0.08 ? 1 : t < 0.16 ? 0.1 : t < 0.26 ? 1 : t < 0.32 ? 0.3 : smooth(0.32, 0.6, t);
      for (const m of d.lmMats) {
        const on = m.userData.on;
        m.emissiveIntensity = /sign|marquee/.test(m.name) ? neon * on : smooth(0.4, 1.6, t) * on;
      }
      d.screen.mat.color.setScalar(smooth(0.6, 1.4, t));
    }

    // townsfolk, the waiter's rounds, the dog
    for (const n of npcs) {
      if (!n.walking) continue;
      const k = S.time * 0.25 + n.home.x;
      const x = n.home.x + Math.sin(k) * 3.5;
      const prev = n.a.object.position.x;
      n.a.object.position.x = x;
      n.a.object.rotation.y = x > prev ? Math.PI / 2 : -Math.PI / 2;
      if (n.a.name === 'dog_walker') { dog.object.position.set(x + (x > prev ? 1.1 : -1.1), n.home.y, n.home.z + 0.5); dog.object.rotation.y = n.a.object.rotation.y; }
    }
    folk.update(dt);

    if (vanFollow) {
      const vp = van.root.position;
      const near = Math.hypot(vp.x - pState.pos.x, vp.z - pState.pos.z) < 6 && pState.pos.y < 1;
      vanFollow.speed = damp(vanFollow.speed, near ? 0 : 7.5, 3, dt);
      vanFollow.update(dt);
      van.setLights(smooth(0.15, 0.5, S.sky));
    }

    // real point lights follow the lamps nearest the lamplighter
    const litNear = lamps.filter((l) => l.state === 'lit').sort((a, b) => (Math.hypot(a.x - cam.look.x, a.z - cam.look.z)) - (Math.hypot(b.x - cam.look.x, b.z - cam.look.z))).slice(0, poolLights.length);
    poolLights.forEach((pl, i) => {
      const L = litNear[i];
      if (!L) { pl.intensity = damp(pl.intensity, 0, 6, dt); return; }
      if (pl.userData.lamp !== L) { pl.userData.lamp = L; pl.intensity = 0; pl.position.copy(L.head).y -= 0.25; }
      pl.intensity = damp(pl.intensity, 9 * L.k * (0.4 + S.night * 0.6), 4, dt);
    });

    // focus pull after a district lights
    if (S.focus) {
      S.focus.t += dt;
      S.focus.w = smooth(0, 0.9, S.focus.t) * (1 - smooth(3.2, 4.6, S.focus.t));
      if (S.focus.t > 4.6) S.focus = null;
    }

    fx.update(dt);
    sea.uniforms.uTime.value = sky.uniforms.uTime.value = S.time;
    {
      const hl = hillLights.mat.uniforms; hl.uTime.value = S.time;
      const want = S.mode === 'finale' ? (S.time - S.finishedAt > 1.5 ? 1.05 : hl.uOn.value) : S.night * 0.75 + (S.lit / total) * 0.3;
      hl.uOn.value = damp(hl.uOn.value, want, S.mode === 'finale' ? 0.35 : 0.8, dt);
    }
    sea.uniforms.uLit.value = S.lit / total * 0.6 + (S.mode === 'finale' ? 0.4 : 0);

    updateCamera(dt);

    // shadows follow the lamplighter
    if (sun.castShadow) {
      const c = S.mode === 'finale' || S.mode === 'idle' ? cam.look : pState.pos;
      sun.target.position.copy(c);
      sun.position.copy(c).addScaledVector(sun.userData.dir.y > 0.02 ? sun.userData.dir : tv.set(sun.userData.dir.x, 0.06, sun.userData.dir.z).normalize(), 90);
      renderer.shadowMap.autoUpdate = S.elev > -1.5;
      if (!renderer.shadowMap.autoUpdate && !S.shadowCleared) { renderer.shadowMap.needsUpdate = true; S.shadowCleared = true; }
    }

    // x-ray hole around the lamplighter
    if (S.mode === 'play' || (S.mode === 'intro' && !cam.tween)) {
      const head = tv.copy(pState.pos); head.y += 1.0;
      const dist = camera.position.distanceTo(head);
      head.project(camera);
      const size = renderer.getDrawingBufferSize(tv2);
      XR.uHole.value.set((head.x * 0.5 + 0.5) * size.x, (head.y * 0.5 + 0.5) * size.y, size.y * (camera.aspect < 0.8 ? 0.1 : 0.12));
      XR.uHoleY.value = pState.pos.y; XR.uHoleDist.value = dist;
    } else XR.uHole.value.z = 0;

    // HUD pointer to the nearest unlit lamp when it is off screen
    if (S.mode === 'play') {
      let best = null, bd = Infinity;
      for (const L of lamps) {
        if (L.state !== 'dark') continue;
        const d = Math.hypot(L.x - pState.pos.x, L.z - pState.pos.z) + Math.abs(L.y - pState.pos.y) * 6;
        if (d < bd) { bd = d; best = L; }
      }
      if (best) {
        const s = toScreen(best.head, {});
        const r = canvas.getBoundingClientRect();
        const off = s.z > 1 || s.x < r.left + 30 || s.x > r.right - 30 || s.y < r.top + 70 || s.y > r.bottom - 30;
        ui.arrow?.({ on: off, x: s.x, y: s.y, behind: s.z > 1, dist: Math.round(bd) });
      } else ui.arrow?.({ on: false });
    } else ui.arrow?.({ on: false });
  }

  function currentDistrict() {
    const d = districts.find((d) => !d.lit);
    return d ? d.index : 3;
  }

  // ------------------------------------------------------------------ shots for headless review
  function stage(shot) {
    if (params.freeze == null) params.freeze = '1';
    if (shot === 'play' || shot === 'lamp' || shot === 'district' || shot === 'mid') {
      S.mode = 'play'; cam.tween = null; cam.init = false;
      if (params.t == null) S.sky = PLAY_FROM;
      const n = shot === 'district' ? 4 : shot === 'mid' ? 9 : shot === 'lamp' ? 2 : +(params.lit || 0);
      lamps.slice(0, n).forEach((L) => { L.state = 'dark'; ignite(L, { instant: true, quiet: shot !== 'lamp' && shot !== 'district' }); });
      if (n) { const L = lamps[n - 1]; pState.pos.set(L.x + 1.5, L.y, L.row === 0 ? L.z + 1.6 : walk.laneZ(L.row)); }
      if (params.at) { const [x, z] = params.at.split(',').map(Number); const s = walk.snap(x, +(params.y || 0), z); if (s) pState.pos.set(s.x, s.y, s.z); }
      for (const b of town.buildings) { b.cur = b.target; b.setLights(b.cur, WIN); }
    }
    if (shot === 'final') { finish({ reason: 'skip' }); S.sky = 0.7; }
    if (shot === 'fly') start();
    if (shot === 'walk') {
      // walk from the start toward a lamp (default: the first lamp up the hill) to test routes and stairs
      S.mode = 'play'; cam.init = false;
      const L = lamps[+(params.lamp ?? 4)];
      const t = walk.snap(L.x + 0.6, L.y, L.row === 0 ? L.z + 1.6 : walk.laneZ(L.row));
      pState.route = walk.route(pState.pos, t);
      window.__log?.('route ' + JSON.stringify(pState.route.map((p) => p.map((v) => +v.toFixed(1)))));
    }
    if (params.debug) {
      window.__log?.('stairs ' + town.stairs.map((s) => `${s.from}->${s.to}@${s.x}`).join(' '));
      window.__log?.('landmarks ' + districts.map((d) => `${d.id}@${d.lmPos.x.toFixed(1)},${d.lmPos.z.toFixed(1)}`).join(' '));
    }
    // headless renders are slow: run the clock forward so scheduled lights have happened
    const n = +(params.sim ?? 200);
    for (let i = 0; i < n; i++) step(1 / 30);
  }

  // ------------------------------------------------------------------ api
  applySky(S.sky);
  updateCamera(0);
  if (params.shot) stage(params.shot);
  raf = requestAnimationFrame(frame);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) visible = false; else visible = true; });

  return {
    start,
    skip: () => finish({ reason: 'skip' }),
    get state() { return S; },
    get total() { return total; },
    districts,
    setFeed(latest) { feedLatest = latest; for (const d of districts) if (d.lit) drawScreen(d, latestFor(d.id)); },
    redrawScreens() { for (const d of districts) drawScreen(d, d.lit ? latestFor(d.id) : null); },
    pause(v) { S.paused = v; },
    debug: { scene, camera, town, walk, lamps, pState, renderer },
  };
}
