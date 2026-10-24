// Living Town: one shadow caster for everything that never moves.
// The shadow map is redrawn every frame because people walk through it, and drawing the town into it
// took some 350 draw calls. The depth pass does not care about materials, only about which faces it
// culls, so every static caster is baked once into a world-space mesh per culling side. The originals
// stop casting and render as before. The map comes out the same: the same triangles, the same sides,
// the same bias.
//
// three tests layers against the main camera in both passes, so the baked meshes sit on a layer of
// their own that the main camera also sees (raycasts, on layer 0, never hit them), and they are hidden
// while three builds the frame's draw lists, then shown again just before the sun's shadow map is drawn.
//
// The bake transforms about 900k vertices, so it runs in slices in idle time after the town is on
// screen. Until it lands the originals cast as before, so the swap cannot be seen.
import * as THREE from 'three';

export const SHADOW_LAYER = 1;
// three's depth pass flips the culling side unless a material sets shadowSide (WebGLShadowMap)
const FLIP = { [THREE.FrontSide]: THREE.BackSide, [THREE.BackSide]: THREE.FrontSide, [THREE.DoubleSide]: THREE.DoubleSide };

function bakeable(m) {
  if (!m || !m.visible || m.wireframe) return false;
  if (m.alphaTest > 0 || (m.displacementMap && m.displacementScale !== 0) || m.clipShadows) return false;
  return true;
}

const idle = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 250 }) : setTimeout(r, 16)));

/**
 * Bake the static shadow casters under root. skip(o) returns true for objects that move, scale or
 * hide (their whole subtree keeps casting on its own). Resolves when the baked meshes have taken over.
 */
export async function bakeStaticShadows(scene, camera, root, light, skip = () => false, { budget = 6 } = {}) {
  const t0 = performance.now();
  let busy = 0;
  root.updateMatrixWorld(true);
  const buckets = new Map();   // depth culling side -> parts
  const baked = [];
  const visit = (o) => {
    if (skip(o) || !o.visible) return;
    if (o.isMesh && o.castShadow && !o.isSkinnedMesh && !o.isInstancedMesh && !o.customDepthMaterial && !o.geometry.morphAttributes.position) {
      const g = o.geometry, mats = [].concat(o.material);
      const n = g.index ? g.index.count : g.attributes.position.count;
      const dr0 = g.drawRange.start, dr1 = Math.min(n, g.drawRange.start + g.drawRange.count);
      const parts = Array.isArray(o.material) ? g.groups.map((gr) => [gr.start, gr.count, mats[gr.materialIndex]]) : [[0, n, mats[0]]];
      if (parts.every(([, , m]) => bakeable(m))) {
        for (const [s, c, m] of parts) {
          const a = Math.max(s, dr0), b = Math.min(s + c, dr1);
          if (b <= a) continue;
          const side = m.shadowSide !== null && m.shadowSide !== undefined ? m.shadowSide : FLIP[m.side];
          if (!buckets.has(side)) buckets.set(side, []);
          buckets.get(side).push({ g, mw: o.matrixWorld, a, b });
        }
        baked.push(o);
      }
    }
    for (const c of o.children) visit(c);
  };
  visit(root);
  busy += performance.now() - t0;

  const geos = [];
  for (const [side, parts] of buckets) {
    // each source geometry's vertices once per bucket, then the index ranges that use them
    const seen = new Map();
    let nv = 0, ni = 0;
    for (const p of parts) {
      const key = p.g.uuid + p.mw.elements.join();
      if (!seen.has(key)) { seen.set(key, nv); nv += p.g.attributes.position.count; }
      p.base = seen.get(key); p.key = key; ni += p.b - p.a;
    }
    const pos = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    const done = new Set();
    let oi = 0, slice = performance.now();
    for (const p of parts) {
      if (performance.now() - slice > budget) { busy += performance.now() - slice; await idle(); slice = performance.now(); }
      const P = p.g.attributes.position;
      if (!done.has(p.key)) {
        done.add(p.key);
        // applyMatrix4 by hand (the same sums, no per-vertex Vector3); getX/Y/Z undo meshopt's quantisation
        const e = p.mw.elements;
        for (let c0 = 0; c0 < P.count; c0 += 40000) {
          if (performance.now() - slice > budget) { busy += performance.now() - slice; await idle(); slice = performance.now(); }
          for (let i = c0, o = (p.base + c0) * 3, end = Math.min(P.count, c0 + 40000); i < end; i++, o += 3) {
            const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
            const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
            pos[o] = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
            pos[o + 1] = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
            pos[o + 2] = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
          }
        }
      }
      const I = p.g.index ? p.g.index.array : null;
      if (I) for (let i = p.a; i < p.b; i++) idx[oi++] = I[i] + p.base;
      else for (let i = p.a; i < p.b; i++) idx[oi++] = i + p.base;
    }
    busy += performance.now() - slice;
    geos.push([side, pos, idx]);
  }

  const out = [];
  for (const [side, pos, idx] of geos) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);   // never culled
    // the material only carries the culling side into the depth pass: shadowSide[side] flips it back
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: FLIP[side], colorWrite: false, depthWrite: false }));
    mesh.name = 'static-shadow'; mesh.castShadow = true; mesh.receiveShadow = false;
    mesh.frustumCulled = false;   // three culled each caster against the shadow frustum; the GPU clips the rest the same way
    mesh.layers.set(SHADOW_LAYER);
    mesh.matrixAutoUpdate = false;
    out.push(mesh);
  }
  // the swap, all at once between two frames
  camera.layers.enable(SHADOW_LAYER);
  const show = (v) => { for (const m of out) m.visible = v; };
  const before = scene.onBeforeRender;
  scene.onBeforeRender = function (...a) { show(false); before.apply(this, a); };   // out of the main draw lists
  const sh = light.shadow, upd = sh.updateMatrices;
  sh.updateMatrices = function (...a) { show(true); return upd.apply(this, a); };   // into the shadow map
  for (const m of out) scene.add(m);
  for (const o of baked) o.castShadow = false;
  return { proxies: out, baked, ms: busy, wall: performance.now() - t0 };
}
