// Generates the identity SVGs and the icon sprite from icons/icons.js.
// Run: node designs/82/assets/src/build-identity.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { icons, iconSVG, sectorPath, STROKE } from '../icons/icons.js';

const A = join(dirname(fileURLToPath(import.meta.url)), '..');
const INK = '#0a0907', PAPER = '#f9f6f2', DAWN = '#fea91e';
mkdirSync(join(A, 'icons/svg'), { recursive: true });
mkdirSync(join(A, 'identity'), { recursive: true });

// ---- icons: individual files + sprite -------------------------------------
let sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n`;
for (const id of Object.keys(icons)) {
  writeFileSync(join(A, `icons/svg/${id}.svg`), iconSVG(id, { ink: INK, sun: DAWN }) + '\n');
  const g = icons[id], s = sectorPath(g.sun);
  sprite += `  <symbol id="qed-${id}" viewBox="0 0 24 24" fill="none">` +
    (s ? `<path d="${s}" fill="var(--qed-dawn, ${DAWN})"/>` : '') +
    `<g stroke="currentColor" stroke-width="${STROKE}" stroke-linejoin="miter">${g.strokes.map((d) => `<path d="${d}"/>`).join('')}</g></symbol>\n`;
}
sprite += `</svg>\n`;
writeFileSync(join(A, 'icons/sprite.svg'), sprite);

// ---- mark ------------------------------------------------------------------
// The mark is the "mark" glyph redrawn at display weight on a 48 grid.
const m = icons.mark;
const markInner = (ink, dawn, sw = 1.9) =>
  `<path d="${sectorPath(m.sun)}" fill="${dawn}"/>` +
  `<g stroke="${ink}" stroke-width="${sw}" stroke-linejoin="miter" stroke-miterlimit="10" fill="none">${m.strokes.map((d) => `<path d="${d}"/>`).join('')}</g>`;
const markSVG = (ink, dawn, label = 'Albretsen AS') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="240" height="240" role="img" aria-label="${label}">${markInner(ink, dawn)}</svg>\n`;
writeFileSync(join(A, 'identity/mark.svg'), markSVG(INK, DAWN));
writeFileSync(join(A, 'identity/mark-reverse.svg'), markSVG(PAPER, DAWN));
writeFileSync(join(A, 'identity/mark-mono.svg'), markSVG('currentColor', 'currentColor'));

// ---- wordmark: monoline capitals drawn on the icon grammar ------------------
// Cap height 16, stroke 1.7, Λ for A (same apex as the mark), wide futurist tracking.
const G = {
  A: { w: 12, d: 'M0 16 L6 0 L12 16' },
  L: { w: 9.5, d: 'M0.85 0 V15.15 H9.5' },
  B: { w: 10.6, d: 'M0.85 0.85 H6 A3.6 3.6 0 0 1 6 8 H0.85 M0.85 8 H6.6 A3.575 3.575 0 0 1 6.6 15.15 H0.85 M0.85 0 V16' },
  R: { w: 10.8, d: 'M0.85 16 V0.85 H6 A3.6 3.6 0 0 1 6 8 H0.85 M5.6 8 L10.6 16' },
  E: { w: 9.6, d: 'M9.6 0.85 H0.85 V15.15 H9.6 M0.85 8 H8.2' },
  T: { w: 11, d: 'M0 0.85 H11 M5.5 0.85 V16' },
  S: { w: 10.4, d: 'M10 3.2 C9.2 1.6 7.6 0.85 5.4 0.85 C2.6 0.85 1 2.2 1 4.3 C1 6.5 2.8 7.3 5.3 7.9 C8.2 8.6 9.9 9.5 9.9 11.8 C9.9 14 8 15.15 5.2 15.15 C2.8 15.15 1.1 14.2 0.3 12.5' },
  N: { w: 11, d: 'M0.85 16 V0 M1 0.4 L10 15.6 M10.15 16 V0' },
  ' ': { w: 6, d: '' },
};
const TRACK = 5.2;
function setWord(word) {
  let x = 0, out = '';
  for (const ch of word) {
    const g = G[ch];
    if (g.d) out += `<path transform="translate(${x.toFixed(2)} 0)" d="${g.d}"/>`;
    x += g.w + TRACK;
  }
  return { paths: out, width: x - TRACK };
}
const word = setWord('ALBRETSEN');
const as = setWord('AS');
const wmW = word.width + 14 + as.width;
const wordmarkSVG = (ink, dawn) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${(wmW + 2).toFixed(2)} 18" width="${Math.round((wmW + 2) * 4)}" height="72" role="img" aria-label="Albretsen AS">` +
  `<g fill="none" stroke="${ink}" stroke-width="1.7" stroke-linejoin="miter" stroke-miterlimit="10">${word.paths}</g>` +
  `<g transform="translate(${(word.width + 14).toFixed(2)} 0)" fill="none" stroke="${dawn}" stroke-width="1.7" stroke-linejoin="miter">${as.paths}</g></svg>\n`;
writeFileSync(join(A, 'identity/wordmark.svg'), wordmarkSVG(INK, '#b97500'));
writeFileSync(join(A, 'identity/wordmark-reverse.svg'), wordmarkSVG(PAPER, DAWN));

// lockup: mark + wordmark
const lockW = 22 + 9 + wmW;
writeFileSync(join(A, 'identity/lockup.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -4 ${(lockW + 2).toFixed(2)} 24" width="${Math.round((lockW + 2) * 4)}" height="96" role="img" aria-label="Albretsen AS">` +
  `<g transform="translate(-2 -4) scale(1)">${markInner(INK, DAWN, 1.9)}</g>` +
  `<g transform="translate(31 0)" fill="none" stroke="${INK}" stroke-width="1.7" stroke-linejoin="miter">${word.paths}</g>` +
  `<g transform="translate(${(31 + word.width + 14).toFixed(2)} 0)" fill="none" stroke="#b97500" stroke-width="1.7">${as.paths}</g></svg>\n`);

// ---- favicon: black tile, paper strokes, amber sun -------------------------
writeFileSync(join(A, 'identity/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${INK}"/>` +
  `<g transform="translate(3.4 3.6) scale(1.05)"><path d="${sectorPath(m.sun)}" fill="${DAWN}"/>` +
  `<g stroke="${PAPER}" stroke-width="2.3" fill="none" stroke-linejoin="miter">${m.strokes.map((d) => `<path d="${d}"/>`).join('')}</g></g></svg>\n`);
console.log('identity + icons written');
