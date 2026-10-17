// fullt hus: the feed drives everything. colour, weight, width, the tape.
import { content } from '../_shared/content.js'
import { createFeed, formatTime } from '../_shared/feed.js'
import { renderProducts, KEY } from './products.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const root = document.documentElement
const css = name => getComputedStyle(root).getPropertyValue(name).trim()

const ORDER = ['mcp-emails', 'fun-libs', 'toolrails', 'albretsen.no']
const BUCKET = 20_000 // one letter of the name = 20 s
const WINDOW = 300_000 // strip plot: 5 min
const MIX_N = 50

// products are rendered from content.js (the static copy in index.html is the same markup)
$('#products').innerHTML = renderProducts(content)

const feed = createFeed()
const log = feed.recent(MIX_N).slice().reverse() // oldest first
let seen = 0
let lastAt = log.length ? log[log.length - 1].time.getTime() : Date.now()

/* ---------- the name: constant-advance weight/width trade ---------- */
// Anybody gets wider as it gets heavier. Measured from the font: holding
// "albretsen" at its 900/100 advance needs these widths per weight.
const WD = [[100, 129.8], [300, 123.4], [500, 115.4], [700, 108.7], [900, 100]]
function widthFor(w) {
  for (let i = 1; i < WD.length; i++) {
    const [w0, d0] = WD[i - 1], [w1, d1] = WD[i]
    if (w <= w1) return +(d0 + (d1 - d0) * ((w - w0) / (w1 - w0))).toFixed(1)
  }
  return 100
}
const cells = $$('#name .cell')
const NB = cells.length // 15 letters = 5 minutes

function paintName(now) {
  const buckets = cells.map(() => ({ n: 0, by: {} }))
  for (const e of log) {
    const age = now - e.time.getTime()
    if (age < 0 || age >= NB * BUCKET) continue
    const b = buckets[NB - 1 - Math.floor(age / BUCKET)]
    b.n++; b.by[e.product] = (b.by[e.product] || 0) + 1
  }
  cells.forEach((c, i) => {
    const b = buckets[i]
    const t = Math.sqrt(Math.min(b.n, 6) / 6)
    const w = Math.round(140 + 760 * t)
    const top = Object.entries(b.by).sort((a, z) => z[1] - a[1] || ORDER.indexOf(a[0]) - ORDER.indexOf(z[0]))[0]
    const p = top ? top[0] : ''
    if (c.dataset.w === String(w) && c.dataset.p === p) return
    c.dataset.w = w; c.dataset.p = p
    c.style.setProperty('--w', w)
    c.style.setProperty('--d', widthFor(w))
    c.style.setProperty('--n', t.toFixed(3))
  })
}

function wave(e) {
  if (reduce.matches) return
  const hue = css(`--h-${KEY[e.product]}`)
  cells.slice().reverse().forEach((c, k) => {
    const g = c.firstElementChild
    const w = +c.dataset.w || 400, d = widthFor(w)
    const rest = `"wght" ${w}, "wdth" ${d}`
    g.animate([
      { transform: 'translateY(0)', fontVariationSettings: rest },
      { transform: 'translateY(-.07em)', fontVariationSettings: '"wght" 900, "wdth" 100', color: hue, offset: 0.3 },
      { transform: 'translateY(0)', fontVariationSettings: rest },
    ], { duration: 820, delay: k * 34, easing: 'cubic-bezier(.2,.7,.2,1)' })
  })
}

/* ---------- mix + mark ---------- */
const mixRects = Object.fromEntries($$('.mix-bar rect').map(r => [r.dataset.p, r]))
const mixCount = Object.fromEntries($$('[data-count]').map(b => [b.dataset.count, b]))
const stem = $$('#mark-stem rect')
function paintMix() {
  const last = log.slice(-MIX_N)
  const n = Object.fromEntries(ORDER.map(p => [p, 0]))
  for (const e of last) n[e.product]++
  const total = last.length || 1
  let x = 0, y = 9
  ORDER.forEach((p, i) => {
    const share = n[p] / total
    mixRects[p].setAttribute('x', (x * 100).toFixed(2))
    mixRects[p].setAttribute('width', (share * 100).toFixed(2))
    x += share
    mixCount[p].textContent = n[p]
    const h = share * 18 // the stem of the a is the same stacked bar
    stem[i].setAttribute('y', y.toFixed(2)); stem[i].setAttribute('height', h.toFixed(2)); y += h
  })
  $('#mix-n').textContent = last.length
}

/* ---------- strip plot ---------- */
const NS = 'http://www.w3.org/2000/svg'
const stripG = $('#strip-g')
const t0 = Date.now()
function addTick(e) {
  const l = document.createElementNS(NS, 'line')
  const x = ((e.time.getTime() - t0) / 1000).toFixed(2)
  const row = ORDER.indexOf(e.product)
  l.setAttribute('x1', x); l.setAttribute('x2', x)
  l.setAttribute('y1', row + 0.18); l.setAttribute('y2', row + 0.82)
  l.setAttribute('class', `tick t-${KEY[e.product]}`)
  l.dataset.t = e.time.getTime()
  stripG.append(l)
}
function moveStrip(now) {
  stripG.setAttribute('transform', `translate(${(300 - (now - t0) / 1000).toFixed(2)} 0)`)
}
function pruneStrip(now) {
  for (const l of [...stripG.children]) if (now - +l.dataset.t > WINDOW + 2000) l.remove()
}

/* ---------- stats ---------- */
const sRate = $('#s-rate'), sSeen = $('#s-seen'), sAgo = $('#s-ago')
function paintStats(now) {
  const recent = log.filter(e => now - e.time.getTime() <= WINDOW)
  const span = Math.min(WINDOW, now - (log[0]?.time.getTime() ?? now)) / 60000
  sRate.textContent = span > 0.2 ? (recent.length / span).toFixed(1) : '–'
  const s = Math.max(0, Math.round((now - lastAt) / 1000))
  sAgo.textContent = s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`
}
function pulse(el) {
  if (reduce.matches) return
  el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit')
}

/* ---------- ticker tape ---------- */
const track = $('#tape')
const GAP = 0
const SPEED = 64 // px per second, constant. events arrive when they happen.
let items = [] // { el, x, w }
let paused = false
let quietShown = false
const tail = e => e.ms ? `${e.ms} ms` : e.country ? e.country : e.sha ? `${e.sha} · ${e.kb} kb` : e.city ? `${e.city} · ${e.kb} kb` : ''

function tapeEl(e) {
  const li = document.createElement('li')
  li.className = 'ev'
  li.dataset.p = e.product
  // wider type = slower call. 90 ms is condensed, 1 s is wide.
  if (e.ms) li.style.setProperty('--wd', (64 + Math.min(e.ms, 1000) / 1000 * 76).toFixed(0))
  const x = tail(e)
  li.innerHTML = `<span class="ev-p"></span><span class="ev-t"></span>${x ? '<span class="ev-x"></span>' : ''}<time></time>`
  li.querySelector('.ev-p').textContent = e.label.toLowerCase()
  li.querySelector('.ev-t').textContent = e.text
  if (x) li.querySelector('.ev-x').textContent = x.toLowerCase()
  const t = li.querySelector('time')
  t.textContent = formatTime(e.time); t.dateTime = e.time.toISOString()
  return li
}
function quietEl() {
  const li = document.createElement('li')
  li.className = 'ev ev-quiet'
  li.textContent = 'stille · nothing for 20 s'
  return li
}

const isStatic = () => reduce.matches
function tapePush(li) {
  if (isStatic()) {
    track.prepend(li)
    while (track.children.length > 10) track.lastElementChild.remove()
    return
  }
  track.append(li)
  const w = li.offsetWidth
  const W = track.clientWidth
  const prev = items[items.length - 1]
  const x = Math.max(W, prev ? prev.x + prev.w + GAP : W)
  items.push({ el: li, x, w })
  li.style.transform = `translate3d(${x}px,0,0)`
}

function tapeInit(history) {
  track.textContent = ''
  if (isStatic()) {
    track.classList.add('static')
    history.slice(0, 10).forEach(e => track.append(tapeEl(e)))
    return
  }
  // newest sits at the right edge, older ones to its left
  const W = track.clientWidth
  let x = W
  const els = []
  for (const e of history) {
    const li = tapeEl(e); track.append(li)
    const w = li.offsetWidth
    x -= w + GAP
    if (x + w < 0) { li.remove(); break }
    els.unshift({ el: li, x, w })
  }
  items = els
  for (const it of items) it.el.style.transform = `translate3d(${it.x}px,0,0)`
}

function remeasure() {
  if (isStatic()) return
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    it.w = it.el.offsetWidth
    if (i > 0) { const p = items[i - 1]; it.x = Math.max(it.x, p.x + p.w + GAP) }
  }
}

let lastFrame = performance.now()
function frame(t) {
  const dt = Math.min(0.1, (t - lastFrame) / 1000)
  lastFrame = t
  const now = Date.now()
  if (!isStatic() && !paused) {
    const W = track.clientWidth
    // the tape moves at one speed. items waiting off-screen are pulled in at the same speed.
    for (const it of items) it.x -= SPEED * dt
    for (let i = 1; i < items.length; i++) {
      const p = items[i - 1], it = items[i]
      if (it.x < p.x + p.w + GAP) it.x = p.x + p.w + GAP
    }
    while (items.length && items[0].x + items[0].w < 0) items.shift().el.remove()
    for (const it of items) if (it.x < W + 4) it.el.style.transform = `translate3d(${it.x.toFixed(1)}px,0,0)`
  }
  if (!reduce.matches) moveStrip(now)
  requestAnimationFrame(frame)
}

$('#tape-pause').addEventListener('click', ev => {
  paused = !paused
  ev.currentTarget.setAttribute('aria-pressed', String(paused))
  ev.currentTarget.textContent = paused ? 'play' : 'pause'
})

/* ---------- one event, everywhere at once ---------- */
const marks = $$('#sentence mark')
const orbit = $('#mark-orbit')
function onEvent(e) {
  log.push(e); if (log.length > 600) log.shift()
  seen++; lastAt = e.time.getTime(); quietShown = false
  const k = KEY[e.product]
  root.style.setProperty('--live', `var(--h-${k})`)
  root.style.setProperty('--live-hi', `var(--hi-${k})`)

  tapePush(tapeEl(e))
  addTick(e)
  paintName(Date.now())
  wave(e)
  paintMix()
  sSeen.textContent = seen
  pulse(sSeen)
  paintStats(Date.now())

  marks.filter(m => m.dataset.p === e.product).forEach(pulse)
  const card = $(`.card[data-p="${e.product}"]`)
  if (card) pulse(card)
  if (e.product === 'albretsen.no') pulse($('#domain'))
  if (!reduce.matches) {
    orbit.animate([{ transform: 'rotate(0deg) translateX(0)' }, { transform: 'rotate(0deg) translateX(-3.6px)', offset: .12 }, { transform: 'rotate(-360deg) translateX(-3.6px)', offset: .88 }, { transform: 'rotate(-360deg) translateX(0)' }],
      { duration: 1400, easing: 'cubic-bezier(.4,0,.2,1)' })
  }
}

/* ---------- boot ---------- */
const history = feed.recent(12)
tapeInit(history)
log.forEach(addTick)
const startNow = Date.now()
moveStrip(startNow)
paintName(startNow)
paintMix()
paintStats(startNow)
if (log.length) {
  const k = KEY[log[log.length - 1].product]
  root.style.setProperty('--live', `var(--h-${k})`)
}
feed.subscribe(onEvent)
requestAnimationFrame(frame)

setInterval(() => {
  const now = Date.now()
  paintName(now)
  paintStats(now)
  pruneStrip(now)
  if (reduce.matches) moveStrip(now)
  if (!quietShown && now - lastAt > 20_000) { quietShown = true; tapePush(quietEl()) }
}, 1000)

document.fonts?.ready.then(remeasure)
addEventListener('resize', remeasure)
