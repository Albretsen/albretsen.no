/* Ground Glass live scene, adapted for the homepage (adds setFocusNow so the page focus ring drives it directly). Original: ../assets/scene/scene.js */
/* Ground Glass — live viewfinder scene (design 81)
 * ------------------------------------------------------------------
 * A paper-cut collage of 19th-century museum photographs, staged as real
 * planes in depth with three.js and seen through a camera.
 *   - focus   0..1  which depth is sharp (0 = treeline, 1 = moon). Per-layer
 *                    disc blur in the fragment shader = real depth of field.
 *   - aperture 0..1  how shallow the depth of field is (wide open = 1).
 *   - exposure -1..1 under / over, with a violet shoulder instead of clipping.
 *   - pointer        parallax: the camera drifts on springs.
 * Usage:
 *   import { mountScene } from './scene/scene.js'
 *   const cam = await mountScene(canvas, { base: './scene/' })
 *   cam.setFocus(0.7); cam.setExposure(0.2); cam.setAperture(0.5)
 * three.js is loaded from an import map ("three" -> three@0.170.0).
 */
import * as THREE from 'three';
import { Spring, presets, reduced } from '../assets/motion.js';

const HUE_TOP = new THREE.Color('#070514');     // ink
const HUE_MID = new THREE.Color('#1f1642');     // umbra
const HUE_LOW = new THREE.Color('#4d3898');     // iris
const HUE_GLOW = new THREE.Color('#bbb6ef');    // haze

const common = /* glsl */`
  uniform float uExposure;
  float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    float a = hash(i), b = hash(i+vec2(1.0,0.0)), c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }
  vec3 expose(vec3 c){
    float e = exp2(uExposure * 1.35);
    c *= e;
    // soft violet shoulder: highlights roll into lilac-white instead of clipping
    vec3 sh = vec3(0.976, 0.976, 1.0);
    c = mix(c, sh - (sh - c) * exp(-max(c - 0.82, 0.0) * 3.0), step(0.82, c));
    return clamp(c, 0.0, 1.0);
  }
`;

const layerFrag = /* glsl */`
  precision highp float;
  uniform sampler2D uMap; uniform float uBlur; uniform vec2 uTexel; uniform float uShadow;
  uniform vec2 uShadowOffset; uniform float uTime; uniform float uWater; uniform float uMoonX;
  varying vec2 vUv;
  ${common}
  // 24-tap golden-angle disc: cheap bokeh-ish blur
  vec4 disc(vec2 uv, float r){
    if (r < 0.35) return texture2D(uMap, uv);
    vec4 acc = vec4(0.0); float w = 0.0;
    for (int i = 0; i < 24; i++){
      float fi = float(i);
      float rr = sqrt((fi + 0.5) / 24.0) * r;
      float a = fi * 2.39996323;
      vec2 o = vec2(cos(a), sin(a)) * rr * uTexel;
      vec4 s = texture2D(uMap, uv + o);
      acc += vec4(s.rgb * s.a, s.a); w += 1.0;
    }
    acc /= w;
    return vec4(acc.rgb / max(acc.a, 1e-4), acc.a);
  }
  void main(){
    vec2 uv = vUv;
    if (uWater > 0.5){
      // the water: slow horizontal ripples + the moon's broken reflection
      float ripple = sin(uv.y * 180.0 - uTime * 0.9) * 0.0005 + sin(uv.y * 63.0 + uTime * 0.4) * 0.0008;
      uv.x += ripple * (0.4 + uv.y);
    }
    if (uShadow > 0.5){
      vec4 s = disc(uv - uShadowOffset, uBlur + 10.0);
      gl_FragColor = vec4(vec3(0.027, 0.02, 0.078), s.a * 0.55);
      return;
    }
    vec4 c = disc(uv, uBlur);
    vec3 col = c.rgb;
    if (uWater > 0.5){
      float d = abs(uv.x - uMoonX);
      float width = mix(0.010, 0.045, uv.y * uv.y);           // narrow at horizon, wide up close
      float streak = exp(-d * d / (width * width));
      // broken glints: thin horizontal slivers that drift, denser near the horizon
      float rc = pow(1.0 - uv.y, 1.5) * 220.0;
      float fy = fract(rc), row = floor(rc);
      float n = vnoise(vec2((uv.x - uMoonX) * 140.0 / (0.6 + uv.y) + row * 3.17, row * 0.71 + uTime * 0.35));
      float glint = smoothstep(0.52, 0.82, n) * pow(sin(3.14159 * fy), 3.0);
      col += vec3(0.66, 0.62, 0.98) * streak * glint * 0.85;
      col += vec3(0.30, 0.26, 0.62) * exp(-d * d * 40.0) * (0.25 + 0.5 * uv.y) * 0.4;
      // horizon haze
      col = mix(col, vec3(0.47, 0.42, 0.78), smoothstep(0.80, 1.0, uv.y) * 0.45);
    }
    col += (hash(gl_FragCoord.xy) - 0.5) * 0.025;   // paper tooth
    gl_FragColor = vec4(expose(col), c.a);
  }
`;

const skyFrag = /* glsl */`
  precision highp float;
  uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uLow; uniform vec3 uGlow;
  uniform vec2 uMoon; uniform float uAspect; uniform float uTime;
  varying vec2 vUv;
  ${common}
  void main(){
    vec2 uv = vUv;
    float y = uv.y;
    vec3 col = mix(uLow, uMid, smoothstep(0.0, 0.42, y));
    col = mix(col, uTop, smoothstep(0.38, 1.0, y));
    vec2 p = (uv - uMoon) * vec2(uAspect, 1.0);
    float d = length(p);
    col += uGlow * (0.55 * exp(-d * 7.0) + 0.18 * exp(-d * 2.2));
    // faint stars, more of them high up
    vec2 sp = uv * vec2(uAspect, 1.0) * 140.0;
    vec2 g = floor(sp); vec2 fr = fract(sp) - 0.5;
    float h = hash(g);
    vec2 jitter = vec2(hash(g + 7.0), hash(g + 13.0)) - 0.5;
    float pt = smoothstep(0.16, 0.0, length(fr - jitter * 0.6));
    float tw = 0.6 + 0.4 * sin(uTime * (0.6 + h * 2.0) + h * 40.0);
    float star = step(0.985, h) * pt * tw * smoothstep(0.30, 0.95, y) * (1.0 - exp(-length(p) * 6.0));
    col += vec3(0.85, 0.83, 1.0) * star * 0.7;
    col += (hash(gl_FragCoord.xy + 3.1) - 0.5) * 0.03;
    gl_FragColor = vec4(expose(col), 1.0);
  }
`;

const haloFrag = /* glsl */`
  precision highp float;
  uniform vec3 uGlow; varying vec2 vUv;
  ${common}
  void main(){
    float d = length(vUv - 0.5) * 2.0;
    float a = exp(-d * 3.2) * 0.65 + exp(-d * 9.0) * 0.35;
    a *= smoothstep(1.0, 0.6, d);
    gl_FragColor = vec4(uGlow * exp2(uExposure * 0.8), a * 0.55);
  }
`;

const vert = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/* Composition in frame units (h = frame height at that depth, s = cover width).
 * depth: world z. focusAt: normalised depth used by the focus control. */
const LAYERS = [
  { id: 'far',   file: 'layer-far.webp',   z: -14,  focusAt: 0.78, w: 0.80, anchor: 'bottom', y: -0.10,  x: 0.17,  shadow: true },
  { id: 'water', file: 'layer-water.webp', z: -11,  focusAt: 0.62, w: 1.30, anchor: 'top',    y: -0.075, x: 0.0,   water: true },
  { id: 'mid',   file: 'layer-mid.webp',   z: -8.5, focusAt: 0.42, w: 0.92, anchor: 'bottom', y: -0.088, x: -0.36, shadow: true },
  { id: 'near',  file: 'layer-near.webp',  z: -3,   focusAt: 0.0,  w: 1.12, anchor: 'bottom', y: -0.70,  x: 0.0,   shadow: true },
];
const MOON = { file: 'moon.webp', z: -20, focusAt: 1.0, size: 0.14, x: -0.10, y: 0.33 };

export async function mountScene(canvas, opts = {}) {
  const base = opts.base ?? new URL('../assets/scene/', import.meta.url).href;
  const still = !!opts.still;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: still, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // textures are already graded sRGB
  renderer.setPixelRatio(Math.min(devicePixelRatio, opts.maxDpr ?? 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const loader = new THREE.TextureLoader();
  const load = f => new Promise((res, rej) => loader.load(base + f, t => {
    t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter; res(t);
  }, undefined, rej));

  const uExposure = { value: opts.exposure ?? 0 };
  const uTime = { value: 0 };

  // sky (fills the far frustum)
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: skyFrag, depthWrite: false,
    uniforms: { uTop: { value: HUE_TOP }, uMid: { value: HUE_MID }, uLow: { value: HUE_LOW }, uGlow: { value: HUE_GLOW },
      uMoon: { value: new THREE.Vector2(0.75, 0.75) }, uAspect: { value: 1 }, uTime, uExposure },
  });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), skyMat);
  sky.position.z = -30; scene.add(sky);

  const textures = await Promise.all([...LAYERS.map(l => load(l.file)), load(MOON.file)]);

  const mkMat = (tex, extra = {}) => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: layerFrag, transparent: true, depthWrite: false,
    uniforms: {
      uMap: { value: tex }, uBlur: { value: 0 }, uTexel: { value: new THREE.Vector2(1 / tex.image.width, 1 / tex.image.height) },
      uShadow: { value: extra.shadow ? 1 : 0 }, uShadowOffset: { value: new THREE.Vector2(0.004, -0.012) },
      uTime, uWater: { value: extra.water ? 1 : 0 }, uMoonX: { value: 0.7 }, uExposure,
    },
  });

  const items = LAYERS.map((l, i) => {
    const tex = textures[i];
    const aspect = tex.image.height / tex.image.width;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mkMat(tex, { water: l.water }));
    mesh.position.z = l.z; mesh.renderOrder = 10 + i * 2;
    scene.add(mesh);
    let shadow = null;
    if (l.shadow) {
      shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mkMat(tex, { shadow: true }));
      shadow.position.z = l.z - 0.02; shadow.renderOrder = 9 + i * 2;
      scene.add(shadow);
    }
    return { ...l, mesh, shadow, aspect };
  });

  const moonMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mkMat(textures[LAYERS.length]));
  moonMesh.position.z = MOON.z; moonMesh.renderOrder = 3; scene.add(moonMesh);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: haloFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uGlow: { value: new THREE.Color('#958ae4') }, uExposure },
  }));
  halo.position.z = MOON.z - 0.1; halo.renderOrder = 2; scene.add(halo);

  // ---------------------------------------------------------------- layout
  const frameAt = z => {
    const d = camera.position.z - z;
    const h = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return { h, w: h * camera.aspect };
  };
  let W = 1, H = 1;
  function layout() {
    W = canvas.clientWidth || canvas.width; H = canvas.clientHeight || canvas.height;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    const portrait = camera.aspect < 1;
    for (const it of items) {
      const f = frameAt(it.z);
      const s = Math.max(f.w, f.h * 1.62) * 1.04;
      const w = s * it.w * (portrait && it.id === 'far' ? 1.25 : 1), h = w * it.aspect;
      const yAnchor = it.y * f.h;
      let y = it.anchor === 'bottom' ? yAnchor + h / 2 : yAnchor - h / 2;
      let x = it.x * s;
      if (portrait && it.id === 'mid') x -= 0.08 * s;
      it.mesh.scale.set(w, h, 1); it.mesh.position.set(x, y, it.z);
      if (it.shadow) { it.shadow.scale.set(w, h, 1); it.shadow.position.set(x, y, it.z - 0.02); }
      it.base = { x, y };
    }
    const f = frameAt(MOON.z);
    const ms = f.h * MOON.size * (portrait ? 0.8 : 1);
    const mx = (portrait ? -0.12 : MOON.x) * f.w, my = (portrait ? 0.30 : MOON.y) * f.h;
    moonMesh.scale.set(ms, ms, 1); moonMesh.position.set(mx, my, MOON.z);
    halo.scale.set(ms * 5, ms * 5, 1); halo.position.set(mx, my, MOON.z - 0.1);
    const fs = frameAt(sky.position.z);
    sky.scale.set(fs.w * 1.2, fs.h * 1.2, 1);
    // moon position in sky uv / water uv
    const v = new THREE.Vector3(mx, my, MOON.z).project(camera);
    const skyUv = new THREE.Vector2((v.x * 0.5 + 0.5 - 0.5) / 1.2 + 0.5, (v.y * 0.5 + 0.5 - 0.5) / 1.2 + 0.5);
    skyMat.uniforms.uMoon.value.copy(skyUv);
    skyMat.uniforms.uAspect.value = camera.aspect;
    const water = items.find(i => i.water);
    const wf = frameAt(water.z);
    const moonXAtWater = (v.x * 0.5) * wf.w;   // same screen x at water depth
    water.mesh.material.uniforms.uMoonX.value = (moonXAtWater - water.base.x) / water.mesh.scale.x + 0.5;
  }

  // ---------------------------------------------------------------- controls
  const state = { focus: opts.focus ?? 0.78, aperture: opts.aperture ?? 0.55, exposure: opts.exposure ?? 0 };
  const focus = new Spring(state.focus, { ...presets.focus, onUpdate: () => dirty = true });
  const aperture = new Spring(state.aperture, { ...presets.iris, onUpdate: () => dirty = true });
  const exposure = new Spring(state.exposure, { ...presets.focus, onUpdate: v => { uExposure.value = v; dirty = true; } });
  const px = new Spring(0, { stiffness: 40, damping: 14, onUpdate: () => dirty = true });
  const py = new Spring(0, { stiffness: 40, damping: 14, onUpdate: () => dirty = true });
  let dirty = true;

  function applyBlur() {
    const f = focus.value, ap = Math.max(0, aperture.value);
    const k = (W > 900 ? 26 : 18) * (0.15 + ap * 1.25);
    for (const it of items) {
      const b = Math.abs(it.focusAt - f) * k;
      it.mesh.material.uniforms.uBlur.value = b;
      if (it.shadow) it.shadow.material.uniforms.uBlur.value = b;
    }
    moonMesh.material.uniforms.uBlur.value = Math.abs(MOON.focusAt - f) * k * 0.6;
  }
  function applyParallax() {
    camera.position.x = px.value * 0.55; camera.position.y = py.value * 0.3;
    camera.lookAt(0, 0, -12);
  }

  const onMove = e => {
    if (reduced) return;
    const r = canvas.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    py.set(-((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  if (!still) addEventListener('pointermove', onMove, { passive: true });

  const ro = new ResizeObserver(() => { layout(); dirty = true; if (still) frame(0); });
  ro.observe(canvas);
  layout();

  let running = !still, rafId = 0, t0 = performance.now();
  function frame(now) {
    uTime.value = still ? (opts.time ?? 12.0) : (now - t0) / 1000;
    applyBlur(); applyParallax();
    renderer.render(scene, camera);
    dirty = false;
    if (running) rafId = requestAnimationFrame(frame);
  }
  // pause when off-screen
  const io = new IntersectionObserver(([e]) => {
    if (still) return;
    if (e.isIntersecting && !running) { running = true; rafId = requestAnimationFrame(frame); }
    else if (!e.isIntersecting) { running = false; cancelAnimationFrame(rafId); }
  });
  io.observe(canvas);
  frame(performance.now());

  // ------------------------------------------------------------ tap to focus
  // Ray-cast through the paper planes, nearest first, and return the first one
  // whose cut-out is opaque under the pointer (alpha read from a 128 px copy).
  const alphaCache = new Map();
  function alphaAt(tex, uv) {
    let c = alphaCache.get(tex);
    if (!c) {
      const img = tex.image, w = 128, h = Math.max(1, Math.round(128 * img.height / img.width));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
      c = { g, w, h }; alphaCache.set(tex, c);
    }
    const x = Math.min(c.w - 1, Math.max(0, Math.floor(uv.x * c.w)));
    const y = Math.min(c.h - 1, Math.max(0, Math.floor((1 - uv.y) * c.h)));
    return c.g.getImageData(x, y, 1, 1).data[3] / 255;
  }
  const ray = new THREE.Raycaster();
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
    const cands = [...items.map(i => ({ id: i.id, mesh: i.mesh })), { id: 'moon', mesh: moonMesh }];
    const hits = ray.intersectObjects(cands.map(c => c.mesh), false).sort((a, b) => a.distance - b.distance);
    for (const h of hits) {
      try { if (alphaAt(h.object.material.uniforms.uMap.value, h.uv) > 0.5) return cands.find(c => c.mesh === h.object).id; }
      catch { return cands.find(c => c.mesh === h.object).id; }
    }
    return 'moon';
  }

  return {
    pick,
    renderer, scene, camera,
    get focus() { return focus.target; },
    get aperture() { return aperture.target; },
    get exposure() { return exposure.target; },
    setFocus: v => focus.set(Math.min(1, Math.max(0, v))),
    setFocusNow: v => focus.jump(Math.min(1, Math.max(0, v))),
    setAperture: v => aperture.set(Math.min(1, Math.max(0, v))),
    setApertureNow: v => aperture.jump(Math.min(1, Math.max(0, v))),
    setExposure: v => exposure.set(Math.min(1, Math.max(-1, v))),
    /** focus by named depth: 'near' | 'mid' | 'water' | 'far' | 'moon' */
    focusOn: id => focus.set(id === 'moon' ? MOON.focusAt : (items.find(i => i.id === id)?.focusAt ?? 0.78)),
    render: () => frame(performance.now()),
    dispose() { running = false; cancelAnimationFrame(rafId); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onMove); renderer.dispose(); },
  };
}
