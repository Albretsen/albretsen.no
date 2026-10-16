import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { productsHTML, counts } from './products.js'
import { createSound } from './sound.js'

// ── Products: the static markup is already in the page; re-render from the
// canonical content so the two can never drift apart.
const rows = document.getElementById('rows')
const html = productsHTML(content.products)
if (rows.innerHTML.trim() !== html.trim()) rows.innerHTML = html
const c = counts(content.products)
document.getElementById('counts').innerHTML =
  ['live', 'building', 'paused', 'retired'].map(k => `<span><b>${c[k]}</b> ${k}</span>`).join('')

// ── The score ───────────────────────────────────────────────────────────
const LANES = [
  ['mcp-emails', 'thread.read'], ['mcp-emails', 'draft.created'], ['mcp-emails', 'send.scheduled'],
  ['mcp-emails', 'inbox.searched'], ['mcp-emails', 'inbox.triaged'], ['mcp-emails', 'inbox.connected'],
  ['fun-libs', 'story.completed'], ['fun-libs', 'story.shared'], ['fun-libs', 'install'],
  ['toolrails', 'tool.searched'], ['toolrails', 'tool.executed'],
  ['albretsen.no', 'page.served'], ['albretsen.no', 'deploy'],
  ['you', 'you'],
]
const CLS = { 'mcp-emails': 'p-mcp', 'fun-libs': 'p-fun', toolrails: 'p-tool', 'albretsen.no': 'p-site', you: 'p-you' }
const laneOf = e => LANES.findIndex(([p, k]) => p === e.product && k === e.kind)
const WINDOW = 360 // seconds of score on screen

const lanesEl = document.getElementById('lanes')
const statusEl = document.getElementById('status')
const silenceEl = document.getElementById('silence')
const logEl = document.getElementById('log')
const defaultStatus = statusEl.textContent

const feed = createFeed()
const sound = createSound()
let events = feed.recent(50)   // newest first
let youCount = 0

// width of one box-drawing cell in the lanes font
const probe = document.createElement('span')
probe.textContent = '─'.repeat(40)
probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre'
lanesEl.appendChild(probe)
let cw = probe.getBoundingClientRect().width / 40
probe.remove()

let cols = 0, span = 1, tick = null

function noteLen(e) {
  if (e.kind === 'deploy') return 4
  if (e.ms) return 1 + Math.round(e.ms / 380)
  return 2
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

function render() {
  const now = Date.now()
  const grid = LANES.map(() => new Int32Array(cols).fill(-1))
  events.forEach((e, i) => {
    const age = (now - e.time.getTime()) / 1000
    if (age < 0 || age > WINDOW) return
    const lane = laneOf(e)
    if (lane < 0) return
    const start = cols - 1 - Math.floor(age / span)
    const len = noteLen(e)
    for (let k = 0; k < len; k++) {
      const col = start + k
      if (col >= 0 && col < cols && grid[lane][col] === -1) grid[lane][col] = i
    }
  })

  // which columns carry a minute bar line
  const bars = new Set()
  for (let m = 1; m * 60 < WINDOW; m++) bars.add(cols - 1 - Math.floor((m * 60) / span))

  // ruler
  const ruler = new Array(cols).fill(' ')
  for (let m = 1; m * 60 < WINDOW; m++) {
    const col = cols - 1 - Math.floor((m * 60) / span)
    const label = `−${m}m`
    if (col >= 0 && col + label.length < cols - 4) for (let j = 0; j < label.length; j++) ruler[col + j] = label[j]
  }
  const nowL = 'now'
  for (let j = 0; j < nowL.length; j++) ruler[cols - nowL.length + j] = nowL[j]
  let out = `<span class="ruler">${esc(ruler.join(''))}</span>`

  grid.forEach((row, lane) => {
    let line = '', c = 0
    while (c < cols) {
      const v = row[c]
      let end = c + 1
      if (v === -1) {
        let s = ''
        for (; c < cols && row[c] === -1; c++) s += bars.has(c) ? '┼' : c === cols - 1 ? '┤' : '─'
        line += `<span class="s">${s}</span>`
        continue
      }
      while (end < cols && row[end] === v) end++
      const e = events[v]
      line += `<span class="n ${CLS[e.product]}" data-i="${v}">${'━'.repeat(end - c)}</span>`
      c = end
    }
    out += '\n' + line
  })
  lanesEl.innerHTML = out
}

function measure() {
  const w = lanesEl.clientWidth
  const next = Math.max(12, Math.floor(w / cw))
  if (next === cols) return
  cols = next
  span = WINDOW / cols
  clearInterval(tick)
  tick = setInterval(render, span * 1000) // a terminal redraw, one column at a time
  render()
}

function renderLog() {
  const items = events.slice(0, 5)
  logEl.innerHTML = items.map(e =>
    `<li><span class="t">${formatTime(e.time)}</span><span class="p ${CLS[e.product]}">${esc(e.label)}</span><span class="d">${esc(describe(e))}</span></li>`
  ).join('')
}

function add(e) {
  events.unshift(e)
  const cutoff = Date.now() - WINDOW * 1000
  while (events.length > 60 && events[events.length - 1].time.getTime() < cutoff) events.pop()
  render(); renderLog()
  sound.note(laneOf(e), LANES.length)
}

feed.subscribe(add)

// silence: how long since the last note, counted honestly
function pad(n) { return String(n).padStart(2, '0') }
function silence() {
  const s = Math.max(0, Math.floor((Date.now() - events[0].time.getTime()) / 1000))
  silenceEl.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}
setInterval(silence, 1000)

// status line: hover a note to read it
lanesEl.addEventListener('mouseover', ev => {
  const n = ev.target.closest('.n')
  if (!n) return
  const e = events[+n.dataset.i]
  if (!e) return
  statusEl.className = 'status ' + CLS[e.product]
  statusEl.innerHTML = `${formatTime(e.time)}  <b>${esc(e.label)}</b>  ${esc(describe(e))}`
})
lanesEl.addEventListener('mouseleave', () => { statusEl.className = 'status'; statusEl.textContent = defaultStatus })

// ── The one surprise: the visitor has a lane of their own. ──────────────
function you(text) {
  add({ id: `you-${youCount++}`, time: new Date(), product: 'you', label: 'you', kind: 'you', text })
  statusEl.className = 'status p-you'
  statusEl.innerHTML = `${formatTime(new Date())}  <b>you</b>  ${esc(text)} · you are in the score now`
}
document.getElementById('you').addEventListener('click', () => you('played a note'))

const mcp = document.getElementById('mcp')
mcp.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(content.mcpCommand) } catch { /* selection still works */ }
  you('took the address')
})

const soundBtn = document.getElementById('sound')
soundBtn.addEventListener('click', () => {
  const on = sound.toggle()
  soundBtn.setAttribute('aria-pressed', String(on))
  soundBtn.querySelector('.box').textContent = on ? '[■]' : '[ ]'
  if (on) you('opened the sound')
})

new ResizeObserver(measure).observe(lanesEl)
document.fonts && document.fonts.ready.then(() => {
  lanesEl.appendChild(probe)
  cw = probe.getBoundingClientRect().width / 40
  probe.remove()
  cols = 0; measure()
})
measure(); renderLog(); silence()
