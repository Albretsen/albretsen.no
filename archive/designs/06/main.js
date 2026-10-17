import { content } from '../_shared/content.js'
import { createFeed, formatTime } from '../_shared/feed.js'
import { renderTimeline } from './timeline.js'
import { createField } from './field.js'

const $ = s => document.querySelector(s)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

// ---- Facts from content.js (the static markup already says the same) ----
$('#tl').innerHTML = renderTimeline(content)
for (const el of document.querySelectorAll('[data-c]')) el.textContent = content[el.dataset.c]
for (const a of document.querySelectorAll('[data-mail]')) { a.href = `mailto:${content.email}`; a.textContent = content.email }

// ---- Name: stretch vertically to fill its row ----
const name = $('#name')
function stretch() {
  const inner = name.firstElementChild
  const s = Math.max(0.8, Math.min(5, name.clientHeight / inner.offsetHeight))
  name.style.setProperty('--s', s.toFixed(4))
}
stretch()

// ---- Field ----
const hero = $('#hero')
const field = createField({ canvas: $('#field'), host: hero, name, reduced })
addEventListener('resize', () => { stretch(); field.redraw() })
const fontReady = document.fonts ? document.fonts.load('800 100px Fraunces').catch(() => {}) : Promise.resolve()
Promise.race([fontReady, new Promise(r => setTimeout(r, 2500))]).then(() => {
  stretch()
  field.start()
  document.documentElement.classList.add('field-on')
})
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => field.redraw())

// ---- Sound: one note per product, synthesized, off until asked ----
const NOTES = { 'mcp-emails': 293.66, 'fun-libs': 440.0, toolrails: 329.63, 'albretsen.no': 493.88 } // D4 A4 E4 B4
let audio = null, soundOn = false
const btn = $('#sound')
btn.hidden = false
btn.addEventListener('click', async () => {
  soundOn = !soundOn
  if (soundOn && !audio) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (AC) {
      const ac = new AC()
      const out = ac.createGain(); out.gain.value = 0.9
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400
      lp.connect(out); out.connect(ac.destination)
      audio = { ac, lp }
    }
  }
  if (audio) soundOn ? await audio.ac.resume() : audio.ac.suspend()
  btn.setAttribute('aria-pressed', String(soundOn))
  btn.querySelector('span').textContent = soundOn ? 'on' : 'off'
  if (soundOn) play('albretsen.no', 0.5)
})
function play(product, vol = 1) {
  if (!soundOn || !audio) return
  const f = NOTES[product]; if (!f) return
  const { ac, lp } = audio, t = ac.currentTime
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.11 * vol, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8)
  g.connect(lp)
  for (const [mult, type, lvl] of [[1, 'sine', 1], [2, 'triangle', 0.18], [3.01, 'sine', 0.06]]) {
    const o = ac.createOscillator(); const og = ac.createGain()
    o.type = type; o.frequency.value = f * mult; og.gain.value = lvl
    o.connect(og); og.connect(g); o.start(t); o.stop(t + 1.9)
  }
}

// ---- Feed: tail -f ----
const log = $('#log')
const now = $('#now-text')
const MAX = 12
const tail = e => e.ms ? `${e.ms} ms` : e.country ? e.country : e.sha ? `${e.sha} · ${e.kb} KB` : e.city ? `${e.city} · ${e.kb} KB` : ''

function line(e, fresh) {
  const li = document.createElement('li')
  if (fresh) li.className = 'fresh'
  const cells = [['t', formatTime(e.time)], ['p', e.product], ['x', e.text], ['d', tail(e)]]
  for (const [c, v] of cells) { const s = document.createElement('span'); s.className = c; s.textContent = v; li.append(s) }
  const time = li.firstChild
  time.title = e.time.toISOString()
  return li
}

const feed = createFeed()
const hist = feed.recent(MAX).slice().reverse()
log.replaceChildren(...hist.map(e => line(e, false)))
const showNow = e => { now.textContent = `${formatTime(e.time)}  ${e.label}, ${e.text}${tail(e) ? ' · ' + tail(e) : ''}` }
if (hist.length) showNow(hist[hist.length - 1])
$('#console').classList.add('is-live')

feed.subscribe(e => {
  log.append(line(e, !reduced))
  while (log.children.length > MAX) log.firstElementChild.remove()
  showNow(e)
  play(e.product)
  // The pulse starts at the latest line of the log, or at the bottom line of the stage.
  const hr = hero.getBoundingClientRect()
  const src = (log.lastElementChild || now).getBoundingClientRect()
  const inView = src.top < innerHeight && src.bottom > 0
  const o = inView ? src : now.getBoundingClientRect()
  field.pulse(o.left + 40 - hr.left, o.top + o.height / 2 - hr.top)
})
