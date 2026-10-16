// Albretsen AS — design 45 "Drift" — motion study.
// Everything here runs on one hand-rolled spring (no animation library).
// Signature animations:
//   1. Surface   (entrance)   – elements rise through a waterline: blur, lift and a weightless overshoot.
//   2. Buoy      (hover)      – cards float toward the pointer, tilt like a pebble on water, then settle.
//   3. Chorus    (text)       – letters join one after another like voices, each on its own spring.
//   4. Tide turn (transition) – the theme switch: a wave line rises across the page (View Transitions +
//                               spring-generated keyframes) while the switch's pebble floats or sinks.
//   5. Gloss     (hover)      – a studio-light highlight slides across product renders (CSS, see motion.css).
// Import: import { Spring, surface, buoy, chorus, tideTurn, defineTideSwitch } from './motion.js'

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- the spring
// Damped harmonic oscillator, semi-implicit Euler at a fixed 240 Hz substep so it is frame-rate independent.
// Interruptible: retargeting keeps the current velocity, which is what makes it feel physical.
export const PRESETS = {
  weightless: { stiffness: 70, damping: 9, mass: 1 },   // slow, generous overshoot — drifting things
  buoy:       { stiffness: 210, damping: 16, mass: 1 }, // responsive, one soft bob — pointer follow
  tide:       { stiffness: 120, damping: 20, mass: 1 }, // almost critically damped — big surfaces
  settle:     { stiffness: 320, damping: 26, mass: 1 }, // quick, tiny overshoot — menus, popovers
};

export class Spring {
  constructor(value = 0, opts = PRESETS.weightless) {
    Object.assign(this, { stiffness: 170, damping: 26, mass: 1, precision: 0.0005 }, opts);
    this.value = value; this.target = value; this.velocity = 0;
    this._subs = new Set(); this._raf = 0; this._last = 0; this.done = Promise.resolve();
  }
  onChange(fn) { this._subs.add(fn); fn(this.value, this); return () => this._subs.delete(fn); }
  set(v) { this.value = this.target = v; this.velocity = 0; this._emit(); return this; }
  to(target, { velocity } = {}) {
    this.target = target; if (velocity !== undefined) this.velocity = velocity;
    if (reduce()) { this.set(target); return this.done; }
    if (!this._raf) { this._last = performance.now(); this._raf = requestAnimationFrame(this._tick); this.done = new Promise((r) => (this._resolve = r)); }
    return this.done;
  }
  step(dt) {
    const h = 1 / 240; let left = Math.min(dt, 0.064);
    while (left > 1e-6) {
      const s = Math.min(h, left);
      const a = (-this.stiffness * (this.value - this.target) - this.damping * this.velocity) / this.mass;
      this.velocity += a * s; this.value += this.velocity * s; left -= s;
    }
    const rest = Math.abs(this.value - this.target) < this.precision && Math.abs(this.velocity) < this.precision * 10;
    if (rest) { this.value = this.target; this.velocity = 0; }
    return rest;
  }
  _tick = (now) => {
    const rest = this.step((now - this._last) / 1000); this._last = now; this._emit();
    if (rest) { this._raf = 0; this._resolve?.(); } else this._raf = requestAnimationFrame(this._tick);
  };
  _emit() { this._subs.forEach((f) => f(this.value, this)); }
  /** Sample the spring 0→1 into keyframe values (for WAAPI / CSS linear()). */
  static sample(opts = PRESETS.weightless, n = 60) {
    const s = new Spring(0, opts); s.target = 1; const out = [0]; let t = 0;
    const trace = []; while (t < 4) { s.step(1 / 240); t += 1 / 240; trace.push(s.value); if (Math.abs(s.value - 1) < 0.001 && Math.abs(s.velocity) < 0.01 && t > 0.2) break; }
    for (let i = 1; i <= n; i++) out.push(trace[Math.min(trace.length - 1, Math.round((i / n) * (trace.length - 1)))]);
    out[n] = 1; return { values: out, duration: Math.round(trace.length / 240 * 1000) };
  }
}

// ---------------------------------------------------------------- 1. Surface (entrance)
// Usage: <div data-surface> … </div>; call surface() once. Children with data-surface-item stagger.
// Researched from: activetheory.net-style soft reveals (blur + lift), Radix data-state enter animations.
export function surface(root = document, { stagger = 70, distance = 28 } = {}) {
  const els = [...root.querySelectorAll('[data-surface]')];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue; io.unobserve(e.target);
      const items = e.target.querySelectorAll('[data-surface-item]');
      (items.length ? [...items] : [e.target]).forEach((el, i) => {
        const sp = new Spring(0, PRESETS.weightless);
        sp.onChange((v) => {
          el.style.opacity = Math.min(1, v * 1.4);
          el.style.transform = `translate3d(0, ${(1 - v) * distance}px, 0) scale(${0.985 + 0.015 * v})`;
          el.style.filter = v > 0.98 ? '' : `blur(${Math.max(0, (1 - v) * 10).toFixed(2)}px)`;
        });
        setTimeout(() => sp.to(1), i * stagger);
      });
    }
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => { const items = el.querySelectorAll('[data-surface-item]'); (items.length ? [...items] : [el]).forEach((x) => { x.style.opacity = 0; }); io.observe(el); });
  return () => io.disconnect();
}

// ---------------------------------------------------------------- 2. Buoy (hover)
// The element floats toward the pointer and tilts like a pebble on water; on leave it bobs back.
// Researched from: paco.me's restrained hover details, Rive community "weightless" cards.
export function buoy(el, { lift = 10, tilt = 7, follow = 6 } = {}) {
  const x = new Spring(0, PRESETS.buoy), y = new Spring(0, PRESETS.buoy), z = new Spring(0, PRESETS.weightless);
  const apply = () => {
    el.style.transform = `perspective(900px) translate3d(${x.value * follow}px, ${y.value * follow - z.value * lift}px, 0) rotateX(${-y.value * tilt}deg) rotateY(${x.value * tilt}deg)`;
    el.style.setProperty('--buoy-x', (x.value * 50 + 50).toFixed(1) + '%');
    el.style.setProperty('--buoy-y', (y.value * 50 + 50).toFixed(1) + '%');
  };
  [x, y, z].forEach((s) => s.onChange(apply));
  const move = (e) => { const r = el.getBoundingClientRect(); x.to(((e.clientX - r.left) / r.width) * 2 - 1); y.to(((e.clientY - r.top) / r.height) * 2 - 1); };
  const enter = () => z.to(1);
  const leave = () => { x.to(0); y.to(0); z.to(0, { velocity: -2 }); };
  el.addEventListener('pointermove', move); el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave);
  el.addEventListener('focus', enter); el.addEventListener('blur', leave);
  return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerenter', enter); el.removeEventListener('pointerleave', leave); };
}

// ---------------------------------------------------------------- 3. Chorus (text)
// Splits text into letters; each rises on its own spring with a small stagger, so the line "joins in".
export function chorus(el, { stagger = 28, distance = 0.55 } = {}) {
  const text = el.textContent; el.setAttribute('aria-label', text); el.textContent = '';
  const spans = [...text].map((ch) => { const s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); s.style.display = 'inline-block'; s.style.whiteSpace = 'pre'; s.style.opacity = 0; el.appendChild(s); return s; });
  const play = () => spans.forEach((s, i) => {
    const sp = new Spring(0, { ...PRESETS.weightless, stiffness: 90 + (i % 5) * 6 });
    sp.onChange((v) => { s.style.opacity = Math.min(1, v * 1.3); s.style.transform = `translateY(${((1 - v) * distance).toFixed(3)}em) rotate(${((1 - v) * (i % 2 ? 6 : -6)).toFixed(2)}deg)`; });
    setTimeout(() => sp.to(1), i * stagger);
  });
  return { play };
}

// ---------------------------------------------------------------- 4. Tide turn (theme transition)
// A wavefront rises from the switch across the whole page. The waterline height follows the spring,
// the wave crest keeps rolling while it rises. Uses the View Transitions API with WAAPI keyframes on
// ::view-transition-new(root); falls back to an instant swap with a soft fade.
export async function tideTurn(apply, { from = 'bottom' } = {}) {
  if (!document.startViewTransition || reduce()) { apply(); return; }
  const { values, duration } = Spring.sample(PRESETS.tide, 36);
  const vt = document.startViewTransition(apply);
  await vt.ready;
  const pts = 24; const frames = values.map((v, k) => {
    const level = 112 - v * 124; // % from top: starts below the page, ends above it
    const amp = 3.2 * Math.sin(Math.PI * Math.min(1, v)) + 0.4; const phase = k * 0.42;
    const crest = [];
    for (let i = 0; i <= pts; i++) { const x = (i / pts) * 100; const y = level + amp * Math.sin(i / pts * Math.PI * 3 + phase) + amp * 0.5 * Math.sin(i / pts * Math.PI * 7 - phase * 1.7); crest.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`); }
    const poly = from === 'bottom' ? `polygon(${crest.join(', ')}, 100% 100%, 0% 100%)` : `polygon(0% 0%, 100% 0%, ${crest.reverse().join(', ')})`;
    return { clipPath: poly };
  });
  document.documentElement.animate(frames, { duration: Math.max(1100, duration * 1.8), easing: 'linear', pseudoElement: '::view-transition-new(root)' });
  document.documentElement.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(.85) blur(1px)' }], { duration: Math.max(1100, duration * 1.8), easing: 'ease-in', pseudoElement: '::view-transition-old(root)' });
  return vt.finished;
}

// ---------------------------------------------------------------- the switch itself
// <tide-switch></tide-switch> — a small glass capsule with water in it and a glossy pebble.
// Day: the pebble floats at the surface. Night: it sinks and starts to glow; the water level rises.
// The pebble follows a weightless spring, so it bobs after landing. Dispatches "themechange" {theme}.
export function defineTideSwitch(tag = 'tide-switch') {
  if (customElements.get(tag)) return;
  customElements.define(tag, class extends HTMLElement {
    connectedCallback() {
      const theme = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.dataset.theme = theme;
      this.innerHTML = `<button type="button" class="tide-switch" role="switch" aria-checked="${theme === 'dark'}" aria-label="Night mode">
        <svg viewBox="0 0 64 32" width="64" height="32" aria-hidden="true">
          <defs><clipPath id="ts-cap"><rect x="1" y="1" width="62" height="30" rx="15"/></clipPath>
            <radialGradient id="ts-peb" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".45" class="ts-p1"/><stop offset="1" class="ts-p2"/></radialGradient></defs>
          <rect class="ts-glass" x="1" y="1" width="62" height="30" rx="15"/>
          <g clip-path="url(#ts-cap)"><path class="ts-water" d=""/><g class="ts-bubbles"></g></g>
          <ellipse class="ts-glow" cx="32" cy="16" rx="10" ry="8"/>
          <ellipse class="ts-pebble" cx="32" cy="16" rx="8.5" ry="6.4" fill="url(#ts-peb)"/>
          <rect class="ts-rim" x="1" y="1" width="62" height="30" rx="15"/>
        </svg></button>`;
      const btn = this.querySelector('button'), water = this.querySelector('.ts-water'), peb = this.querySelector('.ts-pebble'), glow = this.querySelector('.ts-glow');
      const lvl = new Spring(theme === 'dark' ? 1 : 0, PRESETS.weightless); const pos = new Spring(theme === 'dark' ? 1 : 0, PRESETS.weightless);
      let t0 = performance.now();
      const draw = () => {
        const t = (performance.now() - t0) / 1000; const L = 22 - lvl.value * 8; // water height
        let d = `M0 ${L}`; for (let x = 0; x <= 64; x += 4) d += ` L${x} ${(L + Math.sin(x / 7 + t * 2.2) * (1.1 + lvl.velocity * 0.6)).toFixed(2)}`; d += ' L64 32 L0 32 Z';
        water.setAttribute('d', d);
        const px = 16 + pos.value * 32; const py = (L - 4) + pos.value * 9 + Math.sin(t * 2 + 1) * 0.6; // floats at the line by day, sinks by night
        peb.setAttribute('cx', px.toFixed(2)); peb.setAttribute('cy', py.toFixed(2)); peb.setAttribute('transform', `rotate(${(pos.velocity * 9).toFixed(2)} ${px} ${py})`);
        glow.setAttribute('cx', px.toFixed(2)); glow.setAttribute('cy', py.toFixed(2)); glow.style.opacity = pos.value.toFixed(3);
        this._raf = requestAnimationFrame(draw);
      };
      draw();
      // keep several switches on one page in sync
      this._on = (e) => { if (e.target === this) return; const d = e.detail.theme === 'dark'; lvl.to(d ? 1 : 0); pos.to(d ? 1 : 0); btn.setAttribute('aria-checked', String(d)); };
      document.addEventListener('themechange', this._on);
      btn.addEventListener('click', async () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        btn.setAttribute('aria-checked', String(next === 'dark'));
        lvl.to(next === 'dark' ? 1 : 0); pos.to(next === 'dark' ? 1 : 0, { velocity: next === 'dark' ? 1.5 : -1.5 });
        this.dispatchEvent(new CustomEvent('themechange', { bubbles: true, detail: { theme: next } }));
        await tideTurn(() => { document.documentElement.dataset.theme = next; });
      });
    }
    disconnectedCallback() { cancelAnimationFrame(this._raf); document.removeEventListener('themechange', this._on); }
  });
}
