// Sky, sea and the time-of-day ramps for "Town through time".
// The ramps continue design 64's poster palette (keyed by sun elevation in degrees),
// extended down to deep night so the town can go to bed.
import * as THREE from 'three';

export const KEYS = [-16, -7, -2.5, 0.5, 4, 9, 24];
const C = (a) => a.map((h) => new THREE.Color(h));
const RAMP = {
  zenith:  C(['#0a0f28', '#1b2450', '#2c3b74', '#566fae', '#86a8d4', '#9fc0e2', '#8db5df']),
  mid:     C(['#141a3c', '#36447f', '#7a78b2', '#c995b4', '#eeb0b4', '#efc2b6', '#c3d6e8']),
  horizon: C(['#262a56', '#7d6a9c', '#df98a3', '#f0ad62', '#f4bf68', '#f4cf8c', '#eee4cc']),
  sun:     C(['#ee8a63', '#ee8a63', '#f09460', '#f3a24c', '#f4b54b', '#f6d17b', '#fff4da']),
  key:     C(['#000000', '#000000', '#2a1820', '#d0805e', '#eba676', '#f6d6ae', '#fff3e2']),
  amb:     C(['#24306a', '#4a5c9e', '#7584c0', '#a397c0', '#b2b6d2', '#bccadf', '#cad8e8']),
  water:   C(['#0c1332', '#1b2652', '#2f3b76', '#43568f', '#5677aa', '#6893c2', '#76a5cf']),
};
const _c = new THREE.Color();
export function rampAt(name, e, out = new THREE.Color()) {
  const r = RAMP[name];
  if (e <= KEYS[0]) return out.copy(r[0]);
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (e <= KEYS[i + 1]) {
      const f = (e - KEYS[i]) / (KEYS[i + 1] - KEYS[i]);
      return out.copy(r[i]).lerp(r[i + 1], f * f * (3 - 2 * f));
    }
  }
  return out.copy(r[r.length - 1]);
}

// Hour of the evening (16:00 .. 26:00 = 02:00) -> sun elevation in degrees.
const HOURS = [16, 18.5, 20.3, 21.0, 21.8, 23.5, 26];
const ELEV = [24, 10, 0.6, -2.6, -6.4, -13, -17];
export function elevationAt(h) {
  if (h <= HOURS[0]) return ELEV[0];
  for (let i = 0; i < HOURS.length - 1; i++) {
    if (h <= HOURS[i + 1]) {
      const f = (h - HOURS[i]) / (HOURS[i + 1] - HOURS[i]);
      return ELEV[i] + (ELEV[i + 1] - ELEV[i]) * f;
    }
  }
  return ELEV[ELEV.length - 1];
}
export function phaseName(e) {
  if (e >= 6) return 'Afternoon';
  if (e >= 0.4) return 'Golden hour';
  if (e >= -6.5) return 'Blue hour';
  if (e >= -12) return 'Evening';
  return 'Night';
}

const COMMON = /* glsl */ `
  float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y); }
`;

export function createSky() {
  const uniforms = {
    uZenith: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() },
    uSunCol: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uNight: { value: 0 },
    uTime: { value: 0 }, uMoonDir: { value: new THREE.Vector3(-0.4, 0.5, -0.7).normalize() },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: /* glsl */ `varying vec3 vDir;
      void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith, uMid, uHorizon, uSunCol, uSunDir, uMoonDir; uniform float uNight, uTime;
      varying vec3 vDir;
      ${COMMON}
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y, 0., 1.);
        // stepped gradient, the way a screenprint bands a dusk sky
        float hs = pow(h, .55);
        float t = mix(hs, floor(hs * 26.) / 26., .45);
        vec3 c = mix(uHorizon, uMid, smoothstep(0., .4, t));
        c = mix(c, uZenith, smoothstep(.34, 1., t));
        vec2 sd = normalize(uSunDir.xz);
        float az = dot(normalize(d.xz + 1e-4), sd);
        // afterglow hugging the horizon on the sun's side
        float belt = (1. - smoothstep(0., .18, h)) * (.45 + .55 * az);
        c = mix(c, uHorizon * 1.06, belt * .5);
        // belt of Venus opposite the sun at blue hour
        float anti = smoothstep(.0, .1, h) * (1. - smoothstep(.1, .28, h)) * clamp(-az, 0., 1.);
        c = mix(c, vec3(.78, .45, .58), anti * smoothstep(.05, .5, uNight) * (1. - smoothstep(.75, 1., uNight)) * .4);
        // long poster cloud streaks lit from below
        float a = atan(d.x, -d.z);
        float cn = vnoise(vec2(a * 2.4 + uTime * .003, h * 55.)) * .6 + vnoise(vec2(a * 9.7, h * 140.)) * .4;
        float band = smoothstep(.05, .1, h) * (1. - smoothstep(.2, .34, h));
        float cloud = smoothstep(.66, .7, cn) * band;
        vec3 ccol = mix(mix(uMid, uHorizon, .55) * 1.1, uSunCol * 1.05, .35 * (1. - uNight) * (.5 + .5 * az));
        ccol = mix(ccol, uMid * .8, smoothstep(.6, 1., uNight));
        c = mix(c, ccol, cloud * .8);
        // sun: posterised halo + disc
        float s = dot(d, normalize(uSunDir));
        float g = smoothstep(.9, 1., s);
        c = mix(c, mix(uHorizon, uSunCol, .7), floor(g * 6.) / 6. * .32);
        float disc = smoothstep(.99935, .9996, s);
        c = mix(c, uSunCol * 5., disc * smoothstep(-.03, .0, uSunDir.y + d.y * 0.));
        // moon
        float m = dot(d, uMoonDir);
        c += vec3(1., .95, .86) * smoothstep(.99965, .9998, m) * 2.2 * smoothstep(.3, .8, uNight);
        c += vec3(.5, .55, .8) * pow(max(m, 0.), 300.) * .25 * uNight;
        // stars
        vec2 sp = d.xz / max(d.y, .06) * 150.;
        float st = step(.9968, hash12(floor(sp))) * smoothstep(.12, .45, h);
        float tw = .6 + .4 * sin(uTime * 2. + hash12(floor(sp) + 3.) * 40.);
        c += st * tw * smoothstep(.45, 1., uNight) * .9;
        // below the horizon fade into the far sea haze
        c = mix(c, uHorizon * .85, smoothstep(0., -.08, d.y));
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 24), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return { mesh, uniforms };
}

export function createSea() {
  const uniforms = {
    uWater: { value: new THREE.Color() }, uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() },
    uMid: { value: new THREE.Color() }, uSunCol: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uFog: { value: new THREE.Color() }, uNight: { value: 0 }, uTime: { value: 0 }, uTownLights: { value: 0 }, uSunUp: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: false,
    vertexShader: /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uWater, uZenith, uHorizon, uMid, uSunCol, uSunDir, uFog; uniform float uNight, uTime, uTownLights, uSunUp;
      varying vec3 vW;
      ${COMMON}
      void main(){
        vec3 v = normalize(vW - cameraPosition);
        float dist = length(vW.xz - cameraPosition.xz);
        // swell normal from two scrolling noises
        vec2 p = vW.xz;
        float n1 = vnoise(p * vec2(.035, .55) + vec2(uTime * .03, uTime * .16));
        float n2 = vnoise(p * vec2(.09, 1.6) - vec2(uTime * .05, uTime * .3));
        float amp = 1. - smoothstep(60., 520., dist) * .85;
        vec3 N = normalize(vec3((n2 - .5) * .04, 1., ((n1 - .5) * .22 + (n2 - .5) * .16) * amp));
        vec3 r = reflect(v, N);
        float fres = pow(1. - max(-v.y, 0.), 3.5);
        vec3 skyRef = mix(uHorizon, mix(uMid, uZenith, .5), clamp(r.y * 2.2, 0., 1.));
        vec3 c = mix(uWater, skyRef, .22 + .62 * fres);
        // long swell lines
        float lines = smoothstep(.55, .62, vnoise(vec2(p.x * .015, p.y * .14 + uTime * .06)));
        c = mix(c, mix(uHorizon, uMid, .5), lines * .12 * (1. - smoothstep(200., 700., dist)));
        // sun glitter path
        float sp = pow(max(dot(r, normalize(uSunDir)), 0.), 380.);
        float glint = step(.55, n2) * sp;
        c += uSunCol * (sp * 2.2 + glint * 6.) * uSunUp;
        // town light reflections: warm broken streaks below the lit town
        float shore = smoothstep(17.5, 20., vW.z) * (1. - smoothstep(22., 40., vW.z));
        float span = 1. - smoothstep(40., 56., abs(vW.x + 2.));
        float col = smoothstep(.5, .8, vnoise(vec2(vW.x * .42, 1.7)));
        float rip = .5 + .5 * sin(vW.z * 4.2 + (n1 - .5) * 9. + (n2 - .5) * 5. - uTime * 1.3);
        float streak = col * smoothstep(.45, .95, rip);
        c += vec3(1., .7, .36) * streak * shore * span * uTownLights * .55;
        // haze toward the horizon
        float f = smoothstep(60., 900., dist);
        c = mix(c, uFog, f * .9);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.55;
  mesh.renderOrder = -5;
  return { mesh, uniforms };
}
