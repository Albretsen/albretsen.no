// Coast Road — a symmetrical one-point-perspective drive toward the sun.
// Canvas 2D, no dependencies, ~8 KB. Scroll (or any 0..1 value) drives both the
// distance travelled down the road and the time of day (dawn -> dusk).
// Year milestones stand in pairs on both kerbs, like a timeline you drive past.
//
//   import { createCoastRoad } from './coast-road.js'
//   const road = createCoastRoad(canvas, { stops: [{ year: 2016, label: 'first app' }, ...] })
//   road.setProgress(0.4)       // 0 = first light at the first milestone, 1 = dusk at the last
//   road.destroy()
//
// Respects prefers-reduced-motion (no idle shimmer; progress still works).

const SKY = [ // t, zenith, horizon, sun, sea-near
  [0.00, '#B7A6D8', '#F9C9BA', '#FFB08A', '#8E8DBE'],
  [0.25, '#9ECBEA', '#FCE6D8', '#FFD9A0', '#79A9CB'],
  [0.50, '#84BDE6', '#E6F2F6', '#FFF3D8', '#5F9CC6'],
  [0.75, '#9DB2DE', '#F7D08C', '#FFC266', '#7E95BE'],
  [1.00, '#5B5490', '#EF9CA5', '#FF9C86', '#4C4B80'],
]
const INK = '#6E2233', PAPER = '#FBF3E6', PINK = '#F4C3C2', ROSE = '#E8959A'

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`
const smooth = t => t * t * (3 - 2 * t)

function skyAt(t) {
  t = Math.min(1, Math.max(0, t))
  let i = 0
  while (i < SKY.length - 2 && t > SKY[i + 1][0]) i++
  const a = SKY[i], b = SKY[i + 1], k = smooth((t - a[0]) / (b[0] - a[0]))
  return { zen: mix(hex(a[1]), hex(b[1]), k), hor: mix(hex(a[2]), hex(b[2]), k), sun: mix(hex(a[3]), hex(b[3]), k), sea: mix(hex(a[4]), hex(b[4]), k) }
}

function rand(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646 }

export function createCoastRoad(canvas, opts = {}) {
  const stops = opts.stops || [
    { year: 2016, label: 'first app' }, { year: 2019, label: 'Fun Libs' }, { year: 2021, label: 'consulting' },
    { year: 2023, label: '' }, { year: 2024, label: '' }, { year: 2025, label: '' }, { year: 2026, label: 'Albretsen AS' },
  ]
  const ctx = canvas.getContext('2d')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const SPACING = 26, LEAD = 9
  let W = 0, H = 0, dpr = 1, progress = opts.progress ?? 0.2, day = opts.day ?? null, raf = 0, visible = true, t0 = performance.now()
  let cliffs = null, glints = []

  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1)
    const r = canvas.getBoundingClientRect()
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height))
    canvas.width = W * dpr; canvas.height = H * dpr
    buildCliffs(); buildGlints(); draw()
  }

  // Pointillist headlands, pre-rendered once per size (homage to the Neo-Impressionist coast paintings).
  // Each layer is a smoothed outline in (x: fraction of W from the outer edge, y: fraction of H).
  const LAYERS = [
    { col: '#CDBDE0', dots: ['#B9A3D3', '#DCCDEB', '#A8CFE6'], n: 0.5,
      pts: [[0, .52], [0, .41], [.16, .40], [.30, .43], [.40, .47], [.47, .503]] },
    { col: '#EFB9B4', dots: ['#E8959A', '#F7D6CC', '#D7A3BE', '#F4C3C2'], n: 0.6,
      pts: [[0, .56], [0, .35], [.12, .34], [.24, .37], [.32, .44], [.37, .505]] },
    { col: '#E9C46E', dots: ['#E0A93B', '#F4D891', '#E8959A', '#C9A0B0'], n: 0.7,
      pts: [[0, 1.02], [0, .43], [.06, .415], [.12, .435], [.155, .5], [.165, .62], [.19, .8], [.22, 1.02]] },
  ]
  function buildCliffs() {
    const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr
    const g = c.getContext('2d'); g.scale(dpr, dpr)
    const R = rand(11)
    const hy0 = H * 0.5
    for (let i = 0; i < W * H * 0.0016; i++) {
      const v = Math.pow(R(), 1.6), y = hy0 + 2 + v * (H - hy0), r = 0.5 + v * 2.2
      g.globalAlpha = 0.10 + 0.22 * R()
      g.fillStyle = ['#FFFFFF', '#F4C3C2', '#8FBBD8', '#C9B6DE'][(R() * 4) | 0]
      g.beginPath(); g.ellipse(R() * W, y, r * 2.2, r * 0.8, 0, 0, 6.283); g.fill()
    }
    g.globalAlpha = 1
    const ws = Math.max(W, H * 1.25) // keep headlands proportionate on narrow screens
    for (const side of [-1, 1]) for (const L of LAYERS) {
      g.save()
      if (side === 1) { g.translate(W, 0); g.scale(-1, 1) }
      const P = L.pts.map(([x, y]) => [x * ws, y * H])
      g.beginPath(); g.moveTo(P[0][0], P[0][1])
      for (let i = 1; i < P.length - 1; i++) { const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2; g.quadraticCurveTo(P[i][0], P[i][1], mx, my) }
      g.lineTo(P[P.length - 1][0], P[P.length - 1][1]); g.lineTo(0, P[P.length - 1][1]); g.closePath()
      g.fillStyle = L.col; g.fill(); g.clip()
      const reach = Math.max(...P.map(p => p[0])), top = Math.min(...P.map(p => p[1])), bot = Math.max(...P.map(p => p[1]))
      // light from the sea side: darker face toward the road
      const sh = g.createLinearGradient(0, 0, reach, 0)
      sh.addColorStop(0, 'rgba(255,248,235,.25)'); sh.addColorStop(.6, 'rgba(255,248,235,0)'); sh.addColorStop(1, 'rgba(110,34,51,.16)')
      g.fillStyle = sh; g.fillRect(0, top, reach, bot - top)
      const n = Math.round(reach * (bot - top) * 0.02 * L.n)
      for (let i = 0; i < n; i++) {
        g.fillStyle = L.dots[(R() * L.dots.length) | 0]
        g.globalAlpha = 0.35 + R() * 0.5
        const x = R() * reach, y = top + R() * (bot - top), r = 0.9 + R() * 1.5
        g.beginPath(); g.ellipse(x, y, r * 1.5, r, 0, 0, 6.283); g.fill()
      }
      g.globalAlpha = 1
      g.restore()
      // ink contour, very fine
      g.save(); if (side === 1) { g.translate(W, 0); g.scale(-1, 1) }
      g.beginPath(); g.moveTo((P[1][0] + P[2][0]) / 2, (P[1][1] + P[2][1]) / 2)
      for (let i = 2; i < P.length - 1; i++) { const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2; g.quadraticCurveTo(P[i][0], P[i][1], mx, my) }
      g.strokeStyle = 'rgba(110,34,51,.35)'; g.lineWidth = 1; g.stroke(); g.restore()
    }
    cliffs = c
  }

  function buildGlints() {
    const R = rand(5); glints = []
    for (let i = 0; i < 420; i++) glints.push({ u: R() * 2 - 1, v: Math.pow(R(), 1.8), p: R() * 6.28, w: 0.4 + R() })
  }

  // Perspective: horizon at H/2, camera height 1, focal f.
  const proj = (x, z, f, hy) => [W / 2 + (x * f) / z, hy + f / z]

  function draw(now = performance.now()) {
    const time = reduce ? 0 : (now - t0) / 1000
    const tday = day ?? progress
    const s = skyAt(tday)
    const hy = H * 0.5, f = H * 0.62
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // sky
    let gr = ctx.createLinearGradient(0, 0, 0, hy)
    gr.addColorStop(0, rgb(s.zen)); gr.addColorStop(0.55, rgb(mix(mix(s.zen, s.hor, 0.6), [244, 195, 194], 0.3))); gr.addColorStop(1, rgb(s.hor))
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, hy + 1)

    // sun on an arc: rises left, crowns the vanishing point at noon, sets right
    const ang = Math.PI * (1 - tday)
    const sx = W / 2 + Math.cos(ang) * W * 0.36
    const sy = hy - Math.sin(ang) * H * 0.36 + H * 0.02
    const sr = Math.min(W, H) * (0.05 + 0.02 * (1 - Math.sin(ang)))
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 6)
    halo.addColorStop(0, rgb(s.sun, 0.9)); halo.addColorStop(0.3, rgb(s.sun, 0.35)); halo.addColorStop(1, rgb(s.sun, 0))
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, hy)
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, hy); ctx.clip()
    const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr)
    core.addColorStop(0, rgb(mix(s.sun, [255, 252, 240], 0.7))); core.addColorStop(0.85, rgb(s.sun)); core.addColorStop(1, rgb(mix(s.sun, [232, 149, 154], 0.3)))
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 6.283); ctx.fill()
    ctx.restore()

    // sea
    gr = ctx.createLinearGradient(0, hy, 0, H)
    gr.addColorStop(0, rgb(mix(s.hor, [168, 207, 230], 0.45))); gr.addColorStop(1, rgb(s.sea))
    ctx.fillStyle = gr; ctx.fillRect(0, hy, W, H - hy)

    // glints, brightest in the sun's column
    for (const g of glints) {
      const z = 1 / (0.02 + g.v * 0.9), y = hy + f / z
      const x = W / 2 + g.u * W * 0.6 * (1 + g.v * 1.5)
      const near = Math.exp(-Math.pow((x - sx) / (W * 0.16), 2))
      const a = (0.15 + 0.6 * near) * (0.5 + 0.5 * Math.sin(time * 1.7 + g.p)) * (0.4 + 0.6 * Math.sin(ang))
      if (a < 0.03) continue
      ctx.fillStyle = rgb(mix(s.sun, [255, 255, 255], 0.6), a)
      const len = g.w * (2 + 14 * g.v)
      ctx.fillRect(x - len / 2, y, len, Math.max(0.6, g.v * 2))
    }

    // headlands (proscenium)
    ctx.drawImage(cliffs, 0, 0, W, H)
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = rgb(mix([255, 255, 255], s.sea, 0.25 + 0.35 * Math.abs(tday - 0.5)))
    ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'source-over'

    // the road: a causeway straight into the light
    const travel = progress * SPACING * (stops.length - 1)
    const RW = 1.25, zNear = 0.55, zFar = 400
    const [lx1, ly1] = proj(-RW, zNear, f, hy), [rx1] = proj(RW, zNear, f, hy)
    ctx.beginPath(); ctx.moveTo(W / 2, hy); ctx.lineTo(rx1, ly1); ctx.lineTo(lx1, ly1); ctx.closePath()
    gr = ctx.createLinearGradient(0, hy, 0, H)
    gr.addColorStop(0, rgb(mix(s.hor, [214, 184, 186], 0.5))); gr.addColorStop(1, rgb(mix([196, 160, 166], s.sea, 0.25)))
    ctx.fillStyle = gr; ctx.fill()

    // kerbs: alternating pink / paper blocks, and the centre dashes
    for (let k = 0; k < 260; k++) {
      const zA = zNear + k * 0.8 - (travel % 1.6), zB = zA + 0.8
      if (zA < zNear * 0.9) continue
      const band = Math.round((zA + travel) / 0.8) & 1
      for (const side of [-1, 1]) {
        const [ax, ay] = proj(side * RW, zA, f, hy), [bx, by] = proj(side * RW, zB, f, hy)
        const [cx, cy] = proj(side * (RW + 0.22), zB, f, hy), [dx, dy] = proj(side * (RW + 0.22), zA, f, hy)
        ctx.fillStyle = band ? ROSE : PAPER
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.lineTo(dx, dy); ctx.fill()
      }
    }
    for (let k = 0; k < 90; k++) {
      const zA = zNear + k * 3 - (travel % 3), zB = zA + 1.4
      if (zA < zNear * 0.9) continue
      const [ax, ay] = proj(-0.035, zA, f, hy), [bx, by] = proj(-0.035, zB, f, hy), [cx] = proj(0.035, zA, f, hy), [dx] = proj(0.035, zB, f, hy)
      ctx.fillStyle = rgb([251, 243, 230], Math.min(1, 0.95 - zA / 300))
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(dx, by); ctx.lineTo(cx, ay); ctx.fill()
    }

    // milestone pairs (far to near so near ones overlap)
    const ms = []
    stops.forEach((st, i) => { const z = LEAD + i * SPACING - travel; if (z > 0.9 && z < 260) ms.push([z, st]) })
    ms.sort((a, b) => b[0] - a[0])
    for (const [z, st] of ms) for (const side of [-1, 1]) {
      const [x, y] = proj(side * (RW + 0.55), z, f, hy)
      const sc = f / z, w = sc * 0.42, h = sc * 0.62
      const fade = Math.min(1, (260 - z) / 60)
      ctx.globalAlpha = fade
      ctx.fillStyle = rgb([110, 34, 51], 0.18); ctx.beginPath(); ctx.ellipse(x, y, w * 0.75, w * 0.12, 0, 0, 6.283); ctx.fill()
      ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h + w / 2); ctx.arc(x, y - h + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y); ctx.closePath()
      ctx.fillStyle = PAPER; ctx.fill()
      ctx.save(); ctx.clip(); ctx.fillStyle = PINK; ctx.fillRect(x - w, y - h - w, w * 2, w * 0.9 + w / 2); ctx.restore()
      ctx.lineWidth = Math.max(0.6, sc * 0.012); ctx.strokeStyle = INK; ctx.stroke()
      if (w > 14) {
        ctx.fillStyle = INK; ctx.textAlign = 'center'
        ctx.font = `500 ${Math.round(w * 0.36)}px "EB Garamond", Georgia, serif`
        ctx.fillText(String(st.year), x, y - h * 0.38)
        if (st.label && w > 40) { ctx.font = `italic ${Math.round(w * 0.16)}px "EB Garamond", Georgia, serif`; ctx.fillText(st.label, x, y - h * 0.18) }
      }
      ctx.globalAlpha = 1
    }

    // dusk veil
    const dusk = Math.max(0, (tday - 0.8) / 0.2)
    if (dusk > 0) { ctx.fillStyle = rgb([60, 40, 90], dusk * 0.18); ctx.fillRect(0, 0, W, H) }
  }

  function loop(now) { draw(now); raf = visible && !reduce ? requestAnimationFrame(loop) : 0 }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && !reduce) raf = requestAnimationFrame(loop) })
  io.observe(canvas)
  const ro = new ResizeObserver(resize); ro.observe(canvas)
  resize()
  if (document.fonts) document.fonts.ready.then(() => draw())

  return {
    setProgress(p) { progress = Math.min(1, Math.max(0, p)); if (reduce || !raf) draw() },
    setDay(t) { day = t == null ? null : Math.min(1, Math.max(0, t)); if (reduce || !raf) draw() },
    get progress() { return progress },
    destroy() { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect() },
  }
}
