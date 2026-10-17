// Silica Atlas · design 85
// Vitrify (loader) -> live seam with a year tag -> chorus arrivals, loupe, physics field, feed.

import { animate, stagger, scroll, inView } from 'https://cdn.jsdelivr.net/npm/motion@11.18.2/+esm'
import { vitrify, loupe } from '../assets/motion.js'
import { createFeed } from '../../_shared/feed.js'
import { content } from '../../_shared/content.js'

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const wide = matchMedia('(min-width: 700px)')
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches
const $ = s => document.querySelector(s)
const html = document.documentElement

// ------------------------------------------------------------ sound (opt-in): a small glass tick
const sound = { on: false, ctx: null }
function tick (pitch = 1) {
  const ac = sound.ctx; if (!ac) return
  const t = ac.currentTime, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter()
  o.type = 'sine'; o.frequency.value = 2400 * pitch; o2.type = 'sine'; o2.frequency.value = 2400 * pitch * 2.76
  f.type = 'highpass'; f.frequency.value = 900
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
  o.connect(f); o2.connect(f); f.connect(g); g.connect(ac.destination)
  o.start(t); o2.start(t); o.stop(t + 0.18); o2.stop(t + 0.18)
}
document.getElementById('sound')?.addEventListener('click', e => {
  sound.on = !sound.on
  if (sound.on && !sound.ctx) sound.ctx = new (window.AudioContext || window.webkitAudioContext)()
  sound.ctx?.resume?.()
  e.currentTarget.setAttribute('aria-pressed', String(sound.on))
  e.currentTarget.textContent = `Sound · ${sound.on ? 'on' : 'off'}`
  if (sound.on) tick(1.2)
})

// ------------------------------------------------------------ the years, from content.js
// What existed at each point on the 2016 -> 2026 scale. Built from facts, not invented.
const NOTES = (() => {
  const by = {}
  const add = (y, s) => { (by[y] ||= []).push(s) }
  add(content.history.playDeveloperSince, 'First app on Google Play')
  add(content.history.consultingSince, 'Consulting begins')
  add(content.history.companySince, 'Albretsen AS')
  for (const p of content.products) add(p.since, p.name.split(/[,/]/)[0].trim())
  const out = {}
  for (const y in by) {
    const list = by[y]
    out[y] = list.length > 3 ? `${list.slice(0, 2).join(' · ')} · +${list.length - 2}` : list.join(' · ')
  }
  return out
})()

// ------------------------------------------------------------ 1. Vitrify: the loading moment
async function loader () {
  if (!html.classList.contains('v-pre')) return
  // wait for both halves of the plate (ink and glass) to decode, so the lift reveals a finished picture
  const ready = Promise.all([...document.querySelectorAll('.seam img')].map(i => i.decode().catch(() => {})))
  const p = vitrify({ ready })
  // vitrify has mounted its sheet synchronously; the pre-paint cover can go
  html.classList.remove('v-pre')
  try { sessionStorage.setItem('a85-vitrified', '1') } catch (e) {}
  await p
}

// ------------------------------------------------------------ 2. The seam
function liveSeam () {
  const el = $('#seam'), tag = el.querySelector('.seam-tag')
  const yearEl = tag.querySelector('.tag-year'), noteEl = tag.querySelector('.tag-note')
  const MIN = 6, MAX = 94
  let cur = 50, rest = 50, ctrl, lastYear = 0, hovering = false
  const spring = { type: 'spring', stiffness: 170, damping: 24 }
  const yearAt = v => Math.round(2026 - ((v - MIN) / (MAX - MIN)) * 10)
  const posOf = y => MIN + ((2026 - y) / 10) * (MAX - MIN)

  const set = v => {
    cur = v
    el.style.setProperty('--seam', v.toFixed(2))
    const y = Math.max(2016, Math.min(2026, yearAt(v)))
    if (y !== lastYear) {
      lastYear = y
      yearEl.textContent = y
      noteEl.textContent = NOTES[y] || ''
      if (lastYear && sound.on) tick(1 + (y - 2016) / 10)
      el.setAttribute('aria-valuenow', y)
      el.setAttribute('aria-valuetext', NOTES[y] ? `${y}: ${NOTES[y]}` : String(y))
    }
  }
  const to = (v, o = {}) => {
    v = Math.min(MAX, Math.max(MIN, v))
    if (reduced) return set(v)
    ctrl?.stop(); ctrl = animate(cur, v, { ...spring, ...o, onUpdate: set })
  }
  set(50)
  if (!wide.matches) return { to }

  // keyboard: one year per arrow, Home/End jump to the ends
  el.addEventListener('keydown', e => {
    const y = yearAt(cur)
    const k = { ArrowLeft: y + 1, ArrowDown: y + 1, ArrowRight: y - 1, ArrowUp: y - 1, Home: 2026, End: 2016, PageUp: y - 3, PageDown: y + 3 }[e.key]
    if (k === undefined) return
    e.preventDefault(); hero.classList.add('touched')
    to(posOf(Math.max(2016, Math.min(2026, k))))
  })

  // pointer: the seam springs after the cursor; it lags a little, like heavy glass
  el.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' && drag === null) return
    hovering = true; hero.classList.add('touched')
    const r = el.getBoundingClientRect()
    to(((e.clientX - r.left) / r.width) * 100)
  })
  el.addEventListener('pointerleave', () => { hovering = false; to(rest) })
  // touch: drag horizontally on the plate
  let drag = null
  el.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') drag = e.clientX })
  const end = () => { if (drag !== null) { drag = null; hovering = false } }
  el.addEventListener('pointerup', end)
  el.addEventListener('pointercancel', end)

  // scroll: as the hero leaves, time passes toward today
  if (!reduced) scroll(p => { if (!hovering) to(rest - p * 40) }, { target: el, offset: ['start start', 'end start'] })

  return { to, posOf, rest (v) { rest = v; set(v) } }
}

// ------------------------------------------------------------ 3. Feed: one line, live
function feed () {
  const out = $('#feed'); if (!out) return
  const f = createFeed()
  const fmt = e => `${e.text} · ${e.label}${e.ms ? ` · ${e.ms} ms` : ''}`
  out.textContent = fmt(f.recent(1)[0])
  f.subscribe(e => {
    if (reduced) { out.textContent = fmt(e); return }
    animate(out, { opacity: [1, 0], y: [0, -6] }, { duration: 0.18 }).then(() => {
      out.textContent = fmt(e)
      animate(out, { opacity: [0, 1], y: [6, 0], filter: ['blur(4px)', 'blur(0px)'] }, { type: 'spring', bounce: 0.2, duration: 0.5 })
    })
  })
}

// ------------------------------------------------------------ 4. Chorus arrivals + loupe
function arrivals () {
  const plates = [...document.querySelectorAll('.chorus-in')]
  if (reduced) return
  plates.forEach(p => { p.style.opacity = 0 })
  inView('.plates', () => {
    animate(plates, { opacity: [0, 1], scale: [0.9, 1], y: [28, 0], filter: ['blur(8px)', 'blur(0px)'] },
      { type: 'spring', bounce: 0.3, duration: 0.9, delay: stagger(0.07) })
    // a softbox glint passes over each dome as it lands
    plates.forEach((p, i) => setTimeout(() => p.querySelector('.glint')?.classList.add('is-lit'), 380 + i * 70))
  }, { amount: 0.2 })
  inView('.engr', el => {
    animate(el.querySelectorAll('li'), { opacity: [0, 1], x: [-12, 0] }, { duration: 0.6, delay: stagger(0.05), ease: [0.2, 0.9, 0.1, 1] })
  }, { amount: 0.15 })
}

function loupes () {
  if (!finePointer || reduced) return
  document.querySelectorAll('.plate-fig').forEach(a => {
    const img = a.querySelector('img')
    a.classList.add('has-loupe')
    let made = false
    a.addEventListener('pointerenter', () => {
      if (made) return
      made = true
      loupe(a, img.dataset.loupe, { size: Math.round(a.clientWidth * 0.5), zoom: 1.8 })
    }, { once: false })
  })
}

// ------------------------------------------------------------ 5. Physics field, mounted lazily
function field () {
  const canvas = $('#chorus'), btn = $('#drop')
  let chorus = null, loading = null
  const mount = () => loading ||= import('../assets/interactive/chorus.js')
    .then(m => m.mountChorus(canvas, { base: 'assets', wash: 0.5, settle: +new URLSearchParams(location.search).get('settle') || 0 }))
    .then(c => { chorus = c; return c })
    .catch(() => { btn.hidden = true })
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); mount() } }, { rootMargin: '0px 0px -25% 0px' })
  io.observe(canvas)
  btn.addEventListener('click', async () => { (chorus || await mount())?.drop('lens'); if (sound.on) setTimeout(() => tick(0.7), 420) })
}

// ------------------------------------------------------------ 6. Copy the MCP line
function copy () {
  const b = $('#copy'), t = $('#cmd-text').textContent
  b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(t) } catch (e) {
      const r = document.createRange(); r.selectNodeContents($('#cmd-text')); const s = getSelection(); s.removeAllRanges(); s.addRange(r)
    }
    b.textContent = 'Copied'; b.classList.add('done')
    if (!reduced) animate(b, { scale: [0.94, 1] }, { type: 'spring', bounce: 0.5, duration: 0.4 })
    setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('done') }, 1800)
  })
}

// ------------------------------------------------------------ boot
const hero = $('.hero')
const seam = liveSeam()
feed(); arrivals(); copy(); field(); loupes()
// deep link to a year on the plate: albretsen.no/#2019
const linked = /^#(20[12]\d)$/.exec(location.hash)
if (linked && wide.matches) { hero.classList.add('touched'); seam.rest(seam.posOf(Math.max(2016, Math.min(2026, +linked[1])))) }
await loader()
if (wide.matches) {
  // first-visit tease: the seam sweeps toward 2016 and back so people discover it
  if (!reduced && !hero.classList.contains('touched')) {
    setTimeout(() => { if (!hero.classList.contains('touched')) seam.to(seam.posOf(2018)) }, 400)
    setTimeout(() => { if (!hero.classList.contains('touched')) seam.to(50) }, 1300)
  }
}
