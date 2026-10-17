// Drift Stone: a CC0 Poly Haven rock, shaded like a 1970s airbrush painting.
// Usage:
//   import { mountDriftStone } from './assets/3d/drift-stone.js'
//   const stone = await mountDriftStone(canvas, { glb: 'assets/3d/drift-stone.glb' })
//   stone.boot(1)      // 0..1: scan-line "power on" reveal (drive it from GSAP)
//   stone.setDusk(0.4) // 0 = first light (ochre underlight), 1 = blue hour (verdigris)
//   stone.dispose()
// Needs an import map for "three" and "three/addons/" (three@0.160.0), see 3d/demo.html.
// Background is transparent; the canvas is meant to float over the hero painting.

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const vert = /* glsl */`
  varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec3 vObj;
  void main(){
    vUv = uv; vObj = position;
    vec4 w = modelMatrix * vec4(position,1.0);
    vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`

const frag = /* glsl */`
  precision highp float;
  uniform sampler2D uNor; uniform sampler2D uAO;
  uniform float uNorAmt; uniform float uBoot; uniform float uDusk; uniform float uTime;
  uniform vec3 uCam; uniform float uMinY; uniform float uMaxY;
  varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec3 vObj;

  // OKLab-ish palette, pre-converted to linear sRGB
  vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
  const vec3 night = vec3(0.0001, 0.0037, 0.0060);
  const vec3 umber = vec3(0.0343, 0.0103, 0.0045);
  const vec3 terra = vec3(0.5110, 0.1274, 0.0637);
  const vec3 ochre = vec3(0.8126, 0.4049, 0.1063);
  const vec3 sand = vec3(0.8585, 0.7158, 0.5171);
  const vec3 mauve = vec3(0.2631, 0.1246, 0.2157);
  const vec3 verd = vec3(0.0637, 0.3444, 0.2760);
  const vec3 phos = vec3(0.2082, 0.8666, 0.7085);

  mat3 tbn(vec3 N, vec3 p, vec2 uv){
    vec3 dp1 = dFdx(p), dp2 = dFdy(p); vec2 du1 = dFdx(uv), du2 = dFdy(uv);
    vec3 T = normalize(dp1*du2.y - dp2*du1.y); vec3 B = normalize(cross(N,T));
    return mat3(T,B,N);
  }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }

  void main(){
    vec3 N = normalize(vN);
    vec3 tn = texture2D(uNor, vUv).xyz*2.0-1.0;
    N = normalize(mix(N, tbn(N, vW, vUv) * tn, uNorAmt));
    float ao = texture2D(uAO, vUv).r;
    vec3 V = normalize(uCam - vW);

    // key: low sun to the right, slightly behind (it sits on the horizon);
    // fill: sky from above; bounce: warm desert floor from below.
    vec3 Lk = normalize(vec3(0.85, 0.05 + 0.2*uDusk, -0.45));
    vec3 Lf = normalize(vec3(-0.3, 1.0, 0.3));
    vec3 Lb = normalize(vec3(0.0, -1.0, 0.6));
    float k = max(dot(N, Lk), 0.0);
    float f = dot(N, Lf)*0.5+0.5;
    float bnc = max(dot(N, Lb), 0.0);
    // airbrush: a smooth painted ramp rather than physically based light
    float t = smoothstep(0.05, 0.85, k);
    vec3 keyCol = mix(terra, ochre, smoothstep(0.2, 0.8, t));
    keyCol = mix(keyCol, sand, smoothstep(0.75, 1.0, t));
    keyCol = mix(keyCol, mix(mauve*1.2, phos*0.8, t), uDusk*0.85);
    float hh = clamp((vObj.y - uMinY) / (uMaxY - uMinY), 0.0, 1.0);
    // airbrushed vertical gradient in the shadow side: warm floor glow low, cool sky high
    vec3 lowCol = mix(terra*0.30, mauve*0.30, uDusk);
    vec3 highCol = mix(verd*0.26, verd*0.40, uDusk) + mauve*0.08;
    vec3 shadowCol = mix(lowCol, highCol, smoothstep(0.0, 1.0, hh)) * (0.6 + 0.6*f);
    vec3 col = mix(shadowCol, keyCol, t) * (0.45 + 0.55*ao);
    col += mix(terra*0.12, mauve*0.10, uDusk) * bnc * ao;
    // rim (fresnel), the polished edge of retro-future renders
    float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    col += mix(mix(verd*0.5, ochre*0.7, t), phos*0.7, uDusk) * fr * 0.8;

    // scan-line boot reveal along height
    float h = (vObj.y - uMinY) / (uMaxY - uMinY);
    float front = uBoot * 1.15;
    float shown = smoothstep(1.0 - front - 0.002, 1.0 - front + 0.002, h);   // raster: top first
    float edge = exp(-abs(h - (1.0 - front)) * 90.0) * step(uBoot, 0.999);
    float scan = 0.85 + 0.15 * step(0.5, fract(gl_FragCoord.y * 0.5));
    col *= mix(scan, 1.0, smoothstep(0.85, 1.0, uBoot));
    col += phos * edge * 1.6;
    float a = max(shown, edge);
    if (a < 0.01) discard;

    // grain so it sits inside the painting
    col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.02;
    gl_FragColor = vec4(pow(max(col, 0.0), vec3(1.0/2.2)) * a, a);
  }`

function closeCap(g, k) {
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv
  const n = pos.count, idx = g.index.array
  const P = new Float32Array(n * 6), N = new Float32Array(n * 6), U = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) {
    P.set([pos.getX(i), pos.getY(i), pos.getZ(i)], i * 3)
    P.set([pos.getX(i), -pos.getY(i) * k, pos.getZ(i)], (n + i) * 3)
    N.set([nor.getX(i), nor.getY(i), nor.getZ(i)], i * 3)
    N.set([nor.getX(i), -nor.getY(i) / k, nor.getZ(i)], (n + i) * 3)
    U.set([uv.getX(i), uv.getY(i)], i * 2); U.set([1 - uv.getX(i), uv.getY(i)], (n + i) * 2)
  }
  const I = new Uint32Array(idx.length * 2)
  I.set(idx, 0)
  for (let t = 0; t < idx.length; t += 3) { // flipped winding for the mirror
    I[idx.length + t] = idx[t] + n; I[idx.length + t + 1] = idx[t + 2] + n; I[idx.length + t + 2] = idx[t + 1] + n
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(P, 3))
  out.setAttribute('normal', new THREE.BufferAttribute(N, 3))
  out.setAttribute('uv', new THREE.BufferAttribute(U, 2))
  out.setIndex(new THREE.BufferAttribute(I, 1))
  out.normalizeNormals()
  return out
}

export async function mountDriftStone(canvas, opts = {}) {
  const glbUrl = opts.glb || new URL('./drift-stone.glb', import.meta.url).href
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: !!opts.preserve })
  renderer.setPixelRatio(Math.min(devicePixelRatio, opts.maxDpr || 2))
  renderer.setClearColor(0x000000, 0)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(opts.fov || 28, 1, 0.01, 50)
  camera.position.set(0, 0.0, opts.distance || 3.0)
  camera.lookAt(0, 0.0, 0)

  const gltf = await new GLTFLoader().loadAsync(glbUrl)
  const mesh = gltf.scene.getObjectByProperty('type', 'Mesh')
  const src = mesh.material
  // Optional: close an open-based scan with a squashed mirror (not needed for rock_09).
  if (opts.under) mesh.geometry = closeCap(mesh.geometry, opts.under)
  // rock_09 lies on its back: stand it up (long axis vertical, weathered face to camera)
  mesh.geometry.rotateX(opts.standUp ?? -Math.PI / 2)
  mesh.geometry.computeBoundingBox()
  let bb = mesh.geometry.boundingBox
  const centre = bb.getCenter(new THREE.Vector3())
  const size = bb.getSize(new THREE.Vector3())
  mesh.geometry.translate(-centre.x, -centre.y, -centre.z)
  mesh.geometry.scale(1 / size.y, 1 / size.y, 1 / size.y) // normalise to 1 unit tall
  mesh.geometry.computeBoundingBox(); bb = mesh.geometry.boundingBox
  const uniforms = {
    uNor: { value: src.normalMap }, uAO: { value: src.aoMap },
    uNorAmt: { value: opts.normal ?? 0.6 }, uBoot: { value: opts.boot ?? 1 }, uDusk: { value: opts.dusk ?? 0 }, uTime: { value: 0 },
    uCam: { value: camera.position }, uMinY: { value: bb.min.y }, uMaxY: { value: bb.max.y },
  }
  mesh.material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, extensions: { derivatives: true } })
  const pivot = new THREE.Group(); pivot.add(mesh); scene.add(pivot)
  pivot.rotation.set(0.12, opts.rotY ?? 0.6, -0.1)

  let ready = false
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, t0 = performance.now()
  const onMove = (e) => { tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5) }
  if (opts.interactive !== false) addEventListener('pointermove', onMove, { passive: true })
  const resize = () => {
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix()
    if (opts.still && ready) frame(performance.now())
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize()
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const frame = (now) => {
    const t = (now - t0) / 1000
    uniforms.uTime.value = t % 10
    cx += (tx - cx) * 0.04; cy += (ty - cy) * 0.04
    const drift = reduce || opts.still ? 0 : 1
    pivot.rotation.y = (opts.rotY ?? 0.6) + t * 0.06 * drift + cx * 0.5
    pivot.rotation.x = 0.12 + cy * 0.25
    pivot.position.y = Math.sin(t * 0.6) * 0.02 * drift
    renderer.render(scene, camera)
    if (!opts.still) raf = requestAnimationFrame(frame)
  }
  ready = true
  raf = requestAnimationFrame(frame)
  return {
    boot: (v) => { uniforms.uBoot.value = v; if (opts.still) frame(performance.now()) },
    setDusk: (v) => { uniforms.uDusk.value = v; if (opts.still) frame(performance.now()) },
    render: () => frame(performance.now()),
    dispose: () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('pointermove', onMove); renderer.dispose() },
  }
}
