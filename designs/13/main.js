import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { renderProducts } from './products.js'

const $ = s => document.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)')

/* ---------- facts from content ---------- */
const blocks = $('#blocks')
// Static markup is baked from the same renderer; re-render only if content.js moved on.
const baked = [...blocks.querySelectorAll('.block')].map(b => b.id).join()
if (baked !== content.products.map(p => `p-${p.id}`).join()) blocks.innerHTML = renderProducts(content.products)
let sound = null
const active = content.products.filter(p => p.status === 'live' || p.status === 'building').length
$('#active-count').textContent = String(active)

/* ---------- favicon: the mark, drawn once from two discs ---------- */
try {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const g = c.getContext('2d')
  g.fillStyle = '#1b131b'; g.beginPath(); g.arc(23, 23, 23, 0, Math.PI * 2); g.fill()
  g.globalCompositeOperation = 'multiply'
  g.fillStyle = '#c526d5'; g.beginPath(); g.arc(41, 41, 23, 0, Math.PI * 2); g.fill()
  const link = document.querySelector('link[rel="icon"]'); link.href = c.toDataURL('image/png')
} catch { /* keep the empty icon */ }

/* ---------- clock ---------- */
const clock = $('#clock')
const tick = () => { clock.textContent = formatTime(new Date()) }
tick(); setInterval(tick, 1000)

/* ---------- the log ---------- */
const rows = [...document.querySelectorAll('#rows .row')]
const N = rows.length
const SHORT = { 'mcp-emails': 'mcp-emails', 'fun-libs': 'fun-libs', toolrails: 'toolrails', 'albretsen.no': 'albretsen.no' }
const tailOf = e => { const d = describe(e); return d.length > e.text.length ? d.slice(e.text.length) : '' }

function paint(row, e) {
  const [t, p, x] = row.children
  if (!e) { t.textContent = p.textContent = x.textContent = ''; return }
  t.textContent = formatTime(e.time)
  p.textContent = SHORT[e.product] || e.product
  x.textContent = e.text
  const tail = tailOf(e)
  if (tail) { const s = document.createElement('span'); s.className = 'tail'; s.textContent = tail; x.append(s) }
  row.title = `${e.label}: ${describe(e)}`
}

const feed = createFeed()
let data = feed.recent(N)
rows.forEach((r, i) => paint(r, data[i]))
$('.pulse').classList.add('on')

// Teletype: the newest line arrives one character at a time, at a fixed rate.
let typing = null
function teletype(row, e) {
  if (typing) typing.finish()
  if (reduce.matches) { paint(row, e); return }
  const [t, p, x] = row.children
  t.textContent = p.textContent = x.textContent = ''
  const main = document.createTextNode(''); x.append(main)
  const tail = tailOf(e)
  const tailEl = document.createElement('span'); tailEl.className = 'tail'
  const caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true')
  const segs = [
    [v => { t.textContent = v }, formatTime(e.time)],
    [v => { p.textContent = v }, SHORT[e.product] || e.product],
    [v => { main.data = v }, e.text],
    [v => { tailEl.textContent = v; if (!tailEl.isConnected) x.append(tailEl) }, tail],
  ]
  let si = 0, ci = 0, timer = 0
  const place = () => { const host = si < 1 ? t : si < 2 ? p : x; host.append(caret) }
  const step = () => {
    while (si < segs.length && ci >= segs[si][1].length) { si++; ci = 0 }
    if (si >= segs.length) { done(); return }
    ci++; segs[si][0](segs[si][1].slice(0, ci)); place()
    timer = setTimeout(step, 18)
  }
  const done = () => { clearTimeout(timer); caret.remove(); row.title = `${e.label}: ${describe(e)}`; typing = null }
  typing = { finish() { clearTimeout(timer); paint(row, e); typing = null } }
  step()
}

/* ---------- tallies since arrival ---------- */
const tally = {}
const markEl = $('#mark'), markSmall = $('.mark-s')
function count(e) {
  tally[e.product] = (tally[e.product] || 0) + 1
  const foot = document.querySelector(`[data-tally="${e.product}"] b`)
  if (foot) foot.textContent = String(tally[e.product])
  const card = document.querySelector(`[data-count="${e.product}"]`)
  if (card) {
    card.textContent = String(tally[e.product])
    const p = card.parentElement; p.classList.add('hot'); clearTimeout(p._t); p._t = setTimeout(() => p.classList.remove('hot'), 4000)
  }
}

let freshTimer = 0
feed.subscribe(e => {
  data = [e, ...data].slice(0, N)
  if (typing) typing.finish()
  for (let i = N - 1; i >= 1; i--) paint(rows[i], data[i])
  rows.forEach(r => r.classList.remove('fresh'))
  rows[0].classList.add('fresh')
  clearTimeout(freshTimer); freshTimer = setTimeout(() => rows[0].classList.remove('fresh'), 1200)
  teletype(rows[0], e)
  count(e)
  for (const m of [markEl, markSmall]) { m.classList.add('bloom'); setTimeout(() => m.classList.remove('bloom'), 180) }
  if (sound) sound.event(e)
})

/* ---------- sound: off until asked ---------- */
const btn = $('#snd')
btn.addEventListener('click', async () => {
  const on = btn.getAttribute('aria-pressed') !== 'true'
  btn.setAttribute('aria-pressed', String(on))
  btn.querySelector('.snd-state').textContent = on ? 'on' : 'off'
  if (on) {
    if (!sound) { const m = await import('./sound.js'); sound = m.createSoundscape() }
    sound.start()
  } else if (sound) {
    sound.stop()
  }
})
