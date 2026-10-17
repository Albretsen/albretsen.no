// Brass Ring cursor (design 66).
// A thin brass ring with a cream dot that follows the pointer with a short, damped lag.
// Over links, buttons or [data-cursor] it turns into a café-awning scallop that rotates in
// exact 30-degree ticks (deadpan, never smooth). [data-cursor-label="Open"] shows a small label.
// Only for fine pointers; respects reduced motion; no effect on touch.
//
//   import { mountCursor } from './cursor/cursor.js'; mountCursor()
export function mountCursor({ selector = 'a, button, [data-cursor], label, summary' } = {}) {
  if (!matchMedia('(pointer: fine)').matches) return { destroy() {} }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const el = document.createElement('div')
  el.className = 'ring-cursor is-hidden'
  el.setAttribute('aria-hidden', 'true')
  // 12 scallops around a 15px radius
  let sc = ''
  const n = 12, R = 15
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
    const x0 = 22 + R * Math.cos(a0), y0 = 22 + R * Math.sin(a0)
    const x1 = 22 + R * Math.cos(a1), y1 = 22 + R * Math.sin(a1)
    sc += `${i ? 'L' : 'M'}${x0.toFixed(2)},${y0.toFixed(2)} A4,4 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} `
  }
  el.innerHTML = `<svg viewBox="0 0 44 44" width="44" height="44">
      <circle class="ring" cx="22" cy="22" r="14" fill="none" stroke="#B8924A" stroke-width="1.6"/>
      <path class="scallop" d="${sc}Z" fill="rgba(181,55,58,.14)" stroke="#B5373A" stroke-width="1.6" stroke-linejoin="round"/>
      <circle class="dot" cx="22" cy="22" r="3" fill="#F5EDDF" stroke="#1F2B4A" stroke-width="1"/>
    </svg><span class="label"></span>`
  document.body.appendChild(el)
  document.documentElement.classList.add('has-ring-cursor')
  const label = el.querySelector('.label')

  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0
  const k = reduced ? 1 : 0.28
  function tick() {
    x += (tx - x) * k; y += (ty - y) * k
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 ? requestAnimationFrame(tick) : 0
  }
  function move(e) {
    tx = e.clientX; ty = e.clientY
    el.classList.remove('is-hidden')
    if (!raf) raf = requestAnimationFrame(tick)
    const t = e.target instanceof Element ? e.target.closest(selector) : null
    el.classList.toggle('is-active', !!t)
    const text = t?.getAttribute('data-cursor-label')
    el.classList.toggle('has-label', !!text)
    if (text) label.textContent = text
  }
  const down = () => el.classList.add('is-down')
  const up = () => el.classList.remove('is-down')
  const leave = () => el.classList.add('is-hidden')
  addEventListener('pointermove', move, { passive: true })
  addEventListener('pointerdown', down); addEventListener('pointerup', up)
  document.addEventListener('pointerleave', leave)
  return {
    destroy() {
      removeEventListener('pointermove', move); removeEventListener('pointerdown', down); removeEventListener('pointerup', up)
      document.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf); el.remove(); document.documentElement.classList.remove('has-ring-cursor')
    },
  }
}
