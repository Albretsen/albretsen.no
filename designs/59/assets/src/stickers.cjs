// Generates the sticker / badge / label set as SVG with all text converted to outlines.
// Usage: node stickers.cjs <opentype.js> <fontsDir> <outDir>
const fs = require('fs')
const path = require('path')
const [, , otPath, fontsDir, outDir] = process.argv
const opentype = require(otPath)
const load = (f) => opentype.parse(fs.readFileSync(path.join(fontsDir, f)).buffer)
const F = {
  serif: load('InstrumentSerif.ttf'),
  italic: load('InstrumentSerifItalic.ttf'),
  wide: load('ArchivoXBlack.ttf'),
  wideB: load('ArchivoXBold.ttf'),
  mono: load('JBMonoBold.ttf'),
}
const C = {
  ink: '#0f0b22', paper: '#f3f2fb', pulp: '#e0dff0', violet: '#6c35ec', glow: '#bab0ff',
  lime: '#cefd3e', tangerine: '#ff6f27', cyan: '#2debf9', rose: '#fd54ad', citrine: '#ffdc3a',
}
fs.mkdirSync(outDir, { recursive: true })

function bbox(font, str, size, ls = 0) {
  return font.getPath(str, 0, 0, size, { kerning: true, letterSpacing: ls }).getBoundingBox()
}
// text centred on (cx, cy) by its ink box; fit to maxW if given
function T(font, str, size, cx, cy, fill, { ls = 0, maxW = Infinity } = {}) {
  let b = bbox(font, str, size, ls)
  if (b.x2 - b.x1 > maxW) { size *= maxW / (b.x2 - b.x1); b = bbox(font, str, size, ls) }
  const x = cx - (b.x1 + b.x2) / 2, y = cy - (b.y1 + b.y2) / 2
  const d = font.getPath(str, x, y, size, { kerning: true, letterSpacing: ls }).toPathData(2)
  return `<path d="${d}" fill="${fill}"/>`
}
// text set on a circle, centred at the top, reading clockwise
function circleText(font, str, size, cx, cy, r, fill, ls = 0.12) {
  const glyphs = font.stringToGlyphs(str)
  const scale = size / font.unitsPerEm
  const adv = glyphs.map((g) => g.advanceWidth * scale + ls * size)
  const total = adv.reduce((a, b) => a + b, 0)
  let a0 = -Math.PI / 2 - total / r / 2
  let out = ''
  glyphs.forEach((g, i) => {
    const mid = a0 + adv[i] / 2 / r
    const p = g.getPath(-g.advanceWidth * scale / 2, 0, size)
    const x = cx + Math.cos(mid) * r, y = cy + Math.sin(mid) * r
    out += `<path d="${p.toPathData(2)}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${((mid + Math.PI / 2) * 180 / Math.PI).toFixed(2)})" fill="${fill}"/>`
    a0 += adv[i] / r
  })
  return out
}
function burst(cx, cy, n, r1, r2, wobble = 0) {
  let d = ''
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 ? r2 : r1 + (wobble ? Math.sin(i * 1.7) * wobble : 0)
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(2) + ' ' + (cy + Math.sin(a) * r).toFixed(2)
  }
  return d + 'Z'
}
function svg(name, w, h, body, title) {
  fs.writeFileSync(path.join(outDir, name + '.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">\n<title>${title}</title>\n${body}\n</svg>\n`)
}
const SH = 6 // hard shadow offset
const S = 4 // outline

// 1. Starburst: Fun Libs installs
{
  const d = burst(150, 150, 18, 140, 112)
  svg('burst-installs', 310, 310, `
<path d="${d}" transform="translate(${SH} ${SH})" fill="${C.ink}"/>
<path d="${d}" fill="${C.lime}" stroke="${C.ink}" stroke-width="${S}" stroke-linejoin="round"/>
${T(F.wide, '113,000+', 46, 150, 140, C.ink, { maxW: 190 })}
${T(F.mono, 'INSTALLS · FUN LIBS', 13, 150, 186, C.ink, { ls: 0.08 })}`, 'Fun Libs: 113,000+ installs')
}
// 2. Seal: MCP Emails MRR with circular text
{
  svg('seal-mrr', 312, 312, `
<circle cx="156" cy="156" r="148" transform="translate(${SH} ${SH})" fill="${C.ink}"/>
<circle cx="150" cy="150" r="146" fill="${C.violet}" stroke="${C.ink}" stroke-width="${S}"/>
<circle cx="150" cy="150" r="96" fill="none" stroke="${C.paper}" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>
${circleText(F.wideB, 'MCP EMAILS · EMAIL FOR AI AGENTS ·', 17, 150, 150, 118, C.paper, 0.14)}
${T(F.serif, '$782', 92, 150, 140, C.paper)}
${T(F.mono, 'MRR', 18, 150, 196, C.lime, { ls: 0.3 })}`, 'MCP Emails: $782 MRR')
}
// 3. Label: 17 tools
{
  svg('label-tools', 300, 120, `
<rect x="${4 + SH}" y="${4 + SH}" width="286" height="104" rx="10" fill="${C.ink}"/>
<rect x="4" y="4" width="286" height="104" rx="10" fill="${C.tangerine}" stroke="${C.ink}" stroke-width="${S}"/>
<line x1="88" y1="4" x2="88" y2="108" stroke="${C.ink}" stroke-width="${S}" stroke-dasharray="8 7"/>
${T(F.wide, '17', 42, 47, 56, C.ink)}
${T(F.wide, 'TOOLS', 34, 188, 50, C.ink)}
${T(F.mono, 'MCP EMAILS', 13, 188, 84, C.ink, { ls: 0.18 })}`, 'MCP Emails: 17 tools')
}
// 4. Pill: AGPL
{
  svg('pill-agpl', 330, 84, `
<rect x="${4 + SH}" y="${4 + SH}" width="316" height="70" rx="35" fill="${C.ink}"/>
<rect x="4" y="4" width="316" height="70" rx="35" fill="${C.cyan}" stroke="${C.ink}" stroke-width="${S}"/>
<circle cx="40" cy="39" r="12" fill="${C.ink}"/>
<circle cx="40" cy="39" r="5" fill="${C.cyan}"/>
${T(F.wide, 'OPEN SOURCE', 20, 182, 33, C.ink)}
${T(F.mono, 'AGPL · MCP EMAILS', 12, 182, 56, C.ink, { ls: 0.16 })}`, 'MCP Emails is open source under the AGPL')
}
// 5. Tape: built at 17
{
  const torn = (x, dir) => { let d = ''; for (let i = 0; i <= 8; i++) d += `L${x + (i % 2 ? 7 * dir : 0)} ${8 + i * 10}`; return d }
  const d = `M14 8 L346 8 ${torn(346, 1).replace(/^L346 8/, '')} L14 88 ${torn(14, -1).split('L').reverse().filter(Boolean).map((p) => 'L' + p).join('')}Z`
  svg('tape-built-at-17', 370, 100, `
<g transform="rotate(-2 185 50)">
<path d="${d}" fill="${C.rose}" opacity=".94"/>
<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
${T(F.italic, 'built at seventeen.', 46, 180, 46, C.ink)}
<line x1="40" y1="22" x2="320" y2="22" stroke="${C.ink}" stroke-width="1" opacity=".25"/>
<line x1="40" y1="74" x2="320" y2="74" stroke="${C.ink}" stroke-width="1" opacity=".25"/>
</g>`, 'Fun Libs was built at 17')
}
// 6. Stamp: on Google Play since 2016
{
  svg('stamp-since-2016', 300, 300, `
<circle cx="150" cy="150" r="142" fill="${C.ink}"/>
<circle cx="150" cy="150" r="132" fill="none" stroke="${C.glow}" stroke-width="1.5"/>
<circle cx="150" cy="150" r="82" fill="none" stroke="${C.glow}" stroke-width="1.5"/>
${circleText(F.wideB, 'ON GOOGLE PLAY · SINCE 2016 ·', 18, 150, 150, 102, C.paper, 0.2)}
<path d="${burst(150, 104, 4, 3, 12)}" fill="${C.lime}"/>
${T(F.serif, '2016', 64, 150, 152, C.paper)}
${T(F.mono, 'ANDROID', 11, 150, 194, C.glow, { ls: 0.4 })}`, 'Published on Google Play since 2016')
}
// 7. Label: Norway
{
  svg('label-norway', 240, 92, `
<rect x="${4 + SH}" y="${4 + SH}" width="226" height="76" rx="4" fill="${C.ink}"/>
<rect x="4" y="4" width="226" height="76" rx="4" fill="${C.citrine}" stroke="${C.ink}" stroke-width="${S}"/>
${T(F.mono, 'MADE IN', 13, 117, 26, C.ink, { ls: 0.4 })}
${T(F.wide, 'NORWAY', 32, 117, 56, C.ink)}`, 'Made in Norway')
}
// 8. Status badges
const status = [
  ['live', 'LIVE', C.lime], ['building', 'BUILDING', C.cyan], ['paused', 'PAUSED', C.citrine], ['retired', 'RETIRED', C.pulp],
]
for (const [id, label, fill] of status) {
  const w = 40 + bbox(F.wide, label, 20).x2 + 40
  svg('status-' + id, Math.ceil(w + 14), 60, `
<rect x="${4 + 4}" y="${4 + 4}" width="${w}" height="44" rx="22" fill="${C.ink}"/>
<rect x="4" y="4" width="${w}" height="44" rx="22" fill="${fill}" stroke="${C.ink}" stroke-width="3.5"/>
<circle cx="30" cy="26" r="7" fill="${C.ink}"/>${id === 'live' ? `<circle cx="30" cy="26" r="3" fill="${C.lime}"/>` : ''}
${T(F.wide, label, 20, 30 + (w - 30) / 2 - 2, 26, C.ink)}`, 'Status: ' + label.toLowerCase())
}
// 9. Barcode (decorative; encodes nothing)
{
  let bars = '', x = 18
  const seed = [0, 1, 1, 3, 8, 0, 5, 9, 2, 0, 1, 6, 2, 0, 2, 6, 4, 7, 1, 3, 8, 0, 5, 9, 2, 6, 0, 1, 7, 3]
  seed.forEach((s, i) => { const w = 1.5 + (s % 4) * 1.4; bars += `<rect x="${x.toFixed(1)}" y="16" width="${w.toFixed(1)}" height="${i % 9 === 0 ? 112 : 100}" fill="${C.ink}"/>`; x += w + 1.6 + ((s * 7) % 3) })
  svg('barcode', Math.ceil(x + 18), 176, `
<rect x="2" y="2" width="${Math.ceil(x + 14)}" height="172" fill="${C.paper}" stroke="${C.ink}" stroke-width="3"/>
${bars}
${T(F.mono, 'ALBRETSEN.NO', 15, (x + 18) / 2, 146, C.ink, { ls: 0.2 })}
${T(F.mono, '2016 — 2026', 11, (x + 18) / 2, 162, C.ink, { ls: 0.3 })}`, 'Decorative barcode: albretsen.no')
}
// 10. Peel-to-open corner sticker
{
  svg('sticker-open', 220, 220, `
<path d="M10 10 H210 V120 Q170 100 120 120 Q100 170 120 210 H10Z" transform="translate(${SH} ${SH})" fill="${C.ink}"/>
<path d="M10 10 H210 V120 Q170 100 120 120 Q100 170 120 210 H10Z" fill="${C.violet}" stroke="${C.ink}" stroke-width="${S}" stroke-linejoin="round"/>
<path d="M210 120 Q170 100 120 120 Q100 170 120 210 Q150 160 210 120Z" fill="${C.lime}" stroke="${C.ink}" stroke-width="${S}" stroke-linejoin="round"/>
${T(F.italic, 'Open', 58, 74, 62, C.paper)}
${T(F.mono, 'THE COVER', 13, 74, 104, C.lime, { ls: 0.25 })}
<path d="M38 150 H84 M70 136 L86 150 L70 164" fill="none" stroke="${C.paper}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`, 'Open the cover')
}
// 11. Spark-word labels
const words = [['glow', C.glow], ['crystal', C.cyan], ['rhythm', C.rose]]
for (const [wd, fill] of words) {
  const w = bbox(F.italic, wd, 48).x2 + 60
  svg('word-' + wd, Math.ceil(w + 14), 86, `
<rect x="${4 + SH}" y="${4 + SH}" width="${w}" height="70" fill="${C.ink}"/>
<rect x="4" y="4" width="${w}" height="70" fill="${fill}" stroke="${C.ink}" stroke-width="${S}"/>
${T(F.italic, wd, 48, 4 + w / 2, 39, C.ink)}`, wd)
}
// 12. Retired-product stand-ins: circular "back issue" tokens with monogram + year
const retired = [
  ['polyglot-pilot', 'Pp', 'POLYGLOT PILOT · 2025 ·', C.cyan],
  ['pinpoint', 'Pi', 'PINPOINT · 2025 ·', C.rose],
  ['webvakt', 'Wv', 'WEBVAKT · 2024 ·', C.citrine],
  ['joke-central', 'Jc', 'JOKE CENTRAL · 2024 ·', C.tangerine],
  ['tryggere-hyring', 'Th', 'TRYGGERE HYRING · 2023 ·', C.glow],
  ['early-apps', 'Ea', 'EARLY APPS · 2021 ·', C.lime],
]
for (const [id, mono, ring, fill] of retired) {
  svg('retired-' + id, 220, 220, `
<circle cx="${110 + 5}" cy="${110 + 5}" r="100" fill="${C.ink}"/>
<circle cx="110" cy="110" r="100" fill="${C.paper}" stroke="${C.ink}" stroke-width="${S}"/>
<circle cx="110" cy="110" r="58" fill="${fill}" stroke="${C.ink}" stroke-width="3"/>
${circleText(F.wideB, ring, 13, 110, 110, 76, C.ink, 0.16)}
${T(F.italic, mono, 60, 110, 106, C.ink)}`, 'Retired product: ' + id)
}
console.log('stickers ok')
