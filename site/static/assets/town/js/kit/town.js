// Heure Bleue architecture kit: loader + seeded hillside town.
//
//   import * as THREE from 'three';
//   import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
//   import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
//   import { loadKit, createTown } from '<this folder>/town.js';
//
//   const kit = await loadKit({ THREE, GLTFLoader, MeshoptDecoder, base: '<this folder>/' });
//   const town = createTown({ THREE, kit, seed: 7 });
//   scene.add(town.group);
//   town.setNight(0.6);                 // 0 = all lights off .. 1 = every window lit
//   town.buildings[3].setLights(1);     // or drive one building yourself
//   town.buildings[3].object            // the placed Object3D (position, kind, name...)
//
// Coordinates: three.js metres, +Y up, the sea is toward +Z, the hill climbs toward -Z.
// Every building's windows use materials named emissive_window_1/2/3 (three groups so a
// building lights up in steps); signs, string lights and clock faces use emissive_sign,
// emissive_lamp_string and emissive_clock. loadKit() zeroes emissiveIntensity on all of
// them (the colour stays in material.emissive), and createTown() gives each placed
// building its own copies so lights switch per building.

export const KIT = {
  paris: ['paris_haussmann', 'paris_narrow', 'paris_pink', 'paris_powder', 'paris_rotunda'],
  med: ['med_cube_small', 'med_cube_stack', 'med_villa_tiled', 'med_house_gable', 'med_house_gable_mustard', 'med_tower_house'],
  civic: ['church', 'cafe', 'hotel', 'fountain', 'belvedere', 'town_gate'],
  walls: ['wall_retaining', 'wall_retaining_flowers', 'wall_low', 'stairs', 'stairs_wide'],
  roads: ['road_straight', 'road_curve', 'road_slope', 'road_coast', 'road_coast_curve', 'road_t'],
  terrain: ['terrace_block', 'terrain_slope', 'headland', 'hill_backdrop', 'rocks_coast'],
};
export const ALL = Object.values(KIT).flat();

// Footprints [x, z] in metres (incl. balconies/awnings), from manifest.json.
const FOOT = {
  paris_haussmann: [14.8, 12], paris_narrow: [9.3, 11], paris_pink: [12, 11], paris_powder: [12, 11.5],
  paris_rotunda: [11.3, 11.5], med_cube_small: [7, 7.4], med_cube_stack: [10, 8], med_villa_tiled: [11, 8.5],
  med_house_gable: [6.8, 9.2], med_house_gable_mustard: [6.8, 9.2], med_tower_house: [8.8, 8.4],
  church: [13.7, 16.5], cafe: [12.6, 13], hotel: [17, 15.5], belvedere: [9.5, 7.6],
};

/** Load the kit GLBs (all of them, or `names`). Returns { name: Object3D template }. */
export async function loadKit({ THREE, GLTFLoader, MeshoptDecoder, base = './', names = ALL, flat = true }) {
  const loader = new GLTFLoader();
  if (MeshoptDecoder) loader.setMeshoptDecoder(MeshoptDecoder);
  const kit = {};
  await Promise.all(names.map(async (n) => {
    const gltf = await loader.loadAsync(typeof base === 'function' ? base(n) : base + n + '.glb');   // albretsen.no: base may resolve each name
    const root = gltf.scene;
    root.name = n;
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (flat) m.flatShading = true;
        if (m.name.startsWith('emissive_')) {
          m.userData.emissiveOn = m.emissive.clone();
          m.emissiveIntensity = 0;
        }
      }
    });
    kit[n] = root;
  }));
  return kit;
}

/** Clone a kit piece; with ownLights the emissive_ materials are copied so this instance switches alone. */
export function place(kit, name, { ownLights = false } = {}) {
  const src = kit[name];
  if (!src) throw new Error('kit piece not loaded: ' + name);
  const obj = src.clone(true);
  const emissive = {};
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const swap = (m) => {
      if (!m.name.startsWith('emissive_')) return m;
      if (!ownLights) return m;
      if (!emissive[m.name]) { emissive[m.name] = m.clone(); emissive[m.name].userData.emissiveOn = m.userData.emissiveOn; }
      return emissive[m.name];
    };
    o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
  });
  obj.userData.kit = name;
  return { object: obj, emissive };
}

function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// A hillside that wraps the terraces: grassy banks between rows, rising into an amphitheatre at the
// sides and behind, dropping under the sea in front. Flat-shaded, coloured per triangle.
function groundMesh(THREE, { R, rows, rowFront, rowY, rowHalf, ROW_D, FRONT0, halfWidth }) {
  const W = 190, zFront = FRONT0 + 30, zBack = rowFront(rows) - ROW_D * 3, cell = 4;
  const nx = Math.round((2 * W) / cell), nz = Math.round((zFront - zBack) / cell);
  const top = rows; // summit plaza row
  const rowAt = (z) => Math.floor((FRONT0 - z) / ROW_D);
  const hash = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
  const H = (x, z) => {
    if (z > FRONT0 + 9.5) return -4 * Math.min(1, (z - FRONT0 - 9.5) / 6);         // shore drops into the bay
    if (z > FRONT0) return -0.4;                                                        // under the coast road
    const r = Math.min(rowAt(z), top + 2);
    const inRow = (FRONT0 - z) - r * ROW_D;                                          // 0 at row front .. ROW_D
    const bank = Math.min(1, inRow / 3);                                             // grassy bank up from the row below
    let h = rowY(r - 1 < 0 ? 0 : r - 1) + (rowY(r) - rowY(Math.max(0, r - 1))) * (bank * bank * (3 - 2 * bank));
    if (r > top) h = rowY(top) + (FRONT0 - z - top * ROW_D) * 0.32;                   // the slope behind the church
    const edge = r <= top ? (r === top ? 20 : Math.ceil(rowHalf(r) / 10) * 10) : 20;
    const out = Math.max(0, Math.abs(x) - edge - 4);
    h += Math.min(out, 40) * 0.13 + Math.max(0, out - 40) * 0.2;                       // gentle amphitheatre sides
    if (Math.abs(x) < edge + 1 && r <= top) h -= 0.6;                                // tuck under the terraces
    return h + (hash(Math.round(x), Math.round(z)) - 0.5) * 0.5 * Math.min(1, out / 6);
  };
  const pos = [], col = [];
  const cGrass = [new THREE.Color('#9aa274'), new THREE.Color('#8e9a6c'), new THREE.Color('#a7ab7c')];
  const cGrassDark = new THREE.Color('#86915f'), cEarth = new THREE.Color('#d9b8a0'), cRock = new THREE.Color('#c99f8b');
  const v = (i, j) => { const x = -W + i * cell, z = zBack + j * cell; return [x, H(x, z), z]; };
  const n = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const p00 = v(i, j), p10 = v(i + 1, j), p01 = v(i, j + 1), p11 = v(i + 1, j + 1);
    for (const tri of [[p00, p01, p11], [p00, p11, p10]]) {
      a.fromArray(tri[1]).sub(b.fromArray(tri[0])); n.fromArray(tri[2]).sub(b); n.cross(a).normalize();
      if (n.y < 0) n.negate();
      const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cz = (tri[0][2] + tri[1][2] + tri[2][2]) / 3;
      const c = tri[0][1] < -0.5 ? cRock : n.y < 0.45 ? cEarth : n.y < 0.9 ? cGrassDark : cGrass[Math.floor(hash(Math.round(cx / 8), Math.round(cz / 8)) * 3)];
      for (const p of tri) { pos.push(...p); col.push(c.r, c.g, c.b); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  m.name = 'hillside'; m.receiveShadow = true;
  return m;
}

/**
 * Merge every non-emissive mesh under `root` into one mesh per material name (one draw call each).
 * Emissive meshes stay where they are, so per-building lights keep working.
 * Returns the merged meshes (already added to root).
 */
export function mergeStatic(THREE, root) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const buckets = new Map();
  const drop = [];
  root.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || o.userData.noMerge) return;
    if (o.material.name.startsWith('emissive_') || o.material.vertexColors) return;
    const key = o.material.name || o.material.uuid;
    if (!buckets.has(key)) buckets.set(key, { material: o.material, parts: [] });
    buckets.get(key).parts.push({ g: o.geometry, m: new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld) });
    drop.push(o);
  });
  const out = [];
  const nm = new THREE.Matrix3();
  for (const [key, { material, parts }] of buckets) {
    let nv = 0, ni = 0;
    for (const { g } of parts) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let ov = 0, oi = 0;
    for (const { g, m } of parts) {
      const P = g.attributes.position, N = g.attributes.normal;
      nm.getNormalMatrix(m);
      // Vector3.applyMatrix4 / applyMatrix3 + normalize written out (same operations in the same
      // order, so the same numbers), without a Vector3 and a temporary array per vertex
      const e = m.elements, n = nm.elements;
      for (let i = 0, o = ov * 3; i < P.count; i++, o += 3) {
        let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
        const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
        pos[o] = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
        pos[o + 1] = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
        pos[o + 2] = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
        if (N) {
          const a = N.getX(i), b = N.getY(i), c = N.getZ(i);
          x = n[0] * a + n[3] * b + n[6] * c; y = n[1] * a + n[4] * b + n[7] * c; z = n[2] * a + n[5] * b + n[8] * c;
          const k = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
          nor[o] = x * k; nor[o + 1] = y * k; nor[o + 2] = z * k;
        }
      }
      if (g.index) { const I = g.index.array; for (let i = 0; i < g.index.count; i++) idx[oi + i] = I[i] + ov; }
      else for (let i = 0; i < P.count; i++) idx[oi + i] = ov + i;
      ov += P.count; oi += g.index ? g.index.count : P.count;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = 'merged_' + key; mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh); out.push(mesh);
  }
  for (const o of drop) o.removeFromParent();
  return out;
}

/** Light handle for one placed building. */
function lightHandle(obj, emissive, threshold) {
  const groups = Object.keys(emissive).sort();
  const h = {
    object: obj, name: obj.userData.kit, kind: obj.userData.kind, threshold, level: 0,
    materials: emissive,
    /** v: 0 = dark .. 1 = all windows lit. Window groups come on one after another. */
    setLights(v, intensity = 1) {
      h.level = v;
      for (const n of groups) {
        const m = emissive[n];
        let k;
        if (n === 'emissive_window_1') k = smooth(0.0, 0.35, v);
        else if (n === 'emissive_window_2') k = smooth(0.3, 0.65, v);
        else if (n === 'emissive_window_3') k = smooth(0.6, 0.95, v);
        else k = smooth(0.05, 0.25, v); // signs, string lights, clocks come on early
        m.emissiveIntensity = k * intensity;
      }
    },
  };
  return h;
}

/**
 * Lay out a hillside town. Rows of terraces climb toward -Z; whitewashed houses near the shore,
 * Paris blocks higher up, a church on top, the hotel and café on the coast road.
 * Options: seed, rows (5), halfWidth (48), headland (true), backdrop (true), coastRoad (true).
 * Returns { group, buildings, rows, lanes, stairs, gaps, road, setNight(n), dispose() }.
 */
export function createTown({ THREE, kit, seed = 1, rows = 6, halfWidth = 56, headland = true, backdrop = true, coastRoad = true, ground = true, merge = true }) {
  const R = rng(seed);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const group = new THREE.Group();
  group.name = 'town';
  const buildings = [], lanes = [], stairsOut = [], gaps = [];
  const ROW_D = 14, ROW_H = 3, BLOCK = 10;
  const FRONT0 = 9;                    // front edge (z) of row 0
  const rowFront = (r) => FRONT0 - ROW_D * r;
  const rowY = (r) => ROW_H * r;
  const rowHalf = (r) => Math.max(18, halfWidth - r * 5);

  const put = (name, x, y, z, ry = 0, ownLights = false) => {
    const { object, emissive } = place(kit, name, { ownLights });
    object.position.set(x, y, z); object.rotation.y = ry;
    group.add(object);
    return { object, emissive };
  };

  // ---------------------------------------------------------------- terraces
  for (let r = 0; r < rows; r++) {
    const hw = Math.ceil(rowHalf(r) / BLOCK) * BLOCK;
    for (let x = -hw + BLOCK / 2; x < hw; x += BLOCK) put('terrace_block', x, rowY(r), rowFront(r) - ROW_D / 2);
    lanes.push({ row: r, y: rowY(r) + 0.05, z: rowFront(r) - 1.8, x0: -hw, x1: hw });
  }
  // the summit plaza for the church
  const topR = rows;
  const topHalf = 20;
  for (let x = -topHalf + BLOCK / 2; x < topHalf; x += BLOCK) {
    put('terrace_block', x, rowY(topR), rowFront(topR) - ROW_D / 2);
    put('terrace_block', x, rowY(topR), rowFront(topR) - ROW_D * 1.5);
  }

  // ---------------------------------------------------------------- stairs between rows
  // one flight per row boundary, alternating sides, a wide flight up the middle to the church
  const stairX = [];
  for (let r = 1; r <= rows; r++) {
    const wide = r === rows;
    const hw = rowHalf(r) - 8;
    const x = wide ? 0 : Math.round(((r % 2 ? -1 : 1) * (0.25 + R() * 0.45) * hw) / 2) * 2;
    const name = wide ? 'stairs_wide' : 'stairs';
    // flight sits on row r-1, climbing toward row r's front edge
    put(name, x, rowY(r - 1), rowFront(r) + 2.7);
    stairX.push({ row: r - 1, x, w: wide ? 7.5 : 4.2 });
    stairsOut.push({ from: r - 1, to: r, x, bottom: [x, rowY(r - 1), rowFront(r) + 5.4], top: [x, rowY(r), rowFront(r) - 1] });
  }

  // ---------------------------------------------------------------- buildings
  const pools = (r) => {
    if (r === 0) return ['med_cube_small', 'med_house_gable', 'med_villa_tiled', 'med_house_gable_mustard', 'med_cube_stack'];
    if (r === 1) return ['med_cube_stack', 'med_tower_house', 'med_villa_tiled', 'med_house_gable', 'med_cube_small', 'med_house_gable_mustard'];
    if (r === 2) return ['paris_haussmann', 'paris_narrow', 'paris_powder', 'paris_pink'];
    if (r === 3) return ['paris_pink', 'paris_narrow', 'med_tower_house', 'paris_powder', 'med_villa_tiled'];
    return ['med_tower_house', 'med_cube_stack', 'med_villa_tiled', 'med_house_gable_mustard', 'med_cube_small'];
  };
  const blocked = (r, x0, x1) => stairX.some((s) => s.row === r && x1 > s.x - s.w / 2 && x0 < s.x + s.w / 2)
    || (r > 0 && stairX.some((s) => s.row === r - 1 && x1 > s.x - s.w / 2 && x0 < s.x + s.w / 2 && false));

  const addBuilding = (name, x, r, zFrontInset = 3.0, ry = 0) => {
    const [fw, fd] = FOOT[name];
    const z = rowFront(r) - zFrontInset - fd / 2;
    const { object, emissive } = put(name, x, rowY(r), z, ry, true);
    object.userData.kind = name.split('_')[0];
    const h = lightHandle(object, emissive, 0.1 + R() * 0.8);
    h.row = r;
    buildings.push(h);
    return h;
  };

  // landmark slots first
  const reserved = [];
  if (coastRoad) {
    reserved.push({ r: 0, x: 8, name: 'hotel', inset: 0.6 });
    reserved.push({ r: 0, x: -14, name: 'cafe', inset: 0.4 });
  }
  if (rows >= 4) reserved.push({ r: 2, x: -rowHalf(2) + 9, name: 'paris_rotunda', inset: 2.2, ry: 0 });
  const taken = Array.from({ length: rows }, () => []);
  for (const s of reserved) {
    const [fw] = FOOT[s.name];
    taken[s.r].push([s.x - fw / 2, s.x + fw / 2]);
    addBuilding(s.name, s.x, s.r, s.inset, s.ry || 0);
  }
  const free = (r, a, b) => !taken[r].some(([c, d]) => b > c - 0.6 && a < d + 0.6) && !blocked(r, a, b);

  for (let r = 0; r < rows; r++) {
    const hw = Math.ceil(rowHalf(r) / BLOCK) * BLOCK - 0.5;
    let x = -hw;
    let guard = 0;
    while (x < hw && guard++ < 80) {
      const parisZone = (r === 2 || r === 3) && Math.abs(x + 5) > 30;
      const name = pick(parisZone ? pools(r === 2 ? 1 : 4) : pools(r));
      const [fw] = FOOT[name];
      const a = x, b = x + fw;
      if (b > hw) {
        if (hw - x > 3) gaps.push({ row: r, x: (x + hw) / 2, y: rowY(r), z: rowFront(r) - 5, w: hw - x });
        break;
      }
      if (!free(r, a, b)) {
        // skip past the obstacle
        const obst = [...taken[r].map(([c, d]) => [c, d]), ...stairX.filter((s) => s.row === r).map((s) => [s.x - s.w / 2, s.x + s.w / 2])]
          .filter(([c, d]) => b > c - 0.6 && a < d + 0.6).sort((p, q) => q[1] - p[1])[0];
        const nx = obst ? obst[1] + 0.8 : x + 1;
        if (nx - x > 3) gaps.push({ row: r, x: (x + nx) / 2, y: rowY(r), z: rowFront(r) - 5, w: nx - x });
        x = nx;
        continue;
      }
      addBuilding(name, x + fw / 2, r, 2.6 + R() * 1.2, (R() - 0.5) * 0.05);
      taken[r].push([a, b]);
      const gap = 0.4 + R() * (r < 2 ? 3.2 : 1.2);
      if (gap > 2.2) gaps.push({ row: r, x: b + gap / 2, y: rowY(r), z: rowFront(r) - 6, w: gap });
      x = b + gap;
    }
  }
  // the church crowns the hill
  const church = addBuilding('church', 0, topR, 1.2, 0);
  church.object.position.z = rowFront(topR) - 1.2 - FOOT.church[1] / 2 - 2;
  church.object.position.x = -2;

  // low garden walls along the lanes, in front of some houses
  for (const b of buildings) {
    if (b.kind !== 'med' || R() < 0.45) continue;
    const p = b.object.position;
    const { object } = put('wall_low', p.x + (R() - 0.5) * 3, p.y, rowFront(b.row) - 2.7);
    object.rotation.y = 0;
  }

  // ---------------------------------------------------------------- coast road
  let road = null;
  if (coastRoad) {
    const zc = FRONT0 + 4.75 + 0.05;     // road centreline (sidewalk edge meets the row-0 front)
    const hw = Math.ceil((halfWidth + 30) / 10) * 10;
    for (let x = -hw + 5; x < hw; x += 10) {
      const { object } = put('road_coast', x, 0, zc);
      object.rotation.y = -Math.PI / 2; // travel along X, sea wall toward +Z
    }
    road = { y: 0, z: zc, x0: -hw, x1: hw, lanes: [zc - 1.6, zc + 1.6] };
    // the town gate spans the coast road where it enters town
    const { object: gate, emissive } = put('town_gate', -halfWidth - 16, 0, zc, -Math.PI / 2, true);
    gate.userData.kind = 'civic';
    const gh = lightHandle(gate, emissive, 0.05); gh.row = 0; buildings.push(gh);
    road.gate = [gate.position.x, 0, zc];
  }

  // plaza fountain beside the church, and a belvedere in the widest high gap
  const plaza = { x: -13, y: rowY(topR), z: rowFront(topR) - 5.5 };
  put('fountain', plaza.x, plaza.y, plaza.z);
  const high = gaps.filter((g) => g.row >= 3 && g.w >= 9.6).sort((a, b) => b.w - a.w)[0];
  let belvedere = null;
  if (high) {
    const { object } = put('belvedere', high.x, rowY(high.row), rowFront(high.row) - 4.6);
    belvedere = object;
    gaps.splice(gaps.indexOf(high), 1);
  }

  // ---------------------------------------------------------------- landscape
  if (ground) group.add(groundMesh(THREE, { R, rows, rowFront, rowY, rowHalf, ROW_D, FRONT0, halfWidth }));
  if (backdrop) {
    const back = rowFront(topR) - ROW_D * 2;
    const { object } = put('hill_backdrop', 0, rowY(topR) - 4, back - 50);
    object.scale.set(1.5, 1, 1);
  }
  if (headland) {
    const { object } = put('headland', -halfWidth - 150, 0, 120);
    object.rotation.y = 0.35;
    put('rocks_coast', -halfWidth - 26, 0, 26);
    put('rocks_coast', halfWidth + 34, 0, 30, 1.7);
  }

  const merged = merge ? mergeStatic(THREE, group) : [];

  // ---------------------------------------------------------------- lights
  const sorted = [...buildings].sort((a, b) => a.threshold - b.threshold);
  function setNight(n) {
    for (const b of buildings) {
      // each building starts at its threshold and fills up over the next 40% of the night
      b.setLights(smooth(b.threshold * 0.75, b.threshold * 0.75 + 0.45, n));
    }
  }
  setNight(0);

  return {
    group, buildings, lanes, stairs: stairsOut, gaps, road, plaza, belvedere, rows, rowFront, rowY, merged,
    setNight,
    /** Buildings in the order they light up as night falls. */
    order: sorted,
    dispose() {
      group.traverse((o) => { if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => m.name.startsWith('emissive_') && m.dispose()); } });
      for (const m of merged) m.geometry.dispose();
      group.getObjectByName('hillside')?.geometry.dispose();
      group.removeFromParent();
    },
  };
}
