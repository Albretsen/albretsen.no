// Threshold — the page is a heat grid of product x minute.
// Silence is drawn as faithfully as activity: nothing here is looped or sped up.
import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { productsHTML, FEED_PRODUCTS } from './products.js'

const ROWS = ['mcp-emails', 'fun-libs', 'toolrails', 'albretsen.no']
const NAMES = { 'mcp-emails': 'MCP Emails', 'fun-libs': 'Fun Libs', toolrails: 'Toolrails', 'albretsen.no': 'albretsen.no' }
const MIN = 60000
const LEGEND = 'Each square is a minute. Each light, someone.'

const root = document.documentElement
root.classList.add('js')
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const finePointer = matchMedia('(hover: hover) and (pointer: fine)')
const hero = document.querySelector('.hero')
const canvas = hero.querySelector('.heat')
const ctx = canvas.getContext('2d')
const ghosts = hero.querySelector('.ghosts')
const readout = document.getElementById('readout')
const probe = document.getElementById('probe')
const logEl = document.getElementById('log')

// ---------- products (re-render from the source of truth) ----------
document.getElementById('plist').innerHTML = productsHTML(content)
document.getElementById('made-count').textContent = String(content.products.length)
const strips = new Map([...document.querySelectorAll('[data-strip]')].map(el => [el.dataset.strip, [...el.children]]))

// ---------- data: minute bins ----------
const bins = new Map() // minute -> { c: [n,n,n,n], last: [event|null x4] }
const minuteOf = d => Math.floor(d.getTime() / MIN)
function add(e) {
  const r = ROWS.indexOf(e.product)
  if (r < 0) return -1
  const m = minuteOf(e.time)
  let b = bins.get(m)
  if (!b) { b = { c: [0, 0, 0, 0], last: [null, null, null, null] }; bins.set(m, b) }
  b.c[r]++
  if (!b.last[r] || b.last[r].time <= e.time) b.last[r] = e
  return r
}
const count = (m, r) => bins.get(m)?.c[r] || 0

const feed = createFeed()
const history = feed.recent(50)
history.slice().reverse().forEach(add)

// ---------- geometry ----------
let W = 0, H = 0, C = 12, cw = 1, rh = 1, dpr = 1
let inkRects = []
let nowMin = Math.floor(Date.now() / MIN)
let hover = null // { i, r }
const flashes = new Map() // `${m}:${r}` -> 0..1

function readCols() { return parseInt(getComputedStyle(root).getPropertyValue('--cols'), 10) || 12 }
let colors = {}
function readColors() {
  const cs = getComputedStyle(root)
  for (const k of ['bg', 'cell', 'line', 'ink', 'mute', 'accent', 'on-accent']) colors[k] = cs.getPropertyValue('--' + k).trim()
  colors.font = `400 10px ${cs.getPropertyValue('--f-machine').trim()}`
}

function measure() {
  const r = hero.getBoundingClientRect()
  W = r.width; H = r.height
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
  C = readCols(); cw = W / C; rh = H / 4
  inkRects = [...hero.querySelectorAll('[data-ink]')].map(el => {
    const b = el.getBoundingClientRect()
    return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height }
  }).filter(b => b.w && b.h)
  measureLetters()
}
const silenced = (x, y, w, h) => inkRects.some(b => x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y)

// ---------- drawing ----------
function draw() {
  nowMin = Math.floor(Date.now() / MIN)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = colors.bg
  ctx.fillRect(0, 0, W, H)
  let max = 4
  for (let i = 0; i < C; i++) for (let r = 0; r < 4; r++) max = Math.max(max, count(nowMin - (C - 1 - i), r))
  ctx.font = colors.font
  ctx.textBaseline = 'bottom'
  for (let i = 0; i < C; i++) {
    const m = nowMin - (C - 1 - i)
    const x = i * cw
    for (let r = 0; r < 4; r++) {
      const y = r * rh
      const n = count(m, r)
      ctx.fillStyle = colors.cell
      ctx.fillRect(x + 0.5, y + 0.5, cw - 1, rh - 1)
      const quiet = silenced(x, y, cw, rh)
      if (n) {
        const v = Math.sqrt(n / max)
        ctx.globalAlpha = (0.2 + 0.8 * v) * (quiet ? 0.34 : 1)
        ctx.fillStyle = colors.accent
        ctx.fillRect(x + 0.5, y + 0.5, cw - 1, rh - 1)
        ctx.globalAlpha = 1
        if (!quiet && cw >= 22) {
          ctx.fillStyle = v > 0.45 ? colors['on-accent'] : colors.ink
          ctx.fillText(String(n), x + 5, y + rh - 6)
        }
      }
      const f = flashes.get(`${m}:${r}`)
      if (f) {
        ctx.globalAlpha = f
        ctx.strokeStyle = colors.ink
        ctx.lineWidth = 2
        ctx.strokeRect(x + 1.5, y + 1.5, cw - 3, rh - 3)
        ctx.globalAlpha = 1
      }
    }
  }
  // the threshold: the edge where the next minute arrives
  ctx.fillStyle = colors.accent
  ctx.fillRect((C - 1) * cw - 0.5, 0, 1.5, H)
  if (hover) {
    const { i, r } = hover
    ctx.globalAlpha = 0.5
    ctx.strokeStyle = colors.accent
    ctx.lineWidth = 1
    ctx.strokeRect(i * cw + 0.5, 0.5, cw - 1, H - 1)
    ctx.strokeRect(0.5, r * rh + 0.5, W - 1, rh - 1)
    ctx.globalAlpha = 1
    ctx.lineWidth = 2
    ctx.strokeRect(i * cw + 1, r * rh + 1, cw - 2, rh - 2)
  }
}

let raf = 0, lastT = 0
function animate(t) {
  const dt = lastT ? t - lastT : 16
  lastT = t
  for (const [k, f] of flashes) {
    const nf = f - dt / 1400
    if (nf <= 0) flashes.delete(k); else flashes.set(k, nf)
  }
  draw()
  raf = flashes.size ? requestAnimationFrame(animate) : 0
  if (!raf) lastT = 0
}
const kick = () => { if (!raf) raf = requestAnimationFrame(animate) }

// ---------- the mark: four bars, the last fifteen minutes of each product ----------
const bars = [...document.querySelectorAll('.mark .m-bar')]
function markLengths() {
  const sums = ROWS.map((_, r) => { let s = 0; for (let k = 0; k < 15; k++) s += count(nowMin - k, r); return s })
  const top = Math.max(1, ...sums)
  return sums.map(s => s ? 3 + Math.sqrt(s / top) * 21 : 1.5)
}
let favTimer = 0
function updateMark() {
  const L = markLengths()
  bars.forEach((b, i) => { b.setAttribute('x', (27 - L[i]).toFixed(2)); b.setAttribute('width', L[i].toFixed(2)) })
  clearTimeout(favTimer)
  favTimer = setTimeout(() => {
    const rects = L.map((l, i) => `<rect x="${(27 - l).toFixed(2)}" y="${5 + i * 6.5}" width="${l.toFixed(2)}" height="4.5" fill="#0ff6f1"/>`).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#050c0b"/>${rects}<rect x="28" y="3" width="1.5" height="26" fill="#ebf6f5"/></svg>`
    const fav = document.getElementById('fav')
    if (fav) fav.href = 'data:image/svg+xml,' + encodeURIComponent(svg)
  }, 400)
}

function updateStrips() {
  for (const id of FEED_PRODUCTS) {
    const cells = strips.get(id); if (!cells) continue
    const r = ROWS.indexOf(id)
    let max = 1
    for (let k = 0; k < 12; k++) max = Math.max(max, count(nowMin - k, r))
    cells.forEach((el, j) => {
      const n = count(nowMin - (11 - j), r)
      el.style.setProperty('--a', n ? (0.25 + 0.75 * Math.sqrt(n / max)).toFixed(2) : '0')
    })
  }
}

// ---------- log ----------
function logLine(e) {
  const li = document.createElement('li')
  const t = document.createElement('time')
  t.dateTime = e.time.toISOString(); t.textContent = formatTime(e.time)
  const b = document.createElement('b'); b.textContent = e.label
  li.append(t, ' ', b, ' ', describe(e))
  return li
}
logEl.replaceChildren(...history.slice(0, 6).map(logLine))

// ---------- ghosts: a new event writes itself, vertically, into the now column ----------
const ghostByRow = new Map()
function ghost(e, r) {
  if (document.hidden) return
  ghostByRow.get(r)?.remove()
  const g = document.createElement('span')
  g.className = 'ghost'
  g.textContent = describe(e)
  Object.assign(g.style, { left: `${(C - 1) * cw}px`, top: `${r * rh}px`, width: `${cw}px`, height: `${rh}px` })
  ghosts.append(g)
  ghostByRow.set(r, g)
  setTimeout(() => { g.remove(); if (ghostByRow.get(r) === g) ghostByRow.delete(r) }, 2900)
}

// ---------- sound (off until asked; synthesised) ----------
let ac = null, master = null, soundOn = false
const PITCH = [659.25, 523.25, 783.99, 392.0] // E5, C5, G5, G4: a quiet pentatonic per product
function audio() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ac = new AC()
    master = ac.createGain(); master.gain.value = 0.6
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200
    master.connect(lp).connect(ac.destination)
  }
  if (ac.state === 'suspended') ac.resume()
  return ac
}
function tone(freq, { dur = 0.22, type = 'sine', vol = 0.05, when = 0 } = {}) {
  if (!soundOn || !ac || document.hidden) return
  const t = ac.currentTime + when
  const o = ac.createOscillator(), g = ac.createGain()
  o.type = type; o.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.03)
}
let lastTick = 0
function tick() {
  const now = performance.now(); if (now - lastTick < 45) return; lastTick = now
  tone(2400, { dur: 0.025, type: 'triangle', vol: 0.012 })
}
const soundBtn = document.getElementById('sound')
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn
  if (soundOn) { audio(); tone(523.25, { vol: 0.04 }); tone(783.99, { vol: 0.03, when: 0.09 }) }
  soundBtn.setAttribute('aria-pressed', String(soundOn))
  soundBtn.setAttribute('aria-label', soundOn ? 'Sound on. Turn off interface sound.' : 'Sound off. Turn on interface sound.')
  soundBtn.querySelector('span').textContent = soundOn ? 'sound' : 'silence'
})

// ---------- live ----------
feed.subscribe(e => {
  const r = add(e)
  if (r < 0) return
  logEl.prepend(logLine(e))
  while (logEl.children.length > 6) logEl.lastElementChild.remove()
  tone(PITCH[r], { vol: 0.035, dur: 0.32 })
  tone(PITCH[r] * 2, { vol: 0.008, dur: 0.18 })
  updateMark(); updateStrips()
  if (reduce.matches) { draw() } else { flashes.set(`${minuteOf(e.time)}:${r}`, 1); ghost(e, r); kick() }
  if (hover) describeCell(hover)
})

// the minute turns: every column steps one place into the past
function onMinute() {
  for (const m of bins.keys()) if (m < nowMin - 64) bins.delete(m)
  ghosts.replaceChildren(); ghostByRow.clear()
  draw(); updateMark(); updateStrips()
  if (hover) describeCell(hover)
  setTimeout(onMinute, MIN - (Date.now() % MIN) + 20)
}
setTimeout(onMinute, MIN - (Date.now() % MIN) + 20)

// ---------- reading a cell (pointer and keyboard) ----------
const hhmm = m => new Date(m * MIN).toTimeString().slice(0, 5)
function describeCell({ i, r }) {
  const m = nowMin - (C - 1 - i)
  const n = count(m, r)
  const last = bins.get(m)?.last[r]
  const when = i === C - 1 ? `${hhmm(m)}, now` : hhmm(m)
  readout.textContent = n
    ? `${NAMES[ROWS[r]]} · ${when} · ${n} ${n === 1 ? 'event' : 'events'} · last: ${describe(last)}`
    : `${NAMES[ROWS[r]]} · ${when} · silence`
}
function setHover(h) {
  const same = h && hover && h.i === hover.i && h.r === hover.r
  if (same) return
  hover = h
  if (h) { describeCell(h); tick() } else readout.textContent = LEGEND
  draw()
}
hero.addEventListener('pointermove', ev => {
  if (ev.pointerType !== 'mouse') return
  const b = hero.getBoundingClientRect()
  const x = ev.clientX - b.left, y = ev.clientY - b.top
  setHover({ i: Math.max(0, Math.min(C - 1, Math.floor(x / cw))), r: Math.max(0, Math.min(3, Math.floor(y / rh))) })
})
hero.addEventListener('pointerleave', () => { if (document.activeElement !== probe) setHover(null) })
probe.addEventListener('focus', () => setHover(hover || { i: C - 1, r: 0 }))
probe.addEventListener('blur', () => setHover(null))
probe.addEventListener('keydown', ev => {
  const h = { ...(hover || { i: C - 1, r: 0 }) }
  const k = ev.key
  if (k === 'ArrowLeft') h.i--; else if (k === 'ArrowRight') h.i++
  else if (k === 'ArrowUp') h.r--; else if (k === 'ArrowDown') h.r++
  else if (k === 'Home') h.i = 0; else if (k === 'End') h.i = C - 1
  else return
  ev.preventDefault()
  h.i = Math.max(0, Math.min(C - 1, h.i)); h.r = Math.max(0, Math.min(3, h.r))
  setHover(h)
})

// ---------- the name leans toward the cursor ----------
// ASGEIR gains weight near the pointer (mixed weights in one word, Weingart-style);
// Albretsen's letters lift off the baseline. Letter boxes are fixed, so nothing reflows.
const n1 = [...document.querySelectorAll('.n1 .l')]
const n2 = [...document.querySelectorAll('.n2 .l')]
let centres = []
function measureLetters() {
  n1.forEach(el => { el.style.width = ''; el.style.fontWeight = '' })
  const prev = n1.map(el => el.style.fontWeight)
  n1.forEach(el => { el.style.fontWeight = '800' })
  const widths = n1.map(el => el.getBoundingClientRect().width)
  n1.forEach((el, i) => { el.style.fontWeight = prev[i]; el.style.width = widths[i] + 'px' })
  centres = [...n1, ...n2].map(el => { const b = el.getBoundingClientRect(); return { el, x: b.left + b.width / 2 + scrollX, y: b.top + b.height / 2 + scrollY, n1: n1.includes(el) } })
}
let px = null, py = null, lean = 0
function applyLean() {
  lean = 0
  const s = Math.max(90, W * 0.09)
  for (const c of centres) {
    if (px === null) { c.el.style.fontWeight = ''; c.el.style.transform = ''; continue }
    const d2 = (c.x - px) ** 2 + (c.y - py) ** 2
    const g = Math.exp(-d2 / (2 * s * s))
    if (c.n1) c.el.style.fontWeight = String(Math.round(400 + 400 * g))
    else c.el.style.transform = reduce.matches ? '' : `translateY(${(-0.14 * g).toFixed(3)}em)`
  }
}
window.addEventListener('pointermove', ev => {
  if (ev.pointerType !== 'mouse' || !finePointer.matches) return
  px = ev.clientX + scrollX; py = ev.clientY + scrollY
  if (!lean) lean = requestAnimationFrame(applyLean)
}, { passive: true })
document.documentElement.addEventListener('pointerleave', () => { px = py = null; if (!lean) lean = requestAnimationFrame(applyLean) })

// ---------- light / dark: the threshold crosses the page ----------
const themeBtn = document.getElementById('theme')
const sysLight = matchMedia('(prefers-color-scheme: light)')
const current = () => root.dataset.theme || (sysLight.matches ? 'light' : 'dark')
function labelTheme() {
  const t = current()
  themeBtn.querySelector('span').textContent = t === 'dark' ? 'lights on' : 'lights off'
  themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')
  document.querySelector('meta[name="theme-color"]').content = t === 'dark' ? '#050c0b' : '#f3f8f8'
}
function applyTheme(t) {
  root.dataset.theme = t
  try { localStorage.setItem('albretsen-08-theme', t) } catch (e) { /* storage unavailable */ }
  readColors(); draw(); labelTheme()
}
themeBtn.addEventListener('click', () => {
  const next = current() === 'dark' ? 'light' : 'dark'
  if (document.startViewTransition && !reduce.matches) {
    root.style.setProperty('--steps', String(C))
    // a sweep of ticks, one per few columns, falling in pitch as it travels into the past
    const steps = Math.min(16, C)
    for (let k = 0; k < steps; k++) tone(1760 * Math.pow(0.5, k / steps), { dur: 0.04, type: 'triangle', vol: 0.014, when: (k / steps) * 0.74 })
    document.startViewTransition(() => applyTheme(next))
  } else {
    tone(880, { dur: 0.12, vol: 0.02 }); applyTheme(next)
  }
})
sysLight.addEventListener('change', () => { if (!root.dataset.theme) { readColors(); draw(); labelTheme() } })

// ---------- boot ----------
readColors(); labelTheme(); measure(); draw(); updateMark(); updateStrips()
new ResizeObserver(() => { measure(); draw() }).observe(hero)
document.fonts?.ready.then(() => { measure(); draw() })
