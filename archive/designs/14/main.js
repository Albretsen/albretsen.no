// Bitspark: one event at a time, a chorus of products, a screensaver when you stop.
import { content } from '../_shared/content.js'
import { createFeed, formatTime } from '../_shared/feed.js'
import { renderProducts, productCounts } from './render.js'

const $ = id => document.getElementById(id)
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const LANES = ['mcp-emails', 'fun-libs', 'toolrails', 'albretsen.no']
const SLOTS = 24

// ---------- facts from content.js ----------
$('prod-body').innerHTML = renderProducts(content)
const n = productCounts(content)
$('counts').textContent = `${n.all} items / ${n.active} active / ${n.retired} retired`
$('mcp').textContent = content.mcpCommand
$('avail').textContent = content.availability
const mail = $('mail'); mail.textContent = content.email; mail.href = `mailto:${content.email}`
document.querySelector('[data-bind="mailto"]').href = `mailto:${content.email}`

// ---------- clock ----------
const clock = $('clock')
const tickClock = () => { clock.textContent = new Date().toTimeString().slice(0, 5) }
tickClock(); setInterval(tickClock, 5000)

// ---------- sound: one product, one note (square wave, 1-bit honest) ----------
const NOTES = { 'mcp-emails': 523.25, 'fun-libs': 659.25, toolrails: 783.99, 'albretsen.no': 1046.5 }
let ac = null, soundOn = false
const btn = $('sound')
btn.disabled = false
btn.addEventListener('click', () => {
  soundOn = !soundOn
  if (soundOn && !ac) ac = new (window.AudioContext || window.webkitAudioContext)()
  if (ac) soundOn ? ac.resume() : ac.suspend()
  btn.setAttribute('aria-pressed', String(soundOn))
  btn.querySelector('.mb-btn-l').textContent = soundOn ? 'Sound on' : 'Sound off'
  if (soundOn) blip('albretsen.no', 0.6)
})
function tone(freq, at, dur, vol) {
  const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter()
  o.type = 'square'; o.frequency.value = freq
  f.type = 'lowpass'; f.frequency.value = 3200
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(vol, at + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(f).connect(g).connect(ac.destination)
  o.start(at); o.stop(at + dur + 0.02)
}
function blip(product, scale = 1, kind = '') {
  if (!soundOn || !ac) return
  const t = ac.currentTime + 0.01, f = NOTES[product] || 440, v = 0.035 * scale
  tone(f, t, 0.16, v)
  if (kind === 'deploy') { tone(NOTES.toolrails, t + 0.09, 0.2, v); tone(f * 2, t + 0.18, 0.3, v) } // a deploy gets a chord
  if (kind === 'install' || kind === 'inbox.connected') tone(f * 1.5, t + 0.08, 0.14, v * 0.8)   // a newcomer, a fifth up
}

// ---------- the one event ----------
const el = { body: $('ev'), box: $('ev-box'), text: $('ev-text'), product: $('ev-product'), kind: $('ev-kind'),
  count: $('ev-count'), tail: $('ev-tail'), time: $('ev-time'), age: $('ev-age') }
let current = null, arrived = 0

const tailOf = e => e.ms ? `${e.ms} ms` : e.country ? e.country : e.sha ? `${e.sha} / ${e.kb} KB` : e.city ? `${e.city} / ${e.kb} KB` : ''

function fit() { // shrink only if three lines are not enough; height never changes
  el.text.style.setProperty('--fit', 1)
  let f = 1
  for (let i = 0; i < 12 && el.text.scrollHeight > el.box.clientHeight + 1; i++) {
    f *= 0.92; el.text.style.setProperty('--fit', f.toFixed(3))
  }
}

function age() {
  if (!current) return
  const s = Math.max(0, Math.round((Date.now() - current.time.getTime()) / 1000))
  el.age.textContent = s < 2 ? 'now' : s < 60 ? `${s} s ago` : `${Math.floor(s / 60)} min ago`
}
setInterval(age, 1000)

function show(e, animate) {
  current = e
  el.text.textContent = e.text
  el.text.dataset.text = e.text
  el.product.textContent = e.label
  el.kind.textContent = e.kind
  el.tail.textContent = tailOf(e)
  el.time.textContent = formatTime(e.time)
  el.time.dateTime = e.time.toISOString()
  el.count.textContent = `${arrived} since you arrived`
  age(); fit()
  if (animate && !reduced.matches) {
    el.body.classList.remove('glitch'); void el.body.offsetWidth; el.body.classList.add('glitch')
  }
}
el.body.addEventListener('animationend', ev => { if (ev.target === el.text) el.body.classList.remove('glitch') })
new ResizeObserver(fit).observe(el.box)
document.fonts && document.fonts.ready.then(fit)

// ---------- chorus lanes ----------
const lanes = Object.fromEntries(LANES.map(id => [id, document.querySelector(`[data-lane="${id}"] .ln-cells`)]))
let history = []
function drawLanes() {
  const seq = history.slice(0, SLOTS).reverse() // oldest left, newest right
  const pad = SLOTS - seq.length
  for (const id of LANES) {
    let h = '<i class="o"></i>'.repeat(pad)
    seq.forEach((e, i) => { h += e.product === id ? (i === seq.length - 1 ? '<i class="n"></i>' : '<i></i>') : '<i class="o"></i>' })
    lanes[id].innerHTML = h
  }
}

// ---------- feed ----------
const feed = createFeed()
history = feed.recent(SLOTS)
show(history[0], false)
drawLanes()
feed.subscribe(e => {
  arrived++
  history.unshift(e); history.length = Math.min(history.length, SLOTS)
  show(e, true)
  drawLanes()
  blip(e.product, 1, e.kind)
  saver.event(e)
})

// ---------- screensaver: after 30 s idle the hero goes dark and sparks drift ----------
const saver = (() => {
  const root = $('saver'), cv = $('saver-canvas'), ctx = cv.getContext('2d')
  const box = $('sv-ev'), sp = $('sv-p'), st = $('sv-t'), hero = $('hero')
  const U = 4 // one 1-bit pixel = 4 CSS px
  let on = false, raf = 0, last = 0, sparks = [], bursts = [], visible = true, idleTimer = 0
  const IDLE = 30000

  const rnd = (a, b) => a + Math.random() * (b - a)
  function size() {
    const r = hero.getBoundingClientRect()
    cv.width = Math.max(1, Math.ceil(r.width / U)); cv.height = Math.max(1, Math.ceil(r.height / U))
    const count = Math.round((cv.width * cv.height) / 260)
    sparks = Array.from({ length: count }, () => ({ x: rnd(0, cv.width), y: rnd(0, cv.height), v: rnd(0.25, 0.9), p: rnd(0, 6) }))
  }
  function plus(x, y, big) {
    x |= 0; y |= 0
    ctx.fillRect(x, y, 1, 1)
    if (big) { ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3) }
  }
  function frame(t) {
    raf = requestAnimationFrame(frame)
    if (t - last < 83) return // ~12 fps on purpose: chunky, cheap
    const dt = last ? Math.min(3, (t - last) / 83) : 1; last = t
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.fillStyle = '#fff'
    for (const s of sparks) {
      if (!reduced.matches) { s.x -= s.v * dt; s.y += s.v * 0.55 * dt; s.p += 0.35 * dt }
      if (s.x < -2) s.x += cv.width + 4
      if (s.y > cv.height + 2) s.y -= cv.height + 4
      plus(s.x, s.y, Math.sin(s.p) > 0.6)
    }
    ctx.fillStyle = '#fa2564'
    bursts = bursts.filter(b => (b.age += dt) < 14)
    for (const b of bursts) for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2, r = b.age * 1.6
      plus(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r * 0.8, b.age < 6)
    }
    if (reduced.matches) { cancelAnimationFrame(raf); raf = 0 } // one still frame, no drift
  }
  function place(e) {
    sp.textContent = `${e.label} / ${formatTime(e.time)}`
    st.textContent = e.text
    box.style.left = `${rnd(4, 40).toFixed(1)}%`  // moves every event: no burn-in
    box.style.top = `${rnd(8, 52).toFixed(1)}%`
  }
  function start() {
    if (on || document.hidden) return
    on = true; root.hidden = false; size(); last = 0
    if (current) place(current)
    if (visible) raf = requestAnimationFrame(frame)
  }
  function stop() {
    if (!on) return
    on = false; root.hidden = true; cancelAnimationFrame(raf); raf = 0
  }
  function poke() { stop(); clearTimeout(idleTimer); idleTimer = setTimeout(start, IDLE) }
  for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart', 'focusin'])
    addEventListener(ev, poke, { passive: true, capture: true })
  addEventListener('resize', () => on && size())
  new IntersectionObserver(([x]) => {
    visible = x.isIntersecting
    if (on && visible && !raf) { last = 0; raf = requestAnimationFrame(frame) }
    if (!visible) { cancelAnimationFrame(raf); raf = 0 }
  }).observe(hero)
  poke()
  return {
    event(e) {
      if (!on) return
      place(e)
      const bx = (parseFloat(box.style.left) / 100) * cv.width, by = (parseFloat(box.style.top) / 100) * cv.height
      if (!reduced.matches) bursts.push({ x: bx, y: by, age: 0 })
    },
  }
})()
