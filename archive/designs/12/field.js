// The field: horizontal bands that start straight (the CSS fallback is
// identical) and slowly take on tension from the right. Left stays silent.
// One band is blue, chosen per visit, always above the name so the
// difference blend never inverts it into a second hue.

import { rng } from './mark.js'

let S = 10            // band pitch, CSS px (read from --pitch)
let W = 4             // band thickness, CSS px (read from --band)
const FPS = 30

export function startField(host, { seed, reduced, ink = '#070707', blue = '#006aaa' }) {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const r = rng(seed ^ 0x9e3779b9)
  const P = {
    lambda: 260 + r() * 220,     // base wavelength, px
    squeeze: 0.35 + r() * 0.35,  // how much the wavelength compresses across rows
    rows: 0.6 + r() * 1.4,       // compression cycles over the field height
    tilt: (r() - 0.5) * 6,       // phase drift down the field
    phi: r() * Math.PI * 2,
    omega: 0.22 + r() * 0.12,    // rad/s: slow
    blueAt: 0.08 + r() * 0.22,   // relative height of the blue band
  }

  let w = 0, h = 0, dpr = 1, blueIndex = 3
  let pointer = { x: -1e4, y: -1e4, k: 0, target: 0 }
  let visible = true, running = false, last = 0, start = performance.now()

  function resize() {
    const rect = host.getBoundingClientRect()
    const cs = getComputedStyle(host)
    S = parseFloat(cs.getPropertyValue('--pitch')) || 10
    W = parseFloat(cs.getPropertyValue('--band')) || 4
    w = Math.max(1, Math.round(rect.width)); h = Math.max(1, Math.round(rect.height))
    dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
    blueIndex = Math.max(1, Math.round((h * P.blueAt) / S))
    if (!running) draw(reduced ? 1e9 : performance.now())
  }

  function draw(now) {
    const t = (now - start) / 1000
    const ramp = reduced ? 1 : smooth(Math.min(1, t / 6)) // straight -> tense over 6 s
    const breath = 0.8 + 0.2 * Math.sin(t * 0.07 + P.phi)
    const A = S * 0.95 * ramp * breath
    const ph = reduced ? P.phi : P.phi + t * P.omega
    pointer.k += (pointer.target - pointer.k) * 0.06

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.lineWidth = W
    ctx.lineCap = 'butt'
    const step = w > 1400 ? 8 : 6
    const n = Math.ceil(h / S) + 1

    const row = (i) => {
      const y0 = i * S + W / 2
      const v = y0 / h
      const lam = P.lambda * (1 - P.squeeze * (0.5 + 0.5 * Math.sin(v * P.rows * Math.PI * 2 + P.phi)))
      const phase = ph + v * P.tilt
      for (let x = 0; x <= w + step; x += step) {
        const u = x / w
        const env = Math.pow(smooth(u), 1.6)
        let y = y0 + A * env * Math.sin((x / lam) * Math.PI * 2 + phase)
        if (pointer.k > 0.01) { // a Vega-like swell under the pointer
          const dx = x - pointer.x, dy = y0 - pointer.y
          const d2 = (dx * dx + dy * dy) / (170 * 170)
          if (d2 < 4) y += pointer.k * (dy / 170) * 14 * Math.exp(-d2)
        }
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
    }

    ctx.strokeStyle = ink
    ctx.beginPath()
    for (let i = 0; i < n; i++) if (i !== blueIndex) row(i)
    ctx.stroke()
    ctx.strokeStyle = blue
    ctx.beginPath(); row(blueIndex); ctx.stroke()
  }

  function frame(now) {
    if (!visible || document.hidden) { running = false; return }
    running = true
    if (now - last >= 1000 / FPS - 2) { last = now; draw(now) }
    requestAnimationFrame(frame)
  }
  const kick = () => { if (!reduced && !running && visible && !document.hidden) requestAnimationFrame(frame) }

  new ResizeObserver(resize).observe(host)
  resize()
  host.classList.add('is-live') // hides the CSS stripes; canvas now draws the same bands

  if (reduced) return
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick() }).observe(host)
  document.addEventListener('visibilitychange', kick)
  const hero = host.parentElement
  hero.addEventListener('pointermove', e => {
    const rect = host.getBoundingClientRect()
    pointer.x = e.clientX - rect.left; pointer.y = e.clientY - rect.top
    pointer.target = (pointer.x >= 0 && pointer.x <= w && pointer.y >= 0 && pointer.y <= h) ? 1 : 0
  })
  hero.addEventListener('pointerleave', () => { pointer.target = 0 })
  kick()
}

function smooth(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x) }
