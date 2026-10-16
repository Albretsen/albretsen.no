// cel-object.js — design 41 "Key Frame"
// A cel-shaded, ink-outlined 3D "A" you can grab, spin and throw.
// Hand-written two-band toon shader (paper / cel blue / core shadow + a hard
// highlight), inverted-hull ink line, and a pose clock that can run "on twos"
// (12 drawings a second, the Spider-Verse trick) while the camera stays smooth.
//
//   import { mountCelObject } from './cel-object.js'
//   const obj = mountCelObject(el, { shape: 'A', onTwos: true })
//   obj.on('impact', ({ speed, side }) => …)   // hits a frame edge
//   obj.on('grab' | 'release', …)
//   obj.setOnTwos(false); obj.fling(vx, vy, spin); obj.destroy()
//
// Three.js is loaded lazily from jsDelivr (pinned). No other dependencies.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

export const PALETTE = {
  ink: '#011835', ink950: '#010b1d', ink700: '#042e57',
  blue: '#259cde', blue200: '#95ccef', paper: '#e8f6fd', white: '#ffffff',
};

const toonVert = /* glsl */`
  varying vec3 vN; varying vec3 vV;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position,1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const toonFrag = /* glsl */`
  uniform vec3 uLight, cPaper, cBlue, cCore, cHi, cRim;
  uniform float uSteps;
  varying vec3 vN; varying vec3 vV;
  void main(){
    vec3 n = normalize(vN);
    float d = dot(n, normalize(uLight));
    // hard terminator, painted like a cel: lit / shadow / core shadow
    vec3 col = d > 0.28 ? cPaper : (d > -0.35 ? cBlue : cCore);
    // hard specular "cel glint"
    vec3 h = normalize(normalize(uLight) + vV);
    if (pow(max(dot(n,h),0.0), 60.0) > 0.5) col = cHi;
    // rim band on the shadow side, a classic anime touch
    float rim = 1.0 - max(dot(n, vV), 0.0);
    if (rim > 0.74 && d < 0.28 && d > -0.6) col = cRim;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;
const hullVert = /* glsl */`
  uniform float uThick;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position,1.0);
    vec3 n = normalize(normalMatrix * normal);
    // constant screen-ish thickness: scale by view depth
    mv.xyz += n * uThick * (-mv.z) * 0.012;
    gl_Position = projectionMatrix * mv;
  }`;
const hullFrag = /* glsl */`
  uniform vec3 cInk;
  void main(){ gl_FragColor = vec4(cInk,1.0);
    #include <colorspace_fragment>
  }`;

function aShape(THREE) {
  // Same geometry as identity/mark.svg (128 grid), centred and y-flipped.
  const P = (x, y) => new THREE.Vector2((x - 64) / 52, (62 - y) / 52);
  const s = new THREE.Shape([P(64, 10), P(118, 114), P(96, 114), P(86.6, 96), P(41.4, 96), P(32, 114), P(10, 114)]);
  s.holes.push(new THREE.Path([P(64, 52.4), P(78.3, 80), P(49.7, 80)]));
  return s;
}

// Average normals of coincident vertices so the inflated hull stays closed.
function smoothHull(THREE, geo) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const p = g.attributes.position, n = g.attributes.normal, acc = new Map();
  const key = i => `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
  for (let i = 0; i < p.count; i++) {
    const k = key(i), v = acc.get(k) || [0, 0, 0];
    v[0] += n.getX(i); v[1] += n.getY(i); v[2] += n.getZ(i); acc.set(k, v);
  }
  const out = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const v = acc.get(key(i)), l = Math.hypot(...v) || 1;
    out[i * 3] = v[0] / l; out[i * 3 + 1] = v[1] / l; out[i * 3 + 2] = v[2] / l;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return g;
}

export async function mountCelObject(container, opts = {}) {
  const o = Object.assign({ shape: 'A', onTwos: true, gravity: 0, bounce: 0.72, outline: 1, autoSpin: 0.35, background: null, pose: [-0.28, 0.75, 0.08], scale: 1, offset: [0, 0], light: [-0.45, 0.6, 0.85] }, opts);
  const THREE = await import(THREE_URL);
  const listeners = {};
  const emit = (k, v) => (listeners[k] || []).forEach(f => f(v));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !o.background });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  if (o.background) renderer.setClearColor(o.background, 1);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const col = c => new THREE.Color(c);
  const toon = new THREE.ShaderMaterial({
    vertexShader: toonVert, fragmentShader: toonFrag,
    uniforms: {
      uLight: { value: new THREE.Vector3(...o.light) },
      cPaper: { value: col(PALETTE.white) }, cBlue: { value: col(PALETTE.blue) },
      cCore: { value: col(PALETTE.ink700) }, cHi: { value: col(PALETTE.white) }, cRim: { value: col(PALETTE.blue200) }, uSteps: { value: 3 },
    },
  });
  const hull = new THREE.ShaderMaterial({
    vertexShader: hullVert, fragmentShader: hullFrag, side: THREE.BackSide,
    uniforms: { uThick: { value: 0.9 * o.outline }, cInk: { value: col(PALETTE.ink) } },
  });

  let geo;
  if (o.shape === 'knot') geo = new THREE.TorusKnotGeometry(0.85, 0.3, 220, 28);
  else if (o.shape === 'ico') geo = new THREE.IcosahedronGeometry(1.15, 0);
  else {
    geo = new THREE.ExtrudeGeometry(aShape(THREE), { depth: 0.55, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 });
    geo.center();
  }
  // smooth normals for the hull so the ink line never cracks at hard edges
  const hullGeo = smoothHull(THREE, geo);

  const pivot = new THREE.Group();
  const body = new THREE.Mesh(geo, toon);
  const line = new THREE.Mesh(hullGeo, hull);
  const squash = new THREE.Group();
  squash.add(body, line); pivot.add(squash); scene.add(pivot);


  // --- physics state (in world units on the z=0 plane)
  const home = new THREE.Vector2(...o.offset);
  const pos = home.clone(), vel = new THREE.Vector2(0, 0);
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...o.pose));
  const angVel = new THREE.Vector3(0, o.autoSpin, 0);
  let grabbed = false, grabOffset = new THREE.Vector2(), lastPtr = null, squashT = 0, squashAxis = new THREE.Vector3(1, 0, 0);
  let bounds = { x: 3, y: 2 };

  function resize() {
    const r = container.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return; // not laid out yet
    const w = r.width, h = r.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const vh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    bounds = { x: Math.max(0.5, vh * camera.aspect - 1.15), y: Math.max(0.5, vh - 1.15) };
    const s = Math.min(1, camera.aspect / 1.1);
    pivot.scale.setScalar(Math.max(0.62, s) * o.scale);
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function toWorld(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const vh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    return new THREE.Vector2(ndc.x * vh * camera.aspect, ndc.y * vh);
  }
  function onDown(e) {
    const p = toWorld(e);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(body, false).length || p.distanceTo(pos) < 1.3 * pivot.scale.x;
    if (!hit) return;
    grabbed = true; renderer.domElement.setPointerCapture(e.pointerId);
    renderer.domElement.style.cursor = 'grabbing';
    grabOffset.copy(pos).sub(p); lastPtr = { p, t: performance.now() };
    vel.set(0, 0); emit('grab', {});
  }
  function onMove(e) {
    const p = toWorld(e);
    if (!grabbed) { // hover cursor
      renderer.domElement.style.cursor = p.distanceTo(pos) < 1.3 * pivot.scale.x ? 'grab' : 'default';
      return;
    }
    const now = performance.now(), dt = Math.max(1, now - lastPtr.t) / 1000;
    const target = p.clone().add(grabOffset);
    const d = target.clone().sub(pos);
    vel.copy(d).divideScalar(dt).multiplyScalar(0.5).add(vel.multiplyScalar(0.5));
    pos.copy(target);
    // dragging also torques the object: spin follows the hand
    angVel.x += -d.y * 2.2; angVel.y += d.x * 2.2;
    lastPtr = { p, t: now };
  }
  function onUp() {
    if (!grabbed) return;
    grabbed = false; renderer.domElement.style.cursor = 'grab';
    vel.clampLength(0, 28);
    emit('release', { speed: vel.length() });
  }
  const el = renderer.domElement;
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);

  let raf, last = performance.now(), poseClock = 0, visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }); io.observe(container);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function step(now) {
    raf = requestAnimationFrame(step);
    if (!visible) { last = now; return; }
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (!grabbed) {
      vel.y -= o.gravity * dt;
      pos.addScaledVector(vel, dt);
      vel.multiplyScalar(Math.pow(0.35, dt));
      // frame edges: bounce, squash, and tell the page (impact frame)
      const hitX = Math.abs(pos.x) > bounds.x, hitY = Math.abs(pos.y) > bounds.y;
      if (hitX || hitY) {
        const speed = hitX ? Math.abs(vel.x) : Math.abs(vel.y);
        if (hitX) { pos.x = Math.sign(pos.x) * bounds.x; vel.x *= -o.bounce; angVel.y *= -0.8; }
        if (hitY) { pos.y = Math.sign(pos.y) * bounds.y; vel.y *= -o.bounce; angVel.x *= -0.8; }
        if (speed > 2.5) {
          squashT = Math.min(1, speed / 14); squashAxis.set(hitX ? 1 : 0, hitY ? 1 : 0, 0);
          emit('impact', { speed, side: hitX ? (pos.x > 0 ? 'right' : 'left') : (pos.y > 0 ? 'top' : 'bottom') });
        }
      }
      // spring home gently when idle
      if (vel.length() < 0.4) pos.lerp(home, dt * 0.6);
    }
    angVel.multiplyScalar(Math.pow(0.55, dt));
    angVel.y += (o.autoSpin - angVel.y) * dt * 0.4;
    const w = angVel.length();
    if (w > 1e-4 && !reduce) q.premultiply(new THREE.Quaternion().setFromAxisAngle(angVel.clone().normalize(), w * dt));
    squashT *= Math.pow(0.002, dt);

    // pose clock: on twos holds each drawing for 1/12 s
    poseClock += dt;
    const hold = o.onTwos ? 1 / 12 : 0;
    if (poseClock >= hold) {
      poseClock = 0;
      pivot.position.set(pos.x, pos.y, 0);
      pivot.quaternion.copy(q);
      const s = 1 + squashT * 0.35;
      squash.scale.set(squashAxis.x ? 1 / s : s, squashAxis.y ? 1 / s : s, 1);
      // smear: stretch along velocity when thrown fast
      const sp = vel.length();
      if (!squashT && sp > 9) {
        const k = Math.min(0.35, (sp - 9) / 40);
        squash.rotation.z = 0; squash.scale.set(1 + k * Math.abs(vel.x) / sp, 1 + k * Math.abs(vel.y) / sp, 1);
      }
    }
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(step);

  return {
    on(k, f) { (listeners[k] ||= []).push(f); return this; },
    setOnTwos(v) { o.onTwos = !!v; },
    fling(vx = 12, vy = 6, spin = 6) { vel.set(vx, vy); angVel.set(spin * 0.4, spin, 0); },
    setPalette(p) { Object.assign(PALETTE, p); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); el.remove(); },
    get canvas() { return el; },
  };
}
