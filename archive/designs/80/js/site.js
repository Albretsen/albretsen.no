// Pavilion Light — homepage behaviour.
// One horizon, one day: scrolling (or dragging the sun) moves the time from first light to sunset.
// The baked still paints first; a live three.js scene fades in over it on capable desktops.
import { content } from '../../_shared/content.js'
import { createFeed, describe } from '../../_shared/feed.js'
import { horizonRise, heatHaze } from '../assets/motion.js'

const $ = (s, r = document) => r.querySelector(s)
const root = document.documentElement
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const narrow = matchMedia('(max-aspect-ratio: 1/1)') // portrait viewports use the portrait stills
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))

const day = $('#day'), stage = $('#stage'), scene = $('#scene'), sun = $('#sun')
const clock = $('#clock'), clockWord = $('#clock-word'), layersEl = $('#layers'), canvas = $('#live'), status = $('#status')
const bar = $('.bar')

// ---------- facts come from the shared content file (the static HTML mirrors it for no-JS)
for (const li of document.querySelectorAll('.kiosk[data-id]')) {
  const p = content.products.find((x) => x.id === li.dataset.id); if (!p) continue
  const set = (k, v) => { const el = li.querySelector(`[data-k="${k}"]`); if (el && v != null) el.textContent = v }
  set('line', p.line); set('value', p.figure?.value); set('label', p.figure?.label); set('facts', p.facts?.join(' · '))
}

// ---------- time of day
const T_MIN = 0.04, T_MAX = 0.96, MORNING = 0.30
let t = MORNING, dawnT = MORNING, live = null, night = false, layers = null, haze = null

const pad = (n) => String(n).padStart(2, '0')
function clockOf(v) { const h = 4.5 + v * 15; const m = Math.round((h % 1) * 60 / 5) * 5; return `${pad(Math.floor(h) + (m === 60 ? 1 : 0))}:${pad(m % 60)}` }
function wordOf(v) { return v < 0.14 ? 'First light' : v < 0.42 ? 'Morning' : v < 0.6 ? 'Noon' : v < 0.82 ? 'Golden hour' : 'Sunset' }

function range() { return { top: day.offsetTop, len: Math.max(1, day.offsetHeight - innerHeight) } }
function scrollProgress() { const { top, len } = range(); return clamp((scrollY - top) / len) }
function timeFromScroll() { const p = scrollProgress(); return dawnT + (T_MAX - dawnT) * p }

function render() {
  root.style.setProperty('--t', t.toFixed(4))
  root.style.setProperty('--dawn', clamp((MORNING - t) / (MORNING - T_MIN)).toFixed(3))
  root.style.setProperty('--copy', clamp(1 - (t - 0.36) / 0.1).toFixed(3))
  root.style.setProperty('--end', clamp((t - 0.8) / 0.1).toFixed(3))
  root.style.setProperty('--eve', clamp((t - 0.62) / (T_MAX - 0.62)).toFixed(3))
  if (document.activeElement !== sun || !sun.matches(':active')) sun.value = t.toFixed(3)
  const c = clockOf(t), w = night ? 'After hours' : wordOf(t)
  clock.textContent = c; clockWord.textContent = w
  sun.setAttribute('aria-valuetext', `${c}, ${w.toLowerCase()}`)
  if (live) live.setTime(t)
  else paintStills()
  if (haze) haze.style.opacity = clamp(1 - Math.abs(t - MORNING) / 0.07).toFixed(3)
}

// ---------- still layers: crossfade the baked day series (lazy, only once the visitor moves the sun)
function stillPicture(base) {
  const pic = document.createElement('picture')
  const portrait = base.includes('portrait')
  pic.innerHTML = `<source type="image/avif" srcset="assets/hero/${base}.avif"><img src="assets/hero/${base}.jpg" width="${portrait ? 1080 : 1600}" height="${portrait ? 1620 : 900}" alt="" decoding="async">`
  return pic
}
function ensureLayers() {
  if (layers || live) return
  layers = []
  const add = (base, op) => { const pic = stillPicture(base); layersEl.appendChild(pic); const img = pic.querySelector('img'); img.style.opacity = 0; layers.push({ img, op }); img.decode?.().then(paintStills, () => {}) }
  if (narrow.matches) {
    add('hero-portrait-sunset-1080', (v) => clamp((v - 0.72) / 0.24))
  } else {
    add('day-03-noon-1600', (v) => clamp((v - MORNING) / 0.2))
    add('day-04-golden-1600', (v) => clamp((v - 0.5) / 0.26))
    add('day-05-sunset-1600', (v) => clamp((v - 0.76) / 0.2))
    add('day-01-first-light-1600', (v) => clamp((MORNING - v) / (MORNING - T_MIN)))
    add('day-06-after-hours-1600', () => (night ? 1 : 0))
  }
  // Images are absolutely positioned inside a picture; make the picture transparent to layout.
  layersEl.querySelectorAll('picture').forEach((p) => (p.style.display = 'contents'))
}
function paintStills() { if (layers) for (const l of layers) l.img.style.opacity = l.op(t).toFixed(3) }

// ---------- scroll and the sun control
let ticking = false
function onScroll() {
  if (ticking) return; ticking = true
  requestAnimationFrame(() => {
    ticking = false
    if (!reduced) {
      if (scrollY > 4) ensureLayers()
      t = timeFromScroll(); render()
    }
    bar.classList.toggle('is-scrolled', scrollY > day.offsetTop + day.offsetHeight - 90)
  })
}
addEventListener('scroll', onScroll, { passive: true })
addEventListener('resize', () => { if (live) live.resize(stage.clientWidth, stage.clientHeight); onScroll() })

sun.addEventListener('input', () => {
  const v = +sun.value
  ensureLayers()
  if (reduced) { t = v; render(); return }
  const { top, len } = range(), p = scrollProgress()
  if (v < dawnT || (p < 0.002 && v <= MORNING)) { dawnT = v; t = v; if (p > 0) scrollTo({ top, behavior: 'instant' }); render(); return }
  const target = (v - dawnT) / (T_MAX - dawnT)
  scrollTo({ top: top + target * len, behavior: 'instant' })
  t = v; render()
})

// ---------- After Hours (hidden): click the sun three times, or press N
function setNightUI(b) {
  night = !!b
  root.classList.toggle('is-night', night)
  status.textContent = night ? 'After hours. Night has fallen over the pavilion.' : 'Daylight again.'
  render()
}
function toggleNight() {
  if (live) live.setNight(!night) // fires 'afterhours' on the canvas
  else { ensureLayers(); setNightUI(!night) }
}
let taps = 0, tapTimer = 0
sun.addEventListener('pointerdown', () => {
  taps++; clearTimeout(tapTimer); tapTimer = setTimeout(() => (taps = 0), 900)
  if (taps >= 3) { taps = 0; toggleNight() }
})
addEventListener('keydown', (e) => {
  if (live) return // the live scene owns "n" (and clicks on its painted sun)
  if ((e.key === 'n' || e.key === 'N') && !e.metaKey && !e.ctrlKey && !e.altKey && !/input|textarea|select/i.test(e.target.tagName)) toggleNight()
})
canvas.addEventListener('afterhours', (e) => setNightUI(e.detail))

// ---------- live event feed: one quiet line on the horizon
const feedEl = $('#feed')
const feed = createFeed()
const line = (e) => `${e.label} — ${describe(e)}`
const first = feed.recent(1)[0]; if (first) feedEl.textContent = line(first)
feed.subscribe((e) => {
  if (reduced) { feedEl.textContent = line(e); return }
  feedEl.classList.add('is-out')
  setTimeout(() => { feedEl.textContent = line(e); feedEl.classList.remove('is-out') }, 480)
})

// ---------- copy the MCP command
const cmd = $('#cmd')
cmd.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(cmd.dataset.copy) } catch {
    const r = document.createRange(); r.selectNodeContents($('.cmd-code')); getSelection().removeAllRanges(); getSelection().addRange(r)
  }
  cmd.classList.add('is-copied'); status.textContent = 'Command copied.'
  clearTimeout(cmd._t); cmd._t = setTimeout(() => cmd.classList.remove('is-copied'), 1900)
})

// ---------- earlier hours: one caption line, swapped as you hover or focus a tile
const caption = $('#earlier-caption'), tiles = $('#tiles'), defaultCaption = caption.textContent
let capTimer = 0
function setCaption(text) {
  if (caption.textContent === text) return
  clearTimeout(capTimer)
  if (reduced) { caption.textContent = text; return }
  caption.classList.add('is-swap')
  capTimer = setTimeout(() => { caption.textContent = text; caption.classList.remove('is-swap') }, 180)
}
tiles.addEventListener('pointerover', (e) => { const b = e.target.closest('.tile'); if (b) setCaption(b.dataset.line) })
tiles.addEventListener('focusin', (e) => { const b = e.target.closest('.tile'); if (b) setCaption(b.dataset.line) })
tiles.addEventListener('click', (e) => { const b = e.target.closest('.tile'); if (b) setCaption(b.dataset.line) })
tiles.addEventListener('pointerleave', () => { if (!tiles.contains(document.activeElement)) setCaption(defaultCaption) })
tiles.addEventListener('focusout', (e) => { if (!tiles.contains(e.relatedTarget)) setCaption(defaultCaption) })

// ---------- motion
horizonRise()
render()
onScroll()

// Heat haze on the baked morning horizon (wide screens, until the live scene takes over).
function addHaze() {
  if (reduced || narrow.matches || live) return
  heatHaze(scene, { top: 0.5, height: 0.1, scale: 4 })
  haze = scene.querySelector('.haze-band')
  if (haze) {
    const baseImg = $('.still-base img'), copy = haze.querySelector('img')
    copy.style.objectPosition = getComputedStyle(baseImg).objectPosition
    haze.style.zIndex = 1
  }
}

// ---------- the live scene: after first paint, on capable wide screens only
function canLive() {
  if (reduced || innerWidth < 900 || narrow.matches || navigator.connection?.saveData) return false
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}
async function goLive() {
  if (!canLive()) return
  try {
    const { createPavilion } = await import('../assets/3d/pavilion.js')
    const p = await createPavilion(canvas, { time: t, width: stage.clientWidth, height: stage.clientHeight })
    live = p
    p.setTime(t)
    if (night) p.setNight(true)
    canvas.classList.add('is-live')
    canvas.addEventListener('transitionend', () => { layersEl.hidden = true; haze?.remove(); haze = null }, { once: true })
    const io = new IntersectionObserver(([en]) => (en.isIntersecting ? p.start() : p.stop()))
    io.observe(stage)
    document.addEventListener('visibilitychange', () => (document.hidden ? p.stop() : p.start()))
  } catch (err) { console.warn('Live scene unavailable, staying with stills.', err) }
}
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 600))
const afterLoad = () => idle(() => { addHaze(); goLive() }, { timeout: 2500 })
if (document.readyState === 'complete') afterLoad(); else addEventListener('load', afterLoad, { once: true })

// Review helper: ?at=0..1 jumps to a point in the day (used for screenshots), ?night=1 starts after hours.
const q = new URLSearchParams(location.search)
if (q.has('at')) { dawnT = clamp(+q.get('at'), T_MIN, T_MAX); t = dawnT; ensureLayers(); render() } // freezes the day at that time while at the top
if (q.has('flat')) root.classList.add('is-flat') // hero without the scroll runway, to screenshot the sections below
if (q.get('night') === '1') toggleNight()
