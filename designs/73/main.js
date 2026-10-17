// Long Evening · design 73 · Albretsen AS
import { content } from '../_shared/content.js'
import { createFeed } from '../_shared/feed.js'
import { norwayClock, norwayAt } from './assets/interactive/sun.js'
import { inkSettle, lightsOn, skySync } from './assets/motion.js'
import './assets/interactive/sky-clock.js'

const $ = (s, r = document) => r.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t) }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/* ---------- the real sky ---------- */
skySync()
const root = document.documentElement
const clockEl = $('#clock')
const tickClock = () => { clockEl.textContent = norwayClock() }
tickClock(); setInterval(tickClock, 30000)

const chip = $('#skychip')
chip.setAttribute('aria-expanded', 'false')
chip.addEventListener('click', () => chip.setAttribute('aria-expanded', chip.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'))
chip.addEventListener('blur', () => chip.setAttribute('aria-expanded', 'false'))
addEventListener('keydown', (e) => { if (e.key === 'Escape') chip.setAttribute('aria-expanded', 'false') })

/* ---------- the Long Dissolve: the day ahead, in one scroll ---------- */
// Each scene: the hour it was baked at, and the inks the type takes over it.
const SCENES = {
  sunrise: { hour: '07:00', label: 'sunrise', name: '#fbf5ec', name2: '#9e3b2e', ink: '#1d1f24', night: 0 },
  noon:    { hour: '13:30', label: 'noon',    name: '#9e3b2e', name2: '#f6b48f', ink: '#1d1f24', night: 0 },
  sunset:  { hour: '20:15', label: 'sunset',  name: '#fbf5ec', name2: '#b0574a', ink: '#1d1f24', night: 0 },
  night:   { hour: '23:45', label: 'light night', name: '#f6b48f', name2: '#2f3a60', ink: '#fbf5ec', night: 1 },
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})` }

const day = $('#day'), stage = $('.stage', day)
const stills = [...day.querySelectorAll('.still[data-scene]')].sort((a, b) => a.dataset.order - b.dataset.order)
const order = stills.map((s) => s.dataset.scene)
const sunDot = $('.daytrack__sun'), trackTime = $('#trackTime'), trackName = $('#trackName')

function hydrate(pic) {
  if (pic.hasAttribute('data-ready')) return
  for (const s of pic.querySelectorAll('[data-srcset]')) { s.sizes = s.media ? 'max(100vw, 80vh)' : 'max(100vw, 178vh)'; s.srcset = s.dataset.srcset }
  const img = pic.querySelector('img'); img.src = img.dataset.src
  pic.setAttribute('data-ready', '')
}
// The rest of the day loads once the first still is on screen.
const later = () => stills.slice(1).forEach(hydrate)
if (document.readyState === 'complete') (window.requestIdleCallback || setTimeout)(later)
else addEventListener('load', () => (window.requestIdleCallback || setTimeout)(later), { once: true })
addEventListener('scroll', later, { once: true, passive: true })
if (new URLSearchParams(location.search).has('day')) later()

const quad = (t) => { const x = (1 - t) ** 2 * 8 + 2 * (1 - t) * t * 120 + t * t * 232, y = (1 - t) ** 2 * 62 + 2 * (1 - t) * t * -22 + t * t * 62; return [x, y] }

let lastS = -1
const qs = new URLSearchParams(location.search)
const FORCE = qs.has('day') ? +qs.get('day') : null   // review helper: ?day=0.5 pins the hero halfway through the day
function paintDay() {
  const r = day.getBoundingClientRect()
  const span = r.height - innerHeight
  const p = FORCE ?? (span > 0 ? clamp(-r.top / span) : 0)
  const s = reduce.matches ? Math.round(p * 3) : p * 3     // 0…3 across four scenes
  if (Math.abs(s - lastS) < 1e-4) return
  lastS = s
  // upper stills only ever fade in over the one below; each holds for a while before the next arrives
  stills.forEach((el, j) => {
    if (!j) return
    const o = smooth(j - .78, j - .12, s)
    el.style.opacity = o.toFixed(3)
    el.style.transform = reduce.matches ? 'none' : `scale(${(1.035 - .035 * o).toFixed(4)})`
  })
  const k = Math.min(2, Math.floor(s)), t = smooth(k + .22, k + .88, s)
  const A = SCENES[order[k]], B = SCENES[order[k + 1]]
  stage.style.setProperty('--name', mix(A.name, B.name, t))
  stage.style.setProperty('--name2', mix(A.name2, B.name2, t))
  stage.style.setProperty('--ink', mix(A.ink, B.ink, t))
  stage.style.setProperty('--night', (A.night + (B.night - A.night) * t).toFixed(3))
  const [x, y] = quad(s / 3)
  sunDot.setAttribute('cx', x.toFixed(1)); sunDot.setAttribute('cy', y.toFixed(1))
  const cur = SCENES[order[Math.round(s)]]
  trackTime.textContent = Math.round(s) === 0 ? 'Now ' + norwayClock() : cur.hour
  trackName.textContent = cur.label
}
let raf = 0
addEventListener('scroll', () => { raf ||= requestAnimationFrame(() => { raf = 0; paintDay() }) }, { passive: true })
addEventListener('resize', () => { lastS = -1; paintDay() })
reduce.addEventListener?.('change', () => { lastS = -1; paintDay() })
paintDay()

inkSettle()
lightsOn()

/* ---------- the main street ---------- */
const P = '../_shared/products/'
const SHOPS = {
  'mcp-emails': { hour: '09:30', logo: `<img src="${P}mcp-emails/logo-wordmark.svg" width="175" height="30" alt="MCP Emails">` },
  'fun-libs': { hour: '13:30', logo: `<img class="icon" src="${P}fun-libs/icon.png" width="30" height="30" alt="" loading="lazy">Fun Libs` },
  toolrails: { hour: '20:15', logo: `<img class="icon" src="${P}toolrails/icon.svg" width="30" height="30" alt="">Toolrails` },
  harbor: { hour: '23:45', logo: `<img src="${P}harbor/harbor-wordmark.svg" width="120" height="30" alt="Harbor">` },
}
const STATUS = { live: 'Open', building: 'Building', paused: 'Paused' }
const ALT = {
  'mcp-emails': 'A cream deco shopfront in morning light with the MCP Emails logo on its enamel fascia',
  'fun-libs': 'A falu red wooden bakery at midday with the Fun Libs icon hung as its sign',
  toolrails: 'A flamingo pink deco tower at sunset with the Toolrails icon on a blade sign',
  harbor: 'A wooden house at night, windows lit, with the Harbor logo on a board',
}
const live = content.products.filter((p) => SHOPS[p.id])
$('#shops').innerHTML = live.map((p) => {
  const S = SHOPS[p.id], A = `assets/products/${p.id}`
  return `<li class="shop" data-id="${p.id}">
    <div class="shop__pic">
      <picture>
        <source type="image/avif" srcset="${A}-560.avif 560w, ${A}-960.avif 960w" sizes="(min-width: 1080px) 290px, (min-width: 560px) 46vw, 92vw">
        <source type="image/webp" srcset="${A}-560.webp 560w">
        <img src="${A}-720.jpg" width="720" height="900" alt="${esc(ALT[p.id])}" loading="lazy" decoding="async">
      </picture>
      <span class="shop__hour">${S.hour}</span>
      <span class="shop__status" data-s="${p.status}">${STATUS[p.status] || p.status}</span>
    </div>
    <div class="shop__body">
      <h3 class="shop__logo">${S.logo}</h3>
      <p class="shop__line">${esc(p.line)}</p>
      ${p.figure ? `<p class="shop__fig"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></p>` : ''}
      ${p.facts ? `<ul class="shop__facts">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      <a class="shop__link" href="${p.url}" rel="noopener">${new URL(p.url).host} <span aria-hidden="true">→</span></a>
    </div>
  </li>`
}).join('')

const PLAQUE = { luma: `${P}luma/logo.png`, 'polyglot-pilot': 'polyglot-pilot', pinpoint: 'pinpoint', webvakt: 'webvakt', 'joke-central': 'joke-central', 'tryggere-hyring': 'tryggere-hyring', 'early-apps': 'early-apps' }
$('#plaques').innerHTML = content.products.filter((p) => p.status === 'retired').map((p) => {
  const src = p.id === 'luma' ? PLAQUE.luma : `assets/products/retired/${PLAQUE[p.id] || p.id}.svg`
  return `<li class="plaque"><img ${p.id === 'luma' ? 'class="luma"' : ''} src="${src}" width="58" height="41" alt="" loading="lazy"><div><b>${esc(p.name)} <span style="display:inline;opacity:.5;font-weight:700">· ${p.since}</span></b><span>${esc(p.line)}</span></div></li>`
}).join('')

/* ---------- live feed: one lit window at a time ---------- */
const feedEl = $('#feed')
const fmt = (e) => {
  const extra = e.country ? ` · ${e.country}` : e.ms ? ` · ${e.ms} ms` : ''
  return `<b>${esc(e.label)}</b> <i>·</i> ${esc(e.text)}<i>${esc(extra)}</i>`
}
try {
  const feed = createFeed()
  const first = feed.recent(1)[0]
  if (first) feedEl.innerHTML = fmt(first)
  feed.subscribe((e) => {
    if (reduce.matches) { feedEl.innerHTML = fmt(e); return }
    feedEl.classList.add('is-out')
    setTimeout(() => { feedEl.innerHTML = fmt(e); feedEl.classList.remove('is-out') }, 480)
  })
} catch {}

/* ---------- the live street (three.js loads only when asked) ---------- */
const go = $('#liveGo'), range = $('#liveRange'), nowBtn = $('#liveNow'), liveClock = $('#liveClock'), skyClocks = document.querySelectorAll('sky-clock')
const liveStill = $('#liveStill')
// the poster below the products shows the street at the hour it is now
const nowScene = root.dataset.now || 'sunset'
liveStill.src = `assets/hero/street-${nowScene}-800.webp`
liveStill.previousElementSibling.srcset = `assets/hero/street-${nowScene}-800.avif 800w, assets/hero/street-${nowScene}-1440.avif 1440w`
const setNowUI = () => { const n = new Date(), c = norwayClock(n); liveClock.textContent = c; const [h, m] = c.split(':').map(Number); range.value = h + m / 60 }
setNowUI()
let st = null, following = true
setInterval(() => { if (following) setNowUI() }, 30000)

async function walk() {
  if (st) return
  go.classList.add('is-loading'); go.lastChild.textContent = 'Lighting the street…'
  try {
    const { createStreet } = await import('./assets/interactive/street.js')
    const canvas = $('#liveCanvas')
    st = createStreet(canvas, { live: true, view: canvas.clientWidth / canvas.clientHeight < 1.2 ? 'wide' : 'street' })
    await st.setSigns({ 'mcp-emails': P + 'mcp-emails/logo-wordmark.svg', 'fun-libs': P + 'fun-libs/icon.png', toolrails: P + 'toolrails/icon.svg', harbor: P + 'harbor/harbor-wordmark.svg' })
    st.applyTime(new Date()); st.render()
    canvas.classList.add('on')
    if (!reduce.matches) st.start()
    go.hidden = true
    range.disabled = false; nowBtn.disabled = false
    range.focus({ preventScroll: true })
  } catch (err) {
    go.classList.remove('is-loading'); go.lastChild.textContent = 'The street stays a poster today'
    console.warn(err)
  }
}
go.addEventListener('click', walk)
range.addEventListener('input', () => {
  if (!st) return
  following = false; st.setLive(false); nowBtn.setAttribute('aria-pressed', 'false')
  const h = +range.value, d = norwayAt(Math.floor(h), Math.round((h % 1) * 60))
  st.applyTime(d); st.render(); liveClock.textContent = norwayClock(d)
  skyClocks[0].hours = h
})
nowBtn.addEventListener('click', () => {
  if (!st) return
  following = true; st.setLive(true); nowBtn.setAttribute('aria-pressed', 'true'); skyClocks[0].hours = null
  setNowUI(); st.applyTime(new Date()); st.render()
})
if (qs.has('live')) walk()
// review helper: ?day=0.5 jumps that far through the hero's day


/* ---------- copy the MCP line ---------- */
const copy = $('#copy'), copied = $('#copied')
copy.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#cmd').textContent) } catch { const r = document.createRange(); r.selectNodeContents($('#cmd')); getSelection().removeAllRanges(); getSelection().addRange(r) }
  copy.textContent = 'Copied'; copy.classList.add('is-done'); copied.textContent = 'Command copied'
  setTimeout(() => { copy.textContent = 'Copy'; copy.classList.remove('is-done'); copied.textContent = '' }, 1800)
})
