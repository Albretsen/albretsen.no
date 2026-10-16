// Generates the identity SVGs (mark, wordmark, lockup, favicon, patterns, stickers).
// Run: node designs/42/assets/src/identity.mjs   (writes into designs/42/assets/identity|patterns|stickers)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
const f = n => +n.toFixed(2);

// ---------- isometric voxel → SVG polygons ----------
function iso(voxels, s, ox, oy) {
  const P = (x, y, z) => [f(ox + (x - z) * C30 * s), f(oy + (x + z) * S30 * s - y * s)];
  const has = new Set(voxels.map(v => v.p.join(',')));
  const H = (x, y, z) => has.has([x, y, z].join(','));
  const sorted = [...voxels].sort((a, b) => (a.p[0] + a.p[1] + a.p[2]) - (b.p[0] + b.p[1] + b.p[2]) || a.p[1] - b.p[1]);
  let out = '';
  for (const { p: [x, y, z], c } of sorted) {
    const poly = (pts, fill) => `<path d="M${pts.map(p => p.join(' ')).join('L')}Z" fill="${fill}" stroke="${fill}" stroke-width="${f(s * 0.012)}" stroke-linejoin="round"/>`;
    if (!H(x, y + 1, z)) out += poly([P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], c[0]);
    if (!H(x, y, z + 1)) out += poly([P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], c[1]);
    if (!H(x + 1, y, z)) out += poly([P(x + 1, y, z), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z)], c[2]);
  }
  return out;
}
const BUTTER = ['#fee891', '#f3d761', '#d8b736'];
const LEAF = ['#d9efb0', '#a5ce6f', '#7fae4c'];
const INK = '#2b3116';

// The mark: a 2x2x2 block with its last voxel drifting into place.
function markVoxels(lift = 1.5) {
  const v = [];
  for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) if (!(x === 1 && y === 1 && z === 1)) v.push({ p: [x, y, z], c: BUTTER });
  v.push({ p: [1.32, 1 + lift, 1.32], c: LEAF });
  return v;
}
function markSVG(size = 128, bg = null, pad = 0.12) {
  // projected extent: x in [-2·cos30·s, 2·cos30·s], y in [-3s, 2s] (cube + block lifted by 2)
  const s = size * (1 - pad * 2) / 4.6;
  const body = iso(markVoxels(), s, size / 2, size / 2 + s * 0.15);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Albretsen AS">${bg ? `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${bg}"/>` : ''}${body}</svg>`;
}

// ---------- pixel wordmark with a voxel extrusion ----------
const G = {
  a: ['.....', '.....', '.###.', '....#', '.####', '#...#', '.####'],
  l: ['##', '.#', '.#', '.#', '.#', '.#', '.#'],
  b: ['#....', '#....', '####.', '#...#', '#...#', '#...#', '####.'],
  r: ['....', '....', '#.##', '##..', '#...', '#...', '#...'],
  e: ['.....', '.....', '.###.', '#...#', '#####', '#....', '.####'],
  t: ['.#..', '.#..', '####', '.#..', '.#..', '.#..', '..##'],
  s: ['.....', '.....', '.####', '#....', '.###.', '....#', '####.'],
  n: ['.....', '.....', '####.', '#...#', '#...#', '#...#', '#...#'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
};
function pixels(word) {
  const px = []; let x = 0;
  for (const ch of word) {
    if (ch === ' ') { x += 3; continue; }
    const g = G[ch]; g.forEach((row, y) => [...row].forEach((c, i) => c === '#' && px.push([x + i, y]))); x += g[0].length + 1;
  }
  return { px, w: x - 1, h: px.some(p => p[1] > 6) ? 8 : 7 };
}
function wordmarkSVG(word = 'albretsen', u = 10, face = INK, side = '#f3d761', depth = 0.42) {
  const { px, w, h } = pixels(word);
  const d = u * depth; const W = w * u + d + 2, Hh = h * u + d + 2;
  const sq = px.map(([x, y]) => `M${x * u} ${y * u}h${u}v${u}h${-u}Z`).join('');
  // extrusion: stacked copies offset down-right, the classic voxel letter depth
  let ext = ''; const steps = 6; for (let i = steps; i >= 1; i--) ext += `<path d="${sq}" transform="translate(${f(d * i / steps)} ${f(d * i / steps)})" fill="${side}"/>`;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(Hh)}" width="${f(W)}" height="${f(Hh)}" role="img" aria-label="${word}">${ext}<path d="${sq}" fill="${face}"/></svg>`, W, H: Hh, inner: `${ext}<path d="${sq}" fill="${face}"/>` };
}

function write(rel, s) { const p = join(ROOT, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, s); console.log('wrote', rel, s.length); }

write('identity/mark.svg', markSVG(128));
write('identity/favicon.svg', markSVG(64, '#fefaed', 0.1));
write('identity/mark-on-ink.svg', markSVG(128, INK, 0.14));
const wm = wordmarkSVG('albretsen');
write('identity/wordmark.svg', wm.svg);
write('identity/wordmark-on-dark.svg', wordmarkSVG('albretsen', 10, '#fefaed', '#a5ce6f').svg);
// lockup: mark + wordmark + "AS"
{
  const as = wordmarkSVG('AS', 10, INK, '#f3d761');
  const mh = 96, gap = 26; const W = mh + gap + wm.W + 22 + as.W; const H = mh;
  const ty = (H - wm.H) / 2 + 4;
  const mark = markSVG(mh).replace(/^<svg[^>]*>/, '').replace('</svg>', '');
  write('identity/lockup.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${H}" width="${f(W)}" height="${H}" role="img" aria-label="Albretsen AS">${mark}<g transform="translate(${mh + gap} ${f(ty)})">${wm.inner}</g><g transform="translate(${f(mh + gap + wm.W + 22)} ${f(ty)})" opacity=".42">${as.inner}</g></svg>`);
}

// ---------- patterns ----------
// isometric lattice: a seamless tile of cube edges, the grid everything snaps to
{
  const s = 24, w = f(2 * C30 * s), h = 3 * s; // one hex-cube period
  const stroke = '#e7d98f';
  const p = (pts) => `<path d="M${pts.map(q => q.map(f).join(' ')).join('L')}" fill="none" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const cx = w / 2;
  const cube = (ox, oy) => p([[ox, oy], [ox + C30 * s, oy + s / 2], [ox + C30 * s, oy + 1.5 * s], [ox, oy + 2 * s], [ox - C30 * s, oy + 1.5 * s], [ox - C30 * s, oy + s / 2], [ox, oy]]) + p([[ox - C30 * s, oy + s / 2], [ox, oy + s], [ox + C30 * s, oy + s / 2]]) + p([[ox, oy + s], [ox, oy + 2 * s]]);
  let g = ''; for (const [ox, oy] of [[cx, 0], [0, 1.5 * s], [w, 1.5 * s], [cx, 3 * s], [0, -1.5 * s], [w, -1.5 * s]]) g += cube(ox, oy);
  write('patterns/lattice.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${g}</svg>`);
}
// confetti of tiny voxels, seamless 320 tile
{
  const pal = [BUTTER, LEAF, ['#e3f3fd', '#bae5fd', '#8fcdf2'], ['#ece4fb', '#daccf7', '#bfaeea'], ['#ffe6d6', '#fed0b2', '#f2b48e'], ['#fde0e1', '#fcbfc2', '#f0a1a6']];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let g = ''; const T = 320;
  for (let i = 0; i < 46; i++) {
    const x = rnd() * T, y = rnd() * T, s = 6 + rnd() * 8, c = pal[Math.floor(rnd() * pal.length)];
    for (const [dx, dy] of [[0, 0], [T, 0], [-T, 0], [0, T], [0, -T]]) { const xx = x + dx, yy = y + dy; if (xx < -20 || xx > T + 20 || yy < -20 || yy > T + 20) continue; g += iso([{ p: [0, 0, 0], c }], s, xx, yy); }
  }
  write('patterns/confetti.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T} ${T}" width="${T}" height="${T}">${g}</svg>`);
}
// dot grid on the floor plane (isometric dots), subtle section background
{
  const s = 20, w = f(2 * C30 * s), h = s;
  write('patterns/iso-dots.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><circle cx="0" cy="0" r="1.3" fill="#d8c97a"/><circle cx="${w}" cy="0" r="1.3" fill="#d8c97a"/><circle cx="0" cy="${h}" r="1.3" fill="#d8c97a"/><circle cx="${w}" cy="${h}" r="1.3" fill="#d8c97a"/><circle cx="${f(w / 2)}" cy="${h / 2}" r="1.3" fill="#d8c97a"/></svg>`);
}

// ---------- stickers: die-cut voxel badges (facts from content.js only) ----------
function sticker(name, word, sub, faceCol, sideCol, bg, voxCol) {
  const t = wordmarkSVG(word, 8, faceCol, sideCol, 0.4);
  const st = wordmarkSVG(sub, 4, faceCol, 'none', 0);
  const W = Math.max(t.W, st.W) + 120, H = 150;
  const cube = iso([{ p: [0, 0, 0], c: voxCol }], 26, 46, 52);
  const body = `<rect x="6" y="6" width="${f(W - 12)}" height="${H - 12}" rx="${(H - 12) / 2}" fill="${bg}"/>${cube}<g transform="translate(88 32)">${t.inner}</g><g transform="translate(89 ${f(32 + t.H + 14)})" opacity=".7">${st.inner}</g>`;
  write(`stickers/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${H}" width="${f(W)}" height="${H}"><rect x="0" y="0" width="${f(W)}" height="${H}" rx="${H / 2}" fill="#ffffff"/><rect x="0" y="4" width="${f(W)}" height="${H - 4}" rx="${(H - 4) / 2}" fill="#000" opacity=".06"/>${body}</svg>`);
}
Object.assign(G, {
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  ',': ['..', '..', '..', '..', '..', '.#', '#.'],
  'i': ['#', '.', '#', '#', '#', '#', '#'],
  'u': ['.....', '.....', '#...#', '#...#', '#...#', '#...#', '.####'],
  'c': ['.....', '.....', '.####', '#....', '#....', '#....', '.####'],
  'o': ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
  'g': ['.....', '.....', '.####', '#...#', '#...#', '.####', '....#', '####.'],
  'p': ['.....', '.....', '####.', '#...#', '#...#', '####.', '#....', '#....'],
  'y': ['.....', '.....', '#...#', '#...#', '#...#', '.####', '....#', '####.'],
  'G': ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
  'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  'd': ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.####'],
  'h': ['#....', '#....', '####.', '#...#', '#...#', '#...#', '#...#'],
  'k': ['#...', '#...', '#..#', '#.#.', '##..', '#.#.', '#..#'],
  'm': ['.......', '.......', '###.##.', '#..#..#', '#..#..#', '#..#..#', '#..#..#'],
  'v': ['.....', '.....', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  'f': ['..##', '.#..', '####', '.#..', '.#..', '.#..', '.#..'],
});
sticker('since-2016', 'since 2016', 'on google play', INK, '#f3d761', '#fee891', LEAF);
sticker('built-at-17', 'built at 17', 'fun libs', '#13213f', '#fcbfc2', '#fde3e6', BUTTER);
sticker('installs', '113,000+', 'installs', INK, '#a5ce6f', '#e9f5c9', ['#e3f3fd', '#bae5fd', '#8fcdf2']);
sticker('open-source', 'AGPL', 'open source', '#3b2f6b', '#daccf7', '#efe9fb', ['#ffe6d6', '#fed0b2', '#f2b48e']);
