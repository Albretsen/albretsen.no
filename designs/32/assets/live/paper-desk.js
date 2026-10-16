// paper-desk.js — the live "Night Shift Paper" diorama.
// The same scene as hero/desktop.webp, but live: every paper layer parallaxes
// by its depth from pointer or device orientation, aurora ribbons sway, the
// paper plane bobs, stars twinkle. Pause when off-screen; static if reduced motion.
//
//   import { mountPaperDesk } from './live/paper-desk.js';
//   const desk = await mountPaperDesk(document.querySelector('#hero'), { ui: false });
//   desk.destroy();
//
// Needs an import map for "three" (three@0.170.0) or pass { THREE }.

import { buildNight, buildDesktopUI, makeRenderer, PRODUCT_ICONS } from './paperkit.js';

export async function mountPaperDesk(el, opts = {}) {
  const THREE = opts.THREE ?? (await import('three'));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y';
  el.appendChild(canvas);
  let W = el.clientWidth || 800, H = el.clientHeight || 500;
  const r = makeRenderer(THREE, { canvas, width: W, height: H, pixelRatio: Math.min(devicePixelRatio, opts.maxDpr ?? 1.75) });
  const N = await buildNight(THREE, { aspect: W / H, camZ: opts.camZ ?? 35 });
  if (opts.ui) await buildDesktopUI(THREE, N.scene, { products: PRODUCT_ICONS(opts.productBase ?? '../../_shared/products/') });
  const groups = []; N.scene.traverse((o) => { if (o.isGroup && o.userData.depth !== undefined) groups.push({ o, base: o.position.clone() }); });

  // input → target tilt in [-1, 1]
  const tgt = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  const onMove = (e) => { const b = el.getBoundingClientRect(); tgt.x = ((e.clientX - b.left) / b.width) * 2 - 1; tgt.y = ((e.clientY - b.top) / b.height) * 2 - 1; };
  const onLeave = () => { tgt.x = 0; tgt.y = 0; };
  const onOrient = (e) => { if (e.gamma == null) return; tgt.x = Math.max(-1, Math.min(1, e.gamma / 25)); tgt.y = Math.max(-1, Math.min(1, (e.beta - 45) / 25)); };
  el.addEventListener('pointermove', onMove); el.addEventListener('pointerleave', onLeave);
  addEventListener('deviceorientation', onOrient);

  const ro = new ResizeObserver(() => { W = el.clientWidth; H = el.clientHeight; if (!W || !H) return; r.setSize(W, H, false); N.camera.aspect = W / H; N.camera.updateProjectionMatrix(); if (reduce) r.render(N.scene, N.camera); });
  ro.observe(el);
  let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(el);

  const stars = []; N.layers.sky.traverse((o) => { if (o.isMesh && o.material.emissiveIntensity) stars.push({ m: o.material, b: o.material.emissiveIntensity, p: Math.random() * 6.28 }); });
  const aurora = N.layers.aurora.children, plane = N.layers.plane;
  let raf = 0, t0 = performance.now();
  const strength = opts.strength ?? 0.09;
  function frame(now) {
    raf = requestAnimationFrame(frame); if (!visible) return;
    const t = (now - t0) / 1000;
    cur.x += (tgt.x - cur.x) * 0.06; cur.y += (tgt.y - cur.y) * 0.06;
    groups.forEach(({ o, base }) => { const d = o.userData.depth; o.position.x = base.x - cur.x * d * strength; o.position.y = base.y + cur.y * d * strength * 0.7; });
    N.camera.position.x = cur.x * 0.6; N.camera.position.y = 0.2 - cur.y * 0.4; N.camera.lookAt(0, 0.2, 0);
    aurora.forEach((m, i) => { m.position.x = Math.sin(t * 0.18 + i * 1.7) * 0.35; m.position.y = Math.sin(t * 0.23 + i) * 0.08; });
    plane.position.y = Math.sin(t * 0.9) * 0.08; plane.rotation.z = Math.sin(t * 0.7) * 0.01;
    stars.forEach((s) => (s.m.emissiveIntensity = s.b * (0.6 + 0.4 * Math.sin(t * 1.4 + s.p))));
    r.render(N.scene, N.camera);
  }
  if (reduce) r.render(N.scene, N.camera); else raf = requestAnimationFrame(frame);
  return {
    scene: N.scene, camera: N.camera, renderer: r,
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave); removeEventListener('deviceorientation', onOrient); r.dispose(); canvas.remove(); },
  };
}
