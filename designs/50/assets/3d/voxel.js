// Voxel sprite viewer: loads one of the voxel-*.glb files and lets people spin it.
// mountVoxel(el, { src, pixel: 0.5, autoRotate: true }) -> { setSrc, setPixel, dispose }
// "pixel" renders at a fraction of device resolution and upscales with nearest-neighbour,
// so the 3D object reads like a pre-rendered 16-bit sprite.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function mountVoxel(el, { src, pixel = 0.5, autoRotate = true, background = null } = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block;image-rendering:pixelated;touch-action:none;cursor:grab';
  el.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: background === null });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  if (background) scene.background = new THREE.Color(background);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  const key = new THREE.DirectionalLight('#fff1f7', 2.4); key.position.set(-2, 3, 4); scene.add(key);
  const rim = new THREE.PointLight('#f315a2', 14, 12); rim.position.set(2.4, -0.6, -1.5); scene.add(rim);
  const rim2 = new THREE.PointLight('#fa8233', 8, 12); rim2.position.set(-2.5, -1.2, 1.2); scene.add(rim2);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50); cam.position.set(0.7, 0.55, 4.8);
  const controls = new OrbitControls(cam, canvas);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 2.2; controls.maxDistance = 6;
  controls.autoRotate = autoRotate; controls.autoRotateSpeed = 2.2;
  canvas.addEventListener('pointerdown', () => { canvas.style.cursor = 'grabbing'; controls.autoRotate = false; });
  canvas.addEventListener('pointerup', () => { canvas.style.cursor = 'grab'; setTimeout(() => (controls.autoRotate = autoRotate), 2500); });
  let obj = null, px = pixel, raf = 0, t0 = performance.now();
  const loader = new GLTFLoader();
  function setSrc(url) {
    loader.load(url, (g) => {
      if (obj) scene.remove(obj);
      obj = g.scene;
      obj.traverse((o) => { if (o.isMesh) o.material.vertexColors = true; });
      scene.add(obj);
    });
  }
  function size() {
    const r = el.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2) * px);
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / Math.max(1, r.height); cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(size); ro.observe(el); size();
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (obj) obj.position.y = Math.sin((t - t0) / 900) * 0.05; // idle bob
    controls.update(); renderer.render(scene, cam);
  }
  setSrc(src); raf = requestAnimationFrame(loop);
  return {
    setSrc, setPixel(v) { px = v; size(); },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); canvas.remove(); },
  };
}
