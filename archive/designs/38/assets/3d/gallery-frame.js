// gallery-frame.js — the interactive centrepiece for design 38.
// A real CC0 gilt frame (Poly Haven "Fancy Picture Frame 01", packed as gilt-frame.glb)
// hangs from a nail on a taut wire. The canvas inside is a LIVE canvas-2D generative work
// (art.js) that draws itself stroke by stroke. Interactions:
//   - drag the frame: it swings on its nail (damped pendulum; let go and it settles crooked-ish)
//   - pointer moves the museum spotlight
//   - hold (pointerdown without drag) or press "U": UV torch — the underdrawing shows
//   - double-click: hang a new work (new seed)
//
//   import { mountGalleryFrame } from './gallery-frame.js'
//   const g = await mountGalleryFrame(document.querySelector('#stage'), { series: 'filaments', hue: 168 })
//   g.setPass('uv'); g.rehang(); g.destroy()
//
// Needs an import map on the host page (three is pinned to 0.170.0):
//   <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
//     "three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
// Lazy-load this module (IntersectionObserver) — it pulls ~700 KB of three + 570 KB glb.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { compose, paint, animate, SERIES } from '../js/art.js'

const here = new URL('.', import.meta.url)

export async function mountGalleryFrame(el, opts = {}) {
  let { series = 'filaments', seed = 0x500a48, hue = 168, wall = '#164737', drawMs = 5200, glb = new URL('gilt-frame.glb', here).href } = opts
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  el.append(renderer.domElement)
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab' })

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.12
  const wallMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(wall), roughness: 0.95 })
  const wallMesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), wallMat); wallMesh.receiveShadow = true; scene.add(wallMesh)
  const hemi = new THREE.HemisphereLight(0xbfd8d0, 0x1a1410, 0.22); scene.add(hemi)

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30)
  camera.position.set(0, 0.24, 2.5); camera.lookAt(0, 0.24, 0)

  const spot = new THREE.SpotLight(0xfff1dc, 14, 10, 0.42, 0.6, 1.4)
  spot.position.set(0, 2.6, 1.8); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0004
  spot.target.position.set(0, 0.2, 0); scene.add(spot, spot.target)

  // nail + wire
  const nailY = 0.62
  const nail = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 16), new THREE.MeshStandardMaterial({ color: 0xc9b07a, metalness: 0.9, roughness: 0.3 }))
  nail.position.set(0, nailY, 0.02); nail.castShadow = true; scene.add(nail)
  const wireMat = new THREE.LineBasicMaterial({ color: 0x0d1914 })
  const wireGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  const wire = new THREE.Line(wireGeo, wireMat); scene.add(wire)

  // frame on a pivot at the nail
  const pivot = new THREE.Group(); pivot.position.set(0, nailY, 0.006); scene.add(pivot)
  const gltf = await new GLTFLoader().loadAsync(glb)
  const frame = gltf.scene
  const W = 0.86, H = 0.66 // landscape, metres
  frame.scale.set(W / 0.5398, H / 0.4003, 1.2)
  frame.position.y = -0.42
  pivot.add(frame)
  const art = document.createElement('canvas'); art.width = 1400; art.height = Math.round(1400 * H / W)
  const tex = new THREE.CanvasTexture(art); tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false
  tex.repeat.set(1 / 0.937, 1 / 0.695); tex.offset.set(-0.032 / 0.937, -0.125 / 0.695); tex.anisotropy = 8
  frame.traverse(o => {
    if (!o.isMesh) return
    o.castShadow = o.receiveShadow = true
    if (o.name.includes('canvas')) { o.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0 }) }
    else { o.material.metalness = 0.75; o.material.envMapIntensity = 2.2 }
  })
  const hooks = [new THREE.Vector3(-W * 0.36, -0.42 + H * 0.36, 0.01), new THREE.Vector3(W * 0.36, -0.42 + H * 0.36, 0.01)]

  // --- the work
  let plan, stopDraw = () => {}, pass = 'lit'
  const ctx = art.getContext('2d')
  function hangWork(newSeed = seed) {
    seed = newSeed
    plan = compose({ series, seed, hue, w: art.width, h: art.height })
    stopDraw()
    if (reduce) { paint(ctx, plan, { pass }); tex.needsUpdate = true; return }
    let live = true
    const stop = animate(art, plan, { duration: drawMs, pass, onDone: () => { live = false; tex.needsUpdate = true } })
    stopDraw = () => { stop(); live = false }
    const pump = () => { if (!live) return; tex.needsUpdate = true; requestAnimationFrame(pump) }; pump()
  }
  function setPass(p) {
    pass = p; stopDraw(); paint(ctx, plan, { pass }); tex.needsUpdate = true
    const uv = p === 'uv'
    spot.color.set(uv ? 0x7b4dff : 0xfff1dc); spot.intensity = uv ? 7 : 14
    wallMat.color.set(uv ? '#11062a' : wall); hemi.intensity = uv ? 0.08 : 0.22
    frame.traverse(o => { if (o.isMesh && o.name.includes('canvas')) o.material.emissiveIntensity = uv ? 0.85 : 0 })
  }
  hangWork()

  // --- physics: damped pendulum on the nail
  let angle = 0.05, vel = 0, dragging = false, held = 0, downAt = null
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
  const toNdc = e => { const r = renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1) }
  const wallPoint = () => { ray.setFromCamera(ndc, camera); const t = -ray.ray.origin.z / ray.ray.direction.z; return ray.ray.origin.clone().addScaledVector(ray.ray.direction, t) }
  const onMove = e => {
    toNdc(e)
    const p = wallPoint()
    spot.target.position.set(p.x * 0.6, 0.2 + (p.y - 0.2) * 0.6, 0)
    if (dragging) {
      const target = Math.atan2(p.x - pivot.position.x, pivot.position.y - p.y)
      vel = (target - angle) * 0.35
      if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) { clearTimeout(held); downAt = null; if (pass === 'uv') setPass('lit') }
    }
  }
  const onDown = e => {
    dragging = true; renderer.domElement.style.cursor = 'grabbing'; renderer.domElement.setPointerCapture(e.pointerId)
    downAt = [e.clientX, e.clientY]
    held = setTimeout(() => { if (downAt) setPass('uv') }, 260)
  }
  const onUp = () => { dragging = false; downAt = null; clearTimeout(held); renderer.domElement.style.cursor = 'grab'; if (pass === 'uv') setPass('lit') }
  const onKey = e => { if (e.key === 'u' || e.key === 'U') setPass(pass === 'uv' ? 'lit' : 'uv') }
  const onDbl = () => { series = SERIES[(SERIES.indexOf(series) + 1) % SERIES.length]; hangWork((seed * 1103515245 + 12345) >>> 8); angle += 0.25 }
  renderer.domElement.addEventListener('pointermove', onMove)
  renderer.domElement.addEventListener('pointerdown', onDown)
  renderer.domElement.addEventListener('pointerup', onUp)
  renderer.domElement.addEventListener('dblclick', onDbl)
  addEventListener('keydown', onKey)

  const resize = () => { const w = el.clientWidth, h = el.clientHeight || w * 0.75; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix() }
  const ro = new ResizeObserver(resize); ro.observe(el); resize()

  let raf, last = performance.now()
  const tick = now => {
    const dt = Math.min(0.033, (now - last) / 1000); last = now
    if (!dragging) { vel += (-9.8 / 0.42) * Math.sin(angle) * dt * dt * 0.9; vel *= 0.985 }
    angle += vel; angle = Math.max(-0.9, Math.min(0.9, angle))
    pivot.rotation.z = angle
    // wire follows the hooks
    const a = hooks[0].clone().applyMatrix4(pivot.matrixWorld), b = hooks[1].clone().applyMatrix4(pivot.matrixWorld)
    const pos = wireGeo.attributes.position; pos.setXYZ(0, a.x, a.y, 0.004); pos.setXYZ(1, 0, nailY, 0.006); pos.setXYZ(2, b.x, b.y, 0.004); pos.needsUpdate = true
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  return {
    setPass, rehang: onDbl,
    destroy() { cancelAnimationFrame(raf); stopDraw(); ro.disconnect(); removeEventListener('keydown', onKey); renderer.dispose(); renderer.domElement.remove() },
  }
}
