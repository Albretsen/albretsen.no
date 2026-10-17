// Morning Elevation: the facade scene.
// A perfectly symmetrical Norwegian empire-style wooden house, built from
// three.js primitives and dressed in CC0 photographic textures (ambientCG).
// Only the sun moves. Everything else is still.
//
//   import { createFacade } from './facade.js'
//   const f = await createFacade({ canvas, base: './', sun: 0.15 })
//   f.setSun(0.4)   // 0 = first light from the left, 1 = late evening right
//   f.resize(w, h)
//
// three.js is imported from a pinned CDN build. Load this module lazily,
// after first paint; the static hero image covers the wait.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js'

export const PALETTE = {
  peach: 0xf2b98f,     // facade paint
  peachDeep: 0xe59a72,
  gold: 0xf6c56b,
  paleBlue: 0xb9cfe3,
  silver: 0xdfe3e6,
  trim: 0xf7f1e6,      // linseed white trim
  door: 0x8fb3c9,      // pale blue door
  falu: 0x8e3326,
  ink: 0x1f2433,
}

const LIVE = [
  { id: 'mcp-emails', name: 'MCP Emails', logo: 'products/logos/mcp-emails-icon.png', tint: '#f7e9dc' },
  { id: 'fun-libs', name: 'Fun Libs', logo: 'products/logos/fun-libs-icon.png', tint: '#f7ecd8' },
  { id: 'toolrails', name: 'Toolrails', logo: 'products/logos/toolrails-icon.svg', tint: '#f3e6d6' },
  { id: 'harbor', name: 'Harbor', logo: 'products/logos/harbor-mark-filled.svg', tint: '#f5ebdf', svgColor: '#24324a' },
]

function loadImage(src) {
  return new Promise((res) => {
    const im = new Image()
    im.crossOrigin = 'anonymous'
    im.onload = () => res(im)
    im.onerror = () => res(null)
    im.src = src
  })
}

// Interior behind a shop window: warm plaster wall, a lamp pool, a small
// easel card carrying the real product logo. Drawn to a canvas so the
// product can be swapped without new art.
async function interiorTexture(base, product, lit = true) {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 820
  const g = c.getContext('2d')
  // plaster wall, warm, darker at the edges (vignette = depth)
  const wall = g.createRadialGradient(256, 330, 40, 256, 380, 520)
  wall.addColorStop(0, lit ? '#f6cf9c' : '#d9c7b4')
  wall.addColorStop(0.5, lit ? '#c98f62' : '#a8968a')
  wall.addColorStop(1, lit ? '#4a2f27' : '#4d4544')
  g.fillStyle = wall; g.fillRect(0, 0, 512, 820)
  // wainscot
  g.fillStyle = 'rgba(80,50,40,.22)'; g.fillRect(0, 560, 512, 260)
  g.fillStyle = 'rgba(255,240,220,.25)'; g.fillRect(0, 556, 512, 6)
  // shelf / table
  g.fillStyle = '#5b3d31'; g.fillRect(60, 630, 392, 16)
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(60, 646, 392, 10)
  if (product) {
    // card with soft shadow
    g.save()
    g.shadowColor = 'rgba(60,30,20,.45)'; g.shadowBlur = 30; g.shadowOffsetY = 10
    g.fillStyle = product.tint
    roundRect(g, 116, 300, 280, 330, 12); g.fill()
    g.restore()
    const im = await loadImage(base + product.logo)
    if (im) {
      if (product.svgColor) {
        // tint single-colour SVG mark
        const t = document.createElement('canvas'); t.width = 256; t.height = 256
        const tg = t.getContext('2d'); tg.drawImage(im, 0, 0, 256, 256)
        tg.globalCompositeOperation = 'source-in'; tg.fillStyle = product.svgColor; tg.fillRect(0, 0, 256, 256)
        g.drawImage(t, 156, 330, 200, 200)
      } else {
        g.drawImage(im, 156, 330, 200, 200)
      }
    }
    g.fillStyle = '#2a2622'
    g.font = '500 30px Jost, system-ui, sans-serif'
    g.textAlign = 'center'
    g.fillText(product.name.toUpperCase(), 256, 578)
    g.fillStyle = 'rgba(42,38,34,.5)'; g.fillRect(226, 596, 60, 2)
  }
  // lamp pool from above
  if (lit) {
    const lamp = g.createRadialGradient(256, 120, 10, 256, 200, 360)
    lamp.addColorStop(0, 'rgba(255,236,190,.55)')
    lamp.addColorStop(1, 'rgba(255,236,190,0)')
    g.fillStyle = lamp; g.fillRect(0, 0, 512, 820)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Sheer linen curtain for the upper floor.
function curtainTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = '#5d5a5e'; g.fillRect(0, 0, 256, 512)
  for (let x = 0; x < 256; x++) {
    const f = 0.5 + 0.5 * Math.sin(x * 0.19) * Math.sin(x * 0.043 + 1)
    g.fillStyle = `rgba(250,240,228,${0.42 + f * 0.36})`
    g.fillRect(x, 0, 1, 512)
  }
  // tie-backs leave the middle open
  const mid = g.createLinearGradient(0, 0, 256, 0)
  mid.addColorStop(0.36, 'rgba(60,58,64,0)'); mid.addColorStop(0.5, 'rgba(60,58,64,.65)'); mid.addColorStop(0.64, 'rgba(60,58,64,0)')
  g.fillStyle = mid; g.fillRect(0, 140, 256, 372)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath()
}

// Sign board over the door, set in the brand display face.
async function signTexture() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 236
  const g = c.getContext('2d')
  try { await document.fonts.load('120px Italiana') } catch {}
  g.fillStyle = '#f7f1e6'; g.fillRect(0, 0, 2048, 236)
  g.fillStyle = '#3a3a48'; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.font = '150px Italiana, "Poiret One", serif'
  g.letterSpacing = '60px'
  g.fillText('ALBRETSEN', 1054, 128)
  g.fillRect(180, 120, 140, 3); g.fillRect(1728, 120, 140, 3)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t
}

function tex(loader, url, repeat, srgb = false) {
  const t = loader.load(url)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat[0], repeat[1])
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

export async function createFacade({ canvas, base = './', sun = 0.2, width, height, pixelRatio, alpha = true, skyUrl, mobile = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: true })
  renderer.setPixelRatio(pixelRatio || Math.min(devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  if (alpha) renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  let done
  const allLoaded = new Promise((r) => (done = r))
  const manager = new THREE.LoadingManager(() => done())
  const loader = new THREE.TextureLoader(manager)
  const T = base + '3d/tex/'

  // Environment from the graded sky photograph: soft silver light, peach low.
  if (skyUrl) {
    const sky = await new Promise((r) => loader.load(skyUrl, r, undefined, () => r(null)))
    if (sky) {
      sky.mapping = THREE.EquirectangularReflectionMapping
      sky.colorSpace = THREE.SRGBColorSpace
      const pm = new THREE.PMREMGenerator(renderer)
      scene.environment = pm.fromEquirectangular(sky).texture
      scene.environmentIntensity = 0.35
      pm.dispose()
    }
  }

  const fogColor = new THREE.Color(0xe8d2c4)
  scene.fog = new THREE.Fog(fogColor, 70, 260)

  // ---------- materials
  const W = 15, H = 7.0, P = 0.7 // wall width, wall height, plinth
  const siding = new THREE.MeshStandardMaterial({
    color: PALETTE.peach,
    map: tex(loader, T + 'siding-color.jpg', [W / 2.2, H / 2.2], true),
    normalMap: tex(loader, T + 'siding-normal.jpg', [W / 2.2, H / 2.2]),
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: tex(loader, T + 'siding-rough.jpg', [W / 2.2, H / 2.2]),
    roughness: 0.9,
  })
  const sidingBay = siding.clone()
  sidingBay.map = tex(loader, T + 'siding-color.jpg', [5.2 / 2.2, 8 / 2.2], true)
  sidingBay.normalMap = tex(loader, T + 'siding-normal.jpg', [5.2 / 2.2, 8 / 2.2])
  sidingBay.roughnessMap = null
  const trim = new THREE.MeshStandardMaterial({ color: PALETTE.trim, roughness: 0.62 })
  const stone = new THREE.MeshStandardMaterial({ color: 0xb9b2aa, roughness: 0.95,
    map: tex(loader, T + 'paving-color.jpg', [4, 0.4], true), normalMap: tex(loader, T + 'paving-normal.jpg', [4, 0.4]) })
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x6a7080, roughness: 0.55, metalness: 0.05,
    map: tex(loader, T + 'roof-color.jpg', [6, 2], true), normalMap: tex(loader, T + 'roof-normal.jpg', [6, 2]), side: THREE.DoubleSide })
  const doorMat = new THREE.MeshStandardMaterial({ color: PALETTE.door, roughness: 0.5 })
  const brass = new THREE.MeshStandardMaterial({ color: 0xd9b46a, roughness: 0.25, metalness: 1 })
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x9fb3c8, roughness: 0.04, metalness: 0, transmission: 0,
    transparent: true, opacity: 0.14, envMapIntensity: 1.2, clearcoat: 1 })
  const ground = new THREE.MeshStandardMaterial({ color: 0xe9dccb, roughness: 0.95,
    map: tex(loader, T + 'paving-color.jpg', [150, 150], true), normalMap: tex(loader, T + 'paving-normal.jpg', [150, 150]), normalScale: new THREE.Vector2(0.6, 0.6) })
  const falu = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9,
    map: tex(loader, T + 'falu-color.jpg', [3, 3], true), normalMap: tex(loader, T + 'falu-normal.jpg', [3, 3]) })
  const leaf = new THREE.MeshStandardMaterial({ color: 0x3d5a3a, roughness: 0.95, flatShading: false })

  const box = (w, h, d, mat, x, y, z, cast = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m
  }

  // ---------- ground
  const g = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), ground)
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g)

  // ---------- body: front walls are shapes with real window openings
  const bayW = 5.2, bayD = 0.32
  const gy = P + 2.05, uy = P + 5.05
  const cols = [-6.0, -3.8, 3.8, 6.0]
  const wallMat = siding.clone()
  for (const k of ['map', 'normalMap', 'roughnessMap']) {
    wallMat[k] = siding[k].clone(); wallMat[k].repeat.set(1 / 2.2, 1 / 2.2); wallMat[k].needsUpdate = true
  }
  const rectHole = (x, y, w, h) => { const p = new THREE.Path(); p.moveTo(x - w / 2, y - h / 2); p.lineTo(x - w / 2, y + h / 2); p.lineTo(x + w / 2, y + h / 2); p.lineTo(x + w / 2, y - h / 2); p.closePath(); return p }
  const wallShape = (x0, x1, y0, y1, holes, z) => {
    const sh = new THREE.Shape(); sh.moveTo(x0, y0); sh.lineTo(x1, y0); sh.lineTo(x1, y1); sh.lineTo(x0, y1); sh.closePath()
    sh.holes.push(...holes)
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 4), wallMat)
    m.position.z = z; m.castShadow = true; m.receiveShadow = true; scene.add(m); return m
  }
  const mainHoles = [
    ...cols.map((x) => rectHole(x, gy, 1.15, 1.85)),
    ...cols.map((x) => rectHole(x, uy, 1.15, 1.75)),
    rectHole(0, P + H / 2, bayW, H),
  ]
  wallShape(-W / 2, W / 2, P, P + H, mainHoles, 0)
  wallShape(-bayW / 2, bayW / 2, P, P + H, [rectHole(0, uy, 1.25, 1.75), rectHole(-1.55, uy, 0.55, 1.75), rectHole(1.55, uy, 0.55, 1.75)], bayD)
  for (const s of [-1, 1]) box(0.02, H, bayD, wallMat, s * bayW / 2, P + H / 2, bayD / 2)
  box(W, H, 9, siding, 0, P + H / 2, -5.1)
  box(W + 0.12, P, 9.6, stone, 0, P / 2, -4.75)
  // corner boards
  for (const s of [-1, 1]) {
    box(0.3, H, 0.1, trim, s * (W / 2 - 0.14), P + H / 2, 0.04)
    box(0.24, H, 0.1, trim, s * (bayW / 2 - 0.11), P + H / 2, bayD + 0.04)
  }
  // storey band, frieze, cornice
  box(W + 0.05, 0.2, 0.08, trim, 0, P + 3.45, 0.04)
  box(bayW + 0.05, 0.2, 0.08, trim, 0, P + 3.45, bayD + 0.04)
  box(W + 0.1, 0.55, 0.1, trim, 0, P + H - 0.27, 0.05)
  {
    const fr = new THREE.Mesh(new THREE.BoxGeometry(bayW + 0.06, 0.6, 0.1), [trim, trim, trim, trim, new THREE.MeshStandardMaterial({ map: await signTexture(), roughness: 0.62 }), trim])
    fr.position.set(0, P + H - 0.3, bayD + 0.05); fr.castShadow = fr.receiveShadow = true; scene.add(fr)
  }
  box(W + 1.1, 0.16, 1.0, trim, 0, P + H + 0.06, 0.1)
  box(W + 1.25, 0.08, 1.12, trim, 0, P + H + 0.16, 0.12)

  // ---------- contact shadow strips (cheap ambient occlusion under the eaves)
  {
    const c = document.createElement('canvas'); c.width = 4; c.height = 128
    const g2 = c.getContext('2d'); const gr = g2.createLinearGradient(0, 0, 0, 128)
    gr.addColorStop(0, 'rgba(40,24,20,.55)'); gr.addColorStop(1, 'rgba(40,24,20,0)')
    g2.fillStyle = gr; g2.fillRect(0, 0, 4, 128)
    const aoTex = new THREE.CanvasTexture(c)
    const aoMat = new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false })
    const strip = (w, h, x, y, z, rot = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), aoMat); m.position.set(x, y, z); m.rotation.z = rot; scene.add(m) }
    strip(W, 0.9, 0, P + H - 0.55 - 0.45, 0.012)
    strip(bayW, 0.9, 0, P + H - 0.55 - 0.45, bayD + 0.012)
    strip(W, 0.35, 0, P + 3.35 - 0.17, 0.012)
    strip(bayW, 0.35, 0, P + 3.35 - 0.17, bayD + 0.012)
  }

  // ---------- hipped roof
  {
    const y0 = P + H + 0.2, rise = 3.0, ox = W / 2 + 0.6, z0 = 0.62, z1 = -9.6, rx = W / 2 - 4.6
    const zm = (z0 + z1) / 2
    const v = [
      -ox, y0, z0, ox, y0, z0, rx, y0 + rise, zm, -rx, y0 + rise, zm, // front
      ox, y0, z1, -ox, y0, z1, -rx, y0 + rise, zm, rx, y0 + rise, zm, // back
    ]
    const geo = new THREE.BufferGeometry()
    const pos = [], uv = []
    const quad = (a, b, c, d) => { for (const i of [a, b, c, a, c, d]) { pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]); uv.push(v[i * 3] / 2.5, v[i * 3 + 1] / 1.4 + v[i * 3 + 2] / 2.5) } }
    quad(0, 1, 2, 3); quad(4, 5, 6, 7)
    const tri = (a, b, c) => { for (const i of [a, b, c]) { pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]); uv.push(v[i * 3 + 2] / 2.5, v[i * 3 + 1] / 1.4) } }
    tri(1, 4, 7); tri(5, 0, 3)
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    geo.computeVertexNormals()
    const roof = new THREE.Mesh(geo, roofMat); roof.castShadow = true; roof.receiveShadow = true; scene.add(roof)
    // chimneys, symmetric
    for (const s of [-1, 1]) {
      box(0.9, 2.6, 0.9, trim, s * 3.6, y0 + rise - 0.4, zm + 0.4)
      box(1.08, 0.16, 1.08, trim, s * 3.6, y0 + rise + 0.95, zm + 0.4)
    }
  }

  // ---------- pediment over the projection, with a half-sun lunette
  {
    const y0 = P + H + 0.2, pw = bayW + 0.7, ph = 2.0
    const shape = new THREE.Shape()
    shape.moveTo(-pw / 2, 0); shape.lineTo(pw / 2, 0); shape.lineTo(0, ph); shape.closePath()
    const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 1.4, bevelEnabled: false }), sidingBay)
    ped.position.set(0, y0, bayD - 1.15); ped.castShadow = ped.receiveShadow = true; scene.add(ped)
    // raking cornices
    const len = Math.hypot(pw / 2, ph) + 0.3, ang = Math.atan2(ph, pw / 2)
    for (const s of [-1, 1]) {
      const m = box(len, 0.2, 0.5, trim, s * pw / 4, y0 + ph / 2 + 0.08, bayD + 0.2)
      m.rotation.z = -s * ang
    }
    box(pw + 0.3, 0.16, 0.5, trim, 0, y0 + 0.02, bayD + 0.2)
    // lunette: half disc with radiating glazing bars (the sun motif)
    const r = 0.78
    const lun = new THREE.Mesh(new THREE.CircleGeometry(r, 48, 0, Math.PI), glassMat)
    lun.position.set(0, y0 + 0.35, bayD + 0.27); scene.add(lun)
    const lunBack = new THREE.Mesh(new THREE.CircleGeometry(r, 48, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2a2730, roughness: 1 }))
    lunBack.position.set(0, y0 + 0.35, bayD + 0.25); scene.add(lunBack)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.05, 0.07, 8, 48, Math.PI), trim)
    ring.position.copy(lun.position); ring.position.z += 0.03; ring.castShadow = true; scene.add(ring)
    for (let i = 1; i < 6; i++) {
      const a = (i / 6) * Math.PI
      const bar = box(r, 0.04, 0.05, trim, Math.cos(a) * r / 2, y0 + 0.35 + Math.sin(a) * r / 2, bayD + 0.3, false)
      bar.rotation.z = a
    }
  }

  // ---------- windows
  const windowMeshes = []
  async function windowAt(x, y, w, h, zFace, interior, { crown = true, panes = [2, 3] } = {}) {
    const depth = 0.22
    // reveal (dark recess)
    box(w, h, 0.02, new THREE.MeshStandardMaterial({ color: 0x2b2a2e, roughness: 1 }), x, y, zFace - depth - 0.3, false)
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.25, h * 1.12),
      interior.map ? new THREE.MeshBasicMaterial({ map: interior.map, toneMapped: true, color: interior.lit ? 0xffffff : 0xb8b0aa }) : new THREE.MeshStandardMaterial({ color: 0x2d2b31 }))
    inner.position.set(x, y, zFace - depth - 0.25); scene.add(inner)
    windowMeshes.push(inner)
    const rev = new THREE.MeshStandardMaterial({ color: 0xe9e2d6, roughness: 0.8 })
    for (const s of [-1, 1]) box(0.04, h, depth + 0.3, rev, x + s * w / 2, y, zFace - depth / 2 - 0.12, false)
    for (const s of [-1, 1]) box(w, 0.04, depth + 0.3, rev, x, y + s * h / 2, zFace - depth / 2 - 0.12, s < 0)
    // glass
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat)
    gl.position.set(x, y, zFace - depth + 0.05); scene.add(gl)
    // frame
    const f = 0.12, fz = zFace + 0.03
    box(w + f * 2, f, 0.1, trim, x, y + h / 2 + f / 2, fz)
    box(w + f * 2, f, 0.1, trim, x, y - h / 2 - f / 2, fz)
    box(f, h, 0.1, trim, x - w / 2 - f / 2, y, fz)
    box(f, h, 0.1, trim, x + w / 2 + f / 2, y, fz)
    // glazing bars
    if (panes === 'shop') {
      box(w, 0.06, 0.06, trim, x, y + h * 0.22, zFace - depth + 0.08, false)
      for (let i = 1; i < 3; i++) box(0.04, h * 0.28, 0.05, trim, x - w / 2 + (w * i) / 3, y + h * 0.36, zFace - depth + 0.08, false)
    }
    const [cols, rows] = panes === 'shop' ? [1, 1] : panes
    for (let i = 1; i < cols; i++) box(0.05, h, 0.05, trim, x - w / 2 + (w * i) / cols, y, zFace - depth + 0.08, false)
    for (let j = 1; j < rows; j++) box(w, 0.05, 0.05, trim, x, y - h / 2 + (h * j) / rows, zFace - depth + 0.08, false)
    // sill and crown: these carry the moving shadows
    box(w + 0.42, 0.09, 0.32, trim, x, y - h / 2 - f - 0.04, zFace + 0.14)
    if (crown) {
      box(w + 0.5, 0.26, 0.12, trim, x, y + h / 2 + f + 0.16, zFace + 0.05)
      box(w + 0.66, 0.08, 0.3, trim, x, y + h / 2 + f + 0.32, zFace + 0.13)
    }
  }

  const prodTex = await Promise.all(LIVE.map((p) => interiorTexture(base, p, true)))
  const curtain = curtainTexture()
  // ground floor: the four live products, in order left to right
  await Promise.all(cols.map((x, i) => windowAt(x, gy, 1.15, 1.85, 0, { map: prodTex[i], lit: true }, { panes: 'shop' })))
  // upper floor: curtains
  await Promise.all(cols.map((x) => windowAt(x, uy, 1.15, 1.75, 0, { map: curtain, lit: false })))
  await windowAt(0, uy, 1.25, 1.75, bayD, { map: curtain, lit: false })
  for (const s of [-1, 1]) await windowAt(s * 1.55, uy, 0.55, 1.75, bayD, { map: curtain, lit: false }, { panes: [1, 3] })

  // ---------- door with sunburst fanlight
  {
    const dw = 1.5, dh = 2.55, z = bayD
    box(dw + 0.5, dh + 0.25, 0.12, trim, 0, P + dh / 2 + 0.05, z + 0.02)
    const d = box(dw, dh, 0.1, doorMat, 0, P + dh / 2, z + 0.04)
    for (const sx of [-1, 1]) for (const sy of [0.28, 0.72]) {
      box(dw / 2 - 0.22, dh * 0.36, 0.04, doorMat, sx * dw / 4, P + dh * sy, z + 0.11)
    }
    box(0.03, dh, 0.03, new THREE.MeshStandardMaterial({ color: 0x5f7f92 }), 0, P + dh / 2, z + 0.1, false)
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), brass); knob.position.set(0.12, P + 1.15, z + 0.16); scene.add(knob)
    const knob2 = knob.clone(); knob2.position.x = -0.12; scene.add(knob2)
    // fanlight
    const fy = P + dh + 0.1, r = dw / 2 + 0.05
    const fan = new THREE.Mesh(new THREE.CircleGeometry(r, 48, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2c2a30, roughness: 0.2, metalness: 0.2, envMapIntensity: 1.5 }))
    fan.position.set(0, fy, z + 0.05); scene.add(fan)
    const fring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.06, 0.08, 8, 48, Math.PI), trim)
    fring.position.set(0, fy, z + 0.09); fring.castShadow = true; scene.add(fring)
    for (let i = 1; i < 8; i++) {
      const a = (i / 8) * Math.PI
      const bar = box(r, 0.035, 0.04, trim, Math.cos(a) * r / 2, fy + Math.sin(a) * r / 2, z + 0.09, false)
      bar.rotation.z = a
    }
    const hub = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24, 0, Math.PI), trim); hub.position.set(0, fy, z + 0.1); scene.add(hub)
    // steps
    for (let i = 0; i < 3; i++) box(dw + 1.6 - i * 0.3, P / 3, 1.3 - i * 0.38, stone, 0, (P / 3) * (i + 0.5), z + 0.62 - i * 0.19)
  }

  // ---------- planters with clipped box balls, symmetric
  for (const s of [-1, 1]) {
    const x = s * 1.9
    box(0.85, 0.75, 0.85, trim, x, 0.375, 1.15)
    box(0.95, 0.08, 0.95, trim, x, 0.78, 1.15)
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.62, 64, 48), leaf)
    const p = ball.geometry.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x0 = p.getX(i), y0 = p.getY(i), z0 = p.getZ(i)
      const n = Math.sin(x0 * 23.1 + y0 * 7.3) * Math.sin(y0 * 19.7 - z0 * 11.1) * Math.sin(z0 * 17.3 + x0 * 5.1)
      const k = 1 + n * 0.05
      p.setXYZ(i, x0 * k, y0 * k, z0 * k)
    }
    ball.geometry.computeVertexNormals()
    ball.position.set(x, 1.38, 1.15); ball.castShadow = ball.receiveShadow = true; scene.add(ball)
  }

  // ---------- neighbours: falu-red gables at the frame edges, symmetric
  for (const s of [-1, 1]) {
    const nx = s * 18.5, nw = 8, nh = 5.6, z = -7
    box(nw, nh, 8, falu, nx, nh / 2, z - 4)
    const shape = new THREE.Shape(); shape.moveTo(-nw / 2 - 0.4, 0); shape.lineTo(nw / 2 + 0.4, 0); shape.lineTo(0, 3.6); shape.closePath()
    const gab = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 8.6, bevelEnabled: false }), roofMat)
    gab.position.set(nx, nh, z - 8.3); gab.castShadow = gab.receiveShadow = true; scene.add(gab)
    const shape2 = new THREE.Shape(); shape2.moveTo(-nw / 2, 0); shape2.lineTo(nw / 2, 0); shape2.lineTo(0, 3.3); shape2.closePath()
    const gab2 = new THREE.Mesh(new THREE.ExtrudeGeometry(shape2, { depth: 0.2, bevelEnabled: false }), falu)
    gab2.position.set(nx, nh - 0.01, z + 0.32); gab2.castShadow = true; scene.add(gab2)
    box(nw + 0.2, 0.12, 0.14, trim, nx, nh, z + 0.36)
    for (const wx of [-2.2, 2.2]) {
      box(1.0, 1.5, 0.08, trim, nx + wx, 3.9, z + 0.02)
      box(0.82, 1.32, 0.05, new THREE.MeshStandardMaterial({ color: 0x2c2b30, roughness: 0.2, envMapIntensity: 1.2 }), nx + wx, 3.9, z + 0.07, false)
      box(1.0, 1.5, 0.08, trim, nx + wx, 1.6, z + 0.02)
      box(0.82, 1.32, 0.05, new THREE.MeshStandardMaterial({ color: 0x2c2b30, roughness: 0.2, envMapIntensity: 1.2 }), nx + wx, 1.6, z + 0.07, false)
      for (const wy of [3.9, 1.6]) { box(0.05, 1.32, 0.06, trim, nx + wx, wy, z + 0.1, false); box(0.82, 0.05, 0.06, trim, nx + wx, wy + 0.2, z + 0.1, false); box(1.2, 0.07, 0.22, trim, nx + wx, wy - 0.78, z + 0.12) }
    }
    box(0.9, 0.9, 0.08, trim, nx, nh + 1.2, z + 0.56)
    box(0.72, 0.72, 0.05, new THREE.MeshStandardMaterial({ color: 0x2c2b30, roughness: 0.2 }), nx, nh + 1.2, z + 0.6, false)
    box(0.25, nh, 0.1, trim, nx - s * (nw / 2 - 0.12), nh / 2, z + 0.03)
    box(0.25, nh, 0.1, trim, nx + s * (nw / 2 - 0.12), nh / 2, z + 0.03)
  }

  // ---------- off-camera birches: invisible, they only cast moving shadows
  {
    const ghost = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
    let seed = 11
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const tree = (x, z, h) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, h, 8), ghost)
      trunk.position.set(x, h / 2, z); trunk.castShadow = true; scene.add(trunk)
      for (let i = 0; i < 160; i++) {
        const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 2.8, yy = h * 0.5 + rnd() * h * 0.65
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18 + rnd() * 0.42, 1), ghost)
        b.position.set(x + Math.cos(a) * rr, yy, z + Math.sin(a) * rr * 0.8); b.castShadow = true; scene.add(b)
      }
    }
    for (const s of [-1, 1]) { tree(s * 23, 27, 13); tree(s * 17, 37, 14); tree(s * 21, 45, 12) }
  }

  // ---------- light: the only thing that moves
  const hemi = new THREE.HemisphereLight(0xc9d8ea, 0xe6c7a8, 0.85)
  scene.add(hemi)
  const sunLight = new THREE.DirectionalLight(0xffd2a0, 3.2)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.set(4096, 4096)
  const sc = sunLight.shadow.camera
  sc.left = -42; sc.right = 42; sc.top = 26; sc.bottom = -14; sc.near = 1; sc.far = 140
  sunLight.shadow.bias = -0.0004
  sunLight.shadow.normalBias = 0.02
  sunLight.shadow.radius = 4
  scene.add(sunLight); scene.add(sunLight.target)
  sunLight.target.position.set(0, 3, 0)

  const camera = new THREE.PerspectiveCamera(20, 16 / 9, 1, 900)
  const frame = (w, h) => {
    const aspect = w / h
    camera.aspect = aspect
    if (aspect >= 1) {
      camera.fov = 17
      camera.position.set(0, 3.0, 62)
      camera.lookAt(0, 6.6, 0)
    } else {
      camera.fov = 30
      camera.position.set(0, 2.8, 50)
      camera.lookAt(0, 9.2, 0)
    }
    camera.updateProjectionMatrix()
  }

  const warm = new THREE.Color(), cool = new THREE.Color(0xfff3e2), dawn = new THREE.Color(0xff9e6e)
  function setSun(t) {
    // t: 0 first light (east, left) -> 1 evening (west, right)
    const az = THREE.MathUtils.lerp(-0.95, 0.95, t)
    const el = 0.05 + Math.sin(Math.PI * t) * 0.62
    const r = 80
    sunLight.position.set(Math.sin(az) * r * Math.cos(el), Math.sin(el) * r + 2, Math.cos(az) * r * Math.cos(el) * 0.85 + 10)
    const lowness = 1 - Math.min(1, el / 0.6)
    warm.copy(cool).lerp(dawn, lowness * 0.85)
    sunLight.color.copy(warm)
    sunLight.intensity = 3.4 + (1 - lowness) * 1.8
    hemi.intensity = 0.35 + (1 - lowness) * 0.35
    hemi.color.set(0xc9d8ea).lerp(new THREE.Color(0xf3c9b0), lowness * 0.35)
    renderer.toneMappingExposure = 0.95 + (1 - lowness) * 0.1
  }

  function resize(w, h) {
    renderer.setSize(w, h, false)
    frame(w, h)
  }
  resize(width || canvas.clientWidth || 1600, height || canvas.clientHeight || 900)
  setSun(sun)
  // Close-up of one product window (0..3, left to right): for product shots.
  let focused = -1
  function frameWindow(i) {
    focused = i
    const x = cols[i]
    camera.fov = 19
    camera.position.set(x, gy + 0.15, 10.5)
    camera.lookAt(x, gy + 0.1, 0)
    camera.updateProjectionMatrix()
  }
  const render = () => renderer.render(scene, camera)
  await Promise.race([allLoaded, new Promise((r) => setTimeout(r, 8000))])
  render()
  return { renderer, scene, camera, setSun, resize, render, sunLight, frameWindow, products: LIVE, THREE }
}
