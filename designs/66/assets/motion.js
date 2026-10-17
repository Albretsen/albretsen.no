// Motion study runtime, design 66. Adds .is-in when an animated element enters the viewport,
// numbers Lamplighter windows by distance from the centre column (mirrored pairs share a number),
// and numbers Pop-up Lift layers back-to-front. ~1 KB, no dependencies.
//
//   import { initMotion, replay } from './motion.js'; initMotion()
const SEL = '.m-unfurl, .m-dolly, .m-lamplighter, .m-popup'

export function numberLamps(root) {
  const lamps = [...root.querySelectorAll('[data-lamp]')]
  if (!lamps.length) return
  const r = root.getBoundingClientRect()
  const cx = r.left + r.width / 2
  // group by column distance from the centre so mirrored windows light on the same beat
  const cols = lamps.map((el) => { const b = el.getBoundingClientRect(); return Math.abs(b.left + b.width / 2 - cx) })
  const uniq = [...new Set(cols.map((d) => Math.round(d / 4) * 4))].sort((a, b) => a - b)
  lamps.forEach((el, i) => {
    const rank = uniq.indexOf(Math.round(cols[i] / 4) * 4)
    const row = +(el.dataset.lamp || 0)
    el.style.setProperty('--lamp', rank + row)
  })
}

export function initMotion(root = document) {
  root.querySelectorAll('.m-popup').forEach((p) => [...p.children].forEach((c, i) => c.style.setProperty('--i', i)))
  root.querySelectorAll('.m-lamplighter').forEach(numberLamps)
  const els = root.querySelectorAll(SEL)
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return () => {} }
  // A fully clipped element (Awning Unfurl starts at clip-path inset 100%) never "intersects",
  // so those are observed through their parent.
  const proxy = new Map()
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) {
      const el = proxy.get(en.target) || en.target
      el.classList.add('is-in'); io.unobserve(en.target)
    }
  }, { threshold: 0.25 })
  els.forEach((e) => {
    const t = e.classList.contains('m-unfurl') && e.parentElement ? e.parentElement : e
    if (t !== e) proxy.set(t, e)
    io.observe(t)
  })
  return () => io.disconnect()
}

// Re-run an element's entrance (used by the contact sheet's "replay" buttons).
export function replay(el) {
  el.classList.remove('is-in')
  void el.offsetWidth
  if (el.classList.contains('m-lamplighter')) numberLamps(el)
  requestAnimationFrame(() => el.classList.add('is-in'))
}
