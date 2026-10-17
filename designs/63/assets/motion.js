// The Long Evening: motion helpers for motion.css (design 63). No dependencies.
// import { initPostcards, initHorizon, initSun, initPan } from './motion.js'

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** 1. Postcard flip: toggles aria-pressed and plays the symmetric lift. */
export function initPostcards(root = document) {
  root.querySelectorAll('.lx-postcard').forEach(card => {
    card.addEventListener('click', () => {
      const on = card.getAttribute('aria-pressed') !== 'true'
      card.setAttribute('aria-pressed', String(on))
      if (reduce()) return
      card.classList.remove('is-flipping'); void card.offsetWidth; card.classList.add('is-flipping')
    })
    card.addEventListener('animationend', () => card.classList.remove('is-flipping'))
  })
}

/** 2. Horizon wipe fallback for browsers without view() timelines. */
export function initHorizon(root = document) {
  if (CSS.supports('animation-timeline: view()')) return
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
  }), { threshold: 0.25 })
  root.querySelectorAll('.lx-horizon').forEach(el => io.observe(el))
}

/** 3. Sun traverse: keeps --sun in sync where scroll timelines are missing, and
 *  forwards it to listeners (e.g. the 3D room). Returns an unsubscribe function. */
export function initSun(onChange) {
  let last = -1, raf = 0
  const native = CSS.supports('animation-timeline: scroll()') && !reduce()
  const read = () => {
    const max = document.documentElement.scrollHeight - innerHeight
    const v = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0
    if (!native) document.documentElement.style.setProperty('--sun', v.toFixed(4))
    if (Math.abs(v - last) > 0.001) { last = v; onChange?.(v) }
  }
  const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(read) }
  addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); read()
  return () => { removeEventListener('scroll', on); removeEventListener('resize', on) }
}

/** 4. Deadpan pan: move a .lx-pan track to index i. */
export function panTo(pan, i) {
  const n = pan.querySelector('.lx-pan__track').children.length
  i = (i + n) % n
  pan.style.setProperty('--i', i); pan.dataset.i = i
  if (!reduce()) { pan.classList.remove('is-panning'); void pan.offsetWidth; pan.classList.add('is-panning') }
  return i
}
export function initPan(pan, prev, next) {
  pan.dataset.i = 0
  prev?.addEventListener('click', () => panTo(pan, +pan.dataset.i - 1))
  next?.addEventListener('click', () => panTo(pan, +pan.dataset.i + 1))
  pan.addEventListener('animationend', () => pan.classList.remove('is-panning'))
}
