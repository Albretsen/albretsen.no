// Rooftops: a painted, perfectly symmetrical row of zinc mansard roofs,
// rendered live in three.js with a gouache post-process, and a day/night theme.
//
//   import { mountRooftops } from './rooftops.js'
//   const roofs = await mountRooftops(canvas, { theme: 'day' })
//   roofs.setTheme('night')   // deadpan 1.4 s transition: sun sinks, windows light up
//   roofs.dispose()
//
// three.js is loaded lazily from a pinned CDN build so nothing ships before first paint.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js'

const PAL = {
  stoneDay: [0.93, 0.84, 0.70], stoneNight: [0.30, 0.29, 0.38],
  zincDay: [0.56, 0.62, 0.70], zincNight: [0.19, 0.21, 0.30],
  shadowDay: [0.36, 0.30, 0.44], shadowNight: [0.09, 0.09, 0.15],
  pot: [0.80, 0.44, 0.32], glow: [1.0, 0.72, 0.42],
}

const COMMON = /* glsl */`
  uniform float uT;          // 0 = noon, 1 = night
  uniform vec3 uSun;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec3 lightIt(vec3 base, vec3 shadowDay, vec3 shadowNight, vec3 n){
    float d = dot(normalize(n), normalize(uSun));
    float lit = step(0.12, d);                 // hard noon edge, no soft falloff
    vec3 sh = mix(shadowDay, shadowNight, uT);
    vec3 day = mix(sh * base * 1.4, base, lit);
    vec3 night = base * (0.55 + 0.25 * step(0.5, n.y));
    return mix(day, night, uT);
  }
`

const VERT = /* glsl */`
  varying vec3 vN; varying vec2 vUv; varying vec3 vW;
  void main(){
    vN = normalize(mat3(modelMatrix) * normal);
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const FACADE = /* glsl */`
  ${COMMON}
  uniform vec3 uStoneDay, uStoneNight, uShD, uShN, uGlow;
  uniform vec2 uGrid;        // columns, rows of windows
  uniform float uSeed;
  varying vec3 vN; varying vec2 vUv; varying vec3 vW;
  void main(){
    vec3 stone = mix(uStoneDay, uStoneNight, uT);
    vec3 col = lightIt(stone, uShD, uShN, vN);
    if (abs(vN.z) > 0.5) {
      vec2 g = vUv * uGrid;
      vec2 cell = floor(g); vec2 f = fract(g);
      // tall French windows with an arched head on the top floor
      float w = step(0.30, f.x) * step(f.x, 0.70) * step(0.18, f.y) * step(f.y, 0.86);
      float topRow = step(uGrid.y - 1.0, cell.y);
      vec2 a = vec2((f.x - 0.5) / 0.2, (f.y - 0.86) / 0.2);
      w = max(w, topRow * step(length(a), 1.0) * step(0.86, f.y));
      // a continuous wrought-iron balcony line on the second and fifth floors
      float bal = (step(abs(cell.y - 1.0), 0.0) + step(abs(cell.y - (uGrid.y - 2.0)), 0.0)) * step(0.14, f.y) * step(f.y, 0.22);
      float on = step(0.45, hash(cell + uSeed)) * uT;
      vec3 glass = mix(vec3(0.22, 0.24, 0.32), vec3(0.08, 0.08, 0.13), uT);
      glass = mix(glass, uGlow * (0.85 + 0.15 * hash(cell * 3.1 + uSeed)), on);
      // shutters: deep green on the day side
      float sh = (step(0.20, f.x) * step(f.x, 0.29) + step(0.71, f.x) * step(f.x, 0.80)) * step(0.18, f.y) * step(f.y, 0.86) * (1.0 - topRow);
      col = mix(col, mix(vec3(0.20, 0.33, 0.27), vec3(0.08, 0.11, 0.12), uT), sh);
      col = mix(col, glass, w);
      col = mix(col, mix(vec3(0.13, 0.11, 0.15), vec3(0.05, 0.05, 0.08), uT), bal * 0.9);
      // ground floor: shop fronts with awnings
      float shop = step(cell.y, 0.0) * step(0.1, f.x) * step(f.x, 0.9) * step(f.y, 0.78);
      col = mix(col, mix(vec3(0.28, 0.24, 0.30), uGlow * 0.9, uT * step(0.35, hash(cell + 7.0 + uSeed))), shop);
    }
    gl_FragColor = vec4(col, 1.0);
  }
`

const ZINC = /* glsl */`
  ${COMMON}
  uniform vec3 uZincDay, uZincNight, uShD, uShN;
  varying vec3 vN; varying vec2 vUv; varying vec3 vW;
  void main(){
    vec3 z = mix(uZincDay, uZincNight, uT);
    // standing seams every 0.18 world units
    float seam = smoothstep(0.0, 0.02, abs(fract(vW.x / 0.18) - 0.5) - 0.46);
    z *= 1.0 - 0.10 * seam;
    vec3 col = lightIt(z, uShD, uShN, vN);
    gl_FragColor = vec4(col, 1.0);
  }
`

const FLAT = /* glsl */`
  ${COMMON}
  uniform vec3 uDay, uNight, uShD, uShN;
  varying vec3 vN; varying vec2 vUv; varying vec3 vW;
  void main(){ gl_FragColor = vec4(lightIt(mix(uDay, uNight, uT), uShD, uShN, vN), 1.0); }
`

const SKY = /* glsl */`
  uniform float uT; uniform vec2 uRes;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    float y = vUv.y;
    vec3 dayTop = vec3(0.50, 0.63, 0.78), dayLow = vec3(0.98, 0.93, 0.86);
    vec3 dusk1 = vec3(0.12, 0.14, 0.24), dusk2 = vec3(0.45, 0.36, 0.52), dusk3 = vec3(0.95, 0.66, 0.53);
    vec3 day = mix(dayLow, dayTop, smoothstep(0.25, 1.0, y));
    vec3 night = mix(mix(dusk3, dusk2, smoothstep(0.18, 0.45, y)), dusk1, smoothstep(0.45, 1.0, y));
    vec3 col = mix(day, night, uT);
    // a single disc on the axis of symmetry: the sun sinks, the moon takes its place
    vec2 asp = vec2(uRes.x / uRes.y, 1.0);
    // the sun sinks straight down behind the roofs; the moon lowers into exactly the same spot
    vec2 ps = (vUv - vec2(0.5, mix(0.85, 0.10, uT))) * asp;
    vec2 pm = (vUv - vec2(0.5, mix(1.25, 0.85, uT))) * asp;
    float rs = length(ps), rm = length(pm);
    col += vec3(1.0, 0.85, 0.65) * 0.22 * exp(-rs * rs / 0.02);
    col = mix(col, vec3(1.0, 0.97, 0.90), 1.0 - smoothstep(0.050, 0.053, rs));
    col = mix(col, vec3(0.99, 0.90, 0.78), 1.0 - smoothstep(0.040, 0.043, rm));
    col = mix(col, vec3(0.90, 0.80, 0.70), (1.0 - smoothstep(0.040, 0.043, length(pm + vec2(0.016, -0.01)))) * 0.35);
    // stars after dark
    vec2 sp = floor(vUv * uRes / 3.0);
    col += uT * step(0.9985, hash(sp)) * smoothstep(0.45, 0.9, y) * 0.8;
    gl_FragColor = vec4(col, 1.0);
  }
`

// gouache pass: 4-quadrant Kuwahara + pigment pooling + paper tooth
const POST = /* glsl */`
  uniform sampler2D tMap; uniform vec2 uRes; uniform float uT;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  void main(){
    vec2 px = 1.0 / uRes;
    // wobble the lookup slightly: hand-painted edges
    vec2 uv = vUv + (vec2(vnoise(vUv * 90.0), vnoise(vUv * 90.0 + 7.0)) - 0.5) * px * 2.2;
    const int R = 3;
    vec3 m[4]; vec3 s[4];
    for (int k = 0; k < 4; k++) { m[k] = vec3(0.0); s[k] = vec3(0.0); }
    for (int j = -R; j <= R; j++) for (int i = -R; i <= R; i++) {
      vec3 c = texture2D(tMap, uv + vec2(float(i), float(j)) * px).rgb;
      if (i <= 0 && j <= 0) { m[0] += c; s[0] += c * c; }
      if (i >= 0 && j <= 0) { m[1] += c; s[1] += c * c; }
      if (i <= 0 && j >= 0) { m[2] += c; s[2] += c * c; }
      if (i >= 0 && j >= 0) { m[3] += c; s[3] += c * c; }
    }
    float n = float((R + 1) * (R + 1));
    vec3 col = vec3(0.0); float best = 1e9;
    for (int k = 0; k < 4; k++) {
      vec3 mu = m[k] / n; vec3 v = abs(s[k] / n - mu * mu);
      float sv = v.r + v.g + v.b;
      if (sv < best) { best = sv; col = mu; }
    }
    // pigment pooling at value edges
    float l = dot(col, vec3(0.299, 0.587, 0.114));
    float lb = dot(texture2D(tMap, uv + vec2(2.0, 2.0) * px).rgb + texture2D(tMap, uv - vec2(2.0, 2.0) * px).rgb, vec3(0.15, 0.29, 0.06));
    col *= 1.0 - clamp((lb - l) * 1.6, 0.0, 0.18);
    // paper tooth and uneven wash
    float tooth = hash(floor(vUv * uRes)) - 0.5;
    float wash = vnoise(vUv * vec2(6.0, 4.0)) - 0.5;
    col *= 1.0 + tooth * 0.05 * (1.2 - l) + wash * 0.06;
    // lift blacks to palm-black, never pure black
    col = mix(vec3(0.13, 0.11, 0.15), vec3(1.0), col);
    gl_FragColor = vec4(col, 1.0);
  }
`

export async function mountRooftops(canvas, opts = {}) {
  const THREE = await import(THREE_URL)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' })
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  renderer.setPixelRatio(dpr)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 100)
  camera.position.set(0, 2.4, 22)
  camera.lookAt(0, 3.4, 0)

  const U = { uT: { value: opts.theme === 'night' ? 1 : 0 }, uSun: { value: new THREE.Vector3(-0.55, 0.75, 0.55) } }
  const v3 = (a) => new THREE.Vector3(...a)
  const sh = { uShD: { value: v3(PAL.shadowDay) }, uShN: { value: v3(PAL.shadowNight) } }
  const mat = (frag, extra) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms: { ...U, ...sh, ...extra } })

  // sky (screen-filling quad drawn first)
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }',
    fragmentShader: SKY, uniforms: { uT: U.uT, uRes: { value: new THREE.Vector2(1, 1) } }, depthWrite: false,
  })
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat)
  sky.frustumCulled = false
  sky.renderOrder = -1
  scene.add(sky)

  const zinc = mat(ZINC, { uZincDay: { value: v3(PAL.zincDay) }, uZincNight: { value: v3(PAL.zincNight) } })
  const potMat = mat(FLAT, { uDay: { value: v3(PAL.pot) }, uNight: { value: v3([0.30, 0.18, 0.20]) } })
  const stoneFlat = mat(FLAT, { uDay: { value: v3(PAL.stoneDay) }, uNight: { value: v3(PAL.stoneNight) } })

  // mansard roof: a trapezoid prism, steep lower slope, flat zinc top
  function mansard(w, d, h) {
    const s = new THREE.Shape()
    const inset = h * 0.38
    s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(d / 2 - inset, h); s.lineTo(-d / 2 + inset, h); s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false })
    g.rotateY(Math.PI / 2)
    g.translate(-w / 2, 0, 0)
    return g
  }

  function building(x, w, floors, z, seed, back = false) {
    const fh = 0.62
    const h = floors * fh
    const g = new THREE.Group()
    const fac = mat(FACADE, {
      uStoneDay: { value: v3(back ? [0.82, 0.74, 0.70] : (Math.round(seed) % 2 ? [0.95, 0.85, 0.72] : [0.92, 0.80, 0.70])) }, uStoneNight: { value: v3(PAL.stoneNight) },
      uGlow: { value: v3(PAL.glow) }, uGrid: { value: new THREE.Vector2(Math.round(w / 0.62), floors) }, uSeed: { value: seed },
    })
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), fac)
    body.position.set(0, h / 2, 0)
    g.add(body)
    // cornice
    const cor = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.08, 2.6), stoneFlat)
    cor.position.set(0, h + 0.04, 0)
    g.add(cor)
    const rh = 0.95
    const roof = new THREE.Mesh(mansard(w, 2.4, rh), zinc)
    roof.position.set(0, h + 0.08, 0)
    g.add(roof)
    // arched dormers, evenly spaced and centred
    const nd = Math.max(1, Math.round(w / 0.75))
    for (let i = 0; i < nd; i++) {
      const dx = -w / 2 + (i + 0.5) * (w / nd)
      const dm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.3), stoneFlat)
      dm.position.set(dx, h + 0.38, 1.0)
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.3, 16, 1, false, 0, Math.PI), zinc)
      cap.rotation.set(Math.PI / 2, 0, Math.PI / 2)
      cap.position.set(dx, h + 0.55, 1.0)
      g.add(dm, cap)
    }
    // chimney stacks with terracotta pots at both ends (symmetry, always)
    for (const sx of [-1, 1]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.7, 0.3), stoneFlat)
      st.position.set(sx * (w / 2 - 0.3), h + rh + 0.2, 0)
      g.add(st)
      for (let k = 0; k < 3; k++) {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.16, 8), potMat)
        pot.position.set(sx * (w / 2 - 0.3) + (k - 1) * 0.1, h + rh + 0.63, 0)
        g.add(pot)
      }
    }
    g.position.set(x, 0, z)
    return g
  }

  // front row: mirrored widths and heights around the axis
  const front = [[1.6, 5], [2.0, 6], [3.0, 7], [2.0, 6], [1.6, 5]]
  let x = -front.reduce((s, b) => s + b[0], 0) / 2
  front.forEach(([w, f], i) => { scene.add(building(x + w / 2, w, f, 0, i * 3.7 + 1)); x += w })
  // pavement
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), mat(FLAT, { uDay: { value: v3([0.83, 0.74, 0.66]) }, uNight: { value: v3([0.20, 0.18, 0.25]) } }))
  ground.rotation.x = -Math.PI / 2
  ground.position.z = 5
  scene.add(ground)
  const back = [[2.6, 8], [2.6, 8], [2.6, 8]]
  x = -back.reduce((s, b) => s + b[0], 0) / 2
  back.forEach(([w, f], i) => { scene.add(building(x + w / 2, w, f, -5, i * 5.3 + 9, true)); x += w })

  // post-processing
  const rt = new THREE.WebGLRenderTarget(1, 1, { samples: 0 })
  const postMat = new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: POST, uniforms: { tMap: { value: rt.texture }, uRes: { value: new THREE.Vector2(1, 1) }, uT: U.uT },
  })
  const postScene = new THREE.Scene()
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat)
  quad.frustumCulled = false
  postScene.add(quad)
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  function resize() {
    const w = canvas.clientWidth || 800
    const h = canvas.clientHeight || 500
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // keep the whole symmetrical row in frame on narrow screens
    camera.position.z = Math.max(22, 22 * (1.5 / camera.aspect))
    camera.updateProjectionMatrix()
    rt.setSize(Math.floor(w * dpr), Math.floor(h * dpr))
    postMat.uniforms.uRes.value.set(w * dpr, h * dpr)
    skyMat.uniforms.uRes.value.set(w * dpr, h * dpr)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  // pointer: a small, strictly horizontal dolly (never tilts: symmetry is the point)
  let px = 0
  let tx = 0
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect()
    tx = ((e.clientX - r.left) / r.width - 0.5) * 1.2
  }
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerleave', () => { tx = 0 })

  let target = U.uT.value
  let from = target
  let t0 = 0
  const DUR = reduce ? 0 : 1400
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  let raf = 0
  let visible = true
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop() })
  io.observe(canvas)

  function frame(now) {
    if (DUR && from !== target) {
      const k = Math.min(1, (now - t0) / DUR)
      U.uT.value = from + (target - from) * ease(k)
      if (k >= 1) from = target
    } else U.uT.value = target
    // the sun's light swings lower as night comes
    U.uSun.value.set(-0.55, 0.75 - 0.55 * U.uT.value, 0.55)
    px += (tx - px) * (reduce ? 1 : 0.06)
    camera.position.x = px
    camera.lookAt(px * 0.4, 3.4, 0)
    renderer.setRenderTarget(rt)
    renderer.render(scene, camera)
    renderer.setRenderTarget(null)
    renderer.render(postScene, postCam)
  }
  function loop(now = performance.now()) {
    cancelAnimationFrame(raf)
    frame(now)
    if (visible) raf = requestAnimationFrame(loop)
  }
  loop()

  return {
    setTheme(name) {
      from = U.uT.value
      target = name === 'night' ? 1 : 0
      t0 = performance.now()
      loop()
    },
    get theme() { return target ? 'night' : 'day' },
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect(); io.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      renderer.dispose(); rt.dispose()
    },
  }
}
