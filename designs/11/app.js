import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { renderProducts } from './products.js'
import { sunPosition, shadowFor } from './sun.js'
import { createSound } from './sound.js'

const $ = s => document.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const C = { sun: '#fd4800', ink: '#020c2a', cream: '#fef0d8', deep: '#b8301a' }

// ---------- facts from content.js ----------
$('#products').innerHTML = renderProducts(content)
const mail = $('.mail a'); mail.href = `mailto:${content.email}`; mail.textContent = content.email
$('.avail').textContent = content.availability
$('.mcp code').textContent = content.mcpCommand

const osloDate = d => d.toLocaleDateString('en-GB', { timeZone: 'Europe/Oslo', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const osloTime = d => d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit' })
const dateEl = $('#date'); dateEl.textContent = osloDate(new Date()); dateEl.dateTime = new Date().toISOString().slice(0, 10)

// ---------- the shadow, from the real sun ----------
const first = $('.first')
function placeShadow() {
  const now = new Date()
  const pos = sunPosition(now)
  const s = shadowFor(pos)
  $('#castWide').setAttribute('transform', `skewX(${s.skew.toFixed(1)}) scale(1,${(-s.length * 2.8).toFixed(3)})`)
  $('#castTall').setAttribute('transform', `skewX(${s.skew.toFixed(1)}) scale(1,${(-s.length * 1.45).toFixed(3)})`)
  first.classList.toggle('night', s.night)
  const el = Math.round(pos.elevation), az = Math.round(pos.azimuth)
  $('#suncap').textContent = s.night
    ? `Oslo, ${osloTime(now)}. The sun is ${-el}° below the horizon, so the shadow has gone blue.`
    : `Shadow cast by the sun over Oslo at ${osloTime(now)}: ${el}° up, bearing ${az}°.`
}
placeShadow()
setInterval(placeShadow, 60000)

// ---------- the variable name ----------
const letters = [...document.querySelectorAll('.nm tspan')]
const byIndex = Array.from({ length: 9 }, (_, i) => letters.filter(t => +t.dataset.i === i))
const boost = new Float32Array(9)
const type = { w: 560, s: 50, tw: 560, ts: 50 }
const hash = str => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }

function setLetters() {
  for (let i = 0; i < 9; i++) {
    const b = boost[i]
    const dir = type.w > 640 ? -1 : 1
    const w = Math.max(100, Math.min(900, type.w + dir * 300 * b))
    const s = Math.max(0, Math.min(100, type.s + (dir > 0 ? -80 : 80) * b))
    const v = `'opsz' 144,'wght' ${w.toFixed(0)},'SOFT' ${s.toFixed(0)},'WONK' ${b > .35 ? 1 : 0}`
    for (const t of byIndex[i]) t.style.fontVariationSettings = v
  }
}

let typeRAF = 0, typeLast = 0
function typeTick(t) {
  const dt = Math.min(64, t - (typeLast || t)); typeLast = t
  const k = 1 - Math.exp(-dt / 1400)
  type.w += (type.tw - type.w) * k
  type.s += (type.ts - type.s) * k
  let active = Math.abs(type.tw - type.w) > .5
  for (let i = 0; i < 9; i++) { boost[i] *= Math.exp(-dt / 420); if (boost[i] < .01) boost[i] = 0; else active = true }
  setLetters()
  typeRAF = active ? requestAnimationFrame(typeTick) : 0
  if (!active) typeLast = 0
}
const wakeType = () => {
  if (reduce.matches) { type.w = type.tw; type.s = type.ts; boost.fill(0); setLetters(); return }
  if (!typeRAF) typeRAF = requestAnimationFrame(typeTick)
}

// ---------- controlled glitch on the name ----------
const NS = 'http://www.w3.org/2000/svg'
const glitchRigs = new Map()
function rig(svg, ref, w, h) {
  if (glitchRigs.has(svg)) return glitchRigs.get(svg)
  const id = `${svg.id}-g`
  const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'glitch'); g.style.display = 'none'
  const cp = document.createElementNS(NS, 'clipPath'); cp.id = id
  const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', -200); r.setAttribute('width', w + 400); cp.append(r)
  const bg = document.createElementNS(NS, 'rect'); bg.setAttribute('x', -200); bg.setAttribute('width', w + 400); bg.setAttribute('fill', C.sun)
  const ghost = document.createElementNS(NS, 'use'); ghost.setAttribute('href', ref); ghost.style.color = C.cream
  const ink = document.createElementNS(NS, 'use'); ink.setAttribute('href', ref); ink.style.color = C.ink
  const layer = document.createElementNS(NS, 'g'); layer.setAttribute('clip-path', `url(#${id})`)
  layer.append(bg, ghost, ink); g.append(cp, layer); svg.append(g)
  const o = { g, r, bg, ghost, ink, h }; glitchRigs.set(svg, o); return o
}
let lastGlitch = 0
function glitch() {
  if (reduce.matches) return
  const wide = getComputedStyle($('#svgWide')).display !== 'none'
  const o = wide ? rig($('#svgWide'), '#nameWide', 1000, 150) : rig($('#svgTall'), '#tallG', 1000, 1100)
  const slice = () => {
    const hh = o.h * (.05 + Math.random() * .14), y = o.h * (.08 + Math.random() * .8) - hh / 2
    for (const el of [o.r, o.bg]) { el.setAttribute('y', y.toFixed(1)); el.setAttribute('height', hh.toFixed(1)) }
    const dx = (Math.random() < .5 ? -1 : 1) * (6 + Math.random() * 18) * (o.h > 500 ? 2.2 : 1)
    o.ink.setAttribute('x', dx.toFixed(1)); o.ghost.setAttribute('x', (dx * 1.35).toFixed(1))
  }
  o.g.style.display = ''; slice(); sound.tick()
  setTimeout(slice, 70)
  setTimeout(() => { o.g.style.display = 'none' }, 150)
}

// ---------- feed state ----------
const feed = createFeed()
let events = feed.recent(50).slice().reverse() // oldest first
const fresh = new Map() // id -> arrival ms

function density() {
  const cutoff = Date.now() - 120000
  let n = 0; for (const e of events) if (e.time.getTime() > cutoff) n++
  const d = Math.min(1, n / 28)
  type.tw = 280 + 620 * d; type.ts = 100 * (1 - d)
  wakeType()
  $('#weightcap').innerHTML = `The name above is set in Fraunces at weight <b>${Math.round(type.tw)}</b>, because the last two minutes brought <b>${String(n).padStart(2, ' ')}</b> events. Busier days get bolder type; quiet ones get a lighter touch.`
}

// ---------- ledger ----------
const ledger = $('#ledger')
function ledgerItem(e) {
  const li = document.createElement('li')
  const t = document.createElement('time'); t.dateTime = e.time.toISOString(); t.textContent = formatTime(e.time)
  const p = document.createElement('span'); p.textContent = e.label
  const d = document.createElement('span'); d.textContent = describe(e)
  li.append(t, p, d); return li
}
function initLedger() {
  ledger.replaceChildren(...feed.recent(5).map(ledgerItem))
}

// ---------- the score (piano roll) ----------
const STAVES = [
  { id: 'mcp-emails', rows: ['inbox.connected', 'send.scheduled', 'draft.created', 'inbox.triaged', 'inbox.searched', 'thread.read'] },
  { id: 'fun-libs', rows: ['install', 'story.shared', 'story.completed'] },
  { id: 'toolrails', rows: ['tool.executed', 'tool.searched'] },
  { id: 'albretsen.no', rows: ['deploy', 'page.served'] },
]
const TOTAL_ROWS = STAVES.reduce((n, s) => n + s.rows.length, 0)
function rowOf(e) {
  let base = 0
  for (const s of STAVES) {
    if (s.id === e.product) { const r = s.rows.indexOf(e.kind); return { stave: s, row: base + Math.max(0, r), local: Math.max(0, r) } }
    base += s.rows.length
  }
  return { stave: STAVES[0], row: 0, local: 0 }
}

const canvas = $('#roll'), ctx = canvas.getContext('2d')
let W = 0, H = 0, dpr = 1
const HEAD = 22
function resize() {
  const r = canvas.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1)
  W = r.width; H = r.height
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
  draw()
}
const windowMs = () => (W < 640 ? 5 : 10) * 60000

function rowGeom() {
  const rowH = (H - HEAD) / TOTAL_ROWS
  return { rowH, y: row => HEAD + row * rowH }
}
const pseudo = (seed, k) => ((hash(seed + k) % 1000) / 1000)

function draw() {
  if (!W) return
  const now = Date.now(), win = windowMs()
  const playX = W - 40, pps = (playX - 4) / win
  const { rowH, y } = rowGeom()
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)

  // staff lines
  ctx.fillStyle = C.ink
  let base = 0
  for (const s of STAVES) {
    ctx.globalAlpha = 1; ctx.fillRect(0, Math.round(y(base)), W, 1)
    ctx.globalAlpha = .22
    for (let r = 1; r <= s.rows.length; r++) ctx.fillRect(0, Math.round(y(base + r - .5)), W, 1)
    base += s.rows.length
  }
  ctx.globalAlpha = 1; ctx.fillRect(0, Math.round(H) - 1, W, 1)

  // bar lines, one per minute, counted back from now
  ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace'
  ctx.textBaseline = 'top'
  for (let m = 1; m * 60000 <= win; m++) {
    const x = Math.round(playX - m * 60000 * pps)
    ctx.globalAlpha = .35; ctx.fillRect(x, HEAD, 1, H - HEAD)
    ctx.globalAlpha = 1; ctx.fillText(`−${m}′`, x + 4, 5)
  }

  // notes
  const cutoff = now - win - 2000
  const head = Math.max(3, rowH - 3)
  for (const e of events) {
    const t = e.time.getTime(); if (t < cutoff) continue
    const { row, stave } = rowOf(e)
    const x = playX - (now - t) * pps
    let w = e.ms ? 4 + e.ms * .03 : 9
    let top = y(row) + (rowH - head) / 2, h = head
    if (e.kind === 'deploy') { // a held chord across the whole stave
      const first = y(row - stave.rows.indexOf('deploy')); top = first + 2; h = rowH * stave.rows.length - 4; w = 6
    }
    const age = fresh.has(e.id) ? now - fresh.get(e.id) : Infinity
    if (age < 1100 && !reduce.matches) {
      const k = 1 - age / 1100
      ctx.globalAlpha = 1; ctx.fillStyle = C.cream; ctx.fillRect(x, top, w, h)
      ctx.fillStyle = C.ink
      for (let j = 0; j < 3; j++) { // horizontal tearing that settles
        const sy = top + pseudo(e.id, j) * h, sh = Math.max(1, h * .3)
        ctx.globalAlpha = .9 * k
        ctx.fillRect(x + (pseudo(e.id, j + 7) - .5) * 28 * k, sy, w * (1 + k), sh)
      }
      ctx.globalAlpha = 1; ctx.fillRect(x, top, w, h * (1 - k * .5))
    } else {
      ctx.globalAlpha = 1; ctx.fillStyle = C.ink; ctx.fillRect(x, top, w, h)
    }
  }
  for (const [id, at] of fresh) if (now - at > 1500) fresh.delete(id)

  // playhead
  ctx.globalAlpha = 1; ctx.fillStyle = C.ink
  ctx.fillRect(Math.round(playX), HEAD - 6, 2, H - HEAD + 6)
  ctx.beginPath(); ctx.moveTo(playX - 4, HEAD - 10); ctx.lineTo(playX + 6, HEAD - 10); ctx.lineTo(playX + 1, HEAD - 3); ctx.fill()
}

let visible = true, rollRAF = 0, lastDraw = 0
function rollLoop(t) {
  rollRAF = 0
  if (!visible || document.hidden || reduce.matches) return
  if (t - lastDraw > 33) { lastDraw = t; draw() }
  rollRAF = requestAnimationFrame(rollLoop)
}
const wakeRoll = () => { if (!rollRAF && visible && !document.hidden && !reduce.matches) rollRAF = requestAnimationFrame(rollLoop) }
new IntersectionObserver(([en]) => { visible = en.isIntersecting; wakeRoll() }).observe(canvas)
new ResizeObserver(resize).observe(canvas)
document.addEventListener('visibilitychange', wakeRoll)
setInterval(() => { if (reduce.matches) draw() }, 5000)
reduce.addEventListener?.('change', () => { wakeRoll(); wakeType() })
document.fonts?.ready.then(draw)

// ---------- sound ----------
const sound = createSound()
const btn = $('#sound')
btn.addEventListener('click', () => {
  const on = sound.toggle()
  btn.setAttribute('aria-pressed', String(on)); btn.querySelector('span').textContent = on ? 'on' : 'off'
})

// ---------- wiring ----------
const RARE = new Set(['deploy', 'inbox.connected', 'install', 'story.shared', 'send.scheduled', 'tool.executed'])
function onEvent(e) {
  events.push(e)
  const cutoff = Date.now() - 11 * 60000
  while (events.length && events[0].time.getTime() < cutoff) events.shift()
  fresh.set(e.id, Date.now())

  boost[hash(e.id) % 9] = 1
  density()

  const li = ledgerItem(e)
  if (!reduce.matches) li.classList.add('fresh')
  ledger.prepend(li)
  while (ledger.children.length > 5) ledger.lastElementChild.remove()

  const { row } = rowOf(e)
  sound.note(TOTAL_ROWS - 1 - row, e.kind === 'deploy')
  if (RARE.has(e.kind) && Date.now() - lastGlitch > 9000) { lastGlitch = Date.now(); glitch() }
  if (reduce.matches) draw(); else wakeRoll()
}

initLedger()
density()
setInterval(density, 5000)
const nowEl = $('#now')
const tick = () => { nowEl.textContent = formatTime(new Date()) }
tick(); setInterval(tick, 1000)
feed.subscribe(onEvent)
