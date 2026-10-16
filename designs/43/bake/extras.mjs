// SVG extras for design 43: edition stamp, facet pattern, rules, ear icons, keycaps.
// Run: NODE_PATH=<dir with opentype.js> node extras.mjs <fontsDir> <outDir>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(process.env.NODE_PATH + '/');
const opentype = require('opentype.js');
const [fontsDir, out] = process.argv.slice(2);
const serif = opentype.loadSync(path.join(fontsDir, 'InstrumentSerif-Regular.ttf'));
const serifIt = opentype.loadSync(path.join(fontsDir, 'InstrumentSerif-Italic.ttf'));
const sans = opentype.loadSync(path.join(fontsDir, 'Geist.ttf'));
fs.mkdirSync(out, { recursive: true });
const C = { paper:'#f6fbfc', mist:'#e2f4f6', sky:'#b5e5ea', lagoon:'#6ab9c7', deep:'#32728a', ink:'#182933', dawn:'#fbd1b6', blush:'#f6cbd0', lilac:'#d0cded', spark:'#f8e18a', gold:'#efc65a' };
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const spark = (x, y, r, fill) => `<path d="M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z" fill="${fill}"/>`;

// glyphs laid on a circle (for the stamp)
function circleText(font, text, cx, cy, r, size, tracking = 0.12, start = -90) {
  const glyphs = font.stringToGlyphs(text);
  const adv = glyphs.map(g => g.advanceWidth * size / font.unitsPerEm + tracking * size);
  const total = adv.reduce((a, b) => a + b, 0);
  const circ = 2 * Math.PI * r;
  const scale = circ / total; // spread evenly round the full circle
  let a = start * Math.PI / 180, parts = [];
  glyphs.forEach((g, i) => {
    const w = adv[i] * scale, mid = a + (w / 2) / r;
    const x = cx + r * Math.cos(mid), y = cy + r * Math.sin(mid);
    const gw = g.advanceWidth * size / font.unitsPerEm;
    const d = g.getPath(-gw / 2, 0, size).toPathData(2);
    if (d) parts.push(`<path transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(mid * 180 / Math.PI + 90).toFixed(2)})" d="${d}"/>`);
    a += w / r;
  });
  return parts.join('');
}
function textPath(font, text, x, y, size, tracking = 0, anchor = 'start') {
  const glyphs = font.stringToGlyphs(text); let w = 0;
  glyphs.forEach((g, i) => { w += g.advanceWidth * size / font.unitsPerEm + (i < glyphs.length - 1 ? tracking * size : 0); });
  let cx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x; const parts = [];
  glyphs.forEach(g => { parts.push(g.getPath(cx, y, size).toPathData(2)); cx += g.advanceWidth * size / font.unitsPerEm + tracking * size; });
  return parts.join('');
}

// facet A (same geometry as the logo)
const V = { T:[32,4], L:[4,60], R:[60,60], N:[32,42], NL:[19.5,60], NR:[44.5,60], C1:[32,21], C2:[26.2,33.5], C3:[37.8,33.5], ML:[17.6,33.5], MR:[46.4,33.5] };
const F = [['T','C1','C2','#4a8ea3'],['T','C2','ML',C.deep],['T','MR','C3','#8fd0da'],['T','C3','C1',C.lagoon],['ML','C2','N','#4a8ea3'],['ML','N','NL',C.deep],['ML','NL','L','#2c5f74'],['MR','N','C3',C.lagoon],['MR','NR','N','#8fd0da'],['MR','R','NR',C.sky],['C2','C3','N','#fbd9a8']];
const aMark = (tx, ty, s) => `<g transform="translate(${tx} ${ty}) scale(${s})">${F.map(([a,b,c,f]) => `<polygon points="${V[a]} ${V[b]} ${V[c]}" fill="${f}" stroke="${f}" stroke-width="0.35" stroke-linejoin="round"/>`).join('')}</g>`;

// 1. Edition stamp (rotates on the site)
{
  const ring = circleText(sans, 'DAWN EDITION · ALBRETSEN AS · PRINTED IN TRIANGLES · NORWAY · ', 120, 120, 92, 13, 0.16);
  fs.writeFileSync(path.join(out, 'stamp-dawn-edition.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-label="Dawn edition stamp">
  <circle cx="120" cy="120" r="118" fill="${C.paper}"/>
  <circle cx="120" cy="120" r="114" fill="none" stroke="${C.deep}" stroke-width="1.2"/>
  <circle cx="120" cy="120" r="74" fill="none" stroke="${C.deep}" stroke-width="0.8" stroke-dasharray="2 4"/>
  <g fill="${C.deep}">${ring}</g>
  ${aMark(92, 88, 0.88)}
  ${spark(152, 92, 6, C.gold)}
</svg>
`);
}

// 2. Facet pattern tile: seamless low-poly field, very quiet (for section grounds)
{
  const W = 240, H = 240, cols = 6, rows = 6, r = rng(204);
  // jittered grid whose edge points wrap so the tile repeats seamlessly
  const jit = [];
  for (let j = 0; j < rows; j++) { jit[j] = []; for (let i = 0; i < cols; i++) jit[j][i] = [(r() - 0.5) * 22, (r() - 0.5) * 22]; }
  const P = (i, j) => { const ii = ((i % cols) + cols) % cols, jj = ((j % rows) + rows) % rows; return [i * W / cols + jit[jj][ii][0], j * H / rows + jit[jj][ii][1]]; };
  const tones = ['#f6fbfc', '#eef8fa', '#e7f5f7', '#f2f1fb', '#fbf1f3', '#fdf3ec'];
  let polys = '';
  for (let j = -1; j <= rows; j++) for (let i = -1; i <= cols; i++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i, j + 1), d = P(i + 1, j + 1);
    const flip = ((i + j) & 1) === 0;
    const t1 = flip ? [a, b, d] : [a, b, c], t2 = flip ? [a, d, c] : [b, d, c];
    for (const t of [t1, t2]) {
      const f = tones[Math.floor(r() * tones.length)];
      polys += `<polygon points="${t.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${f}" stroke="${f}" stroke-width="0.6"/>`;
    }
  }
  fs.writeFileSync(path.join(out, 'facet-pattern.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${polys}</svg>\n`);
}

// 3. Rules: hairline + double rule with a spark (column and section dividers)
fs.writeFileSync(path.join(out, 'rule-spark.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 24" width="800" height="24" preserveAspectRatio="none">
  <rect x="0" y="10" width="384" height="1" fill="${C.ink}" opacity="0.55"/><rect x="0" y="13" width="384" height="2" fill="${C.ink}" opacity="0.8"/>
  <rect x="416" y="10" width="384" height="1" fill="${C.ink}" opacity="0.55"/><rect x="416" y="13" width="384" height="2" fill="${C.ink}" opacity="0.8"/>
  ${spark(400, 12, 9, C.gold)}
</svg>
`);

// 4. Ear icons (the little boxes either side of a nameplate): weather, orbit, edition
const ear = (name, body) => fs.writeFileSync(path.join(out, `ear-${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">${body}</svg>\n`);
ear('sunrise', `
  <polygon points="10,70 48,70 30,52" fill="${C.sky}"/><polygon points="30,52 48,70 52,58" fill="#8fd0da"/>
  <polygon points="48,70 86,70 66,50" fill="${C.lilac}"/><polygon points="52,58 66,50 48,70" fill="#c3c0e6"/>
  <polygon points="36,48 48,30 60,48" fill="${C.spark}"/><polygon points="36,48 60,48 48,56" fill="${C.dawn}"/>
  <polygon points="48,30 60,48 64,36" fill="#fbe7a3"/><polygon points="48,30 32,36 36,48" fill="#f7da84"/>
  <rect x="8" y="70" width="80" height="2" fill="${C.ink}"/>
  ${spark(76, 20, 5, C.gold)}`);
ear('orbit', `
  <ellipse cx="48" cy="50" rx="38" ry="13" fill="none" stroke="${C.deep}" stroke-width="1.6" transform="rotate(-14 48 50)"/>
  <polygon points="48,30 64,42 60,62 36,62 32,42" fill="${C.lagoon}"/><polygon points="48,30 64,42 48,46" fill="#8fd0da"/>
  <polygon points="48,46 64,42 60,62" fill="${C.sky}"/><polygon points="32,42 48,46 36,62" fill="${C.deep}"/><polygon points="36,62 48,46 60,62" fill="#4a8ea3"/>
  <ellipse cx="48" cy="50" rx="38" ry="13" fill="none" stroke="${C.deep}" stroke-width="1.6" transform="rotate(-14 48 50)" stroke-dasharray="0 60 200" />
  <polygon points="80,36 86,40 82,46 76,42" fill="${C.dawn}"/>`);
ear('spark', `${spark(48, 48, 30, C.spark)}${spark(48, 48, 18, C.gold)}${spark(78, 22, 6, C.lagoon)}${spark(20, 74, 4, C.lilac)}`);

// 5. Keycap sprites for the shortcut sheet (? / J / K / G / T / Esc)
{
  const keys = ['?', 'J', 'K', 'G', 'T', 'Esc', '/', '1'];
  const cap = (k, x) => {
    const w = k.length > 1 ? 64 : 44;
    return { w, svg: `<g transform="translate(${x} 0)">
    <rect x="0.5" y="0.5" width="${w - 1}" height="43" rx="9" fill="${C.mist}" stroke="${C.deep}" stroke-opacity="0.35"/>
    <rect x="3.5" y="2.5" width="${w - 7}" height="35" rx="7" fill="${C.paper}"/>
    <polygon points="3.5,37.5 ${w - 3.5},37.5 ${w - 0.5},43 0.5,43" fill="${C.sky}" opacity="0.7"/>
    <path fill="${C.ink}" d="${textPath(k.length > 1 ? sans : serif, k, w / 2, 27, k.length > 1 ? 14 : 22, k.length > 1 ? 0.04 : 0, 'middle')}"/>
  </g>` };
  };
  let x = 0, body = '';
  for (const k of keys) { const c = cap(k, x); body += c.svg; x += c.w + 10; }
  fs.writeFileSync(path.join(out, 'keycaps.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x - 10} 44" width="${x - 10}" height="44">${body}</svg>\n`);
}

// 6. "Late edition" headline sticker: a folded corner tab in the Dawn's voice
fs.writeFileSync(path.join(out, 'sticker-late-edition.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 96" width="260" height="96" role="img" aria-label="Late edition">
  <polygon points="8,10 236,4 252,48 236,92 10,86 20,48" fill="${C.dawn}"/>
  <polygon points="8,10 236,4 252,48 20,48" fill="#fcdcc6"/>
  <polygon points="236,4 252,48 236,92 244,48" fill="#f2bfa0"/>
  <path fill="${C.ink}" d="${textPath(serifIt, 'Late edition', 132, 58, 34, 0, 'middle')}"/>
  ${spark(40, 48, 7, C.gold)}
</svg>
`);
console.log('extras ok');
