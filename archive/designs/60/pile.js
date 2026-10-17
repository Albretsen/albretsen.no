// pile.js — the hero's activity pile (design 60, Pocket Planet).
// Every live event from the products is launched off the planet as a DOM block and lands in a pile at the bottom
// of the hero. matter.js 0.20.0 (vendored in the kit) runs the bodies; the blocks stay real DOM, so text is crisp.
// Blocks can be grabbed and flung (a spring constraint from the pointer, the same idea as matter's MouseConstraint).

const VENDOR = new URL('./assets/interactive/vendor/matter-0.20.0.min.js', import.meta.url).href;
const SHARED = new URL('../_shared/products/', import.meta.url).href;
export const ICONS = {
  'mcp-emails': SHARED + 'mcp-emails/icon.png',
  'fun-libs': SHARED + 'fun-libs/icon.png',
  toolrails: SHARED + 'toolrails/icon.svg',
  'albretsen.no': new URL('./assets/brand/favicon.svg', import.meta.url).href,
};

function loadMatter() {
  if (window.Matter) return Promise.resolve(window.Matter);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = VENDOR; s.onload = () => res(window.Matter); s.onerror = rej; document.head.appendChild(s); });
}

export function chipHTML(e) {
  const meta = e.ms ? `${e.ms} ms` : e.country || e.city || (e.sha ? `#${e.sha}` : '');
  return `<img src="${ICONS[e.product] || ICONS['albretsen.no']}" alt="" draggable="false"><span><span class="k">${e.label}${meta ? ' · ' + meta : ''}</span><br>${e.text}</span>`;
}

export async function mountPile({ hero, layer, origin, floorInset, max = 14, onLand, onStopReturn }) {
  const M = await loadMatter();
  const { Engine, Bodies, Body, Composite, Constraint, Events } = M;
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1; engine.gravity.scale = 0.0011;
  const world = engine.world;
  const items = []; // { el, body, w, h }
  let walls = [], W = 0, H = 0, running = true, visible = true, raf = 0, last = performance.now();

  function bounds() {
    W = hero.clientWidth; H = hero.clientHeight;
    const floorY = H - floorInset();
    if (walls.length) Composite.remove(world, walls);
    const t = 200;
    walls = [
      Bodies.rectangle(W / 2, floorY + t / 2, W * 3, t, { isStatic: true, friction: 0.9 }),
      Bodies.rectangle(-t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
      Bodies.rectangle(W + t / 2, H / 2 - H, t, H * 4, { isStatic: true }),
    ];
    Composite.add(world, walls);
    items.forEach(it => { if (it.body.position.y > floorY) Body.setPosition(it.body, { x: Math.min(W - it.w / 2, it.body.position.x), y: floorY - it.h }); });
  }
  bounds();

  function addBody(el, x, y, vel, opts = {}) {
    layer.appendChild(el);
    const w = el.offsetWidth, h = el.offsetHeight;
    const body = Bodies.rectangle(x, y, w, h, { chamfer: { radius: Math.min(9, h / 3) }, restitution: 0.22, friction: 0.55, frictionAir: 0.012, density: 0.0016, ...opts });
    Body.setInertia(body, body.inertia * 3); Body.setVelocity(body, vel); Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.03);
    Composite.add(world, body);
    const it = { el, body, w, h }; items.push(it); place(it); el._pileItem = it; return it;
  }
  function place(it) { const { x, y } = it.body.position; it.el.style.transform = `translate(${(x - it.w / 2).toFixed(1)}px, ${(y - it.h / 2).toFixed(1)}px) rotate(${it.body.angle.toFixed(4)}rad)`; }
  function drop(it) {
    const i = items.indexOf(it); if (i < 0) return; items.splice(i, 1);
    Composite.remove(world, it.body); it.el.classList.add('out'); setTimeout(() => it.el.remove(), 380);
  }
  function launch(el) {
    const o = origin(); const small = W < 700;
    // aim: pick a landing spot across the left part of the floor and solve a rough ballistic arc to it
    const vy = -(small ? 3 + Math.random() * 4 : 5 + Math.random() * 5);
    const g = engine.gravity.y * engine.gravity.scale * 16.667 * 16.667, fall = Math.max(40, H - floorInset() - o.y);
    const steps = (-vy + Math.sqrt(vy * vy + 2 * g * fall)) / g;
    const target = W * (small ? 0.08 + Math.random() * 0.8 : 0.04 + Math.random() * 0.56);
    const vx = (target - o.x) / (steps * 0.7);
    const it = addBody(el, o.x, o.y, { x: vx, y: vy });
    const flash = document.createElement('i'); flash.className = 'flash'; flash.style.left = o.x + 'px'; flash.style.top = o.y + 'px'; layer.appendChild(flash); setTimeout(() => flash.remove(), 800);
    const chips = items.filter(x => x.el.classList.contains('chip'));
    if (chips.length > max) drop(chips[0]);
    return it;
  }

  // landing ticks
  Events.on(engine, 'collisionStart', ev => {
    let best = 0; ev.pairs.forEach(p => { const s = Math.hypot(p.bodyA.velocity.x - p.bodyB.velocity.x, p.bodyA.velocity.y - p.bodyB.velocity.y); if (s > best) best = s; });
    if (best > 3 && onLand) onLand(best);
  });

  // grab and fling
  let grab = null;
  layer.addEventListener('pointerdown', e => {
    const el = e.target.closest('.chip, .loose'); if (!el || !el._pileItem) return;
    e.preventDefault(); const it = el._pileItem; const r = hero.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    Body.setStatic(it.body, false); M.Sleeping.set(it.body, false);
    const c = Constraint.create({ pointA: p, bodyB: it.body, pointB: { x: p.x - it.body.position.x, y: p.y - it.body.position.y }, stiffness: 0.18, damping: 0.08, length: 0 });
    Composite.add(world, c); grab = { c, el, id: e.pointerId }; el.classList.add('grab'); el.setPointerCapture(e.pointerId);
  });
  const move = e => { if (!grab || e.pointerId !== grab.id) return; const r = hero.getBoundingClientRect(); grab.c.pointA = { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const up = e => { if (!grab || e.pointerId !== grab.id) return; Composite.remove(world, grab.c); grab.el.classList.remove('grab'); grab = null; };
  layer.addEventListener('pointermove', move); layer.addEventListener('pointerup', up); layer.addEventListener('pointercancel', up);

  function frame(now) {
    const dt = Math.min(33, now - last); last = now;
    if (running && visible) { Engine.update(engine, Math.min(16.667, dt)); if (dt > 24) Engine.update(engine, Math.min(16.667, dt - 16.667)); items.forEach(place); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const ro = new ResizeObserver(bounds); ro.observe(hero);
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; last = performance.now(); }); io.observe(hero);

  return {
    push(event) {
      const el = document.createElement('div'); el.className = 'chip' + (event.kind === 'deploy' || event.kind === 'inbox.connected' || event.kind === 'install' ? ' hot' : '');
      el.innerHTML = chipHTML(event); return launch(el);
    },
    // the H1's full stop gets knocked loose and joins the pile, then flies home
    adopt(sourceEl, back = 7000) {
      const r = sourceEl.getBoundingClientRect(), hr = hero.getBoundingClientRect();
      const el = document.createElement('div'); el.className = 'loose';
      el.style.cssText = `position:absolute;left:0;top:0;width:${r.width}px;height:${r.height * 1.1}px;pointer-events:auto;cursor:grab;touch-action:none`;
      el.innerHTML = sourceEl.innerHTML;
      const it = addBody(el, r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2, { x: 3 + Math.random() * 3, y: -9 }, { restitution: 0.55, density: 0.004 });
      Body.setAngularVelocity(it.body, 0.25);
      setTimeout(() => { drop(it); onStopReturn && onStopReturn(); }, back);
      return it;
    },
    shake() { items.forEach(it => { M.Sleeping.set(it.body, false); Body.setVelocity(it.body, { x: (Math.random() - 0.5) * 14, y: -8 - Math.random() * 10 }); Body.setAngularVelocity(it.body, (Math.random() - 0.5) * 0.4); }); },
    pause() { running = false; }, play() { running = true; last = performance.now(); },
    get running() { return running; },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); Engine.clear(engine); layer.innerHTML = ''; },
  };
}
