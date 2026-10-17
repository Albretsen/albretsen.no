// Escape Vector, page wiring. Vanilla ES modules; physics from assets/motion.js.
import { Spring, loop, decode, zeroG, drift, reduced } from '../assets/motion.js'
import { createFeed, formatTime } from '../../_shared/feed.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const RM = reduced()
const finePointer = matchMedia('(pointer: fine)').matches

/* ------------------------------------------------------------- sound (opt-in) */
let ac = null, soundOn = false, lastBlip = 0
function blip(freq = 880, dur = 0.07, gain = 0.04) {
  if (!soundOn || !ac) return
  const now = ac.currentTime
  if (now - lastBlip < 0.05) return
  lastBlip = now
  const o = ac.createOscillator(), g = ac.createGain()
  o.type = 'sine'; o.frequency.setValueAtTime(freq, now); o.frequency.exponentialRampToValueAtTime(freq * 0.5, now + dur)
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(gain, now + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  o.connect(g).connect(ac.destination); o.start(now); o.stop(now + dur + 0.02)
}
const sndBtn = $('#sound')
sndBtn.addEventListener('click', () => {
  soundOn = !soundOn
  if (soundOn && !ac) ac = new (window.AudioContext || window.webkitAudioContext)()
  if (ac && soundOn) ac.resume()
  sndBtn.setAttribute('aria-pressed', String(soundOn))
  $('.snd-t', sndBtn).textContent = soundOn ? 'Sound on' : 'Sound off'
  if (soundOn) { blip(660, 0.09); setTimeout(() => blip(990, 0.12), 90) }
})

/* ------------------------------------------------------------- decode headlines */
const h1Parts = $$('h1 [data-decode]')
h1Parts.forEach((el, i) => decode(el, { duration: 1100, delay: 150 + i * 380 }))
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return
  io.unobserve(e.target)
  decode(e.target, { duration: e.target.classList.contains('fig-v') ? 1300 : 950 }).then(() => blip(1320, 0.05, 0.025))
}), { threshold: 0.5 })
$$('[data-decode]').filter((el) => !el.closest('h1')).forEach((el) => io.observe(el))

/* ------------------------------------------------------------- downlink feed */
const feed = createFeed()
const list = $('#feed')
const MAX = innerWidth < 860 ? 4 : 5
const detail = (e) => e.ms ? `${e.ms} ms` : e.country || (e.sha ? `${e.sha}` : e.city || '')
function row(e, fresh) {
  const li = document.createElement('li')
  li.innerHTML = `<span class="dl-time">${formatTime(e.time)}</span><span class="p">${e.label}</span><span class="t"></span>`
  const t = $('.t', li); const d = detail(e)
  t.textContent = d ? `${e.text} · ${d}` : e.text
  if (fresh) { li.classList.add('enter', 'new'); setTimeout(() => li.classList.remove('new'), 2600); decode(t, { duration: 700 }) }
  return li
}
feed.recent(MAX).forEach((e) => list.append(row(e, false)))
feed.subscribe((e) => {
  list.prepend(row(e, !RM))
  while (list.children.length > MAX) list.lastElementChild.remove()
  blip(e.product === 'fun-libs' ? 520 : 780, 0.06, 0.02)
})

/* ------------------------------------------------------------- terrain (lazy, after first paint) */
const terrainEl = $('#terrain')
const hudPos = $('#hud-pos'), hudAlt = $('#hud-alt'), hudLvl = $('#hud-lvl'), hudG = $('#hud-g'), hudLock = $('#hud-lock')
const gravBtn = $('#grav')
const P = '../_shared/products/'
const beacons = [
  { id: 'mcp-emails', name: 'MCP Emails', logo: P + 'mcp-emails/logo-mark.svg', fig: '$782 MRR' },
  { id: 'fun-libs', name: 'Fun Libs', logo: P + 'fun-libs/icon.png', full: true, fig: '113,000+ installs' },
  { id: 'toolrails', name: 'Toolrails', logo: P + 'toolrails/icon.svg', full: true, fig: '4 connectors' },
  { id: 'harbor', name: 'Harbor', logo: P + 'harbor/harbor-mark.svg', fig: '549 commits' },
]
const origin = () => innerWidth < 860 ? [0.5, 0.6] : innerWidth < 1100 ? [0.72, 0.6] : [0.7, 0.6]
let terrain = null, lastLock = null, zeroGState = false
const pad = (n, w = 3) => String(n).padStart(w, '0')
function onProbe({ u, v, alt, lvl, zeroG: zg, locked }) {
  hudPos.textContent = `${(u * 100).toFixed(1).padStart(5, '0')} / ${(v * 100).toFixed(1).padStart(5, '0')}`
  hudAlt.textContent = pad(Math.round(alt * 100)); hudLvl.textContent = pad(lvl, 2)
  hudG.innerHTML = zg ? '<b>0.0</b>' : '1.0'
  if (zg !== zeroGState) { zeroGState = zg; astroLift.target = zg ? -60 : 0; moonLift.target = zg ? -24 : 0 }
  if (locked !== lastLock) {
    lastLock = locked
    if (locked) {
      hudLock.classList.add('on')
      hudLock.innerHTML = `Lock <span class="n">${locked.name}</span> <span class="v">${locked.fig}</span>`
      decode($('.n', hudLock), { duration: 420 })
      blip(1180, 0.08, 0.035)
    } else { hudLock.classList.remove('on'); hudLock.textContent = 'Scanning for payloads' }
  }
}
function follow(b) { go(`#p-${b.id}`) }
async function mountHeroTerrain() {
  const { mountTerrain } = await import('./terrain.js')
  terrain = mountTerrain(terrainEl, { beacons, origin: origin(), onProbe, onFollow: follow })
  addEventListener('resize', () => terrain.setOrigin(origin()))
}
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 60))
requestAnimationFrame(() => idle(mountHeroTerrain, { timeout: 600 }))
gravBtn.addEventListener('click', () => {
  if (!terrain) return
  const off = terrain.gravity(!terrain.gravityOff)
  gravBtn.setAttribute('aria-pressed', String(off))
  $('.grav-t', gravBtn).textContent = off ? 'Gravity 0.0' : 'Gravity 1.0'
  blip(off ? 440 : 330, 0.18, 0.04)
})
terrainEl.addEventListener('keydown', (e) => { if ((e.key === 'g' || e.key === 'G') && terrain) { const off = terrain.gravityOff; gravBtn.setAttribute('aria-pressed', String(off)); $('.grav-t', gravBtn).textContent = off ? 'Gravity 0.0' : 'Gravity 1.0' } })

/* ------------------------------------------------------------- moon + astronaut parallax on springs */
const moon = $('.moon'), astro = $('.astro')
const mx = new Spring(0, { stiffness: 40, damping: 12 }), my = new Spring(0, { stiffness: 40, damping: 12 })
const astroLift = new Spring(0, { stiffness: 30, damping: 5 }), moonLift = new Spring(0, { stiffness: 26, damping: 7 })
let heroLoop = null
const tHero = performance.now()
function startHero() {
  if (heroLoop || RM) return
  heroLoop = loop((dt) => {
    mx.step(dt); my.step(dt); astroLift.step(dt); moonLift.step(dt)
    const t = (performance.now() - tHero) / 1000
    moon.style.transform = `translate3d(${(mx.value * -18).toFixed(2)}px, ${(my.value * -14 + moonLift.value).toFixed(2)}px, 0)`
    const fx = Math.sin(t / 4.1) * 10, fy = Math.sin(t / 3) * 14, rot = Math.sin(t / 6.3) * 7 + mx.value * 6
    astro.style.transform = `translate3d(${(mx.value * 46 + fx).toFixed(2)}px, ${(my.value * 30 + fy + astroLift.value).toFixed(2)}px, 0) rotate(${(rot - 8).toFixed(2)}deg)`
    return heroLoop !== null
  })
}
$('.hero').addEventListener('pointermove', (e) => { mx.target = e.clientX / innerWidth - 0.5; my.target = e.clientY / innerHeight - 0.5 })
new IntersectionObserver(([e]) => { if (e.isIntersecting) startHero(); else heroLoop = null }).observe($('.hero'))

/* ------------------------------------------------------------- magnetic command chip */
$$('[data-magnetic]').forEach((el) => {
  if (RM || !finePointer) return
  const x = new Spring(0, { stiffness: 220, damping: 15 }), y = new Spring(0, { stiffness: 220, damping: 15 })
  let on = false
  const run = () => { if (on) return; on = true; loop((dt) => { x.step(dt); y.step(dt); el.style.transform = `translate(${x.value.toFixed(2)}px, ${y.value.toFixed(2)}px)`; on = !(x.resting && y.resting); return on }) }
  addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const dx = e.clientX - cx, dy = e.clientY - cy
    const inside = Math.abs(dx) < r.width / 2 + 60 && Math.abs(dy) < r.height / 2 + 60
    x.target = inside ? dx * 0.08 : 0; y.target = inside ? dy * 0.22 : 0; run()
  }, { passive: true })
})

/* ------------------------------------------------------------- copy */
$$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
  const text = $(btn.dataset.copy).textContent.trim()
  const label = $('[data-label]', btn)
  try { await navigator.clipboard.writeText(text); label.textContent = 'Copied' } catch { label.textContent = 'Select' ; getSelection().selectAllChildren($(btn.dataset.copy)) }
  delete label.dataset.text
  decode(label, { duration: 380 }); blip(1500, 0.06, 0.03)
  clearTimeout(btn._t); btn._t = setTimeout(() => { label.textContent = 'Copy'; delete label.dataset.text }, 2000)
}))

/* ------------------------------------------------------------- zero-G cards, drifting stickers */
if (finePointer) $$('.zg').forEach((el) => zeroG(el, { tilt: 5, lift: 28 }))
$$('[data-drift]').forEach((el) => drift(el, { amp: 7, period: 8, rot: 3 }))

/* ------------------------------------------------------------- trajectory burns as you scroll */
const traj = $('#traj'), plList = $('.pl-list')
let trajQueued = false
function trajUpdate() {
  trajQueued = false
  const r = plList.getBoundingClientRect()
  const p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height))
  traj.style.strokeDashoffset = String(1 - p)
}
addEventListener('scroll', () => { if (!trajQueued) { trajQueued = true; requestAnimationFrame(trajUpdate) } }, { passive: true })
trajUpdate()

/* ------------------------------------------------------------- radiolarian toy (lazy) */
const radEl = $('#radiolarian')
new IntersectionObserver(async ([e], obs) => {
  if (!e.isIntersecting) return
  obs.disconnect()
  const { mountRadiolarian } = await import('../assets/3d/radiolarian.js')
  const size = radEl.getBoundingClientRect().width
  mountRadiolarian(radEl, { radius: Math.max(90, size * 0.3), texture: 'assets/img/radiolarian-icosa-ink-450.webp' })
}, { rootMargin: '300px' }).observe(radEl)

/* ------------------------------------------------------------- email scramble on hover */
$$('[data-scramble]').forEach((el) => {
  let busy = false
  const run = () => { if (busy || RM) return; busy = true; decode(el, { duration: 650 }).then(() => (busy = false)) }
  el.addEventListener('pointerenter', run); el.addEventListener('focus', run)
})

/* ------------------------------------------------------------- escape-burn navigation (view transitions) */
function go(hash) {
  const target = $(hash); if (!target) return
  const jump = () => { target.scrollIntoView({ behavior: 'instant', block: 'start' }); history.replaceState(null, '', hash) }
  if (document.startViewTransition && !RM) document.startViewTransition(jump)
  else target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' })
}
$$('a[data-burn]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); go(a.getAttribute('href')) }))

