// Colophon — design 28. The page is complete without this file; this adds the live layer.
import { content } from '../_shared/content.js'
import { createFeed, formatTime } from '../_shared/feed.js'

const $ = s => document.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const SVGNS = 'http://www.w3.org/2000/svg'
const RING = { 'mcp-emails': 17, 'fun-libs': 13, toolrails: 9, 'albretsen.no': 5 }

const feed = createFeed()
let seen = 0

/* ---------- prose and log formats ---------- */
function prose(e) {
  if (e.sha) return `deploy ${e.sha}, ${e.kb} KB.`
  if (e.city) return `${e.text}, ${e.city}, ${e.kb} KB.`
  if (e.ms) return `${e.text}, ${e.ms} ms.`
  if (e.country) return `${e.text}, ${e.country}.`
  return `${e.text}.`
}
function tail(e) {
  if (e.sha) return `${e.sha}  ${e.kb}KB`
  if (e.city) return `${e.city}  ${e.kb}KB`
  if (e.ms) return `${e.ms}ms  ${e.text}`
  if (e.country) return `${e.country}  ${e.text}`
  return e.text
}

/* ---------- sound: soft keys, synthesized, off until asked ---------- */
let audio = null, noise = null, soundOn = false
function initAudio() {
  audio = new (window.AudioContext || window.webkitAudioContext)()
  const len = Math.floor(audio.sampleRate * 0.03)
  noise = audio.createBuffer(1, len, audio.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4)
}
function click(soft) {
  if (!soundOn || !audio) return
  const t = audio.currentTime
  const src = audio.createBufferSource(); src.buffer = noise
  src.playbackRate.value = 0.85 + Math.random() * 0.3
  const bp = audio.createBiquadFilter(); bp.type = 'bandpass'
  bp.frequency.value = 1800 + Math.random() * 1600; bp.Q.value = 1.4
  const g = audio.createGain(); g.gain.value = soft ? 0.025 : 0.05
  src.connect(bp).connect(g).connect(audio.destination)
  src.start(t)
  const o = audio.createOscillator(), og = audio.createGain()
  o.frequency.value = 140 + Math.random() * 40
  og.gain.setValueAtTime(soft ? 0.01 : 0.02, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
  o.connect(og).connect(audio.destination); o.start(t); o.stop(t + 0.035)
}
const soundBtn = $('#sound')
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn
  if (soundOn && !audio) initAudio()
  if (audio && audio.state === 'suspended') audio.resume()
  soundBtn.setAttribute('aria-pressed', String(soundOn))
  soundBtn.querySelector('.toggle__state').textContent = soundOn ? 'on' : 'off'
  if (soundOn) click()
})

/* ---------- the running sentence: kinetic, typed ---------- */
const nowEl = $('#now'), nowP = nowEl.querySelector('.now__product'), nowT = nowEl.querySelector('.now__text')
let typing = 0
function setNow(e, animate) {
  const id = ++typing
  const label = e.label, text = prose(e)
  if (animate) flash(nowEl, 'is-new')
  if (!animate || reduce.matches) { nowP.textContent = label; nowT.textContent = ' ' + text; return }
  nowP.textContent = ''; nowT.textContent = ''
  const full = label + '\u0000 ' + text
  let i = 0
  const step = () => {
    if (id !== typing) return
    const ch = full[i++]
    if (ch === undefined) return
    if (ch === '\u0000') { /* switch from label to text */ }
    else if (i <= label.length) nowP.textContent += ch
    else nowT.textContent += ch
    if (ch && ch !== '\u0000') click(ch === ' ')
    const pause = ch === ',' ? 120 : ch === ' ' ? 45 : 22 + Math.random() * 30
    setTimeout(step, pause)
  }
  step()
}

/* ---------- the log: twelve fixed rows, data moves, boxes don't ---------- */
const rows = [...document.querySelectorAll('#log .row')]
let logData = []
function paintRow(row, e) {
  row.classList.remove('row--static')
  row.innerHTML = ''
  for (const [cls, val] of [['t', formatTime(e.time)], ['p', e.product], ['k', e.kind], ['x', tail(e)]]) {
    const s = document.createElement('span'); s.className = cls; s.textContent = val; row.append(s)
  }
}
function paintLog() { rows.forEach((r, i) => { if (logData[i]) paintRow(r, logData[i]) }) }
function typeRow(row, e) {
  paintRow(row, e)
  if (reduce.matches) return
  const x = row.querySelector('.x'), full = x.textContent
  x.textContent = ''
  let i = 0
  const id = setInterval(() => { x.textContent = full.slice(0, ++i); if (i >= full.length) clearInterval(id) }, 14)
}
function flash(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls) }

/* ---------- the orbit mark: one ring per product, one grain per event ---------- */
const orbit = $('#orbit')
let orbitData = []
function el(name, attrs) { const n = document.createElementNS(SVGNS, name); for (const k in attrs) n.setAttribute(k, attrs[k]); return n }
function grainPos(e) {
  const s = e.time.getSeconds() + e.time.getMilliseconds() / 1000
  const a = (s / 60) * Math.PI * 2, r = RING[e.product] || 5
  return [20 + Math.sin(a) * r, 20 - Math.cos(a) * r]
}
function grainSize(e) { return e.ms ? 0.7 + Math.min(e.ms, 1000) / 1000 * 0.9 : 1.05 }
let spin
function buildOrbit() {
  orbit.innerHTML = ''
  orbit.setAttribute('aria-label', 'Orbit mark: one ring per product, one grain per recent event')
  for (const r of Object.values(RING)) orbit.append(el('circle', { class: 'o-ring', cx: 20, cy: 20, r }))
  orbit.append(el('line', { class: 'o-tick', x1: 20, y1: 0.6, x2: 20, y2: 2.2 }))
  spin = el('g', { class: 'o-spin' })
  orbit.append(spin)
  drawGrains()
}
function drawGrains() {
  const now = Date.now()
  spin.innerHTML = ''
  orbitData.forEach((e, i) => {
    const [cx, cy] = grainPos(e)
    const age = (now - e.time.getTime()) / 1000
    const c = el('circle', { class: 'o-grain' + (i === 0 && e._live ? ' is-fresh' : ''), cx: cx.toFixed(2), cy: cy.toFixed(2), r: grainSize(e).toFixed(2) })
    c.style.opacity = Math.max(0.18, 1 - age / 300).toFixed(2)
    spin.append(c)
  })
  rotate()
}
function rotate() { // now sits at the top; the mark turns once a minute, because a minute does
  const d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000
  spin.style.transform = `rotate(${(-s * 6).toFixed(2)}deg)`
}
let spinning = false
function spinLoop() {
  rotate()
  if (!reduce.matches && !document.hidden) requestAnimationFrame(spinLoop)
  else spinning = false
}
function startSpin() { if (!spinning && !reduce.matches) { spinning = true; requestAnimationFrame(spinLoop) } }

/* favicon: the same mark, in sixteen pixels */
const fav = $('#favicon')
function paintFavicon() {
  const d = new Date(), rot = -(d.getSeconds() * 6)
  let g = ''
  orbitData.slice(0, 14).forEach((e, i) => {
    const [x, y] = grainPos(e)
    const fill = i === 0 && e._live ? '#61a900' : '#161616'
    g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(grainSize(e) + 0.5).toFixed(1)}" fill="${fill}"/>`
  })
  const rings = Object.values(RING).map(r => `<circle cx="20" cy="20" r="${r}"/>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="6" fill="#f4f4f4"/><g fill="none" stroke="#c9c9c9" stroke-width=".7">${rings}</g><g transform="rotate(${rot} 20 20)">${g}</g></svg>`
  fav.href = 'data:image/svg+xml,' + encodeURIComponent(svg)
}

/* ---------- the name, which flinches when something happens ---------- */
const nameEl = $('#name')
const letters = []
function splitName() {
  const txt = nameEl.textContent
  nameEl.setAttribute('aria-label', txt)
  nameEl.textContent = ''
  txt.split(' ').forEach((word, w) => {
    if (w) nameEl.append(' ')
    const wd = document.createElement('span'); wd.className = 'wd'; wd.setAttribute('aria-hidden', 'true')
    for (const ch of word) {
      const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch
      wd.append(s); letters.push(s)
    }
    nameEl.append(wd)
  })
}
function ripple(from) {
  if (reduce.matches) return
  const start = Math.floor(from * letters.length)
  letters.forEach((s, i) => {
    s.style.animationDelay = `${Math.abs(i - start) * 30}ms`
    flash(s, 'rip')
  })
}

/* ---------- products, from content ---------- */
const list = $('#works-list')
const sigCells = new Map()
const lastSeen = new Map()
function renderProducts() {
  list.innerHTML = ''
  for (const p of content.products) {
    const li = document.createElement('li')
    li.className = `grid work work--${p.status}`
    const name = p.url ? `<a href="${p.url}">${p.name}</a>` : `<span class="w-n">${p.name}</span>`
    const fig = p.figure ? `<span class="num">${p.figure.value}</span> <span class="sc">${p.figure.label.toLowerCase()}</span>` : ''
    li.innerHTML = `<span class="w-year num">${p.since}</span><span class="w-name">${name}<span class="w-line">${p.line}</span></span><span class="w-status sc">${p.status}</span><span class="w-fig">${fig}</span><span class="w-sig mono"></span>`
    sigCells.set(p.id, li.querySelector('.w-sig'))
    list.append(li)
  }
}
function ago(t) {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  return s < 60 ? `${s} s ago` : s < 3600 ? `${Math.floor(s / 60)} min ago` : `${Math.floor(s / 3600)} h ago`
}
function paintSignals() {
  for (const [id, t] of lastSeen) {
    const cell = sigCells.get(id)
    if (!cell) continue
    if (!cell.firstChild) cell.innerHTML = '<span class="dot"></span><span class="ago"></span>'
    cell.querySelector('.ago').textContent = ago(t)
    cell.title = `last event ${formatTime(new Date(t))}`
  }
}

/* ---------- boot ---------- */
splitName()
renderProducts()
logData = feed.recent(12)
paintLog()
orbitData = feed.recent(40)
for (const e of [...orbitData].reverse()) lastSeen.set(e.product, e.time.getTime())
buildOrbit()
paintFavicon()
paintSignals()
if (logData[0]) setNow(logData[0], false)
startSpin()
document.addEventListener('visibilitychange', () => { if (!document.hidden) { drawGrains(); startSpin() } })
reduce.addEventListener?.('change', startSpin)

const clock = $('#clock')
const tick = () => { clock.textContent = formatTime(new Date()); paintSignals(); if (reduce.matches) rotate() }
tick(); setInterval(tick, 1000)
setInterval(drawGrains, 10000)

const count = $('#count')
feed.subscribe(e => {
  e._live = true
  seen++
  count.textContent = `${seen} new`
  logData.unshift(e); logData.length = Math.min(logData.length, 12)
  paintLog(); typeRow(rows[0], e); flash(rows[0], 'fresh')
  orbitData.unshift(e); orbitData.length = Math.min(orbitData.length, 40)
  drawGrains(); paintFavicon()
  lastSeen.set(e.product, e.time.getTime())
  paintSignals()
  const cell = sigCells.get(e.product); if (cell) flash(cell, 'hot')
  setNow(e, true)
  ripple(((RING[e.product] || 5) - 5) / 12)
})

/* ---------- ¶ ---------- */
const dlg = $('#colophon')
function openColophon() {
  const res = performance.getEntriesByType('resource').filter(r => !/fonts\.(gstatic|googleapis)\.com/.test(r.name))
  const nav = performance.getEntriesByType('navigation')[0]
  const bytes = res.reduce((s, r) => s + (r.transferSize || 0), nav ? nav.transferSize || 0 : 0)
  $('#ct').textContent = bytes ? `${(bytes / 1024).toFixed(1)} KB, fonts aside` : 'served from cache'
  $('#cg').textContent = `${getComputedStyle(document.documentElement).getPropertyValue('--cols').trim()} columns at this width`
  $('#ce').textContent = String(seen)
  if (!dlg.open) dlg.showModal()
}
$('#pilcrow').addEventListener('click', openColophon)
let typed = ''
addEventListener('keydown', ev => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.key.length !== 1) return
  typed = (typed + ev.key.toLowerCase()).slice(-8)
  if (typed === 'colophon') { typed = ''; openColophon() }
})
console.log('%c¶', 'font: 24px Georgia, serif; color: #888', 'type the last word of a book.')
