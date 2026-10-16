// Cloud Chamber — live 3D specimen: the fractured chrome/iridescent "A" mark.
// Drag to turn it (with inertia); hover closes the fracture ("clarity"), leaving
// lets it drift open again ("fracture"). setFracture(0..1) can be driven by
// ScrollTrigger. Needs an import map for "three" + "three/addons/" (three@0.170.0).
//
//   import { mountSpecimen } from './assets/3d/specimen.js';
//   const s = await mountSpecimen(document.querySelector('#specimen'));
//   s.setFracture(0.5);
import * as THREE from 'three';
import { makeEnvironment, materials, fracturedMark, loadFont, makeRenderer, prims, P } from '../src/lab.js';

export async function mountSpecimen(el, { background = null, fracture = 1, autoRotate = true } = {}) {
  const font = await loadFont(new URL('./glyphs-unbounded-800.json', import.meta.url).href);
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'width:100%;height:100%;display:block;cursor:grab;touch-action:pan-y';
  el.appendChild(canvas);
  const renderer = makeRenderer(canvas, { alpha: !background, shadows: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  if (background) scene.background = new THREE.Color(background);
  scene.environment = makeEnvironment(renderer, 'light');
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100); cam.position.set(0, 0.1, 7.2);
  const mark = fracturedMark(font, materials.chrome(), materials.irid(), { size: 2.6, depth: 0.32, gap: 1 });
  const pivot = new THREE.Group(); pivot.add(mark); scene.add(pivot);
  // three orbiting specimen beads
  const beads = [['irid', 0.12, 2.1], ['rose', 0.08, 2.5], ['chrome', 0.06, 1.8]].map(([m, r, d], i) => {
    const b = new THREE.Mesh(prims.sphere(r), materials[m]()); b.userData = { d, s: 0.35 + i * 0.18, o: i * 2.1 }; scene.add(b); return b;
  });
  const { lo, hi } = mark.userData; const hiBase = hi.position.clone();
  let target = fracture, current = fracture;
  let rotY = -0.35, rotX = -0.05, vY = autoRotate ? 0.0025 : 0, vX = 0, dragging = false, px = 0, py = 0;

  canvas.addEventListener('pointerdown', e => { dragging = true; px = e.clientX; py = e.clientY; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
  canvas.addEventListener('pointermove', e => { if (!dragging) return; vY = (e.clientX - px) * 0.004; vX = (e.clientY - py) * 0.003; px = e.clientX; py = e.clientY; });
  canvas.addEventListener('pointerup', () => { dragging = false; canvas.style.cursor = 'grab'; });
  el.addEventListener('pointerenter', () => { target = 0; });
  el.addEventListener('pointerleave', () => { target = fracture; });

  function resize() { const r = el.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.position.z = 7.2 * Math.max(1, 1.15 / cam.aspect); cam.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(el); resize();

  let raf = 0; const t0 = performance.now();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(now) {
    const t = (now - t0) / 1000;
    rotY += vY; rotX = THREE.MathUtils.clamp(rotX + vX, -0.6, 0.6);
    if (!dragging) { vY += ((autoRotate ? 0.0025 : 0) - vY) * 0.03; vX *= 0.92; rotX += (-0.05 - rotX) * 0.02; }
    pivot.rotation.set(rotX, rotY, 0);
    current += (target - current) * 0.06;
    hi.position.set(hiBase.x * current * 2.2, hiBase.y * current * 2.2 + Math.sin(t * 1.3) * 0.03 * current, 0.18 * current);
    hi.rotation.z = 0.05 * current; lo.position.y = -0.04 * current;
    beads.forEach(b => { const { d, s, o } = b.userData; b.position.set(Math.cos(t * s + o) * d, Math.sin(t * s * 1.3 + o) * 0.9, Math.sin(t * s + o) * d * 0.6); });
    renderer.render(scene, cam);
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    setFracture(v) { fracture = v; target = v; if (reduce) requestAnimationFrame(frame); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); canvas.remove(); },
  };
}
