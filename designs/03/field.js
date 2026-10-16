// The ambient field: a halftone screen printed in the second ink. A slow vector
// field drifts the dot sizes up and to the right; every real event drops a
// gravity well where it landed on the timeline, which pulls the dots in and
// swells them, then lets go. No event, no well: quiet hours look quiet.

const TAU = Math.PI * 2

export function startField(canvas, { reduced = false } = {}) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return { well() {} }
  let w = 0, h = 0, raf = 0, visible = true, last = 0
  const wells = []
  const ink = getComputedStyle(canvas).color

  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const r = canvas.getBoundingClientRect()
    w = r.width; h = r.height
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function draw(ms) {
    const t = ms / 1000
    const g = w < 700 ? 15 : 19
    const rMax = g < 16 ? 2.1 : 2.6
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = ink
    ctx.beginPath()
    for (let i = wells.length - 1; i >= 0; i--) {
      wells[i].k = Math.exp(-(t - wells[i].t) / 7)
      if (wells[i].k < 0.02) wells.splice(i, 1)
    }
    for (let y = g / 2; y < h; y += g) {
      for (let x = g / 2; x < w; x += g) {
        // the vector: two travelling waves, drifting up and right
        let v = Math.sin(x * 0.0042 - t * 0.11) * Math.cos(y * 0.0061 + t * 0.07)
              + Math.sin((x - y) * 0.0021 + t * 0.045)
        v = (v + 2) / 4
        let px = x, py = y
        for (const well of wells) { // gravity
          const dx = well.x - x, dy = well.y - y
          const f = well.k * Math.exp(-(dx * dx + dy * dy) / (well.r * well.r))
          v += f * 0.9
          px += dx * f * 0.22; py += dy * f * 0.22
        }
        const r = rMax * Math.min(1.6, v * v * v * 1.5)
        if (r > 0.3) { ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, TAU) }
      }
    }
    ctx.fill()
  }

  function frame(ms) {
    raf = 0
    if (!visible || document.hidden) return
    if (ms - last > 40) { last = ms; draw(ms) } // ~25 fps is plenty for weather
    raf = requestAnimationFrame(frame)
  }
  const kick = () => { if (!reduced && !raf) raf = requestAnimationFrame(frame) }

  size()
  draw(performance.now())
  new ResizeObserver(() => { size(); draw(performance.now()) }).observe(canvas)
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick() }).observe(canvas)
  document.addEventListener('visibilitychange', kick)
  kick()

  return {
    well(x, y) {
      if (reduced) return
      wells.push({ x, y, r: Math.max(120, Math.min(w, h) * 0.22), t: performance.now() / 1000, k: 1 })
      if (wells.length > 8) wells.shift()
      kick()
    },
  }
}
