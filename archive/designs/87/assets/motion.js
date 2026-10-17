// Totality — motion study (Web Animations API only, no libraries).
// Five named signatures. Each returns an Animation or a Promise and is a no-op
// (jumps to the end state) under prefers-reduced-motion.
//
// 1. totality(stage)   The cinematic intro. A hairline aperture ring is traced, the
//                      diamond-ring bead ignites, the plate develops (brightest light
//                      first, via the corona shader or a CSS fallback), the name settles
//                      out of a fracture, and the page chrome arrives last.
//                      Researched from: apple.com/macbook-pro (hero start-frame -> end-frame
//                      resolve; the product is the protagonist, the copy waits), and
//                      awwwards "intro" collections (Pura Pharma WebGL intro section).
// 2. develop(img)      Plate develop. Images arrive the way a print appears in the tray:
//                      highlights first, shadows last (filter brightness/contrast ramp),
//                      with a 1.5% scale settle. Used for every plate as it enters view.
// 3. fracture(el)      Prism settle for headlines. Letters arrive split into the duotone
//                      ramp (glow + paper offset copies via text-shadow) and converge to
//                      a single ink. Staggered 18 ms per glyph, centre-out.
//                      Researched from chromatic-aberration headline reveals on godly.website
//                      entries, done here with two inks instead of RGB.
// 4. iris(el, origin)  Aperture transition between scenes: clip-path circle opens from a
//                      point (the click, or the eclipse disc) to cover the viewport.
//                      Researched from Emil Kowalski's clip-path reveal notes (compositor-only).
// 5. rakingLight(card) A slow sheen of corona light rakes across a plate on hover, like
//                      tilting a lithograph under a lamp. Pointer-positioned.

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const EASE = {
  exposure: 'cubic-bezier(.16, 1, .3, 1)',      // long, settling exposure (expo-out-ish)
  shutter: 'cubic-bezier(.7, 0, .2, 1)',        // decisive in-out
  drift: 'cubic-bezier(.33, 0, .2, 1)',
};
const GLOW = '#ca6fd3', PAPER = '#fdf8fd';

// ---------------------------------------------------------------- 2. develop
export function develop(img, { delay = 0, duration = 1600 } = {}) {
  if (reduce()) return null;
  return img.animate([
    { filter: 'brightness(.15) contrast(3.2) saturate(0)', transform: 'scale(1.015)', opacity: 0 },
    { filter: 'brightness(.55) contrast(2) saturate(.4)', opacity: 1, offset: .35 },
    { filter: 'brightness(1) contrast(1) saturate(1)', transform: 'scale(1)', opacity: 1 },
  ], { duration, delay, easing: EASE.exposure, fill: 'both' });
}

// ---------------------------------------------------------------- 3. fracture
export function splitGlyphs(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.g')];
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const out = [];
  for (const ch of text) {
    const s = document.createElement('span');
    s.className = 'g'; s.setAttribute('aria-hidden', 'true');
    s.style.display = 'inline-block'; s.style.whiteSpace = 'pre';
    s.textContent = ch; el.appendChild(s); out.push(s);
  }
  el.dataset.split = '1';
  return out;
}
export function fracture(el, { delay = 0, spread = 0.09 } = {}) {
  const gs = splitGlyphs(el);
  if (reduce()) return Promise.resolve();
  const mid = (gs.length - 1) / 2;
  return Promise.all(gs.map((g, i) => {
    const d = Math.abs(i - mid);
    const off = `${spread}em`;
    return g.animate([
      { opacity: 0, transform: `translateY(${0.12 + d * 0.004}em)`, filter: 'blur(6px)',
        textShadow: `${off} 0 0 ${GLOW}, -${off} 0 0 ${PAPER}` },
      { opacity: 1, filter: 'blur(0)', offset: .55, textShadow: `${spread * .3}em 0 0 ${GLOW}, -${spread * .3}em 0 0 ${PAPER}` },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)', textShadow: `0 0 0 ${GLOW}, 0 0 0 ${PAPER}` },
    ], { duration: 1300, delay: delay + d * 18, easing: EASE.exposure, fill: 'both' }).finished;
  }));
}

// ---------------------------------------------------------------- 4. iris
export function iris(el, { x = '50%', y = '50%', duration = 1100, reverse = false } = {}) {
  const frames = [{ clipPath: `circle(0% at ${x} ${y})` }, { clipPath: `circle(150% at ${x} ${y})` }];
  if (reduce()) { el.style.clipPath = 'none'; return null; }
  return el.animate(reverse ? frames.reverse() : frames, { duration, easing: EASE.shutter, fill: 'both' });
}

// ---------------------------------------------------------------- 5. raking light
export function rakingLight(card) {
  if (reduce()) return () => {};
  const sheen = document.createElement('i');
  sheen.className = 'raking-sheen';
  card.style.position ||= 'relative';
  card.appendChild(sheen);
  let anim;
  const enter = (e) => {
    const r = card.getBoundingClientRect();
    const fromLeft = e.clientX - r.left < r.width / 2;
    anim?.cancel();
    anim = sheen.animate([
      { transform: `translateX(${fromLeft ? -120 : 120}%) rotate(18deg)`, opacity: 0 },
      { opacity: 1, offset: .3 },
      { transform: `translateX(${fromLeft ? 120 : -120}%) rotate(18deg)`, opacity: 0 },
    ], { duration: 1400, easing: EASE.drift });
  };
  card.addEventListener('pointerenter', enter);
  return () => card.removeEventListener('pointerenter', enter);
}

// ---------------------------------------------------------------- 1. totality (intro)
// stage = { root, ring (svg circle with pathLength=1), bead, title, chrome: [...], corona? }
// corona is the object returned by mountCorona(); without it a CSS develop runs on stage.plate.
export async function totality(stage) {
  const { root, ring, bead, title, chrome = [], corona, plate } = stage;
  if (reduce()) {
    corona?.set({ intro: 1 });
    [ring, bead, title, plate, ...chrome].forEach((n) => n && (n.style.opacity = 1));
    return;
  }
  root?.classList.add('is-intro');
  // 0.0 - 0.9 s: the aperture ring is traced like a calibration
  ring?.animate([{ strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, opacity: 1 }],
    { duration: 900, easing: EASE.shutter, fill: 'both' });
  // 0.6 - 1.4 s: the diamond-ring bead ignites
  bead?.animate([
    { opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.6)', offset: .5 }, { opacity: 1, transform: 'scale(1)' },
  ], { duration: 800, delay: 600, easing: EASE.exposure, fill: 'both' });
  // 0.8 - 5.0 s: the plate develops (shader) or CSS develop fallback
  const dev = corona ? corona.play(4200) : develop(plate, { delay: 800, duration: 2600 })?.finished;
  // ring dissolves into the real corona
  ring?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: 1800, fill: 'forwards' });
  // 2.2 s: the name settles out of the fracture
  await new Promise((r) => setTimeout(r, 2200));
  const t = title ? fracture(title) : Promise.resolve();
  // 3.0 s: chrome (nav, scroll cue, captions) last, quietly
  chrome.forEach((n, i) => n.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
    { duration: 900, delay: 800 + i * 90, easing: EASE.exposure, fill: 'both' }));
  await Promise.all([t, dev]);
  root?.classList.remove('is-intro');
}

// Plates develop as they scroll into view.
export function developOnView(selector = '[data-develop]') {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    develop(e.target); io.unobserve(e.target);
  }), { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll(selector).forEach((n) => io.observe(n));
  return io;
}
