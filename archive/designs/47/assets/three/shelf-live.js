// Live shelf: the same primitive scene as the baked stills, kept real-time.
// Drag any tile along the shelf; the others make room and it settles into its slot.
//
//   import { mountShelf } from './assets/three/shelf-live.js'
//   const shelf = await mountShelf(document.querySelector('#shelf'), { onReorder: ids => console.log(ids) })
//
// Needs an import map for three@0.170.0 (see demo.html). Lazy-load it: mount when the container scrolls into view.

import * as THREE from 'three';
import { buildScene } from './shelf-scene.js';

export async function mountShelf(container, { view = 'live', onReorder, onSelect } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab';
  container.appendChild(renderer.domElement);

  const { scene, camera, tiles, key, fill } = await buildScene({ renderer, view, aspect: container.clientWidth / container.clientHeight });
  key.shadow.mapSize.set(2048, 2048); fill.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 4;

  // only upright tiles are rearrangeable (stacked plaster tiles stay put)
  const items = tiles.filter((t) => Math.abs(t.rotation.x) < 0.5).sort((a, b) => a.position.x - b.position.x);
  const slots = items.map((t) => t.position.x);
  for (const t of items) t.userData.home = { y: t.position.y, rx: t.rotation.x, ry: t.rotation.y };
  let order = [...items];

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.17), hit = new THREE.Vector3();
  let drag = null, hover = null, grabDX = 0, needs = true;

  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(items, false)[0];
    ray.ray.intersectPlane(plane, hit);
    return h ? h.object : null;
  }
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    const t = pick(e); if (!t) return;
    drag = t; grabDX = t.position.x - hit.x; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
    onSelect && onSelect(t.userData.id);
  });
  el.addEventListener('pointermove', (e) => {
    const t = pick(e);
    if (!drag) { hover = t; el.style.cursor = t ? 'grab' : 'default'; needs = true; return; }
    const x = THREE.MathUtils.clamp(hit.x + grabDX, slots[0] - 0.25, slots[slots.length - 1] + 0.25);
    drag.userData.dragX = x;
    // reinsert the dragged tile where it now sits
    const rest = order.filter((o) => o !== drag);
    let idx = slots.findIndex((s, i) => x < (slots[i] + (slots[i + 1] ?? s + 1)) / 2); if (idx < 0) idx = slots.length - 1;
    rest.splice(idx, 0, drag);
    if (rest.some((o, i) => o !== order[i])) { order = rest; onReorder && onReorder(order.map((o) => o.userData.id)); }
    needs = true;
  });
  const end = () => { if (drag) { delete drag.userData.dragX; drag = null; el.style.cursor = 'grab'; needs = true; } };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', () => { hover = null; needs = true; });

  const clock = new THREE.Clock();
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(container);
  new ResizeObserver(() => {
    const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); needs = true;
  }).observe(container);

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    const k = reduce ? 1 : 1 - Math.exp(-dt * 14);
    let moving = false;
    order.forEach((t, i) => {
      const h = t.userData.home, dragging = t === drag;
      const tx = dragging ? t.userData.dragX ?? t.position.x : slots[i];
      const ty = h.y + (dragging ? 0.07 : t === hover ? 0.018 : 0);
      const trx = dragging ? h.rx - 0.08 : h.rx, trz = dragging ? (t.userData.dragX ?? tx) - t.position.x : 0;
      const d = Math.abs(tx - t.position.x) + Math.abs(ty - t.position.y);
      t.position.x += (tx - t.position.x) * k; t.position.y += (ty - t.position.y) * k;
      t.rotation.x += (trx - t.rotation.x) * k; t.rotation.z += (THREE.MathUtils.clamp(-trz * 2.4, -0.2, 0.2) - t.rotation.z) * k;
      if (d > 0.0005 || Math.abs(t.rotation.z) > 0.001) moving = true;
    });
    if (moving || needs) { renderer.render(scene, camera); needs = false; }
  }
  frame();
  return { renderer, scene, camera, get order() { return order.map((o) => o.userData.id); } };
}
