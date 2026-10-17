// Silica Chorus: a 2D physics field (matter.js) of glass bodies over an ink plate.
// Ball lenses refract the plate live (inverted, minified, like a crystal ball);
// specimens are pre-rendered glass cut-outs; product domes keep their logos upright.
//
//   import { mountChorus } from './interactive/chorus.js'
//   const chorus = await mountChorus(canvas, { base: './' })
//   chorus.drop('lens')        // or 'specimen', 'product'
//   chorus.destroy()
//
// Loads matter-js lazily from jsDelivr (pinned). Pauses when off screen.
// prefers-reduced-motion: settles the simulation off-screen and paints one still frame.
// opts.settle = N pre-runs N steps (stills, screenshots); opts.wash = 0..1 fades the plate.

const MATTER = 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js'

const SPECIMENS = ['diatom-02', 'diatom-03', 'diatom-04', 'diatom-05', 'diatom-06', 'radiolar-01', 'radiolar-02']
const PRODUCTS = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor']

function loadScript (src) {
  if (window.Matter) return Promise.resolve(window.Matter)
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src; s.async = true
    s.onload = () => resolve(window.Matter); s.onerror = reject
    document.head.appendChild(s)
  })
}
function loadImg (src) {
  return new Promise((resolve, reject) => {
    const i = new Image(); i.decoding = 'async'
    i.onload = () => resolve(i); i.onerror = reject; i.src = src
  })
}

export async function mountChorus (canvas, opts = {}) {
  const base = (opts.base || '.').replace(/\/$/, '')
  const reduced = opts.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches
  const [Matter, plate, ...imgs] = await Promise.all([
    loadScript(MATTER),
    loadImg(`${base}/${opts.plate || 'extras/plate-spumellaria.webp'}`),
    ...SPECIMENS.map(s => loadImg(`${base}/specimens/${s}-glass.webp`)),
    ...PRODUCTS.map(p => loadImg(`${base}/products/${p}-600.webp`))
  ])
  const specImgs = imgs.slice(0, SPECIMENS.length)
  const prodImgs = imgs.slice(SPECIMENS.length)
  const { Engine, Bodies, Composite, Body, Mouse, MouseConstraint, Events } = Matter

  const ctx = canvas.getContext('2d')
  const engine = Engine.create({ gravity: { y: 1 } })
  const world = engine.world
  let W = 0, H = 0, dpr = 1, walls = []
  const plateCanvas = document.createElement('canvas')
  const pctx = plateCanvas.getContext('2d')

  function size () {
    const r = canvas.getBoundingClientRect()
    dpr = Math.min(2, window.devicePixelRatio || 1)
    W = Math.max(1, r.width); H = Math.max(1, r.height)
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
    // plate drawn once as "cover"
    plateCanvas.width = canvas.width; plateCanvas.height = canvas.height
    const s = Math.max(canvas.width / plate.width, canvas.height / plate.height)
    const pw = plate.width * s, ph = plate.height * s
    pctx.drawImage(plate, (canvas.width - pw) / 2, (canvas.height - ph) / 2, pw, ph)
    // wash the plate back so the glass carries the contrast (0 = full-strength ink)
    pctx.fillStyle = `rgba(247,245,234,${opts.wash ?? 0.45})`; pctx.fillRect(0, 0, plateCanvas.width, plateCanvas.height)
    Composite.remove(world, walls)
    const t = 200
    walls = [
      Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, H / 2, t, H * 4, { isStatic: true }),
      Bodies.rectangle(W + t / 2, H / 2, t, H * 4, { isStatic: true })
    ]
    Composite.add(world, walls)
    if (mouse) Mouse.setScale(mouse, { x: 1, y: 1 })
  }

  const unit = () => Math.min(W, H)
  let n = 0
  function drop (kind = 'lens', x, y) {
    const u = unit()
    x ??= W * (0.2 + Math.random() * 0.6); y ??= -u * 0.3
    let body
    if (kind === 'lens') {
      const r = u * (0.05 + Math.random() * 0.09)
      body = Bodies.circle(x, y, r, { restitution: 0.35, friction: 0.02, density: 0.003 })
      body.plugin = { kind, r }
    } else if (kind === 'specimen') {
      const img = specImgs[n++ % specImgs.length]
      const r = u * (0.07 + Math.random() * 0.05)
      body = Bodies.circle(x, y, r * 0.86, { restitution: 0.2, friction: 0.08, density: 0.0015 })
      body.plugin = { kind, r, img }
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08)
    } else {
      const i = n++ % prodImgs.length
      const r = u * 0.1
      body = Bodies.circle(x, y, r, { restitution: 0.25, friction: 0.05, density: 0.004, inertia: Infinity })
      body.plugin = { kind, r, img: prodImgs[i], id: PRODUCTS[i] }
    }
    Composite.add(world, body)
    // keep the field calm: a chorus, not a crowd
    const live = Composite.allBodies(world).filter(b => !b.isStatic)
    if (live.length > 26) Composite.remove(world, live[0])
    return body
  }

  // ---- drawing
  function shadow (x, y, r) {
    const g = ctx.createRadialGradient(x + r * 0.25, y + r * 0.38, r * 0.2, x + r * 0.25, y + r * 0.38, r * 1.15)
    g.addColorStop(0, 'rgba(9,23,16,.22)'); g.addColorStop(1, 'rgba(9,23,16,0)')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + r * 0.25, y + r * 0.38, r * 1.15, 0, Math.PI * 2); ctx.fill()
  }
  function caustic (x, y, r) {
    const cx = x + r * 0.42, cy = y + r * 0.62
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.42)
    g.addColorStop(0, 'rgba(214,255,200,.95)'); g.addColorStop(0.25, 'rgba(160,240,143,.55)'); g.addColorStop(1, 'rgba(160,240,143,0)')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2); ctx.fill()
  }
  function lens (x, y, r) {
    ctx.save()
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip()
    // crystal-ball image: the plate behind, inverted and minified around the centre
    const k = 0.62
    ctx.save(); ctx.translate(x, y); ctx.scale(-k, -k)
    ctx.drawImage(plateCanvas, -x, -y, W, H)
    ctx.restore()
    // faint paper wash so the inverted world reads as "inside glass"
    ctx.fillStyle = 'rgba(247,245,234,.12)'; ctx.fillRect(x - r, y - r, r * 2, r * 2)
    const rim = ctx.createRadialGradient(x, y, r * 0.55, x, y, r)
    rim.addColorStop(0, 'rgba(209,242,215,0)'); rim.addColorStop(0.82, 'rgba(56,158,61,.18)'); rim.addColorStop(1, 'rgba(0,94,38,.65)')
    ctx.fillStyle = rim; ctx.fillRect(x - r, y - r, r * 2, r * 2)
    // softbox reflection + pinpoint highlight
    ctx.fillStyle = 'rgba(255,255,255,.55)'
    ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.42, r * 0.28, r * 0.12, -0.6, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.95)'
    ctx.beginPath(); ctx.arc(x - r * 0.36, y - r * 0.44, Math.max(1.2, r * 0.045), 0, Math.PI * 2); ctx.fill()
    ctx.restore()
    ctx.strokeStyle = 'rgba(9,23,16,.35)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(x, y, r - 0.5, 0, Math.PI * 2); ctx.stroke()
  }
  function dome (b) {
    const { x, y } = b.position, { r, img } = b.plugin
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip()
    const s = r / (0.36 * img.width)           // dome radius in the render is 0.36 of the image
    ctx.drawImage(img, x - img.width * s / 2, y - img.height * s / 2, img.width * s, img.height * s)
    ctx.restore()
  }
  function frame () {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(plateCanvas, 0, 0)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const bodies = Composite.allBodies(world).filter(b => !b.isStatic)
    for (const b of bodies) shadow(b.position.x, b.position.y, b.plugin.r)
    for (const b of bodies) if (b.plugin.kind === 'lens') caustic(b.position.x, b.position.y, b.plugin.r)
    for (const b of bodies) {
      const { x, y } = b.position, p = b.plugin
      if (p.kind === 'lens') lens(x, y, p.r)
      else if (p.kind === 'product') dome(b)
      else {
        const s = (p.r * 2) / Math.max(p.img.width, p.img.height)
        ctx.save(); ctx.translate(x, y); ctx.rotate(b.angle)
        ctx.drawImage(p.img, -p.img.width * s / 2, -p.img.height * s / 2, p.img.width * s, p.img.height * s)
        ctx.restore()
      }
    }
  }

  // ---- input
  let mouse = Mouse.create(canvas)
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.12, render: { visible: false } } })
  Composite.add(world, mc)
  // wheel scrolling must keep working over the canvas
  mouse.element.removeEventListener('wheel', mouse.mousewheel)
  mouse.element.removeEventListener('mousewheel', mouse.mousewheel)
  mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel)
  let downAt = null
  Events.on(mc, 'mousedown', e => { downAt = { ...e.mouse.position, t: performance.now(), hit: !!mc.body } })
  Events.on(mc, 'mouseup', e => {
    if (!downAt) return
    const p = e.mouse.position
    if (!downAt.hit && Math.hypot(p.x - downAt.x, p.y - downAt.y) < 6) drop('lens', p.x, p.y - unit() * 0.05)
    downAt = null
  })

  size()
  // opening chorus: products first, then specimens, then lenses
  const seq = [...PRODUCTS.map(() => 'product'), 'specimen', 'lens', 'specimen', 'lens', 'specimen', 'lens', 'specimen', 'lens', 'lens']
  let raf = 0, visible = true, last = performance.now()
  const ro = new ResizeObserver(() => { size(); if (reduced) frame() })
  ro.observe(canvas)

  if (reduced || opts.settle) {
    seq.forEach((k, i) => drop(k, W * (0.12 + ((i * 0.37) % 0.76)), H * 0.2 - i * 40))
    for (let i = 0; i < (opts.settle || 600); i++) Engine.update(engine, 1000 / 60)
    frame()
  }
  if (!reduced) {
    if (!opts.settle) seq.forEach((k, i) => setTimeout(() => drop(k), 160 * i))
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { last = performance.now(); loop() } })
    io.observe(canvas)
    function loop () {
      cancelAnimationFrame(raf)
      if (!visible) return
      const now = performance.now(), dt = Math.min(1000 / 30, now - last); last = now
      Engine.update(engine, dt)
      frame()
      raf = requestAnimationFrame(loop)
    }
    loop()
  }
  return {
    drop,
    engine,
    destroy () { cancelAnimationFrame(raf); ro.disconnect(); Composite.clear(world, false); Engine.clear(engine) }
  }
}
