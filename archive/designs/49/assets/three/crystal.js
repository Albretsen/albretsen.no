// Habit / crystal.js — the interactive centrepiece.
// A crystal habit drawn in ink (hidden edges dashed, faces hatched) that you
// can turn with a finger. It drifts in a slow orbit when left alone; a tap
// redraws it as the next habit, pen-stroke by pen-stroke.
//
//   import { mountCrystal } from './three/crystal.js';
//   const c = await mountCrystal(el, { theme: 'light', habit: 'octahedron', onHabit: h => {} });
//   c.setTheme('dark'); c.next(); c.destroy();
//
// Needs an import map for "three" (see demo.html). ~3 KB + three.js.
import * as THREE from 'three';
import { LineSegments2 } from '../vendor/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from '../vendor/addons/lines/LineSegmentsGeometry.js';
import { InkKit, drawProgress, sketchSegments } from './ink.js';
import { HABITS, HABIT_ORDER } from './habits.js';

export async function mountCrystal(el, { theme = 'light', habit = 'octahedron', onHabit = () => {}, orbit = true, width = 1.5 } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pr = Math.min(devicePixelRatio || 1, 2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(pr);
  renderer.setClearColor(0x000000, 0);
  el.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab' });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 1.1, 6.4); camera.lookAt(0, 0, 0);
  const ink = new InkKit({ theme, pixelRatio: pr, width });

  const spin = new THREE.Group(); scene.add(spin);
  const tilt = new THREE.Group(); tilt.rotation.set(0.32, 0, 0.14); spin.add(tilt);

  // orbit ring + a small body travelling on it
  const ringHolder = new THREE.Group(); ringHolder.rotation.set(0.28, 0, -0.12); scene.add(ringHolder);
  let body;
  if (orbit) {
    const pts = []; const R = 1.85, n = 140;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2; pts.push(Math.cos(a) * R, 0, Math.sin(a) * R, Math.cos(b) * R, 0, Math.sin(b) * R); }
    const m = ink.line({ width: width * 0.6, faint: true, dashed: true }); m.dashSize = 0.08; m.gapSize = 0.07;
    const ring = new LineSegments2(new LineSegmentsGeometry().setPositions(pts), m); ring.computeLineDistances();
    ringHolder.add(ring);
    body = new THREE.Mesh(HABITS.octahedron.make()); body.scale.setScalar(0.09);
    ink.inkify(body, { scale: 0.2, width: width * 0.8, hatch: false });
    ringHolder.add(body);
  }

  let current = null, drawT = 1, drawStart = 0, idx = Math.max(0, HABIT_ORDER.indexOf(habit));
  function build(name) {
    if (current) { tilt.remove(current.mesh); current.mesh.traverse(o => { o.geometry?.dispose?.(); }); }
    const mesh = new THREE.Mesh(HABITS[name].make());
    const r = ink.inkify(mesh, { hidden: true, scale: 1, seed: 11 + idx * 13, width, spacing: 6, threshold: 8 });
    tilt.add(mesh);
    current = { name, mesh, ...r };
    drawT = reduce ? 1 : 0; drawStart = performance.now();
    apply();
    onHabit({ name, ...HABITS[name], index: idx, total: HABIT_ORDER.length });
  }
  function apply() {
    const e = 1 - Math.pow(1 - Math.min(drawT, 1), 3);
    current.lines.forEach(l => drawProgress(l, e));
    current.hidden.forEach(l => drawProgress(l, Math.max(0, e * 1.3 - 0.3)));
    current.mesh.material.uniforms.uStrength.value = Math.max(0, e * 1.6 - 0.6);
  }
  build(HABIT_ORDER[idx]);

  // ---- interaction: drag to turn (with inertia), tap to redraw as the next habit
  let vx = 0, vy = 0, dragging = false, moved = 0, lx = 0, ly = 0, last = performance.now();
  const cv = renderer.domElement;
  cv.addEventListener('pointerdown', e => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
  cv.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    vx = dx * 0.006; vy = dy * 0.006; spin.rotation.y += vx; tilt.rotation.x = THREE.MathUtils.clamp(tilt.rotation.x + vy, -1.2, 1.2);
  });
  const up = () => { if (!dragging) return; dragging = false; cv.style.cursor = 'grab'; if (moved < 6) api.next(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.tabIndex = 0; cv.setAttribute('role', 'button'); cv.setAttribute('aria-label', 'Crystal habit. Drag to turn, press to redraw.');
  cv.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api.next(); } if (e.key === 'ArrowLeft') vx = -0.05; if (e.key === 'ArrowRight') vx = 0.05; });

  // ---- size + visibility
  const resize = () => { const w = el.clientWidth || 300, h = el.clientHeight || 300; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); ink.setSize(w, h); };
  const ro = new ResizeObserver(resize); ro.observe(el); resize();
  let visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }); io.observe(el);

  let raf, t0 = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible) return;
    if (!dragging) {
      vx *= 0.94; vy *= 0.9;
      spin.rotation.y += vx + (reduce ? 0 : dt * 0.16);
      tilt.rotation.x += (0.32 - tilt.rotation.x) * 0.02;
    }
    if (drawT < 1) { drawT = Math.min(1, (now - drawStart) / 1100); apply(); }
    if (body) { const a = (now - t0) / 1000 * (reduce ? 0 : 0.35); body.position.set(Math.cos(a) * 1.85, 0, Math.sin(a) * 1.85); body.rotation.y = a * 2; }
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  const api = {
    next() { idx = (idx + 1) % HABIT_ORDER.length; build(HABIT_ORDER[idx]); },
    setHabit(name) { idx = HABIT_ORDER.indexOf(name); build(name); },
    setTheme(t) { ink.setTheme(t); },
    get habit() { return current.name; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); cv.remove(); },
  };
  return api;
}
export { HABITS, HABIT_ORDER, sketchSegments };
