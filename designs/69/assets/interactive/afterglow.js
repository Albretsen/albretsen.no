// Afterglow dissolve: a WebGL cross-dissolve between photographs where the darks give way first
// and the brightest parts of the outgoing frame linger, the way a sky keeps burning after the sun
// has gone. Includes live film grain and the hidden green flash.
//
//   import { createAfterglow } from './afterglow.js'
//   const ag = createAfterglow(canvas, [
//     { src: 'hero/cliffs-1600.webp', horizon: 0.449, sunX: 0.86 },
//     { src: 'hero/towers-1600.webp', horizon: 1.02,  sunX: 0.95 },
//   ], { hold: 6000, fade: 2600 })
//   ag.go(1)             // dissolve to frame 1
//   ag.greenFlash()      // the easter egg (also fires on its own, see below)
//   ag.destroy()
//
// Easter egg: rest the pointer on the horizon line for two seconds (or type "flash").
// A thin mint line blooms along the horizon for ~1.4s: the green flash, the last colour
// the atmosphere lets through after the sun has set. It is never announced on the page.
// No dependencies. Falls back to a CSS opacity dissolve if WebGL is unavailable.

const VERT = `attribute vec2 p; varying vec2 uv; void main(){ uv = p*0.5+0.5; uv.y = 1.0-uv.y; gl_Position = vec4(p,0.,1.); }`
const FRAG = `precision highp float;
varying vec2 uv;
uniform sampler2D a, b;
uniform vec2 res, sa, sb;      // canvas size, image sizes
uniform float t, time, flash, horizon, sunX, grain;
vec2 cover(vec2 uv, vec2 img){            // object-fit: cover
  float rc = res.x/res.y, ri = img.x/img.y;
  vec2 s = rc > ri ? vec2(1., ri/rc) : vec2(rc/ri, 1.);
  return (uv-0.5)*s+0.5;
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
float lum(vec3 c){ return dot(c, vec3(.2126,.7152,.0722)); }
void main(){
  vec3 ca = texture2D(a, cover(uv, sa)).rgb;
  vec3 cb = texture2D(b, cover(uv, sb)).rgb;
  // luminance-ordered dissolve: dark pixels of A leave first, highlights linger
  float la = lum(ca);
  float edge = t*1.35 - 0.175;
  float k = smoothstep(edge - 0.18, edge + 0.18, 1.0 - la + (hash(uv*res)-.5)*0.06);
  k = mix(k, 1.0, smoothstep(0.85, 1.0, t));
  vec3 c = mix(ca, cb, 1.0 - k);
  // a breath of extra warmth while the frames overlap
  c += vec3(0.06, 0.03, 0.0) * sin(3.14159*t);
  // green flash along the horizon of the current frame
  if (flash > 0.0){
    float d = abs(uv.y - horizon);
    float line = exp(-d*d*90000.0) + 0.35*exp(-d*d*4000.0);
    float span = exp(-pow((uv.x - sunX)/0.10, 2.0));
    c = mix(c, vec3(0.42, 1.0, 0.72), clamp(line * span * flash, 0.0, 1.0) * 0.85);
  }
  // film grain, strongest in the mids
  float g = hash(uv*res + fract(time)*91.7) - 0.5;
  c += g * grain * (0.6 + 0.4*(1.0 - abs(lum(c)-0.5)*2.0));
  gl_FragColor = vec4(c, 1.0);
}`

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src })
}

export function createAfterglow(canvas, frames, { hold = 6500, fade = 2800, grain = 0.028, autoplay = true } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false })
  if (!gl) return fallback(canvas, frames, { hold, fade })
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s }
  const pr = gl.createProgram()
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr); gl.useProgram(pr)
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const U = n => gl.getUniformLocation(pr, n)
  const tex = frames.map(() => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([240, 200, 200, 255]))
    ;[gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); return t
  })
  const sizes = frames.map(() => [1, 1])
  const ready = frames.map((f, i) => loadImage(f.src).then(img => {
    gl.bindTexture(gl.TEXTURE_2D, tex[i]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    sizes[i] = [img.naturalWidth, img.naturalHeight]; draw()
  }))
  gl.uniform1i(U('a'), 0); gl.uniform1i(U('b'), 1)

  let cur = 0, next = 0, t0 = 0, fading = false, flash = 0, flashT0 = 0, raf = 0, timer = 0, dead = false
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h) }
  }
  function draw(now = performance.now()) {
    if (dead) return
    resize()
    let t = 0
    if (fading) { t = Math.min(1, (now - t0) / fade); if (t >= 1) { fading = false; cur = next; t = 0 } }
    if (flash) { const ft = (now - flashT0) / 1400; flash = ft >= 1 ? 0 : Math.sin(Math.PI * ft) ** 2 }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur])
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[fading ? next : cur])
    gl.uniform2f(U('res'), canvas.width, canvas.height)
    gl.uniform2f(U('sa'), ...sizes[cur]); gl.uniform2f(U('sb'), ...sizes[fading ? next : cur])
    gl.uniform1f(U('t'), t); gl.uniform1f(U('time'), reduce ? 0 : now / 1000)
    gl.uniform1f(U('flash'), flash); gl.uniform1f(U('grain'), grain)
    gl.uniform1f(U('horizon'), frames[cur].horizon ?? 0.5); gl.uniform1f(U('sunX'), frames[cur].sunX ?? 0.5)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    // keep animating while something moves; grain alone runs at a gentle 24fps
    if (fading || flash) raf = requestAnimationFrame(draw)
    else if (!reduce) { clearTimeout(raf); raf = setTimeout(() => requestAnimationFrame(draw), 1000 / 24) }
  }
  function go(i) {
    if (i === cur || fading) return
    next = (i + frames.length) % frames.length; t0 = performance.now()
    fading = !reduce; if (reduce) cur = next
    cancelAnimationFrame(raf); clearTimeout(raf); requestAnimationFrame(draw)
  }
  function greenFlash() { flashT0 = performance.now(); flash = 0.001; cancelAnimationFrame(raf); clearTimeout(raf); requestAnimationFrame(draw) }
  const loop = () => { timer = setTimeout(() => { go(cur + 1); loop() }, hold + fade) }
  if (autoplay && !reduce && frames.length > 1) loop()

  // --- hidden: rest on the horizon, or type "flash" ---
  let dwell = 0, typed = ''
  const onMove = (e) => {
    const b = canvas.getBoundingClientRect()
    const y = (e.clientY - b.top) / b.height, h = frames[cur].horizon ?? 0.5
    clearTimeout(dwell)
    if (Math.abs(y - h) < 0.02) dwell = setTimeout(greenFlash, 2000)
  }
  const onKey = (e) => { typed = (typed + (e.key || '')).slice(-5).toLowerCase(); if (typed === 'flash') greenFlash() }
  canvas.addEventListener('pointermove', onMove); addEventListener('keydown', onKey)
  addEventListener('resize', () => requestAnimationFrame(draw))
  requestAnimationFrame(draw)
  return {
    go, greenFlash, ready: Promise.all(ready), get index() { return cur },
    destroy() { dead = true; clearTimeout(timer); clearTimeout(dwell); canvas.removeEventListener('pointermove', onMove); removeEventListener('keydown', onKey) },
  }
}

function fallback(canvas, frames, { hold, fade }) {
  // Plain stacked <img> cross-fade for browsers without WebGL.
  const wrap = canvas.parentElement
  const imgs = frames.map((f, i) => Object.assign(document.createElement('img'), {
    src: f.src, alt: '', style: `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity ${fade}ms ease;opacity:${i ? 0 : 1}` }))
  imgs.forEach(i => wrap.appendChild(i)); canvas.remove()
  let cur = 0
  const go = (i) => { imgs[cur].style.opacity = 0; cur = (i + imgs.length) % imgs.length; imgs[cur].style.opacity = 1 }
  const timer = setInterval(() => go(cur + 1), hold + fade)
  return { go, greenFlash() {}, ready: Promise.resolve(), get index() { return cur }, destroy() { clearInterval(timer) } }
}
