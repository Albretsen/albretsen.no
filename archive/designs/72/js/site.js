// Low Sun Terrace — design 72
// One scroll value drives one unbroken move: the spread opens to full bleed,
// the camera dollies down the gutter (the house's centre line) and the lit
// doorway fills the screen with warm light, which becomes the next page.
import { createFeed } from '../../_shared/feed.js'

const root = document.documentElement
const stage = document.getElementById('stage')
const track = document.querySelector('.track')
const canvas = document.getElementById('terrace')
const mq = (q) => matchMedia(q).matches
const reduce = mq('(prefers-reduced-motion: reduce)')
let wants3D = false
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t) }
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// ── geometry: how small the scene starts inside the plate ────────────────
const probe = document.createElement('div')
probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:var(--S);height:var(--T);padding:0;border:0'
probe.setAttribute('aria-hidden', 'true')
document.body.appendChild(probe)
function measure() {
  probe.style.height = 'var(--T)'
  const S = probe.getBoundingClientRect().width, T = probe.getBoundingClientRect().height
  probe.style.height = 'var(--B)'
  const B = probe.getBoundingClientRect().height
  const w = innerWidth, h = stage.clientHeight || innerHeight
  // the still covers the viewport at its own aspect; the live canvas is the viewport
  const ar = portrait() ? 0.8 : 16 / 9
  const live = terrace || wants3D
  const iw = live ? w : Math.max(w, h * ar), ih = live ? h : Math.max(h, w / ar)
  const s0 = Math.max((w - 2 * S) / iw, (h - T - B) / ih) + 0.004
  root.style.setProperty('--s0', s0.toFixed(4))
}

// ── the one move ─────────────────────────────────────────────────────────
let terrace = null
let target = 0, cur = 0, raf = 0
const portrait = () => mq('(max-aspect-ratio: 1/1), (max-width: 760px)')
function paint(p) {
  const e = inOut(smooth(0, 0.42, p))
  const g = smooth(0.6, 0.93, p)
  // with live 3D the camera does the travelling; the still gets a slow push instead
  const z = terrace ? 1 + 0.9 * Math.pow(smooth(0.55, 1, p), 2) : 1 + 1.9 * inOut(p)
  const s = root.style
  s.setProperty('--p', p.toFixed(4)); s.setProperty('--e', e.toFixed(4))
  s.setProperty('--g', g.toFixed(4)); s.setProperty('--z', z.toFixed(4))
  if (terrace) { terrace.setProgress(p); terrace.render() }
}
const fixedP = new URLSearchParams(location.search).get('p') // ?p=0.5 freezes the move (for stills)
if (new URLSearchParams(location.search).has("notrack")) track.style.display = "none" // contact-sheet stills only
function read() {
  if (fixedP !== null) { target = clamp01(+fixedP); return }
  const r = track.getBoundingClientRect()
  target = clamp01(-r.top / Math.max(1, r.height - innerHeight))
}
function tick() {
  cur += (target - cur) * 0.075
  if (Math.abs(target - cur) < 0.0004) cur = target
  paint(cur)
  raf = cur !== target ? requestAnimationFrame(tick) : 0
}
function kick() { read(); if (!raf) raf = requestAnimationFrame(tick) }

function setDoor() {
  // where the lit doorway sits on screen, so the push and the light aim at it
  root.style.setProperty('--door-y', terrace ? '65%' : portrait() ? '60%' : '63%')
}

wants3D = !reduce && mq("(min-width: 900px) and (min-aspect-ratio: 1/1)") && !(navigator.connection && navigator.connection.saveData)
measure(); setDoor()
if (!reduce) {
  read(); cur = target; paint(cur)
  addEventListener('scroll', kick, { passive: true })
}
addEventListener('resize', () => {
  measure(); setDoor()
  if (terrace) terrace.resize(innerWidth, stage.clientHeight || innerHeight)
  if (!reduce) kick()
})

// ── live 3D after first paint, only where it pays off ────────────────────
if (wants3D) {
  const start = async () => {
    try {
      const { createTerrace } = await import('../assets/3d/terrace.js')
      const dpr = Math.min(devicePixelRatio || 1, 1.5)
      terrace = await createTerrace(canvas, { width: innerWidth, height: stage.clientHeight || innerHeight, dpr, ao: false, shadowSize: 2048 })
      setDoor(); paint(cur)
      canvas.classList.add('on')
    } catch (err) { terrace = null; wants3D = false; measure(); setDoor(); paint(cur) }
  }
  addEventListener('load', () => (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(start, { timeout: 2500 }), { once: true })
}

// ── footnote: tap toggles it on touch screens ────────────────────────────
const mark = document.querySelector('.note-mark')
mark.addEventListener('click', () => stage.classList.toggle('show-note'))
mark.addEventListener('blur', () => stage.classList.remove('show-note'))

// ── live feed, set as the right-hand page's footer ───────────────────────
const feedText = document.getElementById('feed-text')
const dot = document.querySelector('.feed .dot')
const describe = (e) => {
  const tail = e.country || e.city || (e.ms ? `${e.ms} ms` : '')
  return [e.label, e.text, tail].filter(Boolean).join('  ·  ')
}
try {
  const feed = createFeed()
  const [first] = feed.recent(1)
  if (first) feedText.textContent = describe(first)
  feed.subscribe((e) => {
    feedText.textContent = describe(e)
    if (!reduce) {
      feedText.classList.remove('swap'); dot.classList.remove('ping')
      void feedText.offsetWidth
      feedText.classList.add('swap'); dot.classList.add('ping')
    }
  })
} catch { /* the static line stays */ }

// ── products: hold the miniature in your hand (a slight tilt) ────────────
if (!reduce && mq('(hover: hover) and (pointer: fine)')) {
  for (const link of document.querySelectorAll('.lot-link')) {
    const img = link.querySelector('.lot-img')
    link.addEventListener('pointermove', (ev) => {
      const r = img.getBoundingClientRect()
      const x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5
      img.style.setProperty('--ry', (x * 4).toFixed(2) + 'deg')
      img.style.setProperty('--rx', (-y * 3).toFixed(2) + 'deg')
    })
    link.addEventListener('pointerleave', () => { img.style.removeProperty('--rx'); img.style.removeProperty('--ry') })
  }
}

// ── retired plaques: a museum label that answers the pointer ─────────────
const label = document.getElementById('label')
const labelDefault = label.innerHTML
const plaques = [...document.querySelectorAll('.plaque')]
let pinned = null
function show(btn) {
  const { name, since, line, fig } = btn.dataset
  label.innerHTML = ''
  const n = document.createElement('span'); n.className = 'label-name'; n.textContent = name
  const sm = document.createElement('small'); sm.textContent = `${since}${fig ? '  ·  ' + fig : ''}`; n.appendChild(sm)
  const l = document.createElement('span'); l.className = 'label-line'; l.textContent = line
  label.append(n, l)
  label.classList.remove('swap'); void label.offsetWidth; label.classList.add('swap')
}
function reset() { if (pinned) return show(pinned); label.innerHTML = labelDefault; label.classList.remove('swap') }
for (const b of plaques) {
  b.setAttribute('aria-pressed', 'false')
  b.addEventListener('pointerenter', () => show(b))
  b.addEventListener('focus', () => show(b))
  b.addEventListener('pointerleave', reset)
  b.addEventListener('blur', reset)
  b.addEventListener('click', () => {
    pinned = pinned === b ? null : b
    plaques.forEach((x) => x.setAttribute('aria-pressed', String(x === pinned)))
    pinned ? show(pinned) : reset()
  })
}

// ── copy the MCP line ────────────────────────────────────────────────────
const copy = document.getElementById('copy')
const said = document.getElementById('copied')
const cmd = document.getElementById('cmd')
let copyT = 0
copy.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(cmd.textContent) } catch {
    const r = document.createRange(); r.selectNodeContents(cmd)
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); document.execCommand('copy')
  }
  copy.classList.add('done'); copy.querySelector('.copy-t').textContent = 'Copied'; said.textContent = 'Copied to clipboard'
  clearTimeout(copyT)
  copyT = setTimeout(() => { copy.classList.remove('done'); copy.querySelector('.copy-t').textContent = 'Copy'; said.textContent = '' }, 1800)
})
