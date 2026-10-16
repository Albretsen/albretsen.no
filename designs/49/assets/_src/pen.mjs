// Habit / pen.mjs — a tiny draftsman's pen for SVG.
// Every straight line is drawn as a slightly bowed stroke that overshoots its
// endpoints; closed shapes don't quite close; ellipses are drawn as one
// stroke that runs a little past where it started. Deterministic per seed.
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = n => +n.toFixed(2);

export class Pen {
  constructor(seed = 1, { over = 0.06, bow = 0.012, wob = 0.35, passes = 1, overMax = 6 } = {}) {
    this.r = rng(seed); this.o = { over, bow, wob, passes, overMax }; this.paths = [];
  }
  j(s = 1) { return (this.r() - 0.5) * 2 * this.o.wob * s; }
  /** straight line a→b */
  line(a, b, opt = {}) {
    const { over, bow, passes, overMax } = { ...this.o, ...opt };
    const out = [];
    for (let p = 0; p < passes; p++) {
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const o1 = Math.min(L * over * (0.3 + this.r() * 0.9), overMax), o2 = Math.min(L * over * (0.3 + this.r() * 0.9), overMax);
      const A = [a[0] - ux * o1 + this.j(), a[1] - uy * o1 + this.j()];
      const B = [b[0] + ux * o2 + this.j(), b[1] + uy * o2 + this.j()];
      const bw = L * bow * (this.r() - 0.5) * 2;
      const M = [(A[0] + B[0]) / 2 - uy * bw, (A[1] + B[1]) / 2 + ux * bw];
      out.push(`M${f(A[0])} ${f(A[1])}Q${f(M[0])} ${f(M[1])} ${f(B[0])} ${f(B[1])}`);
    }
    return out.join('');
  }
  poly(pts, closed = false, opt) {
    let d = '';
    for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) d += this.line(pts[i], pts[(i + 1) % pts.length], opt);
    return d;
  }
  /** ellipse as one stroke, starting at angle a0, sweeping `sweep` radians (default a bit over 2π) */
  ellipse(cx, cy, rx, ry, { a0 = this.r() * 6.28, sweep = Math.PI * 2.12, rot = 0, n = 48, drift = 0.04 } = {}) {
    const pts = [];
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const k = this.r() * 6.28;
    for (let i = 0; i <= n; i++) {
      const t = a0 + sweep * i / n;
      const s = 1 + drift * Math.sin(t * 1.5 + k) + drift * 0.5 * (i / n);
      const x = Math.cos(t) * rx * s, y = Math.sin(t) * ry * s;
      pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
    }
    return smooth(pts);
  }
  /** freehand curve through points (Catmull-Rom → cubic) with tiny wobble */
  curve(pts, wob = 1) {
    return smooth(pts.map(([x, y]) => [x + this.j(wob), y + this.j(wob)]));
  }
}

export function smooth(p) {
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

export function svg(w, h, body, { title = '', extra = '' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none"${extra}>${title ? `<title>${title}</title>` : ''}${body}</svg>\n`;
}
export const stroke = (d, w = 1.6, color = 'currentColor', extra = '') =>
  `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
