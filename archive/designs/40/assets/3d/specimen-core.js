// Specimen No. 1 — the Albretsen lattice.
// A geodesic radiolarian built only from three.js primitives (cylinders, spheres,
// an icosahedron), after Haeckel's Circogonia icosahedra (1887).
// Pure geometry: pass in THREE and mergeGeometries so this file runs in the
// browser (live module, baked renders) and in Node (the .glb export).

export const SPECIMEN_COLORS = {
  brass: 0xcda047,
  brassDeep: 0x966626,
  eosin: 0xc444ac,
  core: 0xf3cee9,
};

function rng(seed) { // mulberry32, so the specimen is identical everywhere
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function rod(THREE, a, b, r0, r1 = r0, seg = 8) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1, true); // open: ends hide inside the nodes
  g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  g.applyQuaternion(q);
  g.translate(a.x, a.y, a.z);
  return g;
}
function ball(THREE, p, r, seg = 12) {
  const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg * 0.75 | 0));
  g.translate(p.x, p.y, p.z);
  return g;
}
// Minimal merge for indexed geometries with position/normal (+uv), so the module
// has no dependency on three/addons and loads straight from a CDN.
function mergeSimple(THREE, list) {
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3);
    const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[oi + i] = ia[i] + ov;
    ov += g.attributes.position.count; oi += ia.length; g.dispose();
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  m.setIndex(new THREE.BufferAttribute(idx, 1));
  return m;
}

/**
 * Returns { brass: BufferGeometry, beads: BufferGeometry, core: BufferGeometry, shell: BufferGeometry }
 * all centred on the origin, radius ~1.9 including spines.
 * mergeGeometries is optional (three/addons BufferGeometryUtils); a built-in merge is used otherwise.
 */
export function buildSpecimenGeometry(THREE, mergeGeometries, { detail = 2, quality = 1, seed = 0xf57ae7 } = {}) {
  if (!mergeGeometries) mergeGeometries = list => mergeSimple(THREE, list);
  const R = rng(seed);
  const seg = Math.round(6 + 4 * quality);
  const brass = [], beads = [];

  // 1. Geodesic lattice shell (the "test" of the radiolarian)
  const ico = new THREE.IcosahedronGeometry(1, detail);
  const pos = ico.attributes.position;
  const key = v => v.toArray().map(n => n.toFixed(4)).join(',');
  const verts = new Map();
  const ids = [];
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    const k = key(v);
    if (!verts.has(k)) verts.set(k, { v, id: verts.size });
    ids.push(verts.get(k).id);
  }
  const vlist = [...verts.values()].map(o => o.v);
  // Dual of the geodesic: one node per triangle centroid, joined across shared
  // edges. Gives Haeckel's hexagonal pores with 12 pentagons for the spines.
  const edgeFaces = new Map();
  const cents = [];
  for (let i = 0; i < ids.length; i += 3) {
    const t = [ids[i], ids[i + 1], ids[i + 2]];
    const f = cents.length;
    cents.push(new THREE.Vector3().add(vlist[t[0]]).add(vlist[t[1]]).add(vlist[t[2]]).normalize());
    for (let j = 0; j < 3; j++) {
      const a = Math.min(t[j], t[(j + 1) % 3]), b = Math.max(t[j], t[(j + 1) % 3]);
      const k = a + '_' + b;
      if (!edgeFaces.has(k)) edgeFaces.set(k, []);
      edgeFaces.get(k).push(f);
    }
  }
  for (const [, fs] of edgeFaces) {
    if (fs.length === 2) brass.push(rod(THREE, cents[fs[0]], cents[fs[1]], 0.017, 0.017, seg));
  }
  cents.forEach(v => brass.push(ball(THREE, v, 0.026, seg + 2)));

  // 2. Twelve radial spines from the icosahedron's vertices, each forking at the tip
  const base = new THREE.IcosahedronGeometry(1, 0).attributes.position;
  const seen = new Set();
  const up = new THREE.Vector3();
  for (let i = 0; i < base.count; i++) {
    const d = new THREE.Vector3().fromBufferAttribute(base, i).normalize();
    const k = key(d); if (seen.has(k)) continue; seen.add(k);
    const len = 1.62 + R() * 0.06;
    const a = d.clone().multiplyScalar(1.0), b = d.clone().multiplyScalar(len);
    brass.push(rod(THREE, a, b, 0.034, 0.011, seg));
    brass.push(ball(THREE, a, 0.05, seg + 2)); // collar where the spine meets the lattice
    // fork: three short tines splayed around the spine axis
    up.set(0, 1, 0); if (Math.abs(d.dot(up)) > 0.9) up.set(1, 0, 0);
    const t1 = new THREE.Vector3().crossVectors(d, up).normalize();
    const t2 = new THREE.Vector3().crossVectors(d, t1).normalize();
    const spin = R() * Math.PI * 2;
    for (let f = 0; f < 3; f++) {
      const ang = spin + f * Math.PI * 2 / 3;
      const side = t1.clone().multiplyScalar(Math.cos(ang)).add(t2.clone().multiplyScalar(Math.sin(ang)));
      const tip = b.clone().add(d.clone().multiplyScalar(0.2)).add(side.multiplyScalar(0.17));
      brass.push(rod(THREE, b, tip, 0.011, 0.005, seg));
      beads.push(ball(THREE, tip, 0.026, seg + 2));
    }
    beads.push(ball(THREE, b, 0.022, seg + 2));
  }

  // 2b. Inner radial beams from the core to the shell (Haeckel's 'radial bars')
  for (const k of seen) {
    const d = new THREE.Vector3(...k.split(',').map(Number)).normalize();
    brass.push(rod(THREE, d.clone().multiplyScalar(0.5), d.clone().multiplyScalar(0.985), 0.016, 0.02, seg));
  }

  // 3. Glass core and a faint inner shell
  const core = new THREE.IcosahedronGeometry(0.5, 4);
  const shell = new THREE.IcosahedronGeometry(0.97, 3);

  return {
    brass: mergeGeometries(brass, false),
    beads: mergeGeometries(beads, false),
    core,
    shell,
  };
}

/** Physically based materials tuned for the editorial grade. */
export function specimenMaterials(THREE, { glow = 0, transmission = true } = {}) {
  return {
    brass: new THREE.MeshPhysicalMaterial({ color: 0xdcb46a, metalness: 1, roughness: 0.15, clearcoat: 0.6, clearcoatRoughness: 0.12 }),
    beads: new THREE.MeshPhysicalMaterial({ color: SPECIMEN_COLORS.eosin, metalness: 0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, emissive: SPECIMEN_COLORS.eosin, emissiveIntensity: 0.1 + glow * 1.6 }),
    core: new THREE.MeshPhysicalMaterial({ color: 0xffd6ee, metalness: 0, roughness: 0.16, transmission: transmission ? 1 : 0, thickness: 0.9, ior: 1.5, attenuationColor: 0xc8409f, attenuationDistance: 0.55, clearcoat: 1, clearcoatRoughness: 0.04, emissive: SPECIMEN_COLORS.eosin, emissiveIntensity: (transmission ? 0.02 : 0.25) + glow * 0.9 }),
    shell: new THREE.MeshPhysicalMaterial({ color: 0xfff6e6, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }),
  };
}

export function buildSpecimen(THREE, mergeGeometries, opts = {}) {
  const g = buildSpecimenGeometry(THREE, mergeGeometries, opts);
  const m = specimenMaterials(THREE, opts);
  const group = new THREE.Group();
  group.name = 'Specimen No. 1';
  for (const k of ['brass', 'beads', 'core', 'shell']) {
    const mesh = new THREE.Mesh(g[k], m[k]);
    mesh.name = k; mesh.castShadow = k !== 'shell'; mesh.receiveShadow = k !== 'shell';
    group.add(mesh);
  }
  return group;
}

/**
 * A photographic studio for reflections: forest-green room, cream floor bounce,
 * long softboxes and a warm kicker. Feed to PMREMGenerator.fromScene().
 * Dark surroundings + bright strips is what makes the brass read as metal.
 */
export function studioEnvironment(THREE, { tint = 0x0e2a1d, warm = 0xffe2b0, key = 6 } = {}) {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true }));
  const pos = room.geometry.attributes.position, cols = [];
  const top = new THREE.Color(0x3b5546), mid = new THREE.Color(tint), bot = new THREE.Color(0xb9a888);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 20;
    const c = y > 0 ? mid.clone().lerp(top, y) : mid.clone().lerp(bot, Math.min(1, -y * 1.6));
    cols.push(c.r, c.g, c.b);
  }
  room.geometry.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  env.add(room);
  const box = (w, h, color, intensity, p) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...p); m.lookAt(0, 0, 0); env.add(m);
  };
  box(14, 3, 0xffffff, key, [-7, 9, 6]);          // key strip, top left
  box(3, 12, 0xfff4e4, key * 0.6, [10, 2, 4]);    // tall fill, right
  box(6, 2, warm, key * 0.7, [-4, 1, -11]);       // warm kicker, behind
  box(10, 10, 0xffffff, key * 0.27, [0, 14, 0]);  // overhead diffusion
  return env;
}

/**
 * Sun elevation (degrees) over Oslo for a Date, NOAA approximation.
 * Used by every time-of-day feature in this kit.
 */
export function sunOverNorway(date = new Date(), lat = 59.9139, lon = 10.7522) {
  const rad = Math.PI / 180;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const doy = (date.getTime() - start) / 864e5;
  const g = 2 * Math.PI / 365 * (doy - 1 + (date.getUTCHours() - 12) / 24);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const mins = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const tst = mins + eqt + 4 * lon;
  const ha = (tst / 4 - 180) * rad;
  const cosz = Math.sin(lat * rad) * Math.sin(decl) + Math.cos(lat * rad) * Math.cos(decl) * Math.cos(ha);
  const elevation = 90 - Math.acos(Math.max(-1, Math.min(1, cosz))) / rad;
  const azimuth = (Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat * rad) - Math.tan(decl) * Math.cos(lat * rad)) / rad + 180) % 360;
  let phase = 'natt';
  if (elevation > 12) phase = 'dag';
  else if (elevation > 0) phase = 'gulltime';
  else if (elevation > -8) phase = 'blåtime';
  return { elevation, azimuth, phase };
}
