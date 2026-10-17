// Heure Bleue: a terrace above a town where zinc mansards meet whitewashed
// cubes, a bay, a headland and a sun you can drag. Built only from three.js
// primitives and one family of poster shaders (banded sky, toon light,
// atmospheric fog, film grain). Albretsen AS, design 64.
//
//   import { createHeureBleue } from './3d/heure-bleue.js'
//   const scene = createHeureBleue(canvas, { time: 0.18 })
//   scene.setTime(0.8)             // 0 = deep blue hour, 1 = golden afternoon
//   scene.onTime = t => {}         // called while the visitor drags the sun
//   scene.dispose()
//
// three.js is vendored at ../vendor/three.module.min.js (r170, MIT).
import * as THREE from '../vendor/three.module.min.js';

// Poster colours are authored and output in sRGB, untouched by colour management.
THREE.ColorManagement.enabled = false;

export const PALETTE = {
  pink: '#f2b5b8', mustard: '#d9a42b', powder: '#a9c6e0', burgundy: '#6e1f33',
  plaster: '#f4eadb', zinc: '#8d9bb4', ink: '#232c57', magenta: '#c8336e',
};

// ---------------------------------------------------------------- time of day
// Keyframes by sun elevation in degrees.
const KEYS = [-7, -2.5, 0.5, 4, 9, 15];
const C = (a) => a.map((h) => new THREE.Color(h));
const RAMP = {
  zenith:  C(['#1b2450', '#2c3b74', '#566fae', '#86a8d4', '#9fc0e2', '#a8c8e6']),
  mid:     C(['#36447f', '#7a78b2', '#c995b4', '#eeb0b4', '#efc2b6', '#c6d8e8']),
  horizon: C(['#7d6a9c', '#df98a3', '#f0ad62', '#f4bf68', '#f4cf8c', '#f3dfb8']),
  sun:     C(['#ee8a63', '#f09460', '#f3a24c', '#f4b54b', '#f6d17b', '#fbe9b4']),
  key:     C(['#000000', '#140c10', '#c77b5e', '#eaa877', '#f4d3ac', '#fff0d8']),
  amb:     C(['#3d4782', '#6a6aa3', '#9a8bb6', '#aab0cf', '#b9c7dc', '#c6d5e5']),
  water:   C(['#1b2652', '#2f3b76', '#43568f', '#5677aa', '#6893c2', '#76a5cf']),
};
function rampAt(name, e) {
  const k = KEYS, r = RAMP[name];
  if (e <= k[0]) return r[0].clone();
  for (let i = 0; i < k.length - 1; i++) {
    if (e <= k[i + 1]) {
      const f = (e - k[i]) / (k[i + 1] - k[i]);
      const s = f * f * (3 - 2 * f);
      return r[i].clone().lerp(r[i + 1], s);
    }
  }
  return r[r.length - 1].clone();
}
export const timeToElevation = (t) => -7 + t * 22; // degrees
const elevationToTime = (e) => (e + 7) / 22;

// ------------------------------------------------------------------- shaders
const GLSL_COMMON = /* glsl */ `
  uniform vec3 uSunDir; uniform vec3 uKey; uniform vec3 uAmb; uniform vec3 uFog;
  uniform vec3 uZenith; uniform vec3 uMid; uniform vec3 uHorizon; uniform vec3 uSunCol;
  uniform float uNight; uniform float uTime; uniform float uGrain;
  float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x), mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x), f.y); }
  vec3 grain(vec3 c){ return c + (hash12(gl_FragCoord.xy + fract(uTime)*91.7) - .5) * uGrain; }
  vec3 fogMix(vec3 c, vec3 wp, float near, float far){
    float d = length(wp - cameraPosition);
    float f = smoothstep(near, far, d);
    return mix(c, uFog, f * .92);
  }
`;

const VERT = /* glsl */ `
  varying vec3 vWorld; varying vec3 vN; varying vec3 vCol; varying vec2 vUv;
  #ifdef SWAY
  uniform float uTime;
  #endif
  void main(){
    vec4 p = vec4(position, 1.); vec3 n = normal;
    #ifdef USE_INSTANCING
      p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
    #endif
    vec4 wp = modelMatrix * p;
    #ifdef SWAY
      float w = sin(uTime * .9 + wp.x * .7 + wp.y * .4) * .5 + sin(uTime * 1.7 + wp.z * 1.3) * .25;
      wp.x += w * .035 * (1. + uv.y); wp.z += w * .02;
    #endif
    vWorld = wp.xyz; vN = normalize(mat3(modelMatrix) * n); vUv = uv;
    #ifdef USE_INSTANCING_COLOR
      vCol = instanceColor;
    #else
      vCol = vec3(1.);
    #endif
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Toon "poster" surface: two hard light bands + sky fill + fog + grain.
const FRAG_SOLID = /* glsl */ `
  ${GLSL_COMMON}
  uniform vec3 uColor; uniform float uFogNear; uniform float uFogFar; uniform float uRim; uniform float uGlow;
  varying vec3 vWorld; varying vec3 vN; varying vec3 vCol; varying vec2 vUv;
  void main(){
    vec3 N = normalize(vN);
    #ifdef FLAT
      N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    #endif
    vec3 base = uColor * vCol;
    #ifdef GROUND
      float gn = vnoise(vWorld.xz * .045) * .6 + vnoise(vWorld.xz * .17) * .4;
      base = mix(base, vec3(.56, .62, .45), smoothstep(.5, .56, gn) * .8);
      base = mix(base, vec3(.85, .55, .42), smoothstep(.78, .8, vnoise(vWorld.xz * .09 + 7.)) * .6);
    #endif
    float d = dot(N, uSunDir);
    float l = smoothstep(-.02, .06, d) * .62 + smoothstep(.42, .5, d) * .38;
    vec3 sky = mix(uAmb, uZenith * 1.15, .25) * (.62 + .38 * clamp(N.y, 0., 1.));
    vec3 c = base * (sky * .9 + uKey * l * 1.05);
    c += base * mix(uSunCol, uHorizon, .5) * uGlow;
    // warm bounce from the ground on downward faces, cool rim towards the sky
    c += base * uHorizon * .10 * clamp(-N.y, 0., 1.);
    c += uRim * uHorizon * pow(1. - clamp(dot(N, normalize(cameraPosition - vWorld)), 0., 1.), 3.) * .25;
    c = fogMix(c, vWorld, uFogNear, uFogFar);
    gl_FragColor = vec4(grain(c), 1.);
  }
`;

// Windows: dark glass reflecting the sky until night rises past each one's seed.
const VERT_WIN = VERT.replace('varying vec2 vUv;', 'varying vec2 vUv; attribute float aSeed; varying float vSeed;')
  .replace('vUv = uv;', 'vUv = uv; vSeed = aSeed;');
const FRAG_WIN = /* glsl */ `
  ${GLSL_COMMON}
  uniform float uFogNear; uniform float uFogFar;
  varying vec3 vWorld; varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying float vSeed;
  void main(){
    vec3 glass = mix(vec3(.17,.12,.22), uZenith, .45) * (.75 + .25 * vUv.y);
    glass = mix(glass, uHorizon, .18 * (1. - vUv.y));
    float on = smoothstep(vSeed - .04, vSeed + .04, uNight * 1.12);
    vec3 warm = mix(vec3(1., .80, .47), vec3(1., .66, .62), step(.72, fract(vSeed * 17.3)));
    warm *= .92 + .12 * vUv.y;
    // mullion
    float m = step(abs(vUv.x - .5), .035) + step(abs(vUv.y - .58), .03);
    vec3 c = mix(glass, warm, on);
    c = mix(c, c * .55, clamp(m, 0., 1.) * .8);
    c = fogMix(c, vWorld, uFogNear, uFogFar * 1.25);
    gl_FragColor = vec4(grain(c), 1.);
  }
`;

const VERT_SKY = /* glsl */ `
  varying vec3 vDir;
  void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position.z = gl_Position.w; }
`;
const FRAG_SKY = /* glsl */ `
  ${GLSL_COMMON}
  varying vec3 vDir;
  void main(){
    vec3 d = normalize(vDir);
    float h = clamp(d.y, 0., 1.);
    // banded gradient, the way a stone litho or screenprint steps it
    float bands = 22.;
    float hq = floor(pow(h, .55) * bands) / bands;
    float hs = pow(h, .55);
    float t = mix(hs, hq, .55);
    vec3 c = mix(uHorizon, uMid, smoothstep(0., .42, t));
    c = mix(c, uZenith, smoothstep(.36, 1., t));
    // long travel-poster cloud streaks, lit from below by the sun
    float azm = atan(d.x, -d.z);
    float cn = vnoise(vec2(azm * 3.2 + uTime * .004, h * 34.)) * .65 + vnoise(vec2(azm * 9., h * 90.)) * .35;
    float cb = smoothstep(.05, .1, h) * (1. - smoothstep(.2, .32, h));
    float cloud = smoothstep(.66, .69, cn) * cb;
    vec3 ccol = mix(mix(uMid, uHorizon, .5) * 1.08, mix(uSunCol, vec3(1.,.8,.78), .5), .35 * (1. - uNight));
    ccol = mix(ccol, vec3(.93, .7, .78), uNight * .35);
    // afterglow: warm belt hugging the horizon around the sun's side
    float az = dot(normalize(d.xz), normalize(uSunDir.xz));
    float belt = (1. - smoothstep(0., .16, h)) * (.55 + .45 * az);
    c = mix(c, uHorizon * 1.04, belt * .55);
    // concentric halo rings round the sun (posterised)
    float s = dot(d, uSunDir);
    float g = smoothstep(.86, 1., s);
    float ring = floor(g * 6.) / 6.;
    c = mix(c, mix(uHorizon, uSunCol, .6), ring * .38 * (1. - uNight * .6));
    // Earth shadow / belt of Venus at blue hour, opposite the sun
    float anti = smoothstep(.0, .12, h) * (1. - smoothstep(.12, .3, h)) * (1. - az) * .5;
    c = mix(c, vec3(.86, .64, .74), anti * uNight * .45);
    c = mix(c, ccol, cloud * .85);
    // stars
    vec2 sp = d.xz / max(d.y, .05) * 160.;
    float st = step(.9965, hash12(floor(sp))) * smoothstep(.15, .5, h);
    c += st * uNight * uNight * .55;
    gl_FragColor = vec4(grain(c), 1.);
  }
`;

const FRAG_SEA = /* glsl */ `
  ${GLSL_COMMON}
  uniform vec3 uWater;
  varying vec3 vWorld; varying vec3 vN; varying vec3 vCol; varying vec2 vUv;
  void main(){
    vec3 v = normalize(vWorld - cameraPosition);
    float dist = length(vWorld.xz - cameraPosition.xz);
    vec3 r = reflect(v, vec3(0., 1., 0.));
    float fres = pow(1. - max(-v.y, 0.), 4.);
    vec3 skyRef = mix(uZenith, uHorizon, .55 + .45 * fres);
    vec3 c = mix(uWater, skyRef, .25 + .6 * fres);
    // long swell lines, slightly broken
    float sw = vnoise(vec2(vWorld.x * .012, vWorld.z * .09 + uTime * .05));
    float line = smoothstep(.62, .66, sw) * (1. - smoothstep(.66, .72, sw));
    c = mix(c, uHorizon, line * .22 * (1. - fres));
    // sun glitter column made of stacked horizontal dashes
    vec2 sd = normalize(uSunDir.xz); vec2 fd = normalize(vWorld.xz - cameraPosition.xz);
    float ang = 1. - dot(sd, fd);
    float width = mix(.0018, .0006, smoothstep(80., 1400., dist)) * (1. + 18. * max(uSunDir.y, 0.));
    float col = 1. - smoothstep(width * .3, width, ang);
    float dash = step(.5, vnoise(vec2(vWorld.x * .25 + uTime * .3, vWorld.z * .9)));
    float glit = col * dash * smoothstep(-.12, .02, uSunDir.y);
    c = mix(c, mix(uSunCol, vec3(1., .95, .82), .4), glit * .9);
    // night: town lights reflected as soft warm streaks near shore
    float town = smoothstep(260., 120., dist) * step(.78, vnoise(vec2(vWorld.x * .4, vWorld.z * 2.5)));
    c = mix(c, vec3(1., .78, .45), town * uNight * .35);
    float f = smoothstep(500., 2600., dist);
    c = mix(c, uFog, f);
    gl_FragColor = vec4(grain(c), 1.);
  }
`;

const FRAG_SUN = /* glsl */ `
  ${GLSL_COMMON}
  varying vec3 vWorld; varying vec3 vN; varying vec3 vCol; varying vec2 vUv;
  void main(){
    vec2 p = vUv * 2. - 1.; float r = length(p);
    if (r > 1.) discard;
    vec3 c = mix(uSunCol * 1.06, vec3(1., .96, .86), smoothstep(.95, .0, r) * .35);
    // a few horizontal stripes cut through the lower half, travel-poster style
    float stripes = step(.5, fract((p.y + 1.) * 4.5)) * step(p.y, -.15) * smoothstep(-.15, -1., p.y);
    c = mix(c, uHorizon, stripes * .55);
    gl_FragColor = vec4(grain(c), 1.);
  }
`;

// ---------------------------------------------------------------- geometry
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Square frustum (mansard) from a 4-segment cylinder.
function frustum(rTop, rBot, h) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, 4, 1, false, Math.PI / 4);
  g.scale(Math.SQRT2, 1, Math.SQRT2);
  return g;
}

export function createHeureBleue(canvas, opts = {}) {
  const {
    time = 0.2, interactive = true, pixelRatio = Math.min(window.devicePixelRatio || 1, 2),
    framing = 'auto', grain = 0.045, animate = true, seed = 64,
  } = opts;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 6000);

  const U = {
    uSunDir: { value: new THREE.Vector3() }, uKey: { value: new THREE.Color() }, uAmb: { value: new THREE.Color() },
    uFog: { value: new THREE.Color() }, uZenith: { value: new THREE.Color() }, uMid: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() }, uSunCol: { value: new THREE.Color() }, uWater: { value: new THREE.Color() },
    uNight: { value: 0 }, uTime: { value: 0 }, uGrain: { value: grain },
  };

  const mats = [];
  function solid(hex, o = {}) {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...U, uColor: { value: new THREE.Color(hex) }, uFogNear: { value: o.near ?? 60 }, uFogFar: { value: o.far ?? 1100 }, uRim: { value: o.rim ?? 1 }, uGlow: { value: o.glow ?? 0 } },
      vertexShader: VERT, fragmentShader: FRAG_SOLID, defines: { ...(o.flat ? { FLAT: '' } : {}), ...(o.sway ? { SWAY: '' } : {}), ...(o.ground ? { GROUND: '' } : {}) },
      side: o.side ?? THREE.FrontSide,
    });
    mats.push(m); return m;
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // shaders already speak sRGB

  const R = rng(seed);
  const add = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; };

  // --- sky + sun
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_SKY, fragmentShader: FRAG_SKY, side: THREE.BackSide, depthWrite: false }));
  sky.renderOrder = -10; scene.add(sky);
  const sunMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG_SUN, transparent: false });
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sunMat);
  scene.add(sun);

  // --- sea
  const sea = new THREE.Mesh(new THREE.CircleGeometry(5200, 96), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG_SEA }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0, -600); scene.add(sea);

  // --- headland across the bay (left) and far hills, layered ridges
  function ridge(x0, x1, base, peak, z, hex, rough, sd) {
    const r = rng(sd), pts = [], n = 90;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = x0 + (x1 - x0) * u;
      const env = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.8);
      const y = base + env * peak * (0.72 + 0.28 * Math.sin(u * 7 + sd)) + (r() - 0.5) * rough * env;
      pts.push(new THREE.Vector2(x, y));
    }
    const shape = new THREE.Shape([new THREE.Vector2(x0, -2), ...pts, new THREE.Vector2(x1, -2)]);
    const g = new THREE.ShapeGeometry(shape);
    const m = new THREE.Mesh(g, solid(hex, { near: 200, far: 2600, rim: 0 }));
    m.position.z = z; scene.add(m); return m;
  }
  ridge(-2600, -260, 0, 210, -1700, '#c7a7c4', 18, 3);
  ridge(-1900, -420, 0, 150, -1250, '#b6879f', 14, 5);
  ridge(-1300, -330, 0, 82, -820, '#8f6b8c', 10, 9);
  ridge(700, 2600, 0, 46, -2300, '#c9b1c9', 8, 11);

  // --- the town. Ground: a slope falling from the terrace to the shore.
  // A cliff falls from the terrace to a shelf of Paris rooftops, then a long
  // gentle slope of white houses runs down to the shore ~440 m out.
  const T = { y: 44, z: 14 }; // terrace floor height and balustrade z
  const SHORE = -424;
  const groundH = (x, z) => {
    let h;
    if (z > -26) h = 8 + 36 * THREE.MathUtils.smoothstep(z, 9, 13);
    else if (z > -70) h = 8;
    else h = 8 * Math.pow(1 - THREE.MathUtils.clamp((-z - 70) / (-SHORE - 70), 0, 1), 0.85);
    return h + Math.sin(x * 0.021 + z * 0.013) * 0.8 * THREE.MathUtils.smoothstep(-z, 60, 120) - 0.3;
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 460, 70, 92), solid('#d9b8a0', { near: 40, far: 900, rim: 0, ground: true }));
  {
    const p = ground.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = -p.getY(i) - 210; // +20 .. -440
      p.setXYZ(i, x, groundH(x, z), z);
    }
    ground.geometry.computeVertexNormals();
    scene.add(ground);
  }
  // promenade along the shore
  add(new THREE.BoxGeometry(1400, 1.4, 6), solid('#efe2cf', { near: 60, far: 1200 }), 0, 0.5, SHORE - 2);

  const winGeo = new THREE.PlaneGeometry(1, 1);
  const windows = []; // {x,y,z,w,h,ry}
  const shutters = [];
  const mWhite = ['#f6efe4', '#f3e6d6', '#f7e4dc', '#efe3c6', '#f5ece6'].map((h) => solid(h, { near: 50, far: 950 }));
  const mPastel = ['#f4c2c4', '#f0d08a', '#bcd3ea', '#f7d6c4'].map((h) => solid(h, { near: 50, far: 950 }));
  const mStone = solid('#ead6b5', { near: 50, far: 950 });
  const mZinc = solid('#8a97b0', { near: 50, far: 950, flat: true });
  const mZincDark = solid('#6f7b96', { near: 50, far: 950, flat: true });
  const mTerra = solid('#c9735a', { near: 50, far: 950, flat: true });
  const mIron = solid('#3b2d3c', { near: 50, far: 950 });
  const mCypress = solid('#3c5a50', { near: 40, far: 900, flat: true });
  const mPine = solid('#55705a', { near: 40, far: 900, flat: true });
  const mTrunk = solid('#7a5a4a', { near: 40, far: 900 });
  const mBloom = solid('#d23f7c', { near: 20, far: 900, flat: true, sway: true, glow: 0.42 });
  const mBloom2 = solid('#ec7aa6', { near: 20, far: 900, flat: true, sway: true, glow: 0.42 });
  const mLeaf = solid('#5f7d58', { near: 20, far: 900, flat: true, sway: true, glow: 0.2 });

  function addWindowsOnFace(cx, cz, w, y0, floors, floorH, cols, ry = 0, opt = {}) {
    // windows on the face pointing to +z (towards camera), rotated by ry about building centre
    const cos = Math.cos(ry), sin = Math.sin(ry);
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const lx = -w / 2 + (c + 0.5) * (w / cols);
        const ly = y0 + f * floorH + floorH * 0.42;
        const lz = opt.depth / 2 + 0.06;
        const x = cx + lx * cos + lz * sin, z = cz - lx * sin + lz * cos;
        const ww = (w / cols) * (opt.wr ?? 0.42), wh = floorH * (opt.hr ?? 0.56);
        windows.push({ x, y: ly, z, w: ww, h: wh, ry });
        if (opt.shutters && R() < 0.8) {
          for (const s of [-1, 1]) shutters.push({ x: x + (s * (ww * 0.78)) * cos, y: ly, z: z - s * ww * 0.78 * sin, w: ww * 0.52, h: wh, ry, hex: opt.shutters });
        }
      }
    }
  }

  // Haussmann block (Paris side): stone facade, balconies, zinc mansard with dormers and chimney pots
  function haussmann(x, z, w, d, floors, ry = 0) {
    const fh = 3.3, y0 = groundH(x, z);
    const H = floors * fh;
    const body = add(new THREE.BoxGeometry(w, H, d), mStone, x, y0 + H / 2, z, ry);
    addWindowsOnFace(x, z, w, y0, floors, fh, Math.max(3, Math.round(w / 3.2)), ry, { depth: d, wr: 0.46, hr: 0.6 });
    // balconies: 2nd and top floor continuous iron lines
    for (const f of [1, floors - 1]) add(new THREE.BoxGeometry(w + 0.2, 0.35, 0.7), mIron, x + Math.sin(ry) * (d / 2), y0 + f * fh + 0.15, z + Math.cos(ry) * (d / 2), ry);
    // cornice
    add(new THREE.BoxGeometry(w + 0.6, 0.45, d + 0.6), mStone, x, y0 + H + 0.2, z, ry);
    // mansard
    const mh = 4.2;
    const roof = add(frustum(0.36, 0.5, mh), mZinc, x, y0 + H + 0.4 + mh / 2, z, ry);
    roof.scale.set(w * 0.98, 1, d * 0.98);
    // dormers
    const n = Math.max(2, Math.round(w / 4.5));
    for (let i = 0; i < n; i++) {
      const lx = -w / 2 + (i + 0.5) * (w / n);
      const lz = d * 0.5 - 0.9;
      const dx = x + lx * Math.cos(ry) + lz * Math.sin(ry), dz = z - lx * Math.sin(ry) + lz * Math.cos(ry);
      add(new THREE.BoxGeometry(1.3, 1.7, 1.2), mStone, dx, y0 + H + 1.6, dz, ry);
      const cap = add(new THREE.CylinderGeometry(0.95, 0.95, 1.3, 3, 1), mZincDark, dx, y0 + H + 2.7, dz, ry);
      cap.rotation.set(0, ry, Math.PI / 2); cap.rotation.order = 'YXZ'; cap.scale.set(0.55, 1, 1);
      windows.push({ x: dx + Math.sin(ry) * 0.62, y: y0 + H + 1.55, z: dz + Math.cos(ry) * 0.62, w: 0.7, h: 1.0, ry });
    }
    // chimney stacks with terracotta pots
    for (let i = 0; i < 2 + (R() * 2 | 0); i++) {
      const lx = (R() - 0.5) * w * 0.7;
      const cx = x + lx * Math.cos(ry), cz = z - lx * Math.sin(ry);
      const ch = 1.8 + R();
      add(new THREE.BoxGeometry(1.6 + R(), ch, 0.9), mStone, cx, y0 + H + mh + ch / 2, cz, ry);
      for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(0.16, 0.19, 0.7, 8), mTerra, cx + (k - 1) * 0.42 * Math.cos(ry), y0 + H + mh + ch + 0.3, cz - (k - 1) * 0.42 * Math.sin(ry));
    }
    return { top: y0 + H + mh };
  }

  // Rotunda corner with a zinc dome and lantern
  function rotunda(x, z, r, floors) {
    const fh = 3.3, y0 = groundH(x, z), H = floors * fh;
    add(new THREE.CylinderGeometry(r, r, H, 40), mStone, x, y0 + H / 2, z);
    add(new THREE.CylinderGeometry(r + 0.4, r + 0.4, 0.5, 40), mStone, x, y0 + H + 0.25, z);
    for (let f = 0; f < floors; f++) for (let a = -2; a <= 2; a++) {
      const th = a * 0.36;
      windows.push({ x: x + Math.sin(th) * (r + 0.05), y: y0 + f * fh + 1.5, z: z + Math.cos(th) * (r + 0.05), w: 1.1, h: 2.0, ry: th });
    }
    const dome = add(new THREE.SphereGeometry(r * 0.98, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), mZinc, x, y0 + H + 0.5, z);
    dome.scale.y = 1.25;
    // ribs
    for (let i = 0; i < 10; i++) {
      const rib = add(new THREE.TorusGeometry(r * 0.985, 0.08, 6, 30, Math.PI / 2), mZincDark, x, y0 + H + 0.5, z, i * Math.PI / 5);
      rib.scale.y = 1.25;
    }
    add(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 16), mStone, x, y0 + H + 0.5 + r * 1.25 + 0.6, z);
    add(new THREE.ConeGeometry(1.15, 1.3, 16), mZincDark, x, y0 + H + 0.5 + r * 1.25 + 2.0, z);
    add(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), mIron, x, y0 + H + 0.5 + r * 1.25 + 3.6, z);
    add(new THREE.SphereGeometry(0.28, 12, 8), solid('#d9a42b'), x, y0 + H + 0.5 + r * 1.25 + 4.8, z);
  }

  // Whitewashed cube house with flat roof, parapet, shutters, maybe a pergola, maybe a tiled roof
  function cubeHouse(x, z, w, d, floors, ry = 0) {
    const fh = 3, y0 = groundH(x, z) - 1.5, H = floors * fh + 1.5;
    const pastel = R() < 0.3;
    const mat = pastel ? mPastel[(R() * mPastel.length) | 0] : mWhite[(R() * mWhite.length) | 0];
    add(new THREE.BoxGeometry(w, H, d), mat, x, y0 + H / 2, z, ry);
    const shutterHex = ['#8fb3d6', '#6e1f33', '#d9a42b', '#7aa7a0'][(R() * 4) | 0];
    addWindowsOnFace(x, z, w, y0 + 1.5, floors, fh, Math.max(1, Math.round(w / 4)), ry, { depth: d, wr: 0.28, hr: 0.5, shutters: shutterHex });
    if (R() < 0.35) {
      const roof = add(new THREE.ConeGeometry(Math.max(w, d) * 0.74, 1.8, 4, 1), mTerra, x, y0 + H + 0.9, z, ry + Math.PI / 4);
      roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    } else {
      add(new THREE.BoxGeometry(w + 0.2, 0.6, d + 0.2), mat, x, y0 + H + 0.1, z, ry);
      if (R() < 0.4) add(new THREE.BoxGeometry(w * 0.4, 1.8, d * 0.4), mat, x + (R() - 0.5) * w * 0.3, y0 + H + 0.9, z + (R() - 0.5) * d * 0.3, ry);
    }
    if (R() < 0.3) bougainvillea(x + (R() - 0.5) * w * 0.6, y0 + H - 0.3, z + d / 2 + 0.3, 1.2 + R() * 1.5, 2.5 + R() * 3);
  }

  // Bougainvillea: a cascade of instanced petals
  const bloomInst = [];
  function bougainvillea(x, y, z, width, drop, density = 1, size = 1) {
    const n = Math.floor((30 + width * drop * 14) * density * (size < 0.5 ? 2.6 : 1));
    for (let i = 0; i < n; i++) {
      const u = R(), v = Math.pow(R(), 0.8);
      // clusters: snap some petals towards cluster centres for a bracted, clumpy look
      const px = x + (u - 0.5) * width * (1 - v * 0.45) + (R() - 0.5) * 0.4 * size;
      const py = y - v * drop + Math.sin(u * 19) * 0.12 * size;
      const pz = z + (R() - 0.3) * 0.6 * size;
      bloomInst.push({ p: [px, py, pz], s: (0.13 + R() * 0.15) * size, k: R() });
    }
  }

  function cypress(x, z, h) {
    const y = groundH(x, z);
    add(new THREE.ConeGeometry(h * 0.13, h, 7, 1), mCypress, x, y + h / 2, z);
    const c2 = add(new THREE.SphereGeometry(h * 0.13, 8, 8), mCypress, x, y + h * 0.18, z); c2.scale.y = 2.4;
  }
  function pine(x, z, h) {
    const y = groundH(x, z);
    const t = add(new THREE.CylinderGeometry(0.18, 0.3, h, 6), mTrunk, x, y + h / 2, z); t.rotation.z = (R() - 0.5) * 0.25;
    const cx = x + Math.sin(t.rotation.z) * -h * 0.5;
    for (let k = 0; k < 3; k++) {
      const lobe = add(new THREE.SphereGeometry(h * (0.26 + R() * 0.1), 10, 6), mPine, cx + (k - 1) * h * 0.22, y + h + (R() - 0.3) * h * 0.08, z + (R() - 0.5) * h * 0.2);
      lobe.scale.y = 0.42;
    }
  }

  // ---- lay out the town: a shelf of Paris rooftops just below the cliff,
  // then whitewashed houses stepping down to the shore.
  haussmann(-62, -44, 24, 13, 5, 0.16);
  haussmann(-36, -50, 22, 13, 5, 0.1);
  rotunda(-17, -42, 6.4, 5);
  haussmann(2, -48, 20, 13, 5, 0.02);
  haussmann(26, -44, 22, 13, 5, -0.08);
  haussmann(52, -50, 24, 13, 4, -0.14);
  // a second row, set back
  haussmann(-80, -76, 26, 13, 5, 0.2);
  haussmann(-46, -84, 22, 13, 4, 0.08);
  haussmann(40, -82, 22, 13, 4, -0.1);
  haussmann(72, -76, 20, 13, 5, -0.18);
  // white village (sorted far to near so nothing odd overlaps in the list)
  const village = [];
  for (let i = 0; i < 330; i++) {
    const z = -100 - Math.pow(R(), 0.9) * 310;
    const spread = 70 + (-z) * 0.55;
    const x = (R() - 0.5) * 2 * spread;
    village.push([x, z]);
  }
  village.sort((a, b) => a[1] - b[1]);
  for (const [x, z] of village) cubeHouse(x, z, 6 + R() * 8, 6 + R() * 7, 1 + ((R() * 3) | 0), (R() - 0.5) * 0.6);
  for (let i = 0; i < 70; i++) { const z = -100 - R() * 300; cypress((R() - 0.5) * 2 * (70 + -z * 0.55), z, 8 + R() * 8); }
  for (let i = 0; i < 90; i++) { const z = -100 - R() * 300; pine((R() - 0.5) * 2 * (70 + -z * 0.55), z, 7 + R() * 5); }

  // ---- the terrace (foreground)
  const mRail = solid('#f3e9da', { near: 5, far: 900, rim: 0.5 });
  const mFloorA = solid('#efc9c5', { near: 5, far: 900 });
  const mFloorB = solid('#f6ede0', { near: 5, far: 900 });
  for (let i = -6; i < 6; i++) for (let j = 0; j < 4; j++) {
    add(new THREE.BoxGeometry(1, 0.1, 1), ((i + j) & 1) ? mFloorA : mFloorB, i + 0.5, T.y, T.z + 0.5 + j);
  }
  // balustrade: plinth, balusters (lathe), handrail
  add(new THREE.BoxGeometry(12, 0.35, 0.5), mRail, 0, T.y + 0.17, T.z);
  add(new THREE.BoxGeometry(12, 0.14, 0.42), mRail, 0, T.y + 0.98, T.z);
  add(new THREE.BoxGeometry(12.2, 0.1, 0.56), mRail, 0, T.y + 1.1, T.z);
  const lathePts = [];
  const prof = [[0.1, 0], [0.1, 0.05], [0.06, 0.08], [0.07, 0.16], [0.13, 0.32], [0.135, 0.4], [0.085, 0.52], [0.05, 0.58], [0.085, 0.63], [0.1, 0.65]];
  for (const [r, y] of prof) lathePts.push(new THREE.Vector2(r, y));
  const balGeo = new THREE.LatheGeometry(lathePts, 20);
  const balN = 36;
  const bal = new THREE.InstancedMesh(balGeo, mRail, balN);
  const dm = new THREE.Object3D();
  for (let i = 0; i < balN; i++) { dm.position.set(-6 + i * 0.34, T.y + 0.33, T.z); dm.updateMatrix(); bal.setMatrixAt(i, dm.matrix); }
  scene.add(bal);
  // a pillar with a terracotta urn and a small lemon tree, cut by the right edge
  const PX = 1.32;
  add(new THREE.BoxGeometry(0.46, 1.22, 0.46), mRail, PX, T.y + 0.61, T.z);
  add(new THREE.BoxGeometry(0.54, 0.08, 0.54), mRail, PX, T.y + 1.24, T.z);
  add(new THREE.LatheGeometry([[0.0, 0], [0.09, 0], [0.07, 0.04], [0.13, 0.14], [0.17, 0.26], [0.15, 0.3], [0.18, 0.32], [0.0, 0.32]].map(([r, y]) => new THREE.Vector2(r, y)), 28), solid('#c9735a', { near: 3 }), PX, T.y + 1.28, T.z);
  const lemon = add(new THREE.IcosahedronGeometry(0.3, 1), mLeaf, PX, T.y + 1.86, T.z); lemon.scale.set(1, 1.15, 1);
  for (let i = 0; i < 8; i++) add(new THREE.SphereGeometry(0.035, 8, 6), solid('#e7b733', { near: 3 }), PX + Math.cos(i * 0.9) * 0.27, T.y + 1.8 + Math.sin(i * 1.7) * 0.2, T.z + Math.sin(i * 0.9) * 0.27);
  add(new THREE.CylinderGeometry(0.02, 0.025, 0.35, 6), mTrunk, PX, T.y + 1.55, T.z);

  // bougainvillea hanging into the top-left corner from an unseen pergola
  // (positions are relative to the wide camera, which leans out over the rail)
  const BZ = T.z - 3.2, BY = T.y + 1.75;
  bougainvillea(-1.5, BY + 1.05, BZ, 1.3, 0.55, 10, 0.14);
  bougainvillea(-1.75, BY + 1.0, BZ + 0.1, 0.55, 1.0, 10, 0.14);
  bougainvillea(-0.95, BY + 1.05, BZ - 0.1, 0.8, 0.28, 8, 0.12);
  const bloomGroup = new THREE.Group(); scene.add(bloomGroup);
  bloomGroup.attach(add(new THREE.BoxGeometry(4, 0.07, 0.07), solid('#5d463c', { near: 3 }), -1.6, BY + 1.12, BZ));

  // instanced bougainvillea petals (+ a few leaves)
  {
    const petal = new THREE.IcosahedronGeometry(1, 1);
    const n = bloomInst.length;
    const A = new THREE.InstancedMesh(petal, mBloom, n), B = new THREE.InstancedMesh(petal, mBloom2, n), L = new THREE.InstancedMesh(petal, mLeaf, n);
    let a = 0, b = 0, l = 0;
    for (const it of bloomInst) {
      dm.position.set(...it.p); dm.rotation.set(R() * 6, R() * 6, R() * 6);
      const s = it.s;
      dm.scale.set(s, s * 0.85, s * 0.28); dm.updateMatrix();
      if (it.k < 0.5) A.setMatrixAt(a++, dm.matrix); else if (it.k < 0.82) B.setMatrixAt(b++, dm.matrix); else L.setMatrixAt(l++, dm.matrix);
    }
    A.count = a; B.count = b; L.count = l; bloomGroup.add(A, B, L);
  }

  // windows and shutters as instanced quads
  {
    const wm = new THREE.ShaderMaterial({ uniforms: { ...U, uFogNear: { value: 60 }, uFogFar: { value: 1100 } }, vertexShader: VERT_WIN, fragmentShader: FRAG_WIN });
    const W = new THREE.InstancedMesh(winGeo, wm, windows.length);
    const seeds = new Float32Array(windows.length);
    windows.forEach((w, i) => {
      dm.position.set(w.x, w.y, w.z); dm.rotation.set(0, w.ry, 0); dm.scale.set(w.w, w.h, 1); dm.updateMatrix();
      W.setMatrixAt(i, dm.matrix); seeds[i] = 0.12 + R() * 0.95;
    });
    W.geometry = winGeo.clone(); W.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    scene.add(W);
    const groups = {};
    for (const s of shutters) (groups[s.hex] ||= []).push(s);
    for (const [hex, list] of Object.entries(groups)) {
      const S = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.08), solid(hex, { near: 50, far: 950 }), list.length);
      list.forEach((s, i) => { dm.position.set(s.x, s.y, s.z); dm.rotation.set(0, s.ry, 0); dm.scale.set(s.w, s.h, 1); dm.updateMatrix(); S.setMatrixAt(i, dm.matrix); });
      scene.add(S);
    }
  }

  // ---- camera framing
  const eye = new THREE.Vector3(0, T.y + 1.55, T.z + 4.6);
  let tall = false;
  function frame() {
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    tall = framing === 'tall' || (framing === 'auto' && w / h < 1.05);
    if (tall) { camera.fov = 62; eye.set(-0.3, T.y + 1.75, T.z - 0.3); bloomGroup.position.set(0.55, 0.62, 0); }
    else { camera.fov = 36; eye.set(0, T.y + 1.75, T.z - 0.3); bloomGroup.position.set(0, 0, 0); }
    camera.position.copy(eye);
    camera.updateProjectionMatrix();
    const pitch = tall ? -0.05 : -0.035; // radians up
    camera.lookAt(eye.x + (tall ? 4 : 0), eye.y + Math.tan(pitch) * 100, eye.z - 100);
  }

  // ---- time
  let tNow = time, tTarget = time;
  const sunAz = 0.22; // radians to the right of straight ahead
  function applyTime(t) {
    const e = timeToElevation(t);
    const er = THREE.MathUtils.degToRad(e);
    U.uSunDir.value.set(Math.sin(sunAz) * Math.cos(er), Math.sin(er), -Math.cos(sunAz) * Math.cos(er)).normalize();
    U.uZenith.value.copy(rampAt('zenith', e)); U.uMid.value.copy(rampAt('mid', e)); U.uHorizon.value.copy(rampAt('horizon', e));
    U.uSunCol.value.copy(rampAt('sun', e)); U.uKey.value.copy(rampAt('key', e)); U.uAmb.value.copy(rampAt('amb', e));
    U.uWater.value.copy(rampAt('water', e));
    U.uFog.value.copy(U.uHorizon.value).lerp(U.uMid.value, 0.25);
    U.uNight.value = THREE.MathUtils.smoothstep(-e, -1.5, 6.5) ;
    const D = 3000, rad = THREE.MathUtils.degToRad(2.1) * D;
    sun.position.copy(U.uSunDir.value).multiplyScalar(D).add(new THREE.Vector3(eye.x, 0, eye.z));
    sun.scale.setScalar(rad * 2);
    sun.lookAt(eye);
  }

  // ---- interaction: drag the sun
  let dragging = false;
  const ndc = new THREE.Vector3();
  function sunScreen() { ndc.copy(sun.position).project(camera); return ndc; }
  function toLocal(ev) { const r = canvas.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * 2 - 1, -(((ev.clientY - r.top) / r.height) * 2 - 1)]; }
  function elevationFromY(ny) {
    // invert projection along the sun's azimuth: find elevation whose projected y = ny
    let lo = -7, hi = 15;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2, er = THREE.MathUtils.degToRad(mid);
      const p = new THREE.Vector3(Math.sin(sunAz) * Math.cos(er), Math.sin(er), -Math.cos(sunAz) * Math.cos(er)).multiplyScalar(3000).add(new THREE.Vector3(eye.x, 0, eye.z)).project(camera);
      if (p.y < ny) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  const onDown = (ev) => {
    const [x, y] = toLocal(ev), s = sunScreen();
    const asp = camera.aspect;
    if (Math.hypot((x - s.x) * asp, y - s.y) < 0.22) { dragging = true; canvas.setPointerCapture?.(ev.pointerId); canvas.style.cursor = 'grabbing'; ev.preventDefault(); }
  };
  const onMove = (ev) => {
    const [x, y] = toLocal(ev);
    if (dragging) { tTarget = THREE.MathUtils.clamp(elevationToTime(elevationFromY(y)), 0, 1); api.onTime?.(tTarget); return; }
    const s = sunScreen();
    canvas.style.cursor = Math.hypot((x - s.x) * camera.aspect, y - s.y) < 0.22 ? 'grab' : '';
  };
  const onUp = () => { dragging = false; canvas.style.cursor = ''; };
  if (interactive) {
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.style.touchAction = 'pan-y';
  }

  // ---- loop
  let raf = 0, last = performance.now(), visible = true;
  const ro = new ResizeObserver(() => { frame(); renderOnce(); }); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && animate) loop(); }); io.observe(canvas);
  function renderOnce() { applyTime(tNow); renderer.render(scene, camera); }
  function loop() {
    cancelAnimationFrame(raf);
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      U.uTime.value += dt;
      tNow += (tTarget - tNow) * (1 - Math.exp(-dt * 6));
      applyTime(tNow);
      renderer.render(scene, camera);
      api.onFrame?.(tNow);
      if (visible && animate) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  frame(); applyTime(tNow);
  if (animate) loop(); else renderOnce();

  const api = {
    setTime(t, instant = false) { tTarget = THREE.MathUtils.clamp(t, 0, 1); if (instant) { tNow = tTarget; renderOnce(); } },
    get time() { return tNow; },
    get elevation() { return timeToElevation(tNow); },
    /** Sun centre in CSS pixels relative to the canvas, for placing a hint. */
    sunScreen() { const p = sunScreen(); return { x: (p.x + 1) / 2 * canvas.clientWidth, y: (1 - p.y) / 2 * canvas.clientHeight }; },
    renderOnce,
    onTime: null,
    onFrame: null,
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
      scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      renderer.dispose();
    },
  };
  return api;
}
