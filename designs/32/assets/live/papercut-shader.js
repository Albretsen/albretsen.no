// papercut-shader.js — a raw WebGL1 fragment shader that draws a living
// paper cut-out night: torn-edge hills with white fibre rims and real-looking
// drop shadows, a ringed sodium sun, swaying aurora ribbons, punched stars and
// paper grain. Every layer parallaxes by depth from pointer / device tilt.
// No dependencies. ~4 KB.
//
//   import { mountPapercut } from './live/papercut-shader.js';
//   const pc = mountPapercut(canvasOrContainer, { sunX: 0.62 });
//   pc.destroy();

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uTilt; uniform float uSunX;
#define LAYERS 6
float h1(float n){ return fract(sin(n) * 43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n1(float x){ float i = floor(x), f = fract(x); return mix(h1(i), h1(i + 1.), f * f * (3. - 2. * f)); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), u.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), u.x), u.y); }
float fbm1(float x){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * n1(x); x *= 2.17; a *= .5; } return s; }
float fbm2(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++){ s += a * n2(p); p *= 2.03; a *= .5; } return s; }

vec3 layerCol(int i){
  if (i == 0) return vec3(.251, .424, .608);   // twilight
  if (i == 1) return vec3(.184, .345, .533);
  if (i == 2) return vec3(.122, .259, .455);   // dusk
  if (i == 3) return vec3(.071, .165, .322);   // deep
  if (i == 4) return vec3(.039, .098, .212);   // night
  return vec3(.020, .051, .110);               // ink
}
// height of torn hill layer i at x (in aspect-corrected units), includes the parallax shift
float hill(int i, float x){
  float fi = float(i), d = .4 + fi * .35;
  x += uTilt.x * d * .035;
  float base = .47 - fi * .072, amp = .085 + fi * .01;
  float h = base + (fbm1(x * (1.9 - fi * .18) + fi * 7.3) - .5) * amp * 2.6 + sin(x * 1.7 + fi * 1.7) * .03;
  if (i < 2) h += pow(1. - abs(n1(x * 2.2 + fi * 4.) * 2. - 1.), 3.) * .09;
  h += (n1(x * 90. + fi * 13.) - .5) * .004 + (n1(x * 23. + fi) - .5) * .006;  // torn fibres
  return h - uTilt.y * d * .02;
}
float rimW(int i, float x){ return .004 + n1(x * 60. + float(i) * 3.) * .007; }

void main(){
  vec2 uv = gl_FragCoord.xy / uRes; float asp = uRes.x / uRes.y; vec2 p = vec2(uv.x * asp, uv.y);
  float grain = (h2(gl_FragCoord.xy) - .5) * .035;
  float fib = smoothstep(.62, .7, fbm2(vec2(p.x * 40., p.y * 9.) + fbm2(p * 6.) * 3.)) * .05;

  // sky
  vec3 col = mix(vec3(.039, .098, .212), vec3(.016, .043, .094), smoothstep(.35, 1., uv.y));
  vec2 sun = vec2(uSunX * asp - uTilt.x * .008, .44 - uTilt.y * .006);
  float sd = length(p - sun);
  col += vec3(.96, .55, .15) * .35 * exp(-sd * 3.2);
  // punched stars
  vec2 sg = floor(p * 70.); float st = h2(sg); vec2 sf = fract(p * 70.) - .5;
  if (st > .985 && uv.y > .45) col = mix(col, vec3(.96, .93, .87), smoothstep(.22, .1, length(sf)) * (.6 + .4 * sin(uTime * 2. + st * 40.)));
  // aurora ribbons (3 paper strips with shadow)
  for (int k = 0; k < 3; k++){
    float fk = float(k), xx = p.x + uTilt.x * (.012 + fk * .006);
    float c = .80 - fk * .07 + sin(xx * 2.3 + uTime * .12 + fk * 2.) * .05 + (fbm1(xx * 3. + fk * 5. + uTime * .05) - .5) * .06;
    float w = .012 + .01 * pow(sin(xx * 1.3 + fk), 2.) + (n1(xx * 70. + fk * 9.) - .5) * .004;
    vec3 ac = k == 0 ? vec3(.114, .416, .322) : (k == 1 ? vec3(.345, .698, .416) : vec3(.604, .855, .369));
    float sh = smoothstep(w + .012, w, abs(p.y + .012 - c)) * .5;
    col *= 1. - sh;
    if (abs(p.y - c) < w) col = ac * (1. + fbm2(p * 30.) * .12);
  }
  // sun rings (paper discs)
  if (sd < .19) { col *= .7; }
  if (sd < .18) col = vec3(.835, .361, .075);
  if (sd < .15) col = vec3(.949, .651, .29);
  if (sd < .12) col = vec3(.965, .549, .149) * 1.08;
  if (sd < .09) col = vec3(.976, .8, .53);

  // hills, back to front; shadow from the next nearer layers
  for (int i = 0; i < LAYERS; i++){
    float h = hill(i, p.x);
    if (p.y < h) col = layerCol(i) * (1. + (uv.y - h) * .6);
    else if (p.y < h + rimW(i, p.x)) col = vec3(.93, .91, .86);
    // shadow cast by the layer in front onto this one
    if (i < LAYERS - 1){
      float hn = hill(i + 1, p.x - .006);
      float s = smoothstep(hn + .018, hn, p.y + .0) * step(hill(i + 1, p.x), p.y);
      col *= 1. - s * .38 * step(p.y, h + rimW(i, p.x));
    }
  }
  // lit windows: tiny sodium squares on layer 3
  vec2 wq = vec2(p.x * 110., p.y * 110.); vec2 wg = floor(wq); vec2 wf = fract(wq); float wh = h2(wg + 3.);
  if (wh > .985 && max(abs(wf.x - .5), abs(wf.y - .5)) < .28 && p.y < hill(3, p.x) - .012 && p.y > hill(4, p.x) + .006) col = vec3(1., .75, .42);

  col *= 1. + grain + fib;
  col *= 1. - .25 * pow(length(uv - .5), 2.);
  gl_FragColor = vec4(col, 1.);
}`;

export function mountPapercut(target, opts = {}) {
  const canvas = target.tagName === 'CANVAS' ? target : target.appendChild(Object.assign(document.createElement('canvas'), { style: 'display:block;width:100%;height:100%' }));
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) return { destroy() {} };
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(pr, n); const uRes = U('uRes'), uTime = U('uTime'), uTilt = U('uTilt'), uSun = U('uSunX');
  const dpr = Math.min(devicePixelRatio, opts.maxDpr ?? 1.5);
  const size = () => { canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(size); ro.observe(canvas); size();
  const tgt = [0, 0], cur = [0, 0];
  const move = (e) => { const b = canvas.getBoundingClientRect(); tgt[0] = ((e.clientX - b.left) / b.width) * 2 - 1; tgt[1] = ((e.clientY - b.top) / b.height) * 2 - 1; };
  const orient = (e) => { if (e.gamma != null) { tgt[0] = Math.max(-1, Math.min(1, e.gamma / 25)); tgt[1] = Math.max(-1, Math.min(1, (e.beta - 45) / 25)); } };
  addEventListener('pointermove', move); addEventListener('deviceorientation', orient);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0; const t0 = performance.now();
  const draw = (now) => {
    cur[0] += (tgt[0] - cur[0]) * .06; cur[1] += (tgt[1] - cur[1]) * .06;
    gl.uniform2f(uRes, canvas.width, canvas.height); gl.uniform1f(uTime, reduce ? 0 : (now - t0) / 1000);
    gl.uniform2f(uTilt, cur[0] * 4, cur[1] * 4); gl.uniform1f(uSun, opts.sunX ?? .62);
    gl.drawArrays(gl.TRIANGLES, 0, 3); if (!reduce) raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  return { canvas, destroy() { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('pointermove', move); removeEventListener('deviceorientation', orient); } };
}
