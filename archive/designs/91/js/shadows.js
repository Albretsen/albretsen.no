// Living Town: one shadow caster for everything that never moves.
// The shadow map is redrawn every frame because people walk through it, and drawing the town into it
// took some 350 draw calls. The depth pass does not care about materials, only about which faces it
// culls, so every static caster is baked once into a world-space mesh per culling side. Those meshes
// live on a layer only the sun's shadow camera sees; the originals stop casting and render as before.
// The map comes out the same: the same triangles, the same sides, the same bias.
//
// three tests layers against the main camera in both passes, so the proxies sit on a layer of their own
// that the main camera also sees (raycasts, on layer 0, never hit them), and they are hidden while three
// builds the frame's draw lists, then shown again just before the sun's shadow map is drawn.
import * as THREE from 'three';

export const SHADOW_LAYER = 1;
// three's depth pass flips the culling side unless a material sets shadowSide (WebGLShadowMap)
const FLIP = { [THREE.FrontSide]: THREE.BackSide, [THREE.BackSide]: THREE.FrontSide, [THREE.DoubleSide]: THREE.DoubleSide };

function bakeable(o, m) {
  if (!m || !m.visible || m.wireframe) return false;
  if (m.alphaTest > 0 || (m.displacementMap && m.displacementScale !== 0) || m.clipShadows) return false;
  return true;
}

/**
 * Bake the static shadow casters under root. skip(o) returns true for objects that move, scale or
 * hide (their whole subtree keeps casting on its own). Returns the proxy meshes, already added to scene.
 */
export function bakeStaticShadows(scene, camera, root, light, skip = () => false) {
  root.updateMatrixWorld(true);
  const buckets = new Map();   // depth side -> [{ geo, matrix, ranges }]
  const baked = [];
  const visit = (o) => {
    if (skip(o) || !o.visible) return;
    if (o.isMesh && o.castShadow && !o.isSkinnedMesh && !o.isInstancedMesh && !o.customDepthMaterial && !o.geometry.morphAttributes.position) {
      const g = o.geometry, mats = [].concat(o.material);
      const n = g.index ? g.index.count : g.attributes.position.count;
      const dr0 = g.drawRange.start, dr1 = Math.min(n, g.drawRange.start + g.drawRange.count);
      const parts = Array.isArray(o.material) ? g.groups.map((gr) => [gr.start, gr.count, mats[gr.materialIndex]]) : [[0, n, mats[0]]];
      if (parts.every(([, , m]) => bakeable(o, m))) {
        for (const [s, c, m] of parts) {
          const a = Math.max(s, dr0), b = Math.min(s + c, dr1);
          if (b <= a) continue;
          const side = m.shadowSide !== null && m.shadowSide !== undefined ? m.shadowSide : FLIP[m.side];
          if (!buckets.has(side)) buckets.set(side, []);
          buckets.get(side).push({ g, mw: o.matrixWorld, a, b });
        }
        o.castShadow = false;
        baked.push(o);
      }
    }
    for (const c of o.children) visit(c);
  };
  visit(root);

  const out = [];
  const v = new THREE.Vector3();
  for (const [side, parts] of buckets) {
    // each source geometry's vertices once per bucket, then the index ranges that use them
    const seen = new Map();
    let nv = 0, ni = 0;
    for (const p of parts) {
      const key = p.g.uuid + p.mw.elements.join(',');
      if (!seen.has(key)) { seen.set(key, nv); nv += p.g.attributes.position.count; }
      p.base = seen.get(key); p.key = key; ni += p.b - p.a;
    }
    const pos = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    const done = new Set();
    let oi = 0;
    for (const p of parts) {
      const P = p.g.attributes.position;
      if (!done.has(p.key)) {
        done.add(p.key);
        for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(p.mw); pos[(p.base + i) * 3] = v.x; pos[(p.base + i) * 3 + 1] = v.y; pos[(p.base + i) * 3 + 2] = v.z; }
      }
      const I = p.g.index;
      for (let i = p.a; i < p.b; i++) idx[oi++] = (I ? I.getX(i) : i) + p.base;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere();
    // the material only carries the culling side into the depth pass: shadowSide[side] flips it back
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: FLIP[side], colorWrite: false, depthWrite: false }));
    mesh.name = 'static-shadow'; mesh.castShadow = true; mesh.receiveShadow = false;
    mesh.frustumCulled = false;   // three culled each caster against the shadow frustum; the GPU clips the rest the same way
    mesh.layers.set(SHADOW_LAYER);
    mesh.matrixAutoUpdate = false;
    scene.add(mesh);
    out.push(mesh);
  }
  camera.layers.enable(SHADOW_LAYER);
  const show = (v) => { for (const m of out) m.visible = v; };
  const before = scene.onBeforeRender;
  scene.onBeforeRender = function (...a) { show(false); before.apply(this, a); };   // out of the main draw lists
  const sh = light.shadow, upd = sh.updateMatrices;
  sh.updateMatrices = function (...a) { show(true); return upd.apply(this, a); };   // into the shadow map
  return { proxies: out, baked };
}
