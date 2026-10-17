// Albretsen / Nocturne Select: shared three.js "studio" kit.
// Soft glossy plastic, studio lightformers, a dark plum stage that glows.
// Used both to bake the still renders (../src/render.html) and live by select-stage.js.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export { THREE };

// Palette (see ASSETS.md). OKLCH source in comments.
export const C = {
  void: 0x0b050c,   // oklch(0.13 0.022 324)
  stage: 0x160b17,  // oklch(0.17 0.03 324)
  panel: 0x251726,  // oklch(0.23 0.035 324)
  line: 0x423144,   // oklch(0.34 0.04 324)
  mist: 0xae9faf,   // oklch(0.72 0.03 324)
  paper: 0xf8f1f8,  // oklch(0.965 0.012 324)
  glow: 0xdc3aec,   // oklch(0.66 0.27 324)
  glowHi: 0xf295fb, // oklch(0.80 0.17 324)
  glowDeep: 0x861192,
  ion: 0x36dcec,    // oklch(0.82 0.13 205)
  cobalt: 0x588cff, butter: 0xfbd452, volt: 0xe3d612, jade: 0x1fc893, ember: 0xfd6a3a, lilac: 0x7f76dc,
};

// Real product identities. Body colour is taken from each product's own brand, not ours.
export const PRODUCTS = {
  'mcp-emails': { name: 'MCP Emails', label: 'mcp-emails', body: 0x2547e5, rim: C.cobalt },
  'fun-libs':   { name: 'Fun Libs',   label: 'fun-libs',   body: 0xfedf66, rim: C.butter },
  'toolrails':  { name: 'Toolrails',  label: 'toolrails',  body: 0x1a1a19, rim: C.volt, accent: 0xffd400 },
  'harbor':     { name: 'Harbor',     label: 'harbor',     body: 0x1b1b1b, rim: C.jade, accent: 0xf3efe7 },
  'luma':       { name: 'Luma',       label: 'luma',       body: 0xf4efe6, rim: C.lilac },
};

export function createRenderer(canvas, { alpha = false, shadows = true } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.0;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = shadows;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  if (alpha) r.setClearColor(0x000000, 0);
  return r;
}

// Lightformer environment: a black room with soft area panels. Reflections in the plastic
// are where the brand colour lives: a magenta strip on the left, an ion strip on the right.
export function studioEnvironment(renderer, { key = 1.6, magenta = 2.2, ion = 1.4, warm = 0.0 } = {}) {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x050205);
  const panel = (w, h, color, intensity, pos, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...(look || [0, 0, 0])); env.add(m); return m;
  };
  panel(6, 6, 0xffffff, key, [0, 7, 1]);             // softbox overhead
  panel(10, 2, 0xffffff, key * 0.6, [0, 2.5, 7]);     // front strip
  panel(5, 3.5, 0xffe6fb, key * 0.35, [-2.5, 4.5, 6]);  // large soft front-left key card
  panel(1.4, 9, C.glow, magenta, [-6.5, 1.5, 1]);      // magenta strip, left
  panel(1.4, 9, C.ion, ion, [6.5, 1.5, -1]);           // ion strip, right
  panel(8, 1.2, C.glowHi, magenta * 0.5, [0, 0.4, -7]); // back horizon glow
  if (warm) panel(2, 2, 0xffc4a0, warm, [4, 4, 5]);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.035).texture;
  pm.dispose();
  return tex;
}

export function plastic(color, o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: o.roughness ?? 0.38, metalness: 0,
    clearcoat: o.clearcoat ?? 1, clearcoatRoughness: o.clearcoatRoughness ?? 0.06,
    sheen: o.sheen ?? 0.25, sheenRoughness: 0.5, sheenColor: new THREE.Color(o.sheenColor ?? 0xffffff),
    envMapIntensity: o.env ?? 1.0, ...(o.extra || {}),
  });
}

export function resin(tint = 0xf8f1f8, o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: tint, roughness: o.roughness ?? 0.28, metalness: 0, transmission: 1, thickness: o.thickness ?? 0.9,
    ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.05, attenuationColor: new THREE.Color(o.attenuation ?? 0xe8c9ee), attenuationDistance: o.attDist ?? 2.2,
    envMapIntensity: 1.2,
  });
}

// ---------- labels: the REAL product logos, composed onto a square label (never redrawn) ----------
const SHARED = new URL('../../../_shared/products/', import.meta.url).href;
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
async function svgImg(url, replaceCurrent) {
  let s = await (await fetch(url)).text();
  if (replaceCurrent) s = s.replaceAll('currentColor', replaceCurrent);
  return loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s));
}
export async function labelCanvas(id, size = 1024) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const draw = (img, pad, bg) => { if (bg) { g.fillStyle = bg; g.fillRect(0, 0, size, size); } const s = size - pad * 2; const k = Math.min(s / img.width, s / img.height); const w = img.width * k, h = img.height * k; g.drawImage(img, (size - w) / 2, (size - h) / 2, w, h); };
  if (id === 'mcp-emails') { draw(await loadImg(SHARED + 'mcp-emails/icon.png'), 0, '#2547E5'); }
  else if (id === 'fun-libs') { draw(await loadImg(SHARED + 'fun-libs/icon.png'), 0); }
  else if (id === 'toolrails') { draw(await svgImg(SHARED + 'toolrails/icon.svg'), 0, '#141413'); }
  else if (id === 'harbor') { draw(await svgImg(SHARED + 'harbor/harbor-mark.svg', '#F3EFE7'), size * 0.2, '#1b1b1b'); } // Harbor's own cream-on-charcoal, as in its banner
  else if (id === 'luma') { draw(await loadImg(SHARED + 'luma/logo.png'), size * 0.16, '#F4EFE6'); }
  return c;
}
export async function labelTexture(id) {
  const t = new THREE.CanvasTexture(await labelCanvas(id)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function planarUV(geo) {
  geo.computeBoundingBox(); const b = geo.boundingBox; const p = geo.attributes.position; const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) - b.min.x) / (b.max.x - b.min.x); uv[i * 2 + 1] = (p.getY(i) - b.min.y) / (b.max.y - b.min.y); }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return geo;
}

// A "character": a puffy app-tile body in the product's own colour, its real icon inlaid on the face.
export async function character(id, { size = 1.6, depth = 0.62 } = {}) {
  const p = PRODUCTS[id]; const g = new THREE.Group(); g.name = id;
  const body = new THREE.Mesh(new RoundedBoxGeometry(size, size, depth, 10, size * 0.2), plastic(p.body, { roughness: 0.42 }));
  body.castShadow = true; body.receiveShadow = true; g.add(body);
  const tex = await labelTexture(id);
  const inset = size * 0.86;
  const face = new THREE.Mesh(planarUV(new THREE.ShapeGeometry(roundedRectShape(inset, inset, inset * 0.2), 24)),
    new THREE.MeshPhysicalMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.32, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.7 }));
  face.position.z = depth / 2 + 0.003; g.add(face);
  g.userData = { body, face, product: p };
  return g;
}

// A plinth: a soft lathe disc in dark plastic with a glowing seam.
export function plinth({ radius = 1.25, height = 0.42, seam = C.glow, seamIntensity = 2.4 } = {}) {
  const g = new THREE.Group();
  const pts = []; const r = 0.12;
  pts.push(new THREE.Vector2(0, 0));
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI / 2; pts.push(new THREE.Vector2(radius - r + Math.cos(a) * r, r + Math.sin(a) * r)); }
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; pts.push(new THREE.Vector2(radius - r + Math.cos(a) * r, height - r + Math.sin(a) * r)); }
  pts.push(new THREE.Vector2(0, height));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), plastic(C.panel, { roughness: 0.3, sheen: 0.4, sheenColor: C.glowHi }));
  m.castShadow = true; m.receiveShadow = true; g.add(m);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: seam, emissiveIntensity: seamIntensity, roughness: 0.4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.005, 0.018, 12, 160), ringMat);
  ring.rotation.x = Math.PI / 2; ring.position.y = height * 0.5; g.add(ring);
  g.userData = { ring, ringMat, top: height };
  return g;
}

// Brand mark as an inflated plastic object. Path data generated by the identity script.
export const MARK = {
  lambda: 'M28.63 11.14Q32.00 5.00 35.37 11.14L57.59 51.62Q60.00 56.00 55.00 56.00L48.00 56.00Q45.00 56.00 43.52 53.39L33.97 36.48Q32.00 33.00 30.03 36.48L20.48 53.39Q19.00 56.00 16.00 56.00L9.00 56.00Q4.00 56.00 6.41 51.62Z',
  dot: { cx: 32, cy: 50.5, r: 4.6 },
};
// Inflated mark: a union of capsules around the inset core outline (same form as mark-sdf.js).
const CORE = [[0, 0.5467], [0.6458, -0.63], [0.5322, -0.63], [0, 0.3128], [-0.5322, -0.63], [-0.6458, -0.63]];
export function markObject({ color = C.glow, dotColor = C.ion, flat = false } = {}) {
  if (flat) return markObjectExtruded({ color, dotColor });
  const g = new THREE.Group(); const mat = plastic(color, { roughness: 0.3, sheen: 0.7, sheenColor: C.glowHi, env: 1.25 }); const ri = 0.17;
  for (let i = 0; i < CORE.length; i++) {
    const a = new THREE.Vector3(...CORE[i], 0), b = new THREE.Vector3(...CORE[(i + 1) % CORE.length], 0);
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(ri, len, 16, 48), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true; m.receiveShadow = true; g.add(m);
  }
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.185, 64, 48), plastic(dotColor, { roughness: 0.18 }));
  dot.position.set(0, -0.617, 0); dot.castShadow = true; g.add(dot);
  return g;
}
function markObjectExtruded({ depth = 2.2, bevel = 3.6, color = C.glow, dotColor = C.ion } = {}) {
  const loader = new SVGLoader();
  const data = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="${MARK.lambda}"/></svg>`);
  const shapes = SVGLoader.createShapes(data.paths[0]);
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: 2.1, bevelSegments: 16, curveSegments: 40 });
  geo.translate(-32, -32, -depth / 2); geo.scale(1 / 30, -1 / 30, 1 / 30); geo.computeVertexNormals();
  const g = new THREE.Group();
  const lam = new THREE.Mesh(geo, plastic(color, { roughness: 0.34, sheen: 0.8, sheenColor: C.glowHi, env: 1.3 })); lam.castShadow = true; lam.receiveShadow = true; g.add(lam);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(MARK.dot.r / 30 * 1.12, 64, 48), plastic(dotColor, { roughness: 0.18 }));
  dot.position.set((MARK.dot.cx - 32) / 30, -(MARK.dot.cy - 32) / 30, 0); dot.castShadow = true; g.add(dot);
  g.userData = { lam, dot };
  return g;
}

// Extruded glyph from an SVG string (used for the retired-product stand-ins).
export function glyphObject(svgText, { depth = 6, bevel = 1.6, material } = {}) {
  const data = new SVGLoader().parse(svgText);
  const g = new THREE.Group();
  for (const p of data.paths) {
    for (const s of SVGLoader.createShapes(p)) {
      const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 6, curveSegments: 24 });
      geo.translate(-32, -32, -depth / 2); geo.scale(1 / 30, -1 / 30, 1 / 30); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, material); m.castShadow = true; g.add(m);
    }
  }
  return g;
}

// Glossy primitives: the "toys" that fall in the physics box and float around the hero.
export function primitive(kind, color, o = {}) {
  let geo;
  if (kind === 'sphere') geo = new THREE.SphereGeometry(0.5, 64, 48);
  else if (kind === 'pill') geo = new THREE.CapsuleGeometry(0.32, 0.7, 16, 48);
  else if (kind === 'torus') geo = new THREE.TorusGeometry(0.38, 0.17, 48, 96);
  else if (kind === 'cube') geo = new RoundedBoxGeometry(0.85, 0.85, 0.85, 8, 0.2);
  else if (kind === 'cone') geo = new THREE.ConeGeometry(0.48, 0.9, 64, 1);
  else if (kind === 'ring') geo = new THREE.TorusGeometry(0.42, 0.08, 32, 96);
  const m = new THREE.Mesh(geo, o.material || plastic(color, o)); m.castShadow = true; m.receiveShadow = true; return m;
}

// A radial glow decal (for the light pool under a selected character).
export function glowDisc(color = C.glow, radius = 2.4, opacity = 0.9) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  const col = new THREE.Color(color); const rgb = `${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0}`;
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.35, `rgba(${rgb},0.45)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; return m;
}

// Stage floor: dark plum plastic that catches shadows; fades into the void.
export function stageFloor({ color = C.stage, size = 60 } = {}) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 96), new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.35, envMapIntensity: 0.12 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
}

export function keyLights(scene, { target = new THREE.Vector3(0, 0.8, 0), key = 40, rimL = 18, rimR = 14 } = {}) {
  const spot = new THREE.SpotLight(0xfff4fb, key, 30, Math.PI / 6, 0.85, 1.6);
  spot.position.set(-3, 9, 6); spot.target.position.copy(target); spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0004; spot.shadow.radius = 8; spot.shadow.camera.near = 2; spot.shadow.camera.far = 25;
  scene.add(spot, spot.target);
  const a = new THREE.PointLight(C.glow, rimL, 14, 1.6); a.position.set(-5, 2.5, -3.5); scene.add(a);
  const b = new THREE.PointLight(C.ion, rimR, 14, 1.6); b.position.set(5, 2, -3); scene.add(b);
  scene.add(new THREE.HemisphereLight(0xffe9fb, C.void, 0.25));
  return { spot, a, b };
}

// A vertical soft halo card (sits behind a selected character).
export function halo(color = C.glow, radius = 2.2, opacity = 0.6) {
  const m = glowDisc(color, radius, opacity); m.rotation.set(0, 0, 0); return m;
}
