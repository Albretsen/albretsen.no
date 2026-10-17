// The Long Evening room: a planimetric (dead-centre, Wes Anderson framed) ranch-modern room
// with white clapboard walls, a slate floor and a falu-red credenza. A low sun moves through
// the window as `time` goes from 0 (late afternoon) to 1 (the evening that never gets dark).
// The four live/building products hang on the wall as postcards.
//
// Usage:
//   import { mountRoom } from './room.js'
//   const room = await mountRoom(canvasOrContainer, { base: './', time: 0.3 })
//   room.setTime(0.8)      // 0..1, call from scroll or a slider; renders on demand
//   room.dispose()
//
// three.js is loaded from a pinned CDN module. Load this module lazily, after first paint.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js'

const C = {
  white: 0xf3ede2, falu: 0x8a2e22, ochre: 0xc9973a, slate: 0x3e4651, ink: 0x23252d,
}
const lerp = (a, b, t) => a + (b - a) * t
const ease = t => t * t * (3 - 2 * t)
const mixColor = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t)

function slateTexture() {
  const s = 512, c = document.createElement('canvas'); c.width = c.height = s
  const g = c.getContext('2d')
  g.fillStyle = '#5d6670'; g.fillRect(0, 0, s, s)
  const tiles = 4, t = s / tiles
  for (let y = 0; y < tiles; y++) for (let x = 0; x < tiles; x++) {
    const v = 104 + Math.floor(Math.random() * 16)
    g.fillStyle = `rgb(${v - 8},${v},${v + 10})`
    g.fillRect(x * t + 2, y * t + 2, t - 4, t - 4)
    for (let i = 0; i < 260; i++) { // cleft texture of slate
      g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.05})`
      g.fillRect(x * t + Math.random() * t, y * t + Math.random() * t, Math.random() * 30, 1.5)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 2)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export async function mountRoom(target, opts = {}) {
  const base = opts.base ?? new URL('../', import.meta.url).href
  const canvas = target.tagName === 'CANVAS' ? target : target.appendChild(document.createElement('canvas'))
  canvas.style.display = 'block'; canvas.style.width = '100%'; canvas.style.height = '100%'

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !!opts.preserve })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.1, 100)
  camera.position.set(0, 1.75, 10.2)
  camera.lookAt(0, 1.75, -3)

  const loader = new THREE.TextureLoader()
  const load = url => new Promise(res => loader.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; res(t) }, undefined, () => res(null)))

  const [clap, view, ...cards] = await Promise.all([
    load(base + 'extras/clapboard-white.webp'),
    load(base + 'hero/fog-1280.webp'),
    ...['mcp-emails', 'fun-libs', 'toolrails', 'harbor'].map(n => load(base + `products/postcard-${n}-750.webp`)),
  ])
  if (clap) { clap.wrapS = clap.wrapT = THREE.RepeatWrapping }

  const W = 11, H = 4.6, D = 7, BZ = -3 // room width, height, depth, back wall z
  // one clapboard material per wall size, so boards keep a constant 0.36 m reveal
  const R = 1.7 // metres of wall per texture tile (8 boards -> 21 cm reveal)
  const wallMat = (w, h, yb = 0) => {
    const map = clap ? clap.clone() : null
    if (map) { map.needsUpdate = true; map.repeat.set(w / R, h / R); map.offset.set(0, (yb / R) % 1) }
    return new THREE.MeshStandardMaterial({ color: 0xffffff, map, roughness: 0.92 })
  }
  const plain = new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.95 })
  const box = (w, h, d, mat, x, y, z, cast = true) => {
    if (typeof mat === 'function') mat = mat(Math.max(w, d), h, y - h / 2)
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m
  }

  // floor + ceiling
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D + 4), new THREE.MeshStandardMaterial({ map: slateTexture(), roughness: 0.88, metalness: 0.0 }))
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, BZ + (D + 4) / 2); floor.receiveShadow = true; scene.add(floor)
  box(W, 0.1, D + 4, new THREE.MeshStandardMaterial({ color: C.white, roughness: 1, emissive: 0x6a5a4c, emissiveIntensity: 0.55 }), 0, H + 0.05, BZ + (D + 4) / 2, false)

  // back wall with a centred four-pane window (sill 1.05, head 3.35, width 3.2)
  const ww = 3.2, wy0 = 1.05, wy1 = 3.35, t = 0.18
  box((W - ww) / 2, H, t, wallMat, -(ww / 2 + (W - ww) / 4), H / 2, BZ)
  box((W - ww) / 2, H, t, wallMat, (ww / 2 + (W - ww) / 4), H / 2, BZ)
  box(ww, wy0, t, wallMat, 0, wy0 / 2, BZ)
  box(ww, H - wy1, t, wallMat, 0, (H + wy1) / 2, BZ)
  const frameMat = new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.6 })
  box(0.06, wy1 - wy0, 0.12, frameMat, 0, (wy0 + wy1) / 2, BZ)          // mullion
  box(ww, 0.06, 0.12, frameMat, 0, (wy0 + wy1) / 2 + 0.25, BZ)          // transom
  box(ww + 0.2, 0.07, 0.34, frameMat, 0, wy0 - 0.02, BZ + 0.08)         // sill
  // side walls (no windows: the room is lit only through the back window, like a stage)
  box(t, H, D + 4, wallMat, -W / 2, H / 2, BZ + (D + 4) / 2)
  box(t, H, D + 4, wallMat, W / 2, H / 2, BZ + (D + 4) / 2)
  // skirting in slate
  const skirt = new THREE.MeshStandardMaterial({ color: C.slate, roughness: 0.8 })
  box(W, 0.14, 0.04, skirt, 0, 0.07, BZ + t / 2 + 0.02, false)

  // the view: the graded fog photograph on a far plane, self-lit
  const viewMat = new THREE.MeshBasicMaterial({ map: view, color: 0xffffff, toneMapped: false })
  const viewPlane = new THREE.Mesh(new THREE.PlaneGeometry(16, 10.7), viewMat)
  viewPlane.position.set(0, 2.6, BZ - 7); scene.add(viewPlane)

  // falu-red credenza with an ochre top, dead centre under the window
  const falu = new THREE.MeshStandardMaterial({ color: C.falu, roughness: 0.55 })
  const ochre = new THREE.MeshStandardMaterial({ color: C.ochre, roughness: 0.45 })
  box(3.6, 0.62, 0.55, falu, 0, 0.42, BZ + 0.42)
  box(3.7, 0.05, 0.6, ochre, 0, 0.755, BZ + 0.42)
  for (const x of [-1.6, 1.6]) box(0.05, 0.12, 0.05, skirt, x, 0.06, BZ + 0.42)
  // two identical ochre table lamps (symmetry, unlit)
  for (const x of [-1.35, 1.35]) {
    box(0.06, 0.38, 0.06, skirt, x, 0.97, BZ + 0.42)
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.26, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xf6e6c8, roughness: 0.9, side: THREE.DoubleSide }))
    shade.position.set(x, 1.24, BZ + 0.42); shade.castShadow = true; scene.add(shade)
  }

  // postcards in thin ink frames, two either side of the window
  const cardW = 1.35, cardH = 0.9
  const spots = [[-3.25, 2.75], [-3.25, 1.55], [3.25, 2.75], [3.25, 1.55]]
  cards.forEach((tex, i) => {
    const [x, y] = spots[i]
    box(cardW + 0.08, cardH + 0.08, 0.04, new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.5 }), x, y, BZ + 0.11)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(cardW, cardH), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }))
    m.position.set(x, y, BZ + 0.135); m.receiveShadow = true; scene.add(m)
  })

  // lights
  const hemi = new THREE.HemisphereLight(0xcfe0ea, 0x8a7a70, 1.4); scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff1dc, 3.2)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 40 })
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4
  scene.add(sun); scene.add(sun.target); sun.target.position.set(0, 0, 2)
  const fill = new THREE.DirectionalLight(0xfff4e8, 0.55); fill.position.set(0, 3, 12); scene.add(fill)
  const bounce = new THREE.PointLight(0xffc89a, 0.0, 14, 1.2); bounce.position.set(0, 3.8, 3.5); scene.add(bounce)

  function setTime(tt) {
    const k = ease(Math.min(1, Math.max(0, tt)))
    const elev = THREE.MathUtils.degToRad(lerp(36, 15, k))
    const azim = THREE.MathUtils.degToRad(lerp(-20, 16, tt))
    const r = 22
    sun.position.set(Math.sin(azim) * r * Math.cos(elev), Math.sin(elev) * r, BZ - Math.cos(azim) * r * Math.cos(elev))
    sun.color.copy(mixColor(0xfff0d8, 0xff9a5c, k))
    sun.intensity = lerp(4.2, 4.6, k)
    hemi.color.copy(mixColor(0xdfe8ec, 0xf0c2ae, k))
    hemi.groundColor.copy(mixColor(0x9a8a7c, 0x8a6a62, k))
    hemi.intensity = lerp(1.5, 1.25, k)
    bounce.intensity = lerp(1.2, 2.4, k)
    viewMat.color.copy(mixColor(0xffffff, 0xffc9a8, k * 0.85))
    renderer.toneMappingExposure = lerp(1.15, 1.1, k)
    render()
  }

  function resize() {
    const w = canvas.clientWidth || 800, h = canvas.clientHeight || 500
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // keep the whole back wall in frame on narrow screens (planimetric framing)
    camera.fov = w / h < 1.2 ? 52 : 34
    camera.updateProjectionMatrix(); render()
  }
  let raf = 0
  function render() { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => renderer.render(scene, camera)) }
  const ro = new ResizeObserver(resize); ro.observe(canvas)
  resize(); setTime(opts.time ?? 0.35)

  return {
    setTime, renderer, scene, camera,
    renderNow() { renderer.render(scene, camera) },
    dispose() { ro.disconnect(); renderer.dispose() },
  }
}
