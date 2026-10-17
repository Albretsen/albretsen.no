// Low Sun Terrace — motion helpers (design 72). No dependencies.
// import { initDolly, initLongShadow } from './motion.js'

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// SLOW DOLLY: map a tall scroll track to one 0..1 progress value, lerp it, and
// hand it to a renderer (e.g. terrace.setProgress). One value, one camera,
// no per-section cuts, rendering only while the value is still settling.
export function initDolly(track, onProgress, { ease = 0.06 } = {}) {
  let target = 0, cur = 0, raf = 0
  const read = () => {
    const r = track.getBoundingClientRect()
    target = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)))
  }
  const tick = () => {
    cur += (target - cur) * (reduce() ? 1 : ease)
    onProgress(cur)
    raf = Math.abs(target - cur) > 0.0005 ? requestAnimationFrame(tick) : 0
  }
  const kick = () => { read(); if (!raf) raf = requestAnimationFrame(tick) }
  addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick)
  read(); cur = target; onProgress(cur)
  return () => { removeEventListener('scroll', kick); removeEventListener('resize', kick); cancelAnimationFrame(raf) }
}

// LONG SHADOW TYPE: a stepped text-shadow that grows toward the lower left as
// the sun (scroll) sinks. Colour is snow-shade blue, never black.
export function initLongShadow(el, { max = 28, color = [75, 86, 99] } = {}) {
  const paint = (p) => {
    const n = Math.round(2 + p * max), out = []
    for (let i = 1; i <= n; i++) out.push(`${-i * 0.9}px ${i * 0.35}px 0 rgba(${color.join(',')},${(0.16 * (1 - i / (n + 1))).toFixed(3)})`)
    el.style.textShadow = out.join(',')
  }
  if (reduce()) return paint(0.3)
  const on = () => {
    const r = el.getBoundingClientRect()
    paint(Math.min(1, Math.max(0, 1 - (r.top + r.height / 2) / innerHeight)))
  }
  addEventListener('scroll', on, { passive: true }); on()
}

// SPREAD UNFOLD replay helper (for previews): re-run the CSS animation.
export function replay(el) { el.querySelectorAll('.page-l,.page-r').forEach((p) => { p.style.animation = 'none'; p.offsetWidth; p.style.animation = '' }) }
