// Living Town: sky, sea and the light rig, all keyed by sun elevation.
import * as THREE from 'three';
import { elevation, sunDir, smooth } from './time.js';

// Keyframes by sun elevation (degrees). sRGB hex, converted to linear by three.
const KEYS = [-18, -10, -6, -2.5, 0.5, 4, 9, 18, 40];
const RAMPS = {
  zenith:  ['#060a20', '#0f173c', '#1b2450', '#2c3b74', '#4a63a6', '#6b90c8', '#82a8d6', '#7aa5da', '#679ade'],
  mid:     ['#0b1230', '#1a2353', '#36447f', '#7a78b2', '#c995b4', '#eeb0b4', '#efc6b6', '#b6d0e8', '#a6c8ec'],
  horizon: ['#131a3a', '#29305d', '#7d6a9c', '#df98a3', '#f0ad62', '#f4bf68', '#f4d39a', '#e8e3d6', '#dde7ec'],
  sun:     ['#ff6a3d', '#ff6a3d', '#ff7a45', '#ff8a4c', '#ff9a50', '#ffb25e', '#ffd08a', '#fff0cf', '#fff8e8'],
  key:     ['#000000', '#000000', '#1a1630', '#5a3550', '#ff7438', '#ff9d55', '#ffc98a', '#fff0dc', '#fff8ef'],
  sky:     ['#1d2652', '#29336c', '#3d4782', '#6a6aa3', '#9a8bb6', '#aab0cf', '#b4c4de', '#bcd2ea', '#c4d8ee'],
  ground:  ['#0d0f20', '#171a33', '#2a2240', '#4a3048', '#7a4b46', '#8a5c4c', '#8a7462', '#8c8476', '#8f8a80'],
  water:   ['#060b22', '#0a122e', '#121b42', '#1f2c62', '#2b3b74', '#324a84', '#386096', '#36659c', '#2f6698'],
  belt:    ['#1b2047', '#2d2f63', '#a67aa8', '#f0a0b0', '#f3b4b8', '#f2c4c0', '#e8d7d0', '#dce4ea', '#dde7ec'],
  shadow:  ['#0d1330', '#1d2452', '#3b4a86', '#5867a6', '#7286bf', '#8aa0cf', '#a7bddd', '#c8d8ea', '#dde7ec'],
};
const RAMP = Object.fromEntries(Object.entries(RAMPS).map(([k, v]) => [k, v.map((h) => new THREE.Color(h))]));
export function rampAt(name, e, out = new THREE.Color()) {
  const r = RAMP[name];
  if (e <= KEYS[0]) return out.copy(r[0]);
  for (let i = 0; i < KEYS.length - 1; i++) if (e <= KEYS[i + 1]) {
    const f = (e - KEYS[i]) / (KEYS[i + 1] - KEYS[i]);
    return out.copy(r[i]).lerp(r[i + 1], f * f * (3 - 2 * f));
  }
  return out.copy(r[r.length - 1]);
}

export const SKY_GLSL = /* glsl */`
uniform vec3 uZen, uMid, uHor, uSunCol, uBelt, uShade;
uniform vec3 uSunDir, uMoonDir;
uniform float uNight, uSunVis, uBeltAmt, uGlow, uTime;
float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
vec3 skyColor(vec3 d, float withDiscs){
  float h = d.y;
  float t = pow(clamp(h, 0., 1.), .5);
  vec3 c = mix(uHor, uMid, smoothstep(0., .42, t));
  c = mix(c, uZen, smoothstep(.36, 1., t));
  vec2 hd = normalize(d.xz + 1e-5), hs = normalize(uSunDir.xz + 1e-5);
  // dot() of two unit vectors can land a hair above 1 (or below -1) in float: clamp, or pow(1. - az, 1.6)
  // goes NaN in the column of sky (and its reflection) straight under the sun, and bloom smears it over the frame
  float az = clamp(dot(hd, hs) * .5 + .5, 0., 1.);
  float low = 1. - smoothstep(0., .42, h);
  c = mix(c, uSunCol, pow(az, 4.) * low * uGlow);
  float anti = pow(1. - az, 1.6) * uBeltAmt;
  c = mix(c, uBelt, anti * smoothstep(.0, .07, h) * (1. - smoothstep(.12, .3, h)) * .85);
  c = mix(c, uShade, anti * (1. - smoothstep(-.01, .07, h)) * .8);
  if (h < 0.) c = mix(c, uHor * .55, smoothstep(0., -.25, h));
  if (withDiscs > .5) {
    float s = max(dot(d, uSunDir), 0.);
    c += uSunCol * (smoothstep(.99965, .9998, s) * 6. + pow(s, 64.) * .45 + pow(s, 8.) * .08) * uSunVis;
    float m = max(dot(d, uMoonDir), 0.);
    c += vec3(1., .96, .88) * (smoothstep(.99975, .99985, m) * 2.2 + pow(m, 200.) * .15) * uNight;
    vec3 p = d * 220.; vec3 cell = floor(p);
    float st = hash3(cell);
    if (st > .985) {
      float tw = .6 + .4 * sin(uTime * (1. + st * 3.) + st * 40.);
      float dd = length(fract(p) - .5);
      c += vec3(.9, .92, 1.) * smoothstep(.22, .0, dd) * tw * uNight * smoothstep(.04, .3, h) * (st - .985) * 90.;
    }
  }
  return c;
}`;

export function makeSkyUniforms() {
  return {
    uZen: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() },
    uSunCol: { value: new THREE.Color() }, uBelt: { value: new THREE.Color() }, uShade: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uMoonDir: { value: new THREE.Vector3(-0.3, 0.6, -0.7).normalize() },
    uNight: { value: 0 }, uSunVis: { value: 1 }, uBeltAmt: { value: 0 }, uGlow: { value: 0.5 }, uTime: { value: 0 },
  };
}

export function createSky(U) {
  const mat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
    fragmentShader: SKY_GLSL + `varying vec3 vD; void main(){ gl_FragColor = vec4(skyColor(normalize(vD), 1.), 1.); }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 24), mat);
  m.frustumCulled = false; m.renderOrder = -10; m.name = 'sky';
  return m;
}

export function createSea(U) {
  const u = Object.assign({}, U, {
    uWater: { value: new THREE.Color() }, uFogCol: { value: new THREE.Color() }, uCam: { value: new THREE.Vector3() },
    uLights: { value: 0 },
  });
  const mat = new THREE.ShaderMaterial({
    uniforms: u, fog: false,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: SKY_GLSL + /* glsl */`
      uniform vec3 uWater, uFogCol, uCam; uniform float uLights; varying vec3 vW;
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        float a = fract(sin(dot(i, vec2(127.1,311.7)))*43758.5), b = fract(sin(dot(i+vec2(1,0), vec2(127.1,311.7)))*43758.5),
              c = fract(sin(dot(i+vec2(0,1), vec2(127.1,311.7)))*43758.5), d = fract(sin(dot(i+vec2(1,1), vec2(127.1,311.7)))*43758.5);
        return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
      void main(){
        vec3 v = vW - uCam; float dist = length(v); v /= dist;
        float t = uTime;
        vec3 r = reflect(v, vec3(0., 1., 0.));
        float fres = .02 + .98 * pow(clamp(1. + v.y, 0., 1.), 5.);   // clamped: pow of a tiny negative is NaN
        vec3 sky = skyColor(r, 0.);
        vec3 c = mix(uWater, sky * .55, clamp(fres * .8 + .15, 0., 1.));
        c *= mix(.72, 1., smoothstep(26., 34., vW.z));                     // the sea wall's shadow
        // poster dashes: short strokes of reflected light, drifting
        float fade = 1. - smoothstep(120., 520., dist);
        float row = vW.z * .9 + n2(vec2(vW.x * .05, vW.z * .1)) * 1.5; float rid = floor(row); float fr = fract(row);
        float line = smoothstep(0., .1, fr) * smoothstep(.28, .16, fr);
        float dir = mod(rid, 2.) * 2. - 1.;
        float xx = vW.x * (1.3 + .7 * fract(rid * .37)) + rid * 7.31 + t * .3 * dir;
        float dash = smoothstep(.72, .8, n2(vec2(xx, rid * 3.7))) * line * fade * smoothstep(.02, .25, -v.y) * (.55 + .45 * n2(vec2(vW.x * .08, rid)));
        // the sun's path, widened by imagined waves
        vec3 rp = normalize(vec3(r.x, r.y * .45, r.z));
        float path = pow(max(dot(rp, normalize(vec3(uSunDir.x, uSunDir.y * .45, uSunDir.z))), 0.), 70.) * uSunVis;
        float mpath = pow(max(dot(rp, normalize(vec3(uMoonDir.x, uMoonDir.y * .45, uMoonDir.z))), 0.), 90.) * uNight;
        // lamplight from the promenade: broken columns under each lamp
        float lx = mod(vW.x + 48. + 5., 10.) - 5.;
        float col = exp(-lx * lx * 2.2) * smoothstep(70., 27., vW.z) * uLights;
        c += dash * (sky * .14 + uSunCol * path * 4. + vec3(1., .93, .8) * mpath * 1.6 + vec3(1., .66, .3) * col * 2.2);
        c += uSunCol * path * .28;
        float fogF = smoothstep(150., 1200., dist);
        c = mix(c, uFogCol, fogF * .6);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const g = new THREE.PlaneGeometry(5000, 5000, 1, 1);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.y = -0.55; m.name = 'sea'; m.receiveShadow = false;
  m.userData.u = u;
  return m;
}

/** The light rig: hemisphere + one directional (sun by day, moon by night) with shadows. */
export class LightRig {
  constructor(scene, { shadowSize = 2048, center = new THREE.Vector3(0, 0, 12) } = {}) {
    this.center = center;
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    this.key = new THREE.DirectionalLight(0xffffff, 2);
    this.key.castShadow = shadowSize > 0;
    if (shadowSize) {
      this.key.shadow.mapSize.set(shadowSize, shadowSize);
      const c = this.key.shadow.camera; c.left = -62; c.right = 62; c.top = 46; c.bottom = -46; c.near = 1; c.far = 420;
      this.key.shadow.bias = -0.0005; this.key.shadow.normalBias = 0.05;
    }
    this.key.target.position.copy(center);
    scene.add(this.hemi, this.key, this.key.target);
    this._s = [0, 0, 0];
    this._c = new THREE.Color();
    this.moonCol = new THREE.Color('#8ea6e6');
  }

  apply(h, U, sea, scene) {
    const e = elevation(h);
    const s = sunDir(h, this._s);
    const sd = new THREE.Vector3(s[0], s[1], s[2]);
    U.uSunDir.value.copy(sd);
    rampAt('zenith', e, U.uZen.value); rampAt('mid', e, U.uMid.value); rampAt('horizon', e, U.uHor.value);
    rampAt('sun', e, U.uSunCol.value); rampAt('belt', e, U.uBelt.value); rampAt('shadow', e, U.uShade.value);
    U.uNight.value = smooth(-4, -12, e);
    U.uSunVis.value = smooth(-3, 0.5, e);
    U.uBeltAmt.value = smooth(-11, -3, e) * (1 - smooth(6, 16, e));
    U.uGlow.value = 0.25 + 0.6 * (1 - smooth(4, 22, e)) * smooth(-9, -1, e);
    // moon: high over the bay on the left, opposite the evening sun
    U.uMoonDir.value.set(-0.35, 0.55, 0.76).normalize();

    // key light: sun above ~ -2 deg, moon below
    const sunK = smooth(-2.5, 4, e);
    const golden = smooth(-1.5, 2.5, e) * (1 - smooth(7, 18, e));   // the low, warm hour: more sun, less fill
    const moonK = smooth(-3, -10, e);
    const key = rampAt('key', e, this._c);
    if (sunK > 0.02) {
      this.key.color.copy(key);
      this.key.intensity = 0.2 + 2.5 * sunK + 0.9 * golden;
      this.key.position.copy(sd).multiplyScalar(220).add(this.center);
    } else {
      this.key.color.copy(this.moonCol);
      this.key.intensity = 0.42 * moonK + 0.05;
      this.key.position.copy(U.uMoonDir.value).multiplyScalar(220).add(this.center);
    }
    if (this.key.position.y < this.center.y + 8) this.key.position.y = this.center.y + 8;
    rampAt('sky', e, this.hemi.color);
    rampAt('ground', e, this.hemi.groundColor);
    this.hemi.intensity = 0.32 + 0.42 * smooth(-12, 2, e) + 0.63 * smooth(4, 20, e);

    const fogC = rampAt('horizon', e, new THREE.Color()).lerp(rampAt('mid', e, new THREE.Color()), 0.45);
    if (scene.fog) scene.fog.color.copy(fogC);
    if (sea) {
      rampAt('water', e, sea.userData.u.uWater.value);
      sea.userData.u.uFogCol.value.copy(fogC);
      sea.userData.u.uLights.value = smooth(-1, -8, e);
    }
    return e;
  }
}
