// Amber Hour sky: a dependency-free WebGL fragment shader that paints the brand's dusk.
// Mauve zenith -> rose -> peach -> pale-gold horizon, a soft sun, drifting haze strata
// (LA smog layers), and dithered film grain so the gradient never bands.
//
//   import { mountSky } from './amber-sky.js'
//   const sky = mountSky(canvas, { hour: 0.6 })   // hour: 0 = blue hour, 0.5 = golden, 1 = sun on the horizon
//   sky.setHour(0.8); sky.setSun(0.62, 0.7); sky.destroy()
//
// Renders at <=1.5 DPR, stops when offscreen, draws a single still frame under
// prefers-reduced-motion. Falls back to a CSS gradient if WebGL is unavailable.

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uHour; uniform vec2 uSun;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
vec3 ramp(float t, vec3 a, vec3 b, vec3 c, vec3 d){
  return t<.45?mix(a,b,t/.45):t<.78?mix(b,c,(t-.45)/.33):mix(c,d,(t-.78)/.22);}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes; uv.y=1.-uv.y;            // 0 top, 1 bottom
  float asp=uRes.x/uRes.y;
  // two palettes: blue hour (cool, before the sun) and amber hour (the brand)
  vec3 zA=vec3(.369,.290,.431), mA=vec3(.788,.518,.471), lA=vec3(.949,.714,.541), hA=vec3(1.,.886,.722);
  vec3 zB=vec3(.165,.173,.290), mB=vec3(.420,.361,.478), lB=vec3(.788,.580,.561), hB=vec3(.973,.792,.651);
  float k=smoothstep(0.,.6,uHour);
  vec3 z=mix(zB,zA,k), m=mix(mB,mA,k), l=mix(lB,lA,k), hz=mix(hB,hA,k);
  float horizon=mix(.98,.86,uHour);
  float y=clamp(uv.y/horizon,0.,1.);
  vec3 col=ramp(y,z,m,l,hz);
  // haze strata drifting sideways
  float strata=fbm(vec2(uv.x*2.2+uTime*.012, uv.y*14.))*smoothstep(.25,.9,uv.y);
  col=mix(col, hz, strata*.22);
  // sun
  vec2 d=vec2((uv.x-uSun.x)*asp, uv.y-uSun.y);
  float r=length(d), R=.045;
  float disc=smoothstep(R*1.03,R*.97,r);
  float halo=exp(-pow(r/(R*6.),2.))*.55+exp(-pow(r/(R*18.),2.))*.25;
  col=mix(col, vec3(1.,.85,.62), halo*mix(.35,1.,k));
  col=mix(col, vec3(1.,.953,.863), disc*smoothstep(.0,.15,uHour));
  // sun cut by the strata near the horizon
  col=mix(col, l, disc*strata*.5);
  // grain + dither (kills banding)
  float g=h21(gl_FragCoord.xy+fract(uTime)*91.)-.5;
  col+=g*(1.6/255.)+g*.018*(1.-abs(y-.5));
  gl_FragColor=vec4(col,1.);
}`;

export function mountSky(canvas, opts = {}) {
  let hour = opts.hour ?? 0.6;
  let sun = opts.sun ?? [0.5, 0.72];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
  if (!gl) {
    canvas.style.background = 'linear-gradient(#5E4A6E,#C98478 45%,#F2B68A 78%,#FFE2B8)';
    return { setHour() {}, setSun() {}, destroy() {} };
  }
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uTime = U('uTime'), uHour = U('uHour'), uSun = U('uSun');

  let raf = 0, visible = true, t0 = performance.now();
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  };
  const draw = () => {
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduce ? 0 : (performance.now() - t0) / 1000);
    gl.uniform1f(uHour, hour); gl.uniform2f(uSun, sun[0], sun[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const loop = () => { draw(); if (visible && !reduce) raf = requestAnimationFrame(loop); };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible) loop(); });
  io.observe(canvas);
  const ro = new ResizeObserver(() => draw()); ro.observe(canvas);
  loop();
  return {
    setHour(v) { hour = Math.max(0, Math.min(1, v)); if (reduce) draw(); },
    setSun(x, y) { sun = [x, y]; if (reduce) draw(); },
    destroy() { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}
