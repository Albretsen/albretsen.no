// Front Light: motion helpers (design 75). ~1.5 KB, no dependencies.
//   import { initMotion } from './assets/motion.js'; initMotion();
// - HEAT HAZE: injects an SVG filter #fl-haze and drifts its turbulence (scrolls the noise
//   field upward by animating the seed-free baseFrequency very slightly and the displacement
//   scale; cheap, CPU-side). Apply with class .fl-haze. For the hero use interactive/haze.js.
// - POSTMARK: adds .is-in to .fl-postmark when it enters the viewport (once).
// - LONG SHADOWS: writes --sun (0..1) on <html> from scroll progress, unless the browser can
//   do it natively with animation-timeline (then it adds html.fl-scroll-native and stays idle).

export function initMotion({ haze = true } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // POSTMARK
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.4 });
  document.querySelectorAll('.fl-postmark').forEach(el => io.observe(el));

  // LONG SHADOWS
  if (CSS.supports('animation-timeline: scroll()')) root.classList.add('fl-scroll-native');
  else {
    let ticking = false;
    const set = () => {
      const max = root.scrollHeight - innerHeight;
      root.style.setProperty('--sun', max > 0 ? Math.min(1, scrollY / max).toFixed(3) : 0);
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(set); } }, { passive: true });
    set();
  }

  // HEAT HAZE (SVG)
  if (haze && !document.getElementById('fl-haze')) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.innerHTML = `<filter id="fl-haze" x="-2%" y="-2%" width="104%" height="104%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.045" numOctaves="2" seed="7" result="n"/>
      <feOffset in="n" dy="0" result="m"/>
      <feDisplacementMap in="SourceGraphic" in2="m" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
    document.body.prepend(svg);
    if (!reduce) {
      const off = svg.querySelector('feOffset'), dm = svg.querySelector('feDisplacementMap');
      const t0 = performance.now();
      const loop = now => {
        const t = (now - t0) / 1000;
        off.setAttribute('dy', (-(t * 14) % 400).toFixed(1));      // the air rises
        dm.setAttribute('scale', (4.5 + Math.sin(t * .7) * 1.5).toFixed(2)); // and wavers
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }
}
