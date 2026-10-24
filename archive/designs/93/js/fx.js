// Little effects: embers and sparks (one Points cloud), warm pools of light under lamps,
// halos around lamp heads, and the bobbing markers over unlit lamps.
import * as THREE from 'three';

export function glowTexture(size = 128, stops = [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,235,200,.55)'], [1, 'rgba(255,200,120,0)']]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) r.addColorStop(o, col);
  g.fillStyle = r; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createParticles(max = 420) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(max * 3), col = new Float32Array(max * 3), size = new Float32Array(max);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: glowTexture(64) }, uScale: { value: 400 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */ `
      attribute float size; attribute vec3 color; varying vec3 vC; uniform float uScale;
      void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap; varying vec3 vC;
      void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vC * t.a * 2.2, 1.); }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 5;
  const P = Array.from({ length: max }, () => ({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0, r: 1, g: 0.8, b: 0.5, drag: 1, grav: 0 }));
  let cursor = 0;

  function emit(o) {
    const p = P[cursor]; cursor = (cursor + 1) % max;
    Object.assign(p, { drag: 1.6, grav: -0.6, r: 1, g: 0.72, b: 0.36, s: 0.12 }, o);
    p.life = p.max;
  }

  function burst(at, n = 36, { spread = 2.4, up = 2.2, hot = 1 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = Math.random() * spread;
      emit({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * s, vy: up * (0.4 + Math.random()), vz: Math.sin(a) * s,
        max: 0.6 + Math.random() * 1.1, s: (0.06 + Math.random() * 0.12) * hot, grav: -1.4, drag: 2.2,
        r: 1, g: 0.62 + Math.random() * 0.3, b: 0.3 + Math.random() * 0.25 });
    }
    // slow embers drifting up
    for (let i = 0; i < n / 3; i++) {
      emit({ x: at.x + (Math.random() - 0.5) * 0.4, y: at.y, z: at.z + (Math.random() - 0.5) * 0.4,
        vx: (Math.random() - 0.5) * 0.3, vy: 0.4 + Math.random() * 0.6, vz: (Math.random() - 0.5) * 0.3,
        max: 1.6 + Math.random() * 1.6, s: 0.05 + Math.random() * 0.05, grav: 0.05, drag: 0.4, r: 1, g: 0.55, b: 0.25 });
    }
  }

  function update(dt) {
    let any = false;
    for (let i = 0; i < max; i++) {
      const p = P[i];
      if (p.life > 0) {
        any = true;
        p.life -= dt;
        const k = Math.exp(-p.drag * dt);
        p.vx *= k; p.vz *= k; p.vy = p.vy * k + p.grav * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const f = Math.max(0, p.life / p.max);
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        col[i * 3] = p.r * f; col[i * 3 + 1] = p.g * f; col[i * 3 + 2] = p.b * f;
        size[i] = p.s * (0.4 + 0.6 * f);
      } else if (size[i] !== 0) { size[i] = 0; any = true; }
    }
    if (any) { geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.attributes.size.needsUpdate = true; }
  }

  return { points, emit, burst, update, setScale(h) { mat.uniforms.uScale.value = h * 0.5; } };
}

/** Warm pool of light on the ground (additive disc). */
export function lightPool(radius = 4.2, tex) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 40),
    new THREE.MeshBasicMaterial({ map: tex, color: 0xffb867, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: true }),
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

/** Billboard halo around a lamp head. */
export function halo(size = 1.6, tex) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffc27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.setScalar(size);
  s.renderOrder = 4;
  return s;
}

/** Marker over an unlit lamp: a small diamond with a soft ring. */
export function markerTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.translate(64, 64);
  g.strokeStyle = 'rgba(255,214,140,.55)'; g.lineWidth = 3;
  g.beginPath(); g.arc(0, 0, 40, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#ffd27a';
  g.beginPath(); g.moveTo(0, -24); g.lineTo(16, 0); g.lineTo(0, 24); g.lineTo(-16, 0); g.closePath(); g.fill();
  g.fillStyle = '#fff6e0';
  g.beginPath(); g.moveTo(0, -12); g.lineTo(7, 0); g.lineTo(0, 12); g.lineTo(-7, 0); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A soft cone of lamplight under a lamp head: additive, brightest at the top, fading at its edges and toward the ground. */
export function lightCone(height = 3.4, radius = 1.9) {
  const geo = new THREE.CylinderGeometry(0.14, radius, height, 28, 1, true);
  geo.translate(0, -height / 2, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0xffbf73) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */ `
      varying float vH; varying vec3 vN; varying vec3 vV;
      void main(){ vH = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; uniform vec3 uColor; varying float vH; varying vec3 vN; varying vec3 vV;
      void main(){
        float rim = abs(dot(normalize(vN), normalize(vV)));
        float a = pow(vH, 1.7) * pow(rim, 2.4) * uOpacity;
        gl_FragColor = vec4(uColor * a, 1.);
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 3;
  m.frustumCulled = false;
  return m;
}
