// Motion study for design 71 "Winter Pavilion". Pairs with motion.css.
// Each export is small, dependency-free and a no-op under prefers-reduced-motion.

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 1. LENS SHIFT: fallback driver for browsers without scroll-driven animations.
 *  Sets --lens (0..1) on .ms-lens while it scrolls out of view. */
export function lensShift(root) {
  if (reduce() || CSS.supports('animation-timeline: view()')) return () => {};
  let raf = 0;
  const tick = () => {
    raf = 0;
    const r = root.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    root.style.setProperty('--lens', p.toFixed(4));
  };
  const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', on, { passive: true }); tick();
  return () => removeEventListener('scroll', on);
}

/** 2. SIGN WARM-UP: split letters, then light them one by one with a tiny irregularity
 *  (like old transformers warming up), and finally add the glow. */
export function signWarmup(el, { delay = 300, glow = true } = {}) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.innerHTML = [...text].map((c, i) => `<span class="ch" aria-hidden="true" style="--i:${i};--jit:${(i * 37) % 5 * 18}ms">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  if (reduce()) { el.classList.add('is-on'); if (glow) el.classList.add('is-lit'); return; }
  setTimeout(() => el.classList.add('is-on'), delay);
  if (glow) setTimeout(() => el.classList.add('is-lit'), delay + text.length * 90 + 500);
}

/** 3. IRIS: run a theme change as a View Transition that opens from (x, y) in px. */
export function iris(apply, x = innerWidth * 0.8, y = innerHeight * 0.45) {
  const root = document.documentElement;
  root.style.setProperty('--iris-x', `${x}px`); root.style.setProperty('--iris-y', `${y}px`);
  if (reduce() || !document.startViewTransition) { apply(); return Promise.resolve(); }
  return document.startViewTransition(apply).finished;
}

/** 4. TRACKING SHOT: map vertical scroll through .ms-track to --track (0..1). */
export function trackingShot(section) {
  if (reduce()) return () => {};
  let raf = 0;
  const tick = () => {
    raf = 0;
    const r = section.getBoundingClientRect();
    const span = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, span)));
    section.style.setProperty('--track', p.toFixed(4));
  };
  const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); tick();
  return () => { removeEventListener('scroll', on); removeEventListener('resize', on); };
}

/** 5. SNOW HUSH: ~60 slow flakes on a canvas; pauses when off screen. */
export function snowfall(canvas, { count = 60 } = {}) {
  if (reduce()) return () => {};
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = 0, visible = true;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const flakes = Array.from({ length: count }, (_, i) => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, v: 0.00012 + Math.random() * 0.00025, p: Math.random() * 6.28 }));
  const size = () => { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(draw); });
  io.observe(canvas); size(); addEventListener('resize', size);
  let last = performance.now();
  function draw(now) {
    raf = 0; if (!visible) return;
    const dt = Math.min(64, now - last); last = now;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = 'rgba(251,247,242,.85)';
    for (const f of flakes) {
      f.y += f.v * dt * (0.6 + f.r * 0.4); f.p += dt * 0.0006;
      if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
      ctx.beginPath(); ctx.arc((f.x + Math.sin(f.p) * 0.01) * w, f.y * h, f.r, 0, 6.283); ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', size); };
}

/** Shared: reveal .ms-rise elements once as they enter. */
export function rise(selector = '.ms-rise') {
  const els = document.querySelectorAll(selector);
  if (reduce()) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  els.forEach(e => io.observe(e));
}
