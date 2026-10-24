// Living Town: walking routes across the promenade. A small visibility graph on two lanes
// with obstacles as circles, plus string-pulling so people cut corners like people do.
import { LANE_FRONT, LANE_PROM } from './town.js';

export class Nav {
  constructor(obstacles, { x0 = -56, x1 = 58, step = 3 } = {}) {
    this.obs = obstacles; // [{x, z, r}]
    this.nodes = [];
    for (const z of [LANE_FRONT, LANE_PROM]) for (let x = x0; x <= x1 + 1e-6; x += step) this.nodes.push({ x, z, e: [] });
    const n = this.nodes.length;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = this.nodes[i], b = this.nodes[j];
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d > step * 3.3) continue;
      if (this.clear(a.x, a.z, b.x, b.z)) { a.e.push([j, d]); b.e.push([i, d]); }
    }
  }

  clear(ax, az, bx, bz, pad = 0.35) {
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1e-9;
    for (const o of this.obs) {
      let t = ((o.x - ax) * dx + (o.z - az) * dz) / L2;
      t = Math.max(0, Math.min(1, t));
      const px = ax + dx * t - o.x, pz = az + dz * t - o.z;
      const r = o.r + pad;
      if (px * px + pz * pz < r * r) {
        // allow leaving or entering an obstacle we're standing in (a chair, a bench)
        const inA = (ax - o.x) ** 2 + (az - o.z) ** 2 < r * r, inB = (bx - o.x) ** 2 + (bz - o.z) ** 2 < r * r;
        if (!inA && !inB) return false;
      }
    }
    return true;
  }

  nearestNode(x, z) {
    let best = -1, bd = Infinity;
    for (let i = 0; i < this.nodes.length; i++) {
      const nd = this.nodes[i];
      const d = (nd.x - x) ** 2 + (nd.z - z) ** 2;
      if (d < bd && d < 30 * 30 && this.clear(x, z, nd.x, nd.z)) { bd = d; best = i; }
    }
    if (best < 0) for (let i = 0; i < this.nodes.length; i++) { const nd = this.nodes[i]; const d = (nd.x - x) ** 2 + (nd.z - z) ** 2; if (d < bd) { bd = d; best = i; } }
    return best;
  }

  /** Route from (ax, az) to (bx, bz): an array of [x, z] points, excluding the start. */
  route(ax, az, bx, bz) {
    if (this.clear(ax, az, bx, bz)) return [[bx, bz]];
    const s = this.nearestNode(ax, az), t = this.nearestNode(bx, bz);
    const n = this.nodes.length;
    const dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
    dist[s] = 0;
    for (;;) {
      let u = -1, ud = Infinity;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < ud) { ud = dist[i]; u = i; }
      if (u < 0 || u === t) break;
      done[u] = 1;
      for (const [v, w] of this.nodes[u].e) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
    }
    const chain = [];
    for (let v = t; v >= 0; v = prev[v]) { chain.unshift([this.nodes[v].x, this.nodes[v].z]); if (v === s) break; }
    const pts = [[ax, az], ...chain, [bx, bz]];
    // string pulling
    const out = [];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !this.clear(pts[i][0], pts[i][1], pts[j][0], pts[j][1])) j--;
      out.push(pts[j]);
      i = j;
    }
    return out;
  }
}
