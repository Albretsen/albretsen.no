// Albretsen AS / design 68 — motion study helpers (pair with motion.css).
// No dependencies. Every function respects prefers-reduced-motion.

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const wait = (ms) => new Promise((r) => setTimeout(r, reduce() ? 0 : ms))
const cssMs = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v ? parseFloat(v) : fallback
}

/** 1. SHUTTERS: close, hold one beat, swap content, open. */
export async function shutterSwap(shutters, swap) {
  const t = cssMs('--t-shutter', 560)
  const beat = cssMs('--t-beat', 240)
  shutters.classList.add('is-closing')
  await wait(t)
  await swap?.()
  await wait(beat)
  shutters.classList.remove('is-closing')
  await wait(t)
}

/**
 * 2. SUNSET SWITCH: the disc sinks into the horizon, then the new theme
 * opens from the horizon line outward (View Transitions when available).
 * setTheme(name) must apply the theme synchronously (e.g. toggle a class).
 */
export function sunsetSwitch(button, setTheme, { horizon = 0.5 } = {}) {
  const sync = () => button.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'night'))
  sync()
  button.addEventListener('click', async () => {
    const next = document.documentElement.dataset.theme === 'night' ? 'day' : 'night'
    button.setAttribute('aria-pressed', String(next === 'night'))
    await wait(cssMs('--t-sunset', 900) * 0.55)
    const root = document.documentElement
    root.style.setProperty('--horizon', `${horizon * 100}%`)
    if (!document.startViewTransition || reduce()) { setTheme(next); return }
    root.classList.add('is-horizon')
    const vt = document.startViewTransition(() => setTheme(next))
    try { await vt.finished } finally { root.classList.remove('is-horizon') }
  })
}

/** 3. ARCH OPENING: scroll fallback where CSS scroll timelines are missing. */
export function archOpen(figure) {
  if (CSS.supports('animation-timeline: view()')) return
  if (reduce()) { figure.style.setProperty('--open', 1); return }
  let raf = 0
  const update = () => {
    raf = 0
    const r = figure.getBoundingClientRect()
    const vh = innerHeight
    // 0 when the figure's top enters the viewport bottom, 1 at 55% of its travel
    const p = (vh - r.top) / ((vh + r.height) * 0.55)
    figure.style.setProperty('--open', Math.max(0, Math.min(1, p)).toFixed(4))
  }
  addEventListener('scroll', () => { raf ||= requestAnimationFrame(update) }, { passive: true })
  update()
}

/** 4. CAPTION CARD: play when it enters the viewport (once). */
export function captionCard(el) {
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect() }
  }, { threshold: 0.6 })
  io.observe(el)
  return () => { el.classList.remove('is-in'); void el.offsetWidth; el.classList.add('is-in') }
}

/** 5. WHIP PAN: move a track to slide `index`, blur only while moving. */
export async function whipTo(track, index) {
  track.classList.add('is-moving')
  track.style.transform = `translateX(${-index * 100}%)`
  await wait(cssMs('--t-whip', 520) * 0.7)
  track.classList.remove('is-moving')
}
