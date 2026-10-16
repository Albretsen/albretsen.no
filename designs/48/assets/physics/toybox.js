// toybox.js: the 2D-physics centrepiece. Glossy plastic toys (baked from the same studio as
// the hero) drop into a container, collide, and can be grabbed and thrown. Matter.js 0.20.0.
//
//   import { mountToybox } from './toybox.js'
//   const box = await mountToybox(el, { count: 22, gravity: 1, drop: 'settled' | 'stagger' })
//   box.spawn('mark')        // add one more (kinds below)
//   box.shake()              // impulse everything upward
//   box.destroy()
//
// Sprites are 240px webp with transparent backgrounds, cropped to the object's bounds,
// so the body size maps 1:1 to the sprite bounds.
const MATTER = 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm';
const here = new URL('./sprites/', import.meta.url).href;

export const KINDS = {
  'sphere-glow': { shape: 'circle', size: 1.0 },
  'sphere-ion': { shape: 'circle', size: 0.82 },
  'sphere-jade': { shape: 'circle', size: 0.7 },
  pill: { shape: 'pill', size: 1.25 },
  'pill-cobalt': { shape: 'pill', size: 1.05 },
  torus: { shape: 'circle', size: 1.05 },
  cube: { shape: 'box', size: 0.95 },
  mark: { shape: 'mark', size: 1.35 },
};

function load(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }

export async function mountToybox(el, opts = {}) {
  const o = { count: 22, gravity: 1, unit: 0, drop: 'settled', kinds: Object.keys(KINDS), ...opts };
  const { default: Matter } = await import(MATTER);
  const { Engine, Runner, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;
  const imgs = Object.fromEntries(await Promise.all(o.kinds.map(async k => [k, await load(here + k + '.webp')])));

  const canvas = document.createElement('canvas'); canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y';
  el.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const engine = Engine.create({ gravity: { y: o.gravity } });
  const world = engine.world;
  let W = 0, H = 0, dpr = 1, walls = [], U = 80;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = el.clientWidth; H = el.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    U = o.unit || Math.max(44, Math.min(96, Math.sqrt(W * H / (o.count * 2.2))));
    Composite.remove(world, walls);
    const t = 400, opt = { isStatic: true, friction: 0.4, restitution: 0.2 };
    walls = [Bodies.rectangle(W / 2, H + t / 2, W * 3, t, opt), Bodies.rectangle(-t / 2, H / 2 - 2000, t, H * 2 + 4000, opt), Bodies.rectangle(W + t / 2, H / 2 - 2000, t, H * 2 + 4000, opt)];
    Composite.add(world, walls);
  }

  function spawn(kind = o.kinds[(Math.random() * o.kinds.length) | 0], x = W * (0.15 + Math.random() * 0.7), y = -U * (1 + Math.random() * 2)) {
    const k = KINDS[kind], img = imgs[kind]; const s = U * k.size; const ar = img.width / img.height;
    let body; const common = { restitution: 0.35, friction: 0.25, frictionAir: 0.012, density: 0.002 };
    if (k.shape === 'circle') body = Bodies.circle(x, y, s / 2, common);
    else if (k.shape === 'box') body = Bodies.rectangle(x, y, s * ar, s, { ...common, chamfer: { radius: s * 0.22 } });
    else if (k.shape === 'pill') body = Bodies.rectangle(x, y, s * ar, s, { ...common, chamfer: { radius: s * ar * 0.49 } });
    else { const w = s * ar, h = s; body = Bodies.fromVertices(x, y, [[{ x: 0, y: -h * 0.5 }, { x: w * 0.5, y: h * 0.5 }, { x: -w * 0.5, y: h * 0.5 }]], { ...common }); } // the mark: a triangle hull
    body.plugin.sprite = { img, w: k.shape === 'circle' ? s : s * ar, h: s, kind, mark: k.shape === 'mark' };
    Body.setAngle(body, body.angle + (Math.random() - 0.5) * 1.2);
    Composite.add(world, body); return body;
  }

  layout();
  const n = o.count;
  if (o.drop === 'stagger' && !reduce) { for (let i = 0; i < n; i++) setTimeout(() => spawn(o.kinds[i % o.kinds.length]), i * 90); }
  else {
    // 'settled': build the pile off-screen in time, so the first frame is already at rest.
    for (let i = 0; i < n; i++) spawn(o.kinds[i % o.kinds.length], W * (0.08 + 0.84 * ((i * 0.618) % 1)), H - U * (0.8 + Math.floor(i / Math.max(1, Math.floor(W / U))) * 1.1));
    for (let i = 0; i < 360; i++) Engine.update(engine, 1000 / 60);
  }

  const mouse = Mouse.create(canvas); mouse.pixelRatio = 1;
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.08, render: { visible: false } } });
  // let the page scroll with the wheel / touch when not grabbing
  mouse.element.removeEventListener('wheel', mouse.mousewheel); mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
  Composite.add(world, mc);
  Events.on(mc, 'startdrag', () => canvas.style.cursor = 'grabbing'); Events.on(mc, 'enddrag', () => canvas.style.cursor = '');

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    for (const b of Composite.allBodies(world)) {
      const sp = b.plugin.sprite; if (!sp) continue;
      ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
      // contact shadow
      ctx.save(); ctx.rotate(-b.angle); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.filter = 'blur(6px)'; ctx.beginPath(); ctx.ellipse(0, sp.h * 0.42, sp.w * 0.38, sp.h * 0.1, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.drawImage(sp.img, -sp.w / 2, -sp.h / 2 - (sp.mark ? sp.h / 6 : 0), sp.w, sp.h); // triangle centroid sits h/6 below the box centre
      ctx.restore();
    }
  }
  const runner = Runner.create();
  Events.on(engine, 'afterUpdate', () => { for (const b of Composite.allBodies(world)) if (b.position.y > H + 600) Composite.remove(world, b); });
  let raf = 0, visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { Runner.run(runner, engine); loop(); } else Runner.stop(runner); }); io.observe(el);
  function loop() { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { draw(); if (visible) loop(); }); }
  Runner.run(runner, engine); loop();
  const ro = new ResizeObserver(() => layout()); ro.observe(el);

  return {
    spawn, engine,
    shake() { for (const b of Composite.allBodies(world)) if (!b.isStatic) Body.setVelocity(b, { x: (Math.random() - 0.5) * 12, y: -14 - Math.random() * 8 }); },
    destroy() { Runner.stop(runner); cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); Engine.clear(engine); canvas.remove(); },
  };
}
