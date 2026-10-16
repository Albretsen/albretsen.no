// Product islands, retired-product stand-ins and loose objects for the kit.
import { Vox, PAL, rng } from './voxel.js';

const T = './tex/';
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// Logo card: the real logo, untouched, centred on a plain card.
function card(bg, pad = 0.16, round = 0) {
  return (ctx, w, h, [img]) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const ar = img.width / img.height; let iw = w * (1 - pad * 2), ih = iw / ar;
    if (ih > h * (1 - pad * 2)) { ih = h * (1 - pad * 2); iw = ih * ar; }
    ctx.save(); if (round) { rr(ctx, (w - iw) / 2, (h - ih) / 2, iw, ih, iw * round); ctx.clip(); }
    ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih); ctx.restore();
  };
}

// A plinth: two butter layers and a coloured top, the kit's signature base.
function plinth(v, w, d, top, r, edge) {
  v.box(0, 0, 0, w - 1, 0, d - 1, '#ecc94e');
  v.box(0, 1, 0, w - 1, 1, d - 1, PAL.pollen);
  for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) v.set(x, 2, z, r() < 0.12 ? edge : top);
}

// Standing panel facing +z: frame of paper voxels, logo plane on its face.
function panel(v, x0, y0, z, w, h, frame, logo) {
  v.box(x0, y0, z, x0 + w - 1, y0 + h - 1, z, frame);
  v.box(x0 + 1, 3, z, x0 + 1, y0 - 1, z, PAL.steel); v.box(x0 + w - 2, 3, z, x0 + w - 2, y0 - 1, z, PAL.steel);
  v.plane({ ...logo, at: [x0 + w / 2, y0 + h / 2, z + 1.01], w: w - 0.5, h: h - 0.5 });
}

function robot(v, rx, ry, rz, body = PAL.sky) {
  v.box(rx, ry, rz, rx + 2, ry + 2, rz + 2, body); v.set(rx + 1, ry + 1, rz + 3, PAL.white);
  v.box(rx - 1, ry + 1, rz + 1, rx - 1, ry + 2, rz + 1, PAL.steel); v.box(rx + 3, ry + 1, rz + 1, rx + 3, ry + 2, rz + 1, PAL.steel);
  v.box(rx, ry + 3, rz, rx + 2, ry + 5, rz + 2, PAL.white);
  v.box(rx, ry + 4, rz + 2, rx + 2, ry + 4, rz + 2, '#3a4048'); v.set(rx, ry + 4, rz + 2, PAL.leaf); v.set(rx + 2, ry + 4, rz + 2, PAL.leaf);
  v.box(rx + 2, ry + 4, rz, rx + 2, ry + 4, rz + 1, '#3a4048');
  v.set(rx + 1, ry + 6, rz + 1, PAL.steel); v.set(rx + 1, ry + 7, rz + 1, PAL.pollen);
}

function envelope(v, x, y, z, c = PAL.white, flap = PAL.peach) {
  v.box(x, y, z, x + 3, y, z + 2, c); v.set(x + 1, y, z + 1, flap); v.set(x + 2, y, z + 1, flap);
}

const prodOpts = { width: 1600, height: 1600, azimuth: 38, elevation: 28, sunDir: [0.75, 1.0, 0.5], groundOpacity: 0.12, hemi: 1.7, zoom: 0.8, center: [8, 6, 8], span: 18 };

export function prodMcp() {
  const v = new Vox(); const r = rng(31);
  plinth(v, 16, 16, '#cfeafc', r, '#bfe2fa');
  panel(v, 1, 6, 1, 8, 8, PAL.paper, { draw: card('#ffffff', 0.1), images: [T + 'mcp-icon.png'], cw: 512, ch: 512 });
  // a tidy, growing stack of envelopes
  for (let i = 0; i < 4; i++) envelope(v, 10, 3 + i, 3 + (i % 2), i % 2 ? '#fffdf5' : PAL.white, i === 3 ? PAL.leaf : PAL.peach);
  robot(v, 5, 3, 10);
  envelope(v, 8, 5, 13, PAL.white, PAL.azure);
  // letters in flight
  envelope(v, 11, 11, 8, PAL.white, PAL.peach); envelope(v, 13, 14, 5, '#fffdf5', PAL.leaf);
  v.box(13, 3, 12, 14, 4, 13, PAL.leaf); v.set(14, 5, 13, '#8fbd5a');
  return { vox: v, opts: { ...prodOpts } };
}

export function prodFunLibs() {
  const v = new Vox(); const r = rng(32);
  plinth(v, 16, 16, '#fde3e6', r, '#fbd3d8');
  panel(v, 1, 6, 1, 8, 8, PAL.paper, { draw: card('#ffffff', 0.1, 0.2), images: [T + 'funlibs-v5.png'], cw: 512, ch: 512 });
  // word cards with blanks to fill
  const cards = [[3, 3, 10, PAL.white], [8, 3, 12, '#fffbe6'], [4, 4, 13, PAL.lime], [9, 3, 8, PAL.white]];
  for (const [x, y, z, c] of cards) { v.box(x, y, z, x + 3, y, z + 1, c); v.set(x + 1, y, z + 1, '#13213f'); v.set(x + 2, y, z + 1, '#13213f'); }
  // speech bubbles floating up on the right
  const bub = (x, y, z, c, dot) => { v.box(x, y, z, x + 4, y + 2, z + 1, c); v.box(x + 1, y + 3, z, x + 3, y + 3, z + 1, c); v.box(x + 1, y - 1, z, x + 3, y - 1, z + 1, c); v.set(x + 1, y - 2, z, c); v.set(x + 1, y + 1, z + 2, dot); v.set(x + 2, y + 1, z + 2, dot); v.set(x + 3, y + 1, z + 2, dot); };
  bub(11, 5, 7, PAL.white, PAL.blush); bub(10, 10, 3, PAL.pollen, '#13213f');
  v.box(13, 3, 12, 14, 5, 13, PAL.sky); v.box(13, 6, 12, 14, 6, 13, '#a5d3f2');
  return { vox: v, opts: { ...prodOpts } };
}

export function prodToolrails() {
  const v = new Vox(); const r = rng(33);
  plinth(v, 16, 16, '#e8e0f8', r, '#ddd2f5');
  panel(v, 1, 6, 1, 8, 8, PAL.paper, { draw: card('#ffffff', 0.1), images: [T + 'toolrails.png'], cw: 512, ch: 512 });
  // one hub, many tools
  const hx = 9, hz = 8;
  v.box(hx, 3, hz, hx + 2, 5, hz + 2, '#141413'); v.box(hx, 6, hz, hx + 2, 6, hz + 2, '#ffd400');
  const tools = [[13, 4, PAL.sky], [14, 12, PAL.blush], [9, 14, PAL.leaf], [4, 12, PAL.peach]];
  for (const [x, z, c] of tools) {
    v.box(x, 3, z, x + 1, 4, z + 1, c); v.set(x, 5, z, PAL.white);
    const cx = hx + 1, cz = hz + 1; let px = x, pz = z;
    while (px !== cx) { px += Math.sign(cx - px); if (!v.has(px, 3, pz)) v.set(px, 3, pz, '#c9bdea'); }
    while (pz !== cz) { pz += Math.sign(cz - pz); if (!v.has(px, 3, pz)) v.set(px, 3, pz, '#c9bdea'); }
  }
  // injection guard: a small shield over the hub
  const S = ['111', '111', '.1.'];
  S.forEach((row, i) => [...row].forEach((ch, j) => ch === '1' && v.set(hx + j, 10 - i, hz + 1, PAL.white)));
  v.set(hx + 1, 9, hz + 2, PAL.leaf);
  robot(v, 4, 3, 7, PAL.lilac);
  return { vox: v, opts: { ...prodOpts } };
}

export function prodHarbor() {
  const v = new Vox(); const r = rng(34);
  plinth(v, 16, 16, '#fff4dc', r, '#f8ead0');
  // wide screen with the real Harbor banner, raised so the table sits below it
  v.box(1, 9, 1, 15, 13, 1, '#1b1b1b'); v.box(3, 3, 1, 3, 8, 1, PAL.steel); v.box(13, 3, 1, 13, 8, 1, PAL.steel);
  v.plane({ src: T + 'harbor-banner.png', at: [8.5, 11.5, 2.01], w: 14.4, h: 4.8 });
  // a person and an agent at one table, a shared page between them
  v.box(6, 3, 7, 10, 5, 9, PAL.wood); v.box(6, 6, 7, 10, 6, 9, '#e7cfa6');
  v.box(7, 7, 8, 8, 7, 8, PAL.white); v.set(9, 7, 8, PAL.leaf);
  v.box(12, 3, 7, 13, 5, 8, PAL.azure); v.box(12, 6, 7, 13, 7, 8, '#f3c9a8'); v.box(12, 8, 7, 13, 8, 8, '#5a4636');
  robot(v, 2, 3, 7, PAL.peach);
  // books, stacked
  ['#81bfeb', '#fcbfc2', '#fee891', '#a5ce6f'].forEach((c, i) => v.box(11 - (i % 2), 3 + i, 12, 14 - (i % 2), 3 + i, 14, c));
  // pending edit, held for approval
  v.box(3, 3, 12, 5, 3, 14, PAL.white); v.box(3, 4, 12, 5, 4, 14, '#fffdf5'); v.set(4, 5, 13, PAL.leaf);
  return { vox: v, opts: { ...prodOpts } };
}

// ---------- retired stand-ins: smaller, on stone tiles ----------
const standOpts = { width: 900, height: 900, azimuth: 40, elevation: 30, sunDir: [0.75, 1.0, 0.5], groundOpacity: 0.12, hemi: 1.75, center: [4, 5.5, 4], span: 12, zoom: 0.82 };
function tile(v, top = '#ecebe4') { v.box(0, 0, 0, 7, 0, 7, '#cfcdc2'); v.box(0, 1, 0, 7, 1, 7, top); }
function pix(v, rows, x0, ytop, z, map) { rows.forEach((row, i) => [...row].forEach((ch, j) => { if (map[ch]) v.set(x0 + j, ytop - i, z, map[ch]); })); }

export function standLuma() {
  const v = new Vox(); tile(v);
  v.box(2, 2, 1, 6, 9, 1, PAL.paper);
  v.plane({ draw: card('#ffffff', 0.1), images: [T + 'luma-logo.png'], cw: 280, ch: 512, at: [4.5, 6, 2.01], w: 4.4, h: 7.6 });
  [[4, 3], [5, 5], [6, 4]].forEach(([z, h], i) => v.box(0, 2, z, 1, 2 + h, z, [PAL.sky, PAL.leaf, PAL.lilac][i]));
  return { vox: v, opts: standOpts };
}
export function standPolyglot() {
  const v = new Vox(); tile(v);
  v.blob(4, 6.5, 4, 2.9, 2.9, 2.9, (x, y, z) => ((Math.sin(x * 1.7 + z) + Math.cos(y * 1.3 - z)) > 0.6 ? PAL.leaf : PAL.sky), null);
  v.box(4, 2, 4, 4, 3, 4, PAL.steel); v.box(3, 2, 3, 5, 2, 5, PAL.steel);
  v.box(5, 9, 6, 8, 10, 6, PAL.white); v.set(5, 8, 6, PAL.white);
  v.box(0, 10, 0, 3, 11, 0, PAL.pollen); v.set(3, 9, 0, PAL.pollen);
  return { vox: v, opts: standOpts };
}
export function standPinPoint() {
  const v = new Vox(); tile(v);
  // a photo lying on the tile: white border, sky and hills
  v.box(1, 2, 1, 6, 2, 6, PAL.white); v.box(2, 2, 2, 5, 2, 5, PAL.sky); v.box(2, 2, 4, 5, 2, 5, PAL.leaf); v.set(4, 2, 3, PAL.leaf); v.set(3, 2, 2, PAL.white);
  // the pin
  v.box(4, 3, 4, 4, 5, 4, '#e48aa0'); v.box(3, 6, 3, 5, 6, 5, PAL.blush);
  v.blob(4, 8.2, 4, 2.2, 2.2, 2.2, PAL.blush, null); v.set(4, 10, 4, '#fde3e6'); v.set(5, 9, 5, '#fde3e6');
  return { vox: v, opts: standOpts };
}
export function standWebVakt() {
  const v = new Vox(); tile(v);
  v.box(0, 2, 3, 7, 8, 4, '#efe9fb'); v.box(0, 8, 3, 7, 8, 4, PAL.lilac);
  v.set(1, 8, 5, PAL.blush); v.set(2, 8, 5, PAL.pollen); v.set(3, 8, 5, PAL.leaf);
  pix(v, ['.wwww.', 'wsKKsw', 'wsKKsw', '.wwww.'], 1, 6, 5, { w: PAL.white, s: PAL.azure, K: '#3a4048' });
  return { vox: v, opts: standOpts };
}
export function standJokes() {
  const v = new Vox(); tile(v);
  v.box(0, 3, 3, 8, 9, 4, PAL.pollen); v.box(1, 2, 3, 2, 2, 4, PAL.pollen);
  const H = ['1.1', '1.1', '111', '1.1', '1.1'], A = ['.1.', '1.1', '111', '1.1', '1.1'];
  pix(v, H, 1, 8, 5, { 1: '#3a4048' }); pix(v, A, 5, 8, 5, { 1: '#3a4048' });
  return { vox: v, opts: standOpts };
}
export function standTryggere() {
  const v = new Vox(); tile(v);
  const S = ['.11111.', '1111111', '1111111', '1111111', '1111111', '.11111.', '..111..', '...1...'];
  S.forEach((row, i) => [...row].forEach((ch, j) => ch === '1' && v.box(j, 11 - i, 3, j, 11 - i, 4, PAL.azure)));
  [[1, 8], [2, 7], [3, 6], [4, 7], [5, 8], [6, 9]].forEach(([x, y]) => v.set(x, y, 4, PAL.white));
  v.box(3, 2, 3, 3, 3, 4, PAL.steel);
  return { vox: v, opts: standOpts };
}
export function standEarly() {
  const v = new Vox(); tile(v);
  v.box(1, 2, 3, 6, 10, 4, '#8c9daa'); v.box(2, 8, 4, 5, 9, 4, '#cfe7a8');
  [[2, 3], [4, 3], [2, 5], [4, 5]].forEach(([x, y], i) => v.box(x, y, 5, x + 1, y, 5, [PAL.white, PAL.peach, PAL.white, PAL.pollen][i]));
  v.box(2, 7, 4, 2, 7, 4, '#3a4048');
  pix(v, ['1..1', '..1.', '.1..', '1..1'], 6, 14, 4, { 1: PAL.blush });
  return { vox: v, opts: standOpts };
}

// ---------- loose objects ----------
const objOpts = { width: 900, height: 900, azimuth: 40, elevation: 30, sunDir: [0.75, 1.0, 0.5], groundOpacity: 0.0, ground: false, hemi: 1.8, zoom: 0.95 };
export function objRobot() { const v = new Vox(); robot(v, 0, 0, 0, PAL.sky); envelope(v, 3, 2, 2, PAL.white, PAL.peach); return { vox: v, opts: { ...objOpts, ground: true, groundOpacity: 0.1 } }; }
export function objCloud() { const v = new Vox(); const r = rng(51); v.blob(6, 2, 4, 6, 2.2, 3.6, PAL.white, r, 0.25); v.blob(4, 3.5, 4, 3, 2.2, 2.6, PAL.white, r, 0.2); v.blob(8, 3, 4, 3, 2.5, 2.8, '#f7fbff', r, 0.2); return { vox: v, opts: objOpts }; }
export function objSprout() {
  const v = new Vox(); v.box(0, 0, 0, 3, 3, 3, PAL.pollen); v.box(0, 3, 0, 3, 3, 3, '#ecc94e'); v.box(1, 3, 1, 2, 3, 2, '#8a6a48');
  v.box(1, 4, 1, 1, 6, 1, PAL.moss); v.box(2, 6, 1, 3, 6, 2, PAL.leaf); v.box(-1, 5, 0, 0, 5, 1, PAL.leaf); v.set(1, 7, 1, '#b6d97f');
  return { vox: v, opts: { ...objOpts, ground: true, groundOpacity: 0.1 } };
}
export function objCursor() {
  const v = new Vox();
  const A = ['1.........', '11........', '1w1.......', '1ww1......', '1www1.....', '1wwww1....', '1wwwww1...', '1wwwwww1..', '1wwww1111.', '1ww1w1....', '11.1ww1...', '1...1w1...', '.....11...'];
  A.forEach((row, i) => [...row].forEach((ch, j) => { if (ch === '1') v.box(j, 12 - i, 0, j, 12 - i, 1, '#3a4048'); if (ch === 'w') v.box(j, 12 - i, 0, j, 12 - i, 1, PAL.lime); }));
  return { vox: v, opts: { ...objOpts, azimuth: 25, elevation: 22 } };
}
export function objDrift() {
  const v = new Vox();
  v.box(0, 0, 0, 2, 2, 2, PAL.pollen); v.box(4, 4, 1, 5, 5, 2, PAL.sky); v.box(7, 7, 0, 7, 7, 0, PAL.lilac); v.box(2, 6, 4, 3, 7, 5, PAL.blush); v.set(6, 10, 3, PAL.leaf);
  return { vox: v, opts: objOpts };
}
export function objMug() {
  const v = new Vox(); v.box(0, 0, 0, 3, 4, 3, PAL.peach); v.box(1, 4, 1, 2, 4, 2, '#8a6a48'); v.box(4, 1, 1, 4, 3, 2, PAL.peach); v.del(4, 2, 1); v.del(4, 2, 2); v.box(5, 1, 1, 5, 3, 2, PAL.peach);
  v.set(1, 6, 1, PAL.white); v.set(2, 7, 2, PAL.white); v.set(1, 8, 2, '#f4f4f4');
  return { vox: v, opts: { ...objOpts, ground: true, groundOpacity: 0.1 } };
}
// the brand mark as a voxel object: a 2x2x2 cube with its last block drifting into place
export function objMark() {
  const v = new Vox();
  v.box(0, 0, 0, 3, 3, 3, PAL.pollen); v.clear(2, 2, 2, 3, 3, 3);
  for (const [x, y, z] of [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]]) v.set(2.64 + x, 5 + y, 2.64 + z, PAL.leaf);
  return { vox: v, opts: { ...objOpts, width: 1200, height: 1200, azimuth: 45, elevation: 35.264, ground: true, groundOpacity: 0.1, jitter: 0 } };
}
