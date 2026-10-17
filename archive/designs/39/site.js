// site.js: design 39 "Cold Boot". The page boots, the light cracks into glass, the log keeps running.
import { content } from '../_shared/content.js'
import { createFeed } from '../_shared/feed.js'
import { lens, dispersion, smoothScroll } from './assets/motion.js'
import { createSpringDeck } from './assets/interactive/spring-deck.js'

const html = document.documentElement
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const wide = () => innerWidth >= 700
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const P = Object.fromEntries(content.products.map(p => [p.id, p]))
const t0 = performance.now()

/* ------------------------------------------------------------------ sound (opt-in) */
const sound = { on: false, ctx: null }
const NOTE = { 'mcp-emails': 880, 'fun-libs': 659.3, toolrails: 987.8, 'albretsen.no': 523.3 }
function ping(freq = 740, gain = .028) {
  if (!sound.on) return
  const ctx = sound.ctx || (sound.ctx = new AudioContext())
  // a glass tick and its echo: two detuned sines, the second quieter and later
  ;[[0, 1, 0], [.14, .35, 7], [.28, .12, -5]].forEach(([dt, g, cents]) => {
    const o = ctx.createOscillator(), a = ctx.createGain(), t = ctx.currentTime + dt
    o.type = 'sine'; o.frequency.value = freq; o.detune.value = cents
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(gain * g, t + .006); a.gain.exponentialRampToValueAtTime(.0001, t + .9)
    o.connect(a).connect(ctx.destination); o.start(t); o.stop(t + 1)
  })
}
$('.sound').addEventListener('click', e => {
  sound.on = !sound.on
  e.currentTarget.setAttribute('aria-pressed', String(sound.on))
  $('.sound-label').textContent = sound.on ? 'sound on' : 'sound off'
  if (sound.on) ping(659.3, .03)
})

/* ------------------------------------------------------------------ boot */
const live = content.products.filter(p => p.status !== 'retired')
const retired = content.products.filter(p => p.status === 'retired')
const pad = (s, n) => String(s).padEnd(n, ' ')
const bootLines = [
  ['firmware', `${content.domain}, ${content.location}`],
  ['play', `publishing since ${content.history.playDeveloperSince}`],
  ['mount', `/products  ${live.length} running, ${retired.length} retired`],
  ...live.map(p => [p.id, `${p.figure.value} ${p.figure.label}${p.status !== 'live' ? `, ${p.status}` : ''}`]),
  ['mcp', 'albretsen.no/mcp  listening'],
]
const film = $('.film'), glassCanvas = $('.glass')
let field = null

function startGlass() {
  if (reduce || !wide() || field) return
  field = import('./assets/interactive/prism-field.js')
    .then(m => m.mountPrismField(glassCanvas, { src: 'assets/hero/prism@2x.webp', focusX: .7, focusY: .4, autoPulse: false, dispersion: .26 }))
    .catch(() => null)
}
async function revealGlass() {
  const f = await (field || Promise.resolve(null))
  if (!f) return
  glassCanvas.classList.add('is-live')
  setTimeout(() => f.pulse(.72, .58), 250)
}

function boot() {
  const bootEl = $('[data-boot]')
  if (!html.classList.contains('will-boot')) { bootEl?.remove(); afterBoot(false); return }
  const log = $('.boot-log', bootEl), bar = $('.boot-bar', bootEl)
  const lineMs = 110
  log.innerHTML = bootLines.map(([k, v], i) =>
    `<li style="--i:${i}"><span class="t">[${((i + 1) * .137).toFixed(3).padStart(7, ' ')}]</span> <span class="ok">ok</span> <b>${esc(pad(k, 12))}</b> ${esc(v)}</li>`).join('') +
    `<li style="--i:${bootLines.length}"><span class="t">[${((bootLines.length + 1) * .137).toFixed(3).padStart(7, ' ')}]</span>        <b>${pad('light', 12)}</b> on</li>`
  // warm up the film and the glass while the log runs
  if (wide()) { film.preload = 'auto'; film.load() }
  startGlass()
  const total = (bootLines.length + 1) * lineMs
  let done = false
  const finish = skipped => {
    if (done) return; done = true
    bar.style.setProperty('--p', 1)
    if (skipped) $$('li', log).forEach(li => { li.style.animation = 'none'; li.style.opacity = 1; li.style.transform = 'none' })
    setTimeout(() => {
      bootEl.classList.add('is-done'); html.classList.add('is-booted')
      bootEl.addEventListener('animationend', e => { if (e.target === bootEl) bootEl.remove() })
      setTimeout(() => bootEl.remove(), 1600)
      try { sessionStorage.setItem('d39-booted', '1') } catch (e) {}
      afterBoot(true)
    }, skipped ? 60 : 380)
    removeEventListener('keydown', skip); removeEventListener('pointerdown', skip)
  }
  const skip = () => finish(true)
  addEventListener('keydown', skip); addEventListener('pointerdown', skip)
  ;(function tick(now) {
    if (done) return
    const p = Math.min(1, (now - t0) / total)
    bar.style.setProperty('--p', p.toFixed(3))
    if (sound.on && Math.random() < .08) ping(1200, .01)
    if (p < 1) requestAnimationFrame(tick)
  })(performance.now())
  // the log ends on a clock, not on frames: rAF can stall in a background tab
  setTimeout(() => finish(false), total + 40)
}

function afterBoot(withFilm) {
  const bootMs = Math.round(performance.now() - t0)
  logLine({ ts: (bootMs / 1000).toFixed(2) + ' s', src: 'boot', txt: withFilm ? 'cold boot complete' : 'warm start', more: `${bootMs} ms from first byte to light`, ok: true })
  if (reduce || !wide()) return
  startGlass()
  if (withFilm) {
    let revealed = false
    const go = () => { if (revealed) return; revealed = true; revealGlass(); setTimeout(() => film.classList.remove('is-playing'), 400) }
    film.addEventListener('playing', () => film.classList.add('is-playing'), { once: true })
    film.addEventListener('ended', go, { once: true })
    film.addEventListener('error', go, { once: true })
    film.currentTime = 0
    film.play().catch(go)
    setTimeout(go, 4200) // never wait on a slow film
  } else {
    // warm start: no film, the still simply becomes glass once the module is ready
    const idle = window.requestIdleCallback || (f => setTimeout(f, 200))
    idle(() => revealGlass())
  }
}

/* ------------------------------------------------------------------ live log */
const list = $('.syslog-list')
const MAX = 7
function logLine({ ts, src, txt, more, ok }, isNew = true) {
  const li = document.createElement('li')
  li.innerHTML = `<span class="ts">${esc(ts)}</span><span class="src">${ok ? '<span class="ok-tag">[ ok ]</span>' : esc(src)}</span><span class="txt">${esc(txt)}</span>` +
    `<span class="more"><span>${esc(more)}</span></span>`
  if (isNew) li.classList.add('is-new')
  list.append(li)
  while (list.children.length > MAX) list.firstElementChild.remove()
}
const short = { 'mcp-emails': 'mcp-emails', 'fun-libs': 'fun-libs', toolrails: 'toolrails', 'albretsen.no': 'web' }
const hhmmss = d => d.toTimeString().slice(0, 8)
const detail = e => [e.kind, e.ms ? `${e.ms} ms` : null, e.country || null, e.city || null, e.kb ? `${e.kb} KB` : null, e.sha ? `sha ${e.sha}` : null].filter(Boolean).join(' · ')
const feed = createFeed()
feed.recent(MAX - 1).reverse().forEach(e => logLine({ ts: hhmmss(e.time), src: short[e.product], txt: e.text, more: detail(e) }, false))
feed.subscribe(e => { logLine({ ts: hhmmss(e.time), src: short[e.product], txt: e.text, more: detail(e) }); ping(NOTE[e.product]) })

/* ------------------------------------------------------------------ hero details */
lens($('.name'), { radius: 150, stiffness: 150, damping: 18 })
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const text = $(b.dataset.copy).textContent.trim()
  try { await navigator.clipboard.writeText(text) } catch (e) {
    const r = document.createRange(); r.selectNodeContents($(b.dataset.copy)); getSelection().removeAllRanges(); getSelection().addRange(r)
  }
  scramble(b.firstElementChild, 'copied'); b.classList.add('is-done'); ping(1318.5, .02)
  setTimeout(() => { scramble(b.firstElementChild, 'copy'); b.classList.remove('is-done') }, 1800)
}))
// a short mono decode, like a line resolving on a terminal
function scramble(el, to) {
  if (reduce) { el.textContent = to; return }
  const glyphs = '/\\|_-=+<>[]01', from = el.textContent, n = Math.max(from.length, to.length)
  let f = 0
  const step = () => {
    f++
    el.textContent = Array.from({ length: n }, (_, i) => f > i * 1.6 + 3 ? (to[i] || '') : glyphs[(Math.random() * glyphs.length) | 0]).join('')
    if (f < n * 1.6 + 4) requestAnimationFrame(step); else el.textContent = to
  }
  step()
}

/* ------------------------------------------------------------------ products: deck + index */
const ICON = {
  'mcp-emails': '<img src="../_shared/products/mcp-emails/icon.png" alt="" width="44" height="44">',
  'fun-libs': '<img src="../_shared/products/fun-libs/icon.png" alt="" width="44" height="44">',
  toolrails: '<img src="../_shared/products/toolrails/icon.svg" alt="" width="44" height="44">',
  harbor: '<svg viewBox="0 0 64 64" style="background:#1A1A1A;color:#F0EDE8" aria-hidden="true"><path d="M12 26Q12 14 24 14L28.5 14L32 19.5L35.5 14L40 14Q52 14 52 26L52 40Q52 52 40 52L24 52Q12 52 12 40Z" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" fill="none"/><circle cx="32" cy="35" r="3" fill="currentColor"/></svg>',
}
const host = u => u ? u.replace(/^https?:\/\//, '') : ''
const deckEl = $('#deck')
deckEl.innerHTML = live.map(p => `
  <article class="deck-card" data-id="${p.id}" aria-label="${esc(p.name)}. Enter turns it over, arrow keys cycle.">
    <div class="deck-face deck-front">
      <picture>
        <source type="image/avif" srcset="assets/products/${p.id}.avif 800w, assets/products/${p.id}@2x.avif 1600w" sizes="(max-width: 900px) 100vw, 60vw">
        <img src="assets/products/${p.id}.webp" srcset="assets/products/${p.id}.webp 800w, assets/products/${p.id}@2x.webp 1600w" sizes="(max-width: 900px) 100vw, 60vw" width="800" height="500" alt="${esc(p.name)} icon as a glass slab casting its own light" loading="lazy" decoding="async" draggable="false">
      </picture>
      <span class="deck-hint">drag &middot; click to turn over</span>
      <div class="tag"><h3>${esc(p.name)}</h3><p>${esc(p.status)} &middot; since ${p.since}</p></div>
    </div>
    <div class="deck-face deck-back">
      <div class="row"><span class="icon">${ICON[p.id]}</span><h3>${esc(p.name)}</h3><span class="mono">${esc(p.status)}</span></div>
      <div class="fig"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></div>
      <div><p class="line">${esc(p.line)}</p>
        <ul>${(p.facts || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
      ${p.url ? `<a href="${p.url}" tabindex="-1" rel="noopener">${esc(host(p.url))} &nearr;</a>` : ''}
    </div>
  </article>`).join('')
$$('.deck-back a', deckEl).forEach(a => { a.addEventListener('pointerdown', e => e.stopPropagation()); a.addEventListener('keydown', e => e.stopPropagation()) })
const deck = createSpringDeck(deckEl, { depthY: 18, echoTurn: 2.2 })
let order = live.map(p => p.id)

const indexEl = $('#index')
indexEl.innerHTML = live.map((p, i) => `
  <li data-id="${p.id}" data-status="${p.status}">
    <button type="button" aria-controls="deck" aria-label="Show ${esc(p.name)} on top of the stack">
      <span class="n">${String(i + 1).padStart(2, '0')}</span><span class="ic">${ICON[p.id]}</span>
      <span class="nm">${esc(p.name)}</span><span class="st">${esc(p.status)}</span>
    </button>
    <div class="detail"><div>
      <p>${esc(p.line)}</p>
      <span class="fig">${esc(p.figure.value)} ${esc(p.figure.label)} &middot; since ${p.since}</span>
      <span class="facts">${(p.facts || []).map(esc).join(' &middot; ')}${p.url ? ` &middot; <a href="${p.url}" rel="noopener">${esc(host(p.url))}</a>` : ''}</span>
    </div></div>
  </li>`).join('')
function syncIndex() {
  $$('#index li').forEach(li => {
    const on = li.dataset.id === order[0]
    if (on && !li.classList.contains('is-active')) { const d = li.querySelector('.detail > div'); d.classList.remove('prism-wipe-in'); void d.offsetWidth; d.classList.add('prism-wipe-in') }
    li.classList.toggle('is-active', on)
  })
  $('#deck-count').textContent = `${live.findIndex(p => p.id === order[0]) + 1} / ${live.length}`
}
deckEl.addEventListener('deck:change', e => {
  const id = e.detail.top.dataset.id
  if (id === order[1]) order.push(order.shift())
  else if (id === order[order.length - 1]) order.unshift(order.pop())
  syncIndex(); ping(NOTE[id] || 740, .02)
})
syncIndex()
$$('#index button').forEach(b => b.addEventListener('click', () => {
  const id = b.closest('li').dataset.id
  let steps = order.indexOf(id)
  const go = () => { if (steps-- > 0) { deck.next(); setTimeout(go, reduce ? 0 : 140) } }
  go()
}))
$('#next').addEventListener('click', () => deck.next())
$('#prev').addEventListener('click', () => deck.prev())
$('#flip').addEventListener('click', () => deck.flip())
// a specular sheen follows the pointer on the top plate
deckEl.addEventListener('pointermove', e => {
  const c = deck.top, r = c.getBoundingClientRect()
  c.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%')
  c.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%')
})

/* retired plates */
$('#plates').innerHTML = retired.map(p => `
  <li class="echo-block"><div class="plate" tabindex="0" role="group" aria-label="${esc(p.name)}, retired. ${esc(p.line)}">
    <img src="assets/retired/${p.id}.svg" alt="" width="400" height="400" loading="lazy" decoding="async">
    <div class="over" aria-hidden="true"><i>since ${p.since}${p.figure ? ` &middot; ${esc(p.figure.value)} ${esc(p.figure.label)}` : ''}</i><b>${esc(p.name)}</b><span>${esc(p.line)}</span></div>
  </div></li>`).join('')

/* north */
$('#dayjob').innerHTML = content.dayJob.map((d, i) => `<li><i>${String(i + 1).padStart(2, '0')}</i><span>${esc(d)}</span></li>`).join('')
$$('[data-lens]').forEach(el => lens(el, { radius: 140 }))
dispersion()

/* magnetic chips: the label leans toward the pointer and springs back */
$$('.mag, .copy, .reboot').forEach(b => {
  const s = b.firstElementChild
  if (!s || reduce) return
  b.addEventListener('pointermove', e => {
    const r = b.getBoundingClientRect()
    s.style.transform = `translate(${((e.clientX - r.left) / r.width - .5) * 8}px, ${((e.clientY - r.top) / r.height - .5) * 6}px)`
  })
  b.addEventListener('pointerleave', () => { s.style.transform = '' })
})

/* stone: three.js loads only when the section comes near */
const stoneEl = $('#stone')
new IntersectionObserver(async ([en], io) => {
  if (!en.isIntersecting) return
  io.disconnect()
  try {
    const { mountStone } = await import('./assets/interactive/stone.js')
    await mountStone($('.stone-stage', stoneEl), { src: new URL('./assets/interactive/stone.glb', import.meta.url) })
    stoneEl.classList.add('is-live')
  } catch (e) { stoneEl.querySelector('.dim').textContent = 'a stone, resting' }
}, { rootMargin: '400px' }).observe(stoneEl)

/* reboot */
$('#reboot').addEventListener('click', () => {
  try { sessionStorage.removeItem('d39-booted') } catch (e) {}
  location.href = location.pathname
})

/* smooth scroll + anchor links */
let lenis = null
smoothScroll().then(l => { lenis = l }).catch(() => {})
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const t = $(a.getAttribute('href')); if (!t) return
  if (lenis) { e.preventDefault(); lenis.scrollTo(t, { offset: a.getAttribute('href') === '#top' ? 0 : -40 }) }
}))

boot()
