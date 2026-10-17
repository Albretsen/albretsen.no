// The Long Evening (design 63): page behaviour.
import { content } from '../_shared/content.js'
import { createFeed } from '../_shared/feed.js'
import { initPostcards, initHorizon, initSun } from './assets/motion.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- facts from content.js (static HTML is the no-JS fallback) ---------- */
for (const li of $$('.pc')) {
  const p = content.products.find(x => x.id === li.dataset.id)
  if (!p) continue
  const set = (k, v) => { const el = $(`[data-k="${k}"]`, li); if (el && v != null) el.textContent = v }
  set('line', p.line)
  set('fig', p.figure?.value); set('figl', p.figure?.label)
  set('facts', (p.facts || []).join(' · '))
}
$('#cmd').textContent = content.mcpCommand

/* ---------- sound: off until the visitor asks; one soft card-stock flick ---------- */
let audio = null, soundOn = false
const soundBtn = $('#sound')
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn
  soundBtn.setAttribute('aria-pressed', String(soundOn))
  $('.sound__label', soundBtn).textContent = soundOn ? 'Sound on' : 'Sound off'
  if (soundOn) { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); flick(0.6) }
})
function flick(gain = 1) {
  if (!soundOn || !audio) return
  const t = audio.currentTime, dur = 0.22
  const buf = audio.createBuffer(1, Math.ceil(audio.sampleRate * dur), audio.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) { const x = i / d.length; d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * x), 3) }
  const src = audio.createBufferSource(); src.buffer = buf
  const bp = audio.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9
  bp.frequency.setValueAtTime(1800, t); bp.frequency.linearRampToValueAtTime(3400, t + dur / 2); bp.frequency.linearRampToValueAtTime(1800, t + dur)
  const g = audio.createGain(); g.gain.value = 0.16 * gain
  src.connect(bp).connect(g).connect(audio.destination); src.start(t)
}

/* ---------- hero: turn the card over ---------- */
const card = $('#heroCard'), front = $('#heroFront'), back = $('#heroBack')
const turnOver = $('#turnOver'), turnBack = $('#turnBack'), status = $('#heroStatus')
function setFlipped(on) {
  card.dataset.flipped = String(on)
  turnOver.setAttribute('aria-expanded', String(on))
  front.inert = on; back.inert = !on
  status.textContent = on ? 'Showing the back of the card.' : 'Showing the front of the card.'
  if (!reduce()) { card.classList.remove('is-flipping'); void card.offsetWidth; card.classList.add('is-flipping') }
  flick()
  setTimeout(() => (on ? turnBack : turnOver).focus({ preventScroll: true }), reduce() ? 0 : 480)
}
turnOver.addEventListener('click', () => setFlipped(true))
turnBack.addEventListener('click', () => setFlipped(false))
card.addEventListener('animationend', () => card.classList.remove('is-flipping'))
document.addEventListener('keydown', e => { if (e.key === 'Escape' && card.dataset.flipped === 'true') setFlipped(false) })

/* copy the MCP line */
for (const btn of $$('.copy')) {
  btn.addEventListener('click', async () => {
    const text = $(btn.dataset.copy).textContent.trim()
    try { await navigator.clipboard.writeText(text) } catch {
      const r = document.createRange(); r.selectNodeContents($(btn.dataset.copy)); const s = getSelection(); s.removeAllRanges(); s.addRange(r)
    }
    btn.classList.add('done'); status.textContent = 'Command copied.'
    clearTimeout(btn._t); btn._t = setTimeout(() => btn.classList.remove('done'), 1800)
  })
}

/* ---------- live feed: one line, a deadpan lateral swap ---------- */
const feed = createFeed()
const feedEl = $('.feed'), feedText = $('#feedText')
const ago = d => { const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000)); return s < 45 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago` }
const fmt = e => [e.label, e.text, e.ms ? `${e.ms} ms` : e.country || e.city || null].filter(Boolean).join(' · ')
let lastEvent = feed.recent(1)[0]
if (lastEvent) feedText.textContent = fmt(lastEvent)
let swapping = false
function showEvent(e) {
  lastEvent = e
  if (reduce() || swapping) { feedText.textContent = fmt(e); return }
  swapping = true
  feedText.classList.add('out')
  setTimeout(() => {
    feedText.textContent = fmt(e)
    feedText.classList.remove('out'); feedText.classList.add('in')
    void feedText.offsetWidth
    feedText.classList.remove('in')
    feedEl.classList.remove('is-new'); void feedEl.offsetWidth; feedEl.classList.add('is-new')
    swapping = false
  }, 420)
}
let lastSwap = 0, pending = null
feed.subscribe(e => {
  // keep it calm: at most one change every four seconds
  const now = Date.now()
  if (now - lastSwap > 4000) { lastSwap = now; showEvent(e) }
  else { pending = e }
})
setInterval(() => { if (pending && Date.now() - lastSwap > 4000) { lastSwap = Date.now(); showEvent(pending); pending = null } }, 1000)
feedEl.title = lastEvent ? ago(lastEvent.time) : ''

/* ---------- postcards ---------- */
initPostcards()
for (const b of $$('.lx-postcard')) b.addEventListener('click', () => flick(0.8))

/* the album: point at a stamp to read it */
const cap = $('#albumCap')
let capT = 0
function showStamp(btn) {
  $$('#stamps button').forEach(b => b.removeAttribute('aria-current'))
  btn.setAttribute('aria-current', 'true')
  const write = () => {
    cap.innerHTML = ''
    const n = document.createElement('span'); n.className = 'ac-name'; n.textContent = `${btn.dataset.name}, ${btn.dataset.since}.`
    const l = document.createElement('span'); l.className = 'ac-line'; l.textContent = ' ' + btn.dataset.line
    cap.append(n, l); cap.classList.remove('swap')
  }
  if (reduce()) return write()
  cap.classList.add('swap'); clearTimeout(capT); capT = setTimeout(write, 220)
}
for (const b of $$('#stamps button')) {
  b.addEventListener('mouseenter', () => showStamp(b))
  b.addEventListener('focus', () => showStamp(b))
  b.addEventListener('click', () => showStamp(b))
}

/* ---------- horizon wipe on the closing band ---------- */
initHorizon()

/* ---------- the room: scroll through the section is the time of day ---------- */
const roomSec = $('#room'), roomBox = $('#roomBox'), clock = $('#clock')
let room = null, roomT = 0
const clockAt = t => { const m = Math.round((17 * 60 + 40) + t * (23 * 60 + 10 - (17 * 60 + 40))); const mm = m - (m % 5); return `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}` }
function roomProgress() {
  const r = roomSec.getBoundingClientRect()
  const span = r.height - innerHeight
  if (span <= 0) { // stacked layout: progress as the room crosses the viewport
    return Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)))
  }
  return Math.min(1, Math.max(0, -r.top / span))
}
function updateRoom() {
  const t = reduce() ? 0.5 : roomProgress()
  if (Math.abs(t - roomT) < 0.002 && room) return
  roomT = t
  roomBox.style.setProperty('--t', t.toFixed(3))
  clock.textContent = clockAt(t)
  room?.setTime(0.12 + t * 0.84)
}
initSun(v => { document.body.style.setProperty("--dusk", v.toFixed(3)); updateRoom() })
updateRoom()

// 3D only where it is cheap to run: wide screens, motion allowed, not on save-data
const want3D = () => !location.search.includes('still') && innerWidth >= 900 && !reduce() && !navigator.connection?.saveData && !!document.createElement('canvas').getContext('webgl2')
const io = new IntersectionObserver(async (es) => {
  if (!es[0].isIntersecting || room) return
  io.disconnect()
  if (!want3D()) return
  try {
    const { mountRoom } = await import('./room.js')
    room = await mountRoom(roomBox, { base: './assets/', time: 0.12 + roomT * 0.84 })
    room.renderer.domElement.setAttribute('aria-hidden', 'true')
    requestAnimationFrame(() => requestAnimationFrame(() => room.renderer.domElement.classList.add('on')))
  } catch { /* stills stay */ }
}, { rootMargin: '400px 0px' })
const startIO = () => io.observe(roomSec)
if (document.readyState === 'complete') startIO(); else addEventListener('load', startIO, { once: true })

// review helpers for headless screenshots: ?y=1200 opens scrolled, ?back shows the back of the card
const q = new URLSearchParams(location.search)
if (q.has('from')) { // hide everything above a section id
  for (const el of $$('body > header, main > section')) { if (el.id === q.get('from')) break; el.hidden = true }
  if (q.has('t')) roomBox.style.setProperty('--t', q.get('t'))
}
if (q.has('back')) setFlipped(true)
if (q.has('flipcards')) $$('.lx-postcard').forEach(b => b.setAttribute('aria-pressed', 'true'))
