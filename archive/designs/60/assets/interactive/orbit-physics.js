// orbit-physics.js — "Gravity Well": the products orbit the pocket planet under a hand-written
// inverse-square attractor on top of matter.js 0.20.0 (vendored, MIT). Grab a product and fling it;
// tap empty space to drop a new block of activity into orbit. Pointer / device tilt leans the stage.
//
//   import { mountOrbit } from './orbit-physics.js'
//   const orbit = await mountOrbit(canvas, { labels: true })
//   orbit.dispose()
//
// The canvas should sit inside an element; size it with CSS. Respects prefers-reduced-motion (starts paused).

const HERE = new URL('./', import.meta.url).href;
const SHARED = new URL('../../../_shared/products/', import.meta.url).href;

function loadMatter() {
  if (window.Matter) return Promise.resolve(window.Matter);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = HERE + 'vendor/matter-0.20.0.min.js'; s.onload = () => res(window.Matter); s.onerror = rej; document.head.appendChild(s); });
}
const img = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

const COL = { void: '#05080c', ink: '#080e15', rim: '#1c2735', slate: '#3c4958', fog: '#798898', paper: '#eef2f7', volt: '#0790ff', voltHi: '#80bcff', voltLo: '#0559a8' };
const PRODUCTS = [
  { id: 'mcp-emails', name: 'MCP Emails', src: SHARED + 'mcp-emails/icon.png', r: 34 },
  { id: 'fun-libs', name: 'Fun Libs', src: SHARED + 'fun-libs/icon.png', r: 34 },
  { id: 'toolrails', name: 'Toolrails', src: HERE + '../src/tex/toolrails.png', r: 30 },
  { id: 'harbor', name: 'Harbor', src: HERE + '../src/tex/harbor-mark.png', r: 30, bg: '#1b1b1b' },
];

function isoCube(ctx, x, y, s, a, tones) {
  const S = Math.sqrt(3) / 2; ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  const f = (pts, c) => { ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px * s, py * s) : ctx.moveTo(px * s, py * s)); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); };
  f([[0, -1], [S, -0.5], [0, 0], [-S, -0.5]], tones[0]); f([[-S, -0.5], [0, 0], [0, 1], [-S, 0.5]], tones[1]); f([[0, 0], [S, -0.5], [S, 0.5], [0, 1]], tones[2]);
  ctx.restore();
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

export async function mountOrbit(canvas, opts = {}) {
  const M = await loadMatter();
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events, Vector } = M;
  const [planetImg, ...logos] = await Promise.all([img(HERE + '../hero/planet-cutout-1000.webp'), ...PRODUCTS.map(p => img(p.src))]);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, PR = 100;
  const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
  const world = engine.world;
  let planet = null; const bodies = [];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let running = !reduce;

  function orbitVelocity(pos) { // circular-orbit speed for our attractor, tangential direction
    const d = Vector.sub(pos, { x: cx, y: cy }), r = Math.max(Vector.magnitude(d), 1);
    const v = 16.667 * Math.sqrt(G * PR * PR / r) * 0.98; /* matter velocities are per 16.67 ms step */ const t = Vector.normalise({ x: -d.y, y: d.x });
    return Vector.mult(t, v);
  }
  const G = 0.00025; // px/ms^2 at the planet radius
  function spawn(kind, x, y, extra = {}) {
    let b;
    if (kind === 'product') { b = Bodies.circle(x, y, extra.r, { restitution: 0.85, frictionAir: 0, friction: 0.02, density: 0.004 }); b.plugin = { kind, ...extra, trail: [] }; }
    else { const s = extra.s || 9 + Math.random() * 9; b = Bodies.polygon(x, y, 6, s, { restitution: 0.7, frictionAir: 0, density: 0.002 }); b.plugin = { kind: 'voxel', s, hot: extra.hot ?? Math.random() < 0.25, trail: [] }; }
    Body.setVelocity(b, orbitVelocity(b.position));
    Composite.add(world, b); bodies.push(b); return b;
  }

  function layout() {
    const r = canvas.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr;
    const ncx = W / 2, ncy = H / 2, nPR = Math.min(W, H) * 0.2;
    if (planet) { // keep everything relative when resizing
      const k = nPR / PR; bodies.forEach(b => Body.setPosition(b, { x: ncx + (b.position.x - cx) * k, y: ncy + (b.position.y - cy) * k }));
      Composite.remove(world, planet);
    }
    cx = ncx; cy = ncy; PR = nPR;
    planet = Bodies.circle(cx, cy, PR * 0.86, { isStatic: true, restitution: 0.9 }); Composite.add(world, planet);
  }
  layout();

  // initial population: the four live products plus a ring of activity
  PRODUCTS.forEach((p, i) => { const a = i / PRODUCTS.length * Math.PI * 2 + 0.4, rr = PR * (1.75 + (i % 2) * 0.45); spawn('product', cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, { ...p, image: logos[i] }); });
  for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2, rr = PR * (1.3 + Math.random() * 1.3); spawn('voxel', cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }

  // the attractor: inverse-square pull toward the planet's centre
  Events.on(engine, 'beforeUpdate', () => {
    bodies.forEach(b => {
      const d = Vector.sub({ x: cx, y: cy }, b.position), r2 = Math.max(Vector.magnitudeSquared(d), PR * PR * 0.6);
      const f = Vector.mult(Vector.normalise(d), G * b.mass * PR * PR / r2);
      Body.applyForce(b, b.position, f);
      // soft leash so nothing is lost off-screen forever
      const r = Math.sqrt(r2), lim = Math.max(W, H) * 0.75; if (r > lim) Body.setVelocity(b, Vector.mult(b.velocity, 0.96));
    });
  });

  // pointer: grab and fling (matter MouseConstraint), tap empty space to drop a voxel
  const mouse = Mouse.create(canvas); mouse.pixelRatio = 1;
  Mouse.setScale(mouse, { x: 1, y: 1 });
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.12, damping: 0.08, render: { visible: false } } });
  Composite.add(world, mc);
  // matter attaches wheel listeners that block page scroll; remove them
  canvas.removeEventListener('wheel', mouse.mousewheel); canvas.removeEventListener('mousewheel', mouse.mousewheel); canvas.removeEventListener('DOMMouseScroll', mouse.mousewheel);
  let downAt = null;
  canvas.addEventListener('pointerdown', e => { downAt = { x: e.offsetX, y: e.offsetY, t: performance.now() }; });
  canvas.addEventListener('pointerup', e => {
    if (!downAt) return; const moved = Math.hypot(e.offsetX - downAt.x, e.offsetY - downAt.y); const quick = performance.now() - downAt.t < 250;
    if (moved < 6 && quick && !mc.body) { const b = spawn('voxel', e.offsetX, e.offsetY, { hot: true, s: 13 }); if (bodies.length > 70) { const old = bodies.find(x => x.plugin.kind === 'voxel'); Composite.remove(world, old); bodies.splice(bodies.indexOf(old), 1); } opts.onSpawn && opts.onSpawn(b); }
    downAt = null;
  });

  // tilt the stage from the pointer or the device (signature delight)
  const stage = opts.tiltTarget || canvas.parentElement; let tx = 0, ty = 0, ax = 0, ay = 0;
  const onMove = e => { const r = stage.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; };
  const onOrient = e => { if (e.gamma == null) return; tx = Math.max(-1, Math.min(1, e.gamma / 25)); ty = Math.max(-1, Math.min(1, (e.beta - 40) / 25)); };
  window.addEventListener('pointermove', onMove, { passive: true }); window.addEventListener('deviceorientation', onOrient);

  let raf = 0, last = performance.now(), spin = 0;
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    // orbit guides
    ctx.save(); ctx.strokeStyle = 'rgba(128,188,255,0.10)'; ctx.setLineDash([2, 7]);
    [1.5, 2.0, 2.6].forEach(k => { ctx.beginPath(); ctx.ellipse(cx, cy, PR * k, PR * k, 0, 0, Math.PI * 2); ctx.stroke(); }); ctx.restore();
    // trails (velocity)
    bodies.forEach(b => {
      const t = b.plugin.trail; t.push({ x: b.position.x, y: b.position.y }); if (t.length > (b.plugin.kind === 'product' ? 26 : 12)) t.shift();
      if (t.length < 2) return; ctx.beginPath(); t.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      const sp = Vector.magnitude(b.velocity); ctx.strokeStyle = `rgba(7,144,255,${Math.min(0.55, 0.08 + sp * 0.06)})`; ctx.lineWidth = b.plugin.kind === 'product' ? 3 : 1.5; ctx.lineCap = 'round'; ctx.stroke();
    });
    // planet (behind the bodies on the far side would need depth; we keep it flat and honest)
    if (planetImg) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(spin); const s = PR * 2.25; ctx.drawImage(planetImg, -s / 2, -s / 2, s, s); ctx.restore(); }
    else { ctx.fillStyle = COL.rim; ctx.beginPath(); ctx.arc(cx, cy, PR, 0, Math.PI * 2); ctx.fill(); }
    bodies.forEach(b => {
      const { x, y } = b.position;
      if (b.plugin.kind === 'voxel') { const s = b.plugin.s; isoCube(ctx, x, y, s, b.angle, b.plugin.hot ? [COL.voltHi, COL.volt, COL.voltLo] : ['#7488a3', '#4d6079', '#2b3a4d']); return; }
      const r = b.plugin.r; ctx.save(); ctx.translate(x, y);
      // iso extrusion shadow
      ctx.fillStyle = COL.voltLo; roundRect(ctx, -r + 4, -r + 6, r * 2, r * 2, r * 0.45); ctx.fill();
      ctx.rotate(b.angle * 0.25);
      roundRect(ctx, -r, -r, r * 2, r * 2, r * 0.45); ctx.save(); ctx.clip();
      ctx.fillStyle = b.plugin.bg || COL.ink; ctx.fillRect(-r, -r, r * 2, r * 2);
      if (b.plugin.image) ctx.drawImage(b.plugin.image, -r, -r, r * 2, r * 2);
      ctx.restore(); ctx.restore();
      if (opts.labels !== false) { ctx.font = '500 11px "Geist Mono", ui-monospace, monospace'; ctx.fillStyle = 'rgba(202,210,219,0.8)'; ctx.textAlign = 'center'; ctx.fillText(b.plugin.name.toUpperCase(), x, y + r + 18); }
    });
  }
  function frame(now) {
    const dt = Math.min(32, now - last); last = now;
    if (running) { Engine.update(engine, dt); spin += dt * 0.00004; }
    ax += (tx - ax) * 0.08; ay += (ty - ay) * 0.08;
    if (stage && opts.tilt !== false) stage.style.transform = `perspective(1100px) rotateX(${(-ay * 6).toFixed(2)}deg) rotateY(${(ax * 8).toFixed(2)}deg)`;
    draw(); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const ro = new ResizeObserver(layout); ro.observe(canvas);

  return {
    engine, play() { running = true; }, pause() { running = false; }, get running() { return running; },
    shake() { bodies.forEach(b => Body.setVelocity(b, Vector.add(b.velocity, { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 }))); },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('pointermove', onMove); window.removeEventListener('deviceorientation', onOrient); Engine.clear(engine); },
  };
}
