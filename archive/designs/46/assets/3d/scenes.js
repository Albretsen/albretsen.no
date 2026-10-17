// Scenes for the clay engine. Each scene = GLSL (map + sky) + camera uniforms + textures.
// BLINK is the mascot: a squishy butter-yellow clay camera whose lens is its one big eye.

export const BLINK = /* glsl */`
// Blink, local space: feet on y=0, facing +z, ~1.15 tall.
Hit blinkCore(vec3 p, vec2 look, float lid, float squash){
  float sq = 1.0 + squash*0.14;
  p.y /= sq; p.xz /= mix(1.0, 1.0/sq, 0.6);
  p.x += sin(p.y*2.2)*0.012;                       // hand-made asymmetry
  // body pillow + belly squish
  Hit h = H(sdBox(p-vec3(0,0.64,0), vec3(0.64,0.42,0.38), 0.30), BUTTER, 0.);
  h = S(h, H(sdEll(p-vec3(0,0.34,0.0), vec3(0.62,0.24,0.38)), BUTTER, 0.), 0.16);
  // feet
  h = S(h, H(sdEll(p-vec3( 0.30,0.09,0.10), vec3(0.20,0.11,0.25)), APRICOT, 0.), 0.07);
  h = S(h, H(sdEll(p-vec3(-0.30,0.09,0.10), vec3(0.20,0.11,0.25)), APRICOT, 0.), 0.07);
  // viewfinder hump (mint) + shutter button (cherry gloss) + flash window
  h = S(h, H(sdBox(p-vec3(-0.27,1.07,-0.02), vec3(0.22,0.10,0.22), 0.09), MINT, 0.), 0.035);
  h = S(h, H(sdCyl(p-vec3(0.36,1.06,0.02), 0.11, 0.06, 0.04), CHERRY, 4.), 0.04);
  h = U(h, H(sdBox(p-vec3(0.40,0.92,0.36), vec3(0.11,0.065,0.05), 0.04), WHITE, 4.));
  // cheeks
  h = S(h, H(sdEll(p-vec3( 0.47,0.44,0.34), vec3(0.10,0.065,0.05)), GUM, 0.), 0.04);
  h = S(h, H(sdEll(p-vec3(-0.47,0.44,0.34), vec3(0.10,0.065,0.05)), GUM, 0.), 0.04);
  // lens barrel, ring, glass (the eye)
  vec3 lp = p-vec3(0,0.64,0.36);
  lp.xz *= rot(-look.x*0.18); lp.yz *= rot(look.y*0.18);
  h = S(h, H(sdCyl(lp.xzy-vec3(0,0,0.05), 0.37, 0.11, 0.06), APRICOT, 0.), 0.05);
  h = U(h, H(sdTorus(lp-vec3(0,0,0.17), vec2(0.29,0.058)), GUM, 4.));
  float glass = sdEll(lp-vec3(0,0,0.13), vec3(0.262,0.262,0.115));
  h = U(h, H(glass, INK, 1.));
  // eyelid: a butter clay cap that slides down over the glass
  float ly = mix(0.30, -0.30, lid);
  float lidD = max(sdEll(lp-vec3(0,0,0.13), vec3(0.28,0.28,0.135)), -(lp.y-ly));
  h = U(h, H(lidD, BUTTER, 0.));
  return h;
}
`;

const SKY_DAWN = /* glsl */`
vec3 sky(vec3 rd){
  float y = rd.y;
  vec3 top = mix(LILAC, SKY, 0.35)*0.95;
  vec3 mid = mix(GUM, APRICOT, 0.55);
  vec3 low = mix(BUTTER, CREAM, 0.3);
  vec3 c = mix(low*1.1, mid, smoothstep(0.0, 0.25, y));
  c = mix(c, top, smoothstep(0.2, 0.6, y));
  c += BUTTER*0.35*exp(-max(y,0.)*9.)*smoothstep(-0.2,0.0,y);   // horizon glow
  return c*1.05;
}
`;

const SKY_FLAT = (a, b) => /* glsl */`
vec3 sky(vec3 rd){ return mix(${a}, ${b}, smoothstep(-0.3, 0.6, rd.y)); }
`;

// --- hero: Blink on a dawn stage, big clay sun, clouds, candy sprinkles
const HERO = SKY_DAWN + BLINK + /* glsl */`
Hit sprinkle(vec3 p, vec3 c, vec3 ax, float len, vec3 col){
  return H(sdCapsule(p-c, -ax*len, ax*len, 0.045), col, 4.);
}
Hit map(vec3 p){
  Hit h = H(p.y, mix(CREAM, APRICOT, 0.12), 3.);                 // floor
  h = U(h, blinkCore(p, uLook, uLid, uSquash));
  // dawn: a giant clay sun half-risen over the horizon
  h = U(h, H(sdSphere(p-vec3(2.6,-0.6,-16.0), 4.6), mix(TANGERINE*1.1, BUTTER, smoothstep(-0.5,3.6,p.y)), 0.));
  // waving arm (loud and proud) + arm on hip
  h = S(h, H(sdCapsule(p, vec3(-0.6,0.74,0.02), vec3(-0.86,1.08,0.14), 0.1), BUTTER, 0.), 0.07);
  h = S(h, H(sdSphere(p-vec3(-0.9,1.14,0.16), 0.13), BUTTER, 0.), 0.05);
  h = S(h, H(sdCapsule(p, vec3(0.6,0.62,0.05), vec3(0.86,0.45,0.18), 0.085), BUTTER, 0.), 0.06);
  h = S(h, H(sdSphere(p-vec3(0.86,0.42,0.22), 0.1), BUTTER, 0.), 0.04);
  // clouds: three blobs smooth-unioned
  vec3 q = p-vec3(-2.1,1.95,-2.4);
  float cl = sdSphere(q, 0.42);
  cl = smin(cl, sdSphere(q-vec3(0.45,-0.12,0.05), 0.32), 0.18);
  cl = smin(cl, sdSphere(q-vec3(-0.42,-0.16,0.0), 0.28), 0.18);
  cl = smin(cl, sdEll(q-vec3(0.0,-0.28,0.0), vec3(0.85,0.16,0.3)), 0.15);
  h = U(h, H(cl, WHITE, 0.));
  vec3 q2 = p-vec3(2.3,1.55,-2.2);
  float c2 = sdSphere(q2,0.26); c2=smin(c2,sdSphere(q2-vec3(0.3,-0.06,0.),0.2),0.12); c2=smin(c2,sdEll(q2-vec3(0.1,-0.17,0.),vec3(0.55,0.1,0.2)),0.1);
  h = U(h, H(c2, WHITE, 0.));
  // candy sprinkles & a donut
  h = U(h, sprinkle(p, vec3(-1.15,0.06,0.9), normalize(vec3(1,0,0.4)), 0.12, GUM));
  h = U(h, sprinkle(p, vec3(1.25,0.06,0.7), normalize(vec3(1,0,-0.7)), 0.12, MINT));
  h = U(h, sprinkle(p, vec3(-1.55,0.75,0.5), normalize(vec3(1,0.6,0.2)), 0.11, LILAC));
  h = U(h, sprinkle(p, vec3(0.95,1.6,0.3), normalize(vec3(1,-0.7,0.1)), 0.11, CHERRY));
  h = U(h, sprinkle(p, vec3(1.45,0.55,0.9), normalize(vec3(0.3,1,0.2)), 0.10, SKY));
  vec3 dp = p-vec3(-1.35,0.16,0.25); dp.yz*=rot(1.35); dp.xy*=rot(0.2);
  h = U(h, H(sdTorus(dp, vec2(0.17,0.085)), GUM, 4.));
  vec3 bp = p-vec3(1.15,0.15,0.0);
  h = U(h, H(sdSphere(bp, 0.15), MINT, 4.));
  h = U(h, H(sdSphere(p-vec3(-0.6,0.08,1.25), 0.08), APRICOT, 4.));
  return h;
}
`;

// --- portrait: Blink alone, tight, for cut-outs and avatars
const PORTRAIT = SKY_DAWN + BLINK + /* glsl */`
Hit map(vec3 p){
  Hit h = H(p.y, PAPER*0.95, 3.);
  h = U(h, blinkCore(p, uLook, uLid, uSquash));
  return h;
}
`;

// --- product: Blink holds up an app tile with the REAL logo (uTex0), plus product props
const tileFn = (size = 0.5, thick = 0.07) => /* glsl */`
Hit tile(vec3 p, vec3 c, float ang){
  vec3 q = p-c; q.xz *= rot(ang); q.yz *= rot(-0.08);
  float d = sdBox(q, vec3(${size}, ${size}, ${thick}), ${(size * 0.225).toFixed(3)});
  vec3 col = uTile.rgb; float m = 2.;
  if(q.z > ${thick}-0.02){
    vec2 uv = q.xy/(2.*${size}) + 0.5;
    vec4 tx = textureLod(uTex0, uv, 0.5);
    col = mix(col, lin(tx.rgb), tx.a);
  }
  return H(d, col, m);
}
`;
const productScene = (props, opts = {}) => /* glsl */`
vec3 sky(vec3 rd){ vec3 c = mix(${opts.a}, ${opts.b}, smoothstep(-0.02, 0.55, rd.y)); return c; }
` + BLINK + tileFn() + /* glsl */`
Hit map(vec3 p){
  Hit h = H(p.y, ${opts.a}, 3.);
  // Blink stands on the left, turned toward the tile it proudly presents
  vec3 bp = p-vec3(-0.55,0.0,-0.05); bp.xz *= rot(0.22);
  h = U(h, blinkCore(bp, uLook, uLid, 0.0));
  h = U(h, tile(p, vec3(0.72,0.98,0.25), 0.28));
  // arm reaching to the tile edge, other arm cheering
  h = S(h, H(sdCapsule(p, vec3(-0.02,0.66,0.12), vec3(0.2,0.86,0.36), 0.09), BUTTER, 0.), 0.06);
  h = S(h, H(sdSphere(p-vec3(0.24,0.88,0.38), 0.11), BUTTER, 0.), 0.04);
  h = S(h, H(sdCapsule(p, vec3(-1.08,0.6,0.18), vec3(-1.16,0.42,0.34), 0.09), BUTTER, 0.), 0.06);
  h = S(h, H(sdSphere(p-vec3(-1.16,0.39,0.36), 0.105), BUTTER, 0.), 0.04);
  ${props}
  return h;
}
`;

const PROPS = {
  'mcp-emails': /* glsl */`
    // clay envelopes fluttering out: flat rounded slabs with a folded flap ridge
    for(int i=0;i<3;i++){
      float fi=float(i);
      vec3 c = vec3(1.35+fi*0.1, 0.3+fi*0.6, 0.45-fi*0.45);
      vec3 q = p-c; q.xy*=rot(0.35-fi*0.3); q.xz*=rot(0.5+fi*0.4);
      float e = sdBox(q, vec3(0.26,0.17,0.025), 0.03);
      vec3 fq=q; fq.x=abs(fq.x); float flap = sdCapsule(fq, vec3(0.0,-0.02,0.03), vec3(0.22,0.13,0.03), 0.022);
      h = U(h, H(min(e,flap), i==1? SKY : WHITE, 0.));
    }
    // @ token: torus + bead
    vec3 aq = p-vec3(-1.45,0.12,0.75); aq.yz*=rot(1.45);
    h = U(h, H(sdTorus(aq, vec2(0.16,0.06)), MINT, 4.));
    h = U(h, H(sdSphere(p-vec3(0.55,0.09,0.95),0.09), GUM, 4.));
  `,
  'fun-libs': /* glsl */`
    // speech bubble with blank "____" pills (fill-in-the-blanks)
    vec3 q = p-vec3(-1.15,1.75,-0.35); q.xy*=rot(0.1); q.xz*=rot(0.25);
    float b = sdBox(q, vec3(0.42,0.25,0.07), 0.2);
    b = smin(b, sdEll(q-vec3(0.2,-0.27,0.0), vec3(0.09,0.14,0.06)), 0.1);
    h = U(h, H(b, WHITE, 0.));
    h = U(h, H(sdCapsule(q-vec3(0,0.07,0.08), vec3(-0.22,0,0), vec3(0.22,0,0), 0.035), GUM, 4.));
    h = U(h, H(sdCapsule(q-vec3(0,-0.07,0.08), vec3(-0.22,0,0), vec3(0.04,0,0), 0.035), LILAC, 4.));
    // letter-dice blocks on the floor
    for(int i=0;i<3;i++){ float fi=float(i);
      vec3 c=vec3(1.25+fi*0.3,0.13+(i==2?0.26:0.0),0.75-fi*0.15+(i==2?-0.1:0.)); if(i==2) c.x=1.4;
      vec3 bq=p-c; bq.xz*=rot(0.4+fi); h=U(h,H(sdBox(bq,vec3(0.13),0.05), i==0?MINT:(i==1?GUM:SKY), 0.)); }
  `,
  'toolrails': /* glsl */`
    // modular clay blocks clicking together, like tools snapping into one socket
    for(int i=0;i<4;i++){ float fi=float(i);
      vec3 c=vec3(1.3+mod(fi,2.)*0.36, 0.14+floor(fi/2.)*0.29, 0.6-mod(fi,2.)*0.1);
      vec3 q=p-c; q.xz*=rot(0.25);
      float d=sdBox(q,vec3(0.16,0.13,0.16),0.05);
      d=min(d, sdCyl(q-vec3(0,0.15,0),0.06,0.04,0.02));
      h=U(h,H(d, i==0?BUTTER:(i==1?LILAC:(i==2?MINT:GUM)), 0.)); }
    // a plug on a coiled clay cable
    vec3 cq=p-vec3(-1.35,0.1,0.75);
    h=U(h,H(sdTorus(cq.xzy, vec2(0.2,0.045)), CHERRY, 4.));
    h=U(h,H(sdBox(p-vec3(-1.35,0.2,1.02), vec3(0.09,0.09,0.11), 0.04), CREAM, 0.));
    h=U(h,H(sdCapsule(p, vec3(-1.39,0.22,1.12), vec3(-1.39,0.22,1.24), 0.022), COCOA, 4.));
    h=U(h,H(sdCapsule(p, vec3(-1.31,0.22,1.12), vec3(-1.31,0.22,1.24), 0.022), COCOA, 4.));
  `,
  'harbor': /* glsl */`
    // a stack of clay books (the shared knowledge), one open on top with a bookmark
    for(int i=0;i<4;i++){ float fi=float(i);
      vec3 q=p-vec3(1.45,0.07+fi*0.135,0.6); q.xz*=rot(0.2*sin(fi*2.3)+0.3);
      h=U(h,H(sdBox(q,vec3(0.3-fi*0.02,0.06,0.21),0.035), i==0?LILAC:(i==1?MINT:(i==2?GUM:SKY)), 0.));
      h=U(h,H(sdBox(q-vec3(0.02,0.,0.),vec3(0.29-fi*0.02,0.045,0.205),0.02), CREAM, 0.));
    }
    vec3 bq=p-vec3(1.45,0.6,0.58); bq.xz*=rot(0.3);
    h=U(h,H(sdBox(bq-vec3(-0.13,0.0,0.0)*1.0, vec3(0.14,0.018,0.2),0.012)-0.0, WHITE, 0.));
    h=U(h,H(sdBox((bq-vec3(0.13,0.0,0.0)), vec3(0.14,0.018,0.2),0.012), WHITE, 0.));
    h=U(h,H(sdBox(bq-vec3(0.05,-0.05,0.24), vec3(0.025,0.08,0.01),0.008), CHERRY, 4.));
    // a little clay key = held for approval
    vec3 kq=p-vec3(-1.35,0.06,0.85); kq.xz*=rot(0.6);
    h=U(h,H(min(sdTorus(kq.xzy-vec3(-0.15,0,0), vec2(0.09,0.035)), sdCapsule(kq, vec3(-0.06,0,0), vec3(0.22,0,0), 0.035)), BUTTER, 4.));
  `,
};

// --- retired tokens: six clay coins with embossed glyphs, laid out on a grid
const TOKENS = SKY_FLAT('CREAM', 'PAPER') + /* glsl */`
float glyph(vec2 q, int k){
  // 2D glyph SDFs in unit space (coin radius ~0.36)
  if(k==0){ // Polyglot Pilot: two overlapping speech bubbles
    float a = length(q-vec2(-0.07,0.05))-0.15; float b = length(q-vec2(0.09,-0.06))-0.12; return min(a,b); }
  if(k==1){ // PinPoint: map pin
    float c=length(q-vec2(0,0.07))-0.14; float ves=max(length(vec2(abs(q.x)+0.12,q.y+0.0))-0.21, q.y-0.05);
    return max(min(c,ves), -(length(q-vec2(0,0.07))-0.055)); }
  if(k==2){ // WebVakt: watchful eye
    float e = max(length(q-vec2(0,-0.2))-0.3, length(q-vec2(0,0.2))-0.3); return e; }
  if(k==3){ // Joke Central: laughing face
    vec2 e=vec2(abs(q.x)-0.09,q.y-0.08); float eyes=length(e*vec2(1.,0.7))-0.035;
    float m=length(q-vec2(0,-0.0))-0.15; m=max(m, q.y+0.02); return min(eyes,m); }
  if(k==4){ // Tryggere Hyring: shield
    float top=max(abs(q.x)-0.16, q.y-0.17); float ves=length(vec2(abs(q.x)+0.13,q.y-0.06))-0.3; return max(top,ves); }
  // early apps: percent sign
  float d1=length(q-vec2(-0.1,0.1))-0.055; float d2=length(q-vec2(0.1,-0.1))-0.055;
  vec2 s=q*mat2(0.707,-0.707,0.707,0.707); float sl=max(abs(s.x)-0.03, abs(s.y)-0.2);
  return min(min(d1,d2),sl);
}
Hit coin(vec3 p, vec3 c, int k, vec3 col){
  vec3 q=p-c; q.yz*=rot(-1.05);  // tilt toward camera
  float d = sdCyl(q, 0.36, 0.07, 0.05);
  float g = glyph(q.xz*vec2(1,-1), k);
  float emb = max(g, abs(q.y-0.075)-0.035);    // raised glyph
  emb = smin(emb, max(g, abs(q.y-0.06)-0.03), 0.02);
  float rim = max(abs(length(q.xz)-0.3)-0.025, abs(q.y-0.07)-0.03);
  Hit h = H(d, col, 0.);
  h = S(h, H(min(emb, rim), WHITE*0.95, 0.), 0.015);
  return h;
}
Hit map(vec3 p){
  Hit h = H(p.y+0.02, PAPER*0.95, 3.);
  h = U(h, coin(p, vec3(-0.95, 0.38, 0.0), 0, LILAC));
  h = U(h, coin(p, vec3( 0.00, 0.38, 0.0), 1, CHERRY*0.9+GUM*0.1));
  h = U(h, coin(p, vec3( 0.95, 0.38, 0.0), 2, MINT));
  h = U(h, coin(p, vec3(-0.95, 0.38, -1.0), 3, BUTTER));
  h = U(h, coin(p, vec3( 0.00, 0.38, -1.0), 4, SKY));
  h = U(h, coin(p, vec3( 0.95, 0.38, -1.0), 5, APRICOT));
  return h;
}
`;

// --- props sheet: individual clay objects for decorating the site (rendered as cut-outs)
const propScene = body => SKY_FLAT('CREAM', 'BUTTER') + BLINK + `Hit map(vec3 p){ Hit h = H(p.y, PAPER, 3.); ${body} return h; }`;
const PROP_BODIES = {
  sun: `vec3 q=p-vec3(0,1.0,0); h=U(h,H(sdSphere(q,0.62), mix(APRICOT,BUTTER,0.3), 0.));
        for(int i=0;i<10;i++){ float a=float(i)/10.*6.2832; vec3 r=q-vec3(cos(a),sin(a),0.)*0.92; r.xy*=rot(-a);
          h=S(h,H(sdEll(r,vec3(0.16,0.09,0.09)), BUTTER, 0.),0.02); }
        h=U(h,H(sdEll(q-vec3(-0.2,0.08,0.58),vec3(0.06,0.09,0.04)),INK,4.)); h=U(h,H(sdEll(q-vec3(0.2,0.08,0.58),vec3(0.06,0.09,0.04)),INK,4.));
        h=U(h,H(sdArc((q-vec3(0,-0.1,0.6))*vec3(1,-1,1), vec2(0.8,0.6), 0.17, 0.035), INK, 4.));
        h=S(h,H(sdEll(q-vec3(-0.36,-0.1,0.5),vec3(0.09,0.05,0.04)),GUM,0.),0.03); h=S(h,H(sdEll(q-vec3(0.36,-0.1,0.5),vec3(0.09,0.05,0.04)),GUM,0.),0.03);`,
  cloud: `vec3 q=p-vec3(0,0.9,0); float c=sdSphere(q,0.5); c=smin(c,sdSphere(q-vec3(0.55,-0.15,0.05),0.38),0.2);
          c=smin(c,sdSphere(q-vec3(-0.52,-0.18,0.),0.34),0.2); c=smin(c,sdEll(q-vec3(0.,-0.33,0.),vec3(1.0,0.2,0.36)),0.18);
          h=U(h,H(c,WHITE,0.));`,
  print: `vec3 q=p-vec3(0,0.85,0); q.xy*=rot(-0.18); q.xz*=rot(0.25);
         float card=sdBox(q,vec3(0.46,0.55,0.035),0.05);
         float win=sdBox(q-vec3(0,0.1,0.04),vec3(0.38,0.37,0.02),0.025);
         vec3 pc = mix(mix(APRICOT,GUM,0.4), mix(LILAC,SKY,0.5), smoothstep(-0.2,0.45,q.y));
         float sunD = length(q.xy-vec2(0.1,0.02))-0.13;
         if(sunD<0.) pc = BUTTER*1.05;
         if(q.y<-0.08+0.03*sin(q.x*9.)) pc = mix(MINT,SKY,0.3)*0.9;
         h=U(h,H(card,WHITE,0.)); h=U(h,H(max(win,-card-0.0)-0.0, pc, 4.));`,
  heart: `vec3 q=p-vec3(0,0.8,0); q.x=abs(q.x); vec3 r=q-vec3(0.17,0.08,0.); r.xy*=rot(0.62);
          float d=sdEll(r,vec3(0.24,0.4,0.22)); h=U(h,H(d,CHERRY,4.));`,
  star: `vec3 q=p-vec3(0,0.85,0); q.xy*=rot(0.15); float a=atan(q.x,q.y); float r=length(q.xy); float k=0.34+0.2*cos(5.*a);
         float th=0.17*sqrt(clamp(1.-r/(k+0.06),0.,1.))+0.02; float d=max(r-k, abs(q.z)-th)-0.07; h=U(h,H(d*0.5,BUTTER,4.));`,
  lens: `vec3 q=p-vec3(0,0.8,0); h=U(h,H(sdCyl(q.xzy,0.5,0.22,0.06),APRICOT,0.)); h=U(h,H(sdTorus(q-vec3(0,0,0.23),vec2(0.4,0.07)),GUM,4.));
         h=U(h,H(sdEll(q-vec3(0,0,0.2),vec3(0.36,0.36,0.14)),INK,1.));`,
};

export const SCENES = {
  hero: { glsl: HERO, uniforms: { uCamPos: [0.35, 0.95, 4.4], uCamTarget: [0.05, 0.8, 0], uFov: 33, uLook: [0.25, 0.2] } },
  'hero-tall': { glsl: HERO, uniforms: { uCamPos: [0.1, 1.1, 5.5], uCamTarget: [0.0, 0.92, 0], uFov: 36, uLook: [0.15, 0.25] } },
  cutout: { glsl: PORTRAIT, uniforms: { uCamPos: [0.75, 1.0, 3.9], uCamTarget: [0, 0.6, 0], uFov: 30, uLook: [0.3, 0.2], uAlpha: 1, uShadowR: 1.3 } },
  'cutout-wink': { glsl: PORTRAIT, uniforms: { uCamPos: [-0.75, 1.0, 3.9], uCamTarget: [0, 0.6, 0], uFov: 30, uLook: [-0.3, 0.1], uLid: 0.55, uAlpha: 1, uShadowR: 1.3 } },
  'hero-wide': { glsl: HERO, uniforms: { uCamPos: [0.0, 1.1, 6.6], uCamTarget: [0.1, 0.95, 0], uFov: 38, uLook: [-0.2, 0.15] } },
  portrait: { glsl: PORTRAIT, uniforms: { uCamPos: [0.9, 1.0, 3.2], uCamTarget: [0, 0.6, 0], uFov: 30, uLook: [0.3, 0.2] } },
  viewfinder: { glsl: PORTRAIT, textures: { uPhoto: '../photo/dawn-field@2x.webp' },
    uniforms: { uCamPos: [-0.5, 0.75, 3.0], uCamTarget: [0, 0.62, 0], uFov: 30, uFocus: 0.9, uLook: [-0.1, 0.1], uSun: [0.4, 0.6, 0.5] } },
  tokens: { glsl: TOKENS, uniforms: { uCamPos: [0, 3.0, 3.4], uCamTarget: [0, 0.25, -0.5], uFov: 27, uSun: [-0.5, 0.9, 0.5] } },
};
const T = {
  'mcp-emails': ['../../../_shared/products/mcp-emails/icon.png', [0.145, 0.278, 0.898], ['mix(SKY,WHITE,0.25)', 'SKY*0.92']],
  'fun-libs': ['../../../_shared/products/fun-libs/icon.png', [1.0, 0.878, 0.4], ['mix(GUM,WHITE,0.25)', 'GUM*0.9']],
  'toolrails': ['../src/toolrails-512.png', [0.078, 0.078, 0.075], ['mix(MINT,WHITE,0.25)', 'MINT*0.88']],
  'harbor': ['../src/harbor-512.png', [0.106, 0.106, 0.106], ['mix(LILAC,WHITE,0.25)', 'LILAC*0.9']],
};
const MOOD = { 'fun-libs': { uLid: 0.42, uLook: [0.5, -0.1] }, 'harbor': { uLook: [0.2, 0.5] }, 'toolrails': { uLook: [0.6, 0.0] } };
const lin = c => c.map(v => Math.pow(v, 2.2));
for (const [k, [tex, tint, [floor, a]]] of Object.entries(T)) {
  SCENES[k] = { glsl: productScene(PROPS[k], { a: floor, b: a }), textures: { uTex0: tex },
    uniforms: { uCamPos: [0.15, 1.25, 5.0], uCamTarget: [0.1, 0.74, 0], uFov: 35, uTile: [...lin(tint), 1], uLook: [0.35, 0.12], ...(MOOD[k] || {}) } };
}
for (const [k, body] of Object.entries(PROP_BODIES)) {
  SCENES['prop-' + k] = { glsl: propScene(body), uniforms: { uCamPos: [0, 1.0, k === 'sun' ? 4.6 : 3.6], uCamTarget: [0, 0.85, 0], uFov: 34, uAlpha: 1, uShadowR: k === 'sun' ? 1.6 : 1.1 } };
}

// Luma (retired, real wordmark survives): the real logo on a white clay plaque, as a cut-out
SCENES['retired-luma'] = {
  glsl: SKY_FLAT('CREAM', 'PAPER') + /* glsl */`
Hit map(vec3 p){
  Hit h = H(p.y, PAPER, 3.);
  vec3 q = p-vec3(0.,0.42,0.); q.yz *= rot(0.18);
  float d = sdBox(q, vec3(0.95,0.36,0.06), 0.12);
  vec3 col = WHITE; float m = 2.;
  if(q.z > 0.03){
    vec2 uv = (q.xy - vec2(0.,0.0))/vec2(1.5,0.416) + 0.5;
    if(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.){ vec4 tx = textureLod(uTex0, uv, 0.3); col = mix(col, lin(tx.rgb), tx.a); }
  }
  h = U(h, H(d, col, m));
  h = U(h, H(sdSphere(p-vec3(1.12,0.1,0.35),0.1), GUM, 4.));
  return h;
}`,
  textures: { uTex0: '../../../_shared/products/luma/logo.png' },
  uniforms: { uCamPos: [0.2, 1.1, 3.3], uCamTarget: [0, 0.42, 0], uFov: 34, uAlpha: 1, uShadowR: 1.5, uTile: [1, 1, 1, 1] },
};

// single retired-product tokens as transparent cut-outs
export const TOKEN_LIST = [['polyglot-pilot', 0, 'LILAC'], ['pinpoint', 1, 'CHERRY*0.9+GUM*0.1'], ['webvakt', 2, 'MINT'],
  ['joke-central', 3, 'BUTTER'], ['tryggere-hyring', 4, 'SKY'], ['early-apps', 5, 'APRICOT']];
const TOKEN_FUNCS = TOKENS.slice(TOKENS.indexOf('float glyph'), TOKENS.indexOf('Hit map('));
for (const [id, k, col] of TOKEN_LIST) {
  SCENES['token-' + id] = {
    glsl: SKY_FLAT('CREAM', 'PAPER') + TOKEN_FUNCS + `Hit map(vec3 p){ Hit h = H(p.y+0.02, PAPER, 3.); h = U(h, coin(p, vec3(0.,0.38,0.), ${k}, ${col})); return h; }`,
    uniforms: { uCamPos: [0, 1.75, 1.6], uCamTarget: [0, 0.36, 0], uFov: 30, uAlpha: 1, uShadowR: 0.75, uSun: [-0.5, 0.9, 0.5] },
  };
}

// resolve every texture path relative to this module, so scenes work from any page
for (const s of Object.values(SCENES)) if (s.textures) for (const k in s.textures) s.textures[k] = new URL(s.textures[k], import.meta.url).href;
