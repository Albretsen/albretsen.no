// Cover Story · design 59 · page script
import { content } from '../../_shared/content.js'
import { createFeed, formatTime } from '../../_shared/feed.js'
import { initMotion, mountLottie, requestGyro } from '../assets/motion.js'

const $ = (s, r = document) => r.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const A = 'assets/'
const P = '../_shared/products/'

/* ---------------------------------------------------------------- sound (opt-in) */
const sound = (() => {
  let ctx = null, on = false, noise = null
  const btn = $('#sound')
  const ensure = () => {
    if (ctx) return
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  btn.addEventListener('click', () => {
    on = !on; if (on) { ensure(); ctx.resume() }
    btn.setAttribute('aria-pressed', on); $('.sound-label', btn).textContent = on ? 'Sound on' : 'Sound off'
    if (on) play('tick')
  })
  function burst({ dur = 0.15, type = 'lowpass', f0 = 900, f1 = 300, q = 0.8, gain = 0.5 }) {
    const t = ctx.currentTime, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain()
    src.buffer = noise; f.type = type; f.Q.value = q
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur)
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(f).connect(g).connect(ctx.destination); src.start(t); src.stop(t + dur + 0.05)
  }
  function tone(freq, dur, gain = 0.08, to) {
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.setValueAtTime(freq, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02)
  }
  function play(kind) {
    if (!on || !ctx) return
    if (kind === 'slap') { burst({ dur: 0.12, f0: 1400, f1: 200, gain: 0.55 }); tone(140, 0.12, 0.25, 55) }
    if (kind === 'peel') burst({ dur: 0.28, type: 'bandpass', f0: 1800, f1: 6500, q: 2, gain: 0.35 })
    if (kind === 'turn') burst({ dur: 0.5, f0: 300, f1: 2400, q: 0.6, gain: 0.3 })
    if (kind === 'tick') tone(1320, 0.05, 0.05)
    if (kind === 'copy') { tone(880, 0.06, 0.07); setTimeout(() => tone(1320, 0.08, 0.06), 70) }
  }
  return { play }
})()

/* ---------------------------------------------------------------- products */
const META = {
  'mcp-emails': { logo: P + 'mcp-emails/logo-mark.svg', plate: 'plate-mcp-emails', big: true, alt: 'MCP Emails plate: the MCP Emails envelope logo on a die-cut vinyl sticker over a violet crystal-growth spiral, with $782 MRR, 17 tools and open source stickers.' },
  'fun-libs': { logo: P + 'fun-libs/icon.png', plate: 'plate-fun-libs', big: true, bare: true, alt: 'Fun Libs plate: the yellow Fun Libs app icon as a vinyl sticker with a 113,000+ installs starburst and a built at seventeen tape.' },
  toolrails: { logo: P + 'toolrails/icon.svg', plate: 'plate-toolrails', big: true, bare: true, alt: 'Toolrails plate: the Toolrails arrow icon as a sticker over the aurora and the Earth at night.' },
  harbor: { logo: P + 'harbor/harbor-mark.svg', plate: 'plate-harbor', big: true, alt: 'Harbor plate: the Harbor banner as a vinyl card on a dark violet spiral, with a paused sticker.' },
}
const STATUS = { live: 'status-live.svg', building: 'status-building.svg', paused: 'status-paused.svg', retired: 'status-retired.svg' }
const host = (u) => u.replace(/^https?:\/\//, '').replace(/\/$/, '')
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const active = content.products.filter((p) => p.status !== 'retired')
const retired = content.products.filter((p) => p.status === 'retired')

function featureHTML(p, i) {
  const m = META[p.id] || {}
  const lead = i === 0
  const src = A + `products/${m.plate}-1200.webp`
  const srcset = `${src} 1200w, ${A}products/${m.plate}-2400.webp 2400w`
  const sizes = lead ? '(max-width: 900px) 92vw, 46vw' : '(max-width: 680px) 92vw, (max-width: 1200px) 46vw, 31vw'
  return `
  <article class="feature${lead ? ' lead' : ''}" id="${p.id}" aria-labelledby="h-${p.id}">
    <div class="plate" data-tilt>
      <span class="no">No. ${String(i + 1).padStart(2, '0')}</span>
      <figure class="m-tilt-plane m-glint" style="margin:0">
        <img class="plate-img" src="${src}" srcset="${srcset}" sizes="${sizes}" width="1200" height="1200" alt="${esc(m.alt)}" loading="lazy" decoding="async">
        <span class="glare" aria-hidden="true"></span>
      </figure>
    </div>
    <div class="feat-body" style="display:flex;flex-direction:column;gap:18px">
      <div class="feat-head">
        <img class="feat-logo${m.bare ? ' bare' : ''}" src="${m.logo}" width="48" height="48" alt="${esc(p.name)} logo">
        <h3 id="h-${p.id}">${esc(p.name)}</h3>
        <img class="feat-status" src="${A}stickers/${STATUS[p.status]}" height="26" alt="Status: ${p.status}">
      </div>
      <p class="feat-line">${esc(p.line)}</p>
      ${p.figure ? `<p class="feat-figure"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></p>` : ''}
      ${p.facts ? `<ul class="facts">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      ${p.url ? `<a class="visit m-lift magnetic" href="${p.url}" rel="noopener">${host(p.url)} <span class="arr" aria-hidden="true">↗</span></a>` : ''}
      <small style="font-size:11px;color:var(--ink-2);letter-spacing:.1em;text-transform:uppercase">Since ${p.since}</small>
    </div>
  </article>`
}

function renderIssue() {
  $('#features').insertAdjacentHTML('beforeend', active.map(featureHTML).join(''))
  // contents page (shown when the cover opens)
  const rows = active.map((p, i) => `<li><a href="#${p.id}"><span class="no">${String(i + 1).padStart(2, '0')}</span><span class="t">${esc(p.name)}<small>${esc(p.line)}</small></span><img class="st" src="${A}stickers/${STATUS[p.status]}" width="74" height="20" alt="${p.status}"></a></li>`)
  rows.push(`<li><a href="#back"><span class="no">05</span><span class="t">Back issues<small>${retired.length} retired products, kept on file.</small></span><img class="st" src="${A}stickers/status-retired.svg" width="74" height="20" alt="retired"></a></li>`)
  $('#contents').innerHTML = rows.join('')

  // back issues: Luma plate + tokens with hover cards
  const luma = retired.find((p) => p.id === 'luma')
  const tokens = retired.filter((p) => p.id !== 'luma')
  $('#back-list').innerHTML = `
    <figure class="luma" style="margin:0">
      <img src="${A}products/plate-luma-1200.webp" width="1200" height="1200" alt="Luma back-issue plate: the Luma wordmark on a vinyl sticker with a retired label." loading="lazy" decoding="async">
      <figcaption><b>${esc(luma.name)} <span style="font-size:14px;color:var(--ink-2)">${luma.since}</span></b>${esc(luma.line)}${luma.figure ? ` ${esc(luma.figure.value)} ${esc(luma.figure.label)}.` : ''}</figcaption>
    </figure>
    <ul class="tokens">${tokens.map((p, i) => `
      <li class="token">
        <button type="button" aria-expanded="false" aria-describedby="hc-${p.id}">
          <img src="${A}stickers/retired-${p.id}.svg" width="220" height="220" alt="${esc(p.name)}, ${p.since}" loading="lazy">
        </button>
        <div class="hovercard" role="tooltip" id="hc-${p.id}"><b>${esc(p.name)}</b>${esc(p.line)}${p.figure ? ` ${esc(p.figure.value)} ${esc(p.figure.label)}.` : ''}<small>${p.since} · retired</small></div>
      </li>`).join('')}
    </ul>`


  // hover cards: open after 120 ms on hover / focus, close on leave, blur or Escape
  document.querySelectorAll('.token').forEach((li) => {
    const b = $('button', li), card = $('.hovercard', li)
    let t
    const open = (v) => {
      clearTimeout(t)
      t = setTimeout(() => {
        if (v) card.dataset.side = li.getBoundingClientRect().top < 220 ? 'bottom' : 'top'
        b.setAttribute('aria-expanded', v)
      }, v ? 120 : 60)
    }
    li.addEventListener('pointerenter', () => open(true)); li.addEventListener('pointerleave', () => open(false))
    b.addEventListener('focus', () => open(true)); b.addEventListener('blur', () => open(false))
    b.addEventListener('click', () => b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') !== 'true'))
    b.addEventListener('keydown', (e) => { if (e.key === 'Escape') b.setAttribute('aria-expanded', 'false') })
  })
}

/* ---------------------------------------------------------------- live feed */
function renderFeed() {
  const ol = $('#feed')
  let feed
  try { feed = createFeed() } catch { return }
  const li = (e) => {
    const tail = e.ms ? `${e.ms} ms` : e.country || (e.sha ? `deploy ${e.sha}` : e.city ? `${e.city}, ${e.kb} KB` : '')
    const el = document.createElement('li')
    el.innerHTML = `<time datetime="${e.time.toISOString()}">${formatTime(e.time)}</time><span class="prod" data-p="${e.product}">${esc(e.label)}</span><span class="what">${esc(e.text)}${tail ? ` · ${esc(tail)}` : ''}</span>`
    return el
  }
  feed.recent(5).forEach((e) => ol.append(li(e)))
  feed.subscribe((e) => {
    const el = li(e); el.classList.add('new'); ol.prepend(el)
    while (ol.children.length > 5) ol.lastElementChild.remove()
  })
}

/* ---------------------------------------------------------------- copy */
function initCopy() {
  const btn = $('#copy'), toast = $('#toast')
  let anim, t
  btn.addEventListener('click', async () => {
    let ok = true
    try { await navigator.clipboard.writeText(btn.dataset.cmd) } catch { ok = false }
    $('.toast-text', toast).textContent = ok ? 'Copied. Paste it into a terminal.' : 'Select the line to copy it.'
    toast.classList.add('show'); sound.play('copy')
    try {
      if (!anim) anim = await mountLottie($('#toast-lottie'), A + 'lottie/sticker-slap.json', { loop: false })
      else anim.goToAndPlay(0, true)
    } catch {}
    clearTimeout(t); t = setTimeout(() => toast.classList.remove('show'), 2600)
  })
}

/* ---------------------------------------------------------------- the cover */
let scene = null, isOpen = false, sparksMounted = false
const hero = $('.hero'), stage = $('#stage'), openBtn = $('#open'), poster = $('#poster')

function setState(open, fromScene) {
  if (open === isOpen) return
  isOpen = open
  if (!fromScene && scene) scene.setOpen(open ? 1 : 0)
  if (!scene) { // no WebGL: swap the baked stills
    poster.src = A + `hero/render-cover-${open ? 'open' : 'closed'}-1200.webp`
    poster.srcset = `${A}hero/render-cover-${open ? 'open' : 'closed'}-1200.webp 1200w, ${A}hero/render-cover-${open ? 'open' : 'closed'}-2400.webp 2400w`
  }
  sound.play('turn')
  const swap = () => {
    hero.classList.toggle('is-open', open)
    $('.story-cover').hidden = open; $('.story-contents').hidden = !open
    openBtn.setAttribute('aria-pressed', open)
    $('.open-label', openBtn).textContent = open ? 'Close the cover' : 'Open the cover'
  }
  if (document.startViewTransition && !reduce) document.startViewTransition(swap)
  else swap()
  if (open && !sparksMounted) { sparksMounted = true; mountLottie($('#sparks'), A + 'lottie/glow-sparks.json').catch(() => {}) }
}
openBtn.addEventListener('click', () => setState(!isOpen))

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}
async function loadScene() {
  if (!hasWebGL()) return
  try {
    const { mountCoverScene } = await import('./cover-scene.js')
    const narrow = stage.clientWidth < 520
    scene = await mountCoverScene(stage, {
      base: new URL(A, location.href).href,
      open: isOpen ? 1 : 0,
      fitClosed: narrow ? [4.9, 5.0] : [4.4, 4.9],
      onChange: (o) => setState(o, true),
    })
    if (!isOpen) scene.setPointer(0.08, -0.42, true) // park the lens over the cover line
    scene.canvas.setAttribute('aria-label', 'Interactive magazine cover. Press Enter to open or close it.')
    scene.canvas.setAttribute('aria-controls', 'story')
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add('ready')))
    const gyro = $('#gyro')
    if (matchMedia('(pointer: coarse)').matches && 'DeviceOrientationEvent' in window) {
      gyro.hidden = false
      gyro.addEventListener('click', async () => { await requestGyro(); const ok = await scene.enableGyro(); gyro.textContent = ok ? 'Tilt is on' : 'Tilt unavailable'; gyro.disabled = true })
    }
  } catch (e) { console.warn('cover scene unavailable', e); scene = null }
}

/* ---------------------------------------------------------------- sticker sheet (drag, slap, peel) */
function initStickers() {
  const layer = $('#slaps'), unstick = $('#unstick')
  const count = () => { unstick.hidden = !layer.children.length }
  const rnd = (a, b) => a + Math.random() * (b - a)

  function make(src) {
    const img0 = $('img', src)
    const w = +src.dataset.w * (innerWidth < 680 ? 0.85 : 1)
    const ratio = img0.naturalWidth ? img0.naturalHeight / img0.naturalWidth : +img0.getAttribute('height') / +img0.getAttribute('width')
    const el = document.createElement('div')
    el.className = 'placed'; el.tabIndex = 0
    el.setAttribute('role', 'button')
    el.setAttribute('aria-label', `Sticker: ${src.dataset.name}. Drag or use arrow keys to move it; press Delete to peel it off.`)
    el.innerHTML = `<div class="depth"><img src="${src.dataset.src}" alt=""></div>`
    el.style.setProperty('--w', w + 'px')
    const base = rnd(-12, 12)
    el.style.setProperty('--rot', base + 'deg')
    $('.depth', el).style.setProperty('--depth-px', Math.round(rnd(10, 26)) + 'px')
    el._s = { x: 0, y: 0, w, h: w * ratio, base, src }
    layer.append(el); src.classList.add('used'); src.disabled = false; src.setAttribute('aria-disabled', 'true')
    wire(el); count()
    return el
  }
  const place = (el, x, y) => { el._s.x = x; el._s.y = y; el.style.transform = `translate(${x}px, ${y}px)` }
  function slap(el) {
    el.style.setProperty('--rot', el._s.base + 'deg')
    el.classList.remove('dragging', 'slapped'); void el.offsetWidth; el.classList.add('slapped')
    sound.play('slap')
  }
  function peel(el) {
    if (el._peeling) return; el._peeling = true
    sound.play('peel'); el.classList.add('peeling')
    const src = el._s.src
    setTimeout(() => { el.remove(); src.classList.remove('used'); src.removeAttribute('aria-disabled'); count() }, reduce ? 200 : 450)
  }
  // drag loop with velocity tilt
  function drag(el, e, offX, offY, onEnd) {
    const r0 = layer.getBoundingClientRect()
    let lx = e.clientX, lt = performance.now(), moved = 0
    el.classList.add('dragging')
    const move = (ev) => {
      const r = layer.getBoundingClientRect()
      const now = performance.now(), vx = (ev.clientX - lx) / Math.max(8, now - lt)
      moved += Math.abs(ev.clientX - lx); lx = ev.clientX; lt = now
      place(el, ev.clientX - r.left - offX, ev.clientY - r.top - offY)
      if (!reduce) el.style.setProperty('--rot', (el._s.base + Math.max(-18, Math.min(18, vx * 14))) + 'deg')
    }
    const up = (ev) => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up)
      // keep it inside the hero
      const r = layer.getBoundingClientRect()
      place(el, Math.max(-el._s.w * 0.3, Math.min(r.width - el._s.w * 0.7, el._s.x)), Math.max(0, Math.min(r.height - el._s.h, el._s.y)))
      slap(el); onEnd?.(moved, ev)
    }
    void r0
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up)
  }
  function wire(el) {
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return
      e.preventDefault(); el.focus({ preventScroll: true })
      const r = el.getBoundingClientRect()
      sound.play('peel')
      drag(el, e, e.clientX - r.left, e.clientY - r.top)
    })
    el.addEventListener('dblclick', () => peel(el))
    el.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 40 : 12
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
      if (d) { e.preventDefault(); place(el, el._s.x + d[0], el._s.y + d[1]) }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); const n = el.nextElementSibling || el.previousElementSibling; peel(el); (n || el._s.src).focus() }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); slap(el) }
    })
  }
  // auto-place somewhere on the cover area (keyboard, or a click without dragging)
  function autoPlace(el) {
    const L = layer.getBoundingClientRect(), S = stage.getBoundingClientRect()
    const x = S.left - L.left + rnd(0.12, 0.7) * S.width, y = S.top - L.top + rnd(0.1, 0.75) * S.height
    place(el, x - el._s.w / 2, y - el._s.h / 2); slap(el)
  }
  document.querySelectorAll('.peel-src').forEach((src) => {
    src.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || src.classList.contains('used')) return
      e.preventDefault()
      const el = make(src), L = layer.getBoundingClientRect()
      const offX = el._s.w / 2, offY = el._s.h / 2
      place(el, e.clientX - L.left - offX, e.clientY - L.top - offY)
      sound.play('peel')
      drag(el, e, offX, offY, (moved) => { if (moved < 6) autoPlace(el) })
    })
    src.addEventListener('click', (e) => {
      if (e.detail !== 0) return // pointer clicks are handled above
      if (src.classList.contains('used')) { [...layer.children].find((p) => p._s.src === src)?.focus(); return }
      const el = make(src); autoPlace(el); el.focus({ preventScroll: true })
    })
  })
  unstick.addEventListener('click', () => { [...layer.children].forEach((el, i) => setTimeout(() => peel(el), i * 70)); setTimeout(() => $('.peel-src').focus(), 100) })
}

/* ---------------------------------------------------------------- magnetic hovers */
function initMagnetic() {
  if (reduce || matchMedia('(pointer: coarse)').matches) return
  document.addEventListener('pointermove', (e) => {
    const t = e.target.closest?.('.magnetic')
    document.querySelectorAll('.magnetic[data-mag]').forEach((m) => { if (m !== t) { m.style.translate = ''; delete m.dataset.mag } })
    if (!t) return
    const r = t.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    t.dataset.mag = '1'; t.style.translate = `${(dx * 5).toFixed(1)}px ${(dy * 4).toFixed(1)}px`
  }, { passive: true })
}

/* ---------------------------------------------------------------- boot */
// ?open starts on the inside spread (shareable state)
if (new URLSearchParams(location.search).has('open')) setState(true)

renderIssue()
renderFeed()
initCopy()
initStickers()
initMagnetic()
initMotion()

// band: twinkles once it is on screen
const band = $('.band')
new IntersectionObserver(([e], io) => {
  if (!e.isIntersecting) return
  io.disconnect(); mountLottie($('#band-sparks'), A + 'lottie/glow-sparks.json').catch(() => {})
}, { rootMargin: '200px' }).observe(band)

// 3D after first paint, when the browser is idle
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200))
if (document.readyState === 'complete') idle(loadScene, { timeout: 1500 })
else addEventListener('load', () => idle(loadScene, { timeout: 1500 }), { once: true })
