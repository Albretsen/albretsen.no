// mark-3d.js — the Albretsen mark as a stack of paper layers (albretsen-mark.glb).
// Tilts toward the pointer / device; on hover (or tap) the layers fan apart like
// an exploded paper diorama, then settle back. Self-contained except three.
//
//   import { mountMark3D } from './live/mark-3d.js';
//   mountMark3D(el, { glb: './live/albretsen-mark.glb' });

export async function mountMark3D(el, opts = {}) {
  const THREE = opts.THREE ?? (await import('three'));
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { paperTexture } = await import('./paperkit.js');
  const W = () => el.clientWidth || 320, H = () => el.clientHeight || 320;
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(W(), H()); r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
  r.domElement.style.cssText = 'display:block;width:100%;height:100%'; el.appendChild(r.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, W() / H(), 0.1, 50); cam.position.set(0, 0, 4.9);
  scene.add(new THREE.HemisphereLight(0xe6e2ee, 0x1a2a4a, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-2, 3, 6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 4; key.shadow.bias = -0.0005; scene.add(key);
  const sod = new THREE.PointLight(0xffa04a, 6, 8); sod.position.set(1.5, -1, 2); scene.add(sod);
  const gltf = await new GLTFLoader().loadAsync(opts.glb ?? new URL('./albretsen-mark.glb', import.meta.url).href);
  const mark = gltf.scene; const layers = [];
  const bump = paperTexture(THREE, 0.6, 9);
  mark.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.material.bumpMap = bump; o.material.bumpScale = 1.2; o.material.needsUpdate = true; layers.push({ o, z: o.position.z }); } });
  const pivot = new THREE.Group(); pivot.add(mark); scene.add(pivot);
  const tgt = { x: 0, y: 0, e: 0 }, cur = { x: 0, y: 0, e: 0 };
  const move = (e) => { const b = el.getBoundingClientRect(); tgt.x = ((e.clientX - b.left) / b.width) * 2 - 1; tgt.y = ((e.clientY - b.top) / b.height) * 2 - 1; };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerenter', () => (tgt.e = 1)); el.addEventListener('pointerleave', () => { tgt.e = 0; tgt.x = tgt.y = 0; });
  el.addEventListener('pointerdown', () => (tgt.e = tgt.e ? 0 : 1));
  addEventListener('deviceorientation', (e) => { if (e.gamma != null) { tgt.x = Math.max(-1, Math.min(1, e.gamma / 30)); tgt.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); } });
  new ResizeObserver(() => { r.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); }).observe(el);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t0 = performance.now();
  (function loop(now) {
    requestAnimationFrame(loop); const t = (now - t0) / 1000;
    for (const k of ['x', 'y', 'e']) cur[k] += (tgt[k] - cur[k]) * (k === 'e' ? 0.08 : 0.07);
    const idle = reduce ? 0 : Math.sin(t * 0.6) * 0.12;
    pivot.rotation.y = cur.x * 0.55 + idle * (1 - cur.e); pivot.rotation.x = cur.y * 0.4 + 0.05;
    layers.forEach(({ o, z }, i) => (o.position.z = z * (1 + cur.e * 3.2)));
    r.render(scene, cam);
  })(t0);
}
