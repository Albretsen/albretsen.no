// dawn-press.js — the centrepiece of "The Albretsen Dawn" (design 43).
// A canvas-2D generative press that prints a scene in low-poly facets.
//
//   import { dawnPress } from './dawn-press.js'
//   const press = dawnPress(canvas, { image: 'hero-photo.webp', density: 1, seed: 7 })
//   press.reprint()   // new seed, new edition, animated
//   press.destroy()
//
// Modes
//   image given  -> the photo is graded into the Dawn palette, triangulated with
//                   edge-aware points and printed facet by facet, from the sun outward.
//   no image     -> a generative dawn: sky field, a planet limb and a sun, printed the same way.
// Interaction: facets near the pointer catch light (a "spark" that follows you).
// Respects prefers-reduced-motion (prints instantly, no shimmer).
// No dependencies. Delaunay is a compact Bowyer–Watson.

export const PALETTE = {
  paper: '#f6fbfc', mist: '#e2f4f6', sky: '#b5e5ea', lagoon: '#6ab9c7', deep: '#32728a',
  ink: '#182933', dawn: '#fbd1b6', blush: '#f6cbd0', lilac: '#d0cded', spark: '#f8e18a',
};

// luminance -> colour. Dark becomes air, light becomes sunrise.
const GRADE = [
  [0.00, [214, 233, 242]],
  [0.18, [200, 216, 240]],
  [0.36, [214, 206, 236]],
  [0.55, [240, 205, 216]],
  [0.74, [251, 212, 188]],
  [0.90, [253, 236, 196]],
  [1.00, [255, 253, 246]],
];
// 'dawn' grade keeps silhouettes: darks become lagoon, so peaks read as facets of sea-glass
const GRADE_DAWN = [
  [0.00, [92, 156, 178]],
  [0.10, [132, 190, 204]],
  [0.26, [190, 214, 232]],
  [0.42, [208, 204, 237]],
  [0.58, [242, 202, 214]],
  [0.74, [251, 210, 184]],
  [0.88, [253, 234, 192]],
  [1.00, [255, 252, 242]],
];
const GRADES = { air: GRADE, dawn: GRADE_DAWN };
function grade(l, G = GRADE) {
  for (let i = 1; i < G.length; i++) {
    if (l <= G[i][0]) {
      const [a, ca] = G[i - 1], [b, cb] = G[i];
      const t = (l - a) / (b - a);
      return [ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t];
    }
  }
  return G[G.length - 1][1].slice();
}

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- Delaunay (Bowyer–Watson) ----------
export function triangulate(pts) {
  const n = pts.length;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
  const d = Math.max(maxX - minX, maxY - minY) * 20, mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
  const P = pts.concat([[mx - d, my - d], [mx, my + d], [mx + d, my - d]]);
  const circ = (a, b, c) => {
    const [ax, ay] = P[a], [bx, by] = P[b], [cx, cy] = P[c];
    const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
    return [ux, uy, (ax - ux) ** 2 + (ay - uy) ** 2];
  };
  let tris = [[n, n + 1, n + 2, ...circ(n, n + 1, n + 2)]];
  // insert in x-sorted order: lets us retire triangles whose circumcircle is behind the sweep
  const order = pts.map((_, i) => i).sort((a, b) => P[a][0] - P[b][0]);
  const done = [];
  for (const i of order) {
    const [px, py] = P[i];
    const edges = new Map();
    const keep = [];
    for (const t of tris) {
      const dx = px - t[3];
      if (dx > 0 && dx * dx > t[5]) { done.push(t); continue; }
      if (dx * dx + (py - t[4]) ** 2 < t[5]) {
        for (const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) {
          const k = a < b ? a + ',' + b : b + ',' + a;
          edges.has(k) ? edges.delete(k) : edges.set(k, [a, b]);
        }
      } else keep.push(t);
    }
    for (const [a, b] of edges.values()) keep.push([a, b, i, ...circ(a, b, i)]);
    tris = keep;
  }
  return done.concat(tris).filter(t => t[0] < n && t[1] < n && t[2] < n).map(t => [t[0], t[1], t[2]]);
}

// ---------- sources ----------
function imageSource(img, W, H, o) {
  const G = GRADES[o.grade] || GRADE;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  // cover-fit
  const s = Math.max(W / img.width, H / img.height);
  g.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
  const data = g.getImageData(0, 0, W, H).data;
  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) lum[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
  // lift: space photos are mostly black; a gentle curve opens the shadows
  for (let i = 0; i < lum.length; i++) lum[i] = Math.pow(lum[i], o.gamma);
  // keep a memory of the photo's own hue: chroma-weighted blend of the palette grade
  // with a pastelised original (blue oceans stay blue, clouds stay white)
  const color = (x, y) => {
    const xi = Math.max(0, Math.min(W - 1, x | 0)), yi = Math.max(0, Math.min(H - 1, y | 0)), i = (yi * W + xi) * 4;
    const r = data[i], gg = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), chroma = (mx - mn) / 255;
    const l = lum[yi * W + xi], base = grade(l, G);
    const lift = 0.5 + 0.2 * (1 - l);
    const past = [r + (246 - r) * lift, gg + (251 - gg) * lift, b + (252 - b) * lift];
    const w = Math.min(o.memory, chroma * 2.4) * Math.min(1, mx / 90);
    return [base[0] * (1 - w) + past[0] * w, base[1] * (1 - w) + past[1] * w, base[2] * (1 - w) + past[2] * w];
  };
  return { W, H, lum, color, height: (x, y) => sample(lum, W, H, x, y) };
}
function sample(arr, W, H, x, y) {
  const xi = Math.max(0, Math.min(W - 1, x | 0)), yi = Math.max(0, Math.min(H - 1, y | 0));
  return arr[yi * W + xi];
}

function generativeSource(W, H, rand) {
  // a planet limb low in the frame, sun on the limb, airy sky above
  const cx = W * (0.5 + (rand() - 0.5) * 0.25), R = Math.max(W, H) * 1.15, cy = H * 0.74 + R;
  const sunX = cx + (rand() - 0.5) * W * 0.4;
  const sunY = cy - Math.sqrt(Math.max(0, R * R - (sunX - cx) ** 2));
  const lum = new Float32Array(W * H);
  const f = (x, y) => {
    const r = Math.hypot(x - cx, y - cy);
    const ds = Math.hypot(x - sunX, (y - sunY) * 1.6) / Math.max(W, H);
    const glow = Math.exp(-ds * 7.5) * 0.75 + Math.exp(-ds * 30) * 0.4;
    let l;
    if (r < R) {
      // planet: cool, gently banded, brighter near the limb
      const depth = (R - r) / (H * 0.5);
      l = 0.12 + 0.3 * Math.exp(-depth * 3) + 0.04 * Math.sin(x * 0.012 + y * 0.03);
    } else {
      // atmosphere: bright thin band above the limb, fading upward
      const above = (r - R) / H;
      l = 0.1 + 0.55 * Math.exp(-above * 9) + 0.2 * (y / H);
    }
    return Math.min(1, l + glow);
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) lum[y * W + x] = f(x, y);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const SEA = [[226, 244, 246], [181, 229, 234], [128, 196, 208], [96, 168, 186]];
  const ramp = (stops, t) => { t = Math.max(0, Math.min(0.999, t)) * (stops.length - 1); const i = t | 0; return mix(stops[i], stops[i + 1], t - i); };
  const color = (x, y) => {
    const r = Math.hypot(x - cx, y - cy), l = sample(lum, W, H, x, y);
    const ds = Math.hypot(x - sunX, (y - sunY) * 1.6) / Math.max(W, H);
    const warm = Math.exp(-ds * 5.5);
    if (r < R) {
      const depth = (R - r) / (H * 0.45);
      const c = ramp(SEA, 0.15 + depth * 0.85);
      return mix(c, [253, 236, 214], Math.min(0.85, warm * 0.9 + Math.exp(-depth * 18) * 0.5));
    }
    const above = (r - R) / H;
    const sky = ramp([[251, 212, 188], [246, 203, 208], [208, 205, 237], [214, 233, 242], [240, 248, 250]], Math.min(1, above * 1.6));
    return mix(sky, [255, 251, 238], Math.min(1, warm * 1.1 + Math.exp(-ds * 26)));
  };
  return { W, H, lum, sun: [sunX, sunY], limb: { cx, cy, R }, color, height: (x, y) => sample(lum, W, H, x, y) };
}

// ---------- points ----------
function placePoints(src, count, rand) {
  const { W, H, lum } = src;
  const pts = [];
  // Sobel magnitude on a coarse grid drives density
  const step = 4, gw = (W / step) | 0, gh = (H / step) | 0, edge = new Float32Array(gw * gh);
  let total = 0;
  for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
    const L = (dx, dy) => sample(lum, W, H, (x + dx) * step, (y + dy) * step);
    const gx = L(1, -1) + 2 * L(1, 0) + L(1, 1) - L(-1, -1) - 2 * L(-1, 0) - L(-1, 1);
    const gy = L(-1, 1) + 2 * L(0, 1) + L(1, 1) - L(-1, -1) - 2 * L(0, -1) - L(1, -1);
    const m = Math.pow(Math.hypot(gx, gy), 1.4);
    edge[y * gw + x] = m; total += m;
  }
  // 45% jittered grid, 55% edge-weighted
  const gridN = Math.round(count * 0.45);
  const cols = Math.round(Math.sqrt(gridN * W / H)), rows = Math.round(gridN / cols);
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    const edgeX = i === 0 || i === cols, edgeY = j === 0 || j === rows;
    const jx = edgeX ? 0 : (rand() - 0.5) * 0.9, jy = edgeY ? 0 : (rand() - 0.5) * 0.9;
    pts.push([(i + jx) / cols * W, (j + jy) / rows * H]);
  }
  const edgeN = count - gridN;
  for (let k = 0; k < edgeN; k++) {
    let r = rand() * total, idx = 0;
    // binary-ish walk is fine for this size
    for (idx = 0; idx < edge.length && r > edge[idx]; idx++) r -= edge[idx];
    const x = (idx % gw) * step + rand() * step, y = ((idx / gw) | 0) * step + rand() * step;
    pts.push([x, y]);
  }
  return pts;
}

// ---------- the press ----------
export function dawnPress(canvas, opts = {}) {
  const o = Object.assign({ image: null, density: 1, seed: 7, duration: 2400, shimmer: true, relief: 46, grade: 'air', gamma: 0.62, memory: 0.85, orbits: !opts.image, onPrinted: null }, opts);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let img = null, facets = [], start = 0, raf = 0, pointer = null, sun = [0, 0], src = null, alive = true, printed = false;
  let dpr = 1, W = 0, H = 0;

  function build(seed) {
    const rand = rng(seed);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(2, Math.round(rect.width)); H = Math.max(2, Math.round(rect.height));
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    // analyse at a modest size, draw at full size
    const k = Math.min(1, 900 / Math.max(W, H)), aw = Math.round(W * k), ah = Math.round(H * k);
    src = img ? imageSource(img, aw, ah, o) : generativeSource(aw, ah, rand);
    const count = Math.round(Math.min(2600, (W * H) / 900) * o.density);
    const pts = placePoints(src, count, rand);
    const tris = triangulate(pts);
    // sun = brightest region (image) or the known sun (generative)
    if (src.sun) sun = [src.sun[0] / k, src.sun[1] / k];
    else {
      let best = -1, bi = 0;
      for (let i = 0; i < src.lum.length; i += 7) if (src.lum[i] > best) { best = src.lum[i]; bi = i; }
      sun = [(bi % aw) / k, ((bi / aw) | 0) / k];
    }
    const maxD = Math.hypot(W, H);
    facets = tris.map(([a, b, c]) => {
      const A = pts[a], B = pts[b], C = pts[c];
      const mx = (A[0] + B[0] + C[0]) / 3, my = (A[1] + B[1] + C[1]) / 3;
      const cols = [src.color(mx, my), src.color(A[0], A[1]), src.color(B[0], B[1]), src.color(C[0], C[1])];
      const col = [0, 1, 2].map(i => cols[0][i] * 0.55 + (cols[1][i] + cols[2][i] + cols[3][i]) * 0.15);
      // pseudo-3D: luminance as height -> facet normal -> light from the upper right
      const hA = src.height(A[0], A[1]) * 60, hB = src.height(B[0], B[1]) * 60, hC = src.height(C[0], C[1]) * 60;
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = hB - hA, vx = C[0] - A[0], vy = C[1] - A[1], vz = hC - hA;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const nl = Math.hypot(nx, ny, nz) || 1;
      const lit = (nx * 0.55 - ny * 0.6 + nz * 0.58) / nl; // light dir (0.55,-0.6,0.58)
      const shade = (lit - 0.58) * o.relief + (rand() - 0.5) * 5;
      const s = 1 / k;
      const pA = [A[0] * s, A[1] * s], pB = [B[0] * s, B[1] * s], pC = [C[0] * s, C[1] * s];
      const d = Math.hypot(mx * s - sun[0], my * s - sun[1]) / maxD;
      return { p: [pA, pB, pC], c: col.map(v => v + shade), cx: mx * s, cy: my * s, t: d + rand() * 0.06, glow: 0 };
    });
    facets.sort((a, b) => a.t - b.t);
  }

  function fillFacet(f, alpha, lift) {
    const [A, B, C] = f.p;
    const r = Math.min(255, f.c[0] + lift), g = Math.min(255, f.c[1] + lift), b = Math.min(255, f.c[2] + lift * 0.8);
    const col = `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
    ctx.fillStyle = col; ctx.strokeStyle = col;
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  function drawOrbits(prog) {
    if (!o.orbits || !src.limb) return;
    const k = W / src.W;
    const { cx, cy, R } = src.limb;
    ctx.save();
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const rr = (R + src.H * (0.08 + i * 0.09)) * k;
      ctx.strokeStyle = `rgba(50,114,138,${0.22 - i * 0.05})`;
      ctx.setLineDash(i === 1 ? [2, 6] : []);
      ctx.beginPath();
      const a0 = -Math.PI / 2 - 0.9, a1 = a0 + 1.8 * Math.min(1, prog * 1.2);
      ctx.arc(cx * k, cy * k, rr, a0, a1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSpark(x, y, r, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = `rgba(255,252,240,${a})`;
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.16, -r * 0.16, r, 0); ctx.quadraticCurveTo(r * 0.16, r * 0.16, 0, r);
    ctx.quadraticCurveTo(-r * 0.16, r * 0.16, -r, 0); ctx.quadraticCurveTo(-r * 0.16, -r * 0.16, 0, -r); ctx.fill();
    ctx.restore();
  }

  function frame(now) {
    if (!alive) return;
    const el = reduce ? 1e9 : now - start;
    const prog = Math.min(1, el / o.duration);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 0.6; ctx.lineJoin = 'round';
    ctx.fillStyle = PALETTE.paper; ctx.fillRect(0, 0, W, H);
    const tMax = facets.length ? facets[facets.length - 1].t : 1;
    let pending = false;
    for (const f of facets) {
      const local = (prog * (tMax + 0.25) - f.t) / 0.25;
      if (local <= 0) { pending = true; continue; }
      const a = Math.min(1, local);
      if (a < 1) pending = true;
      // pointer light
      let target = 0;
      if (pointer && o.shimmer && !reduce) {
        const d = Math.hypot(f.cx - pointer[0], f.cy - pointer[1]);
        target = Math.max(0, 1 - d / 160);
      }
      f.glow += (target - f.glow) * 0.12;
      if (f.glow > 0.003) pending = true;
      // fresh facets print a little bright, then settle (ink drying in light)
      const fresh = (1 - a) * 26;
      fillFacet(f, a, fresh + f.glow * 30);
    }
    drawOrbits(prog);
    // the sun's spark
    const sp = Math.min(1, Math.max(0, (prog - 0.1) * 2));
    if (sp > 0) {
      drawSpark(sun[0], sun[1], 10 + 8 * sp, 0.9 * sp);
      drawSpark(sun[0], sun[1], 34 * sp, 0.18 * sp);
    }
    if (!pending && !printed) { printed = true; o.onPrinted && o.onPrinted(); }
    if (pending || pointer) raf = requestAnimationFrame(frame);
    else raf = 0;
  }
  const kick = () => { if (!raf && alive) raf = requestAnimationFrame(frame); };

  function print(seed) {
    o.seed = seed; printed = false;
    build(seed);
    start = performance.now();
    cancelAnimationFrame(raf); raf = 0; kick();
  }

  const onMove = e => { const r = canvas.getBoundingClientRect(); pointer = [e.clientX - r.left, e.clientY - r.top]; kick(); };
  const onLeave = () => { pointer = null; kick(); };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  let rt = 0;
  const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { build(o.seed); start = performance.now() - o.duration * 2; kick(); }, 120); });

  const ready = (async () => {
    if (o.image) {
      img = new Image(); img.decoding = 'async'; img.src = o.image;
      await img.decode();
    }
    print(o.seed);
    ro.observe(canvas);
  })();

  return {
    ready,
    reprint(seed = (o.seed * 7 + 13) % 9973) { print(seed); return seed; },
    get seed() { return o.seed; },
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave); },
  };
}
