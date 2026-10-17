// Totality corona — raw WebGL1, no dependencies (~5 KB).
// Renders the graded Trouvelot eclipse plate with a living, procedural corona on top:
//  - luminance "develop" reveal (brightest light first) driven by `intro` 0..1
//  - the diamond-ring bead igniting at the aperture gap
//  - streamers that breathe slowly (fbm in polar space)
//  - "fracture": the corona splits into the duotone ramp along the pointer direction
//  - the moon drifts a few pixels against the pointer (parallax)
// Usage:
//   import { mountCorona } from './corona.js'
//   const c = await mountCorona(canvas, { plate: 'hero/totality-1600.webp' })
//   c.play()            // run the 4.2 s intro (returns a Promise)
//   c.set({ intro: 1 }) // jump to the resolved state
//   c.destroy()
// Honors prefers-reduced-motion: renders the resolved frame once and stops.

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform sampler2D uPlate;
uniform vec2 uPlateRes;
uniform float uHasPlate;
uniform float uTime;
uniform float uIntro;     // 0 black -> 1 resolved
uniform vec2 uPointer;    // -1..1
uniform float uFracture;  // 0..1
uniform float uR;         // disc radius in height units
uniform vec2 uDiscPos;    // disc centre in plate uv
uniform float uZoom;      // <1 pulls back on portrait screens so the corona fits

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= .5; } return v; }

// duotone ramp, hue 324 (umbra -> plum -> glow -> paper)
vec3 duo(float t){
  t = clamp(t, 0., 1.);
  vec3 a = vec3(.051, .016, .055), b = vec3(.329, .165, .341), c = vec3(.792, .435, .827), d = vec3(.992, .973, .992);
  if (t < .42) return mix(a, b, t / .42);
  if (t < .78) return mix(b, c, (t - .42) / .36);
  return mix(c, d, (t - .78) / .22);
}

// procedural corona light at point q (height units, disc-centred)
float corona(vec2 q, float t){
  float r = length(q), a = atan(q.y, q.x);
  vec2 ring = vec2(cos(a), sin(a));   // seamless around the circle
  float rays = fbm(ring * 4.5 + vec2(r * .8 - t * .02, t * .01)) * .55 + pow(fbm(ring * 22. + vec2(r * .5 + t * .015)), 2.) * .9;
  float eq = exp(-pow(q.y * 3.2 + q.x * .45, 2.)) * .55;             // equatorial wings, tilted
  float fall = exp(-(r - uR) * 6.5) * smoothstep(uR * .96, uR * 1.02, r);
  return fall * (0.35 + rays) + eq * exp(-(r - uR) * 2.2) * smoothstep(uR, uR * 1.3, r);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag - .5 * uRes) / uRes.y;           // centred, height = 1
  float t = uTime;
  float k = uIntro;

  // cover-fit plate uv
  float s = max(uRes.x / uPlateRes.x, uRes.y / uPlateRes.y) * uZoom;
  vec2 uv = (frag - .5 * uRes) / (uPlateRes * s) + .5;
  uv.y = 1. - uv.y;
  vec2 dc = (uDiscPos - .5) * uPlateRes * s / uRes.y; dc.y = -dc.y;   // disc centre, height units
  vec2 q = p - dc;

  // breathing warp, radial only, so the lithograph grain survives
  float w = (fbm(normalize(q + 1e-5) * 3. + vec2(t * .05)) - .5) * .006 * smoothstep(uR, uR * 2.5, length(q));
  vec2 wuv = uv + normalize(q + 1e-5) * w * vec2(uRes.y / uRes.x, -1.);

  // fracture: per-channel radial offsets along the pointer direction
  vec2 dir = normalize(uPointer + vec2(1e-4)) * uFracture * .006;
  vec3 plate = vec3(0.);
  if (uHasPlate > .5){
    plate = texture2D(uPlate, wuv).rgb;
    // the fracture stays inside the duotone: offset copies of the light, re-inked
    // as glow (outer edge) and paper (inner edge), screened over the plate
    float la = dot(texture2D(uPlate, wuv + dir).rgb, vec3(.2126, .7152, .0722));
    float lb = dot(texture2D(uPlate, wuv - dir).rgb, vec3(.2126, .7152, .0722));
    float l0 = dot(plate, vec3(.2126, .7152, .0722));
    vec3 split = vec3(.792, .435, .827) * max(la - l0, 0.) * 2.2 + vec3(.992, .94, .99) * max(lb - l0, 0.) * 1.6;
    plate = 1. - (1. - plate) * (1. - split * uFracture);
    // fade to umbra outside the plate (portrait pull-back) instead of clamped edge streaks
    vec2 e = smoothstep(vec2(0.), vec2(.06), wuv) * smoothstep(vec2(0.), vec2(.06), 1. - wuv);
    plate = mix(vec3(.051, .016, .055), plate, e.x * e.y);
  }
  float lum = dot(plate, vec3(.2126, .7152, .0722));

  // procedural corona (used alone without a plate, and as a living glow layer with it)
  float c = corona(q, t);
    vec3 glow = duo(c * .9) * c;

  // develop: brightest light appears first
  float dev = smoothstep(1. - k * 1.3, 1.3 - k * 1.3, max(lum, c * .6));
  vec3 col = mix(vec3(.051, .016, .055), plate, dev) + glow * (uHasPlate > .5 ? .09 : 1.) * smoothstep(.15, .75, k);

  // the moon: an exact disc that drifts slightly against the pointer
  vec2 m = q + uPointer * .006;
  float disc = smoothstep(uR * 1.034, uR * 1.026, length(m));
  // chromosphere rim
  float rim = exp(-abs(length(m) - uR * 1.03) * 300.) * smoothstep(.2, .6, k);
  col += vec3(.99, .86, .98) * rim * .35;
  col = mix(col, vec3(.035, .01, .04), disc);

  // diamond ring bead, ignites first and then settles
  vec2 bp = vec2(cos(.78), sin(.78)) * uR * 1.035;
  float bd = length(q - bp);
  float beadAmp = smoothstep(.06, .22, k) * (1. - .65 * smoothstep(.35, .7, k));
  col += vec3(1., .93, .99) * (exp(-bd * 160.) * 1.4 + exp(-bd * 22.) * .35) * beadAmp;
  // a thin horizontal flare through the bead
  col += vec3(.95, .7, .97) * exp(-abs(q.y - bp.y) * 900.) * exp(-abs(q.x - bp.x) * 9.) * beadAmp * .5 * (1. - disc);

  // vignette + dither
  col *= 1. - .35 * pow(length(p * vec2(.75, 1.)), 2.2);
  col += (hash(frag + t) - .5) / 255.;
  gl_FragColor = vec4(col, 1.);
}`;

export async function mountCorona(canvas, opts = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: !!opts.preserve });
  if (!gl) throw new Error('WebGL unavailable');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sh = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  for (const n of ['uRes', 'uPlate', 'uPlateRes', 'uHasPlate', 'uTime', 'uIntro', 'uPointer', 'uFracture', 'uR', 'uDiscPos', 'uZoom'])
    U[n] = gl.getUniformLocation(prog, n);

  // plate geometry: the eclipse disc sits at (0.497, 0.494) with radius 0.152 of the plate height
  const disc = opts.disc || { x: 0.497, y: 0.494, r: 0.152 };
  let plateRes = [1600, 900], hasPlate = 0;
  if (opts.plate) {
    const img = new Image(); img.decoding = 'async'; img.src = opts.plate;
    try {
      await img.decode();
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
        [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      plateRes = [img.naturalWidth, img.naturalHeight]; hasPlate = 1;
    } catch (e) { /* procedural fallback */ }
  }

  const state = { intro: reduce ? 1 : (opts.intro ?? 0), fracture: 0, px: 0, py: 0, tx: 0, ty: 0 };
  let raf = 0, t0 = performance.now(), running = true;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, opts.maxDpr || 1.5);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  };
  const ro = new ResizeObserver(() => { resize(); if (reduce) draw(0); });
  ro.observe(canvas);

  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    state.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  addEventListener('pointermove', onMove, { passive: true });

  function draw(time) {
    resize();
    state.px += (state.tx - state.px) * 0.06; state.py += (state.ty - state.py) * 0.06;
    const speed = Math.hypot(state.tx - state.px, state.ty - state.py);
    state.fracture += (Math.min(1, speed * 6) - state.fracture) * 0.08;
    const zoom = opts.zoom ?? (canvas.width < canvas.height ? Math.max(0.5, (canvas.width / canvas.height) * 0.95) : 1);
    const s = Math.max(canvas.width / plateRes[0], canvas.height / plateRes[1]) * zoom;
    gl.uniform1f(U.uZoom, zoom);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uPlateRes, plateRes[0], plateRes[1]);
    gl.uniform1f(U.uHasPlate, hasPlate);
    gl.uniform1i(U.uPlate, 0);
    gl.uniform1f(U.uTime, time / 1000);
    gl.uniform1f(U.uIntro, state.intro);
    gl.uniform2f(U.uPointer, state.px, state.py);
    gl.uniform1f(U.uFracture, opts.fracture ?? state.fracture);
    gl.uniform1f(U.uR, disc.r * plateRes[1] * s / canvas.height);
    gl.uniform2f(U.uDiscPos, disc.x, disc.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  const loop = (now) => { if (!running) return; draw(now - t0); raf = requestAnimationFrame(loop); };
  if (reduce) draw(0); else raf = requestAnimationFrame(loop);

  // pause when off-screen
  const io = new IntersectionObserver(([e]) => {
    if (reduce) return;
    if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(loop); }
    else if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
  });
  io.observe(canvas);

  return {
    canvas,
    set(o) { Object.assign(state, o); if (reduce) draw(0); },
    // intro: 4.2 s, eased like a slow exposure (expo-out on the develop)
    play(duration = 4200) {
      if (reduce) { state.intro = 1; draw(0); return Promise.resolve(); }
      state.intro = 0;
      const start = performance.now();
      return new Promise((res) => {
        const step = (now) => {
          const x = Math.min(1, (now - start) / duration);
          state.intro = x < 1 ? 1 - Math.pow(2, -9 * x) * (1 - x) : 1;
          x < 1 ? requestAnimationFrame(step) : res();
        };
        requestAnimationFrame(step);
      });
    },
    destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onMove); },
  };
}
