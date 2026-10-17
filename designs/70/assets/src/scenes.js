// Scene descriptions for the offline renderer. Each scene provides:
// MAXD, SUNI (sun strength), SUNSOFT (penumbra), env(), map(), material(), gobo(), camera().

// Shared environment: physically based sky (LUT) + sun disc + thin cirrus + distant hazy ridges + sea.
const ENV = ({ camH = 45, mtn = 'vec4(-0.20,-0.035,0.030,0.0)', cliff = 'vec4(-0.95,-0.42,0.07,0.0)', cloud = 0.6, sunR = 0.0085 }) => /* glsl */ `
float ridge(float az, vec4 m, float seedv){
  float w=smoothstep(m.x,m.x+0.06,az)*(1.0-smoothstep(m.y-0.05,m.y,az));
  float n=fbm(vec3(az*14.0,seedv,0.0))*0.75+fbm(vec3(az*60.0,seedv+3.0,1.0))*0.25;
  return w*m.z*(0.45+0.9*n);
}
vec3 skyAndLand(vec3 d, bool disc){
  vec3 c=sky(d);
  // cirrus: a thin layer at 6 km, stretched along x
  if(d.y>0.002){
    float t=6000.0/d.y; vec2 q=d.xz*t*0.00022;
    float den=fbm(vec3(q.x*0.35,q.y*1.6,2.0))-0.5+0.12*fbm(vec3(q*3.0,5.0));
    float a=smoothstep(0.0,0.22,den)*${cloud.toFixed(3)}*smoothstep(0.002,0.06,d.y)*(1.0-smoothstep(0.25,0.6,d.y));
    float mu=dot(d,sunL);
    vec3 lit=sunE*(0.05+0.35*pow(max(mu,0.0),6.0))+sky(normalize(vec3(d.x,0.3,d.z)))*0.6;
    c=mix(c,lit,a);
  }
#ifdef STARS
  if(d.y>0.0){ vec3 sp=d*420.0; vec3 cc=floor(sp); vec3 hh=h33(cc); float dd=length(fract(sp)-0.5-(hh-0.5)*0.6);
    float st=smoothstep(0.08,0.0,dd)*step(0.965,hh.x)*smoothstep(0.0,0.12,d.y); c+=vec3(0.9,0.92,1.0)*st*STARS*(0.3+hh.y); }
#endif
  if(disc){ float mu=dot(d,sunL); float r=${sunR.toFixed(5)};
    float dd=acos(clamp(mu,-1.0,1.0)); if(dd<r){ float limb=sqrt(1.0-pow(dd/r,2.0)); c+=sunE*(55.0+25.0*limb)/max(1.0,1.0); }
  }
  float az=atan(d.x,d.z); float el=asin(clamp(d.y,-1.0,1.0));
  vec3 hor=sky(normalize(vec3(d.x,0.004,d.z)));
  float h1=ridge(az, ${mtn}, 1.0);
  if(el<h1-0.0035){ c=mix(hor*vec3(0.62,0.58,0.78), hor, 0.42+0.3*smoothstep(0.0,0.03,h1-el)*0.0); }
  float h2=ridge(az, ${cliff}, 7.0);
  if(el<h2-0.0035){ c=hor*vec3(0.40,0.36,0.52); }
  return c;
}
vec3 env(vec3 d, bool disc){
  float dip=-0.0045;
  if(d.y>dip) return skyAndLand(d,disc);
  float t=${camH.toFixed(1)}/max(-d.y,1e-5);
  vec2 q=d.xz*t;
  float amp=1.0/(1.0+t*0.0012);
  vec2 g=vec2(0.0);
  for(int i=0;i<7;i++){ float a=float(i)*2.39+0.4; vec2 dir=vec2(cos(a),sin(a)*0.6+0.4); float f=0.11*pow(1.75,float(i));
    g+=dir*cos(dot(dir,q)*f+float(i)*1.7)*(0.55/pow(1.6,float(i))); }
  vec3 n=normalize(vec3(-g.x*amp*0.22, 1.0, -g.y*amp*0.22)+sphr()*0.010*amp);
  vec3 r=reflect(d,n); r.y=max(abs(r.y),0.0);
  float fr=0.02+0.98*pow(1.0-max(dot(-d,n),0.0),5.0);
  vec3 refl=skyAndLand(normalize(vec3(r.x,max(r.y,-dip*0.5),r.z)),false);
  float glint=pow(max(dot(r,sunL),0.0),900.0)*900.0/6.28;
  vec3 body=vec3(0.012,0.035,0.05)*sky(vec3(0.0,1.0,0.0))*1.5;
  vec3 c=mix(body,refl,fr)+sunE*glint*fr*(disc?1.0:0.15);
  vec3 hor=sky(normalize(vec3(d.x,0.003,d.z)));
  c=mix(c,hor,1.0-exp(-t/16000.0));
  return c;
}`;

// Bougainvillea: thousands of papery bracts and leaves scattered through a noisy volume (region()).
// Three rotated jittered grids avoid any visible lattice. id 4 = magenta bract, 5 = leaf, 6 = coral bract.
const BLOOM = (bbox, cs = [0.062, 0.05, 0.041]) => /* glsl */ `
vec2 bloomLayer(vec3 p, float cs, float salt){
  vec3 c=floor(p/cs); vec3 f=p-c*cs;
  vec3 h=h33(c+salt); float bnd=min(min(min(f.x,cs-f.x),min(f.y,cs-f.y)),min(f.z,cs-f.z))+0.0015;
  float rc=region((c+0.5)*cs);
  float keep=smoothstep(0.04,-0.06,rc)*0.97;
  if(h.x>keep) return vec2(max(bnd,0.004),0.0);
  vec3 ctr=cs*(0.36+0.28*h.zxy); float rad=cs*(0.2+0.13*fract(h.y*7.3));
  vec3 q=f-ctr; float a=h.z*6.28; q.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*q.xz;
  float sq=0.45+0.4*fract(h.z*13.1);
  float d=(length(q/vec3(1.0,sq,1.0+0.5*fract(h.x*5.1)))-rad)*sq;
  float cl=vnoise((c+0.5)*cs*5.0+salt*0.1);
  float id= fract(h.z*3.7)<smoothstep(0.32,0.72,cl)*0.95 ? (fract(h.x*17.0)<0.07 ? 6.0 : 4.0) : 5.0;
  float bb=max(bnd,0.004);
  return d<bb ? vec2(d,id) : vec2(bb,0.0);
}
vec2 bloom(vec3 p){
  float bb=${bbox};
  if(bb>0.15) return vec2(bb,0.0);
  float r=region(p);
  if(r>0.12) return vec2(r-0.06,0.0);
  vec2 a=bloomLayer(p, ${cs[0]}, 0.0);
  vec2 b=bloomLayer(mat3(0.8,0.0,-0.6, 0.0,1.0,0.0, 0.6,0.0,0.8)*p+vec3(0.021,0.013,0.017), ${cs[1]}, 97.0);
  vec2 c=bloomLayer(mat3(0.36,0.48,-0.8, -0.8,0.6,0.0, 0.48,0.64,0.6)*p+vec3(0.011,0.029,0.007), ${cs[2]}, 211.0);
  vec2 m=a.x<b.x?a:b; return m.x<c.x?m:c;
}`;

// Whitewash: lime plaster albedo with a two-scale bump (trowel undulation + fine grain).
const STUCCO = /* glsl */ `
void stucco(vec3 p, inout vec3 n, float amp){
  vec3 e=vec3(0.006,0.0,0.0);
  float b0=fbm(p*7.0)+0.35*fbm(p*40.0);
  vec3 gb=vec3(fbm((p+e.xyy)*7.0)+0.35*fbm((p+e.xyy)*40.0)-b0, fbm((p+e.yxy)*7.0)+0.35*fbm((p+e.yxy)*40.0)-b0, fbm((p+e.yyx)*7.0)+0.35*fbm((p+e.yyx)*40.0)-b0)/0.006;
  n=normalize(n-amp*gb);
}`;

export const SCENES = {
  // ------------------------------------------------------------------ TERRACE
  // Inside a whitewashed loggia, looking out through one deep arch at the sea.
  // The low sun comes in from the left and lays an arch of gold on the right wall,
  // and the balustrade draws long stripes across a polished terracotta floor.
  terrace: {
    sun: [6.5, -0.92], exposure: 1.25, haze: 0.8, sigP: 0.03, denoiseS: 3,
    glsl: /* glsl */ `
#define MAXD 120.0
#define FRAME 1.0
#define SHIFT 0.07
#define SUNI 26.0
#define SUNTINT vec3(1.0,0.80,0.63)
#define SUNSOFT 0.006
#define ENVK 0.42
${ENV({ camH: 55, mtn: 'vec4(-0.24,-0.06,0.026,0.0)', cliff: 'vec4(-0.60,-0.13,0.045,0.0)', cloud: 0.35, sunR: 0.011 })}
${STUCCO}
const float AW=1.25, AS=2.35;
float region(vec3 p){
  float d=sdEll(p-vec3(1.05,3.72,0.98), vec3(1.55,0.55,0.30));
  d=min(d, sdEll(p-vec3(1.42,2.85,0.95), vec3(0.30,1.05,0.26)));
  d=min(d, sdEll(p-vec3(0.45,3.42,0.95), vec3(0.62,0.26,0.24)));
  d=min(d, sdEll(p-vec3(1.9,1.25,3.05), vec3(1.15,0.30,0.34)));
  d=min(d, sdEll(p-vec3(1.25,1.95,0.98), vec3(0.22,0.55,0.22)));
  return d+(vnoise(p*3.1)-0.5)*0.42+(vnoise(p*9.0)-0.5)*0.12;
}
${BLOOM('min(sdBox(p-vec3(1.1,2.75,0.95),vec3(1.75,1.75,0.5)), sdBox(p-vec3(1.9,1.25,3.05),vec3(1.5,0.55,0.55)))', [0.062, 0.05, 0.041])}
vec2 map(vec3 p){
  vec2 r=vec2(1e9,0.0);
  float wb=sdBox(p-vec3(0.0,3.0,0.35), vec3(30.0,4.0,0.35)); float wa=-sdArch(p.xy,AW,AS);
  float kk=0.05; float hh=clamp(0.5-0.5*(wa-wb)/kk,0.0,1.0); float wall=mix(wa,wb,hh)+kk*hh*(1.0-hh);
  if(wall<r.x) r=vec2(wall,1.0);
  float fl=sdBox(p-vec3(0.0,-0.5,-4.0), vec3(30.0,0.5,7.3)); if(fl<r.x) r=vec2(fl,2.0);
  float room=min(sdBox(p-vec3(0.0,5.0,-5.5),vec3(30.0,0.3,5.9)), sdBox(vec3(abs(p.x),p.yz)-vec3(3.9,2.5,-5.5),vec3(0.3,3.0,5.9)));
  room=min(room, sdBox(p-vec3(0.0,2.5,-11.6),vec3(30.0,3.0,0.3)));
  if(room<r.x) r=vec2(room,1.0);
  vec3 bq=p-vec3(0.0,4.62,0.0); bq.z=mod(bq.z+0.3,0.6)-0.3;
  float beam=max(sdBox(bq,vec3(3.6,0.08,0.055))-0.008, p.z-0.0);
  if(beam<r.x) r=vec2(beam,7.0);
  float bench=sdBox(p-vec3(-3.35,0.22,-4.5),vec3(0.32,0.22,3.2))-0.04;
  if(bench<r.x) r=vec2(bench,1.0);
  // balustrade
  float par=sdBox(p-vec3(0.0,0.09,3.1),vec3(30.0,0.08,0.16))-0.01;
  par=min(par, sdBox(p-vec3(0.0,1.0,3.1),vec3(30.0,0.055,0.14))-0.02);
  vec3 q=p-vec3(0.0,0.0,3.1); q.x=mod(q.x+0.17,0.34)-0.17;
  float yy=clamp((q.y-0.18)/0.75,0.0,1.0);
  float rad=0.040+0.032*pow(sin(yy*PI*0.92+0.15),2.0)+0.01*smoothstep(0.85,1.0,yy)+0.012*(1.0-smoothstep(0.0,0.08,yy));
  float bal=max((length(q.xz)-rad)*0.85, abs(q.y-0.555)-0.38);
  par=min(par,bal);
  if(par<r.x) r=vec2(par,3.0);
  vec2 bl=bloom(p); if(bl.x<r.x) r=bl;
  return r;
}
float gobo(vec3 p, vec3 L){ return 1.0; }
Mat material(float id, vec3 p, inout vec3 n, vec3 rd){
  Mat m; m.spec=0.0; m.rough=0.0; m.trans=0.0; m.emit=vec3(0.0);
  if(id<1.5 || (id>2.5&&id<3.5)){
    float k=fbm(p*2.2);
    m.alb=vec3(0.87,0.86,0.83)*(0.94+0.08*k);
    if(id>2.5) m.alb=vec3(0.88,0.85,0.79)*(0.93+0.1*k);
    stucco(p*2.5, n, 0.0012);
  } else if(id<2.5){
    vec2 tl=p.xz/0.42; vec2 ti=floor(tl), tf=fract(tl);
    float gr=min(min(tf.x,1.0-tf.x),min(tf.y,1.0-tf.y))*0.42;
    float hv=h31(vec3(ti,3.0));
    m.alb=mix(vec3(0.50,0.24,0.15),vec3(0.62,0.33,0.21),hv)*(0.82+0.32*fbm(vec3(p.xz*5.0,1.0)));
    m.spec=0.035; m.rough=0.035+0.03*h31(vec3(ti,9.0));
    n=normalize(n+(h33(vec3(ti,5.0))-0.5)*vec3(0.014,0.0,0.014));
    if(gr<0.007){ m.alb=vec3(0.42,0.36,0.30); m.spec=0.0; }
  } else if(id<4.5){ m.alb=vec3(0.80,0.10,0.36)*(0.85+0.3*h31(p*40.0)); m.trans=0.9; }
  else if(id<5.5){ m.alb=vec3(0.07,0.16,0.05)*(0.8+0.5*h31(p*40.0)); m.trans=0.35; }
  else if(id<6.5){ m.alb=vec3(0.92,0.32,0.14); m.trans=0.9; }
  else { float g=fbm(vec3(p.x*1.5,p.y*20.0,p.z*20.0)); m.alb=vec3(0.58,0.64,0.53)*(0.9+0.2*g); }
  return m;
}
void camera(vec2 uv, out vec3 ro, out vec3 rd){
  ro=vec3(-0.70,1.45,-8.1);
  float shift=SHIFT, yaw=0.15;
  vec3 d=normalize(vec3(uv.x, uv.y+shift, 1.18*FRAME));
  rd=vec3(d.x*cos(yaw)+d.z*sin(yaw), d.y, -d.x*sin(yaw)+d.z*cos(yaw));
}`,
  },

  // ------------------------------------------------------------------ FACADE
  // A symmetric whitewashed house front in raking morning light: sage shutters, an arched
  // door, two clipped bay trees in terracotta pots, bougainvillea climbing the right side.
  facade: {
    sun: [12.0, -1.80], exposure: 0.62, haze: 0.7, sigP: 0.03, denoiseS: 2,
    glsl: /* glsl */ `
#define MAXD 160.0
#define FRAME 1.036
#define SHIFT 0.175
#define SUNI 15.0
#define SUNTINT vec3(1.0,0.84,0.68)
#define SUNSOFT 0.005
#define ENVK 0.85
${ENV({ camH: 400, cloud: 0.16, mtn: 'vec4(9.0,9.1,0.0,0.0)', cliff: 'vec4(9.0,9.1,0.0,0.0)' })}
${STUCCO}
float region(vec3 p){
  float d=sdEll(p-vec3(4.75,1.6,-0.22), vec3(0.55,1.7,0.30));
  d=min(d, sdEll(p-vec3(4.2,4.2,-0.2), vec3(0.75,1.1,0.28)));
  d=min(d, sdEll(p-vec3(3.6,5.75,-0.2), vec3(1.35,0.55,0.30)));
  d=min(d, sdEll(p-vec3(2.1,6.15,-0.16), vec3(1.1,0.32,0.26)));
  d=min(d, sdEll(p-vec3(3.25,5.15,-0.18), vec3(0.45,0.5,0.22)));
  return d+(vnoise(p*2.6)-0.5)*0.45+(vnoise(p*8.0)-0.5)*0.12;
}
${BLOOM('sdBox(p-vec3(3.5,3.3,-0.2),vec3(2.4,3.4,0.5))', [0.075, 0.06, 0.05])}
// shutter leaf: local u across (0..W), v up (0..H), w thickness
float leaf(vec3 q, float W, float H, float louvre){
  vec3 c=q-vec3(W*0.5,H*0.5,0.0);
  float outer=sdBox(c,vec3(W*0.5,H*0.5,0.022));
  float inner=sdBox(c,vec3(W*0.5-0.045,H*0.5-0.05,0.05));
  float fr=max(outer,-inner);
  float sl;
  if(louvre>0.5){
    vec3 z=c; z.y=mod(z.y+0.0275,0.055)-0.0275;
    vec2 r=mat2(0.707,-0.707,0.707,0.707)*z.yz;
    sl=max(sdBox(vec3(z.x,r),vec3(W*0.5-0.04,0.0035,0.026)), inner+0.002);
  } else { sl=max(sdBox(c,vec3(W*0.5,H*0.5,0.008)), inner); }
  return min(fr,sl);
}
float shutterPair(vec3 p, float cx, float y0, float hw, float H, float ang, float lv){
  vec3 q=p-vec3(cx,y0,0.0);
  float sx=sign(q.x); q.x=abs(q.x);
  // hinge at x=hw, z=0 ; leaf swings outward by ang (0 = closed in plane, pi = flat against wall)
  vec3 l=q-vec3(hw,0.0,-0.03);
  float ca=cos(ang), sa=sin(ang);
  // leaf direction when closed is -x (toward centre); rotate about y
  vec3 ld=vec3(-l.x*ca - l.z*sa, l.y, l.x*sa - l.z*ca);
  return leaf(vec3(ld.x, ld.y, ld.z), hw, H, lv);
}
vec2 map(vec3 p){
  vec2 r=vec2(1e9,0.0);
  float wall=sdBox(p-vec3(0.0,3.15,0.3), vec3(14.0,3.15,0.3));
  float door=sdArch(p.xy,0.8,2.3);
  wall=max(wall,-max(door,p.z-0.36));
  vec2 wq=vec2(abs(p.x)-3.0,p.y);
  float win=sdBox2(wq-vec2(0.0,1.875),vec2(0.55,0.875));
  wall=max(wall,-max(win,p.z-0.24));
  vec2 uq=vec2(abs(p.x)<1.5?p.x:abs(p.x)-3.0,p.y);
  float uw=sdBox2(uq-vec2(0.0,4.6),vec2(0.45,0.72));
  wall=max(wall,-max(uw,p.z-0.12));
  if(wall<r.x) r=vec2(wall,1.0);
  float cop=sdBox(p-vec3(0.0,6.36,0.25),vec3(14.2,0.07,0.33))-0.012; if(cop<r.x) r=vec2(cop,1.0);
  float band=sdBox(p-vec3(0.0,3.52,-0.01),vec3(14.0,0.035,0.03))-0.005; if(band<r.x) r=vec2(band,1.0);
  float sill=sdBox(vec3(abs(p.x)-3.0,p.y-0.96,p.z+0.03),vec3(0.66,0.04,0.06))-0.008; if(sill<r.x) r=vec2(sill,3.0);
  float gnd=p.y; if(gnd<r.x) r=vec2(gnd,2.0);
  float step=sdBox(p-vec3(0.0,0.07,-0.35),vec3(1.15,0.07,0.36))-0.01; if(step<r.x) r=vec2(step,3.0);
  float leafD=max(sdArch(p.xy,0.8,2.3)+0.0, abs(p.z-0.39)-0.03); if(leafD<r.x) r=vec2(leafD,7.0);
  float glass=max(win, abs(p.z-0.25)-0.01); if(glass<r.x) r=vec2(glass,8.0);
  float sh=shutterPair(p,-3.0,1.0,0.55,1.75,2.55,1.0); sh=min(sh,shutterPair(p,3.0,1.0,0.55,1.75,2.55,1.0));
  // upper shutters closed (in plane, slightly recessed)
  float us=1e9;
  for(int i=-1;i<=1;i++){ vec3 q=p-vec3(float(i)*3.0,3.88,0.12); q.x=abs(q.x); us=min(us, leaf(vec3(0.45-q.x,q.y,q.z), 0.45, 1.44, 1.0)); }
  sh=min(sh,us);
  if(sh<r.x) r=vec2(sh,7.0);
  // pots + clipped bay balls
  vec3 pq=vec3(abs(p.x)-1.55,p.y,p.z+0.55);
  float pr=0.27+0.07*clamp(pq.y/0.62,0.0,1.0);
  float pot=max(length(pq.xz)-pr, abs(pq.y-0.31)-0.31); pot=min(pot, max(length(pq.xz)-pr-0.03, abs(pq.y-0.6)-0.04));
  if(pot<r.x) r=vec2(pot,9.0);
  float ball=length(pq-vec3(0.0,1.12,0.0))-0.46;
  if(ball<0.12) ball+= (fbm(pq*14.0)-0.5)*0.06;
  float stem=max(length(pq.xz)-0.025, abs(pq.y-0.7)-0.12);
  ball=min(ball,stem);
  if(ball<r.x) r=vec2(ball*0.8,5.0);
  vec2 bl=bloom(p); if(bl.x<r.x) r=bl;
  return r;
}
float gobo(vec3 p, vec3 L){ return 1.0; }
Mat material(float id, vec3 p, inout vec3 n, vec3 rd){
  Mat m; m.spec=0.0; m.rough=0.0; m.trans=0.0; m.emit=vec3(0.0);
  if(id<1.5 || (id>2.5&&id<3.5)){
    float k=fbm(p*1.6);
    m.alb=vec3(0.90,0.885,0.85)*(0.95+0.07*k);
    if(id>2.5) m.alb=vec3(0.86,0.83,0.78);
    vec3 e=vec3(0.006,0.0,0.0);
    float b0=fbm(p*7.0)+0.35*fbm(p*40.0);
    vec3 gb=vec3(fbm((p+e.xyy)*7.0)+0.35*fbm((p+e.xyy)*40.0)-b0, fbm((p+e.yxy)*7.0)+0.35*fbm((p+e.yxy)*40.0)-b0, fbm((p+e.yyx)*7.0)+0.35*fbm((p+e.yyx)*40.0)-b0)/0.006;
    n=normalize(n-0.0045*gb);
  } else if(id<2.5){
    vec2 tl=p.xz/vec2(0.9,0.6); tl.x+=0.5*floor(tl.y); vec2 ti=floor(tl), tf=fract(tl);
    float gr=min(min(tf.x,1.0-tf.x)*0.9,min(tf.y,1.0-tf.y)*0.6);
    float hv=h31(vec3(ti,3.0));
    m.alb=mix(vec3(0.70,0.60,0.48),vec3(0.80,0.71,0.58),hv)*(0.85+0.25*fbm(vec3(p.xz*4.0,1.0)));
    n=normalize(n+(h33(vec3(ti,5.0))-0.5)*vec3(0.02,0.0,0.02));
    if(gr<0.008) m.alb*=0.6;
  } else if(id<4.5){ m.alb=vec3(0.80,0.10,0.36)*(0.85+0.3*h31(p*40.0)); m.trans=0.9; }
  else if(id<5.5){ m.alb=vec3(0.07,0.16,0.05)*(0.8+0.5*h31(p*40.0)); m.trans=0.35; if(length(vec2(abs(p.x)-1.55,p.z+0.55))<0.6 && p.y<1.7 && p.y>0.6) m.alb=vec3(0.13,0.22,0.09)*(0.8+0.4*fbm(p*20.0)); }
  else if(id<6.5){ m.alb=vec3(0.92,0.32,0.14); m.trans=0.9; }
  else if(id<7.5){ m.alb=vec3(0.42,0.52,0.42)*(0.92+0.12*fbm(vec3(p.x*40.0,p.y*2.0,p.z*40.0))); m.spec=0.03; m.rough=0.2; }
  else if(id<8.5){ m.alb=vec3(0.02,0.025,0.03); m.spec=0.05; m.rough=0.0; }
  else { m.alb=vec3(0.66,0.33,0.20)*(0.85+0.25*fbm(p*9.0)); }
  return m;
}
void camera(vec2 uv, out vec3 ro, out vec3 rd){
  ro=vec3(0.0,2.6,-30.0);
  float f=3.05*FRAME;
  rd=normalize(vec3(uv.x, uv.y+SHIFT, f));
}`,
  },

  // ------------------------------------------------------------------ NICHE (product plaques)
  // One arched niche in a lime-washed wall; the product's real icon is set in it as a glazed
  // plaque. Each product gets its own hour: ?v=0 morning louvres, 1 noon leaf-dapple,
  // 2 golden arch-window light, 3 blue hour.
  niche: {
    sun: [30.0, -2.4], exposure: 0.8, haze: 0.8, sigP: 0.01, denoiseS: 3,
    glsl: /* glsl */ `
#define MAXD 60.0
#define FRAME 1.0
#define SHIFT 0.0
#define SUNI 16.0
#define SUNTINT vec3(1.0,0.9,0.78)
#define SUNSOFT 0.006
#define ENVK 1.0
${ENV({ camH: 400, cloud: 0.0, mtn: 'vec4(9.0,9.1,0.0,0.0)', cliff: 'vec4(9.0,9.1,0.0,0.0)' })}
${STUCCO}
vec2 plaqueHalf(){ return uVariant==3 ? vec2(0.36,0.12) : vec2(0.235,0.235); }
float plaqueR(){ return uVariant==3 ? 0.012 : (uVariant==2 ? 0.088 : 0.10); }
const vec3 PC=vec3(0.0,0.47,0.305);
vec2 map(vec3 p){
  vec2 r=vec2(1e9,0.0);
  float wb=sdBox(p-vec3(0.0,0.5,0.3), vec3(6.0,4.0,0.3));
  float ar=max(sdArch(p.xy,0.42,0.62), -p.y);
  float cut=max(ar, p.z-0.32);
  float kk=0.018; float wa=-cut; float hh=clamp(0.5-0.5*(wa-wb)/kk,0.0,1.0); float wall=mix(wa,wb,hh)+kk*hh*(1.0-hh);
  if(wall<r.x) r=vec2(wall,1.0);
  float ledge=sdBox(p-vec3(0.0,-0.035,-0.03),vec3(0.52,0.035,0.06))-0.006; if(ledge<r.x) r=vec2(ledge,3.0);
  vec2 hp=plaqueHalf(); float rr=plaqueR();
  float d2=sdBox2(p.xy-PC.xy, hp-rr)-rr;
  float pl=max(d2, abs(p.z-PC.z)-0.014)-0.003;
  if(pl<r.x) r=vec2(pl,9.0);
  return r;
}
float gobo(vec3 p, vec3 L){
  if(L.z>-0.01) return 1.0;
  float t=(-2.5-p.z)/L.z; vec2 q=(p+L*t).xy;
  if(uVariant==0){ // a louvred shutter, half open, somewhere to the left
    float st=smoothstep(0.35,0.65,fract(q.y*9.0+0.2));
    float win=smoothstep(0.02,-0.02,sdBox2(q-vec2(-2.3,2.2),vec2(1.2,2.0)));
    return mix(1.0, st, win*0.92);
  } else if(uVariant==1){ // leaves overhead
    float n=fbm(vec3(q*2.4,1.0))+0.35*fbm(vec3(q*7.0,3.0));
    return mix(0.08,1.0,smoothstep(0.62,0.70,n));
  } else if(uVariant==2){ // light through an arched window across the street, landing beside the niche
    vec3 c0=vec3(0.0,0.5,0.0); float t0=(-2.5-c0.z)/L.z; vec2 q0=(c0+L*t0).xy;
    vec2 r=q-q0;
    float a=sdArch(r-vec2(-0.3,-0.55),0.5,0.75); a=max(a,-(r.y+0.55));
    return smoothstep(0.02,-0.02,a);
  }
  return 1.0;
}
Mat material(float id, vec3 p, inout vec3 n, vec3 rd){
  Mat m; m.spec=0.0; m.rough=0.0; m.trans=0.0; m.emit=vec3(0.0);
  if(id<3.5){
    vec3 tint = uVariant==0 ? vec3(0.90,0.885,0.86) : uVariant==1 ? vec3(0.86,0.78,0.64) : uVariant==2 ? vec3(0.88,0.70,0.62) : vec3(0.66,0.71,0.63);
    float k=fbm(p*3.0);
    m.alb=tint*(0.93+0.1*k);
    if(id>2.5) m.alb*=0.95;
    stucco(p*4.0, n, 0.0012);
  } else {
    vec2 hp=plaqueHalf();
    vec2 uv=(p.xy-PC.xy)/(2.0*hp)+0.5;
    vec4 tx=texture(uLogo, uv);
    vec3 lin=pow(tx.rgb,vec3(2.2));
    vec3 base=pow(texture(uLogo, vec2(0.5,0.1)).rgb,vec3(2.2)); // edge colour of the icon itself, so rounded corners never show a fringe
    float onFace = step(p.z, PC.z-0.012);
    m.alb=mix(base, lin, tx.a*onFace);
    m.spec=0.05; m.rough=0.02;
  }
  return m;
}
void camera(vec2 uv, out vec3 ro, out vec3 rd){
  ro=vec3(0.0,0.5,-6.0);
  rd=normalize(vec3(uv.x, uv.y+SHIFT, 3.7*FRAME));
}`,
  },
};
