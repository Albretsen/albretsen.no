// Where the lamplighter can stand: terrace lanes, the seafront, the stair flights between
// rows and the church plaza, minus building and prop footprints. Plus a tiny route planner
// that threads the stairs, so a tap anywhere in town walks you there.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createWalkMap(town, { flight = 5.4, flightStart = 5.4 } = {}) {
  const { rowFront, rowY } = town;
  const rows = town.rows;
  const regions = [];
  const obstacles = [];

  // terrace lanes (row 0 runs on down over the pavement and the coast road)
  for (const lane of town.lanes) {
    const r = lane.row;
    const z0 = rowFront(r) - 2.4;
    const z1 = r === 0 && town.road ? town.road.z + 2.9 : rowFront(r) - 0.45;
    regions.push({ kind: 'lane', row: r, x0: lane.x0 + 1, x1: lane.x1 - 1, z0, z1, h: () => rowY(r) });
  }
  // the summit plaza
  const top = rows;
  regions.push({ kind: 'plaza', row: top, x0: -19, x1: 19, z0: rowFront(top) - 25, z1: rowFront(top) - 0.45, h: () => rowY(top) });

  // stair corridors: flat between the houses, then the flight
  for (const s of town.stairs) {
    const wide = s.to === rows;
    const hw = wide ? 2.9 : 1.3;
    const zb = rowFront(s.to) + flightStart;
    const y0 = rowY(s.from);
    regions.push({
      kind: 'stairs', row: s.from, to: s.to, x: s.x,
      x0: s.x - hw, x1: s.x + hw, z0: rowFront(s.to) - 1.3, z1: rowFront(s.from) - 0.6,
      h: (x, z) => y0 + 3 * clamp((zb - z) / flight, 0, 1),
    });
  }

  function blocked(x, z, y) {
    for (const o of obstacles) {
      if (x > o.x0 && x < o.x1 && z > o.z0 && z < o.z1 && y > o.y0 - 1 && y < o.y1) return true;
    }
    return false;
  }

  /** The region under (x, z) closest in height to y, or null. */
  function regionAt(x, z, y = null) {
    let best = null, bd = Infinity;
    for (const r of regions) {
      if (x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) continue;
      const h = r.h(x, z);
      const d = y === null ? 0 : Math.abs(h - y);
      if (d < bd) { bd = d; best = r; }
    }
    if (best && y !== null && bd > 0.9) return null;
    return best;
  }

  function standable(x, z, y) {
    const r = regionAt(x, z, y);
    if (!r) return null;
    const h = r.h(x, z);
    if (blocked(x, z, h)) return null;
    return { region: r, y: h };
  }

  /** Move from p by (dx, dz), sliding along walls. Mutates p ({x,y,z}); returns true if it moved. */
  function move(p, dx, dz) {
    let s = standable(p.x + dx, p.z + dz, p.y);
    if (s) { p.x += dx; p.z += dz; p.y = s.y; return true; }
    s = standable(p.x + dx, p.z, p.y);
    if (s && Math.abs(dx) > 1e-4) { p.x += dx; p.y = s.y; return true; }
    s = standable(p.x, p.z + dz, p.y);
    if (s && Math.abs(dz) > 1e-4) { p.z += dz; p.y = s.y; return true; }
    return false;
  }

  /** Row index for a point (stairs count as whichever end is nearer in height). */
  function rowOf(x, z, y) {
    const r = regionAt(x, z, y);
    if (!r) return Math.round(y / 3);
    if (r.kind === 'stairs') return Math.abs(y - rowY(r.row)) < 1.5 ? r.row : r.to;
    return r.row;
  }

  const laneZ = (r) => (r === top ? rowFront(r) - 1.6 : rowFront(r) - 1.4);
  const stairTo = (r) => town.stairs.find((s) => s.to === r);

  /** Waypoints [[x, z], ...] from a point to a target, threading the stair flights. */
  function route(from, to) {
    const a = rowOf(from.x, from.z, from.y), b = to.row ?? rowOf(to.x, to.z, to.y);
    const pts = [];
    if (b > a) {
      for (let r = a + 1; r <= b; r++) {
        const s = stairTo(r); if (!s) break;
        pts.push([s.x, laneZ(r - 1)], [s.x, rowFront(r) + 0.2], [s.x, laneZ(r)]);
      }
    } else if (b < a) {
      for (let r = a; r > b; r--) {
        const s = stairTo(r); if (!s) break;
        pts.push([s.x, laneZ(r)], [s.x, rowFront(r) + 0.2], [s.x, laneZ(r - 1)]);
      }
    }
    pts.push([to.x, to.z]);
    return pts;
  }

  /** Snap an arbitrary picked point onto walkable ground near it (same height band). */
  function snap(x, y, z) {
    let best = null, bd = Infinity;
    for (const r of regions) {
      const cx = clamp(x, r.x0 + 0.2, r.x1 - 0.2), cz = clamp(z, r.z0 + 0.2, r.z1 - 0.2);
      const h = r.h(cx, cz);
      const d = Math.hypot(cx - x, cz - z) + Math.abs(h - y) * 2.5;
      if (d < bd && !blocked(cx, cz, h)) { bd = d; best = { x: cx, y: h, z: cz, row: r.kind === 'stairs' ? (Math.abs(h - rowY(r.row)) < 1.5 ? r.row : r.to) : r.row }; }
    }
    return best;
  }

  function addObstacle(box, pad = 0) {
    obstacles.push({ x0: box.min.x - pad, x1: box.max.x + pad, z0: box.min.z - pad, z1: box.max.z + pad, y0: box.min.y, y1: box.max.y });
  }
  function addPost(x, z, y, r = 0.3, h = 4) {
    obstacles.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r, y0: y, y1: y + h });
  }

  return { regions, obstacles, regionAt, standable, move, route, rowOf, snap, laneZ, addObstacle, addPost, blocked };
}
