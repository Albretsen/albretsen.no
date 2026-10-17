// Albretsen AS — "Sun Road" motion helpers (no dependencies, ~2 KB).
//   import { initMotion } from './motion.js'
//   initMotion({ onDay: t => { daylight?.setTime(t); road?.setProgress(t); ambient?.setTime(t) } })
//
// 1. Day Pass: maps page scroll (or a given element's scroll-through) to --day 0..1 on <html>,
//    writes --o on each .daypass > img[data-at] and --sun-x/--sun-y on .daypass-sun.
// 2. In-view triggers: adds .is-in to .m-postmark, .m-whip, .m-glint once they enter the viewport.

export function initMotion({ onDay, track = document.documentElement, from = 0, to = 1 } = {}) {
  const root = document.documentElement
  const passes = [...document.querySelectorAll('.daypass')]
  let ticking = false

  function dayFromScroll() {
    const max = Math.max(1, track.scrollHeight - innerHeight)
    const p = Math.min(1, Math.max(0, (scrollY - track.offsetTop * (track === root ? 0 : 1)) / max))
    return from + (to - from) * p
  }

  function apply(t) {
    root.style.setProperty('--day', t.toFixed(4))
    root.style.setProperty('--dusk-k', Math.max(0, (t - 0.75) / 0.25).toFixed(3))
    for (const dp of passes) {
      for (const img of dp.querySelectorAll('img[data-at]')) {
        const at = parseFloat(img.dataset.at)
        img.style.setProperty('--o', Math.max(0, Math.min(1, 1 - Math.abs(t - at) * 4)).toFixed(3))
      }
      const sun = dp.querySelector('.daypass-sun')
      if (sun) {
        const r = dp.getBoundingClientRect(), a = Math.PI * (1 - t), s = sun.getBoundingClientRect()
        sun.style.setProperty('--sun-x', `${r.width / 2 + Math.cos(a) * r.width * 0.4 - s.width / 2}px`)
        sun.style.setProperty('--sun-y', `${r.height * 0.46 - Math.sin(a) * r.height * 0.38 - s.height / 2}px`)
        sun.style.opacity = Math.min(1, Math.sin(a) * 3).toFixed(3)
      }
    }
    onDay?.(t)
  }

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; apply(dayFromScroll()) }) } }
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll)
  apply(dayFromScroll())

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } }), { threshold: 0.25 })
  document.querySelectorAll('.m-postmark, .m-whip, .m-glint').forEach(el => io.observe(el))

  return { set: apply, destroy() { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); io.disconnect() } }
}
