// Living Town: the place. A seeded hillside town from the shared kit, with its waterfront row
// rebuilt by hand: six homes, the café and four product landmarks facing a promenade above the bay.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { loadKit, createTown, place, mergeStatic } from './kit/town.js';
import { model } from './content.js';

// every model has a fingerprinted URL of its own (see content.js)
const ARCH = (n) => model('architecture/' + n);

// ------------------------------------------------------------------ layout (metres)
export const FRONT = 8.6;        // building fronts
export const RAIL_Z = 25.6;      // promenade railing (sea side)
export const ESP = { x0: -62, x1: 62, z0: 9, z1: RAIL_Z + 0.35 };
export const LANE_FRONT = 10.9, LANE_PROM = 19.6;

// The waterfront row, left to right. kind: home | cafe | landmark
export const FRONTAGE = [
  { id: 'home_cyc', piece: 'med_cube_small', x: -44.5, kind: 'home', label: 'the blue door' },
  { id: 'home_old', piece: 'med_house_gable', x: -35.5, kind: 'home', label: 'the gabled house' },
  { id: 'harbor', piece: 'lm_harbor', x: -25.5, kind: 'landmark', product: 'harbor' },
  { id: 'home_jog', piece: 'med_cube_small', x: -15.6, kind: 'home', label: 'the white cube' },
  { id: 'cafe', piece: 'cafe', x: -5.0, kind: 'cafe' },
  { id: 'mcp', piece: 'lm_mcpemails', x: 6.4, kind: 'landmark', product: 'mcp-emails' },
  { id: 'home_fam', piece: 'med_house_gable_mustard', x: 14.2, kind: 'home', label: 'the mustard house' },
  { id: 'funlibs', piece: 'lm_funlibs', x: 22.0, kind: 'landmark', product: 'fun-libs' },
  { id: 'toolrails', piece: 'lm_toolrails', x: 30.4, kind: 'landmark', product: 'toolrails' },
  { id: 'home_dog', piece: 'med_tower_house', x: 39.6, kind: 'home', label: 'the tower house' },
  { id: 'home_bld', piece: 'med_house_gable', x: 48.6, kind: 'home', label: 'the end house' },
];

// Props on the promenade: [piece, x, z, rotY]
const BENCHES = [[-36, 22.7], [-27.5, 22.7], [-13.5, 22.7], [13.5, 22.7], [25.5, 22.7], [41, 22.7]];
const LAMPS = [-48, -38, -28, -18, -8, 2, 12, 22, 32, 42, 52];
const TABLES = [[-9.6, 12.9], [-6.0, 12.9], [-2.4, 12.9], [-9.6, 15.9], [-6.0, 15.9], [-2.4, 15.9]];
export const DANCE = { x: 6.2, z: 17.6 };
export const FOUNTAIN = { x: -23.5, z: 16.0 };
export const KIOSK = { x: 44.4, z: 15.8 };   // east end, clear of the workshop

export async function buildTown({ seed = 7, lite = false, onProgress = () => {} } = {}) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const kitNames = ['terrace_block', 'stairs', 'stairs_wide', 'wall_low', 'church', 'cafe', 'hotel', 'fountain', 'belvedere',
    'paris_haussmann', 'paris_narrow', 'paris_pink', 'paris_powder', 'paris_rotunda',
    'med_cube_small', 'med_cube_stack', 'med_villa_tiled', 'med_house_gable', 'med_house_gable_mustard', 'med_tower_house',
    'hill_backdrop'];
  const propNames = ['lm_mcpemails', 'lm_funlibs', 'lm_toolrails', 'lm_harbor', 'lamp_paris', 'bench', 'cafe_table', 'cafe_chair',
    'parasol', 'parasol_mustard', 'parasol_closed', 'string_lights', 'fountain', 'kiosk', 'palm', 'palm_tall', 'cypress', 'cypress_small',
    'olive', 'planter_pot', 'planter_box', 'planter_versailles', 'bougainvillea_bush', 'bougainvillea_wall', 'poster_column'];
  let done = 0; const total = kitNames.length + propNames.length;
  const tick = () => onProgress(++done / total);

  const kitP = loadKit({ THREE, GLTFLoader, MeshoptDecoder, base: ARCH, names: kitNames }).then((k) => { done += kitNames.length - 1; tick(); return k; });
  const props = {};
  await Promise.all([kitP, ...propNames.map(async (n) => {
    const g = await loader.loadAsync(model('props/' + n));
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      for (const m of [].concat(o.material)) {
        if (m.name && m.name.startsWith('emissive_')) { m.userData.glow = m.emissive.clone(); m.emissiveIntensity = 0; }
      }
    });
    props[n] = g.scene; tick();
  })]);
  const kit = await kitP;

  const town = createTown({ THREE, kit, seed, rows: lite ? 5 : 6, coastRoad: false, merge: false, headland: false, backdrop: true });
  const root = new THREE.Group(); root.name = 'world';
  root.add(town.group);

  // clear the waterfront row: we rebuild it by hand
  const x0 = -52, x1 = 54;
  town.buildings = town.buildings.filter((b) => {
    const p = b.object.position;
    const drop = b.row === 0 && p.x > x0 - 6 && p.x < x1 + 6;
    if (drop) b.object.removeFromParent();
    return !drop;
  });
  for (const o of [...town.group.children]) {
    if (o.userData.kit === 'wall_low' && o.position.z > 2 && o.position.x > x0 && o.position.x < x1) o.removeFromParent();
  }

  // ---------------------------------------------------------------- promenade slab, railing
  root.add(makeEsplanade());

  // ---------------------------------------------------------------- the waterfront row
  const front = new THREE.Group(); front.name = 'frontage';
  root.add(front);
  const sites = {};
  for (const f of FRONTAGE) {
    let obj, emissive = {};
    if (f.piece.startsWith('lm_')) {
      obj = props[f.piece].clone(true);
      remat(obj, emissive);
    } else {
      ({ object: obj, emissive } = place(kit, f.piece, { ownLights: true }));
    }
    const box = new THREE.Box3().setFromObject(obj);
    obj.position.set(f.x - (box.min.x + box.max.x) / 2, 0, FRONT - box.max.z);
    front.add(obj);
    obj.updateMatrixWorld(true);
    const wbox = new THREE.Box3().setFromObject(obj);
    sites[f.id] = { ...f, object: obj, emissive, box: wbox, door: new THREE.Vector3(f.x, 0, FRONT + 0.55), level: 0, target: 0 };
  }

  // landmark screens get a canvas each (drawn by ui/screens.js)
  for (const s of Object.values(sites)) {
    if (s.kind !== 'landmark') continue;
    const screen = s.object.getObjectByName('screen');
    if (!screen) continue;
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 288;
    const tex = new THREE.CanvasTexture(canvas);
    tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    screen.traverse((o) => {
      if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.5, 1.5, 1.5) }); o.userData.noMerge = true; }
    });
    s.screen = { canvas, tex, ctx: canvas.getContext('2d') };
  }

  // ---------------------------------------------------------------- street furniture
  const furn = new THREE.Group(); furn.name = 'furniture';
  root.add(furn);
  const put = (n, x, z, ry = 0, s = 1, parent = furn) => {
    const o = props[n].clone(true); o.position.set(x, 0, z); o.rotation.y = ry; o.scale.setScalar(s); parent.add(o); return o;
  };
  const benches = BENCHES.map(([x, z]) => ({ x, z, obj: put('bench', x, z, 0) }));

  const lamps = LAMPS.map((x, i) => {
    const o = put('lamp_paris', x, RAIL_Z - 0.75);
    const mats = {};
    remat(o, mats);
    return { x, z: RAIL_Z - 0.75, obj: o, mats: Object.values(mats), level: 0, order: i };
  });

  // café terrace on the promenade
  const chairs = [];
  const parasols = [];
  TABLES.forEach(([x, z], i) => {
    put('cafe_table', x, z);
    chairs.push({ x: x - 0.72, z, face: Math.PI / 2, table: i, obj: put('cafe_chair', x - 0.72, z, -Math.PI / 2) });
    chairs.push({ x: x + 0.72, z, face: -Math.PI / 2, table: i, obj: put('cafe_chair', x + 0.72, z, Math.PI / 2) });
    if (z > 14) {
      const open = put(i % 2 ? 'parasol_mustard' : 'parasol', x, z);
      const closed = put('parasol_closed', x, z);
      parasols.push({ open, closed, k: 1, order: i });
    }
  });

  // string lights over the little dance floor
  const strings = [];
  for (const dz of [-2.6, 2.6]) {
    const o = put('string_lights', DANCE.x, DANCE.z + dz);
    const mats = {};
    remat(o, mats);
    strings.push({ obj: o, mats: Object.values(mats) });
  }
  const kiosk = put('kiosk', KIOSK.x, KIOSK.z);
  const kioskMats = {};
  remat(kiosk, kioskMats);
  put('fountain', FOUNTAIN.x, FOUNTAIN.z);
  put('poster_column', -31.5, 13.4);
  // greenery
  put('palm_tall', -32.2, 23.4, 0.4); put('palm', -2.2, 23.6, 2.6); put('palm_tall', 19.4, 23.4, 1.2); put('palm', 36.4, 23.5, -0.6);
  put('palm', -52.5, 23.4, 1.9); put('palm_tall', 47.5, 23.5, 2.2);
  put('olive', -19.4, 12.6, 0.5); put('olive', -40.0, 12.6, 2.1);
  put('cypress_small', -49.6, 9.6); put('cypress', 53.6, 8.4); put('cypress_small', 9.8, 9.4, 0.3);
  const planters = [put('planter_pot', -38.6, 9.7), put('planter_pot', -32.4, 9.7), put('planter_box', -35.5, 9.4)];
  put('planter_versailles', 1.6, 9.9); put('planter_versailles', -11.6, 9.9);
  put('planter_box', 12.0, 9.4); put('planter_box', 16.4, 9.4);
  put('bougainvillea_bush', -47.6, 9.8, 0.3); put('bougainvillea_bush', 43.7, 9.8, 1.4); put('bougainvillea_bush', -20.6, 9.7, 2.2);
  put('planter_pot', 25.8, 9.7); put('planter_pot', 34.5, 9.7);

  // ---------------------------------------------------------------- merge the static town
  town.group.updateMatrixWorld(true);
  mergeStatic(THREE, town.group);

  return {
    root, town, kit, props, sites, benches, lamps, chairs, parasols, strings, kioskMats: Object.values(kioskMats), planters,
    buildings: town.buildings,
  };
}

function cloneGlow(m, bag) {
  if (!bag[m.name]) {
    const c = m.clone();
    c.userData.glow = (m.userData.glow || m.userData.emissiveOn || m.emissive).clone();
    if (c.userData.glow.r + c.userData.glow.g + c.userData.glow.b < 0.01) c.userData.glow.set('#ffc979');
    c.emissiveIntensity = 0;
    bag[m.name] = c;
  }
  return bag[m.name];
}

/** Give an object its own copies of its emissive_ materials (collected in bag by name). */
function remat(root, bag) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const swap = (m) => (m.name && m.name.startsWith('emissive_') ? cloneGlow(m, bag) : m);
    o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
  });
}

// The promenade: a paved slab with a sea wall, a stone kerb and an iron railing.
function makeEsplanade() {
  const g = new THREE.Group(); g.name = 'esplanade';
  const W = ESP.x1 - ESP.x0, D = ESP.z1 - ESP.z0;
  // paving texture
  const cv = document.createElement('canvas'); cv.width = cv.height = 512;
  const c = cv.getContext('2d');
  c.fillStyle = '#d9cbb8'; c.fillRect(0, 0, 512, 512);
  let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const off = (y % 2) * 32;
    const l = 70 + rnd() * 7;
    c.fillStyle = `hsl(${30 + rnd() * 8}, ${18 + rnd() * 8}%, ${l}%)`;
    c.fillRect(x * 64 + off + 2, y * 64 + 2, 60, 60);
    c.fillRect(x * 64 + off - 512 + 2, y * 64 + 2, 60, 60);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(W / 5, D / 5); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 }));
  top.position.set((ESP.x0 + ESP.x1) / 2, 0.0, (ESP.z0 + ESP.z1) / 2);
  top.receiveShadow = true;
  g.add(top);
  // the strip in front of the houses, a slightly warmer cobble
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(W, 2.6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#cdb59c', roughness: 1 }));
  strip.position.set(top.position.x, 0.012, ESP.z0 + 0.6); strip.receiveShadow = true; g.add(strip);
  const stone = new THREE.MeshStandardMaterial({ color: '#c9b49a', roughness: 0.95, flatShading: true });
  // the sea wall: dressed stone in courses
  const wc = document.createElement('canvas'); wc.width = 512; wc.height = 128;
  const w2 = wc.getContext('2d');
  w2.fillStyle = '#b59c80'; w2.fillRect(0, 0, 512, 128);
  for (let r = 0; r < 4; r++) for (let k = -1; k < 9; k++) {
    const off = (r % 2) * 32, l = 62 + rnd() * 10;
    w2.fillStyle = `hsl(${26 + rnd() * 8}, ${20 + rnd() * 8}%, ${l}%)`;
    w2.fillRect(k * 64 + off + 2, r * 32 + 2, 60, 28);
  }
  w2.fillStyle = 'rgba(40, 50, 80, .35)'; w2.fillRect(0, 104, 512, 24);
  const wtex = new THREE.CanvasTexture(wc);
  wtex.wrapS = THREE.RepeatWrapping; wtex.repeat.set(W / 8, 1); wtex.colorSpace = THREE.SRGBColorSpace;
  const wallMat = new THREE.MeshStandardMaterial({ map: wtex, roughness: 0.95 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(W, 4.2, 1.2), [stone, stone, stone, stone, wallMat, stone]);
  wall.position.set(top.position.x, -2.1, ESP.z1 - 0.6); wall.receiveShadow = true; wall.castShadow = true; g.add(wall);
  // kerb with the railing on it
  const kerb = new THREE.Mesh(new THREE.BoxGeometry(W, 0.32, 0.55), stone);
  kerb.position.set(top.position.x, 0.16, RAIL_Z + 0.05); kerb.castShadow = kerb.receiveShadow = true; g.add(kerb);
  const iron = new THREE.MeshStandardMaterial({ color: '#2b3150', roughness: 0.55, metalness: 0.3 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(W, 0.07, 0.09), iron);
  rail.position.set(top.position.x, 1.05, RAIL_Z + 0.05); rail.castShadow = true; g.add(rail);
  const rail2 = rail.clone(); rail2.position.y = 0.48; rail2.scale.y = 0.6; g.add(rail2);
  const nB = Math.floor(W / 0.22);
  const bal = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.72, 0.03), iron, nB);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.86, 0.11), iron, Math.floor(W / 3));
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < nB; i++) { m4.makeTranslation(ESP.x0 + 0.1 + i * 0.22, 0.32 + 0.36, RAIL_Z + 0.05); bal.setMatrixAt(i, m4); }
  for (let i = 0; i < posts.count; i++) { m4.makeTranslation(ESP.x0 + 1.5 + i * 3, 0.32 + 0.43, RAIL_Z + 0.05); posts.setMatrixAt(i, m4); }
  bal.castShadow = posts.castShadow = true;
  g.add(bal, posts);
  // a beach of pale rocks under the sea wall
  return g;
}
