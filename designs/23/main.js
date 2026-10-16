import { content } from '../_shared/content.js'
import { createFeed, formatTime } from '../_shared/feed.js'
import { productRows, tally } from './products.js'

const html = document.documentElement
const still = matchMedia('(prefers-reduced-motion: reduce)')
const $ = s => document.querySelector(s)

/* ---------- 1. facts from content.js (static markup is the same snapshot) ---------- */

const list = $('#ledger')
if (list) list.innerHTML = productRows(content.products)
const t = tally(content.products)
document.querySelectorAll('[data-tally]').forEach(el => { el.textContent = t[el.dataset.tally] ?? 0 })
document.querySelectorAll('[data-count]').forEach(el => { el.textContent = content.products.length })

/* ---------- 2. Norway clock in the top bar ---------- */

const clock = $('#clock')
if (clock) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit' })
  const tick = () => { clock.textContent = fmt.format(new Date()) }
  tick(); setInterval(tick, 15000)
}

/* ---------- 3. inhale / exhale: the page inverts as you scroll ---------- */

const toned = [...document.querySelectorAll('[data-tone]')]
const toneIO = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) html.dataset.tone = e.target.dataset.tone
}, { rootMargin: '-50% 0px -50% 0px' })
toned.forEach(s => toneIO.observe(s))

/* ---------- 4. slow reveals ---------- */

const revealIO = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target) }
}, { rootMargin: '0px 0px -12% 0px' })
document.querySelectorAll('[data-reveal]').forEach(el => revealIO.observe(el))

/* ---------- 5. the feed: one event at a time, shown huge ---------- */

function phrase(e) {
  const ms = e.ms != null ? `${e.ms} ms` : null
  switch (e.kind) {
    case 'thread.read': return [ms, 'an agent read a thread.']
    case 'draft.created': return [ms, 'an agent drafted a reply.']
    case 'send.scheduled': return [ms, 'an agent scheduled a send.']
    case 'inbox.searched': return [ms, 'an agent searched an inbox.']
    case 'inbox.triaged': return [ms, 'an automation triaged an inbox.']
    case 'inbox.connected': return ['1', `new inbox connected, from ${e.country}.`]
    case 'story.completed': return ['1', `story completed, in ${e.country}.`]
    case 'story.shared': return ['1', `story shared, from ${e.country}.`]
    case 'install': return ['1', `new player, in ${e.country}.`]
    case 'tool.searched': return [ms, 'an agent searched for a tool.']
    case 'tool.executed': return [ms, 'an agent ran a tool.']
    case 'page.served': return [`${e.kb} KB`, `page served, ${e.city}.`]
    case 'deploy': return [`${e.kb} KB`, `deployed, commit ${e.sha}.`]
    default: return [null, `${e.text}.`]
  }
}

const stage = $('#stage')
const meta = $('#event-meta')
const since = $('#since')
const pos = $('#pos')
const older = $('#older')
const newer = $('#newer')

if (stage) {
  const feed = createFeed()
  let history = feed.recent(12)
  let index = 0
  let arrived = 0
  let lastAt = history[0] ? history[0].time : new Date()

  const render = () => {
    const e = history[index]
    if (!e) return
    const [num, rest] = phrase(e)
    const p = document.createElement('p')
    p.className = 'event'
    if (num) {
      const b = document.createElement('span')
      b.className = 'num'
      b.textContent = num
      p.append(b, document.createTextNode(num.length > 1 ? ': ' : ' '))
    }
    p.append(document.createTextNode(rest))
    stage.querySelectorAll('.event').forEach(old => {
      if (still.matches) { old.remove(); return }
      old.classList.add('leaving')
      setTimeout(() => old.remove(), 1400)
    })
    stage.append(p)
    meta.innerHTML = ''
    const parts = [formatTime(e.time), e.label, e.kind]
    parts.forEach((s, i) => {
      const span = document.createElement('span')
      span.textContent = s
      if (i === 1) span.className = 'prod'
      meta.append(span)
    })
    pos.textContent = `${String(index + 1).padStart(2, '0')} / ${String(history.length).padStart(2, '0')}`
    older.disabled = index >= history.length - 1
    newer.disabled = index === 0
  }

  const pad = n => String(n).padStart(2, '0')
  const tickSince = () => {
    const s = Math.max(0, Math.round((Date.now() - lastAt.getTime()) / 1000))
    since.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)} since the last event. ${arrived} since you arrived.`
  }

  feed.subscribe(e => {
    history = feed.recent(12)
    lastAt = e.time
    arrived++
    if (index === 0) render()
    else { index = Math.min(index + 1, history.length - 1); pos.textContent = `${pad(index + 1)} / ${pad(history.length)}`; newer.disabled = false }
    tickSince()
  })

  older.addEventListener('click', () => { if (index < history.length - 1) { index++; render() } })
  newer.addEventListener('click', () => { if (index > 0) { index--; render() } })
  stage.closest('section').addEventListener('keydown', ev => {
    if (ev.target.closest('input, textarea')) return
    if (ev.key === 'ArrowLeft' && document.activeElement?.closest('.controls')) older.click()
    if (ev.key === 'ArrowRight' && document.activeElement?.closest('.controls')) newer.click()
  })

  stage.querySelector('.event')?.remove()
  render()
  tickSince()
  setInterval(tickSince, 1000)
  html.classList.add('feed-on')
}

/* ---------- 6. the caret: the cursor is the mark's underscore ---------- */

const caret = $('#caret')
if (caret && matchMedia('(pointer: fine)').matches) {
  const bar = caret.querySelector('.bar')
  const label = caret.querySelector('.label')
  html.classList.add('caret-on')
  let x = -200, y = -200, lx = x, ly = y, raf = 0, idle = 0, mode = ''

  const setMode = m => { if (m !== mode) { caret.dataset.mode = mode = m } }
  const frame = () => {
    const k = still.matches ? 1 : 0.16
    lx += (x - lx) * k
    ly += (y - ly) * k
    const left = Math.min(x, lx)
    const w = Math.abs(x - lx) + 18
    if (mode === 'beam') {
      bar.style.transform = `translate3d(${x - 1}px, ${y - 11}px, 0) scale(.111, 7.4)`
    } else {
      bar.style.transform = `translate3d(${left}px, ${y + 14}px, 0) scale(${w / 18}, 1)`
    }
    label.style.transform = `translate3d(${x + 16}px, ${y + 22}px, 0)`
    raf = (Math.abs(x - lx) > 0.4 || Math.abs(y - ly) > 0.4) ? requestAnimationFrame(frame) : 0
  }

  addEventListener('pointermove', ev => {
    if (ev.pointerType !== 'mouse' && ev.pointerType !== 'pen') return
    x = ev.clientX; y = ev.clientY
    if (lx < -100) { lx = x; ly = y }
    caret.classList.add('shown')
    caret.classList.remove('idle')
    clearTimeout(idle)
    idle = setTimeout(() => caret.classList.add('idle'), 1400)
    if (!raf) raf = requestAnimationFrame(frame)
  }, { passive: true })

  addEventListener('pointerover', ev => {
    const hit = ev.target.closest('[data-cursor], a, button')
    if (hit) {
      const text = hit.dataset.cursor || (hit.tagName === 'A' ? 'open' : hit.textContent.trim())
      label.textContent = text
      setMode(hit.disabled ? 'off' : 'link')
      return
    }
    label.textContent = ''
    setMode(ev.target.closest('p, h2, li, figcaption, time, .cmd') ? 'beam' : '')
    if (!raf) raf = requestAnimationFrame(frame)
  })

  document.addEventListener('pointerleave', () => caret.classList.remove('shown'))
  addEventListener('blur', () => caret.classList.remove('shown'))
}
