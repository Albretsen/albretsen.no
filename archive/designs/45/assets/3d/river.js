// Albretsen AS — design 45 "Drift" — the river of time, live.
// A three.js particle system: thousands of glossy beads (each point shaded as a tiny plastic sphere in the
// fragment shader) are carried down a soft-plastic river from 2016 (far away) to today (right here).
// Eleven pebbles float above the current, one per year. The pointer stirs the water (hand-rolled springs),
// a click sends a ripple, and setTheme() glides the whole scene between day and night.
//
// Needs an import map for "three" and "three/addons/" (three@0.170.0), see river-demo.html.
//   import { createRiver } from './3d/river.js'
//   const river = await createRiver(canvas, { theme: 'light', onFrame: (years) => … })
//   river.setTheme('dark'); river.dispose();
// onFrame receives [{ year, x, y, visible }] in CSS pixels relative to the canvas, so HTML labels can follow.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Spring, PRESETS } from '../motion.js';

const HEX = { 50: '#f2fdfa', 100: '#dcf7f1', 200: '#b7ebdf', 300: '#87dac9', 400: '#4bc1ad', 500: '#08a28f', 600: '#008171', 700: '#006154', 800: '#034239', 900: '#042822', 950: '#031612', 990: '#020907' };
const C = (k) => new THREE.Color(HEX[k]);
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

function riverCurve() {
  return new THREE.CatmullRomCurve3([
    [-6, -44], [6, -32], [1, -21], [8, -12], [4, -4], [8.5, 2.5], [5, 8], [7.5, 13], [13, 18],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'catmullrom', 0.5);
}
const width = (u) => 0.35 + 2.2 * Math.pow(u, 1.4);

function ribbon(curve, w, height, NU, NV, cA, cB) {
  const pos = [], col = [], idx = []; const up = new THREE.Vector3(0, 1, 0); const a = C(cA), b = C(cB), c = new THREE.Color();
  for (let i = 0; i <= NU; i++) {
    const u = i / NU, p = curve.getPointAt(u), t = curve.getTangentAt(u), n = new THREE.Vector3().crossVectors(up, t).normalize(), ww = w(u);
    c.copy(a).lerp(b, Math.pow(u, 1.3));
    for (let j = 0; j <= NV; j++) {
      const ang = (j / NV) * Math.PI * 2, sx = Math.cos(ang), sy = Math.sin(ang);
      const px = Math.sign(sx) * Math.pow(Math.abs(sx), 0.35), py = Math.sign(sy) * Math.pow(Math.abs(sy), 0.35);
      pos.push(p.x + n.x * px * ww, py * height + height * 0.6, p.z + n.z * px * ww); col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const q = i * (NV + 1) + j, r = q + NV + 1; idx.push(q, r, q + 1, r, r + 1, q + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}

function pebbleGeo(r, squash, seed) {
  const g = new THREE.SphereGeometry(r, 64, 40), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(); v.multiplyScalar(1 + 0.08 * Math.sin(n.x * 2.1 + seed) * Math.cos(n.z * 1.7 + seed * 2)); v.y *= squash; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}

const vert = /* glsl */`
uniform sampler2D uCurve; uniform float uN, uTime, uSize, uPR, uStir, uNight; uniform vec3 uPointer;
attribute float aU0, aOff, aLift, aSize, aSpeed, aShade, aSeed;
varying float vShade, vAlpha, vNight, vDepth;
vec3 curveAt(float u) { float f = clamp(u, 0., 1.) * (uN - 1.); int i = int(floor(f)); vec3 a = texelFetch(uCurve, ivec2(i, 0), 0).xyz; vec3 b = texelFetch(uCurve, ivec2(min(i + 1, int(uN) - 1), 0), 0).xyz; return mix(a, b, fract(f)); }
void main() {
  float u = fract(aU0 + uTime * aSpeed);
  vec3 c = curveAt(u); vec3 t = curveAt(u + .004) - curveAt(u - .004); vec3 n = normalize(vec3(-t.z, 0., t.x));
  float w = .35 + 2.2 * pow(u, 1.4);
  float off = aOff + .06 * sin(uTime * .7 + aSeed * 10.);
  vec3 p = c + n * off * w;
  p.y = .3 + aLift * (.5 + 2.8 * u) + .07 * sin(uTime * 1.3 + aSeed * 6.283);
  vec3 d = p - uPointer; d.y = 0.; float r = length(d.xz); float k = uStir * exp(-r * r / 2.2);
  p.xz += (d.xz / (r + 1e-3)) * k * .9 + vec2(-d.z, d.x) * k * .5; p.y += k * .9;
  vAlpha = smoothstep(0., .05, u) * smoothstep(1., .97, u);
  vShade = aShade; vNight = uNight;
  vec4 mv = modelViewMatrix * vec4(p, 1.); vDepth = -mv.z;
  gl_PointSize = aSize * (.5 + u) * uSize * uPR / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const frag = /* glsl */`
uniform vec3 uDay0, uDay1, uDay2, uDay3, uNight0, uNight1, uNight2, uFog; uniform float uFogNear, uFogFar;
varying float vShade, vAlpha, vNight, vDepth;
void main() {
  vec2 p = gl_PointCoord * 2. - 1.; float r2 = dot(p, p); if (r2 > 1.) discard;
  vec3 n = vec3(p.x, -p.y, sqrt(1. - r2));
  vec3 L = normalize(vec3(-.45, .7, .6));
  float diff = max(dot(n, L), 0.), spec = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 36.), rim = pow(1. - n.z, 2.5);
  vec3 day = vShade < .25 ? uDay0 : vShade < .5 ? uDay1 : vShade < .75 ? uDay2 : uDay3;
  vec3 night = vShade < .33 ? uNight0 : vShade < .66 ? uNight1 : uNight2;
  vec3 dayCol = day * (.5 + .6 * diff) + vec3(spec) * .85 + rim * .25 * uDay0;
  vec3 nightCol = night * (.75 + .5 * diff) + vec3(spec) * .6 + night * rim * 1.4;
  vec3 col = mix(dayCol, nightCol, vNight);
  float fog = smoothstep(uFogNear, uFogFar, vDepth); col = mix(col, uFog, fog);
  gl_FragColor = vec4(col, vAlpha * smoothstep(1., .82, r2) * (1. - fog * .6));
}`;

export async function createRiver(canvas, { theme = 'light', particles, onFrame, interactive = true } = {}) {
  const small = Math.min(innerWidth, innerHeight) < 600;
  const N = particles ?? (small ? 3500 : 9000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene(); const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const hemi = new THREE.HemisphereLight(HEX[50], HEX[300], 0.4); scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff', 2.6); key.position.set(-6, 14, 8); scene.add(key);
  scene.fog = new THREE.Fog(HEX[100], 16, 58);

  const curve = riverCurve();
  const riverMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.3, sheenColor: C(50), side: THREE.DoubleSide, emissive: C(700), emissiveIntensity: 0 });
  scene.add(new THREE.Mesh(ribbon(curve, width, 0.16, 500, 32, 200, 400), riverMat));
  const laneMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide, emissive: C(400), emissiveIntensity: 0 });
  scene.add(new THREE.Mesh(ribbon(curve, (u) => width(u) * 0.34, 0.2, 500, 24, 100, 200), laneMat));

  // year pebbles
  const big = { 2016: 1.05, 2019: 1.25, 2021: 1.0, 2024: 1.0, 2026: 1.15 };
  const shade = [50, 200, 500, 50, 700, 300, 50, 600, 200, 800, 50];
  const pebbles = YEARS.map((year, i) => {
    const u = 0.06 + 0.78 * (i / (YEARS.length - 1)); const p = curve.getPointAt(u); const r = (0.3 + 0.42 * u) * (big[year] || 0.7);
    const m = new THREE.Mesh(pebbleGeo(r, 0.6, i * 1.7), new THREE.MeshPhysicalMaterial({ color: C(shade[i]), roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.14, sheen: 0.35, sheenColor: C(50), emissive: C(400), emissiveIntensity: 0 }));
    m.position.set(p.x + Math.sin(i * 3.1) * 0.35, 1.1 + u * 1.9, p.z); m.rotation.set(Math.sin(i) * 0.3, i * 1.3, Math.cos(i) * 0.2);
    m.userData = { year, base: m.position.y, phase: i * 0.9, day: C(shade[i]) }; scene.add(m); return m;
  });
  const today = pebbles.at(-1); const rr = 0.72 * 1.15 * 0.95;
  const ringMat = new THREE.MeshPhysicalMaterial({ color: C(600), roughness: 0.3, clearcoat: 1, emissive: C(300), emissiveIntensity: 0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(rr * 1.9, rr * 0.05, 24, 200), ringMat); ring.rotation.set(1.25, 0.2, -0.35); scene.add(ring);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(rr * 0.2, 32, 24), new THREE.MeshPhysicalMaterial({ color: C(800), roughness: 0.3, clearcoat: 1, emissive: C(100), emissiveIntensity: 0 })); scene.add(moon);

  // particles: the chorus
  const S = 512, data = new Float32Array(S * 4);
  for (let i = 0; i < S; i++) { const p = curve.getPointAt(i / (S - 1)); data.set([p.x, p.y, p.z, 1], i * 4); }
  const curveTex = new THREE.DataTexture(data, S, 1, THREE.RGBAFormat, THREE.FloatType); curveTex.needsUpdate = true;
  const g = new THREE.BufferGeometry(); const A = (n) => new Float32Array(N * n);
  const aU0 = A(1), aOff = A(1), aLift = A(1), aSize = A(1), aSpeed = A(1), aShade = A(1), aSeed = A(1);
  for (let i = 0; i < N; i++) {
    aU0[i] = Math.random(); aOff[i] = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 * 0.95;
    aLift[i] = Math.pow(Math.random(), 3.2); aSize[i] = 0.05 + Math.pow(Math.random(), 4) * 0.22;
    aSpeed[i] = 0.004 + Math.random() * 0.006; aShade[i] = Math.random(); aSeed[i] = Math.random();
  }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  Object.entries({ aU0, aOff, aLift, aSize, aSpeed, aShade, aSeed }).forEach(([k, v]) => g.setAttribute(k, new THREE.BufferAttribute(v, 1)));
  const uniforms = {
    uCurve: { value: curveTex }, uN: { value: S }, uTime: { value: 0 }, uSize: { value: 1000 }, uPR: { value: renderer.getPixelRatio() },
    uStir: { value: 0 }, uNight: { value: 0 }, uPointer: { value: new THREE.Vector3(99, 0, 99) },
    uDay0: { value: C(50) }, uDay1: { value: C(500) }, uDay2: { value: C(700) }, uDay3: { value: C(200) },
    uNight0: { value: C(300) }, uNight1: { value: C(100) }, uNight2: { value: C(500) },
    uFog: { value: C(100) }, uFogNear: { value: 16 }, uFogFar: { value: 58 },
  };
  const points = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: true }));
  points.frustumCulled = false; scene.add(points);

  // springs: theme, stir, camera parallax
  const night = new Spring(theme === 'dark' ? 1 : 0, PRESETS.tide);
  const stir = new Spring(0, { stiffness: 40, damping: 7 });
  const camX = new Spring(0, PRESETS.weightless), camY = new Spring(0, PRESETS.weightless);
  const bgDay = C(100), bgNight = C(990), bg = new THREE.Color();
  const applyTheme = (v) => {
    bg.copy(bgDay).lerp(bgNight, v); renderer.setClearColor(bg); scene.fog.color.copy(bg); uniforms.uFog.value.copy(bg); uniforms.uNight.value = v;
    scene.environmentIntensity = 1 - v * 0.8; key.intensity = 2.6 * (1 - v * 0.8); hemi.intensity = 0.4 * (1 - v * 0.6);
    riverMat.color.setScalar(1 - v * 0.82); riverMat.emissiveIntensity = v * 0.5; laneMat.color.setScalar(1 - v * 0.6); laneMat.emissiveIntensity = v * 0.6;
    pebbles.forEach((p, i) => { p.material.emissiveIntensity = v * (i === 10 ? 0.45 : 0.08); p.material.color.copy(p.userData.day).lerp(C(800), v * (p.userData.day.r > 0.5 ? 0.25 : 0)); });
    ringMat.color.copy(C(600)).lerp(C(200), v); ringMat.emissiveIntensity = v * 1.2; moon.material.color.copy(C(800)).lerp(C(100), v); moon.material.emissiveIntensity = v * 1.4;
  };
  night.onChange(applyTheme);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
    // portrait screens: step back and centre the river
    const portrait = w / h < 1; camera.userData.base = portrait ? new THREE.Vector3(6.5, 13, 27) : new THREE.Vector3(1.5, 10.5, 21);
    camera.userData.look = portrait ? new THREE.Vector3(6.2, 0.5, -4) : new THREE.Vector3(1.2, 0.5, -3); camera.fov = portrait ? 38 : 30; camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.8), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
  let lastMove = 0;
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    camX.to(ndc.x); camY.to(ndc.y);
    ray.setFromCamera(ndc, camera); if (ray.ray.intersectPlane(plane, hit)) uniforms.uPointer.value.copy(hit);
    const now = performance.now(); const speed = Math.min(1, (now - lastMove) < 40 ? 1 : 0.6); lastMove = now; stir.to(speed);
    clearTimeout(onMove.t); onMove.t = setTimeout(() => stir.to(0), 140);
  };
  const onClick = () => stir.to(0, { velocity: 9 }); // a ripple: kick the spring and let it ring out
  if (interactive) { canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onClick); }

  let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }); io.observe(canvas);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock(); let raf = 0; const v = new THREE.Vector3();
  function loop() {
    cancelAnimationFrame(raf); if (!visible) return;
    const t = clock.getElapsedTime() * (reduce ? 0.15 : 1); uniforms.uTime.value = t; uniforms.uStir.value = stir.value;
    const b = camera.userData.base; camera.position.set(b.x + camX.value * 0.9, b.y + camY.value * 0.5, b.z); camera.lookAt(camera.userData.look);
    pebbles.forEach((p) => { p.position.y = p.userData.base + Math.sin(t * 0.6 + p.userData.phase) * 0.12; p.rotation.y += 0.0015; });
    ring.position.copy(today.position); ring.rotation.z = -0.35 + t * 0.05;
    const a = t * 0.35; moon.position.copy(today.position).add(new THREE.Vector3(Math.cos(a) * rr * 1.9, Math.sin(a) * rr * 1.9, 0).applyEuler(ring.rotation));
    renderer.render(scene, camera);
    if (onFrame) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      onFrame(pebbles.map((p) => { v.copy(p.position).project(camera); return { year: p.userData.year, x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 }; }));
    }
    raf = requestAnimationFrame(loop);
  }
  loop();

  return {
    setTheme(next) { night.to(next === 'dark' ? 1 : 0); },
    ripple: onClick,
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onClick); renderer.dispose(); pmrem.dispose(); },
  };
}
