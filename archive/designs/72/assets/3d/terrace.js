// Low Sun Terrace — the miniature set for design 72.
// One symmetrical whitewashed house on a snowy terrace, falu-red clapboard wings,
// a frozen pool, golden snow-dusted hills built as stage flats, a low winter sun.
// Used three ways: (1) baking hero/product stills, (2) the live interactive hero
// with a single slow camera move, (3) product pavilions with the real logos.
//
// Usage (needs an import map for "three" and "three/addons/"):
//   import { createTerrace } from './terrace.js'
//   const t = await createTerrace(canvas, { shot: 'hero-wide', post: true })
//   t.setProgress(0..1)   // the one camera move (dolly toward the arch)
//   t.render()

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export const PALETTE = {
  clapboard: '#F3EEE3', stucco: '#F6F1E7', snow: '#F7F7F5', falu: '#8F2B20',
  faluDeep: '#6E1F18', ochre: '#C8902F', ochreLight: '#E2B666', slate: '#4B5663',
  slateDeep: '#323A44', ice: '#BFD2DD', cypress: '#2F3D36', bloom: '#B8364B',
  skyTop: '#86A9D3', skyMid: '#E4D6DA', horizon: '#F7C49B',
}

const C = (h) => new THREE.Color(h)

// ---------- small procedural textures ----------
function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }

function clapboard(color, boards = 14) {
  const map = canvasTex(256, 512, (g, w, h) => {
    const bh = h / boards
    for (let i = 0; i < boards; i++) {
      const y = i * bh
      const grd = g.createLinearGradient(0, y, 0, y + bh)
      const base = C(color)
      const hi = base.clone().offsetHSL(0, 0, 0.035).getStyle()
      const lo = base.clone().offsetHSL(0, 0, -0.06).getStyle()
      grd.addColorStop(0, lo); grd.addColorStop(0.12, hi); grd.addColorStop(1, base.getStyle())
      g.fillStyle = grd; g.fillRect(0, y, w, bh)
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, y + bh - 2, w, 2)
    }
  })
  const bump = canvasTex(256, 512, (g, w, h) => {
    const bh = h / boards
    for (let i = 0; i < boards; i++) {
      const grd = g.createLinearGradient(0, i * bh, 0, i * bh + bh)
      grd.addColorStop(0, '#000'); grd.addColorStop(0.1, '#fff'); grd.addColorStop(1, '#888')
      g.fillStyle = grd; g.fillRect(0, i * bh, w, bh)
    }
  }, { srgb: false })
  return { map, bump }
}
function plaster(seed = 7) {
  return canvasTex(512, 512, (g, w, h) => {
    const r = rng(seed); g.fillStyle = '#808080'; g.fillRect(0, 0, w, h)
    for (let i = 0; i < 9000; i++) {
      const v = 110 + r() * 40; g.fillStyle = `rgba(${v},${v},${v},0.25)`
      const s = 1 + r() * 5; g.fillRect(r() * w, r() * h, s, s)
    }
  }, { srgb: false, repeat: [2, 2] })
}
function stripes(a, b, n = 12) {
  return canvasTex(512, 64, (g, w, h) => {
    for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect((i * w) / n, 0, w / n + 1, h) }
  })
}

// Draw any image URL (SVG or PNG) into a canvas texture at a known size.
export function logoTexture(url, { size = 512, pad = 0, bg = null, radius = 0 } = {}) {
  return new Promise((res) => {
    const img = new Image(); img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = size
      const g = c.getContext('2d')
      if (bg) { g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, size, size, radius); g.fill() }
      const ar = (img.naturalWidth || size) / (img.naturalHeight || size)
      let w = size - pad * 2, h = w / ar
      if (h > size - pad * 2) { h = size - pad * 2; w = h * ar }
      g.save(); if (radius) { g.beginPath(); g.roundRect(0, 0, size, size, radius); g.clip() }
      g.drawImage(img, (size - w) / 2, (size - h) / 2, w, h); g.restore()
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
      res(t)
    }
    img.onerror = () => res(null)
    img.src = url
  })
}

function iceTex() {
  return canvasTex(512, 1024, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#D9E7EE'); grd.addColorStop(0.5, '#BFD6E2'); grd.addColorStop(1, '#E6EEF1')
    g.fillStyle = grd; g.fillRect(0, 0, w, h)
    const r = rng(17); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2
    for (let i = 0; i < 26; i++) { g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 120; y += (r() - 0.3) * 90; g.lineTo(x, y) } g.stroke() }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.1 + r() * 0.25})`; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 80, 6 + r() * 20, r() * 3, 0, 7); g.fill() }
  })
}

// ---------- materials ----------
function mats() {
  const plasterBump = plaster()
  const red = clapboard(PALETTE.falu)
  const white = clapboard(PALETTE.clapboard)
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...o })
  return {
    stucco: std({ color: PALETTE.stucco, bumpMap: plasterBump, bumpScale: 0.6 }),
    stuccoWarm: std({ color: '#F1D9B8', bumpMap: plasterBump, bumpScale: 0.6 }),
    snow: std({ color: PALETTE.snow, roughness: 0.75, bumpMap: plasterBump, bumpScale: 0.25 }),
    redBoard: std({ map: red.map, bumpMap: red.bump, bumpScale: 1.2 }),
    whiteBoard: std({ map: white.map, bumpMap: white.bump, bumpScale: 1.2 }),
    falu: std({ color: PALETTE.falu }),
    ochre: std({ color: PALETTE.ochre }),
    slate: std({ color: PALETTE.slate, roughness: 0.7 }),
    slateDeep: std({ color: PALETTE.slateDeep, roughness: 0.6 }),
    trim: std({ color: '#FBF8F2' }),
    ice: new THREE.MeshPhysicalMaterial({ map: iceTex(), roughness: 0.3, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.3 }),
    glow: new THREE.MeshStandardMaterial({ color: '#FFD9A0', emissive: '#FFB25E', emissiveIntensity: 1.25, roughness: 0.4 }),
    glowDim: new THREE.MeshStandardMaterial({ color: '#2F3946', emissive: '#3B4A63', emissiveIntensity: 0.25, roughness: 0.2 }),
    cypress: std({ color: PALETTE.cypress, roughness: 1 }),
    leaf: std({ color: '#3E5A3F', roughness: 1 }),
    stripe: std({ map: stripes(PALETTE.ochreLight, '#FBF6EC') }),
  }
}

const shadowed = (m) => { m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } }); return m }
function rbox(w, h, d, mat, r = 0.04) { return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), mat) }

// Front wall with arched openings, extruded.
function archWall(w, h, depth, holes, mat) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath()
  for (const { x, y, hw, hh } of holes) {
    const p = new THREE.Path(); p.moveTo(x - hw, y); p.lineTo(x + hw, y); p.lineTo(x + hw, y + hh)
    p.absarc(x, y + hh, hw, 0, Math.PI, false); p.lineTo(x - hw, y); s.holes.push(p)
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 48 })
  return new THREE.Mesh(g, mat)
}
function archPanel(hw, hh, mat) {
  const s = new THREE.Shape(); s.moveTo(-hw, 0); s.lineTo(hw, 0); s.lineTo(hw, hh); s.absarc(0, hh, hw, 0, Math.PI, false); s.lineTo(-hw, 0)
  return new THREE.Mesh(new THREE.ShapeGeometry(s, 32), mat)
}

// Norwegian six-pane window: white trim, glowing glass.
function paneWindow(w, h, M, lit = true) {
  const g = new THREE.Group()
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lit ? M.glow : M.glowDim); glass.position.z = 0.005; g.add(glass)
  const t = 0.05
  const bar = (bw, bh, x, y) => { const m = rbox(bw, bh, 0.06, M.trim, 0.01); m.position.set(x, y, 0.03); g.add(m) }
  bar(w + t * 2, t, 0, h / 2); bar(w + t * 2, t, 0, -h / 2); bar(t, h, -w / 2, 0); bar(t, h, w / 2, 0)
  bar(t * 0.6, h, 0, 0); bar(w, t * 0.6, 0, h / 6); bar(w, t * 0.6, 0, -h / 6)
  const sill = rbox(w + 0.2, 0.05, 0.14, M.trim, 0.015); sill.position.set(0, -h / 2 - 0.05, 0.06); g.add(sill)
  return g
}

function cypress(M, height = 3.6) {
  const pts = []
  for (let i = 0; i <= 24; i++) { const t = i / 24; const r = Math.sin(Math.PI * Math.pow(t, 0.85)) * 0.42 * (1 - t * 0.35); pts.push(new THREE.Vector2(Math.max(r, 0.001), t * height)) }
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), M.cypress); g.add(body)
  // snow dusting on the shoulders
  const cap = new THREE.Mesh(new THREE.LatheGeometry(pts.slice(14).map((p) => new THREE.Vector2(p.x * 1.03, p.y + 0.02)), 40, 0, Math.PI), M.snow)
  cap.rotation.y = Math.PI * 0.25; cap.scale.set(1, 1, 0.55); g.add(cap)
  const trunk = rbox(0.12, 0.3, 0.12, M.slateDeep, 0.02); trunk.position.y = -0.1; g.add(trunk)
  return shadowed(g)
}

function parasol(M) {
  const g = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.1, 12), M.trim); pole.position.y = 1.05; g.add(pole)
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.42, 24, 1, true), M.stripe); canopy.position.y = 2.0; g.add(canopy)
  canopy.material.side = THREE.DoubleSide
  const snowCap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.2, 24), M.snow); snowCap.position.y = 2.17; g.add(snowCap)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 24), M.slate); base.position.y = 0.06; g.add(base)
  return shadowed(g)
}

function lounger(M) {
  const g = new THREE.Group()
  const frame = rbox(0.7, 0.12, 1.9, M.trim, 0.04); frame.position.y = 0.3; g.add(frame)
  const cush = rbox(0.6, 0.08, 1.3, M.ochre, 0.04); cush.position.set(0, 0.4, 0.25); g.add(cush)
  const back = rbox(0.6, 0.08, 0.7, M.ochre, 0.04); back.position.set(0, 0.6, -0.62); back.rotation.x = -0.6; g.add(back)
  const snow = rbox(0.56, 0.05, 1.2, M.snow, 0.025); snow.position.set(0, 0.46, 0.27); g.add(snow)
  for (const z of [-0.8, 0.8]) for (const x of [-0.3, 0.3]) { const l = rbox(0.06, 0.26, 0.06, M.trim, 0.01); l.position.set(x, 0.13, z); g.add(l) }
  return shadowed(g)
}

function lemonPot(M) {
  const g = new THREE.Group()
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.5, 28), M.falu); pot.position.y = 0.25; g.add(pot)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 32), M.falu); rim.rotation.x = Math.PI / 2; rim.position.y = 0.5; g.add(rim)
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), M.slateDeep); stem.position.y = 0.8; g.add(stem)
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 5), M.leaf); crown.position.y = 1.25; crown.scale.set(1, 0.92, 1); g.add(crown)
  const sn = new THREE.Mesh(new THREE.SphereGeometry(0.43, 48, 24, 0, Math.PI * 2, 0, 0.9), M.snow); sn.position.y = 1.27; sn.scale.set(1, 0.9, 1); g.add(sn)
  const r = rng(11)
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), M.ochre)
    const a = r() * Math.PI * 2, b = 0.9 + r() * 0.9
    f.position.set(Math.cos(a) * Math.sin(b) * 0.42, 1.25 + Math.cos(b) * 0.38, Math.sin(a) * Math.sin(b) * 0.42); g.add(f)
  }
  return shadowed(g)
}

function bougainvillea(M, anchors, count = 900, seed = 3) {
  const geo = new THREE.IcosahedronGeometry(1, 1)
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.85, vertexColors: false })
  const inst = new THREE.InstancedMesh(geo, mat, count)
  const cols = ['#B8364B', '#C8475D', '#9C2A3B', '#D9677F', '#A4313F', '#3E5A3F', '#4C6B47']
  const r = rng(seed), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler()
  for (let i = 0; i < count; i++) {
    const a = anchors[i % anchors.length]
    const t = Math.pow(r(), 1.6)
    const x = a.x + (r() - 0.5) * a.sx + a.dx * t
    const y = a.y + (r() - 0.5) * a.sy - a.drop * t
    const z = a.z + r() * 0.18
    const s = 0.018 + r() * 0.03
    e.set(r() * 6, r() * 6, r() * 6); q.setFromEuler(e)
    m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s * 0.45, s * 1.1))
    inst.setMatrixAt(i, m)
    inst.setColorAt(i, C(cols[Math.floor(r() * (r() < 0.25 ? cols.length : 5))]))
  }
  inst.castShadow = inst.receiveShadow = true
  return inst
}

// The main house, centred on x = 0, front face at z = 0.
function house(M) {
  const g = new THREE.Group()
  const W = 4.2, H = 2.7, D = 3
  // body behind the arched front
  const body = rbox(W, H, D - 1.1, M.stucco, 0.05); body.position.set(0, H / 2, -1.4 - (D - 1.1) / 2 + 0.02); g.add(body)
  for (const sx of [-1, 1]) { const cheek = new THREE.Mesh(new THREE.BoxGeometry(W / 2 - 0.78, H, 1.1), M.stucco); cheek.position.set(sx * (0.78 + (W / 2 - 0.78) / 2), H / 2, -0.85); g.add(cheek) }
  const front = archWall(W, H, 0.3, [
    { x: 0, y: 0, hw: 0.78, hh: 1.15 },
    { x: -1.45, y: 0.95, hw: 0.28, hh: 0.45 },
    { x: 1.45, y: 0.95, hw: 0.28, hh: 0.45 },
  ], M.stucco)
  front.position.z = -0.3; g.add(front)
  // loggia recess, warm and lit
  const recess = new THREE.Mesh(new THREE.BoxGeometry(1.56, 2.0, 1.1), M.stuccoWarm); recess.position.set(0, 1.0, -0.86)
  recess.material = M.stuccoWarm.clone(); recess.material.side = THREE.BackSide; g.add(recess)
  const door = rbox(0.62, 1.32, 0.08, M.falu, 0.03); door.position.set(0, 0.66, -1.36); g.add(door)
  const fan = archPanel(0.31, 0.0, M.glow); fan.position.set(0, 1.34, -1.37); fan.scale.set(1, 1, 1); g.add(fan)
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), M.ochre); knob.position.set(0.2, 0.68, -1.3); g.add(knob)
  const lamp = new THREE.PointLight('#FFB866', 2.2, 3.2, 1.6); lamp.position.set(0, 1.75, -0.7); g.add(lamp)
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), M.glow); lantern.position.set(0, 1.86, -0.7); g.add(lantern)
  // side arched windows
  for (const sx of [-1.45, 1.45]) {
    const p = archPanel(0.28, 0.45, M.glow); p.position.set(sx, 0.95, -0.12); g.add(p)
    const shutterL = rbox(0.3, 0.98, 0.04, M.falu, 0.015); shutterL.position.set(sx - 0.47, 1.43, 0.03); g.add(shutterL)
    const shutterR = shutterL.clone(); shutterR.position.x = sx + 0.47; g.add(shutterR)
    const sill = rbox(0.75, 0.06, 0.18, M.trim, 0.02); sill.position.set(sx, 0.92, 0.06); g.add(sill)
  }
  // ranch-modern roof slab with long eaves, snow on top
  const roof = rbox(W + 1.0, 0.16, D + 0.9, M.slate, 0.04); roof.position.set(0, H + 0.08, -D / 2 + 0.25); g.add(roof)
  const snowRoof = rbox(W + 0.9, 0.14, D + 0.8, M.snow, 0.07); snowRoof.position.set(0, H + 0.22, -D / 2 + 0.25); g.add(snowRoof)
  const chimney = rbox(0.5, 0.8, 0.5, M.stucco, 0.04); chimney.position.set(0, H + 0.6, -D + 0.4); g.add(chimney)
  const chSnow = rbox(0.56, 0.08, 0.56, M.snow, 0.03); chSnow.position.set(0, H + 1.03, -D + 0.4); g.add(chSnow)
  // steps
  for (let i = 0; i < 3; i++) { const s = rbox(2.0 - i * 0.25, 0.12, 0.4, M.trim, 0.02); s.position.set(0, 0.06 + i * 0.12 - 0.36, 0.45 - i * 0.32); g.add(s) }
  // bougainvillea over the arch shoulders, mirrored
  const anchors = []
  for (const s of [-1, 1]) {
    anchors.push({ x: s * 0.75, y: 2.5, z: 0.02, sx: 1.1, sy: 0.16, dx: -s * 0.15, drop: 0.2 })
    anchors.push({ x: s * 1.95, y: 2.35, z: 0.02, sx: 0.32, sy: 0.4, dx: s * 0.05, drop: 1.75 })
    anchors.push({ x: s * 1.75, y: 2.5, z: 0.02, sx: 0.5, sy: 0.15, dx: 0, drop: 0.3 })
  }
  g.add(bougainvillea(M, anchors, 4200))
  return shadowed(g)
}

function wing(M, side) {
  const g = new THREE.Group()
  const W = 2.5, H = 1.75, D = 2.4
  const body = rbox(W, H, D, M.redBoard, 0.03); body.position.set(0, H / 2, -D / 2); g.add(body)
  body.material = M.redBoard.clone(); body.material.map = M.redBoard.map.clone(); body.material.map.repeat.set(W / 2, H / 2); body.material.map.needsUpdate = true
  for (const x of [-0.6, 0.6]) { const w = paneWindow(0.5, 0.72, M); w.position.set(x, 0.95, 0.01); g.add(w) }
  const roof = rbox(W + 0.5, 0.12, D + 0.6, M.slate, 0.03); roof.position.set(0, H + 0.06, -D / 2 + 0.15); g.add(roof)
  const sn = rbox(W + 0.4, 0.12, D + 0.5, M.snow, 0.06); sn.position.set(0, H + 0.17, -D / 2 + 0.15); g.add(sn)
  const corner = rbox(0.08, H, 0.08, M.trim, 0.01); corner.position.set(side * (W / 2 - 0.02), H / 2, 0.0); g.add(corner)
  const corner2 = corner.clone(); corner2.position.x = -side * (W / 2 - 0.02); g.add(corner2)
  return shadowed(g)
}

function pool(M) {
  const g = new THREE.Group()
  const L = 4.6, Wd = 2.3
  const ice = new THREE.Mesh(new THREE.PlaneGeometry(Wd, L), M.ice); ice.rotation.x = -Math.PI / 2; ice.position.y = 0.02; g.add(ice)
  const c = 0.22
  const cop = (w, d, x, z) => { const m = rbox(w, 0.1, d, M.trim, 0.03); m.position.set(x, 0.05, z); g.add(m) }
  cop(Wd + c * 2, c, 0, -L / 2 - c / 2); cop(Wd + c * 2, c, 0, L / 2 + c / 2); cop(c, L, -Wd / 2 - c / 2, 0); cop(c, L, Wd / 2 + c / 2, 0)
  return shadowed(g)
}

// Stage flats, painted rather than lit: each column of the strip takes a colour
// from its slope, so faces turned to the low sun (on the right) glow and the
// others fall into cool shade. kind 'rolling' = golden hills, 'peaks' = the far range.
function hillFlat({ width, base, amp, seed, lit, shade, low, snowLit, snowShade, z, y, kind = 'rolling', snow = 0.0, segments = 360, freq = 1 }) {
  const r = rng(seed); const ph = [r() * 6, r() * 6, r() * 6, r() * 6, r() * 6]
  const roll = (x) => 0.6 * Math.sin(x * 0.11 + ph[0]) + 0.3 * Math.sin(x * 0.23 + ph[1]) + 0.1 * Math.sin(x * 0.47 + ph[2])
  const peak = (x) => { const a = 1 - Math.abs(Math.sin(x * 0.085 + ph[0])); const b = 1 - Math.abs(Math.sin(x * 0.19 + ph[1])); const c = 1 - Math.abs(Math.sin(x * 0.43 + ph[4])); return 1.25 * Math.pow(a, 1.6) + 0.45 * Math.pow(b, 2.2) + 0.08 * Math.pow(c, 2) - 0.4 }
  const f = (x) => base + amp * (kind === 'peaks' ? peak(x * freq) : roll(x * freq))
  const bottom = -8
  const pos = [], col = [], idx = []
  const cl = C(lit), cs = C(shade), cb = C(low)
  const snl = C(snowLit || '#fff'), sns = C(snowShade || '#ddd')
  const tmp = new THREE.Color()
  const slopeLight = (x) => { const d = (f(x + 0.35) - f(x - 0.35)) / 0.7; return THREE.MathUtils.clamp(0.5 - d * (kind === 'peaks' ? 0.9 : 1.6), 0, 1) }
  // ground strip
  for (let i = 0; i <= segments; i++) {
    const x = -width / 2 + (i / segments) * width, yt = f(x), l = slopeLight(x)
    tmp.copy(cs).lerp(cl, l)
    pos.push(x, yt, 0, x, bottom, 0); col.push(tmp.r, tmp.g, tmp.b, cb.r, cb.g, cb.b)
    if (i < segments) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2) }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx)
  const g = new THREE.Group()
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true })))
  if (snow > 0) {
    const p2 = [], c2 = [], i2 = []
    for (let i = 0; i <= segments; i++) {
      const x = -width / 2 + (i / segments) * width, yt = f(x), l = slopeLight(x)
      const t = THREE.MathUtils.clamp((yt - base + amp * 0.25) / (amp * 1.3), 0, 1)
      const n = 0.62 + 0.25 * Math.sin(x * 1.7 + seed) + 0.18 * Math.sin(x * 4.1 + seed * 2) + 0.1 * Math.sin(x * 9.3)
      const depth = snow * Math.pow(t, 1.3) * Math.max(0.1, n)
      tmp.copy(sns).lerp(snl, l)
      p2.push(x, yt + 0.01, 0.01, x, yt - depth, 0.01); c2.push(tmp.r, tmp.g, tmp.b, tmp.r, tmp.g, tmp.b)
      if (i < segments) { const k = i * 2; i2.push(k, k + 1, k + 2, k + 1, k + 3, k + 2) }
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(p2, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(c2, 3)); sg.setIndex(i2)
    g.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true })))
  }
  g.position.set(0, y, z)
  return g
}

// Sky backdrop: gradient by world height so framing never washes it out.
function sky(width, height, z, y0 = 0, sunXY = [36, 7]) {
  const m = new THREE.ShaderMaterial({
    depthWrite: false, fog: false,
    uniforms: { top: { value: C(PALETTE.skyTop) }, mid: { value: C(PALETTE.skyMid) }, hor: { value: C(PALETTE.horizon) }, sun: { value: new THREE.Vector2(sunXY[0], sunXY[1]) }, h0: { value: y0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `varying vec3 vW; uniform vec3 top, mid, hor; uniform vec2 sun; uniform float h0;
      void main(){ float y=vW.y-h0; vec3 c=mix(hor,mid,smoothstep(-2.,10.,y)); c=mix(c,top,smoothstep(8.,30.,y));
      float d=length((vW.xy-sun)*vec2(0.6,1.)); c+=vec3(1.,.70,.42)*0.28*exp(-d*0.09); c+=vec3(1.,.86,.62)*0.10*exp(-d*0.025);
      gl_FragColor=vec4(c,1.); }`,
  })
  const p = new THREE.Mesh(new THREE.PlaneGeometry(width, height), m); p.position.z = z
  return p
}

function snowGround(w, d, M, seed = 5) {
  const geo = new THREE.PlaneGeometry(w, d, 220, 220); geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position; const r = rng(seed); const ph = Array.from({ length: 6 }, () => r() * 10)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i)
    const n = 0.05 * Math.sin(x * 0.7 + ph[0]) * Math.sin(z * 0.9 + ph[1]) + 0.025 * Math.sin(x * 2.1 + z * 1.3 + ph[2]) + 0.012 * Math.sin(x * 5.3 - z * 4.1 + ph[3])
    pos.setY(i, n)
  }
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, M.snow); m.receiveShadow = true
  return m
}

// A line of footprints from the front of the set to the door: someone came in early.
function footprints() {
  const geo = new THREE.CircleGeometry(1, 20); geo.rotateX(-Math.PI / 2)
  const mat = new THREE.MeshStandardMaterial({ color: '#C9D3E3', roughness: 1, transparent: true, opacity: 0.85 })
  const pts = []
  for (let i = 0; i < 30; i++) {
    const z = 12 - i * 0.37
    const side = i % 2 ? 1 : -1
    const x = z > 2.4 ? 2.0 : 2.0 * Math.max(0, (z - 0.7) / 1.7)
    pts.push([x + side * 0.1, z])
  }
  const inst = new THREE.InstancedMesh(geo, mat, pts.length)
  const m = new THREE.Matrix4()
  pts.forEach(([x, z], i) => { m.compose(new THREE.Vector3(x, 0.03, z), new THREE.Quaternion(), new THREE.Vector3(0.06, 1, 0.12)); inst.setMatrixAt(i, m) })
  inst.receiveShadow = true
  return inst
}

// ---------- product pavilions ----------
async function pavilion(M, kind, logoUrl) {
  const g = new THREE.Group()
  if (kind === 'mcp-emails') {
    // whitewashed post house, arched door, enamel sign with the real logo
    const body = rbox(2.4, 2.2, 2, M.stucco, 0.05); body.position.set(0, 1.1, -1); g.add(body)
    const front = archWall(2.4, 2.2, 0.2, [{ x: 0, y: 0, hw: 0.42, hh: 0.9 }], M.stucco); front.position.z = -0.05; g.add(front)
    const d = archPanel(0.42, 0.9, M.glow); d.position.set(0, 0, 0.04); g.add(d)
    const dr = rbox(0.5, 0.98, 0.05, M.falu, 0.02); dr.position.set(0, 0.49, 0.08); g.add(dr)
    const tex = await logoTexture(logoUrl, { size: 512, pad: 80, bg: '#FBF8F2', radius: 0 })
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 }))
    sign.position.set(0, 1.62, 0.2); g.add(sign)
    const plate = rbox(0.7, 0.7, 0.05, M.trim, 0.05); plate.position.set(0, 1.62, 0.17); g.add(plate)
    const box = rbox(0.34, 0.46, 0.22, M.falu, 0.05); box.position.set(0.85, 0.95, 0.27); g.add(box)
    const slot = rbox(0.2, 0.03, 0.02, M.slateDeep, 0.01); slot.position.set(0.85, 1.08, 0.39); g.add(slot)
    const roof = rbox(3.0, 0.12, 2.6, M.slate, 0.03); roof.position.set(0, 2.26, -0.85); g.add(roof)
    const sn = rbox(2.9, 0.12, 2.5, M.snow, 0.05); sn.position.set(0, 2.37, -0.85); g.add(sn)
    const anchors = [{ x: -0.85, y: 2.0, z: 0.16, sx: 0.5, sy: 0.25, dx: -0.15, drop: 1.4 }]
    g.add(bougainvillea(M, anchors, 360, 9))
  } else if (kind === 'fun-libs') {
    // ochre kiosk with striped awning; the real icon fills the shop window
    const body = rbox(2.2, 2.0, 1.8, M.ochre, 0.05); body.position.set(0, 1.0, -0.9); g.add(body)
    const tex = await logoTexture(logoUrl, { size: 512, radius: 110 })
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.3, transparent: true }))
    win.position.set(0, 1.0, 0.03); g.add(win)
    const frame = rbox(1.15, 1.15, 0.05, M.trim, 0.03); frame.position.set(0, 1.0, 0.0); g.add(frame)
    const awn = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.0, 32, 1, true, 0, Math.PI / 2), M.stripe)
    awn.material = M.stripe.clone(); awn.material.side = THREE.DoubleSide
    awn.rotation.z = Math.PI / 2; awn.rotation.y = 0; awn.position.set(0, 1.62, 0.02); g.add(awn)
    const aw2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.5), M.snow); aw2.position.set(0, 2.05, 0.18); aw2.rotation.x = 0.0; g.add(aw2)
    const roof = rbox(2.6, 0.12, 2.2, M.slate, 0.03); roof.position.set(0, 2.06, -0.85); g.add(roof)
    const sn = rbox(2.5, 0.12, 2.1, M.snow, 0.05); sn.position.set(0, 2.17, -0.85); g.add(sn)
    const bench = rbox(1.6, 0.08, 0.36, M.trim, 0.03); bench.position.set(0, 0.36, 0.5); g.add(bench)
    for (const x of [-0.7, 0.7]) { const l = rbox(0.08, 0.34, 0.3, M.trim, 0.01); l.position.set(x, 0.17, 0.5); g.add(l) }
    const bs = rbox(1.5, 0.05, 0.3, M.snow, 0.025); bs.position.set(0, 0.42, 0.5); g.add(bs)
  } else if (kind === 'toolrails') {
    // slate ranch pavilion with a long cantilevered roof; logo as the lit sign
    const body = rbox(2.8, 1.5, 1.8, M.slate, 0.03); body.position.set(0, 0.75, -0.9); g.add(body)
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), M.glow); glass.position.set(0.25, 0.62, 0.01); g.add(glass)
    for (const x of [-0.65, -0.05, 0.55, 1.15]) { const mul = rbox(0.05, 1.05, 0.06, M.trim, 0.01); mul.position.set(x, 0.62, 0.03); g.add(mul) }
    const tex = await logoTexture(logoUrl, { size: 512 })
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.4, transparent: true }))
    sign.position.set(-1.0, 0.9, 0.04); g.add(sign)
    const roof = rbox(4.2, 0.1, 2.9, M.trim, 0.03); roof.position.set(0.3, 1.55, -0.6); g.add(roof)
    const sn = rbox(4.1, 0.1, 2.8, M.snow, 0.05); sn.position.set(0.3, 1.65, -0.6); g.add(sn)
    const post = rbox(0.08, 1.5, 0.08, M.trim, 0.01); post.position.set(2.1, 0.75, 0.6); g.add(post)
    // still building: a stack of fresh boards under the eave
    for (let i = 0; i < 4; i++) { const b = rbox(1.1, 0.06, 0.22, M.ochre, 0.015); b.position.set(1.55, 0.03 + i * 0.065, 0.35); b.rotation.y = (i % 2 ? 0.04 : -0.03); g.add(b) }
  } else if (kind === 'harbor') {
    // white clapboard house with falu red door; logo in the frosted window; lamp off (paused)
    const body = rbox(2.2, 1.8, 2, M.whiteBoard, 0.03); body.position.set(0, 0.9, -1); g.add(body)
    body.material = M.whiteBoard.clone(); body.material.map = M.whiteBoard.map.clone(); body.material.map.repeat.set(1.1, 0.9); body.material.map.needsUpdate = true
    // gable roof
    const shape = new THREE.Shape(); shape.moveTo(-1.35, 0); shape.lineTo(0, 1.0); shape.lineTo(1.35, 0); shape.closePath()
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 2.3, bevelEnabled: false }), M.slate); roof.position.set(0, 1.8, -2.15); g.add(roof)
    const s2 = new THREE.Shape(); s2.moveTo(-1.3, 0.04); s2.lineTo(0, 1.02); s2.lineTo(1.3, 0.04); s2.lineTo(1.2, 0.1); s2.lineTo(0, 0.95); s2.lineTo(-1.2, 0.1); s2.closePath()
    const snowR = new THREE.Mesh(new THREE.ExtrudeGeometry(s2, { depth: 2.3, bevelEnabled: false }), M.snow); snowR.position.set(0, 1.84, -2.15); g.add(snowR)
    const door = rbox(0.5, 1.1, 0.06, M.falu, 0.02); door.position.set(-0.55, 0.55, 0.02); g.add(door)
    const tex = await logoTexture(logoUrl, { size: 512, pad: 60, bg: '#EDEAE3', radius: 0 })
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }))
    win.position.set(0.45, 1.0, 0.04); g.add(win)
    const fr = paneWindow(0.7, 0.7, M, false); fr.children[0].visible = false; fr.position.set(0.45, 1.0, 0.03)
    fr.children.slice(5, 8).forEach((c) => (c.visible = false)); g.add(fr)
    const bench = rbox(0.8, 0.07, 0.3, M.falu, 0.02); bench.position.set(0.45, 0.32, 0.4); g.add(bench)
  }
  return shadowed(g)
}

const GOLD = { lit: '#EDB96A', shade: '#B27A3C', low: '#9A6233', snowLit: '#FFF1E2', snowShade: '#D9D4E3' }
const GOLD2 = { lit: '#F2C784', shade: '#C08C58', low: '#B07C4E', snowLit: '#FFF2E6', snowShade: '#DCD8E6' }
const RANGE = { lit: '#9C8FA6', shade: '#6C7894', low: '#7D88A2', snowLit: '#FFE3D2', snowShade: '#BCC4DA' }

// ---------- shots ----------
const SHOTS = {
  'hero-wide': { fov: 22, pos: [0, 3.0, 19.5], look: [0, 1.75, 0], tilt: 0.6 },
  'hero-tall': { fov: 30, pos: [0, 2.6, 17.5], look: [0, 2.3, 0], tilt: 0.55 },
  'arch-detail': { fov: 16, pos: [1.2, 1.5, 8.5], look: [0, 1.5, 0], tilt: 0.5 },
  og: { fov: 20, pos: [0, 2.7, 20], look: [0, 1.85, 0], tilt: 0.55 },
  product: { fov: 26, pos: [0, 1.65, 7.9], look: [0, 1.2, 0], tilt: 0.7 },
}
// The single unbroken camera move: from the wide spread down the pool axis
// to the lit doorway. progress 0 -> 1.
export function cameraAt(p) {
  const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
  const k = 0.15 + 0.85 * e
  return {
    pos: new THREE.Vector3(0, 3.0 - 1.1 * k, 19.5 - 10.0 * k),
    look: new THREE.Vector3(0, 1.75 - 0.3 * k, 0 - 1.0 * k),
    fov: 22 + 4 * k,
  }
}

export async function createTerrace(canvas, opts = {}) {
  const { shot = 'hero-wide', post = true, product = null, logoUrl = null, dpr = 1, shadowSize = 4096, ao = true } = opts
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(dpr)
  const w = opts.width || canvas.clientWidth || 1600, h = opts.height || canvas.clientHeight || 900
  renderer.setSize(w, h, false)
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const fogCol = C('#F1D9C8')
  scene.fog = new THREE.Fog(fogCol, 60, 260)
  // painted backdrop (sky, flats, sea) lives in its own scene so AO never touches it
  const bg = new THREE.Scene(); bg.fog = scene.fog
  const pm = new THREE.PMREMGenerator(renderer)
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.35

  const M = mats()
  const isProduct = !!product

  // light: a low winter sun from the right, grazing the snow
  const sun = new THREE.DirectionalLight('#FFC48C', isProduct ? 12 : 15)
  sun.position.set(...(opts.sun || (isProduct ? [10, 2.0, -1.5] : [13, 2.5, -7])))
  sun.castShadow = true
  sun.shadow.mapSize.set(shadowSize, shadowSize)
  const sc = sun.shadow.camera; sc.left = -15; sc.right = 15; sc.top = 11; sc.bottom = -11; sc.near = 1; sc.far = 60
  sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.02
  scene.add(sun); scene.add(sun.target)
  scene.add(new THREE.HemisphereLight('#94B2E2', '#EBD9CC', isProduct ? 0.48 : 0.42))

  const world = new THREE.Group(); scene.add(world)
  world.add(snowGround(70, 50, M))

  if (isProduct) {
    world.add(await pavilion(M, product, logoUrl))
    const back = sky(140, 80, -32, -9, [20, -2]); back.position.y = 10; bg.add(back)
    bg.add(hillFlat({ width: 90, base: 0.9, amp: 1.1, seed: 4, freq: 2.2, ...GOLD, z: -16, y: 0, snow: 0.3 }))
    bg.add(hillFlat({ width: 110, base: 1.8, amp: 1.6, seed: 7, freq: 1.6, ...GOLD2, z: -21, y: 0, snow: 0.5 }))
    bg.add(hillFlat({ width: 140, base: 3.2, amp: 3.2, seed: 8, freq: 1.4, kind: 'peaks', ...RANGE, z: -28, y: 0, snow: 2.2 }))
    for (const s of [-1, 1]) { const c = cypress(M, 2.8); c.position.set(s * 2.45, 0, -1.6); world.add(c) }
  } else {
    world.add(house(M))
    for (const s of [-1, 1]) {
      const wg = wing(M, s); wg.position.set(s * 3.35, 0, -0.5); world.add(wg)
      const cy = cypress(M, 3.9); cy.position.set(s * 5.35, 0, -0.2); world.add(cy)
      const cy2 = cypress(M, 3.1); cy2.position.set(s * 6.1, 0, -1.3); world.add(cy2)
      const pa = parasol(M); pa.position.set(s * 3.3, 0, 4.4); world.add(pa)
      const lo = lounger(M); lo.position.set(s * 2.25, 0, 4.6); world.add(lo)
      const lp = lemonPot(M); lp.scale.setScalar(0.8); lp.position.set(s * 1.3, 0, 1.55); world.add(lp)
    }
    const pl = pool(M); pl.position.set(0, 0, 4.6); world.add(pl)
    world.add(footprints())
    // terrace parapet at the far edge, then the frozen sea and the hills
    for (const s of [-1, 1]) { const par = rbox(9, 0.55, 0.35, M.stucco, 0.08); par.position.set(s * 8.0, 0.27, -4.6); world.add(shadowed(par)) }
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), new THREE.MeshBasicMaterial({ color: '#C9D6E2' }))
    sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.6, -36); bg.add(sea)
    bg.add(hillFlat({ width: 140, base: 1.3, amp: 1.5, seed: 21, ...GOLD, z: -34, y: -0.6, snow: 0.3 }))
    bg.add(hillFlat({ width: 170, base: 3.2, amp: 2.4, seed: 34, ...GOLD2, z: -48, y: -0.6, snow: 0.9 }))
    bg.add(hillFlat({ width: 230, base: 7.5, amp: 7.5, seed: 55, kind: 'peaks', ...RANGE, z: -70, y: -0.6, snow: 5.0 }))
    const back = sky(400, 140, -95); back.position.y = 40; bg.add(back)
    // sun disc on the far flat, low on the right
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 64), new THREE.MeshBasicMaterial({ color: '#FFE4C2', fog: false }))
    disc.position.set(44, 6.5, -88); bg.add(disc)
  }

  const s = SHOTS[isProduct ? 'product' : shot] || SHOTS['hero-wide']
  const camera = new THREE.PerspectiveCamera(s.fov, w / h, 0.1, 400)
  camera.position.set(...s.pos); camera.lookAt(...s.look)
  if (shot === 'hero-tall') camera.position.z += 0

  let composer = null, tiltH = null, tiltV = null
  if (post) {
    const rt = new THREE.WebGLRenderTarget(w * dpr, h * dpr, { type: THREE.HalfFloatType, samples: 4 })
    composer = new EffectComposer(renderer, rt)
    composer.addPass(new RenderPass(bg, camera))
    const fgPass = new RenderPass(scene, camera); fgPass.clear = false; fgPass.clearDepth = true; composer.addPass(fgPass)
    if (ao) {
      const gt = new GTAOPass(scene, camera, w * dpr, h * dpr)
      gt.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.5, thickness: 1.2, scale: 1.1, samples: 16 })
      gt.blendIntensity = 0.85
      composer.addPass(gt)
    }
    composer.addPass(new OutputPass())
    const tilt = {
      uniforms: { tDiffuse: { value: null }, amt: { value: (s.tilt || 0.5) / h }, focus: { value: 0.46 }, dir: { value: new THREE.Vector2(1, 0) }, res: { value: new THREE.Vector2(w, h) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float amt, focus; uniform vec2 dir, res; varying vec2 vUv;
        void main(){ float dy = vUv.y - focus; float d = dy < 0. ? smoothstep(0.16, 0.55, -dy) : smoothstep(0.3, 0.6, dy) * 0.45; float r = d * 9.0;
          vec4 s = vec4(0.); float wsum = 0.;
          for (int i=-6;i<=6;i++){ float f=float(i)/6.; float wgt=exp(-f*f*2.); s+=texture2D(tDiffuse, vUv + dir/res*f*r)*wgt; wsum+=wgt; }
          gl_FragColor = s/wsum; }`,
    }
    tiltH = new ShaderPass(tilt); composer.addPass(tiltH)
    tiltV = new ShaderPass(tilt); tiltV.uniforms.dir.value = new THREE.Vector2(0, 1); composer.addPass(tiltV)
    const grade = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(w, h) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
          c = c * 0.94 + vec3(0.045, 0.04, 0.05);            // lifted, matte blacks
          c = mix(c, c * vec3(1.03, 0.99, 0.96), 0.6);       // warm highlights
          float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, 0.92); // a touch pastel
          vec2 q = vUv - .5; c *= 1. - dot(q, q) * 0.32;      // gentle vignette
          c += (h(vUv * res) - .5) * 0.022;                   // fine grain
          gl_FragColor = vec4(c, 1.); }`,
    })
    composer.addPass(grade)
  }

  function setProgress(p) {
    const cam = cameraAt(Math.min(1, Math.max(0, p)))
    camera.position.copy(cam.pos); camera.lookAt(cam.look); camera.fov = cam.fov; camera.updateProjectionMatrix()
  }
  function render() {
    if (composer) return composer.render()
    renderer.autoClear = false; renderer.clear(); renderer.render(bg, camera); renderer.clearDepth(); renderer.render(scene, camera)
  }
  function resize(nw, nh) {
    renderer.setSize(nw, nh, false); camera.aspect = nw / nh; camera.updateProjectionMatrix()
    if (composer) composer.setSize(nw, nh)
  }
  return { renderer, scene, bg, camera, setProgress, render, resize, sun }
}
