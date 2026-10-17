// Generates the identity SVGs for design 43 ("Dawn Edition").
// Run: NODE_PATH=<dir with opentype.js> node identity.mjs <fontsDir> <outDir>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(process.env.NODE_PATH + '/');
const opentype = require('opentype.js');
const [fontsDir, out] = process.argv.slice(2);
const serif = opentype.loadSync(path.join(fontsDir, 'InstrumentSerif-Regular.ttf'));
const serifIt = opentype.loadSync(path.join(fontsDir, 'InstrumentSerif-Italic.ttf'));
const sans = opentype.loadSync(path.join(fontsDir, 'Geist.ttf'));

const C = { paper:'#f6fbfc', mist:'#e2f4f6', sky:'#b5e5ea', lagoon:'#6ab9c7', deep:'#32728a', ink:'#182933', dawn:'#fbd1b6', blush:'#f6cbd0', lilac:'#d0cded', spark:'#f8e18a' };

// ---- The facet A -------------------------------------------------------
const V = { T:[32,4], L:[4,60], R:[60,60], N:[32,42], NL:[19.5,60], NR:[44.5,60], C1:[32,21], C2:[26.2,33.5], C3:[37.8,33.5], ML:[17.6,33.5], MR:[46.4,33.5] };
// light from the upper right: right-hand facets are brighter
const facets = [
  ['T','C1','C2', 'f2'], ['T','C2','ML', 'f1'],
  ['T','MR','C3', 'f4'], ['T','C3','C1', 'f3'],
  ['ML','C2','N', 'f2'], ['ML','N','NL', 'f1'], ['ML','NL','L', 'f0'],
  ['MR','N','C3', 'f3'], ['MR','NR','N', 'f4'], ['MR','R','NR', 'f5'],
  ['C2','C3','N', 'sun'],
];
const tone = {
  full: { f0:'#2c5f74', f1:C.deep, f2:'#4a8ea3', f3:C.lagoon, f4:'#8fd0da', f5:C.sky, sun:'url(#dawn)' },
  light:{ f0:'#9ccdd6', f1:C.sky, f2:'#c8eef1', f3:C.lilac, f4:C.mist, f5:'#ffffff', sun:'url(#dawn)' },
};
const p = k => V[k].join(',');
function aFacets(set, stroke) {
  return facets.map(([a,b,c,t]) => `<polygon points="${p(a)} ${p(b)} ${p(c)}" fill="${tone[set][t]}"${stroke?` stroke="${tone[set][t]}" stroke-width="0.35" stroke-linejoin="round"`:''}/>`).join('\n    ');
}
const dawnGrad = `<linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.spark}"/><stop offset="1" stop-color="${C.dawn}"/></linearGradient>`;
// small four-point spark, upper right of the apex
const spark = (x,y,r,fill) => `<path d="M${x} ${y-r} Q${x+r*0.18} ${y-r*0.18} ${x+r} ${y} Q${x+r*0.18} ${y+r*0.18} ${x} ${y+r} Q${x-r*0.18} ${y+r*0.18} ${x-r} ${y} Q${x-r*0.18} ${y-r*0.18} ${x} ${y-r}Z" fill="${fill}"/>`;

function markSVG(set='full', size=64, withSpark=true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="Albretsen AS">
  <defs>${dawnGrad}</defs>
  <g>
    ${aFacets(set, true)}
  </g>
  ${withSpark ? spark(52.5, 11.5, 5.2, set==='full' ? '#efc65a' : C.spark) : ''}
</svg>
`;
}
const monoA = (fill) => {
  // single-colour: the A silhouette with the sunrise triangle knocked out as a gap
  const outer = `M${p('T')} L${p('R')} L${p('NR')} L${p('N')} L${p('NL')} L${p('L')} Z`;
  const counter = `M${p('C1')} L${p('C3')} L${p('C2')} Z`;
  const sun = `M${V.C2[0]+1.6},${V.C2[1]+1.2} L${V.C3[0]-1.6},${V.C3[1]+1.2} L${V.N[0]},${V.N[1]-2.4} Z`;
  return `<path fill-rule="evenodd" d="${outer} ${counter} ${sun}" fill="${fill}"/>`;
};

// ---- Text to path ----------------------------------------------------------
function textPath(font, text, x, y, size, opts = {}) {
  const tracking = opts.tracking || 0; // em
  let cx = x; const parts = [];
  const glyphs = font.stringToGlyphs(text);
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    parts.push(g.getPath(cx, y, size).toPathData(2));
    let adv = g.advanceWidth * size / font.unitsPerEm;
    if (i < glyphs.length - 1) adv += font.getKerningValue(g, glyphs[i+1]) * size / font.unitsPerEm;
    cx += adv + tracking * size;
  }
  return { d: parts.join(''), width: cx - x - tracking * size };
}

// ---- Files -----------------------------------------------------------------
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'mark.svg'), markSVG('full'));
fs.writeFileSync(path.join(out, 'mark-light.svg'), markSVG('light'));
fs.writeFileSync(path.join(out, 'mark-mono.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Albretsen AS">\n  ${monoA('currentColor')}\n  ${spark(52.5,11.5,5.2,'currentColor')}\n</svg>\n`);

// favicon: mark on a pale rounded tile
fs.writeFileSync(path.join(out, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>${dawnGrad}<linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.paper}"/><stop offset="1" stop-color="${C.mist}"/></linearGradient></defs>
  <rect width="64" height="64" rx="14" fill="url(#tile)"/>
  <g transform="translate(6.5 7.5) scale(0.8)">
    ${aFacets('full', true)}
  </g>
  ${spark(52, 12, 4.6, '#f2c84b')}
</svg>
`);

// wordmark: mark + "Albretsen" (Instrument Serif) + "AS" (Geist, tracked)
{
  const W = textPath(serif, 'Albretsen', 84, 58, 64, { tracking: -0.01 });
  const as = textPath(sans, 'AS', 84 + W.width + 14, 58, 17, { tracking: 0.16 });
  const width = Math.ceil(84 + W.width + 14 + as.width + 8);
  fs.writeFileSync(path.join(out, 'wordmark.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 76" width="${width}" height="76" role="img" aria-label="Albretsen AS">
  <defs>${dawnGrad}</defs>
  <g transform="translate(2 4) scale(1.06)">
    ${aFacets('full', true)}
  </g>
  ${spark(58, 14, 5.4, '#efc65a')}
  <path d="${W.d}" fill="${C.ink}"/>
  <path d="${as.d}" fill="${C.deep}"/>
</svg>
`);
  fs.writeFileSync(path.join(out, 'wordmark-mono.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 76" width="${width}" height="76" role="img" aria-label="Albretsen AS">
  <g transform="translate(2 4) scale(1.06)">${monoA('currentColor')}</g>
  ${spark(58, 14, 5.4, 'currentColor')}
  <path d="${W.d}" fill="currentColor"/>
  <path d="${as.d}" fill="currentColor" opacity="0.7"/>
</svg>
`);
}

// masthead: newspaper nameplate for the front page of the future
{
  const width = 1200;
  const title = textPath(serif, 'The Albretsen Dawn', 0, 0, 120, { tracking: -0.015 });
  const tx = (width - title.width) / 2;
  const T2 = textPath(serif, 'The Albretsen Dawn', tx, 158, 120, { tracking: -0.015 });
  const left = textPath(sans, 'ALBRETSEN AS  ·  NORWAY', 0, 40, 13, { tracking: 0.22 });
  const right = textPath(sans, 'PRINTED IN TRIANGLES', 0, 0, 13, { tracking: 0.22 });
  const R = textPath(sans, 'PRINTED IN TRIANGLES', width - right.width, 40, 13, { tracking: 0.22 });
  const motto = textPath(serifIt, 'All the software that pays for itself', 0, 0, 26);
  const M = textPath(serifIt, 'All the software that pays for itself', (width - motto.width)/2, 226, 26);
  fs.writeFileSync(path.join(out, 'masthead.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 246" width="${width}" height="246" role="img" aria-label="The Albretsen Dawn">
  <defs>${dawnGrad}</defs>
  <path d="${left.d}" fill="${C.deep}"/>
  <path d="${R.d}" fill="${C.deep}"/>
  <g transform="translate(${width/2 - 22} 6) scale(0.69)">${aFacets('full', true)}</g>
  <rect x="0" y="58" width="${width}" height="1.5" fill="${C.ink}" opacity="0.85"/>
  <path d="${T2.d}" fill="${C.ink}"/>
  <rect x="0" y="184" width="${width}" height="1" fill="${C.ink}" opacity="0.5"/>
  <rect x="0" y="188" width="${width}" height="3" fill="${C.ink}" opacity="0.85"/>
  <path d="${M.d}" fill="${C.deep}"/>
</svg>
`);
}
console.log('ok');
