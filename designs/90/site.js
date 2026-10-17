// Six Faces / design 90 — page behaviour.
// The hero die chooses the scene: whichever true number lands face up, the photograph
// behind it develops into that number's place. Everything else is quiet.

import { content } from '../_shared/content.js'
import { createFeed } from '../_shared/feed.js'
import { createThrowCube } from './assets/interactive/throw-cube.js'
import { FACES } from './assets/interactive/faces.js'
import { theTurn, currentTheme, develop, honestCount, redact, onceVisible } from './assets/motion.js'

const MOTION_URL = 'https://cdn.jsdelivr.net/npm/motion@13.4.6/+esm'
let motionP = null
const getMotion = () => Promise.race([(motionP ||= import(MOTION_URL).catch(() => null)), new Promise((r) => setTimeout(() => r(null), 1200))])
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const idle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 900))

if (matchMedia('(hover: none)').matches) document.documentElement.classList.add('is-touch')

/* ---------- facts check: the page copy must match content.js ---------- */
for (const card of $$('.die-card')) {
  const p = content.products.find((x) => x.id === card.dataset.product)
  const shown = $('.count', card)?.dataset.count
  if (!p || p.figure?.value !== shown || p.status !== card.dataset.status) console.warn('[90] fact mismatch', card.dataset.product)
}

/* ---------- scenes: one photograph per face ---------- */
const S = (base, avif, webp, jpg, w, h) => ({ base, avif, webp, jpg, w, h })
const SCENES = {
  summit: S('assets/hero/summit-night', [640, 1280, 1920, 2560], [640, 1280, 1920], 1280, 1280, 850),
  tracks: S('assets/extras/tracks-night', [800, 1600], [800], 800, 800, 601),
  orbit: S('assets/hero/orbit-night', [640, 1280, 1920], [640, 1280, 1920], 1280, 1280, 784),
  lights: S('assets/extras/lights-night', [800, 1600], [800, 1600], 800, 800, 600),
}
const FACE_SCENE = { 'mcp-emails': 'aurora', 'fun-libs': 'summit', toolrails: 'tracks', harbor: 'orbit', retired: 'field', since: 'lights' }
const CREDIT = {
  aurora: 'Photograph: Unsplash via Commons, CC0 · graded',
  summit: 'Photograph: Unsplash via Commons, CC0 · graded',
  tracks: 'Photograph: Wikimedia Commons, CC0 · graded',
  orbit: 'Photograph: NASA, public domain · graded',
  lights: 'Black Marble: NASA, public domain · graded',
  field: 'Vector field: generated, salt 033eb1',
}
const scenesEl = $('.scenes')
// what the die cannot fit on a face, said plainly
const SAY = {
  'mcp-emails': 'MCP Emails earns $782 a month. Not rounded, because it is not round.',
  'fun-libs': 'Fun Libs: built at 17, never marketed, 113,000+ installs.',
  toolrails: 'Toolrails has 4 connectors. It is not finished, and says so.',
  harbor: 'Harbor stopped at 549 commits. Paused, not pretended.',
  retired: 'Seven products retired. They stay on the list below.',
  since: 'First app on Google Play in 2016. Still shipping.',
}

function pictureHTML(s, extra = '') {
  const set = (fmt, ws) => ws.map((w) => `${s.base}-${w}.${fmt} ${w}w`).join(', ')
  return `<picture${extra}><source type="image/avif" srcset="${set('avif', s.avif)}" sizes="100vw"><source type="image/webp" srcset="${set('webp', s.webp)}" sizes="100vw"><img src="${s.base}-${s.jpg}.jpg" width="${s.w}" height="${s.h}" alt="" decoding="async"></picture>`
}
function sceneEl(name) {
  let el = scenesEl.querySelector(`[data-scene="${name}"]`)
  if (el) return el
  if (name === 'field') { el = document.createElement('div'); el.className = 'scene'; el.dataset.scene = 'field' }
  else { el = document.createElement('div'); el.className = 'scene'; el.dataset.scene = name; el.innerHTML = pictureHTML(SCENES[name]) }
  scenesEl.append(el)
  return el
}
const ready = (el, ms = 1500) => {
  const img = el.querySelector('img:not([hidden])')
  if (!img) return Promise.resolve()
  return Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, ms))])
}

let sceneWant = 'aurora', sceneToken = 0
async function showScene(name) {
  if (name === sceneWant) return
  sceneWant = name
  const token = ++sceneToken
  const next = sceneEl(name)
  await ready(next)
  if (token !== sceneToken) return
  $('#credit').textContent = CREDIT[name]
  $$('.scene.is-developing', scenesEl).forEach((s) => s.classList.remove('is-developing'))
  const finish = () => {
    $$('.scene.is-on', scenesEl).forEach((s) => s !== next && s.classList.remove('is-on'))
    next.classList.remove('is-developing'); next.classList.add('is-on')
  }
  if (reduced() || next.classList.contains('is-on')) return finish()
  next.style.setProperty('--p', 0); next.classList.add('is-developing')
  const M = await getMotion()
  if (token !== sceneToken) return
  if (M) await M.animate(0, 1, { duration: 1.05, ease: [0.65, 0, 0.35, 1], onUpdate: (v) => token === sceneToken && next.style.setProperty('--p', v.toFixed(4)) }).finished
  if (token === sceneToken) finish()
}

/* the day face of the hero is its own print, not a filter */
function addAuroraDay() {
  const aur = scenesEl.querySelector('[data-scene="aurora"]')
  if (aur.querySelector('.dayver')) return aur.querySelector('.dayver img')
  aur.insertAdjacentHTML('beforeend', pictureHTML(S('assets/hero/aurora-day', [640, 1280, 1920], [640, 1280, 1920], 1280, 1280, 854), ' class="dayver"'))
  aur.dataset.day = ''
  return aur.querySelector('.dayver img')
}

/* ---------- the Honest Die ---------- */
const stage = $('#die'), wrap = $('.stage-wrap'), readout = $('#readout'), hint = $('#hint')
const r = wrap.getBoundingClientRect()
const size = Math.round(Math.max(130, Math.min(250, r.width * (innerWidth < 820 ? 0.56 : 0.46), r.height * 0.56)))
const die = createThrowCube(stage, FACES, { size, intro: false })
let first = true

stage.addEventListener('pointerdown', () => {
  hint.classList.add('is-gone')
  // warm the other scenes while the die is in the hand
  Object.keys(SCENES).forEach((n) => { const el = sceneEl(n); el.querySelector('img').loading = 'eager' })
}, { once: true })
stage.addEventListener('keydown', () => hint.classList.add('is-gone'), { once: true })

stage.addEventListener('settle', (e) => {
  const { data: f, index } = e.detail
  if (!first) {
    readout.classList.remove('is-swapping'); void readout.offsetWidth; readout.classList.add('is-swapping')
    knock()
  }
  $('.ro-k', readout).textContent = `Face ${index + 1}/6 · ${f.kicker}`
  $('.ro-v', readout).innerHTML = `<b>${f.value}</b> ${f.label}`
  $('.ro-n', readout).textContent = SAY[f.id] || f.note
  if (!first) showScene(FACE_SCENE[f.id])
  first = false
})

/* ---------- sound: opt-in, one soft knock when the die lands ---------- */
let ac = null, soundOn = false
const soundBtn = $('.sound')
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn
  soundBtn.setAttribute('aria-pressed', String(soundOn))
  $('.sound-label', soundBtn).textContent = soundOn ? 'Sound on' : 'Sound off'
  if (soundOn) { ac ||= new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); knock(0.5) }
})
function knock(gain = 1) {
  if (!soundOn || !ac) return
  const t = ac.currentTime
  const o = ac.createOscillator(), g = ac.createGain()
  o.type = 'sine'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.18)
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26)
  const len = Math.floor(ac.sampleRate * 0.04), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), ng = ac.createGain()
  n.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 1.2; ng.gain.value = 0.18 * gain
  o.connect(g).connect(ac.destination); n.connect(bp).connect(ng).connect(ac.destination)
  o.start(t); o.stop(t + 0.3); n.start(t)
}

/* ---------- THE TURN: the theme switch ---------- */
const turnBtn = $('#turn'), meta = $('meta[name="theme-color"]')
function syncTurn() {
  const day = currentTheme() === 'day'
  turnBtn.setAttribute('aria-pressed', String(day))
  $('.ts-label', turnBtn).textContent = day ? 'Day' : 'Nocturne'
  meta.content = day ? '#f1f8ff' : '#00226c'
}
if (currentTheme() === 'day') addAuroraDay()
syncTurn()
turnBtn.addEventListener('pointerenter', () => addAuroraDay(), { once: true })
turnBtn.addEventListener('focus', () => addAuroraDay(), { once: true })
turnBtn.addEventListener('click', async () => {
  if (currentTheme() !== 'day') { const img = addAuroraDay(); await Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 900))]) }
  await theTurn()
  syncTurn()
})

/* ---------- scroll-triggered: develop, honest count, redact ---------- */
onceVisible($$('.develop'), (el) => develop(el))
onceVisible($$('.count[data-count]'), (el) => { el.style.display = 'inline-block'; el.style.minWidth = el.getBoundingClientRect().width + 'px'; honestCount(el) })
onceVisible($$('.redact'), (el) => {
  const i = $$('.redact').indexOf(el)
  setTimeout(() => redact(el), reduced() ? 0 : (i % 7) * 90)
}, '0px 0px -8% 0px')

/* ---------- live event feed: one quiet line ---------- */
const feed = createFeed(), feedText = $('#feed-text'), feedP = $('.feed')
const fmt = (e) => `${e.label} · ${e.text}${e.ms ? ` · ${e.ms} ms` : ''}${e.country ? ` · ${e.country}` : ''}`
const latest = feed.recent(1)[0]
if (latest) feedText.textContent = fmt(latest)
feed.subscribe((e) => {
  feedText.textContent = fmt(e)
  feedP.classList.remove('is-new'); void feedP.offsetWidth; feedP.classList.add('is-new')
})

/* ---------- copy the MCP line ---------- */
$$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  const txt = $(b.dataset.copy).textContent.trim(), label = $('.copy-label', b)
  try { await navigator.clipboard.writeText(txt); label.textContent = 'Copied'; b.classList.add('is-done') }
  catch { const sel = getSelection(), rg = document.createRange(); rg.selectNodeContents($(b.dataset.copy)); sel.removeAllRanges(); sel.addRange(rg); label.textContent = 'Selected' }
  setTimeout(() => { label.textContent = 'Copy'; b.classList.remove('is-done') }, 1800)
}))

/* ---------- product dice, kept live: one at a time, three.js on demand ---------- */
let liveDie = null, liveBtn = null
async function goLive(btn) {
  const media = btn.closest('.die-media')
  if (liveBtn === btn) { stopLive(); return }
  stopLive()
  btn.classList.add('is-loading')
  try {
    const { mountDie } = await import('./assets/3d/die-scene.js')
    const c = document.createElement('canvas')
    c.setAttribute('aria-label', `${btn.dataset.live} die in live 3D. Drag to turn it.`)
    media.insertBefore(c, btn)
    liveDie = await mountDie(c, { product: btn.dataset.live, live: true, camera: [4.4, 2.8, 7.2], fov: 30, lookY: 0.95, pose: { x: 0, y: -0.38, z: 0 } })
    c.classList.add('is-ready')
    liveBtn = btn; btn.setAttribute('aria-pressed', 'true'); btn.lastChild.textContent = 'Still'
  } catch (err) { console.warn('[90] live die unavailable', err); media.querySelector('canvas')?.remove() }
  btn.classList.remove('is-loading')
}
function stopLive() {
  if (!liveBtn) return
  liveDie?.dispose(); liveBtn.closest('.die-media').querySelector('canvas')?.remove()
  liveBtn.setAttribute('aria-pressed', 'false'); liveBtn.lastChild.textContent = 'Turn it'
  liveDie = null; liveBtn = null
}
$$('.live-btn').forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', () => goLive(b)) })

/* warm Motion after first paint so the first landing is a real spring */
idle(() => getMotion())
