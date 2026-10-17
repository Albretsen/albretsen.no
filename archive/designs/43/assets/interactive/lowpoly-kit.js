// lowpoly-kit.js — shared three.js builders for "The Albretsen Dawn" (design 43).
// Every 3D still in assets/ was rendered from these functions, and the live
// orbit demo uses them too, so the builder can make new scenes in the same hand.
//
// Requires an import map for "three" (pinned): https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js
import * as THREE from 'three';

export const C = {
  paper: 0xf6fbfc, mist: 0xe2f4f6, sky: 0xb5e5ea, lagoon: 0x6ab9c7, deep: 0x32728a, ink: 0x182933,
  dawn: 0xfbd1b6, blush: 0xf6cbd0, lilac: 0xd0cded, spark: 0xf8e18a, gold: 0xefc65a,
};

export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const col = h => new THREE.Color(h);
function lerpColor(stops, t) {
  t = Math.max(0, Math.min(0.9999, t)) * (stops.length - 1);
  const i = Math.floor(t);
  return col(stops[i]).lerp(col(stops[i + 1]), t - i);
}

// paint each triangle one colour (true flat low-poly, no smoothing)
export function paintFaces(geo, fn) {
  geo = geo.index ? geo.toNonIndexed() : geo;
  const pos = geo.attributes.position, n = pos.count, colors = new Float32Array(n * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), m = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    m.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    const k = fn(m, i / 3);
    for (let j = 0; j < 3; j++) { colors[(i + j) * 3] = k.r; colors[(i + j) * 3 + 1] = k.g; colors[(i + j) * 3 + 2] = k.b; }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export const flatMat = (opts = {}) => new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0 }, opts));

// ---------- sky ----------
export function skyTexture(stops = ['#f6fbfc', '#e2f4f6', '#d0cded', '#f6cbd0', '#fbd1b6'], w = 16, h = 512) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, h);
  stops.forEach((s, i) => gr.addColorStop(i / (stops.length - 1), s));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- lights: dawn key from the right, sky fill, soft shadows ----------
export function dawnLights(scene, { key = 2.6, dir = [6, 5, 4], shadow = true } = {}) {
  const hemi = new THREE.HemisphereLight(0xeaf6fa, 0xf6d6c4, 1.35); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1e2, key);
  sun.position.set(...dir);
  if (shadow) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 40 });
    sun.shadow.radius = 6; sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
  }
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xd8d4ff, 0.6); rim.position.set(-6, 3, -5); scene.add(rim);
  return { hemi, sun, rim };
}

// ---------- planet ----------
export function planet({ radius = 2, detail = 3, seed = 3, rough = 0.07 } = {}) {
  const r = rng(seed);
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position, v = new THREE.Vector3();
  // deterministic noise keyed by direction, so shared vertices stay welded
  const ph = [r() * 9, r() * 9, r() * 9];
  const noise = d => Math.sin(d.x * 3.1 + ph[0]) * Math.sin(d.y * 2.7 + ph[1]) * Math.sin(d.z * 3.4 + ph[2]) + 0.5 * Math.sin(d.x * 7.3 + d.z * 5.1 + ph[1]);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const h = noise(v);
    v.multiplyScalar(radius * (1 + rough * Math.max(-0.35, h)));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  const g = paintFaces(geo, m => {
    const d = m.length() / radius - 1;          // height above sea
    const lat = Math.abs(m.y) / radius;
    if (lat > 0.86) return col(0xffffff);
    if (d < 0.005) return lerpColor([0x6ab9c7, 0x8fd0da, 0xb5e5ea], 0.4 + d * 20 + r() * 0.25);
    return lerpColor([0xf6e6d4, 0xfbd1b6, 0xf6cbd0, 0xd0cded], d / (rough * 1.2) + r() * 0.15);
  });
  const mesh = new THREE.Mesh(g, flatMat());
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// ---------- terrain: rolling low-poly ground ----------
export function terrain({ size = 30, seg = 34, seed = 5, amp = 0.9, flatCenter = 3.2 } = {}) {
  const r = rng(seed);
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const d = Math.hypot(x, z);
    const fall = Math.min(1, Math.max(0, (d - flatCenter) / 6));
    const h = (Math.sin(x * 0.45 + 1.3) * Math.cos(z * 0.38) * 0.6 + Math.sin(x * 1.1 + z * 0.7) * 0.25 + (r() - 0.5) * 0.35) * amp * fall + fall * fall * amp * 1.4;
    pos.setY(i, h + (r() - 0.5) * 0.05);
    pos.setX(i, x + (r() - 0.5) * size / seg * 0.5);
    pos.setZ(i, z + (r() - 0.5) * size / seg * 0.5);
  }
  const g = paintFaces(geo, m => {
    const t = (m.y + 0.2) / (amp * 2.6);
    return lerpColor([0xe2f4f6, 0xd5ecef, 0xb5e5ea, 0xd0cded, 0xf6cbd0, 0xfbd1b6], t + (r() - 0.5) * 0.12);
  });
  const mesh = new THREE.Mesh(g, flatMat());
  mesh.receiveShadow = true;
  return mesh;
}

// ---------- low-poly cloud ----------
export function cloud({ seed = 1, puffs = 5, scale = 1 } = {}) {
  const r = rng(seed), group = new THREE.Group();
  const mat = flatMat({ roughness: 1, emissive: 0xf7f4fa, emissiveIntensity: 0.5 });
  for (let i = 0; i < puffs; i++) {
    const s = (0.55 + r() * 0.6) * scale * (1 - Math.abs(i - puffs / 2) / puffs);
    const g = paintFaces(new THREE.IcosahedronGeometry(s, 0), () => lerpColor([0xffffff, 0xf3f8fb, 0xe9f1f8], r()));
    const m = new THREE.Mesh(g, mat);
    m.position.set((i - puffs / 2) * 0.62 * scale, (r() - 0.3) * 0.3 * scale, (r() - 0.5) * 0.5 * scale);
    m.rotation.set(r() * 3, r() * 3, r() * 3);
    m.castShadow = true;
    group.add(m);
  }
  return group;
}

// ---------- spark: small faceted star ----------
export function spark(size = 0.18, color = C.gold) {
  const g = new THREE.OctahedronGeometry(size, 0);
  g.scale(1, 1.5, 1);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, flatShading: true, roughness: 0.5 }));
  return m;
}

// generic faceted solid in a pastel tone
export function gem(kind = 'ico', size = 0.5, color = C.lilac, seed = 1) {
  const r = rng(seed);
  const geo = { ico: () => new THREE.IcosahedronGeometry(size, 0), oct: () => new THREE.OctahedronGeometry(size, 0), dod: () => new THREE.DodecahedronGeometry(size, 0), tet: () => new THREE.TetrahedronGeometry(size, 0), box: () => new THREE.BoxGeometry(size * 1.3, size * 1.3, size * 1.3) }[kind]();
  const base = col(color);
  const g = paintFaces(geo, () => base.clone().offsetHSL(0, 0, (r() - 0.5) * 0.06));
  const m = new THREE.Mesh(g, flatMat({ roughness: 0.7 }));
  m.castShadow = m.receiveShadow = true;
  return m;
}

// ---------- rounded slab carrying a REAL product logo on its face ----------
// image: HTMLImageElement/Canvas of the real logo (drawn as-is, never recoloured)
// side: colour for the slab edges, sampled from the logo's own background
export function logoSlab(image, { w = 2, h = 2, depth = 0.32, radius = 0.42, side = '#ffffff', segs = 3, pad = 0 } = {}) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + radius, y);
  s.lineTo(x + w - radius, y); s.quadraticCurveTo(x + w, y, x + w, y + radius);
  s.lineTo(x + w, y + h - radius); s.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  s.lineTo(x + radius, y + h); s.quadraticCurveTo(x, y + h, x, y + h - radius);
  s.lineTo(x, y + radius); s.quadraticCurveTo(x, y, x + radius, y);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 1, curveSegments: segs });
  geo.translate(0, 0, -depth / 2);
  // remap cap UVs from shape coordinates to 0..1
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - x) / w, (pos.getY(i) - y) / h);
  const tex = new THREE.CanvasTexture(toCanvas(image, 1024, Math.round(1024 * h / w), side, pad));
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  // the logo face is unlit and un-tonemapped: the product's own colours, exactly
  const capMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const sideMat = new THREE.MeshStandardMaterial({ color: side, roughness: 0.6, flatShading: true });
  const mesh = new THREE.Mesh(geo, [capMat, sideMat]);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
function toCanvas(img, W, H, fallback, pad = 0) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  // contain-fit the real logo; fill behind it with its own background colour
  const k = Math.min(W / img.width, H / img.height) * (1 - pad * 2);
  const dw = img.width * k, dh = img.height * k;
  g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const px = g.getImageData(W / 2, Math.round((H - dh) / 2) + 6, 1, 1).data;
  g.globalCompositeOperation = 'destination-over';
  g.fillStyle = px[3] > 200 ? `rgb(${px[0]},${px[1]},${px[2]})` : fallback; g.fillRect(0, 0, W, H);
  return cv;
}

// ---------- the brand object: the facet A as a crystal ----------
export function crystalA({ depth = 0.5, scale = 0.06 } = {}) {
  const V = { T: [32, 4], L: [4, 60], R: [60, 60], N: [32, 42], NL: [19.5, 60], NR: [44.5, 60], C1: [32, 21], C2: [26.2, 33.5], C3: [37.8, 33.5] };
  const s = new THREE.Shape();
  const P = k => new THREE.Vector2((V[k][0] - 32) * scale, -(V[k][1] - 32) * scale);
  [P('T'), P('R'), P('NR'), P('N'), P('NL'), P('L')].forEach((p, i) => i ? s.lineTo(p.x, p.y) : s.moveTo(p.x, p.y));
  const hole = new THREE.Path();
  [P('C1'), P('C2'), P('C3')].forEach((p, i) => i ? hole.lineTo(p.x, p.y) : hole.moveTo(p.x, p.y));
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 1 });
  geo.translate(0, 0, -depth / 2);
  const r = rng(9);
  const g = paintFaces(geo, (m) => {
    // right-lit facets brighter, a dawn-warm band at the crossbar
    const t = 0.5 + m.x * 0.28 + (r() - 0.5) * 0.18;
    if (Math.abs(m.y + 0.1) < 0.18 && Math.abs(m.x) < 0.3) return col(0xfbd9a8);
    return lerpColor([0x32728a, 0x4a8ea3, 0x6ab9c7, 0x8fd0da, 0xb5e5ea], t);
  });
  const mesh = new THREE.Mesh(g, flatMat({ roughness: 0.38, metalness: 0.05 }));
  mesh.castShadow = mesh.receiveShadow = true;
  // the sunrise triangle, as a separate glowing facet in the crossbar
  const tri = new THREE.Shape();
  [P('C2'), P('C3'), P('N')].forEach((p, i) => i ? tri.lineTo(p.x, p.y) : tri.moveTo(p.x, p.y));
  const sun = new THREE.Mesh(new THREE.ShapeGeometry(tri), new THREE.MeshStandardMaterial({ color: 0xf8e18a, emissive: 0xfbc28f, emissiveIntensity: 0.9, side: THREE.DoubleSide }));
  sun.position.z = depth / 2 + 0.145;
  const group = new THREE.Group(); group.add(mesh, sun);
  return group;
}

// ---------- paper plane (an email on its way) ----------
export function paperPlane(size = 0.5, color = 0xffffff) {
  const g = new THREE.BufferGeometry();
  const L = size, W = size * 0.55, H = size * 0.18;
  const v = [
    0, 0, L, -W, 0, -L * 0.6, 0, -H * 0.2, -L * 0.45,  // left wing
    0, 0, L, 0, -H * 0.2, -L * 0.45, W, 0, -L * 0.6,  // right wing
    0, 0, L, 0, -H * 0.2, -L * 0.45, 0, -H, -L * 0.5, // keel
  ];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  const p = paintFaces(g, (m, i) => col(color).offsetHSL(0, 0, i === 2 ? -0.08 : i ? -0.03 : 0));
  const mesh = new THREE.Mesh(p, flatMat({ side: THREE.DoubleSide, roughness: 0.8, emissive: 0xfff6ee, emissiveIntensity: 0.35 }));
  mesh.castShadow = true;
  return mesh;
}

// ---------- letter tile (word-game blocks for Fun Libs scene) ----------
export function letterTile(letter, { size = 0.7, bg = '#fbd1b6', fg = '#182933' } = {}) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
  g.fillStyle = fg; g.font = '500 210px "Instrument Serif", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(letter, 128, 140);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 });
  const plain = new THREE.MeshStandardMaterial({ color: bg, roughness: 0.7, flatShading: true });
  const geo = new THREE.BoxGeometry(size, size, size * 0.42);
  const mesh = new THREE.Mesh(geo, [plain, plain, plain, plain, face, plain]);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

export function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

export { THREE };
