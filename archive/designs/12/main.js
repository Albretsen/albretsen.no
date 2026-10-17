import { content } from '../_shared/content.js'
import { createFeed, formatTime } from '../_shared/feed.js'
import { renderProducts, summary } from './products.js'
import { markSVG, seedHex } from './mark.js'
import { startField } from './field.js'
import { createSound } from './sound.js'

const $ = s => document.querySelector(s)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const INK = '#070707', BLUE = '#006aaa'

// ---- seed: one per visit -------------------------------------------------
const seed = crypto.getRandomValues(new Uint32Array(1))[0]
const hex = seedHex(seed)

// ---- mark + favicon --------------------------------------------------------
document.querySelectorAll('[data-mark]').forEach(el => {
  el.innerHTML = markSVG(seed, { ink: el.dataset.mark === 'light' ? '#fafafa' : INK, blue: el.dataset.mark === 'light' ? '#52b5f4' : BLUE })
})
document.querySelectorAll('[data-seed]').forEach(el => { el.textContent = hex })
const fav = $('#favicon')
if (fav) fav.href = 'data:image/svg+xml,' + encodeURIComponent(markSVG(seed, { bg: '#fafafa' }))

// ---- products (canonical source: content.js) ------------------------------
$('#products-list').innerHTML = renderProducts(content.products)
$('#products-summary').textContent = summary(content.products)

// ---- field ----------------------------------------------------------------
startField($('.field'), { seed, reduced, ink: INK, blue: BLUE })

// ---- sound ----------------------------------------------------------------
const sound = createSound()
const soundBtn = $('#sound')
soundBtn.hidden = false
soundBtn.addEventListener('click', () => {
  sound.set(!sound.on)
  soundBtn.setAttribute('aria-pressed', String(sound.on))
  soundBtn.querySelector('span').textContent = sound.on ? 'on' : 'off'
})
document.addEventListener('focusin', e => { if (e.target.closest('.p-name, .foot a')) sound.tick() })
document.addEventListener('pointerover', e => {
  const a = e.target.closest('.p-name')
  if (a && !a.contains(e.relatedTarget)) sound.tick()
})

// ---- ticker tape ------------------------------------------------------------
// The tape moves at a constant speed. Events are laid on it as they happen,
// so the empty stretches between them are real time passing. Nothing repeats.
const feed = createFeed()
const win = $('.tape-window')
const track = $('.tape-track')
const pulse = $('.tape-live')
const SPEED = 64, GAP = 56

function item(e) {
  const el = document.createElement('span')
  el.className = 'tape-item'
  const tail = e.ms ? `${e.ms} ms` : e.country ? e.country : e.sha ? `${e.sha} · ${e.kb} KB` : e.city ? `${e.city} · ${e.kb} KB` : ''
  el.innerHTML = `<time datetime="${e.time.toISOString()}">${formatTime(e.time)}</time>` +
    `<b>${e.label}</b><em></em>` + (tail ? `<span class="tail"></span>` : '')
  el.querySelector('em').textContent = e.text
  if (tail) el.querySelector('.tail').textContent = tail
  if (e.product === 'albretsen.no' && e.kind === 'deploy') el.classList.add('is-deploy')
  return el
}

const tapeBtn = $('#tape-toggle')
// Lay the tape once the fonts are in, so measured widths are final.
await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1500))])
track.textContent = ''
win.classList.add('is-live')

if (reduced) {
  // Still tape: newest first, new events slide in at the left without motion.
  win.classList.add('is-still')
  for (const e of feed.recent(12)) track.appendChild(item(e))
  feed.subscribe(e => {
    track.prepend(item(e))
    while (track.children.length > 12) track.lastElementChild.remove()
    beat(e)
  })
} else {
  tapeBtn.hidden = false
  let offset = 0, paused = false, lastNow = performance.now(), lastEnd = 0
  const items = [] // { el, x, w }
  const place = (el, x) => { el.style.transform = `translateX(${x}px)`; return x }

  // History: newest ends at the right edge, older ones extend left.
  const width = win.clientWidth
  let right = width - 24
  const hist = feed.recent(12).reverse() // chronological in the DOM (and on paper)
  const made = hist.map(e => { const el = item(e); track.appendChild(el); return el })
  made.reverse().forEach(el => {
    const w = el.offsetWidth
    const x = place(el, right - w)
    items.unshift({ el, x, w })
    right = x - GAP
  })
  lastEnd = width - 24

  feed.subscribe(e => {
    const el = item(e)
    track.appendChild(el)
    const w = el.offsetWidth
    const x = place(el, Math.max(offset + win.clientWidth + 8, lastEnd + GAP))
    items.push({ el, x, w })
    lastEnd = x + w
    beat(e)
  })

  const loop = now => {
    const dt = Math.min(now - lastNow, 1000 * 60 * 60); lastNow = now
    if (!paused) offset += SPEED * dt / 1000
    track.style.transform = `translateX(${-offset}px)`
    while (items.length && items[0].x + items[0].w < offset - 40) items.shift().el.remove()
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  tapeBtn.addEventListener('click', () => {
    paused = !paused
    tapeBtn.setAttribute('aria-pressed', String(paused))
    tapeBtn.querySelector('span').textContent = paused ? 'Resume' : 'Pause'
    win.classList.toggle('is-paused', paused)
  })
}

function beat(e) {
  sound.event(e)
  if (reduced) return
  pulse.classList.remove('beat'); void pulse.offsetWidth; pulse.classList.add('beat')
}
