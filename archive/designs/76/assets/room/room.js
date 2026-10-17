// Zinc & Granite: the room.
// A Haussmann-proportioned room (chevron oak floor, boiserie, plaster cornice)
// whose single arched French window opens onto a Norwegian fjord.
// One function, one scene. Two dials:
//   time     0..1  morning silver -> noon white -> evening gold (sun + sky grade)
//   progress 0..1  one slow, unbroken camera dolly: back of the room -> balcony
//
// Usage:
//   import { createRoom } from './room.js'
//   const room = await createRoom(canvas, { quality: 'live' | 'bake' })
//   room.set({ time: 0.3, progress: 0 }); room.render()
//
// Needs an import map for "three" and "three/addons/" (three@0.169.0).
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'

const BASE = new URL('.', import.meta.url).href
const PRODUCTS = new URL('../../../_shared/products/', import.meta.url).href

// ---------------------------------------------------------------- palette
export const PALETTE = {
  snow: '#f1efe9', plaster: '#e9e5dc', granite: '#5c6266', ink: '#1d2226',
  glacier: '#9dbccb', moss: '#68774c', zinc: '#a8b0b3', stone: '#d9c7a4', iron: '#25292b',
}

// time-of-day keyframes: sun direction, colours, exposure
const DAY = [
  { t: 0.0, sun: [-6.5, 3.0, -9], sunCol: '#d3e1f2', sunI: 5.5, sky: '#cfdbe6', skyI: 4.2, view: '#d6e0ea', hemi: 0.14, exp: 1.0 },
  { t: 0.5, sun: [-1.8, 7.5, -8], sunCol: '#fff4e6', sunI: 7.0, sky: '#e8eef1', skyI: 4.6, view: '#ffffff', hemi: 0.16, exp: 1.0 },
  { t: 1.0, sun: [7.0, 2.6, -9], sunCol: '#ffb784', sunI: 9.0, sky: '#efcdb5', skyI: 3.2, view: '#f7cdb0', hemi: 0.1, exp: 1.04 },
]

const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const lerp = (a, b, k) => a + (b - a) * k

// Room dimensions (metres)
const W = 5.6, H = 4.0, D = 8.6, WALL = 0.55
const OA = 0.92            // half opening width
const OS = 2.72            // spring line of arch
const OTOP = OS + OA       // top of opening

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }

// Point de Hongrie (chevron) oak parquet
function parquetTexture() {
  const cols = 8, rows = 14, C = 128, Hh = 92 // px: column width, plank vertical extent
  return canvasTex(cols * C, rows * Hh, (g, w, h) => {
    const r = rng(7)
    g.fillStyle = '#7a5a3c'; g.fillRect(0, 0, w, h)
    for (let i = 0; i < cols; i++) {
      for (let j = -2; j < rows + 2; j++) {
        const x0 = i * C, y = j * Hh, up = i % 2 === 0
        const tone = 0.9 + r() * 0.16
        const base = [176 * tone, 134 * tone, 92 * tone]
        g.beginPath()
        if (up) { g.moveTo(x0, y); g.lineTo(x0 + C, y - C * 0.7); g.lineTo(x0 + C, y - C * 0.7 + Hh); g.lineTo(x0, y + Hh) }
        else { g.moveTo(x0, y - C * 0.7); g.lineTo(x0 + C, y); g.lineTo(x0 + C, y + Hh); g.lineTo(x0, y - C * 0.7 + Hh) }
        g.closePath()
        g.fillStyle = `rgb(${base.map(Math.round).join(',')})`; g.fill()
        g.save(); g.clip()
        // grain
        for (let k = 0; k < 26; k++) {
          const yy = y - C * 0.7 + r() * (Hh + C * 0.7)
          g.strokeStyle = `rgba(${r() < 0.5 ? '70,44,24' : '230,200,160'},${0.05 + r() * 0.08})`
          g.lineWidth = 0.6 + r() * 1.6
          g.beginPath()
          const sl = up ? -0.7 : 0.7
          g.moveTo(x0 - 4, yy); g.bezierCurveTo(x0 + C * 0.3, yy + sl * C * 0.3 + r() * 3, x0 + C * 0.6, yy + sl * C * 0.6 - r() * 3, x0 + C + 4, yy + sl * C)
          g.stroke()
        }
        g.restore()
        g.strokeStyle = 'rgba(52,34,18,0.42)'; g.lineWidth = 1.1; g.stroke()
      }
    }
  })
}

function plasterTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    const r = rng(3)
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h)
    for (let i = 0; i < 9000; i++) {
      const v = 236 + Math.floor(r() * 19)
      g.fillStyle = `rgba(${v},${v - 2},${v - 6},0.35)`
      g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3)
    }
  })
}

function laptopScreen() {
  return canvasTex(1024, 660, (g, w, h) => {
    g.fillStyle = '#1b2125'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#242c31'; g.fillRect(0, 0, w, 44)
    ;['#c96f5b', '#d9b45f', '#7a9a5d'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(28 + i * 26, 22, 8, 0, 7); g.fill() })
    g.font = '30px ui-monospace, Menlo, monospace'
    const lines = [
      ['#9dbccb', '$ claude mcp add albretsen https://albretsen.no/mcp'],
      ['#8f9aa0', '  added: 17 tools'],
      ['#8f9aa0', ''],
      ['#d9c7a4', 'export async function send(mail) {'],
      ['#e9e5dc', '  const inbox = await agent.inbox()'],
      ['#e9e5dc', '  return inbox.reply(mail, { quiet: true })'],
      ['#d9c7a4', '}'],
      ['#8f9aa0', ''],
      ['#68774c', '✓ shipped'],
    ]
    lines.forEach(([c, s], i) => { g.fillStyle = c; g.fillText(s, 40, 100 + i * 52) })
  })
}

function moulding(w, h, depth, mat) {
  // a raised rectangular panel moulding made of four thin bars
  const grp = new THREE.Group(), t = 0.035
  const bars = [[w, t, 0, h / 2 - t / 2], [w, t, 0, -h / 2 + t / 2], [t, h, -w / 2 + t / 2, 0], [t, h, w / 2 - t / 2, 0]]
  for (const [bw, bh, x, y] of bars) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, depth), mat)
    m.position.set(x, y, depth / 2); m.castShadow = false; m.receiveShadow = true; grp.add(m)
  }
  return grp
}

function archShape(a, spring, bottom) {
  const s = new THREE.Path()
  s.moveTo(-a, bottom); s.lineTo(a, bottom); s.lineTo(a, spring)
  s.absarc(0, spring, a, 0, Math.PI, false); s.lineTo(-a, bottom)
  return s
}

async function loadTex(url, srgb = true) {
  const t = await new THREE.TextureLoader().loadAsync(url)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

export async function createRoom(canvas, opts = {}) {
  const quality = opts.quality || 'live'
  const bake = quality === 'bake'
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(bake ? 1 : Math.min(window.devicePixelRatio, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.AgXToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  RectAreaLightUniformsLib.init()

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#dfe6ea')
  const camera = new THREE.PerspectiveCamera(opts.fov || 40, 1, 0.05, 400)

  // ---------- materials
  const plaster = plasterTexture(); plaster.wrapS = plaster.wrapT = THREE.RepeatWrapping; plaster.repeat.set(3, 3)
  const wallMat = new THREE.MeshStandardMaterial({ color: '#e3e6e3', roughness: 0.92, map: plaster })
  const trimMat = new THREE.MeshStandardMaterial({ color: '#eef0ed', roughness: 0.6 })
  const ceilMat = new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.95 })
  const parquet = parquetTexture(); parquet.wrapS = parquet.wrapT = THREE.RepeatWrapping; parquet.repeat.set(W / 1.05, D / 1.25)
  const floorMat = new THREE.MeshPhysicalMaterial({ map: parquet, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.28, color: '#ffffff' })
  const frameMat = new THREE.MeshStandardMaterial({ color: '#eeebe4', roughness: 0.48 })
  const ironMat = new THREE.MeshStandardMaterial({ color: PALETTE.iron, roughness: 0.55, metalness: 0.6 })
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#dfeaf0', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.14, depthWrite: false })
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#cfc6b6', roughness: 0.7 })
  const oakMat = new THREE.MeshStandardMaterial({ color: '#8a6440', roughness: 0.55 })

  const add = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; scene.add(m); return m }

  // ---------- shell
  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat), false)
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, D / 2)
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilMat))
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, D / 2)
  for (const s of [-1, 1]) {
    const side = add(new THREE.Mesh(new THREE.BoxGeometry(0.2, H, D + WALL), wallMat))
    side.position.set(s * (W / 2 + 0.1), H / 2, D / 2 - WALL / 2)
  }
  const back = add(new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.2), wallMat))
  back.position.set(0, H / 2, D + 0.1)

  // window wall with arched opening, extruded to give a deep reveal
  const ws = new THREE.Shape()
  ws.moveTo(-W / 2 - 0.2, 0); ws.lineTo(W / 2 + 0.2, 0); ws.lineTo(W / 2 + 0.2, H + 0.2); ws.lineTo(-W / 2 - 0.2, H + 0.2); ws.lineTo(-W / 2 - 0.2, 0)
  ws.holes.push(archShape(OA, OS, 0.07))
  const wallGeo = new THREE.ExtrudeGeometry(ws, { depth: WALL, bevelEnabled: false, curveSegments: 48 })
  const winWall = add(new THREE.Mesh(wallGeo, wallMat)); winWall.position.z = -WALL
  // threshold stone
  const thr = add(new THREE.Mesh(new THREE.BoxGeometry(OA * 2, 0.07, WALL + 0.06), stoneMat)); thr.position.set(0, 0.035, -WALL / 2 + 0.03)
  // architrave around the arch (interior face)
  {
    const outer = archShape(OA + 0.16, OS, 0.0), inner = archShape(OA, OS, 0.0)
    const sh = new THREE.Shape(outer.getPoints(64)); sh.holes.push(new THREE.Path(inner.getPoints(64).reverse()))
    const arch = add(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 48 }), trimMat))
    arch.position.z = 0.0
    // keystone
    const ks = add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.08), trimMat)); ks.position.set(0, OTOP + 0.06, 0.04)
  }

  // cornice: stacked profiles around the ceiling
  const corniceSteps = [[0.06, 0.05], [0.12, 0.03], [0.18, 0.06], [0.24, 0.025]]
  for (const [drop, depth] of corniceSteps) {
    for (const [len, x, z, ry] of [[W, 0, D, 0], [W, 0, 0, 0], [D, -W / 2, D / 2, Math.PI / 2], [D, W / 2, D / 2, Math.PI / 2]]) {
      const m = add(new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, depth * 2), trimMat), false)
      m.position.set(x, H - drop, z); m.rotation.y = ry
    }
  }
  // ceiling rosette
  for (const [r, tube] of [[0.55, 0.02], [0.42, 0.015], [0.18, 0.03]]) {
    const ro = add(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 64), trimMat), false)
    ro.rotation.x = Math.PI / 2; ro.position.set(0, H - 0.01, D / 2)
  }
  // skirting
  for (const [len, x, z, ry] of [[D, -W / 2 + 0.01, D / 2, Math.PI / 2], [D, W / 2 - 0.01, D / 2, Math.PI / 2], [W, 0, D - 0.01, 0]]) {
    const m = add(new THREE.Mesh(new THREE.BoxGeometry(len, 0.18, 0.03), trimMat), false)
    m.position.set(x, 0.09, z); m.rotation.y = ry
  }
  // boiserie panels on the side walls
  for (const s of [-1, 1]) {
    for (const zc of [1.6, 4.2]) {
      const p = moulding(2.0, 2.3, 0.02, trimMat); p.position.set(s * (W / 2 - 0.001), 1.75, zc); p.rotation.y = -s * Math.PI / 2; scene.add(p)
      const lo = moulding(2.0, 0.55, 0.02, trimMat); lo.position.set(s * (W / 2 - 0.001), 0.45, zc); lo.rotation.y = -s * Math.PI / 2; scene.add(lo)
    }
  }
  // window wall panels either side of the arch
  for (const s of [-1, 1]) {
    const p = moulding(1.25, 2.3, 0.02, trimMat); p.position.set(s * 1.85, 1.75, 0.0); scene.add(p)
  }
  // dado rail
  for (const s of [-1, 1]) {
    const m = add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, D), trimMat), false); m.position.set(s * (W / 2 - 0.015), 0.86, D / 2)
  }

  // ---------- the French window: fanlight + two leaves opened inward
  const winZ = -0.16
  {
    // fixed frame
    const frame = new THREE.Shape(archShape(OA, OS, 0.07).getPoints(64))
    frame.holes.push(new THREE.Path(archShape(OA - 0.06, OS, 0.13).getPoints(64).reverse()))
    add(new THREE.Mesh(new THREE.ExtrudeGeometry(frame, { depth: 0.07, bevelEnabled: false, curveSegments: 48 }), frameMat)).position.z = winZ - 0.035
    // transom bar + sunburst muntins in the fanlight
    add(new THREE.Mesh(new THREE.BoxGeometry(OA * 2, 0.07, 0.07), frameMat)).position.set(0, OS, winZ)
    for (let i = 1; i < 6; i++) {
      const a = (i / 6) * Math.PI
      const bar = add(new THREE.Mesh(new THREE.BoxGeometry(0.028, OA - 0.06, 0.04), frameMat))
      bar.position.set(Math.cos(a) * (OA - 0.06) / 2, OS + Math.sin(a) * (OA - 0.06) / 2, winZ)
      bar.rotation.z = a - Math.PI / 2
    }
    const hub = add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 32, 1, false, 0, Math.PI), frameMat))
    hub.rotation.x = Math.PI / 2; hub.rotation.y = Math.PI / 2; hub.position.set(0, OS, winZ)
    const fan = new THREE.Mesh(new THREE.CircleGeometry(OA - 0.06, 48, 0, Math.PI), glassMat); fan.position.set(0, OS, winZ); scene.add(fan)

    // leaves
    const leafW = OA - 0.03, leafH = OS - 0.16
    const makeLeaf = (sgn) => {
      const leaf = new THREE.Group()
      const st = 0.06, rail = 0.08, bottomRail = 0.2
      const piece = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), frameMat); m.position.set(x, y, 0); m.castShadow = true; m.receiveShadow = true; leaf.add(m) }
      piece(st, leafH, st / 2, leafH / 2); piece(st, leafH, leafW - st / 2, leafH / 2)
      piece(leafW, rail, leafW / 2, leafH - rail / 2); piece(leafW, bottomRail, leafW / 2, bottomRail / 2)
      // lower panel
      const pnl = new THREE.Mesh(new THREE.BoxGeometry(leafW - 0.1, 0.42, 0.03), frameMat); pnl.position.set(leafW / 2, bottomRail + 0.21, 0); pnl.castShadow = true; leaf.add(pnl)
      const glassTop = leafH - rail, glassBot = bottomRail + 0.44
      piece(leafW, 0.05, leafW / 2, glassBot)
      for (let k = 1; k < 4; k++) piece(leafW - st, 0.026, leafW / 2, glassBot + (glassTop - glassBot) * k / 4)
      const g = new THREE.Mesh(new THREE.PlaneGeometry(leafW - st * 2, glassTop - glassBot), glassMat)
      g.position.set(leafW / 2, (glassTop + glassBot) / 2, 0); leaf.add(g)
      // brass espagnolette knob
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), new THREE.MeshStandardMaterial({ color: '#b89a63', metalness: 0.9, roughness: 0.3 }))
      knob.position.set(leafW - 0.03, 1.1, 0.05); leaf.add(knob)
      // orient: hinge at the reveal edge, open into the room
      const pivot = new THREE.Group(); pivot.add(leaf)
      if (sgn < 0) { pivot.position.set(-OA + 0.03, 0.13, winZ); leaf.position.x = 0 }
      else { pivot.position.set(OA - 0.03, 0.13, winZ); leaf.scale.x = -1 }
      pivot.rotation.y = sgn < 0 ? -1.25 : 1.25
      scene.add(pivot)
      return pivot
    }
    if (!opts.noLeaves) { makeLeaf(-1); makeLeaf(1) }
  }

  // ---------- balcony railing (garde-corps): rails, bars and a row of rings
  {
    const rz = -WALL - 0.05, rw = OA * 2 + 0.3
    const rail = (y, h) => { const m = add(new THREE.Mesh(new THREE.BoxGeometry(rw, h, 0.04), ironMat)); m.position.set(0, y, rz) }
    rail(1.02, 0.045); rail(0.12, 0.03); rail(0.86, 0.02); rail(0.28, 0.02)
    const n = 15
    for (let i = 0; i <= n; i++) {
      const x = -rw / 2 + 0.04 + (rw - 0.08) * i / n
      const bar = add(new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.9, 0.016), ironMat)); bar.position.set(x, 0.57, rz)
      if (i < n) {
        const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.007, 8, 32), ironMat))
        ring.position.set(x + (rw - 0.08) / n / 2, 0.94, rz)
        const ring2 = add(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.007, 8, 32), ironMat))
        ring2.position.set(x + (rw - 0.08) / n / 2, 0.2, rz)
      }
    }
    // balcony slab outside
    const slab = add(new THREE.Mesh(new THREE.BoxGeometry(rw + 0.1, 0.12, 0.7), stoneMat)); slab.position.set(0, -0.05, -WALL - 0.3)
  }

  // ---------- the view: a graded photograph far outside
  const viewTex = await loadTex(opts.viewUrl || BASE + 'fjord-view.jpg')
  const viewMat = new THREE.MeshBasicMaterial({ map: viewTex, toneMapped: false, fog: false })
  // Treated as infinitely far: it follows the camera's position (not its rotation),
  // so the window frames a fixed angular slice of the landscape, like a real view.
  const VD = 60, VFOV = 80 * Math.PI / 180, PAD = 0.35 / 1.35 // top share of the image that is padded sky
  const VW = 2 * VD * Math.tan(VFOV / 2), VH = VW * viewTex.image.height / viewTex.image.width
  const view = new THREE.Mesh(new THREE.PlaneGeometry(VW, VH), viewMat)
  // put the photo's own centre (below the padded sky) ~6 deg below the horizon
  const VIEW_OFF = new THREE.Vector3(VW * 0.085, -VD * Math.tan(6 * Math.PI / 180) + VH * PAD / 2, -VD)
  scene.add(view)


  // ---------- paintings: Norway and Paris facing each other
  const hang = async (file, h, x, z, ry) => {
    const t = await loadTex(BASE + file)
    const ar = t.image.width / t.image.height, w = h * ar
    const g = new THREE.Group()
    const fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, h + 0.12, 0.05), new THREE.MeshStandardMaterial({ color: '#2a2724', roughness: 0.5 }))
    fr.castShadow = true; g.add(fr)
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }))
    pic.position.z = 0.027; g.add(pic)
    g.position.set(x, 1.85, z); g.rotation.y = ry; scene.add(g)
  }
  await hang('painting-dahl.jpg', 0.95, -W / 2 + 0.04, 5.2, Math.PI / 2)
  await hang('painting-pissarro.jpg', 1.0, W / 2 - 0.04, 4.6, -Math.PI / 2)

  // ---------- the writing table by the window
  {
    const tx = 1.45, tz = 1.55
    const top = add(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 1.5), oakMat)); top.position.set(tx, 0.76, tz)
    for (const [dx, dz] of [[-0.37, -0.68], [0.37, -0.68], [-0.37, 0.68], [0.37, 0.68]]) {
      const leg = add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.014, 0.74, 12), oakMat)); leg.position.set(tx + dx, 0.37, tz + dz)
    }
    // laptop, angled toward the room
    const lap = new THREE.Group()
    const alu = new THREE.MeshStandardMaterial({ color: '#b9bcbd', metalness: 0.8, roughness: 0.35 })
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.012, 0.22), alu); base.castShadow = true; lap.add(base)
    const lid = new THREE.Group(); lid.position.set(0, 0.006, -0.11); lid.rotation.x = -0.32
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.21, 0.006), alu); shell.position.y = 0.105; shell.castShadow = true; lid.add(shell)
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.188), new THREE.MeshBasicMaterial({ map: laptopScreen(), toneMapped: true }))
    scr.position.set(0, 0.105, 0.0035); lid.add(scr); lap.add(lid)
    lap.position.set(tx - 0.05, 0.786, tz + 0.15); lap.rotation.y = -1.3; scene.add(lap)
    // cup
    const pts = []; for (let i = 0; i <= 12; i++) { const y = i / 12 * 0.085; pts.push(new THREE.Vector2(0.032 + Math.sin(i / 12 * 1.4) * 0.008, y)) }
    const cup = add(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.25 })))
    cup.position.set(tx + 0.2, 0.78, tz - 0.32)
    const saucer = add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.01, 40), new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.25 })))
    saucer.position.set(tx + 0.2, 0.785, tz - 0.32)
    // two books
    const b1 = add(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.03, 0.24), new THREE.MeshStandardMaterial({ color: '#68774c', roughness: 0.8 }))); b1.position.set(tx + 0.18, 0.795, tz + 0.55); b1.rotation.y = 0.12
    const b2 = add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, 0.21), new THREE.MeshStandardMaterial({ color: '#d9c7a4', roughness: 0.8 }))); b2.position.set(tx + 0.17, 0.822, tz + 0.53); b2.rotation.y = -0.08
  }

  // ---------- an olive tree in a zinc planter, left of the window
  {
    const r = rng(11)
    const zinc = new THREE.MeshStandardMaterial({ color: '#9aa3a6', metalness: 0.75, roughness: 0.42 })
    const px = -1.95, pz = 0.75
    const pot = add(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.22, 0.52, 48), zinc)); pot.position.set(px, 0.26, pz)
    const rim = add(new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.014, 8, 48), zinc)); rim.rotation.x = Math.PI / 2; rim.position.set(px, 0.52, pz)
    const soil = add(new THREE.Mesh(new THREE.CircleGeometry(0.26, 32), new THREE.MeshStandardMaterial({ color: '#3a2e24', roughness: 1 }))); soil.rotation.x = -Math.PI / 2; soil.position.set(px, 0.5, pz)
    const bark = new THREE.MeshStandardMaterial({ color: '#5b5046', roughness: 0.9 })
    const leafGeo = new THREE.BufferGeometry() // slim olive leaf: a long diamond
    leafGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.007, 0.03, 0.002, 0, 0.068, 0, 0, 0, 0, 0, 0.068, 0, -0.007, 0.03, 0.002], 3))
    leafGeo.computeVertexNormals()
    const leafMat = new THREE.MeshStandardMaterial({ color: '#7d8a62', roughness: 0.65, side: THREE.DoubleSide })
    const clusters = [[0.05, 1.95, 0.0, 0.42], [-0.28, 1.7, 0.12, 0.36], [0.3, 1.62, -0.05, 0.33], [-0.05, 2.3, -0.08, 0.32], [0.22, 2.12, 0.18, 0.28], [-0.32, 2.08, -0.15, 0.27]]
    const N = 5200, leaves = new THREE.InstancedMesh(leafGeo, leafMat, N)
    leaves.castShadow = true; leaves.receiveShadow = true
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), v = new THREE.Vector3()
    const col = new THREE.Color()
    for (let i = 0; i < N; i++) {
      const c = clusters[i % clusters.length]
      const u = r() * Math.PI * 2, w = Math.acos(2 * r() - 1), rad = c[3] * Math.cbrt(r())
      v.set(px + c[0] + rad * Math.sin(w) * Math.cos(u), c[1] + rad * Math.cos(w) * 0.7, pz + c[2] + rad * Math.sin(w) * Math.sin(u))
      e.set(r() * 6.28, r() * 6.28, r() * 6.28); q.setFromEuler(e); const k = 0.75 + r() * 0.5; sc.set(k, k, k)
      m.compose(v, q, sc); leaves.setMatrixAt(i, m)
      leaves.setColorAt(i, col.set(r() < 0.5 ? '#8a9670' : '#6d7a55').offsetHSL(0, 0, (r() - 0.5) * 0.08))
    }
    scene.add(leaves)
    // trunk and branches toward each cluster
    const trunkTop = new THREE.Vector3(px, 1.35, pz)
    const seg = (a, b, r0, r1) => {
      const d = new THREE.Vector3().subVectors(b, a), len = d.length()
      const cyl = add(new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 8), bark))
      cyl.position.copy(a).addScaledVector(d, 0.5); cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
    }
    seg(new THREE.Vector3(px, 0.5, pz), new THREE.Vector3(px + 0.04, 0.95, pz), 0.04, 0.032)
    seg(new THREE.Vector3(px + 0.04, 0.95, pz), trunkTop, 0.032, 0.026)
    for (const c of clusters) seg(trunkTop, new THREE.Vector3(px + c[0] * 0.8, c[1] - 0.1, pz + c[2] * 0.8), 0.018, 0.008)
  }

  // ---------- light
  const hemi = new THREE.HemisphereLight('#e3ebf0', '#8b7a66', 0.3); scene.add(hemi)
  const sky = new THREE.RectAreaLight('#dfe8ee', 6, OA * 2, OTOP)
  sky.position.set(0, OTOP / 2, -0.05); sky.lookAt(0, OTOP / 2, 5); scene.add(sky)
  const bounce = new THREE.RectAreaLight('#f2e6d6', 1.2, W, 1.6)
  bounce.position.set(0, 1.2, 3.2); bounce.lookAt(0, 1.6, 0); scene.add(bounce)
  const sun = new THREE.DirectionalLight('#ffffff', 2.5)
  sun.castShadow = true
  sun.shadow.mapSize.set(bake ? 4096 : 2048, bake ? 4096 : 2048)
  sun.shadow.camera.left = -13; sun.shadow.camera.right = 13; sun.shadow.camera.top = 13; sun.shadow.camera.bottom = -13
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 40
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = bake ? 6 : 4
  sun.target.position.set(0, 0, 3); scene.add(sun, sun.target)

  if (opts.extra) await opts.extra(scene, THREE)

  // ---------- optional bake-quality ambient occlusion
  let composer = null
  if (bake && opts.ao !== false) {
    const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js')
    const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js')
    const { GTAOPass } = await import('three/addons/postprocessing/GTAOPass.js')
    const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js')
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const ao = new GTAOPass(scene, camera, 16, 16)
    ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.6, thickness: 2.0, scale: 1.6, samples: 16 })
    ao.blendIntensity = 1.0
    composer.addPass(ao)
    if (opts.dof) {
      const { BokehPass } = await import('three/addons/postprocessing/BokehPass.js')
      composer.addPass(new BokehPass(scene, camera, opts.dof))
    }
    composer.addPass(new OutputPass())
  }

  // ---------- state
  const state = { time: 0.25, progress: 0, look: null }
  const tmpA = new THREE.Color(), tmpB = new THREE.Color()

  function applyTime(t) {
    let i = 0; while (i < DAY.length - 2 && t > DAY[i + 1].t) i++
    const a = DAY[i], b = DAY[i + 1], k = ease(THREE.MathUtils.clamp((t - a.t) / (b.t - a.t), 0, 1))
    const mix = (ca, cb) => tmpA.set(ca).lerp(tmpB.set(cb), k).clone()
    sun.position.set(lerp(a.sun[0], b.sun[0], k), lerp(a.sun[1], b.sun[1], k), lerp(a.sun[2], b.sun[2], k))
    sun.color.copy(mix(a.sunCol, b.sunCol)); sun.intensity = lerp(a.sunI, b.sunI, k)
    sky.color.copy(mix(a.sky, b.sky)); sky.intensity = lerp(a.skyI, b.skyI, k)
    viewMat.color.copy(mix(a.view, b.view))
    scene.background.copy(mix(a.view, b.view)).multiplyScalar(0.85)
    hemi.intensity = lerp(a.hemi, b.hemi, k)
    bounce.color.copy(sun.color).lerp(tmpB.set('#e8dccb'), 0.6); bounce.intensity = sun.intensity * 0.22
    renderer.toneMappingExposure = lerp(a.exp, b.exp, k) * (opts.exposure || 1)
  }

  // the one camera move: deep in the room, slightly off-axis -> out on the balcony
  const C0 = { p: new THREE.Vector3(0, 1.5, 7.9), l: new THREE.Vector3(0, 1.62, -6) }
  const C1 = { p: new THREE.Vector3(0.0, 1.5, 3.1), l: new THREE.Vector3(0.0, 0.6, -40) }
  function applyCamera(pr) {
    const k = ease(pr)
    camera.position.lerpVectors(C0.p, C1.p, k)
    // slight lift in the middle of the move, like a hand-held dolly settling
    camera.position.y += Math.sin(k * Math.PI) * 0.08
    const l = new THREE.Vector3().lerpVectors(C0.l, C1.l, Math.pow(k, 1.6))
    camera.lookAt(state.look || l)
    view.position.copy(camera.position).add(VIEW_OFF)
  }

  function resize(w, h) {
    renderer.setSize(w, h, false); camera.aspect = w / h
    // keep the arch framed on tall screens
    camera.fov = (opts.fov || 40) * (w / h < 1 ? 1.45 : 1)
    camera.updateProjectionMatrix(); composer && composer.setSize(w, h)
  }

  function render() {
    applyTime(state.time); applyCamera(state.progress)
    composer ? composer.render() : renderer.render(scene, camera)
  }

  return {
    THREE, scene, camera, renderer, render, resize,
    set(s) { Object.assign(state, s) },
    setCamera(pos, look) { C0.p.set(...pos); C0.l.set(...look); state.progress = 0 },
    dispose() { renderer.dispose() },
  }
}
