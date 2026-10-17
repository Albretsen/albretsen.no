// Halflight / halflight.js  -- the centrepiece. Raw WebGL, no dependencies.
//
// A live duotone halftone of a photograph. On load it plays a short title
// sequence: darkness -> a single spark ignites where the sun is -> the dot
// field pulls focus from coarse to fine (clarity) while a reveal wave travels
// out from the spark -> the image settles and gently breathes like light on water.
// The pointer acts as a small gravity well: dots lean toward it and resolve
// finer inside it, a loupe of clarity.
//
//   import { createHalflight } from './halflight.js'
//   const hl = createHalflight(canvas, { plate: 'dawn' })
//   hl.ready.then(() => ...)          // resolves when the intro has settled
//   hl.setPhase('dusk')               // phase name from timeofday.js or {paper,lo,hi,invert}
//
// Falls back silently (returns null) when WebGL is unavailable: show the baked
// hero/*.webp still underneath the canvas and nothing breaks.

import { PHASES, phaseNow } from './timeofday.js';

const BASE = new URL('../', import.meta.url).href; // assets/
export const PLATES = {
  dawn:  { src: BASE + 'shader/plate-dawn.webp',  spark: [0.085, 0.53], still: BASE + 'hero/hero-dawn.webp' },
  night: { src: BASE + 'shader/plate-night.webp', spark: [0.58, 0.62],  still: BASE + 'hero/hero-night.webp' },
  dusk:  { src: BASE + 'shader/plate-dusk.webp',  spark: [0.62, 0.36],  still: BASE + 'hero/hero-dusk-scope.webp' },
};

const VERT = `attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;

const FRAG = `precision highp float;
varying vec2 v;
uniform sampler2D u_tex;
uniform vec2 u_res, u_texRes, u_spark, u_mouse;
uniform float u_time, u_intro, u_cell, u_angle, u_mouseOn, u_invert, u_dpr;
uniform vec3 u_paper, u_lo, u_hi;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 coverUV(vec2 px){
  float s = max(u_res.x / u_texRes.x, u_res.y / u_texRes.y);
  vec2 size = u_texRes * s;
  vec2 off = (u_res - size) * .5;
  return (px - off) / size;
}
float lumAt(vec2 px, float bias){
  vec2 uv = clamp(coverUV(px), 0.001, .999);
  return texture2D(u_tex, vec2(uv.x, 1. - uv.y), bias).r;
}
float ease(float x){ x = clamp(x, 0., 1.); return 1. - pow(1. - x, 3.); }

void main(){
  vec2 px = vec2(v.x, 1. - v.y) * u_res;          // top-left origin, device px
  vec2 sparkPx = u_spark;                           // device px
  float intro = u_intro;

  // timeline inside the intro (0..1 over ~3.8s)
  float ignite = smoothstep(.06, .22, intro) * (1. - smoothstep(.42, .72, intro));
  float focus  = ease((intro - .18) / .62);         // coarse -> fine
  float wave   = ease((intro - .16) / .58);         // reveal radius

  // gravity well around the pointer
  vec2 dm = u_mouse - px;
  float md = length(dm);
  float R = 220. * u_dpr;
  float well = u_mouseOn * exp(-(md * md) / (R * R));
  vec2 p = px + dm * well * .22;

  // grid: anchored at the spark, rotated, cell shrinking as focus is pulled
  float cell = u_cell * u_dpr * mix(7., 1., focus) * mix(1., .62, well);
  float a = radians(u_angle);
  mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
  vec2 q = rot * (p - sparkPx) / cell;
  vec2 id0 = floor(q);
  mat2 irot = transpose_hack(rot);
  float maxD = length(u_res) * 1.05;
  float aa = 1.2 / cell;

  // 3x3 neighbourhood: bright dots grow past their cell and merge as true
  // overlapping circles, the way ink spreads on press. No square artefacts.
  float cov = 0., L = 0., shownC = 0., best = 9.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = id0 + vec2(float(i), float(j));
    vec2 centre = sparkPx + irot * ((id + .5) * cell);
    float l = lumAt(centre, -16.); // negative bias: centre jumps per cell, so ignore derivative-picked mips
    if (u_invert > .5) l = 1. - l;
    // breathing: slow shimmer, like light on water
    l = clamp(l * (1. + .04 * sin(u_time * 1.3 + hash(id) * 6.283 + centre.y * .004)) + well * .12, 0., 1.);
    // reveal wave from the spark, jittered per cell
    float rw = wave * maxD * (1. + hash(id + 7.3) * .18);
    float sh = max(smoothstep(rw, rw - 140. * u_dpr, length(centre - sparkPx)), step(.999, intro));
    float r = (sqrt(l) * .5 + smoothstep(.7, 1., l) * .26) * sh;
    float d = length(q - (id + .5));
    float c = smoothstep(r + aa, r - aa, d);
    if (c > cov + .001 || (cov < .001 && d < best)) { cov = c; L = l; shownC = sh; best = d; }
  }
  // continuous (per-pixel) tone and reveal for the underlay, so no cell edges show
  float Lp = lumAt(p, 1.);
  if (u_invert > .5) Lp = 1. - Lp;
  float shown = max(smoothstep(wave * maxD * 1.09, wave * maxD * 1.09 - 140. * u_dpr, length(p - sparkPx)), step(.999, intro));

  // a faint continuous-tone underlay keeps it photographic, not clip-art
  float under = Lp * .16 * shown;
  float k = clamp(cov * .86 + under, 0., 1.);
  vec3 ink = mix(u_lo, u_hi, smoothstep(.15, .95, L));
  vec3 col = mix(u_paper, ink, k);

  // halation from the blurred plate (mip bias)
  float bloom = lumAt(px, 5.);
  float lightPaper = step(.5, dot(u_paper, vec3(.3, .59, .11)));
  col += u_lo * pow(bloom, 2.2) * .35 * shown * (1. - lightPaper);

  // the spark itself
  float g = exp(-length(px - sparkPx) / (18. * u_dpr)) * 1.4 + exp(-length(px - sparkPx) / (90. * u_dpr)) * .35;
  vec3 sparkCol = mix(u_hi, vec3(1., .93, .7), .3 * (1. - lightPaper));

  // vignette + film breath
  vec2 uv = px / u_res - .5;
  col *= 1. - dot(uv, uv) * mix(.55, .18, lightPaper);
  col *= .985 + .015 * sin(u_time * 23.);
  // spark last, additive, so it burns through the vignette like a real point of light
  col = lightPaper > .5 ? mix(col, u_hi, clamp(g * ignite, 0., 1.)) : col + sparkCol * g * ignite;
  gl_FragColor = vec4(col, 1.);
}`.replace('transpose_hack(rot)', 'mat2(rot[0][0], rot[1][0], rot[0][1], rot[1][1])');

function hex3(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }

export function createHalflight(canvas, opts = {}) {
  // opts.freeze (0..1) pins the intro at one moment: used to bake storyboard stills.
  const o = { plate: null, phase: null, cell: 8, angle: 27, intro: true, interactive: true, duration: 3800, freeze: null, ...opts };
  const gl2 = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  const gl = gl2 || canvas.getContext('webgl', { antialias: false });
  if (!gl) return null;

  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['u_tex', 'u_res', 'u_texRes', 'u_spark', 'u_mouse', 'u_time', 'u_intro', 'u_cell', 'u_angle', 'u_mouseOn', 'u_invert', 'u_dpr', 'u_paper', 'u_lo', 'u_hi'].forEach(n => U[n] = gl.getUniformLocation(prog, n));

  const tex = gl.createTexture();
  let texRes = [16, 9], sparkUV = [.5, .5], loaded = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let introT = (o.intro && !reduce) ? 0 : 1, t0 = 0, mouse = [-9999, -9999], mouseOn = 0, mouseTarget = 0, raf = 0, dpr = 1;
  let resolveReady; const ready = new Promise(r => (resolveReady = r));

  const phaseName = o.phase || phaseNow();
  let phase = typeof phaseName === 'string' ? PHASES[phaseName] : phaseName;
  const setPhase = (p) => {
    phase = typeof p === 'string' ? PHASES[p] : p;
    gl.useProgram(prog);
    gl.uniform3fv(U.u_paper, hex3(phase.paper)); gl.uniform3fv(U.u_lo, hex3(phase.lo)); gl.uniform3fv(U.u_hi, hex3(phase.hi));
    gl.uniform1f(U.u_invert, phase.invert || 0);
  };
  setPhase(phase);

  function setPlate(name) {
    const P = PLATES[name] || { src: name, spark: [.5, .5] };
    sparkUV = P.spark;
    return new Promise((res) => {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (gl2) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
        else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        texRes = [img.naturalWidth, img.naturalHeight]; loaded = true; res();
      };
      img.src = P.src;
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  }
  function sparkPx() { // plate uv -> screen px through the same cover fit as the shader
    const W = canvas.width, H = canvas.height, s = Math.max(W / texRes[0], H / texRes[1]);
    return [(W - texRes[0] * s) / 2 + sparkUV[0] * texRes[0] * s, (H - texRes[1] * s) / 2 + sparkUV[1] * texRes[1] * s];
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!loaded) return;
    if (!t0) t0 = now;
    if (o.freeze != null) introT = o.freeze;
    else if (introT < 1) { introT = Math.min(1, (now - t0) / o.duration); if (introT === 1) resolveReady(); }
    mouseOn += (mouseTarget - mouseOn) * .08;
    resize();
    gl.uniform2f(U.u_res, canvas.width, canvas.height);
    gl.uniform2f(U.u_texRes, texRes[0], texRes[1]);
    gl.uniform2fv(U.u_spark, sparkPx());
    gl.uniform2f(U.u_mouse, mouse[0] * dpr, mouse[1] * dpr);
    gl.uniform1f(U.u_mouseOn, mouseOn);
    gl.uniform1f(U.u_time, now / 1000);
    gl.uniform1f(U.u_intro, introT);
    gl.uniform1f(U.u_cell, o.cell);
    gl.uniform1f(U.u_angle, o.angle);
    gl.uniform1f(U.u_dpr, dpr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  const onMove = (e) => { const r = canvas.getBoundingClientRect(); mouse = [e.clientX - r.left, e.clientY - r.top]; mouseTarget = 1; };
  const onLeave = () => { mouseTarget = 0; };
  if (o.interactive) { canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave); }
  if (introT === 1) resolveReady();

  setPlate(o.plate || phase.plate || 'dawn').then(() => { raf = requestAnimationFrame(frame); });

  return {
    ready, setPhase, setPlate,
    play() { introT = 0; t0 = 0; },
    get progress() { return introT; },
    destroy() { cancelAnimationFrame(raf); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave); },
  };
}
