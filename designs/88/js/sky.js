/**
 * Labelled Sky: the hero particle system.
 *
 * Adapted from the kit's interactive/star-catalogue.js. Every particle is a real
 * star measured from The Met's 1885 Cygnus glass plate (CC0). The difference here:
 * the particles are registered to the exact crop of the hero photograph, so when the
 * canvas takes over from the photo nothing moves. Then the stars lift off the plate.
 *
 *   const sky = await mountSky(canvas, { crop, centerX, centerY, onLock })
 *   sky.show('toolrails'); sky.show(null); sky.fracture(); sky.destroy()
 */

export const CONSTELLATIONS = {
  // point sets are the real logos' vertices (viewBox units), lines index into them
  'mcp-emails': { code: 'ALB-01', hero: 5,
    pts: [[4, 11], [44, 11], [44, 39], [4, 39], [24, 27], [39, 6]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [4, 1]] },
  'fun-libs': { code: 'ALB-02', hero: 2,
    pts: [[290, 414], [512, 414], [734, 414], [290, 609], [533, 609]],
    lines: [[0, 1], [1, 2], [3, 4]] },
  'toolrails': { code: 'ALB-03', hero: 5,
    pts: [[6, 12.5], [21.5, 12.5], [6, 19.5], [21.5, 19.5], [16.5, 7.5], [25, 16], [16.5, 24.5]],
    lines: [[0, 1], [2, 3], [4, 5], [5, 6]] },
  'harbor': { code: 'ALB-04', hero: 11,
    pts: [[12, 26], [24, 14], [28.5, 14], [32, 19.5], [35.5, 14], [40, 14], [52, 26], [52, 40], [40, 52], [24, 52], [12, 40], [32, 35]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 0]] },
  'albretsen': { code: 'ALB-00', hero: 0,
    pts: [[32, 13], [15, 51], [49, 51], [22.4, 35], [41.6, 35]],
    lines: [[0, 3], [3, 1], [0, 4], [4, 2], [3, 4]] },
}

const C = { cream: '#F9F2E2', forest: '#1A4A32', brass: '#C2964D', brassL: '#E8CB84', signal: '#D4407C' }

export async function mountSky(canvas, opts = {}) {
  const o = { centerX: 0.68, centerY: 0.46, box: 0.52, crop: { x0: 0, y0: 0, w: 1, h: 1 }, onLock: () => {}, onHover: () => {}, ...opts }
  const data = await fetch(o.src).then(r => r.json())
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const ctx = canvas.getContext('2d')
  const stars = data.stars, N = stars.length
  let W = 0, H = 0, dpr = 1, raf = 0, visible = true, alive = true
  const t0 = performance.now()
  const hx = new Float32Array(N), hy = new Float32Array(N)
  const x = new Float32Array(N), y = new Float32Array(N)
  const vx = new Float32Array(N), vy = new Float32Array(N)
  const tx = new Float32Array(N), ty = new Float32Array(N)
  const pinned = new Int16Array(N).fill(-1)
  const mag = new Float32Array(N), seed = new Float32Array(N)
  // brightness from measured plate flux (log-scaled) so sizes match the photograph
  const lf = stars.map(s => Math.log(s[2])), lmin = Math.min(...lf), lmax = Math.max(...lf)
  for (let i = 0; i < N; i++) { mag[i] = Math.pow((lf[i] - lmin) / (lmax - lmin), 1.6); seed[i] = Math.random() * 1000 }
  let current = null, picks = [], locked = false, pointer = { x: -1e4, y: -1e4, on: false }, hoverIdx = -1
  let pulse = 0
  const sprite = makeSprite(), core = makeCore()
  function makeCore() {
    const c = document.createElement('canvas'); c.width = c.height = 32
    const g = c.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    gr.addColorStop(0, 'rgba(253,247,232,1)'); gr.addColorStop(0.62, 'rgba(250,240,212,1)'); gr.addColorStop(1, 'rgba(240,214,150,0)')
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return c
  }

  function makeSprite() {
    const c = document.createElement('canvas'); c.width = c.height = 64
    const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    gr.addColorStop(0, 'rgba(253,246,230,1)'); gr.addColorStop(0.1, 'rgba(250,238,205,.96)')
    gr.addColorStop(0.2, 'rgba(232,203,132,.5)'); gr.addColorStop(0.5, 'rgba(194,150,77,.12)'); gr.addColorStop(1, 'rgba(194,150,77,0)')
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c
  }

  function layout() {
    const r = canvas.getBoundingClientRect()
    dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
    // cover-fit the photo's crop exactly like object-fit: cover; object-position: center
    const cr = typeof o.crop === 'function' ? o.crop() : o.crop
    const rw0 = cr.w * data.aspect, rh0 = cr.h
    const s = Math.max(W / rw0, H / rh0), rw = rw0 * s, rh = rh0 * s
    const ox = (W - rw) / 2, oy = (H - rh) / 2
    for (let i = 0; i < N; i++) {
      const nx = ox + (stars[i][0] - cr.x0) / cr.w * rw, ny = oy + (stars[i][1] - cr.y0) / cr.h * rh
      hx[i] = nx; hy[i] = ny
      if (pinned[i] < 0) { x[i] = nx; y[i] = ny; vx[i] = vy[i] = 0 }
    }
    if (current) show(current, true)
  }

  const onscreen = i => hx[i] > -40 && hx[i] < W + 40 && hy[i] > -40 && hy[i] < H + 40

  function show(id, relayout = false) {
    for (const i of picks) pinned[i] = -1
    picks = []; current = id; locked = false
    if (!id) return
    const c = CONSTELLATIONS[id]
    const cx0 = typeof o.centerX === 'function' ? o.centerX() : o.centerX
    const cy0 = typeof o.centerY === 'function' ? o.centerY() : o.centerY
    const xs = c.pts.map(p => p[0]), ys = c.pts.map(p => p[1])
    const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys)
    const box = Math.min(Math.min(W, H) * (typeof o.box === 'function' ? o.box() : o.box), W * (typeof o.maxW === 'function' ? o.maxW() : (o.maxW ?? 1)))
    const s = Math.min(box / (mxx - mnx), box * 0.8 / (mxy - mny))
    const cx = W * cx0, cy = H * cy0
    const used = new Set()
    c.pts.forEach((p, k) => {
      const px = cx + (p[0] - (mnx + mxx) / 2) * s, py = cy + (p[1] - (mny + mxy) / 2) * s
      // nearest bright-ish visible star becomes this node: the sky provides the logo
      let best = -1, bd = 1e12
      for (let i = 0; i < N; i++) {
        if (used.has(i) || !onscreen(i)) continue
        const d = (hx[i] - px) ** 2 + (hy[i] - py) ** 2 - mag[i] * 6e4
        if (d < bd) { bd = d; best = i }
      }
      used.add(best); picks.push(best); pinned[best] = k; tx[best] = px; ty[best] = py
    })
    if (reduce || relayout) for (const i of picks) { x[i] = tx[i]; y[i] = ty[i]; vx[i] = vy[i] = 0 }
  }

  function fracture() {
    if (reduce) return
    const c1 = W * (0.33 + Math.random() * 0.06), c2 = W * (0.62 + Math.random() * 0.06)
    for (let i = 0; i < N; i++) {
      if (pinned[i] >= 0) continue
      const sx = x[i] + (y[i] / H - 0.5) * 40
      const k = sx < c1 ? 0 : sx < c2 ? 1 : 2
      vx[i] += [-1, 0.15, 1][k] * (8 + Math.random() * 3); vy[i] += (k - 1) * 2.2 + (Math.random() - 0.5)
    }
  }

  const flow = (px, py, t) => {
    const a = Math.sin(px * 0.004 + t * 0.00011) + Math.cos(py * 0.005 - t * 0.00009)
    return [Math.cos(a * 1.7), Math.sin(a * 1.3)]
  }

  function step(now) {
    const t = now - t0
    for (let i = 0; i < N; i++) {
      let gx, gy, kk = 0.012
      if (pinned[i] >= 0) { gx = tx[i]; gy = ty[i]; kk = 0.05 }
      else { const f = flow(hx[i], hy[i], t + seed[i]); gx = hx[i] + f[0] * 3; gy = hy[i] + f[1] * 3 }
      vx[i] += (gx - x[i]) * kk; vy[i] += (gy - y[i]) * kk
      if (pointer.on && pinned[i] < 0) {
        const dx = x[i] - pointer.x, dy = y[i] - pointer.y, d2 = dx * dx + dy * dy
        if (d2 < 8000) { const f = (1 - d2 / 8000) * 1.1, d = Math.sqrt(d2 + 1); vx[i] += dx / d * f; vy[i] += dy / d * f }
      }
      vx[i] *= 0.86; vy[i] *= 0.86; x[i] += vx[i]; y[i] += vy[i]
    }
    if (current && !locked) {
      let m = 0
      for (const i of picks) m = Math.max(m, Math.abs(x[i] - tx[i]) + Math.abs(y[i] - ty[i]))
      if (m < 1.5) { locked = true; pulse = now; o.onLock(current) }
    }
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const dim = current ? 0.62 : 1
    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < N; i++) {
      if (x[i] < -30 || x[i] > W + 30 || y[i] < -30 || y[i] > H + 30) continue
      const m = mag[i], isPick = pinned[i] >= 0
      const tw = 0.88 + 0.12 * Math.sin(now * 0.0017 + seed[i])
      // halo + crisp emulsion core, sized like the stars on the 1885 plate
      const r = isPick ? 26 + m * 20 : 4 + m * 34, rc = isPick ? 4 + m * 4 : 1.15 + m * 7.5
      const a = (isPick ? 1 : dim) * tw
      ctx.globalAlpha = Math.min(1, (0.25 + m * 0.6) * a)
      ctx.drawImage(sprite, x[i] - r, y[i] - r, r * 2, r * 2)
      ctx.globalAlpha = Math.min(1, (0.72 + m * 0.6) * a)
      ctx.drawImage(core, x[i] - rc, y[i] - rc, rc * 2, rc * 2)
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
    if (current) {
      const c = CONSTELLATIONS[current]
      ctx.lineCap = 'round'
      for (const [a, b] of c.lines) {
        const i = picks[a], j = picks[b]
        const dx = x[j] - x[i], dy = y[j] - y[i], d = Math.hypot(dx, dy)
        const rest = Math.hypot(tx[i] - tx[j], ty[i] - ty[j]) || 1
        const stretch = Math.max(0.6, Math.min(3, d / rest))
        // tension: thin and bright while stretched, settled brass at rest
        ctx.strokeStyle = stretch > 1.04 ? C.brassL : C.brass
        ctx.globalAlpha = Math.min(1, 0.5 + 0.5 / stretch)
        ctx.lineWidth = 1.6 / stretch
        // lines stop short of each star, as on an engraved chart
        const gap = Math.min(9, d / 3), ux = dx / (d || 1), uy = dy / (d || 1)
        ctx.beginPath(); ctx.moveTo(x[i] + ux * gap, y[i] + uy * gap); ctx.lineTo(x[j] - ux * gap, y[j] - uy * gap); ctx.stroke()
      }
      ctx.globalAlpha = 1
      const h = picks[c.hero]
      const p = locked && !reduce ? Math.min(1, Math.max(0, 1 - (now - pulse) / 900)) : 0
      spark(x[h], y[h], 13 + 2 * Math.sin(now * 0.003) + p * 10)
      if (p > 0) { ctx.strokeStyle = C.brassL; ctx.globalAlpha = p; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x[h], y[h], 18 + (1 - p) * 40, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1 }
    }
    if (hoverIdx >= 0) {
      const i = hoverIdx
      ctx.strokeStyle = C.brassL; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(x[i], y[i], 10 + mag[i] * 8, 0, Math.PI * 2); ctx.stroke()
      // crosshair ticks
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2, r0 = 14 + mag[i] * 8
        ctx.beginPath(); ctx.moveTo(x[i] + Math.cos(a) * r0, y[i] + Math.sin(a) * r0); ctx.lineTo(x[i] + Math.cos(a) * (r0 + 6), y[i] + Math.sin(a) * (r0 + 6)); ctx.stroke()
      }
    }
  }
  function spark(cx, cy, r) {
    ctx.fillStyle = C.cream; ctx.beginPath()
    for (let k = 0; k < 8; k++) {
      const a = -Math.PI / 2 + k * Math.PI / 4, rr = k % 2 ? r * 0.2 : r
      ctx[k ? 'lineTo' : 'moveTo'](cx + rr * Math.cos(a), cy + rr * Math.sin(a))
    }
    ctx.closePath(); ctx.fill()
  }

  // rAF, with a timer fallback for renderers that throttle rAF while visible (headless, some embeds)
  let pending = false
  function tick(cb) {
    if (pending) return raf
    pending = true
    let done = false
    const run = t => { if (done) return; done = true; pending = false; cb(t) }
    const id = requestAnimationFrame(run)
    setTimeout(() => { if (!done && !document.hidden) { cancelAnimationFrame(id); run(performance.now()) } }, 120)
    return id
  }
  function frame(now) {
    if (!alive) return
    if (canvas.clientWidth !== Math.round(W) || canvas.clientHeight !== Math.round(H)) layout()
    if (!reduce) step(now)
    draw(now)
    if (!reduce && visible) raf = tick(frame)
  }
  const redraw = () => { if (reduce) draw(performance.now()) }

  const onMove = e => {
    const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.on = e.pointerType === 'mouse'
    let best = -1, bd = 26 * 26
    for (let i = 0; i < N; i++) {
      if (mag[i] < 0.12) continue
      const d = (x[i] - pointer.x) ** 2 + (y[i] - pointer.y) ** 2
      if (d < bd) { bd = d; best = i }
    }
    if (best !== hoverIdx) {
      hoverIdx = best
      o.onHover(best < 0 ? null : {
        n: best + 1, x: x[best], y: y[best],
        mag: (6.5 - 5 * mag[best]).toFixed(1),
        // plate coordinates in arc-ish units: fraction of the plate, as printed on the 1885 envelope
        px: stars[best][0], py: stars[best][1],
        part: pinned[best] >= 0 ? current : null,
      })
    }
    redraw()
  }
  const onLeave = () => { pointer.on = false; hoverIdx = -1; o.onHover(null); redraw() }
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave)
  const ro = new ResizeObserver(() => { layout(); redraw() }); ro.observe(canvas)
  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting
    if (visible && !reduce) raf = tick(frame)
  }); io.observe(canvas)
  layout(); raf = tick(frame)
  return {
    show: id => { show(id); if (reduce) { locked = true; o.onLock(id) } redraw() },
    fracture,
    get current() { return current },
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave) },
  }
}
