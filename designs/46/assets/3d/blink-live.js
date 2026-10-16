// Blink, live. The hero centrepiece: a raw-WebGL2 raymarched clay mascot you look THROUGH and AT.
//   - its lens (eye) follows the pointer
//   - it blinks on its own; click/tap = shutter: squash-and-stretch + 'blink:shutter' event (+ sound if enabled)
//   - focus(0..1) racks the backdrop photo in/out of focus (golden-angle bokeh)
//   - exposure(-2..2 stops) brightens / darkens the whole frame, e.g. bound to scroll
// No dependencies besides ./clay-engine.js + ./scenes.js. Pauses when offscreen; honours reduced motion.
//
//   import { mountBlink } from './3d/blink-live.js'
//   const blink = await mountBlink(canvas, { scene: 'hero', scale: 0.6 })
//   blink.focus(0.8); blink.exposure(0.3); blink.shutter(); blink.destroy()

import { createClay } from './clay-engine.js';
import { SCENES } from './scenes.js';

export async function mountBlink(canvas, opts = {}) {
  const sceneName = opts.scene || 'hero';
  const base = SCENES[sceneName];
  const scene = { ...base, textures: { ...(base.textures || {}) } };
  if (opts.photo) scene.textures.uPhoto = opts.photo;           // e.g. '../photo/dawn-field@2x.webp'
  const scale = opts.scale ?? 0.6;                              // render scale (CSS upsamples); raymarching is costly
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clay = await createClay(canvas, scene, { quality: 'live', steps: opts.steps ?? 120, shadow: opts.shadow ?? 1 });

  const st = { look: [0, 0], lookT: [base.uniforms?.uLook?.[0] ?? 0, base.uniforms?.uLook?.[1] ?? 0],
    lid: 0, squash: 0, squashV: 0, focus: base.uniforms?.uFocus ?? 0, focusT: base.uniforms?.uFocus ?? 0,
    exp: 0, expT: 0, nextBlink: 1.5, blinkT: -1, visible: true, raf: 0 };

  function size() {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(2, Math.round(r.width * scale)); canvas.height = Math.max(2, Math.round(r.height * scale));
    clay.resize();
  }
  size();
  const ro = new ResizeObserver(size); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { st.visible = e.isIntersecting; if (st.visible && !reduce) loop(); }); io.observe(canvas);

  const onMove = e => {
    const r = canvas.getBoundingClientRect();
    st.lookT = [((e.clientX - r.left) / r.width - 0.5) * 2.2, -((e.clientY - r.top) / r.height - 0.45) * 2.0].map(v => Math.max(-1, Math.min(1, v)));
  };
  addEventListener('pointermove', onMove, { passive: true });
  const shutter = () => {
    st.squashV -= 7; st.blinkT = 0;
    canvas.dispatchEvent(new CustomEvent('blink:shutter', { bubbles: true }));
  };
  canvas.addEventListener('click', shutter);

  let last = performance.now();
  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
    const k = 1 - Math.exp(-dt * 6);
    st.look = st.look.map((v, i) => v + (st.lookT[i] - v) * k);
    st.focus += (st.focusT - st.focus) * (1 - Math.exp(-dt * 4));
    st.exp += (st.expT - st.exp) * (1 - Math.exp(-dt * 5));
    // spring for squash & stretch (stiffness 180, damping 9)
    st.squashV += (-180 * st.squash - 9 * st.squashV) * dt; st.squash += st.squashV * dt;
    // blinking: lid closes and reopens in 180ms, randomly every 2-5s
    st.nextBlink -= dt; if (st.nextBlink <= 0) { st.blinkT = 0; st.nextBlink = 2 + Math.random() * 3; }
    if (st.blinkT >= 0) { st.blinkT += dt; const p = st.blinkT / 0.18; st.lid = p < 1 ? Math.sin(p * Math.PI) : 0; if (p >= 1) st.blinkT = -1; }
    const breathe = reduce ? 0 : Math.sin(t * 2.1) * 0.06;
    clay.set({ uLook: st.look, uLid: st.lid, uSquash: Math.max(-1, Math.min(1, st.squash + breathe)), uFocus: st.focus, uExposure: st.exp });
    clay.frame(t);
  }
  function loop() {
    cancelAnimationFrame(st.raf);
    const tick = now => { if (!st.visible) return; step(now); st.raf = requestAnimationFrame(tick); };
    st.raf = requestAnimationFrame(tick);
  }
  step(performance.now());
  if (!reduce) loop();

  return {
    clay,
    focus(v) { st.focusT = Math.max(0, Math.min(1, v)); if (reduce) step(performance.now()); },
    exposure(v) { st.expT = Math.max(-2, Math.min(2, v)); if (reduce) step(performance.now()); },
    look(x, y) { st.lookT = [x, y]; },
    shutter,
    destroy() { cancelAnimationFrame(st.raf); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onMove); canvas.removeEventListener('click', shutter); },
  };
}
