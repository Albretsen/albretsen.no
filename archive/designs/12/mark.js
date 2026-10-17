// The mark: seven parallel lines in a square, bent by a seeded wave.
// One line is blue. Every visit draws a new seed, so the mark is never
// quite the same twice, but the rule that makes it never changes.

export function rng(seed) { // mulberry32
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function markParams(seed) {
  const r = rng(seed)
  return {
    freq: 0.22 + r() * 0.22,      // waves per unit
    phase: r() * Math.PI * 2,
    drift: (r() - 0.5) * 1.6,     // phase shift per line: the "current"
    amp: 0.9 + r() * 1.1,
    blue: 1 + Math.floor(r() * 5), // which inner line carries the colour
  }
}

// Returns an SVG string, 24 x 24 units.
export function markSVG(seed, { ink = '#070707', blue = '#006aaa', bg = null, title = 'Albretsen AS' } = {}) {
  const p = markParams(seed)
  const lines = []
  for (let i = 0; i < 7; i++) {
    const y0 = 3 + i * 3
    // Amplitude swells toward the middle line: tension, then release.
    const env = Math.sin(((i + 0.5) / 7) * Math.PI)
    let d = ''
    for (let x = 2; x <= 22; x += 1) {
      const e = Math.sin(((x - 2) / 20) * Math.PI) // flat at the edges
      const y = y0 + p.amp * env * e * Math.sin(x * p.freq * Math.PI + p.phase + i * p.drift)
      d += (x === 2 ? 'M' : 'L') + x + ' ' + y.toFixed(2)
    }
    lines.push(`<path d="${d}" stroke="${i === p.blue ? blue : ink}" />`)
  }
  const back = bg ? `<rect width="24" height="24" rx="3" fill="${bg}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${title}">` +
    `<title>${title}</title>${back}<g fill="none" stroke-width="1.5" stroke-linecap="butt">${lines.join('')}</g></svg>`
}

export const seedHex = seed => (seed >>> 0).toString(16).padStart(8, '0').slice(-6)
