// Cloud Chamber — shared three.js lab: rose studio environment, chrome / iridescent
// materials and extruded Unbounded glyphs. Used by render.html (bakes stills) and
// specimen.js (live). three@0.170.0, pinned.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const HUE = 348;
export const P = {
  s50: 0xfcf2f6, s200: 0xe2d2da, s400: 0xb49da8, s600: 0x7b606d, s800: 0x402c36, s950: 0x15090f,
  50: 0xfff8fb, 100: 0xfceaf3, 200: 0xf9d3e5, 300: 0xf4b0d2, 400: 0xe781b7, 500: 0xd64d9d,
  600: 0xb43481, 700: 0x892361, 800: 0x5e1942, 900: 0x381127, 950: 0x1e0915, 990: 0x0e0409,
};

export function rng(seed = 0x04246b) {
  let s = seed >>> 0;
  return () => { s |= 0; s = s + 0x6d2b79f5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// A studio environment built from primitives: graded dome, a dark horizon band,
// and soft-box panels. PMREM'd into an env map. `mood` = 'light' | 'dark'.
export function makeEnvironment(renderer, mood = 'light') {
  const env = new THREE.Scene();
  const L = mood === 'light';
  const top = new THREE.Color(L ? P.s200 : P.s600);
  const mid = new THREE.Color(L ? P.s400 : P.s800);
  const bot = new THREE.Color(L ? P.s800 : P.s950);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: top }, mid: { value: mid }, bot: { value: bot }, dark: { value: new THREE.Color(P[990]) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, mid, bot, dark; varying vec3 vP;
      void main(){ float h = normalize(vP).y;
        vec3 c = h > 0. ? mix(mid, top, smoothstep(0.0, 0.5, h)) : mix(dark, bot, smoothstep(-0.02, -0.6, h));
        gl_FragColor = vec4(c, 1.); }`,
  }));
  env.add(dome);
  const box = (w, h, x, y, z, color, intensity) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  box(26, 14, 0, 34, 10, 0xffffff, L ? 3.2 : 2.4);      // overhead key soft-box
  box(5, 34, -30, 6, 14, 0xffffff, 2.6);                // tall strip front-left
  box(4, 30, 32, 8, 4, P[400], 2.4);                    // rose strip right
  box(30, 4, 6, -6, 30, P[500], 1.6);                   // low rose bounce card
  box(12, 40, -24, 4, -26, P[990], 1);                  // black flag back-left
  box(12, 40, 26, 4, -22, P[990], 1);                   // black flag back-right
  box(40, 6, 0, 2, 38, P[900], 1);                      // dark band front (camera side)
  box(30, 2.5, 0, 10, -40, 0xffffff, 2.0);              // rim line behind
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(env, 0.008);
  pm.dispose();
  return rt.texture;
}

export const materials = {
  chrome: () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.06, envMapIntensity: 1.15, clearcoat: 0.6, clearcoatRoughness: 0.04 }),
  irid: () => new THREE.MeshPhysicalMaterial({ color: 0xffe9f3, metalness: 0.35, roughness: 0.08, iridescence: 1, iridescenceIOR: 2.0, iridescenceThicknessRange: [250, 750], envMapIntensity: 1.2, clearcoat: 1, clearcoatRoughness: 0.05 }),
  rose: () => new THREE.MeshPhysicalMaterial({ color: P[300], metalness: 1, roughness: 0.2, envMapIntensity: 1.1 }),
  wine: () => new THREE.MeshPhysicalMaterial({ color: P[600], metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.03 }),
  glass: () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.6, ior: 1.45, iridescence: 0.6, iridescenceThicknessRange: [200, 500], attenuationColor: new THREE.Color(P[300]), attenuationDistance: 1.5 }),
  satin: () => new THREE.MeshStandardMaterial({ color: P[300], metalness: 0.0, roughness: 0.55 }),
};

// Glyph JSON (from Unbounded wght 800, 1000 upm, y-up) -> THREE.Shape[]
export function glyphShapes(font, ch) {
  const g = font.glyphs[ch];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${g.d}"/></svg>`;
  const data = new SVGLoader().parse(svg);
  const shapes = [];
  // Unbounded's "A" is drawn with self-overlapping contours (fine for nonzero fill,
  // fatal for triangulation). Rebuilt as three overlapping convex solids — two legs
  // and the bar — which also clip cleanly along the fracture line.
  if (ch === 'A') {
    const V = (x, y) => new THREE.Vector2(x, y);
    shapes.push(new THREE.Shape([V(-1, 0), V(247, 0), V(488, 573), V(560, 750), V(334, 750)]));
    shapes.push(new THREE.Shape([V(729, 0), V(977, 0), V(642, 750), V(420, 750), V(488, 573)]));
    shapes.push(new THREE.Shape([V(285, 135), V(691, 135), V(612, 321), V(364, 321)]));
  } else for (const p of data.paths) shapes.push(...SVGLoader.createShapes(p));
  return { shapes, adv: g.adv };
}

export function glyphMesh(font, ch, material, { size = 1, depth = 0.32, bevel = 0.045, puffy = true } = {}) {
  const { shapes, adv } = glyphShapes(font, ch);
  const geo = puffy
    ? new THREE.ExtrudeGeometry(shapes, { depth: 40, bevelEnabled: true, bevelThickness: 120, bevelSize: 88, bevelOffset: -66, bevelSegments: 16, curveSegments: 24 })
    : new THREE.ExtrudeGeometry(shapes, { depth: depth * 1000 / size, bevelEnabled: true, bevelThickness: bevel * 1000 / size, bevelSize: bevel * 700 / size, bevelSegments: 6, curveSegments: 18 });
  geo.scale(size / 1000, size / 1000, size / 1000);
  geo.center();
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.userData.adv = adv * size / 1000;
  return m;
}

// Half-plane clip of a polygon (Sutherland–Hodgman). Keeps points where a*x+b*y+c >= 0
function clipPoly(pts, a, b, c) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const dp = a * p.x + b * p.y + c, dq = a * q.x + b * q.y + c;
    if (dp >= 0) out.push(p);
    if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); out.push(new THREE.Vector2(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t)); }
  }
  return out;
}
// The brand mark in 3D: Unbounded "A" split along the fracture line into two solids.
export function fracturedMark(font, matLo, matHi, { size = 2, depth = 0.5, bevel = 0.05, gap = 1 } = {}) {
  const { shapes } = glyphShapes(font, 'A');
  // fracture line in glyph space (same as logo-mark.svg): (-60,500) -> (1040,280)
  const x1 = -60, y1 = 500, x2 = 1040, y2 = 280;
  const a = -(y2 - y1), b = (x2 - x1), c = -(a * x1 + b * y1); // >=0 = above line
  const opts = { depth: depth * 1000 / size, bevelEnabled: true, bevelThickness: 110, bevelSize: 74, bevelOffset: -56, bevelSegments: 16, curveSegments: 4 };
  const make = (sign) => {
    const out = [];
    const strip = pts => { if (pts.length > 1 && pts[0].equals(pts[pts.length - 1])) pts.pop(); return pts; };
    for (const s of shapes) {
      const cl = clipPoly(strip(s.getPoints(4)), sign * a, sign * b, sign * c);
      if (cl.length < 3) continue;
      const shape = new THREE.Shape(cl);
      for (const h of s.holes) { const hc = clipPoly(strip(h.getPoints(4)), sign * a, sign * b, sign * c); if (hc.length >= 3) shape.holes.push(new THREE.Path(hc)); }
      out.push(shape);
    }
    const geo = new THREE.ExtrudeGeometry(out, opts);
    geo.translate(-490, -375, 0);
    geo.scale(size / 1000, size / 1000, size / 1000);
    geo.computeVertexNormals();
    return geo;
  };
  const group = new THREE.Group();
  const lo = new THREE.Mesh(make(-1), matLo);
  const hi = new THREE.Mesh(make(1), matHi);
  hi.position.set(0.034 * size * gap, 0.046 * size * gap, 0);
  group.add(lo, hi);
  group.userData = { lo, hi };
  return group;
}

export const prims = {
  sphere: r => new THREE.SphereGeometry(r, 64, 32),
  box: (s, r = 0.08) => new RoundedBoxGeometry(s, s, s, 6, r),
  capsule: (r, l) => new THREE.CapsuleGeometry(r, l, 12, 32),
  torus: (R, r) => new THREE.TorusGeometry(R, r, 32, 96),
  cone: (r, h) => new THREE.ConeGeometry(r, h, 64),
  knot: (R, r) => new THREE.TorusKnotGeometry(R, r, 220, 32, 2, 3),
  cyl: (r, h) => new THREE.CylinderGeometry(r, r, h, 64),
};

export async function loadFont(url) { return (await fetch(url)).json(); }

export function makeRenderer(canvas, { alpha = false, shadows = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  return renderer;
}
