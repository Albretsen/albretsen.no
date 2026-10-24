// Living Town: the 3D scene. Loaded after first paint by main.js.
import * as THREE from 'three';
import { Townsfolk } from '../../_shared/3d/people/people.js';
import { elevation, smooth, nightAmount } from './time.js';
import { makeSkyUniforms, createSky, createSea, LightRig } from './sky.js';
import { Post } from './post.js';
import { CameraRig, homeView } from './camera.js';
import { buildTown, FRONT, DANCE } from './town.js';
import { Life } from './life.js';
import { TownLights, makeGlowPools } from './lights.js';

export async function createLivingTown(canvas, { lite = false, reduced = false, adaptive = true, onProgress = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false });
  const maxDpr = lite ? 1.25 : 1.75;
  let dpr = Math.min(devicePixelRatio || 1, maxDpr);
  renderer.setPixelRatio(dpr);
  renderer.setSize(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight, false);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.info.autoReset = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 140, 900);
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 1, 3000);

  const U = makeSkyUniforms();
  scene.add(createSky(U));
  const sea = createSea(U);
  scene.add(sea);
  const rig = new LightRig(scene, { shadowSize: lite ? 1024 : 2048, center: new THREE.Vector3(0, 0, 14) });

  // ---------------------------------------------------------------- load the town and its people
  let pTown = 0, pPeople = 0;
  const report = () => onProgress(pTown * 0.7 + pPeople * 0.3);
  const world = await buildTown({ lite, onProgress: (p) => { pTown = p; report(); } });
  scene.add(world.root);
  const life = new Life(scene, world);
  await life.spawn(new Townsfolk(), { onProgress: (p) => { pPeople = p; report(); } });
  const lights = new TownLights(world, life);
  const glow = makeGlowPools(world);
  scene.add(glow.group);

  // a few real lights where people gather after dark
  const warm = new THREE.Color('#ffbf73');
  const pl = (x, y, z) => { const l = new THREE.PointLight(warm, 0, 0, 2); l.position.set(x, y, z); scene.add(l); return l; };
  const lampLights = [-18, -8, 2, 12, 22].map((x) => ({ l: pl(x, 3.6, 24.0), x }));
  const danceLight = pl(DANCE.x, 3.2, DANCE.z);
  const cafeLight = pl(-6, 3.0, 13.2);
  const cafeLight2 = pl(-6, 3.4, 9.6);

  // ---------------------------------------------------------------- post + camera
  const post = new Post(renderer, { msaa: lite ? 0 : 4, taps: lite ? 14 : 30, bloomScale: lite ? 0.35 : 0.5 });
  const cam = new CameraRig(camera, canvas, { reduced });

  const state = { hour: 12, e: 30, focusOn: null, aperture: 16, focusDist: 70, tilt: 0.3, quality: 1 };

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // narrow screens see less of the promenade: back off a little
    camera.fov = w / h < 0.8 ? 42 : 30;
    camera.updateProjectionMatrix();
    post.setSize();
  }
  resize();
  cam.set(homeView(camera.aspect));

  function setHour(h) {
    state.hour = h;
    state.e = rig.apply(h, U, sea, scene);
  }
  setHour(12);

  const tmp = new THREE.Vector3();
  let frames = 0, acc = 0, lastCheck = 0;

  function frame(dt) {
    renderer.info.reset();
    const h = state.hour, e = state.e;
    U.uTime.value += dt;
    sea.userData.u.uCam.value.copy(camera.position);
    life.update(dt, h);
    const lift = nightAmount(h);
    if (Math.abs(lift - (state._lift ?? -1)) > 0.01) { state._lift = lift; for (const p of life.people) p.nightLift(lift); }
    lights.update(dt, h, e);
    cam.update(dt);

    // light pools and real lights follow the lamps
    for (const p of glow.pools) p.m.material.opacity = p.src.level * 0.55;
    for (const L of lampLights) { const lamp = world.lamps.find((l) => l.x === L.x + 0) || world.lamps.reduce((a, b) => (Math.abs(b.x - L.x) < Math.abs(a.x - L.x) ? b : a)); L.l.intensity = lamp.level * 26; }
    danceLight.intensity = lights.level.dance * 30;
    cafeLight.intensity = lights.level.cafe * 22;
    cafeLight2.intensity = lights.level.cafe * 14;

    // post: focus follows the camera target, or whoever was clicked
    const night = nightAmount(h);
    post.bloom.strength = 0.1 + 0.34 * night;
    post.bloom.threshold = 1.7 - 0.3 * night;
    post.bloom.radius = 0.28;
    const target = state.focusOn ? state.focusOn.getWorldPosition(tmp).setY(1.1) : cam.cur.target;
    const fd = camera.position.distanceTo(target);
    state.focusDist += (fd - state.focusDist) * (state.snapFocus ? 1 : Math.min(1, dt * 6));
    state.snapFocus = false;
    post.U.uFocus.value = state.focusDist;
    const ap = state.focusOn ? 26 : state.aperture;
    post.U.uAperture.value += (ap * dpr - post.U.uAperture.value) * Math.min(1, dt * 3);
    post.U.uMaxBlur.value = (lite ? 6 : 10) * dpr;
    post.U.uTilt.value += (state.tilt - post.U.uTilt.value) * Math.min(1, dt * 3);
    post.U.uExposure.value = 0.98 + 0.08 * smooth(30, 5, state.e) + 0.34 * night;
    post.U.uLift.value.setRGB(0.012, 0.01, 0.03 + 0.02 * night);
    post.U.uGain.value.setRGB(1.0, 0.985, 0.97);
    post.render(scene, camera, dt);

    // adaptive resolution: keep it smooth on slower machines
    frames++; acc += dt;
    if (adaptive && acc - lastCheck > 2.5) {
      const fps = frames / (acc - lastCheck);
      frames = 0; lastCheck = acc;
      if (fps < 42 && dpr > 0.75) { dpr = Math.max(0.75, dpr - 0.25); resize(); }
      else if (fps > 58 && dpr < Math.min(devicePixelRatio || 1, maxDpr)) { dpr = Math.min(maxDpr, dpr + 0.25); resize(); }
    }
  }

  return { THREE, renderer, scene, camera, cam, post, world, life, lights, state, setHour, frame, resize, get HOME_VIEW() { return homeView(camera.aspect); }, FRONT, U };
}

export { elevation, smooth };
