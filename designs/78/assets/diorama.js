// Peach Hour diorama: a hand-built hill village on a turntable, lit by a sun
// you can drag. Built from three.js primitives, graded like false-colour
// infrared film (rose foliage, mauve shadows, peach highlights) in a small
// post pipeline (bloom + tilt-shift + split-tone + grain).
//
//   import { createDiorama } from './diorama.js'
//   const d = await createDiorama({ canvas, time: 0.12, view: 'hero' })
//   d.setTime(0.8)   // 0 = sunrise, 0.5 = noon, 1 = dusk
//   d.setYaw(0.4)    // turn the turntable (radians)
//   d.dispose()
//
// Options: width, height, pixelRatio, time, yaw, view ('hero' | 'wide' |
// 'street' | 'top' | 'product:<id>'), offsetX (-0.5..0.5 frame shift),
// interactive (drag to turn, drag the sun), autoTurn (rad/s), layer
// ('all' | 'sky' | 'scene'), transparent, grain, tilt, base (url to assets/),
// onTime(t) callback.
import * as THREE from './vendor/three.module.min.js'

const PRODUCT_LOGOS = {
  'mcp-emails': '../../_shared/products/mcp-emails/logo-mark.svg',
  'fun-libs': '../../_shared/products/fun-libs/icon.png',
  'toolrails': '../../_shared/products/toolrails/icon.svg',
  'harbor': '../../_shared/products/harbor/harbor-mark-filled.svg',
}

// ---------- palette (sRGB hex, converted by three's colour management) ----
const P = {
  stoneA: 0xf3dcc1, stoneB: 0xedc7a3, stoneC: 0xf6e6d3, stoneD: 0xe8b996, stoneE: 0xf0d2c4,
  roofA: 0xdc8c6a, roofB: 0xe6a07a, roofC: 0xcf7d60, roofD: 0xeaae88,
  shutters: [0x9cc4dc, 0xa6c9c3, 0xb9a7d8, 0x8fb4d6, 0xc7d8e6],
  windowDark: 0x5b3f5a, windowLit: 0xffb36b,
  olive: [0xf2a0b8, 0xec8fae, 0xf6b6c6, 0xe7859f],
  cypress: [0xb83a63, 0xa8325c, 0xc4486d],
  pine: [0xe98aa6, 0xf0a3b6],
  trunk: 0x7c5560,
  lavender: [0xa48ad6, 0xb59be0, 0x9a80cf],
  soil: 0xf2c79c, path: 0xfae6cc,
  water: 0x9fd4ea, coping: 0xfbf3e6,
  strata: ['#f1cba6', '#e9b994', '#f4d7bb', '#e2a986', '#efc4a4', '#dfa283', '#f3d2b4', '#e8b08f', '#d99878'],
}

const SKY = {
  // [zenith, horizon, glow]
  dawn:  [0x7fb3e2, 0xf9bf94, 0xffc45c],
  noon:  [0x72b2ec, 0xf6e2c8, 0xfff0c8],
  dusk:  [0x8481bd, 0xf3a58e, 0xff9452],
}

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const lerp = (a, b, t) => a + (b - a) * t
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t) }

// ---------- procedural textures --------------------------------------------
function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat) }
  return t
}

function noiseFill(g, w, h, r, base, amt, n = 9000, sz = 3) {
  g.fillStyle = base; g.fillRect(0, 0, w, h)
  for (let i = 0; i < n; i++) {
    const v = (r() - 0.5) * amt
    g.fillStyle = v > 0 ? `rgba(255,248,236,${v})` : `rgba(120,70,70,${-v})`
    g.fillRect(r() * w, r() * h, sz * (0.5 + r()), sz * (0.5 + r()))
  }
}

function strataTexture(r) {
  return canvasTex(1024, 256, (g, w, h) => {
    let y = 0, i = 0
    while (y < h) {
      const bh = 4 + r() * 22
      g.fillStyle = P.strata[i++ % P.strata.length]
      g.beginPath(); g.moveTo(0, y)
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.009 + i * 1.7) * 4 + Math.sin(x * 0.041 + i) * 1.5 + (r() - 0.5) * 1.5)
      g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill()
      y += bh
    }
    for (let k = 0; k < 2600; k++) {
      g.fillStyle = `rgba(255,240,220,${r() * 0.25})`
      g.beginPath(); g.arc(r() * w, r() * h, r() * 2.2, 0, 7); g.fill()
    }
    for (let k = 0; k < 220; k++) {
      g.fillStyle = `rgba(150,80,70,${r() * 0.18})`
      g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 6, 1 + r() * 3, 0, 0, 7); g.fill()
    }
  }, { repeat: [3, 1] })
}

function stoneWallTexture(r) {
  return canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#d9b394'; g.fillRect(0, 0, w, h)
    let y = 0
    while (y < h) {
      const rh = 9 + r() * 9; let x = -r() * 20
      while (x < w) {
        const sw = 14 + r() * 30
        g.fillStyle = `hsl(${22 + r() * 16}, ${38 + r() * 18}%, ${78 + r() * 10}%)`
        g.beginPath()
        const j = () => (r() - 0.5) * 2.5
        g.moveTo(x + 1 + j(), y + 1 + j()); g.lineTo(x + sw - 1 + j(), y + 1 + j()); g.lineTo(x + sw - 1 + j(), y + rh - 1 + j()); g.lineTo(x + 1 + j(), y + rh - 1 + j()); g.closePath(); g.fill()
        g.fillStyle = 'rgba(255,245,230,0.25)'; g.fillRect(x + 2, y + 1.5, sw - 5, 1.5)
        x += sw
      }
      y += rh
    }
  }, { repeat: [4, 1] })
}

function plasterTexture(r) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h)
    for (let i = 0; i < 160; i++) {
      const x = r() * w, y = r() * h, rad = 20 + r() * 90
      const gr = g.createRadialGradient(x, y, 0, x, y, rad)
      const warm = r() < 0.5
      gr.addColorStop(0, warm ? `rgba(236,196,170,${0.12 + r() * 0.12})` : `rgba(255,252,246,${0.2 + r() * 0.2})`); gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill()
    }
    for (let i = 0; i < 14000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '200,160,140' : '255,255,255'},${r() * 0.12})`; g.fillRect(r() * w, r() * h, 1.5, 1.5) }
    // a band of rising damp near the base
    const gr = g.createLinearGradient(0, h, 0, h * 0.82); gr.addColorStop(0, 'rgba(205,150,130,0.22)'); gr.addColorStop(1, 'rgba(205,150,130,0)')
    g.fillStyle = gr; g.fillRect(0, h * 0.82, w, h * 0.18)
  })
}

function groundTexture(r, paint) {
  return canvasTex(2048, 2048, (g, w, h) => {
    noiseFill(g, w, h, r, '#f3caa0', 0.16, 24000, 4)
    // rose IR meadow patches
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = r() * h, rad = 40 + r() * 160
      const gr = g.createRadialGradient(x, y, 0, x, y, rad)
      gr.addColorStop(0, `rgba(240,150,170,${0.18 + r() * 0.2})`); gr.addColorStop(1, 'rgba(240,150,170,0)')
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill()
    }
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${220 + r() * 30},${120 + r() * 50},${150 + r() * 40},${0.2 + r() * 0.3})`
      g.fillRect(r() * w, r() * h, 2, 5 + r() * 6)
    }
    if (paint) paint(g, w, h)
  })
}

function roofTileTexture() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f3d9c8'; g.fillRect(0, 0, w, h)
    const cols = 8, cw = w / cols
    for (let i = 0; i < cols; i++) {
      const gr = g.createLinearGradient(i * cw, 0, (i + 1) * cw, 0)
      gr.addColorStop(0, '#d6a089'); gr.addColorStop(0.35, '#fff1e4'); gr.addColorStop(0.6, '#f6dccb'); gr.addColorStop(1, '#c98f7a')
      g.fillStyle = gr; g.fillRect(i * cw, 0, cw, h)
    }
    for (let j = 0; j < 6; j++) { g.fillStyle = 'rgba(110,50,40,0.22)'; g.fillRect(0, j * h / 6, w, 3) }
    const r = rng(77)
    for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(255,220,190,${r() * 0.18})`; g.fillRect(r() * w, r() * h, 2, 2) }
  }, { repeat: [1, 1] })
}

function glowTexture(inner = 'rgba(255,240,200,1)', mid = 'rgba(255,200,140,0.35)') {
  return canvasTex(256, 256, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
    gr.addColorStop(0, inner); gr.addColorStop(0.18, inner); gr.addColorStop(0.32, mid); gr.addColorStop(1, 'rgba(255,180,120,0)')
    g.fillStyle = gr; g.fillRect(0, 0, w, w)
  })
}

function loadImage(src) {
  return new Promise((res) => {
    const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src
  })
}

async function signTexture(src, kind) {
  const im = src ? await loadImage(src) : null
  return canvasTex(512, 512, (g, w, h) => {
    if (kind === 'tile') {
      // glazed square tile with painted border
      g.fillStyle = '#fbf2e2'; g.beginPath(); g.roundRect(0, 0, w, h, 30); g.fill()
      g.strokeStyle = '#d27a52'; g.lineWidth = 18; g.beginPath(); g.roundRect(22, 22, w - 44, h - 44, 22); g.stroke()
      if (im) { g.save(); g.beginPath(); g.roundRect(84, 84, w - 168, h - 168, 48); g.clip(); g.drawImage(im, 84, 84, w - 168, h - 168); g.restore() }
    } else {
      // enamel plaque
      g.fillStyle = '#fffaf1'; g.beginPath(); g.roundRect(0, 0, w, h, 70); g.fill()
      g.strokeStyle = '#7fa9c6'; g.lineWidth = 12; g.beginPath(); g.roundRect(26, 26, w - 52, h - 52, 52); g.stroke()
      if (im) g.drawImage(im, 104, 104, w - 208, h - 208)
    }
    const gr = g.createLinearGradient(0, 0, w, h)
    gr.addColorStop(0, 'rgba(255,255,255,0.25)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(120,70,60,0.08)')
    g.fillStyle = gr; g.fillRect(0, 0, w, h)
  })
}

// ---------- geometry helpers ------------------------------------------------
function archShape(w, h) {
  const s = new THREE.Shape(); const r = w / 2
  s.moveTo(-r, 0); s.lineTo(-r, h - r); s.absarc(0, h - r, r, Math.PI, 0, true); s.lineTo(r, 0); s.lineTo(-r, 0)
  return s
}

// ---------- the build -------------------------------------------------------
async function buildWorld(base, mode = 'village') {
  const isV = mode === 'village'
  const r = rng(0xd9af08)
  const M = {}
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...o })
  const tileTex = roofTileTexture()
  M.roof = [P.roofA, P.roofB, P.roofC, P.roofD].map((c) => std(c, { map: tileTex, roughness: 0.8 }))
  const plaster = plasterTexture(r)
  M.walls = [P.stoneA, P.stoneB, P.stoneC, P.stoneD, P.stoneE].map((c) => std(c, { map: plaster }))
  M.shutters = P.shutters.map((c) => std(c, { roughness: 0.6 }))
  M.window = new THREE.MeshStandardMaterial({ color: P.windowDark, emissive: P.windowLit, emissiveIntensity: 0, roughness: 0.4 })
  M.olive = P.olive.map((c) => std(c, { roughness: 1 }))
  M.cypress = P.cypress.map((c) => std(c, { roughness: 1 }))
  M.pine = P.pine.map((c) => std(c, { roughness: 1 }))
  M.trunk = std(P.trunk)
  M.lavender = P.lavender.map((c) => std(c, { roughness: 1 }))
  M.wallStone = std(0xffffff, { map: stoneWallTexture(r) })
  M.coping = std(P.coping, { roughness: 0.7 })
  M.water = new THREE.MeshStandardMaterial({ color: P.water, roughness: 0.08, metalness: 0.1, emissive: 0x6fb6d8, emissiveIntensity: 0.12 })
  M.iron = std(0x5a4458, { roughness: 0.5 })
  M.awning = std(0xf7efe2)

  const world = new THREE.Group()
  const meshes = []
  const add = (m, parent = world) => { m.castShadow = true; m.receiveShadow = true; parent.add(m); meshes.push(m); return m }

  // --- slab with strata --------------------------------------------------
  const strata = strataTexture(r)
  const groundPaint = (g, w, h) => {
    const cx = w / 2, cy = h / 2, R = w / 2
    // gravel path winding round the hill
    g.strokeStyle = '#fbe7cf'; g.lineCap = 'round'; g.lineWidth = 34
    g.beginPath()
    for (let a = 0; a <= 1; a += 0.01) {
      const ang = 1.2 + a * 3.6, rad = R * (0.86 - a * 0.16)
      const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad
      a === 0 ? g.moveTo(x, y) : g.lineTo(x, y)
    }
    g.stroke()
    // lavender soil stripes (front-left sector)
    g.strokeStyle = 'rgba(214,150,120,0.55)'; g.lineWidth = 16
    g.lineWidth = 7
    for (let k = 0; k < 12; k++) {
      g.beginPath(); g.arc(cx, cy, R * (0.74 + k * 0.019), 2.05, 2.95); g.stroke()
    }
  }
  function buildPlinth(RAD, paint, parent = world, sh = 1.5, ph = 2.4) {
    const k = RAD / 10
    const strataM = std(0xffffff, { map: strata })
    const slab = add(new THREE.Mesh(new THREE.CylinderGeometry(RAD, RAD, sh, 160, 1), [strataM, std(0xffffff, { map: groundTexture(r, paint) }), std(0xd8a07c)]), parent)
    slab.position.y = -sh / 2
    const seam = add(new THREE.Mesh(new THREE.CylinderGeometry(RAD * 0.962, RAD * 0.962, 0.08, 160, 1), std(0xf2c46d, { metalness: 0.6, roughness: 0.35 })), parent)
    seam.position.y = -sh - 0.04
    const plinth = add(new THREE.Mesh(new THREE.CylinderGeometry(RAD * 0.955, RAD * 0.955, ph, 160, 1), [std(0xffffff, { map: trav, roughness: 0.55 }), std(0xf6e8da), std(0xe9d2bf)]), parent)
    plinth.position.y = -sh - 0.08 - ph / 2
  }
  const trav = canvasTex(1024, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fbf1e6'); gr.addColorStop(1, '#efd9c6'); g.fillStyle = gr; g.fillRect(0, 0, w, h)
    for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(214,170,140,${0.05 + r() * 0.12})`; g.lineWidth = 0.6 + r() * 1.4; const y = r() * h; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.01 + k) * 2); g.stroke() }
    for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(200,150,120,${r() * 0.18})`; g.beginPath(); g.ellipse(r() * w, r() * h, 1 + r() * 4, 0.6 + r(), 0, 0, 7); g.fill() }
  }, { repeat: [4, 1] })
  strata.repeat.set(3, 0.55)
  if (isV) buildPlinth(10, groundPaint)

  // soft shadow on the haze below: the model floats
  if (isV) {
    const shTex = canvasTex(256, 256, (g, w) => { const gr = g.createRadialGradient(w/2, w/2, 0, w/2, w/2, w/2); gr.addColorStop(0, 'rgba(110,70,110,0.55)'); gr.addColorStop(0.55, 'rgba(110,70,110,0.22)'); gr.addColorStop(1, 'rgba(110,70,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w) })
    const floatShadow = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }))
    floatShadow.rotation.x = -Math.PI / 2; floatShadow.position.y = -7.5; world.add(floatShadow)
  }

  // terraces with dry-stone retaining walls
  const terrace = (x, z, rad, y0, h) => {
    const top = std(0xffffff, { map: groundTexture(r) })
    const m = add(new THREE.Mesh(new THREE.CylinderGeometry(rad, rad + 0.05, h, 96, 1), [M.wallStone, top, top]))
    m.position.set(x, y0 + h / 2, z)
    return { x, z, rad, top: y0 + h }
  }
  const T1 = isV ? terrace(0.5, -0.9, 6.7, 0, 0.95) : null
  const T2 = isV ? terrace(0.9, -1.4, 4.0, T1.top, 0.95) : null

  // --- builders ------------------------------------------------------------
  const houses = []
  function house(parent, { x, z, w, d, h, rot = 0, roof = 'gable', wall, roofMat, shutter, windows = true, door = true, skipCenter = false }) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot
    const wm = wall ?? M.walls[Math.floor(r() * M.walls.length)]
    const rm = roofMat ?? M.roof[Math.floor(r() * M.roof.length)]
    const sm = shutter ?? M.shutters[Math.floor(r() * M.shutters.length)]
    const body = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wm), g); body.position.y = h / 2
    const ov = 0.14
    if (roof === 'gable') {
      const pitch = 0.42, half = d / 2 + ov, rise = Math.tan(pitch) * (d / 2), slope = half / Math.cos(pitch)
      for (const s of [-1, 1]) {
        const p = add(new THREE.Mesh(new THREE.BoxGeometry(w + ov * 2, 0.08, slope), rm), g)
        p.position.set(0, h + rise / 2 + 0.02, s * (half / 2 - 0.02))
        p.rotation.x = s * pitch
      }
      // genoise: stepped tile courses under the eaves, a Provencal signature
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
        const gb = add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.02 + k * 0.06, 0.05, 0.05 + k * 0.05), k ? rm : M.coping), g)
        gb.position.set(0, h - 0.04 - (1 - k) * 0.05, s * (d / 2 + 0.025 + k * 0.025))
      }
      const ridge = add(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, w + ov * 2 + 0.02, 8), rm), g)
      ridge.rotation.z = Math.PI / 2; ridge.position.y = h + rise + 0.06
      const tri = new THREE.Shape(); tri.moveTo(-d / 2, 0); tri.lineTo(0, rise); tri.lineTo(d / 2, 0); tri.lineTo(-d / 2, 0)
      const gab = add(new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: w, bevelEnabled: false }), wm), g)
      gab.rotation.y = Math.PI / 2; gab.position.set(-w / 2, h, 0)
    } else {
      const cone = add(new THREE.Mesh(new THREE.ConeGeometry(0.7071, 1, 4, 1), rm), g)
      cone.rotation.y = Math.PI / 4
      cone.scale.set(w + ov * 2, Math.min(w, d) * 0.42, d + ov * 2)
      cone.position.y = h + cone.scale.y / 2
    }
    if (roof === 'gable' && r() < 0.55) {
      const ch = add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.2), wm), g); ch.position.set((r() - 0.5) * w * 0.6, h + 0.35, (r() - 0.5) * d * 0.3)
      const cc = add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.26), rm), g); cc.position.set(ch.position.x, ch.position.y + 0.22, ch.position.z)
    }
    const sillGeo = new THREE.BoxGeometry(0.34, 0.035, 0.07), winGeo = new THREE.BoxGeometry(0.26, 0.38, 0.04), shGeo = new THREE.BoxGeometry(0.14, 0.4, 0.03)
    if (windows) {
      const floors = Math.max(1, Math.floor(h / 0.95))
      for (const face of [0, 1, 2, 3]) {
        const along = face % 2 === 0 ? w : d, depth = face % 2 === 0 ? d : w
        const n = Math.max(1, Math.floor(along / 0.85))
        for (let f = 0; f < floors; f++) {
          for (let i = 0; i < n; i++) {
            if (r() < 0.28) continue
            if (door && face === 0 && (f === 0 || skipCenter) && i === Math.floor(n / 2)) continue
            const u = (i + 0.5) / n * along - along / 2
            const y = 0.62 + f * 0.9
            if (y + 0.3 > h) continue
            const holder = new THREE.Group(); holder.rotation.y = face * Math.PI / 2; g.add(holder)
            const win = add(new THREE.Mesh(winGeo, M.window), holder); win.position.set(u, y, depth / 2 + 0.005)
            const sill = add(new THREE.Mesh(sillGeo, M.coping), holder); sill.position.set(u, y - 0.21, depth / 2 + 0.03)
            if (r() < 0.8) {
              const open = r() < 0.5
              for (const s of [-1, 1]) {
                const sh = add(new THREE.Mesh(shGeo, sm), holder)
                sh.position.set(u + s * (open ? 0.21 : 0.07), y, depth / 2 + (open ? 0.03 : 0.035))
                if (!open) sh.scale.x = 0.95
              }
            }
          }
        }
      }
    }
    if (door) {
      const fr = add(new THREE.Mesh(new THREE.ExtrudeGeometry(archShape(0.5, 0.74), { depth: 0.03, bevelEnabled: false }), M.coping), g)
      fr.position.set(0, 0, d / 2 - 0.015)
      const dm = add(new THREE.Mesh(new THREE.ExtrudeGeometry(archShape(0.38, 0.66), { depth: 0.04, bevelEnabled: false }), sm), g)
      dm.position.set(0, 0, d / 2)
    }
    parent.add(g)
    houses.push({ g, x, z, w, d, h })
    return g
  }

  function olive(parent, x, y, z, s = 1) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s)
    const trunk = add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.55, 6), M.trunk), g); trunk.position.y = 0.27; trunk.rotation.z = (r() - 0.5) * 0.4
    const mat = M.olive[Math.floor(r() * M.olive.length)]
    const n = 4 + Math.floor(r() * 3)
    for (let i = 0; i < n; i++) {
      const b = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + r() * 0.16, 1), mat), g)
      b.position.set((r() - 0.5) * 0.55, 0.62 + r() * 0.3, (r() - 0.5) * 0.55); b.scale.y = 0.72
    }
    parent.add(g); return g
  }
  const cypressGeo = (() => {
    const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector2(Math.sin(Math.PI * Math.pow(t, 0.75)) * 0.26 * (1 - t * 0.35) + 0.001, t * 2.2)) }
    return new THREE.LatheGeometry(pts, 14)
  })()
  function cypress(parent, x, y, z, s = 1) {
    const m = add(new THREE.Mesh(cypressGeo, M.cypress[Math.floor(r() * M.cypress.length)]), parent)
    m.position.set(x, y, z); m.scale.set(s, s * (0.85 + r() * 0.4), s); return m
  }
  function pine(parent, x, y, z, s = 1) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s)
    const t = add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.7, 6), M.trunk), g); t.position.y = 0.85; t.rotation.z = 0.12
    const c = add(new THREE.Mesh(new THREE.SphereGeometry(0.8, 18, 10), M.pine[Math.floor(r() * 2)]), g); c.position.set(0.12, 1.85, 0); c.scale.set(1, 0.38, 1)
    const c2 = add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 8), M.pine[0]), g); c2.position.set(-0.35, 1.65, 0.2); c2.scale.set(1, 0.4, 1)
    parent.add(g); return g
  }

  const potGeo = (() => { const pts = [[0, 0], [0.14, 0], [0.16, 0.04], [0.2, 0.3], [0.23, 0.33], [0.23, 0.36], [0.2, 0.36]].map(([x, y]) => new THREE.Vector2(x, y)); return new THREE.LatheGeometry(pts, 20) })()
  M.pot = std(0xd98a66, { roughness: 0.85 })
  function pot(parent, x, z, s = 1, plant = 'lavender') {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g)
    add(new THREE.Mesh(potGeo, M.pot), g)
    if (plant === 'lavender') for (let i = 0; i < 9; i++) { const b = add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 5), M.lavender[i % 3]), g); const a = i * 2.4, rr = Math.sqrt(i / 9) * 0.16; b.position.set(Math.cos(a) * rr, 0.42 + r() * 0.08, Math.sin(a) * rr); b.scale.y = 2 }
    else { const b = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), M.olive[1]), g); b.position.y = 0.5 }
    return g
  }
  function bistro(parent, x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g)
    const top = add(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 24), M.coping), g); top.position.y = 0.5
    const leg = add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 6), M.iron), g); leg.position.y = 0.25
    const foot = add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 12), M.iron), g); foot.position.y = 0.01
    for (const s of [-1, 1]) {
      const c = new THREE.Group(); c.position.set(s * 0.42, 0, 0.05); c.rotation.y = s * -1.4; g.add(c)
      const seat = add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.025, 0.24), M.shutters[0]), c); seat.position.y = 0.3
      const back = add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.025), M.shutters[0]), c); back.position.set(0, 0.45, -0.12)
      for (const [lx, lz] of [[-0.11, -0.1], [0.11, -0.1], [-0.11, 0.1], [0.11, 0.1]]) { const l = add(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 5), M.iron), c); l.position.set(lx, 0.15, lz) }
    }
    return g
  }

  if (!isV) return await buildVignette(mode.slice(9))
  async function buildVignette(id) {
    const RAD = 3.6
    const paint = (g, w, h) => {
      // pale flagstone apron in front of the house
      for (let i = 0; i < 260; i++) {
        const x = w * (0.15 + r() * 0.7), y = h * (0.42 + r() * 0.42)
        g.fillStyle = `rgba(${246 + r() * 9},${226 + r() * 14},${204 + r() * 16},0.95)`
        g.beginPath(); g.roundRect(x, y, 30 + r() * 46, 22 + r() * 30, 6); g.fill()
      }
    }
    buildPlinth(RAD, paint, world, 0.6, 1.1)
    const i = { 'mcp-emails': 0, 'fun-libs': 1, 'toolrails': 2, 'harbor': 3 }[id] ?? 0
    const kind = ['blade', 'over-door', 'pillar', 'awning'][i]
    const tex = await signTexture(base + PRODUCT_LOGOS[id], (i === 1 || i === 2) ? 'tile' : 'plaque')
    const sm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.06 })
    const W = [2.4, 2.8, 2.4, 2.8][i], D = 1.5, H = [2.5, 2.7, 2.3, 2.5][i]
    const hg = house(world, { x: -0.2, z: -1.0, w: W, d: D, h: H, rot: 0, roof: 'gable', wall: M.walls[[0, 1, 4, 2][i]], shutter: M.shutters[[0, 2, 3, 1][i]], roofMat: M.roof[i], skipCenter: true })
    let sign, normal = new THREE.Vector3(0, 0, 1)
    const C = M.coping
    if (kind === 'blade') {
      const arm = add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.95), M.iron), hg); arm.position.set(0.95, 1.95, D / 2 + 0.47)
      const scroll = add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.014, 6, 18, Math.PI * 1.5), M.iron), hg); scroll.position.set(0.95, 1.83, D / 2 + 0.16); scroll.rotation.y = Math.PI / 2
      for (const zz of [0.3, 0.82]) { const ch = add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 4), M.iron), hg); ch.position.set(0.95, 1.88, D / 2 + zz) }
      sign = add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.72), [sm, sm, C, C, C, C]), hg); sign.position.set(0.95, 1.46, D / 2 + 0.56)
      normal = new THREE.Vector3(1, 0, 0)
    } else if (kind === 'over-door') {
      sign = add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.05), [C, C, C, C, sm, C]), hg); sign.position.set(0, 1.42, D / 2 + 0.03)
      // a striped canvas awning on the side window
      const aw = add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.36), M.awning), hg); aw.position.set(-0.85, 1.98, D / 2 + 0.17); aw.rotation.x = 0.4
    } else if (kind === 'pillar') {
      for (const sx of [1.55, 2.75]) {
        const pil = add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.5, 0.46), M.walls[3]), hg); pil.position.set(sx, 0.75, D / 2 + 0.2)
        const pc = add(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.56), C), hg); pc.position.set(sx, 1.54, D / 2 + 0.2)
        const ball = add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), C), hg); ball.position.set(sx, 1.68, D / 2 + 0.2)
      }
      // wrought gate between the pillars, half open
      const gate = new THREE.Group(); gate.position.set(1.78, 0, D / 2 + 0.2); gate.rotation.y = -0.7; hg.add(gate)
      for (let k = 0; k <= 7; k++) { const b = add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.05, 5), M.iron), gate); b.position.set(k * 0.12, 0.6, 0) }
      for (const yy of [0.12, 1.08]) { const b = add(new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.03, 0.03), M.iron), gate); b.position.set(0.42, yy, 0) }
      sign = add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.03), [C, C, C, C, sm, C]), hg); sign.position.set(1.55, 1.0, D / 2 + 0.445)
    } else {
      const aw = add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.035, 0.5), M.awning), hg); aw.position.set(0, 0.98, D / 2 + 0.24); aw.rotation.x = 0.36
      for (const sx of [-0.48, 0.48]) { const br = add(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4), M.iron), hg); br.position.set(sx, 0.94, D / 2 + 0.22); br.rotation.x = 1.2 }
      sign = add(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.72, 0.05), [C, C, C, C, sm, C]), hg); sign.position.set(0, 1.62, D / 2 + 0.03)
    }
    // set dressing
    olive(world, 2.0, 0, 0.5, 1.35)
    cypress(world, -2.35, 0, -0.9, 0.95); cypress(world, -2.75, 0, -0.1, 0.75)
    pot(world, -0.75, -0.05, 1.0); pot(world, 0.45, -0.05, 0.8, 'olive'); pot(world, -1.05, 0.15, 0.7)
    bistro(world, -1.4, 1.35)
    // a low lavender hedge along the front edge
    for (let k = 0; k < 34; k++) {
      const a = 1.05 + k * 0.03, rad = RAD * 0.84
      const b = add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), M.lavender[k % 3]), world)
      b.position.set(Math.cos(a) * rad + (r() - 0.5) * 0.05, 0, Math.sin(a) * rad); b.scale.set(1.3, 2.4 + r(), 1.3)
    }
    return { world, materials: M, products: { [id]: { group: hg, sign, normal } }, meshes }
  }

  // --- the village (top terrace) -------------------------------------------
  const village = new THREE.Group(); village.position.y = T2.top; world.add(village)
  // a slim campanile with an open arched belfry
  const tower = new THREE.Group(); tower.position.set(T2.x + 0.4, 0, T2.z - 0.6); village.add(tower)
  const tb = add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.6, 1.0), M.walls[2]), tower); tb.position.y = 1.8
  for (let f = 0; f < 4; f++) {
    const holder = new THREE.Group(); holder.rotation.y = f * Math.PI / 2; tower.add(holder)
    const a = add(new THREE.Mesh(new THREE.ExtrudeGeometry(archShape(0.42, 0.7), { depth: 0.04, bevelEnabled: false }), M.window), holder)
    a.position.set(0, 2.65, 0.5)
  }
  const cap = add(new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.7, 4), M.roof[2]), tower); cap.rotation.y = Math.PI / 4; cap.position.y = 3.95

  const vx = T2.x, vz = T2.z
  const spots = [
    [-2.2, 0.6, 1.6, 1.3, 1.9, 0.1], [-1.0, 1.8, 1.5, 1.2, 1.5, -0.2], [0.6, 2.2, 1.3, 1.2, 1.7, 0.05],
    [2.1, 1.3, 1.4, 1.3, 2.1, 0.35], [2.4, -0.4, 1.2, 1.5, 1.6, 1.4], [-2.6, -1.0, 1.3, 1.4, 1.5, 1.2],
    [-1.3, -1.9, 1.6, 1.2, 2.2, 0.0], [1.6, -2.2, 1.4, 1.2, 1.8, -0.3], [-0.9, 0.2, 1.2, 1.2, 2.6, 0.5],
    [1.0, 0.7, 1.0, 1.0, 1.3, 0.6], [3.1, -1.6, 1.0, 1.1, 1.3, 0.9], [-2.9, 1.7, 1.1, 1.0, 1.2, -0.5], [-0.2, -3.0, 1.3, 1.0, 1.6, 0.2],
  ]
  for (const [dx, dz, w, d, h, rot] of spots) house(village, { x: vx + dx, z: vz + dz, w, d, h, rot, roof: r() < 0.75 ? 'gable' : 'hip' })
  cypress(village, vx + 3.0, 0, vz + 0.6, 0.9)
  cypress(village, vx - 3.1, 0, vz + 0.2, 0.8)
  olive(village, vx + 0.9, 0, vz + 3.2, 0.9)

  // --- middle terrace: product houses, olive grove, arch gate ---------------
  const mid = new THREE.Group(); mid.position.y = T1.top; world.add(mid)
  const products = {}
  const signs = await Promise.all([
    signTexture(base + PRODUCT_LOGOS['mcp-emails'], 'plaque'),
    signTexture(base + PRODUCT_LOGOS['fun-libs'], 'tile'),
    signTexture(base + PRODUCT_LOGOS['toolrails'], 'tile'),
    signTexture(base + PRODUCT_LOGOS['harbor'], 'plaque'),
  ])
  const signMat = (t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.06 })

  // product placements on terrace 1, front arc facing +z
  const prodSpots = [
    { id: 'mcp-emails', ang: 1.85, rot: 0, kind: 'blade' },
    { id: 'fun-libs', ang: 1.25, rot: 0, kind: 'over-door' },
    { id: 'toolrails', ang: 0.62, rot: 0, kind: 'pillar' },
    { id: 'harbor', ang: 2.55, rot: 0, kind: 'awning' },
  ]
  prodSpots.forEach((ps, i) => {
    const rad = 5.4
    const x = T1.x + Math.cos(ps.ang) * rad, z = T1.z + Math.sin(ps.ang) * rad
    const rot = Math.atan2(x - T1.x, z - T1.z) // face outward
    const w = 1.6, d = 1.3, h = i === 1 ? 2.0 : 1.7
    const hg = house(mid, { x, z, w, d, h, rot, roof: 'gable', wall: M.walls[[0, 1, 4, 2][i]], shutter: M.shutters[[0, 2, 3, 1][i]] })
    const sm = signMat(signs[i])
    let sign
    if (ps.kind === 'blade') {
      const arm = add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.6), M.iron), hg); arm.position.set(0.55, 1.35, d / 2 + 0.3)
      sign = add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.5), [M.coping, M.coping, M.coping, M.coping, M.coping, M.coping]), hg)
      sign.position.set(0.55, 1.05, d / 2 + 0.38)
      // faces: put the logo on both large sides (x+ and x-)
      sign.material = [sm, sm, M.coping, M.coping, M.coping, M.coping]
      sign.geometry = new THREE.BoxGeometry(0.03, 0.5, 0.5)
    } else if (ps.kind === 'over-door') {
      sign = add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.04), [M.coping, M.coping, M.coping, M.coping, sm, M.coping]), hg)
      sign.position.set(0, 1.28, d / 2 + 0.03)
    } else if (ps.kind === 'pillar') {
      const pil = add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.2, 0.42), M.walls[3]), hg); pil.position.set(1.15, 0.6, d / 2 + 0.25)
      const pc = add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), M.coping), hg); pc.position.set(1.15, 1.24, d / 2 + 0.25)
      sign = add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.03), [M.coping, M.coping, M.coping, M.coping, sm, M.coping]), hg)
      sign.position.set(1.15, 0.82, d / 2 + 0.47)
    } else {
      // awning over the door with plaque above
      const aw = add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.42), M.awning), hg); aw.position.set(0, 0.86, d / 2 + 0.2); aw.rotation.x = 0.35
      sign = add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.04), [M.coping, M.coping, M.coping, M.coping, sm, M.coping]), hg)
      sign.position.set(0, 1.3, d / 2 + 0.03)
    }
    // a terrace table in front of each product house
    const tbl = add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 18), M.coping), hg); tbl.position.set(-0.55, 0.42, d / 2 + 0.55)
    const leg = add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), M.iron), hg); leg.position.set(-0.55, 0.2, d / 2 + 0.55)
    products[ps.id] = { group: hg, sign, normal: ps.kind === 'blade' ? new THREE.Vector3(1, 0, 0.35) : new THREE.Vector3(0.25, 0, 1) }
  })

  // arch gate between terraces (stone wall with a round arch)
  {
    const s = new THREE.Shape(); s.moveTo(-0.9, 0); s.lineTo(-0.9, 1.6); s.lineTo(0.9, 1.6); s.lineTo(0.9, 0); s.lineTo(-0.9, 0)
    const hole = archShape(0.7, 1.15); s.holes.push(hole)
    const gate = add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }), M.walls[0]), mid)
    const ang = 0.05, rad = 5.6
    gate.position.set(T1.x + Math.cos(ang) * rad, 0, T1.z + Math.sin(ang) * rad)
    gate.rotation.y = Math.atan2(Math.cos(ang), Math.sin(ang)) + Math.PI / 2
    const cap = add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.4), M.roof[0]), gate); cap.position.set(0, 1.64, 0.15)
  }
  // olive grove on the back of terrace 1
  for (let i = 0; i < 16; i++) {
    const a = 3.4 + r() * 2.6, rad = 4.6 + r() * 1.5
    olive(mid, T1.x + Math.cos(a) * rad, 0, T1.z + Math.sin(a) * rad, 0.75 + r() * 0.3)
  }
  for (let i = 0; i < 4; i++) { const a = 0.15 + i * 0.12; cypress(mid, T1.x + Math.cos(a) * 6.25, 0, T1.z + Math.sin(a) * 6.25, 0.7) }

  // --- ground ring: lavender, pool, pines, cypress avenue ------------------
  const ground = new THREE.Group(); world.add(ground)
  {
    const lavGeo = new THREE.SphereGeometry(0.075, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2)
    const pts = []
    for (let k = 0; k < 12; k++) {
      const rad = 7.4 + k * 0.19
      for (let a = 2.05; a < 2.95; a += 0.0125) pts.push([a + (r() - 0.5) * 0.005, rad + (r() - 0.5) * 0.03])
    }
    for (let c = 0; c < 3; c++) {
      const mine = pts.filter((_, i) => i % 3 === c)
      const im = new THREE.InstancedMesh(lavGeo, M.lavender[c], mine.length)
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3()
      mine.forEach(([a, rad], i) => { ps.set(Math.cos(a) * rad, 0, Math.sin(a) * rad); sc.set(1 + r() * 0.3, 2.2 + r() * 1.0, 1 + r() * 0.3); m4.compose(ps, q, sc); im.setMatrixAt(i, m4) })
      im.castShadow = im.receiveShadow = true; ground.add(im)
    }
  }
  // pool with coping and a lounger
  {
    const pg = new THREE.Group(); pg.position.set(5.7, 0, 5.4); pg.rotation.y = -0.75; ground.add(pg)
    const coping = add(new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 1.7), M.coping), pg); coping.position.y = 0.06
    const water = add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 1.3), M.water), pg); water.position.y = 0.11
    water.castShadow = false
    for (let i = 0; i < 2; i++) {
      const l = add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.8), M.awning), pg); l.position.set(-0.6 + i * 0.6, 0.22, 1.35)
      const back = add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.3), M.awning), pg); back.position.set(-0.6 + i * 0.6, 0.3, 1.7); back.rotation.x = -0.7
    }
    // parasol
    const pole = add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), M.iron), pg); pole.position.set(0.9, 0.55, 1.45)
    const top = add(new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.22, 16, 1, true), std(0xf6e2c4, { side: THREE.DoubleSide })), pg); top.position.set(0.9, 1.12, 1.45)
  }
  pine(ground, -7.3, 0, 4.6, 1.0)
  pine(ground, 7.9, 0, -2.6, 1.1)
  pine(ground, -6.2, 0, -6.4, 0.9)
  for (let i = 0; i < 7; i++) { const a = -0.6 + i * 0.13; cypress(ground, Math.cos(a) * 9.2, 0, Math.sin(a) * 9.2, 0.75) }
  for (let i = 0; i < 9; i++) { const a = 3.3 + r() * 2.2, rad = 7.4 + r() * 2.0; olive(ground, Math.cos(a) * rad, 0, Math.sin(a) * rad, 0.8 + r() * 0.3) }
  // an orderly olive orchard on the right flank (grid, slightly jittered)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const a = -0.95 + i * 0.16 + (r() - 0.5) * 0.03, rad = 7.3 + j * 0.85
    olive(ground, Math.cos(a) * rad, 0, Math.sin(a) * rad, 0.62 + r() * 0.12)
  }
  // a small mas (farmhouse) by the lavender, with a long low roof
  house(ground, { x: -8.1, z: 1.3, w: 2.2, d: 1.2, h: 1.3, rot: 1.75, roof: 'gable' })
  house(ground, { x: 3.6, z: -8.3, w: 1.6, d: 1.1, h: 1.2, rot: -0.4, roof: 'hip' })
  // steps from ground to terrace 1
  for (let s = 0; s < 4; s++) {
    const st = add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.24, 0.3), M.coping), ground)
    const a = 0.98, rad = T1.rad + 0.7 - s * 0.26
    st.position.set(T1.x + Math.cos(a) * rad, 0.12 + s * 0.24, T1.z + Math.sin(a) * rad); st.rotation.y = -a + Math.PI / 2; st.scale.y = 1 + s
    st.position.y = (0.24 * (s + 1)) / 2
  }
  return { world, materials: M, products, meshes }
}

// ---------- sky dome --------------------------------------------------------
function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, glow: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform vec3 zenith, horizon, glow, sunDir; varying vec3 vDir;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * vn(p); p *= 2.03; a *= .5; } return s; }
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.2, 1.0);
        float t = pow(smoothstep(0.0, 0.34, h), 0.8);
        vec3 col = mix(horizon, zenith, t);
        float s = max(dot(d, normalize(sunDir)), 0.0);
        col += glow * (pow(s, 5.0) * 0.5 + pow(s, 60.0) * 0.9);
        // long thin stratus streaks, lit from the sun side
        vec2 cp = vec2(atan(d.x, -d.z) * 3.0, h * 26.0);
        float cl = smoothstep(.42, .78, fbm(cp * vec2(1.0, 1.0) + vec2(0., 3.))) * smoothstep(0.02, 0.1, h) * smoothstep(0.42, 0.14, h);
        vec3 cloudCol = mix(horizon * 1.06, glow, pow(s, 3.0) * .8) + vec3(.04,.02,.03);
        col = mix(col, cloudCol, cl * .7);
        // low haze band (dusk haze)
        col = mix(col, horizon * 1.03, smoothstep(0.1, -0.02, h) * 0.7);
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
  const m = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), mat)
  m.renderOrder = -1
  return m
}

// ---------- backdrop: hazy ridges at three depths -----------------------------
function makeRidges() {
  const g = new THREE.Group(); const layers = []
  const defs = [ { r: 300, top: 16, amp: 24, seed: 3.1, k: 0.85 }, { r: 210, top: 2, amp: 18, seed: 7.7, k: 0.6 }, { r: 150, top: -8, amp: 12, seed: 1.9, k: 0.3 } ]
  for (const d of defs) {
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.BackSide,
      uniforms: { col: { value: new THREE.Color() }, haze: { value: new THREE.Color() }, top: { value: d.top }, amp: { value: d.amp }, seed: { value: d.seed } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `uniform vec3 col, haze; uniform float top, amp, seed; varying vec3 vP;
        float h1(float x){ return fract(sin(x * 127.1 + seed) * 43758.5453); }
        float n1(float u, float N){ float x = u * N; float i = floor(x), f = fract(x); f = f*f*(3.-2.*f); return mix(h1(mod(i, N)), h1(mod(i+1., N)), f); }
        void main(){
          float a = atan(vP.x, vP.z) / 6.2831853 + .5;
          float ridge = top + amp * (n1(a, 19.) * .55 + n1(a, 57.) * .3 + n1(a, 170.) * .1 + n1(a, 440.) * .05);
          float edge = smoothstep(ridge + .35, ridge - .35, vP.y);
          if (edge < .01) discard;
          // brighter toward the base: the haze pools in the valleys
          float v = smoothstep(ridge, ridge - 40., vP.y);
          gl_FragColor = vec4(mix(col, haze, v * .85), edge);
        }` })
    const m = new THREE.Mesh(new THREE.CylinderGeometry(d.r, d.r, 180, 160, 1, true), mat)
    m.position.y = -50; m.renderOrder = -0.5
    g.add(m); layers.push({ mat, k: d.k })
  }
  return { group: g, layers }
}

// ---------- post: bloom + tilt-shift + IR grade + grain ----------------------
const fsVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`
function makePost(renderer, w, h) {
  const type = THREE.HalfFloatType
  const rtScene = new THREE.WebGLRenderTarget(w, h, { type, samples: 4 })
  const qw = Math.max(1, Math.floor(w / 4)), qh = Math.max(1, Math.floor(h / 4))
  const rtA = new THREE.WebGLRenderTarget(qw, qh, { type }), rtB = new THREE.WebGLRenderTarget(qw, qh, { type })
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2))
  const scene = new THREE.Scene(); scene.add(quad)
  const thr = new THREE.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: fsVert,
    fragmentShader: `uniform sampler2D t; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float l = dot(c, vec3(.3,.59,.11)); gl_FragColor = vec4(c * smoothstep(.75, 1.6, l), 1.); }` })
  const blur = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, dir: { value: new THREE.Vector2() } }, vertexShader: fsVert,
    fragmentShader: `uniform sampler2D t; uniform vec2 dir; varying vec2 vUv;
      void main(){ vec3 c = texture2D(t, vUv).rgb * .2270;
        c += (texture2D(t, vUv + dir*1.3846).rgb + texture2D(t, vUv - dir*1.3846).rgb) * .3162;
        c += (texture2D(t, vUv + dir*3.2308).rgb + texture2D(t, vUv - dir*3.2308).rgb) * .0703;
        gl_FragColor = vec4(c, 1.); }` })
  const comp = new THREE.ShaderMaterial({ transparent: true,
    uniforms: { t: { value: null }, bloom: { value: null }, res: { value: new THREE.Vector2(w, h) }, seed: { value: 0 }, grain: { value: 0.035 }, tilt: { value: 1 }, focus: { value: 0.5 }, alphaOut: { value: 0 }, warm: { value: 0.5 } },
    vertexShader: fsVert,
    fragmentShader: `uniform sampler2D t, bloom; uniform vec2 res; uniform float seed, grain, tilt, focus, alphaOut, warm; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed) * 43758.5453); }
      vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14), 0., 1.); }
      vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1./2.4)) - .055, step(.0031308, c)); }
      void main(){
        // tilt-shift: blur grows away from a horizontal focus band
        float d = abs(vUv.y - focus);
        float rad = smoothstep(.2, .55, d) * 4.5 * tilt * (res.y / 900.);
        vec4 acc = texture2D(t, vUv); float n = 1.;
        if (rad > .3) {
          for (int i = 0; i < 12; i++) {
            float a = float(i) * 2.39996; float rr = sqrt((float(i)+.5)/12.) * rad;
            acc += texture2D(t, vUv + vec2(cos(a), sin(a)) * rr / res); n += 1.;
          }
        }
        acc /= n;
        vec3 c = acc.rgb + texture2D(bloom, vUv).rgb * .55;
        c = aces(c * 1.08);
        // split tone: mauve shadows, peach highlights
        float l = dot(c, vec3(.299,.587,.114));
        vec3 sh = vec3(.56,.44,.66), hi = vec3(1.,.86,.72);
        c = mix(c, c * mix(sh * 1.3, vec3(1.), smoothstep(0., .5, l)), .5);
        c = mix(c, c * hi * 1.12, smoothstep(.55, 1., l) * .35 * warm);
        c = toSRGB(c);
        // soft lifted blacks like film
        c = c * .95 + vec3(.04,.025,.05);
        // vignette (warm)
        vec2 q = vUv - .5; float v = smoothstep(.95, .25, length(q * vec2(1., .8)));
        c *= mix(vec3(.9,.82,.85), vec3(1.), v);
        c += (hash(vUv * res) - .5) * grain;
        float a = mix(1., acc.a, alphaOut);
        gl_FragColor = vec4(c * a, a);
      }` })
  comp.blending = THREE.CustomBlending; comp.blendSrc = THREE.OneFactor; comp.blendDst = THREE.ZeroFactor

  function pass(mat, target) { quad.material = mat; renderer.setRenderTarget(target); renderer.render(scene, cam) }
  return {
    comp,
    setSize(w2, h2) {
      rtScene.setSize(w2, h2); const a = Math.max(1, Math.floor(w2 / 4)), b = Math.max(1, Math.floor(h2 / 4))
      rtA.setSize(a, b); rtB.setSize(a, b); comp.uniforms.res.value.set(w2, h2)
    },
    render(world, camera) {
      renderer.setRenderTarget(rtScene); renderer.clear(); renderer.render(world, camera)
      thr.uniforms.t.value = rtScene.texture; pass(thr, rtA)
      for (let k = 0; k < 3; k++) {
        const s = 1 + k
        blur.uniforms.t.value = rtA.texture; blur.uniforms.dir.value.set(s / rtA.width, 0); pass(blur, rtB)
        blur.uniforms.t.value = rtB.texture; blur.uniforms.dir.value.set(0, s / rtA.height); pass(blur, rtA)
      }
      comp.uniforms.t.value = rtScene.texture; comp.uniforms.bloom.value = rtA.texture
      comp.uniforms.seed.value = (comp.uniforms.seed.value + 1.618) % 100
      pass(comp, null)
    },
    dispose() { rtScene.dispose(); rtA.dispose(); rtB.dispose() },
  }
}

// ---------- views -----------------------------------------------------------
const VIEWS = {
  // center: orbit centre, look: aim point (raised so the sky gets the top of frame)
  hero:   { center: [0.4, 0.8, -0.6], pitch: -8.5, dist: 50, elev: 13, az: 0.0, fov: 34, focus: 0.4 },
  portrait: { center: [0.4, 0.8, -0.6], pitch: -12, dist: 50, elev: 13, az: 0.0, fov: 38, focus: 0.38 },
  wide:   { center: [0.4, 0.4, -0.6], pitch: -5, dist: 64, elev: 13, az: 0.0, fov: 32, focus: 0.32 },
  street: { center: [-0.4, 1.6, 4.4], pitch: -2, dist: 15, elev: 8, az: -0.3, fov: 40, focus: 0.55 },
  top:    { center: [0.4, 0.5, -0.6], dist: 58, elev: 58, az: 0.0, fov: 22, focus: 0.5 },
  // single-building vignettes (scene: 'vignette:<id>')
  'v:mcp-emails': { center: [0, 0.5, 0], pitch: -14, dist: 13.2, elev: 14, az: 0.95, fov: 30, focus: 0.5, tilt: 0.6 },
  'v:fun-libs':   { center: [0, 0.5, 0], pitch: -14, dist: 13.2, elev: 14, az: 0.32, fov: 30, focus: 0.5, tilt: 0.6 },
  'v:toolrails':  { center: [0.5, 0.5, 0], pitch: -14, dist: 13.2, elev: 14, az: -0.3, fov: 30, focus: 0.5, tilt: 0.6 },
  'v:harbor':     { center: [0, 0.5, 0], pitch: -14, dist: 13.2, elev: 14, az: 0.4, fov: 30, focus: 0.5, tilt: 0.6 },
}

export async function createDiorama(opts = {}) {
  const o = { time: 0.14, yaw: 0, view: 'hero', offsetX: 0, interactive: true, autoTurn: 0, layer: 'all', transparent: false, grain: 0.03, tilt: 1, base: new URL('./', import.meta.url).href, pixelRatio: Math.min(window.devicePixelRatio || 1, 2), ...opts }
  const canvas = o.canvas
  const W = () => o.width ?? canvas.clientWidth ?? 800, H = () => o.height ?? canvas.clientHeight ?? 500
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: !!o.preserve, powerPreference: 'high-performance' })
  renderer.setPixelRatio(o.pixelRatio)
  renderer.setSize(W(), H(), false)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const { world, materials, products } = await buildWorld(o.base, o.scene || 'village')
  const turntable = new THREE.Group(); turntable.add(world); scene.add(turntable)
  const sky = makeSky(); scene.add(sky)
  const ridges = makeRidges(); scene.add(ridges.group)
  // layers for parallax baking: all | sky (sky+ridges+sun) | skyonly | ridges | scene
  if (o.layer === 'scene' || o.transparent) { sky.visible = false; ridges.group.visible = false }
  if (o.layer === 'sky' || o.layer === 'skyonly' || o.layer === 'ridges') turntable.visible = false
  if (o.layer === 'skyonly') ridges.group.visible = false
  if (o.layer === 'ridges') sky.visible = false
  scene.fog = new THREE.Fog(0xffffff, 70, 330)

  const hemi = new THREE.HemisphereLight(0xffffff, 0xe7b08f, 0.5); scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0009; sun.shadow.normalBias = 0.06
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 90 }); sun.shadow.radius = 4
  scene.add(sun); scene.add(sun.target)
  const fill = new THREE.DirectionalLight(0xc9b6ff, 0.35); fill.position.set(-20, 10, -10); scene.add(fill)

  // visible sun disc + halo sprite
  const sunGroup = new THREE.Group(); scene.add(sunGroup)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))
  halo.scale.setScalar(110); halo.renderOrder = -0.7; sunGroup.add(halo)
  const disc = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), new THREE.MeshBasicMaterial({ color: 0xfff1d6, fog: false, toneMapped: false }))
  sunGroup.add(disc)
  if (o.layer === 'scene' || o.layer === 'ridges' || o.hideSun) sunGroup.visible = false

  const camera = new THREE.PerspectiveCamera(22, W() / H(), 0.5, 900)
  const post = makePost(renderer, Math.floor(W() * o.pixelRatio), Math.floor(H() * o.pixelRatio))
  post.comp.uniforms.grain.value = o.grain; post.comp.uniforms.tilt.value = o.tilt
  post.comp.uniforms.alphaOut.value = (o.layer === 'scene' || o.layer === 'ridges' || o.transparent) ? 1 : 0

  let time = o.time, yaw = o.yaw, view = o.view
  const tmp = new THREE.Color(), c1 = new THREE.Color(), c2 = new THREE.Color()
  const mixSky = (i, t) => {
    // t: 0 dawn .5 noon 1 dusk
    if (t < 0.5) { c1.setHex(SKY.dawn[i]); c2.setHex(SKY.noon[i]); return tmp.copy(c1).lerp(c2, smooth(0, 0.5, t)) }
    c1.setHex(SKY.noon[i]); c2.setHex(SKY.dusk[i]); return tmp.copy(c1).lerp(c2, smooth(0.5, 1, t))
  }
  const sunDir = new THREE.Vector3()
  function applyTime() {
    const t = time
    const az = lerp(-0.42, 0.42, t) // east -> west across the visible sky behind the model
    const kaz = lerp(-1.3, 1.3, t)
    const el = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 1.6) * 1.25 + 0.05
    sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize()
    // sky
    const u = sky.material.uniforms
    u.zenith.value.copy(mixSky(0, t)); u.horizon.value.copy(mixSky(1, t)); u.glow.value.copy(mixSky(2, t)); u.sunDir.value.copy(sunDir)
    scene.fog.color.copy(u.horizon.value)
    const mauve = c2.setHex(0xc58fa6).lerp(c1.setHex(0x9a82b8), t)
    for (const L of ridges.layers) {
      L.mat.uniforms.haze.value.copy(u.horizon.value)
      L.mat.uniforms.col.value.copy(u.horizon.value).lerp(mauve, 1 - L.k)
    }
    // light
    const low = 1 - Math.sin(Math.PI * t) // 1 at dawn/dusk, 0 at noon
    sun.color.setHex(0xfff1dc).lerp(c1.setHex(t < 0.5 ? 0xffb983 : 0xff9f7a), Math.pow(low, 1.4))
    sun.intensity = lerp(4.2, 3.4, low)
    // key light rakes across the front of the model from the sun's side
    const key = new THREE.Vector3(Math.sin(kaz) * 1.2, Math.max(0.14, sunDir.y * 0.9), 0.5).normalize()
    sun.position.copy(key).multiplyScalar(40)
    hemi.color.copy(u.zenith.value).lerp(c1.setHex(0xffffff), 0.3)
    hemi.groundColor.setHex(0xe9b08f).lerp(c2.setHex(0xb79ac8), t > 0.5 ? low * 0.8 : low * 0.3)
    hemi.intensity = lerp(0.62, 0.5, low)
    // lit windows as the light falls
    materials.window.emissiveIntensity = smooth(0.25, 0.95, low) * 1.6
    // visible sun: an arc across the frame (screen space), so dragging reads in every view
    const sx = lerp(-0.82, 0.82, t), sy = -0.2 + (o.sunLift ?? 1.35) * Math.pow(Math.sin(Math.PI * t), 1.4)
    const sd = new THREE.Vector3(sx, sy, 0.5).unproject(camera).sub(camera.position).normalize()
    u.sunDir.value.copy(sd)
    sunGroup.position.copy(camera.position).addScaledVector(sd, 300)
    sunGroup.quaternion.copy(camera.quaternion)
    disc.material.color.setHex(0xfff6e4).lerp(c1.setHex(0xffd49a), low).multiplyScalar(2.6)
    halo.material.color.copy(u.glow.value).multiplyScalar(1.4)
    post.comp.uniforms.warm.value = 0.4 + low * 0.6
    if (o.onTime) o.onTime(t)
  }

  function applyView() {
    let v
    if (view.startsWith('product:')) {
      const p = products[view.slice(8)]
      if (p) {
        const wp = new THREE.Vector3(); p.sign.getWorldPosition(wp)
        world.updateMatrixWorld(true)
        const gp = new THREE.Vector3(); p.group.getWorldPosition(gp)
        const q = new THREE.Quaternion(); p.group.getWorldQuaternion(q)
        const out = p.normal.clone().normalize().applyQuaternion(q).setY(0).normalize()
        const camPos = wp.clone().add(out.multiplyScalar(6.4)).add(new THREE.Vector3(0, 1.7, 0))
        camera.fov = 28; camera.position.copy(camPos); camera.lookAt(wp.clone().add(new THREE.Vector3(0, -0.45, 0)))
        camera.updateProjectionMatrix(); post.comp.uniforms.focus.value = 0.5; post.comp.uniforms.tilt.value = o.tilt * 2.4
        return
      }
      v = VIEWS.hero
    } else v = VIEWS[view] || VIEWS.hero
    const el = THREE.MathUtils.degToRad(v.elev)
    const tgt = new THREE.Vector3(...v.center)
    camera.fov = v.fov
    camera.position.set(tgt.x + Math.sin(v.az) * Math.cos(el) * v.dist, tgt.y + Math.sin(el) * v.dist, tgt.z + Math.cos(v.az) * Math.cos(el) * v.dist)
    if (v.pitch !== undefined) {
      const p = THREE.MathUtils.degToRad(v.pitch)
      camera.lookAt(camera.position.x - Math.sin(v.az) * Math.cos(p), camera.position.y + Math.sin(p), camera.position.z - Math.cos(v.az) * Math.cos(p))
    } else camera.lookAt(tgt)
    const w = W(), h = H()
    if (o.offsetX) camera.setViewOffset(w, h, -o.offsetX * w, 0, w, h); else camera.clearViewOffset()
    // minAspect: on frames narrower than this, widen the lens so the model keeps its width
    if (o.minAspect && w / h < o.minAspect) camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(v.fov) / 2) * o.minAspect / (w / h)))
    camera.aspect = w / h; camera.updateProjectionMatrix()
    post.comp.uniforms.focus.value = v.focus; post.comp.uniforms.tilt.value = o.tilt * (v.tilt ?? 1)
  }

  function render() {
    turntable.rotation.y = yaw
    world.updateMatrixWorld(true)
    applyView(); applyTime()
    post.render(scene, camera)
  }

  // interaction ----------------------------------------------------------
  let raf = 0, last = performance.now(), vel = 0, dragging = null, px = 0, dirty = true
  const proj = new THREE.Vector3()
  function sunScreen() { proj.copy(sunGroup.position).project(camera); const rct = canvas.getBoundingClientRect(); return [rct.left + (proj.x * 0.5 + 0.5) * rct.width, rct.top + (-proj.y * 0.5 + 0.5) * rct.height] }
  function onDown(e) {
    const [sx, sy] = sunScreen()
    dragging = o.sunPick !== false && Math.hypot(e.clientX - sx, e.clientY - sy) < 70 ? 'sun' : 'turn'
    px = e.clientX; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'
  }
  function onMove(e) {
    if (!dragging) {
      if (o.sunPick === false) return; const [sx, sy] = sunScreen(); canvas.style.cursor = Math.hypot(e.clientX - sx, e.clientY - sy) < 70 ? 'pointer' : 'grab'; return
    }
    const dx = e.clientX - px; px = e.clientX
    if (dragging === 'sun') { api.setTime(Math.min(1, Math.max(0, time + dx / (canvas.clientWidth * 0.7)))) }
    else { vel = dx * 0.006; yaw += vel; dirty = true }
  }
  function onUp() { dragging = null; canvas.style.cursor = 'grab' }
  if (o.interactive) {
    canvas.style.touchAction = 'pan-y'; canvas.style.cursor = 'grab'
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') api.setYaw(yaw - 0.15); if (e.key === 'ArrowRight') api.setYaw(yaw + 0.15)
      if (e.key === 'ArrowUp') api.setTime(Math.min(1, time + 0.05)); if (e.key === 'ArrowDown') api.setTime(Math.max(0, time - 0.05))
    })
    if (!canvas.hasAttribute('tabindex')) canvas.tabIndex = 0
  }
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    if (!dragging && Math.abs(vel) > 0.0004) { vel *= 0.94; yaw += vel; dirty = true }
    if (o.autoTurn && !dragging && !reduce) { yaw += o.autoTurn * dt; dirty = true }
    if (dirty) { render(); dirty = false }
    raf = requestAnimationFrame(loop)
  }

  const api = {
    renderer, scene, camera, products,
    get time() { return time }, get yaw() { return yaw },
    setTime(t) { time = t; dirty = true }, setYaw(y) { yaw = y; dirty = true },
    setView(v) { view = v; dirty = true },
    setOffsetX(v) { o.offsetX = v; dirty = true },
    setMinAspect(v) { o.minAspect = v; dirty = true },
    resize(w, h) { o.width = w; o.height = h; renderer.setSize(w, h, false); post.setSize(Math.floor(w * o.pixelRatio), Math.floor(h * o.pixelRatio)); dirty = true },
    renderNow() { render() },
    start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop) } },
    stop() { cancelAnimationFrame(raf); raf = 0 },
    dispose() { api.stop(); post.dispose(); renderer.dispose() },
  }
  render()
  if (o.interactive || o.autoTurn) api.start()
  return api
}
