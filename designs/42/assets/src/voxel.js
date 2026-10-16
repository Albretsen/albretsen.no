// Voxel modelling + baking helpers for the "Same Room" kit (design 42).
// Used only at bake time by src/bake.html. Renders a voxel set with
// per-vertex ambient occlusion and soft shadow maps through three.js,
// then writes the PNG (with alpha) into the DOM so headless Chrome can dump it.
import * as THREE from 'three';

export const PAL = {
  mist: '#fefaed', cream: '#faf4da', lime: '#fee891', pollen: '#f3d761',
  leaf: '#a5ce6f', moss: '#6d944b', ink: '#2b3116', sky: '#bae5fd',
  azure: '#81bfeb', lilac: '#daccf7', peach: '#fed0b2', blush: '#fcbfc2',
  clay: '#d19f77', wood: '#d5b993', stone: '#dad8cf', slate: '#627482',
  white: '#ffffff', paper: '#f7f5ee', deepleaf: '#4f7a3a', berry: '#e48aa0',
  night: '#3b4a6b', glow: '#fff6c9', woodDark: '#b8976c', steel: '#b9c3cc',
};

// Deterministic PRNG so bakes are reproducible.
export function rng(seed = 42) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export class Vox {
  constructor() { this.m = new Map(); this.planes = []; }
  key(x, y, z) { return x + ',' + y + ',' + z; }
  set(x, y, z, c) { this.m.set(this.key(x, y, z), c); return this; }
  get(x, y, z) { return this.m.get(this.key(x, y, z)); }
  del(x, y, z) { this.m.delete(this.key(x, y, z)); return this; }
  has(x, y, z) { return this.m.has(this.key(x, y, z)); }
  box(x0, y0, z0, x1, y1, z1, c) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
        for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
          typeof c === 'function' ? (c(x, y, z) && this.set(x, y, z, c(x, y, z))) : this.set(x, y, z, c);
    return this;
  }
  clear(x0, y0, z0, x1, y1, z1) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
        for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) this.del(x, y, z);
    return this;
  }
  blob(cx, cy, cz, rx, ry, rz, c, rand, rough = 0.18) {
    for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++)
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++)
        for (let z = Math.floor(cz - rz - 1); z <= cz + rz + 1; z++) {
          const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2;
          if (d < 1 - (rand ? (rand() - 0.5) * rough * 2 : 0)) this.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
        }
    return this;
  }
  // Flat image / logo plane, placed on a voxel face. side: 'x' (faces +x), 'z' (faces +z), 'y' (faces up)
  plane(opts) { this.planes.push(opts); return this; }
}

const DIRS = [
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];
const AO = [0.52, 0.70, 0.86, 1.0];

export function buildMesh(vox, { jitter = 0.016, seed = 7 } = {}) {
  const pos = [], nor = [], col = [], idx = [];
  const r = rng(seed); const tmp = new THREE.Color(); const hsl = {};
  for (const [k, hex] of vox.m) {
    const [x, y, z] = k.split(',').map(Number);
    tmp.set(hex); tmp.getHSL(hsl);
    const j = (r() - 0.5) * 2 * jitter;
    tmp.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + j)));
    for (const d of DIRS) {
      const [nx, ny, nz] = d.n;
      if (vox.has(x + nx, y + ny, z + nz)) continue;
      const base = pos.length / 3; const ao = [];
      for (const c of d.c) {
        // corner AO: look at the 3 neighbours in the layer the face points into
        const o = c.map((v, i) => (d.n[i] !== 0 ? 0 : v * 2 - 1));
        const L = [x + nx, y + ny, z + nz];
        const axes = [0, 1, 2].filter(i => d.n[i] === 0);
        const a1 = [...L]; a1[axes[0]] += o[axes[0]];
        const a2 = [...L]; a2[axes[1]] += o[axes[1]];
        const a3 = [...L]; a3[axes[0]] += o[axes[0]]; a3[axes[1]] += o[axes[1]];
        const s1 = vox.has(...a1) ? 1 : 0, s2 = vox.has(...a2) ? 1 : 0, s3 = vox.has(...a3) ? 1 : 0;
        const v = s1 && s2 ? 0 : 3 - (s1 + s2 + s3);
        ao.push(AO[v]);
        pos.push(x + c[0], y + c[1], z + c[2]); nor.push(nx, ny, nz);
        col.push(tmp.r * AO[v], tmp.g * AO[v], tmp.b * AO[v]);
      }
      if (ao[0] + ao[2] > ao[1] + ao[3]) idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      else idx.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

export function bounds(vox) {
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const k of vox.m.keys()) { const p = k.split(',').map(Number); for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], p[i]); mx[i] = Math.max(mx[i], p[i] + 1); } }
  return { mn, mx };
}

export async function bake(vox, o = {}) {
  const W = o.width || 2400, H = o.height || 1800;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  document.body.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = o.exposure ?? 1.0;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  if (o.background) scene.background = new THREE.Color(o.background);

  const geo = buildMesh(vox, o);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);

  const loader = new THREE.TextureLoader();
  for (const p of vox.planes) {
    let tex;
    if (p.draw) {
      const cv = document.createElement('canvas'); cv.width = p.cw || 512; cv.height = p.ch || 512;
      const imgs = await Promise.all((p.images || []).map(src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; })));
      p.draw(cv.getContext('2d'), cv.width, cv.height, imgs);
      tex = new THREE.CanvasTexture(cv);
    } else tex = await loader.loadAsync(p.src);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true, opacity: p.opacity ?? 1 }));
    m.position.set(...p.at);
    if (p.face === 'x') m.rotation.y = Math.PI / 2; else if (p.face === '-x') m.rotation.y = -Math.PI / 2; else if (p.face === 'y') m.rotation.x = -Math.PI / 2;
    if (p.rot) m.rotation.z += p.rot;
    scene.add(m);
  }

  const { mn, mx } = bounds(vox);
  const ctr = new THREE.Vector3((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2);
  if (o.center) ctr.set(...o.center);
  const span = o.span || Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);

  // ground shadow catcher
  if (o.ground !== false) {
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(span * 6, span * 6), new THREE.ShadowMaterial({ opacity: o.groundOpacity ?? 0.16, color: new THREE.Color(o.groundColor || '#4c5a2a') }));
    gp.rotation.x = -Math.PI / 2; gp.position.set(ctr.x, mn[1] - (o.groundGap ?? 0) - 0.001, ctr.z); gp.receiveShadow = true; scene.add(gp);
  }

  const hemi = new THREE.HemisphereLight(o.skyLight || '#f2fbff', o.groundLight || '#f6ecc4', o.hemi ?? 1.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight(o.sunColor || '#fff7e6', o.sun ?? 2.1);
  const sd = new THREE.Vector3(...(o.sunDir || [-0.55, 1.0, 0.35])).normalize();
  sun.position.copy(ctr).addScaledVector(sd, span * 3); sun.target.position.copy(ctr); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.radius = o.shadowRadius ?? 6; sun.shadow.blurSamples = 24;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  const sc = sun.shadow.camera; const e = span * 1.6; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 0.1; sc.far = span * 8;
  const fill = new THREE.DirectionalLight(o.fillColor || '#dff0ff', o.fill ?? 0.55); fill.position.copy(ctr).add(new THREE.Vector3(span, span * 0.4, span * 1.4)); scene.add(fill);

  const aspect = W / H; const zoom = o.zoom || 1; const fr = span * 0.62 / zoom;
  const cam = new THREE.OrthographicCamera(-fr * aspect, fr * aspect, fr, -fr, 0.1, span * 20);
  const az = THREE.MathUtils.degToRad(o.azimuth ?? 45), el = THREE.MathUtils.degToRad(o.elevation ?? 32);
  cam.position.set(ctr.x + Math.sin(az) * Math.cos(el) * span * 6, ctr.y + Math.sin(el) * span * 6, ctr.z + Math.cos(az) * Math.cos(el) * span * 6);
  cam.lookAt(ctr);
  if (o.shift) { cam.position.add(new THREE.Vector3(...o.shift)); }
  cam.updateProjectionMatrix();
  renderer.render(scene, cam);
  const url = canvas.toDataURL('image/png');
  const pre = document.createElement('pre'); pre.id = 'out'; pre.textContent = url; document.body.appendChild(pre);
  document.title = 'done';
}
