// Bloom Edition. JavaScript only creates elements and toggles classes;
// every fade, bloom, ring and drawn line is a CSS animation.
import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { worksHTML, coverHTML } from './render.js'
import { createSound } from './sound.js'

const $ = s => document.querySelector(s)
const SVG = 'http://www.w3.org/2000/svg'

// Facts come from content.js. The baked markup is identical, so this swap does not move anything.
$('#works-list').innerHTML = worksHTML(content)
$('#cover').innerHTML = coverHTML(content)
$('.foot__avail').textContent = content.availability
const mail = $('.foot__mail a'); mail.textContent = content.email; mail.href = `mailto:${content.email}`
$('.mcp code').textContent = content.mcpCommand

// ---------- the constellation ----------
// Each product is a sunflower: event n of a product sits at slot n of a
// golden-angle spiral, so the cluster blooms outward as the day goes on.
// Lines follow the Fibonacci spirals of the head (slot to slot - 13, - 8, ...).
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const CLUSTERS = {
  'mcp-emails':   { x: 300, y: 300, R: 230, cap: 70, turn: 0.0 },
  'fun-libs':     { x: 680, y: 330, R: 175, cap: 50, turn: 1.3 },
  toolrails:      { x: 900, y: 140, R: 80,  cap: 18, turn: 2.1 },
  'albretsen.no': { x: 900, y: 540, R: 60,  cap: 12, turn: 0.7 },
}
const state = {}
for (const [k, c] of Object.entries(CLUSTERS)) {
  c.step = c.R / Math.sqrt(c.cap)
  state[k] = { n: 0, slots: new Array(c.cap), order: [], seen: 0 }
}
const BIG = new Set(['inbox.connected', 'install', 'deploy'])
const PARENT = [13, 8, 5, 3, 2, 1]

const stars = $('#stars'), links = $('#links'), tags = $('#tags')
let latest = null

const el = (name, attrs, parent) => {
  const n = document.createElementNS(SVG, name)
  for (const k in attrs) n.setAttribute(k, attrs[k])
  if (parent) parent.appendChild(n)
  return n
}

function pos(c, slot) {
  const r = c.step * Math.sqrt(slot + 0.6)
  const a = slot * GOLDEN + c.turn
  return [+(c.x + r * Math.cos(a)).toFixed(1), +(c.y + r * Math.sin(a)).toFixed(1)]
}

function radius(e) {
  if (e.kind === 'deploy') return 7
  if (BIG.has(e.kind)) return 5.2
  if (e.ms) return 2.2 + Math.min(e.ms, 1000) / 360
  return 3.4
}

function place(e, mode, i = 0) {
  const c = CLUSTERS[e.product], s = state[e.product]
  if (!c) return null
  const slot = s.n % c.cap
  s.n++; s.seen++
  const [x, y] = pos(c, slot)

  // the slot's previous occupant fades out where the new one blooms
  const old = s.slots[slot]
  if (old) { old.classList.add('p--out'); setTimeout(() => old.remove(), 2800) }

  const r = radius(e)
  const g = el('g', { class: `p p--${e.product === 'albretsen.no' ? 'site' : e.product} p--${mode}${BIG.has(e.kind) ? ' p--big' : ''}${e.kind === 'deploy' ? ' p--deploy' : ''}`, transform: `translate(${x} ${y})` })
  g.style.setProperty('--i', i)
  if (mode === 'new') el('circle', { class: 'p__glow', r: 26 }, g)
  el('circle', { class: 'p__ring', r }, g)
  el('circle', { class: 'p__dot', r }, g)
  stars.appendChild(g)
  s.slots[slot] = g
  s.order.push(g)
  if (s.order.length > c.cap) s.order.shift()
  // older half of a cluster dims a little, so the fresh edge reads first
  const dim = s.order[s.order.length - 1 - Math.ceil(c.cap * 0.55)]
  if (dim) dim.classList.add('p--age')

  // constellation line along the head's spiral
  const p = PARENT.find(d => slot - d >= 0 && s.slots[slot - d])
  if (p !== undefined) {
    const [px, py] = pos(c, slot - p)
    const old = links.querySelector(`[data-k="${e.product}:${slot}"]`)
    if (old) old.remove()
    el('line', { x1: px, y1: py, x2: x, y2: y, pathLength: 1, 'data-k': `${e.product}:${slot}`, class: mode === 'new' ? 'l--new' : '' }, links)
  }

  if (latest) latest.classList.remove('p--latest')
  g.classList.add('p--latest'); latest = g
  return [x, y]
}

function tag(e, x, y) {
  while (tags.childElementCount > 2) tags.firstElementChild.remove()
  const right = x > 600
  const t = el('text', { x: right ? x - 14 : x + 14, y: Math.max(y - 12, 22), 'text-anchor': right ? 'end' : 'start' }, tags)
  const k = el('tspan', { class: 'k' }, t); k.textContent = e.label + '\u2002'
  const d = el('tspan', {}, t); d.textContent = describe(e)
  setTimeout(() => t.remove(), 7200)
}

// ---------- the wire (margin log) ----------
const log = $('#log'), since = $('#since')
let arrived = 0
function row(e, fresh) {
  const li = document.createElement('li')
  li.className = 'log__row' + (fresh ? ' log__row--new' : '')
  const t = document.createElement('time'); t.dateTime = e.time.toISOString(); t.textContent = formatTime(e.time)
  const s = document.createElement('span')
  const b = document.createElement('b'); b.textContent = e.label
  s.append(b, document.createTextNode(describe(e)))
  li.append(t, s)
  return li
}
function logEvent(e, fresh) {
  log.prepend(row(e, fresh))
  while (log.children.length > 6) log.lastElementChild.remove()
}
function counts() {
  for (const n of document.querySelectorAll('[data-n]')) n.textContent = state[n.dataset.n]?.seen ?? 0
}

// ---------- go live ----------
const feed = createFeed()
const history = feed.recent(50).slice().reverse()   // oldest first, so the spiral grows outward
history.forEach((e, i) => place(e, 'hist', i))
log.replaceChildren(...feed.recent(6).map(e => row(e, false)))
counts()
document.documentElement.classList.add('is-live')

const sound = createSound()
feed.subscribe(e => {
  const p = place(e, 'new')
  if (p) tag(e, ...p)
  logEvent(e, true)
  since.textContent = ++arrived
  counts()
  sound.ping(e)
})

// ---------- sound: off until asked ----------
const btn = $('#sound'), label = btn.querySelector('.sound__label')
btn.addEventListener('click', async () => {
  if (sound.on) { await sound.disable(); btn.setAttribute('aria-pressed', 'false'); label.textContent = 'Sound off'; return }
  const ok = await sound.enable()
  if (ok) { btn.setAttribute('aria-pressed', 'true'); label.textContent = 'Sound on' }
})
