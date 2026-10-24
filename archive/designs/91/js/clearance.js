// Living Town: how much room the camera has. The street furniture (palms, parasols, string lights,
// lamps, planters, the railing) stands where a flight to the sea or a zoom out of the terrace would
// otherwise pass straight through it: a palm crown inches from the lens fills half the frame with
// dark blurred fronds for a few frames, then vanishes behind the near plane. CameraRig asks this
// for the distance from a point to the nearest prop surface and shapes its moves around them.
//
// Exact distance to the props' triangles (a few hundred meshes of a few hundred triangles each),
// with a box test first, so only the props within reach are looked at. The merged town buildings
// are left out: no scripted view comes near a facade.
import * as THREE from 'three';

const BIG = 40;   // ground, promenade and sea slabs, the merged town: not furniture

export class Clearance {
  /** `open`: objects that scale as they move (the parasols), measured at full size. */
  constructor(root, open = []) {
    this.items = [];
    const kept = open.map((o) => o.scale.clone());
    for (const o of open) o.scale.setScalar(1);
    root.updateMatrixWorld(true);
    const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), size = new THREE.Vector3();
    root.traverse((o) => {
      if (!o.isMesh || /shadow/i.test(o.name)) return;
      const g = o.geometry, pos = g.attributes.position;
      if (!pos) return;
      const idx = g.index ? g.index.array : null;
      const n = idx ? idx.length : pos.count;
      const add = (mw) => {
        // world-space triangles and their box, worked out on first use
        const box = new THREE.Box3();
        if (!g.boundingBox) g.computeBoundingBox();
        box.copy(g.boundingBox).applyMatrix4(mw);
        box.getSize(size);
        if (size.x > BIG || size.z > BIG) return;
        this.items.push({ box, mw: mw.clone(), tris: null, mesh: o, idx, pos, n });
      };
      if (o.isInstancedMesh) for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); add(m4.clone().premultiply(o.matrixWorld)); }
      else add(o.matrixWorld);
    });
    open.forEach((o, i) => o.scale.copy(kept[i]));
    root.updateMatrixWorld(true);
    this._v = v;
  }

  _tris(it) {
    if (it.tris) return it.tris;
    const t = new Float32Array(it.n * 3), v = this._v;
    for (let i = 0; i < it.n; i++) {
      v.fromBufferAttribute(it.pos, it.idx ? it.idx[i] : i).applyMatrix4(it.mw);
      t[i * 3] = v.x; t[i * 3 + 1] = v.y; t[i * 3 + 2] = v.z;
    }
    it.tris = t; it.pos = it.idx = null;
    return t;
  }

  /** Distance from p to the nearest prop surface, or `reach` when nothing is that close. */
  at(p, reach = 4, items = this.items) {
    let best = reach, best2 = reach * reach;
    for (const it of items) {
      if (it.box.distanceToPoint(p) >= best) continue;
      const t = this._tris(it);
      for (let i = 0; i < t.length; i += 9) {
        const d2 = triDist2(p.x, p.y, p.z, t, i);
        if (d2 < best2) { best2 = d2; best = Math.sqrt(d2); }
      }
    }
    return best;
  }

  /** The props whose boxes come within `reach` of a box (to test a whole path against fewer). */
  near(box, reach = 4) {
    const b = box.clone().expandByScalar(reach);
    return this.items.filter((it) => it.box.intersectsBox(b));
  }
}

// squared distance from (px,py,pz) to triangle t[i..i+8] (Ericson, Real-Time Collision Detection 5.1.5)
function triDist2(px, py, pz, t, i) {
  const ax = t[i], ay = t[i + 1], az = t[i + 2], bx = t[i + 3], by = t[i + 4], bz = t[i + 5], cx = t[i + 6], cy = t[i + 7], cz = t[i + 8];
  const abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az;
  const apx = px - ax, apy = py - ay, apz = pz - az;
  const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
  let qx, qy, qz;
  if (d1 <= 0 && d2 <= 0) { qx = ax; qy = ay; qz = az; }
  else {
    const bpx = px - bx, bpy = py - by, bpz = pz - bz;
    const d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
    if (d3 >= 0 && d4 <= d3) { qx = bx; qy = by; qz = bz; }
    else {
      const vc = d1 * d4 - d3 * d2;
      if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); qx = ax + v * abx; qy = ay + v * aby; qz = az + v * abz; }
      else {
        const cpx = px - cx, cpy = py - cy, cpz = pz - cz;
        const d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
        if (d6 >= 0 && d5 <= d6) { qx = cx; qy = cy; qz = cz; }
        else {
          const vb = d5 * d2 - d1 * d6;
          if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); qx = ax + w * acx; qy = ay + w * acy; qz = az + w * acz; }
          else {
            const va = d3 * d6 - d5 * d4;
            if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); qx = bx + w * (cx - bx); qy = by + w * (cy - by); qz = bz + w * (cz - bz); }
            else { const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; qx = ax + abx * v + acx * w; qy = ay + aby * v + acy * w; qz = az + abz * v + acz * w; }
          }
        }
      }
    }
  }
  const dx = px - qx, dy = py - qy, dz = pz - qz;
  return dx * dx + dy * dy + dz * dz;
}
