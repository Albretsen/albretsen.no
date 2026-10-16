// IR//PEEL motion study (design 50). ES module, no dependencies.
//   import { slapIn, irWipe, scrubFrames, thermalEasterEgg, playSpark } from './assets/motion.js'
// See motion.css for the four named moves; this file holds the JS-driven ones.

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];

/** 1. SLAP: stagger-slap a set of stickers onto the page when they enter the viewport. */
export function slapIn(nodes, { tilt = () => (Math.random() * 14 - 7).toFixed(1) + 'deg' } = {}) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    el.style.setProperty('--tilt', el.dataset.tilt || tilt());
    el.classList.add('ir-slap');
  }), { threshold: 0.3 });
  [...nodes].forEach((n, i) => { n.style.setProperty('--i', n.dataset.i ?? i); io.observe(n); });
  return () => io.disconnect();
}

/**
 * 3. IR WIPE: ordered-dither dissolve. Covers the screen in Bayer order with an infrared
 * ramp, calls `midpoint` (swap your content there), then uncovers in reverse order.
 */
export function irWipe({ midpoint, cell = 12, duration = 900, colors = ['#f315a2', '#4b1788', '#0d031e'] } = {}) {
  return new Promise((resolve) => {
    if (reduce()) { midpoint && midpoint(); return resolve(); }
    const c = document.createElement('canvas');
    c.className = 'ir-wipe-canvas';
    const cols = Math.ceil(innerWidth / cell), rows = Math.ceil(innerHeight / cell);
    c.width = cols; c.height = rows;           // one canvas pixel per cell, upscaled pixelated
    const x = c.getContext('2d');
    document.body.appendChild(c);
    const half = duration / 2; let t0 = performance.now(), swapped = false;
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / half);
      x.clearRect(0, 0, cols, rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const th = BAYER[(j & 7) * 8 + (i & 7)] / 64;
        const cover = swapped ? th >= t : th < t; // in: fill below threshold; out: clear below threshold
        if (!cover) continue;
        const lag = swapped ? (th - t) : (t - th); // colour by how long the cell has been lit
        x.fillStyle = colors[Math.min(colors.length - 1, Math.floor(lag * colors.length * 2.2))];
        x.fillRect(i, j, 1, 1);
      }
      if (t < 1) return requestAnimationFrame(frame);
      if (!swapped) { swapped = true; midpoint && midpoint(); t0 = performance.now(); return requestAnimationFrame(frame); }
      c.remove(); resolve();
    };
    requestAnimationFrame(frame);
  });
}

/**
 * CENTREPIECE: scroll-scrubbed image sequence (pre-rendered peel frames).
 * scrubFrames(canvas, { count: 40, src: i => `assets/frames/peel-${String(i).padStart(2,'0')}.webp`, track: sectionEl })
 * Draws the frame matching scroll progress through `track` (sticky canvas inside a tall section).
 * Loads the first frame first, then the rest progressively; never blocks first paint.
 */
export function scrubFrames(canvas, { count, src, track, onProgress } = {}) {
  const ctx = canvas.getContext('2d');
  const imgs = new Array(count); let current = -1, want = 0, ticking = false;
  const load = (i) => imgs[i] || (imgs[i] = Object.assign(new Image(), { decoding: 'async', src: src(i) }));
  const draw = (i) => {
    // nearest loaded frame so scrubbing never shows a blank
    let k = i; while (k > 0 && !(imgs[k] && imgs[k].complete && imgs[k].naturalWidth)) k--;
    const im = imgs[k]; if (!im || !im.complete || k === current) return;
    if (canvas.width !== im.naturalWidth) { canvas.width = im.naturalWidth; canvas.height = im.naturalHeight; }
    ctx.drawImage(im, 0, 0); current = k;
  };
  load(0).onload = () => draw(0);
  const rest = () => { for (let i = 1; i < count; i++) load(i).onload = () => { if (i <= want) draw(want); }; };
  ('requestIdleCallback' in window) ? requestIdleCallback(rest) : setTimeout(rest, 200);
  const progress = () => {
    const r = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
  };
  const update = () => {
    ticking = false; const p = progress();
    want = Math.round(p * (count - 1));
    draw(want); onProgress && onProgress(p, want);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true }); update();
  return { destroy: () => removeEventListener('scroll', onScroll), seek: (p) => { want = Math.round(p * (count - 1)); current = -1; draw(want); } };
}

/** Lottie spark (pixel bolt with travelling charge). Lazy-loads lottie-web. */
export async function playSpark(el, { path = new URL('./motion/spark.lottie.json', import.meta.url).href, loop = true } = {}) {
  if (!window.lottie) {
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  const a = window.lottie.loadAnimation({ container: el, renderer: 'svg', loop, autoplay: !reduce(), path, rendererSettings: { shapeRendering: 'crispEdges' } });
  return a;
}

/**
 * EASTER EGG: type "peel" anywhere (or the Konami code) and the whole page drops into
 * thermal view — an SVG false-colour filter maps luminance onto the infrared ramp —
 * with a phosphor toast. Type it again to leave.
 */
export function thermalEasterEgg({ words = ['peel', 'arrowuparrowuparrowdownarrowdownarrowleftarrowrightarrowleftarrowrightba'], message = 'THERMAL VIEW / UNDERDRAWING FOUND' } = {}) {
  if (!document.getElementById('ir-thermal')) {
    const ramp = ['#0d031e', '#230445', '#4b1788', '#8038d1', '#f315a2', '#fa5e75', '#fa8233', '#fec766', '#f6f3fc'];
    const ch = (k) => ramp.map((h) => (parseInt(h.slice(1 + k * 2, 3 + k * 2), 16) / 255).toFixed(3)).join(' ');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    svg.innerHTML = `<filter id="ir-thermal" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0 0 0 1 0"/>
      <feComponentTransfer><feFuncR type="table" tableValues="${ch(0)}"/><feFuncG type="table" tableValues="${ch(1)}"/><feFuncB type="table" tableValues="${ch(2)}"/></feComponentTransfer>
    </filter>`;
    document.body.appendChild(svg);
  }
  let buf = '';
  const max = Math.max(...words.map((w) => w.length));
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea,[contenteditable]')) return;
    buf = (buf + e.key.toLowerCase()).slice(-max);
    if (!words.some((w) => buf.endsWith(w))) return;
    buf = '';
    const on = document.documentElement.classList.toggle('ir-thermal');
    if (on) { const t = document.createElement('div'); t.className = 'ir-toast'; t.textContent = message; document.body.appendChild(t); setTimeout(() => t.remove(), 2700); }
  });
}
