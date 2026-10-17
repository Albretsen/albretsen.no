// Zinc & Granite: motion study (pairs with motion.css). No dependencies.
//   longDolly(el, { onProgress })  scroll-linked 0..1 progress for ONE camera move
//   shutters(root)                 opens .shutters elements as they enter the view
//   italicTurn(root)               prepares .italic-turn words (roman + italic twin)
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// LONG DOLLY: progress is computed from absolute scroll position every frame,
// then eased toward with a critically damped follow, so the move is unbroken and never drifts.
export function longDolly(el, { onProgress, damping = 0.075 } = {}) {
  let target = 0, current = 0, raf = 0
  const measure = () => {
    const r = el.getBoundingClientRect(), span = r.height - innerHeight
    target = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0
  }
  const tick = () => {
    current += (target - current) * (reduce() ? 1 : damping)
    if (Math.abs(target - current) < 0.0005) current = target
    el.style.setProperty('--dolly', current.toFixed(4))
    onProgress && onProgress(current)
    raf = requestAnimationFrame(tick)
  }
  addEventListener('scroll', measure, { passive: true }); addEventListener('resize', measure)
  measure(); tick()
  return () => { cancelAnimationFrame(raf); removeEventListener('scroll', measure) }
}

export function shutters(root = document) {
  const els = root.querySelectorAll('.shutters')
  if (reduce()) { els.forEach((e) => e.classList.add('is-open')); return }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-open'); io.unobserve(e.target) }
  }), { threshold: 0.35 })
  els.forEach((e) => io.observe(e))
}

export function italicTurn(root = document) {
  root.querySelectorAll('.italic-turn').forEach((el) => {
    if (el.dataset.ready) return
    const t = el.textContent
    el.innerHTML = `<span>${t}</span><span aria-hidden="true">${t}</span>`
    el.dataset.ready = '1'
  })
}
