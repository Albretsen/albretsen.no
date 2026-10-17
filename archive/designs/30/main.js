// UNCUT: enhancement layer. The page is complete without this file;
// this adds the live tail, the horizon, the tab title, the favicon and sound.
import { content } from '../_shared/content.js'
import { createFeed, formatTime } from '../_shared/feed.js'
import { renderCast } from './render.js'
import { createSound } from './sound.js'

const $ = s => document.querySelector(s)
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const LINES = 12

// Colour means now: only events that arrive while you are here get a hue.
const HUE = {
  'mcp-emails': 'oklch(0.72 0.2 312)',
  'fun-libs': 'oklch(0.8 0.14 342)',
  toolrails: 'oklch(0.7 0.16 282)',
  'albretsen.no': 'oklch(0.86 0.07 312)',
}
const HEX = { 'mcp-emails': '#ce79fd', 'fun-libs': '#fb98d7', toolrails: '#908ffe', 'albretsen.no': '#e1c4f3' }

// ---- cast (re-render from content.js; identical to the static markup) ----
const cast = renderCast(content.products)
const working = $('#cast-working'), retired = $('#cast-retired')
// The static build already wrote these rows; only fill in if they are missing.
if (working && !working.querySelector('.row')) working.innerHTML = cast.working
if (retired && !retired.querySelector('.row')) retired.innerHTML = cast.retired

// ---- tail -f ----
const out = $('#tail-out')
const pad = (s, n) => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length))
const detail = e => e.ms ? `${e.ms}ms` : e.country ? e.country : e.sha ? `${e.sha} ${e.kb}KB` : e.city ? `${e.city} ${e.kb}KB` : ''

function lineEl(e, live) {
  const li = document.createElement('li')
  li.className = 'tl' + (live ? ' tl--now' : '')
  li.dataset.product = e.product
  if (live) li.style.setProperty('--ev', HUE[e.product])
  const t = document.createElement('span'); t.className = 'tl-t'; t.textContent = formatTime(e.time)
  const p = document.createElement('span'); p.className = 'tl-p'; p.textContent = pad(e.product, 12)
  const k = document.createElement('span'); k.className = 'tl-k'; k.textContent = pad(e.kind, 16)
  const x = document.createElement('span'); x.className = 'tl-x'; x.textContent = e.text
  const d = document.createElement('span'); d.className = 'tl-d'; d.textContent = detail(e)
  li.append(t, p, k, x, d)
  return li
}

const GLYPHS = '#%&*+=/\\<>_|01'
function scramble(el) {
  if (reduced.matches) return
  const final = el.textContent
  let f = 0
  const tick = () => {
    f++
    const keep = Math.floor((f / 8) * final.length)
    el.textContent = final.slice(0, keep) + [...final.slice(keep)].map(c => c === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('')
    if (f < 8) requestAnimationFrame(tick); else el.textContent = final
  }
  requestAnimationFrame(tick)
}

const feed = createFeed()
const history = feed.recent(50)
out.textContent = ''
for (const e of history.slice(0, LINES).reverse()) out.append(lineEl(e, false))
out.closest('.term').classList.add('is-live')
$('#tail-state').textContent = 'attached'

// ---- horizon: 24h of today, one tick per event, placed by local time ----
const horizon = $('#horizon-ticks')
const dayPos = d => ((d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400) * 100
function tick(e, live) {
  const i = document.createElement('i')
  i.style.left = dayPos(e.time).toFixed(3) + '%'
  if (live) { i.className = 'now'; i.style.setProperty('--ev', HUE[e.product]) }
  horizon.append(i)
  while (horizon.children.length > 240) horizon.firstChild.remove()
}
const today = new Date().toDateString()
for (const e of history.slice().reverse()) if (e.time.toDateString() === today) tick(e, false)
const nowMark = $('#horizon-now')
nowMark.hidden = false
const placeNow = () => { nowMark.style.left = dayPos(new Date()).toFixed(3) + '%' }
placeNow(); setInterval(placeNow, 60000)

// ---- glitch: the title shudders only when something real happens ----
const title = $('#title')
let lastGlitch = 0
function glitch(e) {
  if (reduced.matches) return
  const now = performance.now()
  if (now - lastGlitch < 1400) return
  lastGlitch = now
  title.style.setProperty('--ev', HUE[e.product])
  title.style.setProperty('--seed', String((Math.random() * 8) | 0))
  title.classList.remove('glitch'); void title.offsetWidth; title.classList.add('glitch')
}
title.addEventListener('animationend', () => title.classList.remove('glitch'))

// ---- cast rows light up when their product does something ----
function flashRow(e) {
  const row = document.querySelector(`.row[data-product="${e.product}"]`)
  if (!row) return
  row.style.setProperty('--ev', HUE[e.product])
  row.classList.remove('lit'); void row.offsetWidth; row.classList.add('lit')
}

// ---- counters ----
const seenEl = $('#seen')
let seen = 0

// ---- tab title + favicon, designed like the hero ----
const BASE_TITLE = document.title
const icon = $('#favicon')
const svg = c => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#070707"/><path d="M7.5 25 16 6.5 24.5 25" fill="none" stroke="#eee" stroke-width="3.6" stroke-linejoin="miter"/><path d="M1 26.5h7M24 26.5h7" stroke="${c}" stroke-width="3"/></svg>`)
const ICON_IDLE = svg('#868686')
let unseen = 0, iconTimer = null
function signal(e) {
  icon.href = svg(HEX[e.product])
  clearTimeout(iconTimer)
  if (document.hidden) {
    unseen++
    document.title = `(${unseen}) ${e.product}: ${e.text} _/\\_ ALBRETSEN`
  } else {
    iconTimer = setTimeout(() => { icon.href = ICON_IDLE }, 3000)
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return
  if (unseen) {
    document.title = `${unseen} happened while you were out _/\\_ ALBRETSEN`
    setTimeout(() => { if (!document.hidden) document.title = BASE_TITLE }, 4000)
  } else document.title = BASE_TITLE
  unseen = 0
  clearTimeout(iconTimer)
  iconTimer = setTimeout(() => { icon.href = ICON_IDLE }, 3000)
})

// ---- sound (opt-in) ----
const sound = createSound()
const btn = $('#sound')
btn.hidden = false
btn.addEventListener('click', async () => {
  const next = !sound.on
  await sound.set(next)
  btn.setAttribute('aria-pressed', String(next))
  btn.querySelector('.v').textContent = next ? 'on' : 'off'
})

// ---- the subscription: one real event, everything reacts once ----
feed.subscribe(e => {
  const li = lineEl(e, true)
  out.append(li)
  while (out.children.length > LINES) out.firstChild.remove()
  scramble(li.querySelector('.tl-x'))
  setTimeout(() => li.classList.remove('tl--now'), 6000)
  tick(e, true)
  glitch(e)
  flashRow(e)
  signal(e)
  sound.pluck(e)
  seen++
  seenEl.textContent = String(seen)
})

// ---- timecode: how long you have been watching, 24 fps ----
const tc = $('#tc')
const t0 = performance.now()
const two = n => String(n).padStart(2, '0')
function drawTC() {
  const ms = performance.now() - t0, s = Math.floor(ms / 1000)
  const ff = reduced.matches ? 0 : Math.floor((ms % 1000) / (1000 / 24))
  tc.textContent = `${two(Math.floor(s / 3600))}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}:${two(ff)}`
}
drawTC()
let tcTimer = setInterval(drawTC, reduced.matches ? 1000 : 1000 / 24)
reduced.addEventListener?.('change', () => { clearInterval(tcTimer); tcTimer = setInterval(drawTC, reduced.matches ? 1000 : 1000 / 24) })

// ---- index: mark the section on screen ----
const links = [...document.querySelectorAll('.idx a')]
const io = new IntersectionObserver(entries => {
  for (const en of entries) {
    if (!en.isIntersecting) continue
    links.forEach(a => a.hash === '#' + en.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'))
  }
}, { rootMargin: '-40% 0px -55% 0px' })
document.querySelectorAll('[data-reel]').forEach(s => io.observe(s))
