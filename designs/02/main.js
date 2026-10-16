import { content } from '../_shared/content.js'
import { createFeed } from '../_shared/feed.js'
import { productRows, tally, bubble } from './render.js'
import * as sound from './sound.js'

const $ = s => document.querySelector(s)
const still = matchMedia('(prefers-reduced-motion: reduce)')

// Products: same markup as the static fallback, re-rendered from content.js.
const menu = $('.menu')
const html = productRows(content.products)
if (menu.innerHTML.trim() !== html) menu.innerHTML = html
$('.tally').textContent = tally(content.products)

// Up and down move the cursor, like any menu.
menu.addEventListener('keydown', ev => {
  if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return
  const items = [...menu.querySelectorAll('.item')]
  const i = items.indexOf(document.activeElement)
  if (i < 0) return
  const next = items[Math.max(0, Math.min(items.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)))]
  next.focus(); ev.preventDefault()
})

// Clock: local time where the work happens.
const clock = $('.clock time')
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit', hour12: false })
const tick = () => { clock.textContent = fmt.format(new Date()) }
tick(); setInterval(tick, 10000)

// Chat: newest at the bottom. Bubbles are positioned with transforms only,
// so new messages never shift layout.
const chat = $('.chat')
const GAP = 10
let items = [] // newest first

function place() {
  const H = chat.clientHeight
  let y = 0
  for (const it of items) {
    it.el.style.transform = `translateY(${-y}px)`
    y += it.h + GAP
    it.gone = y - it.h > H + 40
  }
  for (const it of items.filter(i => i.gone)) it.el.remove()
  items = items.filter(i => !i.gone)
}

function add(e, animate) {
  const prev = items[0]
  const el = document.createElement('p')
  el.className = 'b'
  el.dataset.p = e.product
  if (e.product === 'albretsen.no') el.classList.add('self')
  el.innerHTML = bubble(e, !prev || prev.product !== e.product)
  if (prev) prev.el.classList.toggle('run', prev.product === e.product)
  chat.append(el)
  items.unshift({ el, product: e.product, h: el.offsetHeight })
  if (animate && !still.matches) el.classList.add('enter')
  place()
}

const feed = createFeed()
chat.classList.add('live')
chat.replaceChildren()
for (const e of feed.recent(12).reverse()) add(e, false)
requestAnimationFrame(() => requestAnimationFrame(() => chat.classList.add("ready")))

new ResizeObserver(() => {
  for (const it of items) it.h = it.el.offsetHeight
  place()
}).observe(chat)
document.fonts?.ready.then(() => { for (const it of items) it.h = it.el.offsetHeight; place() })

// The full stop beats once for every event. The mark is alive.
const mark = $('.name .mark')
feed.subscribe(e => {
  add(e, true)
  sound.play(e.product, e.kind)
  if (!still.matches) mark.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.6)' }, { transform: 'scale(1)' }],
    { duration: 700, easing: 'cubic-bezier(.2,.7,.2,1)' })
})

// Sound: off until asked.
const btn = $('.sound')
btn.classList.add("ready")
btn.addEventListener('click', async () => {
  const on = btn.getAttribute('aria-pressed') !== 'true'
  btn.setAttribute('aria-pressed', String(on))
  btn.querySelector('.state').textContent = on ? 'on' : 'off'
  if (on) { await sound.enable(); sound.play('albretsen.no', 'deploy') } else await sound.disable()
})
