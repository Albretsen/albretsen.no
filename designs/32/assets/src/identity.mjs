// Generates the Albretsen AS identity SVGs (mark, glyph, favicon, wordmarks).
// Usage: NODE_MODULES=/path/to/node_modules FONTS=/path/to/fonts node identity.mjs <outdir>
// Fonts: Bricolage Grotesque 800 + Geist Mono 500 (OFL, via fontsource), converted to outlines with opentype.js.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(process.env.NODE_MODULES + '/');
const opentype = require('opentype.js');
const OUT = process.argv[2];
const F = process.env.FONTS + '/';
const bg = opentype.loadSync(F + 'bg-800.woff'), gm = opentype.loadSync(F + 'gm-500.woff');
const C = { ink: '#050d1c', night: '#0a1936', deep: '#122a52', dusk: '#1f4274', twilight: '#406c9b', sodium: '#f68c26', ember: '#d55c13', glow: '#f9cc87', aurora: '#9ada5e', paper: '#f5eede' };

// Hand-cut "A": a paper peak whose counter is a window onto the sodium sun behind it.
const A = 'M20.5 98.2 L59.6 20.4 L100.2 97.6 L78.4 98.4 L72.3 86.1 L47.6 86.5 L41.9 98.0 Z M52.6 74.4 L60.1 59.2 L67.6 74.2 Z';
const TILE = 'M30 6.5 L90.5 7 Q113.5 7.4 113.2 30.5 L113.6 90 Q113.4 113.4 90 113.2 L30.4 113.6 Q6.6 113.3 6.8 90.2 L6.4 30.2 Q6.9 6.4 30 6.5 Z';
const glyph = (withTile, id = 'sh') => `
  ${withTile ? `<path d="${TILE}" fill="${C.night}"/>
  <clipPath id="t${id}"><path d="${TILE}"/></clipPath>
  <g clip-path="url(#t${id})" filter="url(#${id})">
    <path d="M-4 33 C18 21 34 35 56 25 S92 13 124 23 L124 28.5 C96 20 84 32 58 32.5 S22 29 -4 40 Z" fill="${C.aurora}"/>
    <path d="M-4 45 C22 37 40 45 62 39 S100 31 124 37 L124 40 C100 35 86 43 62 44 S24 42 -4 49 Z" fill="${C.aurora}" opacity=".5"/>
    <circle cx="60" cy="82" r="36" fill="${C.sodium}"/>
    <path d="M-2 88 C24 80 40 90 62 85 S98 77 124 84 L124 124 L-2 124 Z" fill="${C.deep}"/>
  </g>` : `<circle cx="60" cy="78" r="30" fill="${C.sodium}" filter="url(#${id})"/>`}
  <g filter="url(#${id})">
    <path d="${A}" fill="${C.paper}" fill-rule="evenodd"/>
    <path d="M13 98.6 C40 95.4 80 100.6 107 97.2 L107.4 104.6 C80 107 40 102.6 12.6 105.4 Z" fill="${C.dusk}"/>
  </g>`;
const defs = (id = 'sh') => `<defs><filter id="${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feDropShadow dx="1.2" dy="2.4" stdDeviation="1.3" flood-color="${C.ink}" flood-opacity=".6"/></filter></defs>`;
const svg = (vb, body, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}">${defs()}${body}</svg>\n`;

fs.writeFileSync(OUT + '/logo-mark.svg', svg('0 0 120 120', glyph(true), 'Albretsen AS'));
fs.writeFileSync(OUT + '/logo-glyph.svg', svg('0 0 120 120', glyph(false), 'Albretsen AS'));
// Favicon: same idea, simplified for 16px. No filters.
fs.writeFileSync(OUT + '/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="1" y="1" width="62" height="62" rx="15" fill="${C.night}"/><circle cx="32" cy="35" r="17.5" fill="${C.sodium}"/><path d="M7.5 55 L32 8.5 L56.5 55 L44 55 L40 47 L24 47 L20 55 Z M27.4 40 L32 30.6 L36.6 40 Z" fill="${C.paper}" fill-rule="evenodd"/></svg>\n`);

function textPath(font, str, x, y, size, ls = 0) {
  let d = '', cx = x; const gl = [...str].map(ch => font.charToGlyph(ch));
  gl.forEach((g, i) => { d += g.getPath(cx, y, size).toPathData(2); cx += g.advanceWidth * size / font.unitsPerEm + ls;
    if (i < gl.length - 1) cx += font.getKerningValue(g, gl[i + 1]) * size / font.unitsPerEm; });
  return { d, w: cx - x };
}
function wordmark(fg, file) {
  const t = textPath(bg, 'Albretsen', 140, 90, 86, -2.4);
  const tagX = 140 + t.w + 16;
  const as = textPath(gm, 'AS', tagX + 12, 77, 21, 1);
  const W = Math.ceil(tagX + as.w + 34);
  const body = `<g transform="translate(0,4)">${glyph(true)}</g>
 <path d="${t.d}" fill="${fg}"/>
 <g transform="rotate(-6 ${tagX + 22} 68)" filter="url(#sh)"><path d="M${tagX} 53.5 L${(tagX + as.w + 24.5).toFixed(1)} 52.4 L${(tagX + as.w + 25.2).toFixed(1)} 83.4 L${tagX + 0.4} 84.2 Z" fill="${C.sodium}"/><path d="${as.d}" fill="${C.ink}"/></g>`;
  fs.writeFileSync(OUT + '/' + file, svg(`0 0 ${W} 128`, body, 'Albretsen AS'));
}
wordmark(C.paper, 'wordmark.svg');
wordmark(C.night, 'wordmark-on-paper.svg');
console.log('identity ok');
