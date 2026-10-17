// Silica Atlas: motion study. Four signature animations built on Motion (motion.dev), pinned.
//
//   import { vitrify, seam, chorusIn, loupe } from './motion.js'
//
// 1. VITRIFY  (the loading moment worth waiting for)
//    The mark is engraved line by line in ink while a year counter runs 2016 -> 2026,
//    then the right half "vitrifies": green glass wipes in from the seam, a glint crosses it,
//    and the paper sheet lifts away from the page like a plate pulled from a press.
//    Researched from: Rive community loaders (geometric draw-on loaders, rive.app/community/files/1497-2922),
//    Vercel's deploy sequence (count-up + state flip), motion.dev "SVG path drawing" example.
// 2. SEAM     (the then/now split)
//    A vertical glass blade between the ink print (first app) and the glass render (today).
//    It follows the pointer on a soft spring and drifts with scroll. Researched from motion.dev
//    "Scroll-linked spring animation" and image-comparison sliders on product sites.
// 3. CHORUS   (staggered arrival)
//    Elements arrive like glass beads poured onto paper: a spring with one small overshoot,
//    a de-blur, staggered outward from the origin you pass. motion.dev "Physical stagger".
// 4. LOUPE    (a lens under the cursor)
//    A round lens that magnifies any image with a little rim of green glass. It lags the
//    pointer on a spring so it feels heavy. Shadertoy-style refraction, done with CSS backgrounds.
//
// All four respect prefers-reduced-motion (they jump to the end state).

import { animate, stagger, scroll } from 'https://cdn.jsdelivr.net/npm/motion@11.18.2/+esm'

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const NS = 'http://www.w3.org/2000/svg'
const spring = { type: 'spring', stiffness: 170, damping: 24 }

// ---------------------------------------------------------------- 1. VITRIFY
const MARK = `
<svg viewBox="0 0 64 64" aria-hidden="true">
  <defs>
    <clipPath id="vit-l"><path d="M32 6a26 26 0 0 0 0 52z"/></clipPath>
    <clipPath id="vit-r"><rect class="vit-wipe" x="32" y="0" width="0" height="64"/></clipPath>
    <radialGradient id="vit-g" cx=".66" cy=".34" r=".8"><stop offset="0" stop-color="#a0f08f"/><stop offset=".45" stop-color="#389e3d"/><stop offset="1" stop-color="#005e26"/></radialGradient>
  </defs>
  <path d="M32 6a26 26 0 0 1 0 52z" fill="url(#vit-g)" clip-path="url(#vit-r)"/>
  <g clip-path="url(#vit-l)" stroke="#091710" stroke-width="3.2" fill="none">
    ${[12.5, 20.5, 28.5, 36.5, 44.5, 52.5].map(y => `<path class="vit-h" pathLength="1" d="M32 ${y}H4"/>`).join('')}
  </g>
  <path class="vit-glint" pathLength="1" d="M41.5 13.5a20 20 0 0 1 9 12" fill="none" stroke="#f7f5ea" stroke-width="3" stroke-linecap="round"/>
  <circle class="vit-o" pathLength="1" cx="32" cy="32" r="26" fill="none" stroke="#091710" stroke-width="3.4" transform="rotate(-90 32 32)"/>
  <path class="vit-v" pathLength="1" d="M32 5v54" stroke="#091710" stroke-width="2.2"/>
</svg>`

/**
 * Run the loading moment. Resolves when the sheet has lifted.
 * @param {object} o
 * @param {Promise} [o.ready]   wait for this as well (e.g. hero img.decode()); min 1.6 s, max 4 s total
 * @param {HTMLElement} [o.mount=document.body]
 */
export async function vitrify ({ ready = Promise.resolve(), mount = document.body } = {}) {
  const sheet = document.createElement('div')
  sheet.className = 'vitrify'
  sheet.innerHTML = `<div>${MARK}<div class="year" aria-live="off">2016</div></div>`
  sheet.setAttribute('role', 'presentation')
  mount.appendChild(sheet)
  const svg = sheet.querySelector('svg'), year = sheet.querySelector('.year')
  const q = s => svg.querySelectorAll(s)
  q('[pathLength]').forEach(p => p.setAttribute('stroke-dasharray', '0 1'))
  if (reduced()) {
    q('[pathLength]').forEach(p => p.setAttribute('stroke-dasharray', '1 0'))
    svg.querySelector('.vit-wipe').setAttribute('width', 26); year.textContent = '2026'
    await ready; sheet.remove(); return
  }
  const t0 = performance.now()
  try {
  // engrave: outline, then the hatch lines one by one, then the axis
  animate(q('.vit-o'), { pathLength: [0, 1] }, { duration: 0.9, ease: [0.65, 0, 0.35, 1] })
  animate(q('.vit-h'), { pathLength: [0, 1] }, { duration: 0.42, delay: stagger(0.085, { startDelay: 0.25 }), ease: [0.65, 0, 0.35, 1] })
  animate(q('.vit-v'), { pathLength: [0, 1] }, { duration: 0.5, delay: 0.55 })
  // the years go by
  animate(2016, 2026, { duration: 1.3, delay: 0.2, ease: [0.3, 0, 0.2, 1], onUpdate: v => { year.textContent = Math.round(v) } })
  await Promise.race([Promise.all([ready, wait(1250)]), wait(3300)])
  // vitrify: glass wipes out of the seam on a spring, glint passes
  const wipe = svg.querySelector('.vit-wipe')
  await race(animate(0, 26, { ...spring, stiffness: 120, damping: 16, onUpdate: v => wipe.setAttribute('width', v) }), 1400)
  animate(q('.vit-glint'), { pathLength: [0, 1] }, { duration: 0.45 })
  await race(animate(sheet.firstElementChild, { scale: [1, 1.06, 1] }, { duration: 0.5, ease: 'easeOut' }), 800)
  // lift the sheet like a print off the press
  await race(animate(sheet, { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'] }, { duration: 0.75, ease: [0.7, 0, 0.2, 1] }), 1100)
  } finally { sheet.remove() }
  return performance.now() - t0
}
const wait = ms => new Promise(r => setTimeout(r, ms))
const race = (p, ms) => Promise.race([Promise.resolve(p), wait(ms)])

// ---------------------------------------------------------------- 2. SEAM
/**
 * Spring-driven then/now seam. Markup:
 *   <div class="seam"><img then><div class="seam-now"><img now></div><div class="seam-blade"></div></div>
 */
export function seam (el, { min = 8, max = 92, idle = true } = {}) {
  let cur = 50, ctrl
  const set = v => { cur = v; el.style.setProperty('--seam', v.toFixed(2)) }
  const to = (v, vel = 0) => {
    v = Math.min(max, Math.max(min, v))
    if (reduced()) return set(v)
    ctrl?.stop(); ctrl = animate(cur, v, { ...spring, velocity: vel, onUpdate: set })
  }
  const move = e => { const r = el.getBoundingClientRect(); to(((e.clientX - r.left) / r.width) * 100) }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerleave', () => to(50))
  // drift with scroll: as the hero leaves, "today" takes over the frame
  const stopScroll = scroll(p => { if (!el.matches(':hover')) to(50 - p * 36) }, { target: el, offset: ['start start', 'end start'] })
  // first-visit tease: sweep once so people discover it
  if (idle && !reduced()) setTimeout(() => { to(30); setTimeout(() => to(50), 650) }, 900)
  set(50)
  return { to, destroy () { el.removeEventListener('pointermove', move); stopScroll() } }
}

// ---------------------------------------------------------------- 3. CHORUS
export function chorusIn (els, { from = 'center', delay = 0 } = {}) {
  if (reduced()) return animate(els, { opacity: 1 }, { duration: 0 })
  return animate(els,
    { opacity: [0, 1], scale: [0.72, 1], y: [24, 0], filter: ['blur(8px)', 'blur(0px)'] },
    { type: 'spring', bounce: 0.32, duration: 0.9, delay: stagger(0.055, { from, startDelay: delay }) })
}

// ---------------------------------------------------------------- 4. LOUPE
export function loupe (container, src, { size = 180, zoom = 2.2 } = {}) {
  const l = document.createElement('div')
  Object.assign(l.style, {
    position: 'absolute', left: 0, top: 0, width: size + 'px', height: size + 'px', borderRadius: '50%',
    pointerEvents: 'none', backgroundImage: `url("${src}")`, backgroundRepeat: 'no-repeat', opacity: 0,
    boxShadow: 'inset 0 0 0 1.5px rgb(9 23 16 / .5), inset 0 0 18px 6px rgb(56 158 61 / .45), inset -10px -14px 26px rgb(255 255 255 / .35), 14px 22px 34px rgb(9 23 16 / .22)',
    willChange: 'transform'
  })
  const shine = document.createElement('div')
  Object.assign(shine.style, { position: 'absolute', left: '18%', top: '14%', width: '30%', height: '13%', borderRadius: '50%', background: 'rgb(255 255 255 / .65)', filter: 'blur(2px)', rotate: '-32deg' })
  l.appendChild(shine)
  container.style.position ||= 'relative'
  container.appendChild(l)
  const pos = { x: 0, y: 0 }
  let ctrl
  function paint () {
    const r = container.getBoundingClientRect()
    l.style.transform = `translate(${pos.x - size / 2}px, ${pos.y - size / 2}px)`
    l.style.backgroundSize = `${r.width * zoom}px ${r.height * zoom}px`
    l.style.backgroundPosition = `${-(pos.x * zoom - size / 2)}px ${-(pos.y * zoom - size / 2)}px`
  }
  container.addEventListener('pointermove', e => {
    const r = container.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top
    if (reduced()) { pos.x = x; pos.y = y; return paint() }
    ctrl?.forEach(c => c.stop())
    const opt = { type: 'spring', stiffness: 260, damping: 26 }
    ctrl = [animate(pos.x, x, { ...opt, onUpdate: v => { pos.x = v; paint() } }),
      animate(pos.y, y, { ...opt, onUpdate: v => { pos.y = v; paint() } })]
  })
  container.addEventListener('pointerenter', () => animate(l, { opacity: 1, scale: [0.6, 1] }, { type: 'spring', bounce: 0.3, duration: 0.5 }))
  container.addEventListener('pointerleave', () => animate(l, { opacity: 0, scale: 0.7 }, { duration: 0.25 }))
  return l
}
