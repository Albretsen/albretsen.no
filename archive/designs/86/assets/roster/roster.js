// Albretsen AS / design 86 "Airglow" — the product roster in low orbit.
// A thin lattice ring floats above the Earth's night limb. The products stand on
// it like characters on a select screen; progress (0..1) turns the ring so each
// product in turn comes to the front, rises a little and lights its emission line.
//
// Usage:
//   import { createRoster } from './roster.js'
//   const r = await createRoster(canvas, { base: '../../../_shared/products/' })
//   r.setProgress(0.33)     // scroll-driven, eased plateaus at each product
//   r.select(2)             // jump to a product (animates when live)
//   r.renderOnce()          // deterministic still (used for baking frames)
//   r.start() / r.stop()    // live loop with gentle pointer parallax
//
// opts.backdrop: URL of a 16:9 photograph to sit behind the ring (default: the graded
// NASA orbital sunrise, hero/firstlight-1600.jpg). Pass backdrop: null for the fully
// synthetic planet (shader limb + lattice), which needs no image at all.
//
// three.js r169, imported by exact URL so the module works without an import map.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js';

export const PRODUCTS = [
  { id: 'mcp-emails', name: 'MCP Emails', color: '#e9e558', nm: 557.7, logo: 'mcp-emails/icon.png' },
  { id: 'fun-libs',   name: 'Fun Libs',   color: '#f7ac4d', nm: 589.0, logo: 'fun-libs/icon.png' },
  { id: 'toolrails',  name: 'Toolrails',  color: '#7988ed', nm: 427.8, logo: 'toolrails/icon.svg' },
  { id: 'harbor',     name: 'Harbor',     color: '#e86154', nm: 630.0, logo: 'harbor/harbor-mark.svg', bg: '#1b1b1b', fg: '#F2EFE9' },
];

const VOID = new THREE.Color('#070d15');
const LIMB = new THREE.Color('#52afe7');
const GREEN = new THREE.Color('#e9e558');

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

async function logoTexture(p, base) {
  // Draw the real logo, unchanged, onto a rounded tile so it reads as an app tile.
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const r = S * 0.22;
  g.beginPath(); g.roundRect(0, 0, S, S, r); g.closePath(); g.clip();
  if (p.bg) {
    g.fillStyle = p.bg; g.fillRect(0, 0, S, S);
    let svg = await (await fetch(base + p.logo)).text();
    svg = svg.replace(/currentColor/g, p.fg).replace('width="64" height="64"', 'width="512" height="512"');
    const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    g.drawImage(img, S * 0.14, S * 0.14, S * 0.72, S * 0.72);
  } else {
    const img = await loadImage(base + p.logo);
    g.drawImage(img, 0, 0, S, S);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// deterministic pseudo random
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

// Eased plateaus: progress 0..1 -> continuous index 0..N-1 that lingers on each product.
export function plateau(t, n = PRODUCTS.length, hold = 0.42) {
  const x = Math.min(Math.max(t, 0), 1) * (n - 1);
  const i = Math.floor(x), f = x - i;
  const a = hold / 2;
  let e = f < a ? 0 : f > 1 - a ? 1 : (f - a) / (1 - 2 * a);
  e = e * e * (3 - 2 * e);
  return Math.min(i + e, n - 1);
}

export async function createRoster(canvas, opts = {}) {
  const base = opts.base ?? '../../../_shared/products/';
  const backdrop = opts.backdrop === undefined ? new URL('../hero/firstlight-1600.jpg', import.meta.url).href : opts.backdrop;
  const dpr = Math.min(opts.dpr ?? window.devicePixelRatio ?? 1, 2);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: !!opts.still });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(VOID, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(VOID, 26, 60);
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 400);
  const camBase = new THREE.Vector3(0, 2.0, 17.5);
  const look = new THREE.Vector3(0, 0.05, 0);

  // ---- stars ----
  {
    const R = rng(7), n = 1800, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = R() * 2 - 1, th = R() * Math.PI * 2, rr = Math.sqrt(1 - u * u);
      const v = new THREE.Vector3(rr * Math.cos(th), Math.abs(u) * 0.9 + 0.05, rr * Math.sin(th)).normalize().multiplyScalar(180);
      pos.set([v.x, v.y, v.z - 40], i * 3);
      const b = 0.25 + Math.pow(R(), 6) * 0.9; col.set([b, b, b * (0.92 + R() * 0.12)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, fog: false })));
  }

  // ---- planet, night side, with a lattice and an atmosphere rim ----
  const planetR = 320, planetC = new THREE.Vector3(0, -planetR - 6.5, -120);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(planetR, 192, 128),
    new THREE.MeshBasicMaterial({ color: '#060b12', fog: false }));
  planet.position.copy(planetC); scene.add(planet);
  const lattice = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(planetR + 0.05, 48)),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false,
      uniforms: { uColor: { value: LIMB.clone() }, uCam: { value: new THREE.Vector3() } },
      vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vN = normalize(w.xyz - (modelMatrix*vec4(0.,0.,0.,1.)).xyz); gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform vec3 uColor; uniform vec3 uCam; varying vec3 vN; varying vec3 vW; void main(){ vec3 v = normalize(uCam - vW); float f = 1. - abs(dot(v, vN)); float a = pow(f, 7.) * .32; gl_FragColor = vec4(uColor, a); }`,
    }));
  lattice.position.copy(planetC); scene.add(lattice);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(planetR * 1.02, 192, 128), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uLimb: { value: LIMB }, uGreen: { value: GREEN }, uCam: { value: new THREE.Vector3() }, uC: { value: planetC }, uR: { value: planetR } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uLimb, uGreen, uCam, uC; uniform float uR; varying vec3 vW;
      void main(){
        vec3 rd = normalize(vW - uCam);
        // closest approach of the view ray to the planet centre -> height above the surface
        float t = dot(uC - uCam, rd); vec3 p = uCam + rd * t; float h = (length(p - uC) - uR) / (uR * .006);
        float limb = exp(-max(h, 0.) * 6.5) * smoothstep(-.06, .0, h);
        float green = exp(-pow((h - .62) * 7., 2.)) * .22 + exp(-max(h, 0.) * 1.2) * .05;
        vec3 col = uLimb * limb * 1.25 + uGreen * green;
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  atmo.position.copy(planetC); scene.add(atmo);

  let bgTex = null;
  if (backdrop) {
    bgTex = await new THREE.TextureLoader().loadAsync(backdrop);
    bgTex.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgTex;
    scene.fog = null;
    [planet, lattice, atmo].forEach(o => o.visible = false);
    scene.children.filter(o => o.isPoints).forEach(o => o.visible = false);
  }

  // ---- light ----
  scene.add(new THREE.HemisphereLight('#9fb4d6', '#05080c', 0.35));
  const sun = new THREE.DirectionalLight('#ffc98a', backdrop ? 2.6 : 1.6); sun.position.set(7, -0.4, -9); scene.add(sun);
  const rim = new THREE.DirectionalLight('#7fc4ff', 1.2); rim.position.set(-6, -1.5, -8); scene.add(rim);
  const key = new THREE.DirectionalLight('#f4f5e7', 0.9); key.position.set(-3, 5, 10); scene.add(key);

  // ---- lattice ring (a truss: two circles and zig-zag struts) ----
  const ring = new THREE.Group(); scene.add(ring);
  const RR = 4.6, N = 120;
  {
    const pts = [];
    const a = (i) => i / N * Math.PI * 2;
    const P = (r, y, i) => new THREE.Vector3(Math.cos(a(i)) * r, y, Math.sin(a(i)) * r);
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      pts.push(P(RR, -0.62, i), P(RR, -0.62, j), P(RR + 0.32, -0.78, i), P(RR + 0.32, -0.78, j));
      pts.push(P(RR, -0.62, i), P(RR + 0.32, -0.78, j));
      if (i % 3 === 0) pts.push(P(RR, -0.62, i), P(RR + 0.32, -0.78, i));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    ring.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#c9d3d6', transparent: true, opacity: 0.26 })));
    const nodes = []; for (let i = 0; i < N; i += 3) nodes.push(P(RR, -0.62, i));
    ring.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(nodes), new THREE.PointsMaterial({ color: '#f4f5e7', size: 2.2, sizeAttenuation: false })));
  }

  // ---- product tiles ----
  const glowTex = glowTexture();
  const tiles = [];
  const tileGeo = new THREE.ExtrudeGeometry(roundedRectShape(1.5, 1.5, 0.34), { depth: 0.16, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 6, curveSegments: 24 });
  tileGeo.translate(0, 0, -0.08);
  const faceGeo = new THREE.PlaneGeometry(1.36, 1.36);
  for (let k = 0; k < PRODUCTS.length; k++) {
    const p = PRODUCTS[k];
    const g = new THREE.Group();
    const body = new THREE.Mesh(tileGeo, new THREE.MeshPhysicalMaterial({
      color: '#121a26', roughness: 0.22, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06,
    }));
    const tex = await logoTexture(p, base);
    const face = new THREE.Mesh(faceGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
    face.position.z = 0.135;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: p.color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.0 }));
    glow.scale.set(3.6, 3.6, 1); glow.position.z = -0.5;
    const pool = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: p.color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.0 }));
    pool.scale.set(3.4, 0.7, 1); pool.position.y = -1.05;
    const light = new THREE.PointLight(p.color, 0, 6, 1.6); light.position.set(0, -1.25, 0.4);
    g.add(glow, body, face, pool, light);
    ring.add(g);
    tiles.push({ g, glow, pool, light, body });
  }

  // ---- state ----
  let progress = 0, live = false, raf = 0, target = 0, cur = 0;
  const pointer = new THREE.Vector2(), pSmooth = new THREE.Vector2();
  const ndc = new THREE.Vector2(), ray = new THREE.Raycaster();

  function layout(idx) {
    // idx is the continuous selected index; product k sits at angle k*90deg, front is +z
    const step = Math.PI * 2 / PRODUCTS.length;
    ring.rotation.y = idx * step;
    tiles.forEach((t, k) => {
      const ang = k * step + Math.PI / 2;
      const sel = Math.max(0, 1 - Math.abs(idx - k));
      const s = sel * sel * (3 - 2 * sel);
      t.g.position.set(Math.cos(ang) * RR, 0.18 + s * 0.42, Math.sin(ang) * RR);
      t.g.rotation.y = -(ang - Math.PI / 2) * 0.55 - ring.rotation.y * 0.45;
      const sc = 0.86 + s * 0.24; t.g.scale.setScalar(sc);
      t.glow.material.opacity = 0.04 + s * 0.26;
      t.pool.material.opacity = 0.06 + s * 0.5;
      t.light.intensity = 0.2 + s * 4;
    });
  }

  function resize() {
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the ring framed on tall screens
    const wide = 16 / 9, hf = Math.atan(Math.tan(15 * Math.PI / 180) * wide) * 1.04; // keep the 16:9 horizontal field
    camera.fov = camera.aspect < wide ? 2 * Math.atan(Math.tan(hf) / camera.aspect) * 180 / Math.PI : 30;
    camera.updateProjectionMatrix();
    if (bgTex) { // cover-fit the photograph, anchored to its lower edge (the limb)
      const ta = bgTex.image.width / bgTex.image.height, a = camera.aspect;
      if (a > ta) { bgTex.repeat.set(1, ta / a); bgTex.offset.set(0, 0.06 * (1 - ta / a)); }
      else { const r = a / ta; bgTex.repeat.set(r, 1); bgTex.offset.set(Math.min(1 - r, Math.max(0, 0.6 - r * 0.5)), 0); } // lean toward the sun
    }
  }

  function draw() {
    camera.position.set(camBase.x + pSmooth.x * 0.9, camBase.y + pSmooth.y * 0.45, camBase.z);
    camera.lookAt(look);
    lattice.material.uniforms.uCam.value.copy(camera.position);
    atmo.material.uniforms.uCam.value.copy(camera.position);
    renderer.render(scene, camera);
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    pSmooth.lerp(pointer, 0.05);
    cur += (target - cur) * 0.08;
    layout(cur);
    draw();
  }

  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  }
  function onClick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(tiles.map(t => t.body), false)[0];
    if (hit) { const k = tiles.findIndex(t => t.body === hit.object); api.select(k); canvas.dispatchEvent(new CustomEvent('roster:select', { detail: { index: k, product: PRODUCTS[k] } })); }
  }

  resize(); layout(0);

  const api = {
    products: PRODUCTS,
    setProgress(t) { progress = t; target = plateau(t); if (!live) { cur = target; layout(cur); draw(); } },
    select(k) { target = k; progress = k / (PRODUCTS.length - 1); if (!live) { cur = k; layout(k); draw(); } },
    renderOnce() { layout(cur); draw(); },
    start() {
      if (live) return; live = true;
      canvas.addEventListener('pointermove', onMove); canvas.addEventListener('click', onClick);
      addEventListener('resize', resize); tick();
    },
    stop() { live = false; cancelAnimationFrame(raf); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('click', onClick); removeEventListener('resize', resize); },
    resize,
    dispose() { api.stop(); renderer.dispose(); },
  };
  return api;
}
