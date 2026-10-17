// street.js — "Long Evening" main street, built from three.js primitives.
// One horizon: wooden houses in falu red and ochre beside sun-bleached pastel
// deco fronts, a ridge of spruce, a cliffed mountain beyond. The sun moves with
// the real time of day in Norway (see sun.js). Used two ways:
//   1. live: createStreet(canvas, { live: true })  → follows the real clock
//   2. baked: createStreet(canvas, { date, view })  → render one still (bake.html)
//
// Host page needs an import map for "three" (pinned three@0.170.0).

import * as THREE from 'three'
import { sunPosition, skyPalette } from './sun.js'

const XS = 1.2 // street spacing: gaps between houses let the low sun through
const INK = {
  falu: '#9e3b2e', ochre: '#d39a45', cream: '#f3eadb', mint: '#a9dcc6', flamingo: '#f2a7b4',
  peach: '#f6c19c', mauve: '#b391a8', smog: '#7e8fb0', palm: '#1d1f24', butter: '#f4dc8e',
  roof: '#34333a', roofRed: '#5a2a26', birch: '#ece6da', leaf: '#8c9a55', leafLate: '#c3a54d',
}

// ---------- small helpers ----------
const col = (h) => new THREE.Color(h)
let TOON_RAMP
function toonRamp() {
  if (TOON_RAMP) return TOON_RAMP
  const data = new Uint8Array([120, 120, 120, 255, 175, 175, 175, 255, 225, 225, 225, 255, 255, 255, 255, 255])
  TOON_RAMP = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat)
  TOON_RAMP.minFilter = TOON_RAMP.magFilter = THREE.NearestFilter
  TOON_RAMP.needsUpdate = true
  return TOON_RAMP
}
const MATS = new Map()
function toon(hex, extra = {}) {
  const key = hex + JSON.stringify(extra)
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshToonMaterial({ color: col(hex), gradientMap: toonRamp(), ...extra }))
  return MATS.get(key)
}
function boardTexture(vertical = true, lines = 26) {
  const c = document.createElement('canvas'); c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < lines; i++) {
    const p = (i / lines) * 256
    g.fillStyle = 'rgba(0,0,0,0.10)'
    vertical ? g.fillRect(p, 0, 1.6, 256) : g.fillRect(0, p, 256, 1.6)
    g.fillStyle = 'rgba(255,255,255,0.25)'
    vertical ? g.fillRect(p + 2, 0, 1, 256) : g.fillRect(0, p + 2, 256, 1)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
let BOARD_V, BOARD_H
function wood(hex, w, h, vertical = true) {
  BOARD_V ||= boardTexture(true); BOARD_H ||= boardTexture(false, 30)
  const t = (vertical ? BOARD_V : BOARD_H).clone()
  t.needsUpdate = true
  t.repeat.set(vertical ? w / 5 : 1, vertical ? 1 : h / 5)
  return new THREE.MeshToonMaterial({ color: col(hex), map: t, gradientMap: toonRamp() })
}
function box(w, h, d, mat, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true
  parent && parent.add(m)
  return m
}

// glass: an emissive plane whose glow follows night-ness; each window has its own threshold
const WINDOWS = []
function windowPane(w, h, x, y, z, parent, opts = {}) {
  const mat = new THREE.MeshToonMaterial({ color: col(opts.glass || '#55617e'), emissive: col(opts.light || '#ffcf8a'), emissiveIntensity: 0, gradientMap: toonRamp() })
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
  m.position.set(x, y, z); parent.add(m)
  WINDOWS.push({ mat, threshold: opts.threshold ?? Math.random() * 0.8 + 0.1, always: opts.always || 0 })
  return m
}
function trimmedWindow(cx, cy, z, w, h, parent, trim = INK.cream, opts = {}) {
  const t = toon(trim)
  box(w + 0.3, 0.16, 0.18, t, cx, cy + h / 2 + 0.08, z + 0.06, parent) // head
  box(w + 0.42, 0.14, 0.26, t, cx, cy - h / 2 - 0.07, z + 0.1, parent) // sill
  box(0.13, h, 0.12, t, cx - w / 2 - 0.06, cy, z + 0.05, parent)
  box(0.13, h, 0.12, t, cx + w / 2 + 0.06, cy, z + 0.05, parent)
  windowPane(w, h, cx, cy, z + 0.02, parent, opts)
  // muntins: one vertical, one horizontal (Norwegian two-light sash)
  box(0.06, h, 0.05, t, cx, cy, z + 0.05, parent)
  box(w, 0.06, 0.05, t, cx, cy + h * 0.12, z + 0.05, parent)
}

// ---------- buildings ----------
function gableHouse(o) {
  const g = new THREE.Group()
  const { x, w, h, d = 8, roofH = w * 0.42, color, trim = INK.cream, roof = INK.roof, front = true, rows = 2, cols = 2 } = o
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood(color, w, h))
  body.position.set(0, h / 2, -d / 2); body.castShadow = body.receiveShadow = true; g.add(body)
  // gable triangle (front face) as extruded triangle
  const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, roofH); tri.closePath()
  const triMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: d, bevelEnabled: false }), wood(color, w, roofH))
  triMesh.castShadow = triMesh.receiveShadow = true
  if (front) { triMesh.position.set(0, h, -d) }
  else { triMesh.rotation.y = Math.PI / 2; triMesh.scale.set(d / w, 1, w / d); triMesh.position.set(-w / 2, h, 0) }
  g.add(triMesh)
  // roof slabs
  const rm = toon(roof)
  if (front) {
    const half = w / 2 + 0.35, len = Math.hypot(half, roofH + 0.25), ang = Math.atan2(roofH, w / 2)
    for (const s of [-1, 1]) {
      const slab = box(len, 0.28, d + 0.7, rm, s * (w / 4 + 0.05), h + roofH / 2 + 0.1, -d / 2 + 0.1, g)
      slab.rotation.z = -s * ang
    }
    // gable window
    trimmedWindow(0, h + roofH * 0.36, 0, 0.7, 0.9, g, trim, { threshold: 0.75 })
    // corner boards and bargeboard trim
    box(0.22, h, 0.22, toon(trim), -w / 2 + 0.05, h / 2, 0.04, g)
    box(0.22, h, 0.22, toon(trim), w / 2 - 0.05, h / 2, 0.04, g)
  } else {
    const rh = roofH * 0.8, half = d / 2 + 0.35, len = Math.hypot(half, rh), ang = Math.atan2(rh, d / 2)
    for (const s of [-1, 1]) {
      const slab = box(w + 0.8, 0.28, len, rm, 0, h + rh / 2 + 0.1, -d / 2 + s * (d / 4 + 0.05), g)
      slab.rotation.x = s * ang
    }
    box(0.22, h, 0.22, toon(trim), -w / 2 + 0.05, h / 2, 0.04, g)
    box(0.22, h, 0.22, toon(trim), w / 2 - 0.05, h / 2, 0.04, g)
    box(w + 0.1, 0.24, 0.2, toon(trim), 0, h - 0.1, 0.05, g)
  }
  // windows
  const floorH = h / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (o.door && r === 0 && c === o.doorCol) continue
      const cx = -w / 2 + (w / cols) * (c + 0.5)
      trimmedWindow(cx, floorH * r + floorH * 0.55, 0, 1.0, 1.45, g, trim, o.shop && r === 0 ? { always: o.shopLight ?? 1, threshold: 0 } : {})
    }
  }
  if (o.door) {
    const cx = -w / 2 + (w / cols) * (o.doorCol + 0.5)
    box(1.2, 2.3, 0.12, toon(o.doorColor || INK.palm), cx, 1.15, 0.02, g)
    box(1.6, 0.14, 0.9, toon(trim), cx, 2.55, 0.45, g) // canopy
    box(1.6, 0.18, 0.5, toon(trim), cx, 0.09, 0.25, g) // step
  }
  // shop window: wide, warm, the 7am bakery
  if (o.shopWide) {
    windowPane(w * 0.62, 1.7, 0, 1.55, 0.03, g, { always: 1, threshold: 0, light: '#ffd79a' })
    box(w * 0.62 + 0.3, 0.2, 0.2, toon(trim), 0, 2.5, 0.08, g)
    box(w * 0.62 + 0.4, 0.16, 0.3, toon(trim), 0, 0.62, 0.1, g)
    // striped awning, flamingo and cream
    const aw = new THREE.Group(); const n = 9, aw_w = w * 0.7
    for (let i = 0; i < n; i++) box(aw_w / n, 0.06, 1.3, toon(i % 2 ? INK.cream : INK.flamingo), -aw_w / 2 + (aw_w / n) * (i + 0.5), 0, 0.65, aw)
    aw.position.set(0, 2.95, 0.05); aw.rotation.x = 0.32; g.add(aw)
  }
  g.position.x = x
  return g
}

function roundedPlan(w, d, rl, rr) {
  // plan in x (width) / y (depth); front edge at y=0, back at y=-d
  const s = new THREE.Shape()
  s.moveTo(-w / 2, -d)
  s.lineTo(w / 2, -d)
  if (rr) { s.lineTo(w / 2, -rr); s.absarc(w / 2 - rr, -rr, rr, 0, Math.PI / 2, false) } else s.lineTo(w / 2, 0)
  if (rl) { s.lineTo(-w / 2 + rl, 0); s.absarc(-w / 2 + rl, -rl, rl, Math.PI / 2, Math.PI, false) } else s.lineTo(-w / 2, 0)
  s.closePath()
  return s
}

function decoBlock(o) {
  const g = new THREE.Group()
  const { x, w, h, d = 9, color, accent = INK.cream, rl = 0, rr = 0, floors = 2, tower = false } = o
  const geo = new THREE.ExtrudeGeometry(roundedPlan(w, d, rl, rr), { depth: h, bevelEnabled: false, curveSegments: 24 })
  geo.rotateX(Math.PI / 2); geo.translate(0, h, 0)
  // plan y (0 front … -d back) maps to z, extrusion grows downward then lifts by h
  const body = new THREE.Mesh(geo, toon(color)); body.castShadow = body.receiveShadow = true; g.add(body)
  const am = toon(accent)
  // cornice + speed lines
  const corn = new THREE.ExtrudeGeometry(roundedPlan(w + 0.3, d + 0.3, rl && rl + 0.15, rr && rr + 0.15), { depth: 0.3, bevelEnabled: false, curveSegments: 24 })
  corn.rotateX(Math.PI / 2); corn.translate(0, 0.3, 0)
  const c1 = new THREE.Mesh(corn, am); c1.position.set(0, h, 0.15); c1.castShadow = true; g.add(c1)
  for (let i = 0; i < 3; i++) {
    const line = new THREE.Mesh(corn, toon(o.lines || accent)); line.scale.y = 0.4
    line.position.set(0, h - 0.7 - i * 0.42, 0.15); g.add(line)
  }
  // stepped parapet
  if (tower) {
    box(w * 0.34, 1.6, 1.0, toon(color), 0, h + 1.1, -0.5, g)
    box(w * 0.2, 1.2, 0.9, toon(color), 0, h + 2.5, -0.5, g)
    box(w * 0.1, 0.8, 0.8, am, 0, h + 3.4, -0.5, g)
    box(w * 0.36, 0.14, 1.1, am, 0, h + 1.92, -0.45, g)
  }
  // ribbon windows with eyebrow ledges
  const fh = (h - 1.6) / floors
  for (let f = 0; f < floors; f++) {
    const y = 0.4 + fh * f + fh * 0.55
    if (f === 0 && o.shopfront) {
      windowPane(w * 0.56, 1.9, -w * 0.12, 1.45, 0.02, g, { always: o.shopLight ?? 0.8, threshold: 0, light: '#ffe2b0' })
      box(w * 0.6, 0.16, 0.9, am, -w * 0.12, 2.6, 0.45, g)
      box(1.3, 2.4, 0.1, toon(o.doorColor || INK.palm), w * 0.3, 1.2, 0.02, g)
      box(1.9, 0.14, 1.1, am, w * 0.3, 2.62, 0.55, g)
      continue
    }
    const ww = Math.min(w * 0.7, w - 2.2)
    windowPane(ww, 1.25, 0, y, 0.02, g)
    box(ww + 0.8, 0.1, 0.75, am, 0, y + 0.85, 0.37, g) // eyebrow
    box(ww + 0.3, 0.1, 0.2, am, 0, y - 0.7, 0.1, g)
    for (let k = 1; k < 4; k++) box(0.07, 1.25, 0.06, am, -ww / 2 + (ww / 4) * k, y, 0.05, g)
  }
  // vertical fin
  if (o.fin) {
    box(0.35, h * 0.6, 1.4, am, o.fin * w / 2 * 0.62, h * 0.55, 0.7, g)
  }
  g.position.x = x
  return g
}

function lamp(x, z, parent) {
  const g = new THREE.Group()
  const pm = toon(INK.palm)
  box(0.14, 4.2, 0.14, pm, 0, 2.1, 0, g)
  box(0.5, 0.2, 0.5, pm, 0, 0.1, 0, g)
  box(0.9, 0.08, 0.08, pm, 0.3, 4.1, 0, g)
  const glob = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 12), new THREE.MeshToonMaterial({ color: col('#fbe9cf'), emissive: col('#ffcf8a'), emissiveIntensity: 0, gradientMap: toonRamp() }))
  glob.position.set(0.72, 3.85, 0); g.add(glob)
  WINDOWS.push({ mat: glob.material, threshold: 0.2, always: 0, lamp: true })
  g.position.set(x, 0, z); parent.add(g)
}

function birch(x, z, s, parent, leafHex = INK.leaf) {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.2 * s, 7 * s, 8), toon(INK.birch))
  trunk.position.y = 3.5 * s; trunk.castShadow = true; g.add(trunk)
  const lm = toon(leafHex, { flatShading: true })
  const blobs = [[0, 6.6, 0, 1.7], [0.9, 5.6, 0.3, 1.3], [-0.9, 5.4, -0.2, 1.25], [0.2, 7.6, 0, 1.15], [-0.5, 4.6, 0.4, 0.9]]
  for (const [bx, by, bz, r] of blobs) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), lm)
    m.position.set(bx * s, by * s, bz * s); m.castShadow = true; g.add(m)
  }
  g.position.set(x, 0, z); parent.add(g)
}

// ---------- landscape ----------
function ridgeShape(width, heightFn, steps = 220) {
  const s = new THREE.Shape(); s.moveTo(-width / 2, -40)
  for (let i = 0; i <= steps; i++) { const u = i / steps; s.lineTo(-width / 2 + u * width, heightFn(u)) }
  s.lineTo(width / 2, -40); s.closePath()
  return s
}
const RIDGES = []
function ridge(width, z, heightFn, inkHex, hazeAmt, parent, steps) {
  const geo = new THREE.ShapeGeometry(ridgeShape(width, heightFn, steps))
  const mat = new THREE.ShaderMaterial({
    uniforms: { ink: { value: col(inkHex) }, haze: { value: col('#ffffff') }, amt: { value: hazeAmt }, top: { value: 0 }, rim: { value: col('#ffffff') }, rimAmt: { value: 0 } },
    vertexShader: 'varying float vy; void main(){ vy = position.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform vec3 ink; uniform vec3 haze; uniform float amt; uniform float top; varying float vy;
      void main(){ float t = clamp(1.0 - (vy+5.0)/(top+5.0), 0.0, 1.0); float h = amt + 0.28*pow(t,1.4);
        vec3 c = mix(ink, haze, clamp(h,0.0,0.92)); gl_FragColor = vec4(c,1.0);
        #include <colorspace_fragment>
      }`,
    depthWrite: true,
  })
  const m = new THREE.Mesh(geo, mat); m.position.z = z; parent.add(m)
  let top = 0; for (let i = 0; i <= 200; i++) top = Math.max(top, heightFn(i / 200))
  mat.uniforms.top.value = top
  RIDGES.push({ mat, ink: col(inkHex), hazeAmt })
  return m
}
// deterministic noise
function hash(n) { return (Math.sin(n * 127.1) * 43758.5453) % 1 }
function vnoise(x) { const i = Math.floor(x), f = x - i; const a = Math.abs(hash(i)), b = Math.abs(hash(i + 1)); const u = f * f * (3 - 2 * f); return a + (b - a) * u }
function fbm(x, o = 5) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { v += a * vnoise(x * f); f *= 2.03; a *= 0.5 } return v }

// ---------- sky ----------
function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {
      zenith: { value: col('#86b6d9') }, horizon: { value: col('#eef3ec') }, glow: { value: col('#fff') }, sunCol: { value: col('#fff') },
      sunDir: { value: new THREE.Vector3(0, 0.2, -1) }, night: { value: 0 }, bands: { value: 22 },
    },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position = p.xyww; }',
    fragmentShader: `
      uniform vec3 zenith, horizon, glow, sunCol, sunDir; uniform float night, bands; varying vec3 vDir;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.2, 1.0);
        float g = pow(clamp(h,0.0,1.0)/0.55, 0.62);
        // poster airbrush: soft banding like a silkscreen gradient
        float gb = floor(clamp(g,0.0,1.0)*bands)/bands;
        g = mix(g, gb, 0.35);
        vec3 c = mix(horizon, zenith, clamp(g,0.0,1.0));
        vec3 s = normalize(sunDir);
        float cosA = dot(d, s);
        float glowF = pow(max(cosA,0.0), 6.0) * (1.0 - smoothstep(0.0, 0.5, h));
        float wide = pow(max(cosA*0.5+0.5,0.0), 3.0) * (1.0 - smoothstep(-0.05, 0.35, h));
        c = mix(c, glow, clamp(glowF*0.85 + wide*0.45, 0.0, 1.0));
        // long horizontal clouds lit from below
        vec2 cp = vec2(atan(d.x, -d.z)*3.2, h*38.0);
        float cl = n2(cp*vec2(1.0,1.0)) * n2(cp*vec2(0.5,2.3)+7.1);
        float band = smoothstep(0.03, 0.10, h) * (1.0 - smoothstep(0.16, 0.30, h));
        float cloud = smoothstep(0.28, 0.42, cl) * band;
        vec3 cloudCol = mix(mix(glow, sunCol, 0.4), mix(glow, horizon, 0.55) * 0.92, clamp(night, 0.0, 1.0));
        c = mix(c, cloudCol, cloud*0.75);
        // sun disc
        float disc = smoothstep(0.99955, 0.99972, cosA);
        c = mix(c, sunCol, disc * (1.0 - night*0.9) * smoothstep(-0.012, 0.004, s.y + 0.008) );
        // a few stars only when properly dim
        float st = step(0.9985, h21(floor(d.xz*420.0 + d.y*91.0))) * smoothstep(0.15, 0.6, h) * smoothstep(0.75, 1.0, night);
        c += st*0.35;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  })
  return new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), mat)
}

// ---------- the scene ----------
export const VIEWS = {
  street: { pos: [0, 7, 96], look: [0, 15.5, -40], fov: 24 },
  wide: { pos: [0, 1.7, 120], look: [0, 12, -40], fov: 26 },
  portrait: { pos: [-1.5, 6, 66], look: [-1.5, 23, -40], fov: 46 },
  'mcp-emails': { pos: [-13.8 * XS, 1.7, 22], look: [-13.8 * XS, 6.2, -10], fov: 42 },
  'fun-libs': { pos: [2.6 * XS + 2.4, 1.7, 21], look: [2.6 * XS + 1.4, 6.0, -10], fov: 42 },
  toolrails: { pos: [19.6 * XS - 1.6, 1.7, 26], look: [19.6 * XS - 0.9, 8.2, -10], fov: 44 },
  harbor: { pos: [-5.2 * XS + 0.9, 1.7, 21], look: [-5.2 * XS + 0.2, 6.0, -10], fov: 42 },
}

export function createStreet(canvas, opts = {}) {
  WINDOWS.length = 0; RIDGES.length = 0
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !!opts.bake })
  renderer.setPixelRatio(opts.pixelRatio ?? Math.min(devicePixelRatio, 1.75))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 2500)

  const sky = makeSky(); scene.add(sky)

  // landscape layers (north is -z, east is +x)
  const land = new THREE.Group(); scene.add(land)
  // pale far range, almost sky
  ridge(3200, -1500, (u) => { const x = (u - 0.5) * 3200; return 120 + 70 * Math.exp(-Math.pow((x - 520) / 260, 2)) + 40 * fbm(u * 9 + 2) }, '#9a8fb0', 0.78, land, 300)
  // the cliffed massif: a plateau that breaks off into a sheer wall, a valley notch, a sharp peak
  const K = [[-1200, 95], [-600, 100], [-200, 108], [-130, 104], [-108, 70], [-88, 40], [-30, 26], [30, 30], [80, 58], [150, 92], [220, 104], [275, 130], [305, 110], [400, 92], [540, 74], [660, 86], [900, 78], [1200, 92]]
  const lerpK = (x) => { for (let i = 0; i < K.length - 1; i++) { const [x0, y0] = K[i], [x1, y1] = K[i + 1]; if (x <= x1) return y0 + (y1 - y0) * ((x - x0) / (x1 - x0)) } return K[K.length - 1][1] }
  ridge(2400, -900, (u) => { const x = (u - 0.5) * 2400; return lerpK(x) + 7 * fbm(u * 60) - 3 }, '#6f6a8f', 0.5, land, 900)
  // rolling mid hills
  ridge(1800, -520, (u) => 24 + 16 * fbm(u * 8 + 3) + 10 * Math.exp(-Math.pow((u - 0.72) / 0.07, 2)), '#4f5d7c', 0.36, land, 400)
  // spruce ridge: pointed crowns of uneven height
  ridge(1000, -190, (u) => {
    const base = 8 + 5 * fbm(u * 6 + 11)
    const k = u * 300, f = k - Math.floor(k), id = Math.floor(k)
    const tri = 1 - Math.abs(f * 2 - 1)
    const tall = 0.55 + 0.45 * Math.abs(Math.sin(id * 12.9898) * 43758.5453 % 1)
    return base + 4.2 * tall * Math.pow(tri, 1.6)
  }, '#24302f', 0.16, land, 3000)

  // ground
  const groundMat = new THREE.MeshBasicMaterial({ color: col('#e8cdb0') })
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 300), groundMat)
  ground.rotation.x = -Math.PI / 2; ground.position.z = -20; scene.add(ground)
  // poster shadows: drawn as a flat ink, independent of how grazing the light is
  const shadowMat = new THREE.ShadowMaterial({ color: col('#6b5a86'), opacity: 0.42 })
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(600, 184), shadowMat)
  shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.set(0, 0.2, -78); shadowPlane.receiveShadow = true; scene.add(shadowPlane);
  const meadowMat = new THREE.MeshBasicMaterial({ color: col('#cdb77c') })
  const meadow = new THREE.Mesh(new THREE.PlaneGeometry(600, 120), meadowMat)
  meadow.rotation.x = -Math.PI / 2; meadow.position.set(0, 0.04, 16 + 60); scene.add(meadow)
  // mown stripes across the meadow: widths grow toward the viewer, a quiet depth cue
  const meadowMat2 = new THREE.MeshBasicMaterial({ color: col('#bfae6c') })
  for (let i = 0, z = 16.6; i < 9; i++) {
    const wz = 1.6 * Math.pow(1.42, i)
    if (i % 2 === 0) { const st = new THREE.Mesh(new THREE.PlaneGeometry(600, wz), meadowMat2); st.rotation.x = -Math.PI / 2; st.position.set(0, 0.06, z + wz / 2); scene.add(st) }
    z += wz
  }
  const field = new THREE.Mesh(new THREE.PlaneGeometry(1400, 300), toon('#a39a5f'))
  field.rotation.x = -Math.PI / 2; field.position.set(0, -0.05, -160); scene.add(field)
  const walkMat = new THREE.MeshBasicMaterial({ color: col('#f1e2cc') })
  const walk = box(200, 0.18, 3.2, walkMat, 0, 0.09, 1.6, scene)
  walk.castShadow = false
  box(200, 0.2, 0.25, toon(INK.cream), 0, 0.1, 3.25, scene)
  const roadMat = new THREE.MeshBasicMaterial({ color: col('#9a9fb4') })
  const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 9), roadMat)
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.03, 8); scene.add(road)
  const lineMat = new THREE.MeshBasicMaterial({ color: col('#f3e6cf') })
  for (let i = -30; i <= 30; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.16), lineMat); d.rotation.x = -Math.PI / 2; d.position.set(i * 5, 0.05, 8); scene.add(d) }
  const nearWalk = box(400, 0.18, 3.4, walkMat, 0, 0.09, 14.2, scene); nearWalk.castShadow = false
  box(400, 0.2, 0.25, toon(INK.cream), 0, 0.1, 12.5, scene).castShadow = false

  // the street: alternate the two worlds, never a postcard of either
  const street = new THREE.Group(); scene.add(street)
  const B = [
    gableHouse({ x: -33 * XS, w: 8, h: 6.4, color: INK.ochre, rows: 2, cols: 2, door: true, doorCol: 0 }),
    decoBlock({ x: -23.4 * XS, w: 10.4, h: 8.6, color: INK.mint, accent: '#f7f2e8', rl: 2.2, floors: 2, fin: -1 }),
    decoBlock({ x: -13.8 * XS, w: 8.2, h: 7.2, color: '#f5efe4', accent: INK.mauve, lines: INK.mauve, floors: 2, shopfront: true, shopLight: 0.7 }), // MCP Emails
    gableHouse({ x: -5.2 * XS, w: 7.2, h: 6.0, color: INK.cream, roof: INK.roof, rows: 2, cols: 2, door: true, doorCol: 1, doorColor: INK.smog }), // Harbor
    gableHouse({ x: 2.6 * XS, w: 7.8, h: 6.2, color: INK.falu, rows: 2, cols: 2, shopWide: true, shop: false }), // Fun Libs bakery
    gableHouse({ x: 10.4 * XS, w: 6.6, h: 5.4, color: INK.butter, front: false, rows: 2, cols: 3, door: true, doorCol: 1, doorColor: INK.falu }),
    decoBlock({ x: 19.6 * XS, w: 10.2, h: 9.4, color: INK.flamingo, accent: '#fbf3ea', rr: 2.4, floors: 2, tower: true, shopfront: true, shopLight: 0.6 }), // Toolrails
    gableHouse({ x: 29.6 * XS, w: 8.2, h: 6.8, color: INK.falu, rows: 2, cols: 3, door: true, doorCol: 2 }),
    decoBlock({ x: 39.6 * XS, w: 9.6, h: 7.8, color: INK.peach, accent: '#fbf3ea', rl: 2.0, floors: 2 }),
    gableHouse({ x: -42.5 * XS, w: 7, h: 5.8, color: INK.cream, rows: 2, cols: 2, roof: INK.roofRed }),
  ]
  B.forEach((b) => street.add(b))
  lamp(-18.9 * XS, 2.6, scene); lamp(6.8 * XS, 2.6, scene); lamp(24.9 * XS, 2.6, scene); lamp(-38 * XS, 2.6, scene)
  birch(-28.4 * XS, -1.8, 1.0, scene, INK.leafLate)
  birch(14.2 * XS, -2.4, 0.86, scene)
  birch(34.2 * XS, -1.6, 0.8, scene, INK.leafLate)

  // product signs (real logos as textures); set by setSigns()
  const signs = new THREE.Group(); scene.add(signs)

  // lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x887766, 0.9); scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xffffff, 2.2)
  sun.castShadow = true
  sun.shadow.mapSize.set(opts.bake ? 4096 : 2048, opts.bake ? 4096 : 2048)
  Object.assign(sun.shadow.camera, { left: -140, right: 140, top: 140, bottom: -140, near: 1, far: 600 })
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05; sun.shadow.camera.updateProjectionMatrix()
  scene.add(sun); scene.add(sun.target)

  let view = VIEWS[opts.view || 'street']
  let date = opts.date || new Date()

  function applyTime(d) {
    date = d
    const { elevation, azimuth } = sunPosition(d)
    const p = skyPalette(elevation)
    const u = sky.material.uniforms
    u.zenith.value.set(p.zenith); u.horizon.value.set(p.horizon); u.glow.value.set(p.glow); u.sunCol.value.set(p.sun); u.night.value = p.night
    // poster framing: sky disc azimuth compressed toward north so dawn sits right, dusk left
    let rel = ((azimuth + 180) % 360) - 180 // -180..180, 0 = north
    const disp = THREE.MathUtils.degToRad(rel * 0.12)
    const el = THREE.MathUtils.degToRad(elevation)
    u.sunDir.value.set(Math.sin(disp) * Math.cos(el), Math.sin(el), -Math.cos(disp) * Math.cos(el))
    // physical light direction, softened so shadows never go to infinity
    const a = THREE.MathUtils.degToRad(azimuth), le = THREE.MathUtils.degToRad(Math.max(elevation, 2.2))
    sun.position.set(Math.sin(a) * Math.cos(le) * 200, Math.sin(le) * 200, -Math.cos(a) * Math.cos(le) * 200)
    sun.color.set(p.sun)
    sun.intensity = 2.6 * THREE.MathUtils.smoothstep(elevation, -4, 6) + 0.05
    hemi.color.set(p.zenith).lerp(col('#ffffff'), 0.5); hemi.groundColor.set(p.ambient).lerp(col(p.horizon), 0.4)
    hemi.intensity = 1.2 + 0.4 * (1 - p.night) - 0.45 * THREE.MathUtils.smoothstep(elevation, 8, 40)
    const haze = col(p.horizon).lerp(col(p.zenith), 0.18)
    for (const r of RIDGES) { r.mat.uniforms.haze.value.copy(haze) }
    groundMat.color.set('#ecd2b4').lerp(col(p.horizon), 0.3).lerp(col('#5a5f7c'), 0.1 + 0.7 * p.night)
    walkMat.color.copy(groundMat.color).lerp(col('#fff6ea'), 0.35 * (1 - p.night))
    roadMat.color.set('#a3a6b8').lerp(col(p.zenith), 0.35).lerp(col(p.horizon), 0.15)
    lineMat.color.copy(walkMat.color)
    meadowMat.color.set('#c4b877').lerp(col(p.horizon), 0.18).lerp(col('#434a68'), 0.1 + 0.75 * p.night)
    meadowMat2.color.copy(meadowMat.color).multiplyScalar(0.93).lerp(col(p.zenith), 0.06)
    shadowMat.color.set(p.zenith).lerp(col('#5a4a78'), 0.5)
    shadowMat.opacity = 0.5 * THREE.MathUtils.smoothstep(elevation, -1.5, 3)
    // windows & lamps come on as the evening deepens; the bakery is always lit
    const dusk = THREE.MathUtils.smoothstep(-elevation, -10, 8) // 0 high sun → 1 below horizon
    for (const w of WINDOWS) {
      const on = dusk > w.threshold ? 1 : 0
      w.mat.emissiveIntensity = Math.max(on * (w.lamp ? 1.6 : 0.95) * Math.min(1, (dusk - w.threshold) * 4 + 0.3), w.always * (0.35 + 0.65 * dusk))
    }
    renderer.toneMapping = THREE.NoToneMapping
    return { elevation, azimuth, palette: p }
  }

  function resize() {
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  function setView(name, t = 1) {
    view = VIEWS[name] || name
    camera.fov = view.fov; camera.position.set(...view.pos); camera.lookAt(...view.look); camera.updateProjectionMatrix()
  }
  setView(opts.view || 'street')
  resize()
  applyTime(date)

  async function setSigns(map) {
    const loader = new THREE.TextureLoader()
    const make = async (url, w, h, x, y, z, backHex, rotY = 0, pad = 0.12) => {
      let tex
      if (/\.svg$/i.test(url)) {
        // rasterise vector logos crisply (an <img> of an SVG decodes at its tiny intrinsic size)
        const img = new Image(); img.src = url; await img.decode()
        const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * (img.naturalHeight / img.naturalWidth || h / w))
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        tex = new THREE.CanvasTexture(c)
      } else tex = await loader.loadAsync(url)
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8
      const g = new THREE.Group()
      if (backHex) box(w + pad * 2, h + pad * 2, 0.1, new THREE.MeshBasicMaterial({ color: col(backHex) }), 0, 0, -0.06, g) // enamel: always reads clean
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }))
      g.add(m); g.position.set(x, y, z); g.rotation.y = rotY; signs.add(g)
      return g
    }
    const jobs = []
    if (map['mcp-emails']) jobs.push(make(map['mcp-emails'], 4.7, 0.8, -13.8 * XS - 0.3, 3.3, 0.62, '#fbf7ef', 0, 0.16)) // enamel fascia over the shopfront
    if (map['fun-libs']) {
      // projecting bracket off the bakery front, sign turned toward the street
      const pm = toon(INK.palm), sx = 2.6 * XS + 3.9 - 0.75
      box(0.08, 0.08, 1.7, pm, sx, 3.75, 0.85, signs)
      box(0.05, 0.38, 0.05, pm, sx, 3.55, 1.45, signs)
      jobs.push(make(map['fun-libs'], 1.1, 1.1, sx, 2.72, 1.45, INK.palm, -0.35, 0.06))
    }
    if (map.toolrails) {
      const sx = 19.6 * XS - 10.2 / 2 + 2.3
      box(0.1, 0.1, 1.5, toon('#fbf3ea'), sx, 6.3, 0.75, signs)
      box(0.05, 0.3, 0.05, toon(INK.palm), sx, 6.1, 1.35, signs)
      jobs.push(make(map.toolrails, 1.6, 1.6, sx, 5.05, 1.35, '#fbf3ea', 0.3, 0.14))
    }
    if (map.harbor) jobs.push(make(map.harbor, 2.6, 0.65, -5.2 * XS, 3.3, 0.18, '#fbf7ef'))
    await Promise.all(jobs)
  }

  let raf = 0, running = false
  function frame() {
    if (!running) return
    if (opts.live) applyTime(new Date())
    renderer.render(scene, camera)
    raf = requestAnimationFrame(frame)
  }
  function start() { if (!running) { running = true; frame() } }
  function stop() { running = false; cancelAnimationFrame(raf) }
  function render() { renderer.render(scene, camera) }

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { resize(); render() }) : null
  ro && ro.observe(canvas)

  return { scene, camera, renderer, applyTime, setView, setSigns, render, start, stop, resize, setLive(v) { opts.live = !!v }, dispose() { stop(); ro && ro.disconnect(); renderer.dispose() } }
}
