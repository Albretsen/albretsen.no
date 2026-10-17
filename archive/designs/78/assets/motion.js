// Peach Hour motion study: drivers for motion.css. No dependencies.
//   import { hazeDrift, sunDrag, shutters, warmUp } from './motion.js'
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// 1. Haze Drift: JS fallback for browsers without scroll-driven animations.
//    Writes --ph-progress (0..1) while the stage crosses the viewport.
export function hazeDrift(stage) {
  if (CSS.supports('animation-timeline: view()') || reduce()) return () => {}
  let raf = 0
  const tick = () => {
    raf = 0
    const r = stage.getBoundingClientRect(), vh = innerHeight
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
    stage.style.setProperty('--ph-progress', p.toFixed(4))
  }
  const on = () => { if (!raf) raf = requestAnimationFrame(tick) }
  addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); tick()
  return () => { removeEventListener('scroll', on); removeEventListener('resize', on) }
}

// 2. Sun Drag: a draggable sun on an arc. Writes --t on `root` (default
//    <html>) and calls onChange(t), e.g. to drive diorama.setTime(t) or to
//    pick a frame from img/sun-sequence-strip. Keyboard: arrows, Home, End.
export function sunDrag(track, { root = document.documentElement, t = 0.12, onChange } = {}) {
  const sun = document.createElement('button')
  sun.className = 'ph-sun'; sun.type = 'button'
  sun.setAttribute('role', 'slider'); sun.setAttribute('aria-label', 'Time of day')
  sun.setAttribute('aria-valuemin', '0'); sun.setAttribute('aria-valuemax', '100')
  track.classList.add('ph-sun-track'); track.append(sun)
  const set = (v) => {
    t = Math.min(1, Math.max(0, v))
    root.style.setProperty('--t', t.toFixed(4)); track.style.setProperty('--t', t.toFixed(4))
    sun.setAttribute('aria-valuenow', Math.round(t * 100))
    sun.setAttribute('aria-valuetext', t < 0.3 ? 'sunrise' : t > 0.7 ? 'sunset' : 'midday')
    onChange && onChange(t)
  }
  let drag = false
  const fromEvent = (e) => { const r = track.getBoundingClientRect(); return ((e.clientX - r.left) / r.width - 0.08) / 0.84 }
  sun.addEventListener('pointerdown', (e) => { drag = true; sun.setPointerCapture(e.pointerId) })
  sun.addEventListener('pointermove', (e) => { if (drag) set(fromEvent(e)) })
  sun.addEventListener('pointerup', () => { drag = false })
  sun.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 0.04, ArrowUp: 0.04, ArrowLeft: -0.04, ArrowDown: -0.04 }[e.key]
    if (k) { e.preventDefault(); set(t + k) }
    if (e.key === 'Home') set(0); if (e.key === 'End') set(1)
  })
  set(t)
  return { set, get t() { return t } }
}

// 3. Shutter Open: opens .ph-shutters elements as they come into view.
export function shutters(els = document.querySelectorAll('.ph-shutters')) {
  if (reduce()) { els.forEach((el) => el.classList.add('is-open')); return }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-open'); io.unobserve(e.target) }
  }, { threshold: 0.35 })
  els.forEach((el) => io.observe(el))
}

// 4. Warm Up: split a headline into letters, warm the weight when visible.
export function warmUp(el) {
  const text = el.textContent; el.setAttribute('aria-label', text); el.textContent = ''
  ;[...text].forEach((c, i) => {
    const s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true')
    s.style.setProperty('--i', i); s.textContent = c === ' ' ? ' ' : c; el.append(s)
  })
  el.classList.add('ph-warm')
  if (reduce()) { el.classList.add('is-warm'); return }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('is-warm'); io.disconnect() } }, { threshold: 0.6 })
  io.observe(el)
}

// Sun sequence: maps t (0..1) to one of the 7 baked frames in the strip, for
// a no-WebGL fallback of the drag-the-sun hero. Set the element's
// background-image to img/sun-sequence-strip.webp and background-size 700% 100%.
export function sequenceFrame(el, t, frames = 7) {
  const f = Math.round(t * (frames - 1))
  el.style.backgroundPosition = `${(f / (frames - 1)) * 100}% 0`
}
