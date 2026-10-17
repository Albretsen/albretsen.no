// Retired-product stand-ins: "decommissioned satellite" patches. node standins.mjs OUTDIR
import { writeFileSync, mkdirSync } from 'node:fs'
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true })
const B = '#F34046'
const frame = (rot) => `
  <circle cx="80" cy="80" r="74" fill="none" stroke="currentColor" stroke-width="2.5"/>
  <ellipse cx="80" cy="80" rx="74" ry="22" fill="none" stroke="${B}" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round" transform="rotate(${rot} 80 80)"/>
  <circle cx="${80 + 74 * Math.cos(rot * Math.PI / 180)}" cy="${80 + 74 * Math.sin(rot * Math.PI / 180)}" r="4.5" fill="${B}"/>`
const S = 'fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="miter" stroke-linecap="butt"'
const glyphs = {
  // two offset brackets: one string, many languages
  'polyglot-pilot': [-18, `<path d="M56 50 H42 V110 H56" ${S}/><path d="M104 50 H118 V110 H104" ${S}/><path d="M58 68 H98 M88 58 L99 68 L88 78" ${S}/><path d="M102 92 H62 M72 82 L61 92 L72 102" stroke="${B}" stroke-width="7" fill="none"/>`],
  // a pin dropped into a crater
  'pinpoint': [24, `<ellipse cx="80" cy="108" rx="30" ry="9" ${S.replace('7', '4')}/><path d="M80 106 V74" stroke="${B}" stroke-width="7"/><circle cx="80" cy="60" r="16" ${S}/>`],
  // watching a page for change: a frame and a sweep
  'webvakt': [-40, `<rect x="44" y="50" width="72" height="60" ${S}/><path d="M44 66 H116" ${S.replace('7', '4')}/><path d="M60 92 L74 80 L88 96 L100 86" stroke="${B}" stroke-width="6" fill="none"/>`],
  // a crescent grin
  'joke-central': [8, `<path d="M48 78 A32 32 0 0 0 112 78" ${S}/><path d="M56 78 A24 18 0 0 0 104 78" fill="${B}"/><path d="M58 58 V66 M102 58 V66" ${S}/>`],
  // a shield with a check
  'tryggere-hyring': [-62, `<path d="M80 42 L114 54 V80 C114 100 98 112 80 120 C62 112 46 100 46 80 V54 Z" ${S}/><path d="M64 80 L76 92 L98 68" stroke="${B}" stroke-width="7" fill="none"/>`],
  // percent: the early calculators
  'early-apps': [48, `<circle cx="60" cy="60" r="11" ${S}/><circle cx="100" cy="100" r="11" ${S}/><path d="M108 48 L52 112" stroke="${B}" stroke-width="7"/>`],
}
for (const [id, [rot, g]] of Object.entries(glyphs)) {
  writeFileSync(`${OUT}/retired-${id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${id} (retired) stand-in" color="#070707">${frame(rot)}\n  ${g}\n</svg>\n`)
}
console.log('ok')
