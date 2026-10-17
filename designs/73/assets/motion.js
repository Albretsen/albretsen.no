// motion.js — Long Evening (design 73). Tiny, dependency-free drivers for motion.css.
//
//   import { initMotion } from './assets/motion.js'
//   initMotion()            // wires every pattern found on the page
//
// Patterns (each named, each researched from a real site, see ASSETS.md → Motion study):
//   longDissolve()  scroll progress → --p on .ld-scroll (fallback where CSS scroll timelines are missing)
//   inkSettle()     splits .ink-settle text into letters with --n for the stagger
//   lightsOn()      adds .is-night to .lights-on when the real Norwegian sky is dim (or when scrolled into view with data-on="view")
//   sunTrack()      scroll progress → --p on .sun-track
//   skySync()       paints --sky-* custom properties from the real sun over Norway, once a minute
//   pickStill()     returns 'sunrise' | 'noon' | 'sunset' | 'night' for the current Norwegian sky

import { paintSky, sunPosition } from './interactive/sun.js'

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const hasScrollTimeline = () => CSS.supports?.('animation-timeline: view()')

function progressOf(el) {
  const r = el.getBoundingClientRect()
  const span = r.height - innerHeight
  return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : Math.min(1, Math.max(0, 1 - r.bottom / (innerHeight + r.height)))
}

export function longDissolve(root = document) {
  const els = [...root.querySelectorAll('.ld-scroll')]
  if (!els.length || hasScrollTimeline()) return
  let raf = 0
  const update = () => { raf = 0; for (const el of els) el.querySelector('.ld-stack')?.style.setProperty('--p', progressOf(el).toFixed(4)) }
  addEventListener('scroll', () => { raf ||= requestAnimationFrame(update) }, { passive: true })
  update()
}

export function inkSettle(root = document) {
  for (const el of root.querySelectorAll('.ink-settle:not([data-split])')) {
    el.dataset.split = ''
    const text = el.textContent
    el.setAttribute('aria-label', text)
    let n = 0
    el.innerHTML = text.split(" ").map((w) => `<span class="wd" aria-hidden="true">${[...w].map((c) => `<span class="ch" style="--n:${n++}">${c}</span>`).join("")}</span>`).join(" ")
  }
}

export function lightsOn(root = document) {
  const els = [...root.querySelectorAll('.lights-on')]
  for (const el of els) [...el.querySelectorAll('[data-glass]')].forEach((g, n) => g.style.setProperty('--n', n))
  const viewEls = els.filter((e) => e.dataset.on === 'view')
  const skyEls = els.filter((e) => e.dataset.on !== 'view')
  const check = () => { const { elevation } = sunPosition(new Date()); skyEls.forEach((e) => e.classList.toggle('is-night', elevation < 1)) }
  check(); setInterval(check, 60000)
  if (viewEls.length) {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('is-night')), { threshold: .4 })
    viewEls.forEach((e) => io.observe(e))
  }
}

export function sunTrack(root = document) {
  const els = [...root.querySelectorAll('.sun-track')]
  if (!els.length) return
  let raf = 0
  const update = () => { raf = 0; for (const el of els) el.style.setProperty('--p', reduce() ? .5 : progressOf(el.closest('section') || el).toFixed(4)) }
  addEventListener('scroll', () => { raf ||= requestAnimationFrame(update) }, { passive: true })
  update()
}

export function skySync(el = document.documentElement) {
  const run = () => paintSky(el)
  run(); return setInterval(run, 60000)
}

export function pickStill(date = new Date()) {
  const { elevation, azimuth } = sunPosition(date)
  if (elevation < -2) return 'night'
  if (elevation < 14) return azimuth < 180 ? 'sunrise' : 'sunset'
  return 'noon'
}

export function initMotion(root = document) {
  skySync(); inkSettle(root); lightsOn(root); longDissolve(root); sunTrack(root)
}
