// Cover Story: the interactive hero for design 59.
// A magazine in three.js. Stickers sit proud of the cover; tilt the pointer (or the phone)
// and they parallax. Click, press Enter or drag the cover to open it. The stickers scatter,
// the cover curls back on its spine, and a dispersive glass crystal rises out of the
// inside spread. A CC0 magnifying glass (Poly Haven) follows the pointer across the cover.
//
// Usage (needs an import map for "three" and "three/addons/", see demo.html):
//   import { mountCoverScene } from './three/cover-scene.js'
//   const scene = await mountCoverScene(el, { open: 0 })
//   scene.setOpen(1)  // animate open;  scene.toggle();  scene.enableGyro();  scene.destroy()
//
// Options: open (0..1 start state), magnifier (bool, default true), crystal (bool, default true),
//          interactive (bool), still (bool: no idle motion, start fully in the given state; used to bake images), base (asset URL root)

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const INK = 0x0f0b22, PAPER = 0xf3f2fb, VIOLET = 0x6c35ec, GLOW = 0xbab0ff

export async function mountCoverScene(container, opts = {}) {
  const base = opts.base || new URL('..', import.meta.url).href // .../assets/
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const W = 3, H = 4, SEG = 56, THICK = 0.09

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opts.still })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 0.92
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'pan-y', cursor: 'grab' })

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.55

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
  camera.position.set(0, -0.4, 14.5)

  const key = new THREE.DirectionalLight(0xffffff, 1.5)
  key.position.set(-4, 5, 9)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 })
  key.shadow.radius = 6
  key.shadow.bias = -0.0005
  scene.add(key)
  const rim = new THREE.PointLight(GLOW, 14, 10)
  rim.position.set(2, 1.5, 3)
  scene.add(rim)

  const loader = new THREE.TextureLoader()
  const tex = (url) => new Promise((res) => loader.load(base + url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); res(t)
  }))
  const [coverTex, insideTex] = await Promise.all([tex('hero/cover-bare-1600.webp'), tex('hero/inside-spread-2400.webp')])
  const stickerTex = await Promise.all([
    // [file, width, x, y, rotation, lift]  (cover space: x 0..3 from the spine, y -2..2)
    ['stickers/burst-installs.svg', 0.75, 2.475, 0.335, -0.157, 0.16],
    ['stickers/seal-mrr.svg', 0.63, 2.571, -0.956, 0.14, 0.22],
    ['stickers/tape-built-at-17.svg', 0.9, 2.13, -0.355, 0.105, 0.09],
    ['stickers/stamp-since-2016.svg', 0.39, 2.655, 0.905, -0.21, 0.12],
    ['stickers/barcode.svg', 0.4, 2.69, -1.68, 0, 0.03],
  ].map(async ([url, w, x, y, rot, z]) => {
    const img = new Image(); img.src = base + url; await img.decode()
    const c = document.createElement('canvas'); const s = 512 / Math.max(img.width, img.height)
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
    return { t, w, h: w * c.height / c.width, x, y, rot, z }
  }))

  // ---------- magazine ----------
  const mag = new THREE.Group() // tilt group
  const book = new THREE.Group() // slides so the closed cover / open spread is centred
  mag.add(book); scene.add(mag)

  const paperMat = new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.9 })
  const block = new THREE.Mesh(new THREE.BoxGeometry(W, H, THICK), [paperMat, new THREE.MeshStandardMaterial({ color: INK }), paperMat, paperMat, paperMat, paperMat])
  block.position.set(W / 2, 0, -THICK / 2); block.castShadow = true; block.receiveShadow = true
  book.add(block)

  // right page of the inside spread (sits on top of the block)
  const rightTex = insideTex.clone(); rightTex.needsUpdate = true
  rightTex.repeat.set(0.5, 1); rightTex.offset.set(0.5, 0)
  const right = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: rightTex, roughness: 0.7, envMapIntensity: 0.3 }))
  right.position.set(W / 2, 0, 0.002); right.receiveShadow = true
  book.add(right)

  // the cover: two skins over one bending strip (front = cover, back = left page of the spread)
  const front = new THREE.PlaneGeometry(W, H, SEG, 1); front.translate(W / 2, 0, 0)
  const back = front.clone()
  const uvB = back.attributes.uv
  for (let i = 0; i < uvB.count; i++) uvB.setX(i, 0.5 - uvB.getX(i) * 0.5)
  const coverMat = new THREE.MeshPhysicalMaterial({ map: coverTex, roughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.4, envMapIntensity: 0.12, side: THREE.FrontSide })
  const backMat = new THREE.MeshStandardMaterial({ map: insideTex, roughness: 0.7, envMapIntensity: 0.3, side: THREE.BackSide })
  const coverMesh = new THREE.Mesh(front, coverMat); coverMesh.castShadow = true
  const backMesh = new THREE.Mesh(back, backMat); backMesh.receiveShadow = true
  const coverPivot = new THREE.Group(); coverPivot.position.z = 0.012
  coverPivot.add(coverMesh, backMesh); book.add(coverPivot)
  const rest = Float32Array.from(front.attributes.position.array)

  function bend(t) {
    // integrate a curling strip: the outer edge lags the spine, so the page curls as it turns
    const e = t, curl = 1.05 * Math.sin(Math.PI * e)
    const cols = SEG + 1, ds = W / SEG
    const xs = new Float32Array(cols), zs = new Float32Array(cols)
    let x = 0, z = 0
    for (let i = 0; i < cols; i++) {
      xs[i] = x; zs[i] = z
      const s = (i + 0.5) / SEG
      const th = Math.PI * e - curl * s * s
      x += Math.cos(th) * ds; z += Math.sin(th) * ds
    }
    for (const g of [front, back]) {
      const p = g.attributes.position
      for (let v = 0; v < p.count; v++) {
        const col = Math.round(rest[v * 3] / ds)
        p.setXYZ(v, xs[col], rest[v * 3 + 1], zs[col] + 0.0001 * col)
      }
      p.needsUpdate = true; g.computeVertexNormals()
    }
  }

  // stickers stand proud of the cover; they scatter when it opens
  const stickers = stickerTex.map((s, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s.w, s.h), new THREE.MeshStandardMaterial({ map: s.t, transparent: true, roughness: 0.4, envMapIntensity: 0.4, alphaTest: 0.02 }))
    m.position.set(s.x, s.y, 0.03 + s.z); m.rotation.z = s.rot; m.castShadow = true
    m.userData = { home: m.position.clone(), rot: s.rot, dir: new THREE.Vector3(Math.cos(i * 2.4) * 3, Math.sin(i * 2.4) * 2.4 + 1, 2.5 + i * 0.3) }
    book.add(m); return m
  })

  // ---------- crystal ----------
  let crystal, halo
  if (opts.crystal !== false) {
    const g = new THREE.OctahedronGeometry(0.7, 0); g.scale(0.82, 1.35, 0.82)
    const facets = new THREE.IcosahedronGeometry(0.45, 0); facets.translate(0.42, -0.45, 0.15)
    crystal = new THREE.Group()
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xe9e4ff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 1.4, ior: 2.1,
      dispersion: 6, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 700],
      clearcoat: 1, envMapIntensity: 1.6, attenuationColor: new THREE.Color(GLOW), attenuationDistance: 2.6,
    })
    const a = new THREE.Mesh(g, glass); a.castShadow = true
    const b = new THREE.Mesh(facets, glass); b.rotation.set(0.4, 0.8, 0.2)
    crystal.add(a, b)
    const c = document.createElement('canvas'); c.width = c.height = 256
    const cx = c.getContext('2d'); const grd = cx.createRadialGradient(128, 128, 0, 128, 128, 128)
    grd.addColorStop(0, 'rgba(186,176,255,.85)'); grd.addColorStop(0.35, 'rgba(108,53,236,.35)'); grd.addColorStop(1, 'rgba(108,53,236,0)')
    cx.fillStyle = grd; cx.fillRect(0, 0, 256, 256)
    halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
    halo.scale.set(3.4, 3.4, 1)
    crystal.add(halo)
    crystal.position.set(0, 0, 1.2); crystal.scale.setScalar(0.001)
    mag.add(crystal)
  }

  // ---------- magnifier (CC0, Poly Haven "Magnifying Glass 01") ----------
  let lens, lensMesh
  const lensMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: coverTex }, center: { value: new THREE.Vector2(0.5, 0.5) }, onCover: { value: 1 },
      scr: { value: new THREE.Vector2() }, rad: { value: 100 }, span: { value: new THREE.Vector2(0.08, 0.06) } },
    vertexShader: `void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      uniform sampler2D map; uniform vec2 center, scr, span; uniform float rad, onCover;
      void main(){
        vec2 d = (gl_FragCoord.xy - scr) / rad;           // -1..1 across the lens
        float r = length(d);
        vec2 bulge = d * (0.86 + 0.14 * r * r);           // barrel distortion toward the rim
        vec2 uv = center + bulge * span;
        vec3 paper = vec3(0.896, 0.889, 0.965);
        vec3 c = (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1. || onCover < .5) ? paper : texture2D(map, uv).rgb;
        c *= 1. - smoothstep(.72, 1.05, r) * .35;         // rim shade
        c += vec3(.75,.7,1.) * smoothstep(.2,.0,length(d - vec2(-.42,.46))) * .55; // highlight
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  })
  if (opts.magnifier !== false) {
    try {
      const gltf = await new GLTFLoader().loadAsync(base + 'three/magnifier.glb')
      lens = gltf.scene
      const box = new THREE.Box3().setFromObject(lens); const size = box.getSize(new THREE.Vector3())
      const sc = 2.3 / Math.max(size.x, size.y, size.z)
      lens.scale.setScalar(sc)
      const ctr = box.getCenter(new THREE.Vector3()).multiplyScalar(sc)
      const holder = new THREE.Group(); lens.position.sub(ctr); holder.add(lens)
      // The lens is a real magnifier: it samples the cover texture under it at 2.2x zoom.
      lens.traverse((o) => {
        if (!o.isMesh) return
        o.castShadow = true
        if (o.material.transmission) {
          o.geometry.computeBoundingSphere()
          o.material = lensMat; lensMesh = o; o.castShadow = false
        }
      })
      // face the camera: the model stands upright, lens up
      holder.rotation.set(0.25, -0.35, -0.5)
      lens = holder; lens.position.set(1.6, -1.2, 1.6); scene.add(lens)
    } catch (e) { console.warn('magnifier failed to load', e) }
  }

  // contact shadow catcher
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.22 }))
  ground.position.z = -0.35; ground.receiveShadow = true
  mag.add(ground)

  // ---------- state + interaction ----------
  let open = opts.open ?? 0, target = open
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 }
  const pointer = new THREE.Vector2(0.4, -0.3)
  const el = renderer.domElement
  el.tabIndex = 0
  el.setAttribute('role', 'button')
  el.setAttribute('aria-label', 'Magazine cover. Press Enter or click to open it.')

  const onMove = (e) => {
    const r = el.getBoundingClientRect()
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1)
    pointer.set(nx, ny); tilt.ty = nx * 0.32; tilt.tx = -ny * 0.22
    if (drag) { target = THREE.MathUtils.clamp(drag.open + (drag.x - e.clientX) / (r.width * 0.45), 0, 1); drag.moved = true }
  }
  let drag = null
  const onDown = (e) => { drag = { x: e.clientX, open: target, moved: false }; el.style.cursor = 'grabbing' }
  const onUp = () => { if (drag) { if (!drag.moved) target = target > 0.5 ? 0 : 1; else target = target > 0.5 ? 1 : 0 } drag = null; el.style.cursor = 'grab' }
  const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); target = target > 0.5 ? 0 : 1 } }
  const onLeave = () => { tilt.tx = tilt.ty = 0 }
  if (opts.interactive !== false) {
    el.addEventListener('pointermove', onMove); el.addEventListener('pointerdown', onDown)
    addEventListener('pointerup', onUp); el.addEventListener('keydown', onKey); el.addEventListener('pointerleave', onLeave)
  }
  const onOrient = (e) => { if (e.gamma == null) return; tilt.ty = THREE.MathUtils.clamp(e.gamma / 45, -1, 1) * 0.32; tilt.tx = THREE.MathUtils.clamp((e.beta - 40) / 45, -1, 1) * 0.22 }
  async function enableGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      try { if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return false } catch { return false }
    }
    addEventListener('deviceorientation', onOrient); return true
  }

  function resize() {
    const w = container.clientWidth || 800, h = container.clientHeight || 600
    renderer.setSize(w, h, false); camera.aspect = w / h
    // fit the open spread (6 units wide) or closed cover, whichever needs more room
    const needW = 7.2, needH = 5.6
    const dist = Math.max(needH / 2 / Math.tan((camera.fov * Math.PI) / 360), needW / 2 / Math.tan((camera.fov * Math.PI) / 360) / camera.aspect)
    camera.position.z = dist + 1.2
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize()

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.6), hit = new THREE.Vector3()
  const clock = new THREE.Clock()
  let visible = true, raf = 0, snap = 0
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) loop() })
  io.observe(container)

  function frame(dt, t) {
    const k = reduce || snap ? 1 : 1 - Math.pow(0.0025, dt)
    open += (target - open) * (reduce ? 1 : 1 - Math.pow(0.04, dt))
    const e = ease(THREE.MathUtils.clamp(open, 0, 1))
    bend(e)
    book.position.x = -W / 2 * (1 - e)
    tilt.x += (tilt.tx - tilt.x) * k; tilt.y += (tilt.ty - tilt.y) * k
    const idle = reduce || opts.still ? 0 : Math.sin(t * 0.6) * 0.03
    mag.rotation.set(-0.12 + tilt.x + idle, tilt.y - 0.18 * (1 - e) + idle * 0.5, 0.035 * (1 - e))
    // stickers: parallax lift with tilt, scatter as the cover opens
    const sc = THREE.MathUtils.smoothstep(open, 0, 0.35)
    stickers.forEach((m, i) => {
      const d = m.userData
      m.position.copy(d.home).addScaledVector(d.dir, sc)
      m.position.z += Math.abs(tilt.y) * 0.25 * (i % 2 ? 1 : 0.6)
      m.rotation.z = d.rot + sc * (i % 2 ? 1.2 : -1.4)
      m.material.opacity = 1 - sc; m.visible = sc < 0.999
    })
    if (crystal) {
      const c = THREE.MathUtils.smoothstep(open, 0.55, 1)
      crystal.scale.setScalar(Math.max(0.001, c))
      crystal.position.set(0.0, 0.1 + Math.sin(t * 1.1) * 0.08 * (reduce ? 0 : 1), 1.3 + c * 0.6)
      crystal.rotation.y = (opts.still ? 0.6 : t * 0.45) + tilt.y * 2
      crystal.rotation.x = tilt.x * 1.5
      if (halo) halo.material.opacity = c * (0.75 + Math.sin(t * 2.2) * 0.15)
    }
    if (lens && lensMesh) {
      // where is the lens on screen, and which part of the cover is under it?
      const bs = lensMesh.geometry.boundingSphere
      const cw = bs.center.clone().applyMatrix4(lensMesh.matrixWorld)
      const edge = bs.center.clone().add(new THREE.Vector3(bs.radius * 0.92, 0, 0)).applyMatrix4(lensMesh.matrixWorld)
      const sc = cw.clone().project(camera), se = edge.clone().project(camera)
      const size = renderer.getDrawingBufferSize(new THREE.Vector2())
      lensMat.uniforms.scr.value.set((sc.x * 0.5 + 0.5) * size.x, (sc.y * 0.5 + 0.5) * size.y)
      lensMat.uniforms.rad.value = Math.max(8, Math.hypot((se.x - sc.x) * 0.5 * size.x, (se.y - sc.y) * 0.5 * size.y))
      ray.setFromCamera(new THREE.Vector2(sc.x, sc.y), camera)
      const hits = ray.intersectObject(coverMesh)
      lensMat.uniforms.onCover.value = hits.length ? 1 : 0
      if (hits.length) lensMat.uniforms.center.value.copy(hits[0].uv)
      const rw = cw.distanceTo(edge) / 2.2
      lensMat.uniforms.span.value.set(rw / W, rw / H)
    }
    if (lens) {
      ray.setFromCamera(pointer, camera); ray.ray.intersectPlane(plane, hit)
      const show = 1 - THREE.MathUtils.smoothstep(open, 0, 0.3)
      const disc = lensMesh ? lensMesh.geometry.boundingSphere.center.clone().applyMatrix4(lensMesh.matrixWorld).sub(lens.position) : new THREE.Vector3(-0.5, 0.7, 0)
      lens.position.lerp(new THREE.Vector3(hit.x - disc.x, hit.y - disc.y, 1.6 + (1 - show) * 6), k)
      lens.rotation.z = -0.5 + pointer.x * 0.25
      lens.visible = show > 0.01
    }
    renderer.render(scene, camera)
    if (snap) snap--
  }
  function loop() {
    raf = requestAnimationFrame(loop)
    if (!visible) { cancelAnimationFrame(raf); raf = 0; return }
    frame(Math.min(clock.getDelta(), 0.05), clock.elapsedTime)
  }
  if (opts.still) open = target
  loop()

  return {
    get open() { return target },
    setOpen(v) { target = THREE.MathUtils.clamp(v, 0, 1) },
    toggle() { target = target > 0.5 ? 0 : 1 },
    setPointer(x, y, immediate) { pointer.set(x, y); tilt.ty = x * 0.32; tilt.tx = -y * 0.22; if (immediate) snap = 3 },
    enableGyro,
    render(t = 1.3) { snap = 3; frame(1, t); frame(1, t); frame(1, t) },
    canvas: el,
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      removeEventListener('pointerup', onUp); removeEventListener('deviceorientation', onOrient)
      renderer.dispose(); pmrem.dispose(); el.remove()
    },
  }
}
