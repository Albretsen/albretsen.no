// Paperworld: the cut-paper renderer behind design 74 "Afterglow Diorama".
// Every scene is a stack of Path2D silhouettes, each drawn like a real sheet of
// card: a soft cast shadow on the sheet behind, a lit cut edge on top, a paper
// fibre texture, and a slight fall-off toward the bottom of the sheet.
// No dependencies. ES module. Used for the hero stills, the product vignettes
// and the live, turnable diorama (diorama.js).

// ---------- small utils ----------
export const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
export const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
const smooth = (t) => t * t * (3 - 2 * t);
function noise1(seed) {
  const r = rng(seed); const v = Array.from({ length: 512 }, r);
  return (x) => { const i = Math.floor(x), f = x - i; return v[i & 511] + (v[(i + 1) & 511] - v[i & 511]) * smooth(f); };
}
export const fbm = (seed) => { const n = [noise1(seed), noise1(seed + 7), noise1(seed + 13), noise1(seed + 29)];
  return (x) => n[0](x) * 0.55 + n[1](x * 2.1) * 0.25 + n[2](x * 4.3) * 0.13 + n[3](x * 8.7) * 0.07; };

// ---------- the palette ----------
// Riviera: ochre, terracotta, sea blue, lavender. Plus paper and plum ink.
export const PALETTE = {
  ochre: '#D9A441', ochreLight: '#F2C66D', terracotta: '#C2603E', terracottaDeep: '#8E3F2C',
  sea: '#2F6E9E', seaDeep: '#1D4566', lavender: '#A99BD1', lavenderDeep: '#6E5A8E',
  rose: '#E7A39A', paper: '#F5EBDC', plum: '#2E2240', ink: '#1E1828',
};

// Light states, keyed by sun altitude in degrees. Interpolated by lightAt().
// Each has: sky gradient, sun glow, the colour of each sheet from far to near,
// rim light (cut edge catching light), shadow strength, lamp + window intensity.
export const LIGHTS = [
  { alt: -14, name: 'night', sky: ['#141127', '#28224a', '#4a3f6e'], glow: '#6b5a8f', far: '#3a3260', hills: '#2f2850', sea: ['#3b3566', '#1a1834'], head: '#231d3c', blvd: '#1d1832', near: '#151126', palm: '#120e20', wall: '#3a3358', rim: '#8b7fc0', rimA: 0.35, shadow: 0.55, lamps: 1, windows: 1, sun: null },
  { alt: -6, name: 'blue hour', sky: ['#2b2f63', '#5a5a96', '#b28fae'], glow: '#d99a9a', far: '#5f5a92', hills: '#4b4479', sea: ['#9c86ae', '#2c2b57'], head: '#3a3060', blvd: '#2e264d', near: '#221b3a', palm: '#1d1630', wall: '#5b5288', rim: '#e7b3b0', rimA: 0.45, shadow: 0.5, lamps: 1, windows: 1, sun: null },
  { alt: -1.5, name: 'afterglow', sky: ['#5d4f8c', '#b58fb4', '#f6b98d'], glow: '#ffcf8f', far: '#8e7bb0', hills: '#6c5a8f', sea: ['#efb294', '#4c4f87'], head: '#4b3a66', blvd: '#3b2d53', near: '#2b2040', palm: '#25193a', wall: '#7e6aa2', rim: '#ffd2a3', rimA: 0.75, shadow: 0.42, lamps: 0.9, windows: 1, sun: null },
  { alt: 4, name: 'golden hour', sky: ['#6f8fc0', '#e8b9a4', '#ffd38e'], glow: '#ffe2a0', far: '#b39cc4', hills: '#c98e6c', sea: ['#f4c48d', '#2f6e9e'], head: '#b4674a', blvd: '#9a4f3a', near: '#6f3528', palm: '#4a3a3a', wall: '#f1d7b9', rim: '#fff0c8', rimA: 0.85, shadow: 0.38, lamps: 0.15, windows: 0.35, sun: '#ffd27a' },
  { alt: 18, name: 'morning', sky: ['#3f7fb6', '#8ec0de', '#f7e2bf'], glow: '#fff3d2', far: '#a3b6d4', hills: '#d4ad74', sea: ['#7fb6d6', '#2f6e9e'], head: '#d39a5a', blvd: '#c2603e', near: '#8e3f2c', palm: '#3f6a52', wall: '#f7ecdd', rim: '#fffaf0', rimA: 0.9, shadow: 0.3, lamps: 0, windows: 0, sun: '#ffe9a8' },
  { alt: 45, name: 'noon', sky: ['#2c6fa8', '#73b0dc', '#e4eef0'], glow: '#ffffff', far: '#9fb7d6', hills: '#dcb373', sea: ['#5aa3cc', '#245d8c'], head: '#dca15c', blvd: '#c96a43', near: '#94432e', palm: '#3b6a4f', wall: '#fbf2e4', rim: '#ffffff', rimA: 0.95, shadow: 0.26, lamps: 0, windows: 0, sun: '#fff1b8' },
];
const KEYS = ['far', 'hills', 'head', 'blvd', 'near', 'palm', 'wall', 'rim', 'glow'];
export function lightAt(alt) {
  const L = LIGHTS; if (alt <= L[0].alt) return { ...L[0] }; if (alt >= L[L.length - 1].alt) return { ...L[L.length - 1] };
  let i = 0; while (alt > L[i + 1].alt) i++;
  const a = L[i], b = L[i + 1], t = smooth((alt - a.alt) / (b.alt - a.alt));
  const o = { alt, name: t < 0.5 ? a.name : b.name };
  KEYS.forEach((k) => (o[k] = mix(a[k], b[k], t)));
  o.sky = a.sky.map((c, j) => mix(c, b.sky[j], t)); o.sea = a.sea.map((c, j) => mix(c, b.sea[j], t));
  ['rimA', 'shadow', 'lamps', 'windows'].forEach((k) => (o[k] = a[k] + (b[k] - a[k]) * t));
  o.sun = b.sun ? (a.sun ? mix(a.sun, b.sun, t) : b.sun) : null; o.sunA = a.sun ? 1 : b.sun ? t : 0;
  return o;
}

// ---------- shapes ----------
// A ridge from x0 to x1 that closes down to `bottom`. peaks: [{x, y, w}] add drama.
export function ridge({ x0 = -20, x1 = 1620, base, amp, freq = 0.004, seed = 1, peaks = [], bottom = 920, step = 4, sharp = 1 }) {
  const n = fbm(seed); const p = new Path2D(); p.moveTo(x0, bottom);
  for (let x = x0; x <= x1; x += step) {
    let y = base - (n(x * freq) - 0.5) * amp * 2;
    for (const k of peaks) { const d = Math.abs(x - k.x) / k.w; if (d < 1) y -= (base - k.y) * Math.pow(1 - d, k.p || 1.6) * (k.s || 1); }
    p.lineTo(x, y);
  }
  p.lineTo(x1, bottom); p.closePath(); return p;
}
// Washingtonia (Mexican fan palm): very tall, thin, a small ragged crown.
export function fanPalm(x, y, h, { lean = 0.06, seed = 3, s = 1, part = 'all' } = {}) {
  const r = rng(seed); const P = new Path2D(), C = new Path2D(); let p = P;
  const tx = x + h * lean, ty = y - h; const w0 = 7 * s, w1 = 3.6 * s;
  // trunk: gentle S curve, tapered
  const cx = x + h * lean * 0.3 + (r() - 0.5) * 10 * s, cy = y - h * 0.55;
  p.moveTo(x - w0, y); p.quadraticCurveTo(cx - w0 * 0.8, cy, tx - w1, ty + 6 * s);
  p.lineTo(tx + w1, ty + 6 * s); p.quadraticCurveTo(cx + w0 * 0.8, cy, x + w0, y); p.closePath();
  // dead-frond skirt under the crown
  p.moveTo(tx - 8 * s, ty - 2 * s); p.quadraticCurveTo(tx - 11 * s, ty + 22 * s, tx - 4 * s, ty + 34 * s);
  p.lineTo(tx + 5 * s, ty + 32 * s); p.quadraticCurveTo(tx + 12 * s, ty + 18 * s, tx + 8 * s, ty - 2 * s); p.closePath();
  // crown: fan leaves, each a thin blade fanning into fingers
  p = part === 'all' ? P : C;
  const n = 19;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * (-0.08 + 1.16 * (i / (n - 1))) + (r() - 0.5) * 0.16; const len = (34 + r() * 16) * s;
    const droop = Math.cos(a) * Math.cos(a) * 1.25; // side leaves droop more
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.75 + droop * len * 0.55;
    const mx = tx + Math.cos(a) * len * 0.5, my = ty + Math.sin(a) * len * 0.5;
    const nx = -Math.sin(a), ny = Math.cos(a); const w = (2.4 + r() * 1.2) * s;
    p.moveTo(tx, ty); p.quadraticCurveTo(mx + nx * w, my + ny * w, ex, ey);
    // fingers at the tip
    for (let f = -2; f <= 2; f++) { const fa = a + f * 0.12 + 0.5 * Math.cos(a) * Math.sign(Math.cos(a)); p.lineTo(ex + Math.cos(fa) * 7 * s, ey + Math.abs(Math.sin(fa)) * 2 * s + 5 * s); p.lineTo(ex, ey); }
    p.quadraticCurveTo(mx - nx * w, my - ny * w, tx, ty); p.closePath();
  }
  return part === 'trunk' ? P : part === 'crown' ? C : P;
}
// Canary Island date palm: thick trunk, a big round head of feathered fronds.
export function datePalm(x, y, h, { seed = 9, s = 1, lean = 0.02, fronds = 22, part = 'all' } = {}) {
  const r = rng(seed); const P = new Path2D(), C = new Path2D(); let p = P; const tx = x + h * lean, ty = y - h;
  const w0 = 16 * s, w1 = 11 * s;
  p.moveTo(x - w0, y); p.quadraticCurveTo(x - w0 * 0.85, y - h * 0.5, tx - w1, ty + 10 * s); p.lineTo(tx + w1, ty + 10 * s);
  p.quadraticCurveTo(x + w0 * 0.85, y - h * 0.5, x + w0, y); p.closePath();
  // pineapple-like knob under the crown
  p.ellipse(tx, ty + 6 * s, 15 * s, 12 * s, 0, 0, Math.PI * 2);
  p = part === 'all' ? P : C;
  for (let i = 0; i < fronds; i++) {
    const a = -Math.PI * 1.08 + (Math.PI * 1.16) * (i / (fronds - 1)) + (r() - 0.5) * 0.12;
    const len = (95 + r() * 45) * s; const droop = (0.25 + Math.abs(Math.cos(a)) * 0.9) * len * 0.62;
    const pts = []; const N = 24;
    for (let k = 0; k <= N; k++) { const t = k / N; pts.push([tx + Math.cos(a) * len * t, ty + Math.sin(a) * len * t * 0.8 + droop * t * t]); }
    // rachis as thin ribbon
    const leafl = (t) => (1 - t) * 0.6 + 0.4;
    for (let k = 1; k < N; k++) {
      const [px, py] = pts[k]; const [qx, qy] = pts[k + 1]; const dx = qx - px, dy = qy - py; const dl = Math.hypot(dx, dy) || 1;
      const nx = -dy / dl, ny = dx / dl; const L = 30 * s * leafl(k / N) * (0.8 + r() * 0.4);
      // two leaflets per segment, angled forward and down (feather)
      for (const sd of [-1, 1]) {
        const bx = px, by = py; const ux = nx * sd * 0.62 + dx / dl * 0.5, uy = ny * sd * 0.62 + dy / dl * 0.5 + 0.55;
        const ul = Math.hypot(ux, uy); const ex = bx + ux / ul * L, ey = by + uy / ul * L; const wx = -uy / ul * 1.3 * s, wy = ux / ul * 1.3 * s;
        p.moveTo(bx, by); p.quadraticCurveTo((bx + ex) / 2 + wx, (by + ey) / 2 + wy, ex, ey); p.quadraticCurveTo((bx + ex) / 2 - wx, (by + ey) / 2 - wy, bx, by); p.closePath();
      }
    }
    p.moveTo(pts[0][0], pts[0][1] - 2 * s);
    for (let k = 1; k <= N; k++) p.lineTo(pts[k][0], pts[k][1] - 1.6 * s * (1 - k / N));
    for (let k = N; k >= 0; k--) p.lineTo(pts[k][0], pts[k][1] + 1.6 * s * (1 - k / N));
    p.closePath();
  }
  return part === 'trunk' ? P : part === 'crown' ? C : P;
}
// draw a group of palms as two sheets: trunks (bark) then crowns (fronds)
export function palmSheets(ctx, specs, L, base, o = {}) {
  const T = new Path2D(), C = new Path2D();
  for (const [fn, x, y, h, opt] of specs) { T.addPath(fn(x, y, h, { ...opt, part: 'trunk' })); C.addPath(fn(x, y, h, { ...opt, part: 'crown' })); }
  const bark = mix(mix(L.palm, base, 0.45), L.blvd, L.lamps > 0.5 ? 0 : 0.35);
  sheet(ctx, T, { rim: L.rim, rimA: L.rimA * 0.6, shadow: L.shadow, rimW: 1.2, blur: 12, dy: 5, shade: 0.12, top: 200, bottom: 900, ...o, fill: bark });
  sheet(ctx, C, { rim: L.rim, rimA: L.rimA * 0.8, shadow: L.shadow, rimW: 1.3, blur: 14, dy: 6, shade: 0.05, top: 200, bottom: 600, ...o, fill: mix(L.palm, base, 0.25) });
}
// Italian cypress: a candle flame of a tree. Norwegian spruce: stacked tiers.
export function cypress(x, y, h, s = 1) { const p = new Path2D(); const w = h * 0.11;
  p.moveTo(x, y - h); p.bezierCurveTo(x + w * 0.9, y - h * 0.7, x + w * 1.1, y - h * 0.25, x + w * 0.35, y);
  p.lineTo(x - w * 0.35, y); p.bezierCurveTo(x - w * 1.1, y - h * 0.25, x - w * 0.9, y - h * 0.7, x, y - h); p.closePath(); return p; }
export function spruce(x, y, h, seed = 4) { const r = rng(seed); const p = new Path2D(); const tiers = 7; const ws = [];
  for (let i = 1; i <= tiers; i++) ws.push(h * 0.27 * (i / tiers) * (0.85 + r() * 0.3));
  const ty = (i) => y - h + h * 0.86 * (i / tiers);
  p.moveTo(x, y - h);
  for (let i = 1; i <= tiers; i++) { p.lineTo(x + ws[i - 1], ty(i)); if (i < tiers) p.lineTo(x + ws[i - 1] * 0.42, ty(i) - h * 0.025); }
  p.lineTo(x + h * 0.025, ty(tiers)); p.lineTo(x + h * 0.025, y); p.lineTo(x - h * 0.025, y); p.lineTo(x - h * 0.025, ty(tiers));
  for (let i = tiers; i >= 1; i--) { if (i < tiers) p.lineTo(x - ws[i - 1] * 0.42, ty(i) - h * 0.025); p.lineTo(x - ws[i - 1], ty(i)); }
  p.closePath(); return p; }
// Agave: a rosette of pointed leaves.
export function agave(x, y, s = 1, seed = 2) { const r = rng(seed); const p = new Path2D(); const n = 11;
  for (let i = 0; i < n; i++) { const a = -Math.PI * (0.06 + 0.88 * i / (n - 1)) + (r() - 0.5) * 0.1; const L = (34 + r() * 26) * s * (1 - Math.abs(Math.cos(a)) * 0.3);
    const w = 6 * s; const nx = -Math.sin(a), ny = Math.cos(a);
    p.moveTo(x + nx * w, y + ny * w * 0.3); p.quadraticCurveTo(x + Math.cos(a) * L * 0.6 + nx * w, y + Math.sin(a) * L * 0.6, x + Math.cos(a) * L, y + Math.sin(a) * L);
    p.quadraticCurveTo(x + Math.cos(a) * L * 0.6 - nx * w, y + Math.sin(a) * L * 0.6, x - nx * w, y - ny * w * 0.3); p.closePath(); }
  return p; }
// Street lamp: slim pole with a mid-century globe arm. Returns {path, lights:[[x,y,r]]}.
export function lamp(x, y, h, s = 1, dir = 1) { const p = new Path2D(); const w = 1.6 * s; const d = dir * s;
  p.rect(x - w, y - h, w * 2, h); p.moveTo(x, y - h); p.quadraticCurveTo(x + 2 * d, y - h - 9 * s, x + 12 * d, y - h - 8 * s);
  p.lineTo(x + 12 * d, y - h - 6 * s); p.quadraticCurveTo(x + 3 * d, y - h - 7 * s, x + w * dir, y - h + 2); p.closePath();
  p.ellipse(x + 13 * d, y - h - 4.5 * s, 4.2 * s, 3 * s, 0, 0, Math.PI * 2);
  return { path: p, light: [x + 13 * d, y - h - 3.5 * s, 4 * s] }; }

// ---------- drawing a sheet ----------
let grain = null;
export async function loadGrain(url) {
  const img = new Image(); img.src = url; await img.decode(); grain = img; return img; }
export function sheet(ctx, path, { fill, rim = '#ffffff', rimA = 0.7, rimW = 2.2, shadow = 0.4, blur = 18, dy = 6, dx = 0, shade = 0.18, top = 0, bottom = 900, grainA = 0.55, grainScale = 1 }) {
  ctx.save();
  // 1. cast shadow on the sheet behind
  if (shadow > 0) { ctx.shadowColor = `rgba(20,10,30,${shadow})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = dy; ctx.shadowOffsetX = dx; ctx.fillStyle = fill; ctx.fill(path); }
  ctx.restore(); ctx.save(); ctx.clip(path);
  // 2. lit cut edge: fill with rim colour, then the sheet colour shifted down
  ctx.fillStyle = mix(fill, rim, rimA); ctx.fill(path);
  ctx.translate(0, rimW); ctx.fillStyle = fill; ctx.fill(path); ctx.translate(0, -rimW);
  // 3. paper falls away from the light toward the bottom
  if (shade) { const g = ctx.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(20,8,30,${shade})`); ctx.fillStyle = g; ctx.fillRect(-100, top - 50, 2000, bottom - top + 200); }
  // 4. fibres
  if (grain && grainA) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = grainA; const pat = ctx.createPattern(grain, 'repeat');
    if (grainScale !== 1 && pat.setTransform) pat.setTransform(new DOMMatrix().scale(grainScale)); ctx.fillStyle = pat; ctx.fillRect(-100, -100, 2000, 1200); }
  ctx.restore();
}
export function glow(ctx, x, y, r, color, a = 1) {
  if (a <= 0.01) return; ctx.save(); ctx.globalCompositeOperation = 'screen';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(color, 0.9 * a)); g.addColorStop(0.25, rgba(color, 0.35 * a)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }

// ---------- sky ----------
export function skyGradient(ctx, L, W = 1600, H = 900, horizon = 560, sunX = 1240) {
  const g = ctx.createLinearGradient(0, 0, 0, horizon); g.addColorStop(0, L.sky[0]); g.addColorStop(0.55, L.sky[1]); g.addColorStop(1, L.sky[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(sunX, horizon, 0, sunX, horizon, 700); r.addColorStop(0, rgba(L.glow, 0.85)); r.addColorStop(0.4, rgba(L.glow, 0.22)); r.addColorStop(1, rgba(L.glow, 0));
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
}
export function paperSun(ctx, x, y, r, color, a = 1) { if (!color || a <= 0) return; ctx.save(); ctx.globalAlpha = a;
  glow(ctx, x, y, r * 4, color, 0.6); const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2);
  sheet(ctx, p, { fill: color, rim: '#ffffff', rimA: 0.5, shadow: 0.15, blur: 10, dy: 3, shade: 0.08, top: y - r, bottom: y + r }); ctx.restore(); }

// ---------- the pavilion (a mid-century house on the headland) ----------
export function pavilion(x, y, s = 1) {
  // returns {body, glass:[rects], roof}
  const body = new Path2D(); const glass = []; const u = s;
  // stone plinth wall
  body.rect(x - 10 * u, y - 18 * u, 250 * u, 18 * u);
  // slim columns
  for (const cx of [6, 96, 196]) body.rect(x + cx * u, y - 70 * u, 3.5 * u, 54 * u);
  // the roof: a thin slab cantilevered far past the glass
  const roof = new Path2D(); roof.rect(x - 34 * u, y - 78 * u, 300 * u, 9 * u);
  // chimney block + low wing
  body.rect(x + 206 * u, y - 96 * u, 18 * u, 22 * u);
  body.rect(x + 150 * u, y - 18 * u - 34 * u, 4 * u, 34 * u);
  glass.push([x + 10 * u, y - 69 * u, 86 * u, 51 * u]); glass.push([x + 100 * u, y - 69 * u, 96 * u, 51 * u]);
  return { body, roof, glass };
}

// ---------- the hero composition (virtual 1600 x 900) ----------
// A jagged massif standing straight out of the sea, a cliff-top pavilion with a
// cantilevered roof, a shore boulevard of lamps and palms, a perforated garden
// wall in front. opts: { light, skyImage?, sunX, layers: subset of
// ['sky','far','sea','head','blvd','near'], sunDisc, sunDiscX, sunY }
export function massif(seed, base, peaks, rough, bottom) {
  const n = fbm(seed), m = fbm(seed + 100); const p = new Path2D(); p.moveTo(-20, bottom);
  for (let x = -20; x <= 1620; x += 3) {
    let lift = 0; for (const k of peaks) { const d = Math.abs(x - k.x) / k.w; if (d < 1) lift = Math.max(lift, (base - k.y) * Math.pow(1 - d, k.p || 1.2)); }
    // roughness grows with height: crags near the summits, smooth near the water
    const y = base - lift - (n(x * 0.011) - 0.5) * 14 - (m(x * 0.045) - 0.5) * rough * (0.25 + lift / 260);
    p.lineTo(x, y); }
  p.lineTo(1620, bottom); p.closePath(); return p;
}
export function haze(ctx, color, y0, y1, a) { if (a <= 0) return; const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, rgba(color, 0)); g.addColorStop(1, rgba(color, a)); ctx.fillStyle = g; ctx.fillRect(-20, y0, 1640, y1 - y0); }
export function drawHero(ctx, opts = {}) {
  const L = opts.light || lightAt(-1.5); const only = opts.layers; const want = (k) => !only || only.includes(k);
  const HOR = 560; const sunX = opts.sunX ?? 1250;
  const common = { rim: L.rim, rimA: L.rimA, shadow: L.shadow };
  if (want('sky')) {
    if (opts.skyImage) { const im = opts.skyImage; const sc = Math.max(1600 / im.width, (HOR + 40) / im.height);
      ctx.drawImage(im, 0, 0, im.width, im.height, (1600 - im.width * sc) / 2, HOR + 40 - im.height * sc, im.width * sc, im.height * sc);
      ctx.fillStyle = L.sea[0]; ctx.fillRect(0, HOR + 30, 1600, 400); }
    else skyGradient(ctx, L, 1600, 900, HOR, sunX);
    if (L.sun && opts.sunDisc !== false) paperSun(ctx, opts.sunDiscX ?? sunX, opts.sunY ?? 300, 34, L.sun, L.sunA ?? 1);
  }
  if (want('far')) {
    // back range: faint, long, many small summits
    const back = massif(31, 505, [{ x: 860, y: 380, w: 260 }, { x: 1080, y: 330, w: 220 }, { x: 1560, y: 360, w: 240 }], 40, HOR + 30);
    sheet(ctx, back, { ...common, fill: mix(L.far, L.sky[2], 0.5), rimA: L.rimA * 0.6, shadow: L.shadow * 0.4, blur: 26, dy: 3, shade: 0.06, top: 300, bottom: HOR, grainA: 0.3 });
    // the massif: steep walls, a craggy summit, falling straight into the sea
    const front = massif(11, 548, [{ x: 1235, y: 190, w: 300, p: 1.05 }, { x: 1395, y: 300, w: 150, p: 1.2 }, { x: 1040, y: 430, w: 140, p: 1.4 }], 70, HOR + 30);
    sheet(ctx, front, { ...common, fill: mix(L.far, L.sky[2], 0.18), rimA: L.rimA * 0.85, shadow: L.shadow * 0.7, blur: 24, dy: 5, shade: 0.16, top: 190, bottom: HOR, grainA: 0.42 });
    haze(ctx, L.sky[2], 380, HOR, 0.45);
  }
  if (want('sea')) {
    const sea = new Path2D(); sea.rect(-20, HOR, 1640, 380);
    ctx.save(); const g = ctx.createLinearGradient(0, HOR, 0, 900); g.addColorStop(0, L.sea[0]); g.addColorStop(0.45, mix(L.sea[0], L.sea[1], 0.7)); g.addColorStop(1, L.sea[1]);
    ctx.shadowColor = `rgba(20,10,30,${L.shadow * 0.7})`; ctx.shadowBlur = 16; ctx.shadowOffsetY = -2; ctx.fillStyle = g; ctx.fill(sea); ctx.restore();
    ctx.save(); ctx.clip(sea); if (grain) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.35; ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, HOR, 1600, 400); } ctx.restore();
    const r = rng(41); ctx.save();
    for (let i = 0; i < 22; i++) { const t = i / 22; const y = HOR + 5 + t * t * 150; const w = 26 + t * 200 * r() + 30 * r(); const x = sunX - w / 2 + (r() - 0.5) * (60 + t * 340);
      const p = new Path2D(); p.roundRect(x, y, w, 1.4 + t * 3.2, 2);
      ctx.globalAlpha = 0.95 - t * 0.5; sheet(ctx, p, { fill: mix(L.sea[0], L.glow, 0.75), rim: '#ffffff', rimA: 0.3, rimW: 0.8, shadow: 0.16, blur: 3, dy: 1.5, shade: 0, grainA: 0 }); }
    ctx.restore();
  }
  if (want('head')) {
    // cliff headland on the left: a plateau, then stepped strata down to the water
    const n = fbm(23); const edge = [];
    for (let x = -20; x <= 760; x += 3) { let y;
      if (x < 520) y = 452 + (n(x * 0.02) - 0.5) * 8 - Math.max(0, 200 - x) * 0.05;
      else if (x < 560) y = 452 + (x - 520) * 0.2;
      else if (x < 600) y = 460 + (x - 560) * 1.6;            // first drop
      else if (x < 640) y = 524 + (x - 600) * 0.15;           // ledge
      else if (x < 690) y = 530 + (x - 640) * 0.9;            // second drop
      else y = 575 + (x - 690) * 0.25;
      edge.push([x, y + (n(x * 0.08) - 0.5) * 5]); }
    const head = new Path2D(); head.moveTo(-20, 900); edge.forEach(([x, y]) => head.lineTo(x, y)); head.lineTo(780, 900); head.closePath();
    const pv = pavilion(318, 452, 1); head.addPath(pv.body);
    head.addPath(cypress(268, 454, 74)); head.addPath(cypress(249, 456, 54)); head.addPath(cypress(160, 452, 66));
    sheet(ctx, head, { ...common, fill: L.head, rimA: L.rimA * 0.8, blur: 22, dy: 7, shade: 0.2, top: 380, bottom: 760 });
    for (const [gx, gy, gw, gh] of pv.glass) {
      const p = new Path2D(); p.rect(gx, gy, gw, gh);
      ctx.save(); const g = ctx.createLinearGradient(0, gy, 0, gy + gh);
      const day = mix(L.sky[1], '#ffffff', 0.2);
      g.addColorStop(0, mix(day, '#ffd27e', L.windows)); g.addColorStop(1, mix(mix(L.sky[2], L.head, 0.35), '#f0915a', L.windows)); ctx.fillStyle = g; ctx.fill(p);
      ctx.fillStyle = rgba(L.head, 0.8); for (let m = gx + gw / 3; m < gx + gw - 2; m += gw / 3) ctx.fillRect(m - 0.7, gy, 1.4, gh);
      ctx.restore(); glow(ctx, gx + gw / 2, gy + gh / 2, gw * 1.2, '#ffc46e', L.windows * 0.5);
    }
    // rock strata: overlapping bands of card along the cliff, each a shade deeper
    const edgeAt = (x) => { let best = edge[0]; for (const e of edge) if (Math.abs(e[0] - x) < Math.abs(best[0] - x)) best = e; return best[1]; };
    [[524, 0.2, 51], [606, 0.38, 52]].forEach(([y0, k, sd]) => {
      const nb = fbm(sd); const band = new Path2D(); band.moveTo(-20, 900); let lastX = -20;
      for (let x = -20; x <= 760; x += 4) { const ey = edgeAt(x); const y = y0 + (nb(x * 0.012) - 0.5) * 26; if (ey > y - 4) { lastX = x; break; } band.lineTo(x, y); lastX = x; }
      band.lineTo(lastX + 30, 900); band.closePath();
      sheet(ctx, band, { ...common, fill: mix(L.head, L.near, k), rimA: L.rimA * 0.5, rimW: 1.6, blur: 14, dy: 5, shade: 0.12, top: y0, bottom: 760 }); });
    sheet(ctx, pv.roof, { ...common, fill: L.wall, rimA: 0.5, shadow: L.shadow + 0.15, blur: 10, dy: 6, shade: 0, top: 360, bottom: 380 });
    palmSheets(ctx, [[fanPalm, 612, 528, 250, { seed: 3, lean: 0.06 }], [fanPalm, 655, 560, 290, { seed: 8, lean: 0.1 }]], L, L.head);
  }
  if (want('head')) {
    // a garden terrace below the house: a row of clipped round shrubs, very orderly
    haze(ctx, L.sky[2], 600, 800, 0.16);
    const ter = new Path2D(); ter.moveTo(-20, 900); ter.lineTo(-20, 700); ter.lineTo(470, 700); ter.lineTo(500, 900); ter.closePath();
    for (let i = 0; i < 7; i++) { const x = 24 + i * 66; ter.rect(x - 1.5, 670, 3, 32); ter.moveTo(x + 16, 664); ter.arc(x, 664, 16, 0, Math.PI * 2); ter.closePath(); }
    sheet(ctx, ter, { ...common, fill: mix(L.head, L.blvd, 0.5), rimA: L.rimA * 0.7, blur: 20, dy: 7, shade: 0.2, top: 590, bottom: 900 });
  }
  if (want('blvd')) {
    const land = new Path2D(); land.moveTo(480, 900);
    land.bezierCurveTo(700, 720, 960, 662, 1640, 652); land.lineTo(1640, 900); land.closePath();
    sheet(ctx, land, { ...common, fill: L.blvd, rimA: L.rimA * 0.7, blur: 24, dy: 8, shade: 0.25, top: 640, bottom: 900 });
    const road = new Path2D(); road.moveTo(600, 900); road.bezierCurveTo(780, 738, 1000, 684, 1640, 676); road.lineTo(1640, 708);
    road.bezierCurveTo(1060, 718, 880, 770, 790, 900); road.closePath();
    sheet(ctx, road, { fill: mix(L.blvd, L.sky[2], 0.3), rim: L.rim, rimA: L.rimA * 0.5, rimW: 1.2, shadow: 0, shade: 0.12, top: 670, bottom: 900, grainA: 0.6 });
    const curve = (t) => { const P = [[1640, 664], [1000, 672], [760, 722], [560, 900]]; const u = 1 - t;
      return [0, 1].map((i) => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]); };
    const posts = new Path2D(), palms = [], lights = [];
    for (let i = 0; i < 8; i++) { const t = 0.04 + i * 0.105; const [x, y] = curve(t); const sc = 0.32 + t * t * 1.9;
      const l = lamp(x, y, 72 * sc, sc); posts.addPath(l.path); lights.push([...l.light, sc]);
      if (i % 3 === 1) palms.push([fanPalm, x - 26 * sc, y + 2, 230 * sc, { seed: 30 + i, lean: 0.04, s: sc }]); }
    palmSheets(ctx, palms, L, L.blvd, { blur: 10, dy: 5 });
    sheet(ctx, posts, { ...common, fill: mix(L.blvd, '#000000', 0.15), rimA: L.rimA * 0.6, rimW: 1, blur: 6, dy: 3, shade: 0, top: 500, bottom: 900 });
    for (const [x, y, r, sc] of lights) { const bulb = new Path2D(); bulb.ellipse(x, y, r * 0.95, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = mix(mix(L.wall, '#ffffff', 0.2), '#ffe6b0', L.lamps); ctx.fill(bulb); glow(ctx, x, y + r, 44 * sc + 14, '#ffc979', L.lamps); }
  }
  if (want('near')) {
    // a perforated mid-century garden wall in the foreground (light passes through it)
    const wall = new Path2D(); wall.rect(-20, 806, 430, 110);
    const holes = new Path2D(); for (let i = 0; i < 7; i++) { const x = 16 + i * 54; holes.moveTo(x + 32, 838); holes.ellipse(x + 18, 838, 13, 13, 0, 0, Math.PI * 2); holes.rect(x + 4, 858, 28, 22); }
    const brick = new Path2D(); brick.addPath(wall); brick.addPath(holes);
    // evenodd so the holes are cut out
    ctx.save(); ctx.shadowColor = `rgba(20,10,30,${L.shadow})`; ctx.shadowBlur = 28; ctx.shadowOffsetY = 10; ctx.fillStyle = L.wall; ctx.fill(brick, 'evenodd'); ctx.restore();
    ctx.save(); ctx.clip(brick, 'evenodd'); ctx.fillStyle = mix(mix(L.wall, L.near, 0.55), L.rim, L.rimA * 0.5); ctx.fillRect(-20, 760, 560, 200);
    ctx.translate(0, 2.4); ctx.fillStyle = mix(L.wall, L.near, 0.55); ctx.fill(wall); ctx.translate(0, -2.4);
    // inner edges of each hole catch light on their lower lip
    ctx.fillStyle = mix(mix(L.wall, L.near, 0.55), L.rim, L.rimA * 0.4); ctx.translate(0, -2); ctx.fill(holes); ctx.translate(0, 2);
    ctx.fillStyle = mix(L.wall, L.near, 0.55); ctx.fill(holes, 'nonzero');
    ctx.restore();
    ctx.save(); ctx.clip(brick, 'evenodd'); if (grain) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(-20, 760, 560, 200); } ctx.restore();
    // the ground in front
    const near = ridge({ x0: -20, x1: 1640, base: 868, amp: 10, freq: 0.01, seed: 61, peaks: [{ x: 1540, y: 800, w: 260 }], bottom: 920 });
    near.addPath(agave(560, 872, 1.15, 4)); near.addPath(agave(1420, 828, 1.05, 7));
    sheet(ctx, near, { ...common, fill: L.near, rimA: L.rimA * 0.6, blur: 30, dy: 10, shade: 0.25, top: 780, bottom: 900 });
    palmSheets(ctx, [[datePalm, 1500, 905, 560, { seed: 12, s: 1.3, lean: -0.05, fronds: 20 }]], L, L.near, { blur: 30, dy: 12, rimW: 1.2, rimA: L.rimA * 0.28 });
  }
}

// ---------- vignettes (4:5 product scenes, virtual 800 x 1000) ----------
// Each is the same world at a different hour; `place(ctx, img, x, y, w, h)` draws the real logo.
export function frame(ctx, L, { horizon = 640, sunX = 560, sunY = 360, ridgeSeed = 3, far = true }) {
  const g = ctx.createLinearGradient(0, 0, 0, horizon); g.addColorStop(0, L.sky[0]); g.addColorStop(0.6, L.sky[1]); g.addColorStop(1, L.sky[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 800, 1000);
  const r = ctx.createRadialGradient(sunX, horizon, 0, sunX, horizon, 520); r.addColorStop(0, rgba(L.glow, 0.85)); r.addColorStop(1, rgba(L.glow, 0));
  ctx.fillStyle = r; ctx.fillRect(0, 0, 800, 1000);
  if (L.sun) paperSun(ctx, sunX, sunY, 30, L.sun, L.sunA ?? 1);
  if (far) { const f = massif(ridgeSeed, horizon - 20, [{ x: 640, y: horizon - 250, w: 230, p: 1.05 }, { x: 760, y: horizon - 150, w: 120 }, { x: 120, y: horizon - 90, w: 200, p: 1.6 }], 60, horizon + 20);
    sheet(ctx, f, { fill: mix(L.far, L.sky[2], 0.3), rim: L.rim, rimA: L.rimA * 0.8, shadow: L.shadow * 0.6, blur: 20, dy: 4, shade: 0.1, top: horizon - 240, bottom: horizon, grainA: 0.4 }); }
  const sea = new Path2D(); sea.rect(-10, horizon, 820, 400); const sg = ctx.createLinearGradient(0, horizon, 0, 1000); sg.addColorStop(0, L.sea[0]); sg.addColorStop(1, L.sea[1]);
  ctx.save(); ctx.shadowColor = 'rgba(20,10,30,.25)'; ctx.shadowBlur = 12; ctx.fillStyle = sg; ctx.fill(sea); ctx.restore();
}
export function plate(ctx, x, y, w, h, L, { fill = PALETTE.paper, radius = 10, arch = false, lift = 1 } = {}) {
  const p = new Path2D(); if (arch) { p.moveTo(x, y + h); p.lineTo(x, y + w / 2); p.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); p.lineTo(x + w, y + h); p.closePath(); } else p.roundRect(x, y, w, h, radius);
  sheet(ctx, p, { fill, rim: '#ffffff', rimA: 0.6, rimW: 2, shadow: Math.min(0.6, L.shadow + 0.12) * lift, blur: 22 * lift, dy: 10 * lift, shade: 0.06, top: y, bottom: y + h, grainA: 0.5 });
  return p;
}
