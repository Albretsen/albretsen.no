// Albedo: a pale map that reports what the products are doing.
// Static markup carries the page; this module only adds the live layer.
import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { LAND } from './land.js'
import { renderProducts } from './products.js'

document.documentElement.classList.add('js')
const reduce = matchMedia('(prefers-reduced-motion: reduce)')

const COLOR = { 'mcp-emails': '#5fb7dc', 'fun-libs': '#e6a0ba', toolrails: '#8ad7b6', 'albretsen.no': '#ebd28f' }
const LAND_COLOR = '#bad6e3'
const INK = '#172e40'

// Approximate centroids. The feed reports country or city, never more precise than that.
const PLACES = {
  Norway: [61, 9.5], Sweden: [62.5, 16], Denmark: [56, 9.5], Germany: [51, 10.4], 'United States': [39.5, -98.5],
  Brazil: [-10.5, -52], India: [22.5, 79], 'United Kingdom': [53.5, -2], Canada: [56, -104], Netherlands: [52.2, 5.6],
  Japan: [36.5, 138.5], Australia: [-25.5, 134], France: [46.6, 2.4], Spain: [40.2, -3.6], Poland: [52, 19.4], Mexico: [23.5, -102.5],
  Oslo: [59.91, 10.75], Stockholm: [59.33, 18.07], Frankfurt: [50.11, 8.68], Amsterdam: [52.37, 4.9], London: [51.51, -0.13],
  Ashburn: [39.04, -77.49], 'São Paulo': [-23.55, -46.63], Tokyo: [35.68, 139.69], Singapore: [1.35, 103.82], Sydney: [-33.87, 151.21],
}

// ---------- products and footer from content.js (same markup as the static fallback) ----------
renderProducts(document.getElementById('plist'), document.getElementById('psum'), content.products)
const avail = document.querySelector('.foot .avail'); if (avail) avail.textContent = content.availability
const mail = document.querySelector('.foot .mail'); if (mail) { mail.textContent = content.email; mail.href = `mailto:${content.email}` }

// ---------- map ----------
const hero = document.querySelector('.hero')
const slot = document.querySelector('.map-slot')
const canvas = document.querySelector('.map')
const labels = document.querySelector('.labels')
const ctx = canvas.getContext('2d')
const landLayer = document.createElement('canvas')
let geo = { cell: 1, ox: 0, oy: 0, w: 0, h: 0, dpr: 1 }

const located = []   // { lat, lon, product, time, born }
const rings = []     // { lat, lon, product, start }

function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296 }
const project = (lat, lon) => [geo.ox + ((lon + 180) / 360) * geo.cell * LAND.cols, geo.oy + ((LAND.top - lat) / LAND.step) * geo.cell]

function layout() {
  const hr = hero.getBoundingClientRect(), sr = slot.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.round(hr.width), h = Math.round(hr.height)
  const rows = LAND.rows.length
  const sw = sr.width, sh = sr.height
  const cell = Math.min(sw / LAND.cols, sh / rows)
  geo = { cell, dpr, w, h, ox: sr.left - hr.left + (sw - cell * LAND.cols) / 2, oy: sr.top - hr.top + (sh - cell * rows) / 2 }
  canvas.width = landLayer.width = Math.round(w * dpr)
  canvas.height = landLayer.height = Math.round(h * dpr)
  const lc = landLayer.getContext('2d')
  lc.setTransform(dpr, 0, 0, dpr, 0, 0)
  lc.clearRect(0, 0, w, h)
  lc.fillStyle = LAND_COLOR
  const s = Math.max(1 / dpr, Math.round(cell * 0.34 * dpr) / dpr)
  LAND.rows.forEach((hex, r) => {
    for (let i = 0; i < hex.length; i++) {
      const nib = parseInt(hex[i], 16)
      if (!nib) continue
      for (let b = 0; b < 4; b++) {
        if (!(nib & (8 >> b))) continue
        const c = i * 4 + b
        const x = Math.round((geo.ox + c * cell + (cell - s) / 2) * dpr) / dpr
        const y = Math.round((geo.oy + r * cell + (cell - s) / 2) * dpr) / dpr
        lc.fillRect(x, y, s, s)
      }
    }
  })
  draw()
}

function ageAlpha(t, now) {
  const age = (now - t) / 1000
  return age < 60 ? 1 : Math.max(0.22, 1 - (age - 60) / 840)
}

let raf = 0
function draw() {
  raf = 0
  const { dpr, w, h, cell } = geo
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(landLayer, 0, 0)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const now = Date.now()
  const core = Math.max(3, Math.round(cell * 0.92))
  for (const e of located) {
    const [x, y] = project(e.lat, e.lon)
    ctx.fillStyle = COLOR[e.product]
    if (now - e.time < 90000) { // a recent signal keeps a pale field around it
      const f = Math.round(cell * 3.2)
      ctx.globalAlpha = 0.2 * (1 - (now - e.time) / 90000)
      ctx.fillRect(Math.round(x - f / 2), Math.round(y - f / 2), f, f)
    }
    ctx.globalAlpha = ageAlpha(e.time, now)
    ctx.fillRect(Math.round(x - core / 2), Math.round(y - core / 2), core, core)
  }
  const t = performance.now()
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i], p = (t - r.start) / 1800
    if (p >= 1) { rings.splice(i, 1); continue }
    const [x, y] = project(r.lat, r.lon)
    const size = core + (1 - (1 - p) ** 3) * cell * 9
    ctx.globalAlpha = (1 - p) * 0.9
    ctx.strokeStyle = COLOR[r.product]
    ctx.lineWidth = 1
    ctx.strokeRect(Math.round(x - size / 2) + 0.5, Math.round(y - size / 2) + 0.5, Math.round(size), Math.round(size))
  }
  ctx.globalAlpha = 1
  if (rings.length) raf = requestAnimationFrame(draw)
}
const redraw = () => { if (!raf) raf = requestAnimationFrame(draw) }

new ResizeObserver(layout).observe(hero)

// ---------- teletype ----------
function teletype(host, parts, speed = 24, done) {
  clearTimeout(host._tt)
  if (reduce.matches) { parts.forEach(([el, s]) => { el.textContent = s }); host.classList.remove('typing'); done && done(); return }
  parts.forEach(([el]) => { el.textContent = '' })
  host.classList.add('typing')
  let i = 0, j = 0
  const tick = () => {
    if (i >= parts.length) { host.classList.remove('typing'); done && done(); return }
    const [el, s] = parts[i]
    el.textContent = s.slice(0, ++j)
    if (j >= s.length) { i++; j = 0 }
    host._tt = setTimeout(tick, speed)
  }
  tick()
}

// ---------- feed rows (fixed slots: text changes, boxes never move) ----------
const rowEls = [...document.querySelectorAll('#rows li')]
const shown = []
function fillRow(li, e, type, speed, done) {
  const time = li.querySelector('time'), sw = li.querySelector('.sw'), tx = li.querySelector('.tx')
  time.textContent = formatTime(e.time)
  time.dateTime = e.time.toISOString()
  sw.className = `sw c-${e.product}`
  const b = document.createElement('b'), sp = document.createElement('span')
  tx.replaceChildren(b, document.createTextNode(' '), sp)
  const tail = describe(e)
  if (type) teletype(tx, [[b, e.label], [sp, tail]], speed, done)
  else { clearTimeout(tx._tt); tx.classList.remove('typing'); b.textContent = e.label; sp.textContent = tail }
}

// ---------- latency strip for events without coordinates ----------
const lat = document.getElementById('lat')
const latDots = []
function plotLatency(e) {
  const i = document.createElement('i')
  i.className = `c-${e.product}`
  i.style.left = `${Math.min(e.ms, 1000) / 10}%`
  i._t = e.time.getTime()
  lat.append(i)
  latDots.push(i)
  while (latDots.length > 40) latDots.shift().remove()
  i.style.opacity = ageAlpha(i._t, Date.now())
}

// ---------- the moment an event lands ----------
let tagEl = null
function tag(e, lat0, lon0) {
  if (tagEl) tagEl.remove()
  const [x, y] = project(lat0, lon0)
  const el = document.createElement('div')
  el.className = 'tag'
  const flip = x > geo.w * 0.62
  el.style.transform = `translate(${Math.round(flip ? x - 14 : x + 14)}px, ${Math.round(y - 11)}px)${flip ? ' translateX(-100%)' : ''}`
  if (flip) { el.style.borderLeft = '0'; el.style.borderRight = `1px solid ${INK}` }
  const s = document.createElement('span')
  el.append(s)
  labels.append(el)
  tagEl = el
  teletype(el, [[s, `${e.label} / ${e.text} / ${e.country || e.city}`]], 26)
  setTimeout(() => el.classList.add('out'), 6000)
  setTimeout(() => el.remove(), 7000)
}

const mark = document.querySelector('.mark')
function place(e, fresh) {
  const where = e.country || e.city
  if (where && PLACES[where]) {
    const [la, lo] = PLACES[where]
    const spread = e.city ? 0.6 : 2.4
    const p = { lat: la + (hash(e.id) - 0.5) * spread, lon: lo + (hash(e.id + 'x') - 0.5) * spread * 1.4, product: e.product, time: e.time.getTime() }
    located.push(p)
    if (located.length > 400) located.shift()
    if (fresh) {
      if (!reduce.matches) rings.push({ ...p, start: performance.now() })
      if (geo.w > 820) tag(e, p.lat, p.lon)
    }
  } else if (e.ms) plotLatency(e)
  if (fresh && e.kind === 'deploy') { mark.classList.add('lit'); setTimeout(() => mark.classList.remove('lit'), 4000) }
}

// ---------- start ----------
const feed = createFeed()
const history = feed.recent(12)
history.slice().reverse().forEach(e => place(e, false))
shown.push(...history.slice(0, rowEls.length))
let k = 0
const intro = () => { if (k < shown.length) { fillRow(rowEls[k], shown[k], true, 9, intro); k++ } }
intro()
redraw()

let count = 0
const countEl = document.getElementById('count')
feed.subscribe(e => {
  count++
  countEl.textContent = count
  shown.unshift(e); shown.length = Math.min(shown.length, rowEls.length)
  k = shown.length // stop any intro still running
  shown.forEach((ev, i) => fillRow(rowEls[i], ev, i === 0, 24))
  place(e, true)
  redraw()
})

// Fade with age. Honest quiet: nothing moves unless something happened.
setInterval(() => {
  const now = Date.now()
  latDots.forEach(i => { i.style.opacity = ageAlpha(i._t, now) })
  redraw()
}, 10000)

// ---------- print: a still of the map, and when it was taken ----------
let printImg = null
function forLandCells(fn) {
  LAND.rows.forEach((hex, r) => {
    for (let i = 0; i < hex.length; i++) {
      const nib = parseInt(hex[i], 16)
      for (let b = 0; b < 4; b++) if (nib & (8 >> b)) fn(i * 4 + b, r)
    }
  })
}
function beforePrint() {
  const d = new Date()
  document.getElementById('printed').textContent = `Snapshot printed ${d.toISOString().slice(0, 10)} ${formatTime(d)}. ${count} events observed since arrival.`
  const cell = 10, W = LAND.cols * cell, H = LAND.rows.length * cell
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const x = c.getContext('2d')
  x.fillStyle = LAND_COLOR
  const s = 4
  forLandCells((col, row) => x.fillRect(col * cell + 3, row * cell + 3, s, s))
  const now = Date.now()
  for (const e of located) {
    x.globalAlpha = ageAlpha(e.time, now)
    x.fillStyle = COLOR[e.product]
    const px = ((e.lon + 180) / 360) * W, py = ((LAND.top - e.lat) / LAND.step) * cell
    x.fillRect(Math.round(px - 5), Math.round(py - 5), 10, 10)
  }
  if (!printImg) { printImg = new Image(); printImg.alt = ''; printImg.width = W; printImg.height = H; slot.append(printImg) }
  printImg.src = c.toDataURL('image/png')
}
addEventListener('beforeprint', beforePrint)
