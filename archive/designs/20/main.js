import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { productsHTML } from './render.js'
import { createSound, THRESHOLD } from './sound.js'

// Products: same markup as the static fallback, rendered from content.js.
const list = document.getElementById('products-list')
if (list) list.innerHTML = productsHTML(content.products)

// Each product has a vector. A new event is born at the centre (the
// threshold) and drifts out along its product's vector as it ages, cell by
// cell on the character grid. Nothing is sped up: position is real age.
const VECTOR = { 'mcp-emails': -14, toolrails: 96, 'fun-libs': 190, 'albretsen.no': 268 }
const ORDER = ['mcp-emails', 'toolrails', 'fun-libs', 'albretsen.no']
const TAU = 240 // seconds for an event to travel most of the way out
const LINKS = 9 // how many stars per product are joined into its figure

const $ = id => document.getElementById(id)
const sky = $('sky'), logEl = $('log'), statusEl = $('status'), soundBtn = $('sound')
const marks = [...document.querySelectorAll('[data-live-mark]')]
const reduced = matchMedia('(prefers-reduced-motion: reduce)')

const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296 }
const age = (e, now) => Math.max(0, (now - e.time.getTime()) / 1000)
const reach = a => 0.1 + 0.78 * (1 - Math.exp(-a / TAU))
const angleOf = e => (VECTOR[e.product] + (hash(e.id) - 0.5) * 52) * Math.PI / 180
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const feed = createFeed()
let events = feed.recent(50)

function cells() {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const cw = rem * 0.625, ch = rem * 0.875 // one character cell, half a line tall
  const w = sky.clientWidth, h = sky.clientHeight
  return { cw, ch, w, h, cols: Math.floor(w / cw), rows: Math.floor(h / ch) }
}

function layout(g, now) {
  const { cw, ch, cols, rows } = g
  const cx = cols / 2, cy = rows / 2, rx = cols / 2 - 3, ry = rows / 2 - 1.5
  const taken = new Set(), out = []
  for (const e of events) { // newest first
    const a = age(e, now), r = reach(a), th = angleOf(e)
    const dx = Math.cos(th), dy = Math.sin(th)
    let c = Math.round(cx + dx * rx * r - 0.5), w = Math.round(cy + dy * ry * r - 0.5)
    for (let k = 0; k < 6 && taken.has(c + ',' + w); k++) { // step outward one cell
      if (Math.abs(dx) > Math.abs(dy)) c += Math.sign(dx) || 1; else w += Math.sign(dy) || 1
    }
    c = Math.max(1, Math.min(cols - 2, c)); w = Math.max(1, Math.min(rows - 2, w))
    taken.add(c + ',' + w)
    out.push({ e, a, t: 1 - Math.exp(-a / TAU), x: (c + 0.5) * cw, y: (w + 0.5) * ch })
  }
  return out
}

function drawSky(now) {
  const g = cells()
  if (!g.w || !g.h) return
  const pts = layout(g, now)
  let lines = '', stars = '', newest = {}
  for (const p of ORDER) {
    const own = pts.filter(s => s.e.product === p)
    newest[p] = own[0]
    const chain = own.slice(0, LINKS)
    if (chain.length > 1) lines += `<polyline class="fig" points="${chain.map(s => `${s.x.toFixed(1)},${s.y.toFixed(1)}`).join(' ')}"/>`
    if (chain.length > 1) lines += `<line class="fig-head" x1="${chain[0].x}" y1="${chain[0].y}" x2="${chain[1].x}" y2="${chain[1].y}"/>`
  }
  for (const s of pts.slice().reverse()) {
    const lead = newest[s.e.product] === s
    const r = lead ? 3 : Math.max(1, 2.3 - 1.4 * s.t)
    stars += `<circle class="${lead ? 'star lead' : 'star'}" cx="${s.x}" cy="${s.y}" r="${r.toFixed(2)}" opacity="${lead ? 1 : (1 - 0.72 * s.t).toFixed(2)}"/>`
  }
  const { w, h, cw, ch } = g
  const label = (txt, x, y, anchor) => `<text x="${x}" y="${y}" text-anchor="${anchor}">${txt}</text>`
  const labels =
    label('MCP Emails', w - cw, h / 2 - ch * 2, 'end') +
    label('Toolrails', w / 2 + cw * 2, h - ch * 0.6, 'start') +
    label('Fun Libs', cw, h / 2 + ch * 2.6, 'start') +
    label('albretsen.no', w / 2 - cw * 2, ch * 1.3, 'end')
  sky.querySelector('.layer').innerHTML = `<g class="labels">${labels}</g><g>${lines}</g><g>${stars}</g>`
  sky.querySelector('svg').setAttribute('viewBox', `0 0 ${w} ${h}`)
  lastPts = pts
  drawMarks(now)
}
let lastPts = []

function birth(e) {
  if (reduced.matches) return
  const s = lastPts.find(p => p.e === e)
  if (!s) return
  const ns = 'http://www.w3.org/2000/svg', c = document.createElementNS(ns, 'circle')
  c.setAttribute('class', 'birth'); c.setAttribute('cx', s.x); c.setAttribute('cy', s.y); c.setAttribute('r', 3)
  sky.querySelector('.births').append(c)
  setTimeout(() => c.remove(), 1800)
}

// The mark: the newest star of each product, joined. Its shape is the
// shape of what just happened.
function markPoints(now, size) {
  const c = size / 2, R = size / 2 - 2.5, unit = size / 12
  return ORDER.map(p => {
    const e = events.find(x => x.product === p)
    const r = e ? 0.25 + 0.75 * reach(age(e, now)) / 0.88 : 0.9
    const th = e ? angleOf(e) : VECTOR[p] * Math.PI / 180
    const snap = v => Math.round(v / unit) * unit
    return [snap(c + Math.cos(th) * R * r), snap(c + Math.sin(th) * R * r), e === events[0]]
  })
}
function drawMarks(now) {
  for (const svg of marks) {
    const size = +svg.dataset.size || 24
    const pts = markPoints(now, size)
    svg.querySelector('polygon').setAttribute('points', pts.map(p => p[0] + ',' + p[1]).join(' '))
    svg.querySelectorAll('circle').forEach((c, i) => {
      c.setAttribute('cx', pts[i][0]); c.setAttribute('cy', pts[i][1])
      c.classList.toggle('now', pts[i][2])
      c.setAttribute('r', (pts[i][2] ? 2.3 : 1.6) * size / 24)
    })
  }
}

function logRow(e) {
  const tail = describe(e).slice(e.text.length)
  return `<li><time datetime="${e.time.toISOString()}">${formatTime(e.time)}</time>` +
    `<span><b>${esc(e.label)}</b> ${esc(e.text)}<i>${esc(tail)}</i></span></li>`
}
function drawLog() { logEl.innerHTML = events.slice(0, 4).map(logRow).join('') }

const perMinute = now => events.filter(e => now - e.time.getTime() < 60000).length
function drawStatus(now) {
  const n = perMinute(now)
  const ago = Math.round(age(events[0], now))
  const word = n >= THRESHOLD ? 'travelt' : 'stille'
  statusEl.innerHTML = `<span>${n} in the last minute</span><span>newest ${ago < 60 ? ago + ' s' : Math.round(ago / 60) + ' min'} ago</span><span class="word" title="${word === 'stille' ? 'quiet' : 'busy'}">${word}</span>`
  sound.activity(n)
}

const sound = createSound()
soundBtn.hidden = false
soundBtn.addEventListener('click', async () => {
  const on = await sound.toggle()
  soundBtn.setAttribute('aria-pressed', String(on))
  soundBtn.textContent = on ? 'lyd: på' : 'lyd: av'
  soundBtn.title = on ? 'sound on' : 'sound off'
})

feed.subscribe(e => {
  events = feed.recent(50)
  const now = Date.now()
  drawSky(now); drawLog(); drawStatus(now)
  birth(e); sound.ring(e)
})

document.documentElement.classList.add('live')
const now0 = Date.now()
drawSky(now0); drawLog(); drawStatus(now0)
let tick = 0
setInterval(() => {
  if (document.hidden) return
  const now = Date.now()
  drawStatus(now)
  if (++tick % 3 === 0) drawSky(now)
}, 1000)
new ResizeObserver(() => drawSky(Date.now())).observe(sky)
