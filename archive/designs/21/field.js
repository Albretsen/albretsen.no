// The field: a sheet of dot-grid paper behind the page.
// Every real event drops one spot-colour dot, which echoes outward in rings,
// pushes the grid aside as the rings pass, then drifts and shrinks for ten minutes.
// Nothing here moves on its own beyond a slow drift. No events, no ripples.

const LANES = { 'mcp-emails': 0.2, 'fun-libs': 0.44, toolrails: 0.68, 'albretsen.no': 0.88 }
const LIFE = 600_000        // a dot lives ten minutes
const RING_SPEED = 0.07     // px per ms
const RING_MAX = 300
const GAP = 30              // grid spacing in CSS px

export function createField(canvas, { reduced = false } = {}) {
  const ctx = canvas.getContext('2d', { alpha: true })
  const css = getComputedStyle(document.documentElement)
  const INK = css.getPropertyValue('--ink').trim() || '#131a17'
  const SPOT = css.getPropertyValue('--spot').trim() || '#00a57c'
  let w = 0, h = 0, dpr = 1
  const marks = []
  let raf = 0, last = 0, seed = 1

  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1)
    w = window.innerWidth; h = window.innerHeight
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (reduced) draw(performance.now())
  }

  // slow, smooth flow: the drift
  const flow = (x, y, t) => [
    Math.sin(y * 0.0041 + t * 0.00009) + 0.6 * Math.cos(x * 0.0023 - t * 0.00005),
    Math.cos(x * 0.0037 - t * 0.00007) + 0.6 * Math.sin(y * 0.0029 + t * 0.00004),
  ]

  function add(e, { ageMs = 0 } = {}) {
    seed = (e.time.getTime() % 2147483646) + 1
    const lane = LANES[e.product] ?? 0.5
    const now = performance.now()
    marks.push({
      x: (lane + (rand() - 0.5) * 0.14) * w,
      y: (0.12 + rand() * 0.8) * h,
      born: now - ageMs,
      spot: ageMs === 0,
    })
    if (marks.length > 60) marks.shift()
    if (reduced) draw(now)
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h)
    const t = reduced ? 0 : now

    // rings currently travelling
    const rings = []
    if (!reduced) {
      for (const m of marks) {
        const age = now - m.born
        for (let k = 0; k < 3; k++) {
          const a = age - k * 650
          if (a < 0) continue
          const r = a * RING_SPEED
          if (r > RING_MAX) continue
          rings.push({ x: m.x, y: m.y, r, f: 1 - r / RING_MAX, k })
        }
      }
    }

    // the paper
    ctx.fillStyle = INK
    ctx.globalAlpha = 0.13
    const ox = (w % GAP) / 2, oy = (h % GAP) / 2
    for (let gy = oy; gy < h + GAP; gy += GAP) {
      for (let gx = ox; gx < w + GAP; gx += GAP) {
        let x = gx, y = gy
        if (!reduced) {
          const [fx, fy] = flow(gx, gy, t)
          x += fx * 1.6; y += fy * 1.6
          for (const g of rings) {
            const dx = gx - g.x, dy = gy - g.y
            const d = Math.hypot(dx, dy) || 1
            const off = Math.abs(d - g.r)
            if (off < 26) { const p = (1 - off / 26) * 7 * g.f; x += (dx / d) * p; y += (dy / d) * p }
          }
        }
        ctx.fillRect(x - 0.9, y - 0.9, 1.8, 1.8)
      }
    }

    // echoes
    ctx.strokeStyle = SPOT
    ctx.lineWidth = 1
    for (const g of rings) {
      ctx.globalAlpha = 0.42 * g.f * (1 - g.k * 0.28)
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.stroke()
    }

    // the dots, drifting
    for (let i = marks.length - 1; i >= 0; i--) {
      const m = marks[i]
      const age = now - m.born
      if (age > LIFE) { marks.splice(i, 1); continue }
      const life = 1 - age / LIFE
      if (!reduced) {
        const [fx, fy] = flow(m.x, m.y, t)
        m.x += fx * 0.02; m.y += fy * 0.02 - 0.006
      }
      ctx.globalAlpha = m.spot ? 0.25 + 0.6 * life : 0.12 + 0.25 * life
      ctx.fillStyle = m.spot ? SPOT : INK
      ctx.beginPath(); ctx.arc(m.x, m.y, 1.5 + 4 * life, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  function loop(now) {
    raf = requestAnimationFrame(loop)
    if (now - last < 33) return // ~30 fps is plenty for drift
    last = now
    draw(now)
  }

  resize()
  let rt = 0
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120) })
  if (!reduced) {
    raf = requestAnimationFrame(loop)
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(loop)
    })
  }
  return { add }
}
