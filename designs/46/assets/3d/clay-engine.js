// Clay engine: raw WebGL2 signed-distance raymarcher with a clay material.
// Albretsen AS / "Say Cheese" art direction (design 46).
//
// One fragment shader, no libraries. Scenes are GLSL snippets that define
//   Hit map(vec3 p)            the world as smooth-unioned clay blobs
//   vec3 sky(vec3 rd)          the backdrop
// The engine adds: fingerprint-dented normals, wrap-lit soft clay shading,
// fake subsurface glow, soft shadows, AO, a glossy "lens glass" material,
// a textured app-tile material (for REAL product logos), exposure and a
// focus-pull blur on an optional backdrop photo.
//
// Usage:
//   import { createClay } from './clay-engine.js'
//   const clay = await createClay(canvas, scene, { quality: 'live' | 'still' })
//   clay.set({ uLook:[x,y], uLid:0..1, uExposure:0, uFocus:0..1 }); clay.frame(t)

export const COMMON = /* glsl */`#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos, uCamTarget;
uniform float uFov;
uniform vec3 uSun;
uniform float uExposure;   // stops, -2..+2
uniform float uFocus;      // 0 sharp backdrop .. 1 very soft
uniform vec2 uLook;        // lens gaze -1..1
uniform float uLid;        // 0 open .. 1 closed
uniform float uSquash;     // -1..1 squash & stretch
uniform float uAlpha;      // 1 = transparent background (cut-outs)
uniform float uShadowR;    // cut-out shadow radius (world units)
uniform vec4 uTile;        // tile tint (linear rgb) + gloss
uniform vec2 uOffset;      // tile offset for progressive rendering
uniform int uSS;           // supersamples per axis
uniform int uSteps;
uniform int uShadow;       // 0/1
uniform sampler2D uTex0, uTex1, uTex2, uPhoto;
uniform float uHasPhoto;

#define PI 3.14159265
struct Hit { float d; vec3 c; float m; };
// m: 0 clay, 1 lens glass, 2 tile (texture 0), 3 floor, 4 candy gloss clay, 5 tile tex1, 6 tile tex2, 7 lid

vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
vec3 hex(float h){ return lin(vec3(floor(h/65536.), mod(floor(h/256.),256.), mod(h,256.))/255.); }

#define BUTTER hex(16771454.)
#define APRICOT hex(16555591.)
#define TANGERINE hex(15560210.)
#define GUM hex(16751042.)
#define MINT hex(9301957.)
#define LILAC hex(11972083.)
#define SKY hex(9688565.)
#define CREAM hex(16774884.)
#define PAPER hex(16509134.)
#define INK hex(3676691.)
#define COCOA hex(7159599.)
#define CHERRY hex(15548235.)
#define SUNK hex(16773571.)
#define FILL hex(12181235.)
#define BOUNCE hex(16559731.)
#define WHITE hex(16776695.)
Hit H(float d, vec3 c, float m){ Hit h; h.d=d; h.c=c; h.m=m; return h; }
Hit U(Hit a, Hit b){ if(a.d<b.d) return a; return b; }
Hit S(Hit a, Hit b, float k){
  float h = clamp(0.5+0.5*(b.d-a.d)/k, 0., 1.);
  Hit r; r.d = mix(b.d, a.d, h) - k*h*(1.-h); r.c = mix(b.c, a.c, h); r.m = h>0.5 ? a.m : b.m; return r;
}
float smin(float a, float b, float k){ float h=clamp(0.5+0.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

float sdSphere(vec3 p, float r){ return length(p)-r; }
float sdBox(vec3 p, vec3 b, float r){ vec3 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r; }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float sdEll(vec3 p, vec3 r){ float k0=length(p/r); float k1=length(p/(r*r)); return k0*(k0-1.)/max(k1,1e-5); }
float sdTorus(vec3 p, vec2 t){ vec2 q=vec2(length(p.xy)-t.x, p.z); return length(q)-t.y; } // ring in XY plane, facing +z
float sdCyl(vec3 p, float R, float h, float rb){ // axis y, outer radius R, half height h, edge round rb
  vec2 d = vec2(length(p.xz)-(R-rb), abs(p.y)-(h-rb)); return min(max(d.x,d.y),0.)+length(max(d,0.))-rb; }
float sdArc(vec3 p, vec2 sc, float ra, float rb){ p.x=abs(p.x); float k=(sc.y*p.x>sc.x*p.y)?dot(p.xy,sc):length(p.xy); return sqrt(dot(p,p)+ra*ra-2.0*ra*k)-rb; }

float hash31(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
vec3 hash33(vec3 p){ p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))); return fract(sin(p)*43758.5453123); }
float vnoise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=0.5, s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }
// fingerprint: concentric ridges around the nearest random "thumb press"
float thumb(vec3 p){
  vec3 i=floor(p), f=fract(p); float best=9.; vec3 bv=vec3(0);
  for(int z=-1;z<=1;z++) for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec3 g=vec3(x,y,z); vec3 o=hash33(i+g); vec3 r=g+o-f; float d=dot(r,r); if(d<best){best=d;bv=r;} }
  float d=sqrt(best);
  return sin(d*58.0 + vnoise(p*6.)*3.0) * smoothstep(0.42, 0.0, d);
}
`;

export const ENGINE = /* glsl */`
vec3 calcNormal(vec3 p){
  const vec2 k=vec2(1,-1); float e=0.0012;
  return normalize(k.xyy*map(p+k.xyy*e).d + k.yyx*map(p+k.yyx*e).d + k.yxy*map(p+k.yxy*e).d + k.xxx*map(p+k.xxx*e).d);
}
float softShadow(vec3 ro, vec3 rd, float k){
  float res=1., t=0.02, ph=1e10;
  for(int i=0;i<56;i++){
    float h=map(ro+rd*t).d;
    float y=h*h/(2.0*ph); float d=sqrt(max(h*h-y*y,0.)); res=min(res,k*d/max(0.,t-y)); ph=h;
    t+=clamp(h,0.015,0.35); if(res<0.002||t>12.) break;
  }
  res=clamp(res,0.,1.); return res*res*(3.-2.*res);
}
float calcAO(vec3 p, vec3 n){
  float occ=0., sca=1.;
  for(int i=0;i<5;i++){ float h=0.02+0.13*float(i); float d=map(p+n*h).d; occ+=(h-d)*sca; sca*=0.82; }
  return clamp(1.-1.6*occ,0.,1.);
}
vec3 bumpN(vec3 p, vec3 n, float amt){
  if(amt<=0.) return n;
  float e=0.004; vec3 q=p*3.1;
  float b0 = thumb(q)*0.35 + fbm(p*14.)*0.65;
  vec3 g = vec3(thumb(q+vec3(e*3.1,0,0))*0.35+fbm((p+vec3(e,0,0))*14.)*0.65,
                thumb(q+vec3(0,e*3.1,0))*0.35+fbm((p+vec3(0,e,0))*14.)*0.65,
                thumb(q+vec3(0,0,e*3.1))*0.35+fbm((p+vec3(0,0,e))*14.)*0.65) - b0;
  g/=e; g-=n*dot(g,n);
  return normalize(n - g*amt);
}
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.,1.); }
// saturation-preserving luminance tonemap (keeps candy colours loud)
vec3 candyTone(vec3 c){ float L=dot(c,vec3(0.2126,0.7152,0.0722)); float Lt=L*(1.+L/2.6)/(1.+L); vec3 o=c*(Lt/max(L,1e-4));
  float mx=max(o.r,max(o.g,o.b)); if(mx>1.) o=mix(o/mx, vec3(1.), clamp((mx-1.)*0.5,0.,1.)); return clamp(o,0.,1.); }

vec4 photoBg(vec2 uv){
  // focus pull: golden-angle disc blur of the backdrop photo
  float r = uFocus*0.03; vec3 acc=vec3(0); float w=0.;
  for(int i=0;i<24;i++){
    float fi=float(i); float a=fi*2.39996; float rr=sqrt((fi+0.5)/24.)*r;
    vec3 c=texture(uPhoto, uv+vec2(cos(a),sin(a))*rr*vec2(uRes.y/uRes.x,1.)).rgb;
    c = lin(c); float lum=dot(c,vec3(.3,.6,.1)); float wt=1.+smoothstep(.55,1.,lum)*6.*uFocus; // bokeh bloom
    acc+=c*wt; w+=wt;
  }
  return vec4(acc/w,1.);
}

vec4 render(vec2 frag){
  vec2 uv=(frag-0.5*uRes)/uRes.y;
  vec3 ro=uCamPos; vec3 ww=normalize(uCamTarget-ro); vec3 uu=normalize(cross(ww,vec3(0,1,0))); vec3 vv=cross(uu,ww);
  vec3 rd=normalize(uv.x*uu+uv.y*vv+ww*0.5/tan(radians(uFov)*0.5));
  vec3 bg = sky(rd);
  if(uHasPhoto>0.5){ bg = photoBg(frag/uRes).rgb; }
  float t=0.; Hit h; bool hit=false;
  for(int i=0;i<400;i++){ if(i>=uSteps) break; h=map(ro+rd*t); if(abs(h.d)<0.0006*t){hit=true;break;} t+=h.d*0.9; if(t>40.) break; }
  if(!hit) return vec4(bg, 1.-uAlpha);
  vec3 p=ro+rd*t; vec3 n0=calcNormal(p);
  vec3 L=normalize(uSun);
  float ao=calcAO(p,n0);
  float sh= uShadow>0 ? softShadow(p+n0*0.004, L, 10.) : 1.;
  vec3 sunC=SUNK*2.3;   // warm dawn key
  vec3 skyC=mix(FILL,LILAC,0.45)*0.8;  // cool lilac sky fill
  vec3 bounceC=BOUNCE*0.5; // apricot floor bounce
  vec3 col;
  if(h.m>2.5 && h.m<3.5){ // floor
    float l = max(dot(n0,L),0.);
    vec3 base = h.c;
    vec3 shadeTint = mix(LILAC, GUM, 0.35)*0.62;
    col = base*(sunC*l*0.42 + 0.62);
    col = mix(col, base*shadeTint, clamp((1.-sh)*0.75 + (1.-ao)*0.8, 0., 1.));
    float fog = smoothstep(6., 22., t);
    if(uHasPhoto>0.5){ col = bg*mix(vec3(1.), shadeTint*1.1, clamp((1.-sh)*0.8+(1.-ao)*0.9,0.,1.)); fog = 0.; }
    col = mix(col, bg, fog);
    if(uAlpha>0.5){
      float fade = smoothstep(uShadowR, uShadowR*0.15, length(p.xz));
      float a = clamp((1.-sh)*0.42 + (1.-ao)*0.55, 0., 1.)*fade;
      return vec4(mix(LILAC,COCOA,0.6)*0.35, a); }
    return vec4(col,1.);
  }
  float clay = (h.m<0.5||h.m>3.5) ? 1. : 0.;
  vec3 n = bumpN(p, n0, clay*(h.m>3.5?0.0022:0.0068));
  float wrap=0.42; float dif=clamp((dot(n,L)+wrap)/(1.+wrap),0.,1.);
  float skyL=0.5+0.5*n.y; float bnc=clamp(0.5-0.5*n.y,0.,1.)*clamp(1.-p.y*0.6,0.,1.);
  vec3 V=-rd; vec3 Hh=normalize(L+V);
  float fre=pow(1.-clamp(dot(n,V),0.,1.),4.);
  vec3 alb=h.c*(1.0+clay*(fbm(p*5.0)-0.5)*0.10);
  if(h.m<0.5 || h.m>6.5){ // matte clay with subsurface warmth
    float thick = clamp(map(p-n0*0.07).d*-8.,0.,1.);
    vec3 sss = alb*alb*sunC*0.20*(1.-thick)*clamp(dot(-n,L)*0.5+0.6,0.,1.);
    col = alb*(sunC*dif*mix(0.35,1.,sh) + skyC*skyL*ao + bounceC*bnc*ao) + sss;
    col += sunC*pow(max(dot(n,Hh),0.),14.)*0.045*sh;
    col += alb*fre*0.35*ao;
  } else if(h.m>3.5){ // candy gloss clay
    col = alb*(sunC*dif*mix(0.35,1.,sh) + skyC*skyL*ao + bounceC*bnc*ao);
    col += sunC*pow(max(dot(n,Hh),0.),90.)*0.9*sh;
    col += sky(reflect(rd,n))*fre*0.6*ao;
  } else if(h.m>0.5 && h.m<1.5){ // lens glass with iris + coating
    vec3 R=reflect(rd,n);
    // iris seen through the glass: a six-blade aperture drawn from the dome normal
    vec2 g = n.xy - uLook*0.12; float r = length(g)*1.25; float an = atan(g.y,g.x);
    float hexR = cos(PI/6.)/cos(mod(an+uTime*0.0,PI/3.)-PI/6.);
    float open = 0.42;
    float blade = smoothstep(open*hexR-0.01, open*hexR+0.01, r);
    float edges = smoothstep(0.03,0.0,abs(fract((an+r*1.6)/(PI/3.))-0.5)*r*2.0-0.0)*blade*(1.-smoothstep(0.85,0.9,r));
    vec3 deep = mix(INK, LILAC*0.2, 0.3)*0.18;
    vec3 blades = mix(INK*1.2, mix(COCOA,LILAC,0.4)*0.9, smoothstep(0.4,0.95,r));
    col = mix(deep, blades, blade) + mix(GUM,LILAC,0.5)*edges*0.6;
    col += mix(GUM, MINT, 0.5+0.5*sin(r*9.0+an))*0.05*smoothstep(0.75,0.95,r); // rim coating
    col *= (0.6+0.4*ao);
    col += mix(LILAC,MINT,0.5+0.5*R.x)*0.18*fre; // lilac/mint lens coating
    col += sky(R)*(0.03+0.6*fre)*ao*smoothstep(-0.1,0.5,R.y);
    vec2 sb = R.xy - vec2(-0.45,0.55); float box = smoothstep(0.06,0.0, max(abs(sb.x)-0.16, abs(sb.y)-0.1)); col = mix(col, WHITE*0.9, box*0.6); // softbox window
    col = mix(col, sunC*0.6, clamp(pow(max(dot(n,Hh),0.),400.)*2.5*sh,0.,1.));
    col += sunC*pow(max(dot(n,normalize(vec3(-0.6,0.5,0.6)+V)),0.),250.)*0.8;
  } else { // app tile: real product logo as texture on the +z face
    col = alb*(sunC*dif*mix(0.4,1.,sh)*0.85 + skyC*skyL*ao*0.9 + bounceC*bnc*ao*0.6);
    col += sunC*pow(max(dot(n,Hh),0.),60.)*0.35*sh;
    col += sky(reflect(rd,n))*fre*0.25;
  }
  return vec4(col,1.);
}

void main(){
  vec2 fc = gl_FragCoord.xy + uOffset;
  vec3 acc=vec3(0); float aacc=0.;
  int ss = max(uSS,1);
  for(int j=0;j<4;j++){ if(j>=ss) break;
    for(int i=0;i<4;i++){ if(i>=ss) break;
      vec2 o = (vec2(i,j)+0.5)/float(ss)-0.5;
      vec4 c = render(fc+o); acc+=c.rgb*c.a; aacc+=c.a; } }
  float n2=float(ss*ss); vec3 col=acc/max(aacc,1e-4); float a=aacc/n2;
  col *= exp2(uExposure);
  col = mix(aces(col*0.9), candyTone(col*0.95), 0.7);
  col = pow(col, vec3(1./2.2));
  // gentle film grain so gradients never band
  col += (hash31(vec3(fc, uTime))-0.5)/255.*2.;
  if(uAlpha>0.5){ fragColor=vec4(col, a); } else fragColor=vec4(col,1.);
}
`;

const VERT = `#version 300 es
in vec2 aPos; void main(){ gl_Position=vec4(aPos,0.,1.); }`;

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

export async function createClay(canvas, scene, opts = {}) {
  const q = opts.quality || 'live';
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: q === 'still', alpha: true });
  if (!gl) throw new Error('WebGL2 unavailable');
  const src = COMMON + (scene.glsl || '') + ENGINE;
  const sh = (type, s) => { const o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(o); console.error(log); throw new Error(log); } return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, src));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; const u = n => (U[n] ??= gl.getUniformLocation(prog, n));

  // textures: uTex0..2 = product logos, uPhoto = backdrop photo
  const texNames = ['uTex0', 'uTex1', 'uTex2', 'uPhoto'];
  const blank = new Uint8Array([0, 0, 0, 0]);
  for (let i = 0; i < 4; i++) {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blank);
    const srcI = (scene.textures || {})[texNames[i]];
    if (srcI) {
      const img = await loadImage(srcI);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.uniform1i(u(texNames[i]), i);
  }
  const state = Object.assign({
    uCamPos: [0, 0.9, 4.2], uCamTarget: [0, 0.6, 0], uFov: 30, uSun: [-0.55, 0.75, 0.6],
    uExposure: 0, uFocus: 0, uLook: [0, 0], uLid: 0, uSquash: 0, uAlpha: 0, uShadowR: 2.0, uTile: [1, 1, 1, 1],
    uHasPhoto: scene.textures?.uPhoto ? 1 : 0,
  }, scene.uniforms || {}, opts.uniforms || {});
  const qual = q === 'still' ? { uSS: opts.ss ?? 2, uSteps: 260, uShadow: 1 } : { uSS: 1, uSteps: opts.steps ?? 110, uShadow: opts.shadow ?? 1 };

  function apply(t) {
    gl.uniform2f(u('uRes'), canvas.width, canvas.height); gl.uniform1f(u('uTime'), t);
    for (const [k, v] of Object.entries(state)) {
      if (Array.isArray(v)) gl[`uniform${v.length}fv`](u(k), v); else gl.uniform1f(u(k), v);
    }
    gl.uniform1i(u('uSS'), qual.uSS); gl.uniform1i(u('uSteps'), qual.uSteps); gl.uniform1i(u('uShadow'), qual.uShadow);
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  return {
    gl, state,
    set(o) { Object.assign(state, o); },
    resize() { gl.viewport(0, 0, canvas.width, canvas.height); },
    frame(t = 0) { gl.viewport(0, 0, canvas.width, canvas.height); apply(t); gl.uniform2f(u('uOffset'), 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 3); },
    // progressive still: renders horizontal bands across animation frames so slow GPUs never stall
    async still(band = 48) {
      apply(0); gl.enable(gl.SCISSOR_TEST);
      for (let y = 0; y < canvas.height; y += band) {
        gl.scissor(0, y, canvas.width, band); gl.uniform2f(u('uOffset'), 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.finish(); await new Promise(r => setTimeout(r, 0));
      }
      gl.disable(gl.SCISSOR_TEST);
    },
  };
}
