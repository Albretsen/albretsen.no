import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { newSeed, seedHex, markSVG, faviconURI } from './mark.js'
import { renderProducts, renderRuler } from './render.js'
import { sonicLogo, eventDrop, mute } from './sound.js'

const $ = (s, r = document) => r.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const WINDOW = 15 * 60 * 1000 // the strip shows the last 15 minutes, in real time

/* ── the mark: a new drop every visit ── */
const seed = newSeed()
for (const el of document.querySelectorAll('[data-mark]')) el.innerHTML = markSVG(seed, { id: el.dataset.mark, label: el.dataset.mark === 'top' ? '' : `Albretsen mark, drop ${seedHex(seed)}` })
for (const el of document.querySelectorAll('[data-seed]')) el.textContent = seedHex(seed)
const fav = $('link[rel="icon"]'); if (fav) fav.href = faviconURI(seed)

/* ── facts come from content.js (the HTML carries the same, baked, for no-JS) ── */
$('#plist').innerHTML = renderProducts(content)
$('#ruler').innerHTML = renderRuler(content)

/* ── the field ── */
const feed = createFeed()
const lanes = {}
for (const lane of document.querySelectorAll('.lane')) lanes[lane.dataset.p] = { el: lane, track: $('.track', lane), count: $('.lane-l b', lane), marks: [] }
const nameEl = $('.name')
const latest = $('#latest')
const recentList = $('#recent')
const clock = $('#clock')

function height(e) { // fraction of the lane band; the figure each event carries decides
  if (e.kind === 'deploy') return 1
  if (e.ms) return 0.18 + Math.min(1, (e.ms - 90) / 900) * 0.72
  if (e.kind === 'install') return 0.85
  if (e.kind === 'story.shared') return 0.6
  if (e.kind === 'inbox.connected') return 0.9
  if (e.product === 'albretsen.no') return 0.3
  return 0.42
}

function makeMark(e) {
  const lane = lanes[e.product]; if (!lane) return null
  const m = document.createElement('i')
  m.className = 'ev' + (e.kind === 'deploy' ? ' ev--deploy' : '')
  m.style.setProperty('--h', height(e).toFixed(3))
  if (e.kind === 'deploy') { const tag = document.createElement('span'); tag.className = 'deploytag'; tag.textContent = `deploy ${e.sha}`; m.append(tag) }
  m.title = `${formatTime(e.time)} ${e.label}: ${describe(e)}`
  // place before it enters the DOM so it lands where it belongs, without sliding there
  const age = Date.now() - e.time.getTime()
  m.style.setProperty('--x', (trackW - (age / WINDOW) * trackW).toFixed(1) + 'px')
  lane.track.append(m)
  const rec = { e, el: m }
  lane.marks.push(rec)
  return rec
}

let trackW = 0
function layout(now = Date.now()) {
  const any = Object.values(lanes)[0]
  trackW = any ? any.track.clientWidth : 0
  for (const lane of Object.values(lanes)) {
    let n = 0
    lane.marks = lane.marks.filter(r => {
      const age = now - r.e.time.getTime()
      if (age > WINDOW + 60000) { r.el.remove(); return false }
      if (age <= WINDOW && age >= 0) n++
      const x = trackW - (age / WINDOW) * trackW
      r.el.style.setProperty('--x', x.toFixed(1) + 'px')
      r.el.style.setProperty('--o', Math.max(0.12, 1 - (age / WINDOW) * 0.8).toFixed(2))
      return true
    })
    if (lane.count) lane.count.textContent = n
  }
  if (clock) clock.textContent = formatTime(new Date(now))
}

/* ── the name: Anybody's width is the traffic of the last five minutes ── */
function tension(now = Date.now()) {
  let n = 0
  for (const l of Object.values(lanes)) for (const r of l.marks) if (now - r.e.time.getTime() < 5 * 60000) n++
  return n
}
let baseG = 560
function setType(pulse) {
  const n = tension()
  const w = 88 + Math.min(n, 60) / 60 * 24 // 88..112
  baseG = 500 + Math.min(n, 60) / 60 * 120 // 500..620
  nameEl.style.setProperty('--w', w.toFixed(1))
  if (pulse && !reduce.matches) {
    nameEl.classList.add('hit')
    nameEl.style.setProperty('--g', pulse)
    setTimeout(() => { nameEl.classList.remove('hit'); nameEl.style.setProperty('--g', baseG.toFixed(0)) }, 90)
  } else nameEl.style.setProperty('--g', baseG.toFixed(0))
  const ax = $('#axes'); if (ax) ax.textContent = `wdth ${w.toFixed(0)} / wght ${baseG.toFixed(0)}`
}
const PULSE = { 'mcp-emails': 820, 'fun-libs': 760, toolrails: 840, 'albretsen.no': 700 }

function showLatest(e) {
  latest.innerHTML = ''
  const t = document.createElement('span'); t.className = 't'; t.textContent = formatTime(e.time)
  const p = document.createElement('span'); p.className = 'p'; p.textContent = e.label
  const x = document.createElement('span'); x.className = 'x'; x.textContent = describe(e)
  latest.append(t, p, x)
}
function listRecent() {
  recentList.innerHTML = feed.recent(6).map(e => `<li>${formatTime(e.time)} ${e.label}: ${describe(e).replace(/[<&]/g, '')}</li>`).join('')
}

// history first, oldest to newest, no landing animation: it already happened
const hist = feed.recent(50).slice().reverse()
for (const e of hist) makeMark(e)
layout()
setType()
if (hist.length) showLatest(hist[hist.length - 1])
listRecent()
requestAnimationFrame(() => document.documentElement.classList.add('ready'))

const mark = $('.bar .mark')
function land(rec) {
  if (reduce.matches) return
  rec.el.animate([
    { transform: 'translateY(-46px) scale(.6, .3)', opacity: 0 },
    { transform: 'translateY(0) scale(1.25, .78)', opacity: 1, offset: 0.55 },
    { transform: 'translateY(0) scale(.92, 1.1)', offset: 0.78 },
    { transform: 'none', opacity: 1 },
  ], { duration: 720, easing: 'cubic-bezier(.3,.7,.3,1)' })
  const rip = document.createElement('i')
  rip.className = 'ripple'
  rip.style.setProperty('--x', rec.el.style.getPropertyValue('--x'))
  rec.el.parentNode.append(rip)
  rip.animate([{ transform: 'scaleX(.1)', opacity: .9 }, { transform: 'scaleX(1)', opacity: 0 }], { duration: 1100, delay: 330, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' }).onfinish = () => rip.remove()
  if (mark) { mark.classList.add('wob'); setTimeout(() => mark.classList.remove('wob'), 90) }
}

let soundOn = false
feed.subscribe(e => {
  const rec = makeMark(e)
  layout()
  if (rec) land(rec)
  setType(PULSE[e.product])
  showLatest(e)
  listRecent()
  if (soundOn) eventDrop(e.product)
})

// real time only: the strip drifts at the speed of the clock, nothing faster
setInterval(() => { layout(); setType() }, 1000)
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => layout(), 120) })

/* ── sound: off until asked; switching on plays the sonic logo ── */
const snd = $('#sound')
snd.addEventListener('click', () => {
  soundOn = !soundOn
  snd.setAttribute('aria-pressed', String(soundOn))
  $('.snd-t', snd).textContent = soundOn ? 'sound on' : 'sound off'
  if (soundOn) sonicLogo(); else mute()
})

/* ── nothing to see here ── */
const toast = $('#toast')
let buf = ''
addEventListener('keydown', ev => {
  if (ev.target.closest && ev.target.closest('input, textarea')) return
  buf = (buf + (ev.key || '').toLowerCase()).slice(-4)
  if (buf !== 'aqua') return
  const on = !document.documentElement.hasAttribute('data-aqua')
  document.documentElement.toggleAttribute('data-aqua', on)
  toast.textContent = on ? 'aqua mode. 1998 called; kept the plastic.' : 'back to 2026.'
  toast.classList.add('on'); setTimeout(() => toast.classList.remove('on'), 2600)
  if (on && soundOn) sonicLogo()
})
console.log('%cdrop ' + seedHex(seed) + '%c  one of 16,777,216 drops. psst: type aqua.', 'color:#50f5db;font:600 12px monospace', 'color:#78baac;font:12px monospace')
