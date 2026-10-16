// orbit.js — interactive low-poly object for "The Albretsen Dawn" (design 43).
//
//   <div id="orbit" style="width:480px;height:480px"></div>
//   <script type="importmap">{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js" } }</script>
//   import { mountOrbit } from './orbit.js'
//   const o = await mountOrbit(document.getElementById('orbit'), { subject: 'planet' })   // or 'crystal'
//
// Drag to spin (with inertia). Satellites keep their orbit. Pauses when off-screen.
// Reduced motion: renders one still frame and only moves when dragged.
import { THREE, C, planet, crystalA, gem, spark, paperPlane, dawnLights } from './lowpoly-kit.js';

export async function mountOrbit(el, { subject = 'planet', background = null, satellites = true } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !background });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'pan-y', cursor: 'grab' });

  const scene = new THREE.Scene();
  if (background) scene.background = new THREE.Color(background);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.6, 11.5); camera.lookAt(0, 0, 0);
  const L = dawnLights(scene, { key: 2.4, dir: [5, 4, 6], shadow: false });

  const pivot = new THREE.Group(); scene.add(pivot);
  const body = subject === 'crystal' ? crystalA({ depth: 0.55, scale: 0.065 }) : planet({ radius: 1.55, detail: 3, seed: 5, rough: 0.08 });
  pivot.add(body);

  // satellites on tilted rings
  const sats = [];
  if (satellites) {
    const ringTilt = new THREE.Group(); ringTilt.rotation.set(0.42, 0, 0.22); scene.add(ringTilt);
    const R = 2.45;
    const pts = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R)); }
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: C.deep, transparent: true, opacity: 0.35 }));
    ringTilt.add(ring);
    const items = [gem('ico', 0.2, C.lilac, 2), gem('oct', 0.16, C.dawn, 3), paperPlane(0.34, 0xffffff), gem('tet', 0.15, C.blush, 4), spark(0.1)];
    items.forEach((m, i) => { const a = i / items.length * Math.PI * 2; sats.push({ m, a, r: R, speed: 0.12 + i * 0.012 }); ringTilt.add(m); });
  }

  // drag with inertia
  let vx = reduce ? 0 : 0.0035, vy = 0, dragging = false, lx = 0, ly = 0;
  const cvs = renderer.domElement;
  cvs.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; cvs.setPointerCapture(e.pointerId); cvs.style.cursor = 'grabbing'; kick(); });
  cvs.addEventListener('pointermove', e => {
    if (!dragging) return;
    vx = (e.clientX - lx) * 0.004; vy = (e.clientY - ly) * 0.004; lx = e.clientX; ly = e.clientY;
    pivot.rotation.y += vx; pivot.rotation.x = Math.max(-0.8, Math.min(0.8, pivot.rotation.x + vy)); kick();
  });
  const end = () => { dragging = false; cvs.style.cursor = 'grab'; };
  cvs.addEventListener('pointerup', end); cvs.addEventListener('pointercancel', end);

  function size() {
    const w = el.clientWidth || 300, h = el.clientHeight || 300;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(() => { size(); kick(); }); ro.observe(el); size();

  let visible = true, raf = 0, last = performance.now();
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); }); io.observe(el);
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!dragging) {
      pivot.rotation.y += vx;
      pivot.rotation.x *= 0.96;
      const rest = reduce ? 0 : 0.0035;
      vx += (rest - vx) * 0.03; // ease back to a calm drift
    }
    if (!reduce) for (const s of sats) {
      s.a += s.speed * dt;
      s.m.position.set(Math.cos(s.a) * s.r, Math.sin(s.a * 3) * 0.06, Math.sin(s.a) * s.r);
      s.m.rotation.y += dt * 0.8; s.m.rotation.x += dt * 0.3;
    }
    renderer.render(scene, camera);
    const moving = !reduce || dragging || Math.abs(vx) > 0.0002;
    if (visible && moving) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  kick();
  return {
    scene, camera, renderer,
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); cvs.remove(); },
  };
}
