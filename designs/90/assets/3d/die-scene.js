// Six Faces / design 90 — the product die, live in three.js.
// A rounded ultramarine cube whose faces carry one product: the real logo on a
// paper label, the one honest number on top, the facts on the side.
// Used two ways: kept live on the page (mountDie) and baked to stills (render.html).
//
//   import { mountDie } from './3d/die-scene.js'
//   const die = await mountDie(canvasEl, { product: 'mcp-emails' })
//   die.dispose()
//
// Needs an import map for "three" and "three/addons/" (three@0.185.0).

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const BASE = new URL('.', import.meta.url)
const P = (p) => new URL(p, BASE).href
export const PAL = {
  night: '#000a2a', deep: '#00226c', field: '#0159d4', seed: '#0587f0',
  electric: '#52a9fe', mist: '#d3e7fe', paper: '#f1f8ff', sodium: '#ffb250',
}

// Facts are copied from designs/_shared/content.js. Never edit numbers here alone.
export const PRODUCTS = {
  'mcp-emails': { name: 'MCP Emails', status: 'Live', since: 2026, value: '$782', label: 'MRR',
    facts: ['17 tools', 'about 100 email providers', 'open source (AGPL)'],
    logo: '../../../_shared/products/mcp-emails/logo-mark.svg', logoKind: 'svg' },
  'fun-libs': { name: 'Fun Libs', status: 'Live', since: 2019, value: '113,000+', label: 'installs',
    facts: ['built at 17', 'no marketing', 'v5 shipped 2026'],
    logo: '../../../_shared/products/fun-libs/icon.png', logoKind: 'icon' },
  'toolrails': { name: 'Toolrails', status: 'Building', since: 2026, value: '4', label: 'connectors',
    facts: ['tool search', 'injection guard'],
    logo: '../../../_shared/products/toolrails/icon.svg', logoKind: 'svg' },
  'harbor': { name: 'Harbor', status: 'Paused', since: 2026, value: '549', label: 'commits',
    facts: ['self-hostable', 'AI edits held for approval'],
    logo: '../../../_shared/products/harbor/harbor-mark-filled.svg', logoKind: 'svg', color: '#0B1020' },
}

async function loadFonts() {
  if (loadFonts.done) return
  const a = new FontFace('Archivo90', `url(${P('../fonts/archivo-var.woff2')})`, { weight: '100 900', stretch: '62% 125%' })
  const m = new FontFace('Plex90', `url(${P('../fonts/plex-mono-500.woff2')})`, { weight: '500' })
  await Promise.all([a.load(), m.load()]).then((fs) => fs.forEach((f) => document.fonts.add(f)))
  loadFonts.done = true
}

async function loadLogo(prod, size) {
  const url = P(prod.logo)
  if (prod.logoKind === 'svg') {
    // give the SVG an intrinsic size so it never distorts; colour only for currentColor marks
    let txt = await (await fetch(url)).text()
    txt = txt.replace(/<svg([^>]*?)\s(width|height)="[^"]*"/g, '<svg$1').replace(/<svg([^>]*?)\s(width|height)="[^"]*"/g, '<svg$1')
    txt = txt.replace('<svg ', `<svg width="${size}" height="${size}" ${prod.color ? `style="color:${prod.color}"` : ''} `)
    const blob = new Blob([txt], { type: 'image/svg+xml' })
    const img = new Image(); img.src = URL.createObjectURL(blob); await img.decode(); return img
  }
  const img = new Image(); img.src = url; await img.decode(); return img
}

function canvas(n = 1024) { const c = document.createElement('canvas'); c.width = c.height = n; return [c, c.getContext('2d')] }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r) }
function grain(ctx, n, a = 0.05) {
  const d = ctx.getImageData(0, 0, n, n); const p = d.data
  for (let i = 0; i < p.length; i += 4) { const g = (Math.random() - 0.5) * 255 * a; p[i] += g; p[i + 1] += g; p[i + 2] += g }
  ctx.putImageData(d, 0, 0)
}

async function faceTextures(prod) {
  await loadFonts()
  const N = 1024, logo = await loadLogo(prod, 512)
  // front: a paper label on the ultramarine body, carrying the real logo, unchanged
  const [f, fc] = canvas(N)
  fc.fillStyle = PAL.field; fc.fillRect(0, 0, N, N)
  fc.fillStyle = PAL.paper; rr(fc, 192, 150, 640, 640, 36); fc.fill()
  if (prod.logoKind === 'icon') { fc.save(); rr(fc, 342, 260, 340, 340, 78); fc.clip(); fc.drawImage(logo, 342, 260, 340, 340); fc.restore() }
  else fc.drawImage(logo, 322, 240, 380, 380)
  fc.fillStyle = PAL.night; fc.font = '500 30px Plex90'; fc.textAlign = 'center'
  fc.fillText(prod.name.toUpperCase(), N / 2, 700)
  fc.fillStyle = PAL.field; fc.font = '500 24px Plex90'
  fc.fillText(`${prod.status.toUpperCase()} · SINCE ${prod.since}`, N / 2, 745)
  fc.fillStyle = PAL.sodium; fc.fillRect(N / 2 - 22, 870, 44, 44)
  grain(fc, N, 0.035)
  // top: the one number
  const [t, tc] = canvas(N)
  tc.fillStyle = PAL.field; tc.fillRect(0, 0, N, N)
  tc.fillStyle = PAL.paper; tc.textAlign = 'center'; tc.fontStretch = 'expanded'
  let fs = 300; tc.font = `800 ${fs}px Archivo90`
  while (tc.measureText(prod.value).width > 860) { fs -= 8; tc.font = `800 ${fs}px Archivo90` }
  tc.fillText(prod.value, N / 2, 560)
  tc.fontStretch = 'normal'; tc.font = '500 44px Plex90'; tc.fillStyle = PAL.mist
  tc.fillText(prod.label.toUpperCase(), N / 2, 680)
  grain(tc, N, 0.04)
  // side: facts, typed
  const [s, sc] = canvas(N)
  sc.fillStyle = PAL.deep; sc.fillRect(0, 0, N, N)
  sc.fillStyle = PAL.sodium; sc.font = '500 30px Plex90'; sc.fillText('FACTS', 110, 200)
  sc.fillStyle = PAL.paper; sc.font = '500 46px Plex90'
  prod.facts.forEach((x, i) => sc.fillText('— ' + x, 110, 330 + i * 92))
  grain(sc, N, 0.04)
  // blank faces: a single sodium pip
  const [b, bc] = canvas(N)
  bc.fillStyle = PAL.field; bc.fillRect(0, 0, N, N)
  bc.fillStyle = PAL.sodium; bc.fillRect(N / 2 - 70, N / 2 - 70, 140, 140)
  grain(bc, N, 0.04)
  return [f, t, s, b].map((c) => { const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx })
}

/**
 * Build a die + light rig into a renderer. opts: product, background (CSS handles photo),
 * pose: {x,y,z} euler radians, live: spin + drag
 */
export async function mountDie(canvasEl, opts = {}) {
  const prod = PRODUCTS[opts.product || 'mcp-emails']
  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true, preserveDrawingBuffer: !!opts.bake })
  renderer.setPixelRatio(opts.dpr || Math.min(devicePixelRatio, 2))
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = opts.exposure ?? 0.92
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.32

  const cam = new THREE.PerspectiveCamera(opts.fov ?? 28, 1, 0.1, 100)
  cam.position.set(...(opts.camera || [4.2, 3.3, 6.2])); cam.lookAt(0, opts.lookY ?? 0.15, 0)

  const [front, top, side, blank] = await faceTextures(prod)
  const mat = (map, rough = 0.42) => new THREE.MeshPhysicalMaterial({ map, roughness: rough, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.32, sheen: 0.15, sheenColor: new THREE.Color(PAL.electric) })
  // BoxGeometry group order: +x, -x, +y, -y, +z, -z
  const mats = [mat(side), mat(blank), mat(top), mat(blank), mat(front, 0.55), mat(blank)]
  const die = new THREE.Mesh(new RoundedBoxGeometry(2, 2, 2, 8, 0.16), mats)
  die.castShadow = true; die.position.y = 1
  const pose = opts.pose || { x: 0, y: -0.38, z: 0 }
  die.rotation.set(pose.x, pose.y, pose.z)
  scene.add(die)

  const key = new THREE.DirectionalLight('#fff2df', 2.6); key.position.set(-4, 7, 5); key.castShadow = true
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8; key.shadow.camera.left = key.shadow.camera.bottom = -4; key.shadow.camera.right = key.shadow.camera.top = 4
  const rim = new THREE.DirectionalLight(PAL.sodium, 4.2); rim.position.set(5, 2.5, -6)
  const fill = new THREE.HemisphereLight(PAL.electric, PAL.night, 0.6)
  scene.add(key, rim, fill)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: opts.shadow ?? 0.55, color: PAL.night }))
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground)

  let raf = 0, dragging = false, lx = 0, ly = 0, vx = 0, vy = 0
  function size() {
    const w = canvasEl.clientWidth || canvasEl.width, h = canvasEl.clientHeight || canvasEl.height
    renderer.setSize(w, h, false); cam.aspect = w / h
    if (opts.offsetX) cam.setViewOffset(w, h, -w * opts.offsetX, 0, w, h)
    cam.updateProjectionMatrix()
  }
  size()
  const frame = () => {
    if (opts.live) {
      if (!dragging) { vy *= 0.96; vx *= 0.96; die.rotation.y += 0.0025 + vy; die.rotation.x += vx; die.rotation.x *= 0.98 }
      raf = requestAnimationFrame(frame)
    }
    renderer.render(scene, cam)
  }
  if (opts.live) {
    canvasEl.style.touchAction = 'none'
    canvasEl.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvasEl.setPointerCapture(e.pointerId) })
    canvasEl.addEventListener('pointermove', (e) => { if (!dragging) return; vy = (e.clientX - lx) * 0.004; vx = (e.clientY - ly) * 0.004; die.rotation.y += vy; die.rotation.x += vx; lx = e.clientX; ly = e.clientY })
    canvasEl.addEventListener('pointerup', () => { dragging = false })
    addEventListener('resize', size)
  }
  frame()
  return { renderer, scene, die, render: () => renderer.render(scene, cam), dispose() { cancelAnimationFrame(raf); renderer.dispose(); pmrem.dispose() } }
}
