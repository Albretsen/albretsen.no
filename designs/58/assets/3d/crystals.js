/* Specimen Drop — "The Lapis Geode"
 * A three.js scene built only from primitives: a lapis-lazuli matrix (displaced icosahedron,
 * vertex-coloured with pyrite flecks) studded with crystals (hexagonal lathes, octahedra,
 * cubes). Each crystal IS a product. Drag the stone to turn it; drag a crystal to pull it
 * off and re-seat it in another socket — every move is a hand-rolled spring (../motion.js).
 *
 *   import { mountGeode } from './3d/crystals.js'
 *   const geode = await mountGeode(el, { onHover: (p) => ..., onRearrange: (order) => ... })
 *
 * Options: products, background (hex|null), still (render one frame, no loop),
 *          autoRotate, pixelRatio, yaw, pitch, zoom.
 * API: { project(id) -> {x,y}, setView(yaw,pitch), shuffle(), destroy(), renderer }
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { Spring, SPRINGS } from '../motion.js';

export const PALETTE = {
  lapis: 0x073fe3, deep: 0x082593, ink: 0x061457, night: 0x040b2d,
  peri: 0x97b7f8, frost: 0xcadbfd, vellum: 0xfaf3e3, rose: 0xec3d5f, pollen: 0xf4cd4b,
};

// Default specimens: the four current products are the big crystals; retired ones are small.
export const DEFAULT_PRODUCTS = [
  { id: 'mcp-emails', name: 'MCP Emails', habit: 'quartz', size: 1.0, tint: 'frost' },
  { id: 'fun-libs', name: 'Fun Libs', habit: 'quartz', size: 0.82, tint: 'pollen' },
  { id: 'toolrails', name: 'Toolrails', habit: 'twin', size: 0.78, tint: 'peri' },
  { id: 'harbor', name: 'Harbor', habit: 'octa', size: 0.62, tint: 'vellum' },
  { id: 'luma', name: 'Luma', habit: 'cube', size: 0.34, tint: 'rose' },
  { id: 'polyglot-pilot', name: 'Polyglot Pilot', habit: 'quartz', size: 0.42, tint: 'peri' },
  { id: 'pinpoint', name: 'PinPoint', habit: 'octa', size: 0.32, tint: 'frost' },
  { id: 'webvakt', name: 'WebVakt', habit: 'quartz', size: 0.36, tint: 'frost' },
  { id: 'joke-central', name: 'Joke Central', habit: 'cube', size: 0.28, tint: 'pollen' },
  { id: 'tryggere-hyring', name: 'Tryggere Hyring', habit: 'twin', size: 0.33, tint: 'vellum' },
  { id: 'early-apps', name: 'Early apps', habit: 'octa', size: 0.26, tint: 'peri' },
];

/* ---------- geometry from primitives ---------- */
function quartz(r, h, cap, sides = 6) {
  const pts = [new THREE.Vector2(0, -0.15), new THREE.Vector2(r * 0.88, 0), new THREE.Vector2(r, h), new THREE.Vector2(0, h + cap)];
  return new THREE.LatheGeometry(pts, sides).toNonIndexed();
}
function twin(r, h, cap) {
  const pts = [new THREE.Vector2(0, -0.15), new THREE.Vector2(r * 0.7, 0.05), new THREE.Vector2(r, cap * 0.6), new THREE.Vector2(r, h), new THREE.Vector2(0, h + cap)];
  return new THREE.LatheGeometry(pts, 6).toNonIndexed();
}
function octa(s) { const g = new THREE.OctahedronGeometry(s, 0); g.scale(1, 1.25, 1); g.translate(0, s * 1.05, 0); return g; }
function cube(s) { const g = new THREE.BoxGeometry(s, s, s); g.rotateX(0.62); g.rotateZ(0.78); g.translate(0, s * 0.62, 0); return g; }

function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function noise3(x, y, z) {
  // value noise, trilinear
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let out = 0;
  for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) for (let dz = 0; dz < 2; dz++)
    out += hash3(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
  return out;
}

function matrixStone() {
  const g = new THREE.IcosahedronGeometry(1.5, 11);
  const pos = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = noise3(v.x * 1.3 + 4, v.y * 1.3, v.z * 1.3) * 0.5 + noise3(v.x * 3.1, v.y * 3.1 + 9, v.z * 3.1) * 0.22;
    v.multiplyScalar(0.78 + n * 0.5);
    v.y *= v.y > 0 ? 0.5 : 0.36;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  const ng = g.toNonIndexed();
  ng.computeVertexNormals();
  // soften: blend face normals toward the ellipsoid normal, so the stone reads polished, not low-poly
  {
    const P = ng.attributes.position, Nn = ng.attributes.normal, a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      const y = P.getY(i), k = y > 0 ? 0.5 : 0.36;
      a.set(P.getX(i), y / (k * k), P.getZ(i)).normalize();
      b.fromBufferAttribute(Nn, i).lerp(a, 0.72).normalize();
      Nn.setXYZ(i, b.x, b.y, b.z);
    }
  }
  // per-face colour: lapis with calcite veins and pyrite flecks
  const p = ng.attributes.position, colors = new Float32Array(p.count * 3);
  const lapis = new THREE.Color(PALETTE.lapis), deep = new THREE.Color(PALETTE.deep), ink = new THREE.Color(PALETTE.ink);
  const calcite = new THREE.Color(PALETTE.frost), pyrite = new THREE.Color(PALETTE.pollen);
  const c = new THREE.Color();
  for (let f = 0; f < p.count; f += 3) {
    const cx = (p.getX(f) + p.getX(f + 1) + p.getX(f + 2)) / 3, cy = (p.getY(f) + p.getY(f + 1) + p.getY(f + 2)) / 3, cz = (p.getZ(f) + p.getZ(f + 1) + p.getZ(f + 2)) / 3;
    const n = noise3(cx * 2.2, cy * 2.2, cz * 2.2), r = hash3(cx * 91, cy * 37, cz * 53);
    c.copy(ink).lerp(deep, n * 1.4).lerp(lapis, Math.max(0, n - 0.55) * 1.6).lerp(ink, Math.max(0, -cy) * 0.9);
    if (Math.abs(n - 0.5) < 0.01) c.lerp(calcite, 0.18);
    if (r > 0.992) c.copy(pyrite).multiplyScalar(0.8);
    for (let k = 0; k < 3; k++) c.toArray(colors, (f + k) * 3);
  }
  ng.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return ng;
}

/* ---------- a soft studio for reflections, built from primitives (no HDRI download) ---------- */
function studioEnv(renderer) {
  const env = new THREE.Scene();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true }));
  const pos = dome.geometry.attributes.position, col = new Float32Array(pos.count * 3);
  const top = new THREE.Color(PALETTE.vellum), bot = new THREE.Color(PALETTE.lapis), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) { const t = pos.getY(i) / 10 * 0.5 + 0.5; c.copy(bot).lerp(top, Math.pow(t, 0.8)).toArray(col, i * 3); }
  dome.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  env.add(dome);
  const box = (w, h, color, intensity, p, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...p); m.lookAt(...look); env.add(m);
  };
  box(6, 4, 0xfff4e0, 6, [-5, 6, 4], [0, 0, 0]); // warm key softbox
  box(3, 8, PALETTE.peri, 3, [7, 1, -2], [0, 0, 0]); // cool rim strip
  box(10, 1.2, 0xffffff, 2.5, [0, 8, -5], [0, 0, 0]); // top strip
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(env, 0.02);
  pm.dispose();
  return rt.texture;
}

export async function mountGeode(container, opts = {}) {
  const o = Object.assign({ products: DEFAULT_PRODUCTS, background: null, still: false, autoRotate: true, pixelRatio: Math.min(devicePixelRatio || 1, 2), yaw: -0.5, pitch: 0.32, zoom: 1, onHover: null, onRearrange: null, crystalScale: 1.0, druse: 160, shadow: true }, opts);
  const W = () => container.clientWidth || 800, H = () => container.clientHeight || 600;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: o.background == null, preserveDrawingBuffer: o.still });
  renderer.setPixelRatio(o.pixelRatio);
  renderer.setSize(W(), H());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (o.background != null) scene.background = new THREE.Color(o.background);
  scene.environment = studioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(30, W() / H(), 0.1, 100);
  camera.position.set(0, 1.9, 8.4 / o.zoom); camera.lookAt(0, 1.0, 0);

  const key = new THREE.DirectionalLight(0xfff1dc, 2.2); key.position.set(-4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(PALETTE.peri, 2.4); rim.position.set(5, 2, -4); scene.add(rim);
  scene.add(new THREE.HemisphereLight(PALETTE.vellum, PALETTE.ink, 0.25));

  const specimen = new THREE.Group(); scene.add(specimen);
  const stone = new THREE.Mesh(matrixStone(), new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.0, clearcoat: 0.15, clearcoatRoughness: 0.5, flatShading: false, envMapIntensity: 0.3 }));
  specimen.add(stone);

  // contact shadow: a radial gradient on a plane
  const sh = document.createElement('canvas'); sh.width = sh.height = 128;
  const g2 = sh.getContext('2d'), grd = g2.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(4,11,45,.55)'); grd.addColorStop(1, 'rgba(4,11,45,0)'); g2.fillStyle = grd; g2.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.62; if (o.shadow) scene.add(shadow);

  // sockets on the upper surface of the stone (golden-angle spiral, projected onto the mesh by raycast)
  const ray = new THREE.Raycaster(), sockets = [];
  const N = Math.max(o.products.length + 3, 14);
  for (let i = 0; i < N * 3 && sockets.length < N; i++) {
    const t = (i + 0.5) / (N * 3), phi = Math.acos(1 - t * 0.95), th = i * 2.39996;
    const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)).normalize();
    ray.set(dir.clone().multiplyScalar(6), dir.clone().negate());
    const hit = ray.intersectObject(stone)[0]; if (!hit) continue;
    if (sockets.some((s) => s.p.distanceTo(hit.point) < 0.5)) continue;
    const n = hit.face.normal.clone().lerp(new THREE.Vector3(0, 1, 0), 0.55).add(dir.clone().multiplyScalar(0.4)).normalize();
    sockets.push({ p: hit.point.clone().addScaledVector(n, -0.14), n, owner: null });
  }
  // druse: a carpet of tiny quartz points (instanced), the texture that makes it read as a real geode
  if (o.druse) {
    const dg = quartz(0.06, 0.16, 0.1);
    const dm = new THREE.MeshPhysicalMaterial({ color: PALETTE.frost, flatShading: true, roughness: 0.1, transmission: 0.5, thickness: 0.2, clearcoat: 1, envMapIntensity: 1.4 });
    const inst = new THREE.InstancedMesh(dg, dm, o.druse);
    const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), sc = new THREE.Vector3();
    let k = 0;
    for (let i = 0; i < o.druse * 6 && k < o.druse; i++) {
      const dir = new THREE.Vector3(hash3(i, 1, 2) - 0.5, hash3(i, 3, 4) * 0.9 + 0.1, hash3(i, 5, 6) - 0.5).normalize();
      ray.set(dir.clone().multiplyScalar(6), dir.clone().negate());
      const hit = ray.intersectObject(stone)[0]; if (!hit || hit.face.normal.y < 0.25) continue;
      const n = hit.face.normal.clone().add(new THREE.Vector3(hash3(i, 7, 7) - 0.5, 0, hash3(i, 8, 8) - 0.5).multiplyScalar(0.8)).normalize();
      qq.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
      const s = 0.6 + Math.pow(hash3(i, 9, 9), 2.5) * 2.0;
      m4.compose(hit.point.clone().addScaledVector(n, -0.03), qq, sc.set(s, s, s));
      inst.setMatrixAt(k++, m4);
    }
    inst.count = k;
    specimen.add(inst);
  }
  // biggest crystals take the most upright, central sockets
  sockets.sort((a, b) => (b.n.y - b.p.length() * 0.15) - (a.n.y - a.p.length() * 0.15));

  const mat = (tint) => new THREE.MeshPhysicalMaterial({
    color: PALETTE[tint], flatShading: true, roughness: 0.12, metalness: 0, transmission: tint === 'vellum' ? 0.3 : tint === 'frost' ? 0.7 : 0.45,
    thickness: 0.9, ior: 1.54, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.25, iridescenceIOR: 1.3,
    attenuationColor: new THREE.Color(PALETTE[tint]), attenuationDistance: 0.7, envMapIntensity: 1.1,
  });
  const crystals = o.products.map((p, i) => {
    const s = p.size * o.crystalScale;
    const geo = p.habit === 'octa' ? octa(0.5 * s) : p.habit === 'cube' ? cube(0.62 * s) : p.habit === 'twin' ? twin(0.3 * s, 1.05 * s, 0.42 * s) : quartz(0.3 * s, 1.35 * s, 0.5 * s);
    const mesh = new THREE.Mesh(geo, mat(p.tint));
    mesh.userData = { product: p };
    const socket = sockets[i]; socket.owner = mesh;
    const st = {
      socket, spin: (hash3(i, 2, 7) - 0.5) * 0.9, lean: (hash3(i, 5, 1) - 0.5) * 0.25,
      px: new Spring(socket.p.x, SPRINGS.settle), py: new Spring(socket.p.y, SPRINGS.settle), pz: new Spring(socket.p.z, SPRINGS.settle),
      seat: new Spring(1, SPRINGS.settle), scale: new Spring(o.still ? 1 : 0, SPRINGS.settle), glow: new Spring(0, SPRINGS.lift),
    };
    mesh.userData.st = st;
    specimen.add(mesh);
    if (!o.still) setTimeout(() => st.scale.set(1), 380 + i * 90); // "drop" entrance, biggest first
    return mesh;
  });

  const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), qSpin = new THREE.Quaternion(), qFree = new THREE.Quaternion();
  function place(mesh) {
    const st = mesh.userData.st;
    mesh.position.set(st.px.value, st.py.value, st.pz.value);
    q.setFromUnitVectors(up, st.socket.n);
    qSpin.setFromAxisAngle(up, st.spin);
    qFree.setFromEuler(new THREE.Euler(st.lean + 0.5, st.spin * 3, 0.3));
    mesh.quaternion.copy(q).multiply(qSpin).slerp(qFree, 1 - THREE.MathUtils.clamp(st.seat.value, 0, 1));
    const k = Math.max(0, st.scale.value) * (1 + st.glow.value * 0.08);
    mesh.scale.setScalar(k);
    mesh.material.emissive.setHex(PALETTE.lapis); mesh.material.emissiveIntensity = st.glow.value * 0.35;
  }

  // view springs
  const yaw = new Spring(o.yaw, SPRINGS.drift), pitch = new Spring(o.pitch, SPRINGS.drift);
  Object.assign(yaw, { stiffness: 60, damping: 14 }); Object.assign(pitch, { stiffness: 60, damping: 14 });
  let autoYaw = 0;

  /* ---------- interaction ---------- */
  const pointer = new THREE.Vector2(), el = renderer.domElement;
  let mode = null, hover = null, grab = null, last = { x: 0, y: 0 }, lastMove = performance.now();
  const plane = new THREE.Plane(), hitP = new THREE.Vector3(), inv = new THREE.Matrix4();
  const toNDC = (e) => { const b = el.getBoundingClientRect(); pointer.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); };
  const pick = () => { ray.setFromCamera(pointer, camera); return ray.intersectObjects(crystals, false)[0]?.object || null; };
  el.addEventListener('pointerdown', (e) => {
    toNDC(e); el.setPointerCapture(e.pointerId); last = { x: e.clientX, y: e.clientY };
    const hit = pick();
    if (hit) {
      mode = 'crystal'; grab = hit; const st = hit.userData.st;
      st.seat.set(0); st.glow.set(1);
      const wp = hit.getWorldPosition(new THREE.Vector3());
      plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), wp);
      el.style.cursor = 'grabbing';
    } else { mode = 'orbit'; el.style.cursor = 'grabbing'; }
  });
  el.addEventListener('pointermove', (e) => {
    toNDC(e); lastMove = performance.now();
    if (mode === 'orbit') {
      yaw.set(yaw.target + (e.clientX - last.x) * 0.008);
      pitch.set(THREE.MathUtils.clamp(pitch.target + (e.clientY - last.y) * 0.004, -0.1, 0.85));
      last = { x: e.clientX, y: e.clientY };
    } else if (mode === 'crystal' && grab) {
      ray.setFromCamera(pointer, camera);
      if (ray.ray.intersectPlane(plane, hitP)) {
        inv.copy(specimen.matrixWorld).invert(); hitP.applyMatrix4(inv);
        const st = grab.userData.st; st.px.set(hitP.x); st.py.set(hitP.y + 0.25); st.pz.set(hitP.z);
      }
    } else {
      const h = pick();
      if (h !== hover) {
        if (hover) hover.userData.st.glow.set(0);
        hover = h; if (hover) hover.userData.st.glow.set(0.6);
        el.style.cursor = hover ? 'grab' : 'grab';
        o.onHover?.(hover ? hover.userData.product : null);
      }
    }
  });
  const release = () => {
    if (mode === 'crystal' && grab) {
      const st = grab.userData.st, here = new THREE.Vector3(st.px.target, st.py.target, st.pz.target);
      // nearest socket; swap with its owner if taken
      let best = st.socket, bd = Infinity;
      for (const s of sockets) { const d = s.p.distanceTo(here); if (d < bd) { bd = d; best = s; } }
      if (best !== st.socket) {
        const other = best.owner, old = st.socket;
        if (other) { const os = other.userData.st; os.socket = old; old.owner = other; os.px.set(old.p.x); os.py.set(old.p.y); os.pz.set(old.p.z); os.seat.jump(0.6).set(1); }
        else old.owner = null;
        best.owner = grab; st.socket = best;
        o.onRearrange?.(crystals.map((c) => ({ id: c.userData.product.id, socket: sockets.indexOf(c.userData.st.socket) })));
      }
      st.px.set(st.socket.p.x); st.py.set(st.socket.p.y); st.pz.set(st.socket.p.z); st.seat.set(1); st.glow.set(0);
      st.py.impulse(-1.5);
    }
    mode = null; grab = null; el.style.cursor = 'grab';
  };
  el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);
  el.addEventListener('pointerleave', () => { if (hover && !mode) { hover.userData.st.glow.set(0); hover = null; o.onHover?.(null); } });

  const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); if (o.still) frame(0); });
  ro.observe(container);

  function frame(dt) {
    if (o.autoRotate && !o.still && !mode && performance.now() - lastMove > 1800) autoYaw += dt * 0.12;
    specimen.rotation.y = yaw.step(dt) + autoYaw;
    specimen.rotation.x = pitch.step(dt) * 0.35;
    for (const c of crystals) {
      const st = c.userData.st; st.px.step(dt); st.py.step(dt); st.pz.step(dt); st.seat.step(dt); st.scale.step(dt); st.glow.step(dt);
      place(c);
    }
    renderer.render(scene, camera);
  }
  let alive = true, t0 = performance.now();
  if (o.still) frame(0);
  else renderer.setAnimationLoop(() => { const now = performance.now(); const dt = (now - t0) / 1000; t0 = now; if (alive) frame(dt); });

  const v = new THREE.Vector3();
  return {
    renderer, scene, camera,
    project(id) { const c = crystals.find((m) => m.userData.product.id === id); if (!c) return null; c.getWorldPosition(v); v.y += 0.5 * c.userData.product.size; v.project(camera); const b = el.getBoundingClientRect(); return { x: (v.x * 0.5 + 0.5) * b.width, y: (-v.y * 0.5 + 0.5) * b.height }; },
    setView(y, p) { yaw.set(y); pitch.set(p); },
    shuffle() {
      const free = [...sockets].sort(() => Math.random() - 0.5);
      crystals.forEach((c, i) => { const st = c.userData.st; st.socket.owner = null; st.socket = free[i]; free[i].owner = c; st.seat.jump(0.2).set(1); st.px.set(free[i].p.x); st.py.set(free[i].p.y); st.pz.set(free[i].p.z); st.py.impulse(4); });
    },
    renderFrame: () => frame(0),
    // added by the site build: turn a crystal toward the viewer, and light one up from outside the canvas
    focus(id) {
      const c = crystals.find((m) => m.userData.product.id === id); if (!c) return;
      const p = c.userData.st.socket.p, th = Math.atan2(-p.x, p.z);
      let d = th - (yaw.target + autoYaw); d = ((d + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      yaw.set(yaw.target + d); pitch.set(0.28); lastMove = performance.now() + 4000;
    },
    highlight(id) { for (const c of crystals) c.userData.st.glow.set(c.userData.product.id === id ? 0.9 : 0); },
    pause(v) { renderer.setAnimationLoop(v ? null : () => { const now = performance.now(); const dt = (now - t0) / 1000; t0 = now; if (alive) frame(dt); }); t0 = performance.now(); },
    destroy() { alive = false; renderer.setAnimationLoop(null); ro.disconnect(); renderer.dispose(); el.remove(); },
  };
}
