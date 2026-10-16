// paperkit.js — "Night Shift Paper" diorama kit for Albretsen AS.
// Builds paper cut-out scenes from three.js primitives: extruded torn-edge
// shapes, canvas-made paper fibre textures, real soft shadows and sodium light.
// Used both to bake the stills in assets/hero + assets/products and live
// (see paper-desk.js). Pass in your THREE namespace (tested with three@0.170.0).

export const PALETTE = {
  ink: '#050d1c', night: '#0a1936', deep: '#122a52', dusk: '#1f4274',
  twilight: '#406c9b', haze: '#7fa3c2', sodium: '#f68c26', ember: '#d55c13',
  glow: '#f9cc87', aurora: '#9ada5e', auroraDeep: '#298646', paper: '#f5eede', paperShade: '#dccfbc',
};

// ---------- deterministic randomness ----------
export function rng(seed = 73) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function noise1(seed) { // smooth 1D value noise + fbm
  const r = rng(seed), N = 512, v = Array.from({ length: N }, r);
  const n = (x) => { const i = Math.floor(x), f = x - i, a = v[((i % N) + N) % N], b = v[(((i + 1) % N) + N) % N];
    const s = f * f * (3 - 2 * f); return a + (b - a) * s; };
  return (x, oct = 5) => { let s = 0, amp = 0.5, fr = 1; for (let o = 0; o < oct; o++) { s += amp * (n(x * fr) - 0.5); amp *= 0.5; fr *= 2.13; } return s; };
}

// ---------- textures ----------
const texCache = new Map();
export function fibreCanvas(size = 1024, seed = 7) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, size, size);
  // cloudy formation (pulp density)
  for (let i = 0; i < 260; i++) {
    const x = r() * size, y = r() * size, rad = 20 + r() * 120, l = r() < 0.5 ? 255 : 215;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(${l},${l},${l},${0.05 + r() * 0.06})`); gr.addColorStop(1, `rgba(${l},${l},${l},0)`);
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // fibres
  g.lineCap = 'round';
  for (let i = 0; i < 2600; i++) {
    let x = r() * size, y = r() * size, a = r() * Math.PI * 2, len = 6 + r() * 34;
    const dark = r() < 0.55; g.strokeStyle = dark ? `rgba(120,120,120,${0.05 + r() * 0.12})` : `rgba(255,255,255,${0.25 + r() * 0.4})`;
    g.lineWidth = 0.4 + r() * 1.1; g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 4; s++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * len / 4; y += Math.sin(a) * len / 4; g.lineTo(x, y); }
    g.stroke();
  }
  // grain
  const id = g.getImageData(0, 0, size, size), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
  return c;
}
export function paperTexture(THREE, repeat = 1, seed = 7) {
  const k = 'fibre' + seed; let base = texCache.get(k);
  if (!base) { base = fibreCanvas(1024, seed); texCache.set(k, base); }
  const t = new THREE.CanvasTexture(base); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  t.anisotropy = 8; return t;
}
export function glowTexture(THREE, color = '255,190,110') {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, `rgba(${color},0.9)`); gr.addColorStop(0.18, `rgba(${color},0.45)`);
  gr.addColorStop(0.5, `rgba(${color},0.12)`); gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- materials ----------
export function paperMat(THREE, color, opts = {}) {
  const map = paperTexture(THREE, opts.repeat ?? 0.35, opts.seed ?? 7);
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = paperTexture(THREE, opts.repeat ?? 0.35, opts.seed ?? 7);
  return new THREE.MeshStandardMaterial({ color, map, bumpMap: bump, bumpScale: opts.bump ?? 1.2, roughness: 0.92, metalness: 0,
    emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 1, transparent: !!opts.opacity, opacity: opts.opacity ?? 1 });
}

// ---------- shapes ----------
// A torn horizontal edge from x0..x1 following fn(x), closed down to yBottom.
export function tornBand(THREE, { x0 = -17, x1 = 17, fn, yBottom = -9, rough = 0.05, seed = 1, step = 0.04 }) {
  const n = noise1(seed), s = new THREE.Shape(); s.moveTo(x0, yBottom);
  for (let x = x0; x <= x1 + 1e-6; x += step) s.lineTo(x, fn(x) + n(x * 3.1) * rough * 2 + n(x * 31 + 9, 2) * rough * 0.6);
  s.lineTo(x1, yBottom); s.closePath(); return s;
}
// A torn ribbon (aurora): centre-line fn(x), thickness w(x)
export function tornRibbon(THREE, { x0 = -17, x1 = 17, fn, w, rough = 0.04, seed = 3, step = 0.05 }) {
  const n = noise1(seed), m = noise1(seed + 11), s = new THREE.Shape(); let first = true;
  for (let x = x0; x <= x1 + 1e-6; x += step) { const y = fn(x) + w(x) / 2 + n(x * 4) * rough * 2; first ? s.moveTo(x, y) : s.lineTo(x, y); first = false; }
  for (let x = x1; x >= x0 - 1e-6; x -= step) s.lineTo(x, fn(x) - w(x) / 2 + m(x * 4) * rough * 2);
  s.closePath(); return s;
}
// Scissor-cut polygon: straight-ish edges with tiny hand wobble
export function cutPoly(THREE, pts, wobble = 0.012, seed = 5) {
  const r = rng(seed), s = new THREE.Shape();
  pts.forEach(([x, y], i) => { const X = x + (r() - 0.5) * wobble, Y = y + (r() - 0.5) * wobble; i ? s.lineTo(X, Y) : s.moveTo(X, Y); });
  s.closePath(); return s;
}
export function roundRect(THREE, w, h, rad, wob = 0.01, seed = 9) {
  const r = rng(seed), j = () => (r() - 0.5) * wob, s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + rad, y + j()); s.lineTo(x + w - rad, y + j()); s.quadraticCurveTo(x + w, y, x + w + j(), y + rad);
  s.lineTo(x + w + j(), y + h - rad); s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h + j());
  s.lineTo(x + rad, y + h + j()); s.quadraticCurveTo(x, y + h, x + j(), y + h - rad); s.lineTo(x + j(), y + rad);
  s.quadraticCurveTo(x, y, x + rad, y); return s;
}
export function circleShape(THREE, r, seg = 96, wob = 0.008, seed = 4) {
  const n = noise1(seed), s = new THREE.Shape();
  for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2, rr = r + n(i * 0.3) * wob * 2; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  return s;
}
export function star4(THREE, r, k = 0.32) {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 2, rr = i % 2 ? r * k : r; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  s.closePath(); return s;
}

// A sheet of paper: extruded shape, casts + receives shadows.
export function sheet(THREE, shape, color, z = 0, opts = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: opts.depth ?? 0.018, bevelEnabled: false, curveSegments: 24 });
  // planar UVs in world-ish units so fibres stay consistent
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * 0.25 + (opts.uvOff ?? 0), pos.getY(i) * 0.25);
  const m = new THREE.Mesh(geo, opts.material ?? paperMat(THREE, color, opts));
  m.position.z = z; m.castShadow = opts.cast ?? true; m.receiveShadow = true;
  if (opts.drop) m.add(softShadow(THREE, shape, opts.drop));
  return m;
}
// Baked soft drop shadow for a shape (used where a real shadow would land far away in perspective).
export function softShadow(THREE, shape, { dx = 0.06, dy = -0.1, blur = 0.08, opacity = 0.55, dz = 0.03, color = '#02060f' } = {}) {
  const pts = shape.getPoints(64); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  pts.forEach((p) => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); });
  const pad = blur * 3, w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2, px = Math.min(160, 1024 / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.ceil(w * px); c.height = Math.ceil(h * px);
  const g = c.getContext('2d'); g.filter = `blur(${blur * px}px)`; g.fillStyle = '#000'; g.beginPath();
  pts.forEach((p, i) => { const X = (p.x - x0 + pad) * px, Y = (y1 + pad - p.y) * px; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, alphaMap: t, transparent: true, opacity, depthWrite: false }));
  m.position.set((x0 + x1) / 2 + dx, (y0 + y1) / 2 + dy, -dz); m.renderOrder = -1; return m;
}
// Torn layer with exposed white fibre rim along its top edge.
export function tornLayer(THREE, { fn, color, z, seed = 1, rough = 0.05, rim = 0.035, rimColor = PALETTE.paper, x0, x1, yBottom }) {
  const g = new THREE.Group();
  g.add(sheet(THREE, tornBand(THREE, { fn: (x) => fn(x) + rim, seed: seed + 101, rough: rough * 1.4, x0, x1, yBottom }), rimColor, -0.004, { cast: false, bump: 0.6 }));
  g.add(sheet(THREE, tornBand(THREE, { fn, seed, rough, x0, x1, yBottom }), color, 0));
  g.position.z = z; return g;
}

// Canvas-text texture plane (for paper UI)
export function canvasPlane(THREE, w, h, draw, { px = 220, transparent = true } = {}) {
  const c = document.createElement('canvas'); c.width = Math.round(w * px); c.height = Math.round(h * px);
  const g = c.getContext('2d'); g.scale(px, px); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent, roughness: 0.95 }));
  m.receiveShadow = true; return m;
}

export function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }

// ---------- lighting ----------
export function addLights(THREE, scene, { sun = [3, -0.6, 2.4], key = [-2, 3.2, 40], warm = 1 } = {}) {
  scene.add(new THREE.HemisphereLight(0xdcd8e4, 0x1a2a4a, 1.9));
  const d = new THREE.DirectionalLight(0xdfe6ff, 1.5); d.position.set(...key); d.castShadow = true;
  d.shadow.mapSize.set(4096, 4096); const sc = d.shadow.camera; sc.left = -17; sc.right = 17; sc.top = 11; sc.bottom = -11; sc.near = 20; sc.far = 60;
  d.shadow.bias = -0.0002; d.shadow.normalBias = 0.0; d.shadow.radius = 5; scene.add(d);
  const p = new THREE.PointLight(0xffa04a, 30 * warm, 16, 1.6); p.position.set(...sun); scene.add(p);
  return { key: d, sodium: p };
}

// ---------- the night scene ----------
// layers: sky, aurora, sun, far, mid, near, ui (each a Group with userData.depth for parallax)
export async function buildNight(THREE, opts = {}) {
  const P = PALETTE, R = rng(opts.seed ?? 0x73c2a7), scene = new THREE.Scene();
  const L = {}; const mk = (name, depth) => { const g = new THREE.Group(); g.name = name; g.userData.depth = depth; scene.add(g); L[name] = g; return g; };
  const sunX = opts.sunX ?? 0.2, sunY = opts.sunY ?? -1.0;

  // SKY: gradient card with fibres
  const sky = mk('sky', 0);
  {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 1024);
    gr.addColorStop(0, '#040b18'); gr.addColorStop(0.42, P.night); gr.addColorStop(0.62, P.deep); gr.addColorStop(0.78, '#2c4b7c'); gr.addColorStop(1, '#3a5786');
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
    const sx = (sunX + 17) / 34 * 1024, sy = (1 - (sunY + 11) / 22) * 1024; // sodium haze near sun
    const hz = g.createRadialGradient(sx, sy, 0, sx, sy, 520);
    hz.addColorStop(0, 'rgba(246,140,38,0.55)'); hz.addColorStop(0.35, 'rgba(213,92,19,0.22)'); hz.addColorStop(1, 'rgba(213,92,19,0)');
    g.fillStyle = hz; g.fillRect(0, 0, 1024, 1024);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.9; g.drawImage(fibreCanvas(1024, 21), 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(34, 22), new THREE.MeshStandardMaterial({ map: t, bumpMap: paperTexture(THREE, 2.5, 21), bumpScale: 0.8, roughness: 1 }));
    m.receiveShadow = true; sky.add(m);
    // punched stars + paper stars
    for (let i = 0; i < 110; i++) {
      const x = (R() - 0.5) * 32, y = -0.5 + R() * 10; if (Math.hypot(x - sunX, y - sunY) < 3.4) continue;
      const big = R() < 0.18, s = big ? 0.09 + R() * 0.09 : 0.025 + R() * 0.035;
      const shp = big ? star4(THREE, s) : circleShape(THREE, s, 16, 0.004, i);
      const st = sheet(THREE, shp, big ? P.glow : P.paper, 0.06 + R() * 0.25, { depth: 0.01, emissive: new THREE.Color(big ? P.glow : P.paper), emissiveIntensity: big ? 0.25 : 0.5 });
      st.position.set(x, y, st.position.z); st.rotation.z = R() * 0.6; sky.add(st);
    }
  }

  // AURORA: torn green ribbons
  const au = mk('aurora', 0.6);
  {
    const cols = ['#1d6a52', '#58b26a', P.aurora];
    [[5.2, 0.62, 0.2, 31], [4.3, 0.36, 0.42, 32], [6.1, 0.24, 0.62, 33]].forEach(([yb, w, z, seed], i) => {
      const fn = (x) => yb + Math.sin(x * 0.33 + i) * 0.7 + Math.sin(x * 0.81 + i * 2) * 0.28 - x * 0.05;
      const wf = (x) => w * (0.55 + 0.45 * Math.sin(x * 0.22 + i * 1.7) ** 2);
      const m = sheet(THREE, tornRibbon(THREE, { fn, w: wf, seed, rough: 0.045 }), cols[i], z,
        { emissive: new THREE.Color(cols[i]), emissiveIntensity: 0.18 + i * 0.08, opacity: 0.92 });
      au.add(m);
    });
  }

  // SUN: sodium disc with paper halo rings and a soft glow
  const sun = mk('sun', 1.0);
  {
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(THREE), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 }));
    glow.scale.set(13, 13, 1); glow.position.set(sunX, sunY, 0.82); sun.add(glow);
    [[3.25, P.ember, 0.86, 0.15], [2.75, '#f2a64a', 0.9, 0.2], [2.25, P.sodium, 0.95, 0.35]].forEach(([r, c, z, em], i) => {
      const d = sheet(THREE, circleShape(THREE, r, 128, 0.02, 40 + i), c, z, { emissive: new THREE.Color(c), emissiveIntensity: em });
      d.position.x = sunX; d.position.y = sunY; sun.add(d);
    });
  }

  // HILLS: far -> near, each a torn sheet with a white fibre rim
  const hill = (name, depth, layers) => { const g = mk(name, depth); layers.forEach((l) => g.add(tornLayer(THREE, l))); return g; };
  const far = hill('far', 1.6, [
    { fn: (x) => -0.6 + Math.sin(x * 0.45 + 0.8) * 0.55 + Math.sin(x * 1.3) * 0.15 + Math.max(0, 1.6 - Math.abs(x + 5.5)) * 0.9, color: P.twilight, z: 1.3, seed: 11, rough: 0.06 },
    { fn: (x) => -1.3 + Math.sin(x * 0.38 + 2.1) * 0.5 + Math.sin(x * 1.1 + 1) * 0.12 + Math.max(0, 2 - Math.abs(x - 7)) * 0.6, color: '#2f5888', z: 1.55, seed: 12, rough: 0.06 },
  ]);
  const mid = hill('mid', 2.4, [
    { fn: (x) => -2.1 + Math.sin(x * 0.3 + 4.2) * 0.65 + Math.sin(x * 0.9) * 0.18, color: P.dusk, z: 1.9, seed: 13, rough: 0.07 },
    { fn: (x) => -2.9 + Math.sin(x * 0.26 + 1.3) * 0.7 + Math.sin(x * 0.77 + 3) * 0.2, color: P.deep, z: 2.25, seed: 14, rough: 0.07 },
  ]);
  const near = hill('near', 3.4, [
    { fn: (x) => -3.6 + Math.sin(x * 0.22 + 0.5) * 0.8 + Math.sin(x * 0.6 + 2) * 0.25, color: P.night, z: 2.7, seed: 15, rough: 0.08 },
    { fn: (x) => -4.35 + Math.sin(x * 0.2 + 3.5) * 0.55 + Math.sin(x * 0.7) * 0.2, color: P.ink, z: 3.05, seed: 16, rough: 0.08 },
  ]);

  // ROAD toward the horizon (pale paper strips per layer) + sodium lamps
  const lampGlow = glowTexture(THREE, '255,170,80');
  const lamp = (parent, x, y, z, s) => {
    const post = sheet(THREE, cutPoly(THREE, [[-0.012, 0], [0.012, 0], [0.01, 0.42], [-0.01, 0.42]], 0.002), P.ink, z, { depth: 0.008 });
    post.scale.setScalar(s); post.position.set(x, y, z); parent.add(post);
    const head = new THREE.Mesh(new THREE.CircleGeometry(0.035 * s, 20), new THREE.MeshBasicMaterial({ color: '#ffb35c' }));
    head.position.set(x, y + 0.43 * s, z + 0.02); parent.add(head);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: lampGlow, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
    gl.scale.set(0.9 * s, 0.9 * s, 1); gl.position.set(x, y + 0.43 * s, z + 0.03); parent.add(gl);
  };
  {
    // road path in screen space: from bottom-left winding to the sun
    const road = (parent, z, yTop, yBot, cx0, cx1, w0, w1, seed) => {
      const pts = [], N = 20; for (let i = 0; i <= N; i++) { const t = i / N, y = yBot + (yTop - yBot) * t, cx = cx0 + (cx1 - cx0) * t + Math.sin(t * 3.1) * 0.25, w = w0 + (w1 - w0) * t; pts.push([cx - w / 2, y]); }
      for (let i = N; i >= 0; i--) { const t = i / N, y = yBot + (yTop - yBot) * t, cx = cx0 + (cx1 - cx0) * t + Math.sin(t * 3.1) * 0.25, w = w0 + (w1 - w0) * t; pts.push([cx + w / 2, y]); }
      const m = sheet(THREE, cutPoly(THREE, pts, 0.02, seed), '#5a7bab', z, { depth: 0.006, cast: false });
      parent.add(m); return (t, side) => { const y = yBot + (yTop - yBot) * t, cx = cx0 + (cx1 - cx0) * t + Math.sin(t * 3.1) * 0.25, w = w0 + (w1 - w0) * t; return [cx + side * (w / 2 + 0.05), y]; };
    };
    const rn = (t, side) => [-2.6 + t * 1.6 + side * (0.9 - t * 0.4), -8 + t * 3.6];
    [[0.15, -1], [0.55, 1], [0.85, -1]].forEach(([t, s]) => { const [x, y] = rn(t, s); lamp(near, x, y, 3.09, 1.9 - t); });
    const rm = road(mid, 2.275, -2.75, -4.6, -0.95, 0.0, 0.55, 0.22, 72);
    [[0.2, 1], [0.6, -1], [0.95, 1]].forEach(([t, s]) => { const [x, y] = rm(t, s); lamp(mid, x, y, 2.29, 0.9 - t * 0.35); });
    const rf = road(far, 1.575, -1.15, -3.1, 0.0, 0.25, 0.2, 0.05, 73);
    [[0.3, -1], [0.75, 1]].forEach(([t, s]) => { const [x, y] = rf(t, s); lamp(far, x, y, 1.59, 0.45); });
  }

  // CABINS with lit windows on the mid hill: people building at night
  {
    const cabin = (x, y, z, s, lit, seed) => {
      const g = new THREE.Group();
      g.add(sheet(THREE, cutPoly(THREE, [[-0.5, 0], [0.5, 0], [0.5, 0.55], [0, 0.95], [-0.5, 0.55]], 0.02, seed), P.ink, 0, { depth: 0.012 }));
      g.add(sheet(THREE, cutPoly(THREE, [[-0.6, 0.5], [0, 1.02], [0.6, 0.5], [0.6, 0.6], [0, 1.12], [-0.6, 0.6]], 0.02, seed + 1), P.ember, 0.014, { depth: 0.01 }));
      lit.forEach(([wx, wy]) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ color: '#ffc06b' })); w.position.set(wx, wy, 0.02); g.add(w); });
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: lampGlow, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.45 }));
      gl.scale.set(1.6, 1.6, 1); gl.position.set(0, 0.35, 0.03); g.add(gl);
      g.scale.setScalar(s); g.position.set(x, y, z); return g;
    };
    mid.add(cabin(-6.1, -2.55, 2.27, 0.62, [[-0.2, 0.3], [0.2, 0.3]], 80));
    mid.add(cabin(-4.9, -2.75, 2.27, 0.48, [[0.15, 0.28]], 82));
    far.add(cabin(5.9, -1.55, 1.56, 0.36, [[-0.15, 0.3], [0.18, 0.3]], 84));
    near.add(cabin(6.6, -4.1, 3.07, 0.9, [[-0.22, 0.28], [0.2, 0.28]], 86));
  }

  // PAPER AIRPLANE + dashed flight path (velocity)
  const plane = mk('plane', 4.2);
  {
    const geo = new THREE.BufferGeometry();
    const v = [0, 0, 0, -1.2, 0.36, 0.05, -0.95, 0, 0.25,   0, 0, 0, -0.95, 0, 0.25, -1.2, -0.3, 0.12,   0, 0, 0, -0.95, 0, 0.25, -1.05, -0.06, 0.02];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.computeVertexNormals();
    const pm = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: P.paper, roughness: 0.9, side: THREE.DoubleSide, map: paperTexture(THREE, 0.5, 9) }));
    pm.castShadow = false; pm.receiveShadow = true; const pg = new THREE.Group(); pg.add(pm);
    pg.position.set(opts.planeX ?? 1.9, opts.planeY ?? 3.7, 4.2); pg.rotation.z = 0.32; pg.scale.setScalar(0.85); plane.add(pg);
    // dashes along a curve behind it
    const curve = new THREE.CubicBezierCurve(new THREE.Vector2(-11, 0.8), new THREE.Vector2(-6, 4.6), new THREE.Vector2(-2.5, 1.2), new THREE.Vector2(pg.position.x - 1.1, pg.position.y - 0.42));
    const pts = curve.getSpacedPoints(46);
    for (let i = 0; i < pts.length - 1; i += 2) {
      const a = pts[i], b = pts[i + 1], ang = Math.atan2(b.y - a.y, b.x - a.x), len = a.distanceTo(b);
      const d = sheet(THREE, cutPoly(THREE, [[0, -0.022], [len, -0.022], [len, 0.022], [0, 0.022]], 0.004, i), P.paper, 4.0, { depth: 0.006, cast: false, emissive: new THREE.Color(P.paper), emissiveIntensity: 0.15 });
      d.position.set(a.x, a.y, 4.0); d.rotation.z = ang; plane.add(d);
    }
  }

  // camera
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 24, opts.aspect ?? 16 / 10, 0.1, 100);
  camera.position.set(0, 0.2, opts.camZ ?? 34); camera.lookAt(0, 0.2, 0);
  const lights = addLights(THREE, scene, { sun: [sunX, sunY + 0.6, 3.4] });
  scene.background = new THREE.Color(P.ink);
  return { scene, camera, layers: L, lights };
}

// ---------- paper desktop UI (menu bar, windows, icons, cursor) ----------
export const FONT_DISPLAY = '"Bricolage Grotesque", system-ui, sans-serif';
export const FONT_MONO = '"Geist Mono", ui-monospace, monospace';

export function tape(THREE, w = 0.9, h = 0.28, seed = 2) {
  const s = cutPoly(THREE, [[-w / 2, -h / 2], [-w / 2 + 0.03, -h / 6], [-w / 2, h / 2], [w / 2, h / 2], [w / 2 - 0.03, h / 6], [w / 2, -h / 2]], 0.02, seed);
  return sheet(THREE, s, '#fff1cf', 0, { depth: 0.004, opacity: 0.62, cast: false, bump: 0.3 });
}

export function paperWindow(THREE, { w, h, title, bar = PALETTE.sodium, body = PALETTE.paper, draw, seed = 1 }) {
  const g = new THREE.Group();
  g.add(sheet(THREE, roundRect(THREE, w, h, 0.18, 0.02, seed), body, 0, { depth: 0.03, cast: false, emissive: new THREE.Color(body), emissiveIntensity: 0.22, drop: { dx: 0.14, dy: -0.22, blur: 0.16, opacity: 0.6, dz: 0.02 } }));
  const tb = sheet(THREE, roundRect(THREE, w - 0.16, 0.42, 0.1, 0.02, seed + 1), bar, 0.035, { depth: 0.012 });
  tb.position.y = h / 2 - 0.3; g.add(tb);
  ['#e9503a', PALETTE.glow, PALETTE.aurora].forEach((c, i) => { const d = sheet(THREE, circleShape(THREE, 0.07, 32, 0.004, i + seed), c, 0.05, { depth: 0.006 }); d.position.set(-w / 2 + 0.32 + i * 0.22, h / 2 - 0.3, 0.05); g.add(d); });
  const tt = canvasPlane(THREE, w - 1.4, 0.36, (c, cw, ch) => { c.fillStyle = PALETTE.ink; c.font = `600 0.2px ${FONT_MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(title, cw / 2, ch / 2 + 0.01); });
  tt.position.set(0.3, h / 2 - 0.3, 0.052); g.add(tt);
  if (draw) { const cp = canvasPlane(THREE, w - 0.3, h - 0.75, draw); cp.position.set(0, -0.2, 0.034); g.add(cp); }
  const t1 = tape(THREE, 0.95, 0.3, seed + 7); t1.position.set(-w / 2 + 0.2, h / 2 - 0.02, 0.08); t1.rotation.z = 0.7; g.add(t1);
  const t2 = tape(THREE, 0.95, 0.3, seed + 8); t2.position.set(w / 2 - 0.15, -h / 2 + 0.05, 0.08); t2.rotation.z = 0.6; g.add(t2);
  return g;
}

export function cursorArrow(THREE) {
  const g = new THREE.Group();
  const pts = [[0, 0], [0, -1.55], [0.38, -1.18], [0.66, -1.78], [0.9, -1.66], [0.62, -1.08], [1.12, -1.08]];
  const rim = pts.map(([x, y]) => [x * 1.13 - 0.07, y * 1.1 + 0.11]);
  g.add(sheet(THREE, cutPoly(THREE, rim, 0.02, 61), PALETTE.ink, 0, { depth: 0.02, cast: false, drop: { dx: 0.18, dy: -0.3, blur: 0.12, opacity: 0.5 } }));
  g.add(sheet(THREE, cutPoly(THREE, pts, 0.015, 62), PALETTE.paper, 0.022, { depth: 0.02, cast: false }));
  return g;
}

export function folderIcon(THREE, color = PALETTE.sodium, seed = 1) {
  const g = new THREE.Group();
  g.add(sheet(THREE, cutPoly(THREE, [[-0.55, -0.4], [0.55, -0.4], [0.55, 0.32], [-0.05, 0.32], [-0.15, 0.45], [-0.55, 0.45]], 0.015, seed), PALETTE.ember, 0, { depth: 0.015, cast: false, drop: { dx: 0.05, dy: -0.08, blur: 0.06, opacity: 0.6 } }));
  g.add(sheet(THREE, cutPoly(THREE, [[0.4, 0.25], [0.48, -0.1], [-0.42, -0.08], [-0.46, 0.3]], 0.01, seed + 3), PALETTE.paper, 0.012, { depth: 0.006, cast: false }));
  g.add(sheet(THREE, cutPoly(THREE, [[-0.55, -0.4], [0.55, -0.4], [0.6, 0.2], [-0.5, 0.2]], 0.015, seed + 1), color, 0.02, { depth: 0.015, cast: false }));
  return g;
}

export async function buildDesktopUI(THREE, scene, { products = [], wide = true } = {}) {
  const P = PALETTE, ui = new THREE.Group(); ui.name = 'ui'; ui.userData.depth = 5.2; scene.add(ui);
  await document.fonts.ready;
  // menu bar strip
  const bar = sheet(THREE, cutPoly(THREE, [[-13, -0.28], [13, -0.3], [13, 0.3], [-13, 0.28]], 0.02, 91), P.paper, 0, { depth: 0.02, cast: false, drop: { dx: 0, dy: -0.1, blur: 0.08, opacity: 0.6 } });
  bar.position.set(0, 5.62, 5.0); ui.add(bar);
  const barTxt = canvasPlane(THREE, 18, 0.5, (c, w, h) => {
    c.textBaseline = 'middle'; c.fillStyle = P.ink; c.font = `800 0.27px ${FONT_DISPLAY}`; c.fillText('Albretsen', 0.55, h / 2 + 0.01);
    c.font = `500 0.2px ${FONT_MONO}`; ['Products', 'Writing', 'Day job', 'Archive'].forEach((t, i) => c.fillText(t, 2.4 + i * 1.35, h / 2 + 0.01));
    c.textAlign = 'right'; c.fillText('NO  ·  albretsen.no  ·  23:47', w - 0.3, h / 2 + 0.01);
    c.fillStyle = P.sodium; c.beginPath(); c.moveTo(0.2, 0.38); c.lineTo(0.33, 0.12); c.lineTo(0.46, 0.38); c.closePath(); c.fill();
  });
  barTxt.position.set(0, 5.62, 5.03); ui.add(barTxt);

  // terminal window
  const term = paperWindow(THREE, { w: 6.4, h: 3.0, title: 'terminal — ~/albretsen', bar: P.glow, body: P.ink, seed: 21, draw: (c, w, h) => {
    c.font = `500 0.19px ${FONT_MONO}`; c.textBaseline = 'top'; let y = 0.12; const line = (parts) => { let x = 0.12; parts.forEach(([t, col]) => { c.fillStyle = col; c.fillText(t, x, y); x += c.measureText(t).width; }); y += 0.34; };
    line([['~ ', P.aurora], ['whoami', P.paper]]);
    line([['Asgeir Albretsen · Albretsen AS · Norway', P.haze]]);
    line([['~ ', P.aurora], ['claude mcp add albretsen \\', P.paper]]);
    line([['    https://albretsen.no/mcp', P.sodium]]);
    line([['✓ ', P.aurora], ['on Google Play since 2016', P.haze]]);
    line([['~ ', P.aurora], ['▍', P.sodium]]);
  } });
  term.position.set(-5.3, 2.2, 5.4); term.rotation.z = 0.035; ui.add(term);

  // products window with REAL product icons
  const imgs = await Promise.all(products.map((p) => loadImage(p.src).catch(() => null)));
  const prod = paperWindow(THREE, { w: 4.6, h: 4.2, title: 'Products', bar: P.sodium, body: P.paper, seed: 31, draw: (c, w, h) => {
    const cols = 2, cw = w / cols, chh = (h - 0.1) / 2;
    products.forEach((p, i) => {
      const cx = (i % cols) * cw + cw / 2, cy = Math.floor(i / cols) * chh + 0.1; const s = 0.78, img = imgs[i];
      c.save(); c.translate(cx, cy + s / 2 + 0.05); c.rotate((i % 2 ? 1 : -1) * 0.04);
      c.fillStyle = 'rgba(5,13,28,0.18)'; c.fillRect(-s / 2 + 0.04, -s / 2 + 0.06, s, s);
      c.fillStyle = p.bg ?? '#fff'; c.fillRect(-s / 2, -s / 2, s, s);
      if (img) { const pad = p.pad ?? 0; c.drawImage(img, -s / 2 + pad, -s / 2 + pad, s - pad * 2, s - pad * 2); }
      c.restore();
      c.fillStyle = P.ink; c.font = `700 0.2px ${FONT_DISPLAY}`; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText(p.name, cx, cy + s + 0.18);
      c.font = `500 0.13px ${FONT_MONO}`; c.fillStyle = P.dusk; c.fillText(p.status, cx, cy + s + 0.42);
    });
  } });
  prod.position.set(4.7, 0.1, 5.9); prod.rotation.z = -0.04; ui.add(prod);

  // desktop icons (right column)
  const labels = [['Retired', P.twilight], ['Writing', P.aurora], ['Day job', P.sodium]];
  labels.forEach(([t, col], i) => {
    const f = folderIcon(THREE, col, 100 + i * 5); f.position.set(9.0, 4.2 - i * 1.6, 5.2); f.scale.setScalar(0.95); ui.add(f);
    const lab = canvasPlane(THREE, 1.6, 0.34, (c, w, h) => { c.fillStyle = 'rgba(5,13,28,0.75)'; const tw = 0.16 * t.length * 0.58 + 0.2; c.fillRect(w / 2 - tw / 2, 0.04, tw, 0.27); c.fillStyle = P.paper; c.font = `600 0.16px ${FONT_MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, w / 2, h / 2 + 0.01); });
    lab.position.set(9.0, 3.5 - i * 1.6, 5.25); ui.add(lab);
  });
  // dock with the real product icons
  {
    const dock = new THREE.Group(); const n = products.length + 1, cell = 1.05, dw = n * cell + 0.5;
    dock.add(sheet(THREE, roundRect(THREE, dw, 1.25, 0.32, 0.03, 141), P.paper, 0, { depth: 0.02, cast: false, opacity: 0.88, drop: { dx: 0.06, dy: -0.14, blur: 0.14, opacity: 0.55 } }));
    const icons = canvasPlane(THREE, dw, 1.25, (c, w, h) => {
      const s = 0.8; const all = [{ mark: true }, ...products];
      all.forEach((p, i) => { const x = 0.25 + i * cell + (cell - s) / 2, y = (h - s) / 2 - 0.03;
        c.save(); c.translate(x + s / 2, y + s / 2); c.rotate(((i * 37) % 7 - 3) * 0.012);
        c.fillStyle = 'rgba(5,13,28,0.22)'; c.fillRect(-s / 2 + 0.03, -s / 2 + 0.05, s, s);
        if (p.mark) { c.fillStyle = P.night; c.fillRect(-s / 2, -s / 2, s, s); c.fillStyle = P.sodium; c.beginPath(); c.arc(0, 0.08, 0.24, Math.PI, 0); c.fill();
          c.fillStyle = P.paper; c.beginPath(); c.moveTo(-0.27, 0.27); c.lineTo(0, -0.28); c.lineTo(0.27, 0.27); c.lineTo(0.13, 0.27); c.lineTo(0.08, 0.17); c.lineTo(-0.08, 0.17); c.lineTo(-0.13, 0.27); c.closePath(); c.fill(); }
        else { c.fillStyle = p.bg; c.fillRect(-s / 2, -s / 2, s, s); const img = imgs[i - 1]; if (img) { const pad = p.pad ?? 0; c.drawImage(img, -s / 2 + pad * 0.9, -s / 2 + pad * 0.9, s - pad * 1.8, s - pad * 1.8); } }
        c.restore();
        c.fillStyle = i === 0 ? P.sodium : P.ink; c.beginPath(); c.arc(x + s / 2, h - 0.07, 0.035, 0, Math.PI * 2); c.fill(); });
    });
    icons.position.z = 0.025; dock.add(icons);
    dock.position.set(0, -4.8, 6.2); dock.rotation.z = 0.008; ui.add(dock);
  }
  // cursor
  const cur = cursorArrow(THREE); cur.position.set(6.3, -1.5, 7.0); cur.rotation.z = 0.1; cur.scale.setScalar(0.62); ui.add(cur);
  return ui;
}

export function makeRenderer(THREE, { canvas, width, height, pixelRatio = 1, alpha = false }) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: true });
  r.setPixelRatio(pixelRatio); r.setSize(width, height, false);
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
  if (alpha) r.setClearColor(0x000000, 0);
  return r;
}

export const PRODUCT_ICONS = (base) => [
  { name: 'MCP Emails', status: 'live · 2026', src: base + 'mcp-emails/icon.png', bg: '#2547E5' },
  { name: 'Fun Libs', status: 'live · 2019', src: base + 'fun-libs/icon.png', bg: '#FFE066' },
  { name: 'Toolrails', status: 'building', src: base + 'toolrails/icon.svg', bg: '#141413' },
  { name: 'Harbor', status: 'paused', src: base + 'harbor/harbor-mark.svg', bg: '#FBF9F4', pad: 0.12 },
];

// ---------- product dioramas ----------
export function sticker(THREE, lines, { r = 0.62, color = PALETTE.sodium, ink = PALETTE.ink, seed = 1 } = {}) {
  const g = new THREE.Group();
  g.add(sheet(THREE, circleShape(THREE, r + 0.05, 96, 0.01, seed), PALETTE.paper, 0, { depth: 0.01, cast: false, drop: { dx: 0.05, dy: -0.08, blur: 0.07, opacity: 0.5 } }));
  g.add(sheet(THREE, circleShape(THREE, r - 0.02, 96, 0.01, seed + 1), color, 0.012, { depth: 0.01, cast: false }));
  const t = canvasPlane(THREE, r * 2, r * 2, (c, w, h) => { c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle';
    let fs = r * 0.5; c.font = `800 ${fs}px ${FONT_DISPLAY}`; const mw = c.measureText(lines[0]).width; if (mw > r * 1.5) { fs *= r * 1.5 / mw; c.font = `800 ${fs}px ${FONT_DISPLAY}`; }
    c.fillText(lines[0], w / 2, h / 2 - (lines[1] ? r * 0.12 : 0));
    if (lines[1]) { c.font = `600 ${r * 0.21}px ${FONT_MONO}`; c.fillText(lines[1].toUpperCase(), w / 2, h / 2 + r * 0.36); } });
  t.position.z = 0.026; g.add(t); return g;
}
export function slip(THREE, text, { color = PALETTE.paper, ink = PALETTE.ink, h = 0.42, size = 0.2, seed = 3, font = FONT_MONO, weight = 600 } = {}) {
  const c0 = document.createElement('canvas').getContext('2d'); c0.font = `${weight} ${size * 100}px ${font}`;
  const w = c0.measureText(text).width / 100 + 0.36; const g = new THREE.Group();
  g.add(sheet(THREE, cutPoly(THREE, [[-w / 2, -h / 2], [w / 2, -h / 2 + 0.01], [w / 2 - 0.01, h / 2], [-w / 2 + 0.01, h / 2 - 0.01]], 0.02, seed), color, 0, { depth: 0.008, cast: false, drop: { dx: 0.04, dy: -0.07, blur: 0.05, opacity: 0.5 } }));
  const t = canvasPlane(THREE, w, h, (c, cw, ch) => { c.fillStyle = ink; c.font = `${weight} ${size}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, cw / 2, ch / 2 + 0.01); });
  t.position.z = 0.01; g.add(t); return g;
}
function logoTile(THREE, img, { size = 2.2, bg = '#fff', pad = 0, seed = 1 } = {}) {
  const g = new THREE.Group();
  g.add(sheet(THREE, roundRect(THREE, size + 0.16, size + 0.16, 0.12, 0.02, seed), PALETTE.paper, 0, { depth: 0.02, cast: false, drop: { dx: 0.1, dy: -0.16, blur: 0.12, opacity: 0.6 } }));
  const t = canvasPlane(THREE, size, size, (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); if (img) c.drawImage(img, pad, pad, w - pad * 2, h - pad * 2); }, { px: 400, transparent: false });
  t.position.z = 0.022; g.add(t); return g;
}
function envelope(THREE, seed) {
  const g = new THREE.Group(), w = 1.1, h = 0.72;
  g.add(sheet(THREE, cutPoly(THREE, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 0.015, seed), PALETTE.paper, 0, { depth: 0.01, cast: false, drop: { dx: 0.08, dy: -0.12, blur: 0.08, opacity: 0.5 } }));
  g.add(sheet(THREE, cutPoly(THREE, [[-w / 2, h / 2], [0, -0.04], [w / 2, h / 2]], 0.015, seed + 1), PALETTE.paperShade, 0.012, { depth: 0.006, cast: false }));
  return g;
}
export async function buildProduct(THREE, id, base) {
  const N = await buildNight(THREE, { aspect: 4 / 3, camZ: 27, fov: 24, sunX: { 'mcp-emails': -3.5, 'fun-libs': 3.6, toolrails: -2.8, harbor: 3.2 }[id] ?? 0, sunY: -1.6 });
  N.layers.plane.visible = false; await document.fonts.ready;
  const P = PALETTE, g = new THREE.Group(); g.name = 'product'; g.userData.depth = 6; N.scene.add(g); g.position.z = 5.6;
  const L = (f) => loadImage(base + f).catch(() => null);
  if (id === 'mcp-emails') {
    const win = paperWindow(THREE, { w: 6.2, h: 4.4, title: 'mcpemails.com', bar: P.sodium, seed: 201 }); win.rotation.z = -0.03; g.add(win);
    const tile = logoTile(THREE, await L('mcp-emails/icon.png'), { size: 2.0, bg: '#2547E5', seed: 202 }); tile.position.set(-1.45, -0.05, 0.06); tile.rotation.z = 0.04; g.add(tile);
    const name = canvasPlane(THREE, 3.2, 1.6, (c) => { c.fillStyle = P.ink; c.font = `800 0.4px ${FONT_DISPLAY}`; c.fillText('MCP Emails', 0, 0.55); c.font = `500 0.19px ${FONT_MONO}`; c.fillStyle = P.dusk; c.fillText('Email for AI agents.', 0.02, 0.95); c.fillText('17 tools · ~100 providers', 0.02, 1.25); });
    name.position.set(1.55, -0.15, 0.05); g.add(name);
    [[3.6, 2.1, 0.25, 0.9], [4.9, 0.9, -0.15, 0.75], [4.4, 3.3, 0.4, 0.6]].forEach(([x, y, r, s], i) => { const e = envelope(THREE, 210 + i * 3); e.position.set(x, y, 0.6 + i * 0.1); e.rotation.z = r; e.scale.setScalar(s); g.add(e); });
    const st = sticker(THREE, ['$782', 'MRR'], { seed: 220, color: P.aurora }); st.position.set(-3.1, -2.1, 0.3); st.rotation.z = -0.2; g.add(st);
    const sl = slip(THREE, 'open source · AGPL', { seed: 223 }); sl.position.set(1.4, -2.45, 0.25); sl.rotation.z = 0.04; g.add(sl);
  } else if (id === 'fun-libs') {
    const ph = new THREE.Group(); ph.add(sheet(THREE, roundRect(THREE, 2.9, 5.6, 0.45, 0.02, 301), P.ink, 0, { depth: 0.04, cast: false, drop: { dx: 0.16, dy: -0.24, blur: 0.18, opacity: 0.6 } }));
    ph.add(sheet(THREE, roundRect(THREE, 2.55, 5.15, 0.3, 0.02, 302), '#ffe066', 0.045, { depth: 0.006, cast: false }));
    const ic = logoTile(THREE, await L('fun-libs/icon.png'), { size: 1.6, bg: '#FFE066', seed: 303 }); ic.position.set(0, 0.7, 0.06); ph.add(ic);
    const nm = canvasPlane(THREE, 2.4, 1.3, (c, w) => { c.fillStyle = '#13213f'; c.textAlign = 'center'; c.font = `800 0.42px ${FONT_DISPLAY}`; c.fillText('Fun Libs', w / 2, 0.45); c.font = `600 0.15px ${FONT_MONO}`; c.fillText('Android · iOS', w / 2, 0.78); });
    nm.position.set(0, -1.15, 0.06); ph.add(nm); ph.rotation.z = 0.05; g.add(ph);
    [['The ______ ate my homework', -4.2, 2.3, 0.08], ['a very ______ dog', 4.1, 1.6, -0.06], ['______ (noun)', 3.7, -0.4, 0.05], ['(adjective) ______', -4.0, 0.2, -0.04]].forEach(([t, x, y, r], i) => { const s = slip(THREE, t, { seed: 310 + i, size: 0.22, h: 0.46, color: i % 2 ? P.paper : P.glow }); s.position.set(x, y, 0.3 + i * 0.05); s.rotation.z = r; g.add(s); });
    const st = sticker(THREE, ['113,000+', 'installs'], { r: 0.8, seed: 320 }); st.position.set(3.6, -2.2, 0.4); st.rotation.z = 0.15; g.add(st);
    const s2 = slip(THREE, 'built at 17 · no marketing', { seed: 322 }); s2.position.set(-3.6, -2.3, 0.3); s2.rotation.z = 0.03; g.add(s2);
  } else if (id === 'toolrails') {
    const win = paperWindow(THREE, { w: 5.6, h: 4.2, title: 'toolrails.com', bar: P.glow, body: P.paper, seed: 401 }); win.rotation.z = 0.025; g.add(win);
    const ic = logoTile(THREE, await L('toolrails/icon.svg'), { size: 1.7, bg: '#141413', seed: 402 }); ic.position.set(0, 0.45, 0.06); g.add(ic);
    const nm = canvasPlane(THREE, 4.6, 1.1, (c, w) => { c.fillStyle = P.ink; c.textAlign = 'center'; c.font = `800 0.42px ${FONT_DISPLAY}`; c.fillText('Toolrails', w / 2, 0.45); c.font = `500 0.16px ${FONT_MONO}`; c.fillStyle = P.dusk; c.fillText('One MCP URL that gives an agent every tool.', w / 2, 0.8); });
    nm.position.set(0, -1.35, 0.05); g.add(nm);
    ['connector 01', 'connector 02', 'connector 03', 'connector 04'].forEach((t, i) => { const a = -0.5 + i * 0.33; const s = slip(THREE, t, { seed: 410 + i, color: i % 2 ? P.paper : '#ffd400', size: 0.18 }); s.position.set(-4.2 + (i % 2) * 0.35, 2.1 - i * 0.95, 0.3 + i * 0.04); s.rotation.z = a * 0.2; g.add(s); });
    [['tool search', 4.0, 1.4, -0.08], ['injection guard', 4.1, 0.2, 0.06]].forEach(([t, x, y, r], i) => { const s = slip(THREE, t, { seed: 420 + i }); s.position.set(x, y, 0.35); s.rotation.z = r; g.add(s); });
    const st = sticker(THREE, ['4', 'connectors'], { seed: 430, color: P.sodium }); st.position.set(3.7, -1.9, 0.4); st.rotation.z = -0.12; g.add(st);
  } else if (id === 'harbor') {
    [[0.5, 0.35, -0.08, P.paperShade], [0.25, 0.18, 0.05, '#ece3d1']].forEach(([x, y, r, c], i) => { const d = sheet(THREE, roundRect(THREE, 4.6, 3.8, 0.08, 0.02, 500 + i), c, -0.2 + i * 0.08, { depth: 0.01, cast: false, drop: { dx: 0.1, dy: -0.15, blur: 0.12, opacity: 0.45 } }); d.position.x = x; d.position.y = y; d.rotation.z = r; g.add(d); });
    const win = paperWindow(THREE, { w: 4.8, h: 4.0, title: 'harborknowledge.com', bar: P.twilight, body: '#FBF9F4', seed: 503 }); win.rotation.z = -0.02; g.add(win);
    const ic = logoTile(THREE, await L('harbor/harbor-mark.svg'), { size: 1.5, bg: '#FBF9F4', pad: 0.1, seed: 504 }); ic.position.set(-1.1, 0.25, 0.06); g.add(ic);
    const nm = canvasPlane(THREE, 2.4, 1.6, (c) => { c.fillStyle = P.ink; c.font = `800 0.46px ${FONT_DISPLAY}`; c.fillText('Harbor', 0, 0.5); c.font = `500 0.15px ${FONT_MONO}`; c.fillStyle = P.dusk; c.fillText('private knowledge base', 0.02, 0.85); c.fillText('for people and AI', 0.02, 1.1); });
    nm.position.set(1.35, 0.05, 0.05); g.add(nm);
    const note = new THREE.Group(); note.add(sheet(THREE, cutPoly(THREE, [[-1, -0.75], [1, -0.72], [0.98, 0.75], [-0.98, 0.72]], 0.02, 510), P.glow, 0, { depth: 0.008, cast: false, drop: { dx: 0.08, dy: -0.12, blur: 0.08, opacity: 0.5 } }));
    const nt = canvasPlane(THREE, 2, 1.5, (c, w, h) => { c.fillStyle = P.ink; c.textAlign = 'center'; c.font = `700 0.2px ${FONT_MONO}`; c.fillText('AI edit', w / 2, 0.55); c.fillText('held for', w / 2, 0.85); c.fillText('approval', w / 2, 1.15); }); nt.position.z = 0.01; note.add(nt);
    const tp = tape(THREE, 0.8, 0.26, 512); tp.position.set(0, 0.72, 0.02); tp.rotation.z = -0.1; note.add(tp);
    note.position.set(3.4, 1.3, 0.4); note.rotation.z = 0.1; g.add(note);
    const st = sticker(THREE, ['549', 'commits'], { seed: 520, color: P.haze }); st.position.set(-3.3, -2.0, 0.35); st.rotation.z = 0.12; g.add(st);
    const sl = slip(THREE, 'self-hostable · paused', { seed: 522 }); sl.position.set(2.6, -2.35, 0.3); sl.rotation.z = -0.04; g.add(sl);
  }
  return N;
}
