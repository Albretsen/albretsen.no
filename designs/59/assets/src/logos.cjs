// Generates the identity SVGs with glyphs converted to outlines (no font dependency).
// Usage: node logos.cjs <opentype.js> <fontsDir> <outDir>
const fs = require('fs')
const path = require('path')
const [, , otPath, fontsDir, outDir] = process.argv
const opentype = require(otPath)
const load = (f) => opentype.parse(fs.readFileSync(path.join(fontsDir, f)).buffer)
const serif = load('InstrumentSerif.ttf')
const wide = load('ArchivoXBlack.ttf')
const mono = load('JBMonoBold.ttf')

const C = { ink: '#0f0b22', paper: '#f3f2fb', violet: '#6c35ec', lime: '#cefd3e', glow: '#bab0ff' }

function textPath(font, str, size, x, y, opts = {}) {
  const p = font.getPath(str, x, y, size, { kerning: true, letterSpacing: opts.ls || 0 })
  return p.toPathData(2)
}
function measure(font, str, size, ls = 0) {
  const p = font.getPath(str, 0, 0, size, { kerning: true, letterSpacing: ls })
  const b = p.getBoundingBox()
  return b
}
function centered(font, str, size, cx, cy, ls = 0) {
  const b = measure(font, str, size, ls)
  const x = cx - (b.x1 + b.x2) / 2, y = cy - (b.y1 + b.y2) / 2
  return textPath(font, str, size, x, y, { ls })
}

// ---- Mark: a violet sticker whose top-right corner peels back (the cover opens) ----
// Body with the corner cut along y = x - 36 (from (40,4) to (60,24)).
const body = 'M14 4H34Q54 8 60 28V50Q60 60 50 60H14Q4 60 4 50V14Q4 4 14 4Z'
const flap = 'M34 4Q54 8 60 28Q50 33 40 34Q35 20 34 4Z'
const flapShade = 'M60 28Q50 33 40 34Q43 38 52 37Q58 34 60 28Z'
const A = centered(wide, 'A', 32, 26, 38)

function mark({ shadow = true, stroke = 3 } = {}) {
  return `
  ${shadow ? `<path d="${body}" transform="translate(3.5 3.5)" fill="${C.ink}"/>` : ''}
  <path d="${body}" fill="${C.violet}" stroke="${C.ink}" stroke-width="${stroke}" stroke-linejoin="round"/>
  <path d="${A}" fill="${C.paper}"/>
  <path d="${flapShade}" fill="${C.ink}" opacity=".35"/>
  <path d="${flap}" fill="${C.lime}" stroke="${C.ink}" stroke-width="${stroke}" stroke-linejoin="round"/>
  <path d="M38.5 9Q41 22 44 29" stroke="${C.ink}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".28"/>`
}

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 68" width="68" height="68" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS mark</title>${mark()}
</svg>
`
fs.writeFileSync(path.join(outDir, 'logo-mark.svg'), markSvg)

// Favicon: no offset shadow (reads cleaner at 16px), thicker stroke.
const favSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <title>Albretsen AS</title>
  <path d="${body}" fill="${C.violet}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
  <path d="${centered(wide, 'A', 34, 26, 39)}" fill="${C.paper}"/>
  <path d="${flap}" fill="${C.lime}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
</svg>
`
fs.writeFileSync(path.join(outDir, 'favicon.svg'), favSvg)

// Apple touch: full-bleed paper with the mark centred.
const touchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect width="180" height="180" fill="${C.paper}"/>
  <g transform="translate(34 34) scale(1.62)">${mark()}</g>
</svg>
`
fs.writeFileSync(path.join(outDir, 'apple-touch.svg'), touchSvg)

// ---- Wordmark: mark + "Albretsen" in Instrument Serif + an "AS" label sticker ----
const wSize = 64
const wb = measure(serif, 'Albretsen', wSize, 0)
const wx = 92, wy = 58
const word = textPath(serif, 'Albretsen', wSize, wx, wy)
const endX = wx + wb.x2
const asW = 46, asH = 26, asX = endX + 12, asY = 14
const asText = centered(wide, 'AS', 15, asX + asW / 2, asY + asH / 2 + 0.5, 0.02)
const totalW = Math.ceil(asX + asW + 8)
function wordmark(fg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} 76" width="${totalW}" height="76" role="img" aria-label="Albretsen AS">
  <title>Albretsen AS</title>
  <g transform="translate(2 4)">${mark()}</g>
  <path d="${word}" fill="${fg}"/>
  <g transform="rotate(-7 ${asX + asW / 2} ${asY + asH / 2})">
    <rect x="${asX + 2.5}" y="${asY + 2.5}" width="${asW}" height="${asH}" rx="3" fill="${C.ink}"/>
    <rect x="${asX}" y="${asY}" width="${asW}" height="${asH}" rx="3" fill="${C.lime}" stroke="${C.ink}" stroke-width="2.4"/>
    <path d="${asText}" fill="${C.ink}"/>
  </g>
</svg>
`
}
fs.writeFileSync(path.join(outDir, 'logo-wordmark.svg'), wordmark(C.ink))
fs.writeFileSync(path.join(outDir, 'logo-wordmark-on-dark.svg'), wordmark(C.paper))

// ---- Masthead: the cover nameplate, all outlines, for the hero and OG ----
const mSize = 300
const mb = measure(serif, 'Albretsen', mSize, -0.02)
const mW = Math.ceil(mb.x2 - mb.x1 + 20), mH = Math.ceil(mb.y2 - mb.y1 + 20)
const mast = textPath(serif, 'Albretsen', mSize, 10 - mb.x1, 10 - mb.y1, { ls: -0.02 })
fs.writeFileSync(path.join(outDir, 'masthead.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${mW} ${mH}" width="${mW}" height="${mH}" role="img" aria-label="Albretsen">
  <title>Albretsen masthead</title>
  <path d="${mast}" fill="currentColor"/>
</svg>
`)
console.log('ok', { totalW, mW, mH })
