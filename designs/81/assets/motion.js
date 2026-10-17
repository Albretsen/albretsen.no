/* Ground Glass — motion study (design 81)
 * ------------------------------------------------------------
 * Everything here runs on one hand-rolled spring integrator (no library).
 * Semi-implicit Euler at a fixed 240 Hz sub-step, driven by a single rAF
 * ticker that sleeps when every spring is at rest.
 *
 * Signature animations (each one is exported and named):
 *   1. rackFocus(el)      — "Rack Focus": text and images arrive out of focus and
 *                            are pulled sharp, like a focus puller on a cine lens.
 *                            Blur + a tiny scale "breathing" (real lenses change
 *                            framing slightly as focus moves).
 *   2. irisReveal(el)     — "Iris": an element is revealed through a 7-blade
 *                            aperture that opens on a slightly under-damped
 *                            spring, so the blades settle with one soft overshoot.
 *   3. paperLift(el)      — "Paper Lift": cards are cut paper. On hover the card
 *                            lifts off the page; the shadow grows and softens and
 *                            the card leans toward the pointer (spring-follow).
 *   4. shutter(el)        — "Shutter": a single exposure. A violet-white flash,
 *                            the frame dips and recovers; used on key Space.
 *   5. developSheet(el)   — "Develop": the shortcut cheat sheet slides up like a
 *                            print coming out of a tray, with springy stagger.
 *
 * References researched (see ASSETS.md for the full list):
 *   - motion.dev/examples: "Spring: Follow Cursor", "Scroll Zoom Hero",
 *     "Reveal text effect" — informed rackFocus + paperLift pacing.
 *   - Maxime Heckel, "The physics behind spring animations" — integrator.
 *   - paco.me — restraint: few moving things, each with intent.
 *   - Linear / GitHub "?" shortcut overlays — developSheet behaviour.
 * All of it respects prefers-reduced-motion (springs snap to target).
 */

export const reduced = typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- Spring */
const live = new Set();
let raf = 0, last = 0;
const STEP = 1 / 240;

function tick() {
  // performance.now() rather than the rAF timestamp: the frame timestamp can be
  // older than the moment a spring was woken, which would give a negative step.
  const now = performance.now();
  const dt = Math.min(0.064, Math.max(STEP, (now - last) / 1000));
  last = now;
  for (const s of live) s._advance(dt);
  raf = live.size ? requestAnimationFrame(tick) : 0;
}
function wake(s) {
  live.add(s);
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
}

export class Spring {
  /**
   * @param {number} value      initial value
   * @param {object} o          { stiffness, damping, mass, precision, onUpdate, onRest }
   */
  constructor(value = 0, o = {}) {
    this.value = value; this.target = value; this.velocity = 0;
    this.stiffness = o.stiffness ?? 170;
    this.damping = o.damping ?? 26;
    this.mass = o.mass ?? 1;
    this.precision = o.precision ?? 0.001;
    this.onUpdate = o.onUpdate || null;
    this.onRest = o.onRest || null;
    this._acc = 0;
  }
  /** Critical damping for the current stiffness and mass (no overshoot). */
  get critical() { return 2 * Math.sqrt(this.stiffness * this.mass); }
  set(target) {
    this.target = target;
    if (reduced) { this.jump(target); return this; }
    wake(this); return this;
  }
  jump(v) {
    this.value = this.target = v; this.velocity = 0;
    live.delete(this); this.onUpdate && this.onUpdate(v, this); return this;
  }
  impulse(v) { this.velocity += v; wake(this); return this; }
  _advance(dt) {
    this._acc += dt;
    while (this._acc >= STEP) {
      const f = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
      this.velocity += (f / this.mass) * STEP;     // velocity first (semi-implicit)
      this.value += this.velocity * STEP;          // then position with the new velocity
      this._acc -= STEP;
    }
    this.onUpdate && this.onUpdate(this.value, this);
    if (Math.abs(this.velocity) < this.precision && Math.abs(this.value - this.target) < this.precision) {
      this.value = this.target; this.velocity = 0; live.delete(this);
      this.onUpdate && this.onUpdate(this.value, this);
      this.onRest && this.onRest(this);
    }
  }
}

/** Named spring presets, tuned by eye against real lens hardware footage. */
export const presets = {
  focus:  { stiffness: 120, damping: 22 },  // a focus ring: weighty, no bounce
  iris:   { stiffness: 210, damping: 19 },  // one soft overshoot on the blades
  paper:  { stiffness: 320, damping: 24 },  // light card stock
  shutter:{ stiffness: 600, damping: 30 },  // fast, mechanical-free snap
  sheet:  { stiffness: 260, damping: 26 },
};

/* ------------------------------------------------------- 1. Rack Focus */
export function rackFocus(el, { delay = 0, from = 14 } = {}) {
  const s = new Spring(1, { ...presets.focus, onUpdate: v => {
    el.style.filter = v > 0.004 ? `blur(${(v * from).toFixed(2)}px)` : '';
    el.style.opacity = String(1 - v * 0.55);
    el.style.transform = `scale(${1 + v * 0.025})`;
  }});
  s.onUpdate(1, s);
  setTimeout(() => s.set(0), delay);
  return s;
}

/* Rack focus on scroll: everything that enters the viewport pulls focus. */
export function rackFocusOnView(selector = '[data-rack]') {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) {
      rackFocus(e.target, { delay: Number(e.target.dataset.rack || 0) });
      io.unobserve(e.target);
    }
  }), { threshold: 0.25 });
  document.querySelectorAll(selector).forEach(el => io.observe(el));
}

/* ------------------------------------------------------------- 2. Iris */
/** Builds a 7-blade iris SVG over `el` and opens it. Returns the spring
 *  (0 = closed, 1 = open) so callers can stop down / open up later. */
export function irisReveal(el, { blades = 7, open = 1, color = '#110c28', delay = 120 } = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-100 -100 200 200');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('gg-iris');
  const g = document.createElementNS(NS, 'g');
  svg.appendChild(g);
  const paths = [];
  for (let i = 0; i < blades; i++) {
    const p = document.createElementNS(NS, 'path');
    // each blade is a half-plane whose inner edge is gently curved; seven of
    // them leave a seven-sided opening with soft scalloped sides
    p.setAttribute('d', 'M 0 -320 Q -14 0 0 320 L 420 320 L 420 -320 Z');
    p.setAttribute('fill', color);
    p.setAttribute('stroke', 'rgba(187,182,239,.35)');
    p.setAttribute('stroke-width', '0.6');
    g.appendChild(p); paths.push(p);
  }
  el.style.position ||= 'relative';
  el.appendChild(svg);
  const step = 360 / blades;
  const s = new Spring(0, { ...presets.iris, onUpdate: v => {
    // v: 0 closed .. 1 open. Each blade rotates around its pivot and slides out.
    paths.forEach((p, i) => {
      const a = i * step;
      const twist = (1 - v) * 38;           // blades rotate as they retract
      const r = v * 150;                    // in-radius of the opening (150 = fully clear)
      p.setAttribute('transform', `rotate(${a + twist}) translate(${r} 0)`);
    });
    svg.style.opacity = v > 0.995 ? '0' : '1';
  }});
  s.onUpdate(0, s);
  setTimeout(() => s.set(open), delay);
  return s;
}

/* ------------------------------------------------------- 3. Paper Lift */
export function paperLift(el, { lift = 10, tilt = 4 } = {}) {
  const st = { h: 0, rx: 0, ry: 0 };
  const apply = () => {
    const h = st.h;
    el.style.transform = `translate3d(0, ${-h * lift}px, 0) rotateX(${st.rx}deg) rotateY(${st.ry}deg)`;
    el.style.boxShadow =
      `0 ${1 + h * 2}px ${2 + h * 3}px rgba(7,5,20,${0.35 - h * 0.1}),` +
      `0 ${4 + h * 22}px ${10 + h * 40}px rgba(7,5,20,${0.28 + h * 0.18})`;
  };
  const sh = new Spring(0, { ...presets.paper, onUpdate: v => { st.h = v; apply(); } });
  const sx = new Spring(0, { ...presets.paper, onUpdate: v => { st.rx = v; apply(); } });
  const sy = new Spring(0, { ...presets.paper, onUpdate: v => { st.ry = v; apply(); } });
  el.style.transformStyle = 'preserve-3d';
  el.addEventListener('pointerenter', () => sh.set(1));
  el.addEventListener('pointerleave', () => { sh.set(0); sx.set(0); sy.set(0); });
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    sx.set(-py * tilt); sy.set(px * tilt);
  });
  el.addEventListener('focus', () => sh.set(1));
  el.addEventListener('blur', () => sh.set(0));
  apply();
  return { sh, sx, sy };
}

/* ---------------------------------------------------------- 4. Shutter */
export function shutter(el) {
  let flash = el.querySelector(':scope > .gg-flash');
  if (!flash) {
    flash = document.createElement('div');
    flash.className = 'gg-flash';
    el.appendChild(flash);
  }
  const s = new Spring(1, { ...presets.shutter, onUpdate: v => {
    flash.style.opacity = String(Math.max(0, v) * 0.85);
    el.style.transform = `scale(${1 - Math.max(0, v) * 0.012})`;
  }});
  s.onUpdate(1, s); s.set(0);
  return s;
}

/* ---------------------------------------------------------- 5. Develop */
export function developSheet(sheet) {
  const rows = [...sheet.querySelectorAll('[data-row]')];
  const open = new Spring(0, { ...presets.sheet, onUpdate: v => {
    sheet.style.transform = `translate3d(0, ${(1 - v) * 110}%, 0) rotate(${(1 - v) * -2}deg)`;
    sheet.style.opacity = String(Math.min(1, v * 1.4));
    sheet.style.visibility = v < 0.01 ? 'hidden' : 'visible';
  }});
  const rowSprings = rows.map(r => new Spring(0, { ...presets.paper, onUpdate: v => {
    r.style.transform = `translate3d(0, ${(1 - v) * 14}px, 0)`;
    r.style.opacity = String(v);
  }}));
  open.onUpdate(0, open); rowSprings.forEach(s => s.onUpdate(0, s));
  let isOpen = false;
  const api = {
    get open() { return isOpen; },
    toggle(force) {
      isOpen = force ?? !isOpen;
      open.set(isOpen ? 1 : 0);
      sheet.setAttribute('aria-hidden', String(!isOpen));
      rowSprings.forEach((s, i) => setTimeout(() => s.set(isOpen ? 1 : 0), isOpen ? 60 + i * 35 : 0));
    },
  };
  return api;
}

/* ------------------------------------------------- Keyboard shortcuts */
/** bind({ '?': fn, 'f': fn, ... }) — ignores typing in inputs, supports Shift+/ for '?' */
export function bindKeys(map) {
  const handler = e => {
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const fn = map[k] || map[e.key];
    if (fn) { e.preventDefault(); fn(e); flashKey(k); }
  };
  addEventListener('keydown', handler);
  return () => removeEventListener('keydown', handler);
}

/** Lights the matching <kbd data-key="..."> on the cheat sheet. */
export function flashKey(k) {
  document.querySelectorAll(`kbd[data-key="${CSS.escape(k)}"]`).forEach(el => {
    el.classList.remove('is-hit'); void el.offsetWidth; el.classList.add('is-hit');
  });
}
