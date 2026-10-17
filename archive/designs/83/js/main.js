// Warm Boot: albretsen.no, design 83.
// The page powers on: a POST log of the company decodes to OK, collapses into one
// phosphor line, the Drift Field raster rises out of it, and the raster then thins,
// scanline by scanline, until only the painting is left. The signal stays underneath:
// a lens follows the pointer and shows it, and "View signal" brings it back for
// keyboard and touch.

import { content } from '../../_shared/content.js'
import { createFeed } from '../../_shared/feed.js'
import { mountDriftField } from '../assets/generative/drift-field.js'
import { BEAT } from '../assets/motion.js'
import { decode as decodeRaw, GLYPHS } from './decode.js'
import { sound } from './sound.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const root = document.documentElement
const gsap = window.gsap
const ScrollTrigger = window.ScrollTrigger
const Q = new URLSearchParams(location.search)
// ?still renders the end state (as with reduced motion); ?seek=<s> freezes the boot at a time (review only)
const STILL = matchMedia('(prefers-reduced-motion: reduce)').matches || Q.has('still')
const decode = (el, o = {}) => decodeRaw(el, { still: STILL, ...o })
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches

const hero = $('#hero')
const signal = $('#signal')
const canvas = $('#field')
const ring = $('#lensRing')

// ---------------------------------------------------------------- signal layer
// --solid: thickness (0..4 px) of each 4 px raster band that shows the canvas.
// --lens: radius of the pointer lens. Both are mask parameters, so this is cheap.
const sig = { solid: 0, lens: 0, mx: innerWidth * 0.6, my: innerHeight * 0.5, ring: 0.4 }
const paintSignal = () => {
  signal.style.setProperty('--solid', sig.solid.toFixed(2) + 'px')
  signal.style.setProperty('--lens', sig.lens.toFixed(1) + 'px')
  signal.style.setProperty('--mx', sig.mx.toFixed(1) + 'px')
  signal.style.setProperty('--my', sig.my.toFixed(1) + 'px')
  ring.style.transform = `translate(${sig.mx.toFixed(1)}px, ${sig.my.toFixed(1)}px)`
  ring.style.setProperty('--ring', sig.ring.toFixed(3))
}

const field = mountDriftField(canvas, {
  mode: 'raster', boot: root.classList.contains('booting') ? 0 : 1,
  horizon: 0.6, sunX: 0.64, lines: 60, speed: 0.03, interactive: false,
})
// the field only needs to run while it is visible through the mask
const fieldWanted = new Set()
let heroVisible = true
const syncField = () => (fieldWanted.size && heroVisible ? field.resume() : field.pause())
const want = (why, on) => { on ? fieldWanted.add(why) : fieldWanted.delete(why); syncField() }
want('boot', false)

// ---------------------------------------------------------------- boot
const LOG = (() => {
  const p = Object.fromEntries(content.products.map((x) => [x.id, x]))
  return [
    { t: `${content.company} · warm boot`, s: String(content.history.companySince), head: true },
    { t: `Play Console · since ${content.history.playDeveloperSince}`, s: 'OK' },
    { t: `${p['mcp-emails'].name} · ${p['mcp-emails'].facts[0]}`, s: 'OK' },
    { t: `${p['fun-libs'].name} · ${p['fun-libs'].figure.value} ${p['fun-libs'].figure.label}`, s: 'OK' },
    { t: `${p.toolrails.name} · ${p.toolrails.figure.value} ${p.toolrails.figure.label}`, s: 'Build', warn: true },
    { t: `${p.harbor.name} · ${p.harbor.figure.value} ${p.harbor.figure.label}`, s: 'Idle', warn: true },
    { t: 'Outside engagements', s: '1 slot' },
  ]
})()

let bootTl = null
function boot({ again = false } = {}) {
  const log = $('#bootLog')
  if (!gsap || STILL) { finishBoot(); return }
  if (again) {
    root.classList.add('booting')
    scrollTo({ top: 0 })
  }
  sig.solid = 4; sig.lens = 0; paintSignal()
  signal.style.background = '#041419'
  // during the boot GSAP drives every frame of the field (its own loop stays paused),
  // so the rise is in lockstep with the timeline and can be skipped or seeked
  want('boot', false); field.boot(0); field.setHour(0)
  sound.hum()

  log.innerHTML = ''
  gsap.set(log, { clearProps: 'all' })
  gsap.set(log, { filter: 'brightness(1)', scaleY: 1, opacity: 1 })
  gsap.set('.boot', { clearProps: 'all' })
  const tl = gsap.timeline({ onComplete: finishBoot })
  bootTl = tl
  let at = 0.25
  LOG.forEach((l, i) => {
    const row = document.createElement('div')
    row.className = l.head ? 'boot-head' : 'boot-row'
    const t = document.createElement('span'); t.className = 't'; t.textContent = l.t
    const s = document.createElement('span'); s.className = 's' + (l.warn ? ' warn' : ''); s.textContent = l.s
    if (l.head) row.append(t, s)
    else { const lead = document.createElement('span'); lead.className = 'lead'; row.append(t, lead, s) }
    log.append(row)
    gsap.set(row, { opacity: 0 })
    at = 0.25 + i * BEAT * 2
    tl.set(row, { opacity: 1 }, at)
    tl.add(decode(t, { duration: BEAT * 3 }), at)
    tl.add(decode(s, { duration: BEAT * 2, glyphs: GLYPHS.quiet, frontier: 2 }), at + BEAT * 2)
    tl.call(() => sound.tick(i), null, at + BEAT * 2)
  })
  // explicit marks on the beat: collapse -> rise -> develop -> arrive
  const collapse = at + BEAT * 4 + 0.35
  const rise = collapse + BEAT * 3
  const develop = rise + 1.9
  // the log collapses to a hairline at the horizon, over-exposed
  tl.to(log, { scaleY: 0.004, filter: 'brightness(3)', duration: BEAT * 3, ease: 'power3.in' }, collapse)
  tl.to('.boot', { backgroundColor: 'rgba(4,20,25,0)', duration: BEAT }, rise - 0.02)
  tl.to(log, { opacity: 0, duration: BEAT }, rise - 0.02)
  // the raster rises out of that line
  const p = { v: 0 }
  tl.to(p, { v: 1, duration: 2.3, ease: 'power1.inOut', onUpdate: () => field.boot(p.v) }, rise)
  tl.set(signal, { background: 'transparent' }, rise + 0.6)
  // the picture develops through the raster: each scanline thins to nothing
  tl.to(sig, { solid: 0, duration: 1.4, ease: 'power2.in', onUpdate: paintSignal }, develop)
  tl.set('.boot', { display: 'none' }, develop)
  // the page arrives on the beat
  tl.to(['.masthead', '.hero-copy', '.hero-tools'], { opacity: 1, duration: BEAT * 4, ease: 'none', stagger: BEAT }, develop + 0.85)
  tl.add(() => revealCopy(), develop + 0.85)
  return tl
}

function revealCopy() {
  const label = $('.hero [data-decode]'), h1 = $('.hero [data-decode-h]')
  h1.setAttribute('aria-label', h1.dataset.text || h1.textContent)
  decode(label)
  decode(h1, { glyphs: GLYPHS.serif, duration: BEAT * 9, delay: BEAT * 2, frontier: 2 })
  if (gsap && !STILL) gsap.from('.hero .lede, .hero-meta', { opacity: 0, y: 12, duration: BEAT * 5, ease: 'power2.out', stagger: BEAT * 2, delay: BEAT * 3 })
}

function finishBoot() {
  bootTl = null
  root.classList.remove('booting')
  for (const s of ['.masthead', '.hero-copy', '.hero-tools', '.boot']) { const el = $(s); if (el) el.style.removeProperty('opacity') }
  $('.boot').style.removeProperty('display')
  signal.style.background = 'transparent'
  field.boot(1)
  sig.solid = signalOn ? 4 : 0; paintSignal()
  try { sessionStorage.setItem('wb83-booted', '1') } catch (e) {}
}

const skip = () => { if (bootTl) bootTl.progress(1) }
$('#bootSkip').addEventListener('click', skip)
addEventListener('keydown', (e) => { if (bootTl && e.key !== 'Tab' && e.key !== 'Shift') skip() })
addEventListener('wheel', () => bootTl && skip(), { passive: true })
addEventListener('touchstart', () => bootTl && skip(), { passive: true })

// ---------------------------------------------------------------- lens
let lensActive = false
const target = { x: sig.mx, y: sig.my }
let lensRaf = 0
const followLens = () => {
  sig.mx += (target.x - sig.mx) * 0.18
  sig.my += (target.y - sig.my) * 0.18
  paintSignal()
  if (lensActive || Math.abs(target.x - sig.mx) > 0.3 || Math.abs(target.y - sig.my) > 0.3 || sig.lens > 0.5) lensRaf = requestAnimationFrame(followLens)
  else lensRaf = 0
}
const lensTo = (on) => {
  lensActive = on
  hero.classList.toggle('lens-on', on)
  if (on) want('lens', true)
  const r = Math.min(150, Math.max(96, innerWidth * 0.09))
  if (gsap && !STILL) {
    gsap.to(sig, { lens: on ? r : 0, ring: on ? r / 120 : 0.4, duration: on ? BEAT * 4 : BEAT * 3, ease: on ? 'power3.out' : 'power2.in', overwrite: 'auto', onComplete: () => { if (!on) want('lens', false) } })
  } else { sig.lens = on ? r : 0; sig.ring = r / 120; paintSignal(); if (!on) want('lens', false) }
  if (!lensRaf) lensRaf = requestAnimationFrame(followLens)
}
if (FINE) {
  hero.addEventListener('pointermove', (e) => {
    if (bootTl || e.pointerType === 'touch') return
    const r = hero.getBoundingClientRect()
    target.x = e.clientX - r.left; target.y = e.clientY - r.top
    // the lens yields to the copy and the controls: no x-ray over text you are reading
    const overUi = e.target.closest('.hero-copy a, .hero-copy button, .cmd, .hero-tools, .masthead')
    if (!lensActive && !overUi) { sig.mx = target.x; sig.my = target.y; lensTo(true) }
    else if (lensActive && overUi) lensTo(false)
    if (!lensRaf) lensRaf = requestAnimationFrame(followLens)
  })
  hero.addEventListener('pointerleave', () => lensActive && lensTo(false))
}

// ---------------------------------------------------------------- "View signal"
let signalOn = false
const signalBtn = $('#signalBtn')
signalBtn.addEventListener('click', () => {
  signalOn = !signalOn
  signalBtn.setAttribute('aria-pressed', String(signalOn))
  signalBtn.textContent = signalOn ? 'View picture' : 'View signal'
  sound.tick(signalOn ? 6 : 2)
  if (signalOn) want('toggle', true)
  if (gsap && !STILL) gsap.to(sig, { solid: signalOn ? 4 : 0, duration: 1.1, ease: signalOn ? 'power2.out' : 'power2.in', onUpdate: paintSignal, overwrite: 'auto', onComplete: () => { if (!signalOn) want('toggle', false) } })
  else { sig.solid = signalOn ? 4 : 0; paintSignal(); if (!signalOn) want('toggle', false) }
})

// ---------------------------------------------------------------- hour drift on scroll
if (gsap && ScrollTrigger && !STILL) {
  gsap.registerPlugin(ScrollTrigger)
  const h = { v: 0 }
  const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 } })
  tl.to('.hero-media .blue', { opacity: 1, ease: 'none' }, 0)
  tl.to('.hero-media', { yPercent: 12, ease: 'none' }, 0)
  tl.to('.hero-copy', { yPercent: -18, opacity: 0.2, ease: 'none' }, 0)
  tl.to(h, { v: 1, ease: 'none', onUpdate: () => field.setHour(h.v) }, 0)
}
// stop drawing entirely while the hero is off screen
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; syncField() }).observe(hero)

// ---------------------------------------------------------------- live feed
const feedOut = $('#feed')
const dot = $('#feedDot')
const fmt = (e) => {
  const t = e.time.toTimeString().slice(0, 8)
  const extra = e.ms ? ` · ${e.ms} ms` : e.country ? ` · ${e.country}` : e.city ? ` · ${e.city}` : ''
  return `${t}  ${e.label} · ${e.text}${extra}`
}
const feed = createFeed()
const first = feed.recent(1)[0]
if (first) feedOut.textContent = fmt(first)
let lastFeed = 0
feed.subscribe((e) => {
  const now = performance.now()
  if (now - lastFeed < 2400 || document.hidden) return
  lastFeed = now
  decode(feedOut, { text: fmt(e), duration: BEAT * 6 })
  dot.classList.remove('pulse'); void dot.offsetWidth; dot.classList.add('pulse')
  sound.blip()
})

// ---------------------------------------------------------------- copy command
const copyBtn = $('#copyBtn')
copyBtn.addEventListener('click', async () => {
  let ok = true
  try { await navigator.clipboard.writeText(content.mcpCommand) } catch (e) { ok = false }
  copyBtn.classList.toggle('is-done', ok)
  decode(copyBtn, { text: ok ? 'Copied' : 'Select', duration: BEAT * 3, glyphs: GLYPHS.quiet })
  if (!ok) { const r = document.createRange(); r.selectNodeContents($('#cmdText')); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }
  sound.tick(5)
  clearTimeout(copyBtn._t)
  copyBtn._t = setTimeout(() => { copyBtn.classList.remove('is-done'); decode(copyBtn, { text: 'Copy', duration: BEAT * 2, glyphs: GLYPHS.quiet }) }, 2200)
})

// ---------------------------------------------------------------- reveals below the fold
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return
  const el = e.target
  if (el.matches('[data-decode]')) decode(el)
  else el.classList.add('is-in')
  io.unobserve(el)
}), { threshold: 0.3 })
$$('.plates [data-decode], .archive [data-decode], .plate').forEach((el) => io.observe(el))

// ---------------------------------------------------------------- sound + reboot
const soundBtn = $('#soundBtn')
soundBtn.addEventListener('click', () => {
  const on = sound.toggle()
  soundBtn.setAttribute('aria-pressed', String(on))
  soundBtn.textContent = on ? 'Sound on' : 'Sound off'
  if (on) sound.tick(4)
})
$('#rebootBtn').addEventListener('click', () => { if (STILL || !gsap) { scrollTo({ top: 0 }); return } boot({ again: true }) })

// ---------------------------------------------------------------- go
if (root.classList.contains('booting')) {
  if (gsap) { const tl = boot(); if (tl && Q.has('seek')) tl.pause(+Q.get('seek'), false) }
  else finishBoot()
} else {
  sig.solid = 0; paintSignal()
  revealCopy()
}
