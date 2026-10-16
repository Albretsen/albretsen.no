/* stone.js — a real stone you can turn. three.js r170, loaded lazily from jsDelivr.
 *
 * The model is Poly Haven "Moon Rock 03" (CC0), packed with web-sized textures into
 * stone.glb (~240 KB). It sits in a grey studio. Three thin rim lights at slightly
 * different angles (long, mid and short wavelength) give its edge a dispersed,
 * prism-like fringe; hovering raises them, like tilting a crystal toward the window.
 *
 * Drag to turn (spring inertia), release to let it settle. Idle: a slow drift.
 *
 * Usage:
 *   import { mountStone } from './stone.js'
 *   const stone = await mountStone(container, { src: new URL('./stone.glb', import.meta.url) })
 *   stone.destroy()
 */
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm';
const GLTF_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js/+esm';
const ROOM_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/environments/RoomEnvironment.js/+esm';

export async function mountStone(container, opts = {}) {
  const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([import(THREE_URL), import(GLTF_URL), import(ROOM_URL)]);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = opts.exposure ?? 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab' });

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 10);
  camera.position.set(0, 0.02, 0.34); camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight(0xfff6ee, 1.5); key.position.set(-0.6, 0.9, 0.7); scene.add(key);
  // dispersed rim: three narrow lights, each a band of the spectrum, a few degrees apart
  const rims = [[0xff3b2f, -6], [0x3cff7a, 0], [0x4a5bff, 6]].map(([c, deg]) => {
    const l = new THREE.DirectionalLight(c, 0.0);
    const a = THREE.MathUtils.degToRad(150 + deg);
    l.position.set(Math.cos(a), 0.25, Math.sin(a) * -1); scene.add(l); return l;
  });

  const gltf = await new GLTFLoader().loadAsync(String(opts.src ?? new URL('./stone.glb', import.meta.url)));
  const rock = gltf.scene;
  const box = new THREE.Box3().setFromObject(rock); const ctr = box.getCenter(new THREE.Vector3());
  rock.position.sub(ctr);
  const pivot = new THREE.Group(); pivot.add(rock); scene.add(pivot);
  rock.traverse(m => { if (m.isMesh) { m.material.envMapIntensity = 0.6; } });

  // spring-driven rotation
  const rot = { x: -0.25, y: 0.6, vx: 0, vy: 0, tx: -0.25, ty: 0.6 };
  let rimT = 0.35, rim = 0.35;
  let drag = null;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; drag = { x: e.clientX, y: e.clientY, ty: rot.ty, tx: rot.tx }; });
  el.addEventListener('pointermove', e => { if (!drag) return; rot.ty = drag.ty + (e.clientX - drag.x) * 0.012; rot.tx = Math.max(-1.2, Math.min(1.2, drag.tx + (e.clientY - drag.y) * 0.01)); });
  const end = () => { drag = null; el.style.cursor = 'grab'; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  container.addEventListener('pointerenter', () => { rimT = 2.4; });
  container.addEventListener('pointerleave', () => { rimT = 0.35; });

  function resize() {
    const w = container.clientWidth, h = container.clientHeight || w;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  let raf = 0, last = performance.now(), visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
  io.observe(container);
  function frame(now) {
    raf = 0; if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!drag && !reduce) rot.ty += dt * 0.12;
    const k = 70, c = 14;
    rot.vy += ((rot.ty - rot.y) * k - rot.vy * c) * dt; rot.y += rot.vy * dt;
    rot.vx += ((rot.tx - rot.x) * k - rot.vx * c) * dt; rot.x += rot.vx * dt;
    rim += (rimT - rim) * Math.min(1, dt * 5);
    rims.forEach(l => { l.intensity = rim; });
    pivot.rotation.set(rot.x, rot.y, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); el.remove(); },
    renderer, scene
  };
}
