// Sky dome, sea and the time-of-day ramps for Lamplighter.
// The game clock is the sun: elevation runs from a few degrees above the sea
// (golden) through sunset and blue hour to full night.
import * as THREE from 'three';

// Keyframes by sun elevation (degrees). Colours are sRGB hex, converted on use.
const KEYS = [-10, -6, -3, -0.5, 2, 6];
const C = (a) => a.map((h) => new THREE.Color(h));
const RAMP = {
  zenith:  C(['#0b1030', '#141c45', '#23306a', '#3b4f92', '#6a8cc4', '#8fb1dc']),
  mid:     C(['#151c44', '#28306a', '#5a5a9a', '#a07fae', '#e2a3ae', '#efc0b2']),
  horizon: C(['#26244e', '#4e3f73', '#a46a8a', '#ee9a7c', '#f6b467', '#f6cf8e']),
  sun:     C(['#ff8a5c', '#ff8a5c', '#ff9157', '#ffa04e', '#ffbe5c', '#ffe1a0']),
  key:     C(['#000000', '#000000', '#2a1414', '#b8644e', '#ffb27a', '#ffe3c0']),
  hemiSky: C(['#3c4fa4', '#4560b2', '#5a70ba', '#8d84b4', '#b4b2d0', '#c4d2e6']),
  hemiGnd: C(['#181c3c', '#1e2444', '#33304a', '#6a4a4e', '#8a6a58', '#9a8a70']),
  water:   C(['#070b24', '#0d143a', '#18245a', '#263a74', '#33508a', '#4a6ea6']),
  fog:     C(['#1a2250', '#2a3266', '#4f4c80', '#8d7495', '#d1a0a0', '#e2c4b0']),
};

export function rampAt(name, e, out = new THREE.Color()) {
  const k = KEYS, r = RAMP[name];
  if (e <= k[0]) return out.copy(r[0]);
  for (let i = 0; i < k.length - 1; i++) {
    if (e <= k[i + 1]) {
      const f = (e - k[i]) / (k[i + 1] - k[i]);
      return out.copy(r[i]).lerp(r[i + 1], f * f * (3 - 2 * f));
    }
  }
  return out.copy(r[r.length - 1]);
}

/** Game clock 0..1 -> sun elevation in degrees. 0: golden, ~0.27: sunset, 1: night. */
export const elevationAt = (t) => 4.5 - t * 15.5;
export const SUN_AZIMUTH = new THREE.Vector3(0.62, 0, 0.78).normalize(); // over the bay, to the right

const COMMON = /* glsl */ `
  float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x), mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x), f.y); }
`;

export function createSky() {
  const uniforms = {
    uZenith: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() },
    uSunCol: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 0.05, 1) },
    uNight: { value: 0 }, uTime: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      uniform vec3 uZenith, uMid, uHorizon, uSunCol, uSunDir; uniform float uNight, uTime;
      varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        float sd = max(dot(d, uSunDir), 0.);
        // bands: horizon glow strongest toward the sun
        float toward = pow(sd, 3.) * .65 + .35;
        vec3 c = mix(uHorizon, uMid, smoothstep(-.01, .085 + .08 * (1. - toward), h));
        c = mix(c, uZenith, smoothstep(.06, .42, h));
        c = mix(c, mix(uHorizon, uSunCol, .55), pow(sd, 10.) * smoothstep(-.1, .05, h) * (1. - uNight * .8));
        // thin cirrus streaks lit from below
        float band = vnoise(vec2(atan(d.x, d.z) * 6., h * 40.)) * vnoise(vec2(atan(d.x, d.z) * 2.3 + 4., h * 11.));
        float streak = smoothstep(.32, .6, band) * smoothstep(.02, .09, h) * smoothstep(.34, .12, h);
        c = mix(c, mix(uHorizon, uSunCol, .3) * 1.12, streak * .42 * (1. - uNight * .7) * (.4 + .6 * toward));
        // sun disc (sinks below the sea)
        float disc = smoothstep(.9993, .9997, sd) * smoothstep(-.004, .004, h);
        c = mix(c, uSunCol * 1.6, disc);
        // stars
        vec2 g = vec2(atan(d.x, d.z), asin(clamp(h, -1., 1.))) * 520.;
        float s = hash12(floor(g));
        float tw = .6 + .4 * sin(uTime * 2. + s * 40.);
        float star = step(.996, s) * smoothstep(.42, .05, length(fract(g) - .5)) * smoothstep(.06, .3, h) * uNight * tw;
        c += vec3(.95, .92, .85) * star * .9;
        // below the horizon: the sea takes over, fade to the far water colour
        c = mix(c, uHorizon * .55 + uZenith * .25, smoothstep(.0, -.04, h));
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.name = 'sky';
  return { mesh, uniforms };
}

export function createSea() {
  const uniforms = {
    uWater: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uZenith: { value: new THREE.Color() },
    uSunCol: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 0.05, 1) }, uFog: { value: new THREE.Color() },
    uTime: { value: 0 }, uLit: { value: 0 }, uNight: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      ${COMMON}
      uniform vec3 uWater, uHorizon, uZenith, uSunCol, uSunDir, uFog; uniform float uTime, uLit, uNight;
      varying vec3 vW;
      void main(){
        vec3 V = normalize(cameraPosition - vW);
        float dist = length(cameraPosition - vW);
        // ripples: long swells plus fine chop, calmed with distance so they never alias
        float calm = 1. - smoothstep(60., 420., dist);
        vec2 q = vW.xz * vec2(.3, 1.5) + vec2(uTime * .09, uTime * .31);
        float n1 = vnoise(q) - .5, n2 = vnoise(q * 2.3 + 17. - uTime * .2) - .5, n3 = vnoise(vW.xz * vec2(.06, .2) + uTime * .03) - .5;
        vec3 N = normalize(vec3((n1 * .5 + n2 * .3) * .07 * calm + n3 * .02, 1., (n1 * .4 - n2 * .5) * .12 * calm + n3 * .04));
        float fres = pow(1. - max(dot(N, V), 0.), 5.);
        vec3 refl = mix(uHorizon, uZenith, .45) * .82;
        vec3 c = mix(uWater, refl, clamp(fres * 1.05 + .06, 0., .92));
        // sun path: a sheen with glints breaking up in it
        vec3 R = reflect(-V, N);
        float sd = max(dot(R, uSunDir), 0.);
        float sp = pow(sd, 380.);
        float sheen = pow(sd, 26.);
        float glit = smoothstep(.55, .75, vnoise(vW.xz * vec2(2.2, 6.) + uTime * vec2(.3, 1.3)));
        c += uSunCol * (sp * 4. * (.3 + glit) + sheen * .28 * (.5 + glit)) * (1. - uNight);
        // the lit town shimmers on the water near the shore
        float shore = smoothstep(46., 20., vW.z) * smoothstep(17., 21., vW.z) * smoothstep(60., 30., abs(vW.x));
        // soft vertical columns of reflected window light, broken up by the swell (wide enough not to alias into combs)
        // warm pools under the lit fronts (smooth along the shore), cut into soft ripple lines that drift with the swell
        float under = .5 + .5 * sin(vW.x * .41 + 1.3) * sin(vW.x * .17 + 4.);
        float rip = smoothstep(.15, .95, .5 + .5 * sin(vW.z * 2.4 + n1 * 7. + n2 * 4. - uTime * 1.1));
        c += vec3(1., .7, .38) * shore * (.3 + .7 * under) * (.25 + .75 * rip) * uLit * .15 * (.4 + .6 * uNight);
        // far water melts into the sky's horizon, so the sea line is a haze and not an edge
        c = mix(c, mix(uFog, uHorizon, .8), smoothstep(120., 900., dist) * .88);
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.55;
  mesh.name = 'sea';
  return { mesh, uniforms };
}
