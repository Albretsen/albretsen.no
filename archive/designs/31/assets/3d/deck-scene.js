// Honest Deck — the self-dealing card scene.
// One three.js scene, two uses:
//   1. baked: render.html calls setProgress(p) frame by frame to pre-render the hero image sequence and stills
//   2. live:  createDeck(canvas, {live:true}) deals itself on load, follows the pointer, answers keys
// Everything is built from primitives (extruded rounded rects, spheres, tori) plus canvas-drawn card faces
// that frame the REAL product logos from designs/_shared/products. Logos are drawn as-is, never recoloured.
import * as THREE from 'three';

export const PALETTE = {
  apple: '#aced37', appleDeep: '#46ac2a', lemon: '#f5f372', bubble: '#ff9fc6', hot: '#fa4095',
  grape: '#935edf', lilac: '#d6bef5', tang: '#ffa75a', ice: '#99e6f9', cream: '#f5f9ea',
  night: '#10081d', plum: '#25102d', ink: '#132717',
};
const P = PALETTE;

// Base URL of the real product assets, relative to this module.
const PRODUCTS = new URL('../../../_shared/products/', import.meta.url).href;

// The deck. Facts come from designs/_shared/content.js; nothing here is invented.
export const CARDS = [
  { id: 'mcp-emails', name: 'MCP Emails', status: 'live', since: 2026, fig: '$782', figLabel: 'MRR', note: '17 tools · ~100 providers · AGPL', logo: 'mcp-emails/logo-mark.svg', accent: P.apple, face: P.cream },
  { id: 'fun-libs', name: 'Fun Libs', status: 'live', since: 2019, fig: '113,000+', figLabel: 'installs', note: 'built at 17 · no marketing', logo: 'fun-libs/icon.png', logoRadius: 0.22, accent: P.lemon, face: P.cream },
  { id: 'toolrails', name: 'Toolrails', status: 'building', since: 2026, fig: '4', figLabel: 'connectors', note: 'tool search · injection guard', logo: 'toolrails/icon.svg', accent: P.ice, face: P.cream },
  { id: 'harbor', name: 'Harbor', status: 'paused', since: 2026, fig: '549', figLabel: 'commits', note: 'self-hostable · AI edits held', logo: 'harbor/harbor-mark.svg', logoColor: '#F2EFE8', accent: P.lilac, face: '#1b1b1b', dark: true },
  { id: 'luma', name: 'Luma', status: 'retired', since: 2026, fig: '378', figLabel: 'commits', note: 'open-banking budgets', logo: 'luma/logo.png', logoWide: true, accent: P.bubble, face: P.cream },
  { id: 'pinpoint', name: 'PinPoint', status: 'retired', since: 2025, fig: '16', figLabel: 'commits', note: 'GeoGuessr, your photos', standIn: 'pin', accent: P.tang, face: P.cream },
  { id: 'polyglot-pilot', name: 'Polyglot Pilot', status: 'retired', since: 2025, fig: '—', figLabel: 'retired', note: 'agents that localised code', standIn: 'glyph', accent: P.grape, face: P.cream },
  { id: 'webvakt', name: 'WebVakt', status: 'retired', since: 2024, fig: '—', figLabel: 'retired', note: 'website change monitoring', standIn: 'eye', accent: P.hot, face: P.cream },
];

const CW = 1.0, CH = 1.4, CD = 0.018, CR = 0.075; // card size in world units
const TEX_W = 720, TEX_H = 1008;

// ---------------------------------------------------------------- helpers
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t, s = 1.25) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

function loadImage(src) {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

// Harbor's mark uses currentColor; we feed it the cream from Harbor's own banner.
async function loadLogo(card) {
  if (!card.logo) return null;
  const url = PRODUCTS + card.logo;
  if (card.logoColor && url.endsWith('.svg')) {
    const txt = await fetch(url).then((r) => r.text()).catch(() => null);
    if (!txt) return null;
    const svg = txt.replace(/currentColor/g, card.logoColor);
    return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }
  return loadImage(url);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// soft airbrush blob
function airbrush(ctx, x, y, r, color, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

function grain(ctx, w, h, amt = 14, seed = 7) {
  const d = ctx.getImageData(0, 0, w, h);
  let s = seed;
  for (let i = 0; i < d.data.length; i += 4) {
    s = (s * 16807) % 2147483647;
    const n = ((s / 2147483647) - 0.5) * amt;
    d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n;
  }
  ctx.putImageData(d, 0, 0);
}

// The four suits are the brand's spark words: signal, density, echo, and the A.
export function drawSuit(ctx, kind, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round';
  if (kind === 'echo') {
    ctx.beginPath(); ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = s * 0.09;
    for (const r of [0.36, 0.5]) { ctx.beginPath(); ctx.arc(0, 0, s * r, 0, Math.PI * 2); ctx.stroke(); }
  } else if (kind === 'signal') {
    ctx.lineWidth = s * 0.1;
    ctx.beginPath(); ctx.arc(-s * 0.3, s * 0.3, s * 0.1, 0, Math.PI * 2); ctx.fill();
    for (const r of [0.38, 0.62]) { ctx.beginPath(); ctx.arc(-s * 0.3, s * 0.3, s * r, -Math.PI / 2, 0); ctx.stroke(); }
  } else if (kind === 'density') {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      ctx.beginPath(); ctx.arc((i - 1) * s * 0.32, (j - 1) * s * 0.32, s * (0.07 + 0.03 * ((i + j) % 2 ? 0 : 1)), 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // the A: two leaning bars + crossbar
    ctx.lineWidth = s * 0.16;
    ctx.beginPath(); ctx.moveTo(-s * 0.32, s * 0.45); ctx.lineTo(-s * 0.06, -s * 0.45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.32, s * 0.45); ctx.lineTo(s * 0.06, -s * 0.45); ctx.stroke();
    ctx.lineWidth = s * 0.1;
    ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.12); ctx.lineTo(s * 0.3, s * 0.12); ctx.stroke();
  }
  ctx.restore();
}
const SUITS = ['signal', 'density', 'echo', 'a'];

function drawStandIn(ctx, kind, cx, cy, s, accent) {
  // Respectful stand-ins for retired products that left no brand behind.
  ctx.save();
  ctx.translate(cx, cy);
  const g = ctx.createLinearGradient(0, -s, 0, s);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, accent); g.addColorStop(1, P.grape);
  ctx.fillStyle = g; ctx.strokeStyle = P.night; ctx.lineWidth = s * 0.05;
  if (kind === 'pin') {
    ctx.beginPath();
    ctx.arc(0, -s * 0.25, s * 0.55, Math.PI * 0.85, Math.PI * 0.15);
    ctx.lineTo(0, s * 0.85); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = P.cream; ctx.beginPath(); ctx.arc(0, -s * 0.25, s * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (kind === 'glyph') {
    roundRect(ctx, -s * 0.8, -s * 0.6, s * 1.6, s * 1.2, s * 0.25); ctx.fill(); ctx.stroke();
    ctx.fillStyle = P.night; ctx.font = `700 ${s * 0.62}px Unbounded, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Aa', -s * 0.02, s * 0.04);
  } else if (kind === 'eye') {
    ctx.beginPath(); ctx.moveTo(-s * 0.9, 0);
    ctx.quadraticCurveTo(0, -s * 0.85, s * 0.9, 0); ctx.quadraticCurveTo(0, s * 0.85, -s * 0.9, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = P.night; ctx.beginPath(); ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 0.08, -s * 0.08, s * 0.07, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export async function drawFace(card, index, logoImg) {
  const c = document.createElement('canvas');
  c.width = TEX_W; c.height = TEX_H;
  const ctx = c.getContext('2d');
  const ink = card.dark ? '#F2EFE8' : P.night;
  const sub = card.dark ? 'rgba(242,239,232,.6)' : 'rgba(16,8,29,.6)';
  // base + airbrush washes
  ctx.fillStyle = card.face; ctx.fillRect(0, 0, TEX_W, TEX_H);
  airbrush(ctx, TEX_W * 0.85, TEX_H * 0.08, TEX_W * 0.9, card.accent, card.dark ? 0.35 : 0.85);
  airbrush(ctx, TEX_W * 0.05, TEX_H * 0.62, TEX_W * 0.6, card.dark ? P.grape : P.bubble, card.dark ? 0.25 : 0.35);
  // window for the logo
  const wx = 60, wy = 150, ww = TEX_W - 120, wh = 430;
  roundRect(ctx, wx, wy, ww, wh, 34);
  ctx.save(); ctx.clip();
  const wg = ctx.createLinearGradient(0, wy, 0, wy + wh);
  if (card.dark) { wg.addColorStop(0, '#26262a'); wg.addColorStop(1, '#141414'); }
  else { wg.addColorStop(0, 'rgba(255,255,255,.92)'); wg.addColorStop(1, 'rgba(255,255,255,.55)'); }
  ctx.fillStyle = wg; ctx.fillRect(wx, wy, ww, wh);
  // echo rings behind logo
  ctx.strokeStyle = card.dark ? 'rgba(242,239,232,.08)' : 'rgba(16,8,29,.07)';
  ctx.lineWidth = 2;
  for (let r = 60; r < 420; r += 34) { ctx.beginPath(); ctx.arc(TEX_W / 2, wy + wh / 2, r, 0, Math.PI * 2); ctx.stroke(); }
  // logo
  const lcx = TEX_W / 2, lcy = wy + wh / 2;
  if (logoImg) {
    let lw, lh;
    if (card.logoWide) { lw = 420; lh = lw * logoImg.height / logoImg.width; }
    else { lh = 250; lw = lh * (logoImg.width / logoImg.height || 1); }
    ctx.save();
    if (card.logoRadius) { roundRect(ctx, lcx - lw / 2, lcy - lh / 2, lw, lh, lw * card.logoRadius); ctx.clip(); }
    ctx.drawImage(logoImg, lcx - lw / 2, lcy - lh / 2, lw, lh);
    ctx.restore();
  } else if (card.standIn) {
    drawStandIn(ctx, card.standIn, lcx, lcy, 120, card.accent);
  }
  ctx.restore();
  ctx.lineWidth = 3; ctx.strokeStyle = card.dark ? 'rgba(242,239,232,.18)' : 'rgba(16,8,29,.14)';
  roundRect(ctx, wx, wy, ww, wh, 34); ctx.stroke();

  // corner indices
  const suit = SUITS[index % 4];
  const idx = String(index + 1).padStart(2, '0');
  const corner = () => {
    ctx.fillStyle = ink; ctx.font = '600 40px "Martian Mono", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(idx, 54, 92);
    drawSuit(ctx, suit, 150, 78, 40, card.dark ? card.accent : P.hot);
  };
  corner();
  ctx.save(); ctx.translate(TEX_W, TEX_H); ctx.rotate(Math.PI); corner(); ctx.restore();
  // status chip top-right
  const chip = card.status.toUpperCase();
  ctx.font = '600 24px "Martian Mono", monospace';
  const tw = ctx.measureText(chip).width + 44;
  roundRect(ctx, TEX_W - 54 - tw, 54, tw, 50, 25);
  ctx.fillStyle = card.status === 'live' ? P.apple : card.status === 'retired' ? 'rgba(16,8,29,.08)' : card.status === 'paused' ? 'rgba(242,239,232,.12)' : P.ice;
  ctx.fill();
  ctx.fillStyle = card.status === 'retired' ? sub : (card.dark ? '#F2EFE8' : P.night);
  ctx.textAlign = 'center'; ctx.fillText(chip, TEX_W - 54 - tw / 2, 88);
  // name
  ctx.textAlign = 'left'; ctx.fillStyle = ink;
  let fs = 68; ctx.font = `700 ${fs}px Unbounded, sans-serif`;
  while (ctx.measureText(card.name).width > TEX_W - 120 && fs > 30) { fs -= 2; ctx.font = `700 ${fs}px Unbounded, sans-serif`; }
  ctx.fillText(card.name, 60, 672);
  // figure
  let ffs = 92;
  const labelW = () => { ctx.font = '500 28px "Martian Mono", monospace'; return ctx.measureText(card.figLabel).width; };
  const lw0 = labelW();
  ctx.font = `800 ${ffs}px Unbounded, sans-serif`;
  while (ctx.measureText(card.fig).width + lw0 + 18 > TEX_W - 116 && ffs > 40) { ffs -= 4; ctx.font = `800 ${ffs}px Unbounded, sans-serif`; }
  const fg = ctx.createLinearGradient(0, 700, 0, 800);
  if (card.dark) { fg.addColorStop(0, '#fff'); fg.addColorStop(1, card.accent); }
  else { fg.addColorStop(0, P.grape); fg.addColorStop(0.55, P.hot); fg.addColorStop(1, P.tang); }
  ctx.fillStyle = fg; ctx.fillText(card.fig, 56, 790);
  const fw = ctx.measureText(card.fig).width;
  ctx.font = '500 28px "Martian Mono", monospace'; ctx.fillStyle = sub;
  ctx.fillText(card.figLabel, 56 + fw + 18, 788);
  // note + since
  ctx.font = '500 24px "Martian Mono", monospace'; ctx.fillStyle = sub;
  ctx.fillText(card.note, 60, 850);
  ctx.fillText('since ' + card.since, 60, 890);
  if (card.status === 'retired') {
    ctx.save(); ctx.translate(TEX_W - 170, 545); ctx.rotate(-0.16);
    ctx.fillStyle = P.hot; ctx.globalAlpha = 0.95;
    roundRect(ctx, -120, -34, 240, 68, 34); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 34px Unbounded, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('FOLDED', 0, 3);
    ctx.restore();
  }
  grain(ctx, TEX_W, TEX_H, card.dark ? 10 : 12, index + 3);
  return c;
}

export function drawBack(seed = 0) {
  const c = document.createElement('canvas');
  c.width = TEX_W; c.height = TEX_H;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, TEX_H);
  g.addColorStop(0, P.plum); g.addColorStop(0.55, P.grape); g.addColorStop(0.56, P.hot); g.addColorStop(1, P.tang);
  ctx.fillStyle = g; ctx.fillRect(0, 0, TEX_W, TEX_H);
  airbrush(ctx, TEX_W * 0.5, TEX_H * 0.56, TEX_W * 0.7, P.lemon, 0.55);
  // echo rings
  ctx.strokeStyle = 'rgba(255,255,255,.22)';
  for (let i = 0; i < 16; i++) {
    ctx.lineWidth = 2 + (i % 3);
    ctx.beginPath(); ctx.arc(TEX_W / 2, TEX_H / 2, 30 + i * 30, 0, Math.PI * 2); ctx.stroke();
  }
  // border
  ctx.lineWidth = 10; ctx.strokeStyle = P.cream;
  roundRect(ctx, 34, 34, TEX_W - 68, TEX_H - 68, 40); ctx.stroke();
  // centre A
  ctx.save(); ctx.translate(TEX_W / 2, TEX_H / 2);
  ctx.fillStyle = P.cream; ctx.beginPath(); ctx.arc(0, 0, 92, 0, Math.PI * 2); ctx.fill();
  drawSuit(ctx, 'a', 0, 0, 120, P.night);
  ctx.restore();
  grain(ctx, TEX_W, TEX_H, 16, seed + 11);
  return c;
}

// ---------------------------------------------------------------- geometry
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function remapUV(geo, w, h, flip = false) {
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / w + 0.5, v = pos.getY(i) / h + 0.5;
    uv.setXY(i, flip ? 1 - u : u, v);
  }
  uv.needsUpdate = true;
}

// sky dome: airbrushed sunset with a hard chrome horizon, plus dither grain
const skyVert = /* glsl */`varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const skyFrag = /* glsl */`
varying vec3 vDir;
uniform vec3 cTop, cMid, cLow, cHorizon, cGround, cGroundFar;
uniform float uGrain;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  float y = vDir.y;
  vec3 col;
  if (y > 0.0) {
    col = mix(cHorizon, cLow, smoothstep(0.0, 0.08, y));
    col = mix(col, cMid, smoothstep(0.06, 0.32, y));
    col = mix(col, cTop, smoothstep(0.28, 0.85, y));
  } else {
    col = mix(cGroundFar, cGround, smoothstep(0.0, -0.35, y));
  }
  // thin airbrushed glow line right on the horizon
  col += cHorizon * 0.55 * exp(-abs(y) * 60.0);
  col += (hash(gl_FragCoord.xy) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function makeSky(colors) {
  const c = (h) => new THREE.Color(h).convertSRGBToLinear();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {
      cTop: { value: c(colors.top) }, cMid: { value: c(colors.mid) }, cLow: { value: c(colors.low) },
      cHorizon: { value: c(colors.horizon) }, cGround: { value: c(colors.ground) }, cGroundFar: { value: c(colors.groundFar) },
      uGrain: { value: colors.grain ?? 0.012 },
    },
    vertexShader: skyVert, fragmentShader: skyFrag,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(60, 48, 32), mat);
}

export const MOODS = {
  dusk: { top: '#1c0d33', mid: '#6a4bb0', low: '#f59ac0', horizon: '#fbeab0', ground: '#2b6b2c', groundFar: '#9fdc5a', fog: '#e9efae' },
  candy: { top: '#b9a3f0', mid: '#ffb3d1', low: '#ffc49a', horizon: '#fbf7c4', ground: '#5fae3a', groundFar: '#c4ec6e', fog: '#fbe7c0' },
  mint: { top: '#0f2414', mid: '#2f7f3a', low: '#9fdc5a', horizon: '#f5f9ea', ground: '#25102d', groundFar: '#7a4cc4', fog: '#d9f1b8' },
};

// ---------------------------------------------------------------- the deck
export async function createDeck(canvas, opts = {}) {
  const mood = MOODS[opts.mood || 'dusk'];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !!opts.transparent, preserveDrawingBuffer: !!opts.preserve });
  renderer.setPixelRatio(opts.pixelRatio ?? Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const sky = makeSky({ ...mood, ground: mood.fog || mood.ground, groundFar: mood.fog || mood.groundFar });
  scene.add(sky);

  // environment: same sky + bright softboxes so chrome and clearcoat get Sorayama-style hard highlights
  const envScene = new THREE.Scene();
  envScene.add(makeSky({ ...mood, top: mood.envTop || '#c9b4f5', grain: 0 }));
  const softbox = (color, intensity, pos, size) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); envScene.add(m);
  };
  softbox('#ffffff', 6, [4, 6, 6], [6, 2]);
  softbox('#ffc2e0', 3, [-7, 3, 2], [2, 7]);
  softbox(P.apple, 2.5, [0, -2, -8], [10, 1]);
  softbox('#ffffff', 2, [-2, 8, -3], [3, 3]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(envScene, 0.02).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(opts.fov ?? 32, 1, 0.1, 200);

  // floor: candy-green disc that fades into the horizon fog
  scene.fog = new THREE.Fog(new THREE.Color(mood.fog || mood.groundFar), 12, 46);
  scene.add(new THREE.HemisphereLight('#e9dcff', '#5fbf3a', 0.9));
  const key = new THREE.DirectionalLight('#fff6ea', 1.6); key.position.set(4, 7, 6); scene.add(key);
  const floorTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, mood.groundFar); g.addColorStop(0.35, mood.ground); g.addColorStop(1, mood.ground);
    x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const floor = new THREE.Mesh(new THREE.CircleGeometry(90, 96), new THREE.MeshStandardMaterial({ map: floorTex, emissive: '#ffffff', emissiveMap: floorTex, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.0, envMapIntensity: 0.15 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.9;
  scene.add(floor);

  // echo pad: airbrushed concentric rings radiating from the deck
  const padTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    for (let i = 1; i < 22; i++) { x.strokeStyle = `rgba(255,255,255,${0.5 * (1 - i / 22)})`; x.lineWidth = 3 + (i % 3) * 2; x.beginPath(); x.arc(512, 512, i * 23, 0, Math.PI * 2); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: padTex, transparent: true, opacity: 0.55, depthWrite: false }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(0, floor.position.y + 0.001, 0.6); scene.add(pad);

  // airbrushed contact shadow sprite
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(16,8,29,.55)'); g.addColorStop(1, 'rgba(16,8,29,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();

  // Echo: the chrome sphere. A nod to NASA's Project Echo balloon, the first passive signal relay.
  const echo = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.04 }));
  echo.scale.setScalar(opts.echoScale ?? 1.6);
  echo.position.set(...(opts.echoPos ?? [-3.6, 1.5, -5.5]));
  scene.add(echo);
  // signal rings
  const rings = new THREE.Group();
  [1.45, 1.62, 1.8].forEach((r, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018 + i * 0.006, 16, 200), new THREE.MeshPhysicalMaterial({ color: [P.hot, P.apple, P.lilac][i], metalness: 0.2, roughness: 0.18, clearcoat: 1 }));
    m.rotation.x = Math.PI / 2 - 0.42; m.rotation.y = 0.2;
    rings.add(m);
  });
  rings.position.copy(echo.position);
  rings.scale.setScalar(echo.scale.x / 1.6);
  scene.add(rings);
  // candy satellites
  const candies = [];
  [[P.lemon, 0.22, [3.4, 2.5, -3.2]], [P.ice, 0.16, [2.4, 3.3, -6]], [P.bubble, 0.3, [4.6, 0.2, -4.6]], [P.apple, 0.12, [-1.6, 3.1, -3.5]]].forEach(([c, s, p]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }));
    m.scale.setScalar(s); m.position.set(...p); m.userData.base = p.slice();
    scene.add(m); candies.push(m);
  });

  // cards
  const shape = roundedRectShape(CW, CH, CR);
  const edgeGeo = new THREE.ExtrudeGeometry(shape, { depth: CD, bevelEnabled: false, curveSegments: 10 });
  edgeGeo.translate(0, 0, -CD / 2);
  const faceGeo = new THREE.ShapeGeometry(shape, 10); remapUV(faceGeo, CW, CH);
  const backGeo = new THREE.ShapeGeometry(shape, 10); remapUV(backGeo, CW, CH, true);

  await Promise.all([
    document.fonts?.load('700 40px Unbounded'), document.fonts?.load('800 40px Unbounded'),
    document.fonts?.load('600 20px "Martian Mono"'), document.fonts?.load('500 20px "Martian Mono"'),
  ].map((p) => p?.catch?.(() => null)));

  const cardsData = opts.cards || CARDS;
  const logos = await Promise.all(cardsData.map(loadLogo));
  const backTex = new THREE.CanvasTexture(drawBack());
  backTex.colorSpace = THREE.SRGBColorSpace; backTex.anisotropy = 8;
  const backMat = new THREE.MeshPhysicalMaterial({ map: backTex, emissive: '#ffffff', emissiveMap: backTex, emissiveIntensity: 0.6, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.5 });

  const cards = [];
  for (let i = 0; i < cardsData.length; i++) {
    const data = cardsData[i];
    const faceCanvas = await drawFace(data, data.n ?? i, logos[i]);
    const tex = new THREE.CanvasTexture(faceCanvas);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const faceMat = new THREE.MeshPhysicalMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.62, roughness: 0.6, clearcoat: 0.6, clearcoatRoughness: 0.1, envMapIntensity: 0.25 });
    const edgeMat = new THREE.MeshPhysicalMaterial({ color: data.accent, roughness: 0.25, clearcoat: 1 });
    const g = new THREE.Group();
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    const face = new THREE.Mesh(faceGeo, faceMat); face.position.z = CD / 2 + 0.0005;
    const back = new THREE.Mesh(backGeo, backMat); back.position.z = -CD / 2 - 0.0005; back.rotation.y = Math.PI;
    g.add(edge, face, back);
    g.userData = { index: i, data, faceCanvas, hover: 0 };
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = floor.position.y + 0.002;
    scene.add(sh); g.userData.shadow = sh;
    scene.add(g); cards.push(g);
  }

  // ---- choreography
  const N = cards.length;
  // Portrait: a held hand of cards fanned around a pivot below the deck. Landscape: a wide arc.
  const handLayout = (i) => {
    // portrait: a cascade, each card showing its index and logo above the next one
    return {
      pos: new THREE.Vector3(Math.sin(i * 1.3) * 0.16, 4.3 - i * 0.6, 0.09 * i),
      rot: new THREE.Euler(-0.05, Math.sin(i * 0.9) * 0.05, (i % 2 ? 1 : -1) * 0.045),
    };
  };
  const layout = opts.layout || (opts.tall ? handLayout : null) || ((i) => {
    const k = i - (N - 1) / 2;
    return {
      pos: new THREE.Vector3(k * 1.02, 0.55 - 0.035 * k * k, -Math.abs(k) * 0.22),
      rot: new THREE.Euler(-0.08, -k * 0.11, -k * 0.055),
    };
  });
  const deckPos = (i) => new THREE.Vector3(0.05 * Math.sin(i * 1.7), -0.86 + i * (CD + 0.004), 0.9);
  let shuffleSeed = 0;
  const order = cards.map((_, i) => i);

  function poseCard(card, slot, u, extra = {}) {
    // u in [0,1]: 0 = in the deck, 1 = dealt
    const i = card.userData.index;
    const dp = deckPos(slot);
    const L = layout(i, N);
    const e = easeOutCubic(clamp(u));
    const pos = dp.clone().lerp(L.pos, e);
    pos.y += Math.sin(Math.PI * clamp(u)) * 0.9; // lift arc
    pos.z += Math.sin(Math.PI * clamp(u)) * 0.6;
    const flip = easeInOut(clamp((u - 0.15) / 0.75));
    const deckRot = new THREE.Euler(-Math.PI / 2, 0, 0.12 * Math.sin(slot * 2.3));
    // face down in the deck (back up) -> face up dealt
    card.position.copy(pos);
    const qDeck = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, deckRot.z)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)); // back faces up
    const qDealt = new THREE.Quaternion().setFromEuler(L.rot);
    const q = qDeck.clone().slerp(qDealt, flip);
    // a twist of spin while airborne
    const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(Math.PI * clamp(u)) * 0.5 * (i % 2 ? 1 : -1));
    q.multiply(spin);
    card.quaternion.copy(q);
    const h = card.userData.hover || 0;
    if (h) { card.position.y += 0.22 * h; card.position.z += 0.35 * h; card.rotateX(0.1 * h); }
    // shadow
    const sh = card.userData.shadow;
    const height = card.position.y - floor.position.y;
    sh.position.x = card.position.x; sh.position.z = card.position.z;
    sh.material.opacity = clamp(1.1 - height * 0.45, 0.12, 1);
    sh.scale.setScalar(0.7 + height * 0.35);
  }

  function setProgress(p, t = 0) {
    // p: global deal progress. Card k (deal order) starts at 0.06 + k*0.075 and takes 0.38.
    order.forEach((ci, k) => {
      const start = 0.04 + k * 0.072;
      const u = clamp((p - start) / 0.38);
      poseCard(cards[ci], N - 1 - k, u);
    });
    // camera dolly: high & wide -> close & low
    const e = easeInOut(clamp(p));
    const cam = opts.camera || (opts.tall ? (e) => ({ pos: [0.4 - 0.4 * e, 2.2 + 0.3 * e, 11.5 - 5.3 * e], look: [0, 0.4 + 1.85 * e, 0.3 - 0.3 * e] }) : null) || ((e) => ({ pos: [0.6 - 0.6 * e, 2.0 - 0.8 * e, 10.2 - 3.0 * e], look: [0, 0.35 + 0.3 * e, 0.3 - 0.3 * e] }));
    const C = cam(e, t);
    camera.position.set(...C.pos); camera.lookAt(...C.look);
    rings.rotation.z = p * 0.8 + t * 0.15;
    rings.children.forEach((r, i) => (r.rotation.z = (p * 1.4 + t * 0.2) * (i % 2 ? -1 : 1)));
    candies.forEach((m, i) => { m.position.y = m.userData.base[1] + Math.sin(p * 4 + i * 1.3 + t) * 0.15; });
  }

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the fan in frame on tall/narrow viewports
    camera.fov = (opts.fov ?? 32) * (w / h < 1 ? 1.65 : 1);
    camera.updateProjectionMatrix();
  }
  const render = () => renderer.render(scene, camera);

  const api = { THREE, renderer, scene, camera, cards, echo, rings, candies, floor, sky, pad, setProgress, resize, render, layout, order };

  if (opts.live) attachLive(api, canvas, opts);
  return api;
}

// ---------------------------------------------------------------- live behaviour
function attachLive(api, canvas, opts) {
  const { THREE, camera, cards } = api;
  let p = opts.startProgress ?? 0, target = 1, t0 = performance.now();
  const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2(9, 9); const par = { x: 0, y: 0 };
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    par.x = ptr.x; par.y = ptr.y;
  });
  canvas.addEventListener('pointerleave', () => ptr.set(9, 9));
  const ro = new ResizeObserver(() => api.resize(canvas.clientWidth, canvas.clientHeight));
  ro.observe(canvas);
  api.resize(canvas.clientWidth || 800, canvas.clientHeight || 500);

  api.deal = () => { p = 0; target = 1; };
  api.collect = () => { target = 0; };
  api.shuffle = () => {
    for (let i = api.order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [api.order[i], api.order[j]] = [api.order[j], api.order[i]]; }
    p = 0; target = 1;
  };
  api.toggle = () => { target = target ? 0 : 1; };

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) p = 1;
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;
    const speed = target > p ? 0.38 : 0.9;
    p += Math.sign(target - p) * Math.min(Math.abs(target - p), dt * speed);
    // hover: raycast, ease
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(cards, true)[0];
    let hovered = null; if (hit) { let o = hit.object; while (o.parent && !cards.includes(o)) o = o.parent; hovered = o; }
    cards.forEach((c) => { const want = c === hovered && p > 0.95 ? 1 : 0; c.userData.hover += (want - c.userData.hover) * Math.min(1, dt * 10); });
    canvas.style.cursor = hovered && p > 0.95 ? 'pointer' : '';
    api.hovered = hovered;
    api.setProgress(p, reduce ? 0 : t);
    // pointer parallax
    camera.position.x += par.x * 0.35; camera.position.y += par.y * 0.2; camera.lookAt(0, 0.45, 0);
    api.render();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
