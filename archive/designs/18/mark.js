// The mark: a 7 x 7 field of short strokes, like grain in a sample under a lens.
// The base field is fixed (the identity). Each visit adds a small, seeded
// perturbation, so no two visits draw exactly the same mark.

function rng(seed) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

const N = 7, SIZE = 32, PAD = 3

// Base flow: a stream bending around a point just above centre.
function baseAngle(u, v) {
  const dx = u - 0.5, dy = v - 0.42
  const swirl = Math.atan2(dy, dx) + Math.PI / 2
  const w = Math.exp(-(dx * dx + dy * dy) * 9)
  return (1 - w) * (0.35 * Math.sin(v * 5.2)) + w * swirl
}

export function markPath(seed = 0, amount = 0.38) {
  const r = rng(seed)
  const p1 = r() * 6.283, p2 = r() * 6.283, k = 2 + r() * 3
  const step = (SIZE - PAD * 2) / (N - 1)
  let d = ''
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / (N - 1), v = j / (N - 1)
    const a = baseAngle(u, v) + amount * Math.sin(k * u + p1) * Math.cos(k * v + p2) + (seed ? (r() - 0.5) * amount * 0.6 : 0)
    const len = step * (0.62 + (seed ? (r() - 0.5) * 0.18 : 0))
    const cx = PAD + i * step, cy = PAD + j * step
    const hx = Math.cos(a) * len / 2, hy = Math.sin(a) * len / 2
    d += `M${(cx - hx).toFixed(2)} ${(cy - hy).toFixed(2)}L${(cx + hx).toFixed(2)} ${(cy + hy).toFixed(2)}`
  }
  return d
}

export function markSVG(seed = 0, stroke = '#2a2a2a') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}"><path d="${markPath(seed)}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round"/></svg>`
}
