// daylight.js — "The view passes through a day."
// A dependency-free WebGL module. It holds four graded paintings (dawn, morning,
// noon, golden hour) and moves between them with a light-sweep rather than a fade:
// warm light rolls across the scene from the sun's side, the grade drifts from cold
// blue to gold, a few soft rays and dust motes hang in the light.
//
// Usage:
//   import { mountDaylight } from './daylight.js';
//   const day = await mountDaylight(canvas, { views: [dawn, fjord, noon, gold] });
//   day.set(0.42);          // 0 = dawn … 1 = golden hour
//   day.play(true);         // slow automatic day (one cycle per `period` seconds)
//   day.destroy();
// Falls back to returning null when WebGL is missing; show a still instead.

const VERT = `
attribute vec2 p; varying vec2 uv;
void main(){ uv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

const FRAG = `
precision mediump float;
varying vec2 uv;
uniform sampler2D t0,t1,t2,t3;
uniform vec4 a0; // texture aspect ratios (w/h) for the four views
uniform vec2 res;
uniform float tday;   // 0..1 across the day
uniform float time;   // seconds, for motes and grain
uniform vec2 drift;   // parallax offset from pointer/scroll, in uv units

float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }

vec2 cover(vec2 u, float ta){
  float ca = res.x/res.y; vec2 s = vec2(1.);
  if (ca > ta) s.y = ta/ca; else s.x = ca/ta;
  return (u-0.5)*s*0.94 + 0.5 + drift;   // 6% overscan so the parallax never shows an edge
}
vec3 view(int i, vec2 u){
  if(i==0) return texture2D(t0, cover(u,a0.x)).rgb;
  if(i==1) return texture2D(t1, cover(u,a0.y)).rgb;
  if(i==2) return texture2D(t2, cover(u,a0.z)).rgb;
  return texture2D(t3, cover(u,a0.w)).rgb;
}
float lum(vec3 c){ return dot(c, vec3(.2126,.7152,.0722)); }

void main(){
  float seg = clamp(tday,0.,1.)*3.;
  int i = int(min(floor(seg),2.));
  float f = seg - float(i);
  // the sun travels across the top of the arch: left at dawn, high at noon, right at gold
  vec2 sun = vec2(mix(0.18,0.82,tday), 0.92 - sin(tday*3.14159)*0.12);
  // light sweep: the next view arrives first where the light is, with a ragged painterly edge
  float far = clamp(length((uv - sun)*vec2(1.2,1.))/1.25,0.,1.);
  float ragged = (noise(uv*vec2(6.,9.)+time*0.03)-.5)*0.22;
  float m = smoothstep(-0.12, 0.12, f*1.3 - 0.15 - far - ragged);
  vec3 a = i==0?view(0,uv):i==1?view(1,uv):view(2,uv);
  vec3 b = i==0?view(1,uv):i==1?view(2,uv):view(3,uv);
  vec3 c = mix(a,b,m);

  // grade: cold blue shadows at dawn, neutral noon, amber at the end
  float warm = smoothstep(0.55,1.0,tday);
  float cold = 1.-smoothstep(0.0,0.45,tday);
  float L = lum(c);
  vec3 shadowTint = mix(vec3(1.), vec3(.78,.86,1.10), cold) * mix(vec3(1.), vec3(1.06,.95,.86), warm);
  vec3 lightTint  = mix(vec3(1.), vec3(1.10,.97,.86), cold*.8 + warm);
  c *= mix(shadowTint, lightTint, smoothstep(.15,.85,L));

  // soft rays from the sun
  vec2 d = uv - sun; float r = length(d*vec2(res.x/res.y,1.));
  float ang = atan(d.y,d.x);
  float rays = pow(max(0., sin(ang*9. + noise(vec2(ang*3., time*.05))*2.)), 6.) * exp(-r*2.2);
  float glow = exp(-r*r*7.);
  vec3 sunCol = mix(vec3(1.,.78,.52), vec3(1.,.93,.8), 1.-abs(tday*2.-1.));
  float sunAmt = 0.35 + 0.35*(cold+warm);
  c += sunCol*(glow*.22 + rays*.10)*sunAmt;

  // dust motes drifting in the light
  vec2 g = uv*vec2(res.x/res.y,1.)*28.; vec2 id = floor(g + vec2(0., time*.12));
  float h = hash(id);
  vec2 fp = fract(g + vec2(0., time*.12)) - .5 + (vec2(hash(id+3.),hash(id+7.))-.5)*.6;
  float mote = smoothstep(.06,.0,length(fp)) * step(.93,h) * glow * 1.6;
  c += sunCol*mote*.6;

  // vignette and fine grain
  float v = smoothstep(1.15,.35,length((uv-.5)*vec2(1.1,1.)));
  c *= mix(.82,1.,v);
  c += (hash(uv*res + fract(time)*61.)-.5)*.025;
  gl_FragColor = vec4(c,1.);
}`;

function loadImage(src){
  return new Promise((ok, err) => { const im = new Image(); im.decoding='async'; im.onload=()=>ok(im); im.onerror=err; im.src=src; });
}

export async function mountDaylight(canvas, { views, period = 48, dpr = Math.min(2, window.devicePixelRatio||1) } = {}){
  const gl = canvas.getContext('webgl', { antialias:false, premultipliedAlpha:false, preserveDrawingBuffer:true });
  if (!gl || !views || views.length !== 4) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const U = n => gl.getUniformLocation(prog, n);

  const imgs = await Promise.all(views.map(loadImage));
  const aspects = [];
  imgs.forEach((im, k) => {
    const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + k); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(U('t'+k), k); aspects.push(im.naturalWidth / im.naturalHeight);
  });
  gl.uniform4f(U('a0'), ...aspects);

  let t = 0, target = 0, dir = 1, playing = false, raf = 0, start = performance.now(), last = start, dx = 0, dy = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const resize = () => {
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0,0,w,h); }
    gl.uniform2f(U('res'), w, h);
  };
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
  const onMove = e => { const r = canvas.getBoundingClientRect();
    dx = ((e.clientX - r.left) / r.width - .5) * -0.02; dy = ((e.clientY - r.top) / r.height - .5) * 0.015; };
  canvas.addEventListener('pointermove', onMove);

  let px = 0, py = 0;
  const frame = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (playing && !reduce) { target += dir * dt / period; if (target >= 1 || target <= 0) { dir = -dir; target = Math.max(0, Math.min(1, target)); } }
    t += (target - t) * (reduce ? 1 : Math.min(1, dt * 3.2));       // eased, so scrubbing feels like light, not a switch
    px += (dx - px) * Math.min(1, dt * 2.5); py += (dy - py) * Math.min(1, dt * 2.5);
    gl.uniform1f(U('tday'), t); gl.uniform1f(U('time'), (now - start) / 1000); gl.uniform2f(U('drift'), px, py);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    set(v, now = false){ target = Math.max(0, Math.min(1, v)); if (now) t = target; },
    get(){ return t; },
    play(on = true){ playing = on; },
    destroy(){ cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove);
      const ext = gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext(); }
  };
}
