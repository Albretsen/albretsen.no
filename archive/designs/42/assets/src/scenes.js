// Scene definitions for the "Same Room" voxel kit. Each export returns
// { vox, opts } for bake(). Coordinates: x and z are the floor, y is up.
import { Vox, PAL, rng } from './voxel.js';

const T = './tex/';
const F = 3; // first free y above the plinth + floor

// ---------- shared drawing helpers for screen textures ----------
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function codeScreen(seed, dense = 1, bg = '#2b3116') {
  return (ctx, w, h) => {
    const r = rng(seed); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const cols = ['#fee891', '#bae5fd', '#fcbfc2', '#a5ce6f', '#daccf7', '#fefaed'];
    const lh = h / (16 * dense); let y = lh * 1.2;
    while (y < h - lh) {
      let x = w * 0.06 + Math.floor(r() * 4) * w * 0.045;
      const n = 1 + Math.floor(r() * 4);
      for (let i = 0; i < n && x < w * 0.92; i++) {
        const len = w * (0.06 + r() * 0.22); ctx.fillStyle = cols[Math.floor(r() * cols.length)];
        ctx.globalAlpha = 0.9; rr(ctx, x, y, Math.min(len, w * 0.92 - x), lh * 0.42, lh * 0.2); ctx.fill();
        x += len + w * 0.025;
      }
      y += lh * (r() < 0.15 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
  };
}

function phoneScreen(bg = '#ffffff', old = false) {
  return (ctx, w, h, [icon]) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // status bar
    ctx.fillStyle = old ? '#d9d9d9' : 'rgba(43,49,22,.12)'; ctx.fillRect(0, 0, w, h * 0.05);
    const s = w * 0.72; const x = (w - s) / 2, y = h * 0.2;
    ctx.save(); rr(ctx, x, y, s, s, old ? s * 0.08 : s * 0.22); ctx.clip(); ctx.drawImage(icon, x, y, s, s); ctx.restore();
    // a couple of UI pills under the icon
    ctx.fillStyle = old ? '#cfd8dc' : 'rgba(43,49,22,.16)';
    rr(ctx, w * 0.2, y + s + h * 0.08, w * 0.6, h * 0.035, h * 0.02); ctx.fill();
    rr(ctx, w * 0.3, y + s + h * 0.14, w * 0.4, h * 0.035, h * 0.02); ctx.fill();
    ctx.fillStyle = old ? '#8bc34a' : '#2b3116';
    rr(ctx, w * 0.22, h * 0.84, w * 0.56, h * 0.07, h * 0.035); ctx.fill();
  };
}

function framed(bg = '#ffffff', pad = 0.14, radius = 0.18) {
  return (ctx, w, h, [img]) => {
    ctx.fillStyle = bg; rr(ctx, 0, 0, w, h, w * 0.04); ctx.fill();
    const s = Math.min(w, h) * (1 - pad * 2); const ar = img.width / img.height;
    let iw = s, ih = s; if (ar > 1) ih = s / ar; else iw = s * ar;
    ctx.save(); rr(ctx, (w - iw) / 2, (h - ih) / 2, iw, ih, iw * radius); ctx.clip();
    ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih); ctx.restore();
  };
}

// ---------- the room shell (identical in both eras, so renders register) ----------
function shell(v, era) {
  const r = rng(era === 'then' ? 11 : 12);
  v.box(0, 0, 0, 21, 0, 21, '#ecc94e');
  v.box(0, 1, 0, 21, 1, 21, PAL.pollen);
  const woodA = era === 'then' ? '#d9bd95' : '#ead6b0', woodB = era === 'then' ? '#cfb185' : '#e1caa0';
  for (let x = 0; x <= 21; x++) for (let z = 0; z <= 21; z++) {
    const plank = Math.floor(x / 3); const seam = (z + plank * 7) % 9 === 0;
    v.set(x, 2, z, seam ? (era === 'then' ? '#c2a376' : '#d6bd90') : (plank % 2 ? woodA : woodB));
  }
  const wallL = era === 'then' ? '#efe4f6' : '#fbf6e0';
  const wallR = era === 'then' ? '#e6d9f1' : '#f4ecca';
  v.box(0, F, 0, 1, 17, 21, wallL);
  v.box(2, F, 0, 21, 17, 1, wallR);
  // trims
  v.box(0, 18, 0, 1, 18, 21, era === 'then' ? '#d7c6e8' : PAL.lime);
  v.box(2, 18, 0, 21, 18, 1, era === 'then' ? '#d7c6e8' : PAL.lime);
  v.box(2, F, 2, 2, F, 21, PAL.white); v.box(3, F, 2, 21, F, 2, PAL.white);
  // window in left wall
  v.clear(0, 8, 6, 1, 14, 12);
  for (let y = 8; y <= 14; y++) for (let z = 6; z <= 12; z++) {
    const t = (y - 8) / 6;
    let c;
    if (era === 'then') c = t > 0.66 ? '#c9b6ee' : t > 0.33 ? '#e3c3e6' : '#fed0b2';
    else c = t > 0.66 ? '#9fd2f5' : t > 0.33 ? '#b6e0fb' : '#d3eefc';
    v.set(0, y, z, c);
  }
  if (era === 'then') { v.set(0, 13, 8, PAL.glow); v.set(0, 12, 11, '#fff3d6'); }
  else { v.box(0, 12, 7, 0, 12, 9, PAL.white); v.box(0, 13, 8, 0, 13, 8, PAL.white); v.set(0, 10, 11, PAL.white); }
  // frame + mullions
  for (let y = 7; y <= 15; y++) { v.set(1, y, 5, PAL.white); v.set(1, y, 13, PAL.white); }
  for (let z = 5; z <= 13; z++) { v.set(1, 7, z, PAL.white); v.set(1, 15, z, PAL.white); v.set(1, 11, z, PAL.white); }
  for (let y = 8; y <= 14; y++) v.set(1, y, 9, PAL.white);
  v.box(2, 7, 5, 2, 7, 13, PAL.white); // sill
}

export function roomThen() {
  const v = new Vox(); const r = rng(5);
  shell(v, 'then');
  // rug
  for (let x = 6; x <= 17; x++) for (let z = 8; z <= 19; z++) {
    const d = Math.hypot(x - 11.5, z - 13.5);
    if (d < 5.2) v.set(x, F, z, d > 4.2 ? PAL.sky : (Math.floor(d) % 2 ? '#e6dbf7' : PAL.lilac));
  }
  // bed, head against the right wall
  v.box(13, F, 2, 20, F + 1, 11, '#c9a77b');
  v.box(13, F + 2, 3, 20, F + 2, 11, PAL.white);
  v.box(13, F + 3, 3, 20, F + 3, 4, PAL.white);
  for (let x = 13; x <= 20; x++) for (let z = 5; z <= 11; z++) v.set(x, F + 3, z, (z % 3 === 0) ? '#f7a8b6' : PAL.blush);
  v.box(13, F + 3, 11, 20, F + 2, 11, PAL.blush);
  v.box(13, F, 2, 20, F + 6, 2, '#c9a77b'); v.box(14, F + 6, 2, 19, F + 6, 2, '#d8bb92');
  // poster: pixel rocket above the bed
  v.box(13, 9, 2, 19, 17, 2, '#cfeafc');
  v.box(15, 12, 2, 17, 15, 2, PAL.white); v.set(16, 16, 2, PAL.white); v.set(16, 14, 2, PAL.azure);
  [[14, 12], [14, 11], [18, 12], [18, 11]].forEach(([x, y]) => v.set(x, y, 2, PAL.blush));
  v.set(16, 11, 2, PAL.pollen); v.set(16, 10, 2, '#ffb36b'); v.set(15, 11, 2, '#ffe2a8'); v.set(17, 11, 2, '#ffe2a8');
  [[14, 16], [18, 15], [13, 14]].forEach(([x, y]) => v.set(x, y, 2, PAL.white));
  // desk against the left wall
  v.box(2, 8, 13, 6, 8, 20, '#d8b98d');
  [[6, 13], [6, 20], [2, 13]].forEach(([x, z]) => v.box(x, F, z, x, 7, z, '#b8976c'));
  v.box(2, F, 17, 5, 7, 20, PAL.peach); v.box(6, 5, 18, 6, 5, 19, '#f0b894');
  // laptop
  v.box(4, 9, 15, 5, 9, 18, PAL.steel); v.box(3, 9, 15, 3, 13, 18, '#8d98a3');
  v.plane({ draw: codeScreen(3), cw: 512, ch: 512, at: [3.51 + 0.5, 11.5, 17], w: 3.4, h: 3.4, face: 'x' });
  // phone on a little stand, Fun Libs v4 era
  v.box(5, 9, 12, 5, 13, 14, '#4a4f55'); v.set(4, 9, 13, '#4a4f55');
  v.plane({ draw: phoneScreen('#ffffff', true), images: [T + 'funlibs-v4.png'], cw: 360, ch: 600, at: [6.01, 11.5, 13.5], w: 2.6, h: 4.4, face: 'x' });
  // sprout in a tiny pot
  v.box(5, 9, 19, 5, 9, 19, PAL.clay); v.set(5, 10, 19, PAL.moss); v.set(5, 11, 19, PAL.leaf); v.set(5, 11, 20, PAL.leaf);
  // shelf with books
  v.box(2, 16, 14, 3, 16, 18, '#c9a77b');
  ['#81bfeb', '#fcbfc2', '#fee891', '#a5ce6f', '#daccf7'].forEach((c, i) => v.box(2, 17, 14 + i, 2, 17 + (i % 2), 14 + i, c));
  // chair
  v.box(7, F + 3, 15, 9, F + 3, 18, PAL.blush);
  [[7, 15], [9, 15], [7, 18], [9, 18]].forEach(([x, z]) => v.box(x, F, z, x, F + 2, z, PAL.steel));
  v.box(10, F + 3, 15, 10, F + 7, 18, PAL.blush);
  // floor ball + shoebox
  v.box(16, F, 15, 17, F + 1, 16, PAL.pollen); v.set(16, F + 1, 16, PAL.white);
  v.box(18, F, 18, 20, F + 1, 20, PAL.sky); v.box(18, F + 2, 18, 20, F + 2, 20, '#a5d3f2');
  // the first block, hovering over the desk
  v.box(11, 15, 13, 12, 16, 14, PAL.pollen);
  return { vox: v, opts: room() };
}

export function roomNow() {
  const v = new Vox(); const r = rng(9);
  shell(v, 'now');
  // rug
  for (let x = 6; x <= 17; x++) for (let z = 8; z <= 19; z++) {
    const d = Math.hypot(x - 11.5, z - 13.5);
    if (d < 5.2) v.set(x, F, z, d > 4.2 ? PAL.white : (Math.floor(d) % 2 ? '#fdf0b0' : PAL.lime));
  }
  // the sprout, grown up
  v.box(2, F, 2, 4, F + 3, 4, PAL.clay); v.box(2, F + 4, 2, 4, F + 4, 4, '#e3ad85');
  v.box(3, F + 5, 3, 3, F + 9, 3, '#b08a5f'); v.set(4, F + 8, 3, '#b08a5f');
  const leafs = [PAL.leaf, '#b6d97f', PAL.moss, '#8fbd5a'];
  v.blob(4.0, 15.0, 4.0, 3.6, 3.1, 3.6, () => leafs[Math.floor(r() * leafs.length)], r, 0.3);
  // long desk along the left wall
  v.box(2, 9, 7, 6, 9, 20, '#ecd8b2');
  [[6, 7], [6, 20], [2, 7], [2, 20]].forEach(([x, z]) => v.box(x, F, z, x, 8, z, PAL.steel));
  // ultrawide monitor with MCP Emails
  v.box(3, 11, 13, 3, 16, 20, '#3a4048'); v.box(3, 10, 16, 3, 10, 17, PAL.steel); v.box(4, 10, 15, 4, 10, 18, PAL.steel);
  v.plane({ src: T + 'mcp-cover.png', at: [4.01, 14, 17], w: 7.5, h: 3.94, face: 'x' });
  // keyboard + mug
  v.box(5, 10, 15, 5, 10, 19, PAL.white);
  v.box(4, 10, 8, 4, 11, 8, PAL.peach);
  // phone stand, Fun Libs v5
  v.box(4, 10, 10, 4, 14, 12, '#3a4048');
  v.plane({ draw: phoneScreen('#fffdf3'), images: [T + 'funlibs-v5.png'], cw: 360, ch: 600, at: [5.01, 12.5, 11.5], w: 2.6, h: 4.4, face: 'x' });
  // homelab under the desk
  v.box(2, F, 15, 4, F + 4, 18, PAL.mist);
  [F + 1, F + 3].forEach(y => { v.set(4, y, 16, PAL.leaf); v.set(4, y, 17, '#e9f5c9'); });
  // chair
  v.box(8, F + 4, 15, 10, F + 4, 18, PAL.azure);
  v.box(9, F + 1, 16, 9, F + 3, 17, PAL.steel); v.box(8, F, 16, 10, F, 17, PAL.steel); v.box(9, F, 15, 9, F, 18, PAL.steel);
  v.box(11, F + 5, 15, 11, F + 9, 18, PAL.azure);
  // lattice shelf on the right wall, with the four products
  for (let x = 9; x <= 21; x++) for (let y = 6; y <= 16; y++) if (x % 4 === 1 || y % 5 === 1) v.set(x, y, 2, '#e3c99c');
  v.box(9, 6, 3, 21, 6, 5, '#e3c99c'); v.box(9, 11, 3, 21, 11, 5, '#e3c99c');
  const tiles = [
    { x: 11, y: 12, src: 'mcp-icon.png', bg: '#ffffff' }, { x: 16, y: 12, src: 'toolrails.png', bg: '#ffffff' },
    { x: 11, y: 7, src: 'funlibs-v5.png', bg: '#ffffff' }, { x: 16, y: 7, src: 'harbor-mark.png', bg: '#fbf9f4' },
  ];
  for (const t of tiles) {
    v.box(t.x, t.y, 3, t.x + 2, t.y + 2, 5, PAL.paper);
    v.plane({ draw: framed(t.bg, 0.12, t.src === 'funlibs-v5.png' ? 0.22 : 0), images: [T + t.src], cw: 512, ch: 512, at: [t.x + 1.5, t.y + 1.5, 6.01], w: 2.8, h: 2.8 });
  }
  v.box(20, 7, 3, 20, 8, 4, PAL.leaf); v.box(20, 12, 3, 20, 14, 3, PAL.lilac); v.box(20, 12, 4, 20, 13, 4, PAL.sky);
  // beanbag where the bed was
  v.blob(18, 4.4, 11, 2.9, 2.0, 2.8, () => (r() < 0.5 ? PAL.lilac : '#e2d6f8'), r, 0.15);
  // a small agent robot on the rug, carrying a letter
  const rx = 10, rz = 11;
  v.box(rx, F, rz, rx + 2, F + 2, rz + 2, PAL.sky); v.box(rx + 1, F + 1, rz + 3, rx + 1, F + 1, rz + 3, PAL.white);
  v.box(rx - 1, F + 1, rz + 1, rx - 1, F + 2, rz + 1, PAL.steel); v.box(rx + 3, F + 1, rz + 1, rx + 3, F + 2, rz + 1, PAL.steel);
  v.box(rx, F + 3, rz, rx + 2, F + 5, rz + 2, PAL.white);
  v.box(rx, F + 4, rz + 2, rx + 2, F + 4, rz + 2, '#3a4048'); v.set(rx, F + 4, rz + 2, PAL.leaf); v.set(rx + 2, F + 4, rz + 2, PAL.leaf);
  v.box(rx + 2, F + 4, rz, rx + 2, F + 4, rz + 1, '#3a4048');
  v.set(rx + 1, F + 6, rz + 1, PAL.steel); v.set(rx + 1, F + 7, rz + 1, PAL.pollen);
  // the letter it carries
  v.box(rx + 3, F + 2, rz + 2, rx + 4, F + 3, rz + 4, PAL.white); v.set(rx + 4, F + 3, rz + 3, PAL.peach);
  // the lattice: blocks drifting up and out
  const drift = [[1, 20, 13, PAL.blush], [0, 22, 6, PAL.leaf], [7, 21, 0, PAL.sky], [12, 20, 0, PAL.lilac], [16, 22, 0, PAL.pollen], [20, 21, 1, PAL.peach], [9, 24, -2, PAL.lime], [4, 23, -1, PAL.pollen]];
  drift.forEach(([x, y, z, c], i) => { const s = i % 3 === 0 ? 1 : 0; v.box(x, y, z, x + s, y + s, z + s, c); });
  shell(v, 'now');
  return { vox: v, opts: room() };
}

// The seam: one image, 2019 on the left of the diagonal, today on the right,
// with the voxels along the edge lifting off and drifting (the hero's split line, baked).
export function roomSeam() {
  const a = roomThen().vox, b = roomNow().vox, v = new Vox(); const r = rng(21);
  const pick = (src, left) => {
    for (const [k, c] of src.m) {
      const [x, y, z] = k.split(',').map(Number); const s = x - z + 0.5;
      if ((s < 0) !== left) continue;
      const d = Math.abs(s); let dy = 0;
      if (y >= 3 && d < 3.5) dy = Math.round(r() * (3.5 - d) * 2.4 + (r() < 0.25 ? 3 : 0));
      else if (y >= 3 && d < 5 && r() < 0.18) dy = 1 + Math.round(r() * 2);
      v.set(x, Math.min(y + dy, 24), z, c);
    }
  };
  pick(a, true); pick(b, false);
  for (const p of a.planes) if (p.at[0] - p.at[2] < 0) v.plane(p);
  for (const p of b.planes) if (p.at[0] - p.at[2] >= 0) v.plane(p);
  return { vox: v, opts: room() };
}

function room() {
  return { width: 2400, height: 2000, center: [11, 10.2, 11], span: 30, zoom: 0.96, ground: false, hemi: 1.7, azimuth: 45, elevation: 30, sunDir: [0.85, 1.0, 0.4], groundOpacity: 0.1, groundGap: 0 };
}
export * from './props.js';
