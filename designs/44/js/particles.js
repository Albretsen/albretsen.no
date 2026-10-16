// Darkfield particle system: the centrepiece of design 44.
// Site copy of ../assets/3d/darkfield-particles.js. Changes: the page owns pointer input
// (setPointer, in the cloud's local units), and points + camera are exposed so the page can
// move and scale the cloud to follow the pan-and-zoom slide.
// 24,000 grains of light that settle into a specimen. The default specimen is Poly Haven's
// moon_rock_03 (CC0), point-sampled. The others are the bespoke icon glyphs in ../icons/specimens/.
// A "signal" is a radial pulse that ripples through the grains: it brightens them and lifts them on z.
//
// Usage (the page needs an import map that resolves "three"):
//   <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"}}</script>
//   import { createDarkfield } from './3d/darkfield-particles.js'
//   const df = await createDarkfield(canvas, { base: './' })   // base = the assets/ folder URL
//   df.morph('mcp-emails'); df.pulse(0, 0); df.destroy()
import * as THREE from 'three';

export const SPECIMENS = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor', 'luma', 'polyglot-pilot', 'pinpoint', 'webvakt', 'joke-central', 'tryggere-hyring', 'early-apps'];
const PALETTE = { ochre: new THREE.Color('#bd8e53'), light: new THREE.Color('#fae0c1'), signal: new THREE.Color('#f0b871') };

const vert = /* glsl */`
uniform float uTime, uMorph, uSize, uPR, uSpread, uDissolve;
uniform vec3 uPointer;
uniform vec4 uPulse[4];
attribute vec3 aFrom, aTo;
attribute vec2 aShade;
attribute vec4 aRand;
varying float vAlpha, vHeat, vTone;
void main(){
  float d = aRand.x * 0.4;
  float t = clamp((uMorph - d) / 0.6, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(aFrom, aTo, t);
  float mid = sin(t * 3.14159);
  p += vec3(sin(aRand.y * 6.283 + uTime * 0.5), cos(aRand.z * 6.283 + uTime * 0.4), sin(aRand.w * 6.283 + uTime * 0.3)) * mid * 0.55 * (0.3 + aRand.y);
  p += uSpread * vec3(sin(aRand.y * 91.0), cos(aRand.z * 77.0), sin(aRand.w * 53.0)) * (1.0 + aRand.x);
  p += 0.0065 * vec3(sin(uTime * 1.3 + aRand.x * 40.0), cos(uTime * 1.1 + aRand.y * 40.0), sin(uTime * 0.9 + aRand.z * 40.0));
  // dissolve: grains peel off the right flank and drift away as loose signal
  float edge = (p.x + 1.8) / 3.6 + (aRand.x - 0.5) * 0.35;
  float k = smoothstep(1.0 - uDissolve * 1.3, 1.25 - uDissolve * 1.3, edge);
  p += vec3(2.6 + aRand.y * 2.0, 0.7 * (aRand.z - 0.3) + 0.25 * sin(aRand.w * 20.0 + uTime * 0.3), 1.2 * (aRand.w - 0.5)) * k * k;
  float heat = k * 0.25;
  for (int i = 0; i < 4; i++) {
    vec4 P = uPulse[i];
    float age = uTime - P.z;
    if (age < 0.0 || age > 3.2) continue;
    float r = age * 1.25;
    vec2 dv = p.xy - P.xy;
    float dist = length(dv);
    float band = exp(-pow((dist - r) * 6.0, 2.0)) * (1.0 - age / 3.2) * P.w;
    p.xy += (dv / (dist + 1e-4)) * band * 0.07;
    p.z += band * 0.18;
    heat += band;
  }
  vec2 pv = p.xy - uPointer.xy;
  float pd = length(pv);
  float push = exp(-pd * pd * 10.0) * uPointer.z;
  p.xy += (pv / (pd + 1e-4)) * push * 0.16;
  heat += push * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPR * (0.55 + aRand.w * 0.9) * (1.0 + heat * 0.9) / -mv.z;
  float shade = mix(aShade.x, aShade.y, t);
  float depth = smoothstep(-9.2, -5.4, mv.z);
  vAlpha = (0.35 + 0.65 * aRand.z) * (0.25 + 0.75 * depth) * (0.1 + 1.5 * shade * shade);
  vHeat = clamp(heat, 0.0, 1.0);
  vTone = aRand.y;
}`;
const frag = /* glsl */`
uniform vec3 uOchre, uLight, uSignal;
uniform float uGain;
varying float vAlpha, vHeat, vTone;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float a = smoothstep(0.5, 0.05, r);
  a = a * (0.55 + 0.45 * a);
  vec3 col = mix(uOchre, uLight, smoothstep(0.35, 1.0, vTone));
  col = mix(col, uSignal * 1.25, vHeat);
  gl_FragColor = vec4(col * uGain, a * vAlpha * (0.75 + vHeat));
}`;

async function loadRock(base, n) {
  const buf = await (await fetch(new URL('3d/rock-points.bin', base))).arrayBuffer();
  const dv = new DataView(buf); const total = buf.byteLength / 10;
  const out = new Float32Array(n * 3), shade = new Float32Array(n);
  const L = [-0.45, 0.75, 0.5], Ln = Math.hypot(...L);
  // the scan sits flat; stand it up a little so the silhouette reads (rotate points and normals)
  const ang = 0.8, ca = Math.cos(ang), sa = Math.sin(ang);
  for (let i = 0; i < n; i++) {
    const j = (i * 7919) % total;
    const x = dv.getInt16(j * 10, true) / 32767 * 1.7, y = dv.getInt16(j * 10 + 2, true) / 32767 * 1.7, z = dv.getInt16(j * 10 + 4, true) / 32767 * 1.7;
    out[i * 3] = x; out[i * 3 + 1] = y * ca - z * sa; out[i * 3 + 2] = y * sa + z * ca;
    const nx = dv.getInt8(j * 10 + 6) / 127, ny0 = dv.getInt8(j * 10 + 7) / 127, nz0 = dv.getInt8(j * 10 + 8) / 127;
    const ny = ny0 * ca - nz0 * sa, nz = ny0 * sa + nz0 * ca;
    const lam = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / Ln);
    const rim = Math.pow(1 - Math.abs(nz), 2.5);
    shade[i] = Math.min(1, 0.16 + lam * 1.05 + rim * 0.45);
  }
  out.shade = shade;
  return out;
}
async function loadGlyph(base, id, n) {
  const res = await fetch(new URL(`icons/specimens/${id}.svg`, base));
  let svg = await res.text();
  svg = svg.replace(/var\(--signal, #f0b871\)/g, '#ffffff').replace('color="#fae0c1"', 'color="#ffffff"').replace('<svg ', '<svg width="512" height="512" ');
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0, S, S);
  const data = cx.getImageData(0, 0, S, S).data;
  const px = [];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (data[(y * S + x) * 4 + 3] > 90) px.push(x, y);
  const out = new Float32Array(n * 3); const m = px.length / 2;
  for (let i = 0; i < n; i++) {
    const j = Math.floor(Math.random() * m);
    out[i * 3] = ((px[j * 2] + Math.random()) / S - 0.5) * 3.4;
    out[i * 3 + 1] = -((px[j * 2 + 1] + Math.random()) / S - 0.5) * 3.4;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
  }
  return out;
}
function field(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(Math.random()) * 3.4, a = Math.random() * Math.PI * 2;
    out[i * 3] = Math.cos(a) * r * 1.5; out[i * 3 + 1] = Math.sin(a) * r * 0.9; out[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
  }
  return out;
}

export async function createDarkfield(canvas, opts = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = opts.count ?? (innerWidth < 700 ? 14000 : 24000);
  const base = new URL(opts.base ?? './', location.href);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  const pr = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(pr);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 7.2);

  const geo = new THREE.BufferGeometry();
  const from = new Float32Array(N * 3), to = field(N), rand = new Float32Array(N * 4);
  for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
  from.set(to);
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('aFrom', new THREE.BufferAttribute(from, 3));
  geo.setAttribute('aTo', new THREE.BufferAttribute(to, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
  const shadeAttr = new Float32Array(N * 2).fill(1);
  geo.setAttribute('aShade', new THREE.BufferAttribute(shadeAttr, 2));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
  const uniforms = {
    uTime: { value: 0 }, uMorph: { value: 1 }, uSize: { value: opts.size ?? 30 }, uPR: { value: pr }, uSpread: { value: 0 }, uDissolve: { value: opts.dissolve ?? 0 },
    uPointer: { value: new THREE.Vector3(9, 9, 0) }, uPulse: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, -99, 0)) },
    uOchre: { value: PALETTE.ochre }, uLight: { value: PALETTE.light }, uSignal: { value: PALETTE.signal }, uGain: { value: opts.gain ?? 1 },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  const cache = new Map();
  async function shape(id) {
    if (!cache.has(id)) cache.set(id, id === 'rock' ? loadRock(base, N) : id === 'field' ? Promise.resolve(field(N)) : loadGlyph(base, id, N));
    return cache.get(id);
  }
  let morphStart = -1, morphDur = 1.8, current = 'field';
  async function morph(id, dur = 1.8) {
    const target = await shape(id);
    // freeze the in-between state into aFrom (same easing as the shader)
    const m = uniforms.uMorph.value;
    for (let i = 0; i < N; i++) {
      let t = Math.min(1, Math.max(0, (m - rand[i * 4] * 0.4) / 0.6)); t = t * t * (3 - 2 * t);
      for (let k = 0; k < 3; k++) from[i * 3 + k] = from[i * 3 + k] + (to[i * 3 + k] - from[i * 3 + k]) * t;
    }
    for (let i = 0; i < N; i++) {
      let t = Math.min(1, Math.max(0, (m - rand[i * 4] * 0.4) / 0.6)); t = t * t * (3 - 2 * t);
      shadeAttr[i * 2] = shadeAttr[i * 2] + (shadeAttr[i * 2 + 1] - shadeAttr[i * 2]) * t;
      shadeAttr[i * 2 + 1] = target.shade ? target.shade[i] : 1;
    }
    to.set(target);
    geo.attributes.aFrom.needsUpdate = geo.attributes.aTo.needsUpdate = geo.attributes.aShade.needsUpdate = true;
    uniforms.uMorph.value = 0; morphStart = clock.getElapsedTime(); morphDur = reduce ? 0.01 : dur; current = id;
  }
  let pulseIdx = 0;
  function pulse(x = 0, y = 0, strength = 1) {
    uniforms.uPulse.value[pulseIdx++ % 4].set(x, y, clock.getElapsedTime(), strength);
  }
  // pointer -> world on z=0
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
  let pointerTarget = 0;
  function toWorld(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); ray.ray.intersectPlane(plane, hit); return hit;
  }
  const onMove = (e) => { const w = toWorld(e.clientX, e.clientY); uniforms.uPointer.value.x = w.x; uniforms.uPointer.value.y = w.y; pointerTarget = 1; };
  const onLeave = () => { pointerTarget = 0; };
  const onDown = (e) => { const w = toWorld(e.clientX, e.clientY); pulse(w.x, w.y, 1.2); };
  if (opts.ownPointer !== false) { canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave); canvas.addEventListener('pointerdown', onDown); }

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth, h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w / h < 0.8 ? 10.5 : 7.2; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  const clock = new THREE.Clock();
  let raf = 0, nextAuto = 2.2, running = true;
  function frame() {
    if (!running) return;
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    if (morphStart >= 0) uniforms.uMorph.value = Math.min(1, (t - morphStart) / morphDur);
    uniforms.uPointer.value.z += (pointerTarget - uniforms.uPointer.value.z) * 0.08;
    if (opts.autoPulse !== false && t > nextAuto && !reduce) { pulse((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, 0.8); nextAuto = t + 4.5 + Math.random() * 3; }
    const spin = current === 'rock' ? 0.12 : 0.0;
    points.rotation.y += ((current === 'rock' ? Math.sin(t * 0.15) * 0.9 : Math.sin(t * 0.25) * 0.18) - points.rotation.y) * 0.02 + spin * 0.0;
    points.rotation.x = Math.sin(t * 0.21) * 0.08;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  frame();
  if (opts.initial !== null) await morph(opts.initial ?? 'rock', opts.initialDuration ?? 2.6);

  return {
    morph, pulse, shape, points, camera, renderer,
    setPointer(x, y, on = true) { uniforms.uPointer.value.x = x; uniforms.uPointer.value.y = y; pointerTarget = on ? 1 : 0; },
    get running() { return running; },
    get current() { return current; },
    /** 0 = settled, 1 = blown into loose grain; good for ScrollTrigger scrub */
    set spread(v) { uniforms.uSpread.value = v; },
    set gain(v) { uniforms.uGain.value = v; },
    set size(v) { uniforms.uSize.value = v; },
    /** 0..1: grains peel off to the right; pair with ScrollTrigger scrub */
    set dissolve(v) { uniforms.uDissolve.value = v; },
    pause() { running = false; cancelAnimationFrame(raf); clock.stop(); },
    resume() { if (!running) { running = true; clock.start(); frame(); } },
    destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave); canvas.removeEventListener('pointerdown', onDown); geo.dispose(); mat.dispose(); renderer.dispose(); },
  };
}
