// The Vivarium — a living terrarium built only from three.js primitives.
// Each product is a creature: the letter moth (MCP Emails), the two-bar beetle
// (Fun Libs), the rail ant (Toolrails) and the sleeping snail (Harbor, paused).
//
// Usage:
//   import { createTerrarium } from './terrarium.js'
//   const t = await createTerrarium(canvas, { view: 'hero' })   // 'hero' | 'macro' | 'solo'
//   t.dispose()
//
// Requires an import map that resolves "three" (pinned: three@0.170.0).
// Pointer moves the camera gently; the creatures idle on their own.
// Pass { still: true } to render one frame (used to bake the hero stills).

import * as THREE from 'three';

export const PALETTE = {
  paper: 0xf8f4ea, ink: 0x162118, inkSoft: 0x525e54,
  moss: 0x408742, mossDeep: 0x225424, mossPale: 0xa9d3a2, lichen: 0x8fb36a,
  amber: 0xe2a355, soil: 0x4a3626, soilDark: 0x2e2219, stone: 0xb9b3a4,
  base: 0x1f2b24, cream: 0xf3e9d2, blush: 0xe9b7a5,
  // creature accents echo (never redraw) each product's own colours
  mcpBlue: 0x2547e5, mcpGreen: 0x1fcb8b, funYellow: 0xffe066, funNavy: 0x14213d,
  railBlack: 0x232321, railYellow: 0xffd400,
};

const rand = (() => { let s = 653353; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

function toonRamp() {
  const d = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
}

export async function createTerrarium(canvas, opts = {}) {
  const view = opts.view || 'hero';
  const still = !!opts.still;
  const only = opts.only || null; // render a single creature (for cutouts)
  const dpr = opts.dpr || Math.min(window.devicePixelRatio || 1, 2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: still });
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const ramp = toonRamp();
  const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra });
  const inkMat = new THREE.MeshBasicMaterial({ color: PALETTE.ink, side: THREE.BackSide });
  const outlined = (mesh, w = 0.035) => {
    const o = new THREE.Mesh(mesh.geometry, inkMat);
    o.scale.setScalar(1 + w); o.castShadow = false; o.receiveShadow = false;
    mesh.add(o); mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  };
  const M = (geo, mat, w) => outlined(new THREE.Mesh(geo, mat), w);

  // ---------- light: warm storybook afternoon ----------
  scene.add(new THREE.HemisphereLight(0xfff4dc, 0x41593c, 1.35));
  const sun = new THREE.DirectionalLight(0xffe8c2, 2.4);
  sun.position.set(-3.5, 6, 4.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -3; sun.shadow.camera.right = 3; sun.shadow.camera.top = 3; sun.shadow.camera.bottom = -3;
  sun.shadow.radius = 6; sun.shadow.bias = -0.0008;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xcfe9c8, 0.6); rim.position.set(4, 2, -4); scene.add(rim);

  const world = new THREE.Group(); scene.add(world);
  const creatures = {};

  // ---------- plinth, soil and glass ----------
  const R = 1.55; // dome radius
  if (!only) {
    const plinth = M(new THREE.CylinderGeometry(R + 0.22, R + 0.3, 0.26, 96), toon(PALETTE.base), 0.012);
    plinth.position.y = -0.13; world.add(plinth);
    const lip = M(new THREE.TorusGeometry(R + 0.06, 0.05, 12, 96), toon(0x2c3a31), 0.02);
    lip.rotation.x = Math.PI / 2; lip.position.y = 0.02; world.add(lip);
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.02, R - 0.02, 0.1, 96), toon(PALETTE.soil));
    soil.position.y = 0.04; soil.receiveShadow = true; world.add(soil);

    // moss mound: displaced hemisphere
    const mg = new THREE.SphereGeometry(1.2, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2);
    const p = mg.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * 5.1) * Math.cos(v.z * 4.3) * 0.05 + Math.sin(v.x * 13 + v.z * 9) * 0.018;
      v.y = v.y * 0.42 + n * (v.y > 0.02 ? 1 : 0);
      v.x *= 1.18; p.setXYZ(i, v.x, v.y, v.z);
    }
    mg.computeVertexNormals();
    const mound = new THREE.Mesh(mg, toon(PALETTE.moss)); mound.position.set(-0.05, 0.06, -0.1);
    mound.receiveShadow = true; mound.castShadow = true; world.add(mound);

    // moss tufts (instanced)
    const tuftGeo = new THREE.IcosahedronGeometry(0.06, 1);
    const tufts = new THREE.InstancedMesh(tuftGeo, toon(PALETTE.lichen), 260);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    for (let i = 0; i < 260; i++) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 1.25;
      const x = Math.cos(a) * r * 1.18 - 0.05, z = Math.sin(a) * r - 0.1;
      const y = 0.06 + Math.max(0, Math.sqrt(Math.max(0, 1.44 - r * r)) * 0.42) * 0.98;
      sc.setScalar(0.45 + rand() * 0.9);
      m4.compose(new THREE.Vector3(x, y, z), q, sc); tufts.setMatrixAt(i, m4);
      tufts.setColorAt(i, new THREE.Color(rand() > 0.75 ? PALETTE.mossPale : rand() > 0.45 ? PALETTE.lichen : 0x5a9a4c));
    }
    tufts.castShadow = true; tufts.receiveShadow = true; world.add(tufts);

    // pebbles
    for (let i = 0; i < 9; i++) {
      const a = 0.4 + i * 0.7, r = 1.25 + rand() * 0.2;
      const s = 0.07 + rand() * 0.08;
      const peb = M(new THREE.DodecahedronGeometry(s, 1), toon(i % 3 ? PALETTE.stone : 0x958f80), 0.05);
      peb.scale.y = 0.6; peb.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r); world.add(peb);
    }

    // ferns: fronds made of instanced leaflets along a curve
    const fern = (x, z, h, rot, lean, color) => {
      const g = new THREE.Group();
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, h * 0.7, 0), new THREE.Vector3(lean, h, 0));
      const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.012, 6), toon(PALETTE.mossDeep)); g.add(stem);
      const leafGeo = new THREE.SphereGeometry(1, 10, 6); leafGeo.scale(1, 0.18, 0.42);
      const N = 16; const leaves = new THREE.InstancedMesh(leafGeo, toon(color), N * 2);
      let k = 0;
      for (let i = 2; i < N; i++) {
        const t = i / N, pt = curve.getPoint(t), tan = curve.getTangent(t);
        const len = 0.17 * Math.sin(Math.PI * Math.min(1, t * 1.05)) + 0.03;
        for (const side of [-1, 1]) {
          const o = new THREE.Object3D();
          o.position.copy(pt).add(new THREE.Vector3(0, 0, side * len * 0.9));
          o.lookAt(pt.clone().add(new THREE.Vector3(0, 0, side)));
          o.rotateY(Math.PI / 2); o.rotateZ(-Math.atan2(tan.x, tan.y) * 0.3 - side * 0.2 + 0.35);
          o.scale.set(len, len, len); o.updateMatrix(); leaves.setMatrixAt(k++, o.matrix);
        }
      }
      leaves.count = k; leaves.castShadow = true; g.add(leaves);
      g.position.set(x, 0.06, z); g.rotation.y = rot; world.add(g);
      return g;
    };
    creatures.ferns = [
      fern(-0.95, -0.55, 1.55, 0.3, -0.45, PALETTE.moss),
      fern(-0.7, -0.85, 1.25, -0.8, -0.35, PALETTE.lichen),
      fern(0.85, -0.7, 1.35, 2.6, -0.4, PALETTE.mossDeep),
      fern(1.05, -0.2, 0.9, 3.4, -0.3, PALETTE.moss),
    ];


    // the sprout from the mark, grown large at the centre of the jar
    {
      const sp = new THREE.Group();
      const sc = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.02, 0.35, 0), new THREE.Vector3(-0.03, 0.7, 0), new THREE.Vector3(0.05, 1.02, 0)]);
      sp.add(M(new THREE.TubeGeometry(sc, 32, 0.022, 8), toon(PALETTE.mossDeep), 0.0));
      const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.bezierCurveTo(0.12, 0.22, 0.42, 0.3, 0.6, 0.26); leafShape.bezierCurveTo(0.5, 0.06, 0.24, -0.06, 0, 0);
      const leaf = (color, flip, y, rz, ry) => {
        const g = new THREE.ExtrudeGeometry(leafShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 24 });
        const m = M(g, toon(color), 0.0); const e = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(leafShape.getSpacedPoints(80)), new THREE.LineBasicMaterial({ color: PALETTE.ink })); e.position.z = 0.022; m.add(e);
        const vein = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.02, 0.01, 0.022), new THREE.Vector3(0.3, 0.15, 0.022), new THREE.Vector3(0.55, 0.24, 0.022)]), new THREE.LineBasicMaterial({ color: PALETTE.ink, transparent: true, opacity: 0.5 })); m.add(vein);
        m.position.y = y; m.rotation.set(0, ry, rz); if (flip) m.scale.x = -1; sp.add(m); return m;
      };
      leaf(PALETTE.moss, false, 1.0, 0.18, -0.35);
      leaf(0x2f4a33, true, 0.62, 0.1, 0.4).scale.multiplyScalar(0.8);
      sp.position.set(0.12, 0.42, -0.25); sp.rotation.y = 0.2; world.add(sp); creatures.sprout = sp;
    }

    // clover patches
    const heart = new THREE.Shape(); heart.moveTo(0, 0); heart.bezierCurveTo(-0.06, 0.04, -0.07, 0.11, -0.02, 0.12); heart.bezierCurveTo(0, 0.12, 0, 0.1, 0, 0.09); heart.bezierCurveTo(0, 0.1, 0, 0.12, 0.02, 0.12); heart.bezierCurveTo(0.07, 0.11, 0.06, 0.04, 0, 0);
    const heartGeo = new THREE.ShapeGeometry(heart, 12);
    const clover = (x, z, s) => {
      const g = new THREE.Group();
      for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(heartGeo, toon(k === 1 ? PALETTE.lichen : 0x6aa85a, { side: THREE.DoubleSide })); l.rotation.set(-Math.PI / 2 + 0.3, 0, k * 2.094); l.position.y = 0.12; l.castShadow = true; g.add(l); }
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 4), toon(PALETTE.mossDeep)); st.position.y = 0.06; g.add(st);
      g.position.set(x, 0.08, z); g.scale.setScalar(s); world.add(g);
    };
    [[1.18, 0.55, 1.3], [1.3, 0.2, 1], [-0.62, 1.12, 1.2], [-1.3, -0.1, 1.1], [1.05, 0.95, 0.9]].forEach(c => clover(...c));

    // grass blades
    for (let i = 0; i < 26; i++) {
      const a = rand() * Math.PI * 2, r = 0.9 + rand() * 0.5;
      const h = 0.25 + rand() * 0.35;
      const b = new THREE.Mesh(new THREE.ConeGeometry(0.018, h, 4), toon(rand() > .5 ? PALETTE.lichen : PALETTE.moss));
      b.position.set(Math.cos(a) * r, 0.08 + h / 2, Math.sin(a) * r * 0.9); b.rotation.z = (rand() - .5) * .5; b.rotation.x = (rand() - .5) * .4;
      b.castShadow = true; world.add(b);
    }

    // mushrooms
    const shroom = (x, z, s, tilt) => {
      const g = new THREE.Group();
      const st = M(new THREE.CylinderGeometry(0.035 * s, 0.05 * s, 0.26 * s, 16), toon(PALETTE.cream), 0.06); st.position.y = 0.13 * s; g.add(st);
      const cap = M(new THREE.SphereGeometry(0.15 * s, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), toon(PALETTE.amber), 0.04);
      cap.scale.y = 0.75; cap.position.y = 0.25 * s; g.add(cap);
      for (let i = 0; i < 5; i++) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.018 * s, 8, 6), toon(PALETTE.cream));
        const a = i * 1.3, rr = 0.09 * s; d.position.set(Math.cos(a) * rr, 0.25 * s + 0.07 * s, Math.sin(a) * rr); g.add(d);
      }
      g.position.set(x, 0.07, z); g.rotation.z = tilt; world.add(g);
    };
    shroom(0.62, 0.62, 1.2, -0.12); shroom(0.82, 0.5, 0.8, 0.18); shroom(-1.15, 0.45, 0.9, 0.1);

    // floating spores ("sparks")
    const sporeGeo = new THREE.BufferGeometry(); const sp = [];
    for (let i = 0; i < 60; i++) { const a = rand() * 6.28, r = rand() * 1.3; sp.push(Math.cos(a) * r, 0.4 + rand() * 1.6, Math.sin(a) * r); }
    sporeGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    const spores = new THREE.Points(sporeGeo, new THREE.PointsMaterial({ color: 0xffd98a, size: 0.035, transparent: true, opacity: 0.9, depthWrite: false }));
    world.add(spores); creatures.spores = spores;
  }

  // ---------- creatures ----------
  const legs = (parent, color, n, span, len, y, thick = 0.012) => {
    for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(thick, thick * 0.7, len, 6), toon(color));
      const zz = (i - (n - 1) / 2) * span;
      l.position.set(s * len * 0.42, y, zz); l.rotation.z = s * 1.0; l.rotation.y = (i - 1) * 0.35 * s;
      parent.add(l);
    }
  };

  // MCP Emails: the letter moth
  if (!only || only === 'moth') {
    const moth = new THREE.Group();
    const body = M(new THREE.CapsuleGeometry(0.05, 0.2, 8, 16), toon(0xcaa27c), 0.08); body.rotation.x = Math.PI / 2; body.position.z = -0.06; body.scale.set(1, 1, 0.9); moth.add(body);
    const collar = M(new THREE.SphereGeometry(0.075, 20, 14), toon(PALETTE.cream), 0.06); collar.position.z = 0.08; moth.add(collar);
    const head = M(new THREE.SphereGeometry(0.06, 16, 12), toon(0xb48b66), 0.08); head.position.z = 0.16; moth.add(head);
    for (const s of [-1, 1]) {
      const ant = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.006, 6, 16, 1.4), toon(PALETTE.ink));
      ant.position.set(s * 0.03, 0.05, 0.2); ant.rotation.set(0, s * 0.4 - Math.PI / 2, 0.6); moth.add(ant);
    }
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0); wingShape.bezierCurveTo(0.12, 0.05, 0.42, 0.12, 0.5, -0.02); wingShape.bezierCurveTo(0.44, -0.18, 0.18, -0.2, 0, -0.06);
    const hindShape = new THREE.Shape();
    hindShape.moveTo(0, -0.04); hindShape.bezierCurveTo(0.12, -0.04, 0.3, -0.12, 0.28, -0.24); hindShape.bezierCurveTo(0.16, -0.3, 0.04, -0.2, 0, -0.1);
    const wings = [];
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group(); pivot.position.set(s * 0.04, 0.02, 0.05);
      const mk = (shape, color, spotColor, spot) => {
        const geo = new THREE.ShapeGeometry(shape, 24);
        const w = new THREE.Mesh(geo, toon(color, { side: THREE.DoubleSide })); w.castShadow = true;
        const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(shape.getSpacedPoints(60)), new THREE.LineBasicMaterial({ color: PALETTE.ink }));
        w.add(edge);
        if (spot) { const d = new THREE.Mesh(new THREE.CircleGeometry(spot[2], 24), toon(spotColor, { side: THREE.DoubleSide })); d.position.set(spot[0], spot[1], 0.002); w.add(d); }
        w.rotation.x = -Math.PI / 2; if (s < 0) w.scale.x = -1;
        return w;
      };
      pivot.add(mk(wingShape, PALETTE.cream, PALETTE.mcpBlue, [0.3, -0.04, 0.035]));
      const hw = mk(hindShape, PALETTE.blush, PALETTE.mcpGreen, [0.15, -0.17, 0.025]); hw.position.y = -0.004; pivot.add(hw);
      moth.add(pivot); wings.push({ pivot, s });
    }
    // the letter it carries
    const env = M(new THREE.BoxGeometry(0.2, 0.012, 0.14), toon(0xfffbf2), 0.06);
    env.position.set(0, -0.11, 0.02); env.rotation.y = 0.2; moth.add(env);
    const flap = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.1, 0.008, -0.07), new THREE.Vector3(0, 0.008, 0.01), new THREE.Vector3(0.1, 0.008, -0.07)]), new THREE.LineBasicMaterial({ color: PALETTE.mcpBlue }));
    env.add(flap);
    const thread = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -0.04, 0.02), new THREE.Vector3(0, -0.105, 0.02)]), new THREE.LineBasicMaterial({ color: PALETTE.ink })); moth.add(thread);
    moth.scale.setScalar(1.5);
    moth.position.set(0.62, 2.12, 0.3); moth.rotation.set(0.15, -0.6, 0);
    world.add(moth); creatures.moth = { g: moth, wings };
  }

  // Fun Libs: the two-bar beetle
  if (!only || only === 'beetle') {
    const b = new THREE.Group();
    const shell = M(new THREE.SphereGeometry(0.2, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), toon(PALETTE.funYellow), 0.04);
    shell.scale.set(0.95, 0.75, 1.25); b.add(shell);
    const under = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.03, 32), toon(PALETTE.funNavy)); under.scale.set(0.95, 1, 1.25); b.add(under);
    const head = M(new THREE.SphereGeometry(0.09, 20, 14), toon(PALETTE.funNavy), 0.06); head.position.set(0, 0.03, 0.26); b.add(head);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfffbf2 })); e.position.set(s * 0.045, 0.07, 0.32); b.add(e); }
    // two rounded bars across the back, a nod to the Fun Libs mark
    const bar = (w, x, z) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, w, 6, 12), toon(PALETTE.funNavy)); m.rotation.z = Math.PI / 2; m.position.set(x, 0.148, z); m.rotation.y = 0; b.add(m); };
    bar(0.15, 0.0, 0.04); bar(0.07, -0.04, -0.06);
    legs(b, PALETTE.funNavy, 3, 0.11, 0.17, 0.0, 0.012);
    for (const s of [-1, 1]) {
      const a = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.007, 6, 16, 1.1), toon(PALETTE.funNavy));
      a.position.set(s * 0.04, 0.06, 0.3); a.rotation.set(0, -Math.PI / 2 + s * 0.5, 0.2); b.add(a);
    }
    b.position.set(-0.35, 0.5, 0.55); b.rotation.set(-0.12, 0.7, 0.05); b.scale.setScalar(1.3);
    world.add(b); creatures.beetle = { g: b };
  }

  // Toolrails: the ant carrying a rail
  if (!only || only === 'ant') {
    const a = new THREE.Group();
    const seg = (r, z, y = 0) => { const m = M(new THREE.SphereGeometry(r, 20, 14), toon(PALETTE.railBlack), 0.0); m.position.set(0, y, z); a.add(m); return m; };
    seg(0.085, -0.15, 0.02).scale.set(1, 0.9, 1.3); seg(0.05, 0, 0.03); seg(0.065, 0.12, 0.06);
    legs(a, PALETTE.railBlack, 3, 0.05, 0.2, -0.01, 0.008);
    for (const s of [-1, 1]) { const an = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.005, 6, 16, 1.5), toon(PALETTE.railBlack)); an.position.set(s * 0.03, 0.1, 0.17); an.rotation.set(0, -Math.PI / 2 + s * 0.6, 0.3); a.add(an); }
    const rail = new THREE.Group();
    const bar = (y) => { const m = M(new THREE.BoxGeometry(0.34, 0.022, 0.026), toon(PALETTE.railYellow), 0.08); m.position.y = y; rail.add(m); };
    bar(0.0); bar(0.06);
    const tip = M(new THREE.ConeGeometry(0.07, 0.1, 3), toon(PALETTE.railYellow), 0.08); tip.rotation.z = -Math.PI / 2; tip.position.set(0.19, 0.03, 0); tip.scale.setScalar(0.75); rail.add(tip);
    rail.position.set(0, 0.17, -0.02); rail.rotation.set(0, Math.PI / 2, 0.18); a.add(rail);
    a.position.set(0.22, 0.12, 1.02); a.rotation.y = 1.6; a.scale.setScalar(1.45);
    world.add(a); creatures.ant = { g: a, rail };
  }

  // Harbor: the snail, paused, tucked into its shell
  if (!only || only === 'snail') {
    const sn = new THREE.Group();
    const foot = M(new THREE.CapsuleGeometry(0.07, 0.34, 8, 16), toon(0xd7cdb6), 0.05);
    foot.rotation.z = Math.PI / 2; foot.scale.set(1, 1, 0.8); foot.position.y = 0.05; sn.add(foot);
    // log-spiral shell: a tube whose radius grows along the curve
    const pts = []; const turns = 3.1, steps = 140;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, ang = t * turns * Math.PI * 2, r = 0.012 * Math.exp(t * 3.0);
      pts.push(new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, (1 - t) * 0.07));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const radial = 18; const tg = new THREE.TubeGeometry(curve, steps, 1, radial, false);
    const pos = tg.attributes.position, c = new THREE.Vector3(), vv = new THREE.Vector3();
    const colors = [];
    for (let i = 0; i < pos.count; i++) {
      const ring = Math.floor(i / (radial + 1)); const t = ring / steps;
      curve.getPointAt(Math.min(1, t), c);
      vv.fromBufferAttribute(pos, i).sub(c).multiplyScalar(0.008 + 0.105 * Math.pow(t, 1.5)).add(c);
      pos.setXYZ(i, vv.x, vv.y, vv.z);
      const stripe = Math.sin(t * 46) > 0.55;
      const col = new THREE.Color(stripe ? 0x8a6a4a : 0xe8dcc0); colors.push(col.r, col.g, col.b);
    }
    tg.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    tg.computeVertexNormals();
    const shell = new THREE.Mesh(tg, toon(0xffffff, { vertexColors: true })); shell.castShadow = true;
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.113, 24, 16), toon(0xe8dcc0)); mouth.position.copy(curve.getPointAt(1)); shell.add(mouth);
    const shellInk = new THREE.Mesh(tg, inkMat); shellInk.scale.setScalar(1.03); shell.add(shellInk);
    const shellG = new THREE.Group(); shellG.add(shell); shellG.position.set(-0.03, 0.22, 0); shellG.rotation.set(0, 0.0, 0.3);
    shellG.scale.setScalar(1.0); sn.add(shellG);
    const head = M(new THREE.SphereGeometry(0.06, 16, 12), toon(0xd7cdb6), 0.05); head.position.set(0.24, 0.07, 0); sn.add(head);
    // closed eyes: it is sleeping (Harbor is paused)
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 4, 10, Math.PI), new THREE.MeshBasicMaterial({ color: PALETTE.ink })); e.position.set(0.28, 0.09, s * 0.03); e.rotation.set(0, Math.PI / 2, Math.PI); sn.add(e); }
    sn.position.set(-0.98, 0.14, 0.62); sn.rotation.set(0, 0.35, 0); sn.scale.setScalar(1.35);
    world.add(sn); creatures.snail = { g: sn };
  }

  // ---------- glass dome (fresnel + inked silhouette) ----------
  let glass = null;
  if (!only) {
    glass = new THREE.Group();
    const glassMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uInk: { value: new THREE.Color(PALETTE.ink) }, uTint: { value: new THREE.Color(0xe9f3e6) } },
      vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW;
        void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform vec3 uInk; uniform vec3 uTint; varying vec3 vN; varying vec3 vV; varying vec3 vW;
        void main(){ float f = 1.-abs(dot(normalize(vN),normalize(vV)));
          float body = smoothstep(.45,1.,f)*.2 + .015;
          float line = smoothstep(.955,.985,f);
          // painted window highlights
          vec3 n = normalize(vN);
          float hl = smoothstep(.86,.95, dot(n, normalize(vec3(-.62,.42,.66)))) * .75;
          float hl2 = smoothstep(.93,.97, dot(n, normalize(vec3(-.35,.2,.92)))) * .35;
          vec3 col = mix(uTint, uInk, line);
          col = mix(col, vec3(1.), max(hl,hl2));
          gl_FragColor = vec4(col, max(max(body, line*.85), max(hl,hl2))); }`,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2), glassMat); dome.position.y = 1.35;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.35, 96, 1, true), glassMat); wall.position.y = 0.675;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16), glassMat); knob.position.y = 1.35 + R + 0.12;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.12, 24, 1, true), glassMat); neck.position.y = 1.35 + R + 0.0;
    glass.add(dome, wall, knob, neck); glass.renderOrder = 10; world.add(glass);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 8, 128), new THREE.MeshBasicMaterial({ color: PALETTE.ink }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.03; world.add(ring);
  }

  // soft contact shadow on the page
  if (!only && !opts.noFloorShadow) {
    const c2 = document.createElement('canvas'); c2.width = c2.height = 256; const x = c2.getContext('2d');
    const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, 'rgba(22,33,24,.45)'); gr.addColorStop(1, 'rgba(22,33,24,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c2), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(0.4, -0.265, 0.2); world.add(sh);
  }

  // ---------- camera ----------
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  const views = {
    hero: { pos: [0.3, 3.0, 8.3], look: [0, 1.22, 0], offset: -0.17 },
    portrait: { pos: [0.2, 3.0, 10.2], look: [0, 1.25, 0], offset: 0 },
    macro: { pos: [1.2, 1.5, 4.2], look: [-0.1, 0.8, 0.2], offset: 0 },
    solo: { pos: [0.9, 0.9, 1.4], look: [0, 0.12, 0], offset: 0 },
    top: { pos: [0, 7.5, 2.2], look: [0, 0.6, 0], offset: 0 },
  };
  const V = views[view] || views.hero;
  const base = new THREE.Vector3(...V.pos), look = new THREE.Vector3(...V.look);
  if (only) { // frame a single creature at origin, fitted to its bounds
    const g = creatures[only].g; g.position.set(0, 0, 0);
    const rot = { moth: [0.55, -0.45, 0.1], beetle: [0, 0.75, 0], ant: [0, 1.2, 0], snail: [0, 0.45, 0] }[only];
    g.rotation.set(...rot);
    g.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g), ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()).length();
    look.copy(ctr); base.copy(ctr).add(new THREE.Vector3(0.25, 0.42, 1).normalize().multiplyScalar(size * 2.25));
  }

  function resize() {
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    if (V.offset) camera.setViewOffset(w, h, V.offset * w, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  resize();

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = e => { const r = canvas.getBoundingClientRect(); pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2; };
  window.addEventListener('pointermove', onMove);
  const ro = new ResizeObserver(() => { resize(); if (still) frame(t0); }); ro.observe(canvas);

  const clock = new THREE.Clock();
  const t0 = opts.time ?? 0.6;
  function frame(tt) {
    const t = tt ?? (t0 + clock.getElapsedTime());
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;
    const orbit = pointer.x * 0.35 + (still ? 0 : Math.sin(t * 0.12) * 0.06);
    const p = base.clone().sub(look); p.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit); p.y += pointer.y * -0.6;
    camera.position.copy(look).add(p); camera.lookAt(look);
    if (creatures.moth) {
      const m = creatures.moth; const f = Math.sin(t * 9) * 0.55 + 0.35;
      m.wings.forEach(({ pivot, s }) => { pivot.rotation.z = s * f; });
      if (!only) { m.g.position.y = 2.12 + Math.sin(t * 1.3) * 0.08; m.g.position.x = 0.62 + Math.sin(t * 0.6) * 0.18; m.g.rotation.y = -0.6 + Math.sin(t * 0.6) * 0.3; }
    }
    if (creatures.beetle) { creatures.beetle.g.rotation.z = 0.05 + Math.sin(t * 2.2) * 0.03; }
    if (creatures.ant && !only) { creatures.ant.g.position.y = 0.11 + Math.abs(Math.sin(t * 6)) * 0.015; }
    if (creatures.snail) { creatures.snail.g.scale.y = 1.15 * (1 + Math.sin(t * 0.9) * 0.015); }
    if (creatures.ferns) creatures.ferns.forEach((f, i) => { f.rotation.z = Math.sin(t * 0.7 + i) * 0.025; });
    if (creatures.spores) { creatures.spores.rotation.y = t * 0.05; creatures.spores.position.y = Math.sin(t * 0.4) * 0.05; }
    renderer.render(scene, camera);
  }
  let raf = 0;
  if (still) { frame(t0); } else { const loop = () => { frame(); raf = requestAnimationFrame(loop); }; loop(); }

  return {
    renderer, scene, camera, creatures,
    render: frame,
    dispose() { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); ro.disconnect(); renderer.dispose(); },
  };
}
