// The field: horizontal lines in the manner of Bridget Riley's "Current".
// The name is not drawn; it appears where the lines shift half a period and
// thicken. The cursor works as a lens. Each real event sends one pulse.

const TAU = Math.PI * 2

export function createField({ canvas, host, name, reduced }) {
  const ctx = canvas.getContext('2d')
  const mask = document.createElement('canvas')
  const off = document.createElement('canvas')
  const mctx = mask.getContext('2d')
  const octx = off.getContext('2d')

  let W = 0, H = 0, dpr = 1, gap = 7, step = 8
  let ink = '#282019', accent = '#006972'
  const lens = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, s: 0, t: 0 }
  const ripples = []
  let raf = 0, visible = true, ready = false

  function colours() {
    const cs = getComputedStyle(host)
    ink = cs.getPropertyValue('--field-ink').trim() || ink
    accent = cs.getPropertyValue('--accent').trim() || accent
  }

  function resize() {
    const r = host.getBoundingClientRect()
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height))
    // Keep the backing store under ~9 MP so large screens stay smooth.
    dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(9e6 / (W * H)))
    for (const c of [canvas, mask, off]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr) }
    gap = Math.max(6, Math.min(11, W / 190))
    step = Math.max(6, Math.round(gap))
    colours()
    drawMask(r)
    draw()
  }

  function drawMask(hostRect) {
    mctx.setTransform(1, 0, 0, 1, 0, 0)
    mctx.clearRect(0, 0, mask.width, mask.height)
    mctx.fillStyle = '#000'
    const s = parseFloat(getComputedStyle(name).getPropertyValue('--s')) || 1
    for (const ln of name.querySelectorAll('.ln')) {
      const cs = getComputedStyle(ln)
      const fs = parseFloat(cs.fontSize)
      const lh = parseFloat(cs.lineHeight) || fs
      mctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`
      mctx.textAlign = 'center'
      mctx.textBaseline = 'alphabetic'
      if ('letterSpacing' in mctx) mctx.letterSpacing = cs.letterSpacing
      const text = ln.textContent
      const m = mctx.measureText(text)
      const fa = m.fontBoundingBoxAscent ?? fs * 0.9
      const fd = m.fontBoundingBoxDescent ?? fs * 0.25
      const r = ln.getBoundingClientRect()
      const cx = r.left + r.width / 2 - hostRect.left
      const base = r.top - hostRect.top + ((lh - (fa + fd)) / 2 + fa) * s
      mctx.setTransform(dpr, 0, 0, dpr * s, cx * dpr, base * dpr)
      mctx.fillText(text, 0, 0)
    }
    mctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  function y(x, y0) {
    // Base undulation: amplitude swells toward the middle of the field.
    const band = Math.sin(Math.PI * Math.min(1, y0 / Math.max(1, Math.min(H, 1400))))
    let v = y0 + gap * 0.85 * (0.25 + 0.75 * band * band) * Math.sin(x * (TAU / 420) + y0 * 0.018)
    if (lens.s > 0.001) {
      const dx = x - lens.x, dy = y0 - lens.y
      const f = Math.exp(-(dx * dx + dy * dy) / (2 * 120 * 120))
      v += dy * 0.6 * f * lens.s
    }
    for (const r of ripples) {
      const dx = x - r.x, dy = y0 - r.y
      const u = (Math.sqrt(dx * dx + dy * dy) - r.rad) / 46
      if (u > -3 && u < 3) v += r.amp * Math.exp(-u * u) * Math.sin(u * 2.2)
    }
    return v
  }

  function strokeLines(c, offset, width) {
    c.lineWidth = width
    c.beginPath()
    const n = Math.ceil(H / gap) + 2
    for (let i = -1; i < n; i++) {
      const y0 = i * gap + offset
      c.moveTo(-step, y(-step, y0))
      for (let x = 0; x <= W + step; x += step) c.lineTo(x, y(x, y0))
    }
    c.stroke()
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineCap = 'butt'
    ctx.strokeStyle = ink
    strokeLines(ctx, 0, gap * 0.26)

    // One cool line: the one under the cursor.
    if (lens.s > 0.05) {
      const i = Math.round(lens.y / gap)
      ctx.strokeStyle = accent
      ctx.globalAlpha = Math.min(1, lens.s * 1.4)
      ctx.lineWidth = gap * 0.42
      ctx.beginPath()
      const y0 = i * gap
      ctx.moveTo(-step, y(-step, y0))
      for (let x = 0; x <= W + step; x += step) ctx.lineTo(x, y(x, y0))
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // Cut the letters out, then fill them with the shifted, heavier set.
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.drawImage(mask, 0, 0)
    ctx.globalCompositeOperation = 'source-over'

    octx.setTransform(1, 0, 0, 1, 0, 0)
    octx.globalCompositeOperation = 'source-over'
    octx.clearRect(0, 0, off.width, off.height)
    octx.setTransform(dpr, 0, 0, dpr, 0, 0)
    octx.strokeStyle = ink
    strokeLines(octx, gap / 2, gap * 0.66)
    octx.setTransform(1, 0, 0, 1, 0, 0)
    octx.globalCompositeOperation = 'destination-in'
    octx.drawImage(mask, 0, 0)
    ctx.drawImage(off, 0, 0)
  }

  let last = 0
  function frame(t) {
    raf = 0
    const dt = Math.min(64, last ? t - last : 16); last = t
    const k = 1 - Math.pow(0.82, dt / 16)
    lens.x += (lens.tx - lens.x) * k
    lens.y += (lens.ty - lens.y) * k
    lens.s += (lens.t - lens.s) * k * 0.7
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]
      r.rad += dt * 0.55
      r.amp = r.amp0 * Math.max(0, 1 - r.rad / r.max)
      if (r.amp <= 0.05) ripples.splice(i, 1)
    }
    draw()
    const moving = Math.abs(lens.tx - lens.x) > 0.3 || Math.abs(lens.ty - lens.y) > 0.3 || Math.abs(lens.t - lens.s) > 0.003
    if (visible && (moving || ripples.length)) raf = requestAnimationFrame(frame)
    else last = 0
  }
  const kick = () => { if (!raf && visible && ready) raf = requestAnimationFrame(frame) }

  if (!reduced) {
    host.addEventListener('pointermove', e => {
      const r = host.getBoundingClientRect()
      lens.tx = e.clientX - r.left; lens.ty = e.clientY - r.top
      if (lens.s < 0.01) { lens.x = lens.tx; lens.y = lens.ty }
      lens.t = 1
      kick()
    }, { passive: true })
    host.addEventListener('pointerleave', () => { lens.t = 0; kick() })
  }

  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick() }).observe(host)

  let rt = 0
  const ro = new ResizeObserver(() => { cancelAnimationFrame(rt); rt = requestAnimationFrame(() => ready && resize()) })

  return {
    start() { ready = true; resize(); ro.observe(host) },
    redraw() { if (ready) resize() },
    pulse(x, yy) {
      if (reduced || !ready || !visible) return
      ripples.push({ x, y: yy, rad: 0, amp0: gap * 0.9, amp: gap * 0.9, max: Math.hypot(W, H) * 0.9 })
      if (ripples.length > 4) ripples.shift()
      kick()
    },
  }
}
