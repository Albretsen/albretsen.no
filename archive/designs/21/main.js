import { content } from '../_shared/content.js'
import { createFeed, formatTime } from '../_shared/feed.js'
import { renderProducts, renderIndex } from './products.js'
import { createField } from './field.js'
import { createSound } from './sound.js'

const $ = s => document.querySelector(s)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const WINDOW = 5 * 60_000 // the strip shows five minutes

// ---------- products: re-render from content.js (identical to the static fallback) ----------
const { rows, ticks, tally } = renderProducts(content)
const swap = (el, html) => { if (el && el.innerHTML.trim() !== html.trim()) el.innerHTML = html }
swap($('#rows'), rows)
swap($('#ticks'), ticks + '<span class="today">today</span>')
swap($('#ptally'), tally)
swap($('#sub'), renderIndex(content))

// ---------- the feed ----------
const feed = createFeed()
const field = createField($('#field'), { reduced })
const sound = createSound()
let soundOn = false

const big = $('#big'), stage = $('#stage')
const prodEl = $('#prod'), whenEl = $('#when'), detailEl = $('#detail'), agoEl = $('#ago')
const lanes = Object.fromEntries([...document.querySelectorAll('.lane')].map(l => [l.dataset.p, l]))
const tallyEl = $('#tally')
const arrived = Date.now()
let seen = 0
let current = null

const sentence = e => e.text.charAt(0).toUpperCase() + e.text.slice(1)
const detail = e =>
  e.ms ? `${e.ms} ms` :
  e.country ? e.country :
  e.sha ? `${e.sha} · ${e.kb} KB` :
  e.city ? `${e.city} · ${e.kb} KB` : ''

function setBig(e, animate) {
  if (animate && !reduced) {
    const ghost = big.cloneNode(true)
    ghost.removeAttribute('id'); ghost.setAttribute('aria-hidden', 'true')
    ghost.classList.remove('enter'); ghost.classList.add('ghost')
    ghost.addEventListener('animationend', () => ghost.remove())
    stage.appendChild(ghost)
  }
  big.innerHTML = ''
  big.append(sentence(e))
  const stop = document.createElement('span'); stop.className = 'stop'; stop.textContent = '.'
  big.append(stop)
  if (animate && !reduced) { big.classList.remove('enter'); void big.offsetWidth; big.classList.add('enter') }
  prodEl.textContent = e.label
  whenEl.textContent = formatTime(e.time)
  detailEl.textContent = detail(e)
  current = e
  tick()
}

const dots = new Map()
function plot(e, isNow) {
  const lane = lanes[e.product]
  if (!lane) return
  const d = document.createElement('span')
  d.className = 'ev'
  d.title = `${e.label}: ${e.text}, ${formatTime(e.time)}`
  lane.appendChild(d)
  dots.set(e.id, { el: d, e })
  if (isNow) { dots.forEach(v => v.el.classList.remove('now')); d.classList.add('now') }
  place()
}

// position = how long ago, in a five-minute window. Time moves, so the dots drift left.
function place() {
  const now = Date.now()
  dots.forEach((v, id) => {
    const age = now - v.e.time.getTime()
    if (age > WINDOW) { v.el.remove(); dots.delete(id); return }
    const x = 1 - age / WINDOW
    const width = v.el.parentElement.clientWidth
    v.el.style.transform = `translateX(${(x * width).toFixed(1)}px)`
  })
}

function tick() {
  if (!current) return
  const s = Math.max(0, Math.round((Date.now() - current.time.getTime()) / 1000))
  agoEl.textContent = s < 2 ? 'just now' : s < 90 ? `${s} s ago` : `${Math.round(s / 60)} min ago`
  const quiet = s >= 30 ? ` Quiet for ${s} s. That is also data.` : ''
  tallyEl.textContent = `${seen} ${seen === 1 ? 'event' : 'events'} since you arrived.${quiet}`
}

// history: newest first
const history = feed.recent(12)
history.slice().reverse().forEach(e => { plot(e, e === history[0]); field.add(e, { ageMs: Date.now() - e.time.getTime() }) })
if (history[0]) setBig(history[0], false)
document.documentElement.classList.add('live')

feed.subscribe(e => {
  seen++
  setBig(e, true)
  plot(e, true)
  field.add(e)
  if (soundOn) sound.event(e.product)
})

setInterval(() => { tick(); place() }, 1000)
window.addEventListener('resize', place)

// ---------- sound ----------
const btn = $('#sound')
btn.addEventListener('click', () => {
  soundOn = !soundOn
  btn.setAttribute('aria-pressed', String(soundOn))
  btn.querySelector('span').textContent = soundOn ? 'on' : 'off'
  if (soundOn) sound.logo(); else sound.suspend()
})

// ---------- index: mark where you are ----------
const links = [...document.querySelectorAll('.side a[href^="#"]')]
const targets = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean)
const io = new IntersectionObserver(entries => {
  for (const en of entries) {
    const id = en.target.id
    links.filter(a => a.hash === '#' + id).forEach(a => a.setAttribute('aria-current', String(en.isIntersecting)))
  }
}, { rootMargin: '-35% 0px -55% 0px' })
targets.forEach(t => io.observe(t))
