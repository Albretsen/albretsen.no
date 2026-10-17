// Heure Bleue motion helpers (design 64). No dependencies.
//   import { initMotion } from './motion.js'; initMotion();
// Wires: .hb-shutters (open on enter), .hb-settle (settle on enter),
// [data-lights] (sets data-hour="blue" when the section is mostly in view),
// .hb-haze (injects and drifts the heat-haze filter).

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initMotion(root = document) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add(e.target.classList.contains('hb-shutters') ? 'is-open' : 'is-in');
      io.unobserve(e.target);
    }
  }, { threshold: 0.25 });
  root.querySelectorAll('.hb-shutters, .hb-settle').forEach((el) => io.observe(el));

  const lights = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.dataset.hour = e.intersectionRatio > 0.55 ? 'blue' : 'day';
  }, { threshold: [0, 0.55, 1] });
  root.querySelectorAll('[data-lights]').forEach((el) => lights.observe(el));

  if (root.querySelector('.hb-haze')) haze();
}

// Heat haze: fractal noise stretched horizontally, displacing a few pixels.
// baseFrequency and the noise offset drift on a slow sine so it never loops visibly.
export function haze({ scale = 5, speed = 1 } = {}) {
  if (document.getElementById('hb-haze-filter')) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true'); svg.style.position = 'absolute';
  svg.innerHTML = `<filter id="hb-haze-filter" x="-2%" y="-10%" width="104%" height="120%">
      <feTurbulence id="hb-haze-noise" type="fractalNoise" baseFrequency="0.006 0.09" numOctaves="2" seed="64" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
  document.body.appendChild(svg);
  if (reduce()) return;
  const noise = svg.querySelector('#hb-haze-noise');
  let t = 0, last = performance.now();
  const tick = (now) => {
    t += ((now - last) / 1000) * speed; last = now;
    const fx = 0.006 + Math.sin(t * 0.21) * 0.0015;
    const fy = 0.09 + Math.sin(t * 0.37 + 1) * 0.02;
    noise.setAttribute('baseFrequency', `${fx.toFixed(5)} ${fy.toFixed(4)}`);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
