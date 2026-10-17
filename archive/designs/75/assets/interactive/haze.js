// Front Light: heat-haze sky (design 75)
// A dependency-free WebGL1 module (~3 KB). It draws a graded photograph into a canvas and
// lets the air above the horizon shimmer, as it does over warm rock at golden hour.
// The shimmer is strongest in a band around the horizon and near the sun, and the sun's
// bloom breathes slowly. The pointer nudges the sun a few pixels (parallax, not a toy).
//
// Usage:
//   import { mountHaze } from './interactive/haze.js'
//   const haze = mountHaze(canvasEl, {
//     src: 'assets/hero/fjord-1600.webp',  // the full graded image (sky + land)
//     sun: [0.466, 0.447],                   // sun position in image UV (0..1, top-left origin)
//     horizon: 0.70,                         // waterline in image UV (haze fades below it)
//     strength: 1,                           // 0..2
//   })
//   haze.destroy()
//
// Put the cut-out layer (hero/fjord-front-*.webp) ABOVE the canvas and your type between them:
// the name then sits behind the cliffs while the sky shimmers behind the name.
// The canvas uses object-fit: cover maths, so size it like the <img> it replaces.
// Honors prefers-reduced-motion (renders one still frame) and pauses offscreen.

const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; v.y = 1. - v.y; gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `precision mediump float;
varying vec2 v;
uniform sampler2D img;
uniform vec2 res, imgSize, sun, ptr;
uniform float t, horizon, strength;

// cheap value noise
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }

vec2 cover(vec2 uv){ // object-fit: cover
  float ra = res.x / res.y, ia = imgSize.x / imgSize.y;
  vec2 s = ra > ia ? vec2(1., ia / ra) : vec2(ra / ia, 1.);
  return (uv - .5) * s + .5;
}

void main(){
  vec2 uv = cover(v);
  vec2 sp = sun + ptr * .006;
  // haze mask: a band above the horizon plus a halo around the sun
  float band = smoothstep(horizon - .34, horizon - .04, uv.y) * (1. - smoothstep(horizon - .01, horizon + .05, uv.y));
  float halo = exp(-pow(distance(uv * vec2(1.4, 1.), sp * vec2(1.4, 1.)) / .16, 2.));
  float m = clamp(band * .7 + halo, 0., 1.) * strength;
  // rising, wavering air: noise scrolls upward, stretched horizontally
  vec2 q = vec2(uv.x * 9., uv.y * 38. + t * 1.4);
  vec2 off = vec2(n(q) - .5, n(q + 7.3) - .5);
  off += .5 * vec2(n(q * 2.1 + 3.1) - .5, n(q * 2.3 - 1.7) - .5);
  vec2 d = uv + off * vec2(.0026, .0042) * m;
  vec3 c = texture2D(img, d).rgb;
  // breathing bloom
  float b = exp(-pow(distance(uv, sp) / .09, 2.)) * (.10 + .05 * sin(t * .55));
  c += b * vec3(1., .93, .78);
  gl_FragColor = vec4(c, 1.);
}`;

export function mountHaze(canvas, opts = {}) {
  const o = { sun: [0.466, 0.447], horizon: 0.70, strength: 1, ...opts };
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) return { destroy() {} };
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]
    .forEach(([k, val]) => gl.texParameteri(gl.TEXTURE_2D, k, val));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, visible = true, ready = false, ptr = [0, 0], tp = [0, 0];
  const start = performance.now();

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h); gl.uniform2f(U('res'), w, h);
  };
  const frame = now => {
    raf = 0; if (!ready) return;
    size();
    ptr[0] += (tp[0] - ptr[0]) * .05; ptr[1] += (tp[1] - ptr[1]) * .05;
    gl.uniform1f(U('t'), reduce ? 0 : (now - start) / 1000);
    gl.uniform2f(U('ptr'), ptr[0], ptr[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!reduce && visible) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const img = new Image(); img.decoding = 'async'; img.src = o.src;
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.uniform2f(U('imgSize'), img.naturalWidth, img.naturalHeight);
    gl.uniform2f(U('sun'), o.sun[0], o.sun[1]);
    gl.uniform1f(U('horizon'), o.horizon);
    gl.uniform1f(U('strength'), o.strength);
    gl.uniform1i(U('img'), 0);
    ready = true; canvas.dataset.ready = '1'; kick();
  };
  const onMove = e => { tp = [(e.clientX / innerWidth - .5) * 2, (e.clientY / innerHeight - .5) * 2]; };
  addEventListener('pointermove', onMove, { passive: true });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
  io.observe(canvas);
  const ro = new ResizeObserver(kick); ro.observe(canvas);
  return {
    destroy() { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); removeEventListener('pointermove', onMove); gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}
