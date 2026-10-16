// Live Specimen No. 1 — self-contained three.js module.
//   import { mountSpecimen } from './assets/3d/specimen.js'
//   const s = await mountSpecimen(document.querySelector('#hero-3d'), { phase: 'auto' })
// Drag to turn it (hand-rolled springs), it drifts when idle, and its light
// follows the real sun over Oslo. Pauses off-screen. Respects reduced motion.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { buildSpecimen, studioEnvironment, sunOverNorway } from './specimen-core.js';
import { Spring, PRESETS } from '../motion.js';

const LOOKS = {
  // background is transparent by default so the page colour shows through
  dag:       { sun: 0xfff1da, sunI: 3.2, sunEl: 45, hemi: [0xfff6e6, 0xb8a37a, 1.0], env: 1.0, glow: 0.0, exposure: 1.0 },
  gulltime:  { sun: 0xffc98a, sunI: 3.8, sunEl: 14, hemi: [0xffeedd, 0x9a8064, 0.8], env: 0.85, glow: 0.12, exposure: 1.0 },
  'blåtime': { sun: 0xffb768, sunI: 3.4, sunEl: 6, hemi: [0x4a6896, 0x0c1712, 0.7], env: 0.45, glow: 0.7, exposure: 1.1 },
  natt:      { sun: 0x9fb4e0, sunI: 1.4, sunEl: 20, hemi: [0x30466e, 0x081410, 0.6], env: 0.35, glow: 1.0, exposure: 1.15 },
};

export async function mountSpecimen(container, { phase = 'auto', background = null, interactive = true, scale = 1, autoRotate = 0.12 } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: background == null, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'pan-y', cursor: interactive ? 'grab' : 'default' });
  renderer.domElement.setAttribute('aria-label', 'Specimen No. 1: a brass lattice after Haeckel. Drag to turn it.');
  renderer.domElement.setAttribute('role', 'img');

  const scene = new THREE.Scene();
  if (background != null) scene.background = new THREE.Color(background);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studioEnvironment(THREE), 0.02).texture;

  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  cam.position.set(0, 1.2, 10.5); cam.lookAt(0, 0, 0);

  const pivot = new THREE.Group(); scene.add(pivot);
  let spec = buildSpecimen(THREE, null, { quality: 1 });
  spec.scale.setScalar(scale); pivot.add(spec);

  const hemi = new THREE.HemisphereLight(); scene.add(hemi);
  const sun = new THREE.DirectionalLight(); scene.add(sun);
  const rim = new THREE.DirectionalLight(0x9fd0b4, 1.2); rim.position.set(5, 3, -6); scene.add(rim);
  const glowLight = new THREE.PointLight(0xe060c0, 0, 6, 2); scene.add(glowLight);

  function applyPhase(p) {
    const ph = p === 'auto' ? sunOverNorway().phase : p;
    const L = LOOKS[ph] || LOOKS.dag;
    sun.color.set(L.sun); sun.intensity = L.sunI;
    const el = L.sunEl * Math.PI / 180;
    sun.position.set(-Math.cos(el) * 9, Math.sin(el) * 9 + 1, 3);
    hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
    scene.environmentIntensity = L.env; renderer.toneMappingExposure = L.exposure;
    glowLight.intensity = 6 * L.glow;
    spec.traverse(o => { if (o.name === 'beads') o.material.emissiveIntensity = 0.1 + L.glow * 1.6; if (o.name === 'core') o.material.emissiveIntensity = 0.02 + L.glow * 0.9; });
    return ph;
  }
  let current = applyPhase(phase);

  // springs: yaw/pitch follow the drag; velocity is kept on release (a flick spins it)
  const yaw = new Spring(0.6, PRESETS.drift), pitch = new Spring(0.35, PRESETS.drift), pop = new Spring(1, PRESETS.flick);
  let drag = null, idle = 0;
  if (interactive) {
    const el = renderer.domElement;
    el.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: yaw.target, pitch: pitch.target }; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; pop.set(0.96); });
    el.addEventListener('pointermove', e => {
      if (!drag) return;
      yaw.set(drag.yaw + (e.clientX - drag.x) * 0.008);
      pitch.set(Math.max(-0.9, Math.min(1.2, drag.pitch + (e.clientY - drag.y) * 0.006)));
    });
    const up = () => { if (!drag) return; drag = null; idle = 0; el.style.cursor = 'grab'; pop.set(1); pop.velocity += 1.2; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('dblclick', () => { pop.velocity -= 4; });
  }

  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    cam.position.z = w / h < 0.8 ? 14 : 10.5;
    cam.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container); resize();

  let visible = true, raf = 0, last = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(container);
  const phaseTimer = phase === 'auto' ? setInterval(() => { current = applyPhase('auto'); }, 60000) : 0;

  function frame(now) {
    raf = 0; if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    idle += dt;
    if (!drag && !reduce && idle > 1.2) yaw.set(yaw.target + autoRotate * dt);
    yaw.step(dt); pitch.step(dt); pop.step(dt);
    pivot.rotation.set(pitch.value, yaw.value, 0.18);
    pivot.scale.setScalar(pop.value);
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    renderer, scene, get phase() { return current; },
    setPhase: p => (current = applyPhase(p)),
    destroy() { cancelAnimationFrame(raf); clearInterval(phaseTimer); renderer.dispose(); renderer.domElement.remove(); },
  };
}
