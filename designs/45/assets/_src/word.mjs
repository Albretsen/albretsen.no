import opentype from 'opentype.js';
import fs from 'fs';
const [fontPath, text, size, track, outJson] = process.argv.slice(2);
const font = opentype.loadSync(fontPath);
if (font.tables.fvar) console.log('fvar', JSON.stringify(font.tables.fvar.axes));
let x = 0; const parts = []; const S = +size; const tr = +track * S;
const glyphs = font.stringToGlyphs(text);
for (let i = 0; i < glyphs.length; i++) {
  const g = glyphs[i]; const p = g.getPath(x, 0, S); parts.push(p.toPathData(2));
  x += g.advanceWidth * S / font.unitsPerEm + tr;
  if (i < glyphs.length - 1) x += font.getKerningValue(g, glyphs[i + 1]) * S / font.unitsPerEm;
}
const bb = (() => { const p = new opentype.Path(); let xx = 0; glyphs.forEach((g, i) => { const gp = g.getPath(xx, 0, S); p.extend(gp); xx += g.advanceWidth * S / font.unitsPerEm + tr; }); return p.getBoundingBox(); })();
fs.writeFileSync(outJson, JSON.stringify({ d: parts.join(' '), width: x - tr, bb, asc: font.ascender * S / font.unitsPerEm, desc: font.descender * S / font.unitsPerEm }));
console.log('ok', x, JSON.stringify(bb));
