// cover-stack.js — design 84 centrepiece: a stack of magazine "issues"
// (one per product) you can drag, throw, flip and re-stack. Pure DOM +
// a tiny semi-implicit-Euler spring solver. No dependencies.
//
//   <div class="stack">
//     <article class="issue"><div class="face front">…</div><div class="face back">…</div></article>
//     …
//   </div>
//   import { createStack } from './cover-stack.js'
//   const stack = createStack(document.querySelector('.stack'), { onChange: i => … })
//
// Interactions: drag the top issue; release past ~30% of its width (or a fast
// flick) throws it to the bottom of the pile. Click/tap or Enter flips it.
// Arrow keys: ←/→ cycle, Space/Enter flip. Reduced motion: no springs, just jumps.
//
// Spring constants (tuned by feel, after animations.dev + Motion defaults):
//   position: stiffness 260, damping 24 (slightly under-damped: a single small overshoot)
//   rotation: stiffness 180, damping 18
//   flip:     stiffness 140, damping 16 (heavier, like card stock)

const CFG = { k: 260, c: 24, kr: 180, cr: 18, kf: 140, cf: 16, throwFrac: 0.3, throwV: 900 }

class Spring {
  constructor(v = 0, k = 200, c = 20) { this.x = v; this.v = 0; this.t = v; this.k = k; this.c = c }
  step(dt) { const a = -this.k * (this.x - this.t) - this.c * this.v; this.v += a * dt; this.x += this.v * dt }
  get rest() { return Math.abs(this.x - this.t) < 0.01 && Math.abs(this.v) < 0.01 }
  snap(v) { this.x = this.t = v; this.v = 0 }
}

export function createStack(root, opts = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const els = [...root.querySelectorAll(':scope > .issue')]
  root.style.position ||= 'relative'
  root.tabIndex = 0
  root.setAttribute('role', 'group')
  root.setAttribute('aria-roledescription', 'stack of cards')
  const seed = (i) => ((Math.sin(i * 91.7) * 43758.5453) % 1 + 1) % 1
  const cards = els.map((el, i) => ({
    el, id: i,
    x: new Spring(0, CFG.k, CFG.c), y: new Spring(0, CFG.k, CFG.c),
    r: new Spring(0, CFG.kr, CFG.cr), s: new Spring(1, CFG.k, CFG.c), f: new Spring(0, CFG.kf, CFG.cf),
    jitter: (seed(i + 1) - 0.5) * 7, flipped: false,
  }))
  let order = cards.map((_, i) => i) // order[0] = top
  let drag = null, raf = 0, last = 0

  function layout() {
    order.forEach((ci, depth) => {
      const c = cards[ci]
      c.el.style.zIndex = String(cards.length - depth)
      c.el.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true')
      c.el.inert = depth !== 0
      if (drag && drag.c === c) return
      c.x.t = depth * 10; c.y.t = depth * -12
      c.r.t = depth === 0 ? 0 : c.jitter
      c.s.t = 1 - depth * 0.035
      if (depth !== 0 && c.flipped) { c.flipped = false; c.f.t = 0 }
    })
    kick()
  }

  function render(c) {
    c.el.style.transform = `translate3d(${c.x.x}px, ${c.y.x}px, 0) rotate(${c.r.x}deg) scale(${c.s.x}) rotateY(${c.f.x * 180}deg)`
  }
  function tick(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60); last = now
    let moving = false
    for (const c of cards) {
      for (const s of [c.x, c.y, c.r, c.s, c.f]) { if (reduce) s.snap(s.t); else s.step(dt); if (!s.rest) moving = true }
      render(c)
    }
    raf = moving || drag ? requestAnimationFrame(tick) : 0
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) } }

  function next(dir = 1) {
    const top = cards[order[0]]
    if (dir > 0) {
      // throw the top card off, then tuck it under the pile
      top.x.v += 2600; top.r.v += 300
      order.push(order.shift())
    } else {
      order.unshift(order.pop())
      const c = cards[order[0]]; c.x.x = -root.offsetWidth * 0.9; c.r.x = -14
    }
    layout(); opts.onChange?.(order[0])
  }
  function flip() {
    const c = cards[order[0]]; c.flipped = !c.flipped; c.f.t = c.flipped ? 1 : 0
    c.el.classList.toggle('is-flipped', c.flipped); kick(); opts.onFlip?.(order[0], c.flipped)
  }

  root.addEventListener('pointerdown', e => {
    const c = cards[order[0]]
    if (!c.el.contains(e.target) || e.target.closest('a, button')) return
    drag = { c, x0: e.clientX, y0: e.clientY, bx: c.x.x, by: c.y.x, lx: e.clientX, lt: performance.now(), vx: 0, moved: false }
    c.el.setPointerCapture(e.pointerId); c.s.t = 1.03; kick()
  })
  root.addEventListener('pointermove', e => {
    if (!drag) return
    const { c } = drag, dx = e.clientX - drag.x0, dy = e.clientY - drag.y0
    if (Math.hypot(dx, dy) > 6) drag.moved = true
    const now = performance.now(); drag.vx = (e.clientX - drag.lx) / Math.max(1, now - drag.lt) * 1000; drag.lx = e.clientX; drag.lt = now
    c.x.snap(drag.bx + dx); c.y.snap(drag.by + dy * 0.6); c.r.t = dx * 0.05; c.r.x += (c.r.t - c.r.x) * 0.3
  })
  const end = () => {
    if (!drag) return
    const { c, moved, vx } = drag; drag = null
    c.x.v = vx
    if (!moved) flip()
    else if (Math.abs(c.x.x) > root.offsetWidth * CFG.throwFrac || Math.abs(vx) > CFG.throwV) { order.push(order.shift()); opts.onChange?.(order[0]) }
    layout()
  }
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end)
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { next(1); e.preventDefault() }
    else if (e.key === 'ArrowLeft') { next(-1); e.preventDefault() }
    else if (e.key === 'Enter' || e.key === ' ') { flip(); e.preventDefault() }
  })
  // entrance: deal the pile in from below
  cards.forEach((c, i) => { c.y.x = 340 + i * 60; c.r.x = (i % 2 ? 1 : -1) * 18; c.s.x = 0.9 })
  layout()
  return { next, prev: () => next(-1), flip, get top() { return order[0] } }
}
