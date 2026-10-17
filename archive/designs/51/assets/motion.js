// Sodium Orbit — signature motion (design 51). Web Animations API only, no library.
//
//   strike(el)            ENTRANCE   "Sodium Strike"   neon flicker -> warm sodium -> settles to ink
//   ignite(el)            ENTRANCE   "Ignition Type"   per-character rise out of a molten blur
//   emberHover(el)        HOVER      "Ember Lift"      spring lift + additive pointer tilt + glow
//   orbitWipe(el, x, y)   TRANSITION "Orbit Wipe"      circular reveal from the spark's position
//   afterglow(el)         SCROLL     "Afterglow"       an image exposes like a long-exposure photo
//   countUp(el)           DETAIL     "Filament Count"  numbers tick up with a hot-to-cold colour
//
// Every function returns the Animation(s) it created and respects
// prefers-reduced-motion (it jumps to the final state instead).

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Spring sampled into a CSS linear() easing (approach from Jake Archibald and
// Adam Argyle's linear() easing generator, https://linear-easing-generator.netlify.app/).
export function springEasing({ stiffness = 170, damping = 14, mass = 1, duration = 1.1, samples = 40 } = {}) {
  const w0 = Math.sqrt(stiffness / mass);
  const z = damping / (2 * Math.sqrt(stiffness * mass));
  const wd = w0 * Math.sqrt(Math.max(1e-6, 1 - z * z));
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * duration;
    pts.push((1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t))).toFixed(3));
  }
  pts[samples] = '1';
  return `linear(${pts.join(', ')})`;
}
export const EASE = {
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  spring: springEasing(),
  settle: springEasing({ stiffness: 260, damping: 30, duration: 0.8, samples: 30 }),
};

const C = {
  neon: 'oklch(0.62 0.22 0)', sodium: 'oklch(0.76 0.165 60)', filament: 'oklch(0.92 0.09 88)',
  moon: 'oklch(0.97 0.008 250)', mist: 'oklch(0.86 0.04 250)',
};

// 1. SODIUM STRIKE — a low-pressure sodium lamp first glows neon pink-red from
// its starter gas, flickers, then warms to orange. Here a heading or label does
// the same in 1.6 s, then cools to its resting ink colour.
export function strike(el, { duration = 1600, rest = getComputedStyle(el).color, delay = 0 } = {}) {
  if (reduced()) return null;
  return el.animate([
    { opacity: 0, color: C.neon, textShadow: `0 0 0 transparent`, filter: 'blur(2px)' },
    { opacity: 1, color: C.neon, textShadow: `0 0 24px ${C.neon}`, filter: 'blur(0)', offset: 0.06 },
    { opacity: 0.25, offset: 0.1 },
    { opacity: 1, offset: 0.14 },
    { opacity: 0.5, offset: 0.2 },
    { opacity: 1, color: C.neon, textShadow: `0 0 28px ${C.neon}`, offset: 0.26 },
    { color: C.sodium, textShadow: `0 0 32px ${C.sodium}`, offset: 0.62 },
    { color: rest, textShadow: `0 0 0 transparent`, opacity: 1 },
  ], { duration, delay, easing: 'linear', fill: 'backwards' });
}

// 2. IGNITION TYPE — splits text into characters; each rises out of a blur and
// cools from filament-white to ink. Inspired by the blur-up title reveals on
// linear.app and the craft notes on rauno.me ("make it fast, make it carefully").
export function ignite(el, { stagger = 28, duration = 900, delay = 0 } = {}) {
  if (!el.dataset.ignited) {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    // characters are grouped per word so lines only break between words
    for (const word of text.split(/(\s+)/)) {
      if (!word) continue;
      if (/^\s+$/.test(word)) { el.append(document.createTextNode(word)); continue; }
      const w = document.createElement('span');
      w.style.display = 'inline-block'; w.style.whiteSpace = 'nowrap'; w.setAttribute('aria-hidden', 'true');
      for (const ch of word) {
        const s = document.createElement('span');
        s.textContent = ch; s.className = 'ch'; s.style.display = 'inline-block';
        w.append(s);
      }
      el.append(w);
    }
    el.dataset.ignited = '1';
  }
  if (reduced()) return [];
  const rest = getComputedStyle(el).color;
  return [...el.querySelectorAll('.ch')].map((s, i) => s.animate([
    { opacity: 0, transform: 'translateY(0.45em) scale(0.96)', filter: 'blur(10px)', color: C.filament },
    { opacity: 1, offset: 0.35, color: C.sodium },
    { opacity: 1, transform: 'none', filter: 'blur(0)', color: rest },
  ], { duration, delay: delay + i * stagger, easing: EASE.outExpo, fill: 'backwards' }));
}

// 3. EMBER LIFT — hover. A spring lift on `translate` plus an independent tilt
// that follows the pointer, stacked with composite: 'add' so both can run at
// once without fighting (see css-tricks.com/additive-animation-web-animations-api).
export function emberHover(el, { lift = 6, tilt = 5 } = {}) {
  let liftAnim = null, tiltAnim = null;
  const enter = () => {
    if (reduced()) return;
    liftAnim?.cancel();
    liftAnim = el.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-lift}px)` }],
      { duration: 700, easing: EASE.spring, fill: 'forwards' });
    el.animate([{ boxShadow: '0 0 0 0 transparent' }, { boxShadow: `0 18px 60px -20px ${C.sodium}` }],
      { duration: 500, easing: EASE.outExpo, fill: 'forwards' });
  };
  const move = (e) => {
    if (reduced()) return;
    const r = el.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -tilt;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * tilt;
    tiltAnim?.cancel();
    tiltAnim = el.animate([{ transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)` }],
      { duration: 260, easing: EASE.outExpo, fill: 'forwards', composite: 'add' });
  };
  const leave = () => {
    liftAnim?.cancel(); tiltAnim?.cancel();
    el.animate([{ transform: `translateY(${-lift}px)` }, { transform: 'translateY(0)' }], { duration: 600, easing: EASE.settle });
    el.animate([{ boxShadow: `0 18px 60px -20px ${C.sodium}` }, { boxShadow: '0 0 0 0 transparent' }], { duration: 400, fill: 'forwards' });
  };
  el.addEventListener('pointerenter', enter);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => { el.removeEventListener('pointerenter', enter); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
}

// 4. ORBIT WIPE — transition. The next panel is revealed by a circle that grows
// from the spark's last position, with a thin sodium ring riding the edge. Same
// idea as the circular View Transition reveals in Chrome's demos, done with WAAPI
// so it works on any element.
export function orbitWipe(el, x, y, { duration = 820 } = {}) {
  const r = el.getBoundingClientRect();
  const cx = x ?? r.width / 2, cy = y ?? r.height / 2;
  const radius = Math.hypot(Math.max(cx, r.width - cx), Math.max(cy, r.height - cy));
  if (reduced()) { el.style.clipPath = 'none'; return null; }
  const ring = document.createElement('div');
  Object.assign(ring.style, {
    position: 'absolute', left: `${cx}px`, top: `${cy}px`, width: '0', height: '0', borderRadius: '50%',
    boxShadow: `0 0 0 1.5px ${C.sodium}, 0 0 40px 6px ${C.sodium}`, pointerEvents: 'none', translate: '-50% -50%', zIndex: 5,
  });
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.append(ring);
  ring.animate([{ width: '0px', height: '0px', opacity: 1 }, { width: `${radius * 2}px`, height: `${radius * 2}px`, opacity: 0 }],
    { duration, easing: EASE.outExpo }).finished.then(() => ring.remove());
  return el.animate([
    { clipPath: `circle(0px at ${cx}px ${cy}px)` },
    { clipPath: `circle(${radius}px at ${cx}px ${cy}px)` },
  ], { duration, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' });
}

// 5. AFTERGLOW — scroll-triggered. Night photographs from the ISS are long
// exposures; this reveal starts overexposed and desaturated, then settles.
export function afterglow(el, { duration = 1400 } = {}) {
  if (reduced()) return null;
  const run = () => el.animate([
    { opacity: 0, filter: 'brightness(2.6) saturate(0) blur(6px)', transform: 'scale(1.04)' },
    { opacity: 1, filter: 'brightness(1.4) saturate(0.6) blur(1px)', offset: 0.35 },
    { opacity: 1, filter: 'brightness(1) saturate(1) blur(0)', transform: 'scale(1)' },
  ], { duration, easing: EASE.outExpo, fill: 'backwards' });
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { run(); io.disconnect(); }
  }, { threshold: 0.2 });
  io.observe(el);
  return io;
}

// 6. FILAMENT COUNT — a figure counts up while cooling from filament to ink.
// Only use with real figures from content.js.
export function countUp(el, { duration = 1400 } = {}) {
  const raw = el.textContent.trim();
  const m = raw.match(/[\d,]+/);
  if (!m || reduced()) return null;
  const target = +m[0].replace(/,/g, '');
  const fmt = (n) => raw.replace(m[0], m[0].includes(',') ? n.toLocaleString('en-US') : String(n));
  const start = performance.now();
  const tick = (t) => {
    const p = Math.max(0, Math.min(1, (t - start) / duration)), e = 1 - Math.pow(1 - p, 4);
    el.textContent = fmt(Math.round(target * e));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return el.animate([{ color: C.filament, textShadow: `0 0 20px ${C.sodium}` }, { color: getComputedStyle(el).color, textShadow: '0 0 0 transparent' }],
    { duration: duration * 1.2, easing: 'ease-out' });
}
