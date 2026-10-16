// Afterimage — design 09. Everything on this page is still, except the feed.
import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { renderProducts } from './products.js'
import { MONO, cells } from './glyphs.js'

const $ = s => document.querySelector(s)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/* ---------- products: same markup as the baked HTML, re-rendered from content.js ---------- */
{
  const list = $('.plist')
  const t = document.createElement('template')
  t.innerHTML = renderProducts(content.products)
  if (list && t.innerHTML !== list.innerHTML) list.replaceChildren(t.content)
}

/* ---------- sound: off until asked. Square-wave blips through a short echo. ---------- */
const sound = (() => {
  let ac = null, out = null, on = false
  const btn = $('.snd')
  function init() {
    ac = new (window.AudioContext || window.webkitAudioContext)()
    out = ac.createGain(); out.gain.value = 0.6
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400
    const delay = ac.createDelay(1); delay.delayTime.value = 0.21
    const fb = ac.createGain(); fb.gain.value = 0.28
    const wet = ac.createGain(); wet.gain.value = 0.35
    out.connect(lp); lp.connect(ac.destination)
    lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ac.destination)
  }
  function blip(freq, { dur = 0.07, vol = 0.05, type = 'square', at = 0 } = {}) {
    if (!on || !ac) return
    const t = ac.currentTime + at
    const o = ac.createOscillator(), g = ac.createGain()
    o.type = type; o.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02)
  }
  btn?.addEventListener('click', () => {
    on = !on
    if (on) { if (!ac) init(); ac.resume() }
    btn.setAttribute('aria-pressed', String(on))
    btn.querySelector('span').textContent = on ? 'on' : 'off'
    if (on) { blip(440, { vol: 0.04 }); blip(659.25, { vol: 0.03, at: 0.09 }) }
  })
  // A major pentatonic. The monogram is an A; so is the tuning.
  const NOTE = { 'fun-libs': 440, 'mcp-emails': 659.25, toolrails: 554.37, 'albretsen.no': 880 }
  return {
    event: e => { if (!document.hidden) blip(NOTE[e.product] || 440, { vol: 0.035 }) },
    tick: () => blip(1760, { dur: 0.018, vol: 0.012, type: 'triangle' }),
    low: () => blip(110, { dur: 0.25, vol: 0.05, type: 'triangle' }),
  }
})()

document.querySelector('.plist')?.addEventListener('pointerover', e => {
  const p = e.target.closest('.p'); if (p && !p.contains(e.relatedTarget)) sound.tick()
})
document.querySelector('.plist')?.addEventListener('focusin', () => sound.tick())

/* ---------- the orbit: twelve slots on three rings, newest innermost ---------- */
const SLOTS = 12
const GLYPH = {
  'mcp-emails': 'M0 0h4v4H0z',
  'fun-libs': 'M0 0h4v1H0zM0 3h4v1H0zM0 1h1v2H0zM3 1h1v2H3z',
  toolrails: 'M1 0h2v4H1zM0 1h1v2H0zM3 1h1v2H3z',
  'albretsen.no': 'M1 1h2v2H1z',
}
const glyph = p => `<svg class="mk" viewBox="0 0 4 4" aria-hidden="true" shape-rendering="crispEdges"><path d="${GLYPH[p] || GLYPH['albretsen.no']}"/></svg>`

function eventEl(e) {
  const li = document.createElement('li')
  li.className = 'ev'
  li.dataset.product = e.product
  li.innerHTML = `<span class="ep">${glyph(e.product)}${esc(e.label)} <time datetime="${e.time.toISOString()}">${formatTime(e.time)}</time></span>` +
    `<span class="et">${esc(describe(e))}</span>`
  return li
}

const feed = createFeed()
const orbit = $('.feed')
const seen = [] // everything this visit has heard, for the screensaver

if (orbit) {
  const recent = feed.recent(SLOTS)
  orbit.replaceChildren(...recent.map((e, i) => { const li = eventEl(e); li.dataset.slot = i; return li }))
  seen.push(...feed.recent(50).reverse())
  feed.subscribe(e => {
    for (const li of [...orbit.children]) {
      const s = +li.dataset.slot + 1
      if (s >= SLOTS) li.remove(); else li.dataset.slot = s
    }
    const li = eventEl(e); li.dataset.slot = 0
    orbit.prepend(li)
    seen.push(e); if (seen.length > 800) seen.shift()
    sound.event(e)
    if (asleep) { drawSaver(); setSaverLine(e) }
  })
}

/* ---------- screensaver: after 30 s of nothing, the hero goes to sleep ---------- */
const saver = $('.saver')
const canvas = saver?.querySelector('canvas')
const IDLE = 30000
let asleep = false, sleptAt = 0, idleTimer = 0

// product -> ring, as a fraction of the saver's radius
const RING = { 'albretsen.no': 0.3, toolrails: 0.48, 'mcp-emails': 0.69, 'fun-libs': 0.9 }
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
const HEX = { night: '#110e08', night3: '#342d20', moon: '#f3e6ce', moon2: '#b7a98f', sun: '#ffc935' } // same as the CSS tokens, as hex for canvas

function drawSaver() {
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = innerWidth, h = innerHeight, g = w < 600 ? 3 : 4
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
  const c = canvas.getContext('2d')
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.imageSmoothingEnabled = false
  c.fillStyle = HEX.night; c.fillRect(0, 0, w, h)
  const cx = Math.floor(w / 2 / g), cy = Math.floor((h - 96) / 2 / g)
  const R = Math.floor(Math.min(w - 32, h - 128) / 2 / g)
  const px = (x, y, col) => { c.fillStyle = col; c.fillRect(x * g, y * g, g, g) }

  // faint dotted rings
  const faint = HEX.night3
  for (const f of Object.values(RING)) {
    const r = R * f, n = Math.floor((2 * Math.PI * r) / 3)
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; px(cx + Math.round(r * Math.cos(a)), cy + Math.round(r * Math.sin(a)), faint) }
  }
  // one mark per event heard, each on its product's ring
  const moon2 = HEX.moon2, sun = HEX.sun
  seen.forEach((e, i) => {
    const hv = hash(e.id), a = (hv % 3600) / 3600 * Math.PI * 2
    const r = R * (RING[e.product] || 0.9) + ((hv >>> 12) % 3) - 1
    const x = cx + Math.round(r * Math.cos(a)), y = cy + Math.round(r * Math.sin(a))
    const col = i === seen.length - 1 ? sun : moon2
    if (e.product === 'mcp-emails') { px(x, y, col); px(x + 1, y, col); px(x, y + 1, col); px(x + 1, y + 1, col) }
    else if (e.product === 'fun-libs') { for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) px(x + dx, y + dy, col) }
    else if (e.product === 'toolrails') { for (const [dx, dy] of [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]]) px(x + dx, y + dy, col) }
    else px(x, y, col)
  })
  // the monogram, at twice the grid
  const m = 2, ox = cx - 9, oy = cy - 9
  const block = (x, y, col) => { for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) px(ox + x * m + i, oy + y * m + j, col) }
  cells(MONO.outer, (x, y) => block(x, y, HEX.moon))
  cells(MONO.inner, (x, y) => block(x, y, sun))
}

function setSaverLine(e) {
  const el = saver?.querySelector('.sv-e')
  if (el && e) el.textContent = `${formatTime(e.time)}  ${e.label}  ${describe(e)}`
}

function sleep() {
  if (asleep || !saver || document.hidden) return
  asleep = true; sleptAt = performance.now()
  drawSaver(); setSaverLine(seen[seen.length - 1])
  saver.hidden = false
  sound.low()
}
function wake() {
  if (!asleep) return
  asleep = false; saver.hidden = true
}
function arm() { clearTimeout(idleTimer); idleTimer = setTimeout(sleep, IDLE) }

for (const type of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart']) {
  addEventListener(type, ev => {
    if (type === 'pointermove' && (performance.now() - sleptAt < 500 || (ev.movementX === 0 && ev.movementY === 0))) return
    if (type === 'keydown' && ev.key === 'z' && !ev.metaKey && !ev.ctrlKey) return
    wake(); arm()
  }, { passive: true })
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) arm() })
addEventListener('resize', () => { if (asleep) drawSaver() })
arm()

/* ---------- for the curious ---------- */
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea')) return
  if (e.key === 'g') document.body.classList.toggle('grid')
  if (e.key === 'z') { clearTimeout(idleTimer); sleep() }
})
console.log('%c▚ albretsen.no', 'font: 16px monospace', '\n\nhello, view-sourcer.\n  g  show the 8px grid\n  z  put the hero to sleep now\n\neverything here is hand-set on a pixel grid. no frameworks, no build step.')

/* ---------- the footer weighs the visit ---------- */
addEventListener('load', () => {
  setTimeout(() => {
    const el = $('.wt'); if (!el || !performance.getEntriesByType) return
    const nav = performance.getEntriesByType('navigation')[0]
    const res = performance.getEntriesByType('resource').filter(r => !/fonts\.(googleapis|gstatic)\.com/.test(r.name))
    const bytes = (nav?.transferSize || 0) + res.reduce((s, r) => s + (r.transferSize || 0), 0)
    if (bytes > 0) el.textContent = `This visit: ${(bytes / 1024).toFixed(1)} KB over the wire, fonts aside.`
  }, 0)
})
