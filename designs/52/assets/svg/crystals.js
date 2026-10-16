// crystals.js — the crystal habits of Kurr's Plate A (1859), as data.
// Pure ES module (no DOM): works in the browser and in node.
// Each habit is a convex polyhedron; draw() projects it the way the 1859 plate does:
// visible edges solid, hidden edges dotted.

const hexRing = (y, r = 1, rot = 0) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = rot + (i * Math.PI) / 3;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  });

function prismFaces(ringA, ringB, offA, offB) {
  const f = [];
  for (let i = 0; i < 6; i++) f.push([offA + i, offA + ((i + 1) % 6), offB + ((i + 1) % 6), offB + i]);
  return f;
}

export const HABITS = {
  cube: {
    name: 'Cube', system: 'cubic', fig: 2,
    v: [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
    f: [[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[1,2,6,5],[0,3,7,4]],
  },
  octahedron: {
    name: 'Octahedron', system: 'cubic', fig: 16,
    v: [[1.25,0,0],[-1.25,0,0],[0,1.5,0],[0,-1.5,0],[0,0,1.25],[0,0,-1.25]],
    f: [[0,2,4],[4,2,1],[1,2,5],[5,2,0],[0,3,4],[4,3,1],[1,3,5],[5,3,0]],
  },
  tetrahedron: {
    name: 'Tetrahedron', system: 'cubic', fig: 13,
    v: [[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]].map((p) => p.map((c) => c * 0.95)),
    f: [[0,1,2],[0,1,3],[0,2,3],[1,2,3]],
  },
  quartz: {
    name: 'Quartz', system: 'trigonal', fig: 6,
    v: [...hexRing(-0.75, 0.78), ...hexRing(0.75, 0.78), [0, -1.65, 0], [0, 1.65, 0]],
    f: [
      ...prismFaces(null, null, 0, 6),
      ...Array.from({ length: 6 }, (_, i) => [i, (i + 1) % 6, 12]),
      ...Array.from({ length: 6 }, (_, i) => [6 + i, 6 + ((i + 1) % 6), 13]),
    ],
  },
  hexprism: {
    name: 'Hexagonal prism', system: 'hexagonal', fig: 22,
    v: [...hexRing(-0.6, 1.15), ...hexRing(0.6, 1.15)],
    f: [[0,1,2,3,4,5],[6,7,8,9,10,11], ...prismFaces(null, null, 0, 6)],
  },
  bipyramid: {
    name: 'Hexagonal bipyramid', system: 'hexagonal', fig: 18,
    v: [...hexRing(0, 0.95), [0, -1.7, 0], [0, 1.7, 0]],
    f: [
      ...Array.from({ length: 6 }, (_, i) => [i, (i + 1) % 6, 6]),
      ...Array.from({ length: 6 }, (_, i) => [i, (i + 1) % 6, 7]),
    ],
  },
  dodecahedron: {
    name: 'Rhombic dodecahedron', system: 'cubic', fig: 4,
    v: [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],
      [2,0,0],[-2,0,0],[0,2,0],[0,-2,0],[0,0,2],[0,0,-2],
    ].map((p) => p.map((c) => c * 0.72)),
    f: [
      [8,1,13,2],[8,2,10,6],[8,6,12,5],[8,5,11,1],
      [9,0,13,3],[9,3,10,7],[9,7,12,4],[9,4,11,0],
      [10,2,13,3],[10,6,12,7],[11,1,13,0],[11,5,12,4],
    ],
  },
  rhombohedron: {
    name: 'Rhombohedron', system: 'trigonal', fig: 8,
    v: (() => {
      const base = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
      return base.map(([x, y, z]) => [x * 0.85 + y * 0.35, y * 1.05, z * 0.85 + y * 0.2]);
    })(),
    f: [[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[1,2,6,5],[0,3,7,4]],
  },
};

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export function rotate(p, rx, ry) {
  let [x, y, z] = p;
  const cy = Math.cos(ry), sy = Math.sin(ry);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  const cx = Math.cos(rx), sx = Math.sin(rx);
  [y, z] = [y * cx - z * sx, y * sx + z * cx];
  return [x, y, z];
}

/** Project a habit. Returns { pts2d, edges:[{a,b,visible}], hull:[[x,y]...] } in a -1..1 box. */
export function project(habit, rx = 0.36, ry = 0.62, scale = 1) {
  const V = habit.v.map((p) => rotate(p, rx, ry));
  const c = V.reduce((s, p) => [s[0] + p[0] / V.length, s[1] + p[1] / V.length, s[2] + p[2] / V.length], [0, 0, 0]);
  const faceVis = habit.f.map((f) => {
    let n = cross(sub(V[f[1]], V[f[0]]), sub(V[f[2]], V[f[0]]));
    const fc = f.reduce((s, i) => [s[0] + V[i][0], s[1] + V[i][1], s[2] + V[i][2]], [0, 0, 0]).map((x) => x / f.length);
    if (dot(n, sub(fc, c)) < 0) n = n.map((x) => -x);
    return n[2] > 1e-6; // camera looks down -z; +z faces toward the viewer
  });
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const em = new Map();
  habit.f.forEach((f, fi) => {
    f.forEach((a, i) => {
      const b = f[(i + 1) % f.length];
      const k = key(a, b);
      const e = em.get(k) || { a: Math.min(a, b), b: Math.max(a, b), visible: false };
      e.visible = e.visible || faceVis[fi];
      em.set(k, e);
    });
  });
  const pts2d = V.map((p) => [p[0] * scale, -p[1] * scale]);
  return { pts2d, edges: [...em.values()], hull: convexHull(pts2d), faceVis };
}

export function convexHull(P) {
  const p = P.map((q) => q.slice()).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

/** Resample a closed polygon to n points evenly by perimeter, starting at the top-most point. */
export function resample(poly, n = 96) {
  let start = 0;
  poly.forEach((p, i) => { if (p[1] < poly[start][1] - 1e-9 || (Math.abs(p[1] - poly[start][1]) < 1e-9 && p[0] < poly[start][0])) start = i; });
  const P = poly.slice(start).concat(poly.slice(0, start));
  // ensure clockwise in screen space
  let area = 0;
  P.forEach((p, i) => { const q = P[(i + 1) % P.length]; area += p[0] * q[1] - q[0] * p[1]; });
  if (area < 0) P.reverse(), P.unshift(P.pop());
  const seg = P.map((p, i) => Math.hypot(P[(i + 1) % P.length][0] - p[0], P[(i + 1) % P.length][1] - p[1]));
  const L = seg.reduce((a, b) => a + b, 0);
  const out = [];
  let si = 0, acc = 0;
  for (let k = 0; k < n; k++) {
    const t = (k / n) * L;
    while (acc + seg[si] < t && si < seg.length - 1) acc += seg[si++];
    const u = (t - acc) / (seg[si] || 1);
    const a = P[si], b = P[(si + 1) % P.length];
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
}

export const f2 = (n) => Math.round(n * 100) / 100;

/** SVG markup string for a habit drawn like the 1859 plate. */
export function habitSVG(habit, { size = 120, rx, ry, stroke = 'currentColor', width = 1.2, dash = '1.5 3' } = {}) {
  const pr = project(habit, rx, ry, size / 2 / 1.9);
  const P = pr.pts2d;
  let s = '';
  for (const e of pr.edges) {
    const [a, b] = [P[e.a], P[e.b]];
    s += `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" stroke="${stroke}" stroke-width="${e.visible ? width : width * 0.7}"${e.visible ? '' : ` stroke-dasharray="${dash}" opacity=".7"`} stroke-linecap="round"/>`;
  }
  return s;
}
