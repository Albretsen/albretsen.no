// Six Faces / design 90 — motion study. Pairs with motion.css.
// Uses Motion (motion.dev) for springs/tweens, pinned, loaded lazily; everything degrades to CSS end states.
//
//   import { theTurn, develop, honestCount, redact, autoInit } from './motion.js'
//   autoInit()                 // wires [data-turn-switch], .develop, [data-count], .redact on scroll
//
// References (researched, then rebuilt from scratch):
//  - THE TURN: View Transitions API cube transitions (developer.chrome.com/docs/web-platform/view-transitions)
//    and the classic Codrops 3D page-transition cube; here it is the theme switch itself.
//  - THROW & LAND: Motion spring physics (motion.dev/docs/animate, type: "spring") for the landing.
//  - DEVELOP: scanner/contact-print reveals seen on editorial photo sites; Aceternity "Text Reveal Card" sweep line.
//  - HONEST COUNT: Stripe / Linear number tickers, minus the overshoot.

const MOTION_URL = 'https://cdn.jsdelivr.net/npm/motion@13.4.6/+esm'
let mp = null
const motion = () => (mp ||= import(MOTION_URL).catch(() => null))
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- 2. THE TURN ---------- */
export function currentTheme() { return document.documentElement.dataset.theme === 'day' ? 'day' : 'nocturne' }
export async function theTurn(next) {
  const root = document.documentElement
  next ||= currentTheme() === 'day' ? 'nocturne' : 'day'
  const apply = () => {
    if (next === 'day') root.dataset.theme = 'day'; else delete root.dataset.theme
    try { localStorage.setItem('a90-theme', next) } catch {}
    document.querySelectorAll('[data-turn-switch]').forEach((b) => { b.setAttribute('aria-pressed', String(next === 'day')); const l = b.querySelector('.ts-label'); if (l) l.textContent = next === 'day' ? 'Day' : 'Nocturne' })
  }
  if (!document.startViewTransition || reduced()) return apply()
  root.dataset.turn = next === 'day' ? 'fwd' : 'back'
  const vt = document.startViewTransition(apply)
  try { await vt.finished } finally { delete root.dataset.turn }
}
export function restoreTheme() { try { if (localStorage.getItem('a90-theme') === 'day') document.documentElement.dataset.theme = 'day' } catch {} }

/* ---------- 3. DEVELOP ---------- */
export async function develop(el, { duration = 1.6 } = {}) {
  if (reduced()) { el.style.setProperty('--p', 1); el.classList.add('is-done'); return }
  const M = await motion()
  const set = (v) => el.style.setProperty('--p', v.toFixed(4))
  if (M) await M.animate(0, 1, { duration, ease: [0.65, 0, 0.35, 1], onUpdate: set }).finished
  else set(1)
  el.classList.add('is-done')
}

/* ---------- 4. HONEST COUNT ---------- */
export async function honestCount(el, { duration = 1.4 } = {}) {
  const raw = el.dataset.count || el.textContent.trim()
  const m = raw.match(/^([^\d]*)([\d,]+)(.*)$/)
  if (!m) return
  const [, pre, num, post] = m, target = parseInt(num.replace(/,/g, ''), 10), comma = num.includes(',')
  const fmt = (v) => pre + (comma ? Math.round(v).toLocaleString('en-US') : String(Math.round(v))) + post
  if (reduced()) { el.textContent = fmt(target); el.classList.add('is-exact'); return }
  const M = await motion()
  if (M) await M.animate(0, target, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => (el.textContent = fmt(Math.min(v, target))) }).finished
  el.textContent = fmt(target); el.classList.add('is-exact') // stops dead on the true value
}

/* ---------- 5. REDACT ---------- */
export async function redact(el) {
  if (reduced()) { el.style.setProperty('--r', 1); el.style.setProperty('--ro', 1); return }
  const M = await motion()
  if (!M) { el.style.setProperty('--r', 1); el.style.setProperty('--ro', 1); return }
  await M.animate(0, 1, { duration: 0.55, ease: [0.7, 0, 0.3, 1], onUpdate: (v) => el.style.setProperty('--r', v) }).finished
  await M.animate(0, 1, { duration: 0.3, onUpdate: (v) => el.style.setProperty('--ro', v) }).finished
}

/* ---------- wiring ---------- */
export function onceVisible(els, fn, rootMargin = '0px 0px -12% 0px') {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target) } }), { rootMargin })
  els.forEach((el) => io.observe(el))
  return io
}
export function autoInit(scope = document) {
  restoreTheme()
  scope.querySelectorAll('[data-turn-switch]').forEach((b) => { b.setAttribute('aria-pressed', String(currentTheme() === 'day')); b.addEventListener('click', () => theTurn()) })
  onceVisible(scope.querySelectorAll('.develop'), (el) => develop(el))
  onceVisible(scope.querySelectorAll('[data-count]'), (el) => honestCount(el))
  onceVisible(scope.querySelectorAll('.redact'), (el) => redact(el))
}
