// Sky Dial: the live hero for design 71 "Winter Pavilion".
// A dependency-free WebGL2 compositor for the matte-painting layers. Drag the sun up and down
// the sky (or use the arrow keys): the sky palette, the relighting of the photographed
// mountains and snow, the pavilion's windows and its rooftop sign all follow the sun height.
// Below the horizon it becomes night, and the module tells the page to switch theme.
//
// usage:
//   import { createSkyDial } from './sky-dial.js'
//   const dial = await createSkyDial(canvas, { base: './layers/', scene: 'pavilion', h: -0.06 })
//   canvas.addEventListener('skydial:change', e => e.detail) // { h, theme: 'day' | 'night' }
//   dial.set(0.2, { animate: true }); dial.parallax(0..1 scroll progress); dial.destroy()
//
// The same model is implemented in Python (src/compose.py) to bake the stills, so the
// static first paint and the live canvas match when the canvas fades in.

const VERT = `#version 300 es
in vec2 p; out vec2 vUv;
void main(){ vUv = p * 0.5 + 0.5; vUv.y = 1.0 - vUv.y; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uFar, uSnow, uBld, uGlow;
uniform float uH, uSunX, uCanvasAspect, uTime, uScroll;
uniform vec2 uPointer;
const float IMG_ASPECT = 16.0 / 9.0;
const float MIN_ASPECT = 0.82;

float ss(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
vec3 hex(float r, float g, float b){ return vec3(r, g, b) / 255.0; }
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

// cover-fit the 16:9 plate into the canvas, anchored so the building stays centred
vec2 plate(vec2 uv, float depth){
  vec2 q = uv;
  if (uCanvasAspect > IMG_ASPECT) { float s = IMG_ASPECT / uCanvasAspect; q.y = (q.y - 0.6) * s + 0.6; }
  else if (uCanvasAspect >= MIN_ASPECT) { float s = uCanvasAspect / IMG_ASPECT; q.x = (q.x - 0.5) * s + 0.5; }
  else {
    // phones: keep the whole building in frame, anchor the plate to the bottom and let the
    // procedural sky continue above it (every layer is transparent along its top edge)
    q.x = (q.x - 0.5) * (MIN_ASPECT / IMG_ASPECT) + 0.5;
    q.y = 1.0 - (1.0 - q.y) * (MIN_ASPECT / uCanvasAspect);
  }
  // slow cinematic parallax: deeper layers move less (scroll + a whisper of pointer)
  q += vec2(uPointer.x * 0.006, uPointer.y * 0.004) * depth;
  q.y += uScroll * 0.10 * depth;
  q = (q - vec2(0.5, 0.6)) * 0.97 + vec2(0.5, 0.6);  // 3% overscan hides the edges
  return q;
}

void main(){
  float h = uH;
  float day = ss(0.05, 0.6, h);
  float dusk = 1.0 - ss(-0.25, 0.1, h);
  float deep = ss(-0.05, -0.5, h);
  float night = 1.0 - ss(-0.35, -0.05, h);
  vec3 top = mix(mix(hex(157.,185.,226.), hex(134.,180.,228.), day), mix(hex(76.,92.,149.), hex(14.,22.,48.), deep), dusk);
  vec3 hor = mix(mix(hex(248.,199.,190.), hex(243.,211.,211.), day), mix(hex(238.,157.,174.), hex(42.,56.,102.), deep), dusk);

  vec2 uvSky = plate(vUv, 0.15);
  float y = uvSky.y;
  vec3 col = mix(top, hor, pow(ss(0.0, 0.62, y), 1.4));

  // sun
  float sy = 0.62 - 0.5 * h;
  vec2 dv = vec2((uvSky.x - uSunX) * IMG_ASPECT, uvSky.y - sy);
  float d = length(dv);
  float vis = ss(-0.12, 0.05, h);
  col += vis * (mix(hex(255.,227.,176.), hex(255.,248.,234.), day) * (1.0 - ss(0.026, 0.03, d)) * 0.9
              + hex(255.,200.,168.) * exp(-d / 0.09) * 0.45 + hex(255.,178.,190.) * exp(-d / 0.35) * 0.18);

  // stars + moon
  if (night > 0.0) {
    vec2 g = uvSky * vec2(420.0, 236.0);
    float n = hash(floor(g));
    float star = step(0.9965, n) * ss(0.65, 0.0, y) * (0.6 + 0.4 * sin(uTime * 1.3 + n * 40.0));
    vec2 f = fract(g) - 0.5; star *= ss(0.5, 0.0, length(f) * 1.6);
    col += night * star * hex(255.,244.,240.) * 1.4;
    float md = length(vec2((uvSky.x - (1.0 - uSunX)) * IMG_ASPECT, uvSky.y - 0.2));
    col += night * (hex(246.,241.,230.) * (1.0 - ss(0.018, 0.021, md)) + hex(159.,179.,230.) * exp(-md / 0.08) * 0.25);
  }

  vec3 warm = mix(vec3(1.0), hex(255.,231.,218.), 1.0 - day);
  float pinkAmt = (1.0 - ss(-0.05, 0.12, h)) * (1.0 - night);
  vec3 nightTint = hex(59.,74.,134.) * 1.25;

  // far mountains / hills
  vec4 far = texture(uFar, plate(vUv, 0.35));
  vec3 fc = far.rgb * warm;
  fc = mix(fc, fc * hex(199.,154.,192.) * 1.25, pinkAmt);
  fc = mix(fc, (vec3(dot(fc, vec3(0.333))) * 0.6 + fc * 0.4) * nightTint + hex(20.,28.,58.) * 0.4, night);
  fc = mix(fc, hor, 0.18 + 0.25 * night);
  col = mix(col, fc, far.a);

  // snow
  vec2 suv = plate(vUv, 0.7);
  vec4 sn = texture(uSnow, suv);
  vec3 sc = sn.rgb * warm;
  sc = mix(sc, sc * hex(199.,154.,192.) * 1.25, pinkAmt);
  sc = mix(sc, (vec3(dot(sc, vec3(0.333))) * 0.6 + sc * 0.4) * nightTint + hex(20.,28.,58.) * 0.4, night);
  // glints: a few snow crystals catch the low sun
  float gl = step(0.9994, hash(floor(suv * vec2(1400.0, 788.0)) + floor(uTime * 0.5))) * (1.0 - night) * ss(0.0, 0.1, suv.y - 0.68);
  sc += gl * 0.22;
  col = mix(col, sc, sn.a);

  // building
  vec2 buv = plate(vUv, 0.75);
  vec4 b = texture(uBld, buv);
  vec3 bc = b.rgb * warm;
  bc = mix(bc, bc * hex(199.,154.,192.) * 1.25, pinkAmt * 0.45);
  bc = mix(bc, (vec3(dot(bc, vec3(0.333))) * 0.6 + bc * 0.4) * nightTint + hex(20.,28.,58.) * 0.4, night);
  col = mix(col, bc, b.a);

  // windows, lamps and the rooftop sign wake up as the sun goes down; mip levels give a cheap bloom
  float glow = 1.0 - ss(-0.15, 0.12, h);
  if (glow > 0.0) {
    vec3 g0 = max(texture(uGlow, buv).rgb, textureLod(uGlow, buv, 1.2).rgb * 1.35); // fills thin strokes
    vec3 g1 = textureLod(uGlow, buv, 3.5).rgb;
    vec3 g2 = textureLod(uGlow, buv, 5.5).rgb;
    vec3 pool = textureLod(uGlow, buv - vec2(0.0, 0.06), 6.0).rgb * vec3(1.0, 0.75, 0.6) * sn.a * (1.0 - b.a);
    vec3 tint = vec3(1.0, 0.86, 0.72);
    col = mix(col, min(g0 * 1.25, vec3(1.0)) * tint + 0.08, clamp(dot(g0, vec3(0.333)) * 1.6 * glow, 0.0, 1.0));
    col += ((g1 * 1.2 + g2 * 1.4) * tint * 0.95 + pool * 3.0) * glow;
  }

  // vignette + film grain
  vec2 v = (vUv - vec2(0.5, 0.55)) * vec2(1.3, 1.6);
  col *= 1.0 - 0.18 * dot(v, v);
  col += (hash(vUv * 1000.0 + fract(uTime)) - 0.5) * 0.03;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

export async function createSkyDial(canvas, opts = {}) {
  const { base = './layers/', scene = 'pavilion', sunX = scene === 'station' ? 0.16 : 0.8 } = opts;
  let h = opts.h ?? -0.06;
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, alpha: false });
  if (!gl) throw new Error('webgl2 unavailable');
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const names = ['Far', 'Snow', 'Bld', 'Glow'];
  const files = [`${scene}-far.webp`, `${scene}-snow.webp`, `${scene}-building.webp`, `${scene}-glow.jpg`];
  const imgs = await Promise.all(files.map(f => loadImage(base + f)));
  imgs.forEach((img, i) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(prog, 'u' + names[i]), i);
  });
  const U = n => gl.getUniformLocation(prog, n);
  const uH = U('uH'), uSunX = U('uSunX'), uAsp = U('uCanvasAspect'), uTime = U('uTime'), uScroll = U('uScroll'), uPtr = U('uPointer');
  gl.uniform1f(uSunX, sunX);

  let scroll = 0, ptr = [0, 0], ptrT = [0, 0], raf = 0, dragging = false, anim = null, theme = null, alive = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    const w = Math.round(canvas.clientWidth * dpr), hh = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(uAsp, canvas.width / canvas.height);
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  function emit() {
    const t = h < -0.08 ? 'night' : 'day';
    canvas.setAttribute('aria-valuenow', h.toFixed(2));
    canvas.setAttribute('aria-valuetext', t === 'night' ? 'Night' : h < 0.05 ? 'Pink hour' : 'Low winter sun');
    canvas.dispatchEvent(new CustomEvent('skydial:change', { bubbles: true, detail: { h, theme: t, themeChanged: t !== theme } }));
    theme = t;
  }

  const t0 = performance.now();
  function frame(now) {
    if (!alive) return;
    if (anim) {
      const k = Math.min(1, (now - anim.t0) / anim.dur), e = 1 - Math.pow(1 - k, 3);
      h = anim.from + (anim.to - anim.from) * e; emit();
      if (k >= 1) anim = null;
    }
    ptr[0] += (ptrT[0] - ptr[0]) * 0.04; ptr[1] += (ptrT[1] - ptr[1]) * 0.04;
    gl.uniform1f(uH, h); gl.uniform1f(uTime, reduce ? 0 : (now - t0) / 1000);
    gl.uniform1f(uScroll, scroll); gl.uniform2f(uPtr, ptr[0], ptr[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // interaction: drag anywhere on the sky to move the sun; keys for accessibility
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'slider');
  canvas.setAttribute('aria-label', 'Sun height. Drag the sun, or use the arrow keys.');
  canvas.setAttribute('aria-valuemin', '-0.8'); canvas.setAttribute('aria-valuemax', '0.7');
  const toH = ev => {
    const r = canvas.getBoundingClientRect();
    // invert the cover-fit for y
    let v = (ev.clientY - r.top) / r.height; const asp = r.width / r.height;
    if (asp > 16 / 9) v = (v - 0.6) * (16 / 9) / asp + 0.6;
    else if (asp < 0.82) v = 1 - (1 - v) * (0.82 / asp);
    return Math.max(-0.8, Math.min(0.7, (0.62 - v) / 0.5));
  };
  const down = ev => { dragging = true; anim = null; canvas.setPointerCapture?.(ev.pointerId); h = toH(ev); emit(); canvas.style.cursor = 'grabbing'; };
  const move = ev => {
    const r = canvas.getBoundingClientRect();
    ptrT = [((ev.clientX - r.left) / r.width - 0.5) * 2, ((ev.clientY - r.top) / r.height - 0.5) * 2];
    if (dragging) { h = toH(ev); emit(); }
  };
  const up = () => { dragging = false; canvas.style.cursor = 'grab'; };
  const key = ev => {
    const step = ev.shiftKey ? 0.2 : 0.05;
    if (ev.key === 'ArrowUp' || ev.key === 'ArrowRight') { set(h + step, { animate: true, dur: 400 }); ev.preventDefault(); }
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowLeft') { set(h - step, { animate: true, dur: 400 }); ev.preventDefault(); }
  };
  canvas.style.cursor = 'grab'; canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up);
  canvas.addEventListener('keydown', key);

  function set(v, { animate = false, dur = 1600 } = {}) {
    v = Math.max(-0.8, Math.min(0.7, v));
    if (animate && !reduce) anim = { from: h, to: v, t0: performance.now(), dur }; else { h = v; anim = null; emit(); }
  }
  emit();
  return {
    set, get h() { return h; },
    parallax(p) { scroll = Math.max(0, Math.min(1, p)); },
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('pointermove', move); removeEventListener('pointerup', up); },
  };
}
