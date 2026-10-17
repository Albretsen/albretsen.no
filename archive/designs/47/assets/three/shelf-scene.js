// Albretsen AS / design 47 "Stille": the shelf scene.
// Built only from primitives (rounded boxes, planes, one cube) and lit like a
// Hammershøi room: one window, daylight falling diagonally across a plaster wall.
// Used two ways:
//   1. bake.html renders it with accumulated soft shadows into the hero/product stills.
//   2. shelf-live.js keeps it live in the browser (drag tiles along the shelf).
// Needs an import map for "three" and "three/addons/" (three@0.170.0).

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const PALETTE = {
  paper: '#f3f2f6', paper2: '#e7e5eb', stone: '#bfbcc4', dust: '#87848e',
  ink2: '#56535d', ink: '#19161f', aniline: '#7c44c3',
  wall: '#c9c6cb', shelf: '#eeecf1', plaster: '#e6e3e9',
};

const ASSETS = new URL('../', import.meta.url);
const url = (p) => new URL(p, ASSETS).href;

// Real product logos are drawn untouched onto the tile face. Only the tile body takes the logo's own background colour.
export const ITEMS = {
  'mcp-emails':   { name: 'MCP Emails', kind: 'live', src: 'products/real/mcp-emails-icon.png', bg: '#2547E5', fit: 1 },
  'fun-libs':     { name: 'Fun Libs', kind: 'live', src: 'products/real/fun-libs-icon.png', bg: '#FFE066', fit: 1 },
  'toolrails':    { name: 'Toolrails', kind: 'live', src: 'products/real/toolrails-icon.svg', bg: '#141413', fit: 1 },
  'harbor':       { name: 'Harbor', kind: 'live', src: 'products/real/harbor-mark.svg', color: '#F1EEE8', bg: '#1c1c1c', fit: 0.8 },
  'luma':         { name: 'Luma', kind: 'archived', src: 'products/real/luma-logo.png', bg: '#ffffff', fit: 0.7 },
  'polyglot-pilot': { name: 'Polyglot Pilot', kind: 'plaster', src: 'retired/polyglot-pilot.svg' },
  'pinpoint':     { name: 'PinPoint', kind: 'plaster', src: 'retired/pinpoint.svg' },
  'webvakt':      { name: 'WebVakt', kind: 'plaster', src: 'retired/webvakt.svg' },
  'joke-central': { name: 'Joke Central', kind: 'plaster', src: 'retired/joke-central.svg' },
  'tryggere-hyring': { name: 'Tryggere Hyring', kind: 'plaster', src: 'retired/tryggere-hyring.svg' },
  'early-apps':   { name: 'Early apps', kind: 'plaster', src: 'retired/early-apps.svg' },
};

const TILE = 0.42, DEPTH = 0.05, RADIUS = 0.094, BEVEL = 0.007;

// An app-icon slab: rounded-square outline extruded thin, with a small bevel.
// Groups: 0 = front/back caps (UVs remapped so the logo fills the face), 1 = sides.
let _tileGeo;
function tileGeometry() {
  if (_tileGeo) return _tileGeo;
  const s = TILE / 2 - BEVEL, r = RADIUS - BEVEL, sh = new THREE.Shape();
  sh.moveTo(-s + r, -s); sh.lineTo(s - r, -s); sh.quadraticCurveTo(s, -s, s, -s + r);
  sh.lineTo(s, s - r); sh.quadraticCurveTo(s, s, s - r, s); sh.lineTo(-s + r, s);
  sh.quadraticCurveTo(-s, s, -s, s - r); sh.lineTo(-s, -s + r); sh.quadraticCurveTo(-s, -s, -s + r, -s);
  const core = DEPTH - BEVEL * 2;
  const g = new THREE.ExtrudeGeometry(sh, { depth: core, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 4, curveSegments: 18 });
  g.translate(0, 0, -core / 2);
  const pos = g.attributes.position, uv = g.attributes.uv;
  const cap = g.groups[0];
  for (let i = cap.start; i < cap.start + cap.count; i++) uv.setXY(i, (pos.getX(i) + TILE / 2) / TILE, (pos.getY(i) + TILE / 2) / TILE);
  return (_tileGeo = g);
}

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
async function svgWithColor(path, color) {
  const txt = await (await fetch(url(path))).text();
  const blob = new Blob([txt.replaceAll('currentColor', color)], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}
async function faceCanvas(item, size = 1024) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const src = item.color ? await svgWithColor(item.src, item.color) : url(item.src);
  const img = await loadImage(src);
  if (item.kind === 'plaster') {
    g.fillStyle = PALETTE.paper2; g.fillRect(0, 0, size, size);
    g.drawImage(img, 0, 0, size, size);
  } else {
    g.fillStyle = item.bg; g.fillRect(0, 0, size, size);
    const ar = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
    let w = size * item.fit, h = w / ar; if (h > size * item.fit) { h = size * item.fit; w = h * ar; }
    g.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  }
  return c;
}

function noiseCanvas(size, scale, seed = 1) {
  // value noise, a few octaves: plaster tooth for the wall
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const id = g.createImageData(size, size);
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const grids = [8, 32, 128, 512].map((n) => { const a = new Float32Array((n + 1) * (n + 1)); for (let i = 0; i < a.length; i++) a[i] = rnd();
    for (let i = 0; i <= n; i++) { a[i * (n + 1) + n] = a[i * (n + 1)]; a[n * (n + 1) + i] = a[i]; } // wrap: tileable
    return { n, a }; });
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0, amp = 0.5, tot = 0;
    for (const { n, a } of grids) {
      const fx = x / size * n, fy = y / size * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const i0 = iy * (n + 1) + ix;
      const top = a[i0] + (a[i0 + 1] - a[i0]) * sx, bot = a[i0 + n + 1] + (a[i0 + n + 2] - a[i0 + n + 1]) * sx;
      v += (top + (bot - top) * sy) * amp; tot += amp; amp *= scale;
    }
    v /= tot; const p = (y * size + x) * 4, b = Math.round(v * 255);
    id.data[p] = id.data[p + 1] = id.data[p + 2] = b; id.data[p + 3] = 255;
  }
  g.putImageData(id, 0, 0); return c;
}

export async function makeTile(id, renderer) {
  const item = ITEMS[id];
  const geo = tileGeometry();
  const face = new THREE.CanvasTexture(await faceCanvas(item));
  face.colorSpace = THREE.SRGBColorSpace;
  face.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 4;
  let side, front;
  if (item.kind === 'plaster') {
    const bump = new THREE.CanvasTexture(face.image);
    side = new THREE.MeshStandardMaterial({ color: PALETTE.plaster, roughness: 0.96 });
    front = new THREE.MeshStandardMaterial({ map: face, bumpMap: bump, bumpScale: 2.2, roughness: 0.95 });
  } else {
    // glazed ceramic: the live products carry their real colour
    const base = { roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3, envMapIntensity: 0.35 };
    side = new THREE.MeshPhysicalMaterial({ ...base, color: item.bg });
    front = new THREE.MeshPhysicalMaterial({ ...base, map: face });
  }
  const mesh = new THREE.Mesh(geo, [front, side]);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { id, ...item };
  return mesh;
}

// Layouts. x along the shelf, lean = tilt back toward the wall (radians), yaw = small turn.
export const LAYOUTS = {
  hero: [
    ['pinpoint', -0.35, { lean: 0.1 }], ['mcp-emails', 0.17, {}], ['fun-libs', 0.66, { yaw: -0.05 }],
    ['@cube', 1.05, {}], ['toolrails', 1.42, { yaw: 0.04 }], ['harbor', 1.93, { lean: 0.11 }],
    ['@stack', 2.5, { ids: ['webvakt', 'early-apps', 'joke-central'] }], ['luma', 3.02, { lean: 0.08, yaw: -0.06 }],
  ],
  detail: [['mcp-emails', -0.52, {}], ['fun-libs', -0.02, { yaw: -0.05 }], ['@cube', 0.38, {}], ['toolrails', 0.76, { yaw: 0.04 }], ['harbor', 1.27, { lean: 0.11 }]],
  retired: [
    ['polyglot-pilot', -1.1, { lean: 0.09 }], ['pinpoint', -0.62, {}], ['webvakt', -0.13, { yaw: 0.05 }],
    ['@stack', 0.42, { ids: ['joke-central', 'early-apps'] }], ['tryggere-hyring', 0.95, { lean: 0.1 }], ['luma', 1.45, { yaw: -0.05 }],
  ],
  live: [
    ['mcp-emails', -1.1, {}], ['fun-libs', -0.6, {}], ['@cube', -0.22, {}], ['toolrails', 0.16, {}], ['harbor', 0.66, {}],
    ['luma', 1.16, {}], ['pinpoint', 1.66, {}],
  ],
};
for (const id of ['mcp-emails', 'fun-libs', 'toolrails', 'harbor']) LAYOUTS['product-' + id] = [[id, 0, { yaw: -0.07 }]];

export const CAMERAS = {
  hero: { fov: 24, pos: [-0.2, 1.05, 7.2], look: [1.0, 0.55, 0] },
  detail: { fov: 24, pos: [0.05, 0.16, 2.9], look: [0.4, 0.22, 0] },
  retired: { fov: 26, pos: [0.1, 0.5, 4.3], look: [0.2, 0.22, 0] },
  live: { fov: 28, pos: [0.2, 0.55, 4.6], look: [0.25, 0.22, 0] },
  object: { fov: 24, pos: [0.36, 0.56, 2.15], look: [0, 0.2, 0.17] },
  cube: { fov: 24, pos: [0.12, 0.2, 0.55], look: [0, 0.045, 0.17] },
  product: { fov: 22, pos: [0.55, 0.5, 2.55], look: [0.02, 0.3, 0] },
};

export async function buildScene({ renderer, view = 'hero', aspect = 16 / 9, background = null }) {
  const isObject = view.startsWith('object-');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background || PALETTE.wall);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;

  // wall, plaster tooth
  if (!isObject) {
  const n = noiseCanvas(512, 0.55, 7);
  const bump = new THREE.CanvasTexture(n); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(9, 5);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({ color: PALETTE.wall, roughness: 1, bumpMap: bump, bumpScale: 0.35 }));
  wall.position.set(0.5, 1.2, 0); wall.receiveShadow = true; scene.add(wall);
  // skirting floor far below (catches bounce)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshStandardMaterial({ color: '#b9b4bd', roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0.5, -1.6, 3); floor.receiveShadow = true; scene.add(floor);
  }

  // the shelf: one long, thin, floating board
  const isProduct = view.startsWith('product');
  const shelfLen = view === 'hero' ? 5.2 : isProduct ? 1.6 : 4.2;
  const shelfX = view === 'hero' ? 1.15 : isProduct ? 0 : 0.2;
  const shelf = new THREE.Mesh(new RoundedBoxGeometry(shelfLen, 0.036, 0.3, 2, 0.01), new THREE.MeshStandardMaterial({ color: PALETTE.shelf, roughness: 0.62 }));
  shelf.position.set(shelfX, -0.018, 0.15); shelf.castShadow = shelf.receiveShadow = true;
  if (isObject) {
    // cut-out objects: only a shadow catcher (bake renders on black + white and difference-mattes the alpha)
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.42 }));
    catcher.rotation.x = -Math.PI / 2; catcher.receiveShadow = true; scene.add(catcher);
  } else scene.add(shelf);

  const tiles = [];
  const layout = isObject ? [[view.slice(7) === 'cube' ? '@cube' : view.slice(7), 0, { yaw: -0.42 }]] : (LAYOUTS[view] || LAYOUTS.hero);
  for (const [id, x, o] of layout) {
    if (id === '@cube') {
      const s = 0.1;
      const cube = new THREE.Mesh(new RoundedBoxGeometry(s, s, s, 3, 0.006), new THREE.MeshPhysicalMaterial({ color: PALETTE.aniline, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 }));
      cube.position.set(x, s / 2, 0.17); cube.rotation.y = 0.32; cube.castShadow = cube.receiveShadow = true;
      cube.userData = { id: 'aniline-cube' };
      scene.add(cube); tiles.push(cube); continue;
    }
    if (id === '@stack') {
      let y = 0;
      for (const [i, sid] of o.ids.entries()) {
        const t = await makeTile(sid, renderer);
        t.rotation.x = -Math.PI / 2; t.rotation.z = (i % 2 ? 0.09 : -0.06) * (i + 1);
        t.position.set(x + (i % 2 ? 0.015 : -0.01), y + DEPTH / 2, 0.16);
        y += DEPTH + 0.001; scene.add(t); tiles.push(t);
      }
      continue;
    }
    const t = await makeTile(id, renderer);
    const lean = o.lean || 0;
    // pivot about the bottom back edge so a leaning tile rests on the shelf and touches the wall
    t.position.set(x, TILE / 2 * Math.cos(lean) + DEPTH / 2 * Math.sin(lean), 0.17 - TILE / 2 * Math.sin(lean));
    t.rotation.set(-lean, o.yaw || 0, 0, 'YXZ');
    scene.add(t); tiles.push(t);
  }

  // daylight through a window (the window itself is never seen, only its light)
  const key = new THREE.DirectionalLight('#fffaf3', 5.2);
  key.position.set(-5.6, 3.1, 3.0); key.target.position.set(0.6, 0.2, 0);
  key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01;
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 30 }); key.shadow.camera.updateProjectionMatrix();
  scene.add(key, key.target);

  const win = new THREE.Group();
  const occ = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const box = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), occ); m.position.set(x, y, 0); m.castShadow = true; win.add(m); };
  const W = 1.5, H = 2.3; // opening
  box(20, 40, -10 - W / 2, 0); box(20, 40, 10 + W / 2, 0); box(W, 20, 0, 10 + H / 2); box(W, 20, 0, -10 - H / 2);
  box(0.07, H, 0, 0); box(W, 0.07, 0, 0.42);
  const dir = key.position.clone().sub(key.target.position).normalize();
  const anchor = view === 'hero' ? new THREE.Vector3(1.3, 0.75, 0) : view.startsWith('product') ? new THREE.Vector3(-0.15, 0.55, 0) : new THREE.Vector3(0.1, 0.6, 0);
  win.position.copy(anchor).addScaledVector(dir, 5.2);
  win.lookAt(key.position.clone().add(anchor).sub(key.target.position));
  if (!isObject) scene.add(win);

  scene.add(new THREE.HemisphereLight('#e6e2f0', '#8f8a94', 0.42));
  // a second, broad shadow-casting fill; bake.js scatters it over the front hemisphere (soft contact shadows)
  const fill = new THREE.DirectionalLight('#e9e6f5', 0.7);
  fill.position.set(0.6, 2.2, 4); fill.target.position.set(0.4, 0.2, 0);
  fill.castShadow = true; fill.shadow.mapSize.set(2048, 2048); fill.shadow.bias = -0.0005; fill.shadow.normalBias = 0.01;
  Object.assign(fill.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 }); fill.shadow.camera.updateProjectionMatrix();
  scene.add(fill, fill.target);

  const camDef = CAMERAS[isProduct ? 'product' : isObject ? (view === 'object-cube' ? 'cube' : 'object') : view] || CAMERAS.hero;
  const camera = new THREE.PerspectiveCamera(camDef.fov, aspect, 0.05, 50);
  camera.position.set(...camDef.pos); camera.lookAt(...camDef.look);

  if (isObject) { // cut-outs: higher sun, short soft shadow that stays inside the frame
    key.position.set(-2.4, 5.2, 3.4); key.intensity = 4.4; fill.castShadow = false; fill.intensity = 0.9;
  }
  const keyBase = key.position.clone();
  const fillBase = fill.position.clone();
  // jitter(i): soft window penumbra + sky-ish fill from many directions (used only when baking)
  function jitter(i, n) {
    const r1 = ((i * 0.618034) % 1), r2 = ((i * 0.754878) % 1);
    const a = r1 * Math.PI * 2, rr = Math.sqrt(r2);
    key.position.copy(keyBase).add(new THREE.Vector3(Math.cos(a) * rr * 0.22, Math.sin(a) * rr * 0.22, 0));
    const th = r1 * Math.PI * 2, ph = Math.acos(1 - r2 * 0.9);
    if (isObject) { key.position.add(new THREE.Vector3(Math.cos(a) * rr * 0.9, 0, Math.sin(a) * rr * 0.9)); return; }
    fill.position.set(Math.sin(ph) * Math.cos(th) * 4 + 0.4, Math.cos(ph) * 2.5 + 0.3, Math.abs(Math.sin(ph) * Math.sin(th)) * 3 + 1.2);
  }
  return { scene, camera, key, fill, tiles, jitter, shelf };
}
