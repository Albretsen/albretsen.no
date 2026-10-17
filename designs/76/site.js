// Zinc & Granite: design 76.
// One page-wide idea: an arch cut in the paper opens onto a room; scrolling is one
// slow, unbroken walk through it to the window. A fanlight dial sets the hour of the light.
import { content } from '../_shared/content.js'
import { createFeed } from '../_shared/feed.js'
import { longDolly, shutters, italicTurn } from './assets/motion.js'
import { windowCursor } from './assets/cursor.js'

const $ = (s, r = document) => r.querySelector(s)
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const lerp = (a, b, k) => a + (b - a) * k
const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/* ------------------------------------------------------------ products */
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' }
const ACTIVE = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor']
const still = (id, ext) => `assets/product/${id}-600.${ext} 600w, assets/product/${id}-1200.${ext} 1200w`
$('#cards').innerHTML = ACTIVE.map((id) => {
  const p = content.products.find((x) => x.id === id)
  const domain = p.url.replace(/^https?:\/\//, '')
  const fig = p.figure ? `${p.figure.value} ${p.figure.label}` : ''
  return `<li class="card">
    <a class="fig" href="${p.url}" rel="noopener" aria-label="${esc(p.name)}, ${esc(domain)}">
      <div class="shutters"><picture>
        <source type="image/avif" srcset="${still(id, 'avif')}" sizes="(max-width: 560px) 92vw, (max-width: 1100px) 46vw, 24vw">
        <source type="image/webp" srcset="${still(id, 'webp')}" sizes="(max-width: 560px) 92vw, (max-width: 1100px) 46vw, 24vw">
        <img src="assets/product/${id}-600.jpg" srcset="${still(id, 'jpg')}" sizes="(max-width: 560px) 92vw, (max-width: 1100px) 46vw, 24vw" width="600" height="750" loading="lazy" decoding="async"
          alt="A cotton card standing on a stone sill: ${esc(p.name)}. ${esc(p.line)} ${esc(fig)}.">
      </picture></div>
    </a>
    <div class="meta">
      <div class="row"><h3>${esc(p.name)}</h3><span class="status ${p.status}">${STATUS[p.status]} · ${p.since}</span></div>
      <p class="facts">${(p.facts || []).map(esc).join(' · ')}</p>
      <a class="domain" href="${p.url}" rel="noopener">${esc(domain)}</a>
    </div>
  </li>`
}).join('')

const TILT = [-3, 2, -1.5, 2.5, -2, 1.5, -2.5]
$('#stamps').innerHTML = content.products.filter((p) => p.status === 'retired').map((p, i) => {
  const face = p.id === 'luma'
    ? `<div class="luma" data-luma></div>`
    : `<img src="assets/product/retired/${p.id}.svg" width="64" height="79" alt="" loading="lazy">`
  const short = p.name.split(/[,/]/)[0].trim()
  return `<li class="stamp" style="--tilt:${TILT[i % TILT.length]}deg" tabindex="0" title="${esc(p.line)}">
    <div class="face">${face}</div><span>${esc(short)}<small>${p.since}</small></span></li>`
}).join('')

// Luma's real monogram, inlined so its letter can take a face (the file leaves the font to the page)
fetch('../_shared/products/luma/luma-monogram.svg').then((r) => r.text()).then((svg) => {
  const box = $('[data-luma]'); if (!box || !/^<svg[\s\S]*<\/svg>\s*$/.test(svg.trim())) return
  box.innerHTML = svg.replace(/<script[\s\S]*?<\/script>/gi, '').replace('width="128" height="128"', 'width="48" height="48" aria-hidden="true"')
}).catch(() => {})

const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
$('#posts').innerHTML = content.posts.map((p) => `<li><a href="blog/${p.slug}"><span class="t">${esc(p.title)}</span><time datetime="${p.date}">${fmtDate(p.date)}</time></a></li>`).join('')

italicTurn()
shutters()

/* ------------------------------------------------------------ live feed */
{
  const feed = createFeed()
  const el = $('#feed'), meta = $('#feed-meta')
  const ago = (t) => { const s = Math.max(1, Math.round((Date.now() - t) / 1000)); return s < 60 ? `${s} s ago` : `${Math.round(s / 60)} min ago` }
  const detail = (e) => [e.label, e.ms && `${e.ms} ms`, e.country, e.city, e.sha && `#${e.sha}`].filter(Boolean).join(' · ')
  let last = null
  const show = (e, instant) => {
    last = e
    const put = () => { el.textContent = e.text.charAt(0).toUpperCase() + e.text.slice(1) + '.'; meta.textContent = `${detail(e)} · ${ago(e.time)}`; el.classList.remove('is-out') }
    if (instant || reduce) return put()
    el.classList.add('is-out'); setTimeout(put, 450)
  }
  show(feed.recent(1)[0], true)
  // calm: at most one change every 5 seconds, however busy the products are
  let queued = null, waiting = false
  feed.subscribe((e) => {
    queued = e; if (waiting) return
    waiting = true; show(queued); queued = null
    setTimeout(() => { waiting = false; if (queued) show(queued), (queued = null) }, 5000)
  })
  setInterval(() => last && (meta.textContent = `${detail(last)} · ${ago(last.time)}`), 10000)
}

/* ------------------------------------------------------------ the hero walk */
const hero = $('#hero'), stage = $('.stage'), arch = $('#arch'), scene = $('#scene')
const intro = $('.intro'), flanks = [...document.querySelectorAll('.flank')], cue = $('#cue'), dial = $('#dial'), sill = $('#sill')
const endView = $('#end-view'), canvas = $('#room')
// where the room's own window sits in each poster (normalised image coordinates)
const FRAMES = {
  land: { ar: 16 / 9, x0: 0.4, x1: 0.6, top: 0.11, floor: 0.77 },
  port: { ar: 800 / 1067, x0: 0.344, x1: 0.656, top: 0.242, floor: 0.677 },
}
let geo = null, live = null
function measure() {
  const W = stage.clientWidth, H = stage.clientHeight
  const f = innerWidth < 700 ? FRAMES.port : FRAMES.land
  const probe = document.createElement('div'); probe.style.cssText = 'position:absolute;width:var(--arch-w);height:var(--arch-h);visibility:hidden'
  stage.appendChild(probe); const A = probe.offsetWidth, AH = probe.offsetHeight; probe.remove()
  let iw, ih; if (W / H > f.ar) { iw = W; ih = W / f.ar } else { ih = H; iw = H * f.ar }
  const ix = (W - iw) / 2, iy = (H - ih) / 2
  const fw = (f.x1 - f.x0) * iw, fcx = ix + ((f.x0 + f.x1) / 2) * iw
  const ftop = iy + f.top * ih, ffloor = iy + f.floor * ih
  // at rest the room's window stands inside the page's arch, concentric with it
  const pad = AH * 0.045
  // ...but never so small that the paper shows above the room's ceiling
  const s0 = clamp(Math.max((0.66 * A) / fw, (AH - pad) / (ffloor - iy)), 0.4, 1.6)
  const t0 = { x: W / 2 - s0 * fcx, y: H - pad - s0 * ffloor }
  // the walk (still fallback): the camera's eye travels to the window
  const focus = { x: fcx, y: lerp(ftop, ffloor, 0.55) }
  const zmax = clamp((W * 0.9) / fw, 1.6, 2.6)
  geo = { W, H, s0, t0, focus, zmax }
}

let e = 0, d = 0, shownKey = ''
function apply(P) {
  if (!geo) measure()
  const eRaw = clamp(P / 0.3), E = easeIO(eRaw)
  e = eRaw; d = clamp((P - 0.33) / 0.6)
  arch.style.setProperty('--e', E.toFixed(4))
  const k = 1 - E
  const fade = clamp(1 - eRaw * 1.7)
  intro.style.opacity = fade; intro.style.transform = `translateY(${(-eRaw * 48).toFixed(1)}px)`
  flanks.forEach((f) => { f.style.opacity = fade; f.style.transform = `translateY(${(-eRaw * 28).toFixed(1)}px)` })
  cue.style.opacity = clamp(1 - eRaw * 5)
  dial.classList.toggle('on-image', eRaw > 0.42)
  // scene: arch at rest -> full bleed -> (still fallback) dolly to the window
  let s = lerp(geo.s0, 1, E), tx = geo.t0.x * k, ty = geo.t0.y * k
  if (!live) {
    const D = easeIO(d), S = lerp(1, geo.zmax, D)
    s *= S; tx += geo.focus.x * (1 - S); ty += geo.focus.y * (1 - S)
    const o = clamp((d - 0.68) / 0.3)
    endView.style.opacity = easeIO(o).toFixed(3)
    endView.style.transform = `scale(${lerp(1.12, 1, easeIO(o)).toFixed(4)})`
  } else {
    live.walk = d
  }
  const key = `${s.toFixed(4)}|${tx.toFixed(1)}|${ty.toFixed(1)}`
  if (key !== shownKey) { scene.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${s.toFixed(4)})`; shownKey = key }
  sill.classList.toggle('is-shown', d > 0.86)
  if (P > 0.12) loadEndView()
}

let endLoaded = false
function loadEndView() {
  if (endLoaded || live) return
  endLoaded = true
  const set = (ext) => ['828', '1280', '1920'].map((w) => `assets/img/balcony-morning-${w}.${ext} ${w}w`).join(', ')
  endView.innerHTML = `<source type="image/avif" srcset="${set('avif')}" sizes="100vw"><source type="image/webp" srcset="${set('webp')}" sizes="100vw"><img src="assets/img/balcony-morning-1280.jpg" width="1280" height="720" alt="" decoding="async">`
}

addEventListener('resize', () => { measure(); shownKey = ''; live && live.fit() })
measure()
// review hooks for headless screenshots: ?at=0..1 freezes the walk there; ?skip=hero hides the hero
const Q = new URLSearchParams(location.search)
if (Q.get('skip') === 'hero') hero.style.display = 'none'
if (Q.has('at')) { const P = +Q.get('at'); const hold = () => { apply(P); requestAnimationFrame(hold) }; hold() }
else if (reduce) apply(0)
else longDolly(hero, { onProgress: apply, damping: 0.07 })

// Keyboard: focusing the copy button walks you to the window.
$('#copy').addEventListener('focus', () => {
  if (reduce) return
  const end = hero.offsetTop + hero.offsetHeight - innerHeight
  if (scrollY < end - 4) scrollTo({ top: end, behavior: 'smooth' })
})
$('#copy').addEventListener('click', async (ev) => {
  const b = ev.currentTarget
  try { await navigator.clipboard.writeText(content.mcpCommand) } catch { const r = document.createRange(); r.selectNodeContents($('#cmd')); getSelection().removeAllRanges(); getSelection().addRange(r) }
  b.classList.add('done'); b.firstElementChild.textContent = 'Copied'
  setTimeout(() => { b.classList.remove('done'); b.firstElementChild.textContent = 'Copy' }, 2200)
})

/* ------------------------------------------------------------ the day dial */
const POSTER_T = 0.88
const clockOf = (t) => { const m = Math.round((6.5 + t * 13) * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }
const localT = () => { const n = new Date(), h = n.getHours() + n.getMinutes() / 60; return h < 6.5 || h > 19.5 ? POSTER_T : clamp((h - 6.5) / 13) }
const mixHex = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})` }
const sunColour = (t) => (t < 0.5 ? mixHex('#c9d6dd', '#fbf6ea', t * 2) : mixHex('#fbf6ea', '#f0b98e', (t - 0.5) * 2))
let dayT = POSTER_T
function setDay(t, { fromUser = false } = {}) {
  dayT = clamp(t)
  const a = Math.PI * (1 - dayT), x = 60 + 52 * Math.cos(a), y = 60 - 52 * Math.sin(a)
  const sun = $('#dial-sun'); sun.setAttribute('cx', x.toFixed(2)); sun.setAttribute('cy', y.toFixed(2))
  const c = sunColour(dayT); document.documentElement.style.setProperty('--sun', c)
  $('#clock').textContent = clockOf(dayT)
  const hit = $('#dial-hit'); hit.setAttribute('aria-valuenow', Math.round(dayT * 100)); hit.setAttribute('aria-valuetext', clockOf(dayT))
  if (live) live.time = dayT
  else {
    // still fallback: grade the evening poster toward the chosen hour
    const cool = clamp((POSTER_T - dayT) / POSTER_T)
    $('.grade').style.setProperty('--grade', cool > 0 ? `linear-gradient(rgba(${Math.round(lerp(230, 150, cool))},${Math.round(lerp(220, 190, cool))},${Math.round(lerp(210, 215, cool))},${(cool * 0.85).toFixed(2)}), rgba(200,214,222,${(cool * 0.6).toFixed(2)}))` : 'transparent')
  }
  if (fromUser) $('#dial-label').textContent = 'The light'
}
setDay(POSTER_T)
{
  const hit = $('#dial-hit'), svg = $('#dial svg')
  const fromPointer = (ev) => {
    const r = svg.getBoundingClientRect(), sx = r.width / 120
    const cx = r.left + 60 * sx, cy = r.top + 60 * sx
    const a = Math.atan2(Math.max(0, cy - ev.clientY), ev.clientX - cx)
    setDay(1 - a / Math.PI, { fromUser: true })
  }
  hit.addEventListener('pointerdown', (ev) => { hit.setPointerCapture(ev.pointerId); dial.classList.add('is-drag'); fromPointer(ev) })
  hit.addEventListener('pointermove', (ev) => { if (hit.hasPointerCapture(ev.pointerId)) fromPointer(ev) })
  const up = () => dial.classList.remove('is-drag')
  hit.addEventListener('pointerup', up); hit.addEventListener('pointercancel', up)
  hit.addEventListener('keydown', (ev) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 4, PageDown: -4 }[ev.key]
    if (step) { setDay(dayT + step / 26, { fromUser: true }); ev.preventDefault() }
    if (ev.key === 'Home') { setDay(0, { fromUser: true }); ev.preventDefault() }
    if (ev.key === 'End') { setDay(1, { fromUser: true }); ev.preventDefault() }
  })
}

/* ------------------------------------------------------------ the live room (after first paint) */
function canLive() {
  if (reduce || innerWidth < 900 || navigator.connection?.saveData) return false
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2')) } catch { return false }
}
async function startRoom() {
  if (!canLive()) return
  const { createRoom } = await import('./assets/room/room.js')
  const room = await createRoom(canvas, { quality: 'live' })
  const state = { time: dayT, walk: d, ct: dayT, cw: d, shown: '' }
  live = {
    set time(v) { state.time = v }, set walk(v) { state.walk = v },
    fit() { room.resize(stage.clientWidth, stage.clientHeight); state.shown = '' },
  }
  live.fit()
  endView.style.opacity = 0
  // the room opens at your hour
  const lt = localT(); setDay(lt); $('#dial-label').textContent = 'Your hour'
  $('.grade').style.setProperty('--grade', 'transparent')
  shownKey = ''
  const frame = () => {
    state.ct += (state.time - state.ct) * 0.06
    state.cw += (state.walk - state.cw) * 0.12
    const key = `${state.ct.toFixed(4)}|${state.cw.toFixed(4)}`
    if (key !== state.shown && !document.hidden) {
      room.set({ time: state.ct, progress: state.cw }); room.render(); state.shown = key
      if (!canvas.classList.contains('is-live')) canvas.classList.add('is-live')
    }
    requestAnimationFrame(frame)
  }
  frame()
}
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300))
addEventListener('load', () => idle(() => startRoom().catch(() => { live = null }), { timeout: 1500 }), { once: true })

/* ------------------------------------------------------------ the window cursor */
if (matchMedia('(pointer: fine)').matches) {
  windowCursor({ color: '#1d2226', light: '#f1efe9' })
  const c = document.body.lastElementChild
  if (c && c.getAttribute('aria-hidden') === 'true') c.style.filter = 'drop-shadow(0 0 1.2px rgba(241,239,233,.95)) drop-shadow(0 1px 6px rgba(29,34,38,.18))'
}
