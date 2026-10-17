// Design 84 · Orbit Issue — homepage behaviour.
// 1. Edition follows the sun over Norway (EDITION WIPE view transition to switch by hand)
// 2. The cover is a real hinged cover: drag it open on a spring, or press "Open the issue"
// 3. Inside the cover: the live three.js orbit (lazy)
// 4. Products as a throwable, flippable stack; the feature text swaps with a view transition
import { content } from '../../_shared/content.js'
import { createFeed } from '../../_shared/feed.js'
import { osloSun, EDITIONS } from '../assets/js/oslo-sun.js'
import { createStack } from '../assets/js/cover-stack.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const root = document.documentElement
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const hasVT = !!document.startViewTransition && !reduce

/* ------------------------------------------------------------------ edition */
const sun = osloSun()
let edition = root.dataset.edition
const ED_NO = { nocturne: 'N°4', dawn: 'N°1', zenith: 'N°2', dusk: 'N°3' }
const ED_NAME = { nocturne: 'Nocturne', dawn: 'Dawn', zenith: 'Orbit', dusk: 'Dusk' }

function sunY(ed) {
  const forced = ed !== sun.edition
  const DEF = { nocturne: .25, dawn: .8, zenith: .2, dusk: .85 }
  if (forced || ed === 'nocturne') return DEF[ed]
  return 1 - Math.min(1, Math.max(0, (sun.altitude + 20) / 75))
}

function labels() {
  $$('[data-ed-no]').forEach(el => { el.textContent = ED_NO[edition] })
  $$('[data-ed-label]').forEach(el => { el.textContent = EDITIONS[edition].label })
  $$('.editions button').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.ed === edition))
    b.classList.toggle('now', b.dataset.ed === sun.edition)
    if (b.dataset.ed === sun.edition) b.title = 'The sun over Norway right now'
  })
  const deg = Math.abs(sun.altitude).toFixed(1)
  const where = sun.altitude < 0 ? `${deg}° below the horizon` : `${deg}° above the horizon`
  $('#sunline').textContent = edition === sun.edition
    ? `Norway ${sun.time} · sun ${where} · this edition follows it`
    : `You’re reading ${ED_NAME[edition]}. In Norway it is ${sun.time}, ${ED_NAME[sun.edition].toLowerCase()}.`
  root.style.setProperty('--sun-y', sunY(edition).toFixed(3))
}
labels()

// swap one URL's edition, keeping whatever format/width the browser picked
const swapEd = (url, ed) => url.replace(/(cover|stage|spread|orbit|sticker)-(nocturne|dawn|zenith|dusk)/g, `$1-${ed}`)

function setCoverSources(ed) {
  $$('.cover [data-src]').forEach(el => {
    if (el.srcset) el.srcset = swapEd(el.srcset, ed)
    if (el.tagName === 'IMG' && el.getAttribute('src')) el.src = swapEd(el.getAttribute('src'), ed)
  })
  const st = $('[data-sticker]'); st.src = swapEd(st.getAttribute('src'), ed)
  $$('.inside img[src]').forEach(img => { img.src = swapEd(img.getAttribute('src'), ed) })
}

async function preload(ed) {
  const urls = $$('.cover picture img, .inside img[src]').map(i => i.currentSrc || i.src).filter(Boolean).map(u => swapEd(u, ed))
  await Promise.all(urls.map(u => { const i = new Image(); i.src = u; return i.decode().catch(() => {}) }))
}

function replayMast() {
  $$('#mast span').forEach(s => { s.style.animation = 'none'; void s.offsetWidth; s.style.animation = '' })
}

async function switchTo(ed, originEl) {
  if (ed === edition) return
  await preload(ed)
  const apply = () => {
    edition = ed; root.dataset.edition = ed
    setCoverSources(ed); labels(); orbit?.setEdition(ed); replayMast()
  }
  if (!hasVT) return apply()
  const r = (originEl || $('#mast')).getBoundingClientRect()
  root.style.setProperty('--wipe-x', `${((r.left + r.width / 2) / innerWidth) * 100}%`)
  root.style.setProperty('--wipe-y', `${((r.top + r.height / 2) / innerHeight) * 100}%`)
  root.classList.add('edition-wipe')
  const t = document.startViewTransition(apply)
  t.finished.finally(() => root.classList.remove('edition-wipe'))
}
$$('.editions button').forEach(b => b.addEventListener('click', () => switchTo(b.dataset.ed, $('.sticker'))))

/* ------------------------------------------------------------- the cover */
const cover = $('#cover'), inside = $('#inside'), openBtn = $('#open')
const A = { x: 0, v: 0, t: 0, k: 150, c: 21 } // angle spring, degrees (0 closed, -180 open)
let isOpen = false, raf = 0, last = 0, drag = null

function renderCover() {
  cover.style.transform = `rotateY(${A.x.toFixed(2)}deg)`
  cover.style.setProperty('--lift', Math.min(1, -A.x / 120).toFixed(3))
}
function tick(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60); last = now
  if (!drag) {
    if (reduce) { A.x = A.t; A.v = 0 }
    else { const a = -A.k * (A.x - A.t) - A.c * A.v; A.v += a * dt; A.x += A.v * dt }
  }
  // the cover can't pass through the page
  if (A.x > 0) { A.x = 0; A.v = Math.min(0, A.v) * -.3 }
  if (A.x < -180) { A.x = -180; A.v = Math.max(0, A.v) * -.3 }
  renderCover()
  const resting = Math.abs(A.x - A.t) < .05 && Math.abs(A.v) < .05
  raf = (!resting || drag) ? requestAnimationFrame(tick) : 0
}
const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) } }

function setOpen(open, fling = 0) {
  isOpen = open
  A.t = open ? -180 : 0
  A.v += fling
  root.classList.toggle('is-open', open)
  openBtn.setAttribute('aria-expanded', String(open))
  inside.inert = !open
  cover.querySelector('.front').inert = open
  if (open) loadInside(2)
  kick()
}
openBtn.addEventListener('click', () => setOpen(!isOpen, isOpen ? 0 : -160))
addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) { setOpen(false); openBtn.focus() } })

cover.addEventListener('pointerdown', e => {
  if (e.button !== 0 || e.target.closest('a, button')) return
  drag = { x0: e.clientX, a0: A.x, lx: e.clientX, lt: performance.now(), v: 0, moved: false, w: cover.offsetWidth }
  cover.setPointerCapture(e.pointerId); cover.classList.add('dragging')
  loadInside(2)
  kick()
})
cover.addEventListener('pointermove', e => {
  if (!drag) return
  const dx = e.clientX - drag.x0
  if (Math.abs(dx) > 5) drag.moved = true
  const now = performance.now()
  // degrees per second, from the pointer's horizontal speed
  drag.v = ((e.clientX - drag.lx) / drag.w) * 180 / Math.max(.001, (now - drag.lt) / 1000)
  drag.lx = e.clientX; drag.lt = now
  // dragging left lifts the cover; a little resistance at both ends
  let a = drag.a0 + (dx / drag.w) * 180 * 1.15
  if (a > 0) a = a * .25
  if (a < -180) a = -180 + (a + 180) * .25
  A.x = a; A.v = 0
})
const endDrag = () => {
  if (!drag) return
  const { moved, v } = drag; drag = null; cover.classList.remove('dragging')
  if (!moved) return setOpen(!isOpen, isOpen ? 0 : -120)
  const open = v < -260 ? true : v > 260 ? false : A.x < -75
  A.v = v * .6
  setOpen(open)
}
cover.addEventListener('pointerup', endDrag)
cover.addEventListener('pointercancel', endDrag)
// a small peek on hover (mouse only): the cover lifts a few degrees
cover.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !isOpen && !drag) { A.t = -9; kick(); loadInside(1) } })
cover.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !isOpen && !drag) { A.t = 0; kick() } })
openBtn.addEventListener('pointerenter', () => loadInside(1))
openBtn.addEventListener('focus', () => loadInside(1))

/* ------------------------------------------------------- inside the cover */
let insideImgs = false, orbit = null, orbitLoading = null
function loadInside(level) { // 0 images only, 1 3D on fine pointers, 2 3D always
  if (!insideImgs) {
    insideImgs = true
    const avif = /\.avif/.test($('.cover .sky img').currentSrc || '')
    const sky = $('.inside .st-sky'), land = $('.inside .st-land')
    if (avif) { sky.src = `assets/hero/stage-${edition}-sky-2400.avif`; land.src = `assets/hero/stage-${edition}-land-2400.avif` }
    else { sky.src = `assets/hero/spread-${edition}-1400.webp`; land.remove(); $('#orbit').remove() }
  }
  if (level === 0 || (level === 1 && !matchMedia('(pointer: fine)').matches)) return
  if (orbit || orbitLoading || !$('#orbit')) return
  orbitLoading = import('../assets/3d/orbit.js')
    .then(m => m.mountOrbit($('#orbit'), { edition }))
    .then(o => { orbit = o; o.setEdition(edition) })
    .catch(() => { $('#orbit')?.remove() })
}

/* contents */
const live = content.products.filter(p => p.status !== 'retired')
$('#contents').innerHTML = live.map((p, i) => `
  <li><a href="#products" data-go="${i}"><span class="pg">${String(i * 2 + 4).padStart(2, '0')}</span><span class="t">${p.name}</span><span class="s">${p.line.replace(/\.$/, '')}</span></a></li>`).join('')

/* ------------------------------------------------------------- products */
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused' }
const host = u => u.replace(/^https?:\/\//, '')
$('#stack').innerHTML = live.map((p, i) => `
  <article class="issue" aria-label="${p.name}">
    <div class="face front">
      <picture>
        <source type="image/avif" srcset="assets/products/${p.id}-card-500.avif 500w, assets/products/${p.id}-card-1000.avif 1000w" sizes="(max-width: 860px) 90vw, 440px">
        <img src="assets/products/${p.id}-card-500.webp" srcset="assets/products/${p.id}-card-500.webp 500w, assets/products/${p.id}-card-1000.webp 1000w" sizes="(max-width: 860px) 90vw, 440px" width="500" height="625" alt="${p.name} logo rising like a sun over a painted fjord" loading="lazy" draggable="false">
      </picture>
      <span class="tag">Feature ${String(i + 1).padStart(2, '0')}</span>
    </div>
    <div class="face back">
      <div><p class="kicker">Fact sheet · ${String(i + 1).padStart(2, '0')}</p><h3>${p.name}</h3></div>
      <dl>
        <dt>Since</dt><dd>${p.since}</dd>
        <dt>Status</dt><dd>${STATUS[p.status]}</dd>
        ${p.figure ? `<dt>${p.figure.label}</dt><dd>${p.figure.value}</dd>` : ''}
        ${(p.facts || []).length ? `<dt>Notes</dt><dd>${p.facts.join(' · ')}</dd>` : ''}
      </dl>
      <span class="stamp">${host(p.url)}</span>
    </div>
  </article>`).join('')

function featureHTML(i) {
  const p = live[i]
  return `
    <p class="kicker"><span>Feature ${String(i + 1).padStart(2, '0')} / ${String(live.length).padStart(2, '0')}</span><span class="status" data-s="${p.status}">${STATUS[p.status]} · since ${p.since}</span></p>
    <h3>${p.name}</h3>
    <p class="fline">${p.line}</p>
    ${p.figure ? `<p class="fig"><b>${p.figure.value}</b><span>${p.figure.label}</span></p>` : ''}
    ${p.facts?.length ? `<ul>${p.facts.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}
    <a class="go" href="${p.url}" rel="noopener">${host(p.url)} <span aria-hidden="true">↗</span></a>`
}
const feature = $('#feature')
let shown = 0
feature.innerHTML = featureHTML(0)
function showFeature(i) {
  if (i === shown) return
  shown = i
  $('#count').textContent = `${i + 1} / ${live.length}`
  if (!hasVT) { feature.innerHTML = featureHTML(i); return }
  root.classList.add('vt-feature')
  const t = document.startViewTransition(() => { feature.innerHTML = featureHTML(i) })
  t.finished.finally(() => root.classList.remove('vt-feature'))
}
const stack = createStack($('#stack'), { onChange: showFeature })
$('#next').addEventListener('click', () => stack.next())
$('#prev').addEventListener('click', () => stack.prev())

$('#contents').addEventListener('click', e => {
  const a = e.target.closest('[data-go]'); if (!a) return
  e.preventDefault()
  const i = +a.dataset.go
  $('#products').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  let n = 0; while (stack.top !== i && n++ < live.length) stack.next()
})

/* back issues */
const retired = content.products.filter(p => p.status === 'retired')
$('#retired').innerHTML = retired.map(p => {
  const name = p.id === 'early-apps' ? 'Early apps' : p.id === 'joke-central' ? 'Joke Central' : p.name
  return `<li title="${p.name}: ${p.line}"><img src="assets/products/retired-${p.id}.webp" width="360" height="360" alt="" loading="lazy"><span class="n">${name}</span><span class="y">${p.since}</span></li>`
}).join('')

/* ------------------------------------------------------------- copy + feed */
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($(b.dataset.copy).textContent.trim()); b.textContent = 'Copied'; b.classList.add('done') }
  catch { b.textContent = 'Select it' }
  setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('done') }, 1800)
}))

const feed = createFeed()
const wire = $('#wire')
const fmt = e => [e.label, e.text, e.ms ? `${e.ms} ms` : e.country || e.city || (e.sha ? e.sha : '')].filter(Boolean).join(' · ')
const show = e => { wire.textContent = fmt(e); wire.classList.remove('in'); void wire.offsetWidth; wire.classList.add('in') }
const first = feed.recent(1)[0]; if (first) show(first)
feed.subscribe(show)

/* warm the inside images when the browser is idle */
;(window.requestIdleCallback || (f => setTimeout(f, 2500)))(() => loadInside(0), { timeout: 4000 })

// ?open opens the issue on load (handy for sharing the inside)
if (new URLSearchParams(location.search).has("open")) setOpen(true)

