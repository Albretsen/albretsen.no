// Design 88 · Labelled Sky — page behaviour.
// First paint is plain HTML + the graded 1885 plate. Everything here is progressive.
import { content } from '../../_shared/content.js'
import { createFeed } from '../../_shared/feed.js'
import { SPRING_STAMP, SPRING_SNAP, pressOn, peel, loupe, fracture } from '../assets/motion.js'

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const narrow = matchMedia('(max-width: 700px)')
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const rotOf = el => parseFloat(el.style.getPropertyValue('--rot')) || 0

// A sticker landing, transform/opacity only (so CSS keeps owning shadows and states).
function land(el, { delay = 0, rot = rotOf(el), lift = 18 } = {}) {
  if (reduced) return
  el.animate([
    { transform: `translateY(-${lift}px) scale(1.18) rotate(${rot + 7}deg)`, opacity: 0 },
    { opacity: 1, offset: 0.3 },
    { transform: `rotate(${rot}deg)`, opacity: 1 },
  ], { duration: 640, delay, easing: SPRING_STAMP, fill: 'backwards' })
}

/* ------------------------------------------------------------ sound (opt-in) */
let audio = null, soundOn = false
const NOTES = { albretsen: 523.25, 'mcp-emails': 587.33, 'fun-libs': 659.25, toolrails: 783.99, harbor: 880 }
function chime(id) {
  if (!soundOn || !audio) return
  const f = NOTES[id] || 660, t = audio.currentTime
  for (const [mult, gain, type] of [[1, 0.05, 'sine'], [2, 0.018, 'triangle'], [3.01, 0.008, 'sine']]) {
    const o = audio.createOscillator(), g = audio.createGain()
    o.type = type; o.frequency.value = f * mult
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
    o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 1.7)
  }
}
const soundBtn = $('#sound')
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn
  if (soundOn && !audio) audio = new (window.AudioContext || window.webkitAudioContext)()
  if (soundOn) audio.resume()
  soundBtn.setAttribute('aria-pressed', String(soundOn))
  $('.sound-label', soundBtn).textContent = soundOn ? 'Sound on' : 'Sound off'
  if (soundOn) chime(sky?.current || 'albretsen')
})

/* ------------------------------------------------------------ live feed */
const liveText = $('#live-text')
const fmt = e => [e.label, e.text, e.ms ? `${e.ms} ms` : e.country || e.city || (e.sha ? `#${e.sha}` : '')].filter(Boolean).join(' · ')
try {
  const feed = createFeed()
  const first = feed.recent(1)[0]
  if (first) liveText.textContent = fmt(first)
  feed.subscribe(e => {
    const swap = () => { liveText.textContent = fmt(e) }
    if (reduced) return swap()
    liveText.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 180, easing: 'ease-in' })
      .finished.then(() => { swap(); liveText.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: SPRING_SNAP }) })
  })
} catch { /* the plate still works without the feed */ }

/* ------------------------------------------------------------ hero sky */
const byId = Object.fromEntries(content.products.map(p => [p.id, p]))
const CODES = { albretsen: 'ALB-00', 'mcp-emails': 'ALB-01', 'fun-libs': 'ALB-02', toolrails: 'ALB-03', harbor: 'ALB-04' }
const caption = $('#caption'), plate = $('#plate'), canvas = $('#sky'), entry = $('#entry')
const picks = $$('.pick')
let sky = null, want = 'albretsen'

function captionFor(id) {
  if (id === 'albretsen') return `<b>${CODES[id]}</b>Albretsen AS, drawn in five real stars.`
  const p = byId[id]
  return `<b>${CODES[id]}</b>${p.name}: ${p.line} <span class="fig">${p.figure.value} ${p.figure.label}.</span>`
}
function select(id, { focus = false } = {}) {
  want = id
  picks.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === id)))
  caption.innerHTML = captionFor(id)
  if (!reduced) caption.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: SPRING_SNAP })
  sky?.show(id)
  if (focus) $(`.pick[data-id="${id}"]`).focus()
}
picks.forEach((b, i) => {
  b.addEventListener('click', () => select(b.dataset.id))
  b.addEventListener('keydown', e => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault(); picks[(i + d + picks.length) % picks.length].focus()
  })
})
picks.forEach((b, i) => land(b, { delay: 380 + i * 70 }))
// deep link: /#toolrails opens the sky on that constellation
if (CODES[location.hash.slice(1)]) select(location.hash.slice(1))

const CROPS = {
  // exact crops of the graded plate used by the hero photographs (see assets/src/export.py)
  wide: { x0: 0, y0: 0.29, w: 1, h: 0.46181 },
  tall: { x0: 0.01545, y0: 0.00274, w: 0.9691, h: 0.9945 },
}

async function wakeSky() {
  const empty = new Image()
  empty.className = 'plate-empty'; empty.alt = ''; empty.decoding = 'async'
  empty.width = 2400; empty.height = 1350
  const n = narrow.matches
  const fmt = 'webp' // 5–16 KB either way; WebP decodes fastest
  empty.srcset = n ? `img/plate-empty-tall-750.${fmt} 750w, img/plate-empty-tall-1200.${fmt} 1200w`
                   : `img/plate-empty-wide-1600.${fmt} 1600w, img/plate-empty-wide-2400.${fmt} 2400w`
  empty.sizes = '100vw'
  canvas.before(empty)
  await new Promise(res => { if (empty.complete) res(); empty.onload = empty.onerror = res; setTimeout(res, 2500) })
  const { mountSky, CONSTELLATIONS } = await import('./sky.js')
  sky = await mountSky(canvas, {
    src: new URL('../assets/interactive/cygnus-1885-stars.json', import.meta.url).href,
    crop: () => narrow.matches ? CROPS.tall : CROPS.wide,
    centerX: () => narrow.matches ? 0.5 : 0.7,
    centerY: () => narrow.matches ? 0.6 : 0.46,
    box: () => narrow.matches ? 0.6 : 0.46,
    maxW: () => narrow.matches ? 0.8 : 0.34,
    onLock: id => { chime(id); stampCaption() },
    onHover: s => showEntry(s, CONSTELLATIONS),
  })
  // the photo and the particles are registered to the same crop: swap without a seam
  plate.classList.add('is-live')
  setTimeout(() => sky.show(want), reduced ? 0 : 1100)
  narrow.addEventListener('change', () => {
    empty.srcset = narrow.matches ? `img/plate-empty-tall-750.${fmt} 750w, img/plate-empty-tall-1200.${fmt} 1200w`
                                  : `img/plate-empty-wide-1600.${fmt} 1600w, img/plate-empty-wide-2400.${fmt} 2400w`
  })
  canvas.addEventListener('dblclick', () => sky.fracture())
  addEventListener('keydown', e => {
    if (e.key.toLowerCase() !== 'f' || e.metaKey || e.ctrlKey || e.altKey) return
    if (/input|textarea/i.test(document.activeElement?.tagName)) return
    if (plate.getBoundingClientRect().bottom > 0) sky.fracture()
  })
}
function stampCaption() {
  const b = $('b', caption)
  if (!b || reduced) return
  b.animate([{ transform: 'scale(1.5) rotate(-6deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, easing: SPRING_STAMP })
}

let entryShown = false
function showEntry(s, CONSTELLATIONS) {
  if (!s) {
    if (entryShown && !reduced) entry.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' })
    else entry.style.opacity = 0
    entryShown = false; return
  }
  const part = s.part ? `<span class="part">node of ${s.part === 'albretsen' ? 'the A' : byId[s.part].name}</span>` : 'Cygnus · 13 Aug 1885'
  entry.innerHTML = `<b>№ ${String(s.n).padStart(4, '0')} · m ${s.mag}</b>x ${s.px.toFixed(3)} · y ${s.py.toFixed(3)}<br>${part}`
  const r = plate.getBoundingClientRect()
  const w = entry.offsetWidth, h = entry.offsetHeight
  const left = s.x + 22 + w > r.width - 12 ? s.x - 22 - w : s.x + 22
  const top = Math.min(r.height - h - 12, Math.max(12, s.y + 18))
  entry.style.transform = `translate(${left}px, ${top}px)`
  if (!entryShown) {
    entryShown = true
    if (reduced) entry.style.opacity = 1
    else entry.animate([{ opacity: 0, scale: 0.86, rotate: '-4deg' }, { opacity: 1, scale: 1, rotate: '0deg' }], { duration: 420, easing: SPRING_STAMP, fill: 'forwards' })
  }
}

// Wake the sky after first paint, when the browser is idle.
const idle = window.requestIdleCallback || (fn => setTimeout(fn, 200))
addEventListener('load', () => idle(() => wakeSky().catch(() => {}), { timeout: 1500 }))

/* ------------------------------------------------------------ works */
const cards = $$('.card')
cards.forEach(c => {
  const rot = rotOf(c)
  peel(c, { rot })
  loupe(c, { radius: c.offsetWidth > 300 ? 92 : 70 })
  const hidden = $('.st-loupe-hidden', c)
  c.addEventListener('pointerenter', () => {
    if (!hidden.style.backgroundImage) hidden.style.backgroundImage = `url("${c.dataset.zoom}")`
  }, { once: true })
})
const seen = new IntersectionObserver(entries => {
  for (const en of entries) {
    if (!en.isIntersecting) continue
    seen.unobserve(en.target)
    const t = en.target
    if (t.classList.contains('cards')) $$('.card', t).forEach((c, i) => pressOn(c, { delay: i * 110, rot: rotOf(c) }))
    if (t.classList.contains('frac')) setTimeout(() => fracture(t, { gap: 16 }), 250)
    if (t.classList.contains('seals')) $$('.seal', t).forEach((s, i) => land(s, { delay: i * 60, lift: 10 }))
  }
}, { threshold: 0.25 })
if (!reduced) [$('.cards'), $('.frac'), $('#seals')].forEach(el => seen.observe(el))

$$('.seal').forEach(s => {
  const slip = $('.slip', s)
  const pop = () => {
    if (reduced) return
    const r = rotOf(s)
    s.animate([{ transform: `rotate(${r}deg)` }, { transform: `rotate(${r - 8}deg) scale(1.08)` }], { duration: 520, easing: SPRING_SNAP, fill: 'forwards' })
    slip.animate([{ opacity: 0, transform: 'translateY(6px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 460, easing: SPRING_STAMP })
  }
  const settle = () => { if (!reduced) s.animate([{ transform: `rotate(${rotOf(s)}deg)` }], { duration: 480, easing: SPRING_SNAP, fill: 'forwards' }) }
  s.addEventListener('pointerenter', pop); s.addEventListener('focus', pop)
  s.addEventListener('pointerleave', settle); s.addEventListener('blur', settle)
})

/* ------------------------------------------------------------ copy */
const copyBtn = $('#copy')
copyBtn.addEventListener('click', async () => {
  const span = $('span', copyBtn)
  try { await navigator.clipboard.writeText(content.mcpCommand); span.textContent = 'Copied' }
  catch { span.textContent = 'Select it' }
  if (!reduced) span.animate([{ transform: 'scale(1.6) rotate(-8deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, easing: SPRING_STAMP })
  clearTimeout(copyBtn._t); copyBtn._t = setTimeout(() => { span.textContent = 'Copy' }, 1800)
})
