// Motion study, design 46 "Say Cheese". Web Animations API only (element.animate), no libraries.
// Every move borrows from the camera: the iris opens, focus racks, the shutter flashes, and the clay squishes.
//
//   import * as M from './motion.js'
//   M.irisOpen(el)            entrance: six-blade aperture opens on an element (hero image, cards)
//   M.squish(el)              hover/press: clay squash-and-stretch on a baked spring curve ("boop")
//   M.rackFocus(el)           transition / reveal: blurred + over-exposed -> sharp, like pulling focus
//   M.shutterFlash()          click: white flash over the page + sprinkle burst from the pointer
//   M.stickerSlap(el)         entrance for stickers: slapped down from above with overshoot
//   M.autoWire(root)          wires [data-m="iris|squish|focus|slap"] with IntersectionObserver
//
// Reduced motion: every function degrades to a short opacity fade (or nothing).

export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- spring -> CSS linear() easing. Damped harmonic oscillator sampled into N points.
//     Research: motion.dev "how to use your favourite GSAP easings with WAAPI"; ics.media "Using CSS linear() for spring animations".
export function springEasing({ stiffness = 170, damping = 12, mass = 1, points = 48 } = {}) {
  const w0 = Math.sqrt(stiffness / mass), zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const wd = w0 * Math.sqrt(Math.max(1 - zeta * zeta, 1e-6));
  const x = t => zeta < 1
    ? 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t))
    : 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  // duration: until the oscillation settles within 0.1%
  let T = 0; for (let t = 0; t < 10; t += 0.01) { if (Math.abs(1 - x(t)) > 0.001) T = t; }
  T = Math.max(T, 0.2);
  const pts = Array.from({ length: points + 1 }, (_, i) => +x((i / points) * T).toFixed(4));
  pts[points] = 1;
  return { easing: `linear(${pts.join(', ')})`, duration: Math.round(T * 1000) };
}
export const SPRING_BOUNCY = springEasing({ stiffness: 260, damping: 11 });
export const SPRING_SOFT = springEasing({ stiffness: 140, damping: 16 });

// --- 1. Iris Open: clip-path hexagon that rotates as it opens (a real aperture turns its blades)
const hexagon = (r, rot) => 'polygon(' + Array.from({ length: 6 }, (_, i) => {
  const a = rot + i * Math.PI / 3; return `${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`;
}).join(', ') + ')';
export function irisOpen(el, { duration = 1100, delay = 0 } = {}) {
  if (reduced()) return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay, fill: 'both' });
  const frames = Array.from({ length: 13 }, (_, i) => {
    const p = i / 12; const e = 1 - Math.pow(1 - p, 3);          // ease-out cubic baked into the path
    return { clipPath: hexagon(e * 78, -0.9 * (1 - e)), filter: `brightness(${1 + (1 - e) * 0.6})` };
  });
  frames[12].clipPath = hexagon(110, 0); // fully open, beyond corners
  return el.animate(frames, { duration, delay, fill: 'both', easing: 'linear' });
}

// --- 2. Squish: squash-and-stretch on enter, rebounds on a spring (Josh Comeau's "boop", clay edition)
export function squish(el, { amount = 1 } = {}) {
  if (reduced()) return null;
  const a = amount;
  return el.animate([
    { transform: 'scale(1,1)' },
    { transform: `scale(${1 + 0.14 * a}, ${1 - 0.16 * a}) translateY(${4 * a}%)`, offset: 0.18 },
    { transform: `scale(${1 - 0.06 * a}, ${1 + 0.1 * a}) translateY(${-6 * a}%)`, offset: 0.45 },
    { transform: 'scale(1,1)' },
  ], { duration: SPRING_BOUNCY.duration * 0.9 + 200, easing: 'ease-out', composite: 'add' });
}

// --- 3. Rack Focus: from soft and over-exposed to crisp, with a tiny breathing zoom
export function rackFocus(el, { duration = 900, delay = 0, from = 16 } = {}) {
  if (reduced()) return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay, fill: 'both' });
  return el.animate([
    { filter: `blur(${from}px) brightness(1.5) saturate(1.3)`, transform: 'scale(1.06)', opacity: 0 },
    { filter: `blur(${from * 0.25}px) brightness(1.15) saturate(1.1)`, transform: 'scale(0.995)', opacity: 1, offset: 0.55 },
    { filter: 'blur(3px) brightness(1.05)', transform: 'scale(1.004)', offset: 0.75 },   // focus hunts once
    { filter: 'blur(0px) brightness(1)', transform: 'scale(1)', opacity: 1 },
  ], { duration, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
}

// --- 4. Shutter Flash: page-wide flash + candy sprinkles bursting from the click point
const CANDY = ['#FF99C2', '#8DEFC5', '#FFE97E', '#B6ADF3', '#FC9E47', '#93D5F5', '#ED3F4B'];
export function shutterFlash({ x = innerWidth / 2, y = innerHeight / 2, sprinkles = 18 } = {}) {
  const layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.appendChild(layer);
  const flash = document.createElement('div');
  flash.style.cssText = 'position:absolute;inset:0;background:#FFFDF7';
  layer.appendChild(flash);
  const anims = [flash.animate([{ opacity: reduced() ? 0.35 : 0.92 }, { opacity: 0 }], { duration: reduced() ? 200 : 420, easing: 'cubic-bezier(.1,.6,.3,1)', fill: 'forwards' })];
  if (!reduced()) for (let i = 0; i < sprinkles; i++) {
    const s = document.createElement('i');
    const w = 10 + Math.random() * 18, round = Math.random() < 0.35;
    s.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${round ? 12 : w}px;height:${round ? 12 : 8}px;border-radius:99px;background:${CANDY[i % CANDY.length]};box-shadow:inset 0 2px 0 #fff8, 0 2px 4px #6d3f2f33`;
    layer.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 200, r0 = Math.random() * 360;
    anims.push(s.animate([
      { transform: `translate(-50%,-50%) rotate(${r0}deg) scale(.4)` },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d - 40}px)) rotate(${r0 + 220}deg) scale(1)`, offset: 0.55 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d * 1.15}px), calc(-50% + ${Math.sin(a) * d + 160}px)) rotate(${r0 + 320}deg) scale(.9)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.15,.7,.4,1)', fill: 'forwards' }));
  }
  Promise.all(anims.map(a => a.finished)).then(() => layer.remove());
  return anims;
}

// --- 5. Sticker Slap: dropped from above, lands with overshoot, shadow tightens on impact
export function stickerSlap(el, { delay = 0, rotate = -6 } = {}) {
  if (reduced()) return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay, fill: 'both' });
  return el.animate([
    { transform: `translateY(-40px) scale(1.5) rotate(${rotate - 14}deg)`, filter: 'drop-shadow(0 40px 30px rgba(109,63,47,.0))', opacity: 0 },
    { transform: `translateY(0) scale(.94) rotate(${rotate + 2}deg)`, filter: 'drop-shadow(0 4px 4px rgba(109,63,47,.35))', opacity: 1, offset: 0.55 },
    { transform: `translateY(0) scale(1.03) rotate(${rotate}deg)`, offset: 0.78 },
    { transform: `translateY(0) scale(1) rotate(${rotate}deg)`, filter: 'drop-shadow(0 8px 10px rgba(109,63,47,.25))', opacity: 1 },
  ], { duration: 650, delay, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'both' });
}

// --- autowire: declarative usage via data attributes
export function autoWire(root = document) {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue; io.unobserve(e.target);
      const k = e.target.dataset.m, d = +(e.target.dataset.delay || 0);
      if (k === 'iris') irisOpen(e.target, { delay: d });
      if (k === 'focus') rackFocus(e.target, { delay: d });
      if (k === 'slap') stickerSlap(e.target, { delay: d, rotate: +(e.target.dataset.rot || -6) });
    }
  }, { threshold: 0.25 });
  root.querySelectorAll('[data-m="iris"],[data-m="focus"],[data-m="slap"]').forEach(el => io.observe(el));
  root.querySelectorAll('[data-m="squish"]').forEach(el => {
    el.addEventListener('pointerenter', () => squish(el));
    el.addEventListener('pointerdown', () => squish(el, { amount: 1.4 }));
  });
  return io;
}
