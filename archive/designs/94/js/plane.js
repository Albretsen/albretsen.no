// Evening post: the paper plane, its light trail, and the letters it drops.
// The plane is folded from one airmail sheet: paper ground, red and blue edge stripes, a stamp.
import * as THREE from 'three';

const INK = '#232c57', BURG = '#6e1f33', PAPER = '#f4eadb', POWDER = '#a9c6e0';

function paperTexture() {
  const S = 512;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.fillStyle = '#f7f0e3'; g.fillRect(0, 0, S, S);
  // paper grain
  const img = g.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n * 0.8;
  }
  g.putImageData(img, 0, 0);
  // airmail stripes along the trailing edge (v near 1) and the leading edges
  const stripe = (y0, h) => {
    g.save(); g.beginPath(); g.rect(0, y0, S, h); g.clip();
    for (let x = -S; x < S * 2; x += 44) {
      const k = ((x + S) / 44) % 4;
      g.fillStyle = k === 0 ? '#c8333f' : k === 2 ? '#2d4f9e' : '#f7f0e3';
      g.beginPath(); g.moveTo(x, y0 + h); g.lineTo(x + 22, y0 + h); g.lineTo(x + 22 + h, y0); g.lineTo(x + h, y0); g.fill();
    }
    g.restore();
  };
  stripe(S - 70, 70);
  g.save(); g.translate(0, 0); stripe(0, 0); g.restore();
  // a stamp near the tail of the left wing
  g.save(); g.translate(S * 0.68, S * 0.72);
  g.fillStyle = '#fffaf0'; g.fillRect(-34, -42, 68, 84);
  g.fillStyle = BURG; g.fillRect(-28, -36, 56, 72);
  g.fillStyle = '#f2b5b8'; g.beginPath(); g.arc(0, 6, 15, Math.PI, 0); g.fill();
  g.fillStyle = '#d9a42b'; g.beginPath(); g.arc(0, 6, 8, Math.PI, 0); g.fill();
  g.fillStyle = PAPER; g.font = '600 13px Federo, Georgia, serif'; g.textAlign = 'center'; g.fillText('AS', 0, -16);
  g.restore();
  // postmark rings
  g.strokeStyle = 'rgba(35,44,87,.55)'; g.lineWidth = 3;
  g.beginPath(); g.arc(S * 0.48, S * 0.74, 40, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 2;
  for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(S * 0.48 - 70 - k * 4, S * 0.66 + k * 12); g.bezierCurveTo(S * 0.4, S * 0.62 + k * 12, S * 0.52, S * 0.7 + k * 12, S * 0.6, S * 0.66 + k * 12); g.stroke(); }
  // airmail dashes along both leading edges (nose at the top centre, wing tips at the bottom corners)
  g.lineWidth = 22; g.lineCap = 'butt';
  for (const side of [-1, 1]) {
    const x1 = S * (0.5 + side * 0.476), y1 = S * 0.97, len = Math.hypot(x1 - S / 2, y1), n = 14;
    const ux = (x1 - S / 2) / len, uy = y1 / len, ox = -uy * side * 13, oy = ux * side * 13; // inset toward the wing
    for (let k = 0; k < n; k++) {
      const a = (k / n) * len, b = ((k + 0.5) / n) * len;
      g.strokeStyle = k % 2 ? '#2d4f9e' : '#c8333f';
      g.beginPath(); g.moveTo(S / 2 + ux * a + ox, uy * a + oy); g.lineTo(S / 2 + ux * b + ox, uy * b + oy); g.stroke();
    }
  }
  // fold line
  g.strokeStyle = 'rgba(35,44,87,.28)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

/** Build the folded dart. Forward is +Z, up +Y, span along X. About 1.5 m across. */
export function makePlane() {
  const L = 1.0, span = 0.78, tail = -0.62;
  // points: nose, wing tips, wing roots at the tail, keel
  const N = [0, 0.02, L];
  const WL = [span, 0.13, tail], WR = [-span, 0.13, tail];
  const TL = [0.05, 0.0, tail - 0.02], TR = [-0.05, 0.0, tail - 0.02];
  const KL = [0.012, -0.2, tail + 0.05], KR = [-0.012, -0.2, tail + 0.05];
  const UL = [span + 0.02, 0.27, tail + 0.05], UR = [-span - 0.02, 0.27, tail + 0.05]; // winglets
  const WLi = [span - 0.05, 0.12, tail + 0.17], WRi = [-span + 0.05, 0.12, tail + 0.17];
  const tris = [
    // wings (top side), with a crease at the root
    [N, TL, WL], [N, WR, TR],
    // keel folds
    [N, KL, TL], [N, TR, KR],
    // winglets
    [WL, UL, WLi], [WR, WRi, UR],
  ];
  const pos = [], uv = [];
  const toUV = (p) => [0.5 + p[0] / (span * 2.1), (L - p[2]) / (L - tail + 0.04)];
  for (const t of tris) for (const p of t) { pos.push(...p); uv.push(...toUV(p)); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  g.addGroup(0, 6, 0); g.addGroup(6, 6, 1); g.addGroup(12, 6, 0); // wings, keel folds, winglets
  const tex = paperTexture();
  // the paper keeps a faint glow of its own so it stays readable against the roofs at blue hour
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffe6c4, emissiveIntensity: 0.08, side: THREE.DoubleSide, roughness: 0.8, metalness: 0, flatShading: true, envMapIntensity: 0.6 });
  // the keel folds sit in their own shade of paper so the dart reads as folded, not flat
  const keel = mat.clone(); keel.color.set(0xc9cfe0);
  const mesh = new THREE.Mesh(g, [mat, keel]);
  mesh.castShadow = true;
  mesh.scale.setScalar(1.7);
  const root = new THREE.Group(); // yaw/pitch
  const roll = new THREE.Group(); // bank
  roll.add(mesh); root.add(roll);
  root.userData.tips = [new THREE.Vector3(...UL), new THREE.Vector3(...UR)];
  root.userData.mesh = mesh;
  // a small warm lantern under the nose that lights facades as you skim them
  return { root, roll, mesh, mat, keel };
}

/** Two ribbons from the wing tips, glowing warm. */
export class Trail {
  constructor(scene, n = 46) {
    this.n = n;
    this.ribbons = [0, 1].map(() => {
      const pts = Array.from({ length: n }, () => new THREE.Vector3());
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 2 * 3), a = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) { a[i * 2] = a[i * 2 + 1] = 1 - i / (n - 1); }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('alpha', new THREE.BufferAttribute(a, 1));
      const idx = [];
      for (let i = 0; i < n - 1; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      geo.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uColor: { value: new THREE.Color(1.5, 0.95, 0.5) }, uK: { value: 1 } },
        vertexShader: 'attribute float alpha; varying float vA; void main(){ vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'uniform vec3 uColor; uniform float uK; varying float vA; void main(){ gl_FragColor = vec4(uColor * vA * vA * uK, 1.); }',
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      return { pts, geo, mesh, mat };
    });
    this.primed = false;
  }
  reset(p) { for (const r of this.ribbons) for (const q of r.pts) q.copy(p); this.primed = true; }
  update(tipsWorld, side, k = 1) {
    this.ribbons.forEach((r, ri) => {
      const pts = r.pts;
      for (let i = pts.length - 1; i > 0; i--) pts[i].copy(pts[i - 1]);
      pts[0].copy(tipsWorld[ri]);
      const pos = r.geo.attributes.position;
      for (let i = 0; i < pts.length; i++) {
        const q = 1 - i / pts.length; const w = 0.05 * q * q;
        pos.setXYZ(i * 2, pts[i].x + side.x * w, pts[i].y + side.y * w, pts[i].z + side.z * w);
        pos.setXYZ(i * 2 + 1, pts[i].x - side.x * w, pts[i].y - side.y * w, pts[i].z - side.z * w);
      }
      pos.needsUpdate = true;
      r.mat.uniforms.uK.value = k;
    });
  }
}

/** A small envelope that flies from the plane to a window. */
export function makeEnvelope() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 80;
  const g = cv.getContext('2d');
  g.fillStyle = '#fbf3e6'; g.fillRect(0, 0, 128, 80);
  g.strokeStyle = 'rgba(35,44,87,.45)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(2, 2); g.lineTo(64, 46); g.lineTo(126, 2); g.stroke();
  g.fillStyle = '#c8333f'; g.beginPath(); g.arc(64, 46, 8, 0, Math.PI * 2); g.fill();
  for (let x = -80; x < 128; x += 16) { g.fillStyle = (x / 16) % 2 ? '#c8333f' : '#2d4f9e'; g.beginPath(); g.moveTo(x, 80); g.lineTo(x + 8, 80); g.lineTo(x + 14, 74); g.lineTo(x + 6, 74); g.fill(); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8, emissive: 0xffb860, emissiveIntensity: 0.15 });
  return { geo: new THREE.PlaneGeometry(0.62, 0.39), mat };
}
