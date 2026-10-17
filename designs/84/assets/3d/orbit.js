// orbit.js — design 84 live 3D asset.
// A sun built from primitives (sphere + three torus rings + four satellites),
// lit by a CC0 Poly Haven HDRI that has been graded infrared. The four
// satellites are the four current products. Transparent background, so it sits
// on top of the painted sky. Grain is done in the sun's shader (screen-space
// dither) so it matches the grainy-gradient illustrations.
//
//   import { mountOrbit } from './orbit.js'
//   const orbit = await mountOrbit(canvas, { edition: 'dawn' })
//   orbit.setEdition('nocturne'); orbit.dispose()
//
// Load it lazily (after first paint). three.js is pinned and fetched from jsDelivr.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js'

const SUN = {
  dawn:     { top: '#fff4dc', mid: '#ffb36b', bot: '#e8407e', ring: '#ffe9cf', glow: '#ff9a5c' },
  zenith:   { top: '#fffaf0', mid: '#ffe2b0', bot: '#ff7aa8', ring: '#fff6e8', glow: '#ffd7a0' },
  dusk:     { top: '#ffe0a8', mid: '#ff8a3d', bot: '#c81d5e', ring: '#ffd8b0', glow: '#ff6a3a' },
  nocturne: { top: '#f4ecff', mid: '#d9c6f2', bot: '#9a6fd0', ring: '#cfc0ff', glow: '#7d5cff' },
}
const SATS = [ // product satellites: [ring index, size, colour, phase]
  { name: 'MCP Emails', ring: 0, r: 0.12, color: '#2547e5', phase: 5.5 },
  { name: 'Fun Libs',   ring: 1, r: 0.15, color: '#ff8a3d', phase: 3.75 },
  { name: 'Toolrails',  ring: 2, r: 0.10, color: '#ffd400', phase: 2.5 },
  { name: 'Harbor',     ring: 1, r: 0.09, color: '#b9a7ff', phase: 0.9 },
]

export async function mountOrbit(canvas, opts = {}) {
  const THREE = await import(THREE_URL)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const still = !!opts.still
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: still })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0.6, 9.5)
  camera.lookAt(0, 0, 0)

  // environment: graded CC0 HDRI (equirect JPEG, 20 KB)
  const envUrl = opts.envUrl || new URL('./env-belfast-sunset-infrared.jpg', import.meta.url).href
  const envTex = await new THREE.TextureLoader().loadAsync(envUrl)
  envTex.mapping = THREE.EquirectangularReflectionMapping
  envTex.colorSpace = THREE.SRGBColorSpace
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromEquirectangular(envTex).texture

  const rig = new THREE.Group(); scene.add(rig)
  const tilt = new THREE.Group(); tilt.rotation.set(1.28, 0, -0.16); rig.add(tilt)

  // the sun: gradient + fresnel + grain dither
  const sunUni = {
    uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uBot: { value: new THREE.Color() },
    uGlow: { value: new THREE.Color() }, uTime: { value: 0 }, uGrain: { value: opts.grain ?? 0.06 },
  }
  const sunMat = new THREE.ShaderMaterial({
    uniforms: sunUni,
    vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vV;
      void main(){ vec4 wp = modelMatrix*vec4(position,1.); vP = position; vN = normalize(normalMatrix*normal);
      vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform vec3 uTop,uMid,uBot,uGlow; uniform float uTime,uGrain; varying vec3 vN; varying vec3 vP; varying vec3 vV;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        float n = h(gl_FragCoord.xy + fract(uTime)*91.) - .5;
        float t = clamp(vP.y*.5+.5 + n*uGrain*2., 0., 1.);
        vec3 c = t > .5 ? mix(uMid, uTop, (t-.5)*2.) : mix(uBot, uMid, t*2.);
        float fr = pow(1. - max(dot(normalize(vN), vec3(0.,0.,1.)), 0.), 2.5);
        c = mix(c, uGlow, fr*.55);
        c += n*uGrain*.6;
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  })
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), sunMat)
  rig.add(sun)

  // rings: thin tori + a dotted outer ring (Points)
  const radii = [1.75, 2.35, 3.2]
  const ringMat = new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.85 })
  const rings = radii.map((r, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, [0.016, 0.009, 0.006][i], 8, 256), ringMat)
    tilt.add(m); return m
  })
  const dots = new THREE.BufferGeometry(); const dp = []
  for (let i = 0; i < 360; i += 2) { const a = i * Math.PI / 180; dp.push(Math.cos(a) * 3.9, Math.sin(a) * 3.9, 0) }
  dots.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3))
  const dotMat = new THREE.PointsMaterial({ color: '#fff', size: 0.035, transparent: true, opacity: 0.7 })
  tilt.add(new THREE.Points(dots, dotMat))

  // satellites = products (glossy, env-lit)
  const sats = SATS.map(s => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(s.r, 48, 32),
      new THREE.MeshPhysicalMaterial({ color: s.color, roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.55 }))
    m.userData = s; tilt.add(m); return m
  })

  function setEdition(ed) {
    const p = SUN[ed] || SUN.dawn
    sunUni.uTop.value.set(p.top); sunUni.uMid.value.set(p.mid); sunUni.uBot.value.set(p.bot); sunUni.uGlow.value.set(p.glow)
    ringMat.color.set(p.ring); dotMat.color.set(p.ring)
  }
  setEdition(opts.edition || 'dawn')

  // spring-driven drag spin (critically-damped-ish), pointer tilt
  let spin = 0, spinV = 0.12, dragging = false, lastX = 0, tx = 0, ty = 0, cx = 0, cy = 0
  const onDown = e => { dragging = true; lastX = e.clientX; canvas.setPointerCapture?.(e.pointerId) }
  const onMove = e => {
    const r = canvas.getBoundingClientRect()
    tx = ((e.clientX - r.left) / r.width - 0.5) * 0.35; ty = ((e.clientY - r.top) / r.height - 0.5) * 0.25
    if (dragging) { spinV = (e.clientX - lastX) * 0.6; lastX = e.clientX }
  }
  const onUp = () => { dragging = false }
  canvas.addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp)
  canvas.style.touchAction = 'pan-y'

  let raf = 0, last = performance.now(), t0 = last
  function resize() {
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix()
    if (reduce || still) frame(performance.now())
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize()

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    const t = (now - t0) / 1000
    // spring the free spin back toward its idle speed
    if (!dragging) spinV += (0.12 - spinV) * (1 - Math.exp(-dt * 2.2))
    spin += spinV * dt
    sats.forEach((m, i) => {
      const s = m.userData, a = s.phase + spin * (1 + i * 0.18)
      const r = radii[s.ring]; m.position.set(Math.cos(a) * r, Math.sin(a) * r, 0)
    })
    cx += (tx - cx) * (1 - Math.exp(-dt * 6)); cy += (ty - cy) * (1 - Math.exp(-dt * 6))
    rig.rotation.y = cx; rig.rotation.x = cy
    sunUni.uTime.value = Math.floor(t * 12) / 12 // grain ticks at 12 fps, like film
    renderer.render(scene, camera)
    if (!reduce && !still) raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  if (reduce || still) frame(performance.now())

  return {
    setEdition: ed => { setEdition(ed); if (reduce || still) frame(performance.now()) },
    renderStill: () => { frame(performance.now()); return canvas.toDataURL('image/png') },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect()
      removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerdown', onDown); renderer.dispose()
    },
  }
}
