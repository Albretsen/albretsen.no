// mark-sdf.js: the Albretsen Selector mark as raymarched soft plastic.
// Self-contained (raw WebGL2, no dependencies, ~9 KB). Inflated signed-distance letterform,
// analytic studio lightformers (overhead softbox, magenta strip, ion strip), clearcoat + sheen,
// soft shadows, a blurred floor reflection and a glow pool. The mark leans toward the pointer.
//
//   import { mountMark } from './mark-sdf.js'
//   const m = mountMark(canvas, { scene: 'hero' | 'solo', dpr: 1.25, still: false, time: 0 })
//   m.setPointer(x, y)  // -1..1 (optional; it listens to pointermove on window by default)
//   m.destroy()

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 R; uniform float T; uniform vec2 M; uniform int SCENE; uniform float ALPHA;

const vec3 GLOW = vec3(0.863,0.227,0.925);   // #dc3aec oklch(0.66 0.27 324)
const vec3 GLOWHI = vec3(0.949,0.584,0.984); // #f295fb
const vec3 DEEP = vec3(0.525,0.067,0.573);   // #861192
const vec3 ION = vec3(0.212,0.863,0.925);    // #36dcec
const vec3 VOID = vec3(0.043,0.020,0.047);   // #0b050c
const vec3 STAGE = vec3(0.086,0.043,0.090);  // #160b17

vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

float sdPoly(vec2 p){
  // inner core of the mark (the 64-grid outline inset by the 0.17 inflation radius)
  vec2 v[6] = vec2[6](vec2(0.,0.5467), vec2(0.6458,-0.63), vec2(0.5322,-0.63), vec2(0.,0.3128), vec2(-0.5322,-0.63), vec2(-0.6458,-0.63));
  float d = dot(p-v[0],p-v[0]); float s = 1.;
  for(int i=0, j=5; i<6; j=i, i++){
    vec2 e = v[j]-v[i]; vec2 w = p-v[i];
    vec2 b = w - e*clamp(dot(w,e)/dot(e,e),0.,1.); d = min(d, dot(b,b));
    bvec3 c = bvec3(p.y>=v[i].y, p.y<v[j].y, e.x*w.y>e.y*w.x);
    if(all(c) || all(not(c))) s *= -1.;
  }
  return s*sqrt(d);
}
float sdMark(vec3 p){
  float ri = 0.17, h = 0.0;
  float d2 = sdPoly(p.xy);
  vec2 w = vec2(d2, abs(p.z) - h);
  return min(max(w.x,w.y),0.) + length(max(w,0.)) - ri;
}
float sdCapsule(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz)-t.x, p.y); return length(q)-t.y; }

float FLOOR = -1.22;
mat3 markRot; vec3 MP;
vec2 map(vec3 p){
  vec3 q = markRot * (p - MP);
  vec2 r = vec2(sdMark(q), 1.);
  float dot_ = length(q - vec3(0.,-0.617,0.)) - 0.185;
  if(dot_ < r.x) r = vec2(dot_, 2.);
  if(SCENE == 0){
    float b = sin(T*0.7)*0.06;
    float s = length(p - vec3(-0.9, 1.2+b, -1.6)) - 0.34; if(s < r.x) r = vec2(s, 3.);
    vec3 pc = p - vec3(-0.55, -0.98-b*0.5, 1.15); pc.xy *= rot(1.25); pc.yz *= rot(0.35);
    float c = sdCapsule(pc, vec3(0.,-0.34,0.), vec3(0.,0.34,0.), 0.22); if(c < r.x) r = vec2(c, 4.);
    vec3 pt = p - vec3(-2.6, -0.85+b*0.6, 0.4); pt.yz *= rot(1.15 + T*0.15); pt.xy *= rot(0.4);
    float t = sdTorus(pt, vec2(0.34, 0.14)); if(t < r.x) r = vec2(t, 5.);
    float s2 = length(p - vec3(2.55, 1.3 - b, -1.4)) - 0.17; if(s2 < r.x) r = vec2(s2, 6.);
  }
  float f = p.y - FLOOR; if(f < r.x) r = vec2(f, 0.);
  return r;
}
vec3 nrm(vec3 p){ vec2 e = vec2(0.0008,0.); return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x, map(p+e.yxy).x-map(p-e.yxy).x, map(p+e.yyx).x-map(p-e.yyx).x)); }
vec2 march(vec3 ro, vec3 rd, float tmax){
  float t = 0.; vec2 h;
  for(int i=0;i<140;i++){ h = map(ro+rd*t); if(h.x < 0.0004*t || t > tmax) break; t += h.x*0.9; }
  return vec2(t, t > tmax ? -1. : h.y);
}
float shadow(vec3 ro, vec3 rd){ float res=1., t=0.03; for(int i=0;i<48;i++){ float h=map(ro+rd*t).x; res=min(res, 9.*h/t); t+=clamp(h,0.02,0.25); if(res<0.002||t>6.) break; } return clamp(res,0.,1.); }
float ao(vec3 p, vec3 n){ float o=0., s=1.; for(int i=1;i<6;i++){ float h=0.04*float(i); o += (h - map(p+n*h).x)*s; s*=0.7; } return clamp(1.-2.2*o, 0., 1.); }

// Studio lightformers, as seen in reflections. soft widens every panel for rougher reads.
vec3 env(vec3 d, float soft){
  vec3 c = lin(VOID)*0.6;
  vec2 sb = abs(vec2(d.x + 0.15, d.z - 0.05));
  c += vec3(1.,0.96,1.) * 6.0 * smoothstep(0.55-soft, 0.82, d.y) * (1. - smoothstep(0.32, 0.36+soft, max(sb.x*0.9, sb.y))); // overhead softbox (rect)
  c += vec3(1.,0.9,1.) * 3.0 * smoothstep(0.90-soft, 0.965, dot(d, normalize(vec3(-0.5,0.5,0.71)))); // front-left key card
  float vstrip = 1. - smoothstep(0.55, 0.85+soft, abs(d.y - 0.1));
  c += lin(GLOW) * 3.2 * smoothstep(0.78-soft, 0.93, -d.x) * vstrip;                            // magenta strip
  c += lin(ION)  * 2.0 * smoothstep(0.80-soft, 0.94,  d.x * 0.9 - d.z*0.4) * vstrip;             // ion strip
  c += lin(GLOWHI) * 0.5 * smoothstep(0.25+soft, 0., abs(d.y)) * smoothstep(0.2, 0.9, -d.z);     // back horizon
  return c;
}
vec3 albedo(float id){
  if(id < 1.5) return lin(GLOW);
  if(id < 2.5) return lin(ION);
  if(id < 3.5) return lin(ION);
  if(id < 4.5) return lin(GLOWHI);
  if(id < 5.5) return lin(DEEP);
  return lin(vec3(0.984,0.831,0.322));
}
vec3 plastic(vec3 p, vec3 n, vec3 rd, float id, bool cheap){
  vec3 a = albedo(id);
  vec3 L = normalize(vec3(-0.55, 0.9, 0.6));
  float sh = cheap ? 1. : shadow(p + n*0.01, L);
  float occ = cheap ? 1. : ao(p, n);
  float wrap = clamp((dot(n,L)+0.35)/1.35, 0., 1.);
  float wr = clamp((dot(n,L)+0.15)/1.15, 0., 1.);
  vec3 diff = a * (env(n, 0.9)*0.10 + vec3(1.,0.95,1.)*1.0*wr*wr*mix(0.2,1.,sh)) * occ;
  // subsurface-ish glow for the soft plastic
  diff += a * a * 0.25 * pow(clamp(1.+dot(n,rd),0.,1.), 2.);
  vec3 r = reflect(rd, n);
  float fr = 0.04 + 0.96*pow(1.-clamp(dot(n,-rd),0.,1.), 5.);
  vec3 base = env(r, 0.35) * a * 0.35;            // tinted rough spec of the base coat
  vec3 coat = env(r, 0.0) * fr * mix(0.35, 1., sh); // clearcoat
  vec3 sheen = mix(lin(GLOWHI), vec3(1.), 0.3) * pow(1.-clamp(dot(n,-rd),0.,1.), 4.) * 0.18;
  return diff + base*occ + coat + sheen*occ;
}
vec3 bg(vec3 rd){
  float h = rd.y;
  vec3 c = mix(lin(STAGE)*0.9, lin(VOID)*0.8, smoothstep(-0.05, 0.35, h));
  c += lin(DEEP) * 0.05 * exp(-abs(h-0.01)*10.);
  return c;
}
vec3 shadeFloor(vec3 p, vec3 rd){
  vec3 c = lin(STAGE) * 0.9;
  vec3 L = normalize(vec3(-0.55, 0.9, 0.6));
  float sh = shadow(p + vec3(0.,0.01,0.), L);
  float occ = ao(p, vec3(0.,1.,0.));
  c *= (0.35 + 0.65*sh) * occ;
  float pool = exp(-dot(p.xz - vec2(MP.x,0.15), p.xz - vec2(MP.x,0.15)) * 0.55);
  c += lin(GLOW) * 0.55 * pool * occ;
  c += lin(ION) * 0.12 * exp(-dot(p.xz - vec2(2.6,-0.5), p.xz - vec2(2.6,-0.5))*0.6);
  // blurred reflection
  vec3 r = reflect(rd, vec3(0.,1.,0.));
  vec2 h = march(p + vec3(0.,0.005,0.), r, 6.);
  if(h.y > 0.5){ vec3 q = p + r*h.x; vec3 n = nrm(q); c += plastic(q, n, r, h.y, true) * 0.22 * exp(-h.x*1.4); }
  float fade = smoothstep(9., 3.5, length(p.xz));
  return mix(bg(rd), c, fade);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*R) / R.y;
  float yaw = -0.38 + M.x*0.45 + sin(T*0.5)*0.06;
  float pitch = 0.1 - M.y*0.25 + sin(T*0.37)*0.03;
  float roll = 0.06 + sin(T*0.31)*0.025;
  mat2 a = rot(yaw), b = rot(pitch), c = rot(roll);
  markRot = mat3(a[0][0],0.,a[0][1], 0.,1.,0., a[1][0],0.,a[1][1]);
  markRot = markRot * mat3(1.,0.,0., 0.,b[0][0],b[0][1], 0.,b[1][0],b[1][1]);
  markRot = markRot * mat3(c[0][0],c[0][1],0., c[1][0],c[1][1],0., 0.,0.,1.);

  MP = SCENE == 0 ? vec3(0.95, 0., 0.) : vec3(0.);
  vec3 ro = SCENE == 0 ? vec3(0., 0.3, 5.6) : vec3(0., 0.15, 5.9);
  vec3 ta = vec3(0., 0.05, 0.);
  vec3 ww = normalize(ta-ro), uu = normalize(cross(ww, vec3(0.,1.,0.))), vv = cross(uu, ww);
  vec3 rd = normalize(uv.x*uu + uv.y*vv + 2.1*ww);

  vec3 col; float alpha = 1.;
  vec2 h = march(ro, rd, 20.);
  if(h.y < -0.5){ col = bg(rd); alpha = 0.; }
  else {
    vec3 p = ro + rd*h.x;
    if(h.y < 0.5){ col = shadeFloor(p, rd); alpha = 0.; }
    else { vec3 n = nrm(p); col = plastic(p, n, rd, h.y, false); }
  }
  col = col / (1. + col*0.55);             // soft shoulder
  col = pow(col, vec3(1./2.2));
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)))*43758.5453) - 0.5) / 255.; // dither
  o = ALPHA > 0.5 ? vec4(col*alpha, alpha) : vec4(col, 1.);
}`;

export function mountMark(canvas, opts = {}) {
  const o = { scene: 'hero', dpr: Math.min(devicePixelRatio || 1, 1.5), still: false, time: 2.0, transparent: false, ...opts };
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: true, alpha: o.transparent, preserveDrawingBuffer: o.still });
  if (!gl) { canvas.dataset.fallback = 'no-webgl2'; return { destroy() {}, setPointer() {} }; }
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const uR = U('R'), uT = U('T'), uM = U('M'), uS = U('SCENE'), uA = U('ALPHA');
  gl.uniform1i(uS, o.scene === 'hero' ? 0 : 1); gl.uniform1f(uA, o.transparent ? 1 : 0);
  let mx = 0, my = 0, tx = 0, ty = 0, raf = 0, visible = true, t0 = performance.now();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const size = () => { const w = canvas.clientWidth, h = canvas.clientHeight; canvas.width = Math.round(w * o.dpr); canvas.height = Math.round(h * o.dpr); gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uR, canvas.width, canvas.height); };
  const draw = t => { gl.uniform1f(uT, t); gl.uniform2f(uM, mx, my); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  const onMove = e => { tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; };
  const ro = new ResizeObserver(() => { size(); if (o.still || reduce) draw(o.time); }); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && !o.still && !reduce) loop(); }); io.observe(canvas);
  size();
  function loop() { raf = requestAnimationFrame(now => { raf = 0; mx += (tx - mx) * 0.06; my += (ty - my) * 0.06; draw(o.time + (now - t0) / 1000); if (visible) loop(); }); }
  if (o.still || reduce) draw(o.time); else { addEventListener('pointermove', onMove, { passive: true }); loop(); }
  return {
    setPointer(x, y) { tx = x; ty = y; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onMove); },
  };
}
