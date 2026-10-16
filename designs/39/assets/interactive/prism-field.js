/* prism-field.js — turn a still into live glass. One fragment shader, no dependencies.
 *
 * Give it one of the baked caustic stills (hero/prism*.webp, hero/echo*.webp) or any
 * image. A sheet of glass lies over it: the pointer drags a lens through the glass
 * (spring-driven), a click or tap sends an echo ring outward, and the glass breathes
 * very slightly on its own. Each of 7 wavelengths is refracted by a slightly different
 * amount, so wherever the glass bends the image it splits into thin spectral fringes,
 * the same physics as the stills. Grey stays grey; colour appears only at the bends.
 *
 * Usage:
 *   import { mountPrismField } from './prism-field.js'
 *   const field = await mountPrismField(canvas, { src: 'hero/prism@2x.webp' })
 *   field.pulse(x, y)   // echo ring from a point, 0..1 canvas coords (y up)
 *   field.destroy()
 * Options: src, lensRadius (.11), lensPower (1), dispersion (.22), focusX/focusY (cover crop
 * focus, default .7/.4), maxDpr (1.5), autoPulse (true).
 * Pauses off-screen; with prefers-reduced-motion it draws the still once and ignores the pointer.
 */
const VERT = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*.5+.5; gl_Position = vec4(p,0.,1.); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D img; uniform vec2 res; uniform vec2 imgSize; uniform vec2 focus;
uniform float t; uniform vec2 lens; uniform float lensA; uniform float lensR;
uniform vec4 pulses[4]; uniform float disp;

// gradient of the glass height field (analytic), in screen-uv units
vec2 grad(vec2 q){
  float asp = res.x/res.y;
  vec2 g = vec2(0.);
  // pointer lens: a smooth dome
  { vec2 d = (q-lens)*vec2(asp,1.); float s = lensR; float e = exp(-dot(d,d)/(2.*s*s)); g += -lensA*e*d/(s*s); }
  // echo rings travelling outward
  for(int i=0;i<4;i++){
    vec4 P = pulses[i]; if(P.w <= 0.) continue;
    vec2 d = (q-P.xy)*vec2(asp,1.); float r = length(d)+1e-4;
    float age = t-P.z; float front = age*.42;
    float env = exp(-pow((r-front)/.06,2.)) * exp(-age*.9) * P.w;
    g += .5*cos(r*60.-age*6.)*env * (d/r);
  }
  // the glass breathes: two very slow, very shallow swells
  g += .08*vec2(sin(q.y*5.+t*.35), cos(q.x*4.-t*.27));
  return g;
}
vec3 spec(float l){
  float x = 1.056*exp(-.5*pow((l-599.8)/(l<599.8?37.9:31.),2.)) + .362*exp(-.5*pow((l-442.)/(l<442.?16.:26.7),2.)) - .065*exp(-.5*pow((l-501.1)/(l<501.1?20.4:26.2),2.));
  float y = .821*exp(-.5*pow((l-568.8)/(l<568.8?46.9:40.5),2.)) + .286*exp(-.5*pow((l-530.9)/(l<530.9?16.3:31.1),2.));
  float z = 1.217*exp(-.5*pow((l-437.)/(l<437.?11.8:36.),2.)) + .681*exp(-.5*pow((l-459.)/(l<459.?26.:13.8),2.));
  return max(mat3(3.2406,-.9689,.0557, -1.5372,1.8758,-.2040, -.4986,.0415,1.0570) * vec3(x,y,z), vec3(0.));
}
vec2 cover(vec2 q){ // object-fit: cover with a focus point
  float ra = res.x/res.y, ia = imgSize.x/imgSize.y;
  vec2 s = ra > ia ? vec2(1., ia/ra) : vec2(ra/ia, 1.);
  vec2 off = (1.-s)*vec2(focus.x, focus.y);
  return vec2(q.x, 1.-q.y)*s + off;
}
void main(){
  vec2 g = grad(uv);
  float asp = res.x/res.y;
  vec3 col = vec3(0.), w = vec3(0.);
  for(int i=0;i<7;i++){
    float l = 410. + float(i)*45.;
    float k = .035*(1. + disp*(550.-l)/100.);
    vec3 sp = spec(l);
    vec3 c = texture(img, cover(uv - k*g*vec2(1./asp,1.))).rgb;
    col += c*sp; w += sp;
  }
  col /= w;
  // light gathers where the glass converges: brighten inside the lens, darken its rim
  float lap = 0.;
  { vec2 d = (uv-lens)*vec2(asp,1.); float s = lensR; float r2 = dot(d,d)/(s*s); lap = lensA/(s*s)*(2.-r2)*exp(-r2*.5); }
  col *= 1. + clamp(lap*.05, -.25, .5);
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)) + t)*43758.5453);
  o = vec4(col + (n-.5)*.01, 1.);
}`;

export async function mountPrismField(canvas, opts = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { canvas.dataset.fallback = 'no-webgl2'; return { pulse() {}, destroy() {} }; }
  const o = Object.assign({ lensRadius: .11, lensPower: 1, dispersion: .22, focusX: .7, focusY: .4, maxDpr: 1.5, autoPulse: true }, opts);
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['img', 'res', 'imgSize', 'focus', 't', 'lens', 'lensA', 'lensR', 'pulses', 'disp']) U[n] = gl.getUniformLocation(prog, n);

  // texture
  const im = new Image(); im.decoding = 'async'; im.crossOrigin = 'anonymous';
  im.src = String(o.src ?? new URL('../hero/prism.webp', import.meta.url));
  await im.decode();
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(U.img, 0);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lens = { x: .68, y: .55, vx: 0, vy: 0, tx: .68, ty: .55, a: opts.restingLens ?? 0, va: 0, ta: opts.restingLens ?? 0 };
  const pulses = new Float32Array(16); let pi = 0;
  const t0 = performance.now(); const now = () => (performance.now() - t0) / 1000;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, o.maxDpr);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h); if (reduce) draw(0);
  }
  const toLocal = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; };
  const onMove = e => { const [x, y] = toLocal(e); lens.tx = x; lens.ty = y; lens.ta = .18 * o.lensPower; kick(); };
  const onLeave = () => { lens.ta = opts.restingLens ?? 0; kick(); };
  const onDown = e => { const [x, y] = toLocal(e); api.pulse(x, y); };
  if (!reduce) { canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave); canvas.addEventListener('pointerdown', onDown); }

  function draw(t) {
    gl.uniform2f(U.res, canvas.width, canvas.height); gl.uniform2f(U.imgSize, im.naturalWidth, im.naturalHeight);
    gl.uniform2f(U.focus, o.focusX, o.focusY); gl.uniform1f(U.t, t);
    gl.uniform2f(U.lens, lens.x, lens.y); gl.uniform1f(U.lensA, lens.a); gl.uniform1f(U.lensR, o.lensRadius);
    gl.uniform4fv(U.pulses, pulses); gl.uniform1f(U.disp, o.dispersion);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  let raf = 0, last = now(), visible = true;
  function kick() { if (!raf && visible && !reduce) { last = now(); raf = requestAnimationFrame(frame); } }
  function frame() {
    raf = 0; if (!visible) return;
    const t = now(), dt = Math.min(.05, t - last); last = t;
    const k = 90, c = 16; // springs
    lens.vx += ((lens.tx - lens.x) * k - lens.vx * c) * dt; lens.x += lens.vx * dt;
    lens.vy += ((lens.ty - lens.y) * k - lens.vy * c) * dt; lens.y += lens.vy * dt;
    lens.va += ((lens.ta - lens.a) * 60 - lens.va * 11) * dt; lens.a += lens.va * dt;
    draw(t); raf = requestAnimationFrame(frame);
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick(); }); io.observe(canvas);
  const api = {
    pulse(x = .7, y = .55) { const i = (pi++ % 4) * 4; pulses[i] = x; pulses[i + 1] = y; pulses[i + 2] = now(); pulses[i + 3] = 1; kick(); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); gl.deleteTexture(tex);
      canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave); canvas.removeEventListener('pointerdown', onDown); }
  };
  if (reduce) draw(0); else { kick(); if (o.autoPulse) setTimeout(() => api.pulse(.72, .58), 300); }
  return api;
}
