/*
 * Specimen Deck — a DOM card stack with real spring physics. No dependencies.
 * Albretsen AS / "Infrared Fable" asset kit (design 36).
 *
 *   import { createDeck } from './specimen-deck.js'
 *   const deck = createDeck(document.querySelector('.deck'), [
 *     { front: 'products/plate-mcp-emails.webp', alt: 'MCP Emails', back: '<h3>MCP Emails</h3><p>…</p>' },
 *   ], { width: 360, ratio: 1.25 })
 *
 * Gestures
 *   drag the top card     : it follows the pointer on a spring and tilts with horizontal tension
 *   fling / drag far      : the card flies out past the horizon, then springs back to the bottom of the pile
 *   tap / click / Enter   : flips the card (rotateY on a spring) to show its back
 *   ArrowLeft / ArrowRight: send the top card away (keyboard path)
 *
 * Physics: every card owns a set of damped springs (x, y, rotate, scale, flip, lift) integrated with
 * semi-implicit Euler in one requestAnimationFrame loop. Stiffness/damping are per channel so the
 * card position feels heavy and the flip feels snappy. prefers-reduced-motion => critically damped, fast.
 */

const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

class Spring {
  constructor(value = 0, k = 170, c = 22) { this.v = value; this.t = value; this.vel = 0; this.k = k; this.c = c }
  step(dt) {
    const a = -this.k * (this.v - this.t) - this.c * this.vel
    this.vel += a * dt
    this.v += this.vel * dt
  }
  get idle() { return Math.abs(this.v - this.t) < 0.001 && Math.abs(this.vel) < 0.001 }
  snap(v) { this.v = this.t = v; this.vel = 0 }
}

const CSS = `
.sd { position:relative; perspective:1400px; touch-action:pan-y; user-select:none; -webkit-user-select:none; }
.sd-card { position:absolute; left:50%; top:0; transform-style:preserve-3d; cursor:grab; will-change:transform; outline:none; }
.sd-card:active { cursor:grabbing; }
.sd-card:focus-visible .sd-face { box-shadow:0 0 0 4px #fff1e2, 0 0 0 8px #e8287f, var(--sd-shadow); }
.sd-face { position:absolute; inset:0; border-radius:14px; overflow:hidden; backface-visibility:hidden; -webkit-backface-visibility:hidden;
  box-shadow:var(--sd-shadow); background:#fff1e2; }
.sd-face img { width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; }
.sd-back { transform:rotateY(180deg); padding:28px; color:#170733; display:flex; flex-direction:column; justify-content:flex-end;
  background:radial-gradient(120% 80% at 50% 0%, #ffb36b 0%, #e8287f 45%, #4a1a8c 100%); }
.sd-back > * { position:relative; }
.sd-back::before { content:''; position:absolute; inset:14px; border:1.5px solid rgba(255,241,226,.7); border-radius:8px; }
`

export function createDeck(root, cards, opts = {}) {
  const W = opts.width || 340
  const H = Math.round(W * (opts.ratio || 1.25))
  const flingAt = opts.flingDistance || W * 0.42
  if (!document.getElementById('sd-style')) {
    const st = document.createElement('style'); st.id = 'sd-style'; st.textContent = CSS; document.head.appendChild(st)
  }
  root.classList.add('sd')
  root.style.height = `${H + 60}px`
  root.setAttribute('role', 'list')

  const state = cards.map((c, i) => {
    const el = document.createElement('div')
    el.className = 'sd-card'
    el.style.width = `${W}px`; el.style.height = `${H}px`; el.style.marginLeft = `${-W / 2}px`
    el.tabIndex = 0
    el.setAttribute('role', 'listitem')
    el.setAttribute('aria-label', `${c.alt || 'Card'} — press Enter to flip, arrow keys to shuffle`)
    el.innerHTML = `<div class="sd-face sd-front"><img src="${c.front}" alt="${c.alt || ''}" draggable="false"></div>
      <div class="sd-face sd-back">${c.back || ''}</div>`
    el.style.setProperty('--sd-shadow', '0 30px 60px -20px rgba(23,7,51,.6), 0 2px 0 rgba(23,7,51,.4)')
    root.appendChild(el)
    const c2 = 2 * Math.sqrt(600) // critical damping for reduced motion
    return {
      el, data: c,
      x: new Spring(0, REDUCED ? 600 : 120, REDUCED ? c2 : 16),
      y: new Spring(0, REDUCED ? 600 : 120, REDUCED ? c2 : 16),
      r: new Spring(0, REDUCED ? 600 : 140, REDUCED ? c2 : 14),
      s: new Spring(1, REDUCED ? 600 : 220, REDUCED ? c2 : 20),
      f: new Spring(0, REDUCED ? 600 : 90, REDUCED ? c2 : 13),
      lift: new Spring(0, 260, 24),
      jitter: [-4, 5, -7, 3, 6, -3][i % 6],   // fixed per-card resting tilt: a hand-placed pile, not a grid
      flipped: false
    }
  })

  let order = state.map((_, i) => i)       // order[0] = top card
  const place = (immediate) => {
    order.forEach((idx, depth) => {
      const s = state[idx]
      s.el.style.zIndex = String(100 - depth)
      const t = { x: depth * 6, y: depth * 14, r: depth === 0 ? 0 : s.jitter, s: 1 - depth * 0.045 }
      if (immediate) { s.x.snap(t.x); s.y.snap(t.y); s.r.snap(t.r); s.s.snap(t.s) }
      else { s.x.t = t.x; s.y.t = t.y; s.r.t = t.r; s.s.t = t.s }
      s.el.style.pointerEvents = depth === 0 ? 'auto' : 'none'
      s.el.tabIndex = depth === 0 ? 0 : -1
      s.el.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true')
    })
  }
  place(true)

  // --- drag
  let drag = null
  const top = () => state[order[0]]
  const onDown = (e) => {
    const s = top(); if (e.currentTarget !== s.el) return
    s.el.setPointerCapture(e.pointerId)
    drag = { s, id: e.pointerId, x0: e.clientX, y0: e.clientY, last: [{ x: e.clientX, y: e.clientY, t: performance.now() }], moved: 0 }
    s.lift.t = 1
  }
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy))
    const s = drag.s
    // the spring target follows the pointer; the card lags behind = felt weight
    s.x.t = dx; s.y.t = dy * 0.6
    s.r.t = dx * 0.06 + (dy * dx) * 0.0001
    drag.last.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (drag.last.length > 5) drag.last.shift()
  }
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return
    const s = drag.s
    s.lift.t = 0
    const a = drag.last[0], b = drag.last[drag.last.length - 1]
    const vx = (b.x - a.x) / Math.max(16, b.t - a.t) * 1000
    const dx = s.x.t
    if (drag.moved < 6) { flip(s) }
    else if (Math.abs(dx) > flingAt || Math.abs(vx) > 900) { send(Math.sign(dx || vx), vx) }
    else { place(false) }
    drag = null
  }
  const flip = (s) => {
    s.flipped = !s.flipped
    s.f.t = s.flipped ? 180 : 0
    s.f.vel += s.flipped ? 400 : -400
    opts.onFlip && opts.onFlip(s.data, s.flipped)
  }
  const send = (dir = 1, vx = 0) => {
    const s = top()
    s.x.vel += vx * 0.5
    s.x.t = dir * (W * 1.4); s.y.t = -40; s.r.t = dir * 24
    if (s.flipped) { s.flipped = false; s.f.t = 0 }
    setTimeout(() => { order.push(order.shift()); place(false); opts.onChange && opts.onChange(top().data) }, REDUCED ? 0 : 260)
  }

  state.forEach(s => {
    s.el.addEventListener('pointerdown', onDown)
    s.el.addEventListener('pointermove', onMove)
    s.el.addEventListener('pointerup', onUp)
    s.el.addEventListener('pointercancel', onUp)
    s.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(s) }
      if (e.key === 'ArrowRight') { e.preventDefault(); send(1); requestAnimationFrame(() => top().el.focus()) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); send(-1); requestAnimationFrame(() => top().el.focus()) }
    })
  })

  // --- loop
  let raf = 0, prev = performance.now()
  const tick = (now) => {
    const dt = Math.min(1 / 30, (now - prev) / 1000); prev = now
    for (const s of state) {
      for (const sp of [s.x, s.y, s.r, s.s, s.f, s.lift]) {
        // sub-step for stability at high stiffness
        sp.step(dt / 2); sp.step(dt / 2)
      }
      const lift = s.lift.v
      s.el.style.transform =
        `translate3d(${s.x.v.toFixed(2)}px, ${(s.y.v - lift * 10).toFixed(2)}px, ${(lift * 60).toFixed(1)}px) ` +
        `rotateZ(${s.r.v.toFixed(2)}deg) rotateY(${s.f.v.toFixed(2)}deg) scale(${(s.s.v + lift * 0.03).toFixed(4)})`
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  return {
    next: () => send(1),
    prev: () => { order.unshift(order.pop()); place(false) },
    flipTop: () => flip(top()),
    destroy: () => { cancelAnimationFrame(raf); root.innerHTML = '' },
  }
}
