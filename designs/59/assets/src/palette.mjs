// Palette for design 59 "Cover Story". OKLCH is the source of truth; hex is derived.
// Run: node designs/59/assets/src/palette.mjs
export const palette = {
  ink:      [0.17, 0.045, 288], // body text, outlines, hard shadows
  paper:    [0.965, 0.012, 288], // page
  pulp:     [0.91, 0.022, 288], // second paper, cards
  violet:   [0.52, 0.25, 288], // seed: the brand colour, masthead, mark
  glow:     [0.80, 0.13, 288], // violet light, glows, links on ink
  // Spectrum: stickers only, one colour per sticker. Hues step from the seed.
  lime:     [0.93, 0.21, 123],
  tangerine:[0.72, 0.20, 42],
  cyan:     [0.86, 0.14, 203],
  rose:     [0.70, 0.22, 352],
  citrine:  [0.90, 0.17, 95],
}

function oklchToHex([L, C, h]) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3
  let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  const f = (x) => {
    x = Math.min(1, Math.max(0, x))
    x = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
    return Math.round(x * 255).toString(16).padStart(2, '0')
  }
  return '#' + f(r) + f(g) + f(bl)
}

export const hex = Object.fromEntries(Object.entries(palette).map(([k, v]) => [k, oklchToHex(v)]))

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [k, v] of Object.entries(palette)) console.log(k.padEnd(10), `oklch(${v[0]} ${v[1]} ${v[2]})`, hex[k])
}
