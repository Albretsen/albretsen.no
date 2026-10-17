// Daylight — re-lights a painting through a whole day, live, in one WebGL fragment shader.
// It reuses the hero image the page already loaded (no extra download) and regrades it
// per frame: white balance, exposure, saturation, a sky-to-sea colour wash, a sun bloom
// that travels on an arc, and a faint shimmer on the water (pixels bluer than they are red).
//
//   import { createDaylight } from './daylight.js'
//   const day = createDaylight(canvas, { src: '../hero/calanque-morning-1600.avif' })
//   day.setTime(0.8)   // 0 dawn, .25 morning (the base grade), .5 noon, .75 golden, 1 dusk
//
// No WebGL? It returns null and the page keeps showing the plain <img>.
// prefers-reduced-motion: the shimmer stops; setTime still works.

const KEYS = [ // t, wb rgb, exposure, saturation, contrast, wash top, wash bottom, wash amount, glow colour, glow amount
  { t: 0.00, wb: [1.07, 0.94, 1.03], ex: 0.86, sa: 0.88, co: 0.00, top: '#F6A9B8', bot: '#C7B3E0', ws: 0.58, gc: '#FFD3C0', g: 0.55 },
  { t: 0.25, wb: [1.00, 1.00, 1.00], ex: 1.00, sa: 1.00, co: 0.00, top: '#BFE0F2', bot: '#FFD8CC', ws: 0.00, gc: '#FFF4E6', g: 0.20 },
  { t: 0.50, wb: [1.00, 1.00, 1.01], ex: 1.07, sa: 1.12, co: 0.07, top: '#9CCBEA', bot: '#FFF1D6', ws: 0.18, gc: '#FFFFFF', g: 0.15 },
  { t: 0.75, wb: [1.18, 1.00, 0.74], ex: 1.00, sa: 1.10, co: 0.06, top: '#F3C86E', bot: '#E9907A', ws: 0.45, gc: '#FFC66B', g: 0.60 },
  { t: 1.00, wb: [1.03, 0.84, 0.98], ex: 0.42, sa: 0.95, co: 0.05, top: '#E58FA0', bot: '#4A3A78', ws: 0.62, gc: '#FF9F8A', g: 0.55 },
]
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
const lerp = (a, b, k) => Array.isArray(a) ? a.map((v, i) => v + (b[i] - v) * k) : a + (b - a) * k

function paramsAt(t) {
  t = Math.min(1, Math.max(0, t))
  let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++
  const A = KEYS[i], B = KEYS[i + 1]; let k = (t - A.t) / (B.t - A.t); k = k * k * (3 - 2 * k)
  return {
    wb: lerp(A.wb, B.wb, k), ex: lerp(A.ex, B.ex, k), sa: lerp(A.sa, B.sa, k), co: lerp(A.co, B.co, k),
    top: lerp(hex(A.top), hex(B.top), k), bot: lerp(hex(A.bot), hex(B.bot), k), ws: lerp(A.ws, B.ws, k),
    gc: lerp(hex(A.gc), hex(B.gc), k), g: lerp(A.g, B.g, k),
  }
}

const VS = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`
const FS = `precision mediump float;
varying vec2 v;uniform sampler2D img;uniform vec2 res,ir;uniform float time,ex,sa,co,ws,g;
uniform vec3 wb,top,bot,gc;uniform vec2 sun;
vec3 toLin(vec3 c){return pow(c,vec3(2.2));}
vec3 toS(vec3 c){return pow(max(c,0.),vec3(1./2.2));}
vec3 soft(vec3 b,vec3 s){return mix(b-(1.-2.*s)*b*(1.-b), b+(2.*s-1.)*(sqrt(b)-b), step(.5,s));}
void main(){
  // cover-fit
  float ra=res.x/res.y, ri=ir.x/ir.y; vec2 uv=vec2(v.x,1.-v.y);
  if(ra>ri){float s=ri/ra; uv.y=uv.y*s+(1.-s)*.5;} else {float s=ra/ri; uv.x=uv.x*s+(1.-s)*.5;}
  vec3 c0=texture2D(img,uv).rgb;
  float water=smoothstep(.015,.10,c0.b-c0.r);
  vec2 d=vec2(sin(uv.y*620.+time*1.3)+.5*sin(uv.y*1430.-time*2.1), 0.)*.0011*water;
  vec3 c=texture2D(img,uv+d).rgb;
  vec3 l=toLin(c)*wb*ex; float L=dot(l,vec3(.2126,.7152,.0722));
  l=max(vec3(L)+(l-vec3(L))*sa,0.); c=toS(min(l,1.));
  c=mix(c,c*c*(3.-2.*c),co*2.);
  vec3 wash=mix(top,bot,uv.y); c=mix(c,soft(clamp(c,0.,1.),wash),ws);
  vec2 q=(uv-sun)*vec2(ra,1.); float glow=exp(-dot(q,q)/(.45*.45))*g;
  c=1.-(1.-c)*(1.-gc*glow*.6);
  // sun glints on the water nearest the sun's column
  float sp=water*pow(max(0.,sin(uv.x*900.+time*2.)*sin(uv.y*700.-time*1.4)),24.)*exp(-pow((uv.x-sun.x)*3.,2.))*g;
  c+=gc*sp*.8;
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}`

export function createDaylight(canvas, opts = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false })
  if (!gl) return null
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s }
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr)
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const U = n => gl.getUniformLocation(pr, n)
  const tex = gl.createTexture()
  let t = opts.time ?? 0.25, ready = false, raf = 0, visible = true, ir = [1, 1], t0 = performance.now()

  const img = new Image(); img.decoding = 'async'; img.src = opts.src
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v)
    ir = [img.naturalWidth, img.naturalHeight]; ready = true; canvas.dataset.ready = '1'; draw()
    canvas.dispatchEvent(new Event('daylight:ready'))
  }

  function resize() {
    const dpr = Math.min(1.5, devicePixelRatio || 1), r = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr))
    gl.viewport(0, 0, canvas.width, canvas.height); draw()
  }
  function draw(now = performance.now()) {
    if (!ready) return
    const P = paramsAt(t), a = Math.PI * (1 - t)
    gl.uniform2f(U('res'), canvas.width, canvas.height); gl.uniform2f(U('ir'), ir[0], ir[1])
    gl.uniform1f(U('time'), reduce ? 0 : (now - t0) / 1000)
    gl.uniform3fv(U('wb'), P.wb); gl.uniform1f(U('ex'), P.ex); gl.uniform1f(U('sa'), P.sa); gl.uniform1f(U('co'), P.co)
    gl.uniform3fv(U('top'), P.top); gl.uniform3fv(U('bot'), P.bot); gl.uniform1f(U('ws'), P.ws)
    gl.uniform3fv(U('gc'), P.gc); gl.uniform1f(U('g'), P.g)
    gl.uniform2f(U('sun'), 0.5 + Math.cos(a) * 0.42, 0.42 - Math.sin(a) * 0.38)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
  function loop(now) { draw(now); raf = visible && !reduce ? requestAnimationFrame(loop) : 0 }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && !reduce) raf = requestAnimationFrame(loop) })
  io.observe(canvas)
  const ro = new ResizeObserver(resize); ro.observe(canvas)
  return {
    setTime(v) { t = Math.min(1, Math.max(0, v)); if (!raf) draw() },
    get time() { return t },
    destroy() { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext() },
  }
}
