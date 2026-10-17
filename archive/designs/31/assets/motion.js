// Honest Deck — motion study (JS half). Built on Motion (motion.dev), pinned.
// Four signature moves, each named after what a card does:
//   deal()        ENTRANCE    cards leave a squared-up deck one by one on a spring, flip face up and land in a fan
//   tilt()        HOVER       a card tilts toward the pointer and an airbrushed specular highlight follows it
//   riffle()      TRANSITION  two half-decks bridge and interleave; use between sections or on filter changes
//   scrubSequence() CENTREPIECE pre-rendered frames (sequence/) drawn to a canvas, scrubbed by scroll progress
// plus ping() (echo pulse feedback) used by the shortcut cheat sheet.
import { animate, stagger, scroll, inView } from 'https://cdn.jsdelivr.net/npm/motion@12.23.28/+esm';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ 1. DEAL (entrance)
   Reference: motion.dev stagger docs (https://motion.dev/docs/stagger) and Codrops card-stack demos
   (https://tympanus.net/codrops/). Cards start stacked on the deck position with a tiny jitter, then
   spring to their own layout position. A rotateY flip happens inside the same spring, so faces
   turn up while airborne, the way a dealer's wrist does it. */
export function deal(cards, { from = 'center', gap = 0.075, deck } = {}) {
  const els = [...cards];
  if (!els.length) return;
  const origin = deck?.getBoundingClientRect?.();
  els.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const dx = origin ? origin.left + origin.width / 2 - (r.left + r.width / 2) : 0;
    const dy = origin ? origin.top + origin.height / 2 - (r.top + r.height / 2) : 260;
    el.style.setProperty('--dx', dx + 'px');
    el.style.setProperty('--dy', dy + 'px');
    el.style.setProperty('--jit', ((i * 37) % 9) - 4 + 'deg');
  });
  if (reduce()) return animate(els, { opacity: [0, 1] }, { duration: 0.3 });
  const delay = stagger(gap, { from });
  return els.map((el, i) =>
    animate(el,
      {
        transform: [
          `translate(${el.style.getPropertyValue('--dx')}, ${el.style.getPropertyValue('--dy')}) rotate(${el.style.getPropertyValue('--jit')}) rotateY(180deg) scale(.9)`,
          'translate(0px, 0px) rotate(0deg) rotateY(0deg) scale(1)',
        ],
        opacity: [0, 1],
      },
      { type: 'spring', stiffness: 170, damping: 19, mass: 0.9, delay: delay(i, els.length) }
    )
  );
}

/* ------------------------------------------------------------------ 2. AIRBRUSH TILT (hover)
   Reference: Magic UI "Magic Card" spotlight (https://magicui.design/docs/components/magic-card) and
   the reflective-surface rule from 80s airbrush (sharp highlight that moves with the light).
   Sets --mx/--my for a CSS radial highlight and springs rotateX/rotateY. */
export function tilt(el, { max = 10, lift = 10 } = {}) {
  if (reduce()) return () => {};
  let anim;
  const move = (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', px * 100 + '%');
    el.style.setProperty('--my', py * 100 + '%');
    anim?.stop?.();
    anim = animate(el, { rotateY: (px - 0.5) * max * 2, rotateX: (0.5 - py) * max * 2, y: -lift, scale: 1.03 },
      { type: 'spring', stiffness: 260, damping: 22 });
  };
  const leave = () => {
    anim?.stop?.();
    anim = animate(el, { rotateY: 0, rotateX: 0, y: 0, scale: 1 }, { type: 'spring', stiffness: 180, damping: 18 });
  };
  el.style.transformPerspective = '900px';
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
}

/* ------------------------------------------------------------------ 3. RIFFLE (transition)
   Reference: a real riffle shuffle, staged like Codrops' grid-to-stack transitions. The set splits
   into left/right halves that lift and lean toward each other, then interleave back to the grid.
   Pass a callback to swap content at the bridge moment (e.g. filter products, change page). */
export async function riffle(cards, swap) {
  const els = [...cards];
  if (reduce()) { await swap?.(); return; }
  const half = Math.ceil(els.length / 2);
  await Promise.all(els.map((el, i) => {
    const left = i < half;
    return animate(el, { x: left ? -40 : 40, y: -18 - (i % half) * 3, rotate: left ? -7 : 7, scale: 0.94 },
      { duration: 0.32, ease: [0.33, 1, 0.68, 1] });
  }));
  await swap?.();
  const order = els.map((_, i) => i).sort((a, b) => (a % half) - (b % half) || a - b);
  await Promise.all(order.map((idx, k) => animate(els[idx], { x: 0, y: 0, rotate: 0, scale: 1 },
    { type: 'spring', stiffness: 300, damping: 24, delay: k * 0.035 })));
}

/* ------------------------------------------------------------------ 4. SCRUB (centrepiece)
   Reference: Apple-style image-sequence scrubbing (canvas + pre-decoded frames, not <video>, so seeking is
   instant in both directions). Uses Motion's scroll() for progress. Frames: sequence/wide (1280x720, 64)
   and sequence/tall (540x960, 48). Returns { setProgress, destroy }. */
export function scrubSequence(canvas, { base, count, pad = 3, ext = 'webp', prefix = 'deal-', target, offset = ['start start', 'end end'], onProgress } = {}) {
  const ctx = canvas.getContext('2d');
  const frames = new Array(count);
  let current = -1, want = 0;
  const url = (i) => `${base}/${prefix}${String(i).padStart(pad, '0')}.${ext}`;
  const load = (i) => frames[i] || (frames[i] = Object.assign(new Image(), { src: url(i), decoding: 'async' }));
  // first frame immediately, last frame next (so a fast scroll lands on something), then the rest
  load(0); load(count - 1);
  const rest = () => { for (let i = 1; i < count - 1; i++) load(i); };
  ('requestIdleCallback' in window ? requestIdleCallback : setTimeout)(rest);
  function fit() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; current = -1; draw(want);
  }
  function draw(i) {
    // nearest loaded frame so scrubbing never shows a blank
    let k = i; while (k > 0 && !(frames[k]?.complete && frames[k].naturalWidth)) k--;
    const img = frames[k];
    if (!img?.complete || k === current) return;
    current = k;
    const cw = canvas.width, ch = canvas.height, s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  frames[0].onload = () => draw(want);
  const setProgress = (p) => { want = Math.round(Math.min(1, Math.max(0, p)) * (count - 1)); draw(want); onProgress?.(p, want); };
  const ro = new ResizeObserver(fit); ro.observe(canvas);
  const stop = target ? scroll((p) => setProgress(p), { target, offset }) : () => {};
  return { setProgress, frames, destroy() { stop(); ro.disconnect(); } };
}

/* ------------------------------------------------------------------ 5. PING (echo pulse) */
export function ping(el) {
  el.classList.remove('is-pinged'); void el.offsetWidth; el.classList.add('is-pinged');
  setTimeout(() => el.classList.remove('is-pinged'), 900);
}

/* ------------------------------------------------------------------ entrance helper for blocks */
export function rise(selector, { gap = 0.06 } = {}) {
  inView(selector, (el) => {
    const kids = el.children.length ? el.children : [el];
    if (reduce()) return;
    animate(kids, { opacity: [0, 1], y: [24, 0], filter: ['blur(6px)', 'blur(0px)'] },
      { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: stagger(gap) });
  }, { amount: 0.25 });
}

export { animate, stagger, scroll, inView };
