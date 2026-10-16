// sunrise.js — the hero wallpaper for design 32 ("Night Shift Paper").
// A raw WebGL1 fragment shader, extended from the kit's papercut-shader.js:
// six torn paper hills with white fibre rims and cast shadows, a ringed sodium
// sun, aurora strips, punched stars and lit cabin windows. New here:
//   - uRise: the sun climbs as the visitor scrolls (or drags it), the sky warms
//     and the stars go out. It is always nearly morning.
//   - uPop: a paper ring that pushes out from the sun when it is clicked.
//   - parallax from pointer or device orientation, eased.
// No dependencies. Renders one frame and stops under prefers-reduced-motion.

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uTilt; uniform float uSunX; uniform float uRise; uniform float uPop;
#define LAYERS 6
float h1(float n){ return fract(sin(n) * 43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n1(float x){ float i = floor(x), f = fract(x); return mix(h1(i), h1(i + 1.), f * f * (3. - 2. * f)); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), u.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), u.x), u.y); }
float fbm1(float x){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * n1(x); x *= 2.17; a *= .5; } return s; }
float fbm2(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++){ s += a * n2(p); p *= 2.03; a *= .5; } return s; }
vec3 layerCol(int i){
  if (i == 0) return vec3(.251, .424, .608);
  if (i == 1) return vec3(.184, .345, .533);
  if (i == 2) return vec3(.122, .259, .455);
  if (i == 3) return vec3(.071, .165, .322);
  if (i == 4) return vec3(.039, .098, .212);
  return vec3(.020, .051, .110);
}
float hill(int i, float x){
  float fi = float(i), d = .4 + fi * .35;
  x += uTilt.x * d * .035;
  float base = .40 - fi * .062, amp = .08 + fi * .01;
  float h = base + (fbm1(x * (1.9 - fi * .18) + fi * 7.3) - .5) * amp * 2.6 + sin(x * 1.7 + fi * 1.7) * .03;
  if (i < 2) h += pow(1. - abs(n1(x * 2.2 + fi * 4.) * 2. - 1.), 3.) * .09;
  h += (n1(x * 90. + fi * 13.) - .5) * .004 + (n1(x * 23. + fi) - .5) * .006;
  return h - uTilt.y * d * .02;
}
float rimW(int i, float x){ return .004 + n1(x * 60. + float(i) * 3.) * .007; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; float asp = uRes.x / uRes.y; vec2 p = vec2(uv.x * asp, uv.y);
  float grain = (h2(gl_FragCoord.xy) - .5) * .035;
  float fib = smoothstep(.62, .7, fbm2(vec2(p.x * 40., p.y * 9.) + fbm2(p * 6.) * 3.)) * .05;
  float r = uRise;
  vec3 skyLo = mix(vec3(.039, .098, .212), vec3(.30, .20, .30), r * .7);
  vec3 skyHi = mix(vec3(.016, .043, .094), vec3(.07, .13, .28), r);
  vec3 col = mix(skyLo, skyHi, smoothstep(.30, 1., uv.y));
  float sunR = min(.19, .13 + .03 * asp);
  vec2 sun = vec2(uSunX * asp - uTilt.x * .008, mix(.30, .58, r) - uTilt.y * .006);
  float sd = length(p - sun);
  col += vec3(.96, .55, .15) * (.32 + r * .3) * exp(-sd * (3.4 - r * 1.2));
  vec2 sg = floor(p * 70.); float st = h2(sg); vec2 sf = fract(p * 70.) - .5;
  if (st > .985 && uv.y > .42) col = mix(col, vec3(.96, .93, .87), (1. - r * .85) * smoothstep(.22, .1, length(sf)) * (.6 + .4 * sin(uTime * 2. + st * 40.)));
  for (int k = 0; k < 3; k++){
    float fk = float(k), xx = p.x + uTilt.x * (.012 + fk * .006);
    float c = .86 - fk * .065 + sin(xx * 2.3 + uTime * .12 + fk * 2.) * .045 + (fbm1(xx * 3. + fk * 5. + uTime * .05) - .5) * .06;
    float w = .011 + .009 * pow(sin(xx * 1.3 + fk), 2.) + (n1(xx * 70. + fk * 9.) - .5) * .004;
    vec3 ac = k == 0 ? vec3(.114, .416, .322) : (k == 1 ? vec3(.345, .698, .416) : vec3(.604, .855, .369));
    float sh = smoothstep(w + .012, w, abs(p.y + .012 - c)) * .5;
    col *= 1. - sh;
    if (abs(p.y - c) < w) col = mix(ac * (1. + fbm2(p * 30.) * .12), col, r * .45);
  }
  // a paper ring pushed out by a click on the sun
  float ring = sunR * (1. + uPop * 1.6);
  if (uPop > 0. && uPop < 1. && abs(sd - ring) < .006 * (1. - uPop) + .002) col = mix(col, vec3(.976, .8, .53), 1. - uPop);
  if (sd < sunR + .01) col *= .7;
  if (sd < sunR) col = vec3(.835, .361, .075);
  if (sd < sunR * .83) col = vec3(.949, .651, .29);
  if (sd < sunR * .66) col = vec3(.965, .549, .149) * 1.08;
  if (sd < sunR * .5) col = vec3(.976, .8, .53);
  for (int i = 0; i < LAYERS; i++){
    float h = hill(i, p.x);
    if (p.y < h) col = layerCol(i) * (1. + (uv.y - h) * .6) * (1. + r * .18 * (1. - float(i) / 6.));
    else if (p.y < h + rimW(i, p.x)) col = vec3(.93, .91, .86);
    if (i < LAYERS - 1){
      float hn = hill(i + 1, p.x - .006);
      float s = smoothstep(hn + .018, hn, p.y) * step(hill(i + 1, p.x), p.y);
      col *= 1. - s * .38 * step(p.y, h + rimW(i, p.x));
    }
  }
  vec2 wq = vec2(p.x * 110., p.y * 110.); vec2 wg = floor(wq); vec2 wf = fract(wq); float wh = h2(wg + 3.);
  if (wh > .982 && max(abs(wf.x - .5), abs(wf.y - .5)) < .28 && p.y < hill(3, p.x) - .012 && p.y > hill(4, p.x) + .006) col = vec3(1., .75, .42);
  col *= 1. + grain + fib;
  col *= 1. - .25 * pow(length(uv - .5), 2.);
  gl_FragColor = vec4(col, 1.);
}`;

export function mountSunrise(canvas, opts = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return null;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(pr, n);
  const u = { res: U('uRes'), time: U('uTime'), tilt: U('uTilt'), sunX: U('uSunX'), rise: U('uRise'), pop: U('uPop') };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(devicePixelRatio || 1, opts.maxDpr ?? 1.25);
  const state = { tilt: [0, 0], cur: [0, 0], rise: opts.rise ?? 0.15, riseCur: opts.rise ?? 0.15, pop: -1, sunX: opts.sunX ?? 0.6, visible: true };
  const size = () => { canvas.width = Math.max(1, canvas.clientWidth * dpr | 0); canvas.height = Math.max(1, canvas.clientHeight * dpr | 0); gl.viewport(0, 0, canvas.width, canvas.height); if (reduce) draw(performance.now()); };
  let raf = 0; const t0 = performance.now(); let last = t0;
  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    state.cur[0] += (state.tilt[0] - state.cur[0]) * 0.06; state.cur[1] += (state.tilt[1] - state.cur[1]) * 0.06;
    state.riseCur += (state.rise - state.riseCur) * (reduce ? 1 : 0.08);
    if (state.pop >= 0) { state.pop += dt * 0.9; if (state.pop > 1) state.pop = -1; }
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, reduce ? 0 : (now - t0) / 1000);
    gl.uniform2f(u.tilt, state.cur[0] * 4, state.cur[1] * 4);
    gl.uniform1f(u.sunX, state.sunX); gl.uniform1f(u.rise, state.riseCur); gl.uniform1f(u.pop, state.pop);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  const loop = (now) => { raf = requestAnimationFrame(loop); if (state.visible) draw(now); };
  new ResizeObserver(size).observe(canvas); size();
  new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; }).observe(canvas);
  if (reduce) draw(performance.now()); else raf = requestAnimationFrame(loop);
  // sun position in CSS pixels relative to the canvas (for hit testing a click)
  const sunAt = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight, asp = w / h;
    const sunR = Math.min(0.19, 0.13 + 0.03 * asp);
    const y = 0.30 + (0.58 - 0.30) * state.riseCur;
    return { x: state.sunX * w, y: (1 - y) * h, r: sunR * h };
  };
  return {
    setTilt(x, y) { state.tilt[0] = x; state.tilt[1] = y; },
    setRise(v) { state.rise = Math.max(0, Math.min(1, v)); if (reduce) draw(performance.now()); },
    get rise() { return state.rise; },
    pop() { state.pop = 0; },
    sunAt,
    destroy() { cancelAnimationFrame(raf); },
  };
}
