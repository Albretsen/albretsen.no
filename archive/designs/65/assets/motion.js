// Clear Noon — motion helpers (design 65). No dependencies.
//   import { noonDissolve, reliefLens, roadDraw, condensedRise } from './motion.js'

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** 1. Noon Dissolve: cycles .dissolve children; pauses off-screen and in hidden tabs. */
export function noonDissolve(el, { hold = 7000, dissolve = 2400 } = {}) {
  const frames = [...el.children]
  if (frames.length < 2) return () => {}
  let i = 0, timer = 0, visible = true
  frames.forEach((f, k) => f.classList.toggle('is-on', k === 0))
  const step = () => {
    const prev = frames[i]; i = (i + 1) % frames.length; const next = frames[i]
    frames.forEach(f => f.classList.remove('is-off'))
    prev.classList.remove('is-on'); prev.classList.add('is-off')
    next.classList.add('is-on')
    // restart the drift on the incoming frame
    const img = next.querySelector('img') || next; img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''
    setTimeout(() => prev.classList.remove('is-off'), dissolve)
    schedule()
  }
  const schedule = () => { clearTimeout(timer); if (visible && !reduce()) timer = setTimeout(step, hold + dissolve) }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting && !document.hidden; schedule() })
  io.observe(el)
  const vis = () => { visible = !document.hidden; schedule() }
  document.addEventListener('visibilitychange', vis)
  schedule()
  return () => { clearTimeout(timer); io.disconnect(); document.removeEventListener('visibilitychange', vis) }
}

/** 2. Relief Lens: eased pointer-follow for a .lens container (needs a .lens-under child). */
export function reliefLens(el, { ease = 0.12 } = {}) {
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0
  const tick = () => {
    x += (tx - x) * ease; y += (ty - y) * ease
    el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px')
    if (Math.abs(tx - x) + Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(tick); else raf = 0
  }
  const move = (e) => {
    const r = el.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top
    if (reduce()) { x = tx; y = ty }
    if (!raf) raf = requestAnimationFrame(tick)
  }
  const enter = (e) => { const r = el.getBoundingClientRect(); x = tx = e.clientX - r.left; y = ty = e.clientY - r.top; el.classList.add('is-active'); tick() }
  const leave = () => el.classList.remove('is-active')
  el.addEventListener('pointerenter', enter); el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave)
  return () => { el.removeEventListener('pointerenter', enter); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
}

/** 3. Road Draw fallback (browsers without scroll-driven animations): draws once when in view. */
export function roadDraw(el) {
  if (CSS.supports('animation-timeline: view()')) return () => {}
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('is-drawn'); io.disconnect() } }, { threshold: 0.3 })
  io.observe(el)
  return () => io.disconnect()
}

/** 5. Condensed Rise: splits text into letter spans and reveals on entry. */
export function condensedRise(el) {
  const text = el.textContent; el.textContent = ''
  el.classList.add('rise'); el.setAttribute('aria-label', text)
  ;[...text].forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch === ' ' ? ' ' : ch; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true'); el.appendChild(s) })
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect() } }, { threshold: 0.4 })
  io.observe(el)
  return () => io.disconnect()
}
