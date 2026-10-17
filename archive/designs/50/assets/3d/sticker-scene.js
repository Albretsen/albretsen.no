// Sticker-sheet scene for design 50 ("IR//PEEL").
// Pixel sprites printed on real glossy vinyl, lit in infrared colours.
// Used to bake the hero stills, the product visuals and the scroll-scrub frames,
// and usable live: build({ canvas, mode }) then scene.setPeel(0..1) + scene.render().
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const BASE = new URL('./', import.meta.url).href;
const C = {
  void: '#0d031e', v900: '#230445', violet: '#4b1788', ultra: '#8038d1', magenta: '#f315a2',
  hot: '#fa5e75', orange: '#fa8233', amber: '#fec766', phosphor: '#f2ed2b', vinyl: '#f6f3fc', liner: '#ece6f4',
};

const loadTex = (url) => new Promise((res, rej) => new THREE.TextureLoader().load(url, res, undefined, rej));

function silhouette(img, color) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  // faint liner print on the sticker back
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(75,23,136,0.10)';
  x.font = `${Math.round(c.width / 22)}px Silkscreen, monospace`;
  for (let y = 0; y < c.height + 40; y += c.width / 9) {
    for (let xx = -40; xx < c.width; xx += c.width / 2.6) x.fillText('ALBRETSEN AS', xx + (y / 3) % 60, y);
  }
  return c;
}

function linerCanvas(opts) {
  const W = 2400, H = 1680; // 10 x 7 units at 240 px/unit
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = C.liner; x.fillRect(0, 0, W, H);
  // micro grid
  x.strokeStyle = 'rgba(128,56,209,0.10)'; x.lineWidth = 2;
  for (let i = 0; i <= W; i += 60) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  for (let i = 0; i <= H; i += 60) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
  // pixel corner ticks
  x.fillStyle = C.violet;
  const tick = (px, py, sx, sy) => { for (let i = 0; i < 6; i++) { x.fillRect(px + sx * i * 8, py, 8, 8); x.fillRect(px, py + sy * i * 8, 8, 8); } };
  tick(40, 40, 1, 1); tick(W - 48, 40, -1, 1); tick(40, H - 48, 1, -1); tick(W - 48, H - 48, -1, -1);
  x.font = '30px Silkscreen, monospace'; x.fillStyle = C.violet; x.textBaseline = 'top';
  x.fillText('ALBRETSEN AS', 120, 46);
  x.fillStyle = C.ultra; x.fillText('SHEET 01 / IR SERIES', 120, 84);
  x.textAlign = 'right'; x.fillStyle = C.violet;
  x.fillText(opts.footer || 'ALBRETSEN.NO', W - 120, H - 84);
  x.textAlign = 'left';
  return { c, x, W, H, ppu: 240 };
}

function u2px(L, ux, uy) { return [L.W / 2 + ux * L.ppu, L.H / 2 - uy * L.ppu]; }

// Page-curl deformation around a cylinder, peeling from a corner along dir.
function curl(geo, base, corner, dir, s, R, lift) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = base[i * 3], py = base[i * 3 + 1];
    const t = (px - corner.x) * dir.x + (py - corner.y) * dir.y;
    let nt = t, z = 0;
    if (t < s) {
      const u = s - t, th = u / R;
      if (th < Math.PI) { nt = s - R * Math.sin(th); z = R * (1 - Math.cos(th)); }
      else { nt = s + (u - Math.PI * R); z = 2 * R; }
    }
    pos.setXYZ(i, px + dir.x * (nt - t), py + dir.y * (nt - t), z + lift);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

export async function build({ canvas, width, height, dpr = 1, mode = 'sheet', product = 'mcp-emails', label = '', hdr = true, texBase = BASE + 'tex/', texExt = '.webp' }) {
  await document.fonts.load('30px Silkscreen').catch(() => {});
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.void);
  const pmrem = new THREE.PMREMGenerator(renderer);
  if (hdr) {
    try {
      const h = await new RGBELoader().loadAsync(texBase + 'studio.hdr');
      scene.environment = pmrem.fromEquirectangular(h).texture;
      scene.environmentIntensity = 0.42;
    } catch { scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.1; }
  } else { scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.1; }

  // lights: warm key, magenta rim, violet fill
  const key = new THREE.DirectionalLight('#fff1f7', 2.2);
  key.position.set(-5, 4, 9); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 6, bottom: -6, near: 1, far: 30 });
  scene.add(key);
  const rim = new THREE.PointLight(C.magenta, 60, 30, 1.6); rim.position.set(7, -4, 2.2); scene.add(rim);
  const rim2 = new THREE.PointLight(C.orange, 30, 30, 1.6); rim2.position.set(-8, 5, 2.0); scene.add(rim2);
  scene.add(new THREE.HemisphereLight('#c9a8ff', C.v900, 0.5));

  const normal = await loadTex(BASE + '../extras/vinyl-normal.jpg');
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;

  // table
  const tableN = normal.clone(); tableN.repeat.set(8, 8); tableN.needsUpdate = true;
  const table = new THREE.Mesh(new THREE.PlaneGeometry(60, 40),
    new THREE.MeshStandardMaterial({ color: '#1b0838', roughness: 0.92, normalMap: tableN, normalScale: new THREE.Vector2(0.6, 0.6) }));
  table.position.z = -0.03; table.receiveShadow = true; scene.add(table);

  const L = linerCanvas({ footer: label || 'ALBRETSEN.NO' });
  const stickers = [];
  const imgs = {};
  const getImg = (n) => imgs[n] || (imgs[n] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = texBase + n + texExt; }));

  async function sticker(name, cx, cy, w, rotDeg = 0, segs = 1) {
    const img = await getImg(name);
    const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
    const backTex = new THREE.CanvasTexture(silhouette(img, '#efe9f8')); backTex.colorSpace = THREE.SRGBColorSpace;
    const h = w * img.height / img.width;
    const geo = new THREE.PlaneGeometry(w, h, segs, segs);
    const front = new THREE.MeshPhysicalMaterial({ map: tex, alphaTest: 0.5, roughness: 0.34, clearcoat: 0.5, clearcoatRoughness: 0.12, side: THREE.FrontSide });
    const back = new THREE.MeshStandardMaterial({ map: backTex, alphaTest: 0.5, roughness: 0.55, normalMap: normal, normalScale: new THREE.Vector2(0.25, 0.25), side: THREE.BackSide });
    const g = new THREE.Group();
    const mf = new THREE.Mesh(geo, front), mb = new THREE.Mesh(geo, back);
    for (const m of [mf, mb]) {
      m.castShadow = true; m.receiveShadow = true;
      m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
      g.add(m);
    }
    g.position.set(cx, cy, 0.012); g.rotation.z = THREE.MathUtils.degToRad(rotDeg);
    scene.add(g);
    const s = { name, g, geo, w, h, base: Float32Array.from(geo.attributes.position.array) };
    stickers.push(s);
    // kiss-cut ghost on the liner (a faint outline where the sticker sits)
    const [px, py] = u2px(L, cx, cy);
    L.x.save(); L.x.translate(px, py); L.x.rotate(-THREE.MathUtils.degToRad(rotDeg));
    L.x.globalAlpha = 0.18; L.x.filter = 'blur(1px)';
    L.x.drawImage(silhouette(img, C.ultra), -w * L.ppu / 2 - 3, -h * L.ppu / 2 - 3, w * L.ppu + 6, h * L.ppu + 6);
    L.x.restore();
    return s;
  }

  const sheet = new THREE.Group(); scene.add(sheet);
  let hero = null;
  const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100);

  if (mode === 'sheet') {
    // the "underdrawing" printed under the big mark sticker
    const eye = await getImg('ir-eye');
    const [ex, ey] = u2px(L, -2.45, 0.05);
    const ew = 2.9 * L.ppu, eh = ew * eye.height / eye.width;
    L.x.imageSmoothingEnabled = false;
    {
      const mk = await getImg('st-mark');
      const mw = 3.9 * L.ppu * 0.985, mh = mw * mk.height / mk.width;
      L.x.drawImage(silhouette(mk, C.void), ex - mw / 2, ey - mh / 2, mw, mh);
    }
    L.x.drawImage(eye, ex - ew / 2, ey - eh / 2 - 30, ew, eh);
    L.x.font = '26px Silkscreen, monospace'; L.x.fillStyle = C.amber; L.x.textAlign = 'center';
    L.x.fillText('UNDERDRAWING 01', ex, ey + 1.12 * L.ppu);
    L.x.fillStyle = C.ultra; L.x.font = '20px Silkscreen, monospace';
    L.x.fillText('EYE MINIATURE / THE MET / CC0', ex, ey + 1.32 * L.ppu);
    L.x.textAlign = 'left';

    hero = await sticker('st-mark', -2.45, 0.05, 3.9, 0, 140);
    await sticker('prod-mcp-emails', 1.55, 1.55, 1.85, -4);
    await sticker('prod-fun-libs', 3.65, 1.6, 1.8, 3);
    await sticker('prod-toolrails', 1.6, -0.6, 1.8, 2);
    await sticker('prod-harbor', 3.7, -0.55, 1.8, -3);
    const small = [['st-bolt', -4.0, -2.55, 1.15, 8], ['st-cursor', -2.75, -2.6, 0.95, -6], ['st-terminal', -1.15, -2.55, 1.4, 3],
      ['st-key', 0.75, -2.6, 1.35, -10], ['st-spark', 2.2, -2.55, 1.0, 0], ['st-aperture', 3.55, -2.55, 1.15, 12],
      ['st-planet', -0.3, 2.62, 1.35, -8], ['st-floppy', 0.25, 0.55, 0.95, 6]];
    for (const a of small) await sticker(...a);
    // peel hint printed by the mark's corner
    const [hx, hy] = u2px(L, -0.35, 2.15);
    L.x.font = '34px Silkscreen, monospace'; L.x.fillStyle = C.magenta; L.x.fillText('PEEL HERE', hx - 330, hy - 10);
    L.x.fillRect(hx - 330, hy + 34, 260, 6);
    camera.position.set(0.15, -6.2, 15.2); camera.up.set(Math.sin(-0.07), Math.cos(-0.07), 0); camera.lookAt(0.15, -0.1, 0);
  } else if (mode === 'product') {
    const plates = { 'mcp-emails': 'ir-fireworks', 'fun-libs': 'ir-piazza', 'toolrails': 'ir-brooch', 'harbor': 'ir-eye' };
    const plate = await getImg(plates[product] || 'ir-fireworks');
    const pt = new THREE.Texture(plate); pt.colorSpace = THREE.SRGBColorSpace; pt.magFilter = THREE.NearestFilter; pt.minFilter = THREE.LinearMipmapLinearFilter; pt.needsUpdate = true;
    const pw = 11.5, ph = Math.max(7.6, pw * plate.height / plate.width);
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(pw, pw * plate.height / plate.width),
      new THREE.MeshPhysicalMaterial({ map: pt, roughness: 0.62, clearcoat: 0.15, normalMap: normal, normalScale: new THREE.Vector2(0.18, 0.18) }));
    poster.receiveShadow = true; poster.position.z = 0.001; scene.add(poster);
    hero = await sticker('prod-' + product, 0.2, 0.25, 3.2, -4, 120);
    await sticker('st-cursor', 2.35, -1.6, 0.85, -14);
    await sticker('st-spark', -2.05, 1.85, 0.8, 0);
    // printed label sticker
    const lc = document.createElement('canvas'); lc.width = 2400; lc.height = 200;
    const lx = lc.getContext('2d');
    lx.fillStyle = C.vinyl; lx.beginPath(); lx.roundRect(0, 0, 2400, 200, 36); lx.fill();
    lx.fillStyle = C.void; lx.beginPath(); lx.roundRect(22, 22, 2356, 156, 22); lx.fill();
    lx.font = '64px Silkscreen, monospace'; lx.fillStyle = C.vinyl; lx.textBaseline = 'middle';
    const parts = label.toUpperCase().split(' / ');
    let x0 = 70; parts.forEach((t, i) => { lx.fillStyle = [C.vinyl, C.phosphor, C.orange][i] || C.vinyl; lx.fillText(t, x0, 104); x0 += lx.measureText(t).width + 70; if (i < parts.length - 1) { lx.fillStyle = C.magenta; lx.fillRect(x0 - 46, 80, 18, 48); } });
    const usedW = Math.min(2400, x0 - 10);
    const lab = document.createElement('canvas'); lab.width = usedW; lab.height = 200;
    const lb = lab.getContext('2d'); lb.fillStyle = C.vinyl; lb.beginPath(); lb.roundRect(0, 0, usedW, 200, 36); lb.fill();
    lb.drawImage(lc, 0, 0, usedW - 40, 200, 0, 0, usedW - 40, 200);
    lb.fillStyle = C.void; lb.beginPath(); lb.roundRect(usedW - 60, 22, 38, 156, [0, 22, 22, 0]); lb.fill();
    imgs['label'] = Promise.resolve(lab);
    const lw = usedW / 200 * 0.42;
    await sticker('label', -3.2 + lw / 2, -2.05, lw, 2);
    camera.position.set(0.2, -5.2, 10.5); camera.up.set(Math.sin(0.05), Math.cos(0.05), 0); camera.lookAt(0.0, -0.15, 0);
    sheet.visible = false;
  } else if (mode === 'retired') {
    const list = [['st-polyglot-pilot', -2.6, 1.0, 1.6, -8], ['st-pinpoint', -0.6, 1.25, 1.35, 6], ['prod-luma', 1.45, 1.0, 1.75, -3],
      ['st-webvakt', 3.4, 1.15, 1.6, 9], ['st-joke-central', -2.2, -1.25, 1.45, 10], ['st-tryggere-hyring', -0.2, -1.2, 1.4, -6],
      ['st-early-apps', 1.7, -1.25, 1.2, 4]];
    for (const a of list) { const s = await sticker(a[0], a[1], a[2], a[3], a[4], 60); }
    const [lx, ly] = u2px(L, -4.3, -2.75);
    L.x.font = '30px Silkscreen, monospace'; L.x.fillStyle = C.violet; L.x.fillText('RETIRED / PEELED / KEPT', lx, ly);
    camera.position.set(0.2, -5.2, 12.5); camera.lookAt(0.2, -0.1, 0);
  }

  const linerTex = new THREE.CanvasTexture(L.c); linerTex.colorSpace = THREE.SRGBColorSpace; linerTex.anisotropy = 8;
  const liner = new THREE.Mesh(new THREE.PlaneGeometry(10, 7),
    new THREE.MeshPhysicalMaterial({ map: linerTex, roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.45, normalMap: normal, normalScale: new THREE.Vector2(0.12, 0.12) }));
  liner.receiveShadow = true; liner.castShadow = true; sheet.add(liner);
  // slight sheet thickness shadow
  liner.position.z = 0.0;

  function setPeel(p, opts = {}) {
    if (!hero) return;
    const ud = hero.g.userData;
    if (ud.x0 === undefined) Object.assign(ud, { x0: hero.g.position.x, y0: hero.g.position.y, r0: hero.g.rotation.z });
    const dir = new THREE.Vector2(-1, -1).normalize();
    const corner = new THREE.Vector2(hero.w / 2, hero.h / 2);
    const diag = (hero.w + hero.h) / Math.SQRT2;
    const ease = (q) => 0.5 - Math.cos(Math.PI * q) / 2;
    // phase 1 (0..0.62): curl travels across ~70% of the sticker
    const q = Math.min(1, p / 0.62);
    const fly = Math.max(0, (p - 0.55) / 0.45);
    const f2 = ease(fly);
    if (opts.curlOnly) { curl(hero.geo, hero.base, corner, dir, p * diag, opts.R ?? 0.3, 0); return; }
    const R = (opts.R ?? 0.3) + f2 * 1.4;
    const s = ease(q) * diag * 0.72 + f2 * diag * 0.25;
    curl(hero.geo, hero.base, corner, dir, s, R, 0);
    // phase 2: lift away toward the top right, out of frame
    hero.g.position.set(ud.x0 + f2 * f2 * 7.5, ud.y0 + f2 * f2 * 9.5, 0.012 + f2 * 2.2);
    hero.g.rotation.set(f2 * 0.55, -f2 * 0.25, ud.r0 - f2 * 0.5);
  }

  return {
    renderer, scene, camera, setPeel,
    render() { renderer.render(scene, camera); },
    resize(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); },
  };
}
