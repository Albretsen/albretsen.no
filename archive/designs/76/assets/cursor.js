// WINDOW CURSOR: the signature delight.
// A small arched window outline that trails the pointer on a soft spring.
// Over a link it "opens": the arch lifts, the fanlight fills with light.
// Over an image it becomes a pane you look through (thin, wider arch).
// Fine pointers only; respects reduced motion; the native cursor is kept for text inputs.
export function windowCursor({ color = '#1d2226', light = '#f1efe9' } = {}) {
  if (!matchMedia('(pointer: fine)').matches) return () => {}
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = `<svg viewBox="0 0 40 52" width="40" height="52">
    <path class="wc-glow" d="M8 46V20a12 12 0 0 1 24 0v26Z" fill="${light}" opacity="0"/>
    <path class="wc-fan" d="M8 20a12 12 0 0 1 24 0Z" fill="#d9c7a4" opacity="0"/>
    <path d="M8 46V20a12 12 0 0 1 24 0v26" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M8 20h24M20 8v12" stroke="${color}" stroke-width="1"/>
    <path d="M4 46h32" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/></svg>`
  Object.assign(el.style, { position: 'fixed', left: 0, top: 0, width: '40px', height: '52px', margin: '-26px 0 0 -20px', pointerEvents: 'none', zIndex: 9999, transition: 'opacity .4s', opacity: 0, willChange: 'transform' })
  document.body.appendChild(el)
  const style = document.createElement('style')
  style.textContent = `html.has-window-cursor, html.has-window-cursor a, html.has-window-cursor button { cursor: none }
  .wc-glow,.wc-fan{transition:opacity .5s cubic-bezier(.16,.84,.24,1)}
  [data-wc=link] .wc-fan{opacity:1}[data-wc=link] .wc-glow{opacity:.55}[data-wc=image] .wc-glow{opacity:.25}`
  document.head.appendChild(style)
  document.documentElement.classList.add('has-window-cursor')
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, s = 1, ts = 1, sx = 1, tsx = 1, raf
  const move = (e) => {
    x = e.clientX; y = e.clientY; el.style.opacity = 1
    const t = e.target.closest('a,button,[role=button],img,picture,canvas,input,textarea')
    const kind = !t ? '' : /^(IMG|PICTURE|CANVAS)$/.test(t.tagName) ? 'image' : /^(INPUT|TEXTAREA)$/.test(t.tagName) ? 'text' : 'link'
    el.dataset.wc = kind
    ts = kind === 'link' ? 1.35 : kind === 'image' ? 1.2 : 1; tsx = kind === 'image' ? 1.5 : 1
    el.style.visibility = kind === 'text' ? 'hidden' : 'visible'
  }
  const leave = () => { el.style.opacity = 0 }
  const tick = () => {
    const k = reduce ? 1 : 0.18
    cx += (x - cx) * k; cy += (y - cy) * k; s += (ts - s) * 0.14; sx += (tsx - sx) * 0.14
    el.style.transform = `translate3d(${cx}px,${cy}px,0) scale(${s * sx},${s})`
    raf = requestAnimationFrame(tick)
  }
  addEventListener('pointermove', move, { passive: true }); document.addEventListener('pointerleave', leave)
  tick()
  return () => { cancelAnimationFrame(raf); el.remove(); style.remove(); document.documentElement.classList.remove('has-window-cursor') }
}
