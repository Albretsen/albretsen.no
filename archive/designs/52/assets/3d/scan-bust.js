// Scan Bust — Design 52 "Violet Cabinet"
// A CC0 marble bust (Poly Haven, marble_bust_01) being "digitised": a spark-yellow
// scanning beam sweeps the sculpture, and everything it has passed is redrawn as a
// living copper-plate engraving (hatching density follows the light), the same
// treatment the archive scans get. Drag to turn it. Scroll or setProgress() drives the scan.
//
// Usage:
//   import { mountScanBust } from './scan-bust.js';
//   const bust = await mountScanBust(document.querySelector('#bust'), { src: './marble-bust.glb' });
//   bust.setProgress(0.6);     // 0 = untouched marble, 1 = fully engraved
//   bust.dispose();
//
// Options: { src, auto: true (loops the scan when no progress is set), background: null | '#hex' }

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js/+esm';

const COL = {
  night: new THREE.Color('#090731'),
  deep: new THREE.Color('#170a62'),
  violet: new THREE.Color('#462eeb'),
  lilac: new THREE.Color('#a3a9ff'),
  ink: new THREE.Color('#f3f6ff'),
  spark: new THREE.Color('#ddf93c'),
};

const vert = /* glsl */`
  varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec3 vObj;
  void main(){
    vUv = uv; vObj = position;
    vec4 w = modelMatrix * vec4(position,1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const frag = /* glsl */`
  uniform sampler2D uNor; uniform float uScan; uniform float uTime;
  uniform vec3 cNight, cDeep, cViolet, cLilac, cInk, cSpark;
  uniform vec2 uRes;
  varying vec3 vN; varying vec3 vW; varying vec2 vUv; varying vec3 vObj;

  // normal mapping without tangents (Schuler / three's perturbNormal2Arb)
  vec3 perturb(vec3 eye, vec3 n, vec3 mapN){
    vec3 q0 = dFdx(eye), q1 = dFdy(eye);
    vec2 st0 = dFdx(vUv), st1 = dFdy(vUv);
    vec3 N = n; vec3 q1p = cross(q1, N), q0p = cross(N, q0);
    vec3 T = q1p * st0.x + q0p * st1.x; vec3 B = q1p * st0.y + q0p * st1.y;
    float det = max(dot(T,T), dot(B,B));
    float s = det == 0.0 ? 0.0 : inversesqrt(det);
    return normalize(T * (mapN.x * s) + B * (mapN.y * s) + N * mapN.z);
  }

  void main(){
    vec3 V = normalize(cameraPosition - vW);
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    vec3 mapN = texture2D(uNor, vUv).xyz * 2.0 - 1.0;
    mapN.xy *= 1.2;
    n = perturb(vW - cameraPosition, n, mapN);

    vec3 Lk = normalize(vec3(-0.55, 0.75, 0.6));
    vec3 Lr = normalize(vec3(0.9, 0.1, -0.4));
    float dif = clamp(dot(n, Lk), 0.0, 1.0);
    float rim = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 2.6);
    float back = clamp(dot(n, Lr), 0.0, 1.0);
    float spec = pow(clamp(dot(reflect(-Lk, n), V), 0.0, 1.0), 40.0);

    // untouched marble: polished violet stone
    vec3 marble = mix(cDeep, cViolet, smoothstep(0.0, 0.9, dif));
    marble = mix(marble, cLilac, dif * dif * 0.55);
    marble += cLilac * back * 0.35 + cInk * spec * 0.55 + cLilac * rim * 0.6;

    // engraved: hatching whose density follows the light, like the Kurr plates
    vec2 sp = gl_FragCoord.xy / uRes.y * 260.0;
    float tone = clamp(dif * 0.85 + spec * 0.6 + rim * 0.25, 0.0, 1.0);
    float h1 = abs(fract(sp.x * 0.7071 + sp.y * 0.7071) - 0.5) * 2.0;      // diagonal
    float h2 = abs(fract(sp.x * 0.7071 - sp.y * 0.7071 + 0.25) - 0.5) * 2.0; // cross
    float w1 = 0.08 + tone * 0.8;
    float w2 = clamp(tone * 1.5 - 0.7, 0.0, 0.8);
    float aa = 0.12;
    float ink = 1.0 - smoothstep(w1 - aa, w1 + aa, h1);
    ink = max(ink, (1.0 - smoothstep(w2 - aa, w2 + aa, h2)) * step(0.01, w2));
    vec3 engraved = mix(cNight, cInk, ink * 0.92);
    engraved = mix(engraved, cLilac, rim * 0.35);

    // scan beam on object height (0..1)
    float y = clamp((vObj.y + 0.03) / 0.52, 0.0, 1.0);
    float edge = 1.0 - uScan;              // beam travels top -> bottom
    float done = smoothstep(edge - 0.004, edge + 0.004, y);
    vec3 col = mix(marble, engraved, done);
    float beam = exp(-pow((y - edge) / 0.012, 2.0));
    float halo = exp(-pow((y - edge) / 0.06, 2.0)) * 0.35;
    col += cSpark * (beam * 1.4 + halo) * step(0.001, uScan) * step(uScan, 0.999);
    gl_FragColor = vec4(col, 1.0);
  }`;

export async function mountScanBust(container, opts = {}) {
  const { src = new URL('./marble-bust.glb', import.meta.url).href, auto = true, background = null, offsetX = 0 } = opts;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab';
  container.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: background == null, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  if (background) renderer.setClearColor(background, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 10);
  camera.position.set(0, 0.3, 1.5);
  camera.lookAt(0, 0.245, 0);

  const uniforms = {
    uNor: { value: null }, uScan: { value: 0.0 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
    cNight: { value: COL.night }, cDeep: { value: COL.deep }, cViolet: { value: COL.violet },
    cLilac: { value: COL.lilac }, cInk: { value: COL.ink }, cSpark: { value: COL.spark },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms });

  const gltf = await new GLTFLoader().loadAsync(src);
  const pivot = new THREE.Group();
  scene.add(pivot);
  gltf.scene.traverse((o) => {
    if (o.isMesh) {
      uniforms.uNor.value = o.material.normalMap;
      o.material = mat;
    }
  });
  pivot.add(gltf.scene);

  // plinth line: a thin spark ring under the bust
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.172, 96), new THREE.MeshBasicMaterial({ color: COL.spark, transparent: true, opacity: 0.8 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = -0.004;
  scene.add(ring);

  // interaction: drag to rotate, ease back toward a 3/4 view
  let target = -0.5, rot = -0.5, drag = null, manual = null, raf = 0;
  const down = (e) => { drag = { x: e.clientX, r: target }; canvas.style.cursor = 'grabbing'; canvas.setPointerCapture?.(e.pointerId); };
  const move = (e) => { if (drag) target = drag.r + (e.clientX - drag.x) * 0.008; };
  const up = () => { drag = null; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  addEventListener('pointerup', up);

  const size = () => {
    const w = container.clientWidth || 600, h = container.clientHeight || 600;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (offsetX) camera.setViewOffset(w, h, -offsetX * w, 0, w, h);
    uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  };
  const ro = new ResizeObserver(size); ro.observe(container); size();

  const t0 = performance.now();
  const tick = () => {
    const t = (performance.now() - t0) / 1000;
    uniforms.uTime.value = t;
    if (!drag) target += (-0.5 + Math.sin(t * 0.35) * 0.35 - target) * 0.01;
    rot += (target - rot) * 0.08;
    pivot.rotation.y = rot;
    uniforms.uScan.value = manual ?? (auto ? (Math.sin(t * 0.45 - 1.5) * 0.5 + 0.5) : 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();

  return {
    setProgress(p) { manual = p == null ? null : Math.min(1, Math.max(0, p)); },
    setRotation(r) { target = r; rot = r; },
    renderer, scene, camera,
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('pointerup', up); renderer.dispose(); canvas.remove(); },
  };
}
