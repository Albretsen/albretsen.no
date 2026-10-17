// Albretsen AS — Sun Road. One clock for the whole page: scroll (or the horizon dial) sets the hour.
import { content } from '../../_shared/content.js'
import { createFeed } from '../../_shared/feed.js'

const $ = (s, r = document) => r.querySelector(s)
const root = document.documentElement
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const A = 'assets/'
const byId = Object.fromEntries(content.products.map(p => [p.id, p]))

/* ---------------- products: the stamp sheet ---------------- */
const LIVE = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor']
const STATUS = { live: 'In service', building: 'Being built', paused: 'Paused' }
const sheet = $('#sheet')
sheet.innerHTML = LIVE.map((id, i) => {
  const p = byId[id], f = p.figure
  const ink = i === 0 ? `<img class="ink" src="${A}extras/postmark.svg" width="260" height="120" alt="">` : ''
  return `<li class="stamp-item">
    <a class="stamp m-postmark" href="${p.url}" style="--tilt:${i % 2 ? 3 : -3}deg;animation-delay:${i * 0.12}s" aria-label="${p.name}, ${f.value} ${f.label}">
      <img class="face" src="${A}products/stamp-${id}.webp" width="600" height="800" loading="lazy" decoding="async" alt="">
      ${ink}
    </a>
    <h3><a href="${p.url}">${p.name}</a></h3>
    <p class="stamp-line">${p.line}</p>
    <p class="stamp-facts">${p.facts.join(' · ')}</p>
    <span class="status" data-s="${p.status}">${STATUS[p.status]} · since ${p.since}</span>
  </li>`
}).join('')

const retired = content.products.filter(p => p.status === 'retired')
const row = $('#retired'), cap = $('#retired-cap')
row.innerHTML = retired.map(p => `<li><button type="button" data-id="${p.id}" aria-label="${p.name}, retired">
  <img src="${A}products/stamp-${p.id}.webp" width="420" height="524" loading="lazy" decoding="async" alt=""></button></li>`).join('')
const capDefault = cap.innerHTML
function showRetired(btn) {
  row.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)))
  if (!btn) { cap.innerHTML = capDefault; return }
  const p = byId[btn.dataset.id]
  const fig = p.figure ? ` <i>${p.figure.value} ${p.figure.label}.</i>` : ''
  cap.innerHTML = `<b>${p.name}</b><span class="yr">${p.since}</span><br>${p.line}${fig}`
}
row.addEventListener('pointerover', e => { const b = e.target.closest('button'); if (b) showRetired(b) })
row.addEventListener('focusin', e => showRetired(e.target.closest('button')))
row.addEventListener('click', e => showRetired(e.target.closest('button')))
row.addEventListener('pointerleave', () => { if (!row.contains(document.activeElement)) showRetired(null) })

/* ---------------- the road: years as milestones ---------------- */
const STOPS = [
  { year: 2016, label: 'first app', text: 'The first app goes up on Google Play.' },
  { year: 2019, label: 'Fun Libs', text: 'Fun Libs, built at 17. No marketing; 113,000+ installs since.' },
  { year: 2021, label: 'consulting', text: 'Consulting begins, alongside small useful apps: IAGO HMS and two calculators.' },
  { year: 2023, label: 'Tryggere Hyring', text: 'Tryggere Hyring: background checks for hiring.' },
  { year: 2024, label: 'WebVakt', text: 'WebVakt watches websites for changes; Joke Central keeps the jokes coming.' },
  { year: 2025, label: 'Polyglot Pilot', text: 'Polyglot Pilot localises whole codebases. PinPoint turns your photos into a guessing game.' },
  { year: 2026, label: 'Albretsen AS', text: 'Albretsen AS. MCP Emails, Toolrails and Harbor take the road; Fun Libs v5 ships.' },
]
$('#road-list').innerHTML = STOPS.map(s => `<li>${s.year}: ${s.text}</li>`).join('')
const roadSec = $('#road'), roadCanvas = $('.road-canvas'), ry = $('.ry'), rtext = $('.road-text')
let road = null, roadIdx = 0
function setRoadIdx(i) {
  if (i === roadIdx) return
  roadIdx = i
  ry.textContent = STOPS[i].year; rtext.textContent = STOPS[i].text
  for (const el of [ry, rtext]) { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in') }
}
new IntersectionObserver(async ([e], io) => {
  if (!e.isIntersecting) return
  io.disconnect()
  const { createCoastRoad } = await import('../assets/interactive/coast-road.js')
  road = createCoastRoad(roadCanvas, { stops: STOPS.map(({ year, label }) => ({ year, label })), progress: 0 })
  tick(true)
}, { rootMargin: '60% 0px' }).observe(roadSec)

/* ---------------- one clock ---------------- */
const hero = $('.hero'), range = $('#day'), clock = $('.clock')
let manual = null, manualAt = 0, daylight = null, ambient = null, lastT = -1

function anchors() {
  const vh = innerHeight, max = Math.max(1, root.scrollHeight - vh)
  return [
    [0, 0.22], [hero.offsetHeight - vh, 0.6],
    [roadSec.offsetTop, 0.66], [roadSec.offsetTop + roadSec.offsetHeight - vh, 0.9], [max, 1],
  ]
}
let A_ = anchors()
function dayFromScroll(y) {
  for (let i = 0; i < A_.length - 1; i++) {
    const [y0, t0] = A_[i], [y1, t1] = A_[i + 1]
    if (y <= y1 || i === A_.length - 2) return t0 + (t1 - t0) * Math.min(1, Math.max(0, (y - y0) / Math.max(1, y1 - y0)))
  }
  return 1
}
const hhmm = t => { const m = Math.round((5.5 + t * 15) * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }

function apply(t) {
  if (Math.abs(t - lastT) < 0.0005) return
  lastT = t
  root.style.setProperty('--day', t.toFixed(4))
  root.style.setProperty('--dusk-k', Math.max(0, (t - 0.75) / 0.25).toFixed(3))
  root.style.setProperty('--shx', `${(-Math.cos(Math.PI * (1 - t)) * 22).toFixed(1)}px`)
  const time = hhmm(t)
  clock.textContent = time
  if (manual == null) range.value = Math.round(t * 1000)
  range.setAttribute('aria-valuetext', time)
  daylight?.setTime(t); road?.setDay(t); ambient?.setTime(t)
}
function tick(force) {
  const y = scrollY
  if (manual != null && Math.abs(y - manualAt) > 80) manual = null
  if (road) {
    const p = Math.min(1, Math.max(0, (y - roadSec.offsetTop) / Math.max(1, roadSec.offsetHeight - innerHeight)))
    road.setProgress(p)
    setRoadIdx(Math.min(STOPS.length - 1, Math.max(0, Math.round(p * (STOPS.length - 1) + 0.25))))
  }
  if (force) lastT = -1
  apply(manual ?? dayFromScroll(y))
}
let ticking = false
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; tick() }) } }, { passive: true })
addEventListener('resize', () => { A_ = anchors(); tick(true) })
range.addEventListener('input', () => { manual = range.value / 1000; manualAt = scrollY; apply(manual) })
tick(true)

/* ---------------- daylight shader, after first paint ---------------- */
const heroImg = $('.hero-pic img'), heroCanvas = $('.hero-light')
function startDaylight() {
  const go = async () => {
    const { createDaylight } = await import('../assets/interactive/daylight.js')
    try { daylight = createDaylight(heroCanvas, { src: heroImg.currentSrc || heroImg.src, time: lastT }) } catch { daylight = null }
    tick(true)
  }
  ;(window.requestIdleCallback || (f => setTimeout(f, 300)))(go, { timeout: 1500 })
}
if (heroImg.complete && heroImg.naturalWidth) startDaylight(); else heroImg.addEventListener('load', startDaylight, { once: true })

/* ---------------- sound, opt-in ---------------- */
const soundBtn = $('.sound'), soundLabel = $('.sound-label')
soundBtn.addEventListener('click', async () => {
  if (!ambient) { const { createAmbient } = await import('../assets/interactive/ambient.js'); ambient = createAmbient({ volume: 0.45 }); ambient.setTime(lastT) }
  const on = ambient.toggle()
  soundBtn.setAttribute('aria-pressed', String(on))
  soundLabel.textContent = on ? 'Sound on' : 'Sound off'
})

/* ---------------- live feed ---------------- */
const feedText = $('.feed-text')
const line = e => `${e.label} · ${e.text}${e.country ? ` in ${e.country}` : ''}${e.ms ? ` · ${e.ms} ms` : ''}`
try {
  const feed = createFeed()
  const [first] = feed.recent(1)
  if (first) feedText.textContent = line(first)
  feed.subscribe(e => {
    if (reduce) { feedText.textContent = line(e); return }
    feedText.classList.add('swap')
    setTimeout(() => { feedText.textContent = line(e); feedText.classList.remove('swap') }, 350)
  })
} catch { /* the static line stays */ }

/* ---------------- Day Pass: tear to copy ---------------- */
const ticket = $('#ticket'), note = $('#ticket-note'), noteDefault = note.textContent
ticket.addEventListener('click', async () => {
  let ok = false
  try { await navigator.clipboard.writeText(content.mcpCommand); ok = true } catch {
    const r = document.createRange(); r.selectNodeContents($('#mcp-cmd')); const s = getSelection(); s.removeAllRanges(); s.addRange(r)
  }
  ticket.classList.add('torn')
  note.textContent = ok ? 'Copied. Paste it into a terminal; valid until dusk, and every day after.' : 'Selected. Copy it with your keyboard.'
  clearTimeout(ticket._t)
  ticket._t = setTimeout(() => { ticket.classList.remove('torn'); note.textContent = noteDefault }, 2600)
})

/* ---------------- in-view motions ---------------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } }), { threshold: 0.2 })
document.querySelectorAll('.m-postmark, .m-glint').forEach(el => io.observe(el))