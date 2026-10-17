// Cloud Chamber, site edition. Extends the kit prototype (assets/3d/chamber.js):
// chrome letter sprites fall into a canvas 2D chamber (matter.js), can be grabbed and
// thrown, and every hard impact draws bubble-chamber tracks that slowly fade.
// Added here: live product events enter the chamber as labelled tracks, keyboard
// kicks (press a letter of ALBRETSEN), a zero-g switch, impact callbacks for the
// detector log and sound, and pausing while off screen.
import { particle, ROSE, rng } from '../assets/src/tracks.js';

const MATTER = 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js';
const SPRITES = new URL('../assets/3d/sprites/', import.meta.url);
const KEYS = ['A', 'L', 'B', 'R', 'E', 'T', 'S', 'N', 'mark', 'E2'];

function loadMatter() {
  if (window.Matter) return Promise.resolve(window.Matter);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = MATTER; s.onload = () => res(window.Matter); s.onerror = rej; document.head.appendChild(s); });
}
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });

// product → track colour and charge, so each product reads as its own particle species
const SPECIES = {
  'mcp-emails': { color: ROSE[4], charge: -1, energy: 900 },
  'fun-libs': { color: ROSE[6], charge: 1, energy: 620 },
  toolrails: { color: ROSE[2], charge: -1, energy: 1300 },
  'albretsen.no': { color: '#7b606d', charge: 1, energy: 2200 },
};

export async function mountChamber(canvas, { word = 'ALBRETSEN', withMark = true, settled = false, onImpact = () => {}, reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches } = {}) {
  const M = await loadMatter();
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = M;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const ctx = canvas.getContext('2d');
  const trail = document.createElement('canvas'); const tctx = trail.getContext('2d');
  const palette = ROSE.slice(2, 7);
  const R = rng(0x04246b);
  let W = 0, H = 0;
  const floorInset = () => (W < 700 ? 66 : 78); // the controls bar sits below the chamber floor

  const imgs = {};
  await Promise.all(KEYS.map(async k => { imgs[k] = await loadImg(new URL(`${k}.webp`, SPRITES).href); }));

  const engine = Engine.create({ gravity: { y: 1.1 } });
  const world = engine.world;
  let walls = [];
  function size() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || (r.width === W && r.height === H)) return;
    W = r.width; H = r.height;
    const keep = trail.width ? trail.cloneNode() : null;
    if (keep) keep.getContext('2d').drawImage(trail, 0, 0);
    for (const c of [canvas, trail]) { c.width = W * dpr; c.height = H * dpr; }
    if (keep) tctx.drawImage(keep, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Composite.remove(world, walls);
    const t = 400;
    walls = [
      Bodies.rectangle(W / 2, H - floorInset() + t / 2, W * 3, t, { isStatic: true, label: 'floor' }),
      Bodies.rectangle(-t / 2, H / 2, t, H * 6, { isStatic: true, label: 'wall' }),
      Bodies.rectangle(W + t / 2, H / 2, t, H * 6, { isStatic: true, label: 'wall' }),
      Bodies.rectangle(W / 2, -H * 1.6 - t / 2, W * 3, t, { isStatic: true, label: 'lid' }),
    ];
    Composite.add(world, walls);
    // keep letters inside after a resize
    for (const b of bodies) if (b.position.x > W - 20 || b.position.y > H) Body.setPosition(b, { x: Math.min(W - 60, b.position.x), y: Math.min(H - 80, b.position.y) });
  }
  const bodies = [];
  size();

  const unit = Math.max(52, Math.min(W / (word.length + 2.2), 176));
  const keys = [...word].map((c, i) => (c === 'E' && i > 3) ? 'E2' : c);
  if (withMark) keys.splice(Math.floor(keys.length / 2), 0, 'mark');
  const home = i => W * (0.1 + 0.8 * (i / (keys.length - 1)));
  keys.forEach((k, i) => {
    const s = unit * (k === 'mark' ? 1.25 : 1);
    const b = Bodies.rectangle(home(i), -s * (0.7 + (i % 4) * 0.55), s * 0.82, s * 0.66, { chamfer: { radius: s * 0.1 }, restitution: 0.14, friction: 0.4, frictionAir: 0.018, density: 0.002, label: k });
    Body.setAngle(b, (R() - 0.5) * 0.3);
    b.plugin = { key: k, draw: s * 1.7, glyph: k === 'E2' ? 'E' : k === 'mark' ? 'A' : k };
    bodies.push(b);
  });
  Composite.add(world, bodies);

  const mouse = Mouse.create(canvas); mouse.pixelRatio = 1;
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.08, render: { visible: false } } });
  Composite.add(world, mc);
  mouse.element.removeEventListener('wheel', mouse.mousewheel); mouse.element.removeEventListener('mousewheel', mouse.mousewheel); mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
  // touch: only capture the gesture when it starts on a letter, so the page still scrolls
  canvas.style.touchAction = 'pan-y';
  const hit = (x, y) => M.Query.point(bodies, { x, y }).length > 0;
  canvas.addEventListener('pointermove', e => { canvas.style.cursor = mc.body ? 'grabbing' : hit(e.offsetX, e.offsetY) ? 'grab' : 'crosshair'; });

  // ---- tracks ----
  const live = [];
  function emit(x, y, energy, angle, count = 2, color) {
    for (let i = 0; i < count; i++) {
      const charge = i % 2 ? 1 : -1;
      const pts = particle({ x, y, angle: angle + charge * (0.2 + R() * 0.5), energy: energy * (0.6 + R() * 0.8), charge, loss: 0.991 + R() * 0.005, step: 1.4 });
      live.push({ pts, i: 0, color: color || palette[(R() * palette.length) | 0], w: 0.6 + R() * 0.9 });
    }
  }
  // a product event: one particle crossing the chamber from an edge, with a small label at its entry
  function inject(ev) {
    const sp = SPECIES[ev.product] || SPECIES['albretsen.no'];
    // enter from the right edge or the top edge, away from the hero copy on the left
    const fromTop = R() < 0.4;
    const x = fromTop ? W * (0.5 + R() * 0.42) : W + 4, y = fromTop ? -4 : H * (0.14 + R() * 0.5);
    const angle = fromTop ? Math.PI / 2 + (R() - 0.5) * 0.6 : Math.PI + (R() - 0.5) * 0.5;
    const scale = Math.max(0.5, Math.min(1.4, W / 1200));
    const pts = particle({ x, y, angle, energy: sp.energy * scale * (0.7 + R() * 0.6), charge: sp.charge, loss: 0.9955 + R() * 0.002, step: 2, steps: 1200, minR: 6 });
    live.push({ pts, i: 0, color: sp.color, w: 1.1, speed: 22 });
    tctx.save(); tctx.font = '500 10px "Geist Mono", ui-monospace, monospace'; tctx.fillStyle = sp.color; tctx.globalAlpha = 0.9;
    const label = W < 700 ? '' : `${(ev.label || '').toUpperCase()} · ${ev.kind}`;
    if (fromTop) { tctx.textAlign = 'left'; tctx.fillText(label, Math.min(x + 10, W - tctx.measureText(label).width - 14), 86); }
    else { tctx.textAlign = 'right'; tctx.fillText(label, W - 14, y - 10); }
    tctx.restore();
  }

  Events.on(engine, 'collisionStart', e => {
    for (const p of e.pairs) {
      const v = Math.hypot(p.bodyA.velocity.x - p.bodyB.velocity.x, p.bodyA.velocity.y - p.bodyB.velocity.y);
      if (v > 7) {
        const c = p.collision.supports[0] || p.bodyA.position;
        emit(c.x, c.y, 30 + v * 9, R() * 6.28, v > 14 ? 4 : 2);
        const name = b => b.plugin && b.plugin.glyph ? b.plugin.glyph : b.label;
        onImpact({ v, a: name(p.bodyA), b: name(p.bodyB), x: c.x, y: c.y });
      }
    }
  });
  Events.on(mc, 'enddrag', e => { const b = e.body; const sp = Math.hypot(b.velocity.x, b.velocity.y); if (sp > 5) emit(b.position.x, b.position.y, 60 + sp * 14, Math.atan2(b.velocity.y, b.velocity.x), 3); });
  let downAt = null;
  canvas.addEventListener('pointerdown', e => { downAt = [e.offsetX, e.offsetY, performance.now()]; wake(); });
  canvas.addEventListener('pointerup', e => {
    if (!downAt || mc.body) return; const [x, y, t] = downAt; downAt = null;
    if (Math.hypot(e.offsetX - x, e.offsetY - y) < 4 && performance.now() - t < 300 && !hit(x, y)) { emit(x, y, 140 + R() * 160, R() * 6.28, 2); onImpact({ v: 0, a: 'decay', b: '', x, y }); }
  });

  function drawTracks(fade = true) {
    if (fade) { tctx.save(); tctx.globalCompositeOperation = 'destination-out'; tctx.fillStyle = 'rgba(0,0,0,0.010)'; tctx.fillRect(0, 0, W, H); tctx.restore(); }
    for (let k = live.length - 1; k >= 0; k--) {
      const t = live[k]; const end = Math.min(t.pts.length - 1, t.i + (t.speed || 14));
      tctx.strokeStyle = t.color; tctx.lineWidth = t.w; tctx.lineCap = 'round'; tctx.lineJoin = 'round'; tctx.globalAlpha = 0.85;
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
    const floor = H - floorInset();
    // the chamber floor: a hairline with fiducial ticks
    ctx.save(); ctx.strokeStyle = '#e781b7'; ctx.globalAlpha = 0.6; ctx.lineWidth = 1; ctx.setLineDash([2, 6]);
    ctx.beginPath(); ctx.moveTo(0, floor + 0.5); ctx.lineTo(W, floor + 0.5); ctx.stroke(); ctx.setLineDash([]);
    for (let x = 60; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, floor - 4); ctx.lineTo(x, floor + 5); ctx.stroke(); }
    ctx.restore();
    for (const b of bodies) {
      const { x, y } = b.position; const s = b.plugin.draw;
      const lift = Math.max(0, Math.min(1, (floor - y) / (H * 0.6)));
      ctx.save(); ctx.globalAlpha = 0.2 * (1 - lift * 0.85); ctx.fillStyle = '#5e1942';
      ctx.filter = 'blur(6px)'; ctx.beginPath(); ctx.ellipse(x, floor + 2, s * 0.28 * (1 - lift * 0.4), 5, 0, 0, 6.283); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(x, y); ctx.rotate(b.angle); ctx.drawImage(imgs[b.plugin.key], -s / 2, -s / 2, s, s); ctx.restore();
    }
  }

  let raf = 0, last = performance.now(), running = false, visible = true, ticked = false;
  function step(now) {
    const dt = Math.min(1000 / 30, now - last); last = now;
    if (dt > 0) Engine.update(engine, dt);
    drawTracks(); render();
  }
  function frame(now) { ticked = true; step(now); if (running) raf = requestAnimationFrame(frame); }
  function start() { if (running || reducedMotion || !visible) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function wake() { if (reducedMotion) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); reducedMotion = false; } }
  // headless or throttled contexts may never deliver rAF; fall back to timers
  setTimeout(function fallback() { if (ticked || reducedMotion || !running) return; step(performance.now()); setTimeout(fallback, 16); }, 300);

  if (settled || reducedMotion) {
    for (let i = 0; i < 420; i++) { Engine.update(engine, 1000 / 60); if (i % 3 === 0) drawTracks(); }
    for (let k = 0; k < 6; k++) emit(W * (0.15 + R() * 0.7), H * (0.15 + R() * 0.45), 120 + R() * 200, R() * 6.28, 2);
    for (let i = 0; i < 80; i++) drawTracks(false);
    render();
  }
  start();

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); });
  io.observe(canvas);
  const ro = new ResizeObserver(() => { size(); if (!running) render(); }); ro.observe(canvas);

  const api = {
    emit, inject, keys: () => bodies.map(b => b.plugin.glyph),
    kick(glyph) {
      const list = bodies.filter(b => b.plugin.glyph === glyph.toUpperCase());
      if (!list.length) return false;
      wake();
      for (const b of list) { Body.setVelocity(b, { x: (R() - 0.5) * 16, y: -14 - R() * 8 }); Body.setAngularVelocity(b, (R() - 0.5) * 0.5); emit(b.position.x, b.position.y + 20, 140, -Math.PI / 2, 2); }
      return true;
    },
    fire() { wake(); const x = W * (0.2 + R() * 0.6), y = H * (0.2 + R() * 0.4); emit(x, y, 160 + R() * 180, R() * 6.28, 4); onImpact({ v: 0, a: 'decay', b: '', x, y }); },
    setGravity(g) { wake(); engine.gravity.y = g; if (g === 0) for (const b of bodies) Body.setVelocity(b, { x: (R() - 0.5) * 3, y: -2 - R() * 3 }); },
    reset() { wake(); bodies.forEach((b, i) => { Body.setPosition(b, { x: home(i), y: -80 - i * 70 }); Body.setVelocity(b, { x: 0, y: 0 }); Body.setAngle(b, (R() - 0.5) * 0.4); }); },
    destroy() { stop(); io.disconnect(); ro.disconnect(); Engine.clear(engine); },
  };
  return api;
}
