// Pavilion Light — a symmetrical pastel miniature built from three.js primitives.
// One horizon, one building, one day. setTime(0..1) moves the sun from first
// light (0) through a clean pastel morning (~0.3) to sunset (1).
// Hidden: click the sun three times (or press "n") for "After Hours".
//
//   import { createPavilion } from './3d/pavilion.js'
//   const p = await createPavilion(canvas, { time: .3, view: 'front' })
//   p.setTime(.7); p.setView('tower'); p.setNight(true)
//
// Also: createKiosk(canvas, { logo: url, awning: '#B5352B', time, closed })
import * as THREE from '../vendor/three.module.min.js'

const BASE = new URL('..', import.meta.url).href // assets/

export const PALETTE = {
  zinc: '#8E959B', zincDeep: '#565C63', cream: '#F3EBDD', creamWarm: '#EADBC4',
  cafe: '#B5352B', brass: '#B8924A', ink: '#2A2A2E',
  flamingo: '#EFA6AE', mint: '#BFE3D3', sky: '#CFE3EE', ochre: '#D9B36C',
}

// ---------- sky keyframes: [t, zenith, horizon, sunColor, sunIntensity, hemiIntensity]
const KEYS = [
  [0.00, '#7C86B8', '#F6B9A2', '#FF9F7A', 1.2, 0.55],
  [0.12, '#93AFD6', '#F8CFC2', '#FFC4A0', 2.0, 0.75],
  [0.30, '#8FC6E4', '#F6DED6', '#FFF1DC', 2.7, 0.90],
  [0.50, '#7DBBE0', '#E2F0EA', '#FFFBF0', 2.9, 0.95],
  [0.72, '#8EB4D8', '#F6DAB0', '#FFD9A0', 2.5, 0.85],
  [0.88, '#7480B0', '#F4AC90', '#FFAE78', 1.8, 0.70],
  [1.00, '#4E4F86', '#EF8C76', '#FF8459', 1.1, 0.50],
]
const NIGHT = ['#151A33', '#3A3F66', '#9FB3FF', 0.25, 0.25]

const c3 = (h) => new THREE.Color(h)
function sampleKeys(t) {
  t = THREE.MathUtils.clamp(t, 0, 1)
  let i = 0
  while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++
  const a = KEYS[i], b = KEYS[i + 1]
  const k = THREE.MathUtils.smoothstep((t - a[0]) / (b[0] - a[0]), 0, 1)
  return {
    zenith: c3(a[1]).lerp(c3(b[1]), k),
    horizon: c3(a[2]).lerp(c3(b[2]), k),
    sun: c3(a[3]).lerp(c3(b[3]), k),
    sunI: THREE.MathUtils.lerp(a[4], b[4], k),
    hemiI: THREE.MathUtils.lerp(a[5], b[5], k),
  }
}

// ---------- shared GLSL sky (used by the dome and the sea reflection)
const SKY_GLSL = /* glsl */`
uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uSunCol; uniform vec3 uSunDir; uniform float uNight;
vec3 skyCol(vec3 d){
  float h = clamp(d.y, -0.2, 1.0);
  float g = smoothstep(-0.01, 0.42, h); g = pow(g, 0.8);
  vec3 c = mix(uHorizon, uZenith, g);
  float s = max(dot(normalize(d), uSunDir), 0.0);
  c += uSunCol * (pow(s, 6.0) * 0.18 + pow(s, 60.0) * 0.35) * (1.0 - uNight * 0.8);
  // warm band hugging the horizon
  c = mix(c, uHorizon * 1.04, smoothstep(0.05, 0.0, abs(h)) * 0.4);
  return c;
}`

function skyMaterial(u) {
  return new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `,
    fragmentShader: `${SKY_GLSL}
      uniform float uSunSize; uniform float uTime;
      varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float a=0.5, r=0.0; for(int i=0;i<4;i++){ r+=a*vnoise(p); p*=2.03; a*=0.5; } return r; }
      void main(){
        vec3 d = normalize(vDir);
        vec3 c = skyCol(d);
        // two long painted cloud streaks, drifting very slowly
        float az = atan(d.x, -d.z);
        float e = d.y;
        float band1 = smoothstep(0.018, 0.0, abs(e - 0.075 - 0.01*sin(az*3.0)));
        float band2 = smoothstep(0.012, 0.0, abs(e - 0.135 - 0.008*sin(az*2.0+1.0)));
        float n1 = smoothstep(0.48, 0.72, fbm(vec2(az*7.0 + uTime*0.01, 1.0)));
        float n2 = smoothstep(0.52, 0.75, fbm(vec2(az*5.0 - uTime*0.008, 7.0)));
        vec3 cloud = mix(uHorizon, vec3(1.0), 0.55) + uSunCol*0.05;
        c = mix(c, cloud, (band1*n1*0.55 + band2*n2*0.4) * (1.0 - uNight*0.7));
        float s = dot(d, uSunDir);
        float disc = smoothstep(cos(uSunSize), cos(uSunSize*0.96), s);
        float halo = smoothstep(cos(uSunSize*2.6), cos(uSunSize), s) * 0.12;
        vec3 discCol = mix(vec3(1.0, 0.84, 0.58), uSunCol, 0.35) * 1.04;
        c = mix(c, discCol, halo * (1.0 - uNight));
        c = mix(c, discCol, disc * (1.0 - uNight));
        // very soft painted grain, like a backdrop flat
        c += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.01;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  })
}

function seaMaterial(u) {
  return new THREE.ShaderMaterial({
    uniforms: u, fog: false,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `${SKY_GLSL}
      uniform float uTime; uniform vec3 uSeaDeep; uniform vec3 uLight;
      varying vec3 vW;
      float n2(vec2 p){ return sin(p.x)*sin(p.y); }
      void main(){
        vec3 V = normalize(vW - cameraPosition);
        vec2 q = vW.xz * vec2(0.9, 2.6);
        vec3 N = normalize(vec3(
          0.035*(n2(q*0.9 + uTime*0.6) + 0.5*n2(q*2.3 - uTime*0.9)),
          1.0,
          0.06*(n2(q.yx*1.1 + uTime*0.5) + 0.5*n2(q.yx*3.1 + uTime))));
        vec3 R = reflect(V, N); R.y = abs(R.y);
        float fres = pow(1.0 - max(dot(-V, vec3(0,1,0)), 0.0), 4.0);
        vec3 refl = skyCol(R);
        float sunGlint = pow(max(dot(R, uSunDir), 0.0), 600.0) * 2.4 * (1.0 - uNight);
        vec3 c = mix(uSeaDeep, refl, 0.35 + 0.6*fres) + uSunCol * sunGlint;
        float dist = length(vW.xz - cameraPosition.xz);
        c = mix(c, uHorizon, smoothstep(40.0, 160.0, dist) * 0.85);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  })
}

// ---------- tiny procedural textures
function plasterTexture(seed = 1) {
  const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s
  const g = cv.getContext('2d'), img = g.createImageData(s, s)
  let r = seed * 9301
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i < s * s; i++) {
    const v = 244 + (rnd() - 0.5) * 14
    img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace
  return t
}

function stripeTexture(a, b, n = 8, scallop = true) {
  const w = 512, h = 256, cv = document.createElement('canvas'); cv.width = w; cv.height = h
  const g = cv.getContext('2d')
  const sw = w / n
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * sw, 0, sw, h) }
  if (scallop) { // scalloped valance at the bottom edge
    g.globalCompositeOperation = 'destination-out'
    for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(i * sw + sw, h, sw / 2, h * 0.11, 0, Math.PI, 0); g.fill() }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}

function strataTexture() { // sandstone layers for the cliff face, like a cut-away set piece
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256
  const g = cv.getContext('2d')
  const bands = ['#EAD8B6', '#E3C9A0', '#EBD3B8', '#DDBB8E', '#E8CDB0', '#D9B48A', '#E4C7A6', '#D3A983']
  let y = 0, i = 0
  while (y < 256) { const h = 18 + ((i * 37) % 23); g.fillStyle = bands[i % bands.length]; g.fillRect(0, y, 64, h); y += h; i++ }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(8, 1)
  return t
}

async function loadFont() {
  try {
    const f = new FontFace('Antonio', `url(${BASE}fonts/antonio-var-latin.woff2)`, { weight: '100 700' })
    await f.load(); document.fonts.add(f)
  } catch (e) { /* falls back to a condensed system face */ }
}

function friezeTexture(text, { bg = PALETTE.cream, fg = PALETTE.brass, w = 1024, h = 128, weight = 600, track = 0.32 } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  const g = cv.getContext('2d')
  g.fillStyle = bg; g.fillRect(0, 0, w, h)
  g.fillStyle = fg
  g.font = `${weight} ${h * 0.62}px Antonio, "Arial Narrow", sans-serif`
  g.textBaseline = 'middle'; g.textAlign = 'center'
  if ('letterSpacing' in g) g.letterSpacing = `${h * track}px`
  g.fillText(text, w / 2 + h * track / 2, h * 0.54)
  // engraved shadow line
  g.globalAlpha = 0.12; g.fillStyle = '#000'; g.fillRect(0, h - 4, w, 4)
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return t
}

// ---------- geometry helpers
let _cyp
function cypressGeo() { // a flame-shaped Italian cypress, unit height, pointed tip
  if (_cyp) return _cyp
  const pts = []
  for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push(new THREE.Vector2(Math.max(0.001, Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.92 + 0.04)), 0.8) * (1 - 0.45 * u)), u)) }
  _cyp = new THREE.LatheGeometry(pts, 36); _cyp.computeVertexNormals(); return _cyp
}

function makeEnvironment(renderer) { // soft cream/blue studio dome so brass reads as brass
  const s = new THREE.Scene()
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, vertexShader: 'varying vec3 v; void main(){ v = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec3 v; void main(){ float h = v.y*0.5+0.5; vec3 c = mix(vec3(0.85,0.72,0.52), vec3(1.0,0.97,0.92), smoothstep(0.35,0.55,h)); c = mix(c, vec3(0.62,0.78,0.9), smoothstep(0.6,1.0,h)); c += vec3(1.0,0.9,0.7)*pow(max(dot(v, normalize(vec3(-0.5,0.4,0.8))),0.0),30.0)*3.0; gl_FragColor = vec4(c,1.0);}' })
  s.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), m))
  const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromScene(s, 0.04); pm.dispose()
  return rt.texture
}
function roundedBox(w, h, d, r = 0.06) {
  r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)
  const s = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r, W = w - 2 * r, H = h - 2 * r
  s.moveTo(x, y); s.lineTo(x + W, y); s.lineTo(x + W, y + H); s.lineTo(x, y + H); s.lineTo(x, y)
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 4 })
  g.translate(0, 0, -(d - 2 * r) / 2); g.computeVertexNormals()
  return g
}

function archShape(w, h) {
  const s = new THREE.Shape(), r = w / 2
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0)
  return s
}

class Builder {
  constructor(root, plaster) { this.root = root; this.plaster = plaster; this.mats = {} }
  mat(color, o = {}) {
    const k = color + JSON.stringify(o)
    const { noMap, ...rest } = o
    if (!this.mats[k]) this.mats[k] = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, map: noMap ? null : this.plaster, ...rest })
    return this.mats[k]
  }
  add(geo, mat, x = 0, y = 0, z = 0, parent = this.root) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m
  }
  box(w, h, d, color, x, y, z, r = 0.05, o) { return this.add(roundedBox(w, h, d, r), this.mat(color, o), x, y, z) }
  cyl(rt, rb, h, color, x, y, z, seg = 40, o) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), this.mat(color, o), x, y, z) }
  sphere(r, color, x, y, z, o) { return this.add(new THREE.SphereGeometry(r, 40, 24), this.mat(color, o), x, y, z) }
  mirror(fn) { fn(1); fn(-1) }
}

// ---------- the scene
export async function createPavilion(canvas, opts = {}) {
  await loadFont()
  const ctx = makeRenderer(canvas, opts)
  const { renderer, scene, camera, u, sunLight, hemi } = ctx
  const plaster = plasterTexture(3); plaster.repeat.set(2, 2)
  const B = new Builder(scene, plaster)
  const P = PALETTE
  const glass = new THREE.MeshStandardMaterial({ color: '#8FB9AE', roughness: 0.18, metalness: 0.1, emissive: '#FFC27A', emissiveIntensity: 0 })
  const brass = new THREE.MeshStandardMaterial({ color: P.brass, roughness: 0.32, metalness: 0.85 })

  // land: the bluff the set sits on
  // a golden bluff with a cream sandstone edge, dropping to the sea
  const land = B.add(new THREE.CylinderGeometry(10.4, 10.9, 0.5, 96), B.mat('#D9BC7F', { roughness: 1, noMap: true }), 0, -0.25, 2.2)
  land.scale.z = 0.7
  const cliff = B.add(new THREE.CylinderGeometry(10.9, 12.2, 2.4, 96, 1, true), new THREE.MeshStandardMaterial({ map: strataTexture(), roughness: 1 }), 0, -1.7, 2.2)
  cliff.scale.z = 0.7
  // terrace plinth with zinc inlay
  B.box(15.4, 0.36, 7.4, P.cream, 0, 0.18, 2.3, 0.08)
  for (let i = -4; i <= 4; i++) B.box(0.05, 0.02, 6.8, P.zinc, i * 1.8, 0.37, 2.4, 0.01)
  B.box(14.6, 0.02, 0.05, P.zinc, 0, 0.37, 5.7, 0.01)
  // steps
  for (let i = 0; i < 3; i++) B.box(3.4 - i * 0.3, 0.12, 0.5, P.creamWarm, 0, 0.42 + i * 0.12, 0.9 - i * 0.18, 0.03)

  // central block
  B.box(4.2, 3.4, 3.2, P.cream, 0, 0.36 + 1.7, -1.0, 0.08)
  // frieze sign
  const frieze = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.42), new THREE.MeshStandardMaterial({ map: friezeTexture('ALBRETSEN'), roughness: 0.7 }))
  frieze.position.set(0, 3.36, 0.611); scene.add(frieze)
  // eyebrow over the frieze
  B.box(4.5, 0.08, 0.5, P.creamWarm, 0, 3.66, 0.7, 0.03)
  // door arch: café red with brass reveal
  const doorGeo = new THREE.ExtrudeGeometry(archShape(1.3, 2.2), { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.02, bevelSegments: 2 })
  const door = B.add(doorGeo, B.mat(P.cafe, { noMap: true, roughness: 0.55 }), 0, 0.78, 0.6)
  const revealGeo = new THREE.ExtrudeGeometry(archShape(1.55, 2.32), { depth: 0.04, bevelEnabled: false })
  B.add(revealGeo, brass, 0, 0.74, 0.58)
  B.sphere(0.05, P.brass, 0.18, 1.7, 0.72, { metalness: 0.9, roughness: 0.3 }).material = brass
  // round window over the door — no, keep it calm: a single brass line
  B.box(0.06, 2.0, 0.06, P.brass, 0, 1.75, 0.7, 0.02).material = brass

  // stepped tower (the "A" of the mark)
  const tiers = [[3.0, 1.1, 2.4], [2.1, 1.0, 1.8], [1.3, 0.95, 1.2]]
  let y = 0.36 + 3.4
  tiers.forEach(([w, h, d], i) => {
    B.box(w, h, d, i === 1 ? P.flamingo : P.cream, 0, y + h / 2, -1.0, 0.06)
    B.box(w + 0.24, 0.07, d + 0.24, P.zinc, 0, y + h + 0.03, -1.0, 0.025)
    y += h + 0.07
  })
  // three fins on the tower face
  ;[-0.4, 0, 0.4].forEach((x) => B.box(0.12, 2.6, 0.22, P.cream, x, 3.76 + 1.25, -1.0 + 0.9 + (x === 0 ? 0.14 : 0), 0.04))
  // brass finial
  const fin = B.sphere(0.24, P.brass, 0, y + 0.32, -1.0); fin.material = brass
  B.cyl(0.035, 0.035, 1.1, P.brass, 0, y + 0.9, -1.0).material = brass
  B.cyl(0.18, 0.28, 0.12, P.zincDeep, 0, y + 0.06, -1.0)
  const finialY = y + 0.32

  // wings with streamline round ends, eyebrows and awnings
  const awnTex = stripeTexture(P.cafe, P.cream, 10)
  const windows = []
  B.mirror((s) => {
    const wx = s * 3.55
    B.box(3.0, 2.3, 2.6, P.cream, wx, 0.36 + 1.15, -0.8, 0.06)
    // round end
    B.cyl(1.3, 1.3, 2.3, P.cream, s * 5.05, 0.36 + 1.15, -0.8, 48)
    // eyebrows: a long ledge wrapping the round end
    const eb = B.add(new THREE.CylinderGeometry(1.55, 1.55, 0.07, 48, 1, false, s > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), B.mat(P.creamWarm), s * 5.05, 2.15, -0.8)
    B.box(3.0, 0.07, 0.55, P.creamWarm, wx, 2.15, 0.55, 0.025)
    // flamingo base band
    B.box(3.02, 0.32, 2.62, P.flamingo, wx, 0.36 + 0.16, -0.8, 0.04)
    B.add(new THREE.CylinderGeometry(1.31, 1.31, 0.32, 48), B.mat(P.flamingo), s * 5.05, 0.52, -0.8)
    // zinc coping
    B.box(3.1, 0.09, 2.7, P.zinc, wx, 2.71, -0.8, 0.03)
    B.add(new THREE.CylinderGeometry(1.36, 1.36, 0.09, 48), B.mat(P.zinc), s * 5.05, 2.71, -0.8)
    // windows: two tall panes per wing + a ribbon window on the round end
    ;[-0.7, 0.7].forEach((dx) => {
      const w = new THREE.Mesh(roundedBox(0.8, 1.15, 0.08, 0.03), glass); w.position.set(wx + dx, 1.4, 0.5); scene.add(w); windows.push(w)
      B.box(0.92, 0.08, 0.16, P.creamWarm, wx + dx, 0.79, 0.54, 0.02)
      // awning
      const aw = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.55), new THREE.MeshStandardMaterial({ map: awnTex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }))
      aw.position.set(wx + dx, 2.0, 0.7); aw.rotation.x = -0.75; aw.castShadow = true; aw.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: awnTex, alphaTest: 0.5 }); scene.add(aw)
    })
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.38, 48, 1, true, s > 0 ? 0.1 : Math.PI + 0.1, Math.PI - 0.2), glass)
    rib.position.set(s * 5.05, 1.6, -0.8); rib.rotation.y = s > 0 ? -Math.PI / 2 + Math.PI : -Math.PI / 2 ; scene.add(rib); windows.push(rib)
  })

  // terrace furniture: two parasol tables, symmetrical
  const paraTex = stripeTexture(P.cream, P.cafe, 16, false)
  B.mirror((s) => {
    const tx = s * 5.1, tz = 3.9
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.42, 16, 1, true), new THREE.MeshStandardMaterial({ map: paraTex, roughness: 0.9, side: THREE.DoubleSide }))
    top.position.set(tx, 2.35, tz); top.castShadow = true; scene.add(top)
    B.sphere(0.05, P.brass, tx, 2.58, tz).material = brass
    B.cyl(0.03, 0.03, 2.1, P.zincDeep, tx, 1.4, tz, 12)
    B.cyl(0.42, 0.42, 0.05, P.cream, tx, 1.06, tz, 40)
    B.cyl(0.04, 0.05, 0.66, P.zincDeep, tx, 0.72, tz, 12)
    B.cyl(0.2, 0.24, 0.04, P.zincDeep, tx, 0.39, tz, 24)
    ;[-1, 1].forEach((c) => { // bistro chairs
      const cx = tx + c * 0.72
      B.cyl(0.2, 0.2, 0.05, P.cafe, cx, 0.78, tz, 24)
      B.box(0.06, 0.5, 0.36, P.cafe, cx + c * 0.18, 1.03, tz, 0.02)
      B.cyl(0.02, 0.02, 0.4, P.zincDeep, cx, 0.57, tz, 8)
    })
  })

  // cypresses and topiaries
  const leaf = B.mat('#5E7C55', { roughness: 0.95 })
  const leafDark = B.mat('#4D6A4A', { roughness: 0.95 })
  B.mirror((s) => {
    // potted topiary by the door
    B.cyl(0.26, 0.2, 0.42, P.brass, s * 1.15, 0.36 + 0.21, 1.0).material = brass
    B.sphere(0.36, '#6B8A5E', s * 1.15, 1.12, 1.0).material = leaf
    // tall cypresses at the ends of the terrace
    ;[[7.15, 4.9, 4.4, 0.55], [7.15, 0.2, 5.2, 0.6]].forEach(([x, z, h, r]) => {
      const c = B.add(cypressGeo(), z > 2 ? leafDark : leaf, s * x, 0.56, z)
      c.scale.set(r, h, r)
      B.cyl(0.32, 0.26, 0.4, P.cream, s * x, 0.36 + 0.2, z, 32)
    })
  })

  // golden hills, soft felt-like ellipsoids to the sides of the sea
  const hillMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1 })
  ;[
    [-46, -70, 24, 7.5, 12, '#D7AE68'], [48, -74, 26, 8.0, 12, '#D2A762'],
    [-78, -110, 34, 14, 18, '#C99F63'], [80, -114, 36, 15, 18, '#C59A60'],
    [-30, -52, 10, 3.2, 7, '#DDB774'], [31, -54, 11, 3.4, 7, '#DAB370'],
  ].forEach(([x, z, rx, ry, rz, c]) => {
    const h = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), hillMat(c)); h.position.set(x, -2.6, z); h.scale.set(rx, ry, rz); h.receiveShadow = true; scene.add(h)
  })

  // stars for After Hours: they gather into the mark
  const starGroup = buildStars(scene)

  const api = attachLoop(ctx, opts, { windows, glass, starGroup, finialY })
  api.views = {
    front: { pos: [0, 4.3, 40], look: [0, 4.5, 0], fov: 23 },
    portrait: { pos: [0, 4.0, 31], look: [0, 5.6, 0], fov: 46 },
    tower: { pos: [0, 5.2, 20], look: [0, 7.4, -1], fov: 22 },
    wide: { pos: [0, 5.0, 56], look: [0, 4.2, 0], fov: 25 },
    terrace: { pos: [11, 2.4, 17], look: [0.5, 3.4, 0], fov: 34 },
  }
  api.setView(opts.view || 'front')
  return api
}

function buildStars(scene) {
  // mark: stepped tower inside a sun — 13 points
  const markPts = [[0, 3.2], [-0.5, 2.2], [0.5, 2.2], [-1, 1.2], [1, 1.2], [-1.5, 0.2], [1.5, 0.2], [-1.5, -1], [1.5, -1], [-0.45, -1], [0.45, -1], [0, -0.3], [0, 1.5]]
  const N = 220
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(N * 3), home = new Float32Array(N * 3), mark = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI - Math.PI, el = 0.08 + Math.random() * 0.8
    const r = 180
    home[i * 3] = Math.cos(a) * Math.cos(el) * r * 0.9 + (Math.random() - 0.5) * 60
    home[i * 3 + 1] = Math.sin(el) * r * 0.5 + 6
    home[i * 3 + 2] = -120 - Math.random() * 30
    const mp = markPts[i % markPts.length]
    const scale = 3.8
    mark[i * 3] = i < markPts.length ? -30 + mp[0] * scale : home[i * 3]
    mark[i * 3 + 1] = i < markPts.length ? 25 + mp[1] * scale : home[i * 3 + 1]
    mark[i * 3 + 2] = -120
  }
  pos.set(home)
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const m = new THREE.PointsMaterial({ color: '#FFF4DC', size: 1.3, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, fog: false })
  const pts = new THREE.Points(geo, m); scene.add(pts)
  // constellation lines
  const lineIdx = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 9], [8, 10], [9, 11], [10, 11], [1, 2]]
  const lg = new THREE.BufferGeometry(), lp = new Float32Array(lineIdx.length * 6)
  lineIdx.forEach(([a, b], i) => { lp.set(mark.slice(a * 3, a * 3 + 3), i * 6); lp.set(mark.slice(b * 3, b * 3 + 3), i * 6 + 3) })
  lg.setAttribute('position', new THREE.BufferAttribute(lp, 3))
  const lm = new THREE.LineBasicMaterial({ color: '#E8CF9C', transparent: true, opacity: 0, fog: false })
  const lines = new THREE.LineSegments(lg, lm); scene.add(lines)
  return { pts, m, home, mark, lines, lm, k: 0 }
}

// ---------- renderer + loop shared by both scenes
function makeRenderer(canvas, opts) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !!opts.transparent, preserveDrawingBuffer: !!opts.bake })
  renderer.setPixelRatio(opts.pixelRatio || Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  scene.environment = makeEnvironment(renderer)
  scene.environmentIntensity = 0.2
  const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 600)
  const u = {
    uZenith: { value: c3('#93C3E0') }, uHorizon: { value: c3('#F5E6DC') }, uSunCol: { value: c3('#fff') },
    uSunDir: { value: new THREE.Vector3(0, 0.3, -1).normalize() }, uSunSize: { value: 0.036 }, uTime: { value: 0 },
    uNight: { value: 0 }, uSeaDeep: { value: c3('#6FA7B4') }, uLight: { value: c3('#fff') },
  }
  if (!opts.transparent) {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), skyMaterial(u)); scene.add(sky)
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(800, 520), seaMaterial(u)); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -2.6, -200); scene.add(sea)
  }
  scene.fog = new THREE.Fog('#F5E6DC', 35, 140)
  const sunLight = new THREE.DirectionalLight('#fff', 2.5)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.set(2048, 2048)
  Object.assign(sunLight.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 })
  sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = 0.02; sunLight.shadow.radius = 6
  scene.add(sunLight, sunLight.target)
  const hemi = new THREE.HemisphereLight('#cfe3ee', '#d9b36c', 0.9); scene.add(hemi)
  const fill = new THREE.DirectionalLight('#F6E7D8', 0.35); fill.position.set(0, 6, 30); scene.add(fill)
  return { renderer, scene, camera, u, sunLight, hemi, fill }
}

function attachLoop(ctx, opts, extra = {}) {
  const { renderer, scene, camera, u, sunLight, hemi } = ctx
  let t = opts.time ?? 0.3, night = 0, nightTarget = 0, raf = 0, last = performance.now(), drift = 0
  let view = { pos: [0, 3.7, 23], look: [0, 2.6, 0], fov: 25 }
  const lookV = new THREE.Vector3()

  function applyTime() {
    const k = sampleKeys(t)
    const n = night
    const zen = k.zenith.clone().lerp(c3(NIGHT[0]), n), hor = k.horizon.clone().lerp(c3(NIGHT[1]), n)
    u.uZenith.value.copy(zen); u.uHorizon.value.copy(hor)
    u.uSunCol.value.copy(k.sun)
    u.uNight.value = n
    // painted sun: rises left, arcs high behind the set, sets right
    const az = THREE.MathUtils.lerp(-0.42, 0.42, t)
    const el = Math.sin(t * Math.PI) * 0.168 + 0.006
    const kaz = THREE.MathUtils.lerp(-1.1, 1.1, t)
    const d = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize()
    u.uSunDir.value.copy(d)
    // stage key light: same side as the sun but from the audience, so the facade reads
    const kel = 0.12 + Math.sin(t * Math.PI) * 0.75
    sunLight.position.set(Math.sin(kaz) * 24, Math.sin(kel) * 26 + 1.5, 16)
    sunLight.target.position.set(0, 1, 0)
    sunLight.color.copy(k.sun).lerp(c3('#7E8FD0'), n)
    sunLight.intensity = k.sunI * (1 - n * 0.85)
    hemi.color.copy(zen); hemi.groundColor.set('#D9B36C').lerp(c3('#2A2E4A'), n)
    hemi.intensity = k.hemiI * (1 - n * 0.4) + 0.15
    u.uSeaDeep.value.set('#6FA7B4').lerp(hor, 0.25).lerp(c3('#1A2244'), n)
    if (scene.fog) scene.fog.color.copy(hor)
    if (extra.glass) {
      extra.glass.emissiveIntensity = n * 1.6 + (t > 0.9 ? (t - 0.9) * 4 : 0)
      extra.glass.color.set('#8FB9AE').lerp(c3('#2F3D52'), n)
    }
  }

  function setView(v) {
    if (typeof v === 'string') v = api.views?.[v] || view
    view = v
    camera.fov = v.fov; camera.position.set(...v.pos); lookV.set(...v.look); camera.lookAt(lookV); camera.updateProjectionMatrix()
  }

  function resize(w, h) {
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix()
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    u.uTime.value += dt
    night += (nightTarget - night) * Math.min(1, dt * 1.6)
    // sea-breeze drift of the camera: tiny, slow, never seasick
    if (!opts.still) {
      drift += dt
      camera.position.set(view.pos[0] + Math.sin(drift * 0.21) * 0.12, view.pos[1] + Math.sin(drift * 0.17) * 0.05, view.pos[2])
      camera.lookAt(lookV)
    }
    applyTime()
    const sg = extra.starGroup
    if (sg) {
      sg.m.opacity = night
      if (opts.still) sg.k = night > 0.5 ? 1 : 0
      else sg.k += ((night > 0.5 ? 1 : 0) - sg.k) * Math.min(1, dt * 0.6)
      const p = sg.pts.geometry.attributes.position
      for (let i = 0; i < p.count * 3; i++) p.array[i] = sg.home[i] + (sg.mark[i] - sg.home[i]) * sg.k
      p.needsUpdate = true
      sg.lm.opacity = Math.max(0, sg.k - 0.6) * 1.6 * night
    }
    renderer.render(scene, camera)
    if (!opts.still) raf = requestAnimationFrame(frame)
  }

  // easter egg: three clicks on the painted sun, or "n"
  let clicks = 0, clickTimer = 0
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
  function onClick(e) {
    const r = renderer.domElement.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    if (ray.ray.direction.angleTo(u.uSunDir.value) < 0.09 || nightTarget) {
      clicks++; clearTimeout(clickTimer); clickTimer = setTimeout(() => (clicks = 0), 1200)
      if (clicks >= 3 || nightTarget) { api.setNight(!nightTarget); clicks = 0 }
    }
  }
  function onKey(e) { if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !/input|textarea/i.test(e.target.tagName)) api.setNight(!nightTarget) }
  if (!opts.bake) { renderer.domElement.addEventListener('click', onClick); window.addEventListener('keydown', onKey) }

  const api = {
    renderer, scene, camera,
    setTime(v) { t = THREE.MathUtils.clamp(v, 0, 1); if (opts.still) frame(performance.now()) },
    getTime: () => t,
    setNight(b) { nightTarget = b ? 1 : 0; if (opts.still) { night = nightTarget; frame(performance.now()) } canvasEvent('afterhours', b) },
    setView(v) { setView(v); if (opts.still) frame(performance.now()) },
    resize(w, h) { resize(w, h); if (opts.still) frame(performance.now()) },
    renderOnce() { frame(performance.now()) },
    start() { if (!raf && !opts.still) { last = performance.now(); raf = requestAnimationFrame(frame) } },
    stop() { cancelAnimationFrame(raf); raf = 0 },
    dispose() { api.stop(); renderer.dispose(); renderer.domElement.removeEventListener('click', onClick); window.removeEventListener('keydown', onKey) },
  }
  function canvasEvent(name, detail) { renderer.domElement.dispatchEvent(new CustomEvent(name, { detail, bubbles: true })) }
  const w = opts.width || canvas.clientWidth || 800, h = opts.height || canvas.clientHeight || 450
  resize(w, h)
  if (opts.night) { night = nightTarget = 1 }
  applyTime()
  if (!opts.still) api.start(); else queueMicrotask(() => frame(performance.now()))
  return api
}

// ---------- product kiosk: a tiny deco kiosk with the real product logo on its sign
async function loadImage(url) {
  const img = new Image(); img.crossOrigin = 'anonymous'; img.src = url; await img.decode(); return img
}
function signTexture(img, { round = 0, bg = PALETTE.cream, pad = 0.11, w = 1024, h = 512, name = '', fg = PALETTE.ink } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  const g = cv.getContext('2d')
  g.fillStyle = bg; g.fillRect(0, 0, w, h)
  g.strokeStyle = PALETTE.brass; g.lineWidth = 10; g.strokeRect(18, 18, w - 36, h - 36)
  const box = h * (1 - pad * 2) * (name ? 0.74 : 1)
  const ar = (img.naturalWidth || img.width) / (img.naturalHeight || img.height)
  let iw = box * ar, ih = box
  if (iw > w * 0.8) { iw = w * 0.8; ih = iw / ar }
  const top = name ? h * 0.1 : (h - ih) / 2
  g.save()
  if (round) { g.beginPath(); g.roundRect((w - iw) / 2, top, iw, ih, iw * round); g.clip() } // app-icon mask, logo untouched
  g.drawImage(img, (w - iw) / 2, top, iw, ih)
  g.restore()
  if (name) {
    g.fillStyle = fg; g.font = `600 ${h * 0.13}px Antonio, "Arial Narrow", sans-serif`; g.textAlign = 'center'
    if ('letterSpacing' in g) g.letterSpacing = `${h * 0.03}px`
    g.fillText(name.toUpperCase(), w / 2 + h * 0.015, h * 0.885)
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return t
}

export async function createKiosk(canvas, opts = {}) {
  await loadFont()
  const ctx = makeRenderer(canvas, opts)
  const { scene } = ctx
  const P = PALETTE
  const plaster = plasterTexture(7); plaster.repeat.set(1.5, 1.5)
  const B = new Builder(scene, plaster)
  const brass = new THREE.MeshStandardMaterial({ color: P.brass, roughness: 0.32, metalness: 0.85 })
  const awn = opts.awning || P.cafe
  const body = opts.body || P.cream
  const accent = opts.accent || P.flamingo

  // plinth & ground
  const land = B.add(new THREE.CylinderGeometry(9, 9.4, 1.0, 96), B.mat('#D8C08A'), 0, -0.5, 0); land.scale.z = 0.7
  B.box(7.4, 0.3, 4.6, P.cream, 0, 0.15, 0.6, 0.06)
  for (let i = -2; i <= 2; i++) B.box(0.05, 0.02, 4.2, P.zinc, i * 1.4, 0.31, 0.7, 0.01)
  // kiosk body — rounded front corners via cylinders
  B.box(2.8, 2.2, 1.8, body, 0, 0.3 + 1.1, -0.3, 0.06)
  B.mirror((s) => B.cyl(0.45, 0.45, 2.2, body, s * 1.4, 1.4, 0.15, 40))
  B.box(3.9, 0.32, 1.9, accent, 0, 0.46, -0.25, 0.05)
  // counter opening (dark) + counter top
  const open = new THREE.Mesh(roundedBox(2.0, 0.95, 0.06, 0.03), new THREE.MeshStandardMaterial({ color: opts.closed ? body : '#2A2C33', roughness: 0.9, emissive: '#FFB765', emissiveIntensity: opts.closed ? 0 : 0.06 }))
  open.position.set(0, 1.62, 0.62); scene.add(open)
  if (!opts.closed) { // inside: a small lit screen and a warm lamp, the software at work
    const scr = new THREE.Mesh(roundedBox(0.62, 0.4, 0.04, 0.02), new THREE.MeshStandardMaterial({ color: '#F6EEDF', emissive: '#FFF2D8', emissiveIntensity: 0.55 }))
    scr.position.set(-0.25, 1.48, 0.66); scr.rotation.x = -0.12; scene.add(scr)
    const base = new THREE.Mesh(roundedBox(0.7, 0.03, 0.3, 0.01), new THREE.MeshStandardMaterial({ color: '#9AA0A6', metalness: 0.6, roughness: 0.4 }))
    base.position.set(-0.25, 1.18, 0.75); scene.add(base)
    const lampG = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), new THREE.MeshStandardMaterial({ color: '#FFE7B8', emissive: '#FFD38A', emissiveIntensity: 0.9 }))
    lampG.position.set(0.6, 1.95, 0.66); scene.add(lampG)
  }
  B.box(2.4, 0.08, 0.5, P.zinc, 0, 1.12, 0.72, 0.02)
  // closed shutter for paused products
  if (opts.closed) {
    const sh = stripeTexture(P.zinc, '#A6ACB1', 24, false)
    const shutter = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.9), new THREE.MeshStandardMaterial({ map: sh, roughness: 0.6, metalness: 0.2 }))
    shutter.rotation.z = Math.PI / 2; shutter.scale.set(0.95 / 2.0, 2.0 / 0.9, 1)
    shutter.position.set(0, 1.62, 0.66); scene.add(shutter)
  }
  // awning
  const awTex = stripeTexture(awn, P.cream, 12)
  const aw = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.9), new THREE.MeshStandardMaterial({ map: awTex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }))
  aw.position.set(0, 2.42, 0.95); aw.rotation.x = -0.8; aw.castShadow = true
  aw.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: awTex, alphaTest: 0.5 }); scene.add(aw)
  // stepped crown + sign
  B.box(3.4, 0.1, 2.0, P.zinc, 0, 2.56, -0.3, 0.03)
  B.box(2.6, 1.25, 0.5, body, 0, 3.22, -0.25, 0.05)
  B.box(1.6, 0.4, 0.4, body, 0, 4.05, -0.25, 0.05)
  B.box(0.9, 0.3, 0.32, accent, 0, 4.4, -0.25, 0.04)
  const fin = B.sphere(0.13, P.brass, 0, 4.68, -0.25); fin.material = brass
  const img = await loadImage(opts.logo)
  const signTex = signTexture(img, { name: opts.name || '', bg: opts.signBg || P.cream, round: /\.png($|\?)/.test(opts.logo) ? 0.22 : 0 })
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.55 }))
  sign.position.set(0, 3.22, 0.012); scene.add(sign)
  // brass lamps
  B.mirror((s) => {
    B.cyl(0.02, 0.02, 0.35, P.brass, s * 1.2, 3.75, 0.1, 8).material = brass
    const lamp = B.sphere(0.09, '#FFE7B8', s * 1.2, 3.55, 0.1, { emissive: '#FFD38A', emissiveIntensity: opts.closed ? 0 : 0.6, noMap: true })
  })
  // flanking: cypress in cream pots
  const leaf = B.mat('#5E7C55', { roughness: 0.95 })
  B.mirror((s) => {
    const c = B.add(cypressGeo(), leaf, s * 2.9, 0.62, 0.2); c.scale.set(0.42, 3.0, 0.42)
    B.cyl(0.3, 0.24, 0.42, P.cream, s * 2.9, 0.51, 0.2, 32)
  })
  // bistro table
  B.cyl(0.32, 0.32, 0.04, P.cream, 2.0, 0.95, 1.9, 32)
  B.cyl(0.03, 0.04, 0.62, P.zincDeep, 2.0, 0.62, 1.9, 10)
  B.cyl(0.15, 0.19, 0.03, P.zincDeep, 2.0, 0.32, 1.9, 20)
  B.cyl(0.05, 0.04, 0.12, P.cafe, 2.05, 1.03, 1.85, 16) // a little espresso cup
  // hills behind
  ;[[-14, -26, 10, 3.6, 7, '#D7AE68'], [14, -28, 11, 3.8, 7, '#D2A762'], [-30, -50, 16, 7, 10, '#C99F63'], [30, -52, 17, 7.4, 10, '#C59A60']].forEach(([x, z, rx, ry, rz, c]) => {
    const h = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.MeshStandardMaterial({ color: c, roughness: 1 })); h.position.set(x, -0.4, z); h.scale.set(rx, ry, rz); h.receiveShadow = true; scene.add(h)
  })
  const api = attachLoop(ctx, opts, {})
  api.views = { front: { pos: [0, 1.7, 16], look: [0, 2.75, 0], fov: 30 } }
  api.setView('front')
  return api
}

// ---------- single props on a transparent background, for cut-outs
export async function createProp(canvas, opts = {}) {
  await loadFont()
  const ctx = makeRenderer(canvas, { ...opts, transparent: true })
  const { scene } = ctx
  scene.fog = null
  const P = PALETTE
  const B = new Builder(scene, plasterTexture(5))
  const brass = new THREE.MeshStandardMaterial({ color: P.brass, roughness: 0.3, metalness: 0.85 })
  const leaf = B.mat('#5E7C55', { roughness: 0.95 })
  const kind = opts.prop || 'cypress'
  let view
  if (kind === 'cypress') {
    const c = B.add(cypressGeo(), leaf, 0, 0.42, 0); c.scale.set(0.6, 4.6, 0.6)
    B.cyl(0.36, 0.28, 0.44, P.cream, 0, 0.22, 0, 40)
    B.cyl(0.38, 0.38, 0.05, P.brass, 0, 0.42, 0, 40).material = brass
    view = { pos: [0, 2.6, 13], look: [0, 2.5, 0], fov: 24 }
  } else if (kind === 'parasol') {
    const paraTex = stripeTexture(P.cream, P.cafe, 16, false)
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.42, 16, 1, true), new THREE.MeshStandardMaterial({ map: paraTex, roughness: 0.9, side: THREE.DoubleSide }))
    top.position.set(0, 2.35, 0); scene.add(top)
    B.sphere(0.05, P.brass, 0, 2.58, 0).material = brass
    B.cyl(0.03, 0.03, 2.1, P.zincDeep, 0, 1.3, 0, 12)
    B.cyl(0.42, 0.42, 0.05, P.cream, 0, 0.96, 0, 40)
    B.cyl(0.04, 0.05, 0.66, P.zincDeep, 0, 0.62, 0, 12)
    B.cyl(0.2, 0.24, 0.04, P.zincDeep, 0, 0.29, 0, 24)
    ;[-1, 1].forEach((c) => {
      const cx = c * 0.72
      B.cyl(0.2, 0.2, 0.05, P.cafe, cx, 0.68, 0, 24)
      B.box(0.06, 0.5, 0.36, P.cafe, cx + c * 0.18, 0.93, 0, 0.02)
      B.cyl(0.02, 0.02, 0.4, P.zincDeep, cx, 0.47, 0, 8)
    })
    B.cyl(0.05, 0.04, 0.12, P.cafe, 0.12, 1.04, 0.1, 16)
    view = { pos: [0, 2.4, 9], look: [0, 1.35, 0], fov: 24 }
  } else if (kind === 'finial') {
    B.cyl(0.5, 0.75, 0.25, P.zincDeep, 0, 0.12, 0, 48)
    const s = B.sphere(0.55, P.brass, 0, 0.85, 0); s.material = brass
    B.cyl(0.07, 0.07, 2.4, P.brass, 0, 2.2, 0, 16).material = brass
    B.sphere(0.12, P.brass, 0, 3.42, 0).material = brass
    view = { pos: [0, 1.9, 9], look: [0, 1.75, 0], fov: 26 }
  } else if (kind === 'tower') {
    let y = 0
    ;[[3.0, 1.1, 2.4, P.cream], [2.1, 1.0, 1.8, P.flamingo], [1.3, 0.95, 1.2, P.cream]].forEach(([w, h, d, c]) => {
      B.box(w, h, d, c, 0, y + h / 2, 0, 0.06); B.box(w + 0.24, 0.07, d + 0.24, P.zinc, 0, y + h + 0.03, 0, 0.025); y += h + 0.07
    })
    ;[-0.4, 0, 0.4].forEach((x) => B.box(0.12, 2.0, 0.22, P.cream, x, 1.2, 1.0, 0.04))
    const f = B.sphere(0.24, P.brass, 0, y + 0.32, 0); f.material = brass
    B.cyl(0.035, 0.035, 1.1, P.brass, 0, y + 0.9, 0).material = brass
    view = { pos: [0, 2.6, 13], look: [0, 2.3, 0], fov: 24 }
  }
  ctx.sunLight.shadow.camera.left = -4; ctx.sunLight.shadow.camera.right = 4; ctx.sunLight.shadow.camera.top = 6; ctx.sunLight.shadow.camera.bottom = -2
  const api = attachLoop(ctx, opts, {})
  api.views = { front: view }
  api.setView('front')
  return api
}
