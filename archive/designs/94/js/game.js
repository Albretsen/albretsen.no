// Evening post: the game. Flight, assists, camera, rings, deliveries, the sun going down.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld } from './world.js';
import { buildCourse } from './course.js';
import { makePlane, Trail, makeEnvelope } from './plane.js';

const V = () => new THREE.Vector3();
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export const SUN_START = 4.6, SUN_END = -1.2;

export async function createGame({ canvas, quality, reduced, ui, audio, onProgress }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality.dpr <= 1.25, powerPreference: 'high-performance' });
  renderer.setPixelRatio(quality.dpr);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;

  const world = await buildWorld({ renderer, quality, onProgress });
  const { scene } = world;
  const course = buildCourse(world);
  // trees on the slopes, kept clear of the route
  const { plantTrees } = await import('./trees.js');
  plantTrees({
    scene, town: world.town, models: world.treeModels, shadows: quality.shadows, count: quality.shadowSize >= 2048 ? 420 : 260,
    avoid: (x, z, top) => {
      for (let i = 0; i < course.samples.length; i += 2) {
        const c = course.samples[i];
        if ((c.x - x) ** 2 + (c.z - z) ** 2 < 64 && top > c.y - 3) return true;
      }
      return false;
    },
  });

  const camera = new THREE.PerspectiveCamera(60, 1, 0.3, 5000);
  // townsfolk arrive a moment later; the round works without them
  let folk = null, folkMod = null;
  const folkReady = import('./folk.js').then(async (m) => { folkMod = m; folk = await m.addFolk({ scene, world, course, shadows: quality.shadows }); }).catch((e) => console.warn('folk', e));
  scene.add(camera);

  // ---------------- post: bloom gives the windows, rings and sun their glow
  let composer = null, bloom = null;
  if (quality.bloom) {
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: quality.dpr <= 1.25 ? 4 : 0 }));
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.5, 0.95);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // ---------------- plane
  const plane = makePlane();
  scene.add(plane.root);
  const lantern = new THREE.PointLight(0xffc27a, 0, 18, 1.6);
  lantern.position.set(0, -0.4, 0.6);
  plane.root.add(lantern);
  const trail = new Trail(scene, 30);
  const glowTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,220,160,.9)'); r.addColorStop(0.35, 'rgba(255,190,120,.25)'); r.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }));
  glow.scale.setScalar(4.2); glow.position.set(0, -0.1, -0.2);
  plane.root.add(glow);

  // ---------------- rings
  const ringGeo = new THREE.TorusGeometry(2.5, 0.085, 8, 64);
  const gateGeo = new THREE.TorusGeometry(7.5, 0.22, 10, 96);
  const haloGeo = new THREE.RingGeometry(0.0, 2.5, 48);
  const haloMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uK: { value: 1 }, uColor: { value: new THREE.Color(1.0, 0.62, 0.3) } },
    vertexShader: 'varying vec2 vU; void main(){ vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float uK; uniform vec3 uColor; varying vec2 vU; void main(){ float r = length(vU) / 2.5; float a = smoothstep(.55, 1., r) * smoothstep(1.02, .96, r); gl_FragColor = vec4(uColor * a * .35 * uK, 1.); }',
  });
  for (const r of course.rings) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.0, 0.95), transparent: true, fog: false });
    const g = new THREE.Group();
    const torus = new THREE.Mesh(r.gate ? gateGeo : ringGeo, mat);
    const halo = new THREE.Mesh(haloGeo, haloMat.clone());
    if (r.gate) halo.scale.setScalar(3);
    g.add(torus, halo);
    g.position.copy(r.pos);
    g.lookAt(r.pos.clone().add(r.dir));
    scene.add(g);
    Object.assign(r, { g, mat, torus, halo, state: 'live', k: 0, burst: 0 });
  }

  // ---------------- delivery markers: a floating envelope and a soft beam
  const iconTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grd.addColorStop(0, 'rgba(255,214,140,.55)'); grd.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#fff3dc'; g.lineWidth = 6; g.lineJoin = 'round';
    g.strokeRect(34, 44, 60, 40);
    g.beginPath(); g.moveTo(34, 44); g.lineTo(64, 68); g.lineTo(94, 44); g.stroke();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const beamGeo = new THREE.CylinderGeometry(0.5, 0.9, 1, 16, 1, true); beamGeo.translate(0, 0.5, 0);
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uK: { value: 1 } },
    vertexShader: 'varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float uK; varying float vY; void main(){ gl_FragColor = vec4(vec3(1., .7, .38) * (1. - vY) * .32 * uK, 1.); }',
  });
  for (const t of course.targets) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex, color: new THREE.Color(2.2, 1.6, 1.0), transparent: true, depthWrite: false, depthTest: false, fog: false }));
    sp.scale.setScalar(t.kind === 'product' ? 3.2 : 2.2);
    sp.position.copy(t.pos).add(new THREE.Vector3(0, 1.6, 1.2));
    sp.renderOrder = 5;
    const beam = new THREE.Mesh(beamGeo, beamMat.clone());
    beam.position.copy(t.pos).add(new THREE.Vector3(0, 0, 1.0));
    beam.scale.set(1, 6, 1);
    scene.add(sp, beam);
    Object.assign(t, { sp, beam, state: 'live', k: 0 });
  }

  // ---------------- letters in flight, sparks
  const env = makeEnvelope();
  const letters = [];
  const SPARKS = 420;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(SPARKS * 3), sparkA = new Float32Array(SPARKS);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  sparkGeo.setAttribute('alpha', new THREE.BufferAttribute(sparkA, 1));
  const sparkMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uScale: { value: 300 } },
    vertexShader: 'attribute float alpha; varying float vA; uniform float uScale; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = uScale * (.1 + .12 * alpha) / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .0, d); gl_FragColor = vec4(vec3(1.7, 1.15, .6) * a * vA, 1.); }',
  });
  const sparkPts = new THREE.Points(sparkGeo, sparkMat); sparkPts.frustumCulled = false; scene.add(sparkPts);
  const sparks = Array.from({ length: SPARKS }, () => ({ p: V(), v: V(), life: 0, max: 1 }));
  let sparkI = 0;
  function burst(at, n, speed = 6, life = 1.1) {
    for (let i = 0; i < n; i++) {
      const s = sparks[sparkI++ % SPARKS];
      s.p.copy(at); s.v.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(speed * (0.3 + Math.random()));
      s.life = s.max = life * (0.6 + Math.random() * 0.6);
    }
  }

  // ---------------------------------------------------------------- flight state
  const F = {
    pos: V(), yaw: 0, pitch: 0, bank: 0, speed: 13, boost: 0, s: 0, prevPlane: new Map(),
    bump: 0, idle: 0,
  };
  const input = { x: 0, y: 0, active: false, lastMove: 0 };
  const G = {
    mode: 'attract', t: 0, playT: 0, score: 0, combo: 0, letters: 0, products: [], rings: 0, missed: 0,
    lettersTotal: course.targets.filter((t) => t.kind === 'letter').length,
    ringsTotal: course.rings.length, e: SUN_START, shake: 0, endT: 0, introT: 0,
  };
  function resetFlight() {
    const p0 = course.samples[0], t0 = course.tangents[0];
    F.pos.copy(p0); F.yaw = Math.atan2(t0.x, t0.z); F.pitch = 0; F.bank = 0; F.speed = 13; F.boost = 0; F.s = 0;
    for (const r of course.rings) { r.state = 'live'; r.k = 0; r.burst = 0; r.g.visible = true; r.g.scale.setScalar(1); r.prevSide = undefined; }
    for (const t of course.targets) {
      t.state = 'live'; t.k = 0; t.sp.visible = true; t.beam.visible = true;
      if (t.folk) { t.folk.play(t.folkPose, 0.2); if (t.folkPose === 'phone') t.folk.attach('phone'); if (t.folkPose === 'drink') t.folk.attach('wine_glass'); }
    }
    for (const h of world.houses) { h.delivered = false; h.lit = 0; h.level = 0; h.offT = 0; h.backT = 0; }
    for (const l of world.lamps) { l.lit = 0; l.level = 0; }
    for (const l of world.landmarks) { l.delivered = false; l.level = 0; }
    letters.length = 0;
    Object.assign(G, { score: 0, combo: 0, letters: 0, products: [], rings: 0, missed: 0, playT: 0, e: SUN_START, endT: 0 });
    trail.reset(F.pos);
  }
  resetFlight();

  // attract: a lazy loop over the bay in front of the town
  const ATTRACT = { c: new THREE.Vector3(-12, 19, 50), r: 9 };
  const ATTRACT_TALL = { c: new THREE.Vector3(-9, 23, 72), r: 6 };
  function attractStep(dt) {
    const A = camera.aspect < 1 ? ATTRACT_TALL : ATTRACT;
    const a = G.t * 0.32;
    const p = new THREE.Vector3(A.c.x + Math.cos(a) * A.r, A.c.y + Math.sin(a * 2) * 1.5, A.c.z + Math.sin(a) * A.r * 0.8);
    const ahead = new THREE.Vector3(A.c.x + Math.cos(a + 0.05) * A.r, p.y, A.c.z + Math.sin(a + 0.05) * A.r * 0.8);
    F.pos.copy(p);
    F.yaw = Math.atan2(ahead.x - p.x, ahead.z - p.z);
    F.pitch = 0.04 * Math.cos(a * 2);
    F.bank = 0.42;
    if (!F.attractPrimed) { trail.reset(F.pos); F.attractPrimed = true; }
  }

  // ---------------------------------------------------------------- the flight model
  const fwd = V(), tmp = V(), tmp2 = V();
  function nearestS(p, from, to) {
    let best = from, bd = 1e9;
    for (let i = Math.max(0, from); i <= Math.min(course.length, to); i++) {
      const d = course.samples[i].distanceToSquared(p); if (d < bd) { bd = d; best = i; }
    }
    return [best, Math.sqrt(bd)];
  }
  function flightStep(dt) {
    // where we are along the route
    let [s, dist] = nearestS(F.pos, Math.floor(F.s) - 6, Math.floor(F.s) + 40);
    if (dist > 28) [s, dist] = nearestS(F.pos, Math.floor(F.s) - 30, Math.floor(F.s) + 90);
    if (s > F.s) F.s = s;
    const idle = (performance.now() - input.lastMove > 1400 && !input.active) || (Math.abs(input.x) < 0.02 && Math.abs(input.y) < 0.02);
    F.idle = damp(F.idle, idle ? 1 : 0, 2.2, dt);
    // assist: look ahead along the route
    const look = Math.min(course.length, Math.floor(F.s) + 13 + Math.floor(F.speed * 0.5));
    const aim = course.samples[look];
    tmp.subVectors(aim, F.pos);
    const yawT = Math.atan2(tmp.x, tmp.z);
    const pitchT = Math.atan2(tmp.y, Math.hypot(tmp.x, tmp.z));
    const away = smooth(10, 34, dist);                  // drifting far: the assist grows
    const k = clamp(0.3 + 0.7 * F.idle + 0.6 * away, 0, 1);
    const yawErr = wrap(yawT - F.yaw);
    const assistTurn = clamp(-yawErr * 2.0, -1, 1);   // + = turn right (toward -X when flying +Z)
    const turn = clamp(input.x * (1 - 0.5 * k * F.idle) + assistTurn * k, -1, 1);
    const climb = clamp(input.y * 0.55 * (1 - 0.6 * F.idle) + clamp((pitchT - F.pitch) * 1.6, -0.6, 0.6) * (0.35 + 0.65 * k), -0.62, 0.55);
    F.bank = damp(F.bank, turn * 0.95, 4.2, dt);
    F.yaw -= F.bank * 1.25 * dt;
    F.pitch = damp(F.pitch, climb, 3.4, dt);
    // speed: dives are faster, rings give a push
    F.boost = Math.max(0, F.boost - dt * 3.2);
    const vT = 10 + F.boost - Math.sin(F.pitch) * 7;
    F.speed = damp(F.speed, clamp(vT, 8.5, 26), 1.6, dt);
    fwd.set(Math.sin(F.yaw) * Math.cos(F.pitch), Math.sin(F.pitch), Math.cos(F.yaw) * Math.cos(F.pitch));
    F.pos.addScaledVector(fwd, F.speed * dt);
    // roofs: a paper plane bumps and pops up, never crashes
    const hf = world.HF;
    const floor = Math.max(hf.at(F.pos.x, F.pos.z), hf.at(F.pos.x + fwd.x * 1.2, F.pos.z + fwd.z * 1.2)) + 0.9;
    if (F.pos.y < floor) {
      const depth = floor - F.pos.y;
      F.pos.y += Math.min(depth, 9 * dt + depth * 0.25);
      F.pitch = Math.max(F.pitch, 0.25);
      F.speed *= 1 - Math.min(0.5, depth * 0.05);
      if (F.bump <= 0) { G.shake = reduced ? 0 : 0.5; audio?.bump(); G.combo = 0; }
      F.bump = 0.4;
    }
    F.bump -= dt;
    F.pos.y = clamp(F.pos.y, 0.6, 70);
    return { s, dist };
  }

  // ---------------------------------------------------------------- gameplay
  const SPRING = { pos: V(), look: V(), init: false, fov: 60, roll: 0 };
  function deliver(t) {
    t.state = 'done';
    const L = new THREE.Mesh(env.geo, env.mat);
    L.position.copy(F.pos);
    scene.add(L);
    letters.push({ mesh: L, from: F.pos.clone(), to: t.pos.clone(), t: 0, dur: t.kind === 'product' ? 0.75 : 0.6, target: t, spin: (Math.random() - 0.5) * 12 });
    audio?.whoosh();
  }
  function arrive(t) {
    burst(t.pos, t.kind === 'product' ? 70 : 34, t.kind === 'product' ? 8 : 5);
    G.combo++;
    if (t.kind === 'letter') {
      t.house.delivered = true;
      G.letters++;
      if (folkMod) folkMod.wave(t, F.pos);
      G.score += 100 + 20 * Math.min(G.combo, 10);
      audio?.chime(G.letters);
      ui.toast?.(`+${100 + 20 * Math.min(G.combo, 10)}`, 'letter');
    } else {
      t.lm.delivered = true;
      G.products.push(t.id);
      G.score += 300;
      audio?.stamp();
      ui.product?.(t.id);
    }
    t.sp.visible = false; t.beam.visible = false;
  }

  function gameStep(dt) {
    G.playT += dt;
    const { s } = flightStep(dt);
    const prog = F.s / course.length;
    G.e = lerp(SUN_START, SUN_END, Math.min(1, Math.max(prog, G.playT / 110)));
    // rings: crossing the ring's plane inside its radius
    for (const r of course.rings) {
      if (r.state !== 'live') continue;
      if (Math.abs(r.s - F.s) > 30) continue;
      tmp.subVectors(F.pos, r.pos);
      const side = tmp.dot(r.dir);
      const radial = tmp.addScaledVector(r.dir, -side).length();
      if (r.prevSide !== undefined && r.prevSide < 0 && side >= 0) {
        if (radial < (r.gate ? 9 : 3.4)) {
          r.state = 'passed'; G.rings++; G.combo++;
          G.score += 25 * Math.min(G.combo, 10);
          F.boost = r.gate ? 3 : 7;
          burst(F.pos, r.gate ? 90 : 26, r.gate ? 9 : 5, 0.8);
          audio?.ring(G.combo);
          if (r.gate) audio?.finale();
        } else { r.state = 'missed'; G.combo = 0; }
      }
      r.prevSide = side;
      if (r.state === 'live' && F.s > r.s + 14) { r.state = 'missed'; G.combo = 0; }
    }
    // deliveries: fly close and the letter goes by itself
    for (const t of course.targets) {
      if (t.state !== 'live') continue;
      const d = F.pos.distanceTo(t.pos);
      if (d < (t.kind === 'product' ? 15 : 12) && Math.abs(t.s - F.s) < 26) deliver(t);
      else if (F.s > t.s + 24) { t.state = 'missed'; G.missed++; }
    }
    if (F.s >= course.length - 6 || G.playT > 120) endRound();
  }

  function endRound() {
    if (G.mode !== 'play') return;
    G.mode = 'end'; G.endT = 0;
    ui.end?.(stats());
  }
  function stats() {
    return {
      score: G.score, letters: G.letters, lettersTotal: G.lettersTotal, products: [...G.products],
      rings: G.rings, ringsTotal: G.ringsTotal, time: G.playT,
    };
  }

  // ---------------------------------------------------------------- per-frame visuals
  const tipsW = [V(), V()], side = V();
  function visuals(dt) {
    plane.root.position.copy(F.pos);
    plane.root.rotation.set(-F.pitch, F.yaw, 0, 'YXZ');
    const flutter = (G.mode === 'play' ? 0.02 : 0.012) * Math.sin(G.t * 23) + (F.bump > 0 ? Math.sin(G.t * 60) * 0.12 : 0);
    plane.roll.rotation.z = F.bank + flutter;
    plane.roll.rotation.x = Math.sin(G.t * 1.7) * 0.02;
    plane.root.updateMatrixWorld(true);
    tipsW[0].copy(plane.root.userData.tips[0]).applyMatrix4(plane.mesh.matrixWorld);
    tipsW[1].copy(plane.root.userData.tips[1]).applyMatrix4(plane.mesh.matrixWorld);
    side.set(1, 0, 0).applyQuaternion(plane.root.quaternion);
    side.set(0, 1, 0).applyQuaternion(plane.roll.getWorldQuaternion(new THREE.Quaternion()));
    trail.update(tipsW, side, 0.35 + 0.65 * world.state.night + Math.min(1, F.boost * 0.15));
    lantern.intensity = 6 * world.state.night;
    plane.mat.emissiveIntensity = plane.keel.emissiveIntensity = 0.08 + 0.3 * world.state.night;
    glow.material.opacity = 0.28 + 0.5 * world.state.night;

    let order = 0;
    for (const r of course.rings) {
      const ahead = r.s - F.s;
      const rank = r.state === 'live' ? order++ : -1;
      let target = r.state === 'live' && G.mode !== 'attract' ? (ahead < 140 ? [1, 0.7, 0.35][Math.min(rank, 2)] : 0.15) : 0;
      if (r.gate && (rank > 1 || ahead > 160)) target = 0;
      if (G.mode === 'end') target = 0;
      r.k = damp(r.k, target, 3, dt);
      if (r.state === 'passed') { r.burst = Math.min(1, r.burst + dt * 2.2); r.g.scale.setScalar(1 + r.burst * 0.9); }
      const next = rank === 0;
      const pulse = next ? 1 + 0.25 * Math.sin(G.t * 6) : 0.8;
      // rings right in front of the lens fade so they never smear across the whole screen
      const near = r.state === 'passed' ? 1 : smooth(r.gate ? 9 : 3.5, r.gate ? 26 : 11, camera.position.distanceTo(r.pos));
      r.mat.opacity = clamp(r.k * near * (r.state === 'passed' ? 1 - r.burst : 1), 0, 1);
      r.mat.color.setRGB(3.2 * pulse, 2.0 * pulse, 0.95 * pulse);
      r.halo.material.uniforms.uK.value = r.mat.opacity * (next ? 0.9 : 0.45);
      r.g.visible = r.mat.opacity > 0.01;
      r.torus.rotation.z += dt * (r.gate ? 0.1 : 0.4);
    }
    for (const t of course.targets) {
      const ahead = t.s - F.s;
      const show = t.state === 'live' && (G.mode === 'play' && ahead < 120 && ahead > -26);
      t.k = damp(t.k, show ? 1 : 0, 4, dt);
      t.sp.material.opacity = t.k;
      t.sp.position.y = t.pos.y + 1.6 + Math.sin(G.t * 2.4 + t.s) * 0.25;
      t.beam.material.uniforms.uK.value = t.k;
      t.sp.visible = t.beam.visible = t.k > 0.01;
    }
    for (let i = letters.length - 1; i >= 0; i--) {
      const L = letters[i];
      L.t += dt / L.dur;
      const u = Math.min(1, L.t);
      const e = 1 - Math.pow(1 - u, 2);
      L.mesh.position.lerpVectors(L.from, L.to, e);
      L.mesh.position.y += Math.sin(u * Math.PI) * 2.2;
      L.mesh.rotation.set(Math.sin(u * 7) * 0.6, u * L.spin, Math.cos(u * 5) * 0.4);
      L.mesh.scale.setScalar(1 - 0.5 * u * u);
      if (u >= 1) { scene.remove(L.mesh); letters.splice(i, 1); arrive(L.target); }
    }
    for (let i = 0; i < SPARKS; i++) {
      const s = sparks[i];
      if (s.life > 0) {
        s.life -= dt; s.v.multiplyScalar(1 - dt * 1.8); s.v.y -= dt * 2.2; s.p.addScaledVector(s.v, dt);
      }
      sparkPos[i * 3] = s.p.x; sparkPos[i * 3 + 1] = s.p.y; sparkPos[i * 3 + 2] = s.p.z;
      sparkA[i] = Math.max(0, s.life / s.max);
    }
    sparkGeo.attributes.position.needsUpdate = true; sparkGeo.attributes.alpha.needsUpdate = true;
  }

  // ---------------------------------------------------------------- camera
  const camT = { pos: V(), look: V() };
  const SHOTS = {
    attract: { pos: new THREE.Vector3(-46, 21, 92), look: new THREE.Vector3(8, 15, -30) },
    end: { pos: new THREE.Vector3(30, 20, 128), look: new THREE.Vector3(-4, 15, -36), lookWide: new THREE.Vector3(58, 12, -30), lookTall: new THREE.Vector3(-2, -6, -30) }, // tall: the town sits above the postcard
  };
  function cameraStep(dt) {
    let fovT = 58;
    const aspect = camera.aspect;
    if (G.mode === 'attract') {
      const a = reduced ? 0 : Math.sin(G.t * 0.05) * 0.5;
      camT.pos.copy(SHOTS.attract.pos).add(tmp.set(a * 10, a * 2, 0));
      camT.look.copy(SHOTS.attract.look);
      if (aspect < 1) { camT.pos.set(-18, 26, 112); camT.look.set(6, 14, -20); }
      SPRING.pos.copy(camT.pos); SPRING.look.copy(camT.look); SPRING.init = false;
      fovT = aspect < 1 ? 62 : 44;
      SPRING.fov = fovT; SPRING.roll = 0;
    } else if (G.mode === 'play' || G.mode === 'intro') {
      fwd.set(Math.sin(F.yaw), 0, Math.cos(F.yaw));
      const back = aspect < 1 ? 10 : 8;
      camT.pos.copy(F.pos).addScaledVector(fwd, -back).add(tmp.set(0, 2.3 - F.pitch * 2, 0));
      camT.look.copy(F.pos).addScaledVector(fwd, 10).add(tmp.set(0, 0.9 + F.pitch * 4, 0));
      // keep the camera out of the roofs too
      const floor = world.HF.at(camT.pos.x, camT.pos.z) + 1.2;
      if (camT.pos.y < floor) camT.pos.y = floor;
      if (G.mode === 'intro') {
        G.introT += dt;
        const u = smooth(0, 2.2, G.introT);
        camT.pos.lerpVectors(SHOTS.attract.pos, camT.pos, u);
        camT.look.lerpVectors(SHOTS.attract.look, camT.look, u);
        SPRING.pos.copy(camT.pos); SPRING.look.copy(camT.look);
        if (G.introT > 2.2) { G.mode = 'play'; ui.started?.(); }
      } else if (!SPRING.init) { SPRING.pos.copy(camT.pos); SPRING.look.copy(camT.look); SPRING.init = true; }
      SPRING.pos.x = damp(SPRING.pos.x, camT.pos.x, 5, dt); SPRING.pos.z = damp(SPRING.pos.z, camT.pos.z, 5, dt);
      SPRING.pos.y = damp(SPRING.pos.y, camT.pos.y, 3.6, dt);
      SPRING.look.lerp(camT.look, 1 - Math.exp(-9 * dt));
      fovT = (aspect < 1 ? 70 : 60) + (reduced ? 0 : Math.min(10, F.boost * 1.3 + Math.max(0, F.speed - 14) * 0.6));
      SPRING.roll = damp(SPRING.roll, reduced ? 0 : -F.bank * 0.22, 3, dt);
    } else if (G.mode === 'end') {
      G.endT += dt;
      const u = smooth(0.4, 5.5, G.endT);
      const sp = SHOTS.end.pos.clone(); if (aspect < 1) sp.set(16, 24, 140);
      SPRING.pos.lerp(tmp.lerpVectors(SPRING.pos, sp, u), 1 - Math.exp(-1.2 * dt));
      SPRING.look.lerp(tmp2.lerpVectors(F.pos, aspect > 1.25 ? SHOTS.end.lookWide : aspect < 1 ? SHOTS.end.lookTall : SHOTS.end.look, u), 1 - Math.exp(-1.5 * dt));
      SPRING.roll = damp(SPRING.roll, 0, 1, dt);
      fovT = aspect < 1 ? 64 : 46;
    }
    SPRING.fov = damp(SPRING.fov, fovT, 2.5, dt);
    camera.fov = SPRING.fov;
    camera.position.copy(SPRING.pos);
    if (G.shake > 0) { camera.position.add(tmp.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(G.shake * 0.3)); G.shake = Math.max(0, G.shake - dt * 2); }
    camera.lookAt(SPRING.look);
    camera.rotateZ(SPRING.roll);
    camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- loop
  let size = [0, 0];
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || (w === size[0] && h === size[1])) return;
    size = [w, h];
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    if (bloom) bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    sparkMat.uniforms.uScale.value = h * quality.dpr * 0.9;
  }
  function step(dt) {
    G.t += dt;
    if (G.mode === 'attract') { attractStep(dt); G.e = SUN_START + 0.4 * Math.sin(G.t * 0.03); }
    else if (G.mode === 'intro') { flightStep(dt); }
    else if (G.mode === 'play') gameStep(dt);
    else if (G.mode === 'end') {
      // keep gliding out over the bay into the sunset, while the town finishes lighting up
      F.pitch = damp(F.pitch, 0.05, 1, dt); F.bank = damp(F.bank, 0, 1, dt);
      fwd.set(Math.sin(F.yaw) * Math.cos(F.pitch), Math.sin(F.pitch), Math.cos(F.yaw) * Math.cos(F.pitch));
      F.pos.addScaledVector(fwd, 12 * dt);
      G.e = damp(G.e, -5.8, 0.35, dt);
    }
    if (folk) folk.update(dt);
    world.setSun(G.e, G.t);
    world.tick(G.t);
    world.updateLights(dt, G.mode === 'play' || G.mode === 'intro' ? F.pos : null);
    if (G.mode === 'end') for (const h of world.houses) h.lit = Math.max(h.lit, smooth(1, 6, G.endT) * (0.6 + 0.4 * h.b.threshold));
    visuals(dt);
    cameraStep(dt);
  }
  function render() {
    resize();
    if (!size[0]) return;
    if (composer) composer.render(); else renderer.render(scene, camera);
  }

  let last = performance.now(), running = false, raf = 0, hudT = 0;
  const frames = [];
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt);
    render();
    hudT += dt;
    if (hudT > 0.1 && (G.mode === 'play' || G.mode === 'end')) { hudT = 0; ui.hud?.(hud()); }
    if (G.mode === 'play') adapt(dt);
    pointerArrow();
  }
  // adaptive quality: if frames run long, step the resolution down once or twice
  let adaptT = 0, adaptN = 0, drops = 0;
  function adapt(dt) {
    adaptT += dt; adaptN++;
    if (adaptT < 2.5) return;
    const avg = adaptT / adaptN; adaptT = 0; adaptN = 0;
    if (avg > 1 / 42 && drops < 2) {
      drops++;
      renderer.setPixelRatio(Math.max(0.75, renderer.getPixelRatio() * 0.75));
      size = [0, 0];
      if (drops === 2 && bloom) bloom.enabled = false;
    }
  }
  function hud() {
    const night = world.state.night;
    const minutes = 20 * 60 + 41 + Math.round((SUN_START - G.e) * 4.6); // a sunset at 20:41, four and a half minutes per degree
    return { ...stats(), e: G.e, clock: `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`, combo: G.combo, progress: F.s / course.length, night };
  }
  // an arrow at the screen edge toward the next delivery when it is off screen
  const pv = V();
  function pointerArrow() {
    if (G.mode !== 'play') { ui.arrow?.(null); return; }
    const t = course.targets.find((q) => q.state === 'live' && q.s > F.s - 10);
    if (!t || t.s - F.s > 70) { ui.arrow?.(null); return; }
    pv.copy(t.pos).project(camera);
    const behind = pv.z > 1;
    if (!behind && Math.abs(pv.x) < 0.92 && Math.abs(pv.y) < 0.9) { ui.arrow?.(null); return; }
    let x = behind ? -pv.x : pv.x, y = behind ? -pv.y : pv.y;
    const a = Math.atan2(y, x);
    ui.arrow?.({ a, x: clamp(x, -0.9, 0.9), y: clamp(y, -0.85, 0.85), kind: t.kind });
  }

  // ---------------------------------------------------------------- API
  const api = {
    renderer, world, course, G, F, input, camera, folkReady,
    start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    renderOnce() { step(0.016); render(); },
    play() {
      resetFlight();
      G.mode = 'intro'; G.introT = 0;
      input.lastMove = 0;
      SPRING.init = false;
    },
    skip() {
      if (G.mode === 'play' || G.mode === 'intro') { G.mode = 'play'; endRound(); }
    },
    toAttract() { G.mode = 'attract'; resetFlight(); F.attractPrimed = false; },
    // run the simulation without rendering (headless screenshots, tests)
    simulate(seconds, mode = 'play') {
      if (mode === 'play' && G.mode === 'attract') { api.play(); G.introT = 2.3; }
      // coarse steps keep headless shots quick; the last second runs at 60 Hz so trails and springs settle
      const coarse = Math.max(0, seconds - 1.2), n1 = Math.round(coarse * 20);
      for (let i = 0; i < n1; i++) step(1 / 20);
      for (let i = 0, n2 = Math.round((seconds - coarse) * 60); i < n2; i++) step(1 / 60);
    },
    setInput(x, y, active) {
      input.x = x; input.y = y; input.active = active;
      input.lastMove = performance.now();
    },
    stats, hud,
    debugMap() {
      const cam = new THREE.OrthographicCamera(-115, 115, 72, -72, 1, 500);
      cam.position.set(-5, 200, -15); cam.up.set(0, 0, -1); cam.lookAt(-5, 0, -15);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(course.samples.map((p) => p.clone().setY(80))), new THREE.LineBasicMaterial({ color: 0xff2266 }));
      scene.add(line);
      for (const t of course.targets) { const m = new THREE.Mesh(new THREE.SphereGeometry(t.kind === 'product' ? 2.4 : 1.4), new THREE.MeshBasicMaterial({ color: t.kind === 'product' ? 0x00ffcc : 0xffee00 })); m.position.copy(t.pos).setY(81); scene.add(m); }
      world.setSun(8); renderer.render(scene, cam);
      return { len: course.length, targets: course.targets.length, rings: course.rings.length, profile: course.samples.filter((_, i) => i % 20 === 0).map((p) => [Math.round(p.x), Math.round(p.y), Math.round(p.z)]) };
    },
  };
  return api;
}
