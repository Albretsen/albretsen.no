// prism-scene.js — interactive 3D "Crystal A" for design 34 "Tension Prism".
//
// The Prism A mark built from 21 real glass prisms (MeshPhysicalMaterial with
// transmission + dispersion), lit by Poly Haven's CC0 "Monochrome Studio 02"
// (shipped as a 17 KB tonemapped equirect). Behind it an opaque slatted light
// box gives the glass something to bend. The pointer tilts the whole crystal
// on a spring and pulls the facets apart along z (tension); release and they
// lock back together. three.js is imported lazily from a pinned CDN.
//
// Usage:
//   import { mountPrismScene } from './prism-scene.js';
//   const scene = await mountPrismScene(el, { envUrl: '../texture/studio-env-1k.webp' });
//   scene.destroy();

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

export async function mountPrismScene(el, o = {}) {
  const THREE = await import(/* @vite-ignore */ THREE_URL);
  const opts = { envUrl: new URL('../texture/studio-env-1k.webp', import.meta.url).href, dpr: Math.min(devicePixelRatio, 2), ...o };
  const MINT = new THREE.Color('#39FD9E');
  const S3 = Math.sqrt(3) / 2;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!o.preserve });
  renderer.setPixelRatio(opts.dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.append(renderer.domElement);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  const envTex = await new THREE.TextureLoader().loadAsync(opts.envUrl);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(envTex).texture;
  scene.environmentIntensity = 1.1;
  envTex.dispose();

  // backdrop: opaque shader light box (transmission only sees opaque objects)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 18), new THREE.ShaderMaterial({
    uniforms: { c: { value: MINT }, t: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform vec3 c; uniform float t; varying vec2 vUv;
      void main(){ vec2 r=vUv-.5; float a=.12; vec2 q=vec2(cos(a)*r.x-sin(a)*r.y, sin(a)*r.x+cos(a)*r.y);
        float slat=smoothstep(.55,.6,fract(q.y*72.+t*.15)) * (1.-smoothstep(.85,.9,fract(q.y*72.+t*.15)));
        float win=exp(-pow(q.x*8.,2.)-pow(q.y*6.5,2.));
        vec3 col=vec3(.004,.006,.005) + mix(vec3(1.),c,.55)*slat*win*.9 + c*.025*win;
        gl_FragColor=vec4(col,1.); }`,
  }));
  back.position.z = -3.2;
  scene.add(back);

  // the crystal
  const tri = (s, up) => {
    const sh = new THREE.Shape(), h = s * S3;
    if (up) { sh.moveTo(0, h * 2 / 3); sh.lineTo(s / 2, -h / 3); sh.lineTo(-s / 2, -h / 3); }
    else { sh.moveTo(0, -h * 2 / 3); sh.lineTo(-s / 2, h / 3); sh.lineTo(s / 2, h / 3); }
    sh.closePath(); return sh;
  };
  const geo = (s, d, up) => {
    const g = new THREE.ExtrudeGeometry(tri(s, up), { depth: d, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 3, curveSegments: 1 });
    g.translate(0, 0, -d / 2); return g;
  };
  const glass = (x = {}) => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, transmission: 1, thickness: 1.1, ior: 1.52, dispersion: 4, clearcoat: 1, ...x });
  const group = new THREE.Group();
  const remove = new Set(['2,2', '4,3', '4,4', '4,5']), mint = new Set(['0,0', '3,5', '4,7']);
  const facets = [];
  let seed = 0x6c586a; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const s = 1, h = s * S3, ROWS = 5;
  for (let r = 0; r < ROWS; r++) for (let i = 0; i <= 2 * r; i++) {
    if (remove.has(`${r},${i}`)) continue;
    const up = i % 2 === 0;
    const x = -r * s / 2 + Math.floor(i / 2) * s + (up ? 0 : s / 2);
    const y = -(r * h + (up ? h * 2 / 3 : h / 3)) + ROWS * h / 2;
    const isMint = mint.has(`${r},${i}`);
    const m = new THREE.Mesh(geo(s * 0.9, 0.8 + rnd() * 0.6, up),
      glass(isMint ? { color: MINT, attenuationColor: MINT, attenuationDistance: 0.5, thickness: 1.4, emissive: MINT, emissiveIntensity: 0.18 } : {}));
    m.position.set(x, y, 0);
    m.userData = { base: new THREE.Vector3(x, y, 0), rx: (rnd() - .5) * 0.7, ry: (rnd() - .5) * 1.0, z: (rnd() - .5) * 2.4 };
    group.add(m); facets.push(m);
  }
  scene.add(group);

  const resize = () => {
    const w = el.clientWidth || 600, hh = el.clientHeight || 400;
    renderer.setSize(w, hh, false); camera.aspect = w / hh;
    camera.fov = w / hh < 1 ? 38 : 26; camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(el); resize();

  const ptr = { x: 0, y: 0, tx: 0, ty: 0, tension: 0, tTension: o.tension ?? 0.35 };
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    ptr.tx = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    ptr.tTension = 1;
  };
  const onLeave = () => { ptr.tx = 0; ptr.ty = 0; ptr.tTension = o.tension ?? 0.35; };
  el.addEventListener('pointermove', onMove); el.addEventListener('pointerleave', onLeave);

  let raf, t0 = performance.now();
  const render = (now) => {
    const t = (now - t0) / 1000;
    const k = reduced ? 1 : 0.06;
    ptr.x += (ptr.tx - ptr.x) * k; ptr.y += (ptr.ty - ptr.y) * k;
    ptr.tension += (ptr.tTension - ptr.tension) * (reduced ? 1 : 0.05);
    group.rotation.y = -0.28 + ptr.x * 0.6 + (reduced ? 0 : Math.sin(t * 0.4) * 0.05);
    group.rotation.x = 0.05 + ptr.y * 0.35;
    for (const m of facets) {
      const u = m.userData, T = ptr.tension;
      m.position.z = u.z * T;
      m.rotation.x = u.rx * T; m.rotation.y = u.ry * T;
    }
    back.material.uniforms.t.value = reduced ? 0 : t;
    renderer.render(scene, camera);
    if (!o.once) raf = requestAnimationFrame(render);
  };
  raf = requestAnimationFrame(render);
  return {
    renderer, scene, camera,
    setTension(v) { ptr.tTension = v; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave); renderer.dispose(); renderer.domElement.remove(); },
  };
}
