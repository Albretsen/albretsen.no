// cel-table.js — design 41 "Key Frame"
// The light table: any DOM elements become physical cels (matter.js 0.20.0,
// vendored at ../vendor/matter-0.20.0.min.js, expected as window.Matter).
// Grab, throw, stack and rearrange them. Free bodies are drawn "on twos"
// (pose updated 12x a second); the one in your hand updates every frame.
//
//   import { mountCelTable } from './cel-table.js'
//   const table = mountCelTable(container, { onTwos: true, gravity: 1, persist: 'home', settle: false })
//   table.on('impact', ({ speed, a, b }) => …)
//   table.shake(); table.reset(); table.destroy()
//
// Markup: children with [data-cel]. Optional data-shape="circle",
// data-x / data-y (0..1 start position), data-angle (deg).

export function mountCelTable(container, opts = {}) {
  const o = Object.assign({ onTwos: true, gravity: 1, persist: null, settle: false, restitution: 0.35, friction: 0.25, wall: 200 }, opts);
  const M = window.Matter;
  if (!M) throw new Error('cel-table: load vendor/matter-0.20.0.min.js first');
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = M;
  const listeners = {};
  const emit = (k, v) => (listeners[k] || []).forEach(f => f(v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  container.style.position ||= 'relative';
  container.style.touchAction = 'none';
  const engine = Engine.create({ gravity: { x: 0, y: reduced ? 0 : o.gravity } });
  engine.positionIterations = 8;

  let W = container.clientWidth, H = container.clientHeight, walls = [];
  function buildWalls() {
    Composite.remove(engine.world, walls);
    const t = o.wall;
    walls = [
      Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, -H * 2, t, H * 6, { isStatic: true }),
      Bodies.rectangle(W + t / 2, -H * 2, t, H * 6, { isStatic: true }),
    ];
    Composite.add(engine.world, walls);
  }
  buildWalls();

  let saved = null;
  try { saved = o.persist && JSON.parse(localStorage.getItem(`kf-table:${o.persist}`) || 'null'); } catch {}

  const els = [...container.querySelectorAll('[data-cel]')];
  const items = els.map((el, i) => {
    el.style.position = 'absolute'; el.style.left = '0'; el.style.top = '0';
    el.style.willChange = 'transform'; el.style.pointerEvents = 'none'; el.style.userSelect = 'none';
    el.draggable = false;
    const w = el.offsetWidth, h = el.offsetHeight;
    const s = saved?.[i];
    const x = s ? s.x * W : (parseFloat(el.dataset.x ?? Math.random()) * (W - w) + w / 2);
    const y = s ? s.y * H : (parseFloat(el.dataset.y ?? -0.3 - Math.random()) * H);
    const common = { restitution: o.restitution, friction: o.friction, frictionAir: 0.012, density: 0.0016 };
    const body = el.dataset.shape === 'circle'
      ? Bodies.circle(x, y, w / 2, common)
      : Bodies.rectangle(x, y, w, h, { ...common, chamfer: { radius: Math.min(w, h) * 0.12 } });
    Body.setAngle(body, s ? s.a : ((parseFloat(el.dataset.angle || (Math.random() * 20 - 10))) * Math.PI) / 180);
    body.plugin.el = el; body.plugin.w = w; body.plugin.h = h;
    return body;
  });
  Composite.add(engine.world, items);

  const mouse = Mouse.create(container);
  // matter's Mouse swallows wheel events; give the page its scroll back
  mouse.element.removeEventListener('wheel', mouse.mousewheel);
  mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
  mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.08, render: { visible: false } } });
  Composite.add(engine.world, mc);
  let held = null;
  Events.on(mc, 'startdrag', e => { held = e.body; container.style.cursor = 'grabbing'; held.plugin.el.classList.add('is-held'); emit('grab', { el: held.plugin.el }); });
  Events.on(mc, 'enddrag', e => { e.body.plugin.el.classList.remove('is-held'); held = null; container.style.cursor = ''; emit('release', { el: e.body.plugin.el, speed: Math.hypot(e.body.velocity.x, e.body.velocity.y) }); save(); });
  Events.on(engine, 'collisionStart', ev => {
    for (const p of ev.pairs) {
      const a = p.bodyA, b = p.bodyB;
      const speed = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
      if (speed > 9) emit('impact', { speed, a: a.plugin.el || null, b: b.plugin.el || null });
    }
  });
  container.addEventListener('pointermove', e => {
    if (held) return;
    const r = container.getBoundingClientRect();
    const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
    container.style.cursor = M.Query.point(items, pt).length ? 'grab' : '';
  });

  function save() {
    if (!o.persist) return;
    try { localStorage.setItem(`kf-table:${o.persist}`, JSON.stringify(items.map(b => ({ x: b.position.x / W, y: b.position.y / H, a: b.angle })))); } catch {}
  }

  const draw = (b) => {
    const { el, w, h } = b.plugin;
    el.style.transform = `translate(${(b.position.x - w / 2).toFixed(1)}px, ${(b.position.y - h / 2).toFixed(1)}px) rotate(${b.angle.toFixed(4)}rad)`;
  };
  let raf, last = performance.now(), acc = 0, visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }); io.observe(container);
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(50, now - last); last = now;
    if (!visible) return;
    for (let k = Math.ceil(dt / 16.667), i = 0; i < k; i++) Engine.update(engine, dt / k);
    acc += dt;
    const twos = o.onTwos && !reduced;
    if (!twos || acc >= 1000 / 12) { acc = 0; items.forEach(draw); }
    else if (held && held.plugin.el) draw(held);
  }
  // settle: pre-run the drop so the table is composed on first paint
  if (o.settle || reduced) for (let i = 0; i < 360; i++) Engine.update(engine, 1000 / 60);
  items.forEach(draw);
  raf = requestAnimationFrame(tick);

  const ro = new ResizeObserver(() => {
    const nw = container.clientWidth, nh = container.clientHeight;
    if (nw === W && nh === H) return;
    items.forEach(b => Body.setPosition(b, { x: (b.position.x / W) * nw, y: Math.min((b.position.y / H) * nh, nh - 20) }));
    W = nw; H = nh; buildWalls();
  });
  ro.observe(container);

  return {
    on(k, f) { (listeners[k] ||= []).push(f); return this; },
    setOnTwos(v) { o.onTwos = !!v; },
    shake(power = 14) { items.forEach(b => Body.setVelocity(b, { x: (Math.random() - 0.5) * power, y: -power * (0.6 + Math.random() * 0.6) })); },
    reset() { try { localStorage.removeItem(`kf-table:${o.persist}`); } catch {} items.forEach((b, i) => { Body.setPosition(b, { x: (0.1 + 0.8 * Math.random()) * W, y: -100 - i * 80 }); Body.setVelocity(b, { x: 0, y: 0 }); }); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); Mouse.clearSourceEvents?.(mouse); Engine.clear(engine); },
    engine, bodies: items,
  };
}
