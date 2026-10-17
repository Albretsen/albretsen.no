// Motion study helpers for motion.css. No dependencies.
//   dayPass(el, onDay)   scroll fallback for DAY PASS: sets --day on el (0..1) and
//                        calls onDay(day, sunAltitude) so the diorama can follow.
//   signLightUp(el)      splits text into letters and lights them when visible.
//   boulevardOn(svgEl)   ignites .lamp-glow elements far-to-near when visible.
//   dayToAltitude(d)     maps the day (0 dawn .. .5 noon .. .8 afterglow .. 1 night) to a sun altitude.
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function dayToAltitude(d) {
  // dawn -4 -> noon 45 -> golden 4 -> afterglow -1.5 -> night -14
  const k = [[0, -4], [0.12, 6], [0.5, 45], [0.7, 4], [0.8, -1.5], [0.9, -7], [1, -14]];
  for (let i = 0; i < k.length - 1; i++) if (d <= k[i + 1][0]) { const t = (d - k[i][0]) / (k[i + 1][0] - k[i][0]); return k[i][1] + (k[i + 1][1] - k[i][1]) * t; }
  return -14;
}

export function dayPass(el = document.documentElement, onDay) {
  let raf = 0;
  const update = () => { raf = 0; const max = document.documentElement.scrollHeight - innerHeight; const d = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0.8;
    if (!CSS.supports('animation-timeline: scroll()')) el.style.setProperty('--day', d.toFixed(4)); onDay?.(d, dayToAltitude(d)); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true }); update();
}

const whenVisible = (el, fn) => { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(); io.disconnect(); } }), { threshold: 0.4 }); io.observe(el); };

export function signLightUp(el, { auto = true } = {}) {
  const text = el.textContent; el.setAttribute('aria-label', text); el.textContent = '';
  [...text].forEach((c, i) => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true'); s.textContent = c === ' ' ? ' ' : c; el.appendChild(s); });
  const light = () => el.classList.add('is-lit'); if (reduce()) return light(); if (auto) whenVisible(el, light);
  return { light, reset() { el.classList.remove('is-lit'); void el.offsetWidth; } };
}

export function boulevardOn(svg, { auto = true } = {}) {
  const glows = [...svg.querySelectorAll('.lamp-glow')]; glows.forEach((g, i) => g.style.setProperty('--i', i));
  const on = () => svg.classList.add('is-on'); if (reduce()) return on(); if (auto) whenVisible(svg, on);
  return { on, reset() { svg.classList.remove('is-on'); void svg.getBoundingClientRect(); } };
}
