// World layout for design 92: the coast road, the four stops, the ground.
// Coordinates: metres, +Y up, the sea toward +Z, the hill climbing toward -Z.
// The town itself comes from the shared kit's createTown (seed 7), whose row
// geometry is mirrored here so the ground, stops and walls line up with it.

export const TOWN = { seed: 7, rows: 6, halfWidth: 56, FRONT0: 9, ROW_D: 14, ROW_H: 3 };
export const rowFront = (r) => TOWN.FRONT0 - TOWN.ROW_D * r;
export const rowY = (r) => TOWN.ROW_H * r;
export const rowHalf = (r) => Math.max(18, TOWN.halfWidth - r * 5);

export const ROAD = {
  z: TOWN.FRONT0 + 4.8,       // centreline (matches createTown)
  y: 0.02,
  half: 3.2,                  // carriageway half width
  x0: -262, x1: 262,          // the pieces run between the two tunnel portals
  driveX: 246,                // the car is held inside +-driveX
  portalX: 256,
};
ROAD.laneE = ROAD.z + 1.6;    // eastbound (+X), the sea side
ROAD.laneW = ROAD.z - 1.6;    // westbound
ROAD.walkSea = ROAD.z + 4.15; // promenade (sea-side pavement)
ROAD.walkLand = ROAD.z - 4.2; // inland pavement

// One stop per product, in driving order (eastbound). x is the landmark centre.
export const STOPS = [
  { id: 'mcp-emails', lm: 'lm_mcpemails', x: -120, tint: '#d9a42b' },
  { id: 'fun-libs',   lm: 'lm_funlibs',   x: -37,  tint: '#f2b5b8', inTown: true },
  { id: 'toolrails',  lm: 'lm_toolrails', x: 31,   tint: '#a9c6e0', inTown: true },
  { id: 'harbor',     lm: 'lm_harbor',    x: 122,  tint: '#c8b6e2' },
];
export const LM_FRONT = 7.4;             // z of each landmark's street face
export const START = { x: -214, z: ROAD.laneE, heading: Math.PI / 2 };

// Sun azimuth: radians from +Z toward +X. The sun sets over the sea, ahead-right of an eastbound driver.
export const SUN_AZ = 1.05;

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x, z) => {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

// The kit's hillside (terraced rows + amphitheatre sides), without its noise.
function townH(x, z) {
  const { FRONT0, ROW_D, rows } = TOWN;
  const top = rows;
  const rowAt = (zz) => Math.floor((FRONT0 - zz) / ROW_D);
  const r = Math.min(rowAt(z), top + 2);
  const inRow = (FRONT0 - z) - r * ROW_D;
  const bank = Math.min(1, inRow / 3);
  let h = rowY(Math.max(0, r - 1)) + (rowY(r) - rowY(Math.max(0, r - 1))) * (bank * bank * (3 - 2 * bank));
  if (r > top) h = rowY(top) + (FRONT0 - z - top * ROW_D) * 0.32;
  const edge = r <= top ? (r === top ? 20 : Math.ceil(rowHalf(r) / 10) * 10) : 20;
  const out = Math.max(0, Math.abs(x) - edge - 4);
  h += Math.min(out, 40) * 0.13 + Math.max(0, out - 40) * 0.2;
  if (Math.abs(x) < edge + 1 && r <= top) h -= 0.6;
  return h;
}

/** Ground height: the town's terraces, a flat shelf by the road outside town, hills behind,
 *  and two headlands that the road tunnels through at either end. */
export function groundH(x, z) {
  const { FRONT0 } = TOWN;
  const ax = Math.abs(x);
  let h;
  if (z > FRONT0 + 9.8) h = -4 * Math.min(1, (z - FRONT0 - 9.8) / 6);
  else if (z > FRONT0) h = -0.4;
  else {
    const shelf = z > -14 ? -0.05 : Math.pow(-14 - z, 1.12) * 0.34 + (vnoise(x * 0.04, z * 0.04) - 0.5) * 6 * smooth(-14, -40, z);
    h = townH(x, z) + (shelf - townH(x, z)) * smooth(64, 86, ax);
    if (z < -14) h += (vnoise(x * 0.025 + 3, z * 0.03) - 0.4) * 5 * smooth(-14, -50, z) * smooth(60, 90, ax);
  }
  // headlands at both ends: the road runs into a cutting, then a portal
  const cliff = smooth(232, 262, ax) * (17 + vnoise(x * 0.08, z * 0.08) * 6) * (1 - smooth(38, 70, z));
  const corridor = 1 - smooth(5.6, 9.5, Math.abs(z - ROAD.z));          // keep the road open...
  const open = corridor * (1 - smooth(ROAD.portalX - 1, ROAD.portalX + 1, ax)); // ...until the portal
  if (cliff > 0.001) h = Math.max(h, cliff * (1 - open) + (-0.4) * open);
  return h;
}

/** Road surface height for cars and walkers on the carriageway / pavements. */
export function roadY(x, z) {
  if (Math.abs(z - ROAD.z) < 5.3) return ROAD.y;
  return groundH(x, z);
}
