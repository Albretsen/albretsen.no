// art.js — "Salon Refusé" generative works, canvas 2D.
// Albretsen AS brand kit, design 38. No dependencies.
//
//   import { compose, paint, animate, SERIES } from './art.js'
//   const plan = compose({ series: 'filaments', seed: 0x500a48, hue: 168, w: 1200, h: 900 })
//   paint(ctx, plan, { pass: 'lit' })      // the finished painting
//   paint(ctx, plan, { pass: 'uv' })       // the hidden underdrawing (reveal on hover)
//   animate(canvas, plan, { duration: 6000 }) // draws itself stroke by stroke (returns stop())
//
// Every work is deterministic: same seed, same painting. Hues are OKLCH and come
// from the six-step spectrum (168 + n*60). A work uses its home hue, its opposite
// and neutrals. Only the brand spark uses the whole spectrum.

export const SPECTRUM = [168, 228, 288, 348, 48, 108]
export const SERIES = ['filaments', 'tension', 'weightless', 'spark', 'strata']

const TAU = Math.PI * 2

export function rng(seed) {
  let s = (seed >>> 0) || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

function makeNoise(r) {
  const p = new Uint8Array(512)
  const perm = [...Array(256).keys()]
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]] }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255]
  const g = (h, x, y) => { const a = (h / 256) * TAU; return Math.cos(a) * x + Math.sin(a) * y }
  const f = t => t * t * t * (t * (t * 6 - 15) + 10)
  return (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255
    x -= Math.floor(x); y -= Math.floor(y)
    const u = f(x), v = f(y)
    const aa = p[p[X] + Y], ab = p[p[X] + Y + 1], ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1]
    const l1 = g(aa, x, y) + u * (g(ba, x - 1, y) - g(aa, x, y))
    const l2 = g(ab, x, y - 1) + u * (g(bb, x - 1, y - 1) - g(ab, x, y - 1))
    return (l1 + v * (l2 - l1)) * 1.4
  }
}

export const ok = (l, c, h, a = 1) => `oklch(${l} ${c} ${h}${a < 1 ? ` / ${a}` : ''})`

export function palette(hue) {
  const opp = (hue + 180) % 360
  return {
    paper: ok(0.955, 0.012, 95),
    paperDeep: ok(0.91, 0.02, 85),
    ink: ok(0.24, 0.03, hue),
    home: ok(0.62, 0.15, hue),
    homeLight: ok(0.8, 0.12, hue),
    homeDeep: ok(0.42, 0.11, hue),
    opp: ok(0.68, 0.17, opp),
    oppDeep: ok(0.5, 0.15, opp),
    uvGround: ok(0.17, 0.07, 292),
    uvInk: ok(0.9, 0.21, 140),
    uvCyan: ok(0.86, 0.13, 205),
    uvRose: ok(0.74, 0.2, 340),
    uvDim: ok(0.55, 0.09, 280),
  }
}

// ---------------------------------------------------------------- compose
export function compose({ series = 'filaments', seed = 1, hue = 168, w = 1200, h = 900 } = {}) {
  const r = rng(seed), n = makeNoise(r)
  const pal = palette(hue)
  const plan = { series, seed, hue, w, h, pal, strokes: [], guides: [], marks: [], notes: [] }
  ;({ filaments, tension, weightless, spark, strata }[series] || filaments)(plan, r, n)
  return plan
}

function pick(r, items) {
  let t = r() * items.reduce((s, [, wt]) => s + wt, 0)
  for (const [v, wt] of items) { if ((t -= wt) <= 0) return v }
  return items[0][0]
}

function filaments(plan, r, n) {
  const { w, h, pal } = plan, S = Math.min(w, h)
  const scale = 1.6 / S, turb = 0.9 + r() * 1.2, bias = r() * TAU
  const cell = S / 150, cols = Math.ceil(w / cell), rows = Math.ceil(h / cell)
  const grid = new Int32Array(cols * rows).fill(-1)
  const angle = (x, y) => bias + n(x * scale, y * scale) * Math.PI * turb
  // underdrawing: vector field
  const step = S / 22
  for (let y = step / 2; y < h; y += step) for (let x = step / 2; x < w; x += step) {
    const a = angle(x, y); plan.guides.push({ kind: 'arrow', x, y, a, len: step * 0.42 })
  }
  const seeds = []
  for (let i = 0; i < 4200; i++) seeds.push([r() * w, r() * h])
  let id = 0
  for (const [sx, sy] of seeds) {
    const width = pick(r, [[S * 0.0022, 6], [S * 0.005, 4], [S * 0.011, 1.6], [S * 0.024, 0.5], [S * 0.04, 0.12]])
    const sep = Math.max(1, Math.round(width / cell + 0.6))
    const color = pick(r, [[pal.ink, 3.4], [pal.home, 4], [pal.homeLight, 1.6], [pal.homeDeep, 2.6], [pal.opp, 0.9], [pal.paperDeep, 0.5]])
    const pts = [[sx, sy]]
    const occupied = (x, y) => {
      const cx = Math.floor(x / cell), cy = Math.floor(y / cell)
      for (let j = -sep; j <= sep; j++) for (let i = -sep; i <= sep; i++) {
        const gx = cx + i, gy = cy + j
        if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue
        const v = grid[gy * cols + gx]; if (v !== -1 && v !== id) return true
      }
      return false
    }
    if (occupied(sx, sy)) continue
    for (const dir of [1, -1]) {
      let x = sx, y = sy
      for (let k = 0; k < 420; k++) {
        const a = angle(x, y)
        x += Math.cos(a) * cell * 0.7 * dir; y += Math.sin(a) * cell * 0.7 * dir
        if (x < S * 0.04 || y < S * 0.04 || x > w - S * 0.04 || y > h - S * 0.04 || occupied(x, y)) break
        if (dir === 1) pts.push([x, y]); else pts.unshift([x, y])
      }
    }
    if (pts.length < 8) continue
    for (const [x, y] of pts) { const gx = Math.floor(x / cell), gy = Math.floor(y / cell); grid[gy * cols + gx] = id }
    plan.strokes.push({ pts, color, width, cap: 'round' })
    if (plan.strokes.length % 9 === 0) plan.marks.push({ kind: 'seed', x: sx, y: sy })
    id++
  }
  plan.notes.push(`flow field · turbulence ${turb.toFixed(2)} · ${plan.strokes.length} filaments`, `collision grid ${cols}×${rows}`)
}

function catenary(x1, y1, x2, y2, sag, steps = 48) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, x = x1 + (x2 - x1) * t
    const y = y1 + (y2 - y1) * t + sag * (Math.cosh((t - 0.5) * 2.4) - Math.cosh(1.2)) / (1 - Math.cosh(1.2))
    pts.push([x, y])
  }
  return pts
}

function tension(plan, r, n) {
  const { w, h, pal } = plan, S = Math.min(w, h)
  const nails = []
  const count = 7 + Math.floor(r() * 5)
  for (let i = 0; i < count; i++) nails.push([w * (0.08 + 0.84 * (i + r() * 0.6) / count), h * (0.1 + r() * 0.28)])
  for (const [x, y] of nails) plan.marks.push({ kind: 'nail', x, y })
  // wires between nails: some slack (weightless), some taut (tension)
  for (let i = 0; i < 46; i++) {
    const a = nails[Math.floor(r() * nails.length)], b = nails[Math.floor(r() * nails.length)]
    if (a === b) continue
    const span = Math.hypot(b[0] - a[0], b[1] - a[1])
    const taut = r() < 0.28
    const sag = taut ? span * 0.01 : span * (0.15 + r() * 0.9)
    if (a[1] + sag > h * 0.94) continue
    const color = taut ? pick(r, [[pal.opp, 2], [pal.ink, 1]]) : pick(r, [[pal.home, 3], [pal.homeDeep, 2], [pal.ink, 2], [pal.homeLight, 1]])
    const pts = catenary(a[0], a[1], b[0], b[1], sag)
    plan.strokes.push({ pts, color, width: taut ? S * 0.0035 : S * (0.003 + r() * 0.01), cap: 'round' })
    plan.guides.push({ kind: 'sag', x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, sag, taut })
  }
  // hanging weights
  for (let i = 0; i < 14; i++) {
    const [x, y] = nails[Math.floor(r() * nails.length)]
    const len = h * (0.25 + r() * 0.45), rad = S * (0.012 + r() * 0.05)
    const sway = (r() - 0.5) * S * 0.04
    plan.strokes.push({ pts: [[x, y], [x + sway, y + len]], color: pal.ink, width: S * 0.0022 })
    plan.strokes.push({ disc: true, x: x + sway, y: y + len + rad, rad, color: pick(r, [[pal.home, 2], [pal.opp, 1], [pal.ink, 1]]) })
    plan.guides.push({ kind: 'plumb', x: x + sway, y: y + len + rad, rad, len })
  }
  plan.notes.push(`${count} nails · catenary y = a·cosh(x/a)`, 'taut lines carry the opposite hue')
}

function weightless(plan, r, n) {
  const { w, h, pal } = plan, S = Math.min(w, h)
  const bodies = []
  for (let i = 0; i < 64; i++) {
    const rad = S * Math.pow(r(), 2.4) * 0.11 + S * 0.006
    const x = r() * w, y = h * (0.1 + 0.85 * Math.pow(r(), 0.7))
    if (bodies.some(b => Math.hypot(b.x - x, b.y - y) < b.rad + rad + S * 0.01)) continue
    bodies.push({ x, y, rad })
  }
  for (const b of bodies) {
    // rising trail
    const trail = []
    let x = b.x, y = b.y + b.rad
    for (let k = 0; k < 40; k++) { y += S * 0.012; x += n(x * 0.004, y * 0.004) * S * 0.006; trail.push([x, y]); if (y > h * 0.98) break }
    plan.strokes.push({ pts: [[b.x, b.y + b.rad], ...trail], color: pal.homeLight, width: Math.max(1, b.rad * 0.08), alpha: 0.55 })
  }
  for (const b of bodies) {
    const fill = pick(r, [[pal.home, 3], [pal.homeDeep, 1.4], [pal.ink, 1], [pal.opp, 0.6], [null, 2]])
    plan.strokes.push({ disc: true, x: b.x, y: b.y, rad: b.rad, color: fill || pal.paper, ring: fill ? null : pal.ink, ringW: Math.max(1.2, b.rad * 0.06) })
    plan.guides.push({ kind: 'body', x: b.x, y: b.y, rad: b.rad })
  }
  plan.notes.push(`${bodies.length} bodies · gravity 0`, 'trails integrate a noise wind')
}

function spark(plan, r, n) {
  const { w, h, pal } = plan, S = Math.min(w, h)
  const cx = w * (0.35 + r() * 0.3), cy = h * (0.35 + r() * 0.3)
  plan.marks.push({ kind: 'origin', x: cx, y: cy })
  for (let i = 0; i < 420; i++) {
    const a = r() * TAU
    const r0 = S * (0.03 + Math.pow(r(), 1.6) * 0.25)
    const len = S * (0.02 + Math.pow(r(), 2) * 0.32)
    const bend = n(Math.cos(a) * 2, Math.sin(a) * 2) * 0.35
    const pts = []
    for (let k = 0; k <= 12; k++) {
      const t = k / 12, rr = r0 + len * t, aa = a + bend * t * t
      pts.push([cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr])
    }
    const color = pick(r, [[pal.home, 4], [pal.ink, 2], [pal.homeLight, 2], [pal.opp, 1]])
    plan.strokes.push({ pts, color, width: S * (0.002 + Math.pow(r(), 3) * 0.012), cap: 'round' })
    if (i % 30 === 0) plan.guides.push({ kind: 'ray', x: cx, y: cy, a, r0, len })
  }
  plan.notes.push('420 rays · radius ~ U^1.6', 'curl from a noise ring')
}

function strata(plan, r, n) {
  const { w, h, pal } = plan, S = Math.min(w, h)
  const bands = 18 + Math.floor(r() * 10)
  const freq = 1.2 + r() * 2
  let prev = null
  for (let b = 0; b <= bands; b++) {
    const base = h * (0.06 + 0.88 * b / bands)
    const line = []
    for (let i = 0; i <= 120; i++) {
      const x = w * i / 120
      line.push([x, base + n(x / S * freq, b * 0.21) * S * 0.09 + n(x / S * freq * 4, b) * S * 0.012])
    }
    if (prev) {
      const color = pick(r, [[pal.home, 3], [pal.homeDeep, 2], [pal.homeLight, 2], [pal.ink, 1.4], [pal.paper, 2], [pal.opp, 0.5]])
      plan.strokes.push({ fill: true, pts: [...prev, ...line.slice().reverse()], color })
    }
    plan.strokes.push({ pts: line, color: pal.ink, width: S * 0.0018, alpha: 0.6 })
    plan.guides.push({ kind: 'contour', pts: line.filter((_, i) => i % 6 === 0) })
    prev = line
  }
  plan.notes.push(`${bands} strata · two octaves`, `frequency ${freq.toFixed(2)}`)
}

// ---------------------------------------------------------------- paint
function grain(ctx, w, h, seed, amount, dark) {
  const r = rng(seed ^ 0x9e3779b9)
  const img = ctx.getImageData(0, 0, w, h), d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const g = (r() - 0.5) * amount
    d[i] += g; d[i + 1] += g; d[i + 2] += g
  }
  ctx.putImageData(img, 0, 0)
}

function drawStroke(ctx, s, upto = 1) {
  ctx.globalAlpha = s.alpha ?? 1
  if (s.disc) {
    const rad = s.rad * Math.min(1, upto * 1.2)
    ctx.beginPath(); ctx.arc(s.x, s.y, rad, 0, TAU)
    ctx.fillStyle = s.color; ctx.fill()
    if (s.ring) { ctx.lineWidth = s.ringW; ctx.strokeStyle = s.ring; ctx.stroke() }
  } else if (s.fill) {
    ctx.beginPath(); s.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
    ctx.closePath(); ctx.globalAlpha = (s.alpha ?? 1) * Math.min(1, upto); ctx.fillStyle = s.color; ctx.fill()
  } else {
    const k = Math.max(2, Math.ceil(s.pts.length * upto))
    ctx.beginPath()
    for (let i = 0; i < k; i++) { const [x, y] = s.pts[i]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }
    ctx.lineWidth = s.width; ctx.lineCap = s.cap || 'round'; ctx.lineJoin = 'round'
    ctx.strokeStyle = s.color; ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function ground(ctx, plan, pass) {
  const { w, h, pal } = plan
  if (pass === 'uv') {
    ctx.fillStyle = pal.uvGround; ctx.fillRect(0, 0, w, h)
    const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7)
    g.addColorStop(0, ok(0.3, 0.12, 295, 0.55)); g.addColorStop(1, ok(0.1, 0.05, 290, 0))
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  } else {
    ctx.fillStyle = pal.paper; ctx.fillRect(0, 0, w, h)
  }
}

export function paint(ctx, plan, { pass = 'lit', progress = 1, texture = true } = {}) {
  const { w, h, pal } = plan, S = Math.min(w, h)
  ground(ctx, plan, pass)
  if (pass === 'lit') {
    const total = plan.strokes.length
    const upto = progress * total
    for (let i = 0; i < total && i < upto; i++) drawStroke(ctx, plan.strokes[i], Math.min(1, upto - i))
    if (texture && progress >= 1) grain(ctx, w, h, plan.seed, 14)
    return
  }
  // ---- UV underdrawing: the maths that made the work, in fluorescent ink
  ctx.save()
  ctx.lineCap = 'round'
  // ghost of the painting
  ctx.globalAlpha = 0.14
  for (const s of plan.strokes) drawStroke(ctx, { ...s, color: pal.uvDim, alpha: 0.14 })
  ctx.globalAlpha = 1
  const lw = Math.max(1, S * 0.0016)
  ctx.lineWidth = lw
  for (const gd of plan.guides) {
    if (gd.kind === 'arrow') {
      const x2 = gd.x + Math.cos(gd.a) * gd.len, y2 = gd.y + Math.sin(gd.a) * gd.len
      ctx.strokeStyle = pal.uvInk; ctx.beginPath(); ctx.moveTo(gd.x, gd.y); ctx.lineTo(x2, y2); ctx.stroke()
      const ah = gd.len * 0.3
      ctx.beginPath(); ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - Math.cos(gd.a - 0.5) * ah, y2 - Math.sin(gd.a - 0.5) * ah)
      ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(gd.a + 0.5) * ah, y2 - Math.sin(gd.a + 0.5) * ah); ctx.stroke()
    } else if (gd.kind === 'sag') {
      ctx.strokeStyle = gd.taut ? pal.uvRose : pal.uvCyan
      ctx.setLineDash([lw * 3, lw * 3]); ctx.beginPath(); ctx.moveTo(gd.x, gd.y); ctx.lineTo(gd.x, gd.y + gd.sag); ctx.stroke(); ctx.setLineDash([])
    } else if (gd.kind === 'plumb') {
      ctx.strokeStyle = pal.uvInk; ctx.beginPath(); ctx.arc(gd.x, gd.y, gd.rad, 0, TAU); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(gd.x - gd.rad * 1.6, gd.y); ctx.lineTo(gd.x + gd.rad * 1.6, gd.y); ctx.moveTo(gd.x, gd.y - gd.rad * 1.6); ctx.lineTo(gd.x, gd.y + gd.rad * 1.6); ctx.stroke()
    } else if (gd.kind === 'body') {
      ctx.strokeStyle = pal.uvCyan; ctx.beginPath(); ctx.arc(gd.x, gd.y, gd.rad, 0, TAU); ctx.stroke()
      ctx.strokeStyle = pal.uvInk; ctx.beginPath(); ctx.moveTo(gd.x, gd.y); ctx.lineTo(gd.x, gd.y - gd.rad - S * 0.03); ctx.stroke()
    } else if (gd.kind === 'ray') {
      ctx.strokeStyle = pal.uvCyan; ctx.setLineDash([lw * 2, lw * 4])
      ctx.beginPath(); ctx.arc(gd.x, gd.y, gd.r0, 0, TAU); ctx.stroke(); ctx.setLineDash([])
      ctx.strokeStyle = pal.uvInk; ctx.beginPath(); ctx.moveTo(gd.x, gd.y)
      ctx.lineTo(gd.x + Math.cos(gd.a) * (gd.r0 + gd.len), gd.y + Math.sin(gd.a) * (gd.r0 + gd.len)); ctx.stroke()
    } else if (gd.kind === 'contour') {
      ctx.strokeStyle = pal.uvInk
      for (const [x, y] of gd.pts) { ctx.beginPath(); ctx.arc(x, y, lw * 2.2, 0, TAU); ctx.stroke() }
      ctx.strokeStyle = pal.uvCyan; ctx.globalAlpha = 0.6; ctx.beginPath()
      gd.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.globalAlpha = 1
    }
  }
  for (const m of plan.marks) {
    ctx.strokeStyle = pal.uvRose; ctx.fillStyle = pal.uvRose
    const k = S * 0.012
    if (m.kind === 'seed') { ctx.beginPath(); ctx.arc(m.x, m.y, k * 0.35, 0, TAU); ctx.fill() }
    else { ctx.beginPath(); ctx.arc(m.x, m.y, k, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(m.x - k * 2, m.y); ctx.lineTo(m.x + k * 2, m.y); ctx.moveTo(m.x, m.y - k * 2); ctx.lineTo(m.x, m.y + k * 2); ctx.stroke() }
  }
  // registration marks + caption
  const pad = S * 0.035, tick = S * 0.03
  ctx.strokeStyle = pal.uvInk; ctx.lineWidth = lw
  for (const [x, y, sx, sy] of [[pad, pad, 1, 1], [w - pad, pad, -1, 1], [pad, h - pad, 1, -1], [w - pad, h - pad, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x, y + tick * sy); ctx.lineTo(x, y); ctx.lineTo(x + tick * sx, y); ctx.stroke()
  }
  ctx.fillStyle = pal.uvInk
  ctx.font = `${Math.round(S * 0.026)}px "JetBrains Mono", ui-monospace, monospace`
  ctx.fillText(`${plan.series} · seed 0x${plan.seed.toString(16)} · h${plan.hue}`, pad * 1.4, h - pad * 1.5)
  ctx.fillStyle = pal.uvCyan
  plan.notes.forEach((t, i) => ctx.fillText(t, pad * 1.4, pad * 1.4 + S * 0.03 * (i + 1)))
  ctx.restore()
  grain(ctx, w, h, plan.seed + 7, 18)
}

// Draw the work stroke by stroke. Returns a stop() function.
export function animate(canvas, plan, { duration = 7000, pass = 'lit', onDone } = {}) {
  const ctx = canvas.getContext('2d')
  let raf, t0
  const total = plan.strokes.length
  let drawn = 0
  ground(ctx, plan, pass)
  const ease = t => 1 - Math.pow(1 - t, 2.2)
  const tick = now => {
    t0 ??= now
    const p = Math.min(1, (now - t0) / duration)
    const target = Math.floor(ease(p) * total)
    for (; drawn < target; drawn++) drawStroke(ctx, plan.strokes[drawn])
    if (p < 1) raf = requestAnimationFrame(tick)
    else { paint(ctx, plan, { pass }); onDone?.() }
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}

// Convenience: render a work into a fresh canvas.
export function render(opts, pass = 'lit') {
  const plan = compose(opts)
  const c = document.createElement('canvas'); c.width = plan.w; c.height = plan.h
  paint(c.getContext('2d'), plan, { pass })
  return c
}
