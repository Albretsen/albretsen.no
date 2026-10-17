/**
 * Star Catalogue — particle system for design 88 ("Labelled Sky").
 *
 * Every particle is a REAL star: positions and brightness were measured from the
 * 1885 glass-plate photograph "A Section of the Constellation Cygnus" (The Met, CC0),
 * stored in ./cygnus-1885-stars.json. The field drifts on a slow flow-noise current.
 * Calling .show('mcp-emails') pulls the nearest stars out of the plate on springs and
 * pins them into that product's constellation (traced from the real logo geometry);
 * the threads thin as they stretch (tension). .fracture() splits the sky into three
 * shards that drift apart and snap back. Hovering a star reveals its catalogue entry.
 *
 * No dependencies. Canvas 2D. ~2,200 particles. Pauses offscreen; honours reduced motion.
 *
 *   import { mountStarCatalogue } from './star-catalogue.js'
 *   const sky = await mountStarCatalogue(canvas, { src: './cygnus-1885-stars.json' })
 *   sky.show('toolrails'); sky.show(null); sky.fracture(); sky.destroy()
 */

export const CONSTELLATIONS = {
  // point sets are the real logos' vertices (viewBox units), lines index into them
  'mcp-emails': { label: 'ALB-01 · MCP Emails', hero: 5,
    pts: [[4, 11], [44, 11], [44, 39], [4, 39], [24, 27], [39, 6]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [4, 1]] },
  'fun-libs': { label: 'ALB-02 · Fun Libs', hero: 2,
    pts: [[290, 414], [512, 414], [734, 414], [290, 609], [533, 609]],
    lines: [[0, 1], [1, 2], [3, 4]] },
  'toolrails': { label: 'ALB-03 · Toolrails', hero: 5,
    pts: [[6, 12.5], [21.5, 12.5], [6, 19.5], [21.5, 19.5], [16.5, 7.5], [25, 16], [16.5, 24.5]],
    lines: [[0, 1], [2, 3], [4, 5], [5, 6]] },
  'harbor': { label: 'ALB-04 · Harbor', hero: 11,
    pts: [[12, 26], [24, 14], [28.5, 14], [32, 19.5], [35.5, 14], [40, 14], [52, 26], [52, 40], [40, 52], [24, 52], [12, 40], [32, 35]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 0]] },
  'albretsen': { label: 'Albretsen AS', hero: 0,
    pts: [[32, 13], [15, 51], [49, 51], [22.4, 35], [41.6, 35]],
    lines: [[0, 3], [3, 1], [0, 4], [4, 2], [3, 4]] },
}

const PALETTE = { cream: '#F9F2E2', brass: '#C2964D', brassLight: '#E8CB84', signal: '#D4407C', night: '#05170F' }

export async function mountStarCatalogue(canvas, opts = {}) {
  const o = {
    src: new URL('./cygnus-1885-stars.json', import.meta.url).href,
    max: 2200, background: null, labels: true, ...opts,
  }
  const data = opts.data || await fetch(o.src).then(r => r.json())
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const ctx = canvas.getContext('2d')
  let W = 0, H = 0, dpr = 1, raf = 0, visible = true, t0 = performance.now()
  const stars = data.stars.slice(0, o.max)
  const N = stars.length
  // particle buffers
  const hx = new Float32Array(N), hy = new Float32Array(N)   // home (px)
  const x = new Float32Array(N), y = new Float32Array(N)
  const vx = new Float32Array(N), vy = new Float32Array(N)
  const tx = new Float32Array(N), ty = new Float32Array(N)   // target when pinned
  const pinned = new Int16Array(N).fill(-1)                    // index into constellation pts
  const mag = new Float32Array(N), seed = new Float32Array(N)
  // rank-based magnitude (catalogue is sorted brightest first) reads better than raw plate flux
  for (let i = 0; i < N; i++) { mag[i] = Math.pow(1 - i / N, 3.2); seed[i] = Math.random() * 1000 }
  let current = null, picks = [], shards = null, pointer = { x: -1e4, y: -1e4, on: false }, hoverIdx = -1
  let sprite = makeSprite()

  function makeSprite() {
    const c = document.createElement('canvas'); c.width = c.height = 64
    const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    gr.addColorStop(0, 'rgba(252,244,228,1)'); gr.addColorStop(0.18, 'rgba(240,214,150,.9)')
    gr.addColorStop(0.45, 'rgba(194,150,77,.25)'); gr.addColorStop(1, 'rgba(194,150,77,0)')
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c
  }

  function layout() {
    const r = canvas.getBoundingClientRect()
    dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
    // cover-fit the plate
    const a = data.aspect, s = Math.max(W, H * a)
    const pw = s, ph = s / a, ox = (W - pw) / 2, oy = (H - ph) / 2
    for (let i = 0; i < N; i++) {
      const nx = ox + stars[i][0] * pw, ny = oy + stars[i][1] * ph
      if (!hx[i] && !hy[i]) { x[i] = nx; y[i] = ny }
      hx[i] = nx; hy[i] = ny
    }
    if (current) show(current, true)
  }

  function show(id, relayout = false) {
    for (const i of picks) pinned[i] = -1
    picks = []; current = id
    if (!id) return
    const c = CONSTELLATIONS[id]
    const xs = c.pts.map(p => p[0]), ys = c.pts.map(p => p[1])
    const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys)
    const box = Math.min(W, H) * 0.5
    const s = Math.min(box / (mxx - mnx), box * 0.75 / (mxy - mny))
    const cx = W * (o.centerX ?? 0.5), cy = H * (o.centerY ?? 0.5)
    const used = new Set()
    c.pts.forEach((p, k) => {
      const px = cx + (p[0] - (mnx + mxx) / 2) * s, py = cy + (p[1] - (mny + mxy) / 2) * s
      // nearest bright-ish unused star becomes this node
      let best = -1, bd = 1e12
      for (let i = 0; i < Math.min(N, 900); i++) {
        if (used.has(i)) continue
        const d = (hx[i] - px) ** 2 + (hy[i] - py) ** 2 - mag[i] * 4e4
        if (d < bd) { bd = d; best = i }
      }
      used.add(best); picks.push(best); pinned[best] = k; tx[best] = px; ty[best] = py
    })
    if (reduce) for (const i of picks) { x[i] = tx[i]; y[i] = ty[i] }
  }

  function fracture() {
    if (reduce) return
    // two jagged cuts -> three shards; each shard gets an impulse away from the cuts
    const c1 = W * (0.33 + Math.random() * 0.06), c2 = W * (0.62 + Math.random() * 0.06)
    shards = { c1, c2, until: performance.now() + 900 }
    for (let i = 0; i < N; i++) {
      const lean = (y[i] / H - 0.5) * 40
      const sx = x[i] + lean
      const k = sx < c1 ? 0 : sx < c2 ? 1 : 2
      const dir = [-1, 0.15, 1][k]
      vx[i] += dir * (9 + Math.random() * 3); vy[i] += (k - 1) * 2.4 + (Math.random() - 0.5)
    }
  }

  // cheap smooth flow field
  const flow = (px, py, t) => {
    const a = Math.sin(px * 0.004 + t * 0.00011) + Math.cos(py * 0.005 - t * 0.00009)
    return [Math.cos(a * 1.7), Math.sin(a * 1.3)]
  }

  function step(now) {
    const t = now - t0
    const k = 0.012, kp = 0.06, damp = 0.86
    for (let i = 0; i < N; i++) {
      let gx, gy, kk = k
      if (pinned[i] >= 0) { gx = tx[i]; gy = ty[i]; kk = kp }
      else {
        const f = flow(hx[i], hy[i], t + seed[i])
        gx = hx[i] + f[0] * 5; gy = hy[i] + f[1] * 5
      }
      vx[i] += (gx - x[i]) * kk; vy[i] += (gy - y[i]) * kk
      if (pointer.on && pinned[i] < 0) {
        const dx = x[i] - pointer.x, dy = y[i] - pointer.y, d2 = dx * dx + dy * dy
        if (d2 < 9000) { const f = (1 - d2 / 9000) * 1.3; vx[i] += dx / Math.sqrt(d2 + 1) * f; vy[i] += dy / Math.sqrt(d2 + 1) * f }
      }
      vx[i] *= damp; vy[i] *= damp; x[i] += vx[i]; y[i] += vy[i]
    }
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (o.background) { ctx.fillStyle = o.background; ctx.fillRect(0, 0, W, H) } else ctx.clearRect(0, 0, W, H)
    const dim = current ? 0.45 : 1
    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < N; i++) {
      const m = mag[i], isPick = pinned[i] >= 0
      const tw = 0.85 + 0.15 * Math.sin(now * 0.002 + seed[i])
      const r = isPick ? Math.max(9, 3 + m * 16) : 1.6 + m * 11
      ctx.globalAlpha = Math.min(1, (0.45 + m * 0.8) * tw * (isPick ? 1 : dim))
      ctx.drawImage(sprite, x[i] - r, y[i] - r, r * 2, r * 2)
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1
    // constellation threads: thinner and brighter when stretched (tension)
    if (current) {
      const c = CONSTELLATIONS[current]
      for (const [a, b] of c.lines) {
        const i = picks[a], j = picks[b]
        const d = Math.hypot(x[i] - x[j], y[i] - y[j])
        const rest = Math.hypot(tx[i] - tx[j], ty[i] - ty[j]) || 1
        const stretch = Math.max(0.6, Math.min(2.5, d / rest))
        ctx.strokeStyle = stretch > 1.05 ? PALETTE.brassLight : PALETTE.brass
        ctx.lineWidth = 2.2 / stretch
        ctx.beginPath(); ctx.moveTo(x[i], y[i]); ctx.lineTo(x[j], y[j]); ctx.stroke()
      }
      // hero star: four-point spark
      const h = picks[c.hero]; spark(x[h], y[h], 14 + 2 * Math.sin(now * 0.004))
      if (o.labels) label(x[h] + 18, y[h] - 18, c.label)
    }
    // hover catalogue entry (hidden detail)
    if (hoverIdx >= 0 && o.labels) {
      const i = hoverIdx, s = stars[i]
      ctx.strokeStyle = PALETTE.brassLight; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(x[i], y[i], 9 + mag[i] * 6, 0, Math.PI * 2); ctx.stroke()
      const magn = (6.5 - 5 * mag[i]).toFixed(1)
      label(x[i] + 16, y[i] + 22, `№ ${String(i + 1).padStart(4, '0')} · m ${magn} · 1885`)
    }
  }
  function spark(cx, cy, r) {
    ctx.fillStyle = PALETTE.cream; ctx.beginPath()
    for (let k = 0; k < 8; k++) {
      const a = -Math.PI / 2 + k * Math.PI / 4, rr = k % 2 ? r * 0.22 : r
      ctx[k ? 'lineTo' : 'moveTo'](cx + rr * Math.cos(a), cy + rr * Math.sin(a))
    }
    ctx.closePath(); ctx.fill()
  }
  function label(lx, ly, text) {
    ctx.font = '600 11px "Martian Mono", ui-monospace, monospace'
    const w = ctx.measureText(text).width + 20
    ctx.fillStyle = '#1A4A32'; ctx.fillRect(lx + 3, ly - 15 + 3, w, 24)
    ctx.fillStyle = PALETTE.cream; ctx.fillRect(lx, ly - 15, w, 24)
    ctx.strokeStyle = '#1A4A32'; ctx.lineWidth = 1.5; ctx.strokeRect(lx, ly - 15, w, 24)
    ctx.fillStyle = '#1A4A32'; ctx.fillText(text, lx + 10, ly + 1)
  }

  function frame(now) {
    if (!reduce) step(now)
    draw(now)
    if (!reduce && visible) raf = requestAnimationFrame(frame)
  }
  const onMove = e => {
    const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.on = true
    let best = -1, bd = 400
    for (let i = 0; i < Math.min(N, 600); i++) { const d = (x[i] - pointer.x) ** 2 + (y[i] - pointer.y) ** 2; if (d < bd) { bd = d; best = i } }
    hoverIdx = best
    if (reduce) draw(performance.now())
  }
  const onLeave = () => { pointer.on = false; hoverIdx = -1 }
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave)
  const ro = new ResizeObserver(() => { layout(); if (reduce) draw(performance.now()) }); ro.observe(canvas)
  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting
    if (visible && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame) }
  }); io.observe(canvas)
  layout(); raf = requestAnimationFrame(frame)
  return {
    show: id => { show(id); if (reduce) draw(performance.now()) },
    fracture, get current() { return current },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave) },
  }
}
