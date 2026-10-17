import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { productRows, statement, counts } from './render.js'
import { markPath, markSVG } from './mark.js'

const $ = s => document.querySelector(s)
const reduced = matchMedia('(prefers-reduced-motion: reduce)')

// Colour is a property of events, not of the page. Hues step 90 degrees from the seed, 108.
const HUE = { 'fun-libs': 108, 'mcp-emails': 198, toolrails: 288, 'albretsen.no': 18 }
// One note per product, D major pentatonic.
const NOTE = { 'albretsen.no': 293.66, 'fun-libs': 440.0, 'mcp-emails': 493.88, toolrails: 659.25 }
const HALF_LIFE = 120 // seconds for an event's colour to fall to half

/* ---------- facts from content.js (static markup is identical; this keeps it honest) ---------- */
$('#statement').textContent = statement(content)
{
  const c = counts(content)
  $('#lede').textContent = `${c.total} entries. ${c.live} live, ${c.building} building, ${c.paused} paused, ${c.retired} retired. Retired work stays on the record.`
  const list = $('#products')
  const head = list.querySelector('.p-head')
  list.innerHTML = ''
  list.append(head)
  list.insertAdjacentHTML('beforeend', productRows(content.products))
  for (const row of list.querySelectorAll('.p-row')) if (HUE[row.dataset.id] != null) row.style.setProperty('--h', HUE[row.dataset.id])
}

/* ---------- the mark: same field, new grain each visit ---------- */
{
  const seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1
  const d = markPath(seed)
  const path = $('#mark path')
  path.setAttribute('d', d)
  $('#seed').textContent = seed.toString(16).padStart(8, '0')
  const dark = matchMedia('(prefers-color-scheme: dark)').matches
  const svg = markSVG(seed, dark ? '#e6e6e6' : '#1f1f1f')
  const link = $('link[rel="icon"]')
  if (link) link.href = 'data:image/svg+xml,' + encodeURIComponent(svg)
}

/* ---------- toggles ---------- */
$('#grid-toggle').addEventListener('click', e => {
  const on = document.documentElement.classList.toggle('grid')
  e.currentTarget.setAttribute('aria-pressed', on)
})

let audio = null
const soundBtn = $('#sound-toggle')
soundBtn.addEventListener('click', () => {
  const on = soundBtn.getAttribute('aria-pressed') !== 'true'
  soundBtn.setAttribute('aria-pressed', on)
  soundBtn.textContent = on ? 'sound on' : 'sound off'
  if (on) {
    if (!audio) audio = makeAudio()
    audio.ctx.resume()
    audio.on = true
    audio.play('albretsen.no', 0.5)
  } else if (audio) audio.on = false
})

function makeAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const master = ctx.createGain(); master.gain.value = 0.5
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200
  master.connect(lp).connect(ctx.destination)
  // a few milliseconds of grain at the onset, generated, not loaded
  const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate)
  const ch = noise.getChannelData(0)
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length) ** 3
  return {
    ctx, on: false,
    play(product, level = 1) {
      const f = NOTE[product]; if (!f) return
      const t = ctx.currentTime + 0.01
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.16 * level, t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8)
      g.connect(master)
      const a = ctx.createOscillator(); a.type = 'sine'; a.frequency.value = f
      const b = ctx.createOscillator(); b.type = 'sine'; b.frequency.value = f * 3.01
      const bg = ctx.createGain(); bg.gain.value = 0.06
      a.connect(g); b.connect(bg).connect(g)
      const n = ctx.createBufferSource(); n.buffer = noise
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 4; bp.Q.value = 2
      const ng = ctx.createGain(); ng.gain.value = 0.25 * level
      n.connect(bp).connect(ng).connect(master)
      a.start(t); b.start(t); n.start(t)
      a.stop(t + 1.9); b.stop(t + 1.9)
    },
  }
}

/* ---------- figure 1: a stack of cards on springs ---------- */
const stack = $('#stack')
const MAX = 12, FULL = 5
let cards = []        // newest first
let geo = null
let seen = 0
const arrivedAt = Date.now()

function measure() {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
  const b = 0.375 * rem
  geo = { pitch: 9 * b, edge: 1 * b, h: 8 * b, w: stack.clientWidth }
}

function slot(i) {
  if (i < FULL) return { y: i * geo.pitch, s: 1, o: 1 }
  const k = i - FULL + 1
  if (i >= MAX) return { y: (FULL - 1) * geo.pitch + (MAX - FULL + 1) * geo.edge, s: 1 - (MAX - FULL + 1) * 0.025, o: 0 }
  return { y: (FULL - 1) * geo.pitch + k * geo.edge, s: 1 - k * 0.025, o: Math.max(0, 1 - k * 0.12) }
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function makeCard(e) {
  const el = document.createElement('li')
  el.className = 'card'
  el.style.setProperty('--h', HUE[e.product] ?? 0)
  const full = describe(e)
  const tail = full.length > e.text.length ? full.slice(e.text.length + 3) : ''
  el.innerHTML =
    `<time datetime="${e.time.toISOString()}">${formatTime(e.time)}</time>` +
    `<span class="c-prod">${esc(e.label)}</span>` +
    `<span class="c-age"></span>` +
    `<span class="c-text">${esc(e.text)}</span>` +
    `<span class="c-tail">${esc(tail)}</span>`
  return el
}

// state per card: x, y, s, o with velocities; springs are semi-implicit Euler
const SPRING = { y: [210, 22], x: [170, 15], s: [260, 30], o: [200, 28] }
function body(el, at) { return { el, y: at.y, vy: 0, x: 0, vx: 0, s: at.s, vs: 0, o: at.o, vo: 0, gone: false } }

function apply(c) {
  c.el.style.transform = `translate3d(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px,0) scale(${c.s.toFixed(4)})`
  c.el.style.opacity = Math.max(0, Math.min(1, c.o)).toFixed(3)
}

// drag: the whole stack can be pulled sideways; deeper cards follow late, like grain in a current
let drag = { active: false, x: 0, v: 0, start: 0, lastX: 0, lastT: 0, id: null }
let dragSpring = { x: 0, v: 0 }

function targets(c, i) {
  const t = c.gone ? slot(MAX) : slot(i)
  const follow = 1 / (1 + i * 0.45)
  return { ...t, x: dragSpring.x * follow }
}

let raf = 0, last = 0
function kick() { if (!raf && !reduced.matches) { last = performance.now(); raf = requestAnimationFrame(tick) } }
function tick(now) {
  const dt = Math.min(0.034, (now - last) / 1000); last = now
  let moving = false
  // the drag offset itself is a spring when released (inertia, then return)
  if (!drag.active) {
    const steps = 2, h = dt / steps
    for (let k = 0; k < steps; k++) { dragSpring.v += (-180 * dragSpring.x - 16 * dragSpring.v) * h; dragSpring.x += dragSpring.v * h }
    if (Math.abs(dragSpring.x) > 0.1 || Math.abs(dragSpring.v) > 0.1) moving = true; else { dragSpring.x = 0; dragSpring.v = 0 }
  } else moving = true
  cards.forEach((c, i) => {
    const t = targets(c, i)
    const steps = 2, h = dt / steps
    for (let k = 0; k < steps; k++) {
      for (const p of ['x', 'y', 's', 'o']) {
        const [K, D] = SPRING[p], v = 'v' + p
        c[v] += (-K * (c[p] - t[p]) - D * c[v]) * h
        c[p] += c[v] * h
      }
    }
    const near = Math.abs(c.y - t.y) < 0.2 && Math.abs(c.vy) < 0.2 && Math.abs(c.x - t.x) < 0.2 && Math.abs(c.vx) < 0.2 && Math.abs(c.o - t.o) < 0.005 && Math.abs(c.s - t.s) < 0.0005
    if (!near) moving = true
    else { c.x = t.x; c.y = t.y; c.s = t.s; c.o = t.o; c.vx = c.vy = c.vs = c.vo = 0 }
    apply(c)
  })
  // retire cards that have sunk out of the stack
  cards = cards.filter(c => {
    if (c.gone && c.o < 0.02) { c.el.remove(); return false }
    return true
  })
  raf = moving ? requestAnimationFrame(tick) : 0
}

function snap() {
  cards.forEach((c, i) => { Object.assign(c, targets(c, i)); c.vx = c.vy = c.vs = c.vo = 0; apply(c) })
  cards = cards.filter(c => { if (c.gone) { c.el.remove(); return false } return true })
}

function layoutZ() { cards.forEach((c, i) => { c.el.style.zIndex = String(MAX + 2 - i) }) }

function add(e, animate) {
  const el = makeCard(e)
  const c = body(el, animate ? { y: -geo.pitch * 0.6, s: 1.02, o: 0 } : slot(0))
  c.e = e
  if (animate) c.vy = 40
  apply(c)
  cards.unshift(c)
  stack.prepend(el)
  // the first card arriving pushes the rest; they inherit a little of its momentum
  if (animate) cards.forEach((d, i) => { if (i > 0) d.vy += 60 / i })
  const live = cards.filter(d => !d.gone)
  live.slice(MAX).forEach(d => { d.gone = true })
  layoutZ()
  age()
  if (animate && !reduced.matches) kick(); else snap()
}

function rel(sec) {
  if (sec < 60) return `${Math.max(0, Math.round(sec))} s`
  if (sec < 3600) return `${Math.floor(sec / 60)} min`
  return `${Math.floor(sec / 3600)} h`
}

const lastByProduct = {}
function age() {
  const now = Date.now()
  for (const c of cards) {
    const sec = (now - c.e.time.getTime()) / 1000
    c.el.style.setProperty('--fresh', (0.5 ** (sec / HALF_LIFE)).toFixed(3))
    c.el.querySelector('.c-age').textContent = rel(sec)
  }
  for (const row of document.querySelectorAll('.p-row')) {
    const t = lastByProduct[row.dataset.id]
    row.style.setProperty('--fresh', t ? (0.5 ** ((now - t) / 1000 / HALF_LIFE)).toFixed(3) : 0)
  }
  const mins = Math.floor((now - arrivedAt) / 60000)
  $('#count').textContent = `${seen} new in ${mins} min`
}

function start() {
  measure()
  stack.replaceChildren()
  const feed = createFeed()
  const history = feed.recent(MAX)
  for (const e of [...history].reverse()) {
    add(e, false)
    if (!lastByProduct[e.product] || e.time.getTime() > lastByProduct[e.product]) lastByProduct[e.product] = e.time.getTime()
  }
  $('.fig-head').classList.add('is-live')
  $('#status').textContent = 'live'
  feed.subscribe(e => {
    seen++
    lastByProduct[e.product] = e.time.getTime()
    add(e, true)
    if (audio && audio.on) audio.play(e.product)
  })
  setInterval(age, 1000)
  age()

  // pointer: sideways pull with rubber band; release keeps its velocity
  stack.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return
    drag = { active: true, x: dragSpring.x, v: 0, start: ev.clientX - dragSpring.x / 0.6, lastX: ev.clientX, lastT: performance.now(), id: ev.pointerId }
    stack.setPointerCapture(ev.pointerId)
    stack.classList.add('dragging')
    kick()
  })
  stack.addEventListener('pointermove', ev => {
    if (!drag.active || ev.pointerId !== drag.id) return
    const raw = ev.clientX - drag.start
    const lim = geo.w * 0.35
    const x = Math.sign(raw) * lim * (1 - 1 / (1 + Math.abs(raw) * 0.6 / lim))
    const t = performance.now()
    const dtm = Math.max(1, t - drag.lastT)
    drag.v = 0.8 * ((x - dragSpring.x) / dtm * 1000) + 0.2 * drag.v
    dragSpring.x = x; drag.lastX = ev.clientX; drag.lastT = t
    if (reduced.matches) snap()
  })
  const end = ev => {
    if (!drag.active || ev.pointerId !== drag.id) return
    drag.active = false
    stack.classList.remove('dragging')
    dragSpring.v = reduced.matches ? 0 : Math.max(-2500, Math.min(2500, drag.v))
    if (reduced.matches) { dragSpring.x = 0; snap() } else kick()
  }
  stack.addEventListener('pointerup', end)
  stack.addEventListener('pointercancel', end)

  addEventListener('resize', () => { measure(); snap() }, { passive: true })
  reduced.addEventListener?.('change', () => snap())
}

start()
