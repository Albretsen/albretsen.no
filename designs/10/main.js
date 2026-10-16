// Pust: the live orbit, the date line and opt-in key clicks.
// JavaScript only writes content and custom properties. Every movement on
// the page (the orbit, the typing, the cursor reactions) is CSS.

import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { productsHTML } from './render.js'

const $ = s => document.querySelector(s)
const SLOTS = 10
const CHAR_MS = 42 // must match --char in pust.css

// ── facts ────────────────────────────────────────────────
$('#mcp').textContent = content.mcpCommand
$('#avail').textContent = content.availability
const mail = $('#mail'); mail.textContent = content.email; mail.href = `mailto:${content.email}`
const prod = $('#products')
const fresh = productsHTML(content)
if (prod.innerHTML.trim() !== fresh) prod.innerHTML = fresh

const today = $('#today')
const d = new Date()
today.dateTime = d.toISOString().slice(0, 10)
today.textContent = new Intl.DateTimeFormat('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)

// ── sound: soft key clicks, synthesized, off until asked ─
let ctx = null, noise = null, soundOn = false
const btn = $('#sound')
btn.addEventListener('click', () => {
  soundOn = !soundOn
  btn.setAttribute('aria-pressed', String(soundOn))
  btn.querySelector('b').textContent = soundOn ? 'på' : 'av'
  if (soundOn && !ctx) {
    ctx = new AudioContext()
    noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.03), ctx.sampleRate)
    const ch = noise.getChannelData(0)
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 3)
  }
  if (soundOn) { ctx.resume(); click(ctx.currentTime, 1) }
})

function click(at, weight = 1) {
  const src = ctx.createBufferSource(); src.buffer = noise
  src.playbackRate.value = 0.85 + Math.random() * 0.3
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'
  bp.frequency.value = 1500 + Math.random() * 1400; bp.Q.value = 1.4
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(0.11 * weight, at + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.035)
  src.connect(bp).connect(lp).connect(g).connect(ctx.destination)
  src.start(at); src.stop(at + 0.04)
}

function typeSound(text) {
  if (!soundOn || !ctx || document.hidden) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const t0 = ctx.currentTime + 0.03
  ;[...text].forEach((c, i) => { if (c !== ' ') click(t0 + i * CHAR_MS / 1000 + Math.random() * 0.006, c === '·' ? 0.5 : 1) })
}

// ── the orbit ────────────────────────────────────────────
const orbit = $('#orbit')
const slots = [] // slot index -> li

function item(e, slot) {
  const li = document.createElement('li')
  li.className = 'ev'
  li.dataset.product = e.product
  const text = describe(e)
  li.style.setProperty('--p', `${(slot * 100) / SLOTS}%`)
  li.style.setProperty('--len', String([...text].length))
  li.innerHTML = '<span class="ev-in"><time></time> <b></b> <span class="t"></span></span>'
  const time = li.querySelector('time'); time.textContent = formatTime(e.time); time.dateTime = e.time.toISOString()
  li.querySelector('b').textContent = e.label
  li.querySelector('.t').textContent = text
  return li
}

function setAges(newest) {
  // age 0 is the newest; used for list order on narrow screens
  for (let k = 0; k < SLOTS; k++) {
    const li = slots[(newest - k + SLOTS) % SLOTS]
    if (li) { li.style.setProperty('--age', String(k)); li.dataset.age = String(k) }
  }
}

const feed = createFeed()
orbit.textContent = ''
feed.recent(SLOTS).forEach((e, i) => {
  // newest takes slot 0, older ones trail behind it around the ring
  const slot = (SLOTS - i) % SLOTS
  const li = item(e, slot); slots[slot] = li; orbit.append(li)
})
let head = 0
setAges(head)

feed.subscribe(e => {
  head = (head + 1) % SLOTS
  const li = item(e, head)
  li.classList.add('is-new')
  orbit.querySelector('.is-new')?.classList.remove('is-new')
  slots[head]?.remove()
  slots[head] = li
  orbit.append(li)
  setAges(head)
  typeSound(li.querySelector('.t').textContent)
})
