// Evening post: the round. A hand-laid route over the town (in from the bay, along three
// terraces, through a gap below the church, round the bell tower and down to the sea), lifted
// over the roofs by the height field, with rings of light and the windows that get letters.
import * as THREE from 'three';

// [x, y, z] control points. y is a wish: the height field lifts it over anything in the way.
const ROUTE = [
  [30, 15, 92], [36, 14, 52], [42, 13, 18], [44, 13, 2], [34, 13, -4.2], [20, 14, -4.2],
  [4, 15, -4.2], [-12, 12, -3.2], [-30, 12, -3.6], [-48, 13, -4], [-60, 14, -7], [-67, 17, -14],
  [-58, 20, -16.2], [-37, 20, -15.8], [-18, 20, -15.6], [0, 20, -15.6], [20, 20, -15.6], [38, 19, -16.5],
  [50, 21, -21], [55, 24, -33], [46, 25, -46.2], [30, 24, -46.2], [14, 24, -46.2], [2, 24, -46.2],
  [-8, 23, -52], [-3.5, 21, -61], [-1.2, 21, -68], [2, 23, -75], [13, 25, -81], [17, 28, -93],
  [6, 31, -104], [-9, 32, -104], [-19, 31, -93], [-20, 29, -80], [-17, 27, -67], [-13, 22, -54],
  [-12, 21, -40], [-20.5, 16, -27], [-17, 14, -14], [-13, 12, -3], [-7, 9, 18], [6, 8, 46], [22, 9, 78], [38, 10, 112],
];

export function buildCourse(world) {
  const { HF, houses, landmarks } = world;
  const curve = new THREE.CatmullRomCurve3(ROUTE.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const len = curve.getLength();
  const N = Math.ceil(len);
  const pts = curve.getSpacedPoints(N);
  // lift over the roofs (clearance grows with how tall the obstacle is)
  for (const p of pts) {
    const top = Math.max(HF.at(p.x, p.z), HF.at(p.x + 1.5, p.z), HF.at(p.x - 1.5, p.z), HF.at(p.x, p.z + 1.5), HF.at(p.x, p.z - 1.5));
    p.y = Math.max(p.y, top + 3.2);
  }
  // limit slope: forward and backward passes, only ever lifting
  const ds = len / N, slope = 0.42;
  for (let k = 0; k < 2; k++) {
    for (let i = 1; i < pts.length; i++) pts[i].y = Math.max(pts[i].y, pts[i - 1].y - slope * ds);
    for (let i = pts.length - 2; i >= 0; i--) pts[i].y = Math.max(pts[i].y, pts[i + 1].y - slope * ds);
  }
  // soften
  for (let k = 0; k < 6; k++) {
    const y = pts.map((p) => p.y);
    for (let i = 2; i < pts.length - 2; i++) pts[i].y = Math.max(y[i], (y[i - 2] + y[i - 1] * 2 + y[i] * 2 + y[i + 1] * 2 + y[i + 2]) / 8);
  }
  const path = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
  const length = path.getLength();
  const samples = path.getSpacedPoints(Math.ceil(length));
  const tangents = samples.map((_, i) => samples[Math.min(i + 1, samples.length - 1)].clone().sub(samples[Math.max(i - 1, 0)]).normalize());

  // ---------------- deliveries: house windows that face the route, and the four landmarks
  const nearestS = (p) => { let best = 0, bd = 1e9; for (let i = 0; i < samples.length; i += 1) { const d = samples[i].distanceToSquared(p); if (d < bd) { bd = d; best = i; } } return [best, Math.sqrt(bd)]; };
  const targets = [];
  const facePoint = (box, base, pathY) => new THREE.Vector3((box.min.x + box.max.x) / 2, THREE.MathUtils.clamp(pathY - 3.5, base + 3.5, box.max.y - 2.5), box.max.z - 0.4);
  for (const lm of landmarks) {
    const p = new THREE.Vector3((lm.box.min.x + lm.box.max.x) / 2, lm.box.min.y + (lm.box.max.y - lm.box.min.y) * 0.45, lm.box.max.z + 0.2);
    const [s, d] = nearestS(p);
    targets.push({ kind: 'product', id: lm.id, lm, pos: p, s, d });
  }
  const cand = [];
  for (const h of houses) {
    const probe = new THREE.Vector3((h.box.min.x + h.box.max.x) / 2, h.base + 8, h.box.max.z);
    const [s, d0] = nearestS(probe);
    const p = facePoint(h.box, h.base, samples[s].y);
    const d = samples[s].distanceTo(p);
    // the window must face the route (route in front of it) and be close enough to throw at
    if (samples[s].z < h.box.max.z - 1 || d > 11.5) continue;
    cand.push({ kind: 'letter', house: h, pos: p, s, d });
  }
  cand.sort((a, b) => a.s - b.s);
  for (const c of cand) {
    if (targets.some((t) => Math.abs(t.s - c.s) < 13)) continue;
    targets.push(c);
  }
  targets.sort((a, b) => a.s - b.s);

  // ---------------- rings of light, spaced along the route away from the deliveries
  const rings = [];
  for (let s = 26; s < samples.length - 40; s += 4) {
    if (rings.length && s - rings[rings.length - 1].s < 30) continue;
    if (targets.some((t) => Math.abs(t.s - s) < 9)) continue;
    rings.push({ s, pos: samples[s].clone(), dir: tangents[s].clone() });
  }
  // the last one is the big sun gate over the bay
  const endS = samples.length - 12;
  const gate = { s: endS, pos: samples[endS].clone(), dir: tangents[endS].clone(), gate: true };
  rings.push(gate);

  return { path, samples, tangents, length: samples.length - 1, targets, rings };
}
