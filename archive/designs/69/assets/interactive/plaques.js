// Afterglow plaques: each product's real logo mounted as a glazed tile on a pastel stucco wall,
// lit by the last low sun. Move the pointer to move the sun; the long shadows swing with it.
//
//   import { mountPlaque } from './plaques.js'
//   const p = await mountPlaque(el, { product: 'mcp-emails' })   // returns { setSun(x,y), dispose() }
//
// Loads three.js lazily from a pinned CDN build. Respects prefers-reduced-motion (no easing loop).

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js'
const P = new URL('../../../_shared/products/', import.meta.url).href

// Wall colours are the palette pastels; tile shape follows the real logo's own shape.
export const PRODUCTS = {
  'mcp-emails': { wall: '#F3BAC4', src: P + 'mcp-emails/logo-wordmark.svg', tile: 'plate', w: 2.5, h: 0.78, face: '#FFFFFF', pad: 0.26 },
  'fun-libs':   { wall: '#A6E2CC', src: P + 'fun-libs/icon.png',            tile: 'square', w: 1.25, h: 1.25, face: '#FFE066', radius: 0.26 },
  'toolrails':  { wall: '#A9CCF2', src: P + 'toolrails/icon.svg',           tile: 'square', w: 1.2, h: 1.2, face: '#141413', radius: 0.22 },
  'harbor':     { wall: '#F7F1E8', src: P + 'harbor/harbor-wordmark.svg',   tile: 'plate', w: 2.3, h: 0.72, face: '#FBF9F4', pad: 0.22, ink: '#1F2433' },
}

let THREE
async function three() { return THREE || (THREE = await import(THREE_URL)) }

function stuccoCanvas(hex, size = 512, seed = 1) {
  const c = document.createElement('canvas'); c.width = c.height = size
  const g = c.getContext('2d'); g.fillStyle = hex; g.fillRect(0, 0, size, size)
  let s = seed * 9301 + 49297
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  // trowel marks: many soft translucent ellipses, lighter and darker
  for (let i = 0; i < 1800; i++) {
    const x = rnd() * size, y = rnd() * size, r = 3 + rnd() * 16
    g.fillStyle = rnd() > 0.4 ? `rgba(255,255,255,${0.02 + rnd() * 0.035})` : `rgba(90,50,70,${0.008 + rnd() * 0.014})`
    g.beginPath(); g.ellipse(x, y, r * 1.8, r, rnd() * 3.14, 0, 6.283); g.fill()
  }
  // fine sand grain
  const id = g.getImageData(0, 0, size, size), d = id.data
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n }
  g.putImageData(id, 0, 0)
  return c
}

function bumpCanvas(size = 512, seed = 2) {
  const c = document.createElement('canvas'); c.width = c.height = size
  const g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, size, size)
  let s = seed * 7919
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * size, y = rnd() * size, r = 1 + rnd() * 9
    const v = Math.floor(100 + rnd() * 60)
    g.fillStyle = `rgba(${v},${v},${v},0.35)`; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill()
  }
  return c
}

async function logoCanvas(spec, px = 1024) {
  const img = new Image(); img.crossOrigin = 'anonymous'
  if (spec.ink && spec.src.endsWith('.svg')) {
    // Harbor uses currentColor: inline it with its intended ink.
    const txt = await (await fetch(spec.src)).text()
    const svg = txt.replace('<svg ', `<svg color="${spec.ink}" style="color:${spec.ink}" `)
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  } else img.src = spec.src
  await img.decode()
  const ar = spec.w / spec.h
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px / ar)
  const g = c.getContext('2d'); g.fillStyle = spec.face; g.fillRect(0, 0, c.width, c.height)
  const pad = (spec.pad || 0) * c.height
  // Trim to the logo's visible bounds so it sits optically centred (the source viewBoxes carry slack).
  const t = document.createElement('canvas'); t.width = 2048; t.height = Math.round(2048 * (img.naturalHeight || 512) / (img.naturalWidth || 512))
  const tg = t.getContext('2d'); tg.drawImage(img, 0, 0, t.width, t.height)
  const a = tg.getImageData(0, 0, t.width, t.height).data
  let x0 = t.width, y0 = t.height, x1 = 0, y1 = 0
  for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++) if (a[(y * t.width + x) * 4 + 3] > 8) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  if (spec.tile === 'square') { x0 = 0; y0 = 0; x1 = t.width - 1; y1 = t.height - 1 }
  const iw = x1 - x0 + 1, ih = y1 - y0 + 1
  const k = Math.min((c.width - pad * 2) / iw, (c.height - pad * 2) / ih)
  g.drawImage(t, x0, y0, iw, ih, (c.width - iw * k) / 2, (c.height - ih * k) / 2, iw * k, ih * k)
  return c
}

function roundedRect(T, w, h, r) {
  const s = new T.Shape(), x = -w / 2, y = -h / 2
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y)
  return s
}

export async function mountPlaque(el, { product = 'mcp-emails', interactive = true, pixelRatio } = {}) {
  const T = await three()
  const spec = PRODUCTS[product]
  const W = el.clientWidth || 800, H = el.clientHeight || 1000
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(pixelRatio || Math.min(devicePixelRatio, 2))
  renderer.setSize(W, H)
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3
  renderer.outputColorSpace = T.SRGBColorSpace
  el.appendChild(renderer.domElement)
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' })

  const scene = new T.Scene()
  const cam = new T.PerspectiveCamera(32, W / H, 0.1, 100)
  cam.position.set(0.35, -0.3, 6.4); cam.lookAt(0, -0.25, 0)

  // Wall
  const wallTex = new T.CanvasTexture(stuccoCanvas(spec.wall, 512, product.length))
  wallTex.colorSpace = T.SRGBColorSpace; wallTex.wrapS = wallTex.wrapT = T.RepeatWrapping; wallTex.repeat.set(3, 3)
  const bump = new T.CanvasTexture(bumpCanvas()); bump.wrapS = bump.wrapT = T.RepeatWrapping; bump.repeat.set(5, 5)
  const wall = new T.Mesh(new T.PlaneGeometry(14, 14), new T.MeshStandardMaterial({ map: wallTex, bumpMap: bump, bumpScale: 0.6, roughness: 0.92 }))
  wall.receiveShadow = true; scene.add(wall)

  // Deco speed lines: three rounded rails below the tile
  const railMat = new T.MeshStandardMaterial({ color: new T.Color(spec.wall).offsetHSL(0, -0.05, 0.04), roughness: 0.85 })
  for (let i = 0; i < 3; i++) {
    const len = 2.6 - i * 0.8
    const rail = new T.Mesh(new T.CapsuleGeometry(0.035, len, 6, 12), railMat)
    rail.rotation.z = Math.PI / 2; rail.position.set(0, -spec.h / 2 - 0.55 - i * 0.18, 0.04)
    rail.castShadow = rail.receiveShadow = true; scene.add(rail)
  }

  // Tile body (glazed ceramic) + logo face
  const r = spec.radius ?? Math.min(spec.w, spec.h) * 0.12
  const body = new T.Mesh(
    new T.ExtrudeGeometry(roundedRect(T, spec.w, spec.h, r), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 6, curveSegments: 24 }),
    new T.MeshPhysicalMaterial({ color: spec.face, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.12 }))
  body.castShadow = true; body.receiveShadow = true; scene.add(body)
  const logoTex = new T.CanvasTexture(await logoCanvas(spec)); logoTex.colorSpace = T.SRGBColorSpace; logoTex.anisotropy = 8
  const faceGeo = new T.ShapeGeometry(roundedRect(T, spec.w, spec.h, r), 24)
  // map shape UVs (in world units) to 0..1
  const uv = faceGeo.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / spec.w + 0.5, uv.getY(i) / spec.h + 0.5)
  const face = new T.Mesh(faceGeo, new T.MeshPhysicalMaterial({ map: logoTex, emissiveMap: logoTex, emissive: '#ffffff', emissiveIntensity: 0.18, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }))
  face.position.z = 0.152; face.receiveShadow = true; scene.add(face)
  // four small brass-free pins (plaster colour) so it reads as mounted
  const pinMat = new T.MeshStandardMaterial({ color: '#e9e2da', roughness: 0.4, metalness: 0.1 })
  ;[[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sy]) => {
    const pin = new T.Mesh(new T.SphereGeometry(0.028, 16, 12), pinMat)
    pin.position.set(sx * (spec.w / 2 - Math.max(r, 0.1) * 0.55), sy * (spec.h / 2 - Math.max(r, 0.1) * 0.55), 0.16)
    pin.castShadow = true; if (spec.tile === 'plate') scene.add(pin)
  })

  // Light: low afterglow sun (warm) + sky fill (blue above, flamingo bounce below)
  const hemi = new T.HemisphereLight('#a9c6ea', '#f3a6b4', 1.1); scene.add(hemi)
  const sun = new T.DirectionalLight('#ffc39a', 3.6)
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -0.0004
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 40 })
  scene.add(sun, sun.target)
  const setSun = (x = 0.75, y = 0.35) => { // x,y in 0..1 (pointer space)
    const az = (x - 0.5) * 2.2, el = 0.12 + (1 - y) * 0.5
    sun.position.set(Math.sin(az) * 12 + 6, Math.sin(el) * 10 - 1, Math.cos(az) * 4 + 1.2)
  }
  setSun()

  const render = () => renderer.render(scene, cam)
  render()
  let target = { x: 0.75, y: 0.35 }, cur = { ...target }, raf = 0
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const tick = () => {
    cur.x += (target.x - cur.x) * 0.06; cur.y += (target.y - cur.y) * 0.06
    setSun(cur.x, cur.y); render()
    raf = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.001 ? requestAnimationFrame(tick) : 0
  }
  const onMove = (e) => {
    const b = el.getBoundingClientRect()
    target = { x: (e.clientX - b.left) / b.width, y: (e.clientY - b.top) / b.height }
    if (reduce) { setSun(target.x, target.y); render() } else if (!raf) raf = requestAnimationFrame(tick)
  }
  if (interactive) el.addEventListener('pointermove', onMove)
  return {
    setSun: (x, y) => { setSun(x, y); render() },
    canvas: renderer.domElement,
    dispose() { el.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); renderer.dispose(); renderer.domElement.remove() },
  }
}
