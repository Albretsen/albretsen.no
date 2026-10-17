// Full Stop: hero teletype, piano-roll feed, live colour, opt-in key clicks.
import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { renderTimeline } from './timeline.js'

window.__fs = true
const root = document.documentElement
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const $ = (s, el = document) => el.querySelector(s)

// ---------- lanes: one per event kind, grouped by product ----------
const LANES = [
  ['mcp-emails', 'thread.read'], ['mcp-emails', 'draft.created'], ['mcp-emails', 'send.scheduled'],
  ['mcp-emails', 'inbox.searched'], ['mcp-emails', 'inbox.triaged'], ['mcp-emails', 'inbox.connected'],
  ['toolrails', 'tool.searched'], ['toolrails', 'tool.executed'],
  ['fun-libs', 'story.completed'], ['fun-libs', 'story.shared'], ['fun-libs', 'install'],
  ['albretsen.no', 'page.served'], ['albretsen.no', 'deploy'],
]
const laneOf = e => { const i = LANES.findIndex(([p, k]) => p === e.product && k === e.kind); return i < 0 ? LANES.length - 1 : i }
const VAR = { 'mcp-emails': '--c-mcp', 'fun-libs': '--c-fun', toolrails: '--c-tool', 'albretsen.no': '--c-site' }
let palette = {}
function readPalette() {
  const cs = getComputedStyle(root)
  palette = { ink: cs.getPropertyValue('--ink').trim(), rule: cs.getPropertyValue('--rule').trim(), bg: cs.getPropertyValue('--bg').trim() }
  for (const [p, v] of Object.entries(VAR)) palette[p] = cs.getPropertyValue(v).trim()
}
readPalette()
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readPalette(); draw() })

// ---------- sound: soft key clicks, synthesized, off until asked ----------
let audio = null, noise = null, soundOn = false, lastClick = 0
function initAudio() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return false
  audio = new AC()
  noise = audio.createBuffer(1, Math.round(audio.sampleRate * 0.05), audio.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3)
  return true
}
function click(ch) {
  if (!soundOn || !audio) return
  const t = audio.currentTime
  if (t - lastClick < 0.012) return
  lastClick = t
  const space = ch === ' '
  const src = audio.createBufferSource(); src.buffer = noise
  const f = audio.createBiquadFilter(); f.type = 'bandpass'
  f.frequency.value = space ? 650 : 2200 + Math.random() * 1400; f.Q.value = space ? 1.2 : 2.5
  const g = audio.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(space ? 0.12 : 0.07, t + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, t + (space ? 0.05 : 0.028))
  src.connect(f).connect(g).connect(audio.destination)
  src.start(t); src.stop(t + 0.06)
}
const snd = $('.snd')
snd.addEventListener('click', () => {
  if (!audio && !initAudio()) return
  soundOn = !soundOn
  if (soundOn) audio.resume()
  snd.setAttribute('aria-pressed', String(soundOn))
  snd.querySelector('b').textContent = soundOn ? 'on' : 'off'
  click('k')
})

// ---------- teletype ----------
// Splits an element's text into one span per character. The visible copy is
// aria-hidden; a plain copy stays for screen readers. Characters occupy their
// space from the start (visibility, not display), so nothing reflows.
function split(el) {
  const text = el.textContent.replace(/\s+/g, ' ').trim()
  const vis = document.createElement('span')
  vis.setAttribute('aria-hidden', 'true')
  vis.append(...el.childNodes)
  const chars = []
  const walk = n => {
    for (const c of [...n.childNodes]) {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment()
        for (const ch of c.textContent) {
          const s = document.createElement('span'); s.className = 'c'; s.textContent = ch
          frag.append(s); chars.push(s)
        }
        c.replaceWith(frag)
      } else if (c.nodeType === 1) walk(c)
    }
  }
  walk(vis)
  const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = text
  el.replaceChildren(sr, vis)
  return chars
}

function type(el, chars, delay) {
  return new Promise(resolve => {
    if (reduce.matches || !chars.length) { el.classList.remove('typing'); return resolve({ finish() {} }) }
    el.classList.add('typing')
    let i = 0, timer = 0, done = false
    const end = () => {
      if (done) return
      done = true; clearTimeout(timer)
      chars.forEach(c => { c.classList.add('on'); c.classList.remove('next') })
      el.classList.remove('typing'); resolve(ctl)
    }
    const step = () => {
      if (i > 0) chars[i - 1].classList.remove('next')
      if (i >= chars.length) return end()
      const c = chars[i++]
      c.classList.add('on'); click(c.textContent)
      if (i < chars.length) chars[i].classList.add('next')
      timer = setTimeout(step, c.textContent === ' ' ? delay * 1.8 : delay * (0.6 + Math.random() * 0.8))
    }
    const ctl = { finish: end }
    el._tt = ctl
    step()
  })
}

const name = $('.name'), say = $('.hero .say')
const nameChars = split(name), sayChars = split(say)
if (!reduce.matches) { name.classList.add('typing'); say.classList.add('typing') }
root.classList.remove('tt')
type(name, nameChars, 55).then(() => type(say, sayChars, 18))

// ---------- live feed ----------
const feed = createFeed()
let events = feed.recent(50)
const WINDOW = 240e3
const pulses = new Map()

function setLive(e) {
  root.dataset.live = e.product
  setFavicon(palette[e.product])
}
let favTimer = 0
const fav = document.querySelector('link[rel="icon"]')
function setFavicon(color) {
  clearTimeout(favTimer)
  favTimer = setTimeout(() => {
    fav.href = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="${color}"/></svg>`)
  }, 400)
}

// log: four fixed rows; text moves down, the boxes never do
const rows = [...document.querySelectorAll('.log li')]
function lineHTML(e) {
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  return `<i class="sw"></i><span class="t">${formatTime(e.time)}</span><span class="p">${esc(e.label)}</span><span class="d">${esc(describe(e))}</span>`
}
function fill(li, e) { li.dataset.p = e.product; li.innerHTML = lineHTML(e) }
events.slice(0, rows.length).forEach((e, i) => fill(rows[i], e))
if (events[0]) setLive(events[0])

function push(e) {
  events.unshift(e)
  if (events.length > 80) events.length = 80
  if (rows[0]._tt) rows[0]._tt.finish()
  for (let i = rows.length - 1; i > 0; i--) { rows[i].dataset.p = rows[i - 1].dataset.p || ''; rows[i].innerHTML = rows[i - 1].innerHTML }
  fill(rows[0], e)
  const chars = []
  for (const s of rows[0].querySelectorAll('.t, .p, .d')) {
    const t = s.textContent; s.textContent = ''
    for (const ch of t) { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; s.append(c); chars.push(c) }
  }
  type(rows[0], chars, 22)
  setLive(e)
  pulses.set(e.id, performance.now())
  const row = document.querySelector(`.row[data-p="${e.product}"]`)
  if (row) {
    row.classList.remove('hit'); void row.offsetWidth; row.classList.add('hit')
    const n = row.querySelector('.tally span'); if (n) n.textContent = String(+n.textContent + 1)
  }
  draw()
}
feed.subscribe(push)

// ---------- the score: a piano roll of the last four minutes ----------
const canvas = $('.staff canvas'), ctx = canvas.getContext('2d')
let W = 0, H = 0, dpr = 1
function size() {
  const r = canvas.getBoundingClientRect()
  dpr = Math.min(2, window.devicePixelRatio || 1)
  W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr))
  canvas.width = W; canvas.height = H
  draw()
}
function draw() {
  if (!W) return
  const now = Date.now(), t = performance.now()
  const lane = H / LANES.length, pad = 8 * dpr, span = W - 2 * pad
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = palette.rule
  for (let k = 1; k < 4; k++) ctx.fillRect(Math.round(pad + (k / 4) * span), 0, dpr, H)
  for (let k = 1; k < LANES.length; k++) {
    const y = Math.round(k * lane)
    const groupEdge = LANES[k][0] !== LANES[k - 1][0]
    if (groupEdge) ctx.fillRect(0, y, W, dpr)
    else for (let x = 0; x < W; x += 6 * dpr) ctx.fillRect(x, y, dpr, dpr)
  }
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    const age = now - e.time.getTime()
    if (age > WINDOW || age < 0) continue
    const x = pad + (1 - age / WINDOW) * span
    const y = (laneOf(e) + 0.5) * lane
    const col = palette[e.product] || palette.ink
    const r = Math.max(2.5 * dpr, lane * 0.3)
    ctx.fillStyle = col
    if (e.ms) { const len = e.ms * 0.06 * dpr; ctx.fillRect(x - len, y - r * 0.55, len, r * 1.1) }
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    ctx.lineWidth = dpr; ctx.strokeStyle = palette.ink; ctx.stroke()
    const p0 = pulses.get(e.id)
    if (p0 !== undefined) {
      const k = (t - p0) / 900
      if (k >= 1 || reduce.matches) pulses.delete(e.id)
      else { ctx.globalAlpha = 1 - k; ctx.strokeStyle = col; ctx.lineWidth = 2 * dpr; ctx.beginPath(); ctx.arc(x, y, r + k * lane * 1.4, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1 }
    }
  }
  ctx.fillStyle = palette.ink
  ctx.fillRect(Math.round(W - pad), 0, dpr, H)
}
new ResizeObserver(size).observe(canvas)

let raf = 0, last = 0, onScreen = true
function loop(t) {
  raf = 0
  if (!onScreen || document.hidden || reduce.matches) return
  if (t - last > 66) { last = t; draw() }
  raf = requestAnimationFrame(loop)
}
const run = () => { if (!raf && !reduce.matches) raf = requestAnimationFrame(loop) }
new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; if (onScreen) { draw(); run() } }).observe(canvas)
document.addEventListener('visibilitychange', () => { if (!document.hidden) { draw(); run() } })
reduce.addEventListener('change', run)
setInterval(() => { if (reduce.matches && onScreen) draw() }, 5000)
run()

// ---------- sticky hero that never hides its own bottom ----------
const hero = $('.hero')
const fit = () => hero.style.setProperty('--top', Math.min(0, window.innerHeight - hero.offsetHeight) + 'px')
new ResizeObserver(fit).observe(hero)
addEventListener('resize', fit)

// ---------- products timeline (pre-rendered in HTML; render if missing) ----------
const tl = $('#timeline')
if (!tl.querySelector('.rows')) tl.innerHTML = renderTimeline(content)

// ---------- page weight, measured, not claimed ----------
function weigh() {
  let page = 0, fonts = 0
  const nav = performance.getEntriesByType('navigation')[0]
  if (nav) page += nav.encodedBodySize || nav.transferSize || 0
  for (const r of performance.getEntriesByType('resource')) {
    const s = r.encodedBodySize || r.transferSize || 0
    if (/\.woff2(\?|$)/.test(r.name)) fonts += s; else page += s
  }
  const kb = n => (n / 1024).toFixed(1)
  $('#weight').textContent = page ? `${kb(page)} KB + ${kb(fonts)} KB fonts` : 'not measurable here'
}
if (document.readyState === 'complete') setTimeout(weigh, 0)
else addEventListener('load', () => setTimeout(weigh, 0))
