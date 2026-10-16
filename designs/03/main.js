import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { renderProducts } from './render.js'
import { startField } from './field.js'

const $ = s => document.querySelector(s)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const horizontal = matchMedia('(min-width: 760px) and (min-height: 540px)')
const PRODUCTS = ['mcp-emails', 'fun-libs', 'toolrails', 'albretsen.no']
const NAMES = { 'mcp-emails': 'MCP Emails', 'fun-libs': 'Fun Libs', toolrails: 'Toolrails', 'albretsen.no': 'albretsen.no' }

/* Contents: re-render from content.js only if the static copy has drifted. */
const entries = $('#entries')
const fresh = renderProducts(content.products)
const squash = s => s.replace(/\s+/g, ' ').trim()
if (squash(entries.innerHTML) !== squash(fresh)) entries.innerHTML = fresh
$('.avail').textContent = content.availability
const mail = $('.email a'); mail.textContent = content.email; mail.href = `mailto:${content.email}`
$('.spine code').textContent = content.mcpCommand

/* Ambient field. */
const field = startField($('#field'), { reduced })

/* The timeline strip. Marks sit on a track; the track slides left as time passes. */
const feed = createFeed()
const history = feed.recent(12)
const t0 = Date.now()
const oldest = history.length ? t0 - history[history.length - 1].time.getTime() : 0
const MIN = 60e3
const windowMs = Math.min(30 * MIN, Math.max(3 * MIN, Math.ceil((oldest * 1.15) / MIN) * MIN))
const strip = $('#strip'), track = $('#track')
const marks = []
const recent = [...history].reverse() // oldest first, appended as they come

$('#feed-window').textContent = `${windowMs / MIN} min ago`
strip.dataset.state = 'live'

function addMark(e, isNew) {
  const m = document.createElement('span')
  m.className = 'mark' + (isNew && !reduced ? ' is-new' : '')
  m.dataset.p = e.product
  if (e.kind === 'deploy') m.dataset.k = 'deploy'
  m.style.left = `${(1 + (e.time.getTime() - t0) / windowMs) * 100}%`
  if (e.ms) m.style.setProperty('--h', `${Math.round(28 + Math.min(1, e.ms / 1000) * 68)}%`)
  m.title = `${formatTime(e.time)} · ${e.label} · ${describe(e)}`
  m.innerHTML = '<i></i>'
  track.append(m)
  marks.push({ el: m, t: e.time.getTime() })
}

function tick() {
  const now = Date.now()
  track.style.transform = `translateX(${(-(now - t0) / windowMs) * 100}%)`
  while (marks.length && marks[0].t < now - windowMs * 1.05) marks.shift().el.remove()
}

const caption = $('#feed-log')
function renderLog() {
  caption.innerHTML = recent.slice(-3).reverse().map(e =>
    `<li><time datetime="${e.time.toISOString()}">${formatTime(e.time)}</time> <b>${e.label}</b> ${describe(e)}</li>`).join('')
}

/* The mark: four bars, one per product, sized by its share of the last twelve events. */
const bars = [...document.querySelectorAll('.mark-logo i')]
const legend = new Map([...document.querySelectorAll('#legend [data-p]')].map(li => [li.dataset.p, li.querySelector('.n')]))
const icon = document.createElement('canvas'); icon.width = icon.height = 64
const iconLink = $('#favicon')

function shape() {
  const last = recent.slice(-12)
  const counts = PRODUCTS.map(p => last.filter(e => e.product === p).length)
  const max = Math.max(1, ...counts)
  const heights = counts.map(c => 0.14 + 0.86 * (c / max))
  bars.forEach((b, i) => { b.style.transform = `scaleY(${heights[i].toFixed(3)})` })
  const now = Date.now()
  const inWindow = PRODUCTS.map(p => recent.filter(e => e.product === p && e.time.getTime() > now - windowMs).length)
  PRODUCTS.forEach((p, i) => { const n = legend.get(p); if (n) n.textContent = inWindow[i] })
  // favicon: the same four bars, sol on umber
  const c = icon.getContext('2d'); if (!c) return
  const css = getComputedStyle(document.documentElement)
  c.fillStyle = css.getPropertyValue('--ink').trim(); c.fillRect(0, 0, 64, 64)
  c.fillStyle = css.getPropertyValue('--sol').trim()
  heights.forEach((v, i) => { const bh = Math.round(46 * v); c.fillRect(9 + i * 12, 55 - bh, 9, bh) })
  iconLink.href = icon.toDataURL('image/png')
  $('#mark-label').textContent = `Mark: share of the last ${last.length} events. ` +
    PRODUCTS.map((p, i) => `${NAMES[p]} ${counts[i]}`).join(', ')
}

history.slice().reverse().forEach(e => addMark(e, false))
renderLog(); shape(); tick()
setInterval(tick, reduced ? 5000 : 250)

feed.subscribe(e => {
  recent.push(e); if (recent.length > 50) recent.shift()
  addMark(e, true)
  renderLog(); shape(); tick()
  // the landing becomes a gravity well in the field behind
  const fr = $('#field').getBoundingClientRect(), sr = strip.getBoundingClientRect()
  setTimeout(() => field.well(sr.right - fr.left - 1, sr.bottom - fr.top - 4), reduced ? 0 : 520)
})

/* Horizontal reading: a vertical wheel or page keys turn the spread sideways. */
const scroller = document.scrollingElement || document.documentElement
addEventListener('wheel', e => {
  if (!horizontal.matches || e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return
  const target = e.target instanceof Element && e.target.closest('[data-scroll-y]')
  if (target && target.scrollHeight > target.clientHeight) return
  e.preventDefault()
  const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerWidth : 1
  scroller.scrollLeft += e.deltaY * unit
}, { passive: false })

addEventListener('keydown', e => {
  if (!horizontal.matches || e.altKey || e.ctrlKey || e.metaKey) return
  if (e.target instanceof HTMLElement && e.target.matches('input, textarea, select, [contenteditable]')) return
  const page = innerWidth * 0.85
  const map = { PageDown: page, PageUp: -page, ArrowDown: 80, ArrowUp: -80, ' ': e.shiftKey ? -page : page }
  if (e.key === 'Home' || e.key === 'End') {
    e.preventDefault()
    scroller.scrollTo({ left: e.key === 'Home' ? 0 : scroller.scrollWidth, behavior: reduced ? 'auto' : 'smooth' })
  } else if (e.key in map) {
    e.preventDefault()
    scroller.scrollBy({ left: map[e.key], behavior: reduced ? 'auto' : 'smooth' })
  }
})
