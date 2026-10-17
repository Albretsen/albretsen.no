// Pavilion Light — motion helpers (no dependencies). See motion.css for the catalogue.
//   import { horizonRise, heatHaze, sunScrub } from './assets/motion.js'

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// 2. HORIZON RISE: add .is-in when a .rise element is a fifth into the viewport.
export function horizonRise(root = document) {
  const els = root.querySelectorAll('.rise')
  if (reduced() || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target) }
  }), { rootMargin: '0px 0px -20% 0px' })
  els.forEach((e) => io.observe(e))
}

// 4. HEAT HAZE: shimmer only a thin band just above the horizon of an <img>/<picture>.
// Technique: SVG feTurbulence + feDisplacementMap (as in Codrops' and Framer's haze
// effects), applied to a cropped duplicate so the filter area stays small and cheap.
// The noise drifts sideways at ~24 fps; vertical frequency > horizontal = rising air.
let hazeId = 0
export function heatHaze(container, { top = 0.42, height = 0.12, scale = 5 } = {}) {
  if (reduced()) return () => {}
  const img = container.querySelector('img'); if (!img) return () => {}
  const id = `haze-${++hazeId}`
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.style.position = 'absolute'
  svg.innerHTML = `<filter id="${id}" x="0" y="-10%" width="100%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="2" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`
  document.body.appendChild(svg)
  const band = document.createElement('div')
  band.className = 'haze-band'
  Object.assign(band.style, { top: `${top * 100}%`, height: `${height * 100}%`, overflow: 'hidden', filter: `url(#${id})`,
    maskImage: 'linear-gradient(transparent, #000 35%, #000 65%, transparent)', webkitMaskImage: 'linear-gradient(transparent, #000 35%, #000 65%, transparent)' })
  const copy = new Image(); copy.src = img.currentSrc || img.src; copy.alt = ''; copy.setAttribute('aria-hidden', 'true') // currentSrc: the art-directed source <picture> chose
  Object.assign(copy.style, { position: 'absolute', left: 0, width: '100%', height: `${100 / height}%`, top: `${-top / height * 100}%`, objectFit: getComputedStyle(img).objectFit })
  band.appendChild(copy); container.classList.add('haze'); container.appendChild(band)
  const turb = svg.querySelector('feTurbulence')
  let raf = 0, last = 0, visible = true
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(container)
  const tick = (now) => {
    raf = requestAnimationFrame(tick)
    if (!visible || now - last < 42) return
    last = now
    const s = now / 1000
    turb.setAttribute('baseFrequency', `${0.004 + Math.sin(s * 0.3) * 0.0008} ${0.09 + Math.sin(s * 0.7) * 0.012}`)
    turb.setAttribute('seed', String(4 + Math.floor(s * 0.5) % 3))
  }
  raf = requestAnimationFrame(tick)
  return () => { cancelAnimationFrame(raf); io.disconnect(); band.remove(); svg.remove() }
}

// 5. SUN SCRUB: map the scroll progress through `section` to a time of day 0..1.
// Writes --t on <html> and calls onTime(t) (e.g. pavilion.setTime). Scroll-scrubbed
// sequences like Apple's product pages, but driving a live scene instead of frames.
export function sunScrub(section, onTime = () => {}, { from = 0.04, to = 0.96 } = {}) {
  let ticking = false
  const update = () => {
    ticking = false
    const r = section.getBoundingClientRect()
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)))
    const t = from + (to - from) * p
    document.documentElement.style.setProperty('--t', t.toFixed(4))
    onTime(t)
  }
  const on = () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }
  addEventListener('scroll', on, { passive: true }); addEventListener('resize', on)
  update()
  return () => { removeEventListener('scroll', on); removeEventListener('resize', on) }
}
