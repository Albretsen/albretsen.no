// Design 69 · Afterglow. One evening in three photographs, then the products in the last light.
import { content } from '../../_shared/content.js'
import { createFeed } from '../../_shared/feed.js'
import { splitRise, horizonFlash, scrollFallbacks } from '../assets/motion.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches

scrollFallbacks()

/* ---------------- hero: the evening ---------------- */
const hero = $('#hero'), stick = $('.hero__stick'), scene = $('#scene'), still = $('#still'), canvas = $('#glow'), nameEl = $('#name')
const FRAMES = [
  { key: 'cliffs', horizon: 0.449, sunX: 0.86, sunXTall: 0.98 },
  { key: 'towers', horizon: 1.2, sunX: 0.9, sunXTall: 0.9 },
  { key: 'shore', horizon: 0.505, sunX: 0.36, sunXTall: 0.5 },
]
let stage = 0, want = 0, ag = null

// Place the name exactly on the horizon of the first photograph (object-fit: cover maths).
function placeName() {
  const W = scene.clientWidth, H = scene.clientHeight
  const iw = still.naturalWidth || 1600, ih = still.naturalHeight || 1068
  const s = Math.max(W / iw, H / ih), dh = ih * s
  const y = (H - dh) / 2 + FRAMES[0].horizon * dh
  nameEl.style.setProperty('--hy', y.toFixed(1) + 'px')
}
still.complete ? placeName() : still.addEventListener('load', placeName, { once: true })
addEventListener('resize', placeName)

function setStage(i) {
  if (i === stage) return
  stage = i
  stick.dataset.stage = i
  $$('.frames button').forEach((b, k) => b.setAttribute('aria-current', String(k === i)))
  sync()
}
function sync() { if (ag && ag.index !== want) ag.go(want) }

// Scroll drives the descent: a slow settle of the camera and three stages.
let ticking = false
function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    const r = hero.getBoundingClientRect(), span = hero.offsetHeight - innerHeight
    const p = Math.min(1, Math.max(0, -r.top / span))
    if (!reduce) scene.style.setProperty('--p', p.toFixed(4))
    want = p < 0.3 ? 0 : p < 0.66 ? 1 : 2
    setStage(want)
    $('#top-bar').classList.toggle('is-solid', r.bottom < 80)
  })
}
addEventListener('scroll', onScroll, { passive: true })
onScroll()

$$('.frames button').forEach(b => b.addEventListener('click', () => {
  const i = +b.dataset.go, span = hero.offsetHeight - innerHeight
  const top = hero.offsetTop + span * [0.0, 0.48, 0.9][i]
  scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
}))

// Deep links to a frame: #coast, #town, #shore
const HASH = ['#coast', '#town', '#shore'].indexOf(location.hash)
if (HASH > 0) requestAnimationFrame(() => { scrollTo(0, hero.offsetTop + (hero.offsetHeight - innerHeight) * [0, 0.48, 0.9][HASH]); onScroll() })

// After first paint: swap the still for the live WebGL dissolve, reusing the format the browser chose.
function frameSrc(key) {
  const cur = still.currentSrc || still.src
  const ext = (cur.match(/\.(avif|webp|jpg)$/) || [, 'jpg'])[1]
  const tall = innerWidth / innerHeight <= 1
  const big = innerWidth * Math.min(devicePixelRatio || 1, 2) > 1700
  const size = tall ? (ext === 'jpg' ? '750' : '1200') : (big && ext !== 'jpg' ? '2400' : '1600')
  return `assets/hero/${key}${tall ? '-tall' : ''}-${size}.${ext}`
}
async function startGlow() {
  const { createAfterglow } = await import('../assets/interactive/afterglow.js')
  const tall = innerWidth / innerHeight <= 1
  ag = createAfterglow(canvas, FRAMES.map(f => ({ src: frameSrc(f.key), horizon: f.horizon, sunX: tall ? f.sunXTall : f.sunX })),
    { autoplay: false, fade: 2600, grain: 0.03 })
  if (!canvas.isConnected) { // no WebGL: plain cross-fade, and the green flash moves to the DOM
    ag.destroy()
    horizonFlash(scene, { horizon: FRAMES[0].horizon, sunX: tall ? 0.98 : 0.86 })
  }
  await ag.ready
  scene.classList.add('is-live')
  // the dissolve can only run one at a time; keep checking until the picture matches the scroll
  setInterval(sync, 700)
  sync()
}
const idle = window.requestIdleCallback || (fn => setTimeout(fn, 300))
addEventListener('load', () => idle(startGlow, { timeout: 1500 }), { once: true })

/* live feed: one line, dissolving like the photographs */
const feedEl = $('#feed')
const ago = (t) => { const s = Math.max(1, Math.round((Date.now() - t) / 1000)); return s < 60 ? `${s}s ago` : `${Math.round(s / 60)} min ago` }
const describe = (e) => [e.label, e.text, e.ms ? `${e.ms} ms` : e.country || e.city || (e.sha ? e.sha : '')].filter(Boolean).join(' · ')
function showEvent(e, immediate) {
  const next = document.createElement('span')
  next.textContent = describe(e)
  next.title = ago(e.time)
  if (immediate || reduce) { feedEl.replaceChildren(next); return }
  const prev = feedEl.querySelector('span:not(.out)')
  next.className = 'in'; feedEl.appendChild(next)
  requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove('in')))
  if (prev) { prev.classList.add('out'); setTimeout(() => prev.remove(), 1200) }
}
try {
  const feed = createFeed()
  const first = feed.recent(1)[0]
  if (first) showEvent(first, true)
  let last = 0
  feed.subscribe(e => { const now = performance.now(); if (now - last > 2600) { last = now; showEvent(e) } })
} catch { /* the page stands without it */ }

/* copy the command */
const cmd = $('#cmd')
cmd.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(content.mcpCommand) } catch {
    const r = document.createRange(); r.selectNodeContents(cmd.querySelector('code')); const s = getSelection(); s.removeAllRanges(); s.addRange(r)
  }
  cmd.classList.add('is-copied'); $('#cmd-status').textContent = 'Command copied'
  clearTimeout(cmd._t); cmd._t = setTimeout(() => { cmd.classList.remove('is-copied'); $('#cmd-status').textContent = '' }, 2200)
})

/* ---------------- products ---------------- */
const byId = Object.fromEntries(content.products.map(p => [p.id, p]))
// keep the facts canonical: hydrate from content.js
$$('.prod').forEach(li => {
  const p = byId[li.dataset.id]; if (!p) return
  li.querySelector('.prod__line').textContent = p.line
  if (p.figure) { li.querySelector('.prod__fig strong').textContent = p.figure.value; li.querySelector('.prod__fig span').textContent = p.figure.label }
})

const h2 = $('#products-h')
new IntersectionObserver((es, io) => {
  if (!es[0].isIntersecting) return
  io.disconnect(); h2.classList.remove('pre-rise')
  if (!reduce) splitRise(h2)
}, { rootMargin: '0px 0px -12% 0px' }).observe(h2)

let active = 'mcp-emails', plaque = null, threeOn = false, mounting = null
const live = $('#live')
function activate(id) {
  if (id === active) return
  const prev = $(`.shot[data-id="${active}"]`), next = $(`.shot[data-id="${id}"]`)
  prev.classList.add('leaving'); prev.classList.remove('on')
  setTimeout(() => prev.classList.remove('leaving'), 1600)
  next.classList.add('on')
  active = id
  $$('.prod').forEach(li => li.classList.toggle('on', li.dataset.id === id))
  const p = byId[id]
  $('#frame-name').innerHTML = `<b>${p.name}</b> · ${p.since}`
  if (threeOn) mountLive(id)
}
$$('.prod').forEach(li => {
  li.addEventListener('pointerenter', () => activate(li.dataset.id))
  li.addEventListener('focusin', () => activate(li.dataset.id))
})
// On touch, the product nearest the middle of the screen takes the frame.
if (!finePointer) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) activate(e.target.dataset.id) }), { rootMargin: '-45% 0px -45% 0px' })
  $$('.prod').forEach(li => io.observe(li))
  $('#frame-hint').textContent = 'Glazed tiles, low sun'
}

// The delight: the first time a fine pointer rests on the frame, the photograph becomes the real scene
// (three.js, loaded only now) and the low sun follows the pointer. Long shadows swing with it.
async function mountLive(id) {
  const token = (mounting = id)
  const { mountPlaque } = await import('../assets/interactive/plaques.js')
  if (mounting !== token) return
  const old = plaque
  const holder = document.createElement('div')
  holder.style.cssText = 'position:absolute;inset:0'
  live.appendChild(holder)
  const p = await mountPlaque(holder, { product: id })
  if (mounting !== token) { p.dispose(); holder.remove(); return }
  plaque = { p, holder }
  live.classList.add('on')
  if (old) setTimeout(() => { old.p.dispose(); old.holder.remove() }, 50)
}
if (finePointer && !reduce) {
  const frame = $('#frame')
  frame.addEventListener('pointerenter', () => { if (!threeOn) { threeOn = true; mountLive(active).catch(() => { threeOn = false }) } })
}

/* retired roundels */
const cap = $('#retired-cap')
$$('#roundels button').forEach(b => {
  const show = () => {
    const p = byId[b.dataset.id]; if (!p) return
    $$('#roundels button').forEach(x => x.setAttribute('aria-pressed', String(x === b)))
    cap.innerHTML = `<b></b> · ${p.since} · <span></span>`
    cap.querySelector('b').textContent = p.name; cap.querySelector('span').textContent = p.line
  }
  b.setAttribute('aria-pressed', String(b.dataset.id === 'luma'))
  b.addEventListener('pointerenter', show); b.addEventListener('focus', show); b.addEventListener('click', show)
})
