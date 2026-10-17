// Clear Noon — albretsen.no (design 65)
import { content } from '../../_shared/content.js'
import { createFeed } from '../../_shared/feed.js'
import { noonDissolve, reliefLens, roadDraw, condensedRise } from '../assets/motion.js'

const $ = (s, el = document) => el.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/* ---------------------------------------------------------------- hero */
const name = $('.name-text')
condensedRise(name)
$('.name').classList.add('ready')
new MutationObserver(() => { if (name.classList.contains('is-in')) $('.rule--hero').classList.add('is-in') })
  .observe(name, { attributes: true, attributeFilter: ['class'] })

const frames = $('#frames')
const cap = $('#frame-cap')
const wide = matchMedia('(min-width: 701px)')
function hydrateFrames() {
  frames.querySelectorAll('.later [data-srcset]').forEach((s) => { s.srcset = s.dataset.srcset; s.removeAttribute('data-srcset') })
  frames.querySelectorAll('.later img[data-src]').forEach((i) => { i.src = i.dataset.src; i.removeAttribute('data-src') })
}
let stopDissolve = null
function startDissolve() {
  if (stopDissolve || !wide.matches || reduce) return
  hydrateFrames()
  stopDissolve = noonDissolve(frames, { hold: 7000, dissolve: 2400 })
  new MutationObserver(() => {
    const on = frames.querySelector(':scope > .is-on')
    if (!on || cap.textContent === on.dataset.caption) return
    cap.style.opacity = 0
    setTimeout(() => { cap.textContent = on.dataset.caption; cap.style.opacity = '' }, 900)
  }).observe(frames, { subtree: true, attributes: true, attributeFilter: ['class'] })
}
if (document.readyState === 'complete') setTimeout(startDissolve, 1500)
else addEventListener('load', () => setTimeout(startDissolve, 1500), { once: true })
wide.addEventListener('change', startDissolve)

// copy the MCP line
const cmd = $('.cmd-line')
cmd.addEventListener('click', async () => {
  const text = cmd.dataset.copy
  try { await navigator.clipboard.writeText(text) } catch {
    const t = Object.assign(document.createElement('textarea'), { value: text }); document.body.append(t); t.select(); document.execCommand('copy'); t.remove()
  }
  cmd.classList.add('is-copied'); $('#cmd-status').textContent = 'Command copied to the clipboard.'
  clearTimeout(cmd._t); cmd._t = setTimeout(() => { cmd.classList.remove('is-copied'); $('#cmd-status').textContent = '' }, 2200)
})

// live feed: one line at a time, dissolving
const feed = createFeed()
const stack = $('#now')
function eventHTML(e) {
  const tail = e.ms ? `${e.ms} ms` : e.country || e.city || (e.sha ? e.sha : '')
  return `<b>${esc(e.label)}</b> &nbsp;${esc(e.text)}${tail ? ` &nbsp;<i>${esc(tail)}</i>` : ''}`
}
let lastShown = 0
function show(e) {
  const now = performance.now()
  if (now - lastShown < 2600) return // never faster than the eye can settle
  lastShown = now
  const item = document.createElement('span'); item.className = 'now-item'; item.innerHTML = eventHTML(e)
  const prev = stack.querySelector('.is-on')
  stack.append(item)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    item.classList.add('is-on')
    if (prev) { prev.classList.remove('is-on'); prev.classList.add('is-gone'); setTimeout(() => prev.remove(), 1800) }
  }))
}
const first = feed.recent(1)[0]
if (first) { stack.innerHTML = `<span class="now-item is-on">${eventHTML(first)}</span>`; lastShown = performance.now() }
feed.subscribe(show)

/* ---------------------------------------------------------------- products */
const arrow = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 11 L11 3 M5 3 H11 V9" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>'
const live = content.products.filter((p) => p.status !== 'retired')
const statusWord = { live: 'Live', building: 'Building', paused: 'Paused' }
$('#street').innerHTML = live.map((p) => `
  <li class="house-card" data-id="${p.id}">
    <a class="house-link" href="${p.url}" rel="noopener">
      <div class="house">
        <span class="status" data-s="${p.status}">${statusWord[p.status]}</span>
        <img src="assets/products/house-${p.id}-800.webp" width="640" height="800" alt="${esc(p.name)}: a painted wooden house with its logo on an enamel sign" loading="lazy" decoding="async">
      </div>
      <div class="house-meta">
        <h3 class="house-name">${esc(p.name)}</h3>
        <span class="house-since">${p.since}</span>
        <p class="house-line">${esc(p.line)}</p>
        <div class="figure"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></div>
        <ul class="facts">${(p.facts || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        <span class="visit">${esc(p.url.replace('https://', ''))} ${arrow}</span>
      </div>
    </a>
  </li>`).join('')

// swap the raster houses for the live SVGs (Window Light) once the street is near
let housesLoaded = false
function loadHouses() {
  if (housesLoaded) return; housesLoaded = true
  document.querySelectorAll('.house-card').forEach(async (card) => {
    const id = card.dataset.id
    try {
      const txt = await (await fetch(`assets/products/house-${id}.svg`)).text()
      // namespace ids so several inline SVGs never collide
      const pre = `h-${id}-`
      const out = txt
        .replace(/id="([^"]+)"/g, (_, a) => `id="${pre}${a}"`)
        .replace(/url\(#([^)]+)\)/g, (_, a) => `url(#${pre}${a})`)
        .replace(/href="#([^"]+)"/g, (_, a) => `href="#${pre}${a}"`)
      const tpl = document.createElement('template'); tpl.innerHTML = out.trim()
      const svg = tpl.content.querySelector('svg')
      svg.removeAttribute('width'); svg.removeAttribute('height')
      svg.setAttribute('preserveAspectRatio', 'xMidYMid slice'); svg.setAttribute('aria-hidden', 'true')
      const img = card.querySelector('.house img')
      svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', img.alt)
      img.replaceWith(svg)
    } catch { /* the raster stays */ }
  })
}
new IntersectionObserver((es, io) => { if (es.some((e) => e.isIntersecting)) { loadHouses(); io.disconnect() } }, { rootMargin: '600px 0px' }).observe($('#street'))

// retired plates
$('#plates').innerHTML = content.products.filter((p) => p.status === 'retired').map((p) => `
  <li class="plate" tabindex="0" aria-label="${esc(p.name)}, ${p.since}, retired. ${esc(p.line)}">
    <img src="assets/products/retired/${p.id}.svg" width="300" height="180" alt="" loading="lazy" decoding="async">
    <p>${esc(p.line)}${p.figure ? ` ${esc(p.figure.value)} ${esc(p.figure.label)}.` : ''}</p>
  </li>`).join('')

/* ---------------------------------------------------------------- the road */
const stage = $('#stage')
const tag = $('#tag')
// milestone dots in the 1000 × 1000 relief frame (from road-line.svg)
const DOTS = [[451.9, 233.0], [518.4, 290.0], [574.3, 390.3], [594.5, 487.5], [671.1, 556.5], [739.7, 631.7], [861.5, 657.1], [972.8, 670.3]]
const stones = await fetch('assets/interactive/milestones.json').then((r) => r.json()).catch(() => [])
$('#stops').innerHTML = stones.map((s, i) => `
  <li><button type="button" data-i="${i}" aria-describedby="stop-n-${i}">
    <span class="yr">${s.year ?? 'Next'}</span><span class="tt">${esc(s.title)}</span>
    <span class="nt" id="stop-n-${i}">${esc(s.note)}</span>
  </button></li>`).join('')
$('#posts').innerHTML = stones.map((s, i) => {
  const [x, y] = DOTS[i] || [500, 500]
  return `<button class="post" type="button" tabindex="-1" aria-hidden="true" data-i="${i}" style="left:${x / 10}%;top:${y / 10}%;--i:${i}"></button>`
}).join('')

let relief = null
let active = -1
function setActive(i) {
  active = i
  document.querySelectorAll('.post, .stops button').forEach((b) => b.classList.toggle('is-on', +b.dataset.i === i))
  if (i < 0) { tag.classList.remove('on'); return }
  const s = stones[i]
  tag.querySelector('b').textContent = s.year ?? 'Next'
  tag.querySelector('span').textContent = s.title + '. ' + s.note
  let x, y
  if (relief) {
    relief.setProgress(s.at); const r = $('#drive input'); r.value = s.at
    const p = relief.project(s); x = p.x; y = p.y
  } else {
    const [dx, dy] = DOTS[i]; const b = stage.getBoundingClientRect(); x = dx / 1000 * b.width; y = dy / 1000 * b.height
  }
  const w = stage.clientWidth
  tag.style.left = Math.min(w - 140, Math.max(140, x)) + 'px'; tag.style.top = Math.max(110, y) + 'px'
  tag.classList.add('on')
}
document.querySelectorAll('.stops button').forEach((b) => {
  b.addEventListener('mouseenter', () => setActive(+b.dataset.i))
  b.addEventListener('focus', () => setActive(+b.dataset.i))
  b.addEventListener('click', () => setActive(+b.dataset.i))
})
$('#stops').addEventListener('mouseleave', () => { if (!$('#stops').contains(document.activeElement)) setActive(-1) })
$('#stops').addEventListener('focusout', (e) => { if (!$('#stops').contains(e.relatedTarget)) setActive(-1) })
document.querySelectorAll('.post').forEach((b) => {
  b.addEventListener('mouseenter', () => setActive(+b.dataset.i))
  b.addEventListener('mouseleave', () => setActive(-1))
})

reliefLens(stage)
const svg = $('.road-svg')
roadDraw(svg)
new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { stage.classList.add('road-shown'); svg.classList.add('is-drawn'); io.disconnect() } }, { threshold: 0.35 }).observe(stage)

// the live plaster model: offered on large screens with a fine pointer and WebGL
const lift = $('#lift'), drive = $('#drive'), range = $('#drive input')
const canGL = (() => { try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false } })()
if (canGL && matchMedia('(pointer: fine) and (min-width: 1000px)').matches) lift.hidden = false
let mounting = false
lift.addEventListener('click', async () => {
  if (stage.classList.contains('is-3d')) {
    stage.classList.remove('is-3d'); drive.hidden = true; lift.textContent = 'Lift the model into 3D'; setActive(-1); return
  }
  if (!relief && !mounting) {
    mounting = true; lift.textContent = 'Lifting…'
    try {
      const { mountRelief } = await import('../assets/interactive/relief3d.js')
      relief = await mountRelief($('#model'), {
        base: new URL('../assets/interactive/', import.meta.url).href, sun: 0.42, progress: 0,
        onMilestone: (m) => { if (!m) { setActive(-1); return } setActive(stones.findIndex((s) => s.at === m.at)) },
      })
    } catch { lift.hidden = true; mounting = false; return }
    mounting = false
  }
  stage.classList.add('is-3d'); drive.hidden = false; lift.textContent = 'Back to the relief'
})
range.addEventListener('input', () => { relief && relief.setProgress(+range.value); setActive(-1) })
// scroll-driven drive while the model is up
const roadSec = $('#road')
addEventListener('scroll', () => {
  if (!relief || !stage.classList.contains('is-3d') || reduce) return
  const r = roadSec.getBoundingClientRect()
  const t = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / (r.height - innerHeight * 0.4)))
  range.value = t; relief.setProgress(t)
}, { passive: true })

// review hook: ?demo lifts the model and lights the first house (for still captures)
if (new URLSearchParams(location.search).has('demo')) {
  loadHouses()
  setTimeout(() => { document.querySelector('.house-link')?.focus({ preventScroll: true }) }, 1200)
  if (!lift.hidden) lift.click()
  setTimeout(() => setActive(6), 4000)
}
