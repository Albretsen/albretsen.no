// Specimen Atlas — motion study for albretsen.no (design 40)
// Hand-rolled spring physics. No library. ES module, ~5 KB.
//
//   import { Spring, settle, loupe, specimenStack, daylight } from './assets/motion.js'
//
// Four named signatures:
//   1. SETTLE   (entrance)   — things arrive like a specimen laid on a tray.
//   2. LOUPE    (hover)      — cards tilt toward the cursor, a brass sheen follows.
//   3. SHUFFLE  (transition) — a draggable, flippable stack of specimen plates.
//   4. DAYLIGHT (delight)    — the page reads the sun over Oslo and re-lights itself.
//
// Research notes are in ASSETS.md (Emil Kowalski's animation tips, Maxime Heckel's
// spring physics, React Motion / Framer defaults, Framer swipe-stack components).

const reduce = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* Spring: damped harmonic oscillator, semi-implicit Euler, fixed step */
/* ------------------------------------------------------------------ */
export const PRESETS = {
  settle: { stiffness: 170, damping: 26, mass: 1 },   // React Motion's "gentle": calm, no overshoot to speak of
  loupe:  { stiffness: 320, damping: 24, mass: 1 },   // quick, tiny overshoot: feels precise
  flick:  { stiffness: 140, damping: 15, mass: 1 },   // playful: one visible wobble
  flip:   { stiffness: 210, damping: 20, mass: 1.1 }, // a card turning over has weight
  drift:  { stiffness: 40,  damping: 12, mass: 1 },   // slow follow for 3D rotation
};

export class Spring {
  constructor(value = 0, cfg = PRESETS.settle) {
    this.value = value; this.target = value; this.velocity = 0;
    Object.assign(this, { stiffness: 170, damping: 26, mass: 1, precision: 0.001 }, cfg);
  }
  set(target) { this.target = target; return this; }
  jump(value) { this.value = this.target = value; this.velocity = 0; return this; }
  /** advance by dt seconds; returns true while still moving */
  step(dt) {
    const h = 1 / 240; // fixed 240 Hz sub-steps: stable at any frame rate
    let t = Math.min(dt, 0.064);
    while (t > 0) {
      const s = Math.min(h, t);
      const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
      this.velocity += (force / this.mass) * s;
      this.value += this.velocity * s;
      t -= s;
    }
    const moving = Math.abs(this.velocity) > this.precision || Math.abs(this.value - this.target) > this.precision;
    if (!moving) { this.value = this.target; this.velocity = 0; }
    return moving;
  }
}

/** One shared rAF loop. Callbacks return true to keep running. */
const jobs = new Set();
let last = 0, raf = 0;
function tick(now) {
  const dt = last ? (now - last) / 1000 : 1 / 60; last = now;
  for (const fn of [...jobs]) if (!fn(dt)) jobs.delete(fn);
  raf = jobs.size ? requestAnimationFrame(tick) : (last = 0, 0);
}
export function loop(fn) { jobs.add(fn); if (!raf) raf = requestAnimationFrame(tick); return () => jobs.delete(fn); }

/* ------------------------------------------------------------------ */
/* 1. SETTLE — entrance                                                 */
/* ------------------------------------------------------------------ */
// From 18px below, scale .965 and 6px blur to rest. Never from scale(0)
// (Kowalski), blur hides the first frames. Staggered by DOM order.
export function settle(root = document, { selector = '[data-settle]', stagger = 70, cfg = PRESETS.settle } = {}) {
  const els = [...root.querySelectorAll(selector)];
  if (reduce()) { els.forEach(el => { el.style.opacity = 1; }); return; }
  els.forEach(el => { el.style.opacity = 0; el.style.willChange = 'transform, opacity, filter'; });
  const io = new IntersectionObserver(entries => {
    entries.filter(e => e.isIntersecting).forEach((e, i) => {
      io.unobserve(e.target);
      const el = e.target, s = new Spring(0, cfg); s.set(1);
      setTimeout(() => loop(dt => {
        const go = s.step(dt), p = s.value;
        el.style.opacity = Math.min(1, p * 1.4);
        el.style.transform = `translateY(${(1 - p) * 18}px) scale(${0.965 + 0.035 * p})`;
        el.style.filter = p < 0.98 ? `blur(${(1 - p) * 6}px)` : '';
        if (!go) el.style.willChange = '';
        return go;
      }), i * stagger);
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
}

/* ------------------------------------------------------------------ */
/* 2. LOUPE — hover                                                    */
/* ------------------------------------------------------------------ */
// Tilts toward the pointer (max 7deg), lifts 4px, and moves a brass sheen
// (--sheen-x/--sheen-y) under the cursor. Press scales to .97.
export function loupe(el, { max = 7, cfg = PRESETS.loupe } = {}) {
  const rx = new Spring(0, cfg), ry = new Spring(0, cfg), lift = new Spring(0, cfg), press = new Spring(1, cfg);
  let running = false;
  const run = () => { if (running) return; running = true; loop(dt => {
    const a = rx.step(dt), b = ry.step(dt), c = lift.step(dt), d = press.step(dt);
    el.style.transform = `perspective(900px) rotateX(${rx.value}deg) rotateY(${ry.value}deg) translateY(${-lift.value * 4}px) scale(${press.value})`;
    el.style.setProperty('--lift', lift.value.toFixed(3));
    return (running = a || b || c || d);
  }); };
  el.addEventListener('pointermove', e => {
    if (reduce() || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    rx.set((0.5 - y) * max); ry.set((x - 0.5) * max); lift.set(1);
    el.style.setProperty('--sheen-x', (x * 100).toFixed(1) + '%'); el.style.setProperty('--sheen-y', (y * 100).toFixed(1) + '%');
    run();
  });
  el.addEventListener('pointerleave', () => { rx.set(0); ry.set(0); lift.set(0); press.set(1); run(); });
  el.addEventListener('pointerdown', () => { press.set(0.97); run(); });
  el.addEventListener('pointerup', () => { press.set(1); run(); });
}

/* ------------------------------------------------------------------ */
/* 3. SHUFFLE — draggable, flippable specimen stack                    */
/* ------------------------------------------------------------------ */
// Markup: <div class="stack"><article class="plate"><div class="plate-front">..</div>
//          <div class="plate-back">..</div></article> ...</div>
// Drag the top plate. Release past 28% of its width, or flick faster than
// 650 px/s, and it springs to the back of the stack. Tap (no drag) flips it.
// Keyboard: Enter/Space flips, ArrowRight/Left sends to back / brings forward.
export function specimenStack(stack, { onChange } = {}) {
  const plates = [...stack.querySelectorAll('.plate')];
  const st = plates.map((el, i) => ({
    el, x: new Spring(0, PRESETS.flick), y: new Spring(0, PRESETS.flick), r: new Spring(0, PRESETS.flick),
    flip: new Spring(0, PRESETS.flip), depth: new Spring(i, PRESETS.settle),
  }));
  let order = st.map((_, i) => i); // order[0] is on top
  const seedTilt = i => [-2.2, 1.6, -0.8, 2.6, -1.4, 0.9][i % 6];

  const render = () => {
    st.forEach((s, i) => {
      const d = s.depth.value;
      const sc = 1 - Math.min(d, 4) * 0.03, dy = Math.min(d, 4) * 16;
      s.el.style.zIndex = String(100 - Math.round(d * 10));
      s.el.style.transform = `translate3d(${s.x.value}px, ${s.y.value + dy}px, 0) rotate(${s.r.value + seedTilt(i) * Math.min(d, 1)}deg) scale(${sc}) rotateY(${s.flip.value * 180}deg)`;
      s.el.style.setProperty('--depth', d.toFixed(2));
      s.el.setAttribute('aria-hidden', order[0] === i ? 'false' : 'true');
      s.el.tabIndex = order[0] === i ? 0 : -1;
    });
  };
  let active = false;
  const animate = () => { if (active) return; active = true; loop(dt => {
    let m = false; st.forEach(s => { m = s.x.step(dt) | s.y.step(dt) | s.r.step(dt) | s.flip.step(dt) | s.depth.step(dt) || m; });
    render(); return (active = m);
  }); };
  const restack = () => { order.forEach((idx, d) => st[idx].depth.set(d)); onChange && onChange(order[0]); animate(); };
  const sendBack = dir => {
    const top = st[order[0]];
    top.x.velocity += dir * 900; top.r.velocity += dir * 40;
    order.push(order.shift()); top.flip.set(0);
    top.x.set(0); top.y.set(0); top.r.set(0); restack();
  };
  const bringFront = () => { order.unshift(order.pop()); restack(); };

  let drag = null;
  stack.addEventListener('pointerdown', e => {
    const top = st[order[0]]; if (!top.el.contains(e.target)) return;
    top.el.setPointerCapture(e.pointerId);
    drag = { s: top, x0: e.clientX, y0: e.clientY, t: performance.now(), vx: 0, lx: e.clientX, moved: false };
  });
  stack.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0, now = performance.now();
    drag.vx = (e.clientX - drag.lx) / Math.max(1, now - drag.t) * 1000; drag.lx = e.clientX; drag.t = now;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    drag.s.x.jump(dx); drag.s.y.jump(dy * 0.6); drag.s.r.jump(dx * 0.05); render();
  });
  const end = () => {
    if (!drag) return; const { s, moved, vx } = drag; drag = null;
    const w = s.el.offsetWidth;
    if (!moved) { s.flip.set(s.flip.target ? 0 : 1); animate(); return; }
    if (Math.abs(s.x.value) > w * 0.28 || Math.abs(vx) > 650) { s.x.velocity = vx; sendBack(Math.sign(s.x.value || vx)); }
    else { s.x.set(0); s.y.set(0); s.r.set(0); animate(); }
  };
  stack.addEventListener('pointerup', end); stack.addEventListener('pointercancel', end);
  stack.addEventListener('keydown', e => {
    const top = st[order[0]];
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); top.flip.set(top.flip.target ? 0 : 1); animate(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); sendBack(1); st[order[0]].el.focus(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); bringFront(); st[order[0]].el.focus(); }
  });
  if (reduce()) PRESETS.flick.damping = 40;
  render(); restack();
  return { next: () => sendBack(1), prev: bringFront, flip: () => { const t = st[order[0]]; t.flip.set(t.flip.target ? 0 : 1); animate(); } };
}

/* ------------------------------------------------------------------ */
/* 4. DAYLIGHT — reacts to the time of day in Norway                    */
/* ------------------------------------------------------------------ */
// NOAA solar position for Oslo. Sets on <html>:
//   data-phase="dag|gulltime|blåtime|natt", --sun-elev (deg), --sun-t (0..1 daylight)
// and fills any [data-daylight] element with a short Norwegian/English caption.
export function sunOverNorway(date = new Date(), lat = 59.9139, lon = 10.7522) {
  const rad = Math.PI / 180;
  const doy = (date - Date.UTC(date.getUTCFullYear(), 0, 0)) / 864e5;
  const g = 2 * Math.PI / 365 * (doy - 1 + (date.getUTCHours() - 12) / 24);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const tst = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60 + eqt + 4 * lon;
  const ha = (tst / 4 - 180) * rad;
  const cosz = Math.sin(lat * rad) * Math.sin(decl) + Math.cos(lat * rad) * Math.cos(decl) * Math.cos(ha);
  const elevation = 90 - Math.acos(Math.max(-1, Math.min(1, cosz))) / rad;
  const phase = elevation > 12 ? 'dag' : elevation > 0 ? 'gulltime' : elevation > -8 ? 'blåtime' : 'natt';
  return { elevation, phase };
}
export const PHASE_CAPTION = {
  dag: 'Daylight in Oslo',
  gulltime: 'Golden hour in Oslo',
  'blåtime': 'Blue hour in Oslo',
  natt: 'Night in Oslo',
};
/** which baked hero matches the phase */
export const PHASE_HERO = { dag: 'day', gulltime: 'gold', 'blåtime': 'dusk', natt: 'dusk' };

export function daylight({ root = document.documentElement, date, every = 60000 } = {}) {
  const apply = () => {
    const now = date ? (typeof date === 'function' ? date() : date) : new Date();
    const { elevation, phase } = sunOverNorway(now);
    root.dataset.phase = phase;
    root.style.setProperty('--sun-elev', elevation.toFixed(1));
    root.style.setProperty('--sun-t', Math.max(0, Math.min(1, (elevation + 8) / 40)).toFixed(3));
    const t = new Intl.DateTimeFormat('nb-NO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' }).format(now);
    document.querySelectorAll('[data-daylight]').forEach(el => {
      el.textContent = `${PHASE_CAPTION[phase]} · ${t} · sun ${elevation >= 0 ? elevation.toFixed(1) + '° up' : Math.abs(elevation).toFixed(1) + '° below'}`;
    });
    root.dispatchEvent(new CustomEvent('daylight', { detail: { elevation, phase, hero: PHASE_HERO[phase] } }));
    return { elevation, phase };
  };
  const first = apply();
  if (every) setInterval(apply, every);
  return first;
}
