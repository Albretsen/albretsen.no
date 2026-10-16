// Habit / habits.js — crystal habits as three.js geometry.
// "Habit" is the mineralogist's word for the shape a crystal keeps growing into.
import * as THREE from 'three';
import { ConvexGeometry } from '../vendor/addons/geometries/ConvexGeometry.js';

const hull = pts => { const g = new ConvexGeometry(pts.map(p => new THREE.Vector3(...p))); g.computeVertexNormals(); return g; };
const fit = (g, r = 1) => { g.computeBoundingSphere(); const s = r / g.boundingSphere.radius; g.scale(s, s, s); return g; };

export const HABITS = {
  octahedron: {
    label: 'Octahedral', faces: 8, edges: 12,
    make: () => fit(hull([[1, 0, 0], [-1, 0, 0], [0, 1.08, 0], [0, -1.08, 0], [0, 0, 1], [0, 0, -1]])),
  },
  cube: {
    label: 'Cubic', faces: 6, edges: 12,
    make: () => fit(hull([-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => [x, y, z]))))),
  },
  rhombohedron: {
    label: 'Rhombohedral', faces: 6, edges: 12,
    make: () => {
      const n = new THREE.Vector3(1, 1, 1).normalize(), k = 1.55;
      const pts = [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => {
        const v = new THREE.Vector3(x, y, z); return v.addScaledVector(n, (k - 1) * v.dot(n)).toArray();
      })));
      const g = hull(pts);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(n, new THREE.Vector3(0, 1, 0)));
      return fit(g);
    },
  },
  dodecahedron: {
    label: 'Rhombic dodecahedral', faces: 12, edges: 24,
    make: () => fit(hull([
      ...[-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => [x, y, z]))),
      [2, 0, 0], [-2, 0, 0], [0, 2, 0], [0, -2, 0], [0, 0, 2], [0, 0, -2]])),
  },
  prism: {
    label: 'Hexagonal prism, pyramid-capped', faces: 18, edges: 36,
    make: () => {
      const pts = [];
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; pts.push([Math.cos(a) * 0.55, 0.9, Math.sin(a) * 0.55], [Math.cos(a) * 0.55, -0.9, Math.sin(a) * 0.55]); }
      pts.push([0, 1.55, 0], [0, -1.55, 0]);
      return fit(hull(pts));
    },
  },
  pyritohedron: {
    label: 'Pyritohedral', faces: 12, edges: 30,
    make: () => {
      const h = 0.38, P = [];
      [-1, 1].forEach(x => [-1, 1].forEach(y => [-1, 1].forEach(z => P.push([x, y, z]))));
      [-1, 1].forEach(a => [-1, 1].forEach(b => {
        P.push([0, a * (1 + h), b * (1 - h * h)], [a * (1 + h), b * (1 - h * h), 0], [b * (1 - h * h), 0, a * (1 + h)]);
      }));
      return fit(hull(P));
    },
  },
};
export const HABIT_ORDER = ['octahedron', 'dodecahedron', 'rhombohedron', 'prism', 'pyritohedron', 'cube'];
