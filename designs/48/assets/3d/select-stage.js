// select-stage.js: the live character-select stage (three.js r170).
// Products stand on glowing plinths; the selected one lifts, turns toward you and gets the
// magenta P1 pointer (the Albretsen mark, upside down). Click a character, use ←/→, or drag to spin it.
//
//   import { mountSelect } from './select-stage.js'
//   const stage = await mountSelect(el, { ids: ['mcp-emails','fun-libs','toolrails','harbor'], selected: 1,
//                                         onSelect: (id, index) => {} })
//   stage.select(2); stage.destroy()
//
// Needs an import map for "three" and "three/addons/" (see demo.html).
import * as S from './studio.js';
const { THREE, C } = S;

export async function mountSelect(el, opts = {}) {
  const ids = opts.ids || ['mcp-emails', 'fun-libs', 'toolrails', 'harbor'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:inherit';
  el.appendChild(canvas);
  const renderer = S.createRenderer(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio, opts.dpr || 1.5));
  const scene = new THREE.Scene();
  scene.environment = S.studioEnvironment(renderer);
  scene.background = new THREE.Color(C.void); scene.fog = new THREE.Fog(C.void, 9, 22);
  const cam = new THREE.PerspectiveCamera(23, 1, 0.1, 100);
  scene.add(S.stageFloor());
  S.keyLights(scene, { key: 55 });

  const n = ids.length, gap = 2.2, xs = ids.map((_, i) => (i - (n - 1) / 2) * gap);
  const slots = [];
  for (let i = 0; i < n; i++) {
    const z = -Math.abs(xs[i]) * 0.28;
    const pl = S.plinth({ radius: 0.86, height: 0.34, seam: S.PRODUCTS[ids[i]].rim, seamIntensity: 1.2 }); pl.position.set(xs[i], 0, z); scene.add(pl);
    const ch = await S.character(ids[i], { size: 1.2, depth: 0.5 }); ch.position.set(xs[i], 0.96, z); scene.add(ch);
    const pool = S.glowDisc(C.glow, 1.9, 0); pool.position.set(xs[i], 0.345, z); scene.add(pool);
    slots.push({ id: ids[i], pl, ch, pool, x: xs[i], z, lift: 0, spin: 0, spinV: 0 });
  }
  const pointer = S.markObject(); pointer.scale.setScalar(0.36); pointer.rotation.x = Math.PI; scene.add(pointer);
  const halo = S.halo(C.glow, 2.3, 0.3); scene.add(halo);

  let started = false; // re-render on select when the loop is idle (reduced motion)
  let sel = Math.max(0, Math.min(n - 1, opts.selected ?? 1));
  const px = { x: xs[sel] };
  function select(i) {
    sel = (i + n) % n;
    slots.forEach((s, k) => { s.pl.userData.ringMat.emissive.set(k === sel ? C.glow : S.PRODUCTS[s.id].rim); s.pl.userData.ringMat.emissiveIntensity = k === sel ? 4 : 1.2; });
    opts.onSelect?.(ids[sel], sel);
    if (started) tick();
  }
  select(sel);

  // input
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let drag = null;
  const pick = e => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const hit = ray.intersectObjects(slots.map(s => s.ch), true)[0]; if (!hit) return -1; let o = hit.object; while (o && !ids.includes(o.name)) o = o.parent; return o ? ids.indexOf(o.name) : -1; };
  const down = e => { const i = pick(e); if (i >= 0) { if (i !== sel) select(i); drag = { x: e.clientX, t: performance.now() }; canvas.setPointerCapture(e.pointerId); } };
  const move = e => { if (drag) { const dx = e.clientX - drag.x; drag.x = e.clientX; slots[sel].spinV = dx * 0.012; slots[sel].spin += dx * 0.012; } else canvas.style.cursor = pick(e) >= 0 ? 'pointer' : ''; };
  const up = () => { drag = null; };
  const key = e => { if (e.key === 'ArrowRight') select(sel + 1); if (e.key === 'ArrowLeft') select(sel - 1); };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up);
  el.tabIndex = el.tabIndex >= 0 ? el.tabIndex : 0; el.addEventListener('keydown', key);

  function size() { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; const narrow = w / h < 1.1; cam.fov = narrow ? 38 : 23; cam.position.set(0, narrow ? 2.6 : 2.4, narrow ? 13 : Math.max(11.6, 11.6 * (16 / 9) / (w / h))); cam.lookAt(0, 1.2, 0); cam.updateProjectionMatrix(); }
  const ro = new ResizeObserver(size); ro.observe(el); size();
  let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) tick(); }); io.observe(el);

  let raf = 0, last = performance.now();
  function tick() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
      slots.forEach((s, k) => {
        const on = k === sel; const k1 = 1 - Math.pow(0.0015, dt);
        s.lift += ((on ? 1 : 0) - s.lift) * k1;
        if (!drag || !on) { s.spinV *= 0.94; s.spin += s.spinV; s.spin += ((on ? 0.18 + Math.sin(t * 0.8) * 0.12 : -s.x * 0.09) - s.spin) * (reduce ? 1 : k1 * 0.5); }
        s.ch.position.y = 0.96 + s.lift * 0.32 + (on && !reduce ? Math.sin(t * 1.6) * 0.04 : 0);
        s.ch.rotation.set(-0.06 * s.lift, s.spin, -0.05 * s.lift);
        s.pool.material.opacity = s.lift * 0.75;
      });
      px.x += (xs[sel] - px.x) * (reduce ? 1 : 1 - Math.pow(0.002, dt));
      pointer.position.set(px.x, 2.55 + (reduce ? 0 : Math.sin(t * 2.2) * 0.07), slots[sel].z); pointer.rotation.y = reduce ? 0.4 : Math.sin(t * 0.9) * 0.6;
      halo.position.set(px.x, 1.5, slots[sel].z - 1.6);
      renderer.render(scene, cam);
      if (visible && !reduce) tick();
    });
  }
  tick(); started = true;
  return {
    select, get selected() { return ids[sel]; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); el.removeEventListener('keydown', key); renderer.dispose(); canvas.remove(); },
  };
}
