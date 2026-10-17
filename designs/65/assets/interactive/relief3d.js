// Relief 3D: a plaster model of a real Norwegian valley (Copernicus GLO-30 DEM),
// lit by a hard noon sun, with one falu-red road along the valley floor that
// doubles as the company timeline. three.js r160, loaded lazily from a pinned CDN.
//
//   import { mountRelief } from './relief3d.js'
//   const relief = await mountRelief(container, {
//     base: './',                 // folder holding romsdal-height.png/.json, road.json, milestones.json
//     onMilestone: (m) => {},     // hovered milestone or null
//   })
//   relief.setSun(0..1)          // sweep the sun east -> west across noon
//   relief.setProgress(0..1)     // move the camera along the road (scroll-driven drive)
//   relief.destroy()
//
// Renders on demand only (no idle animation loop), respects prefers-reduced-motion.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'

export async function mountRelief(container, opts = {}) {
  const THREE = await import(/* @vite-ignore */ THREE_URL)
  const base = opts.base ?? new URL('./', import.meta.url).href
  const [meta, road, stones, img] = await Promise.all([
    fetch(base + 'romsdal-height.json').then(r => r.json()),
    fetch(base + 'road.json').then(r => r.json()),
    fetch(base + 'milestones.json').then(r => r.json()),
    loadImage(base + 'romsdal-height.png'),
  ])

  // ---- decode the 16-bit heightmap
  const N = img.width
  const cv = document.createElement('canvas'); cv.width = cv.height = N
  const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0)
  const px = cx.getImageData(0, 0, N, N).data
  const H = new Float32Array(N * N)
  for (let i = 0; i < N * N; i++) H[i] = meta.min + ((px[i * 4] * 256 + px[i * 4 + 1]) / 65535) * (meta.max - meta.min)

  const SIZE = 10                       // model is 10 units across (30 km)
  const EXAG = 1.35
  const zScale = (SIZE / (meta.sizeKm * 1000)) * EXAG
  const heightAt = (u, v) => {         // u,v in 0..1, bilinear
    const x = Math.min(N - 1.001, Math.max(0, u * (N - 1))), y = Math.min(N - 1.001, Math.max(0, v * (N - 1)))
    const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0
    const h = (i, j) => H[j * N + i]
    return (h(x0, y0) * (1 - fx) + h(x0 + 1, y0) * fx) * (1 - fy) + (h(x0, y0 + 1) * (1 - fx) + h(x0 + 1, y0 + 1) * fx) * fy
  }
  const toWorld = (u, v, lift = 0) => new THREE.Vector3((u - 0.5) * SIZE, Math.max(heightAt(u, v), 0) * zScale + lift, (v - 0.5) * SIZE)

  // ---- renderer / scene
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.92
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' })

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)

  // ---- terrain mesh with baked vertex colours (plaster, granite, moss, snow, glacier water)
  const SEG = Math.min(N - 1, 320)
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / SIZE + 0.5, v = pos.getZ(i) / SIZE + 0.5
    pos.setY(i, Math.max(heightAt(u, v), 0) * zScale)
  }
  geo.computeVertexNormals()
  const nrm = geo.attributes.normal
  const colors = new Float32Array(pos.count * 3)
  const C = hex => new THREE.Color(hex)
  const plaster = C('#e3e0d8'), granite = C('#a5a7a6'), moss = C('#8f9878'), snow = C('#fbfaf6'), water = C('#7d9fb1'), deep = C('#3f6274')
  const tmp = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / SIZE + 0.5, v = pos.getZ(i) / SIZE + 0.5
    const h = heightAt(u, v), ny = nrm.getY(i)
    if (h <= 1.0) { tmp.copy(water).lerp(deep, Math.min(1, -h / 40 + 0.4)) }
    else {
      tmp.copy(plaster)
      tmp.lerp(granite, smooth(0.9, 0.6, ny) * 0.7)
      tmp.lerp(moss, smooth(260, 60, h) * smooth(0.82, 0.95, ny) * 0.75)
      tmp.lerp(snow, smooth(1250, 1550, h) * smooth(0.7, 0.9, ny))
    }
    colors.set([tmp.r, tmp.g, tmp.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 }))
  terrain.castShadow = terrain.receiveShadow = true
  scene.add(terrain)

  // ---- plinth: the model sits on a granite block, like a museum relief
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(SIZE, 0.5, SIZE), new THREE.MeshStandardMaterial({ color: '#39434b', roughness: 0.85 }))
  plinth.position.y = -0.26
  plinth.receiveShadow = true
  scene.add(plinth)
  // terrain skirts so the cut edge reads as solid plaster
  const skirtMat = new THREE.MeshStandardMaterial({ color: '#d9d5cc', roughness: 1, side: THREE.DoubleSide })
  for (const side of [0, 1, 2, 3]) {
    const pts = []
    for (let k = 0; k <= 200; k++) {
      const t = k / 200
      const [u, v] = side === 0 ? [t, 0] : side === 1 ? [1, t] : side === 2 ? [1 - t, 1] : [0, 1 - t]
      const p = toWorld(u, v); pts.push(p.x, p.y, p.z, p.x, 0, p.z)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const idx = []
    for (let k = 0; k < 200; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    g.setIndex(idx); g.computeVertexNormals()
    const m = new THREE.Mesh(g, skirtMat); m.castShadow = true; scene.add(m)
  }

  // ---- the road (the timeline)
  const roadPts = road.points.map(([u, v]) => toWorld(u, v, 0.035))
  const curve = new THREE.CatmullRomCurve3(roadPts, false, 'centripetal')
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 400, 0.028, 6, false), new THREE.MeshStandardMaterial({ color: '#9b2f20', roughness: 0.6 }))
  tube.castShadow = true
  scene.add(tube)

  // milestones: small snow-white posts with a falu cap
  const posts = new THREE.Group(); scene.add(posts)
  const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.34, 10)
  const capGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12)
  const postMat = new THREE.MeshStandardMaterial({ color: '#f6f3ec', roughness: 0.7 })
  const capMat = new THREE.MeshStandardMaterial({ color: '#9b2f20', roughness: 0.6 })
  const stoneObjs = stones.map((s) => {
    const p = curve.getPointAt(s.at)
    const g = new THREE.Group(); g.position.copy(p)
    const post = new THREE.Mesh(postGeo, postMat); post.position.y = 0.17; post.castShadow = true
    const cap = new THREE.Mesh(capGeo, capMat); cap.position.y = 0.36; cap.castShadow = true
    g.add(post, cap); g.userData = s; posts.add(g)
    return g
  })

  // ---- light: hard noon sun + cool sky fill
  const sun = new THREE.DirectionalLight('#fff6e6', 3.4)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 40 })
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.045
  scene.add(sun, sun.target)
  scene.add(new THREE.HemisphereLight('#c9dbe6', '#6b6258', 0.55))

  const state = { sun: opts.sun ?? 0.5, progress: opts.progress ?? 0, hover: null }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  function placeSun() {
    const a = (state.sun - 0.5) * 2.2      // azimuth swing around south
    const el = 0.92 - Math.abs(state.sun - 0.5) * 0.5
    sun.position.set(Math.sin(a) * 14 * Math.cos(el), 14 * Math.sin(el) + 2, Math.cos(a) * 14 * Math.cos(el))
  }
  function placeCamera() {
    if (opts.view) {
      // eye-level view from the valley floor: { at: 0..1 along the road, side: 1 | -1, height, fov }
      const v = opts.view, p = curve.getPointAt(v.at), tg = curve.getTangentAt(v.at)
      const side = new THREE.Vector3().crossVectors(tg, new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(v.side ?? 1)
      const eye = p.clone().addScaledVector(side, -(v.back ?? 0.9)).add(new THREE.Vector3(0, v.height ?? 0.18, 0))
      const tgt = p.clone().addScaledVector(side, 3).addScaledVector(tg, v.pan ?? 0).add(new THREE.Vector3(0, v.lookUp ?? 0.9, 0))
      camera.position.copy(eye); camera.lookAt(tgt)
      if (v.fov) { camera.fov = v.fov; camera.updateProjectionMatrix() }
      return
    }
    // a calm oblique view that eases along the road as progress grows
    const t = state.progress
    const look = curve.getPointAt(0.15 + 0.7 * t)
    const center = new THREE.Vector3(0, 0, 0).lerp(look, 0.65)
    const dist = 11 - 4.5 * t
    const az = 0.75 - 0.25 * t
    camera.position.set(center.x + Math.sin(az) * dist, 11.5 - 4.5 * t, center.z + Math.cos(az) * dist)
    camera.lookAt(center.x, 0.2, center.z)
  }
  function resize() {
    const r = container.getBoundingClientRect()
    renderer.setSize(r.width, r.height, false)
    camera.aspect = r.width / Math.max(1, r.height)
    camera.fov = opts.view?.fov ?? (camera.aspect < 0.9 ? 42 : 30)
    camera.updateProjectionMatrix()
    render()
  }
  let frame = 0
  function render() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => { placeSun(); placeCamera(); renderer.render(scene, camera); container.dispatchEvent(new CustomEvent('relief:render')) })
  }

  // ---- hover: milestones light up and report themselves
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2()
  function onMove(e) {
    const r = renderer.domElement.getBoundingClientRect()
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    if (opts.sunFollowsPointer !== false && !reduce) { state.sun = (e.clientX - r.left) / r.width }
    ray.setFromCamera(mouse, camera)
    const hit = ray.intersectObjects(posts.children, true)[0]
    const g = hit ? hit.object.parent : null
    if (g !== state.hover) {
      state.hover && state.hover.scale.setScalar(1)
      state.hover = g
      g && g.scale.setScalar(1.6)
      renderer.domElement.style.cursor = g ? 'pointer' : ''
      opts.onMilestone && opts.onMilestone(g ? { ...g.userData, screen: project(g.position) } : null)
    }
    render()
  }
  function project(p) {
    const v = p.clone(); v.y += 0.4; v.project(camera)
    const r = renderer.domElement.getBoundingClientRect()
    return { x: (v.x * 0.5 + 0.5) * r.width, y: (-v.y * 0.5 + 0.5) * r.height }
  }
  renderer.domElement.addEventListener('pointermove', onMove)
  const ro = new ResizeObserver(resize); ro.observe(container)
  resize()

  return {
    setSun(v) { state.sun = clamp01(v); render() },
    setProgress(v) { state.progress = clamp01(v); render() },
    milestones: stones,
    project: (s) => project(stoneObjs[stones.indexOf(s)].position),
    render,
    destroy() { ro.disconnect(); renderer.domElement.removeEventListener('pointermove', onMove); renderer.dispose(); renderer.domElement.remove() },
  }
}

function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
function clamp01(v) { return Math.min(1, Math.max(0, v)) }
function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src }) }
