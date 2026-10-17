// Kiln Light — "The Room". A cutaway diorama built only from three.js
// primitives, lit by a CC0 Poly Haven HDRI and textured with CC0 ambientCG /
// Poly Haven materials. The real product logos sit in it as glazed tiles.
//
// It is used three ways:
//   1. live, as an interactive hero (drag to turn, hover objects)  -> createRoom(canvas).start()
//   2. baked to the scroll-scrub image sequence  (src/bake.html)
//   3. baked to stills: hero, product close-ups, archive (src/bake.html)
//
// Requires an import map that maps "three" and "three/addons/" (see demo.html).
//   import { createRoom } from './room.js'
//   const room = await createRoom(canvas, { base: './' });
//   room.setTime(0.3);       // 0 = morning, 1 = dusk (sun sweeps through the window)
//   room.setView('wide');    // or 'mcp-emails', 'fun-libs', 'toolrails', 'harbor', 'archive', 'glass', 'dusk'
//   room.start();            // live loop with pointer parallax and hover lift

import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const C = {
  limewash: 0xf6f0e8, sand: 0xe8dac9, clay: 0xd4b8a1, terracotta: 0xbf6d4c, ember: 0xe18344,
  umber: 0x614735, ink: 0x282019, mist: 0xcddee6, glaze: 0x357e9c, deepglaze: 0x124356,
};

// camera stops: [position, target, fov]
export const VIEWS = {
  wide:        [[8.4, 6.4, 11.4], [-0.55, 0.85, -0.3], 29],
  approach:    [[4.6, 3.1, 6.6], [-0.3, 0.95, -0.7], 30],
  bench:       [[0.9, 1.6, 2.7], [-0.9, 0.95, -1.75], 34],
  glass:       [[0.55, 1.5, -0.15], [1.65, 1.22, -1.95], 34],
  dusk:        [[3.3, 1.25, 3.4], [-0.9, 0.75, -0.9], 36],
  'mcp-emails':[[-1.3, 1.3, 0.35], [-1.55, 0.96, -1.86], 34],
  'fun-libs':  [[-0.75, 1.3, 0.35], [-0.6, 0.93, -1.84], 34],
  toolrails:   [[1.65, 1.55, 1.45], [0.95, 0.42, -0.25], 34],
  harbor:      [[1.9, 1.25, 0.55], [2.4, 0.7, -1.45], 34],
  archive:     [[1.25, 1.35, 2.0], [1.95, 0.05, 0.85], 32],
};

// scroll path used by the image sequence: wide -> approach -> bench -> dusk
export const PATH = ['wide', 'approach', 'bench', 'dusk'];

const smooth = t => t * t * (3 - 2 * t);

function canvasTex(draw, size = 1024) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });

// A glazed ceramic tile that carries a real logo on its face.
async function logoTile({ src, bg, w = 0.5, h = 0.5, d = 0.07, pad = 0, tint }) {
  const img = await loadImg(src);
  const tex = canvasTex((g, s) => {
    g.fillStyle = bg; g.fillRect(0, 0, s, s);
    const p = s * pad; g.drawImage(img, p, p, s - 2 * p, s - 2 * p);
    if (tint) { g.globalCompositeOperation = 'source-atop'; }
  });
  const grp = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 6, Math.min(w, h) * 0.16),
    new THREE.MeshPhysicalMaterial({ color: bg, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.18 }));
  const r = Math.min(w, h) * 0.16;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w - r * 0.9, h - r * 0.9),
    new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 }));
  // UV-crop so the inset face shows the whole logo scaled to the tile
  face.position.z = d / 2 + 0.0015;
  const sx = (w - r * 0.9) / w, sy = (h - r * 0.9) / h;
  const uv = face.geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * sx, 0.5 + (uv.getY(i) - 0.5) * sy);
  body.castShadow = body.receiveShadow = true; face.receiveShadow = true;
  grp.add(body, face);
  return grp;
}

function texSet(loader, base, name, rep = 1, normal = true) {
  const map = loader.load(`${base}textures/${name}_color_512.jpg`);
  map.colorSpace = THREE.SRGBColorSpace;
  const out = { map };
  if (normal) out.normalMap = loader.load(`${base}textures/${name}_normal_512.jpg`);
  for (const t of Object.values(out)) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; }
  return out;
}

export async function createRoom(canvas, opts = {}) {
  const base = opts.base ?? './';               // path to assets/ folder
  const products = opts.products ?? `${base}../../_shared/products/`;
  const W = opts.width ?? canvas.clientWidth, H = opts.height ?? canvas.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !!opts.preserve, alpha: false });
  renderer.setPixelRatio(opts.pixelRatio ?? Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const bgColor = new THREE.Color(C.limewash);
  scene.background = bgColor.clone();
  scene.fog = new THREE.Fog(C.limewash, 14, 26);

  const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 60);

  // --- light ------------------------------------------------------------
  const pmrem = new THREE.PMREMGenerator(renderer);
  const hdr = await new RGBELoader().loadAsync(`${base}textures/brown_photostudio_05_256.hdr`);
  scene.environment = pmrem.fromEquirectangular(hdr).texture; hdr.dispose();
  scene.environmentIntensity = 0.42;
  const fill = new THREE.DirectionalLight(0xffe6cc, 0.6); fill.position.set(6, 7, 9); scene.add(fill);

  const hemi = new THREE.HemisphereLight(0xfff4e6, 0x8a6a52, 0.35); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd9ad, 4.2);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  const ember = new THREE.PointLight(C.ember, 0, 2.2, 2); ember.position.set(1.0, 0.45, -0.2); scene.add(ember);

  // --- materials --------------------------------------------------------
  const tl = new THREE.TextureLoader();
  const plaster = texSet(tl, base, 'plaster', 2.5);
  const plasterFloor = texSet(tl, base, 'plaster', 3);
  const walnut = texSet(tl, base, 'walnut', 1.5);
  const trav = texSet(tl, base, 'travertine', 0.8);
  const M = {
    wall: new THREE.MeshStandardMaterial({ ...plaster, color: 0xffe2c8, roughness: 0.95, normalScale: new THREE.Vector2(0.8, 0.8) }),
    wallEdge: new THREE.MeshStandardMaterial({ color: 0xefe0cf, roughness: 0.9 }),
    floor: new THREE.MeshStandardMaterial({ ...plasterFloor, color: 0xf2d2b4, roughness: 0.8, normalScale: new THREE.Vector2(0.5, 0.5) }),
    slab: new THREE.MeshStandardMaterial({ color: 0xd9c0a6, roughness: 0.9 }),
    walnut: new THREE.MeshStandardMaterial({ ...walnut, color: 0xf2dcc8, roughness: 0.55 }),
    trav: new THREE.MeshStandardMaterial({ ...trav, color: 0xffffff, roughness: 0.42 }),
    terracotta: new THREE.MeshStandardMaterial({ color: C.terracotta, roughness: 0.82 }),
    clay: new THREE.MeshStandardMaterial({ color: C.clay, roughness: 0.75 }),
    glazeCer: new THREE.MeshPhysicalMaterial({ color: C.glaze, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }),
    cream: new THREE.MeshPhysicalMaterial({ color: 0xf1e7da, roughness: 0.35, clearcoat: 0.8 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 1.2, ior: 1.45, roughness: 0.04,
      attenuationColor: new THREE.Color(0x5f9fba), attenuationDistance: 0.7, dispersion: 0.4, iridescence: 0.35, iridescenceIOR: 1.3, specularIntensity: 1 }),
    molten: new THREE.MeshStandardMaterial({ color: 0x3a1a0c, emissive: new THREE.Color(C.ember), emissiveIntensity: 2.4, roughness: 0.5 }),
  };

  const room = new THREE.Group(); scene.add(room);
  const add = (geo, mat, x, y, z, { cast = true, recv = true, parent = room } = {}) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; parent.add(m); return m;
  };

  // --- the diorama shell: floor slab + two walls with thick cut edges ----
  const RW = 6.2, RD = 4.4, WH = 3.3, T = 0.22;
  add(new THREE.BoxGeometry(RW, 0.34, RD), [M.slab, M.slab, M.floor, M.slab, M.slab, M.slab], 0, -0.17, 0);
  const arch = (cx, w, sill, spring) => { const p = new THREE.Path(); const r = w / 2;
    p.moveTo(cx - r, sill); p.lineTo(cx + r, sill); p.lineTo(cx + r, spring); p.absarc(cx, spring, r, 0, Math.PI, false); p.lineTo(cx - r, sill); return p; };
  // back wall (plain; it receives the light)
  const bw = new THREE.Shape(); bw.moveTo(-RW / 2, 0); bw.lineTo(RW / 2, 0); bw.lineTo(RW / 2, WH); bw.lineTo(-RW / 2, WH); bw.lineTo(-RW / 2, 0);
  add(new THREE.ExtrudeGeometry(bw, { depth: T, bevelEnabled: false }), [M.wall, M.wallEdge], 0, 0, -RD / 2);
  // left wall with the arched window (local x runs along -z in world)
  const WIN = { z: -0.55, w: 1.1, sill: 1.0, spring: 2.1 };
  const lw = new THREE.Shape(); lw.moveTo(-RD / 2, 0); lw.lineTo(RD / 2, 0); lw.lineTo(RD / 2, WH); lw.lineTo(-RD / 2, WH); lw.lineTo(-RD / 2, 0);
  lw.holes.push(arch(-WIN.z, WIN.w, WIN.sill, WIN.spring));
  const leftWall = add(new THREE.ExtrudeGeometry(lw, { depth: T, bevelEnabled: false, curveSegments: 48 }), [M.wall, M.wallEdge], -RW / 2, 0, 0);
  leftWall.rotation.y = Math.PI / 2;
  add(new THREE.BoxGeometry(T + 0.14, 0.05, WIN.w + 0.12), M.trav, -RW / 2 + (T + 0.14) / 2, WIN.sill - 0.025, WIN.z); // window sill
  // shadow-only lid: the room has no visible ceiling, but light only enters through the window
  const lid = add(new THREE.BoxGeometry(RW + 2, 0.1, RD + 2), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), 0, WH + 0.05, 0, { recv: false });
  lid.renderOrder = -1;
  // niche in the back wall for the glass sphere
  const niche = new THREE.Group(); room.add(niche); niche.position.set(1.7, 0, -RD / 2 + T);
  const nW = 0.82, nH = 1.15, nY = 1.0, nD = 0.1;
  const archShape = (w, h, o = 0) => { const s = new THREE.Shape(); s.moveTo(-w / 2 - o, -o * 0.5); s.lineTo(w / 2 + o, -o * 0.5); s.lineTo(w / 2 + o, h - w / 2); s.absarc(0, h - w / 2, w / 2 + o, 0, Math.PI, false); s.lineTo(-w / 2 - o, -o * 0.5); return s; };
  add(new THREE.ShapeGeometry(archShape(nW, nH), 48), new THREE.MeshStandardMaterial({ color: 0xe9cdb2, roughness: 0.95 }), 0, nY, 0.002, { parent: niche });
  const frame = archShape(nW, nH, 0.08); frame.holes.push(archShape(nW, nH));
  add(new THREE.ExtrudeGeometry(frame, { depth: nD, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 48 }), M.wall, 0, nY, 0, { parent: niche });
  add(new THREE.BoxGeometry(nW + 0.12, 0.05, nD + 0.16), M.trav, 0, nY - 0.025, (nD + 0.16) / 2 - 0.02, { parent: niche }); // sill

  // soft contact occlusion where walls meet the floor (cheap baked AO strips)
  const aoTex = canvasTex((g, s) => { const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, 'rgba(70,45,25,0.5)'); gr.addColorStop(0.35, 'rgba(70,45,25,0.16)'); gr.addColorStop(1, 'rgba(70,45,25,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, 64);
  const aoMat = new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false, toneMapped: false });
  const aoBack = add(new THREE.PlaneGeometry(RW, 0.7), aoMat, 0, 0.002, -RD / 2 + T + 0.35, { cast: false, recv: false }); aoBack.rotation.x = -Math.PI / 2;
  const aoLeft = add(new THREE.PlaneGeometry(RD, 0.7), aoMat, -RW / 2 + T + 0.35, 0.002, 0, { cast: false, recv: false }); aoLeft.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  const aoUp = add(new THREE.PlaneGeometry(RW, 0.5), aoMat, 0, 0.25, -RD / 2 + T + 0.002, { cast: false, recv: false }); aoUp.rotation.z = Math.PI;
  const aoUpL = add(new THREE.PlaneGeometry(RD, 0.5), aoMat, -RW / 2 + T + 0.002, 0.25, 0, { cast: false, recv: false }); aoUpL.rotation.set(0, Math.PI / 2, Math.PI);
  const aoCorner = add(new THREE.PlaneGeometry(WH, 0.45), aoMat, -RW / 2 + T + 0.002, WH / 2, -RD / 2 + T + 0.2, { cast: false, recv: false }); aoCorner.rotation.set(0, Math.PI / 2, -Math.PI / 2);
  // the diorama floats; a soft ground shadow anchors it
  const blob = canvasTex((g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, s * 0.1, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(80,55,35,0.38)'); gr.addColorStop(1, 'rgba(80,55,35,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, 256);
  const ground = add(new THREE.PlaneGeometry(RW * 1.7, RD * 1.9), new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false, toneMapped: false }), 0.35, -0.75, 0.3, { cast: false, recv: false });
  ground.rotation.x = -Math.PI / 2;

  // the view: NASA HiRISE dunes in Proctor Crater, seen through the window
  const view = tl.load(`${base}textures/nasa_proctor_dunes_1024.jpg`); view.colorSpace = THREE.SRGBColorSpace;
  const viewMat = new THREE.MeshBasicMaterial({ map: view, toneMapped: false, fog: false });
  const viewPlane = add(new THREE.PlaneGeometry(2.8, 2.1), viewMat, -RW / 2 - 0.5, 1.85, WIN.z, { cast: false, recv: false });
  viewPlane.rotation.y = Math.PI / 2;

  // walnut bench along the back wall
  const benchZ = -RD / 2 + T + 0.36;
  add(new THREE.BoxGeometry(3.3, 0.08, 0.62), M.walnut, -1.0, 0.62, benchZ);
  for (const x of [-2.5, 0.5]) add(new THREE.BoxGeometry(0.12, 0.58, 0.5), M.walnut, x, 0.29, benchZ);

  // --- the products, as real-logo tiles --------------------------------
  const P = products;
  const objects = {};
  const mcp = await logoTile({ src: `${P}mcp-emails/icon.png`, bg: '#2547E5', w: 0.56, h: 0.56 });
  mcp.position.set(-1.6, 0.66 + 0.28, benchZ - 0.06); mcp.rotation.set(-0.07, 0.14, 0); room.add(mcp); objects['mcp-emails'] = mcp;
  const fun = await logoTile({ src: `${P}fun-libs/icon.png`, bg: '#FFE066', w: 0.5, h: 0.5 });
  fun.position.set(-0.6, 0.66 + 0.25, benchZ - 0.04); fun.rotation.set(-0.07, -0.12, 0); room.add(fun); objects['fun-libs'] = fun;
  // Toolrails: on a travertine drum in the middle of the floor, tilted to the light
  add(new THREE.CylinderGeometry(0.34, 0.34, 0.42, 64), M.trav, 0.95, 0.21, -0.25);
  const tr = await logoTile({ src: `${P}toolrails/icon.svg`, bg: '#141413', w: 0.42, h: 0.42, d: 0.06 });
  tr.position.set(0.95, 0.555, -0.25); tr.rotation.set(-Math.PI / 2 + 0.5, 0, 0.18); room.add(tr); objects.toolrails = tr;
  // Harbor: cream mark on the dark tile (the mark is currentColor by design)
  const harborSvg = await (await fetch(`${P}harbor/harbor-mark.svg`)).text();
  const harborUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(harborSvg.replace(/currentColor/g, '#F4EFE6').replace('width="64" height="64"', 'width="1024" height="1024"'));
  const hb = await logoTile({ src: harborUrl, bg: '#1B1B1B', w: 0.46, h: 0.46, pad: 0.1 });
  add(new THREE.BoxGeometry(0.62, 0.5, 0.5), M.trav, 2.45, 0.25, -1.45);
  hb.position.set(2.45, 0.5 + 0.23, -1.52); hb.rotation.set(-0.05, -0.35, 0); room.add(hb); objects.harbor = hb;

  // --- brand objects: glass (clarity), fracture with molten seam, vessels
  const glass = add(new THREE.SphereGeometry(0.26, 96, 64), M.glass, 1.7, nY + 0.26, -RD / 2 + T + 0.1);
  objects.glass = glass;
  // fractured travertine slab with a glowing seam
  const fracture = new THREE.Group(); room.add(fracture); fracture.position.set(-0.55, 0.0, 0.95); fracture.rotation.y = -0.35; fracture.scale.setScalar(0.72);
  const jag = [[0, -0.42], [0.05, -0.25], [-0.04, -0.1], [0.06, 0.06], [-0.02, 0.2], [0.04, 0.42]];
  const half = side => { const s = new THREE.Shape(); const X = 0.62 * side;
    s.moveTo(jag[0][0], jag[0][1]); for (const [x, y] of jag) s.lineTo(x, y); s.lineTo(X, 0.42); s.lineTo(X, -0.42); s.lineTo(jag[0][0], jag[0][1]); return s; };
  for (const side of [-1, 1]) {
    const g = new THREE.ExtrudeGeometry(half(side), { depth: 0.16, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 });
    const m = add(g, M.trav, side * 0.035, 0.18, 0, { parent: fracture }); m.rotation.x = -Math.PI / 2; m.position.y = 0.01;
  }
  const seamPts = jag.map(([x, y]) => new THREE.Vector3(x, 0.09, -y));
  const seam = add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seamPts), 64, 0.012, 8), M.molten, 0, 0, 0, { cast: false, parent: fracture });
  ember.position.set(-0.55, 0.35, 0.95);
  // glazed sphere resting on the slab (the mark, made physical)
  const orb = add(new THREE.SphereGeometry(0.11, 64, 48), M.glazeCer, 0, 0, 0, { parent: fracture });
  orb.position.set(0.3, 0.2 + 0.11 / 0.72, -0.05); orb.scale.setScalar(1 / 0.72);

  // vessels (lathe) in terracotta and clay, in the front-left corner
  const lathe = (pts, mat, x, z, s = 1) => { const g = new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a * s, b * s)), 64); return add(g, mat, x, 0, z); };
  lathe([[0, 0], [0.16, 0], [0.2, 0.08], [0.22, 0.3], [0.16, 0.52], [0.09, 0.6], [0.1, 0.72], [0.085, 0.72], [0.075, 0.62]], M.terracotta, -2.45, 1.45, 1.15);
  lathe([[0, 0], [0.12, 0], [0.18, 0.12], [0.17, 0.28], [0.12, 0.34], [0.11, 0.34]], M.clay, -2.05, 1.7, 1.0);
  const bowl = lathe([[0, 0.0], [0.08, 0], [0.18, 0.06], [0.22, 0.14], [0.21, 0.14], [0.17, 0.08], [0.0, 0.03]], M.cream, 0, 0, 1.1);
  bowl.position.set(0.15, 0.66, benchZ + 0.05);

  // icon-objects: "saas" stacked plates and "agent" ring, from the icon system
  for (let i = 0; i < 3; i++) add(new RoundedBoxGeometry(0.34, 0.035, 0.34, 3, 0.012), i === 2 ? M.glazeCer : M.cream, -2.2 + i * 0.012, 0.68 + i * 0.045, benchZ + 0.05 - i * 0.01).rotation.y = 0.785 + i * 0.08;
  const ring = add(new THREE.TorusGeometry(0.17, 0.018, 24, 96), M.walnut, -1.7, 0.025, 1.65); ring.rotation.x = -Math.PI / 2;
  add(new THREE.SphereGeometry(0.045, 32, 24), M.glazeCer, -1.7 + 0.17, 0.045, 1.65);
  add(new THREE.SphereGeometry(0.06, 32, 24), M.clay, -1.7, 0.06, 1.65);

  // --- archive: clay tokens for retired products, on a walnut tray ------
  const tray = new THREE.Group(); room.add(tray); tray.position.set(1.25, 0, 0.95); tray.rotation.y = 0.1;
  tray.position.set(1.95, 0, 0.95);
  add(new RoundedBoxGeometry(1.05, 0.05, 0.62, 3, 0.02), M.walnut, 0, 0.025, 0, { parent: tray });
  const retired = [['polyglot-pilot', '#c98a66'], ['pinpoint', '#b9a184'], ['webvakt', '#a99787'], ['joke-central', '#d39e74'], ['tryggere-hyring', '#9f8b78'], ['early-apps', '#c7ad92']];
  for (const [i, [id, col]] of retired.entries()) {
    const img = await loadImg(`${base}retired/${id}.svg`);
    const tex = canvasTex((g, s) => { g.fillStyle = col; g.fillRect(0, 0, s, s); const k = s / 128; g.drawImage(img, -16 * k, -14 * k, 160 * k, 160 * k); }, 512);
    const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
    const side = new THREE.MeshStandardMaterial({ color: col, roughness: 0.85 });
    const tok = add(new THREE.CylinderGeometry(0.115, 0.115, 0.045, 64), [side, top, side], -0.36 + (i % 3) * 0.36, 0.075, -0.13 + Math.floor(i / 3) * 0.27, { parent: tray });
    tok.rotation.y = -Math.PI / 2 + (i * 0.37) % 0.6 - 0.3;
    // the svg token has a rim; offset uv so the disc shows the face
    const uv = tok.geometry.attributes.uv; // cap uv already maps 0..1 across disc
  }
  objects.archive = tray;

  // --- time of day ------------------------------------------------------
  const patch = new THREE.CatmullRomCurve3([new THREE.Vector3(2.2, 1.2, -2.0), new THREE.Vector3(0.2, 1.0, -1.95), new THREE.Vector3(-1.0, 0.75, -1.9), new THREE.Vector3(-0.2, 0, -0.2), new THREE.Vector3(0.6, 0, 1.5)]);
  const morning = new THREE.Color(0xffd6a6), noon = new THREE.Color(0xfff2e2), dusk = new THREE.Color(0xff9a5e);
  const bgMorning = new THREE.Color(C.limewash), bgDusk = new THREE.Color(0xd9dfe2);
  function setTime(t) {
    // the sun enters through the arched window in the left wall; its arch of
    // light travels from the back wall, across the products, onto the floor.
    const P = patch.getPoint(smooth(t));
    const Wc = new THREE.Vector3(-RW / 2, (WIN.sill + WIN.spring + WIN.w / 2) / 2, WIN.z);
    const dir = Wc.clone().sub(P).normalize();
    sun.position.copy(Wc).addScaledVector(dir, 12); sun.target.position.copy(P);
    const c = t < 0.5 ? morning.clone().lerp(noon, t * 2) : noon.clone().lerp(dusk, (t - 0.5) * 2);
    sun.color.copy(c); sun.intensity = THREE.MathUtils.lerp(4.6, 3.4, smooth(Math.max(0, t - 0.5) * 2));
    hemi.color.set(0xfff4e6).lerp(new THREE.Color(C.mist), smooth(t));
    hemi.intensity = THREE.MathUtils.lerp(0.38, 0.16, smooth(t));
    fill.intensity = THREE.MathUtils.lerp(0.65, 0.12, smooth(t));
    scene.background.copy(bgMorning).lerp(bgDusk, smooth(Math.max(0, t - 0.3) / 0.7));
    scene.fog.color.copy(scene.background);
    scene.environmentIntensity = THREE.MathUtils.lerp(0.45, 0.22, smooth(t));
    ember.intensity = THREE.MathUtils.lerp(0.2, 2.6, smooth(t) ** 2);
    M.molten.emissiveIntensity = THREE.MathUtils.lerp(1.6, 3.2, smooth(t));
    viewMat.color.set(0xffffff).lerp(new THREE.Color(0xb7c9dc), smooth(t));
  }

  // --- camera -------------------------------------------------------------
  const tgt = new THREE.Vector3();
  const lerpView = (a, b, t) => {
    const A = VIEWS[a], B = VIEWS[b], s = smooth(t);
    camera.position.fromArray(A[0]).lerp(new THREE.Vector3().fromArray(B[0]), s);
    tgt.fromArray(A[1]).lerp(new THREE.Vector3().fromArray(B[1]), s);
    camera.fov = THREE.MathUtils.lerp(A[2], B[2], s); camera.updateProjectionMatrix(); camera.lookAt(tgt);
  };
  function setView(name) { lerpView(name, name, 0); }
  // 0..1 along PATH, with time of day following
  function setProgress(p) {
    const seg = Math.min(PATH.length - 2, Math.floor(p * (PATH.length - 1)));
    const local = p * (PATH.length - 1) - seg;
    lerpView(PATH[seg], PATH[seg + 1], local); setTime(p);
  }
  function resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  camera.aspect = W / H;
  setView('wide'); setTime(0.25);

  const render = () => renderer.render(scene, camera);

  // --- live mode: pointer parallax + hover lift -------------------------
  let raf = 0, px = 0, py = 0, cx = 0, cy = 0, hovered = null; const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(9, 9);
  const baseY = new Map(Object.entries(objects).map(([k, o]) => [o, o.position.y]));
  function start({ view = 'wide', time = 0.3 } = {}) {
    setTime(time);
    canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5; ndc.set(px * 2, -py * 2); });
    canvas.addEventListener('pointerleave', () => { px = py = 0; ndc.set(9, 9); });
    const loop = () => {
      cx += (px - cx) * 0.05; cy += (py - cy) * 0.05;
      const V = VIEWS[view]; camera.position.fromArray(V[0]);
      const off = new THREE.Vector3(-cx * 1.4, cy * 0.6, 0).applyQuaternion(camera.quaternion);
      camera.position.add(off); camera.lookAt(tgt.fromArray(V[1]));
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(Object.values(objects), true)[0];
      let o = hit?.object; while (o && !baseY.has(o)) o = o.parent;
      if (o !== hovered) { hovered = o; canvas.style.cursor = o ? 'pointer' : ''; canvas.dispatchEvent(new CustomEvent('roomhover', { detail: o ? Object.keys(objects).find(k => objects[k] === o) : null })); }
      for (const [obj, y] of baseY) obj.position.y += ((obj === hovered ? y + 0.05 : y) - obj.position.y) * 0.12;
      seam.material.emissiveIntensity = 2.2 + Math.sin(performance.now() / 900) * 0.5;
      render(); raf = requestAnimationFrame(loop);
    };
    loop();
  }
  const stop = () => cancelAnimationFrame(raf);

  return { renderer, scene, camera, objects, setTime, setView, setProgress, resize, render, start, stop, VIEWS, PATH };
}
