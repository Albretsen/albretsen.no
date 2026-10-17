/* Specimen Drop — motion study.
 *
 * Everything here runs on one hand-rolled spring (no library). The model is the
 * damped harmonic oscillator a = (-k·x - c·v) / m, integrated with semi-implicit
 * Euler at a fixed 240 Hz sub-step so it stays stable on slow frames and is
 * fully interruptible: retarget a spring mid-flight and it keeps its velocity.
 * References: Maxime Heckel, "The physics behind spring animations"
 * (https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/);
 * wobble's closed-form notes on CASpringAnimation (https://github.com/skevy/wobble).
 *
 * Signature animations (named, so the builder can talk about them):
 *   1. settle()      ENTRANCE   "Specimen settle": items are dropped onto the page from
 *                               a few px above with a tilt and land with one soft bounce.
 *   2. loupe()       HOVER      "Loupe": a card leans toward the pointer and a circular
 *                               lens follows the cursor, revealing a detail layer.
 *   3. lapisWash()   TRANSITION "Lapis wash": the next view arrives as ultramarine ink
 *                               spreading from the click point, overshooting a hair.
 *   4. herbarium()   DELIGHT    "Herbarium shuffle": drag anything in a grid; the others
 *                               make room on springs (FLIP + springs), positions persist.
 *   5. drift()       AMBIENT    "Drift": stickers float with a slow, spring-filtered parallax.
 */

export const SPRINGS = {
  // stiffness, damping, mass — tuned by eye against the illustration weight
  settle: { stiffness: 210, damping: 17, mass: 1 }, // one visible bounce, ~600ms
  lift: { stiffness: 380, damping: 26, mass: 1 }, // pick-up / hover, snappy
  drift: { stiffness: 40, damping: 12, mass: 1.4 }, // ambient, heavy, no bounce
  wash: { stiffness: 120, damping: 15, mass: 1 }, // page wash, tiny overshoot
};

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Spring {
  constructor(value = 0, cfg = SPRINGS.settle) {
    this.value = value; this.target = value; this.velocity = 0;
    Object.assign(this, { stiffness: 170, damping: 18, mass: 1, precision: 0.0005 }, cfg);
  }
  set(target) { this.target = target; return this; }
  jump(value) { this.value = this.target = value; this.velocity = 0; return this; }
  impulse(v) { this.velocity += v; return this; }
  get done() { return Math.abs(this.velocity) < this.precision * 10 && Math.abs(this.target - this.value) < this.precision; }
  step(dt) {
    if (reduced()) { this.value = this.target; this.velocity = 0; return this.value; }
    const h = 1 / 240;
    let t = Math.min(dt, 0.064);
    while (t > 1e-6) {
      const s = Math.min(h, t);
      const f = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
      this.velocity += (f / this.mass) * s;
      this.value += this.velocity * s;
      t -= s;
    }
    if (this.done) { this.value = this.target; this.velocity = 0; }
    return this.value;
  }
}

/* One shared rAF loop. Callbacks return false to unsubscribe. */
const subs = new Set();
let last = 0, ticking = false;
function tick(now) {
  const dt = last ? (now - last) / 1000 : 1 / 60; last = now;
  for (const fn of [...subs]) if (fn(dt) === false) subs.delete(fn);
  if (subs.size) requestAnimationFrame(tick); else { ticking = false; last = 0; }
}
export function loop(fn) { subs.add(fn); if (!ticking) { ticking = true; requestAnimationFrame(tick); } return () => subs.delete(fn); }

/* 1 — Specimen settle (entrance). */
export function settle(els, { stagger = 70, from = -26, tilt = 4, cfg = SPRINGS.settle } = {}) {
  [...els].forEach((el, i) => {
    const y = new Spring(from, cfg), r = new Spring((i % 2 ? 1 : -1) * tilt, cfg), o = new Spring(0, SPRINGS.lift);
    el.style.opacity = 0;
    setTimeout(() => {
      y.set(0); r.set(0); o.set(1);
      loop((dt) => {
        el.style.transform = `translate3d(0,${y.step(dt).toFixed(2)}px,0) rotate(${r.step(dt).toFixed(3)}deg)`;
        el.style.opacity = Math.min(1, o.step(dt)).toFixed(3);
        if (y.done && r.done && o.done) { el.style.transform = ''; return false; }
      });
    }, i * stagger);
  });
}

/* 2 — Loupe (hover). Card needs a child [data-loupe] (the detail layer, absolutely positioned). */
export function loupe(card, { radius = 90, maxTilt = 7 } = {}) {
  const rx = new Spring(0, SPRINGS.lift), ry = new Spring(0, SPRINGS.lift), lift = new Spring(0, SPRINGS.lift);
  const lx = new Spring(0, SPRINGS.lift), ly = new Spring(0, SPRINGS.lift), lr = new Spring(0, SPRINGS.lift);
  const lens = card.querySelector('[data-loupe]');
  let running = false;
  const run = () => {
    if (running) return; running = true;
    loop((dt) => {
      card.style.transform = `perspective(900px) rotateX(${rx.step(dt).toFixed(2)}deg) rotateY(${ry.step(dt).toFixed(2)}deg) translateY(${(-lift.step(dt) * 6).toFixed(2)}px)`;
      if (lens) lens.style.clipPath = `circle(${Math.max(0, lr.step(dt)).toFixed(1)}px at ${lx.step(dt).toFixed(1)}px ${ly.step(dt).toFixed(1)}px)`;
      if (rx.done && ry.done && lift.done && lr.done && lx.done && ly.done) { running = false; return false; }
    });
  };
  card.addEventListener('pointermove', (e) => {
    const b = card.getBoundingClientRect();
    const px = (e.clientX - b.left) / b.width - 0.5, py = (e.clientY - b.top) / b.height - 0.5;
    ry.set(px * maxTilt * 2); rx.set(-py * maxTilt * 2); lift.set(1);
    lx.set(e.clientX - b.left); ly.set(e.clientY - b.top); lr.set(radius);
    run();
  });
  card.addEventListener('pointerleave', () => { rx.set(0); ry.set(0); lift.set(0); lr.set(0); run(); });
}

/* 3 — Lapis wash (transition). Returns a promise that resolves when the ink covers the view. */
export function lapisWash(x, y, { color = 'var(--lapis, #073fe3)', onCovered, reverse = true } = {}) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'lapis-wash';
    Object.assign(el.style, { position: 'fixed', inset: 0, background: color, zIndex: 9999, pointerEvents: 'none', clipPath: `circle(0px at ${x}px ${y}px)` });
    document.body.appendChild(el);
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 1.04;
    const r = new Spring(0, SPRINGS.wash).set(R);
    let phase = 0;
    loop((dt) => {
      const v = r.step(dt);
      el.style.clipPath = `circle(${Math.max(0, v).toFixed(1)}px at ${x}px ${y}px)`;
      if (phase === 0 && v >= R * 0.98) {
        phase = 1; onCovered?.(); resolve();
        if (!reverse) return false;
        // second half: the wash recedes the other way, from the screen edges inward
        Object.assign(r, SPRINGS.lift); r.set(0);
        x = innerWidth - x; y = innerHeight - y;
      }
      if (phase === 1 && r.done) { el.remove(); return false; }
    });
  });
}

/* 4 — Herbarium shuffle (drag to rearrange anything). Grid children become draggable.
 *     key: localStorage key to remember the order per viewer (wrapped in try/catch). */
export function herbarium(grid, { key, onChange } = {}) {
  const items = () => [...grid.children];
  try {
    const saved = key && JSON.parse(localStorage.getItem(key) || 'null');
    if (saved) saved.forEach((id) => { const el = grid.querySelector(`[data-id="${id}"]`); if (el) grid.appendChild(el); });
  } catch {}
  const state = new WeakMap();
  const S = (el) => { if (!state.has(el)) state.set(el, { x: new Spring(0, SPRINGS.settle), y: new Spring(0, SPRINGS.settle), s: new Spring(1, SPRINGS.lift), r: new Spring(0, SPRINGS.lift) }); return state.get(el); };
  const paint = (el) => { const s = S(el); el.style.transform = `translate3d(${s.x.value.toFixed(1)}px,${s.y.value.toFixed(1)}px,0) scale(${s.s.value.toFixed(3)}) rotate(${s.r.value.toFixed(2)}deg)`; };
  let anim = false;
  const animate = () => {
    if (anim) return; anim = true;
    loop((dt) => {
      let busy = false;
      for (const el of items()) {
        const s = S(el); if (el === drag?.el) { s.s.step(dt); s.r.step(dt); paint(el); busy = true; continue; }
        s.x.step(dt); s.y.step(dt); s.s.step(dt); s.r.step(dt); paint(el);
        if (!(s.x.done && s.y.done && s.s.done && s.r.done)) busy = true;
      }
      if (!busy) { anim = false; return false; }
    });
  };
  // FLIP: measure, mutate DOM, invert with springs
  const flip = (mutate) => {
    const before = new Map(items().map((el) => [el, el.getBoundingClientRect()]));
    mutate();
    for (const el of items()) {
      if (el === drag?.el) continue;
      const a = before.get(el), b = el.getBoundingClientRect(), s = S(el);
      s.x.jump(s.x.value + a.left - b.left).set(0); s.y.jump(s.y.value + a.top - b.top).set(0);
    }
    animate();
  };
  let drag = null;
  grid.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('[data-id]'); if (!el || el.parentNode !== grid) return;
    e.preventDefault(); el.setPointerCapture(e.pointerId);
    const b = el.getBoundingClientRect();
    drag = { el, ox: e.clientX, oy: e.clientY, bx: b.left, by: b.top };
    const s = S(el); s.s.set(1.06); s.r.set((Math.random() - 0.5) * 5); el.style.zIndex = 5; el.classList.add('is-lifted');
    animate();
  });
  grid.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { el } = drag, s = S(el);
    const b = el.getBoundingClientRect();
    // keep element under the pointer (layout may have moved since pick-up)
    const homeX = b.left - s.x.value, homeY = b.top - s.y.value;
    s.x.jump(drag.bx + (e.clientX - drag.ox) - homeX); s.y.jump(drag.by + (e.clientY - drag.oy) - homeY);
    paint(el);
    const over = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n !== el && n.parentNode === grid && n.dataset.id);
    if (over) {
      const list = items(), from = list.indexOf(el), to = list.indexOf(over);
      flip(() => grid.insertBefore(el, from < to ? over.nextSibling : over));
      const nb = el.getBoundingClientRect(), nhx = nb.left - s.x.value, nhy = nb.top - s.y.value;
      s.x.jump(drag.bx + (e.clientX - drag.ox) - nhx); s.y.jump(drag.by + (e.clientY - drag.oy) - nhy);
      paint(el);
    }
  });
  const drop = () => {
    if (!drag) return;
    const { el } = drag, s = S(el); drag = null;
    s.x.set(0); s.y.set(0); s.s.set(1); s.r.set(0); el.style.zIndex = ''; el.classList.remove('is-lifted');
    animate();
    const order = items().map((n) => n.dataset.id);
    try { key && localStorage.setItem(key, JSON.stringify(order)); } catch {}
    onChange?.(order);
  };
  grid.addEventListener('pointerup', drop); grid.addEventListener('pointercancel', drop);
}

/* 5 — Drift (ambient). Elements with data-depth follow the pointer with a heavy spring. */
export function drift(els, { range = 18 } = {}) {
  const list = [...els].map((el) => ({ el, d: parseFloat(el.dataset.depth || '1'), x: new Spring(0, SPRINGS.drift), y: new Spring(0, SPRINGS.drift) }));
  let running = false;
  addEventListener('pointermove', (e) => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    list.forEach((o) => { o.x.set(-nx * range * o.d); o.y.set(-ny * range * o.d); });
    if (running) return; running = true;
    loop((dt) => {
      let busy = false;
      list.forEach((o) => { o.el.style.translate = `${o.x.step(dt).toFixed(2)}px ${o.y.step(dt).toFixed(2)}px`; busy ||= !(o.x.done && o.y.done); });
      if (!busy) running = false;
      return busy;
    });
  });
}
