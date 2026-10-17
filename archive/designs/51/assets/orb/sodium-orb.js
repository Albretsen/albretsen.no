// SODIUM ORB — an interactive 3D object for design 51 (three.js r170, loaded lazily).
//
// A smoked-glass sphere with fingerprint smudges (ambientCG Fingerprints006,
// CC0) reflecting a real night street lamp (Poly Haven "Street Lamp" HDRI, CC0),
// a lamp filament inside, and a GPU particle orbit of molten sparks around it
// (a single THREE.Points with a custom shader; positions are computed on the GPU
// from a per-particle seed, so there is no per-frame CPU work).
//
// Drag to turn it. Click / tap / Enter to STRIKE: the filament flashes neon
// (hue 0) and warms to sodium while the orbit flares outward and settles.
//
//   import { mountOrb } from './sodium-orb.js'
//   const orb = await mountOrb(document.querySelector('#orb'))
//   orb.strike(); orb.destroy()

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const here = new URL('.', import.meta.url);

export async function mountOrb(container, { particles = 10000, env = new URL('street-lamp-env.webp', here).href, rough = new URL('fingerprints-roughness.webp', here).href } = {}) {
  const THREE = await import(THREE_URL);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab' });
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('role', 'button');
  renderer.domElement.setAttribute('aria-label', 'Glass lamp in orbit of sparks. Drag to turn, press to strike.');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.35, 6.2);
  camera.lookAt(0, 0, 0);

  // environment from the tone-mapped HDRI
  const loader = new THREE.TextureLoader();
  const [envTex, roughTex] = await Promise.all([loader.loadAsync(env), loader.loadAsync(rough)]);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(envTex).texture;
  scene.environment = envMap;
  roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.repeat.set(2, 1);

  const group = new THREE.Group();
  scene.add(group);

  // smoked glass shell
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(1, 96, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0x0c2348, metalness: 0.0, roughness: 0.08, roughnessMap: roughTex,
      clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.4,
      transparent: true, opacity: 0.42, side: THREE.FrontSide, depthWrite: false,
    }),
  );
  group.add(glass);
  // rim (fresnel) shell
  const rimMat = new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(0x52b5f4) }, uWarm: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uWarm; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1. - max(dot(vN, vV), 0.), 3.); vec3 warm = vec3(0.98,0.58,0.16);
      gl_FragColor = vec4(mix(uColor, warm, uWarm) * f * 1.4, f); }`,
  });
  group.add(new THREE.Mesh(new THREE.SphereGeometry(1.01, 64, 48), rimMat));

  // filament core: a billboard glow whose colour runs neon -> sodium on strike
  const coreMat = new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { uHeat: { value: 0.7 }, uFlash: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(0.,0.,0.,1.); mv.xy += position.xy; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uHeat; uniform float uFlash; varying vec2 vUv;
      void main(){ float d = length(vUv-.5)*2.; float core = exp(-d*d*28.); float halo = pow(max(1.-d,0.),2.6);
      vec3 neon = vec3(0.90,0.20,0.51); vec3 sod = vec3(0.98,0.58,0.16); vec3 fil = vec3(1.,0.96,0.84);
      vec3 c = mix(neon, sod, uHeat); float a = halo*(0.55+uFlash*1.2) + core;
      gl_FragColor = vec4(c*halo*(0.8+uFlash*2.) + fil*core*(1.+uFlash), a); }`,
  });
  const core = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), coreMat);
  group.add(core);
  const light = new THREE.PointLight(0xfb942a, 6, 6, 1.6);
  group.add(light);

  // GPU orbit: each particle has (seed, phase, radius, tilt); the vertex shader places it.
  const geo = new THREE.BufferGeometry();
  const a = new Float32Array(particles * 4);
  for (let i = 0; i < particles; i++) {
    const band = Math.random() < 0.72 ? 0 : 1; // two inclined rings
    a[i * 4 + 0] = Math.random();                        // seed
    a[i * 4 + 1] = Math.random() * Math.PI * 2;          // phase along the ring
    a[i * 4 + 2] = (band ? 1.75 : 1.42) + (Math.random() - 0.5) * (band ? 0.25 : 0.12) * (1 + Math.random() * 2); // radius
    a[i * 4 + 3] = band ? -0.55 : 0.32;                  // tilt
  }
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particles * 3), 3));
  geo.setAttribute('aData', new THREE.BufferAttribute(a, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
  const pMat = new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uFlare: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute vec4 aData; uniform float uTime; uniform float uFlare; uniform float uPx; varying float vHeat; varying float vA;
      void main(){
        float seed = aData.x; float speed = 0.25 + seed*0.35;
        float ang = aData.y + uTime*speed;
        // a comet head travels the ring; heat is distance behind it
        float head = mod(uTime*0.6 + step(0.0, aData.w)*3.14159, 6.28318);
        float behind = mod(head - ang, 6.28318) / 6.28318;
        vHeat = behind;
        float r = aData.z * (1.0 + uFlare*(0.35 + seed*0.6));
        vec3 p = vec3(cos(ang)*r, sin(seed*40.0 + uTime)*0.03*r, sin(ang)*r);
        float t = aData.w; p = vec3(p.x, p.y*cos(t) - p.z*sin(t), p.y*sin(t) + p.z*cos(t));
        vec4 mv = modelViewMatrix*vec4(p,1.);
        gl_Position = projectionMatrix*mv;
        float size = mix(7.0, 2.0, smoothstep(0.0, 0.5, behind)) * (0.6 + seed*0.8);
        gl_PointSize = size * uPx * (4.0 / -mv.z);
        vA = mix(1.0, 0.32, smoothstep(0.0, 0.95, behind)) * (0.55 + 0.45*fract(seed*91.7));
      }`,
    fragmentShader: `
      varying float vHeat; varying float vA;
      vec3 ramp(float h){ // filament -> sodium -> ember -> neon (hue 0) -> night blue
        vec3 c0=vec3(1.,.96,.84), c1=vec3(.98,.58,.16), c2=vec3(.94,.36,.21), c3=vec3(.90,.20,.51), c4=vec3(.14,.28,.47);
        if(h<.15) return mix(c0,c1,h/.15); if(h<.35) return mix(c1,c2,(h-.15)/.2); if(h<.6) return mix(c2,c3,(h-.35)/.25); return mix(c3,c4,(h-.6)/.4); }
      void main(){ float d = length(gl_PointCoord-.5)*2.; float g = exp(-d*d*4.); if(g<.01) discard;
        gl_FragColor = vec4(ramp(vHeat)*g*vA, g*vA); }`,
  });
  const points = new THREE.Points(geo, pMat);
  group.add(points);
  group.rotation.set(0.18, 0, -0.12);

  // interaction: drag to rotate with inertia, press to strike
  let rotY = 0, rotX = 0.18, velY = 0.0025, dragging = false, lx = 0, ly = 0, moved = 0;
  const el = renderer.domElement;
  const down = (e) => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; };
  const move = (e) => { if (!dragging) return; const dx = e.clientX - lx, dy = e.clientY - ly; moved += Math.abs(dx) + Math.abs(dy); velY = dx * 0.0035; rotX = Math.max(-0.6, Math.min(0.8, rotX + dy * 0.004)); lx = e.clientX; ly = e.clientY; };
  const up = () => { if (dragging && moved < 6) strike(); dragging = false; el.style.cursor = 'grab'; };
  const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); strike(); } };
  el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('keydown', key);

  let strikeAt = -1e9;
  function strike() { strikeAt = performance.now(); }

  function resize() {
    const r = container.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  let raf = 0, visible = true, t0 = performance.now();
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); });
  io.observe(container);

  function render(now) {
    const t = (now - t0) / 1000;
    const s = (now - strikeAt) / 1000;               // seconds since strike
    const flash = s < 0.5 ? (Math.random() > 0.3 ? 1 : 0.3) * (1 - s / 0.5) : 0; // neon flicker
    const warm = Math.min(1, Math.max(0, s / 1.6));
    coreMat.uniforms.uHeat.value = s < 3 ? warm : 0.85 + Math.sin(t * 1.3) * 0.05;
    coreMat.uniforms.uFlash.value = flash;
    rimMat.uniforms.uWarm.value = s < 3 ? (1 - warm) * 0.2 + warm * 0.6 : 0.35;
    pMat.uniforms.uFlare.value = s < 2.4 ? Math.sin(Math.min(1, s / 2.4) * Math.PI) * 0.9 : 0;
    pMat.uniforms.uTime.value = t;
    light.intensity = 5 + flash * 12;
    if (!dragging) velY += (0.0025 - velY) * 0.02;
    rotY += velY;
    group.rotation.y = rotY; group.rotation.x = rotX;
    renderer.render(scene, camera);
  }
  function tick(now) {
    raf = 0;
    if (!visible) return;
    render(now);
    if (!reduced) raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return {
    strike,
    renderAt(ms) { render(t0 + ms); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); pmrem.dispose(); el.remove(); },
  };
}
