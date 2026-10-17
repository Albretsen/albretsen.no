// motion.js — design 84 "Orbit Issue" motion helpers (pairs with motion.css).
//   import { openCover, closeCover, switchEdition, splitMasthead } from './motion.js'
// Every helper degrades to an instant change when View Transitions are missing
// or the visitor prefers reduced motion.

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const vt = (fn) => (document.startViewTransition && !reduce()) ? document.startViewTransition(fn) : (fn(), null)

// 1. COVER LIFT — cover and spread are two elements; only one is shown at a time.
export function openCover(cover, spread) {
  cover.style.viewTransitionName = 'cover'
  spread.style.viewTransitionName = 'spread'
  document.documentElement.classList.remove('closing')
  const t = vt(() => { cover.hidden = true; spread.hidden = false })
  return t?.finished
}
export function closeCover(cover, spread) {
  document.documentElement.classList.add('closing')
  const t = vt(() => { spread.hidden = true; cover.hidden = false })
  return (t?.finished || Promise.resolve()).then(() => document.documentElement.classList.remove('closing'))
}

// 2. EDITION WIPE — origin = the sun element (or any element) on screen.
export function switchEdition(apply, originEl) {
  const root = document.documentElement
  if (originEl) {
    const r = originEl.getBoundingClientRect()
    root.style.setProperty('--wipe-x', `${((r.left + r.width / 2) / innerWidth) * 100}%`)
    root.style.setProperty('--wipe-y', `${((r.top + r.height / 2) / innerHeight) * 100}%`)
  }
  root.classList.add('edition-wipe')
  const t = vt(apply)
  return (t?.finished || Promise.resolve()).then(() => root.classList.remove('edition-wipe'))
}

// 3. MASTHEAD RISE — splits text into indexed spans (keeps an aria-label).
export function splitMasthead(el) {
  const text = el.textContent
  el.setAttribute('aria-label', text)
  el.classList.add('masthead-rise')
  el.innerHTML = [...text].map((c, i) => `<span aria-hidden="true" style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('')
  return el
}
export function replayMasthead(el) {
  el.querySelectorAll('span').forEach(s => { s.style.animation = 'none'; s.offsetWidth; s.style.animation = '' })
}
