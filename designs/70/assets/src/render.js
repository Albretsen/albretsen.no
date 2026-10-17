// Offline progressive path tracer used to bake the hero plates and product scenes.
// Usage: render.html?scene=terrace&w=2400&h=1350&spp=64[&el=3.2&az=0.06&exp=1.0]
// Scenes live in scenes.js. Output is read by screenshotting the page (scripts/shot.sh).
import { NOISE, ATMOSPHERE } from './glsl-common.js';
import { SCENES } from './scenes.js';

const P = new URLSearchParams(location.search);
const sceneName = P.get('scene') || 'terrace';
const S0 = SCENES[sceneName];
// Optional per-render overrides of scene defines: envk, suni, tint=r,g,b, stars
let glsl = S0.glsl;
const fl = v => v.split(',').map(x => (x.includes('.') ? x : x + '.0')).join(',');
const ov = (k, def) => { if (new URLSearchParams(location.search).has(k)) glsl = glsl.replace(new RegExp('#define ' + def + ' [^\\n]+'), '#define ' + def + ' ' + fl(new URLSearchParams(location.search).get(k))); };
ov('envk', 'ENVK'); ov('frame', 'FRAME'); ov('shift', 'SHIFT'); ov('suni', 'SUNI'); ov('tint', 'SUNTINT');
if (new URLSearchParams(location.search).has('tint')) glsl = glsl.replace(/#define SUNTINT [^\n]+/, '#define SUNTINT vec3(' + fl(new URLSearchParams(location.search).get('tint')) + ')');
if (new URLSearchParams(location.search).has('stars')) glsl = '#define STARS ' + fl(new URLSearchParams(location.search).get('stars')) + '\n' + glsl;
const S = { ...S0, glsl };
const W = +P.get('w') || 1280, H = +P.get('h') || 720, SPP = +P.get('spp') || 16;
// Tiling: render the sub-rectangle (ox, oy from top-left, size w x h) of a fw x fh frame.
const FW = +P.get('fw') || W, FH = +P.get('fh') || H, OX = +P.get('ox') || 0, OY = +P.get('oy') || 0;
const num = (k, d) => (P.has(k) ? +P.get(k) : d);
const el = num('el', S.sun[0]) * Math.PI / 180, az = num('az', S.sun[1]);
const sun = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
const exposure = num('exp', S.exposure ?? 1);
const variant = num('v', 0);

const cv = document.getElementById('c');
cv.width = W; cv.height = H; cv.style.width = W + 'px'; cv.style.height = H + 'px';
const gl = cv.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
gl.getExtension('EXT_color_buffer_float');
const info = document.getElementById('info');

const VS = `#version 300 es
in vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }`;

const SKY_FS = `#version 300 es
precision highp float;
uniform vec3 uSun; uniform float uHaze; out vec4 o;
${NOISE}
${ATMOSPHERE}
void main(){ vec2 uv=gl_FragCoord.xy/vec2(512.,256.); o=vec4(atmo(skyDir(uv),uSun,uHaze),1.); }`;

const MAIN_FS = `#version 300 es
precision highp float; precision highp int;
uniform vec2 uRes; uniform vec2 uFull; uniform vec2 uOff; uniform int uFrame; uniform sampler2D uPrev; uniform sampler2D uSky; uniform sampler2D uLogo;
uniform vec3 uSun; uniform float uHaze; uniform int uVariant; uniform float uLogoAspect;
${NOISE}
${ATMOSPHERE}
vec3 sunE; vec3 sunL;
vec3 sky(vec3 d){ return texture(uSky, skyUV(d)).rgb; }
float sdBox(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0); }
float sdBox2(vec2 p, vec2 b){ vec2 q=abs(p)-b; return length(max(q,0.0))+min(max(q.x,q.y),0.0); }
float sdEll(vec3 p, vec3 r){ float k0=length(p/r); float k1=length(p/(r*r)); return k0*(k0-1.0)/k1; }
float sdArch(vec2 p, float w, float s){ float r=sdBox2(p-vec2(0.0,(s-4.0)*0.5), vec2(w,(s+4.0)*0.5)); float c=length(p-vec2(0.0,s))-w; return min(r,c); }
vec3 cosdir(vec3 n){ float u=rnd(), v=rnd(); float a=6.2831853*v; float r=sqrt(u);
  vec3 t=normalize(cross(abs(n.y)<0.99?vec3(0,1,0):vec3(1,0,0),n)); vec3 b=cross(n,t);
  return normalize(t*r*cos(a)+b*r*sin(a)+n*sqrt(1.0-u)); }
vec3 sphr(){ vec3 v; for(int i=0;i<4;i++){ v=vec3(rnd(),rnd(),rnd())*2.0-1.0; if(dot(v,v)<1.0) break; } return v; }
struct Mat { vec3 alb; float spec; float rough; float trans; vec3 emit; };
${S.glsl}
#ifndef SUNTINT
#define SUNTINT vec3(1.0)
#endif
#ifndef BOUNCES
#define BOUNCES 3
#endif
float march(vec3 ro, vec3 rd, out float mid){
  float t=0.002; mid=0.0;
  for(int i=0;i<300;i++){ vec2 h=map(ro+rd*t); if(h.x<0.0003+0.00006*t){ if(h.y<0.5){ t+=max(h.x,0.004); continue; } mid=h.y; return t; } t+=h.x; if(t>MAXD) break; }
  return -1.0;
}
float shadowRay(vec3 ro, vec3 rd){
  float t=0.004; for(int i=0;i<240;i++){ vec2 h=map(ro+rd*t); if(h.x<0.0003){ if(h.y<0.5){ t+=0.004; continue; } return 0.0; } t+=h.x; if(t>MAXD) break; } return 1.0;
}
vec3 calcN(vec3 p){ const vec2 e=vec2(0.0007,-0.0007);
  return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x); }

// Path is split for denoising: A = direct light at the first hit (+ primary env),
// D = diffuse-indirect demodulated by first-hit albedo, S = paths whose first event was specular.
vec3 gA, gD, gS, gPos, gNor, gAlb; float gHit;
void trace(vec3 ro, vec3 rd){
  gA=vec3(0.0); gD=vec3(0.0); gS=vec3(0.0); gPos=vec3(0.0); gNor=vec3(0.0); gAlb=vec3(1.0); gHit=0.0;
  vec3 thr=vec3(1.0); bool spec=true; bool prim=true; int mode=0;
  for(int b=0;b<BOUNCES;b++){
    float mid; float t=march(ro,rd,mid);
    vec3 add=vec3(0.0);
    if(t<0.0){ vec3 e=env(rd,spec); if(!spec) e=min(e,vec3(6.0)); if(prim) e*=ENVK; add=thr*e;
      if(mode==0) gA+=add; else if(mode==1) gD+=add; else gS+=add; break; }
    vec3 p=ro+rd*t; vec3 n=calcN(p); vec3 ng=n;
    Mat m=material(mid,p,n,rd);
    if(b==0){ gPos=p; gNor=ng; gAlb=max(m.alb,vec3(0.02)); gHit=1.0; }
    add+=thr*m.emit;
    vec3 L=normalize(sunL+sphr()*SUNSOFT);
    float ndl=dot(n,L);
    float F= m.spec>0.0 ? m.spec+(1.0-m.spec)*pow(1.0-clamp(dot(-rd,n),0.0,1.0),5.0) : 0.0;
    if(ndl>0.0){ float v=shadowRay(p+n*0.003,L); add+=thr*m.alb*(1.0-F)/PI*sunE*ndl*v*gobo(p,L); }
    if(m.trans>0.0 && ndl<0.0){ float v=shadowRay(p-n*0.004,L); add+=thr*m.alb*m.trans/PI*sunE*(-ndl)*v*gobo(p,L); }
    if(mode==0) gA+=add; else if(mode==1) gD+=add; else gS+=add;
    if(rnd()<F){ vec3 r=reflect(rd,n); r=normalize(r+m.rough*sphr()); if(dot(r,n)<0.0) r=reflect(r,n); rd=r; spec=m.rough<0.08; prim=prim&&spec; if(b==0) mode=2; }
    else { rd=cosdir(n); if(b==0){ mode=1; } else thr*=m.alb; spec=false; prim=false; }
    ro=p+n*0.003;
    if(max(thr.x,max(thr.y,thr.z))<0.01) break;
  }
}
layout(location=0) out vec4 oA; layout(location=1) out vec4 oD; layout(location=2) out vec4 oS;
layout(location=3) out vec4 oP; layout(location=4) out vec4 oN; layout(location=5) out vec4 oL;
uniform sampler2D uP1, uP2, uP3, uP4, uP5;
vec3 fix(vec3 c){ if(any(isnan(c))||any(isinf(c))) return vec3(0.0); return min(c,vec3(60.0)); }
void main(){
  ivec2 ic=ivec2(gl_FragCoord.xy); vec2 fc=gl_FragCoord.xy+uOff;
  seed=pcg(uint(fc.x)+pcg(uint(fc.y)+pcg(uint(uFrame)*7919u)));
  sunL=uSun; sunE=sunTrans(uSun,uHaze)*SUNI*SUNTINT;
  vec2 jit=vec2(rnd(),rnd())-0.5;
  vec2 uv=(fc+jit-0.5*uFull)/uFull.y;
  vec3 ro, rd; camera(uv, ro, rd);
  trace(ro,rd);
  oA=texelFetch(uPrev,ic,0)+vec4(fix(gA),1.0);
  oD=texelFetch(uP1,ic,0)+vec4(fix(gD),1.0);
  oS=texelFetch(uP2,ic,0)+vec4(fix(gS),1.0);
  if(any(isnan(gNor))||any(isnan(gPos))||any(isnan(gAlb))){ gNor=vec3(0.0,1.0,0.0); gPos=vec3(0.0); gHit=0.0; gAlb=vec3(1.0); }
  oP=texelFetch(uP3,ic,0)+vec4(gPos,gHit);
  oN=texelFetch(uP4,ic,0)+vec4(gNor,1.0);
  oL=texelFetch(uP5,ic,0)+vec4(gAlb,1.0);
}`;

// A-trous edge-aware filter (Dammertz et al. 2010), guided by first-hit position and normal.
const ATROUS_FS = `#version 300 es
precision highp float;
uniform sampler2D uC, uPos, uNor; uniform int uStep; uniform float uSigP; out vec4 o;
void main(){
  ivec2 ic=ivec2(gl_FragCoord.xy); ivec2 sz=textureSize(uC,0);
  vec4 c0=texelFetch(uC,ic,0); vec4 p0=texelFetch(uPos,ic,0); vec4 n0=texelFetch(uNor,ic,0);
  float cnt=max(n0.w,1.0); vec3 P=p0.xyz/cnt; vec3 N=normalize(n0.xyz+1e-6); float hit=p0.w/cnt;
  if(hit<0.5){ o=c0; return; }
  const float k[3]=float[3](0.375,0.25,0.0625);
  vec4 sum=vec4(0.0); float ws=0.0;
  for(int j=-2;j<=2;j++) for(int i=-2;i<=2;i++){
    ivec2 q=clamp(ic+ivec2(i,j)*uStep,ivec2(0),sz-1);
    vec4 pq=texelFetch(uPos,q,0); vec4 nq=texelFetch(uNor,q,0); float cq=max(nq.w,1.0);
    if(pq.w/cq<0.5) continue;
    vec4 cv=texelFetch(uC,q,0); if(any(isnan(cv))||any(isnan(nq))||any(isnan(pq))) continue;
    vec3 Pq=pq.xyz/cq; vec3 Nq=normalize(nq.xyz+1e-6);
    float wn=pow(max(dot(N,Nq),0.0),48.0);
    float wp=exp(-abs(dot(Pq-P,N))/uSigP - length(Pq-P)/(uSigP*30.0*float(uStep)));
    float w=k[abs(i)]*k[abs(j)]*wn*wp;
    sum+=cv*w; ws+=w;
  }
  o=sum/max(ws,1e-6);
}`;

const OUT_FS = `#version 300 es
precision highp float;
uniform sampler2D uA, uD, uS, uL; uniform float uExp; out vec4 o;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){ ivec2 ic=ivec2(gl_FragCoord.xy);
  vec4 a=texelFetch(uA,ic,0); vec4 d=texelFetch(uD,ic,0); vec4 s=texelFetch(uS,ic,0); vec4 l=texelFetch(uL,ic,0);
  float n=max(a.w,1.0);
  vec3 c=a.rgb/n + (l.rgb/max(l.w,1.0))*d.rgb/max(d.w,1.0) + s.rgb/max(s.w,1.0);
  c*=uExp; c=c/(1.0+c*0.0); float L=dot(c,vec3(0.2126,0.7152,0.0722)); c*= (1.0+L/9.0)/(1.0+L)*1.0; c=aces(c*1.6); c=pow(c,vec3(1.0/2.2)); o=vec4(c,1.0); }`;

function sh(type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s); info.textContent = log; console.error(log, src.split('\n').map((l, i) => i + 1 + ': ' + l).join('\n')); throw log;
  }
  return s;
}
function prog(fs) {
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { info.textContent = gl.getProgramInfoLog(p); throw 'link'; }
  return p;
}
const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

function tex(w, h, fmt, type, ifmt, filter) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
function fbo(t) { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; }

async function loadLogo() {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 0]));
  let aspect = 1;
  const url = P.get('logo') || S.logo;
  if (url) {
    const img = new Image(); img.src = url; await img.decode();
    aspect = img.naturalWidth / img.naturalHeight;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  return [t, aspect];
}

(async () => {
  const [logoTex, logoAspect] = await loadLogo();
  const haze = num('haze', S.haze ?? 1);
  // 1. sky LUT
  const skyT = tex(512, 256, gl.RGBA, gl.HALF_FLOAT, gl.RGBA16F, gl.LINEAR);
  const skyP = prog(SKY_FS); gl.useProgram(skyP);
  gl.uniform3fv(gl.getUniformLocation(skyP, 'uSun'), sun); gl.uniform1f(gl.getUniformLocation(skyP, 'uHaze'), haze);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo(skyT)); gl.viewport(0, 0, 512, 256); gl.drawArrays(gl.TRIANGLES, 0, 3);
  // 2. accumulation: 6 float targets, ping-ponged
  const NT = 6;
  const mk = () => tex(W, H, gl.RGBA, gl.FLOAT, gl.RGBA32F, gl.NEAREST);
  const sets = [Array.from({ length: NT }, mk), Array.from({ length: NT }, mk)];
  const fbs = sets.map(ts => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    ts.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
    gl.drawBuffers(ts.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); return f; });
  const mainP = prog(MAIN_FS);
  const trousP = prog(ATROUS_FS);
  const outP = prog(OUT_FS);
  const U = (p, n) => gl.getUniformLocation(p, n);
  const t0 = performance.now();
  const BANDS = +P.get('bands') || 4;
  const names = ['uPrev', 'uP1', 'uP2', 'uP3', 'uP4', 'uP5'];
  gl.enable(gl.SCISSOR_TEST);
  for (let f = 0; f < SPP; f++) {
    const src = sets[f % 2], dst = fbs[(f + 1) % 2];
    gl.useProgram(mainP);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst); gl.viewport(0, 0, W, H);
    src.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(U(mainP, names[i]), i); });
    gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, skyT); gl.uniform1i(U(mainP, 'uSky'), 6);
    gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, logoTex); gl.uniform1i(U(mainP, 'uLogo'), 7);
    gl.uniform2f(U(mainP, 'uRes'), W, H); gl.uniform2f(U(mainP, 'uFull'), FW, FH); gl.uniform2f(U(mainP, 'uOff'), OX, FH - OY - H); gl.uniform1i(U(mainP, 'uFrame'), f);
    gl.uniform3fv(U(mainP, 'uSun'), sun); gl.uniform1f(U(mainP, 'uHaze'), haze);
    gl.uniform1i(U(mainP, 'uVariant'), variant); gl.uniform1f(U(mainP, 'uLogoAspect'), logoAspect);
    for (let b = 0; b < BANDS; b++) {
      const y0 = Math.floor(H * b / BANDS), y1 = Math.floor(H * (b + 1) / BANDS);
      gl.scissor(0, y0, W, y1 - y0); gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.finish();
    }
    info.textContent = `${sceneName} ${f + 1}/${SPP} ${((performance.now() - t0) / 1000).toFixed(1)}s`;
    await new Promise(r => setTimeout(r, 0));
  }
  gl.disable(gl.SCISSOR_TEST);
  const fin = sets[SPP % 2];
  // 3. denoise D (diffuse indirect) heavily and S (specular) lightly
  const tmp = [mk(), mk()]; const tfb = tmp.map(fbo);
  const sigP = num('sigp', S.sigP ?? 0.03);
  function filter(srcTex, iters) {
    let cur = srcTex;
    for (let i = 0; i < iters; i++) {
      gl.useProgram(trousP); gl.bindFramebuffer(gl.FRAMEBUFFER, tfb[i % 2]); gl.viewport(0, 0, W, H);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, cur); gl.uniform1i(U(trousP, 'uC'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fin[3]); gl.uniform1i(U(trousP, 'uPos'), 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, fin[4]); gl.uniform1i(U(trousP, 'uNor'), 2);
      gl.uniform1i(U(trousP, 'uStep'), 1 << i); gl.uniform1f(U(trousP, 'uSigP'), sigP);
      gl.drawArrays(gl.TRIANGLES, 0, 3); cur = tmp[i % 2];
    }
    return cur;
  }
  const dIters = num('dn', S.denoise ?? 5);
  let dOut = fin[1];
  if (dIters > 0) { dOut = filter(fin[1], dIters); const keep = mk(); const kf = fbo(keep);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, tfb[(dIters - 1) % 2]); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, kf);
    gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST); dOut = keep; }
  const sIters = num('sn', S.denoiseS ?? 1);
  const sOut = sIters > 0 ? filter(fin[2], sIters) : fin[2];
  gl.useProgram(outP); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
  [[fin[0], 'uA'], [dOut, 'uD'], [sOut, 'uS'], [fin[5], 'uL']].forEach(([t, n], i) => {
    gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(U(outP, n), i); });
  gl.uniform1f(U(outP, 'uExp'), exposure);
  gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish();
  const secs = ((performance.now() - t0) / 1000).toFixed(1);
  info.textContent = `${sceneName} done ${SPP}spp ${secs}s`;
  if (!P.has('debug')) document.body.classList.add('clean');
  document.title = 'done';
})();
