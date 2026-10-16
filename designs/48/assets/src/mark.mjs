// Generates the Albretsen "Selector" mark (a rounded Λ with a dot = the A, and the P1 pointer)
// and the wordmark (Unbounded 600 outlined via opentype.js, then tuned).
import fs from 'node:fs';
import opentype from 'opentype.js';
const OUT = process.argv[2];
const FONT = process.argv[3];

function rounded(pts, r) {
  // pts: [[x,y,radius?],...] closed polygon; quadratic rounding at each corner
  const n = pts.length; let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const rr = p1[2] ?? r;
    const v1 = [p0[0] - p1[0], p0[1] - p1[1]], v2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(...v1), l2 = Math.hypot(...v2);
    const a = [p1[0] + v1[0] / l1 * Math.min(rr, l1 / 2), p1[1] + v1[1] / l1 * Math.min(rr, l1 / 2)];
    const b = [p1[0] + v2[0] / l2 * Math.min(rr, l2 / 2), p1[1] + v2[1] / l2 * Math.min(rr, l2 / 2)];
    d += (i === 0 ? 'M' : 'L') + f(a) + 'Q' + f(p1) + ' ' + f(b);
  }
  return d + 'Z';
  function f(p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }
}
// Λ in a 64 grid
const lambda = rounded([[32, 5, 7], [60, 56, 5], [45, 56, 3], [32, 33, 4], [19, 56, 3], [4, 56, 5]], 5);
const dot = { cx: 32, cy: 50.5, r: 4.6 };
fs.writeFileSync(OUT + '/mark-paths.json', JSON.stringify({ lambda, dot }));

const markSVG = (fill, dotFill, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">
${bg ? bg : ''}<path d="${lambda}" fill="${fill}"/>
<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="${dotFill}"/>
</svg>
`;
// primary mark: glossy gradient version
fs.writeFileSync(OUT + '/logo-mark.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256" role="img" aria-label="Albretsen AS mark">
<defs>
<linearGradient id="g" x1="0.2" y1="0" x2="0.75" y2="1"><stop offset="0" stop-color="#f6b7fb"/><stop offset="0.38" stop-color="#dc3aec"/><stop offset="1" stop-color="#861192"/></linearGradient>
<radialGradient id="s" cx=".3" cy=".2" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="d" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#bff6fb"/><stop offset="1" stop-color="#36dcec"/></radialGradient>
</defs>
<path d="${lambda}" fill="url(#g)"/>
<path d="${lambda}" fill="url(#s)" opacity=".55"/>
<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="url(#d)"/>
</svg>
`);
fs.writeFileSync(OUT + '/logo-mark-flat.svg', markSVG('#dc3aec', '#36dcec').replace('width="64" height="64"', 'width="256" height="256"'));
fs.writeFileSync(OUT + '/logo-mark-mono.svg', markSVG('currentColor', 'currentColor').replace('width="64" height="64"', 'width="256" height="256"'));
// favicon: night tile + mark
fs.writeFileSync(OUT + '/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="g" x1="0.2" y1="0" x2="0.75" y2="1"><stop offset="0" stop-color="#f6b7fb"/><stop offset="0.4" stop-color="#dc3aec"/><stop offset="1" stop-color="#a21eb2"/></linearGradient>
<radialGradient id="b" cx=".5" cy=".95" r=".9"><stop offset="0" stop-color="#3b1640"/><stop offset="1" stop-color="#0b050c"/></radialGradient></defs>
<rect width="64" height="64" rx="14" fill="url(#b)"/>
<g transform="translate(9 8) scale(.72)"><path d="${lambda}" fill="url(#g)"/><circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r + 0.6}" fill="#36dcec"/></g>
</svg>
`);
// cursor
fs.writeFileSync(OUT + '/cursor.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
<g transform="translate(4 2) rotate(-28 16 16) scale(.5)"><path d="${lambda}" fill="#dc3aec" stroke="#f8f1f8" stroke-width="3" stroke-linejoin="round"/><circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="#36dcec"/></g>
</svg>
`);

// wordmark
const font = opentype.parse(fs.readFileSync(FONT).buffer.slice(0));
const text = 'albretsen';
const size = 100; const tracking = -2;
let x = 0; let paths = [];
for (const ch of text) {
  const g = font.charToGlyph(ch);
  paths.push(g.getPath(x, 100, size).toPathData(2));
  x += g.advanceWidth / font.unitsPerEm * size + tracking;
}
const w = Math.ceil(x);
const wordD = paths.join('');
fs.writeFileSync(OUT + '/word-path.json', JSON.stringify({ d: wordD, w }));
const k = 77/51, markW = 56*k; // mark spans ascender (y=23) to baseline (y=100)
const total = Math.ceil(markW + 24 + w);
const word = (fillWord, fillMark, dotFill) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 14 ${total} 92" width="${total}" height="92" role="img" aria-label="Albretsen">
<g transform="translate(${(-4*k).toFixed(2)} ${(23-5*k).toFixed(2)}) scale(${k.toFixed(4)})"><path d="${lambda}" fill="${fillMark}"/><circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}" fill="${dotFill}"/></g>
<path transform="translate(${(markW + 24).toFixed(2)} 0)" d="${wordD}" fill="${fillWord}"/>
</svg>
`;
fs.writeFileSync(OUT + '/logo-wordmark.svg', word('#f8f1f8', '#dc3aec', '#36dcec'));
fs.writeFileSync(OUT + '/logo-wordmark-ink.svg', word('#160b17', '#dc3aec', '#1aa9bb'));
fs.writeFileSync(OUT + '/logo-wordmark-mono.svg', word('currentColor', 'currentColor', 'currentColor'));
fs.writeFileSync(OUT + '/logo-word-only.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 14 ${w} 92" width="${w}" height="92" role="img" aria-label="Albretsen"><path d="${wordD}" fill="currentColor"/></svg>\n`);
console.log('ok', w, total);
