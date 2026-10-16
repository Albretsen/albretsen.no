import { content } from '../_shared/content.js'
import { createFeed, formatTime } from '../_shared/feed.js'
import { productsHTML } from './products.js'
import { markSVG, newSeed, seedLabel } from './mark.js'
import { startSound, stopSound, click } from './sound.js'

const $ = (s, el = document) => el.querySelector(s)
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const SVGNS = 'http://www.w3.org/2000/svg'

/* ---------- products (identical to the static markup, so nothing moves) ---------- */
const made = $('#products')
const html = productsHTML(content)
if (made && made.dataset.built !== 'static') made.innerHTML = html

/* ---------- the mark ---------- */
let seed = newSeed()
function drawMark() {
  const label = seedLabel(seed)
  $('#mark').innerHTML = markSVG(seed)
  document.querySelectorAll('[data-seed]').forEach(el => { el.textContent = label })
  const fav = markSVG(seed, { tile: '#171a0f', dot: '#fafbf5', spot: '#caed21' })
  $('link[rel="icon"]').href = 'data:image/svg+xml,' + encodeURIComponent(fav)
}
drawMark()
$('#redraw')?.addEventListener('click', () => { seed = newSeed(); drawMark() })

/* ---------- paper / ink ---------- */
const root = document.documentElement
const dark = matchMedia('(prefers-color-scheme: dark)')
const current = () => root.dataset.theme || (dark.matches ? 'dark' : 'light')
const toggle = $('#theme')
function syncToggle() {
  const t = current()
  toggle.setAttribute('aria-pressed', String(t === 'dark'))
  $('#theme-word').textContent = t === 'dark' ? 'Paper on ink' : 'Ink on paper'
  root.dataset.shown = t
}
toggle.addEventListener('click', () => {
  const next = current() === 'dark' ? 'light' : 'dark'
  root.dataset.theme = next
  try { localStorage.setItem('a19-theme', next) } catch {}
  syncToggle()
})
dark.addEventListener('change', syncToggle)
syncToggle()

/* ---------- copy the quiet line ---------- */
const mcp = $('#mcp')
mcp?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(content.mcpCommand); mcp.dataset.state = 'copied' }
  catch { mcp.dataset.state = '' }
  setTimeout(() => { mcp.dataset.state = '' }, 1600)
})

/* ---------- the map ---------- */
const map = $('#map'), dotsG = $('#dots')
const land = new Set()
for (const m of $('#land').getAttribute('d').matchAll(/M(\d+) (\d+)h(\d+)/g)) {
  const i0 = (m[1] - 5) / 10, j = (m[2] - 5) / 10, n = m[3] / 10
  for (let k = 0; k <= n; k++) land.add(`${i0 + k},${j}`)
}
// lon, lat, spread (cells)
const PLACES = {
  Norway: [9.5, 61, 1], Sweden: [16, 62, 1], Denmark: [9.5, 56, 0], Germany: [10, 51, 1],
  'United States': [-98, 39, 5], Brazil: [-50, -10, 4], India: [78, 22, 3], 'United Kingdom': [-2, 53, 0],
  Canada: [-100, 56, 5], Netherlands: [5.3, 52.2, 0], Japan: [138, 36, 1], Australia: [134, -25, 4],
  France: [2.5, 46.5, 1], Spain: [-3.7, 40, 1], Poland: [19, 52, 0], Mexico: [-102, 23, 2],
  Oslo: [10.75, 59.9, 0], Stockholm: [18.07, 59.33, 0], Frankfurt: [8.68, 50.11, 0], Amsterdam: [4.9, 52.37, 0],
  London: [-0.13, 51.5, 0], Ashburn: [-77.49, 39.04, 0], 'São Paulo': [-46.6, -23.5, 0], Tokyo: [139.7, 35.7, 0],
  Singapore: [103.8, 1.35, 0], Sydney: [151.2, -33.9, 0],
}
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
function cellFor(e) {
  const p = PLACES[e.country || e.city]
  if (!p) return null
  const ci = Math.round((p[0] + 180 - 1.5) / 3), cj = Math.round((81 - 1.5 - p[1]) / 3)
  const R = p[2], cand = []
  for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++)
    if (di * di + dj * dj <= R * R + 0.5 && land.has(`${ci + di},${cj + dj}`)) cand.push([ci + di, cj + dj])
  const [i, j] = cand.length ? cand[hash(e.id) % cand.length] : [ci, cj]
  return { key: `${i},${j}`, x: 5 + 10 * i, y: 5 + 10 * j }
}

const SHAPE = {
  'fun-libs': (x, y, s) => ['circle', { cx: x, cy: y, r: 3.4 * s }],
  'mcp-emails': (x, y, s) => ['circle', { cx: x, cy: y, r: 3 * s, class: 'ring' }],
  toolrails: (x, y, s) => ['rect', { x: x - 3 * s, y: y - 3 * s, width: 6 * s, height: 6 * s }],
  'albretsen.no': (x, y, s) => ['path', { d: `M${x - 3.6 * s} ${y}h${7.2 * s}M${x} ${y - 3.6 * s}v${7.2 * s}`, class: 'plus' }],
}
function shape(product, x, y, s) {
  const [tag, attrs] = (SHAPE[product] || SHAPE['fun-libs'])(x, y, s)
  const el = document.createElementNS(SVGNS, tag)
  for (const k in attrs) el.setAttribute(k, typeof attrs[k] === 'number' ? +attrs[k].toFixed(2) : attrs[k])
  return el
}

const KEEP = 60, NOWHERE = 120
const kept = []                 // events on the page, oldest first
const cells = new Map()         // key -> { x, y, ids: [], el }
const byId = new Map()          // id -> key
let slotN = 0

function paintCell(key) {
  const c = cells.get(key)
  c.el?.remove()
  if (!c.ids.length) { cells.delete(key); return }
  const last = kept.find(e => e.id === c.ids[c.ids.length - 1])
  const s = Math.min(1.9, 1 + (c.ids.length - 1) * 0.22)
  c.el = shape(last.product, c.x, c.y, s)
  c.el.classList.add('ev')
  dotsG.appendChild(c.el)
}

function place(e) {
  let spot = cellFor(e)
  if (!spot) { // no country, no city: the bottom line
    const i = slotN++ % NOWHERE
    spot = { key: `n${i}`, x: 5 + 10 * i, y: 488 }
    const prev = cells.get(spot.key)
    if (prev) { prev.ids.forEach(id => byId.delete(id)); prev.ids = [] }
  }
  if (!cells.has(spot.key)) cells.set(spot.key, { x: spot.x, y: spot.y, ids: [] })
  cells.get(spot.key).ids.push(e.id)
  byId.set(e.id, spot.key)
  kept.push(e)
  if (kept.length > KEEP) {
    const old = kept.shift(), k = byId.get(old.id)
    byId.delete(old.id)
    if (k && cells.has(k)) { const c = cells.get(k); c.ids = c.ids.filter(id => id !== old.id); if (k !== spot.key) paintCell(k) }
  }
  paintCell(spot.key)
  // age: the newest is the spot, the last dozen are ink, the rest fade toward the paper
  const recent = kept.slice(-12).map(x => byId.get(x.id))
  for (const [k, c] of cells) {
    if (!c.el) continue
    c.el.classList.toggle('new', k === spot.key)
    c.el.classList.toggle('old', !recent.includes(k))
  }
}

/* ---------- marginal log ---------- */
const slots = [...document.querySelectorAll('#log li')]
const shown = []
const tail = e => e.country ? `in ${e.country}`
  : e.city ? `from ${e.city}, ${e.kb} KB`
  : e.sha ? `${e.sha}, ${e.kb} KB`
  : e.ms ? `in ${e.ms} ms` : ''

function paintSlots() {
  slots.forEach((li, n) => {
    const e = shown[n]
    if (!e) return
    li.dataset.id = e.id
    li.tabIndex = 0
    li.querySelector('.t').textContent = formatTime(e.time)
    li.querySelector('.p').textContent = e.label
    li.querySelector('.d').textContent = `${e.text} ${tail(e)}`.trim()
  })
}
function highlight(id, on) {
  const k = byId.get(id); const c = k && cells.get(k)
  if (c?.el) c.el.classList.toggle('hl', on)
}
slots.forEach(li => {
  for (const [ev, on] of [['mouseenter', true], ['mouseleave', false], ['focus', true], ['blur', false]])
    li.addEventListener(ev, () => li.dataset.id && highlight(li.dataset.id, on))
})

/* ---------- typing, only when the visitor asked for sound ---------- */
let soundOn = false, typing = null
function type(el, text, speed = 34) {
  if (typing) typing.finish()
  if (!soundOn) { el.textContent = text; return }
  if (reduced.matches) { el.textContent = text; click('end'); return }
  el.innerHTML = '<span class="typed"></span><span class="untyped" aria-hidden="true"></span>'
  const a = el.firstChild, b = el.lastChild
  b.textContent = text
  let i = 0, timer
  const finish = () => { clearTimeout(timer); el.textContent = text; typing = null }
  const step = () => {
    i++
    a.textContent = text.slice(0, i); b.textContent = text.slice(i)
    click(text[i - 1] === ' ' ? 'space' : i === text.length ? 'end' : 'key')
    if (i < text.length) timer = setTimeout(step, speed * (0.6 + Math.random() * 0.9))
    else finish()
  }
  typing = { finish }
  step()
}

/* ---------- since you arrived ---------- */
const tally = { 'fun-libs': 0, 'mcp-emails': 0, toolrails: 0, 'albretsen.no': 0 }
function paintTally() {
  for (const k in tally) { const el = $(`[data-tally="${k}"]`); if (el) el.textContent = tally[k] }
}

/* ---------- start ---------- */
const feed = createFeed()
feed.recent(12).slice().reverse().forEach(place)
shown.push(...feed.recent(slots.length))
paintSlots()
map.classList.add('live')
$('#feed-state').textContent = 'Live.'

feed.subscribe(e => {
  place(e)
  shown.unshift(e); shown.length = Math.min(shown.length, slots.length)
  paintSlots()
  type(slots[0].querySelector('.d'), slots[0].querySelector('.d').textContent)
  tally[e.product] = (tally[e.product] || 0) + 1
  paintTally()
})

/* ---------- sound switch ---------- */
const snd = $('#sound')
snd.addEventListener('click', () => {
  soundOn = !soundOn
  if (soundOn && !startSound()) soundOn = false
  if (!soundOn) stopSound()
  snd.setAttribute('aria-pressed', String(soundOn))
  $('#sound-word').textContent = soundOn ? 'on, keys' : 'off'
  if (soundOn) { const s = $('#line'); type(s, s.textContent.trim(), 28) }
})
