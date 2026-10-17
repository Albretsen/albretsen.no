// Interactive 3D: Poly Haven's CC0 rangefinder "Camera 01", re-cast in candy clay (clay-camera.glb).
// Drag to spin it like a toy; it settles back with a spring; click fires the shutter (squash + flash).
// three.js r170 from jsDelivr /+esm (pinned, one shared instance). Lazy: call mountClayCamera when the element nears the viewport.
//
//   import { mountClayCamera } from './3d/clay-camera.js'
//   const cam = await mountClayCamera(document.querySelector('#toy'))

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm';
const GLTF_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js/+esm';
const ROOM_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/environments/RoomEnvironment.js/+esm';

export async function mountClayCamera(el, opts = {}) {
  const THREE = await import(THREE_URL);
  const { GLTFLoader } = await import(GLTF_URL);
  const { RoomEnvironment } = await import(ROOM_URL);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opts.preserve });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab';

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  camera.position.set(0, 0.06, 1.3);

  const sun = new THREE.DirectionalLight(0xfff1c3, 2.6);
  sun.position.set(-0.6, 1.2, 0.9); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 8; sun.shadow.bias = -0.0005;
  Object.assign(sun.shadow.camera, { left: -0.4, right: 0.4, top: 0.4, bottom: -0.4, near: 0.1, far: 4 });
  scene.add(sun, new THREE.HemisphereLight(0xb9def3, 0xfcae73, 1.1));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ color: 0x6d3f2f, opacity: 0.18 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const gltf = await new GLTFLoader().loadAsync(opts.src || new URL('./clay-camera.glb', import.meta.url).href);
  const toy = new THREE.Group(); const model = gltf.scene; toy.add(model); scene.add(toy);
  // centre + scale to ~0.42 units wide, sit it on the ground
  const body = model.getObjectByName('Camera_01') || model;
  const box = new THREE.Box3().setFromObject(body); const sizeV = box.getSize(new THREE.Vector3()); const c = box.getCenter(new THREE.Vector3());
  const s = 0.5 / Math.max(sizeV.x, sizeV.y); model.scale.setScalar(s);
  model.position.set(-c.x * s, -box.min.y * s, -c.z * s);
  ground.position.y = 0;
  camera.lookAt(0, sizeV.y * s * 0.45, 0); camera.position.y = sizeV.y * s * 0.55;
  // upgrade the flat glTF colours to soft clay: physical sheen + clearcoat on the glass
  model.traverse(o => {
    if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true;
    const m = o.material; const glass = m.name === 'glass_ink';
    o.material = new THREE.MeshPhysicalMaterial({ color: m.color, roughness: glass ? 0.05 : 0.68, metalness: 0,
      sheen: glass ? 0 : 0.8, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffffff), clearcoat: glass ? 1 : 0.05, clearcoatRoughness: 0.2 });
  });

  // interaction: drag-spin with spring return, idle bob, click = shutter squash
  let yaw = -0.35, yawV = 0, target = -0.35, pitch = 0.0, dragging = false, lx = 0, squash = 0, squashV = 0, raf = 0, visible = true;
  const dom = renderer.domElement;
  dom.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; dom.setPointerCapture(e.pointerId); dom.style.cursor = 'grabbing'; });
  dom.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lx; lx = e.clientX; yaw += dx * 0.012; yawV = dx * 0.6; });
  const up = () => { dragging = false; dom.style.cursor = 'grab'; };
  dom.addEventListener('pointerup', up); dom.addEventListener('pointercancel', up);
  dom.addEventListener('dblclick', () => { squashV -= 9; el.dispatchEvent(new CustomEvent('blink:shutter', { bubbles: true })); });

  function resize() { const r = el.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
  resize(); const ro = new ResizeObserver(resize); ro.observe(el);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }); io.observe(el);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
    if (!dragging) { yawV += (-(yaw - target) * 30 - yawV * 6) * dt; yaw += yawV * dt; if (!reduce) target = -0.35 + Math.sin(t * 0.5) * 0.4; }
    squashV += (-220 * squash - 10 * squashV) * dt; squash += squashV * dt;
    toy.rotation.set(pitch, yaw, 0);
    toy.scale.set(1 - squash * 0.12, 1 + squash * 0.18, 1 - squash * 0.12);
    toy.position.y = reduce ? 0 : Math.abs(Math.sin(t * 1.6)) * 0.008;
    renderer.render(scene, camera);
  }
  function loop() { cancelAnimationFrame(raf); const tick = n => { if (!visible) return; frame(n); raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); }
  frame(performance.now()); loop();
  return { renderer, scene, toy, shutter() { squashV -= 9; }, destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); dom.remove(); } };
}
