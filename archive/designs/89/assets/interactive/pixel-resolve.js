// <pixel-resolve> — Prism Room's signature interactive asset.
// A photograph rendered live through an ordered-dither "prism": quantised to the candy palette
// at a chunky cell size, resolving to the true photo as `resolve` goes 0 -> 1. A prism lens under
// the pointer shows the real photo with chromatic fringes. Canvas 2D only, no dependencies.
//
//   <pixel-resolve src="hero/room-1280.jpg" placeholder="hero/room-pixel-320.png"
//                  width="2560" height="1761" resolve="0" lens></pixel-resolve>
//   el.resolve = 0.6            // or set the attribute; or let motion.js drive it from scroll
//
// The placeholder (12 KB palette PNG) is shown as an <img> immediately, so first paint is the
// pixel room with layout shift 0; the photo loads after and the canvas takes over.

const PALETTE = ['#160c21','#2a1935','#572953','#8a3f6e','#ee6b47','#ff9a7d','#ff99c2','#bea6eb','#8deaca','#faea89','#86cbf3','#e8d8e6','#fff5ea']
  .map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
const BAYER = (() => { // 8x8 ordered-dither thresholds in -0.5..0.5
  const b = (n) => n === 1 ? [[0]] : (() => { const m = b(n / 2), o = [];
    for (let y = 0; y < n; y++) { o.push([]); for (let x = 0; x < n; x++) { const v = m[y % (n / 2)][x % (n / 2)] * 4;
      o[y].push(v + [[0, 2], [3, 1]][+(y >= n / 2)][+(x >= n / 2)]); } } return o; })();
  return b(8).map(r => r.map(v => v / 64 - 0.5));
})();
// nearest palette colour cache (5 bits per channel)
const LUT = new Uint8Array(32768).fill(255);
function nearest(r, g, b) {
  const k = (r >> 3) << 10 | (g >> 3) << 5 | (b >> 3);
  if (LUT[k] !== 255) return LUT[k];
  let best = 0, bd = 1e9;
  for (let i = 0; i < PALETTE.length; i++) { const p = PALETTE[i];
    const d = (r - p[0]) ** 2 * .3 + (g - p[1]) ** 2 * .59 + (b - p[2]) ** 2 * .11; if (d < bd) { bd = d; best = i; } }
  return LUT[k] = best;
}

class PixelResolve extends HTMLElement {
  static observedAttributes = ['resolve'];
  constructor() { super(); this._r = 0; this._lens = null; this._raf = 0; }
  get resolve() { return this._r; }
  set resolve(v) { this._r = Math.max(0, Math.min(1, +v || 0)); this._queue(); }
  attributeChangedCallback(n, o, v) { if (n === 'resolve') this.resolve = v; }
  connectedCallback() {
    const w = +this.getAttribute('width') || 16, h = +this.getAttribute('height') || 9;
    this.style.cssText += `;display:block;position:relative;aspect-ratio:${w}/${h};overflow:hidden;touch-action:pan-y`;
    if (!this.querySelector('img')) {
      const ph = document.createElement('img');
      ph.src = this.getAttribute('placeholder'); ph.alt = this.getAttribute('alt') || ''; ph.width = w; ph.height = h;
      ph.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated';
      this.append(ph);
    }
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;opacity:0;transition:opacity .4s';
    this.append(this.canvas);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.small = document.createElement('canvas'); this.sctx = this.small.getContext('2d', { willReadFrequently: true });
    this.photo = new Image(); this.photo.decoding = 'async'; this.photo.src = this.getAttribute('src');
    this.photo.decode().then(() => { this.ready = true; this._size(); this.canvas.style.opacity = 1; this._queue(); }).catch(() => {});
    this._ro = new ResizeObserver(() => { this._size(); this._queue(); }); this._ro.observe(this);
    if (this.hasAttribute('lens') && matchMedia('(pointer:fine)').matches) {
      this.addEventListener('pointermove', e => { const r = this.getBoundingClientRect(); this._lens = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; this._queue(); });
      this.addEventListener('pointerleave', () => { this._lens = null; this._queue(); });
    }
    if (this.hasAttribute('resolve')) this.resolve = this.getAttribute('resolve');
  }
  disconnectedCallback() { this._ro?.disconnect(); cancelAnimationFrame(this._raf); }
  _size() { const r = this.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(r.width * d)); this.canvas.height = Math.max(1, Math.round(r.height * d)); }
  _queue() { if (!this._raf) this._raf = requestAnimationFrame(() => { this._raf = 0; this._draw(); }); }
  _draw() {
    if (!this.ready) return;
    const { canvas: c, ctx } = this, W = c.width, H = c.height, t = this._r;
    // cell size eases from 18 css px down to 1; fully resolved draws the photo directly
    const d = W / this.getBoundingClientRect().width || 1;
    const cell = Math.max(1, Math.round((1 + 17 * (1 - t) ** 2.2) * d));
    ctx.imageSmoothingEnabled = true;
    if (cell <= 1 || t >= 0.999) ctx.drawImage(this.photo, 0, 0, W, H);
    else {
      const w = Math.ceil(W / cell), h = Math.ceil(H / cell);
      this.small.width = w; this.small.height = h;
      this.sctx.drawImage(this.photo, 0, 0, w, h);
      const img = this.sctx.getImageData(0, 0, w, h), p = img.data;
      const mix = Math.min(1, t * 1.25); // later in the resolve, blend toward true colour
      const amp = 52 * (1 - t);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, th = BAYER[y & 7][x & 7] * amp;
        const q = PALETTE[nearest(Math.min(255, Math.max(0, p[i] + th)), Math.min(255, Math.max(0, p[i + 1] + th)), Math.min(255, Math.max(0, p[i + 2] + th)))];
        p[i] = q[0] + (p[i] - q[0]) * mix; p[i + 1] = q[1] + (p[i + 1] - q[1]) * mix; p[i + 2] = q[2] + (p[i + 2] - q[2]) * mix;
      }
      this.sctx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(this.small, 0, 0, w * cell, h * cell);
    }
    if (this._lens && t < 0.999) { // the prism lens
      const [lx, ly] = this._lens, R = Math.min(W, H) * 0.16, cx = lx * W, cy = ly * H;
      const fringe = (dx, col) => { ctx.save(); ctx.beginPath(); ctx.arc(cx + dx, cy, R, 0, 7); ctx.clip();
        ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = col; ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4); ctx.restore(); };
      fringe(-6 * d, 'rgba(255,90,140,.55)'); fringe(6 * d, 'rgba(90,190,255,.55)');
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip(); ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.photo, 0, 0, W, H); ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(255,245,234,.9)'; ctx.lineWidth = 1.5 * d; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke(); ctx.restore();
    }
  }
}
customElements.define('pixel-resolve', PixelResolve);
export { PixelResolve, PALETTE };
