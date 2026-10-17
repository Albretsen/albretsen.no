// Kiln Light — the live room on the homepage. Wraps assets/3d/room.js with
// drag-to-turn (with inertia), eased camera moves between view presets,
// hover lift with a label, and click-to-open. Loaded lazily.
import * as THREE from 'three';
import { createRoom, VIEWS } from './assets/3d/room.js';

export async function mountRoom(canvas, { onHover, onSelect, view = 'approach', time = 0.35, reduce = false } = {}) {
  const room = await createRoom(canvas, { base: './assets/', products: '../_shared/products/' });
  const { camera, objects, render, setTime } = room;
  const names = new Map(Object.entries(objects).map(([k, o]) => [o, k]));
  const baseY = new Map([...names.keys()].map(o => [o, o.position.y]));

  // camera state, eased toward the chosen preset
  const pos = new THREE.Vector3().fromArray(VIEWS[view][0]);
  const tgt = new THREE.Vector3().fromArray(VIEWS[view][1]);
  let fov = VIEWS[view][2];
  let goal = view;
  let yaw = 0, pitch = 0, vYaw = 0, vPitch = 0, dragging = false, lx = 0, ly = 0, moved = 0;
  let px = 0, py = 0, cx = 0, cy = 0;
  const ndc = new THREE.Vector2(9, 9), ray = new THREE.Raycaster();
  let hovered = null, sunNow = time, sunGoal = time;

  const size = () => { const r = canvas.getBoundingClientRect(); room.resize(Math.max(1, r.width), Math.max(1, r.height)); };
  new ResizeObserver(size).observe(canvas); size();

  canvas.addEventListener('pointerdown', e => {
    dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; vYaw = vPitch = 0;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5;
    ndc.set(px * 2, -py * 2);
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    vYaw = -dx * 0.0042; vPitch = dy * 0.0026;
    yaw += vYaw; pitch += vPitch;
  });
  const end = e => {
    if (!dragging) return; dragging = false;
    if (moved < 6 && hovered) onSelect?.(names.get(hovered));
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('pointerleave', () => { if (!dragging) { px = py = 0; ndc.set(9, 9); } });
  canvas.addEventListener('keydown', e => {
    const k = { ArrowLeft: [0.08, 0], ArrowRight: [-0.08, 0], ArrowUp: [0, -0.05], ArrowDown: [0, 0.05] }[e.key];
    if (k) { e.preventDefault(); yaw += k[0]; pitch += k[1]; }
  });

  const off = new THREE.Vector3(), sph = new THREE.Spherical(), want = new THREE.Vector3(), wantT = new THREE.Vector3();
  let raf = 0, running = false;
  function frame() {
    // inertia, then a soft spring back inside the allowed arc
    if (!dragging) { yaw += vYaw; pitch += vPitch; vYaw *= 0.92; vPitch *= 0.92; }
    const lim = 0.62, plim = 0.28;
    if (!dragging) { if (yaw > lim) yaw += (lim - yaw) * 0.12; if (yaw < -lim) yaw += (-lim - yaw) * 0.12;
      if (pitch > plim) pitch += (plim - pitch) * 0.12; if (pitch < -plim) pitch += (-plim - pitch) * 0.12; }

    const V = VIEWS[goal], k = reduce ? 1 : 0.06;
    want.fromArray(V[0]); wantT.fromArray(V[1]);
    pos.lerp(want, k); tgt.lerp(wantT, k); fov += (V[2] - fov) * k;
    cx += (px - cx) * 0.05; cy += (py - cy) * 0.05;

    off.copy(pos).sub(tgt); sph.setFromVector3(off);
    sph.theta += yaw + (dragging ? 0 : -cx * 0.08);
    sph.phi = THREE.MathUtils.clamp(sph.phi + pitch + cy * 0.04, 0.35, 1.5);
    camera.position.copy(tgt).add(off.setFromSpherical(sph));
    camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(tgt);

    if (Math.abs(sunGoal - sunNow) > 0.001) { sunNow += (sunGoal - sunNow) * (reduce ? 1 : 0.08); setTime(sunNow); }

    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([...names.keys()], true)[0];
    let o = hit?.object; while (o && !baseY.has(o)) o = o.parent;
    if (o !== hovered) {
      hovered = o || null; canvas.style.cursor = hovered ? 'pointer' : '';
      onHover?.(hovered ? names.get(hovered) : null);
    }
    if (hovered) { const v = hit.point.clone().project(camera); onHover?.(names.get(hovered), (v.x + 1) / 2, (1 - v.y) / 2); }
    for (const [obj, y] of baseY) obj.position.y += ((obj === hovered ? y + 0.06 : y) - obj.position.y) * 0.12;

    render();
    if (running) raf = requestAnimationFrame(frame);
  }
  setTime(time);
  const api = {
    setView(name) { goal = VIEWS[name] ? name : goal; yaw *= 0.3; pitch *= 0.3; },
    setTime(t) { sunGoal = t; },
    play() { if (running) return; running = true; frame(); },
    pause() { running = false; cancelAnimationFrame(raf); },
  };
  new IntersectionObserver(([e]) => e.isIntersecting ? api.play() : api.pause(), { rootMargin: '100px' }).observe(canvas);
  frame();
  return api;
}
