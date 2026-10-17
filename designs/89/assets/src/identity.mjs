// Prism Room identity generator: pixel glyphs -> merged-run SVG rects.
// node designs/89/assets/src/identity.mjs   (writes ../identity/*.svg)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'identity');
fs.mkdirSync(dir, { recursive: true });

const SPECTRUM = ['#ff9a7d', '#ff99c2', '#bea6eb', '#86cbf3', '#8deaca']; // peach, bubblegum, lilac, sky, mint
const INK = '#160c21', PAPER = '#fff5ea';

const G = {
  A: ['.###.', '#...#', '#...#', '*****', '#...#', '#...#', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
};

// runs of '#' merged into rects; '*' = prism pixels each coloured from the spectrum
function glyphRects(rows, ox, oy, s, prismIndex = { i: 0 }, fill = 'currentColor') {
  let out = '';
  rows.forEach((r, y) => {
    let x = 0;
    while (x < r.length) {
      if (r[x] === '#') { let x2 = x; while (r[x2] === '#') x2++; out += `<rect x="${(ox + x) * s}" y="${(oy + y) * s}" width="${(x2 - x) * s}" height="${s}"/>`; x = x2; }
      else if (r[x] === '*') { out += `<rect x="${(ox + x) * s}" y="${(oy + y) * s}" width="${s}" height="${s}" fill="${SPECTRUM[prismIndex.i++ % 5]}"/>`; x++; }
      else x++;
    }
  });
  return out;
}

// --- Mark: a 16-grid prism "A". White beam enters the left leg, the crossbar splits it into the candy spectrum.
const MARK = [
  '.......##.......',
  '......####......',
  '......####......',
  '.....##..##.....',
  '.....##..##.....',
  '....##....##....',
  '....##....##....',
  '...**********...',
  '...**********...',
  '..##........##..',
  '..##........##..',
  '.##..........##.',
  '.##..........##.',
  '##............##',
];
function markSVG({ bg = null, fg = 'currentColor', size = 16, pad = 1, rx = 0 } = {}) {
  const W = 16 + pad * 2, H = 14 + pad * 2 + 2;
  let body = '';
  MARK.forEach((r, y) => {
    let x = 0;
    while (x < r.length) {
      if (r[x] === '#') { let x2 = x; while (r[x2] === '#') x2++; body += `<rect x="${x + pad}" y="${y + pad + 1}" width="${x2 - x}" height="1"/>`; x = x2; }
      else if (r[x] === '*') { let x2 = x; while (r[x2] === '*') x2++; const seg = x2 - x; // spectrum: 2 px per colour
        for (let k = 0; k < seg; k += 2) body += `<rect x="${x + k + pad}" y="${y + pad + 1}" width="2" height="1" fill="${SPECTRUM[(k / 2) % 5]}"/>`; x = x2; }
      else x++;
    }
  });
  const S = Math.max(W, H);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="Albretsen AS">` +
    (bg ? `<rect width="${S}" height="${S}" rx="${rx}" fill="${bg}"/>` : '') +
    `<g fill="${fg}" transform="translate(${(S - W) / 2} ${(S - H) / 2})">${body}</g></svg>\n`;
}

function wordSVG({ text = 'ALBRETSEN', suffix = 'AS', s = 4, fill = 'currentColor' } = {}) {
  let x = 0, body = ''; const pi = { i: 0 };
  for (const ch of text) { body += glyphRects(G[ch], x, 0, s, pi); x += G[ch][0].length + 1; }
  let suf = '';
  if (suffix) { x += 2; for (const ch of suffix) { suf += glyphRects(G[ch].map(r => r.replace(/\*/g, '#')), x, 0, s); x += G[ch][0].length + 1; } }
  const W = (x - 1) * s, H = 7 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}" shape-rendering="crispEdges" role="img" aria-label="Albretsen AS">` +
    `<g fill="${fill}">${body}</g>` + (suffix ? `<g fill="${fill}" opacity=".55">${suf}</g>` : '') + `</svg>\n`;
}

fs.writeFileSync(path.join(dir, 'mark.svg'), markSVG({ size: 64 }));
fs.writeFileSync(path.join(dir, 'mark-ink.svg'), markSVG({ size: 64, fg: INK }));
fs.writeFileSync(path.join(dir, 'mark-paper.svg'), markSVG({ size: 64, fg: PAPER }));
fs.writeFileSync(path.join(dir, 'favicon.svg'), markSVG({ size: 32, bg: INK, fg: PAPER, pad: 1, rx: 3 }));
fs.writeFileSync(path.join(dir, 'wordmark.svg'), wordSVG());
fs.writeFileSync(path.join(dir, 'wordmark-paper.svg'), wordSVG({ fill: PAPER }));
fs.writeFileSync(path.join(dir, 'wordmark-ink.svg'), wordSVG({ fill: INK }));
console.log('identity written to', dir);
