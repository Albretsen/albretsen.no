/**
 * Design 88 "Labelled Sky" — motion study (Web Animations API, no library).
 *
 * 1. pressOn(el)     "Press-on"      A sticker lands: drops from 1.3x with a tilt, overshoots
 *                                     on a baked spring, and only THEN gets its hard shadow, as
 *                                     if pressed onto the page. Ref: neo-brutalist UI kits
 *                                     (RetroUI, Gumroad) use hard 0-blur shadows; we animate them.
 * 2. peel(el)        "Peel & lift"   Hover lifts a sticker toward the cursor: the shadow grows
 *                                     4→10px, a corner folds back to show the paper side.
 *                                     Ref: Linear's restrained hover depth; physical sticker sheets.
 * 3. trace(svg)      "Tension line"  Constellation lines draw star-to-star (stroke-dashoffset), each
 *                                     star pops with a spring after its line arrives. Ref: Aceternity
 *                                     "Tracing Beam" / "Background Beams"; star-chart engraving order.
 * 4. loupe(el)       "Brass loupe"   Hover opens a circular window onto a hidden layer (a Dürer
 *                                     woodcut detail under a product card); radius springs open and
 *                                     follows the pointer. Ref: museum zoom viewers; the brief's
 *                                     "rich hover states that reveal hidden detail".
 * 5. fracture(el)    "Fracture snap" An element splits into three clip-path shards that slide apart
 *                                     and snap back together (composite: 'add' so it stacks on any
 *                                     existing transform). Use once, for a moment of emphasis.
 *
 * Every function returns quickly and is a no-op (final state applied) under reduced motion.
 */

export const SPRING_SNAP = 'linear(0, .047, .165, .322, .493, .659, .806, .927, 1.018, 1.081, 1.118, 1.134, 1.133, 1.121, 1.101, 1.079, 1.056, 1.034, 1.016, 1.002, .992, .986, .982, .982, .983, .985, .988, .991, .994, .997, .999, 1.001, 1.002, 1)'
export const SPRING_STAMP = 'linear(0, .073, .255, .493, .74, .959, 1.126, 1.233, 1.28, 1.276, 1.235, 1.172, 1.101, 1.035, .981, .944, .924, .92, .928, .944, .963, .983, 1, 1.012, 1.02, 1.023, 1.022, 1.018, 1.013, 1.007, 1.002, .998, .995, .994, .996, .999, 1)'
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** 1. Press-on: sticker lands, then the shadow arrives. */
export function pressOn(el, { delay = 0, rot = -1.5, shadow = 'var(--forest)' } = {}) {
  const end = { transform: `rotate(${rot}deg)`, boxShadow: `4px 4px 0 ${shadow}` }
  if (reduced()) return Object.assign(el.style, end)
  el.animate([
    { transform: `translateY(-24px) scale(1.3) rotate(${rot + 9}deg)`, opacity: 0, boxShadow: `0 0 0 ${shadow}` },
    { opacity: 1, offset: 0.25 },
    { transform: `rotate(${rot}deg)`, opacity: 1, boxShadow: `0 0 0 ${shadow}` },
  ], { duration: 620, delay, easing: SPRING_STAMP, fill: 'backwards' })
  return el.animate([{ boxShadow: `0 0 0 ${shadow}` }, end], { duration: 220, delay: delay + 420, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' })
}

/** 2. Peel & lift on hover. Expects .st-sticker.st-peel from motion.css. */
export function peel(el, { rot = -1.5 } = {}) {
  let anim
  const go = (on) => {
    if (reduced()) return
    const from = getComputedStyle(el)
    anim?.cancel()
    anim = el.animate([
      { transform: from.transform, boxShadow: from.boxShadow, '--peel': from.getPropertyValue('--peel') || '0px' },
      on ? { transform: `translate(-3px,-4px) rotate(${rot - 1}deg)`, boxShadow: '10px 12px 0 var(--forest)', '--peel': '28px' }
         : { transform: `rotate(${rot}deg)`, boxShadow: '4px 4px 0 var(--forest)', '--peel': '0px' },
    ], { duration: on ? 420 : 520, easing: SPRING_SNAP, fill: 'forwards' })
  }
  el.addEventListener('pointerenter', () => go(true))
  el.addEventListener('pointerleave', () => go(false))
  el.addEventListener('focusin', () => go(true))
  el.addEventListener('focusout', () => go(false))
}
// --peel must be registered to interpolate
if (typeof CSS !== 'undefined' && CSS.registerProperty) {
  try { CSS.registerProperty({ name: '--peel', syntax: '<length>', inherits: false, initialValue: '0px' }) } catch {}
  try { CSS.registerProperty({ name: '--r', syntax: '<length>', inherits: true, initialValue: '0px' }) } catch {}
}

/** 3. Tension line: draw <line>/<path> elements in order, then pop the stars (<circle>/[data-star]). */
export function trace(svg, { step = 160, lineDur = 520 } = {}) {
  const lines = [...svg.querySelectorAll('[data-line]')]
  const stars = [...svg.querySelectorAll('[data-star]')]
  if (reduced()) return
  lines.forEach((ln, i) => {
    const len = ln.getTotalLength ? ln.getTotalLength() : 200
    ln.style.strokeDasharray = `${len}`
    ln.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: lineDur, delay: i * step, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'both' })
  })
  stars.forEach((st, i) => {
    st.style.transformBox = 'fill-box'; st.style.transformOrigin = 'center'
    st.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 700, delay: i * step + lineDur * 0.6, easing: SPRING_STAMP, fill: 'both' })
  })
}

/** 4. Brass loupe: reveal .st-loupe-hidden through a pointer-following circle. */
export function loupe(el, { radius = 90 } = {}) {
  const ring = el.querySelector('.st-loupe-ring')
  let anim
  const open = (r) => {
    anim?.cancel()
    const cur = getComputedStyle(el).getPropertyValue('--r') || '0px'
    anim = el.animate([{ '--r': cur }, { '--r': `${r}px` }], { duration: reduced() ? 0 : 520, easing: SPRING_SNAP, fill: 'forwards' })
  }
  el.addEventListener('pointerenter', () => open(radius))
  el.addEventListener('pointerleave', () => open(0))
  el.addEventListener('pointermove', (e) => {
    const b = el.getBoundingClientRect()
    el.style.setProperty('--x', `${e.clientX - b.left}px`); el.style.setProperty('--y', `${e.clientY - b.top}px`)
  })
  if (ring) ring.style.display = ''
}

/** 5. Fracture snap: three shards slide apart and snap back. */
export function fracture(el, { gap = 14 } = {}) {
  if (reduced()) return
  const parent = el.parentElement
  const b = el.getBoundingClientRect(), pb = parent.getBoundingClientRect()
  const cuts = [['0 0, 36% 0, 31% 100%, 0 100%', -1], ['36% 0, 68% 0, 72% 100%, 31% 100%', 0.2], ['68% 0, 100% 0, 100% 100%, 72% 100%', 1]]
  if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative'
  const shards = cuts.map(([poly, dir]) => {
    const c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true')
    Object.assign(c.style, { position: 'absolute', left: `${b.left - pb.left}px`, top: `${b.top - pb.top}px`, width: `${b.width}px`, height: `${b.height}px`, margin: 0, clipPath: `polygon(${poly})`, pointerEvents: 'none' })
    parent.appendChild(c)
    const a = c.animate([
      { transform: 'translate(0,0)' },
      { transform: `translate(${dir * gap}px, ${dir * -3}px) rotate(${dir * 0.8}deg)`, offset: 0.35 },
      { transform: 'translate(0,0)' },
    ], { duration: 900, easing: SPRING_SNAP, composite: 'add' })
    a.finished.then(() => c.remove())
    return a
  })
  el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.99 }, { opacity: 1 }], { duration: 900 })
  return Promise.all(shards.map(a => a.finished))
}
