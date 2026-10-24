// Evening post: cypresses, olives and palms on the hillside around the town, instanced from the
// shared props. They fill the slopes the plane looks across and give the town its scale.
import * as THREE from 'three';

/** A height lookup over the town's flat-shaded hillside mesh (a regular 4 m grid). */
function hillHeights(mesh) {
  const P = mesh.geometry.attributes.position;
  let x0 = Infinity, z0 = Infinity;
  for (let i = 0; i < P.count; i++) { x0 = Math.min(x0, P.getX(i)); z0 = Math.min(z0, P.getZ(i)); }
  const cell = 4, map = new Map();
  for (let i = 0; i < P.count; i++) map.set(Math.round((P.getX(i) - x0) / cell) + ',' + Math.round((P.getZ(i) - z0) / cell), P.getY(i));
  const g = (i, j) => map.get(i + ',' + j);
  return (x, z) => {
    const fx = (x - x0) / cell, fz = (z - z0) / cell, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    const a = g(i, j), b = g(i + 1, j), c = g(i, j + 1), d = g(i + 1, j + 1);
    if ([a, b, c, d].some((q) => q === undefined)) return null;
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };
}

/**
 * Scatter trees outside the terraces. `avoid(x, z, top)` returns true when a tree there would
 * stand in the plane's way. Returns the instanced meshes (already in the scene).
 */
export function plantTrees({ scene, town, models, shadows, count = 360, avoid = () => false }) {
  const hill = town.group.getObjectByName('hillside');
  if (!hill) return [];
  hill.updateMatrixWorld(true);
  const H = hillHeights(hill);
  let s = 4242; const R = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const rowFront = town.rowFront, rows = town.rows;
  const hwOf = (r) => (r >= rows ? 20 : Math.ceil(Math.max(18, 56 - r * 5) / 10) * 10);
  // true inside the terraces, the summit plaza and the coast road
  const inTown = (x, z) => {
    if (z > rowFront(0) - 1) return true;
    for (let r = 0; r <= rows; r++) {
      const zf = rowFront(r), zb = zf - (r === rows ? 28 : 14);
      if (z <= zf + 1 && z >= zb - 1 && Math.abs(x) < hwOf(r) + 3) return true;
    }
    return false;
  };
  const kinds = [
    { m: models.cypress, w: 0.42, s: [0.9, 1.25], top: 8.5 },
    { m: models.cypress_small, w: 0.22, s: [0.85, 1.2], top: 5.6 },
    { m: models.olive, w: 0.3, s: [1.0, 1.6], top: 5 },
    { m: models.palm, w: 0.06, s: [0.9, 1.15], top: 7 },
  ];
  const picks = kinds.map(() => []);
  const zMin = rowFront(rows) - 60;
  let tries = 0;
  while (picks.reduce((n, p) => n + p.length, 0) < count && tries++ < count * 30) {
    const x = (R() * 2 - 1) * 150, z = zMin + R() * (rowFront(0) - zMin);
    if (inTown(x, z)) continue;
    // denser near the town, thinner far out on the slopes
    const edge = Math.abs(x) - hwOf(Math.max(0, Math.min(rows, Math.floor((rowFront(0) - z) / 14))));
    if (R() > 1.15 - Math.min(1, Math.max(0, edge) / 90)) continue;
    const y = H(x, z); if (y === null || y < 0.2) continue;
    let r = R(), k = 0; for (; k < kinds.length - 1; k++) { r -= kinds[k].w; if (r < 0) break; }
    if (k === 3 && z < rowFront(2)) k = 0; // palms stay low, near the sea; cypresses climb
    const sc = kinds[k].s[0] + R() * (kinds[k].s[1] - kinds[k].s[0]);
    if (avoid(x, z, y + kinds[k].top * sc)) continue;
    picks[k].push({ x, y: y - 0.15, z, sc, ry: R() * Math.PI * 2 });
  }
  const out = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), sv = new THREE.Vector3();
  kinds.forEach((kd, k) => {
    const list = picks[k];
    if (!list.length || !kd.m) return;
    kd.m.updateMatrixWorld(true);
    kd.m.traverse((o) => {
      if (!o.isMesh) return;
      const im = new THREE.InstancedMesh(o.geometry, o.material, list.length);
      list.forEach((t, i) => {
        q.setFromAxisAngle(up, t.ry); p.set(t.x, t.y, t.z); sv.setScalar(t.sc);
        m4.compose(p, q, sv).multiply(o.matrixWorld);
        im.setMatrixAt(i, m4);
      });
      im.castShadow = shadows; im.receiveShadow = shadows;
      im.computeBoundingSphere();
      scene.add(im); out.push(im);
    });
  });
  return out;
}
