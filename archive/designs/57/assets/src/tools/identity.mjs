// Generates the Escape Vector identity SVGs. node identity.mjs OUTDIR
import { writeFileSync, mkdirSync } from 'node:fs'
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true })
const INK = '#070707', BURN = '#F34046', PAPER = '#F9F6F5'

// ---------- mark: a vector capital A whose tip has come loose and floats ----------
const f = (n) => +n.toFixed(2)
// Lambda geometry: apex (ax, top), base y = base, half-width hw, horizontal stroke wh
function lambda({ ax, top, base, hw, wh, tipEnd, bodyStart, tipLift = 0, tipRot = 0 }) {
  const k = hw / (base - top)
  const xl = (y) => ax - (y - top) * k, xr = (y) => ax + (y - top) * k
  const yi = top + wh / k
  const tip = [[ax, top], [xr(tipEnd), tipEnd], [xl(tipEnd), tipEnd]]
  const body = [[xl(bodyStart), bodyStart], [xr(bodyStart), bodyStart], [xr(base), base], [xr(base) - wh, base], [ax, yi], [xl(base) + wh, base], [xl(base), base]]
  const pts = (a) => a.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')
  const cx = ax, cy = (top + tipEnd) / 2
  return { tip: pts(tip), body: pts(body), tipT: `translate(0 ${-tipLift}) rotate(${tipRot} ${f(cx)} ${f(cy)})` }
}
const M = lambda({ ax: 32, top: 3, base: 61, hw: 21, wh: 11.5, tipEnd: 22, bodyStart: 28, tipLift: 1, tipRot: 10 })
const markInner = (ink, burn) => `
  <polygon class="ev-body" points="${M.body}" fill="${ink}"/>
  <polygon class="ev-tip" points="${M.tip}" fill="${burn}" transform="${M.tipT}"/>`

const svg = (vb, body, label, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}"${extra}>${body}\n</svg>\n`

writeFileSync(`${OUT}/mark.svg`, svg('0 0 64 64', markInner(INK, BURN), 'Albretsen AS mark'))
writeFileSync(`${OUT}/mark-reversed.svg`, svg('0 0 64 64', markInner('#FFFFFF', BURN), 'Albretsen AS mark, reversed'))
writeFileSync(`${OUT}/mark-mono.svg`, svg('0 0 64 64', markInner('currentColor', 'currentColor'), 'Albretsen AS mark'))
writeFileSync(`${OUT}/favicon.svg`, svg('0 0 64 64', `
  <rect width="64" height="64" rx="14" fill="${INK}"/>
  <g transform="translate(6.4 7.2) scale(0.8)">${markInner('#FFFFFF', BURN)}</g>`, 'Albretsen AS'))

// ---------- wordmark: monoline vector capitals, skewed like a burn ----------
const SW = 7, H = 44, t = SW / 2, b = H - SW / 2
const G = {
  A: { w: 26, d: '', A: true },
  L: { w: 20, d: `M${t} -2 V${b} H20` },
  B: { w: 25, d: `M${t} -2 V${b} H14 A ${(b - 20.5) / 2} ${(b - 20.5) / 2} 0 0 0 14 20.5 H${t} M${t} ${t} H12.5 A 8.5 8.5 0 0 1 12.5 20.5` },
  R: { w: 24, d: `M${t} ${H + 2} V${t} H13 A 9.25 9.25 0 0 1 13 22 H${t} M12 22 L23 ${H + 4}` },
  E: { w: 20, d: `M20 ${t} H${t} V${b} H20 M${t} 22 H17` },
  T: { w: 24, d: `M0 ${t} H24 M12 ${t} V${H + 2}` },
  S: { w: 22, d: `M21 9.5 C19 5 15.5 ${t} 11 ${t} C5 ${t} ${t} 7.5 ${t} 12 C${t} 17 8 19.5 11.5 21 C16 23 ${22 - t} 25.5 ${22 - t} 31.5 C${22 - t} 37 17 ${b} 11 ${b} C6 ${b} 2 37.5 0.5 33` },
  N: { w: 23, d: `M${t} ${H + 2} V${-2} M${t} -2 L${23 - t} ${H + 2} M${t + 1.6} -2 L${23 - t + 1.6} ${H + 2} M${t - 1} -2 L${23 - t - 1} ${H + 2} M${23 - t} ${H + 2} V-2` },
  ' ': { w: 6, d: '' },
}
function word(text, gap = 9.5) {
  let x = 0, parts = []
  let a = ''
  for (const ch of text) {
    const g = G[ch]
    if (g.d) parts.push(`<path transform="translate(${f(x)} 0)" d="${g.d}"/>`)
    if (g.A) {
      const A = lambda({ ax: 13, top: 0, base: H, hw: 13.4, wh: 8.6, tipEnd: 13, bodyStart: 18.5, tipLift: 1, tipRot: 10 })
      a += `<g transform="translate(${f(x)} 0)"><polygon points="${A.body}" fill="INK"/><polygon class="ev-tip" points="${A.tip}" fill="${BURN}" transform="${A.tipT}"/></g>`
    }
    x += g.w + gap
  }
  return { w: x - gap, body: parts.join(''), a }
}
const W1 = word('ALBRETSEN')
const skew = -12
const pad = 10
const wmW = W1.w + pad * 2 + 10
const wordBody = (ink) => `
  <defs><clipPath id="band"><rect x="-20" y="0" width="${wmW + 40}" height="${H}"/></clipPath></defs>
  <g transform="translate(${pad + 9} 6) skewX(${skew})"><g clip-path="url(#band)" fill="none" stroke="${ink}" stroke-width="${SW}" stroke-linejoin="miter" stroke-miterlimit="10">${W1.body}</g>${W1.a.replace('INK', ink)}</g>`
writeFileSync(`${OUT}/wordmark.svg`, svg(`0 0 ${f(wmW)} ${H + 12}`, wordBody(INK), 'Albretsen'))
writeFileSync(`${OUT}/wordmark-reversed.svg`, svg(`0 0 ${f(wmW)} ${H + 12}`, wordBody('#FFFFFF'), 'Albretsen'))

// lockup: mark + wordmark + AS tag
const scale = 0.98
const lockW = W1.w + 22 + 18 + 40
const lock = (ink) => `
  <defs><clipPath id="band2"><rect x="-20" y="0" width="${wmW + 40}" height="${H}"/></clipPath></defs>
  <g transform="translate(14 4) skewX(${skew})"><g clip-path="url(#band2)" fill="none" stroke="${ink}" stroke-width="${SW}" stroke-linejoin="miter" stroke-miterlimit="10">${W1.body}</g>${W1.a.replace('INK', ink)}</g>
  <g transform="translate(${14 + W1.w + 14} 26)">
    <rect x="0" y="0" width="38" height="22" fill="${BURN}"/>
    <g transform="translate(9 5) scale(0.27) skewX(-12)"><polygon points="${lambda({ ax: 13, top: 0, base: H, hw: 13.4, wh: 9, tipEnd: 0, bodyStart: 0 }).body}" fill="${INK}"/><path transform="translate(36 0)" d="${G.S.d}" fill="none" stroke="${INK}" stroke-width="${SW + 1}"/></g>
  </g>`
writeFileSync(`${OUT}/lockup.svg`, svg(`0 0 ${f(lockW)} 56`, lock(INK), 'Albretsen AS'))
writeFileSync(`${OUT}/lockup-reversed.svg`, svg(`0 0 ${f(lockW)} 56`, lock('#FFFFFF'), 'Albretsen AS'))
console.log('ok', W1.w)
