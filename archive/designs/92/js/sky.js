// Sky, sun and sea for "Enter world" (design 92). A port of design 64's poster
// sky (banded gradient, cloud streaks, halo rings, belt of Venus, stars) and
// its dashed sun-glitter sea, moved into three.js's linear workflow so it sits
// with the glTF kit under the same fog, tone mapping and bloom.
import * as THREE from 'three';

// Keyframes by sun elevation in degrees (design 64's ramps, plus a light key for the kit).
const KEYS = [-7, -2.5, 0.5, 4, 9, 15];
const C = (a) => a.map((h) => new THREE.Color(h));
export const RAMP = {
  zenith:  C(['#141c44', '#2a3870', '#566fae', '#86a8d4', '#9fc0e2', '#a8c8e6']),
  mid:     C(['#303c78', '#7a78b2', '#c995b4', '#eeb0b4', '#efc2b6', '#c6d8e8']),
  horizon: C(['#6d5c92', '#df98a3', '#f0ad62', '#f4bf68', '#f4cf8c', '#f3dfb8']),
  sun:     C(['#ee8a63', '#f09460', '#f3a24c', '#f4b54b', '#f6d17b', '#fbe9b4']),
  key:     C(['#1c2350', '#4a4270', '#e08a62', '#f0b07c', '#f4d3ac', '#fff0d8']),
  amb:     C(['#2e3870', '#5f5f9c', '#9a8bb6', '#aab0cf', '#b9c7dc', '#c6d5e5']),
  water:   C(['#141d48', '#2f3b76', '#43568f', '#5677aa', '#6893c2', '#76a5cf']),
};
export function rampAt(name, e, out = new THREE.Color()) {
  const r = RAMP[name];
  if (e <= KEYS[0]) return out.copy(r[0]);
  for (let i = 0; i < KEYS.length - 1; i++) if (e <= KEYS[i + 1]) {
    const f = (e - KEYS[i]) / (KEYS[i + 1] - KEYS[i]);
    return out.copy(r[i]).lerp(r[i + 1], f * f * (3 - 2 * f));
  }
  return out.copy(r[r.length - 1]);
}

export const SKY_U = {
  uSunDir: { value: new THREE.Vector3(0, 0.05, 1) },
  uZenith: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() },
  uSunCol: { value: new THREE.Color() }, uWater: { value: new THREE.Color() }, uFog: { value: new THREE.Color() },
  uNight: { value: 0 }, uTime: { value: 0 }, uFogFar: { value: 2600 },
};

const COMMON = /* glsl */ `
  uniform vec3 uSunDir, uZenith, uMid, uHorizon, uSunCol, uWater, uFog;
  uniform float uNight, uTime, uFogFar;
  float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x), mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x), f.y); }
`;

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }
`;
const SKY_FRAG = /* glsl */ `
  ${COMMON}
  varying vec3 vDir;
  void main(){
    vec3 d = normalize(vDir);
    float h = clamp(d.y, 0., 1.);
    float hs = pow(h, .55);
    float hq = floor(hs * 22.) / 22.;               // screenprint bands
    float t = mix(hs, hq, .5);
    vec3 c = mix(uHorizon, uMid, smoothstep(0., .42, t));
    c = mix(c, uZenith, smoothstep(.36, 1., t));
    float az = dot(normalize(d.xz), normalize(uSunDir.xz));
    // afterglow belt hugging the horizon on the sun's side
    float belt = (1. - smoothstep(0., .16, h)) * (.5 + .5 * az);
    c = mix(c, uHorizon * 1.05, belt * .55);
    // posterised halo rings round the sun
    float s = dot(d, uSunDir);
    float g = smoothstep(.86, 1., s);
    c = mix(c, mix(uHorizon, uSunCol, .6), floor(g * 6.) / 6. * .4 * (1. - uNight * .6));
    // belt of Venus opposite the sun at blue hour
    float anti = smoothstep(.0, .12, h) * (1. - smoothstep(.12, .3, h)) * (1. - az) * .5;
    c = mix(c, vec3(.72, .38, .5), anti * uNight * .5);
    // long cloud streaks, lit from below
    float ang = atan(d.x, -d.z);
    float cn = vnoise(vec2(ang * 3.2 + uTime * .004, h * 34.)) * .65 + vnoise(vec2(ang * 9., h * 90.)) * .35;
    float cloud = smoothstep(.66, .69, cn) * smoothstep(.05, .1, h) * (1. - smoothstep(.2, .32, h));
    vec3 ccol = mix(mix(uMid, uHorizon, .5) * 1.1, mix(uSunCol, vec3(1., .62, .58), .5), .4 * (1. - uNight));
    c = mix(c, ccol, cloud * .85);
    // the sun: a poster disc with stripes through its lower half
    float R = .034;
    float disc = smoothstep(cos(R) - .00004, cos(R) + .00002, s);
    vec3 up = normalize(vec3(0., 1., 0.) - uSunDir * uSunDir.y);
    float py = dot(d - uSunDir * s, up) / R;
    float stripes = step(.5, fract((py + 1.) * 4.5)) * step(py, -.15);
    vec3 sun = mix(uSunCol * 1.9, uHorizon * 1.1, stripes * .6);
    c = mix(c, sun, disc);
    c += uSunCol * pow(max(s, 0.), 2000.) * .6 * (1. - uNight);
    // stars
    vec2 sp = d.xz / max(d.y, .05) * 160.;
    float st = step(.9965, hash12(floor(sp))) * smoothstep(.15, .5, h);
    c += st * uNight * uNight * 1.1;
    gl_FragColor = vec4(c, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const SEA_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }
`;
const SEA_FRAG = /* glsl */ `
  ${COMMON}
  uniform float uTown;
  varying vec3 vWorld;
  void main(){
    vec3 v = normalize(vWorld - cameraPosition);
    float dist = length(vWorld.xz - cameraPosition.xz);
    float fres = pow(1. - max(-v.y, 0.), 4.);
    vec3 skyRef = mix(uZenith, uHorizon, .55 + .45 * fres);
    vec3 c = mix(uWater, skyRef, .22 + .6 * fres);
    // long swell lines, slightly broken
    float sw = vnoise(vec2(vWorld.x * .02, vWorld.z * .12 + uTime * .08));
    float line = smoothstep(.62, .66, sw) * (1. - smoothstep(.66, .72, sw));
    c = mix(c, uHorizon, line * .25 * (1. - fres));
    float sw2 = vnoise(vec2(vWorld.x * .09 + uTime * .05, vWorld.z * .5 - uTime * .2));
    c = mix(c, skyRef, smoothstep(.7, .78, sw2) * .25 * smoothstep(120., 10., dist));
    // sun glitter: a column of stacked dashes
    vec2 sd = normalize(uSunDir.xz); vec2 fd = normalize(vWorld.xz - cameraPosition.xz);
    float a = 1. - dot(sd, fd);
    float width = mix(.004, .0007, smoothstep(40., 1400., dist)) * (1. + 14. * max(uSunDir.y, 0.));
    float col = 1. - smoothstep(width * .3, width, a);
    float dash = step(.5, vnoise(vec2(vWorld.x * .25 + uTime * .3, vWorld.z * .9 - uTime * .1)));
    float glit = col * dash * smoothstep(-.1, .02, uSunDir.y);
    c = mix(c, uSunCol * 1.7, glit * .85);
    // town lights reflected as warm streaks near the shore
    float shore = smoothstep(46., 21., vWorld.z) * (1. - smoothstep(60., 110., abs(vWorld.x)));
    float streak = step(.86, vnoise(vec2(vWorld.x * .7, vWorld.z * 2.2 + uTime * .3)));
    c = mix(c, vec3(1., .7, .38) * 1.2, shore * streak * uTown * .3);
    // shore foam along the sea wall
    c = mix(c, uHorizon * 1.15, smoothstep(23., 19.5, vWorld.z) * step(.5, vnoise(vec2(vWorld.x * .6 + uTime * .5, uTime * .7))) * .35);
    c = mix(c, uFog, smoothstep(900., uFogFar, dist) * .8);
    gl_FragColor = vec4(c, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createSky() {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24),
    new THREE.ShaderMaterial({ uniforms: SKY_U, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false }));
  sky.renderOrder = -10; sky.frustumCulled = false; sky.name = 'sky';
  const seaU = { ...SKY_U, uTown: { value: 0 } };
  const sea = new THREE.Mesh(new THREE.CircleGeometry(5200, 96),
    new THREE.ShaderMaterial({ uniforms: seaU, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, fog: false }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -0.55; sea.name = 'sea'; sea.frustumCulled = false;
  return { sky, sea, seaU };
}
