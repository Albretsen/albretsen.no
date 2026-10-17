// Cover Story · motion helpers (design 59). ES module, no dependencies (Lottie is loaded lazily).
//   import { initMotion, pageTurn, mountLottie } from './assets/motion.js'
//   initMotion()            // tilt + slap-on-view for the whole document
//
// TILT (signature delight): any [data-tilt] element tracks the pointer (or device orientation on
// phones) with a critically damped spring and exposes --tx / --ty (-1..1). Children with
// data-depth="24" move that many px for parallax; .m-tilt-plane rotates in 3D. See motion.css.

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function initTilt(root = document) {
  const els = [...root.querySelectorAll('[data-tilt]')]
  if (!els.length || reduce()) return () => {}
  els.forEach((el) => el.querySelectorAll('[data-depth]').forEach((d) => d.style.setProperty('--depth-px', d.dataset.depth + 'px')))
  const state = els.map((el) => ({ el, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 }))
  let gyro = null
  const onMove = (e) => {
    for (const s of state) {
      const r = s.el.getBoundingClientRect()
      const inside = e.clientY > r.top - 200 && e.clientY < r.bottom + 200
      s.tx = inside ? Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)) : 0
      s.ty = inside ? Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)) : 0
    }
  }
  const onOrient = (e) => {
    if (e.gamma == null) return
    gyro = { x: Math.max(-1, Math.min(1, e.gamma / 30)), y: Math.max(-1, Math.min(1, (e.beta - 45) / 30)) }
  }
  addEventListener('pointermove', onMove, { passive: true })
  addEventListener('deviceorientation', onOrient)
  let raf, last = performance.now()
  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    for (const s of state) {
      const gx = gyro ? gyro.x : s.tx, gy = gyro ? gyro.y : s.ty
      // spring: stiffness 120, damping 2*sqrt(k) (critical)
      const k = 120, c = 2 * Math.sqrt(k)
      s.vx += (k * (gx - s.x) - c * s.vx) * dt; s.vy += (k * (gy - s.y) - c * s.vy) * dt
      s.x += s.vx * dt; s.y += s.vy * dt
      s.el.style.setProperty('--tx', s.x.toFixed(4)); s.el.style.setProperty('--ty', s.y.toFixed(4))
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', onMove); removeEventListener('deviceorientation', onOrient) }
}

// iOS needs a user gesture to grant motion access. Call from a click handler.
export async function requestGyro() {
  if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
    try { return (await DeviceOrientationEvent.requestPermission()) === 'granted' } catch { return false }
  }
  return true
}

// SLAP: stickers (.m-slap) land when they scroll into view, staggered within each parent.
export function initSlap(root = document) {
  document.documentElement.classList.add('js')
  const els = [...root.querySelectorAll('.m-slap')]
  const groups = new Map()
  els.forEach((el) => { const p = el.parentElement; const n = groups.get(p) || 0; if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', n); groups.set(p, n + 1) })
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } }), { threshold: 0.35 })
  els.forEach((el) => io.observe(el))
  return () => io.disconnect()
}

// TURN: page-turn transition between two DOM states (same-document View Transitions).
export function pageTurn(update) {
  if (!document.startViewTransition || reduce()) { update(); return Promise.resolve() }
  return document.startViewTransition(update).finished
}

// LOTTIE: mount one of assets/lottie/*.json. Loads lottie-web (light, SVG renderer) on first use.
let lottieP
export async function mountLottie(el, url, { loop = true, autoplay = true } = {}) {
  lottieP ||= new Promise((res, rej) => {
    if (window.lottie) return res(window.lottie)
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie_light.min.js'
    s.onload = () => res(window.lottie); s.onerror = rej; document.head.append(s)
  })
  const lottie = await lottieP
  const anim = lottie.loadAnimation({ container: el, renderer: 'svg', loop: reduce() ? false : loop, autoplay: !reduce() && autoplay, path: url })
  if (reduce()) anim.addEventListener('DOMLoaded', () => anim.goToAndStop(anim.totalFrames - 1, true))
  return anim
}

export function initMotion(root = document) {
  const a = initTilt(root), b = initSlap(root)
  return () => { a(); b() }
}
