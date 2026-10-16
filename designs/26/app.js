// Widescreen. The page is still; only the feed moves.
import { content } from '../_shared/content.js'
import { createFeed, formatTime } from '../_shared/feed.js'
import { productsHTML, tally } from './products.js'

const $ = s => document.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)')

// ---------- products, from content.js (same markup as the static fallback) ----------

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty']
const word = n => WORDS[n] || String(n)
{
  const list = $('#p-list')
  const html = productsHTML(content.products)
  if (list.innerHTML !== html) list.innerHTML = html
  const t = tally(content.products)
  $('#products-title').innerHTML =
    `${word(t.total)} products. ${word(t.active)} in motion. ${word(t.retired)} retired, kept in&nbsp;view.`
}

// ---------- feed: a stack of cards ----------

const MAX = 12
const stack = $('#stack')
const count = $('#feed-count')
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function detail(e) {
  if (e.ms != null) return `${e.ms} ms`
  if (e.sha) return `${e.sha} · ${e.kb} KB`
  if (e.city) return `${e.city} · ${e.kb} KB`
  if (e.country) return e.country
  return ''
}

function card(e) {
  const el = document.createElement('article')
  el.className = 'card'
  el.dataset.id = e.id
  const t = formatTime(e.time)
  el.innerHTML =
    `<div class="c-head"><span class="c-prod">${esc(e.label)}</span><span class="c-kind">${esc(e.kind)}</span></div>` +
    `<p class="c-text">${esc(e.text)}</p>` +
    `<p class="c-detail">${esc(detail(e)) || '&nbsp;'}</p>` +
    `<div class="c-strip"><span class="c-sp">${esc(e.label)}</span><span class="c-st">${esc(e.text)}</span>` +
    `<time class="c-time" datetime="${e.time.toISOString()}">${t}</time></div>`
  return el
}

function layout() {
  const cards = [...stack.children].filter(c => !c.classList.contains('is-leave'))
  cards.forEach((c, i) => {
    c.style.setProperty('--i', i)
    c.classList.toggle('is-front', i === 0)
    c.setAttribute('aria-hidden', i === 0 ? 'false' : 'true')
  })
}

const feed = createFeed()
stack.replaceChildren(...feed.recent(MAX).map(card))
layout()

let seen = 0
count.textContent = 'Every product, as it happens.'

feed.subscribe(e => {
  seen++
  count.textContent = `${seen} ${seen === 1 ? 'event' : 'events'} since you arrived.`
  const el = card(e)
  const animate = !reduce.matches
  if (animate) el.classList.add('is-enter')
  stack.prepend(el)
  // drop the oldest
  const live = [...stack.children].filter(c => !c.classList.contains('is-leave'))
  live.slice(MAX).forEach(c => {
    if (!animate) return c.remove()
    c.classList.add('is-leave')
    setTimeout(() => c.remove(), 600)
  })
  layout()
  if (animate) {
    void el.offsetWidth // commit the entering state before releasing it
    el.classList.remove('is-enter')
  }
  sound?.event(e)
})

// ---------- the reel: vertical wheel drives the horizontal scroll ----------

const reel = $('#reel')

function canScrollY(node, dy) {
  for (let n = node; n && n !== reel; n = n.parentElement) {
    if (n.scrollHeight > n.clientHeight + 1) {
      const oy = getComputedStyle(n).overflowY
      if (oy === 'auto' || oy === 'scroll') {
        if (dy > 0 && n.scrollTop + n.clientHeight < n.scrollHeight - 1) return true
        if (dy < 0 && n.scrollTop > 0) return true
      }
    }
  }
  return false
}

reel.addEventListener('wheel', e => {
  if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return
  if (canScrollY(e.target, e.deltaY)) return
  const k = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? reel.clientWidth : 1
  const before = reel.scrollLeft
  reel.scrollLeft += e.deltaY * k
  if (reel.scrollLeft !== before) e.preventDefault()
}, { passive: false })

addEventListener('keydown', e => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
  const tag = (e.target.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'button' || e.target.isContentEditable) return
  const page = reel.clientWidth * 0.85
  const step = { PageDown: page, PageUp: -page, ' ': e.shiftKey ? -page : page, ArrowDown: 80, ArrowUp: -80 }[e.key]
  if (e.key === 'Home') { reel.scrollLeft = 0; e.preventDefault() }
  else if (e.key === 'End') { reel.scrollLeft = reel.scrollWidth; e.preventDefault() }
  else if (step) { reel.scrollLeft += step; e.preventDefault() }
})

// ---------- sound: off until asked for ----------

let sound = null
const btn = $('#sound')
if (window.AudioContext || window.webkitAudioContext) {
  btn.hidden = false
  btn.addEventListener('click', async () => {
    const on = btn.getAttribute('aria-pressed') !== 'true'
    if (on && !sound) {
      const { createSoundscape } = await import('./sound.js')
      sound = createSoundscape()
    }
    if (sound) on ? sound.start() : sound.stop()
    btn.setAttribute('aria-pressed', String(on))
    btn.querySelector('.sound-label').textContent = on ? 'Sound on' : 'Sound off'
  })
}
