// Sunline: relights one real photograph (a fjord before sunrise) in WebGL.
// - `sun`   0..1  the sun climbs out of the sea, cold blue turns gold (drive it with scroll)
// - `sunX`  0..1  the sun's position along the horizon; its glitter path on the water follows
// - `night` 0..1  the day/night theme: the sky deepens, the moon brightens, coast lights come on
// A sky/water mask (R = sky, G = water) keeps every effect where light would really fall.
// No dependencies, WebGL1, ~6 KB. Renders only while on screen; honours prefers-reduced-motion.
//
//   import { mountSunline } from './sunline.js'
//   const s = await mountSunline(canvas, { src: 'first-light-tex.jpg', mask: 'first-light-mask.png' })
//   s.set({ sun: 0.6 }); s.tween({ night: 1 }, 1600); s.destroy()

const VERT = `attribute vec2 p; varying vec2 vUv;
void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `precision highp float;
varying vec2 vUv;
uniform sampler2D uImg, uMask;
uniform vec2 uRes, uImgSize, uFocus, uMoon;
uniform float uSun, uSunX, uNight, uTime, uHorizon, uGrain;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main(){
  // object-fit: cover with a focus point
  float sa = uRes.x / uRes.y, ia = uImgSize.x / uImgSize.y;
  vec2 sc = sa > ia ? vec2(1.0, ia / sa) : vec2(sa / ia, 1.0);
  vec2 uv = vUv * sc + (1.0 - sc) * uFocus;
  vec2 p = vec2(uv.x, 1.0 - uv.y);               // image space, y down
  vec3 base = texture2D(uImg, uv).rgb;
  vec3 m = texture2D(uMask, uv).rgb;
  float water = m.g;
  // bright pixels above the horizon are sky too (the mask is conservative around clouds)
  float sky = max(m.r, smoothstep(0.22, 0.4, luma(base)) * step(p.y, uHorizon) * (1.0 - water));
  float land = clamp(1.0 - sky - water, 0.0, 1.0);

  float sun = uSun;
  vec2 sunP = vec2(uSunX, uHorizon + 0.035 - sun * 0.28);
  vec2 asp = vec2(ia, 1.0);
  float d = length((p - sunP) * asp);
  float e = clamp((uHorizon - p.y) / uHorizon, 0.0, 1.0);    // elevation above horizon
  float below = max(p.y - uHorizon, 0.0);

  // palette
  vec3 gold = vec3(0.98, 0.76, 0.45), poppy = vec3(0.93, 0.42, 0.20), peach = vec3(0.99, 0.86, 0.72);
  vec3 skyLo = vec3(0.66, 0.80, 0.91), skyHi = vec3(0.22, 0.45, 0.74), cream = vec3(1.0, 0.96, 0.86);

  // morning sky: a slow gradient that warms from the horizon and lifts into clear blue
  float rise = smoothstep(0.0, 1.0, sun);
  vec3 horizonCol = mix(poppy, gold, smoothstep(0.15, 0.7, sun));
  vec3 dayGrad = mix(horizonCol, peach, smoothstep(0.0, 0.10 + 0.2 * sun, e));
  dayGrad = mix(dayGrad, mix(skyLo, skyHi, smoothstep(0.25, 1.0, e)), smoothstep(0.06 + 0.1 * sun, 0.55, e));
  float glow = exp(-d * 5.0) * 0.6 + exp(-d * 24.0) * 0.45;
  vec3 skyCol = mix(base, dayGrad, rise * 0.88);
  skyCol += gold * glow * (0.25 + 0.45 * rise) * smoothstep(-0.05, 0.2, sun);
  // keep the photo's own detail (moon, faint stars) in the dawn
  skyCol = max(skyCol, base * (1.0 - rise));

  // the sun disc rises from behind the sea; the mask clips it at the horizon and the clouds
  // low sun is squashed a little and burns orange; higher it whitens
  float dd = length((p - sunP) * asp * vec2(1.0, mix(1.25, 1.0, rise)));
  float disc = smoothstep(0.019, 0.013, dd) * step(p.y, uHorizon + 0.002);
  vec3 discCol = mix(vec3(1.0, 0.86, 0.62), vec3(1.0, 0.97, 0.9), smoothstep(0.1, 0.8, sun));
  skyCol += discCol * (exp(-dd * 70.0) * 0.5 + exp(-dd * 30.0) * 0.3) * sky;
  skyCol = mix(skyCol, vec3(1.9, 1.8, 1.6), disc * sky);
  // soft shoulder so the sun's halo rolls off smoothly instead of clipping
  skyCol = skyCol / (1.0 + max(luma(skyCol) - 0.85, 0.0) * 0.9);

  // clouds and far ridges on the horizon catch a warm rim
  float nearH = smoothstep(0.12, 0.0, abs(p.y - uHorizon));
  vec3 landCol = base * mix(vec3(1.0), vec3(1.22, 1.04, 0.9), rise) * (1.0 + 0.18 * rise);
  landCol += poppy * glow * nearH * 0.9 * rise;
  // snow turns pink-gold
  float snow = smoothstep(0.35, 0.7, luma(base)) * step(uHorizon + 0.02, p.y);
  landCol = mix(landCol, landCol * vec3(1.12, 0.98, 0.9) + vec3(0.06, 0.03, 0.0), snow * rise);

  // water: reflect the warming sky, then a glitter path toward the viewer under the sun
  vec3 waterCol = mix(base, base * 0.55 + mix(gold, skyLo, 0.35) * 0.55, rise * 0.75);
  float dx = abs(p.x - sunP.x) * ia;
  float width = 0.012 + below * 0.55;
  float path = exp(-(dx * dx) / (width * width));
  float t = uTime * 0.6;
  float ripple = noise(vec2(p.x * 260.0, below * 2200.0 / (below * 6.0 + 0.4) - t * 3.0));
  ripple *= noise(vec2(p.x * 90.0 + t, below * 600.0));
  float spark = pow(ripple, 3.0) * 3.2 + 0.25;
  float glint = path * spark * smoothstep(-0.08, 0.25, sun) * (1.0 - smoothstep(0.0, 0.3, below));
  waterCol += mix(gold, cream, 0.4) * glint * 1.3;

  vec3 col = skyCol * sky + waterCol * water + landCol * land;

  // night: deepen, cool, wake the moon, bring up coast lights and a few stars
  vec3 nightTint = vec3(0.23, 0.33, 0.52);
  vec3 nightCol = base * nightTint * 1.05;
  float dm = length((p - uMoon) * asp);
  nightCol += vec3(0.75, 0.78, 0.86) * (exp(-dm * 18.0) * 0.35 + exp(-dm * 60.0) * 0.5) * sky;
  nightCol = max(nightCol, base * smoothstep(0.55, 0.9, luma(base)) * sky * smoothstep(0.06, 0.0, dm));  // the moon stays bright
  // sparse soft stars, denser and brighter higher up
  vec2 sp = p * vec2(ia, 1.0) * 110.0; vec2 sg = floor(sp); vec2 sf = fract(sp) - 0.5;
  float sh = hash(sg);
  vec2 so = vec2(hash(sg + 1.7), hash(sg + 4.3)) - 0.5;
  float sdot = smoothstep(0.12, 0.0, length(sf - so * 0.6)) * step(0.982, sh);
  float star = sdot * (0.45 + 0.55 * hash(sg + 9.0)) * (0.7 + 0.3 * sin(uTime * 1.3 + sh * 60.0));
  nightCol += vec3(0.88, 0.92, 1.0) * star * sky * smoothstep(0.12, 0.6, e) * 1.6;
  // warm windows along the far shore: a small town keeping the lights on
  float band = smoothstep(0.012, 0.0, abs(p.y - (uHorizon - 0.004))) * (1.0 - sky) * (1.0 - water);
  vec2 lg = floor(vec2(p.x * 520.0, p.y * 900.0));
  float town = smoothstep(0.55, 0.75, noise(vec2(p.x * 9.0, 3.0)));   // lights gather in a few villages
  float lamp = step(0.94, hash(lg + 7.0)) * band * town * (0.75 + 0.25 * sin(uTime * 0.8 + hash(lg) * 20.0));
  nightCol += vec3(1.0, 0.72, 0.38) * lamp * 1.6;
  // the lamps' reflections on the water
  float lr = step(0.94, hash(vec2(lg.x, floor((uHorizon - 0.004) * 900.0)) + 7.0)) * town;
  nightCol += vec3(1.0, 0.7, 0.4) * lr * water * exp(-below * 60.0) * 0.3 * step(0.5, noise(vec2(p.x * 300.0, below * 2400.0))) * noise(vec2(p.x * 400.0, below * 900.0 - t));
  col = mix(col, nightCol, uNight);

  // fine film grain so the gradients never band
  col += (hash(uv * uRes + fract(uTime) * 91.0) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}`;

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

export async function mountSunline(canvas, opts = {}) {
  const o = Object.assign({ horizon: 0.686, moon: [0.128, 0.117], focus: [0.5, 0.62], sun: 0, sunX: 0.5, night: 0, grain: 0.035, dpr: Math.min(window.devicePixelRatio || 1, 1.75) }, opts);
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: !!o.preserve });
  if (!gl) throw new Error('webgl unavailable');
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const [img, mask] = await Promise.all([loadImage(o.src), loadImage(o.mask)]);
  const tex = (im, unit) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  tex(img, 0); tex(mask, 1);
  gl.uniform1i(U('uImg'), 0); gl.uniform1i(U('uMask'), 1);
  gl.uniform2f(U('uImgSize'), img.naturalWidth, img.naturalHeight);
  gl.uniform2f(U('uFocus'), o.focus[0], o.focus[1]);
  gl.uniform2f(U('uMoon'), o.moon[0], o.moon[1]);
  gl.uniform1f(U('uHorizon'), o.horizon);
  gl.uniform1f(U('uGrain'), o.grain);

  const state = { sun: o.sun, sunX: o.sunX, night: o.night };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, visible = true, t0 = performance.now(), tweens = [];

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * o.dpr)), h = Math.max(1, Math.round(r.height * o.dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h); gl.uniform2f(U('uRes'), w, h);
  }
  function draw(now) {
    const tt = reduced ? 0 : (now - t0) / 1000;
    tweens = tweens.filter(tw => { const k = Math.min(1, (now - tw.start) / tw.dur); const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      for (const key in tw.to) state[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * e; if (k === 1 && tw.done) tw.done(); return k < 1; });
    gl.uniform1f(U('uSun'), state.sun); gl.uniform1f(U('uSunX'), state.sunX); gl.uniform1f(U('uNight'), state.night); gl.uniform1f(U('uTime'), tt);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function loop(now) { raf = 0; resize(); draw(now); if (visible && (!reduced || tweens.length)) raf = requestAnimationFrame(loop); }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const ro = new ResizeObserver(kick); ro.observe(canvas);
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); }); io.observe(canvas);
  resize(); draw(performance.now()); kick();

  return {
    state,
    set(v) { Object.assign(state, v); kick(); },
    tween(to, dur = 1200) { return new Promise(done => { tweens.push({ from: { ...state }, to, dur, start: performance.now(), done }); kick(); }); },
    // where the sun and moon sit in CSS pixels, for placing hit targets over the photograph
    project(px, py) {
      const r = canvas.getBoundingClientRect(), sa = r.width / r.height, ia = img.naturalWidth / img.naturalHeight;
      const sc = sa > ia ? [1, ia / sa] : [sa / ia, 1];
      const ux = (px - (1 - sc[0]) * o.focus[0]) / sc[0], uy = ((1 - py) - (1 - sc[1]) * o.focus[1]) / sc[1];
      return { x: ux * r.width, y: (1 - uy) * r.height };
    },
    sunPoint() { return this.project(state.sunX, o.horizon + 0.035 - state.sun * 0.28); },
    moonPoint() { return this.project(o.moon[0], o.moon[1]); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}
