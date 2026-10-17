// Build the S&P chart assets.  Usage: node site/charts/spx/build-data.ts <outDir> [assetBase]
// Writes spx.json (compact data + copy), spx-fallback.svg (16:10), spx-fallback-4x3.svg (phones)
// and spx-shell.{en,nb}.html (server-rendered markup to embed; mountSpxChart replaces it in place).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as S from '../../../articles/stop-caring-about-all-time-highs/chart/spx.ts'
import { analyse, decode, endYear, geom, gridMarkup, idxOfYear, linePath, dotsPath, shellHTML, statText } from './chart.js'

const here = dirname(fileURLToPath(import.meta.url))
const art = join(here, '../../../articles/stop-caring-about-all-time-highs/chart')
const outDir = process.argv[2]
const base = process.argv[3] ?? ''
if (!outDir) { console.error('usage: node build-data.ts <outDir> [assetBase]'); process.exit(1) }
const copy = { en: JSON.parse(readFileSync(join(art, 'copy.en.json'), 'utf8')), nb: JSON.parse(readFileSync(join(art, 'copy.nb.json'), 'utf8')) }

// Each series is stored as deltas of round(ln(v) * k): monthly moves are small integers, so the JSON
// stays tiny. k is the smallest step that keeps every record, for every start year, identical.
const src: Record<string, number[]> = { nominal: S.SPX_NOMINAL, real: S.SPX_REAL, tr: S.SPX_TOTAL_RETURN }
const sameRecords = (x: number[], y: number[]) => {
  for (let yr = S.SPX_START_YEAR; yr <= S.SPX_END_YEAR - 5; yr++) {
    const s = S.spxIndexOfYear(yr)
    if (analyse(x, s).rec.join() !== analyse(y, s).rec.join()) return false
  }
  return true
}
let raw: any
for (const k of [5000, 10000, 20000, 50000, 100000]) {
  const d: Record<string, number[]> = {}
  for (const key in src) { const q = src[key].map(v => Math.round(Math.log(v) * k)); d[key] = q.map((v, i) => (i ? v - q[i - 1] : v)) }
  raw = { y0: S.SPX_START_YEAR, m0: S.SPX_START_MONTH, k, d, copy }
  const D = decode(raw)
  if (Object.keys(src).every(key => sameRecords(src[key], D.s[key]))) { console.log(`k = ${k}`); break }
}
mkdirSync(outDir, { recursive: true })
const json = JSON.stringify(raw)
writeFileSync(join(outDir, 'spx.json'), json)

// Static fallback: full total-return series, log axis, record dots. Same box as the live plot.
const D = decode(raw)
const C = { paper: '#F5EBDC', ink: '#2E2240', terra: '#C2603E', lav: '#A99BD1', lavDeep: '#6E5A8E' }
// Integer, relative path commands keep the static SVG small; rounding error never accumulates.
function rel(pts: [number, number][], dot = false) {
  let p = '', px = 0, py = 0
  for (const [x0, y0] of pts) {
    const x = Math.round(x0), y = Math.round(y0)
    p += dot || !p ? (p ? 'm' : 'M') + (p ? x - px : x) + ',' + (p ? y - py : y) + (dot ? 'h0' : '') : 'l' + (x - px) + ',' + (y - py)
    px = x; py = y
  }
  return p.replace(/,-/g, '-')
}
function fallback(W: number, H: number, fs: number) {
  const a = D.s.nominal, G = geom(D, a, 0, 'lin', W, H, fs, 'en'), A = analyse(a, 0)
  const ys = a.map(v => G.Y(v)), k = fs / 11
  const line = rel(ys.map((y, i) => [G.X(i), y] as [number, number]))
  const dots = rel(A.rec.map(i => [G.X(i), ys[i]] as [number, number]), true)
  const r = Math.max(1.6 * k, Math.min(3 * k, (G.pw / D.n) * 0.9))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${copy.en.a11y.replace(/&/g, '&amp;')}">
<style>.spx-gl{stroke:${C.ink};stroke-opacity:.12;stroke-width:${k}}.spx-xk{stroke:${C.ink};stroke-opacity:.4;stroke-width:${k}}text{font:${fs}px "DM Mono",ui-monospace,Menlo,monospace;fill:${C.lavDeep}}</style>
<rect width="${W}" height="${H}" fill="${C.paper}"/>
<g>${gridMarkup(G, fs).replace(/\.0"/g, '"')}</g>
<line x1="${G.ml}" x2="${G.ml + G.pw}" y1="${G.base}" y2="${G.base}" stroke="${C.ink}" stroke-opacity=".45" stroke-width="${k}"/>
<path d="${line}V${G.base}H${G.ml}Z" fill="${C.lav}" fill-opacity=".22"/>
<path d="${line}" fill="none" stroke="${C.ink}" stroke-width="${(1.6 * k).toFixed(1)}" stroke-linejoin="round"/>
<path d="${dots}" stroke="${C.terra}" stroke-width="${(2 * r).toFixed(1)}" stroke-linecap="round"/>
</svg>`
}
writeFileSync(join(outDir, 'spx-fallback.svg'), fallback(1600, 900, 18))
writeFileSync(join(outDir, 'spx-fallback-4x3.svg'), fallback(800, 600, 23))

// Server-rendered shell describing what the fallback shows (total return, log, from 1871), so the stats and
// pressed buttons match the picture. On mount the live chart takes over in its default view in the same box.
for (const lang of ['en', 'nb'] as const) {
  const st = { series: 'nominal', scale: 'lin', start: D.y0, y0: D.y0, yMax: endYear(D) - 5 }
  const s0 = idxOfYear(D, D.y0), text = statText(lang, analyse(D.s.tr, s0), D, D.s.tr, s0)
  const pic = `<picture class="spx-fb"><source media="(max-width: 540px)" srcset="${base}spx-fallback-4x3.svg"><img src="${base}spx-fallback.svg" width="1600" height="900" alt="${copy[lang].a11y}"></picture>`
  writeFileSync(join(outDir, `spx-shell.${lang}.html`), shellHTML(copy[lang], lang, { ...st, text }, pic) + '\n')
}
console.log(`spx.json ${(json.length / 1024).toFixed(1)} KB`)
