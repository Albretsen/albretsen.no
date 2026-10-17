// peel.js — drag a corner of any die-cut sticker to peel it off the page.
// Pure DOM: the sticker art is clipped along a moving fold line and its mirrored
// "back" (the flap) is drawn with the same die-cut mask, reflected across the fold.
//
//   import { peelable } from './motion/peel.js'
//   peelable(document.querySelector('.sticker'), { corner: 'tr', onPeel: (el) => {...} })
//
// Markup: <button class="sticker"><img src="stickers/mark@2x.webp" alt="..."></button>
// Whatever sits *behind* the sticker is what the peel reveals.

const CORNERS = { tl: [0, 0], tr: [1, 0], bl: [0, 1], br: [1, 1] };
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function clipHalf(poly, mx, my, nx, ny, keepPositive) {
  // Sutherland–Hodgman against the half-plane (p - m)·n >= 0 (or < 0)
  const s = (p) => ((p[0] - mx) * nx + (p[1] - my) * ny) * (keepPositive ? 1 : -1);
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const sa = s(a), sb = s(b);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) {
      const t = sa / (sa - sb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}
const poly2css = (p) => p.length ? `polygon(${p.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})` : 'polygon(0 0,0 0,0 0)';

export function peelable(el, opts = {}) {
  const { corner = 'tr', threshold = 0.5, back = 'linear-gradient(135deg,#ffffff,#e6def3 55%,#cfc2e8)', onPeel, hoverLift = 0.07 } = opts;
  const img = el.querySelector('img');
  if (!img) throw new Error('peelable: element needs an <img> with the die-cut sticker art');
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.style.touchAction = 'none';
  el.classList.add('peelable');
  const flapWrap = document.createElement('span');
  flapWrap.setAttribute('aria-hidden', 'true');
  flapWrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;filter:drop-shadow(-3px 5px 5px rgba(13,3,30,.45))';
  const flap = document.createElement('span');
  flap.style.cssText = `position:absolute;left:0;top:0;transform-origin:0 0;clip-path:polygon(0 0,0 0,0 0);background:${back};` +
    `-webkit-mask:url("${img.currentSrc || img.src}") 0 0/100% 100% no-repeat;mask:url("${img.currentSrc || img.src}") 0 0/100% 100% no-repeat`;
  flapWrap.appendChild(flap);
  el.appendChild(flapWrap);

  let W = 0, H = 0, C = [0, 0], P = [0, 0], target = null, raf = 0, dragging = false, done = false, vel = [0, 0];
  const measure = () => { const rest = P[0] === C[0] && P[1] === C[1]; W = img.offsetWidth; H = img.offsetHeight; const c = CORNERS[corner]; C = [c[0] * W, c[1] * H]; if (rest && !dragging && !done) P = C.slice(); flap.style.width = W + 'px'; flap.style.height = H + 'px'; };

  function draw() {
    const dx = P[0] - C[0], dy = P[1] - C[1], d = Math.hypot(dx, dy);
    if (d < 0.5) { img.style.clipPath = ''; flap.style.clipPath = 'polygon(0 0,0 0,0 0)'; return; }
    const nx = dx / d, ny = dy / d, mx = (C[0] + P[0]) / 2, my = (C[1] + P[1]) / 2;
    const rect = [[0, 0], [W, 0], [W, H], [0, H]];
    img.style.clipPath = poly2css(clipHalf(rect, mx, my, nx, ny, true));
    flap.style.clipPath = poly2css(clipHalf(rect, mx, my, nx, ny, false));
    // reflection across the fold line: p' = p - 2((p-m)·n)n
    const a = 1 - 2 * nx * nx, b = -2 * nx * ny, c2 = -2 * nx * ny, dd = 1 - 2 * ny * ny;
    const k = 2 * (mx * nx + my * ny);
    flap.style.transform = `matrix(${a},${b},${c2},${dd},${k * nx},${k * ny})`;
  }

  function animateTo(T, { stiffness = 0.16, damping = 0.72, then } = {}) {
    target = T; cancelAnimationFrame(raf);
    if (reduce()) { P = T.slice(); draw(); then && then(); return; }
    const step = () => {
      vel[0] = (vel[0] + (target[0] - P[0]) * stiffness) * damping;
      vel[1] = (vel[1] + (target[1] - P[1]) * stiffness) * damping;
      P[0] += vel[0]; P[1] += vel[1]; draw();
      if (Math.hypot(target[0] - P[0], target[1] - P[1]) + Math.hypot(...vel) > 0.4) raf = requestAnimationFrame(step);
      else { P = target.slice(); draw(); then && then(); }
    };
    raf = requestAnimationFrame(step);
  }

  const local = (e) => { const r = img.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
  const far = () => [W - C[0] + (C[0] ? -W * 0.6 : W * 0.6), H - C[1] + (C[1] ? -H * 0.6 : H * 0.6)];

  function finish() {
    done = true;
    animateTo(far(), { stiffness: 0.12, damping: 0.8, then: () => {
      el.classList.add('is-peeled');
      el.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${C[0] ? 40 : -40}px,-160px) rotate(${C[0] ? 24 : -24}deg)`, opacity: 0 }],
        { duration: reduce() ? 1 : 520, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' });
      onPeel && onPeel(el);
    } });
  }

  el.addEventListener('pointerenter', () => { if (!dragging && !done) { measure(); animateTo([C[0] + (W / 2 - C[0]) * hoverLift, C[1] + (H / 2 - C[1]) * hoverLift]); } });
  el.addEventListener('pointerleave', () => { if (!dragging && !done) animateTo(C.slice()); });
  el.addEventListener('pointerdown', (e) => {
    if (done) return; measure(); dragging = true; el.setPointerCapture(e.pointerId); cancelAnimationFrame(raf); el.classList.add('is-peeling');
  });
  el.addEventListener('pointermove', (e) => { if (!dragging) return; const L = local(e); P = [L[0], L[1]]; draw(); });
  const up = () => {
    if (!dragging) return; dragging = false; el.classList.remove('is-peeling');
    const frac = Math.hypot(P[0] - C[0], P[1] - C[1]) / Math.hypot(W, H);
    frac > threshold ? finish() : animateTo(C.slice());
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !done) { e.preventDefault(); measure(); finish(); } });
  if (!el.hasAttribute('tabindex') && el.tagName !== 'BUTTON') el.tabIndex = 0;

  img.complete ? measure() : img.addEventListener('load', measure, { once: true });
  addEventListener('resize', measure);
  return {
    peel: finish,
    reset() { done = false; el.classList.remove('is-peeled'); el.getAnimations().forEach((a) => a.cancel()); measure(); P = C.slice(); draw(); },
    peek(f = 0.25) { measure(); animateTo([C[0] + (W / 2 - C[0]) * f * 2, C[1] + (H / 2 - C[1]) * f * 2]); },
  };
}
