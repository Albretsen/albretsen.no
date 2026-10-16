// 04 / CARRIER - the tape, the notes, the listing.
import { content } from '../_shared/content.js'
import { createFeed, formatTime } from '../_shared/feed.js'
import { renderProducts, GLYPH } from './products.js'

const $ = s => document.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)')

// ---------------------------------------------------------------- products
const dir = $('#dir')
if (dir) dir.innerHTML = renderProducts(content.products)

// ------------------------------------------------- sticky hero, any height
// If the hero is taller than the screen, stick it by its bottom edge instead,
// so the sheet never covers anything the visitor has not seen.
const hero = $('.hero')
const fit = () => { hero.style.top = Math.min(0, innerHeight - hero.offsetHeight) + 'px' }
addEventListener('resize', fit, { passive: true })
fit()
document.fonts?.ready.then(fit)

// ----------------------------------------------------------------- sound
// Off until asked. A soft square wave per product, A major pentatonic.
const NOTE = { 'mcp-emails': 440, 'fun-libs': 659.25, toolrails: 554.37, 'albretsen.no': 220 }
let ctx = null
let soundOn = false
function tone(freq, at, len = 0.32, peak = 0.045) {
  const o = ctx.createOscillator()
  const f = ctx.createBiquadFilter()
  const g = ctx.createGain()
  o.type = 'square'
  o.frequency.value = freq
  f.type = 'lowpass'
  f.frequency.value = 1500
  f.Q.value = 0.3
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(peak, at + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, at + len)
  o.connect(f).connect(g).connect(ctx.destination)
  o.start(at)
  o.stop(at + len + 0.02)
}
function sing(e) {
  if (!soundOn || !ctx || document.hidden) return
  const t = ctx.currentTime + 0.01
  const f = NOTE[e.product]
  if (!f) return
  tone(f, t)
  if (e.kind === 'deploy') tone(f * 1.5, t + 0.09, 0.5) // a deploy gets a fifth
  if (e.kind === 'inbox.connected' || e.kind === 'install') tone(f * 2, t + 0.07, 0.25, 0.03) // a newcomer gets an octave
}
const snd = $('.snd')
snd.addEventListener('click', async () => {
  soundOn = !soundOn
  snd.setAttribute('aria-pressed', String(soundOn))
  snd.querySelector('.snd__box').textContent = soundOn ? '[x]' : '[ ]'
  if (soundOn) {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') await ctx.resume()
    // the four notes once, so you know who is who
    const t = ctx.currentTime + 0.02
    ;[220, 440, 554.37, 659.25].forEach((f, i) => tone(f, t + i * 0.11, 0.22, 0.035))
  }
})

// ------------------------------------------------------------------ tape
const track = $('#track')
const win = $('.tape__win')
const cursor = track.querySelector('.tape__cur')
const SEP = '  //  '
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
const tail = e => e.ms ? `${e.ms} ms` : e.country ? e.country : e.sha ? `${e.sha} · ${e.kb} KB` : e.city ? `${e.city} · ${e.kb} KB` : ''

function eventNode(e) {
  const s = document.createElement('span')
  s.className = `ev ev--${e.product.replace('.', '-')}`
  const t = tail(e)
  s.innerHTML =
    `<span class="ev__b"><span class="ev__t">${formatTime(e.time)}</span> ` +
    `<span class="ev__p">${GLYPH[e.product] || '*'} ${esc(e.label)}</span> ` +
    `${esc(e.text)}${t ? `<span class="ev__x"> · ${esc(t)}</span>` : ''}</span>` +
    `<span class="ev__s">${SEP}</span>`
  return s
}

// The tape is anchored at its right edge. A new event is appended off-screen,
// then the tape steps left one whole cell at a time until it is in view.
// Nothing happens, nothing moves.
let pending = 0
let timer = null
let held = false
const STEP_MS = 45
const setOff = () => track.style.setProperty('--off', pending)
function step() {
  timer = null
  if (held) return
  if (pending > 0) { pending--; setOff() }
  if (pending > 0) timer = setTimeout(step, STEP_MS)
}
function kick() {
  if (reduce.matches) { pending = 0; setOff(); return }
  if (!timer && !held) timer = setTimeout(step, STEP_MS)
}
const hold = on => { held = on; if (!on) kick() }
win.addEventListener('mouseenter', () => hold(true))
win.addEventListener('mouseleave', () => hold(false))
win.addEventListener('focus', () => hold(true))
win.addEventListener('blur', () => hold(false))

const MAX = 40
function push(e, animate) {
  const n = eventNode(e)
  track.insertBefore(n, cursor)
  while (track.children.length > MAX + 1) track.firstElementChild.remove()
  if (animate) { pending += n.textContent.length; setOff(); kick() }
}

// legend: what happened since you arrived, by product
const counts = {}
const counters = {}
document.querySelectorAll('[data-c]').forEach(el => { counters[el.dataset.c] = el; counts[el.dataset.c] = 0 })
function tally(e) {
  const el = counters[e.product]
  if (!el) return
  counts[e.product]++
  el.textContent = String(counts[e.product]).padStart(4, '0')
  const lg = el.parentElement
  lg.classList.add('is-hit')
  clearTimeout(lg._t)
  lg._t = setTimeout(() => lg.classList.remove('is-hit'), 900)
}

const feed = createFeed()
track.querySelector('.ev--quiet')?.remove()
feed.recent(12).slice().reverse().forEach(e => push(e, false))
feed.subscribe(e => { push(e, true); tally(e); sing(e) })
