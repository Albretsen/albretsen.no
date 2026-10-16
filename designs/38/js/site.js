// Design 38 · Salon Refusé (after hours) · homepage behaviour.
// Web Animations API for all motion; canvas 2D (assets/js/art.js) for the live work; three.js only lazily.
import { content } from '../../_shared/content.js'
import { createFeed } from '../../_shared/feed.js'
import { compose, paint, animate, SERIES, SPECTRUM } from '../assets/js/art.js'
import { lightsUp, uvTorch, swing, swingOnHover, redDot, pressable, EASE } from '../assets/motion.js'

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

// ------------------------------------------------------------ facts stay in sync with content.js
$$('[data-fact]').forEach(el => { const v = content[el.dataset.fact]; if (v) el.textContent = v })
const mail = $('[data-fact-mail]'); if (mail) { mail.href = `mailto:${content.email}`; mail.textContent = content.email }
$('.guide-cmd').textContent = content.mcpCommand

// ------------------------------------------------------------ sound (opt-in, synthesised, no files)
const sound = (() => {
  let ac = null, on = false
  const btn = $('.sound')
  btn.addEventListener('click', () => {
    on = !on
    btn.setAttribute('aria-pressed', on); $('.sound-label', btn).textContent = on ? 'Sound on' : 'Sound off'
    if (on) { ac ??= new AudioContext(); ac.resume(); click() }
  })
  // a light switch: a short filtered noise burst with a low body
  function click(level = 1) {
    if (!on || !ac) return
    const t = ac.currentTime, len = 0.05
    const buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate), d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6)
    const src = ac.createBufferSource(); src.buffer = buf
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.9
    const g = ac.createGain(); g.gain.value = 0.35 * level
    src.connect(bp).connect(g).connect(ac.destination); src.start(t)
    const o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.08)
    og.gain.setValueAtTime(0.12 * level, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
    o.connect(og).connect(ac.destination); o.start(t); o.stop(t + 0.12)
  }
  // a soft glass tone for the UV torch / red dot
  function tone(f = 660, dur = 0.5, level = 0.06) {
    if (!on || !ac) return
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain()
    o.type = 'sine'; o.frequency.value = f
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur)
  }
  return { click, tone }
})()

// ------------------------------------------------------------ hero: build the UV twin of the lit layer
const hero = $('.hero')
const lit = $('.layer.lit', hero)
const uv = lit.cloneNode(true)
uv.className = 'layer uv'; uv.setAttribute('aria-hidden', 'true'); uv.inert = true
$$('[id]', uv).forEach(e => e.removeAttribute('id'))
$$('[aria-describedby],[aria-live]', uv).forEach(e => { e.removeAttribute('aria-describedby'); e.removeAttribute('aria-live') })
$$('button', uv).forEach(b => { b.tabIndex = -1 })
{ // swap the room photo for its pixel-aligned UV pass (loaded after first paint)
  const pic = $('.room', uv), base = pic.dataset.uv
  const img = document.createElement('img')
  img.className = 'room'; img.alt = ''; img.width = 1440; img.height = 810; img.decoding = 'async'
  img.sizes = $('.room img', lit).sizes
  const load = () => { img.srcset = `${base}-1440.webp 1440w, ${base}-2880.webp 2880w`; img.src = `${base}-1440.webp` }
  document.readyState === 'complete' ? load() : addEventListener('load', load, { once: true })
  pic.replaceWith(img)
}
lit.after(uv)

// ------------------------------------------------------------ hero: the live work in the gilt frame
const litCanvas = $('.live canvas', lit), uvCanvas = $('.live canvas', uv)
const litLive = $('.live', lit), uvLive = $('.live', uv)
const TITLES = { filaments: 'Filaments', tension: 'Tension', weightless: 'Weightless', spark: 'Spark', strata: 'Strata' }
let si = SERIES.indexOf('tension'), hi = 0, seed = 0x500a48, stopDraw = () => {}, plan
function hangWork() {
  const series = SERIES[si], hue = SPECTRUM[hi]
  plan = compose({ series, seed, hue, w: litCanvas.width, h: litCanvas.height })
  paint(uvCanvas.getContext('2d'), plan, { pass: 'uv' })
  stopDraw()
  if (reduce) paint(litCanvas.getContext('2d'), plan, { pass: 'lit' })
  else stopDraw = animate(litCanvas, plan, { duration: 6400 })
  const hex = `0x${seed.toString(16).padStart(6, '0')}`
  for (const layer of [lit, uv]) {
    $('.wl-title', layer).textContent = `${TITLES[series]}, ${hex}`
    $('.wl-meta', layer).textContent = `${plan.strokes.length.toLocaleString('en')} strokes · hue ${hue}°`
  }
}
let rehanging = false
async function rehangWork() {
  if (rehanging) return; rehanging = true
  sound.click(0.8)
  si = (si + 1) % SERIES.length; hi = (hi + 1) % SPECTRUM.length
  seed = (Math.imul(seed, 1103515245) + 12345) >>> 8
  if (!reduce) {
    const lift = [{ transform: 'none', opacity: 1, filter: 'brightness(1)' }, { transform: 'translateY(-10px) scale(.985)', opacity: 0, filter: 'brightness(.5)' }]
    await Promise.all([litLive, uvLive].map(el => el.animate(lift, { duration: 340, easing: EASE.inOut, fill: 'forwards' }).finished))
  }
  hangWork()
  for (const el of [litLive, uvLive]) {
    el.getAnimations().forEach(a => a.cancel())
    if (!reduce) el.animate([{ transform: 'translateY(-14px)', opacity: 0, filter: 'blur(2px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }], { duration: 420, easing: EASE.out })
  }
  const label = $('.wall-label', lit)
  if (!reduce) label.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(1deg)' }, { transform: 'rotate(0)' }], { duration: 600, easing: EASE.out })
  rehanging = false
}
$('.hang', lit).addEventListener('click', rehangWork)

// ------------------------------------------------------------ hero: lights up (lamp flicker, then the lettering is unveiled)
function lightsOn() {
  const room = $('.room img', lit), parts = $$('.vinyl > *', lit), uvParts = $$('.vinyl > *', uv)
  if (reduce) { hangWork(); return }
  const flicker = [{ filter: 'brightness(.05)' }, { filter: 'brightness(.5)', offset: .08 }, { filter: 'brightness(.12)', offset: .14 }, { filter: 'brightness(.85)', offset: .24 }, { filter: 'brightness(.6)', offset: .3 }, { filter: 'brightness(1)' }]
  room.animate(flicker, { duration: 1300, easing: 'linear', fill: 'backwards' })
  litLive.animate(flicker, { duration: 1300, easing: 'linear', fill: 'backwards' })
  setTimeout(() => sound.click(1), 120)
  parts.forEach((el, i) => {
    const kf = [{ clipPath: 'inset(0 0 100% 0)', transform: 'translateY(12px)' }, { clipPath: 'inset(0 0 0% 0)', transform: 'none' }]
    const opt = { duration: 1000, delay: 450 + i * 120, easing: EASE.reveal, fill: 'backwards' }
    el.animate(kf, opt); uvParts[i]?.animate(kf, opt)
  })
  setTimeout(hangWork, 520)
}
lightsOn()

// ------------------------------------------------------------ hero: the UV torch (pointer-following radial mask, WAAPI on @property)
const torch = (() => {
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0, rAnim, forced = false, inside = false
  const R = () => Math.min(220, Math.max(130, hero.clientWidth * 0.12))
  const setR = (to, dur, easing) => {
    const from = getComputedStyle(hero).getPropertyValue('--torch-r') || '0px'
    rAnim?.cancel()
    rAnim = hero.animate([{ '--torch-r': from }, { '--torch-r': `${to}px` }], { duration: reduce ? 0 : dur, easing, fill: 'forwards' })
  }
  const loop = () => {
    const k = reduce ? 1 : 0.22
    x += (tx - x) * k; y += (ty - y) * k
    hero.style.setProperty('--tx', `${x.toFixed(1)}px`); hero.style.setProperty('--ty', `${y.toFixed(1)}px`)
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 || inside ? requestAnimationFrame(loop) : 0
  }
  const pos = e => { const r = hero.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop) }
  hero.addEventListener('pointerenter', e => {
    if (e.pointerType === 'touch') return
    pos(e); if (!inside && !forced) { x = tx; y = ty }
    inside = true; hero.classList.add('is-torch'); if (!forced) { setR(R(), 360, EASE.out); sound.tone(520, .35, .03) }
    kick()
  })
  hero.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; pos(e); kick() })
  hero.addEventListener('pointerleave', () => { inside = false; hero.classList.remove('is-torch'); if (!forced) setR(0, 220, 'ease-in') })
  // touch: press and hold on the wall to light it with the torch
  let holdT
  hero.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || forced || e.target.closest('button, a, code, .guestbook')) return
    pos(e); x = tx; y = ty; kick()
    holdT = setTimeout(() => setR(R() * 0.8, 300, EASE.out), 180)
  })
  const endTouch = e => { if (e.pointerType !== 'touch') return; clearTimeout(holdT); if (!forced) setR(0, 220, 'ease-in') }
  hero.addEventListener('pointerup', endTouch); hero.addEventListener('pointercancel', endTouch)

  const sw = $('#uv-switch')
  sw.addEventListener('click', () => {
    forced = !forced; sw.setAttribute('aria-checked', forced)
    if (forced) {
      if (!inside) { const r = $('.live', lit).getBoundingClientRect(), h = hero.getBoundingClientRect(); tx = x = r.left - h.left + r.width / 2; ty = y = r.top - h.top + r.height / 2; kick() }
      setR(Math.hypot(hero.clientWidth, hero.clientHeight), 900, EASE.out); sound.tone(392, .9, .05)
    } else setR(inside ? R() : 0, 360, EASE.out)
  })
})()

// ------------------------------------------------------------ hero: copy the MCP command
{
  const btn = $('.copy'), live = document.createElement('span')
  live.className = 'sr'; live.setAttribute('aria-live', 'polite'); btn.after(live)
  let t
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(content.mcpCommand) } catch { const r = document.createRange(); r.selectNodeContents($('.guide-cmd', lit)); getSelection().removeAllRanges(); getSelection().addRange(r) }
    btn.classList.add('is-done'); live.textContent = 'Copied to clipboard'; sound.click(0.5)
    clearTimeout(t); t = setTimeout(() => { btn.classList.remove('is-done'); live.textContent = '' }, 1600)
  })
  pressable(btn)
}

// ------------------------------------------------------------ hero: guestbook (live feed as a Sonner-style stack)
{
  const list = $('.gb-list'), feed = createFeed()
  const HUE = { 'mcp-emails': 288, 'fun-libs': 48, toolrails: 228, 'albretsen.no': 168 }
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
  const detail = e => e.ms ? `${e.ms} ms` : e.country ? e.country : e.city ? e.city : e.sha ? e.sha.slice(0, 7) : ''
  const make = e => {
    const li = document.createElement('li')
    li.innerHTML = `<span class="gb-dot" style="background:oklch(0.72 0.15 ${HUE[e.product] ?? 168})"></span><span class="gb-text"><b></b> <span></span></span><span class="gb-time"></span>`
    li.querySelector('b').textContent = e.label
    li.querySelector('.gb-text span').textContent = e.text
    const d = detail(e); li.querySelector('.gb-time').textContent = d ? `${fmt.format(e.time)} · ${d}` : fmt.format(e.time)
    return li
  }
  const restack = () => [...list.children].forEach((li, i) => { li.dataset.i = i; li.style.setProperty('--i', i) })
  feed.recent(3).forEach(e => list.append(make(e))); restack()
  feed.subscribe(e => {
    const li = make(e); list.prepend(li); restack()
    if (!reduce) li.animate([{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 400, easing: EASE.out })
    while (list.children.length > 4) list.lastElementChild.remove()
  })
}

// ------------------------------------------------------------ header mark: the crooked frame swings on its nail
{
  const mark = $('.brand-mark'), brand = $('.brand')
  brand.addEventListener('pointerenter', () => swing(mark, 9))
  brand.addEventListener('focus', () => swing(mark, 6))
}

// ------------------------------------------------------------ magnetic controls (pointer pull, spring release)
const SPRING = getComputedStyle(document.documentElement).getPropertyValue('--spring').trim() || EASE.out
if (finePointer && !reduce) $$('[data-magnetic]').forEach(el => {
  let raf = 0, mx = 0, my = 0
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect()
    mx = (e.clientX - (r.left + r.width / 2)) * 0.28; my = (e.clientY - (r.top + r.height / 2)) * 0.4
    cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { el.style.translate = `${mx.toFixed(1)}px ${my.toFixed(1)}px` })
  })
  el.addEventListener('pointerleave', () => {
    cancelAnimationFrame(raf)
    el.animate([{ translate: `${mx}px ${my}px` }, { translate: '0px 0px' }], { duration: 650, easing: SPRING })
    el.style.translate = ''
  })
})

// ------------------------------------------------------------ Room 1: products in the same light
lightsUp(document)
$$('.shot, .salon').forEach(el => uvTorch(el, { radius: el.classList.contains('salon') ? 200 : 130 }))
{
  const dots = $$('.sold')
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return
    const i = dots.indexOf(e.target); redDot(e.target, 900 + i * 160); io.unobserve(e.target)
    setTimeout(() => sound.tone(880, .25, .03), 900 + i * 160)
  }), { threshold: 1 })
  dots.forEach(d => { if (!reduce) d.style.opacity = 0; io.observe(d) })
  // Radix-style tooltip groups: after one tip has shown, the next opens with no delay
  let warm = 0
  dots.forEach(d => {
    d.addEventListener('pointerenter', () => { if (performance.now() - warm < 800) d.style.setProperty('--tip-delay', '0ms') })
    d.addEventListener('pointerleave', () => { warm = performance.now(); d.style.removeProperty('--tip-delay') })
  })
}

// ------------------------------------------------------------ Room 2: storeroom rack (drag with momentum, swing on hover)
{
  const rack = $('.rack')
  $$('.print-hung', rack).forEach(el => swingOnHover(el))
  let down = false, sx = 0, sl = 0, v = 0, lastX = 0, lastT = 0, moved = 0, raf = 0
  rack.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return
    down = true; moved = 0; sx = lastX = e.clientX; sl = rack.scrollLeft; v = 0; lastT = performance.now(); cancelAnimationFrame(raf)
  })
  addEventListener('pointermove', e => {
    if (!down) return
    const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx))
    if (moved > 4) rack.classList.add('is-drag')
    rack.scrollLeft = sl - dx
    const now = performance.now(); v = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now
  })
  addEventListener('pointerup', () => {
    if (!down) return; down = false; rack.classList.remove('is-drag')
    if (reduce) return
    let vel = -v * 16
    const glide = () => { rack.scrollLeft += vel; vel *= 0.94; if (Math.abs(vel) > 0.4) raf = requestAnimationFrame(glide) }
    glide()
  })
  $$('.arrow').forEach(b => {
    pressable(b)
    b.addEventListener('click', () => rack.scrollBy({ left: Number(b.dataset.dir) * Math.min(rack.clientWidth * 0.8, 600), behavior: reduce ? 'auto' : 'smooth' }))
  })
}

// ------------------------------------------------------------ Room 3: the 3D gilt frame, lazy
{
  const stage = $('#stage3d'), status = $('#g-status'), uvBtn = $('#g-uv'), reBtn = $('#g-rehang')
  let g = null, loading = false
  async function mount() {
    if (g || loading) return; loading = true
    status.textContent = 'Hanging the frame…'
    try {
      const { mountGalleryFrame } = await import('../assets/3d/gallery-frame.js')
      g = await mountGalleryFrame(stage, { series: 'filaments', hue: 228, seed: 0x500a48 })
      stage.classList.add('is-live')
      status.textContent = 'Drag to swing. Hold still for UV. Double-click to rehang.'
    } catch (err) {
      status.textContent = 'The 3D frame could not load here; the photograph stays up.'
    }
    loading = false
  }
  if (reduce) {
    status.textContent = 'Reduced motion is on, so the frame stays still. Press Rehang to load the 3D frame anyway.'
    reBtn.addEventListener('click', () => g ? g.rehang() : mount())
  } else {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); mount() } }, { rootMargin: '300px' })
    io.observe(stage)
    if (location.hash === '#touch') { io.disconnect(); mount() }
    reBtn.addEventListener('click', () => { if (g) { g.rehang(); sound.click(0.7) } })
  }
  const uvOn = () => { if (!g) return; g.setPass('uv'); uvBtn.setAttribute('aria-pressed', 'true'); sound.tone(392, .6, .04) }
  const uvOff = () => { if (!g) return; g.setPass('lit'); uvBtn.setAttribute('aria-pressed', 'false') }
  uvBtn.addEventListener('pointerdown', uvOn); uvBtn.addEventListener('pointerup', uvOff); uvBtn.addEventListener('pointerleave', uvOff)
  uvBtn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); uvOn() } })
  uvBtn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') uvOff() })
  pressable(reBtn)
}
