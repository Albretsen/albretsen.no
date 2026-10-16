// Cloud Chamber — the hero centrepiece prototype.
// Baked chrome letter sprites fall into a canvas 2D "chamber" (matter.js rigid bodies),
// can be grabbed and flung; every hard throw or impact ionises the gas and draws
// bubble-chamber tracks (charged spirals) that slowly fade. Click empty space to
// fire a decay event. Self-contained: mountChamber(canvas, options) -> { destroy, reset }.
//
//   import { mountChamber } from './assets/3d/chamber.js';
//   mountChamber(document.querySelector('canvas'), { word: 'ALBRETSEN', theme: 'light' });
//
// Requires: matter-js@0.20.0 (loaded lazily from jsDelivr if window.Matter is absent).
import { particle, ROSE, rng } from '../src/tracks.js';

const MATTER = 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js';
const here = new URL('.', import.meta.url);
const SPRITES = { A: 'A', L: 'L', B: 'B', R: 'R', E: 'E', T: 'T', S: 'S', N: 'N', mark: 'mark', E2: 'E2' };

function loadMatter() {
  if (window.Matter) return Promise.resolve(window.Matter);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = MATTER; s.onload = () => res(window.Matter); s.onerror = rej; document.head.appendChild(s); });
}
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

export async function mountChamber(canvas, { word = 'ALBRETSEN', theme = 'light', withMark = true, scale = 1, settled = false, reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches } = {}) {
  const M = await loadMatter();
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = M;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const ctx = canvas.getContext('2d');
  const trail = document.createElement('canvas'); const tctx = trail.getContext('2d');
  const dark = theme === 'dark';
  const palette = dark ? ROSE.slice(5, 10) : ROSE.slice(2, 7);
  const R = rng(0x04246b);
  let W = 0, H = 0; const floorInset = 22;

  const imgs = {};
  await Promise.all(Object.keys(SPRITES).map(async k => { imgs[k] = await loadImg(new URL(`sprites/${SPRITES[k]}.webp`, here).href); }));

  const engine = Engine.create({ gravity: { y: 1.1 } });
  const world = engine.world;
  let walls = [];
  function size() {
    const r = canvas.getBoundingClientRect();
    if (r.width === W && r.height === H) return;
    W = r.width; H = r.height;
    const keep = trail.width ? trail.cloneNode() : null; // keep existing tracks across resizes
    if (keep) keep.getContext('2d').drawImage(trail, 0, 0);
    for (const c of [canvas, trail]) { c.width = W * dpr; c.height = H * dpr; }
    if (keep) tctx.drawImage(keep, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Composite.remove(world, walls);
    const t = 200;
    walls = [Bodies.rectangle(W / 2, H - floorInset + t / 2, W * 3, t, { isStatic: true }), Bodies.rectangle(-t / 2, H / 2, t, H * 4, { isStatic: true }), Bodies.rectangle(W + t / 2, H / 2, t, H * 4, { isStatic: true })];
    Composite.add(world, walls);
  }
  size();

  // letters: sprite is 400px for a ~1.25-unit glyph; body ≈ 46% of sprite box
  const unit = Math.max(64, Math.min(W / (word.length + 2.5), 170)) * scale;
  const bodies = [];
  const keys = [...word].map((c, i) => (c === 'E' && i > 3) ? 'E2' : c);
  if (withMark) keys.splice(Math.floor(keys.length / 2), 0, 'mark');
  keys.forEach((k, i) => {
    const s = unit * (k === 'mark' ? 1.25 : 1);
    const b = Bodies.rectangle(W * (0.12 + 0.76 * (i / (keys.length - 1))), -s * (0.7 + (i % 4) * 0.45), s * 0.82, s * 0.66, { chamfer: { radius: s * 0.1 }, restitution: 0.12, friction: 0.4, frictionAir: 0.02, density: 0.002 });
    Body.setAngle(b, (R() - 0.5) * 0.2);
    b.plugin = { key: k, draw: s * 1.7 };
    bodies.push(b);
  });
  Composite.add(world, bodies);

  const mouse = Mouse.create(canvas); mouse.pixelRatio = 1;
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.08, render: { visible: false } } });
  Composite.add(world, mc);
  // let the page scroll when the wheel is used over the canvas
  mouse.element.removeEventListener('wheel', mouse.mousewheel); mouse.element.removeEventListener('mousewheel', mouse.mousewheel); mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
  canvas.style.touchAction = 'pan-y';

  // ---- tracks: live particles integrate a few steps per frame ----
  const live = [];
  function emit(x, y, energy, angle, count = 2) {
    for (let i = 0; i < count; i++) {
      const charge = i % 2 ? 1 : -1;
      const pts = particle({ x, y, angle: angle + charge * (0.2 + R() * 0.5), energy: energy * (0.6 + R() * 0.8), charge, loss: 0.991 + R() * 0.005, step: 1.4 });
      live.push({ pts, i: 0, color: palette[(R() * palette.length) | 0], w: 0.6 + R() * 0.9 });
    }
  }
  Events.on(engine, 'collisionStart', e => {
    for (const p of e.pairs) {
      const v = Math.hypot(p.bodyA.velocity.x - p.bodyB.velocity.x, p.bodyA.velocity.y - p.bodyB.velocity.y);
      if (v > 7) { const c = p.collision.supports[0] || p.bodyA.position; emit(c.x, c.y, 30 + v * 9, R() * 6.28, v > 14 ? 4 : 2); }
    }
  });
  Events.on(mc, 'enddrag', e => { const b = e.body; const sp = Math.hypot(b.velocity.x, b.velocity.y); if (sp > 5) emit(b.position.x, b.position.y, 60 + sp * 14, Math.atan2(b.velocity.y, b.velocity.x), 3); });
  let downAt = null;
  canvas.addEventListener('pointerdown', e => { downAt = [e.offsetX, e.offsetY, performance.now()]; });
  canvas.addEventListener('pointerup', e => {
    if (!downAt || mc.body) return; const [x, y, t] = downAt; downAt = null;
    if (Math.hypot(e.offsetX - x, e.offsetY - y) < 4 && performance.now() - t < 300) emit(x, y, 140 + R() * 160, R() * 6.28, 2);
  });

  function drawTracks(fade = true) {
    // slow decay of old tracks toward the chamber background
    if (fade) { tctx.save(); tctx.globalCompositeOperation = 'destination-out'; tctx.fillStyle = 'rgba(0,0,0,0.012)'; tctx.fillRect(0, 0, W, H); tctx.restore(); }
    for (let k = live.length - 1; k >= 0; k--) {
      const t = live[k]; const end = Math.min(t.pts.length - 1, t.i + 14);
      tctx.strokeStyle = t.color; tctx.lineWidth = t.w; tctx.lineCap = 'round'; tctx.globalAlpha = 0.85;
      tctx.beginPath(); tctx.moveTo(t.pts[t.i][0], t.pts[t.i][1]);
      for (let j = t.i + 1; j <= end; j++) tctx.lineTo(t.pts[j][0], t.pts[j][1]);
      tctx.stroke();
      tctx.fillStyle = t.color;
      for (let j = t.i; j <= end; j += 4) { tctx.beginPath(); tctx.arc(t.pts[j][0], t.pts[j][1], t.w * (0.4 + R() * 0.7), 0, 6.283); tctx.fill(); }
      tctx.globalAlpha = 1;
      t.i = end; if (t.i >= t.pts.length - 1) live.splice(k, 1);
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(trail, 0, 0, W, H);
    for (const b of bodies) {
      const { x, y } = b.position; const s = b.plugin.draw;
      // contact shadow
      const lift = Math.max(0, Math.min(1, (H - y) / (H * 0.6)));
      ctx.save(); ctx.globalAlpha = 0.22 * (1 - lift * 0.8); ctx.fillStyle = dark ? '#000' : '#5e1942';
      ctx.beginPath(); ctx.ellipse(x, H - floorInset + 2, s * 0.28 * (1 - lift * 0.4), 5, 0, 0, 6.283); ctx.filter = 'blur(6px)'; ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(x, y); ctx.rotate(b.angle); ctx.drawImage(imgs[b.plugin.key], -s / 2, -s / 2, s, s); ctx.restore();
    }
  }

  let raf = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(1000 / 30, now - last); last = now;
    if (dt > 0) Engine.update(engine, dt);
    drawTracks(); render();
    ticked = true; raf = requestAnimationFrame(frame);
  }
  // headless/throttled contexts may never deliver rAF; fall back to timers
  let ticked = false;
  setTimeout(function fallback() { if (ticked || reducedMotion) return; frame(performance.now()); ticked = false; setTimeout(fallback, 16); }, 250);
  // settled: start from the resting pile (also used for reduced motion and stills)
  if (settled || reducedMotion) { for (let i = 0; i < 420; i++) { Engine.update(engine, 1000 / 60); if (i % 3 === 0) drawTracks(); } for (let k = 0; k < 6; k++) emit(W * (0.15 + R() * 0.7), H * (0.15 + R() * 0.45), 120 + R() * 200, R() * 6.28, 2); for (let i = 0; i < 80; i++) drawTracks(false); render(); }
  if (!reducedMotion) raf = requestAnimationFrame(frame);

  const ro = new ResizeObserver(() => size()); ro.observe(canvas);
  return {
    engine,
    emit,
    reset() { bodies.forEach((b, i) => { Body.setPosition(b, { x: W * (0.12 + 0.76 * i / (bodies.length - 1)), y: -100 - i * 60 }); Body.setVelocity(b, { x: 0, y: 0 }); }); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); Engine.clear(engine); },
  };
}
