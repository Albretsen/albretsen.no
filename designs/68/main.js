// Albretsen AS / design 68 "Noon & Dusk"
import { content } from '../_shared/content.js'
import { createFeed } from '../_shared/feed.js'
import { captionCard, whipTo } from './assets/motion.js'

const root = document.documentElement
const $ = (s) => document.querySelector(s)
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // ≈ cubic-bezier(.65,0,.35,1)
const BEAT = 240

/* ------------------------------------------------------------------ the spread */
const spread = $('.spread')
const stage = $('.stage')
const plate = $('.plate')
const disc = $('#sun')
const hint = $('#hint')
const card = $('#card')

const ASPECT = 1280 / 852
const HORIZON = 0.4143 // painted horizon, as a fraction of the plate's height
const SUN_NOON = 0.27
let geo = null
// review aid: ?open=0.5 pins the arch at that opening (headless screenshots cannot scroll a sticky stage)
const qOpen = new URLSearchParams(location.search).get('open')
const FORCED = qOpen === null ? null : clamp(+qOpen || 0, 0, 1)

function measure() {
  const vw = stage.clientWidth
  const vh = stage.clientHeight
  const narrow = vw < 820
  const g = parseFloat(getComputedStyle(root).getPropertyValue('--gutter')) || Math.max(20, Math.min(64, vw * 0.04))
  const pw = Math.max(vw, vh * ASPECT)
  const ph = pw / ASPECT
  // keep the horizon a little above the middle of the stage when the plate has room to move
  const py = clamp(0.5 * vh - HORIZON * ph, vh - ph, 0)
  const w0 = narrow ? vw - 2 * g : clamp(vw * 0.3, 280, 560)
  const masthead = $('.masthead').offsetHeight
  const top0 = narrow ? Math.max(0.12 * vh, masthead + 8) : Math.max(0.17 * vh, masthead + 24)
  const bottom0 = narrow ? 0.34 * vh : 0
  geo = { vw, vh, narrow, pw, ph, py, w0, top0, bottom0, pl: (vw - pw) / 2 }
  root.style.setProperty('--plate-y', `${py}px`)
  root.style.setProperty('--w0', `${w0}px`)
  root.style.setProperty('--sun-r', `${pw * 0.039}px`)
  // the hint sits just above the noon sun
  root.style.setProperty('--hint-y', `${py + ph * SUN_NOON - pw * 0.039 - 30}px`)
  update()
}

let open = 0
function update() {
  if (!geo) return
  const { vw, vh, ph, py, w0, top0, bottom0, pl } = geo
  const range = Math.max(1, spread.offsetHeight - vh)
  open = FORCED !== null ? FORCED : reduce() ? 0 : clamp((scrollY - spread.offsetTop) / (range * 0.62), 0, 1)
  const w = w0 + (vw - w0) * open
  const side = (vw - w) / 2 - pl
  const top = top0 * (1 - open) - py
  const bottom = ph + py - (vh - bottom0 * (1 - open))
  const r = (w / 2) * (1 - open)
  root.style.setProperty('--open', open.toFixed(4))
  root.style.setProperty('--clip', `inset(${top.toFixed(1)}px ${side.toFixed(1)}px ${bottom.toFixed(1)}px ${side.toFixed(1)}px round ${r.toFixed(1)}px ${r.toFixed(1)}px 0 0)`)
  if (geo.narrow) card.classList.toggle('is-hidden', open < 0.5)
  else card.classList.remove('is-hidden')
}

let raf = 0
addEventListener('scroll', () => { raf ||= requestAnimationFrame(() => { raf = 0; update() }) }, { passive: true })
new ResizeObserver(measure).observe(stage)
measure()

/* ------------------------------------------------------------------ the sun (day / night) */
const sw = $('#switch')
const meta = document.querySelector('meta[name="theme-color"]')
let p = root.dataset.theme === 'night' ? 1 : 0
let roofs = null

function applyP(v) {
  p = clamp(v, 0, 1)
  root.style.setProperty('--p', p.toFixed(4))
  root.style.setProperty('--w', clamp((p - 0.6) / 0.4, 0, 1).toFixed(4)) // the dusk wipe
  const height = Math.round((1 - p) * 100)
  disc.setAttribute('aria-valuenow', String(height))
  disc.setAttribute('aria-valuetext', p <= 0 ? 'Noon' : p >= 1 ? 'Dusk, the sun is on the horizon' : p < 0.5 ? 'Afternoon' : 'Evening')
}

function setTheme(t) {
  if (root.dataset.theme === t) return
  root.dataset.theme = t
  try { localStorage.setItem('a68-theme', t) } catch (e) {}
  meta.setAttribute('content', t === 'night' ? '#221D2A' : '#F6EDE1')
  syncSwitch()
  roofs?.setTheme(t)
}
function syncSwitch() {
  const night = root.dataset.theme === 'night'
  sw.setAttribute('aria-pressed', String(night))
  sw.setAttribute('aria-label', night ? 'Day' : 'Night')
}

let anim = 0
function animateTo(target) {
  cancelAnimationFrame(anim)
  const from = p
  const dist = Math.abs(target - from)
  const theme = target >= 1 ? 'night' : 'day'
  sw.setAttribute('aria-pressed', String(theme === 'night')) // the little sun in the masthead sets with the big one
  if (reduce() || dist < 0.001) { applyP(target); setTheme(theme); return }
  const dur = 600 + 900 * dist
  const t0 = performance.now()
  const step = (now) => {
    const k = clamp((now - t0) / dur, 0, 1)
    applyP(from + (target - from) * ease(k))
    if (k < 1) anim = requestAnimationFrame(step)
    else setTimeout(() => setTheme(theme), BEAT * 0.5)
  }
  anim = requestAnimationFrame(step)
}

// drag the sun along the axis
let drag = null
disc.addEventListener('pointerdown', (e) => {
  cancelAnimationFrame(anim)
  disc.setPointerCapture(e.pointerId)
  drag = { y: e.clientY, p0: p, moved: false }
  stage.classList.add('is-dragging')
})
disc.addEventListener('pointermove', (e) => {
  if (!drag) return
  const dy = e.clientY - drag.y
  if (Math.abs(dy) > 4) drag.moved = true
  const ph = plate.getBoundingClientRect().height
  applyP(drag.p0 + dy / (ph * (HORIZON - SUN_NOON)))
  if (drag.moved) hint.classList.add('is-done')
})
const endDrag = () => {
  if (!drag) return
  stage.classList.remove('is-dragging')
  const { moved, p0 } = drag
  drag = null
  if (!moved) animateTo(p0 > 0.5 ? 0 : 1)
  else animateTo(p > (p0 > 0.5 ? 0.8 : 0.2) ? 1 : 0) // a small nudge is enough, like a light switch
  hint.classList.add('is-done')
}
disc.addEventListener('pointerup', endDrag)
disc.addEventListener('pointercancel', endDrag)
disc.addEventListener('keydown', (e) => {
  const k = e.key
  let next = null
  if (k === 'ArrowDown' || k === 'ArrowLeft') next = p + 0.1
  else if (k === 'ArrowUp' || k === 'ArrowRight') next = p - 0.1
  else if (k === 'PageDown') next = p + 0.34
  else if (k === 'PageUp') next = p - 0.34
  else if (k === 'Home') { e.preventDefault(); animateTo(0); return }
  else if (k === 'End') { e.preventDefault(); animateTo(1); return }
  else if (k === 'Enter' || k === ' ') { e.preventDefault(); animateTo(p > 0.5 ? 0 : 1); return }
  if (next === null) return
  e.preventDefault()
  cancelAnimationFrame(anim)
  applyP(next)
  hint.classList.add('is-done')
  if (p >= 1) setTheme('night')
  else if (p <= 0) setTheme('day')
})

// the masthead switch: the hero sun sets if you can see it, otherwise the page wipes from the horizon
sw.addEventListener('click', async () => {
  const next = root.dataset.theme === 'night' ? 'day' : 'night'
  const heroVisible = scrollY < spread.offsetTop + spread.offsetHeight - innerHeight * 0.5
  if (heroVisible || reduce() || !document.startViewTransition) { animateTo(next === 'night' ? 1 : 0); return }
  sw.setAttribute('aria-pressed', String(next === 'night'))
  await new Promise((r) => setTimeout(r, 500))
  root.style.setProperty('--horizon', '50%')
  root.classList.add('is-horizon')
  const vt = document.startViewTransition(() => { applyP(next === 'night' ? 1 : 0); setTheme(next) })
  try { await vt.finished } finally { root.classList.remove('is-horizon') }
})

applyP(p)
syncSwitch()

/* ------------------------------------------------------------------ caption card + live feed */
captionCard($('#caption'))
const live = $('#live')
const feed = createFeed()
const describe = (e) => {
  const where = e.country ? `, ${e.country}` : e.city ? `, ${e.city}` : ''
  return `${e.label} · ${e.text}${where}`
}
const first = feed.recent(1)[0]
if (first) live.textContent = describe(first)
let lastSwap = 0
let pending = null
feed.subscribe((e) => {
  pending = e
  const wait = Math.max(0, lastSwap + 3600 - Date.now()) // calm: never more than one line every few seconds
  setTimeout(() => {
    if (!pending) return
    const ev = pending
    pending = null
    lastSwap = Date.now()
    live.classList.add('is-out')
    setTimeout(() => { live.textContent = describe(ev); live.classList.remove('is-out') }, reduce() ? 0 : BEAT)
  }, wait)
})

/* ------------------------------------------------------------------ products */
const numerals = ['I', 'II', 'III', 'IV']
const STATUS = { live: 'Open', building: 'Being built', paused: 'Paused' }
const ALT = {
  'mcp-emails': 'The MCP Emails logo on an oval enamel plate, on a painted green door with a brass letter slot.',
  'fun-libs': 'The Fun Libs icon and gilt lettering on the green fascia of a painted shop front.',
  toolrails: 'The Toolrails icon on a square enamel plaque under a balcony on a painted orange facade.',
  harbor: 'The Harbor sign in dark enamel on a painted pink house with green shutters.',
}
const current = content.products.filter((x) => x.status !== 'retired')
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const tabs = $('#tabs')
const track = $('#track')
const panel = $('#panel')
tabs.innerHTML = current.map((x, i) =>
  `<button class="tab" role="tab" id="tab-${x.id}" aria-controls="panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><b>${numerals[i]}</b>${esc(x.name)}</button>`).join('')
track.innerHTML = current.map((x, i) => `
  <picture>
    <source type="image/avif" srcset="assets/products/${x.id}-600.avif 600w, assets/products/${x.id}-1200.avif 1200w" sizes="(max-width: 819px) 82vw, 400px">
    <source type="image/webp" srcset="assets/products/${x.id}-600.webp 600w, assets/products/${x.id}-1200.webp 1200w" sizes="(max-width: 819px) 82vw, 400px">
    <img src="assets/products/${x.id}-600.jpg" width="600" height="750" alt="${i === 0 ? ALT[x.id] : ''}" loading="lazy" decoding="async">
  </picture>`).join('')

function textFor(x) {
  const host = x.url ? new URL(x.url).host : ''
  return {
    l: `<p class="kicker">${STATUS[x.status] || x.status} · since ${x.since}</p>
        <h3>${esc(x.name)}</h3>
        <p class="line">${esc(x.line)}</p>`,
    r: `${x.figure ? `<p class="fig">${esc(x.figure.value)}</p><span class="kicker fig-label">${esc(x.figure.label)}</span>` : ''}
        ${x.facts ? `<ul class="facts">${x.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
        ${x.url ? `<a class="visit" href="${x.url}" rel="noopener">${host} <span aria-hidden="true">↗</span></a>` : ''}`,
  }
}
panel.innerHTML = `<div class="dt dt-l"></div><div class="dt dt-r"></div>`
const L = panel.querySelector('.dt-l')
const R = panel.querySelector('.dt-r')
let active = -1
async function show(i, focus = false) {
  i = (i + current.length) % current.length
  if (i === active) return
  const first = active < 0
  active = i
  const x = current[i]
  tabs.querySelectorAll('[role=tab]').forEach((t, j) => {
    t.setAttribute('aria-selected', String(j === i))
    t.tabIndex = j === i ? 0 : -1
    if (j === i && focus) t.focus()
  })
  panel.setAttribute('aria-labelledby', `tab-${x.id}`)
  track.querySelectorAll('img').forEach((img, j) => { img.alt = j === i ? ALT[current[j].id] : '' })
  const t = textFor(x)
  if (first) { L.innerHTML = t.l; R.innerHTML = t.r; return }
  L.classList.add('is-out'); R.classList.add('is-out')
  whipTo(track, i)
  await new Promise((r) => setTimeout(r, reduce() ? 0 : BEAT))
  if (active !== i) return
  L.innerHTML = t.l; R.innerHTML = t.r
  requestAnimationFrame(() => { L.classList.remove('is-out'); R.classList.remove('is-out') })
}
tabs.addEventListener('click', (e) => {
  const b = e.target.closest('[role=tab]')
  if (b) show([...tabs.children].indexOf(b))
})
tabs.addEventListener('keydown', (e) => {
  const map = { ArrowRight: 1, ArrowLeft: -1 }
  if (e.key in map) { e.preventDefault(); show(active + map[e.key], true) }
  if (e.key === 'Home') { e.preventDefault(); show(0, true) }
  if (e.key === 'End') { e.preventDefault(); show(current.length - 1, true) }
})
// swipe the plate like turning to the next door
const whip = $('#whip')
let sx = null
whip.addEventListener('pointerdown', (e) => { sx = e.clientX })
whip.addEventListener('pointerup', (e) => {
  if (sx === null) return
  const dx = e.clientX - sx
  sx = null
  if (Math.abs(dx) > 40) show(active + (dx < 0 ? 1 : -1))
})
show(0)

/* retired: small enamel plaques, one caption line */
const plaques = $('#plaques')
const cap = $('#plaque-caption')
const retired = content.products.filter((x) => x.status === 'retired')
plaques.innerHTML = retired.map((x) =>
  `<li><button type="button" data-id="${x.id}" aria-label="${esc(x.name)}, ${x.since}"><img src="assets/products/retired/${x.id}.svg" width="200" height="260" alt="" loading="lazy"></button></li>`).join('')
const capFor = (x) => `${x.name}, ${x.since}. ${x.line}${x.figure ? ` ${x.figure.value} ${x.figure.label}.` : ''}`
const setCap = (id) => {
  const x = retired.find((r) => r.id === id)
  cap.textContent = x ? capFor(x) : ' '
}
plaques.addEventListener('pointerover', (e) => { const b = e.target.closest('button'); if (b) setCap(b.dataset.id) })
plaques.addEventListener('pointerleave', () => setCap(null))
plaques.addEventListener('focusin', (e) => setCap(e.target.closest('button')?.dataset.id))
plaques.addEventListener('focusout', () => setCap(null))
plaques.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setCap(b.dataset.id) })

/* ------------------------------------------------------------------ footer */
const copy = $('#copy')
copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(content.mcpCommand)
    copy.classList.add('is-done')
    $('#copy-status').textContent = 'Copied to the clipboard'
    setTimeout(() => { copy.classList.remove('is-done'); $('#copy-status').textContent = '' }, 1800)
  } catch (e) {
    const range = document.createRange()
    range.selectNodeContents($('#mcp-cmd'))
    getSelection().removeAllRanges(); getSelection().addRange(range)
  }
})

// the rooftops: three.js, only when the footer comes near
const roofsEl = $('#roofs')
const io = new IntersectionObserver(async ([e]) => {
  if (!e.isIntersecting) return
  io.disconnect()
  try {
    const probe = document.createElement('canvas')
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return
    const { mountRooftops } = await import('./assets/interactive/rooftops.js')
    roofs = await mountRooftops($('#roofs-canvas'), { theme: root.dataset.theme })
    requestAnimationFrame(() => roofsEl.classList.add('is-live'))
  } catch (err) { /* the painted poster stays */ }
}, { rootMargin: '400px 0px' })
io.observe(roofsEl)

