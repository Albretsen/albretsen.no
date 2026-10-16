// Escape Vector motion kit. Zero dependencies, ES module.
// import { Spring, decode, zeroG, burn, drift } from './assets/motion.js'
//
// Signature animations (see ASSETS.md for references):
//   1. decode()  ENTRANCE    "Signal acquisition": text arrives as noise and locks in left to right,
//                           with the locking edge glowing burn red. After igloo.inc / cruip text scramble.
//   2. zeroG()   HOVER       "Zero-G": a card is released from gravity. It tilts toward the cursor and rises in Z
//                           on a hand-rolled spring, overshooting once like a body in free fall. After paco.me's
//                           physical micro-interactions and bruno-simon.com's spring-driven everything.
//   3. burn()    TRANSITION  "Escape burn": an element leaves along a vector (translate + skew + motion streak),
//                           the next arrives from the opposite vector on a spring. For section/page changes.
//   4. drift()   IDLE        "Station keeping": tiny perpetual float on two incommensurate sine periods,
//                           so stickers and cut-outs never sit perfectly still.
// All of them respect prefers-reduced-motion.

export const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/* ------------------------------------------------------------------ spring --
   Damped harmonic oscillator, semi-implicit Euler with fixed 1/240 s sub-steps
   (stable at high stiffness). F = -k(x - target) - c v ; a = F / m           */
export class Spring {
  constructor(value = 0, { stiffness = 170, damping = 18, mass = 1, precision = 0.001 } = {}) {
    this.value = value; this.target = value; this.velocity = 0
    Object.assign(this, { stiffness, damping, mass, precision })
  }
  set(v) { this.value = this.target = v; this.velocity = 0 }
  get resting() { return Math.abs(this.velocity) < this.precision && Math.abs(this.target - this.value) < this.precision }
  step(dt) {
    const h = 1 / 240
    for (let t = 0; t < dt; t += h) {
      const s = Math.min(h, dt - t)
      const a = (-this.stiffness * (this.value - this.target) - this.damping * this.velocity) / this.mass
      this.velocity += a * s
      this.value += this.velocity * s
    }
    if (this.resting) { this.value = this.target; this.velocity = 0 }
    return this.value
  }
}

/* A shared rAF loop that sleeps when every registered spring is at rest. */
const jobs = new Set(); let raf = 0, last = 0
function tick(t) {
  const dt = Math.min(0.064, (t - (last || t)) / 1000); last = t
  for (const j of jobs) if (j(dt) === false) jobs.delete(j)
  raf = jobs.size ? requestAnimationFrame(tick) : (last = 0, 0)
}
export function loop(fn) { jobs.add(fn); if (!raf) raf = requestAnimationFrame(tick); return () => jobs.delete(fn) }

/* ------------------------------------------------------------------ decode --
   decode(el, { duration, glyphs, delay }) -> Promise
   Wraps characters in spans; unresolved chars cycle through glyphs.         */
const GLYPHS = '01<>/\\|_-+=*#%&$@ABCDEFGHJKLMNPQRSTUVWXYZΛΔ∆∇◊'
export function decode(el, { duration = 900, delay = 0, glyphs = GLYPHS, stagger = 0.55 } = {}) {
  const text = el.dataset.text ?? el.textContent
  el.dataset.text = text
  el.setAttribute('aria-label', text)
  if (reduced()) { el.textContent = text; return Promise.resolve() }
  const chars = [...text]
  el.textContent = ''
  const spans = chars.map((c) => { const s = document.createElement('span'); s.setAttribute('aria-hidden', 'true'); s.className = 'ev-ch'; s.textContent = c === ' ' ? ' ' : glyphs[(Math.random() * glyphs.length) | 0]; el.append(s); return s })
  // each char resolves at a time weighted left to right, with jitter
  const at = chars.map((_, i) => (i / Math.max(1, chars.length - 1)) * stagger + Math.random() * (1 - stagger))
  const t0 = performance.now() + delay
  return new Promise((res) => {
    let lastSwap = 0
    loop(() => {
      const now = performance.now(); if (now < t0) return true
      const p = (now - t0) / duration
      const swap = now - lastSwap > 42; if (swap) lastSwap = now
      let done = true
      spans.forEach((s, i) => {
        if (chars[i] === ' ') return
        if (p >= at[i]) { if (s.dataset.locked !== '1') { s.textContent = chars[i]; s.dataset.locked = '1'; s.classList.add('ev-lock') } }
        else { done = false; if (swap) s.textContent = glyphs[(Math.random() * glyphs.length) | 0] }
      })
      if (done) { el.textContent = text; res(); return false }
      return true
    })
  })
}

/* ------------------------------------------------------------------- zeroG --
   zeroG(el, { tilt, lift }) : hover released from gravity.                  */
export function zeroG(el, { tilt = 9, lift = 36, stiffness = 210, damping = 14 } = {}) {
  const rx = new Spring(0, { stiffness, damping }), ry = new Spring(0, { stiffness, damping }), z = new Spring(0, { stiffness: 160, damping: 11 })
  el.style.transformStyle = 'preserve-3d'
  let running = false
  const render = (dt) => {
    rx.step(dt); ry.step(dt); z.step(dt)
    el.style.transform = `perspective(900px) translateZ(${z.value.toFixed(2)}px) rotateX(${rx.value.toFixed(3)}deg) rotateY(${ry.value.toFixed(3)}deg)`
    el.style.setProperty('--ev-lift', (z.value / lift).toFixed(3))
    running = !(rx.resting && ry.resting && z.resting)
    return running
  }
  const kick = () => { if (!running) { running = true; loop(render) } }
  const move = (e) => {
    if (reduced()) return
    const r = el.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5
    ry.target = nx * tilt * 2; rx.target = -ny * tilt * 2; z.target = lift; kick()
  }
  const leave = () => { rx.target = ry.target = z.target = 0; kick() }
  el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave)
  return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
}

/* -------------------------------------------------------------------- burn --
   burn(outEl, inEl, { angle }) -> Promise : leave along a vector, arrive from its opposite. */
export function burn(outEl, inEl, { angle = -38, distance = 140 } = {}) {
  const a = angle * Math.PI / 180, dx = Math.cos(a) * distance, dy = Math.sin(a) * distance
  if (reduced()) { if (outEl) outEl.hidden = true; if (inEl) inEl.hidden = false; return Promise.resolve() }
  const p = new Spring(0, { stiffness: 120, damping: 15 })
  return new Promise((res) => {
    p.target = 1
    let phase = 0
    loop((dt) => {
      const v = p.step(dt)
      if (phase === 0 && outEl) {
        outEl.style.transform = `translate(${dx * v}px, ${dy * v}px) skewX(${angle * 0.25 * v}deg)`
        outEl.style.opacity = String(Math.max(0, 1 - v * 1.4))
        outEl.style.filter = `blur(${(v * 6).toFixed(2)}px)`
        if (v > 0.72) { phase = 1; outEl.hidden = true; outEl.style.cssText = ''; if (inEl) inEl.hidden = false; p.set(1); p.target = 0 }
        return true
      }
      if (inEl) {
        inEl.style.transform = `translate(${-dx * v}px, ${-dy * v}px) skewX(${-angle * 0.25 * v}deg)`
        inEl.style.opacity = String(1 - Math.min(1, Math.abs(v) * 1.6))
      }
      if (p.resting) { if (inEl) inEl.style.cssText = ''; res(); return false }
      return true
    })
  })
}

/* ------------------------------------------------------------------- drift --
   drift(el, { amp, period }) : station keeping. */
export function drift(el, { amp = 6, period = 7, rot = 2.5 } = {}) {
  if (reduced()) return () => {}
  const seed = Math.random() * 100, t0 = performance.now()
  return loop(() => {
    const t = (performance.now() - t0) / 1000 + seed
    const x = Math.sin(t * 2 * Math.PI / (period * 1.37)) * amp * 0.6
    const y = Math.sin(t * 2 * Math.PI / period) * amp
    const r = Math.sin(t * 2 * Math.PI / (period * 1.9)) * rot
    el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`; el.style.rotate = `${r.toFixed(2)}deg`
    return el.isConnected
  })
}

/* Auto-wire: data-ev="decode|zerog|drift" */
export function autowire(root = document) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { decode(e.target); io.unobserve(e.target) } }), { threshold: 0.4 })
  root.querySelectorAll('[data-ev~="decode"]').forEach((el) => io.observe(el))
  root.querySelectorAll('[data-ev~="zerog"]').forEach((el) => zeroG(el))
  root.querySelectorAll('[data-ev~="drift"]').forEach((el) => drift(el))
}
