// Afterglow motion helpers (design 69). No dependencies. Pairs with motion.css.
//
//   import { splitRise, horizonFlash, dissolveFallback } from './motion.js'
//   splitRise(document.querySelector('h1'))          // wraps lines for "Horizon rise"
//   horizonFlash(heroEl, { horizon: .449, sunX: .86 }) // hidden green flash on a DOM hero
//
// The WebGL hero lives in interactive/afterglow.js; these are the DOM-level pieces.

/** Horizon rise: wrap each visual line of an element so it can rise from behind its own clip. */
export function splitRise(el) {
  if (!el || el.dataset.risen) return
  const words = el.textContent.trim().split(/\s+/)
  el.textContent = ''
  const probe = words.map(w => { const s = document.createElement('span'); s.textContent = w + ' '; el.appendChild(s); return s })
  const lines = []
  probe.forEach(s => { const top = s.offsetTop; (lines.at(-1)?.top === top ? lines.at(-1).w : (lines.push({ top, w: [] }), lines.at(-1).w)).push(s.textContent) })
  el.textContent = ''
  el.classList.add('ag-rise')
  lines.forEach((l, i) => {
    const line = document.createElement('span'); line.className = 'ag-line'
    const inner = document.createElement('span'); inner.textContent = l.w.join('').trim(); inner.style.setProperty('--i', i)
    line.appendChild(inner); el.appendChild(line)
  })
  el.dataset.risen = '1'
  el.setAttribute('aria-label', words.join(' '))
}

/** Green flash: rest the pointer on the horizon for two seconds, or type "flash". */
export function horizonFlash(el, { horizon = 0.5, sunX = 0.7, dwellMs = 2000 } = {}) {
  el.classList.add('ag-horizon')
  el.style.setProperty('--horizon', horizon * 100 + '%')
  el.style.setProperty('--sun-x', sunX * 100 + '%')
  let t = 0, typed = ''
  const fire = () => { el.classList.remove('is-flashing'); void el.offsetWidth; el.classList.add('is-flashing') }
  el.addEventListener('pointermove', (e) => {
    const b = el.getBoundingClientRect(); clearTimeout(t)
    if (Math.abs((e.clientY - b.top) / b.height - horizon) < 0.02) t = setTimeout(fire, dwellMs)
  })
  el.addEventListener('pointerleave', () => clearTimeout(t))
  addEventListener('keydown', (e) => { typed = (typed + e.key).slice(-5).toLowerCase(); if (typed === 'flash') fire() })
  return fire
}

/** Afterglow dissolve without WebGL: cycles <img> children of a .ag-dissolve element. */
export function dissolveFallback(el, { every = 7000 } = {}) {
  const imgs = [...el.querySelectorAll('img')]
  if (imgs.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  let i = 0
  imgs.forEach((im, k) => { im.style.opacity = k ? 0 : 1 })
  const id = setInterval(() => {
    const a = imgs[i], b = imgs[(i = (i + 1) % imgs.length)]
    imgs.forEach(im => im.classList.remove('is-leaving', 'is-arriving'))
    a.style.opacity = ''; b.style.opacity = ''
    a.classList.add('is-leaving'); b.classList.add('is-arriving')
    imgs.forEach(im => { if (im !== a && im !== b) im.style.opacity = 0 })
  }, every)
  return () => clearInterval(id)
}

/** Fallback for "Long shadow" and "Sky turn" where scroll timelines are unsupported. */
export function scrollFallbacks() {
  if (CSS.supports('animation-timeline: scroll()')) return
  const root = document.documentElement
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
  const A = ['#DCE8F4', '#F4F1EC', '#FBF8F4'].map(hex), B = ['#AEBFE6', '#F3C3CB', '#FFD9B8'].map(hex)
  const on = () => {
    const t = Math.min(1, scrollY / Math.max(1, root.scrollHeight - innerHeight))
    ;['--ag-sky-top', '--ag-sky-mid', '--ag-sky-low'].forEach((p, i) => root.style.setProperty(p, `rgb(${mix(A[i], B[i], t)})`))
    document.querySelectorAll('.ag-shadow').forEach(el => {
      const r = el.getBoundingClientRect(); const v = 1 - Math.min(1, Math.max(0, r.top / innerHeight))
      el.style.setProperty('--len', 4 + v * 30 + 'px')
    })
  }
  addEventListener('scroll', on, { passive: true }); on()
}
