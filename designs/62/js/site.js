// Morning Elevation · Albretsen AS
// One number, the time of day t (0 first light .. 1 evening), drives the page.
// Scroll moves it gently; the visitor can also take hold of the sun and move it.
// Everything else stays still.
import { createFeed } from '../../_shared/feed.js'

const root = document.documentElement
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const START = 0.16

// ------------------------------------------------------------------ the day
// Morning-heavy curve: most reading happens in the early light.
const dayFromScroll = (p) => 0.12 + 0.8 * (p < 0.6 ? (p / 0.6) * 0.45 : 0.45 + ((p - 0.6) / 0.4) * 0.55)

const stage = document.querySelector('.plate__stage')
const sun = document.getElementById('sun')
const arc = document.getElementById('arc')
const clock = document.getElementById('clock')
const subs = new Set()
let t = START, target = START, raf = 0
let offset = 0 // what the visitor's hand added to the scroll-driven day; fades as they scroll on
let lastY = scrollY

const geom = () => {
  const cs = getComputedStyle(stage)
  const n = (k) => parseFloat(cs.getPropertyValue(k))
  return { x: n('--arc-x'), y: n('--arc-y'), rx: n('--arc-rx'), ry: n('--arc-ry') }
}
let G = geom()
const drawArc = () => {
  G = geom()
  arc.setAttribute('d', `M ${G.x - G.rx} ${G.y} A ${G.rx} ${G.ry} 0 0 1 ${G.x + G.rx} ${G.y}`)
}

const timeText = (v) => {
  const mins = Math.round((4.5 + v * 17) * 60) // 04:30 .. 21:30
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function write() {
  root.style.setProperty('--me-t', t.toFixed(4))
  const a = Math.PI * t
  stage.style.setProperty('--sun-x', `${(G.x - G.rx * Math.cos(a)).toFixed(3)}%`)
  stage.style.setProperty('--sun-y', `${(G.y - G.ry * Math.sin(a)).toFixed(3)}%`)
  const tt = timeText(t)
  clock.textContent = tt
  sun.setAttribute('aria-valuenow', Math.round(t * 100))
  sun.setAttribute('aria-valuetext', tt)
  subs.forEach((f) => f(t))
}
function tick() {
  // critically damped follow: the sun never jumps, even on a flick
  t += (target - t) * (reduce.matches ? 1 : 0.12)
  if (Math.abs(target - t) < 0.0004) t = target
  write()
  raf = t === target ? 0 : requestAnimationFrame(tick)
}
const setTarget = (v) => { target = clamp(v); if (!raf) raf = requestAnimationFrame(tick) }
const scrollDay = () => {
  const max = root.scrollHeight - innerHeight
  return dayFromScroll(max > 0 ? scrollY / max : 0)
}
addEventListener('scroll', () => {
  const dy = Math.abs(scrollY - lastY); lastY = scrollY
  offset *= Math.exp(-dy / 700)
  if (Math.abs(offset) < 0.002) offset = 0
  if (!reduce.matches || offset) setTarget(reduce.matches ? START + offset : scrollDay() + offset)
}, { passive: true })

// ----------------------------------------------------------- moving the sun
let moved = false
const markMoved = () => { if (!moved) { moved = true; stage.classList.add('has-moved') } }
const byHand = (v) => {
  const base = reduce.matches ? START : scrollDay()
  offset = clamp(v) - base
  setTarget(base + offset)
  markMoved(); wake()
}
const fromPoint = (cx, cy) => {
  const r = stage.getBoundingClientRect()
  const px = ((cx - r.left) / r.width) * 100, py = ((cy - r.top) / r.height) * 100
  const dx = (G.x - px) / G.rx, dy = (G.y - py) / G.ry
  const ang = dy >= 0 ? Math.atan2(dy, dx) : (dx > 0 ? 0 : Math.PI)
  return ang / Math.PI
}
sun.addEventListener('pointerdown', (e) => {
  e.preventDefault(); sun.setPointerCapture(e.pointerId); stage.classList.add('is-aiming')
})
sun.addEventListener('pointermove', (e) => { if (sun.hasPointerCapture(e.pointerId)) byHand(fromPoint(e.clientX, e.clientY)) })
const release = (e) => { if (sun.hasPointerCapture?.(e.pointerId)) sun.releasePointerCapture(e.pointerId); stage.classList.remove('is-aiming') }
sun.addEventListener('pointerup', release)
sun.addEventListener('pointercancel', release)
sun.addEventListener('pointerenter', () => stage.classList.add('is-aiming'))
sun.addEventListener('pointerleave', (e) => { if (!sun.hasPointerCapture(e.pointerId)) stage.classList.remove('is-aiming') })
sun.addEventListener('focus', () => stage.classList.add('is-aiming'))
sun.addEventListener('blur', () => stage.classList.remove('is-aiming'))
sun.addEventListener('keydown', (e) => {
  const step = { ArrowRight: 0.02, ArrowUp: 0.02, ArrowLeft: -0.02, ArrowDown: -0.02, PageUp: 0.1, PageDown: -0.1 }[e.key]
  if (step !== undefined) { e.preventDefault(); byHand(target + step) }
  if (e.key === 'Home') { e.preventDefault(); byHand(0) }
  if (e.key === 'End') { e.preventDefault(); byHand(1) }
})

drawArc()
write()
requestAnimationFrame(() => stage.classList.add('is-ready'))
let resizeT = 0
addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { drawArc(); write() }, 80) })

// --------------------------------------------------------------- dusk still
// Without the live scene, the evening is a second matte painting crossfaded in.
const duskImg = document.querySelector('.plate__dusk')
const wideQ = matchMedia('(min-aspect-ratio: 1/1)')
subs.add((v) => {
  if (v > 0.5 && !duskImg.hasAttribute('src') && wideQ.matches) {
    duskImg.src = stage.clientWidth > 1400 ? 'assets/img/hero-facade-dusk-2400.webp' : 'assets/img/hero-facade-dusk-1280.webp'
  }
})

// ------------------------------------------------------- the live 3D facade
let facade = null, booting = false, heroInView = true, drawPending = false
const canvas = document.getElementById('live')
const draw = () => {
  if (!facade || drawPending || !heroInView) return
  drawPending = true
  requestAnimationFrame(() => { drawPending = false; facade.render() })
}
async function boot() {
  if (booting) return
  booting = true
  try {
    const probe = document.createElement('canvas').getContext('webgl2')
    if (!probe) return
    const { createFacade } = await import('../assets/3d/facade.js')
    const r = stage.getBoundingClientRect()
    facade = await createFacade({
      canvas, base: 'assets/', sun: t, width: Math.round(r.width), height: Math.round(r.height),
      pixelRatio: Math.min(devicePixelRatio, 1.5), skyUrl: 'assets/3d/tex/sky-env.jpg',
    })
    subs.add((v) => { facade.setSun(v); draw() })
    new ResizeObserver(([e]) => {
      const b = e.contentRect; facade.resize(Math.round(b.width), Math.round(b.height)); draw()
    }).observe(stage)
    facade.setSun(t); facade.render()
    stage.classList.add('is-live')
  } catch (err) {
    // the still stays; nothing is lost
    console.warn('facade: staying with the still', err)
  }
}
const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 700
const saveData = navigator.connection?.saveData
function wake() { if (!facade && !saveData) boot() }
// Desktop: the scene arrives at idle, after first paint. Phones: when the sun is first touched.
if (!coarse && !saveData) {
  addEventListener('load', () => (window.requestIdleCallback || setTimeout)(boot, { timeout: 2500 }))
}
new IntersectionObserver(([e]) => { heroInView = e.isIntersecting; if (heroInView) draw() }).observe(stage)

// ------------------------------------------------------------------- sound
const soundBtn = document.getElementById('sound')
let amb = null
soundBtn.addEventListener('click', async () => {
  if (!amb) {
    const { Ambience } = await import('../assets/audio/ambient.js')
    amb = new Ambience()
    amb.setTimeOfDay(t)
    subs.add((v) => amb.setTimeOfDay(v))
  }
  const on = amb.toggle()
  soundBtn.setAttribute('aria-pressed', String(on))
})

// --------------------------------------------------------- shutters, leaves
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('is-open'); io.unobserve(e.target) }
}), { threshold: 0.4 })
document.querySelectorAll('.me-shutter').forEach((el) => (reduce.matches ? el.classList.add('is-open') : io.observe(el)))
const leaves = document.querySelector('.products__leaves')
new IntersectionObserver(([e], o) => { if (e.isIntersecting) { leaves.classList.add('is-in'); o.disconnect() } }, { rootMargin: '300px' }).observe(leaves)

// --------------------------------------------------------------- live feed
const feed = createFeed()
const NAMES = { 'mcp-emails': 'MCP Emails', 'fun-libs': 'Fun Libs', toolrails: 'Toolrails', 'albretsen.no': 'albretsen.no' }
const say = (e) => (e.country ? `${e.text} · ${e.country}` : e.ms ? `${e.text} · ${e.ms} ms` : e.text)
const ago = (d) => {
  const s = (Date.now() - d.getTime()) / 1000
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`
}
const heroFeed = document.querySelector('.plate__feed'), heroText = document.getElementById('feed-text')
const pulses = new Map([...document.querySelectorAll('[data-pulse]')].map((el) => [el.dataset.pulse, { el, e: null }]))

const lampOn = (lamp) => { lamp.classList.remove('is-lit'); void lamp.offsetWidth; lamp.classList.add('is-lit') }
const renderPulse = (p) => { if (p.e) p.el.querySelector('.pulse__t').textContent = `${p.e.text}, ${ago(p.e.time)}` }
function show(e, fresh) {
  if (e.product !== 'albretsen.no') {
    const line = `${NAMES[e.product]} · ${say(e)}`
    if (fresh && !reduce.matches) {
      heroFeed.classList.add('is-swapping')
      setTimeout(() => { heroText.textContent = line; heroFeed.classList.remove('is-swapping') }, 500)
      lampOn(heroFeed.querySelector('.lamp'))
    } else heroText.textContent = line
  }
  const p = pulses.get(e.product)
  if (p) { p.e = e; renderPulse(p); if (fresh && !reduce.matches) lampOn(p.el.querySelector('.lamp')) }
}
const hist = feed.recent(50)
for (const e of [...hist].reverse()) {
  const p = pulses.get(e.product); if (p) { p.e = e; renderPulse(p) }
}
const first = hist.find((e) => e.product !== 'albretsen.no'); if (first) show(first, false)
feed.subscribe((e) => show(e, true))
setInterval(() => pulses.forEach(renderPulse), 20000)

// ------------------------------------------------------ earlier work caption
const caption = document.getElementById('caption')
const DEFAULT_CAPTION = caption.textContent
let pinned = null
const setCaption = (txt) => {
  if (caption.textContent === txt) return
  caption.classList.add('is-swapping')
  setTimeout(() => { caption.textContent = txt; caption.classList.remove('is-swapping') }, reduce.matches ? 0 : 180)
}
const captionFor = (b) => `${b.querySelector('.shutters__n').textContent}, ${b.querySelector('.shutters__y').textContent}. ${b.dataset.line}`
document.querySelectorAll('#shutters button').forEach((b) => {
  b.setAttribute('aria-pressed', 'false')
  b.addEventListener('click', () => {
    const on = pinned !== b
    pinned?.setAttribute('aria-pressed', 'false')
    pinned = on ? b : null
    b.setAttribute('aria-pressed', String(on))
    setCaption(on ? captionFor(b) : DEFAULT_CAPTION)
  })
  b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setCaption(captionFor(b)) })
  b.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setCaption(pinned ? captionFor(pinned) : DEFAULT_CAPTION) })
})

// --------------------------------------------------------------- copy line
const copyBtn = document.getElementById('copy'), copyStatus = document.getElementById('copy-status')
copyBtn.addEventListener('click', async () => {
  const txt = document.getElementById('cmd').textContent
  try { await navigator.clipboard.writeText(txt) } catch {
    const s = getSelection(), rg = document.createRange(); rg.selectNodeContents(document.getElementById('cmd')); s.removeAllRanges(); s.addRange(rg)
  }
  copyBtn.classList.add('is-done'); copyStatus.textContent = 'Command copied'
  clearTimeout(copyBtn._t)
  copyBtn._t = setTimeout(() => { copyBtn.classList.remove('is-done'); copyStatus.textContent = '' }, 1800)
})
