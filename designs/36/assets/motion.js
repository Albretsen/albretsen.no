/*
 * Infrared Fable — motion study (JS layer). GSAP 3.12.5 + ScrollTrigger, loaded lazily from jsDelivr.
 *
 *   import { initMotion } from './motion.js'
 *   await initMotion()            // wires everything with data attributes below
 *
 * Signatures (researched references in ASSETS.md):
 *  horizonRise(el)   ENTRANCE    split a headline into chars that rise from *behind* the treeline layer
 *                                (the photo's front matte sits above the text), then scroll-parallax the
 *                                three depth layers: sky slow, type medium, front fast.  [data-m="rise"]
 *  wingbeat(el)      HOVER/IDLE  split a butterfly into two halves hinged at the body; idle flap with
 *                                random pauses, fast flutter on hover, drifts along a curve on scroll. [data-m="wing"]
 *  aperture(el)      TRANSITION  a section is revealed through a pointed-arch window that opens to full
 *                                bleed as you scroll (scrubbed clip-path).  [data-m="aperture"]
 *  magnetic(el)      HOVER       buttons and links lean toward the pointer within a radius and snap back
 *                                with an elastic spring; the label moves further than the shell (parallax). [data-m="magnetic"]
 */

const GSAP = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'
const ST = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js'
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function load(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res()
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s)
  })
}

export async function loadGsap() {
  if (!window.gsap) await load(GSAP)
  if (!window.ScrollTrigger) await load(ST)
  window.gsap.registerPlugin(window.ScrollTrigger)
  return window.gsap
}

/* ---------- 1. HORIZON RISE ---------- */
export function horizonRise(el, { delay = 0.25, scene } = {}) {
  const gsap = window.gsap
  if (!el.dataset.split) {
    const text = el.textContent
    el.textContent = ''
    el.setAttribute('aria-label', text)
    ;[...text].forEach((ch, i) => {
      const s = document.createElement('span')
      s.className = 'm-rise__char'; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true')
      s.textContent = ch === ' ' ? ' ' : ch
      el.appendChild(s)
    })
    el.dataset.split = '1'
  }
  const chars = el.querySelectorAll('.m-rise__char')
  if (reduced()) { gsap.set(chars, { y: 0, opacity: 1, filter: 'none' }); return }
  gsap.fromTo(chars,
    { yPercent: 85, opacity: 0, filter: 'blur(8px)', rotate: (i) => (i % 2 ? 4 : -4) },
    { yPercent: 0, opacity: 1, filter: 'blur(0px)', rotate: 0, duration: 1.6, ease: 'expo.out', stagger: { each: 0.05, from: 'center' }, delay })
  // depth parallax: layers move at different rates as the hero scrolls away
  scene = scene || el.closest('[data-m-scene]')
  if (scene) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top top', end: 'bottom top', scrub: 0.6 } })
    scene.querySelectorAll('[data-depth]').forEach(layer => {
      tl.to(layer, { yPercent: parseFloat(layer.dataset.depth) * 30, ease: 'none' }, 0)
    })
  }
}

/* ---------- 2. WINGBEAT ---------- */
export function wingbeat(el, { drift = true } = {}) {
  const gsap = window.gsap
  const img = el.querySelector('img'); if (!img || el.classList.contains('is-split')) return
  const mk = (side) => {
    const d = document.createElement('span'); d.className = `m-wing__half m-wing__half--${side}`
    d.style.animation = 'none'
    const c = img.cloneNode(); c.alt = ''; d.appendChild(c); el.appendChild(d); return d
  }
  const L = mk('l'), R = mk('r')
  el.classList.add('is-split')
  if (reduced()) return
  const flap = (fast) => gsap.timeline()
    .to(L, { rotateY: fast ? 70 : 58, duration: fast ? 0.09 : 0.32, ease: 'sine.inOut' }, 0)
    .to(R, { rotateY: fast ? -70 : -58, duration: fast ? 0.09 : 0.32, ease: 'sine.inOut' }, 0)
    .to([L, R], { rotateY: 0, duration: fast ? 0.11 : 0.5, ease: 'sine.out' })
  let hover = false
  const idle = () => {
    const tl = flap(hover)
    tl.eventCallback('onComplete', () => gsap.delayedCall(hover ? 0 : gsap.utils.random(0.4, 2.4), idle))
  }
  idle()
  el.addEventListener('pointerenter', () => { hover = true })
  el.addEventListener('pointerleave', () => { hover = false })
  if (drift) {
    gsap.to(el, { scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      x: () => gsap.utils.random(-80, 80), y: -120, rotate: () => gsap.utils.random(-14, 14), ease: 'sine.inOut' })
  }
}

/* ---------- 3. APERTURE ---------- */
export function aperture(el) {
  const gsap = window.gsap
  if (reduced()) { el.style.setProperty('--ap', 1); return }
  gsap.fromTo(el, { '--ap': 0 }, { '--ap': 1, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 15%', scrub: 2 } })
  const img = el.querySelector('img')
  if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
}

/* ---------- 4. MAGNETIC ---------- */
export function magnetic(el, { strength = 0.38, radius = 90 } = {}) {
  const gsap = window.gsap
  if (reduced() || matchMedia('(pointer: coarse)').matches) return
  let label = el.querySelector('.m-magnetic__label')
  if (!label) { label = document.createElement('span'); label.className = 'm-magnetic__label'; while (el.firstChild) label.appendChild(el.firstChild); el.appendChild(label) }
  const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
  const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
  const lxTo = gsap.quickTo(label, 'x', { duration: 0.6, ease: 'power3.out' })
  const lyTo = gsap.quickTo(label, 'y', { duration: 0.6, ease: 'power3.out' })
  let active = false
  window.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const dx = e.clientX - cx, dy = e.clientY - cy
    const reach = Math.max(r.width, r.height) / 2 + radius
    if (Math.hypot(dx, dy) < reach) {
      active = true
      xTo(dx * strength); yTo(dy * strength); lxTo(dx * strength * 0.45); lyTo(dy * strength * 0.45)
    } else if (active) {
      active = false
      gsap.to([el, label], { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.32)', overwrite: true })
    }
  }, { passive: true })
}

/* ---------- auto wiring ---------- */
export async function initMotion(root = document) {
  document.documentElement.classList.add('m-js')
  await loadGsap()
  root.querySelectorAll('[data-m="rise"]').forEach(el => horizonRise(el))
  root.querySelectorAll('[data-m="wing"]').forEach(el => wingbeat(el, { drift: el.dataset.drift !== 'off' }))
  root.querySelectorAll('[data-m="aperture"]').forEach(el => aperture(el))
  root.querySelectorAll('[data-m="magnetic"]').forEach(el => magnetic(el))
  window.ScrollTrigger.refresh()
}
