// AMBER HOUR — motion study runtime (design 67). No dependencies, ~2 KB.
//   import { initMotion } from './motion.js'; initMotion();
// Adds .is-in to .ah-expose / .ah-turn / .ah-shutters when they enter view,
// builds shutter slats, and drives .ah-longtake with rAF where CSS scroll
// timelines are unsupported (Safari < 26, Firefox).
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initMotion(root = document) {
  // shutters: build 12 slats
  root.querySelectorAll('.ah-shutters').forEach(el => {
    if (el.querySelector('.ah-shutters__slats')) return;
    const s = document.createElement('div'); s.className = 'ah-shutters__slats'; s.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 12; i++) { const k = document.createElement('i'); k.style.setProperty('--i', i); s.appendChild(k); }
    el.appendChild(s);
  });

  // reveal-on-view
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const go = () => el.classList.add('is-in');
    // an exposure waits for its image to decode, so the develop hides the pop
    const img = el.matches('img') ? el : el.querySelector('img');
    if (el.classList.contains('ah-expose') && img && !img.complete) img.addEventListener('load', go, { once: true }); else go();
    io.unobserve(el);
  }), { rootMargin: '0px 0px -12% 0px', threshold: .15 });
  root.querySelectorAll('.ah-expose,.ah-turn,.ah-shutters').forEach(el => reduce() ? el.classList.add('is-in') : io.observe(el));

  // horizon links: sun rises where the pointer enters
  root.querySelectorAll('.ah-link').forEach(a => a.addEventListener('pointerenter', e => {
    const r = a.getBoundingClientRect(); a.style.setProperty('--sun-x', `${((e.clientX - r.left) / r.width) * 100}%`);
  }));

  // long take fallback
  if (!CSS.supports('animation-timeline: view()') && !reduce()) {
    root.querySelectorAll('.ah-longtake').forEach(sec => {
      const plate = sec.querySelector('.ah-longtake__plate'), light = sec.querySelector('.ah-longtake__light');
      let cur = 0, target = 0, raf = 0;
      const measure = () => {
        const r = sec.getBoundingClientRect(), span = r.height - innerHeight;
        target = Math.min(1, Math.max(0, -r.top / span));
      };
      const tick = () => {
        cur += (target - cur) * .08;                 // ~1 s of smoothing: a camera on a rig
        const s = 1 + .42 * cur;
        plate.style.transform = `scale(${s}) translate3d(0,${-1.5 * cur}%,0)`;
        if (light) light.style.opacity = .15 + .6 * cur;
        raf = Math.abs(target - cur) > .0005 ? requestAnimationFrame(tick) : 0;
      };
      addEventListener('scroll', () => { measure(); if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
      measure(); tick();
    });
  }
}
