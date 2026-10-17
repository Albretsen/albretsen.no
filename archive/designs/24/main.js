// Daylight Lattice — live behaviour. The page is complete without this file;
// this only adds the live heat grid, springs, sound and the living tab.
import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { PRODUCTS_ROWS, MINUTES, MARK, productsHTML, hash } from './render.js'

const $ = s => document.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
const hm = d => d.toTimeString().slice(0, 5)

/* ---------------- canonical content (no-op when the baked HTML matches) ---------------- */
{
  const inner = $('.products-inner')
  const html = productsHTML(content)
  if (inner && inner.dataset.h !== hash(html)) { inner.innerHTML = html; inner.dataset.h = hash(html) }
  $('#avail').textContent = content.availability
  const mail = $('#mail'); mail.textContent = content.email; mail.href = `mailto:${content.email}`
  $('.mcp code').textContent = content.mcpCommand
}

/* ---------------- a tiny spring engine (semi-implicit Euler, real time) ---------------- */
const active = new Set()
let raf = 0, last = 0
function loop(t) {
  const dt = Math.min(0.032, (t - (last || t)) / 1000) || 1 / 60
  last = t
  for (const s of active) {
    // integrate in small sub-steps so stiff springs stay stable on slow frames
    for (let i = 0; i < 4; i++) {
      const a = -s.k * (s.x - s.target) - s.c * s.v
      s.v += a * dt / 4; s.x += s.v * dt / 4
    }
    if (Math.abs(s.x - s.target) < 5e-4 && Math.abs(s.v) < 5e-3) { s.x = s.target; s.v = 0; active.delete(s) }
    s.apply(s.x)
  }
  raf = active.size ? requestAnimationFrame(loop) : (last = 0, 0)
}
function spring({ k = 170, c = 16, x = 0, target = 0, apply }) {
  const s = { k, c, x, v: 0, target, apply }
  return {
    kick(v) { if (reduce.matches) return; s.v += v; wake(s) },
    from(x) { if (reduce.matches) { s.x = s.target; s.apply(s.x); return } s.x = x; wake(s) },
  }
}
function wake(s) { active.add(s); if (!raf) raf = requestAnimationFrame(loop) }

/* ---------------- the heat grid: product x minute ---------------- */
const feed = createFeed()
const bins = new Map()          // `${product}|${minute}` -> events[]
const key = (p, m) => `${p}|${m}`
const minuteOf = d => Math.floor(d.getTime() / 60000)
const level = n => n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4

const rows = PRODUCTS_ROWS.map(r => {
  const el = document.querySelector(`.g-row[data-p="${CSS.escape(r.id)}"]`)
  const track = el.querySelector('.g-cells')
  const cells = [...track.children]
  return { ...r, el, track, cells, sum: el.querySelector('.g-sum'), pops: cells.map(c => spring({ k: 420, c: 13, x: 1, target: 1, apply: v => { c.style.transform = v === 1 ? '' : `scale(${v.toFixed(4)})` } })) }
})
let nowMinute = minuteOf(new Date())

// One shared spring slides every row left when a minute rolls over: the
// lattice glides with a little inertia instead of jumping.
const slide = spring({ k: 90, c: 15, x: 0, target: 0, apply: v => { const t = v ? `translateX(${v.toFixed(2)}px)` : ''; for (const r of rows) r.track.style.transform = t } })

function add(e) {
  const k = key(e.product, minuteOf(e.time))
  if (!bins.has(k)) bins.set(k, [])
  bins.get(k).push(e)
}
function paint() {
  const first = nowMinute - MINUTES + 1
  for (const r of rows) {
    let total = 0
    r.cells.forEach((c, i) => {
      const m = first + i
      const n = bins.get(key(r.id, m))?.length || 0
      total += n
      const l = level(n)
      if (c.dataset.l !== String(l)) c.dataset.l = l
      c.classList.toggle('now', m === nowMinute)
    })
    r.sum.textContent = total || '·'
  }
  // forget minutes that scrolled off the lattice
  for (const k of bins.keys()) if (+k.split('|')[1] < first) bins.delete(k)
}

feed.recent(50).forEach(add)
paint()

/* ---------------- clock + minute rollover ---------------- */
const clock = $('#clock')
function advanceTo(m) {
  if (m <= nowMinute) return
  const steps = m - nowMinute
  nowMinute = m
  clock.textContent = hm(new Date(m * 60000))
  paint()
  if (steps === 1) {
    const a = rows[0].cells[0].getBoundingClientRect(), b = rows[0].cells[1].getBoundingClientRect()
    slide.from(b.left - a.left)
  }
}
function tickMinute() {
  const d = new Date()
  clock.textContent = hm(d)
  advanceTo(minuteOf(d))
  setTimeout(tickMinute, 60000 - (Date.now() % 60000) + 20)
}
tickMinute()

/* ---------------- readout: latest event, or the minute you're inspecting ---------------- */
const rMeta = $('#r-meta'), rText = $('#r-text'), readout = $('#readout')
let latest = feed.recent(1)[0]
let inspecting = null
function showLatest() {
  if (!latest) return
  rMeta.textContent = `Latest · ${latest.label} · ${formatTime(latest.time)}`
  rText.textContent = cap(describe(latest))
}
function showCell(ri, ci) {
  const r = rows[ri], m = nowMinute - MINUTES + 1 + ci
  const evs = bins.get(key(r.id, m)) || []
  const ago = nowMinute - m
  rMeta.textContent = `${r.label} · ${hm(new Date(m * 60000))}${ago ? ` · ${ago} min ago` : ' · this minute'}`
  if (!evs.length) { rText.textContent = 'A quiet minute.'; return }
  const kinds = new Map()
  for (const e of evs) kinds.set(e.text, (kinds.get(e.text) || 0) + 1)
  const parts = [...kinds].sort((a, b) => b[1] - a[1]).map(([t, n]) => n > 1 ? `${t} ×${n}` : t)
  rText.textContent = `${evs.length} event${evs.length > 1 ? 's' : ''}: ${parts.join(', ')}.`
}
showLatest()

const grid = $('#grid')
let sel = null
function select(ri, ci) {
  rows.forEach(r => r.cells.forEach(c => c.classList.remove('sel')))
  sel = [ri, ci]
  rows[ri].cells[ci].classList.add('sel')
  inspecting = sel
  showCell(ri, ci)
}
function release() {
  rows.forEach(r => r.cells.forEach(c => c.classList.remove('sel')))
  inspecting = null; sel = null
  readout.setAttribute('aria-live', 'off')
  showLatest()
}
readout.setAttribute('aria-live', 'off') // never chatter on its own
grid.addEventListener('focus', () => { readout.setAttribute('aria-live', 'polite'); select(...(sel || [0, MINUTES - 1])) })
grid.addEventListener('blur', release)
grid.addEventListener('keydown', e => {
  if (!sel) return
  let [ri, ci] = sel
  const moves = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0], Home: [0, -99], End: [0, 99] }
  const mv = moves[e.key]
  if (e.key === 'Escape') { grid.blur(); return }
  if (!mv) return
  e.preventDefault()
  ri = Math.max(0, Math.min(rows.length - 1, ri + mv[0]))
  ci = Math.max(0, Math.min(MINUTES - 1, ci + mv[1]))
  select(ri, ci)
})
grid.addEventListener('pointerover', e => {
  const c = e.target.closest('.g-cells i'); if (!c) return
  const ri = rows.findIndex(r => r.track === c.parentElement)
  showCell(ri, rows[ri].cells.indexOf(c))
})
grid.addEventListener('pointerleave', () => { if (document.activeElement === grid && sel) showCell(...sel); else showLatest() })

/* ---------------- the A monogram answers each product ---------------- */
const markCells = [...document.querySelectorAll('.brand .mark rect')]
const MARK_SPOT = { 'mcp-emails': [0, 2], 'fun-libs': [2, 2], toolrails: [4, 0], 'albretsen.no': [4, 4] }
const markPops = Object.fromEntries(Object.entries(MARK_SPOT).map(([p, [y, x]]) => {
  const el = markCells[y * 5 + x]
  return [p, spring({ k: 380, c: 11, x: 1, target: 1, apply: v => { el.style.transform = v === 1 ? '' : `scale(${v.toFixed(4)})` } })]
}))

/* ---------------- the living tab: favicon + title ---------------- */
const fav = $('#favicon')
const FILL = ['#dfeee4', '#c0e8cd', '#9addb2', '#6ecb94', '#10271d']
function faviconSVG(hot) {
  let r = ''
  MARK.forEach((row, y) => row.forEach((v, x) => {
    const isHot = hot && hot[0] === y && hot[1] === x
    r += `<rect x="${3 + x * 5.4}" y="${3 + y * 5.4}" width="4.6" height="4.6" rx="1" fill="${isHot ? '#3cb178' : FILL[v]}"/>`
  }))
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#fbfaf3"/>${r}</svg>`)}`
}
const favRest = faviconSVG(null)
let favTimer = 0
function flashFavicon(p) {
  if (reduce.matches) return
  fav.href = faviconSVG(MARK_SPOT[p])
  clearTimeout(favTimer)
  favTimer = setTimeout(() => { fav.href = favRest }, 900)
}

const baseTitle = document.title
let missed = 0, titleTimer = 0
document.addEventListener('visibilitychange', () => {
  clearTimeout(titleTimer)
  if (document.hidden) { missed = 0; return }
  if (missed > 0) {
    document.title = `Albretsen · welcome back`
    titleTimer = setTimeout(() => { document.title = baseTitle }, 2400)
  } else document.title = baseTitle
  missed = 0
})

/* ---------------- sound: off until asked, then a sonic logo ---------------- */
const btn = $('#sound'), btnLabel = btn.querySelector('.sound-label')
let ac = null, out = null, soundOn = false
function ensureAudio() {
  if (ac) return
  ac = new (window.AudioContext || window.webkitAudioContext)()
  const comp = ac.createDynamicsCompressor()
  comp.threshold.value = -18; comp.ratio.value = 4
  out = ac.createGain(); out.gain.value = 0.9
  out.connect(comp).connect(ac.destination)
}
function bell(freq, t, { dur = 1.6, gain = 0.16, pan = 0, type = 'sine' } = {}) {
  const g = ac.createGain(), p = ac.createStereoPanner ? ac.createStereoPanner() : null
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  const o1 = ac.createOscillator(); o1.type = type; o1.frequency.value = freq
  const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2.003
  const g2 = ac.createGain(); g2.gain.value = 0.18
  o1.connect(g); o2.connect(g2).connect(g)
  if (p) { p.pan.value = pan; g.connect(p).connect(out) } else g.connect(out)
  o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05)
}
// The sonic logo, "A in daylight": an A major arpeggio strummed upward,
// landing on the octave, over a soft A bed. About two seconds.
function sonicLogo() {
  const t = ac.currentTime + 0.05
  const bed = ac.createOscillator(), bg = ac.createGain(), lp = ac.createBiquadFilter()
  bed.type = 'triangle'; bed.frequency.value = 110
  lp.type = 'lowpass'; lp.frequency.value = 600
  bg.gain.setValueAtTime(0, t); bg.gain.linearRampToValueAtTime(0.09, t + 0.35); bg.gain.exponentialRampToValueAtTime(0.0001, t + 2.4)
  bed.connect(lp).connect(bg).connect(out); bed.start(t); bed.stop(t + 2.5)
  bell(440.00, t + 0.00, { dur: 1.4, gain: 0.13, pan: -0.35 })
  bell(554.37, t + 0.09, { dur: 1.3, gain: 0.11, pan: -0.1 })
  bell(659.25, t + 0.18, { dur: 1.3, gain: 0.11, pan: 0.15 })
  bell(880.00, t + 0.42, { dur: 2.0, gain: 0.15, pan: 0.3 })
}
const TICK = { 'mcp-emails': 880, 'fun-libs': 1108.73, toolrails: 1318.51, 'albretsen.no': 1760 }
function tick(p) {
  if (!soundOn || document.hidden) return
  bell(TICK[p] || 880, ac.currentTime + 0.01, { dur: 0.22, gain: 0.035, pan: (Math.random() - 0.5) * 0.6 })
}
btn.addEventListener('click', async () => {
  soundOn = !soundOn
  btn.setAttribute('aria-pressed', String(soundOn))
  btnLabel.textContent = soundOn ? 'Sound on' : 'Sound off'
  if (soundOn) { ensureAudio(); await ac.resume(); sonicLogo() } else if (ac) ac.suspend()
})

/* ---------------- each real event ---------------- */
feed.subscribe(e => {
  add(e)
  advanceTo(minuteOf(e.time))
  paint()
  const r = rows.find(r => r.id === e.product)
  if (r) r.pops[MINUTES - 1].kick(9)
  markPops[e.product]?.kick(7)
  latest = e
  if (!inspecting) showLatest()
  else showCell(...inspecting)
  flashFavicon(e.product)
  if (document.hidden) { missed++; document.title = `Albretsen · ${missed} thing${missed > 1 ? 's' : ''} happened` }
  tick(e.product)
})
