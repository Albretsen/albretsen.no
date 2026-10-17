// Live sky: a physically based sky (single-scattering Rayleigh + Mie) for the real position
// of the sun over Norway right now. WebGL2 fragment shader, rendered at reduced resolution
// and scaled up (a sky has no hard edges), redrawn once a minute. No dependencies.
//
//   import { mountSky, sunPosition, skyPhase } from './sky.js'
//   const sky = mountSky(canvas, { lat: 59.91, lon: 10.75 })
//   sky.setTime(new Date('2026-06-21T21:30:00Z'))   // scrub (null = live)
//   sky.state  -> { elevation, azimuth, phase, colors: { zenith, horizon, sun } }
//   canvas.addEventListener('skychange', e => e.detail)  // same object
//
// Also writes CSS custom properties on options.cssTarget (default <html>):
//   --sky-zenith, --sky-horizon, --sun-color, --sun-el (deg), --sky-phase (night|blue|golden|day)
// so the rest of the page can quietly follow the light.

const RAD = Math.PI / 180;

/** Sun position (Astronomical Almanac low-precision formulae, ~0.01 deg). Azimuth from north, clockwise. */
export function sunPosition(date, lat, lon) {
  const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const H = ((gmst * 15 + lon) * RAD) - ra;
  const phi = lat * RAD;
  let el = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  // atmospheric refraction near the horizon (Saemundsson), in radians
  const elDeg = el / RAD;
  if (elDeg > -1) el += (1.02 / Math.tan((elDeg + 10.3 / (elDeg + 5.11)) * RAD)) / 60 * RAD;
  let az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(H));
  az = (az + 2 * Math.PI) % (2 * Math.PI);
  return { elevation: el / RAD, azimuth: az / RAD };
}

/** night (< -6 deg), blue (-6..0), golden (0..10), day (> 10) */
export function skyPhase(elevation) {
  return elevation < -6 ? 'night' : elevation < 0 ? 'blue' : elevation < 10 ? 'golden' : 'day';
}

const VS = `#version 300 es
in vec2 p; out vec2 vUv; void main(){ vUv=p*0.5+0.5; gl_Position=vec4(p,0.,1.); }`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec3 uSun; uniform float uViewAz; uniform vec2 uFov; uniform float uHorizon;
uniform float uExposure; uniform float uNight; uniform float uTwi; uniform float uSea; uniform vec2 uRes;
#define PI 3.14159265
const float Re=6360e3, Ra=6420e3, Hr=7994.0, Hm=1200.0;
const vec3 bR=vec3(5.8e-6,13.5e-6,33.1e-6); const vec3 bM=vec3(21e-6*0.6);
const vec3 bO=vec3(0.650e-6,1.881e-6,0.085e-6); // ozone: what keeps twilight blue
float oz(float h){ return max(0.0,1.0-abs(h-25000.0)/15000.0); }
vec2 rsi(vec3 o, vec3 d, float r){ float b=dot(o,d); float c=dot(o,o)-r*r; float h=b*b-c; if(h<0.0) return vec2(1e12,-1e12); h=sqrt(h); return vec2(-b-h,-b+h); }
vec3 atmo(vec3 d, vec3 s){
  vec3 orig=vec3(0.0,Re+60.0,0.0);
  vec2 ta=rsi(orig,d,Ra); float tmax=ta.y; vec2 tg=rsi(orig,d,Re); if(tg.x>0.0) tmax=min(tmax,tg.x);
  const int N=20; float seg=tmax/float(N); float t=0.0; vec3 sR=vec3(0.0), sM=vec3(0.0); float oR=0.0, oM=0.0, oO=0.0;
  float mu=dot(d,s); float pR=3.0/(16.0*PI)*(1.0+mu*mu); float g=0.78;
  float pM=3.0/(8.0*PI)*((1.0-g*g)*(1.0+mu*mu))/((2.0+g*g)*pow(1.0+g*g-2.0*g*mu,1.5));
  for(int i=0;i<N;i++){
    vec3 x=orig+d*(t+seg*0.5); float h=length(x)-Re; float hr=exp(-h/Hr)*seg, hm=exp(-h/Hm)*seg; oR+=hr; oM+=hm; oO+=oz(h)*seg;
    vec2 tl=rsi(x,s,Ra); float sl=tl.y/6.0; float lR=0.0,lM=0.0,lO=0.0; bool ok=true;
    for(int j=0;j<6;j++){ vec3 y=x+s*(sl*(float(j)+0.5)); float hl=length(y)-Re; if(hl<0.0){ok=false;break;} lR+=exp(-hl/Hr)*sl; lM+=exp(-hl/Hm)*sl; lO+=oz(hl)*sl; }
    if(ok){ vec3 att=exp(-(bR*(oR+lR)+bM*1.1*(oM+lM)+bO*(oO+lO))); sR+=att*hr; sM+=att*hm; }
    t+=seg;
  }
  return 20.0*(sR*bR*pR+sM*bM*pM);
}
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
vec3 dirOf(float az, float el){ return vec3(sin(az)*cos(el), sin(el), cos(az)*cos(el)); }
void main(){
  float az=uViewAz+(vUv.x-0.5)*uFov.x;
  float el=(vUv.y-uHorizon)*uFov.y;
  bool sea=el<0.0 && uSea>0.5;
  float e=sea ? max(-el,0.002) : max(el,0.0015);
  vec3 d=dirOf(az,e);
  vec3 c=atmo(d,uSun);
  float mu=dot(d,uSun);
  vec3 sunT=exp(-(bR*8e3/max(uSun.y+0.03,0.03)*0.9));
  float disc=smoothstep(0.99995,0.99999,mu);
  c+=sunT*disc*40.0*step(0.0,uSun.y+0.01);
  // a soft halo keeps the sun readable when it is small on screen
  c+=sunT*pow(max(mu,0.0),900.0)*2.0*step(0.0,uSun.y+0.01);
  // stars (fixed field; they simply fade in)
  vec2 sp=vec2(az*180.0, el*180.0); vec2 cell=floor(sp); float h=hash(cell);
  float st=step(0.991,h)*smoothstep(0.35,0.0,length(fract(sp)-0.5))*(0.4+0.6*hash(cell+7.0));
  // night floor: deep ultramarine so the page never goes black
  vec3 night=mix(vec3(0.010,0.016,0.040), vec3(0.002,0.004,0.014), clamp(el*2.0,0.0,1.0));
  // multiple scattering is missing from the single-scatter model; at twilight it is what makes the sky blue
  c=c*uExposure+vec3(0.030,0.060,0.150)*uTwi*(1.15-0.55*clamp(el*2.0,0.0,1.0))+night*uNight+vec3(st)*uNight*(sea?0.0:1.0)*0.9;
  if(sea){ // calm water: darker, cooler reflection with a sun path
    c=c*vec3(0.55,0.62,0.70)*0.75;
    float gl=pow(max(dot(normalize(vec3(d.x,-d.y,d.z)),uSun),0.0),80.0)*step(0.0,uSun.y);
    c+=sunT*gl*uExposure*1.2*(0.6+0.4*hash(floor(vUv*uRes*vec2(0.5,2.0))));
  }
  c=aces(c); c=pow(c,vec3(1.0/2.2));
  c+=(hash(vUv*uRes+fract(uExposure))-0.5)/255.0; // dither: no banding in long gradients
  o=vec4(c,1.0);
}`;

// --- CPU twin of the shader (fewer samples) for the CSS variables
function atmoCPU(d, s) {
  const Re = 6360e3, Ra = 6420e3, Hr = 7994, Hm = 1200, bR = [5.8e-6, 13.5e-6, 33.1e-6], bM = 21e-6 * 0.6, bO = [0.65e-6, 1.881e-6, 0.085e-6];
  const oz = h => Math.max(0, 1 - Math.abs(h - 25000) / 15000);
  const rsi = (o, dd, r) => { const b = o[0] * dd[0] + o[1] * dd[1] + o[2] * dd[2]; const c = o[0] ** 2 + o[1] ** 2 + o[2] ** 2 - r * r; const h = b * b - c; if (h < 0) return [1e12, -1e12]; const q = Math.sqrt(h); return [-b - q, -b + q]; };
  const orig = [0, Re + 60, 0];
  let tmax = rsi(orig, d, Ra)[1]; const tg = rsi(orig, d, Re); if (tg[0] > 0) tmax = Math.min(tmax, tg[0]);
  const N = 12, seg = tmax / N; let t = 0, oR = 0, oM = 0, oO = 0; const sR = [0, 0, 0], sM = [0, 0, 0];
  const mu = d[0] * s[0] + d[1] * s[1] + d[2] * s[2]; const pR = 3 / (16 * Math.PI) * (1 + mu * mu); const g = 0.78;
  const pM = 3 / (8 * Math.PI) * ((1 - g * g) * (1 + mu * mu)) / ((2 + g * g) * Math.pow(1 + g * g - 2 * g * mu, 1.5));
  for (let i = 0; i < N; i++) {
    const x = orig.map((v, k) => v + d[k] * (t + seg / 2)); const h = Math.hypot(...x) - Re;
    const hr = Math.exp(-h / Hr) * seg, hm = Math.exp(-h / Hm) * seg; oR += hr; oM += hm; oO += oz(h) * seg;
    const sl = rsi(x, s, Ra)[1] / 4; let lR = 0, lM = 0, lO = 0, ok = true;
    for (let j = 0; j < 4; j++) { const y = x.map((v, k) => v + s[k] * sl * (j + 0.5)); const hl = Math.hypot(...y) - Re; if (hl < 0) { ok = false; break; } lR += Math.exp(-hl / Hr) * sl; lM += Math.exp(-hl / Hm) * sl; lO += oz(hl) * sl; }
    if (ok) for (let k = 0; k < 3; k++) { const att = Math.exp(-(bR[k] * (oR + lR) + bM * 1.1 * (oM + lM) + bO[k] * (oO + lO))); sR[k] += att * hr; sM[k] += att * hm; }
    t += seg;
  }
  return [0, 1, 2].map(k => 20 * (sR[k] * bR[k] * pR + sM[k] * bM * pM));
}
const aces = x => Math.min(1, Math.max(0, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)));
const toHex = rgb => '#' + rgb.map(v => Math.round(Math.pow(aces(v), 1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');

function exposureFor(el) {
  // brighten twilight so blue hour reads as blue, not black (a photographer would too)
  if (el > 8) return 1.0;
  if (el > -1) return 1.0 + (8 - el) * 0.06;
  return Math.min(1.54 + Math.pow(-1 - el, 1.4) * 1.2, 7);
}

export function mountSky(canvas, opts = {}) {
  const o = { lat: 59.91, lon: 10.75, resolution: 0.4, fov: [150, 52], horizon: 0.3, sea: true, cssTarget: document.documentElement, viewAzimuth: null, ...opts };
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
  let time = opts.time || null, timer = 0, state = null;
  const fallback = () => { // no WebGL2: CSS gradient from the CPU model
    canvas.style.background = `linear-gradient(to bottom, ${state.colors.zenith}, ${state.colors.horizon})`;
  };
  let prog, U = {};
  if (gl) {
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['uTwi', 'uSun', 'uViewAz', 'uFov', 'uHorizon', 'uExposure', 'uNight', 'uSea', 'uRes']) U[n] = gl.getUniformLocation(prog, n);
  }
  function compute() {
    const now = time || new Date();
    const { elevation, azimuth } = sunPosition(now, o.lat, o.lon);
    const s = [Math.sin(azimuth * RAD) * Math.cos(elevation * RAD), Math.sin(elevation * RAD), Math.cos(azimuth * RAD) * Math.cos(elevation * RAD)];
    const ex = exposureFor(elevation);
    const night = 1 - Math.min(1, Math.max(0, (elevation + 12) / 8));
    const twi = Math.exp(-Math.pow((elevation + 5) / 4.5, 2));
    const nightCol = [0.010, 0.016, 0.040].map(v => v * night);
    const twiCol = [0.030, 0.060, 0.150].map(v => v * twi);
    const z = atmoCPU([0, 1, 0], s).map((v, k) => v * ex + nightCol[k] + twiCol[k] * 0.6);
    const hz = atmoCPU([Math.sin(azimuth * RAD) * 0.99, 0.03, Math.cos(azimuth * RAD) * 0.99], s).map((v, k) => v * ex + nightCol[k] + twiCol[k] * 1.2);
    const sunT = [5.8e-6, 13.5e-6, 33.1e-6].map(b => Math.exp(-b * 8e3 / Math.max(s[1] + 0.03, 0.03) * 0.9));
    return { time: now, elevation, azimuth, sun: s, exposure: ex, night, twi, phase: skyPhase(elevation),
      colors: { zenith: toHex(z), horizon: toHex(hz), sun: toHex(sunT.map(v => v * 0.9)) } };
  }
  function draw() {
    state = compute();
    const t = o.cssTarget;
    if (t) {
      t.style.setProperty('--sky-zenith', state.colors.zenith);
      t.style.setProperty('--sky-horizon', state.colors.horizon);
      t.style.setProperty('--sun-color', state.colors.sun);
      t.style.setProperty('--sun-el', state.elevation.toFixed(2));
      t.style.setProperty('--sky-phase', state.phase);
      t.dataset.skyPhase = state.phase;
    }
    if (!gl) { fallback(); }
    else {
      const r = Math.min(window.devicePixelRatio || 1, 2) * o.resolution;
      const w = Math.max(64, Math.round(canvas.clientWidth * r)), h = Math.max(64, Math.round(canvas.clientHeight * r));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h); gl.useProgram(prog);
      gl.uniform3fv(U.uSun, state.sun);
      // face the sun's side of the sky: south by day; follow the sun when it is low in the north (summer nights)
      const viewAz = o.viewAzimuth ?? (Math.cos(state.azimuth * RAD) > 0.2 ? state.azimuth : 180);
      gl.uniform1f(U.uViewAz, viewAz * RAD);
      const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      const fovX = Math.min(o.fov[0], o.fov[1] * aspect * 1.2);
      gl.uniform2f(U.uFov, fovX * RAD, (fovX / aspect) * RAD);
      gl.uniform1f(U.uHorizon, o.horizon); gl.uniform1f(U.uExposure, state.exposure); gl.uniform1f(U.uNight, state.night); gl.uniform1f(U.uTwi, state.twi);
      gl.uniform1f(U.uSea, o.sea ? 1 : 0); gl.uniform2f(U.uRes, w, h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    canvas.dispatchEvent(new CustomEvent('skychange', { detail: state }));
  }
  const schedule = () => { clearTimeout(timer); if (!time) timer = setTimeout(() => { draw(); schedule(); }, 60000); };
  const ro = new ResizeObserver(() => draw()); ro.observe(canvas);
  draw(); schedule();
  return {
    get state() { return state; },
    setTime(d) { time = d; draw(); schedule(); },
    redraw: draw,
    destroy() { clearTimeout(timer); ro.disconnect(); },
  };
}
