// The Drop: a generative mark. A closed blob held together by surface tension,
// perturbed by a 24-bit seed. Every visit draws a new one; all of them are the logo.

function rng(seed) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export function newSeed() {
  try { return crypto.getRandomValues(new Uint32Array(1))[0] & 0xffffff } catch { return Math.floor(Math.random() * 0xffffff) }
}

export const seedHex = s => s.toString(16).padStart(6, '0')

// Radius r(t) = R * (1 + sum a_k cos(k t + p_k)), k = 2..4. Low harmonics only:
// it must always read as one drop, never as a splat.
export function blobPath(seed, cx = 50, cy = 52, R = 33) {
  const r = rng(seed)
  const harm = [2, 3, 4].map((k, i) => ({ k, a: (0.05 + r() * 0.07) / (i + 1), p: r() * Math.PI * 2 }))
  const squash = 0.04 + r() * 0.05 // gravity: a drop sits a little flat
  const N = 14, pts = []
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2
    let rad = 1
    for (const h of harm) rad += h.a * Math.cos(h.k * t + h.p)
    pts.push([cx + Math.cos(t) * R * rad * (1 + squash), cy + Math.sin(t) * R * rad * (1 - squash)])
  }
  // Closed Catmull-Rom to cubic Bezier
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  return d + 'Z'
}

// Chrome-and-gel rendering. Hex values are the OKLCH hue-180 ramp (see BRAND.md).
export function markSVG(seed, { id = 'm', label = '' } = {}) {
  const d = blobPath(seed)
  const g = `${id}${seedHex(seed)}`
  const a11y = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"${a11y}>` +
    `<defs><linearGradient id="b${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#daf6ef"/><stop offset=".38" stop-color="#5addc7"/><stop offset=".62" stop-color="#144039"/><stop offset=".82" stop-color="#2e7065"/><stop offset="1" stop-color="#78baac"/></linearGradient>` +
    `<radialGradient id="s${g}" cx=".34" cy=".26" r=".7"><stop offset="0" stop-color="#f5fefc" stop-opacity=".85"/><stop offset=".38" stop-color="#f5fefc" stop-opacity="0"/></radialGradient>` +
    `<clipPath id="c${g}"><path d="${d}"/></clipPath></defs>` +
    `<path d="${d}" fill="url(#b${g})"/>` +
    `<g clip-path="url(#c${g})"><path d="${d}" fill="url(#s${g})"/><ellipse cx="40" cy="29" rx="21" ry="8" fill="#f5fefc" opacity=".55" transform="rotate(-14 40 29)"/><ellipse cx="58" cy="88" rx="26" ry="10" fill="#50f5db" opacity=".35"/></g>` +
    `<path d="${d}" fill="none" stroke="#daf6ef" stroke-opacity=".5" stroke-width="1"/></svg>`
}

export function faviconURI(seed) {
  return 'data:image/svg+xml,' + encodeURIComponent(markSVG(seed, { id: 'f' }))
}
