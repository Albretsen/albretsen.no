// Blue Hour Terrace: a paper-cut diorama in real 3D.
// Eleven baked paper layers stand on their own planes in depth. A low "street light" casts real
// soft shadows from each sheet onto the sheets behind it. The pointer dollies the camera a few
// centimetres (never more: the composition stays centred and symmetric), and `dusk` (0..1)
// deepens the sky and lights the windows: the "Lamplighter".
//
// Usage:
//   import { mountDiorama } from './diorama3d.js'
//   const d = await mountDiorama(canvasOrContainer, { base: './layers/', dusk: 0.6 })
//   d.setDusk(1)   // animate yourself, e.g. from scroll progress
//   d.destroy()
//
// three.js is loaded lazily from a pinned CDN build, so import this module after first paint.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js'

// [file, z-depth, cast shadow, receive shadow]
const LAYERS = [
  ['layer-0-sky', -12, false, false],
  ['layer-1-clouds', -10.5, true, true],
  ['layer-2-far', -8.6, true, true],
  ['layer-3-mid', -6.8, true, true],
  ['layer-4-street', -5.2, true, true],
  ['layer-5-centre', -4.3, true, true],
  ['layer-6-pavement', -3.3, true, true],
  ['layer-7-terrace', -1.6, true, true],
  ['layer-8-awning', -0.5, true, false],
]
const GLOWS = ['layer-3-mid-glow', 'layer-4-street-glow', 'layer-5-centre-glow', 'layer-6-pavement-glow']

export async function mountDiorama(target, opts = {}) {
  const base = opts.base ?? new URL('../layers/', import.meta.url).href
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const THREE = await import(/* @vite-ignore */ THREE_URL)

  let canvas = target
  if (!(target instanceof HTMLCanvasElement)) {
    canvas = document.createElement('canvas')
    canvas.style.cssText = 'display:block;width:100%;height:100%'
    target.appendChild(canvas)
  }
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#16213D')
  const CAMZ = 9
  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 100)
  camera.position.set(0, 0, CAMZ)

  // light: a soft fill (blue hour) + one warm key from just above the viewer, casting down/back
  const hemi = new THREE.HemisphereLight('#E9ECFF', '#B9A7C7', 1.3)
  scene.add(hemi)
  const key = new THREE.DirectionalLight('#FFE6C8', 1.25)
  key.position.set(0.0, 6, 9)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.radius = 6
  key.shadow.blurSamples = 16
  key.shadow.bias = -0.0008
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 8, bottom: -8, near: 1, far: 40 })
  scene.add(key)

  // frame size at z=0 that fills the view; each layer is scaled so it fills the same frame from the camera
  const vh = 2 * CAMZ * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
  const loader = new THREE.TextureLoader()
  const load = (name) => new Promise((res, rej) => loader.load(base + name + '.webp', (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t)
  }, undefined, rej))

  const group = new THREE.Group(); scene.add(group)
  const planes = []
  const OVERSCAN = 1.08
  const textures = await Promise.all(LAYERS.map(([n]) => load(n)))
  LAYERS.forEach(([name, z, cast, recv], i) => {
    const k = (CAMZ - z) / CAMZ * OVERSCAN
    const geo = new THREE.PlaneGeometry(vh * 16 / 9 * k, vh * k)
    const mat = new THREE.MeshLambertMaterial({ map: textures[i], transparent: i > 0, alphaTest: i > 0 ? 0.5 : 0 })
    const m = new THREE.Mesh(geo, mat)
    m.position.z = z
    m.castShadow = cast; m.receiveShadow = recv
    if (cast) m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: textures[i], alphaTest: 0.5 })
    group.add(m); planes.push(m)
  })
  // emissive window light: additive sprites floated just in front of their layer
  const glowMats = []
  const glowTex = await Promise.all(GLOWS.map(load))
  GLOWS.forEach((name, i) => {
    const host = LAYERS.find(([n]) => name.startsWith(n))
    const z = host[1] + 0.02
    const k = (CAMZ - z) / CAMZ * OVERSCAN
    const mat = new THREE.MeshBasicMaterial({ map: glowTex[i], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })
    const m = new THREE.Mesh(new THREE.PlaneGeometry(vh * 16 / 9 * k, vh * k), mat)
    m.position.z = z
    group.add(m); glowMats.push(mat)
  })

  // ---- state
  let dusk = opts.dusk ?? 0.65, duskTarget = dusk
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 }
  function applyDusk(v) {
    hemi.intensity = 1.55 - v * 0.55
    key.intensity = 1.75 - v * 0.5
    planes[0].material.color.setRGB(1 - v * 0.42, 1 - v * 0.38, 1 - v * 0.22)
    // Lamplighter: the layers light in order, nearest street first, rooftops last
    glowMats.forEach((m, i) => { m.opacity = Math.min(1, Math.max(0, (v - 0.15 - (GLOWS.length - 1 - i) * 0.12) * 2.4)) })
  }

  function resize() {
    const r = canvas.parentElement?.getBoundingClientRect() ?? canvas.getBoundingClientRect()
    const w = Math.max(1, r.width), h = Math.max(1, r.height)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // keep the whole 16:9 frame visible-ish: cover on wide screens, gently contain on tall ones
    camera.fov = w / h >= 16 / 9 ? 32 * (16 / 9) / (w / h) : 32
    camera.updateProjectionMatrix()
  }
  function onMove(e) {
    const r = canvas.getBoundingClientRect()
    ptr.tx = ((e.clientX - r.left) / r.width - 0.5) * 2
    ptr.ty = ((e.clientY - r.top) / r.height - 0.5) * 2
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement ?? canvas)
  addEventListener('pointermove', onMove, { passive: true })
  resize()

  let raf = 0, visible = true
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick) })
  io.observe(canvas)
  function tick() {
    raf = 0
    if (!visible) return
    const ease = reduced ? 1 : 0.06
    ptr.x += (ptr.tx - ptr.x) * ease; ptr.y += (ptr.ty - ptr.y) * ease
    dusk += (duskTarget - dusk) * (reduced ? 1 : 0.08)
    camera.position.x = ptr.x * 0.45
    camera.position.y = -ptr.y * 0.22
    camera.lookAt(0, 0, -4)
    applyDusk(dusk)
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  return {
    setDusk(v) { duskTarget = Math.min(1, Math.max(0, v)) },
    get dusk() { return dusk },
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      removeEventListener('pointermove', onMove)
      renderer.dispose()
    },
  }
}
