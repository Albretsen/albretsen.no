// planet3d.js — "Pocket Planet" isometric voxel globe of activity.
// Self-contained three.js module. Host page needs this import map (three@0.170.0):
//   <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
//
//   import { mountPlanet } from './planet3d.js'
//   const p = await mountPlanet(canvas, { scene: 'hero', interactive: true })
//   p.dispose()
//
// scenes: 'hero' (whole planet + ring + cursor), 'surface' (zoomed horizon),
//         'planet' (planet only), 'product:<id>' (isometric plinth framing a real product logo)
// options: { transparent, pixelRatio, interactive, bloom, still, base }
//   still: render one frame, resolve, set window.__planetReady = true (used for baking stills)
//   base:  URL prefix to this folder (default: resolved from import.meta.url)

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const PALETTE = {
  void: 0x05080c, ink: 0x080e15, deep: 0x0e1721, rim: 0x1c2735, slate: 0x3c4958,
  fog: 0x798898, mist: 0xcad2db, paper: 0xeef2f7, volt: 0x0790ff, voltHi: 0x80bcff,
};

// ---------- tiny deterministic helpers ----------
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash3(x, y, z) { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const s = t => t * t * (3 - 2 * t); const u = s(xf), v = s(yf), w = s(zf);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return l(l(l(c(0,0,0), c(1,0,0), u), l(c(0,1,0), c(1,1,0), u), v), l(l(c(0,0,1), c(1,0,1), u), l(c(0,1,1), c(1,1,1), u), v), w);
}
function fbm(x, y, z) { let a = 0, f = 1, amp = 0.5; for (let i = 0; i < 4; i++) { a += amp * vnoise(x * f, y * f, z * f); f *= 2.03; amp *= 0.5; } return a; }

const ISO_EL = Math.atan(1 / Math.SQRT2); // 35.264°

function applyFrustum(cam, aspect) {
  const f = cam.userData.frustum, sx = (cam.userData.shiftX || 0) * f * aspect, sy = (cam.userData.shiftY || 0) * f;
  cam.left = -f * aspect - sx; cam.right = f * aspect - sx; cam.top = f - sy; cam.bottom = -f - sy; cam.updateProjectionMatrix();
}
function isoCamera(aspect, frustum, shiftX = 0, shiftY = 0) {
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
  cam.userData.shiftX = shiftX; cam.userData.shiftY = shiftY;
  const d = 120; cam.position.set(d * Math.cos(ISO_EL) * Math.sin(Math.PI / 4), d * Math.sin(ISO_EL), d * Math.cos(ISO_EL) * Math.cos(Math.PI / 4));
  cam.lookAt(0, 0, 0); cam.userData.frustum = frustum; applyFrustum(cam, aspect); return cam;
}

function lights(scene, env) {
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x16263a, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(-6, 60, 34); scene.add(key);
  const fill = new THREE.DirectionalLight(0x8fb0ff, 1.1); fill.position.set(60, 4, -10); scene.add(fill);
  const rim = new THREE.DirectionalLight(0x0790ff, 3.0); rim.position.set(-30, -6, -60); scene.add(rim);
  if (env) scene.environment = env;
}

// ---------- the planet ----------
// A voxel cube-sphere: every block is axis-aligned so the whole world stays truly isometric.
function domAxis(x, y, z) { const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z); return ax >= ay && ax >= az ? new THREE.Vector3(Math.sign(x), 0, 0) : ay >= az ? new THREE.Vector3(0, Math.sign(y), 0) : new THREE.Vector3(0, 0, Math.sign(z)); }
function buildPlanet(tex, { R = 17, seed = 7, loose = null } = {}) {
  const group = new THREE.Group();
  const rand = rng(seed);
  const cells = []; const towers = [];
  const off = seed * 3.17;
  for (let x = -R - 4; x <= R + 4; x++) for (let y = -R - 4; y <= R + 4; y++) for (let z = -R - 4; z <= R + 4; z++) {
    const d = Math.hypot(x, y, z); if (d < R - 1.8 || d > R + 4) continue;
    const n = fbm(x / d * 1.25 + off, y / d * 1.25 + 3, z / d * 1.25 + 5);
    const h = Math.max(0, Math.min(3, Math.floor((n - 0.46) * 24)));
    if (d > R + h) continue;
    if (d < R + h - 1.8) continue; // keep only the exposed shell
    cells.push({ x, y, z, h, d, n });
  }
  const geo = new RoundedBoxGeometry(1, 1, 1, 2, 0.1);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.66, metalness: 0.0, map: tex.terrazzo, envMapIntensity: 0.5 });
  const mesh = new THREE.InstancedMesh(geo, mat, cells.length);
  const m = new THREE.Matrix4(); const col = new THREE.Color(); const q = new THREE.Quaternion(); const sc = new THREE.Vector3(1, 1, 1); const pos = new THREE.Vector3();
  const tones = [0x0c1a2e, 0x34465c, 0x4d6079, 0x7488a3].map(c => new THREE.Color(c));
  const looseCells = [];
  cells.forEach((c, i) => {
    pos.set(c.x, c.y, c.z); q.identity(); sc.set(1, 1, 1);
    if (loose && pos.distanceTo(loose) < 4.2 && c.d > R + c.h - 1) {
      // mischief: blocks pried loose, floating out of the crust
      const k = hash3(c.x, c.z, c.y); const lift = 1.5 + k * 5.5; pos.addScaledVector(pos.clone().normalize(), lift);
      q.setFromEuler(new THREE.Euler(k * 0.9, k * 2.1, -k * 0.7)); looseCells.push(pos.clone());
    }
    m.compose(pos, q, sc); mesh.setMatrixAt(i, m);
    col.copy(tones[c.h]); col.offsetHSL(0, 0, (hash3(c.x, c.y, c.z) - 0.5) * 0.05);
    if (c.h === 0 && hash3(c.y, c.x, c.z) < 0.02) col.set(0x0790ff); // scattered signal pixels
    mesh.setColorAt(i, col);
    if (c.h >= 1 && c.d > R + c.h - 1 && rand() < (c.h === 3 ? 0.4 : 0.14)) towers.push(c);
  });
  group.add(mesh);

  // towers: activity buildings, axis-aligned along the dominant face axis
  const tGeo = new RoundedBoxGeometry(0.72, 1, 0.72, 2, 0.08); tGeo.translate(0, 0.5, 0);
  const tMat = new THREE.MeshStandardMaterial({ color: 0xb6c6d8, roughness: 0.4, map: tex.terrazzo, envMapIntensity: 0.8 });
  const tLit = new THREE.MeshStandardMaterial({ color: 0x0790ff, roughness: 0.3, emissive: 0x0790ff, emissiveIntensity: 1.4 });
  const lit = towers.filter(c => hash3(c.y, c.z, c.x) < 0.3), dim = towers.filter(c => hash3(c.y, c.z, c.x) >= 0.3);
  const towerTips = [];
  const Y = new THREE.Vector3(0, 1, 0);
  const place = (list, material) => {
    const im = new THREE.InstancedMesh(tGeo, material, list.length);
    list.forEach((c, i) => {
      const up = domAxis(c.x, c.y, c.z); const hgt = 1 + Math.floor(hash3(c.z, c.x, c.y) * (c.h === 3 ? 5 : 3));
      pos.set(c.x, c.y, c.z).addScaledVector(up, 0.5); q.setFromUnitVectors(Y, up); sc.set(1, hgt, 1);
      m.compose(pos, q, sc); im.setMatrixAt(i, m); towerTips.push(pos.clone().addScaledVector(up, hgt + 0.2));
    });
    group.add(im);
  };
  place(dim, tMat); place(lit, tLit);

  // activity arcs between towers
  const arcs = new THREE.Group(); const packets = [];
  const arcMat = new THREE.MeshBasicMaterial({ color: 0x2f8fff, toneMapped: false });
  const pktGeo = new RoundedBoxGeometry(0.6, 0.6, 0.6, 2, 0.14);
  const pktMat = new THREE.MeshBasicMaterial({ color: 0xd8e9ff, toneMapped: false });
  let made = 0, tries = 0;
  while (made < 22 && tries++ < 400 && towerTips.length > 2) {
    const a = towerTips[Math.floor(rand() * towerTips.length)], b = towerTips[Math.floor(rand() * towerTips.length)];
    const dd = a.distanceTo(b); if (dd < 8 || dd > R * 1.5) continue;
    const mid = a.clone().add(b).multiplyScalar(0.5); mid.setLength(R + 3 + dd * 0.45);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    arcs.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.08, 6, false), arcMat));
    for (let p = 0; p < 2; p++) { const pk = new THREE.Mesh(pktGeo, pktMat); pk.userData = { curve, t: rand(), speed: 0.05 + rand() * 0.08 }; packets.push(pk); arcs.add(pk); }
    made++;
  }
  group.add(arcs);
  const placePackets = (dt) => packets.forEach(pk => { pk.userData.t = (pk.userData.t + dt * pk.userData.speed) % 1; pk.position.copy(pk.userData.curve.getPoint(pk.userData.t)); });
  placePackets(0);
  return { group, placePackets, towerTips, looseCells };
}

function buildRing(R) {
  const g = new THREE.Group();
  const geo = new RoundedBoxGeometry(0.9, 0.9, 0.9, 2, 0.16);
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a6c84, roughness: 0.45, map: null });
  const hot = new THREE.MeshStandardMaterial({ color: 0x0790ff, emissive: 0x0790ff, emissiveIntensity: 1.2 });
  const n = 64; const rad = R + 9;
  for (let i = 0; i < n; i++) {
    if (i % 9 === 4) continue; // gaps = tension
    const a = (i / n) * Math.PI * 2; const b = new THREE.Mesh(geo, i % 11 === 0 ? hot : mat);
    b.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad); b.rotation.y = -a; const s = i % 11 === 0 ? 1.4 : 0.55 + 0.25 * Math.sin(i * 1.7) ** 2; b.scale.setScalar(s);
    g.add(b);
  }
  g.rotation.set(0.42, 0, -0.32);
  return g;
}

function buildCursor() {
  // the mischief: a giant extruded pointer nudging the world
  const s = new THREE.Shape();
  const P = [[0, 0], [0, -17], [4.2, -13], [7.2, -19.5], [10, -18.2], [7.1, -11.8], [12.6, -11.8]];
  s.moveTo(P[0][0], P[0][1]); P.slice(1).forEach(p => s.lineTo(p[0], p[1])); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 2.2, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.45, bevelSegments: 4 });
  geo.translate(0, 0, -1.1); // tip of the pointer sits at the origin
  const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xc9d3df, roughness: 0.45, metalness: 0.0, envMapIntensity: 0.6 }));
  const edge = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x0790ff, side: THREE.BackSide }));
  edge.scale.setScalar(1.07);
  const g = new THREE.Group(); g.add(edge, body); g.scale.setScalar(0.62);
  return g;
}

function buildDust(R, count = 220, seed = 3) {
  const rand = rng(seed); const geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  const mat = new THREE.MeshBasicMaterial({ color: 0x80bcff });
  const m = new THREE.InstancedMesh(geo, mat, count); const M = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1, th = rand() * Math.PI * 2, r = R + 6 + rand() * 30;
    const s = Math.sqrt(1 - u * u); M.makeTranslation(Math.cos(th) * s * r, u * r, Math.sin(th) * s * r);
    M.scale(new THREE.Vector3(1, 1, 1).multiplyScalar(0.4 + rand() * 1.4)); m.setMatrixAt(i, M);
  }
  return m;
}

// ---------- product plinths ----------
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function logoCard(texture, { size = 9, radius = 2, back = 0x0e1721, depth = 1.4 } = {}) {
  // a thick app-icon tile; the REAL logo is mapped unaltered onto its front face
  const g = new THREE.Group();
  const shape = roundedRectShape(size, size, radius);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 4, curveSegments: 16 }), new THREE.MeshStandardMaterial({ color: back, roughness: 0.35, metalness: 0.1, envMapIntensity: 0.8 }));
  body.position.z = -depth; g.add(body);
  const faceGeo = new THREE.ShapeGeometry(shape, 24);
  const uv = faceGeo.attributes.uv, pos = faceGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / size + 0.5, pos.getY(i) / size + 0.5);
  const face = new THREE.Mesh(faceGeo, new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false }));
  face.position.z = 0.27; g.add(face);
  return g;
}

function plinth() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(20, 2.4, 20, 4, 0.5), new THREE.MeshStandardMaterial({ color: 0x1c2735, roughness: 0.5, map: null }));
  base.position.y = -1.6; g.add(base);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(20.06, 0.16, 20.06), new THREE.MeshBasicMaterial({ color: 0x0790ff, toneMapped: false }));
  seam.position.y = -0.55; g.add(seam);
  const top = new THREE.Mesh(new RoundedBoxGeometry(20, 0.9, 20, 3, 0.3), new THREE.MeshStandardMaterial({ color: 0x2b3a4d, roughness: 0.6 }));
  top.position.y = -0.05; g.add(top);
  // isometric floor grid etched into the top
  const grid = new THREE.GridHelper(18, 9, 0x4d6079, 0x4d6079); grid.position.y = 0.42; grid.material.transparent = true; grid.material.opacity = 0.9; g.add(grid);
  return g;
}

function productScene(id, tex, cam) {
  const g = new THREE.Group(); g.add(plinth());
  const mat = (c, glow) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, map: tex.terrazzo, emissive: glow ? c : 0x000000, emissiveIntensity: glow ? 0.9 : 0, envMapIntensity: 0.7 });
  const block = (w, h, d, c, glow) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.2), mat(c, glow));
  const card = logoCard(tex.logo, { back: id === 'harbor' ? 0x1b1b1b : 0x101824, radius: id === 'fun-libs' ? 2.1 : 1.9 });
  card.position.set(-3.2, 6.4, -3.2);
  card.quaternion.copy(cam.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, 0.38, 0)));
  g.add(card);
  const foot = block(5, 0.8, 3, 0x3c4958); foot.position.set(-2.6, 0.8, -2.6); foot.rotation.y = Math.PI / 4; g.add(foot);
  const W = 0xd7dee8, B = 0x0790ff;
  if (id === 'mcp-emails') {
    // envelopes streaming in from off-plinth: email for AI agents
    for (let i = 0; i < 7; i++) {
      const t = i / 7; const e = block(2.6, 0.4, 1.8, i === 6 ? B : W, i === 6);
      e.position.set(13 - t * 9.2, 3.6 + Math.sin(t * Math.PI) * 6.5, -4 + t * 8.8); e.rotation.set(0.5 * (1 - t), 0.4 + t * 0.9, 0.45 * Math.cos(t * 3)); g.add(e);
      const flap = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.08), new THREE.MeshBasicMaterial({ color: i === 7 ? 0xffffff : 0x0790ff })); flap.position.y = 0.22; e.add(flap);
    }
    const tray = block(5.5, 1.4, 4, 0x2b3a4d); tray.position.set(3.8, 1.1, 4.8); g.add(tray);
    for (let i = 0; i < 4; i++) { const e = block(4.2, 0.35, 3, W); e.position.set(3.8, 1.9 + i * 0.42, 4.8); e.rotation.y = (i - 1.5) * 0.06; g.add(e); }
  } else if (id === 'fun-libs') {
    // a sentence of word tiles with glowing blanks: fill in the blanks
    const row = (z, items) => { let x = -7; items.forEach(([w, c]) => { const b = block(w, 0.9, 1.8, c, c === B); b.position.set(x + w / 2, 0.9, z); g.add(b); x += w + 0.45; }); };
    row(4.2, [[3.6, W], [2.4, B], [2.8, W], [4.0, W]]);
    row(7.0, [[2.2, W], [4.2, W], [2.6, B], [1.8, W]]);
    [0xffe066, 0x2b3a4d, 0xffe066, 0x13213b].forEach((c, i) => { const b = block(1.9, 1.9, 1.9, c); b.position.set(6.4, 1.4 + i * 1.95, -2.2); b.rotation.y = i * 0.22 - 0.3; g.add(b); });
  } else if (id === 'toolrails') {
    // many tools converge through one port: one MCP URL, every tool
    const port = block(2.6, 2.6, 2.6, B, true); port.position.set(2.2, 1.8, 2.2); g.add(port);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1)) * Math.PI * 0.9 - Math.PI * 0.2; const r = 6.8;
      const tb = block(1.5, 1.5, 1.5, i % 3 === 1 ? 0xffd400 : 0x4d6079); tb.position.set(2.2 + Math.cos(a) * r, 1.25, 2.2 + Math.sin(a) * r); g.add(tb);
      const p0 = tb.position.clone(), p1 = port.position.clone(); const mid = p0.clone().lerp(p1, 0.5); mid.y += 2.4;
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0, mid, p1), 32, 0.08, 6), new THREE.MeshBasicMaterial({ color: 0x3aa0ff, toneMapped: false })));
    }
    const up = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(port.position.clone(), new THREE.Vector3(0, 6, 0), new THREE.Vector3(-3.2, 3.2, -3.2)), 32, 0.14, 8), new THREE.MeshBasicMaterial({ color: 0x80bcff, toneMapped: false })); g.add(up);
  } else if (id === 'harbor') {
    // a shelf of knowledge blocks; one AI edit hovers, held for approval
    for (let c = 0; c < 6; c++) for (let r = 0; r < 2; r++) {
      const h = 2.2 + ((c * 7 + r * 3) % 4) * 0.45; const b = block(1.1, h, 2.6, (c + r) % 3 === 0 ? 0xcfc8bb : 0x4d6079); b.position.set(-1 + c * 1.25, 0.45 + h / 2, 4.6 + r * 3.2); b.rotation.z = c === 5 && r === 0 ? -0.18 : 0; g.add(b);
    }
    const pending = block(1.1, 2.8, 2.6, B, true); pending.position.set(7.2, 5.4, 6.2); pending.rotation.set(0.1, 0.2, 0.32); g.add(pending);
    const slot = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.1, 2.8, 2.6)), new THREE.LineDashedMaterial({ color: 0x80bcff, dashSize: 0.3, gapSize: 0.2 })); slot.computeLineDistances(); slot.position.set(6.5, 1.85, 6.2); g.add(slot);
  }
  return g;
}

// ---------- mount ----------
export async function mountPlanet(canvas, opts = {}) {
  const base = opts.base || new URL('./', import.meta.url).href;
  const shared = opts.shared || new URL('../../../_shared/products/', import.meta.url).href;
  const sceneId = opts.scene || 'hero';
  const dpr = opts.pixelRatio || Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!opts.still });
  renderer.setPixelRatio(dpr); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x05080c, opts.transparent ? 0 : 1);
  const W = () => canvas.clientWidth || canvas.width, H = () => canvas.clientHeight || canvas.height;
  renderer.setSize(W(), H(), false);

  const loader = new THREE.TextureLoader();
  const load = url => new Promise((res, rej) => loader.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, rej));
  const tex = {};
  tex.terrazzo = await load(base + '../src/tex/terrazzo-grey.png'); tex.terrazzo.wrapS = tex.terrazzo.wrapT = THREE.RepeatWrapping; tex.terrazzo.colorSpace = THREE.NoColorSpace;
  const envTex = await load(base + 'env-studio.jpg'); envTex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer); const env = pmrem.fromEquirectangular(envTex).texture;

  const scene = new THREE.Scene(); lights(scene, env);
  const aspect = W() / H();
  let cam, world = new THREE.Group(), tick = () => {}; const R = 17;
  scene.add(world);
  const shiftX = opts.shiftX ?? 0, shiftY = opts.shiftY ?? 0;

  if (sceneId.startsWith('product:')) {
    const id = sceneId.split(':')[1];
    const logos = { 'mcp-emails': shared + 'mcp-emails/icon.png', 'fun-libs': shared + 'fun-libs/icon.png', 'toolrails': base + '../src/tex/toolrails.png', 'harbor': base + '../src/tex/harbor-mark.png' };
    tex.logo = await load(logos[id]);
    cam = isoCamera(aspect, 15.5, shiftX, shiftY);
    const g = productScene(id, tex, cam); g.position.y = -2.4; world.add(g);
    const dust = buildDust(4, 60, 9); dust.scale.setScalar(0.9); world.add(dust);
    tick = (t) => { g.position.y = -2.4 + Math.sin(t * 0.9) * 0.25; };
  } else if (sceneId === 'cursor' || sceneId === 'debris') {
    cam = isoCamera(aspect, sceneId === 'cursor' ? 7.5 : 9, shiftX, shiftY);
    if (sceneId === 'cursor') {
      const c = buildCursor(); c.scale.setScalar(0.36);
      c.quaternion.copy(cam.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, -0.45, 0.15)));
      const cr0 = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), cu0 = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion); const home = cr0.multiplyScalar(-2.3).addScaledVector(cu0, 3.6); c.position.copy(home); world.add(c);
      tick = (t) => { c.position.copy(home).addScaledVector(cu0, Math.sin(t * 2) * 0.3); };
    } else {
      // a burst of loose voxels: section-edge confetti
      const rand = rng(opts.seed || 60); const geo = new RoundedBoxGeometry(1, 1, 1, 2, 0.12);
      const mats = [0x2b3a4d, 0x4d6079, 0x7488a3, 0xd7dee8].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, map: tex.terrazzo }));
      const hot = new THREE.MeshStandardMaterial({ color: 0x0790ff, emissive: 0x0790ff, emissiveIntensity: 0.8 });
      const cubes = [];
      for (let i = 0; i < 26; i++) {
        const m = new THREE.Mesh(geo, i % 7 === 0 ? hot : mats[Math.floor(rand() * 4)]);
        const r = 2 + rand() * 11, a = rand() * Math.PI * 2, b = (rand() - 0.5) * 2;
        m.position.set(Math.cos(a) * r, b * 5, Math.sin(a) * r); m.rotation.set(rand() * 3, rand() * 3, rand() * 3); m.scale.setScalar(0.35 + rand() * 1.1);
        world.add(m); cubes.push(m);
      }
      tick = (t, dt) => cubes.forEach((m, i) => { m.rotation.x += dt * 0.2 * ((i % 3) - 1); m.rotation.y += dt * 0.15; });
    }
  } else {
    let frustum = sceneId === 'hero' ? 34 : sceneId === 'surface' ? 12 : 28.5;
    cam = isoCamera(aspect, frustum, shiftX, shiftY);
    const planetRot = new THREE.Euler(0, 0, 0); // axis-aligned keeps the classic three-tone isometric faces
    // camera-space directions, used to aim the mischief at a visible spot
    const cr = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), cu = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion), cv = new THREE.Vector3(0, 0, 1).applyQuaternion(cam.quaternion);
    const aimW = cr.clone().multiplyScalar(-0.62).addScaledVector(cu, 0.62).addScaledVector(cv, 0.48).normalize();
    const aimL = aimW.clone().applyQuaternion(new THREE.Quaternion().setFromEuler(planetRot).invert()).multiplyScalar(R + 1);
    const planet = buildPlanet(tex, { R, seed: opts.seed || 7, loose: sceneId === 'hero' ? aimL : null });
    planet.group.rotation.copy(planetRot);
    world.add(planet.group);
    if (sceneId === 'hero') {
      const ring = buildRing(R); world.add(ring);
      const cursor = buildCursor();
      const tip = aimW.clone().multiplyScalar(R + 6.5);
      cursor.position.copy(tip);
      // pointer faces the viewer, rotated so its tip jabs down-right into the crust
      cursor.quaternion.copy(cam.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.25, -0.35, Math.PI * 0.78)));
      world.add(cursor);
      world.add(buildDust(R, 260));
      tick = (t, dt) => { ring.rotation.y += dt * 0.05; cursor.position.copy(tip).addScaledVector(aimW, Math.sin(t * 2.2) * 0.9); planet.placePackets(dt); };
    } else if (sceneId === 'surface') {
      world.add(buildDust(R, 300, 4));
      cam.position.addScaledVector(cu, R * 0.82); cam.updateMatrixWorld();
      tick = (t, dt) => { planet.group.rotation.y += dt * 0.015; planet.placePackets(dt); };
    } else {
      tick = (t, dt) => { planet.group.rotation.y += dt * 0.08; planet.placePackets(dt); };
    }
  }

  // post
  let composer = null;
  if (opts.bloom === true && !opts.transparent) { // off by default: many small bright points make UnrealBloom haze the void
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W() * dpr, H() * dpr, { type: THREE.HalfFloatType, samples: 4 }));
    composer.addPass(new RenderPass(scene, cam));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.42, 0.4, 0.86); composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // tilt + parallax (pointer or device orientation)
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  const onMove = e => { const r = canvas.getBoundingClientRect(); target.x = ((e.clientX - r.left) / r.width - 0.5) * 2; target.y = ((e.clientY - r.top) / r.height - 0.5) * 2; };
  const onTilt = e => { if (e.gamma == null) return; target.x = Math.max(-1, Math.min(1, e.gamma / 30)); target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); };
  if (opts.interactive) { window.addEventListener('pointermove', onMove); window.addEventListener('deviceorientation', onTilt); }

  const resize = () => { applyFrustum(cam, W() / H()); renderer.setSize(W(), H(), false); composer && composer.setSize(W(), H()); if (opts.still) draw(); };
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  const draw = () => (composer ? composer.render() : renderer.render(scene, cam));
  let raf = 0, last = performance.now(), t0 = last;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loop = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    cur.x += (target.x - cur.x) * 0.06; cur.y += (target.y - cur.y) * 0.06;
    world.rotation.y = cur.x * 0.18; world.rotation.x = cur.y * 0.1;
    if (!reduce) tick((now - t0) / 1000, dt);
    draw(); raf = requestAnimationFrame(loop);
  };
  if (opts.still) { tick(0, 0); draw(); window.__planetReady = true; }
  else raf = requestAnimationFrame(loop);

  return { renderer, scene, camera: cam, draw, dispose() { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('pointermove', onMove); window.removeEventListener('deviceorientation', onTilt); renderer.dispose(); } };
}
