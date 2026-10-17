// Peach Hour, design 78. One idea: a small world in the morning light that you
// can turn, and a sun you can move. Everything else stays quiet.
import { createFeed } from '../../_shared/feed.js'

const $ = (s, r = document) => r.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const hero = $('#hero'), stage = $('#stage'), canvas = $('#village'), sunBtn = $('#sun')
// review helper: ?vh=900 pins the hero height so a tall screenshot shows the page below
{ const vh = +new URLSearchParams(location.search).get('vh'); if (vh) hero.style.minHeight = `${vh}px` }
const portrait = () => matchMedia('(max-aspect-ratio: 4/5)').matches
// the dawn still was framed with the model at ~63% of the width; match it live
const offX = () => portrait() ? 0 : 0.14
const minA = () => portrait() ? 0.7 : 1.5

// ---------- the name warms up, letter by letter -------------------------
// Each letter reserves its 820-weight width (::before), so the weight change
// never moves anything: layout shift stays 0.
{
  const el = $('#name'), text = el.textContent
  el.textContent = ''
  ;[...text].forEach((c, i) => {
    const s = document.createElement('span'); s.className = 'ch'; s.dataset.c = c; s.style.setProperty('--i', i)
    const g = document.createElement('span'); g.textContent = c; s.append(g); el.append(s)
  })
  el.classList.add('split')
  requestAnimationFrame(() => requestAnimationFrame(() => $('.name').classList.add('is-warm')))
}

// The letters share one gradient, lit from wherever the sun is. Each letter
// gets the slice of it that sits behind it.
function paintName() {
  const box = $('#name'), r = box.getBoundingClientRect(), sr = stage.getBoundingClientRect()
  if (!r.width) return
  box.style.setProperty('--nw', `${r.width.toFixed(1)}px`); box.style.setProperty('--nh', `${r.height.toFixed(1)}px`)
  box.querySelectorAll('.ch').forEach((c) => { const cr = c.getBoundingClientRect(); c.style.setProperty('--ox', `${(r.left - cr.left).toFixed(1)}px`) })
  const [x, y] = ndc(t)
  const gx = sr.left + (x + 1) / 2 * sr.width - r.left, gy = sr.top + (1 - y) / 2 * sr.height - r.top
  box.style.setProperty('--gx', `${gx.toFixed(1)}px`); box.style.setProperty('--gy', `${gy.toFixed(1)}px`)
  box.style.setProperty('--gr', `${Math.max(r.width * 0.55, Math.hypot(gx - r.width / 2, gy - r.height / 2) * 1.15).toFixed(0)}px`)
}

// ---------- the sun --------------------------------------------------------
// The sun follows the same screen-space arc as the 3D scene (diorama.js), so
// the handle always sits on the rendered sun.
const T0 = 0.12
let t = T0, lift = 1.35, live = null, nameReady = false
const lerp = (a, b, k) => a + (b - a) * k
const ndc = (tt, L = lift) => [lerp(-0.82, 0.82, tt), -0.2 + L * Math.pow(Math.sin(Math.PI * tt), 1.4)]
const clock = (tt) => { const m = Math.round((6 + tt * 15) * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }
const phase = (tt) => tt < 0.22 ? 'Sunrise' : tt < 0.42 ? 'Morning' : tt < 0.6 ? 'Midday' : tt < 0.82 ? 'Afternoon' : 'Dusk'

function drawArc() {
  let d = ''
  for (let i = 0; i <= 40; i++) { const [x, y] = ndc(i / 40); d += `${i ? 'L' : 'M'}${((x + 1) / 2 * 100).toFixed(2)} ${((1 - y) / 2 * 100).toFixed(2)}` }
  $('#arc-path').setAttribute('d', d)
}
function placeSun() {
  const [x, y] = ndc(t)
  hero.style.setProperty('--sx', `${((x + 1) / 2 * 100).toFixed(3)}%`)
  hero.style.setProperty('--sy', `${((1 - y) / 2 * 100).toFixed(3)}%`)
  hero.classList.toggle('sun-east', t > 0.55)
}
let fallback = null
function setT(v, from) {
  t = Math.min(1, Math.max(0, v))
  document.documentElement.style.setProperty('--t', t.toFixed(4))
  hero.style.setProperty('--t', t.toFixed(4))
  placeSun(); if (nameReady) paintName()
  const c = clock(t)
  $('#sun-clock').textContent = c
  sunBtn.setAttribute('aria-valuenow', Math.round(t * 100))
  sunBtn.setAttribute('aria-valuetext', `${phase(t)}, ${c}`)
  if (live && from !== 'scene') live.setTime(t)
  if (fallback) { const f = Math.round(t * 6); fallback.style.backgroundPosition = `${(f / 6) * 100}% 0` }
}
function touched() { hero.classList.add('touched') }

{
  let dragging = false, startX = 0, startT = 0
  sunBtn.addEventListener('pointerdown', (e) => {
    dragging = true; startX = e.clientX; startT = t
    sunBtn.setPointerCapture(e.pointerId); sunBtn.classList.add('dragging'); hero.classList.add('show-arc'); touched()
  })
  sunBtn.addEventListener('pointermove', (e) => {
    if (!dragging) return
    const w = stage.clientWidth * 0.82
    setT(startT + (e.clientX - startX) / w)
  })
  const end = () => { dragging = false; sunBtn.classList.remove('dragging'); hero.classList.remove('show-arc') }
  sunBtn.addEventListener('pointerup', end); sunBtn.addEventListener('pointercancel', end)
  sunBtn.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 0.1 : 0.025
    const k = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 0.1, PageDown: -0.1 }[e.key]
    if (k !== undefined) { e.preventDefault(); setT(t + k); touched() }
    if (e.key === 'Home') { e.preventDefault(); setT(0); touched() }
    if (e.key === 'End') { e.preventDefault(); setT(1); touched() }
  })
  sunBtn.addEventListener('focus', () => hero.classList.add('show-arc'))
  sunBtn.addEventListener('blur', () => hero.classList.remove('show-arc'))
}
drawArc(); setT(+new URLSearchParams(location.search).get('t') || T0)
nameReady = true; paintName()
document.fonts && document.fonts.ready.then(paintName)
addEventListener('resize', () => requestAnimationFrame(paintName))

// ---------- the live village (after first paint) ---------------------------
function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}
async function bootVillage() {
  if (!hasWebGL()) { fallback = $('#poster'); fallback.classList.add('fallback'); setT(t); return }
  const { createDiorama } = await import('../assets/diorama.js')
  const size = () => [stage.clientWidth, stage.clientHeight]
  const [w, h] = size()
  const d = await createDiorama({
    canvas, width: w, height: h, time: t, view: portrait() ? 'portrait' : 'hero', offsetX: offX(), minAspect: minA(),
    autoTurn: reduce ? 0 : 0.035, sunPick: false, sunLift: 0.92,
    onTime: (tt) => { if (Math.abs(tt - t) > 1e-4) setT(tt, 'scene') },
    pixelRatio: Math.min(devicePixelRatio || 1, w > 1800 ? 1.25 : 1.75),
  })
  live = d
  lift = 0.92; drawArc(); placeSun()
  canvas.classList.add('ready')
  canvas.addEventListener('pointerdown', touched, { once: true })
  let rz = 0
  addEventListener('resize', () => {
    cancelAnimationFrame(rz)
    rz = requestAnimationFrame(() => { const [W, H] = size(); d.setView(portrait() ? 'portrait' : 'hero'); d.setOffsetX(offX()); d.setMinAspect(minA()); d.resize(W, H); paintName() })
  })
  // pause when the hero is off screen
  new IntersectionObserver(([e]) => { e.isIntersecting ? d.start() : d.stop() }).observe(hero)
  window.__village = d
}
const saveData = navigator.connection && navigator.connection.saveData
if (!saveData) {
  const go = () => bootVillage().catch((err) => console.warn('village', err))
  addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 1500 }) : setTimeout(go, 300)), { once: true })
}

// ---------- slow parallax through the layers -------------------------------
if (!reduce) {
  const scene = $('#scene-layer'), name = $('#name'), copy = $('.copy')
  let raf = 0
  const tick = () => {
    raf = 0
    const h = hero.offsetHeight, y = Math.min(h, Math.max(0, scrollY))
    const p = y / h
    scene.style.transform = `translate3d(0, ${(y * 0.32).toFixed(1)}px, 0) scale(${(1 + p * 0.04).toFixed(4)})`
    name.style.transform = `translate3d(0, ${(y * 0.55).toFixed(1)}px, 0)`
    name.style.opacity = (1 - p * 1.3).toFixed(3)
    copy.style.transform = `translate3d(0, ${(y * 0.12).toFixed(1)}px, 0)`
  }
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick) }, { passive: true })
  tick()
}

// ---------- shutters open, headings warm ---------------------------------
{
  const shots = document.querySelectorAll('.ph-shutters')
  if (reduce || !('IntersectionObserver' in window)) shots.forEach((s) => s.classList.add('is-open'))
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-open'); io.unobserve(e.target) } }), { threshold: 0.3 })
    shots.forEach((s) => io.observe(s))
  }
  document.querySelectorAll('[data-warm]').forEach((el) => {
    if (reduce) return
    const text = el.textContent; el.setAttribute('aria-label', text); el.textContent = ''
    text.split(' ').forEach((word, wi, arr) => {
      const w = document.createElement('span'); w.style.whiteSpace = 'nowrap'; w.setAttribute('aria-hidden', 'true')
      ;[...word].forEach((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s.style.setProperty('--i', el.childElementCount * 6 + w.childElementCount); w.append(s) })
      el.append(w); if (wi < arr.length - 1) el.append(' ')
    })
    el.classList.add('armed')
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('is-warm'); io.disconnect() } }, { threshold: 0.6 })
    io.observe(el)
  })
}

// ---------- one quiet line of live activity -------------------------------
{
  const out = $('#feed-text'), box = out.parentElement
  const fmt = (e) => `${e.label} · ${e.text}${e.ms ? ` · ${e.ms} ms` : e.country ? ` · ${e.country}` : ''}`
  const feed = createFeed()
  const [first] = feed.recent(1)
  if (first) out.textContent = fmt(first)
  let last = 0
  feed.subscribe((e) => {
    const now = performance.now(); if (now - last < 3200) return; last = now
    if (reduce) { out.textContent = fmt(e); return }
    box.classList.add('swap')
    setTimeout(() => { out.textContent = fmt(e); box.classList.remove('swap') }, 450)
  })
}

// ---------- copy the agent command ---------------------------------------
{
  const btn = $('#copy'), state = $('#copy-state'), text = $('#cmd-text').textContent
  let timer = 0
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text); state.textContent = 'Copied. Paste it into your terminal.' }
    catch { const r = document.createRange(); r.selectNodeContents($('#cmd-text')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); state.textContent = 'Selected. Press Cmd or Ctrl + C.' }
    btn.classList.add('copied'); clearTimeout(timer)
    timer = setTimeout(() => { btn.classList.remove('copied'); state.textContent = '' }, 2400)
  })
}
