// Morning Elevation: motion driver. One number, --me-t, is the time of day.
//
//   import { initMotion } from './motion.js'
//   const m = initMotion({ source: 'scroll' })   // or 'none' and call m.set(t)
//   m.onChange(t => facade.setSun(t))            // keep the 3D sun and the CSS sun in step
//
// Scroll mapping: the page's scroll progress is eased into the day so the
// morning lasts longer than the afternoon (most of the reading happens in
// the soft early light). Reduced motion pins the day at 0.16.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
// morning-heavy curve: 0..1 scroll -> 0.12..0.92 day
export const dayFromScroll = (p) => 0.12 + 0.8 * (p < 0.6 ? (p / 0.6) * 0.45 : 0.45 + ((p - 0.6) / 0.4) * 0.55)

export function initMotion({ source = 'scroll', root = document.documentElement, start = 0.16 } = {}) {
  const subs = new Set()
  let t = start, target = start, raf = 0
  const write = () => {
    root.style.setProperty('--me-t', t.toFixed(4))
    subs.forEach((f) => f(t))
  }
  const tick = () => {
    // critically damped follow: the sun never jumps, even on a flick-scroll
    t += (target - t) * 0.12
    if (Math.abs(target - t) < 0.0005) t = target
    write()
    raf = t === target ? 0 : requestAnimationFrame(tick)
  }
  const set = (v) => {
    target = reduce ? start : clamp(v)
    if (!raf) raf = requestAnimationFrame(tick)
  }
  if (source === 'scroll' && !reduce) {
    const onScroll = () => {
      const max = root.scrollHeight - innerHeight
      set(dayFromScroll(max > 0 ? scrollY / max : 0))
    }
    addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }
  write()

  // SHUTTER OPEN: open windows as they enter view, once.
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-open'); io.unobserve(e.target) }
  }), { threshold: 0.45 })
  document.querySelectorAll('.me-shutter').forEach((el) => reduce ? el.classList.add('is-open') : io.observe(el))

  return {
    set,
    get: () => t,
    onChange: (f) => (subs.add(f), () => subs.delete(f)),
  }
}

// Drag-the-sun control: any element with [data-sun-drag] becomes a horizontal
// scrubber for the day (pointer + keyboard arrows, aria-valuenow kept in sync).
export function sunScrubber(el, motion) {
  el.setAttribute('role', 'slider'); el.setAttribute('tabindex', '0')
  el.setAttribute('aria-label', 'Time of day'); el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100')
  const fromX = (x) => { const r = el.getBoundingClientRect(); motion.set(clamp((x - r.left) / r.width)) }
  el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); fromX(e.clientX) })
  el.addEventListener('pointermove', (e) => { if (el.hasPointerCapture(e.pointerId)) fromX(e.clientX) })
  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') motion.set(motion.get() + 0.04)
    if (e.key === 'ArrowLeft') motion.set(motion.get() - 0.04)
  })
  motion.onChange((t) => el.setAttribute('aria-valuenow', Math.round(t * 100)))
}
