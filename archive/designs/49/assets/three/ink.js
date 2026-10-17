// Habit / ink.js — turns any three.js object into a pen drawing.
// Edges are drawn twice with draftsman overshoot and a little wobble,
// faces are paper with screen-space hatching where the light falls away,
// and (optionally) hidden edges are drawn dashed, the way Sowerby drew
// crystal habits in British Mineralogy (1802-17).
//
// Requires an import map that resolves "three" (see preview.html).
import * as THREE from 'three';
import { LineSegments2 } from '../vendor/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from '../vendor/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from '../vendor/addons/lines/LineMaterial.js';

export const THEMES = {
  light: { paper: '#f2f5f6', ink: '#1c2427', faint: '#98a0a2', hatch: '#1c2427' },
  dark:  { paper: '#131819', ink: '#e6eaec', faint: '#6e7678', hatch: '#e6eaec' },
};

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pen-ify a list of segments [ax,ay,az,bx,by,bz, ...]. */
export function sketchSegments(src, { overshoot = 0.07, jitter = 0.012, passes = 2, seed = 7, scale = 1 } = {}) {
  const r = rng(seed), out = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), j = new THREE.Vector3();
  for (let i = 0; i < src.length; i += 6) {
    a.set(src[i], src[i + 1], src[i + 2]); b.set(src[i + 3], src[i + 4], src[i + 5]);
    d.subVectors(b, a); const len = d.length(); if (len < 1e-6) continue;
    for (let p = 0; p < passes; p++) {
      const o1 = overshoot * (0.25 + r() * 0.9) * Math.min(len, 1.4 * scale);
      const o2 = overshoot * (0.25 + r() * 0.9) * Math.min(len, 1.4 * scale);
      const dn = d.clone().normalize();
      const jj = jitter * scale * (p === 0 ? 0.5 : 1);
      j.set(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(jj);
      const A = a.clone().addScaledVector(dn, -o1).add(j);
      j.set(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(jj);
      const B = b.clone().addScaledVector(dn, o2).add(j);
      out.push(A.x, A.y, A.z, B.x, B.y, B.z);
    }
  }
  return new Float32Array(out);
}

const hatchVert = /* glsl */`
  varying vec3 vN;
  void main() {
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const hatchFrag = /* glsl */`
  uniform vec3 uPaper; uniform vec3 uInk; uniform vec3 uLight;
  uniform float uSpacing; uniform float uPR; uniform float uStrength;
  varying vec3 vN;
  float stroke(float x, float s, float w) {
    float f = abs(fract(x / s) - 0.5) * s;
    return 1.0 - smoothstep(w - 0.6, w + 0.6, f);
  }
  void main() {
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    float d = dot(n, normalize(uLight));
    float tone = 0.5 + 0.5 * d;                 // 0 dark .. 1 lit
    vec2 p = gl_FragCoord.xy / uPR;
    float wob = sin(p.y * 0.045) * 1.6 + sin(p.x * 0.031) * 1.1;
    float s = uSpacing;
    float h1 = stroke(p.x + p.y + wob, s, 0.55) * (1.0 - smoothstep(0.42, 0.56, tone));
    float h2 = stroke(p.x - p.y - wob, s * 1.15, 0.5) * (1.0 - smoothstep(0.22, 0.34, tone));
    float h3 = stroke(p.x + wob * 0.5, s * 0.8, 0.45) * (1.0 - smoothstep(0.06, 0.16, tone));
    float ink = clamp(max(max(h1 * 0.55, h2 * 0.6), h3 * 0.6), 0.0, 1.0) * uStrength;
    gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.0);
    #include <colorspace_fragment>
  }`;

export class InkKit {
  constructor({ theme = 'light', pixelRatio = 1, width = 1.25 } = {}) {
    this.theme = theme; this.pr = pixelRatio; this.baseWidth = width;
    this.lineMats = []; this.fillMats = [];
    this.res = new THREE.Vector2(1, 1);
  }
  colors() { return THEMES[this.theme]; }
  fill({ spacing = 6, strength = 1, light = [0.45, 0.85, 0.55] } = {}) {
    const c = this.colors();
    const m = new THREE.ShaderMaterial({
      vertexShader: hatchVert, fragmentShader: hatchFrag, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: 1.5, polygonOffsetUnits: 2,
      uniforms: {
        uPaper: { value: new THREE.Color(c.paper) }, uInk: { value: new THREE.Color(c.hatch) },
        uLight: { value: new THREE.Vector3(...light) }, uSpacing: { value: spacing },
        uPR: { value: this.pr }, uStrength: { value: strength },
      },
    });
    this.fillMats.push(m); return m;
  }
  line({ width = this.baseWidth, faint = false, dashed = false, opacity = 1 } = {}) {
    const c = this.colors();
    const m = new LineMaterial({
      color: new THREE.Color(faint ? c.faint : c.ink).getHex(), linewidth: width * this.pr,
      dashed, dashSize: 0.06, gapSize: 0.05, transparent: opacity < 1 || dashed, opacity,
      worldUnits: false, alphaToCoverage: false,
    });
    m.userData.faint = faint;
    m.resolution.copy(this.res);
    this.lineMats.push(m); return m;
  }
  setSize(w, h) { this.res.set(w * this.pr, h * this.pr); this.lineMats.forEach(m => m.resolution.copy(this.res)); }
  setTheme(t) {
    this.theme = t; const c = this.colors();
    this.lineMats.forEach(m => m.color.set(m.userData.faint ? c.faint : c.ink));
    this.fillMats.forEach(m => { m.uniforms.uPaper.value.set(c.paper); m.uniforms.uInk.value.set(c.hatch); });
  }
  /** Draw `root` (any Object3D) as ink. Returns {lines:[], hidden:[]} so callers can animate. */
  inkify(root, { threshold = 28, hidden = false, hatch = true, seed = 3, width, spacing = 6, scale = 1, fillStrength = 1, keepMaterials = [] } = {}) {
    const lines = [], hiddenLines = [];
    const fill = hatch ? this.fill({ spacing, strength: fillStrength }) : this.fill({ strength: 0 });
    let k = 0;
    root.updateMatrixWorld(true);
    const meshes = [];
    root.traverse(o => { if (o.isMesh) meshes.push(o); });
    for (const o of meshes) {
      if (keepMaterials.includes(o.name) || o.userData.keepMaterial) continue;
      o.material = fill;
      const eg = new THREE.EdgesGeometry(o.geometry, threshold);
      const segs = sketchSegments(eg.attributes.position.array, { seed: seed + k++, scale });
      const g = new LineSegmentsGeometry().setPositions(segs);
      const l = new LineSegments2(g, this.line({ width }));
      l.renderOrder = 2; o.add(l); lines.push(l);
      if (hidden) {
        const hg = new LineSegmentsGeometry().setPositions(eg.attributes.position.array);
        const hm = this.line({ width: (width ?? this.baseWidth) * 0.8, dashed: true, opacity: 0.55 });
        hm.depthFunc = THREE.GreaterDepth; hm.depthWrite = false;
        hm.dashSize = 0.07 * scale; hm.gapSize = 0.06 * scale;
        const hl = new LineSegments2(hg, hm); hl.computeLineDistances(); hl.renderOrder = 1;
        o.add(hl); hiddenLines.push(hl);
      }
    }
    return { lines, hidden: hiddenLines };
  }
  /** A pen-hatched cast shadow on the ground plane (y = 0). */
  shadow({ rx = 1, rz = 0.6, spacing = 0.05, angle = -0.6, seed = 11, cx = 0, cz = 0, width } = {}) {
    const r = rng(seed), pts = [];
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const R = Math.max(rx, rz) * 1.1;
    for (let t = -R; t <= R; t += spacing * (0.8 + r() * 0.4)) {
      // line along direction (ca, sa) offset by t along the normal; clip to ellipse
      const nx = -sa, nz = ca, px = nx * t, pz = nz * t;
      // solve ((px+ca*s)/rx)^2 + ((pz+sa*s)/rz)^2 = 1
      const A = (ca / rx) ** 2 + (sa / rz) ** 2, B = 2 * (px * ca / rx ** 2 + pz * sa / rz ** 2), C = (px / rx) ** 2 + (pz / rz) ** 2 - 1;
      const disc = B * B - 4 * A * C; if (disc <= 0) continue;
      const s0 = (-B - Math.sqrt(disc)) / (2 * A) * (0.82 + r() * 0.2), s1 = (-B + Math.sqrt(disc)) / (2 * A) * (0.82 + r() * 0.2);
      pts.push(cx + px + ca * s0, 0.001, cz + pz + sa * s0, cx + px + ca * s1, 0.001, cz + pz + sa * s1);
    }
    const g = new LineSegmentsGeometry().setPositions(pts);
    return new LineSegments2(g, this.line({ width: (width ?? this.baseWidth) * 0.7, faint: true }));
  }
}

/** Reveal a LineSegments2 progressively (0..1) — the pen drawing itself. */
export function drawProgress(line, t) {
  const total = line.geometry.attributes.instanceStart.count;
  line.geometry.instanceCount = Math.max(0, Math.floor(total * t));
}
