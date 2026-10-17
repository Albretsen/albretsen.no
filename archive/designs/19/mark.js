// The Field: 25 dots on a 5x5 grid. A random focus sets their density, and the
// dot nearest the focus is the spot. Same rules every visit, never the same picture.

function rng(seed) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export function newSeed() {
  try { return crypto.getRandomValues(new Uint16Array(1))[0] } catch { return Math.floor(Math.random() * 65536) }
}

export const seedLabel = seed => seed.toString(16).toUpperCase().padStart(4, '0')

// colours: { tile, dot, spot } — CSS values or hex (hex for the favicon).
export function markSVG(seed, { tile = 'var(--ink)', dot = 'var(--paper)', spot = 'var(--spot)', title = '' } = {}) {
  const r = rng(seed * 2654435761)
  const fx = r() * 4, fy = r() * 4 // focus, in cell units
  const reach = 2.2 + r() * 2.4
  let best = 0, bestD = 1e9
  const dots = []
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
    const d = Math.hypot(i - fx, j - fy)
    if (d < bestD) { bestD = d; best = dots.length }
    const k = Math.max(0, 1 - d / reach)
    const rad = 1.3 + 6.4 * k * k + r() * 0.9
    dots.push([18 + 16 * i, 18 + 16 * j, Math.min(7.6, rad)])
  }
  dots[best][2] = 7.6
  const body = dots.map(([x, y, rad], n) =>
    `<circle cx="${x}" cy="${y}" r="${rad.toFixed(2)}" fill="${n === best ? spot : dot}"/>`).join('')
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"${title ? ` role="img" aria-label="${title}"` : ' aria-hidden="true"'}><rect width="100" height="100" fill="${tile}"/>${body}</svg>`
}
