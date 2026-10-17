// Shared GLSL for the offline path tracer (render.js) and the live sky (interactive/sky.js).
// Everything here is written for this kit; the atmosphere follows the classic
// single-scattering model (Nishita / scratchapixel formulation), re-derived in GLSL.

export const NOISE = /* glsl */ `
#define PI 3.14159265359
uint seed;
uint pcg(uint v){ uint s=v*747796405u+2891336453u; uint w=((s>>((s>>28u)+4u))^s)*277803737u; return (w>>22u)^w; }
float rnd(){ seed=pcg(seed); return float(seed)*(1.0/4294967296.0); }
float h31(vec3 p){ uvec3 q=uvec3(ivec3(floor(p))+ivec3(1<<20)); return float(pcg(q.x+pcg(q.y+pcg(q.z))))*(1.0/4294967296.0); }
vec3 h33(vec3 p){ uvec3 q=uvec3(ivec3(floor(p))+ivec3(1<<20)); uint a=pcg(q.x+pcg(q.y+pcg(q.z))); uint b=pcg(a); uint c=pcg(b);
  return vec3(float(a),float(b),float(c))*(1.0/4294967296.0); }
float vnoise(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
`;

export const ATMOSPHERE = /* glsl */ `
const float Re=6360e3, Ra=6420e3, Hr=7994.0, Hm=1200.0;
const vec3 bR=vec3(5.8e-6,13.5e-6,33.1e-6);
const vec3 bM=vec3(21e-6);
vec2 rsi(vec3 o, vec3 d, float r){ float b=dot(o,d); float c=dot(o,o)-r*r; float h=b*b-c; if(h<0.0) return vec2(1e12,-1e12); h=sqrt(h); return vec2(-b-h,-b+h); }
vec3 atmo(vec3 d, vec3 s, float haze){
  vec3 orig=vec3(0.0,Re+60.0,0.0);
  vec2 ta=rsi(orig,d,Ra); float tmax=ta.y;
  vec2 tg=rsi(orig,d,Re); if(tg.x>0.0) tmax=min(tmax,tg.x);
  const int N=24; float seg=tmax/float(N); float t=0.0;
  vec3 sR=vec3(0.0), sM=vec3(0.0); float oR=0.0, oM=0.0;
  float mu=dot(d,s); float pR=3.0/(16.0*PI)*(1.0+mu*mu); float g=0.78;
  float pM=3.0/(8.0*PI)*((1.0-g*g)*(1.0+mu*mu))/((2.0+g*g)*pow(1.0+g*g-2.0*g*mu,1.5));
  for(int i=0;i<N;i++){
    vec3 x=orig+d*(t+seg*0.5); float h=length(x)-Re;
    float hr=exp(-h/Hr)*seg, hm=exp(-h/Hm)*seg*haze; oR+=hr; oM+=hm;
    vec2 tl=rsi(x,s,Ra); float segL=tl.y/8.0; float lR=0.0, lM=0.0; bool ok=true;
    for(int j=0;j<8;j++){ vec3 y=x+s*(segL*(float(j)+0.5)); float hl=length(y)-Re; if(hl<0.0){ok=false;break;} lR+=exp(-hl/Hr)*segL; lM+=exp(-hl/Hm)*segL*haze; }
    if(ok){ vec3 tau=bR*(oR+lR)+bM*1.1*(oM+lM); vec3 att=exp(-tau); sR+=att*hr; sM+=att*hm; }
    t+=seg;
  }
  return 20.0*(sR*bR*pR+sM*bM*pM);
}
vec3 sunTrans(vec3 s, float haze){
  vec3 orig=vec3(0.0,Re+60.0,0.0);
  vec2 tg=rsi(orig,s,Re); if(tg.x>0.0) return vec3(0.0);
  vec2 ta=rsi(orig,s,Ra); float seg=ta.y/32.0; float oR=0.0,oM=0.0;
  for(int i=0;i<32;i++){ vec3 x=orig+s*(seg*(float(i)+0.5)); float h=length(x)-Re; oR+=exp(-h/Hr)*seg; oM+=exp(-h/Hm)*seg*haze; }
  return exp(-(bR*oR+bM*1.1*oM));
}
vec2 skyUV(vec3 d){ float az=atan(d.x,d.z); float el=asin(clamp(d.y,-1.0,1.0)); return vec2(az/(2.0*PI)+0.5, sqrt(max(el,0.0)/(PI*0.5))); }
vec3 skyDir(vec2 uv){ float az=(uv.x-0.5)*2.0*PI; float el=uv.y*uv.y*PI*0.5; return vec3(sin(az)*cos(el), sin(el), cos(az)*cos(el)); }
`;
