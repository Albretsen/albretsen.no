// Infrared Fable — design 36 — Albretsen AS
import { content } from '../_shared/content.js'
import { createFeed } from '../_shared/feed.js'
import { createDeck } from './assets/interactive/specimen-deck.js'
import { loadGsap, horizonRise, wingbeat, aperture, magnetic } from './assets/motion.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches
const COARSE = matchMedia('(pointer: coarse)').matches
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const product = (id) => content.products.find((p) => p.id === id)

/* ------------------------------------------------------------------ sound (opt-in) */
const sound = (() => {
  let ctx = null, on = false
  const btn = $('[data-sound]')
  btn.addEventListener('click', () => {
    on = !on
    btn.setAttribute('aria-pressed', String(on))
    $('.sound__label', btn).textContent = on ? 'Sound on' : 'Sound off'
    if (on && !ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (on) chime(660, 0.05)
  })
  function chime(freq = 523, gain = 0.06, dur = 1.2) {
    if (!on || !ctx) return
    const t = ctx.currentTime
    ;[1, 2.01, 3.02].forEach((m, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = freq * m
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain / (i + 1), t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (i + 1))
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur)
    })
  }
  function swish() {
    if (!on || !ctx) return
    const t = ctx.currentTime, len = 0.35
    const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain()
    src.buffer = buf; f.type = 'bandpass'; f.Q.value = 0.8
    f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(3800, t + len)
    g.gain.value = 0.12
    src.connect(f).connect(g).connect(ctx.destination); src.start(t)
  }
  return { chime, swish }
})()

/* ------------------------------------------------------------------ copy the MCP line */
$$('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const state = $('[data-copy-state]', btn)
    try { await navigator.clipboard.writeText(btn.dataset.copy); state.textContent = 'copied' }
    catch { state.textContent = 'select' }
    btn.classList.remove('is-copied'); void btn.offsetWidth; btn.classList.add('is-copied')
    sound.chime(880, 0.04, 0.6)
    clearTimeout(btn._t); btn._t = setTimeout(() => { state.textContent = 'copy'; btn.classList.remove('is-copied') }, 2200)
  })
})

/* ------------------------------------------------------------------ field log (live feed) */
{
  const list = $('[data-feed]')
  const feed = createFeed()
  const fmt = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const extra = (e) => e.ms ? `${e.ms} ms` : e.country ? e.country : e.city ? `${e.city}${e.kb ? ` · ${e.kb} kB` : ''}` : e.sha ? e.sha : ''
  const item = (e, isNew) => {
    const li = document.createElement('li')
    if (isNew) li.className = 'is-new'
    li.innerHTML = `<time datetime="${e.time.toISOString()}">${fmt(e.time)}</time>
      <span><span class="prod" data-p="${esc(e.product)}">${esc(e.label)}</span> <span class="x">${esc(extra(e))}</span></span>
      <span>${esc(e.text)}</span>`
    return li
  }
  feed.recent(4).forEach((e) => list.appendChild(item(e)))
  feed.subscribe((e) => {
    list.prepend(item(e, !REDUCED))
    while (list.children.length > 4) list.lastElementChild.remove()
  })
}

/* ------------------------------------------------------------------ keep the word's baseline on the treeline at any aspect ratio */
{
  const p1 = $('[data-p1]'), word = $('[data-word]')
  const place = () => {
    const W = p1.clientWidth, H = p1.clientHeight
    const scale = Math.max(W / 1440, H / 802), imgH = 802 * scale
    const offset = (imgH - H) * 0.6                      // object-position: 50% 60%
    const font = parseFloat(getComputedStyle(word).fontSize)
    const baseline = 0.4 * imgH - offset + font * 0.25
    word.style.bottom = `${Math.round(H - baseline)}px`
  }
  place(); addEventListener('resize', place)
  document.fonts && document.fonts.ready.then(place)
}

/* ------------------------------------------------------------------ the aperture lens in the sky */
{
  const p1 = $('[data-p1]'), lens = $('[data-lens]'), ring = $('[data-lens-ring]')
  const loadLens = () => lens.classList.add('is-ready')
  if (document.readyState === 'complete') setTimeout(loadLens, 200); else addEventListener('load', () => setTimeout(loadLens, 200))

  const S = (v, k = 90, c = 14) => ({ v, t: v, vel: 0, k, c })
  const step = (s, dt) => { const a = -s.k * (s.v - s.t) - s.c * s.vel; s.vel += a * dt; s.v += s.vel * dt }
  const size = () => (innerWidth < 720 ? 92 : Math.min(210, innerWidth * 0.13))
  const rest = () => ({ x: p1.clientWidth * (innerWidth < 720 ? 0.74 : 0.84), y: p1.clientHeight * (innerWidth < 720 ? 0.17 : 0.16) })
  const x = S(rest().x), y = S(rest().y), w = S(size(), 160, 16)
  let inside = false, visible = true, raf = 0, last = performance.now(), t0 = last
  const apply = () => {
    const lw = w.v
    p1.style.setProperty('--lw', `${lw.toFixed(1)}px`)
    p1.style.setProperty('--lx', `${(x.v - lw / 2).toFixed(1)}px`)
    p1.style.setProperty('--ly', `${(y.v - lw * 0.7).toFixed(1)}px`)
    ring.style.setProperty('--rx', `${(x.v - lw / 2).toFixed(1)}px`)
    ring.style.setProperty('--ry', `${(y.v - lw * 0.7).toFixed(1)}px`)
  }
  const tick = (now) => {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now
    if (!inside) {
      const r = rest(), tt = (now - t0) / 1000
      x.t = r.x + Math.sin(tt * 0.35) * 40; y.t = r.y + Math.cos(tt * 0.5) * 14 + w.v * 0.7
      w.t = size()
    } else {
      // tension: the lens stretches a little with speed
      w.t = size() * (1 + Math.min(0.35, Math.hypot(x.vel, y.vel) / 4000))
    }
    for (const s of [x, y, w]) { step(s, dt / 2); step(s, dt / 2) }
    apply()
    raf = visible ? requestAnimationFrame(tick) : 0
  }
  // initial placement
  y.v = y.t = rest().y + size() * 0.7
  apply()
  if (!REDUCED) {
    p1.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return
      const r = p1.getBoundingClientRect()
      inside = true; x.t = e.clientX - r.left; y.t = e.clientY - r.top
    })
    p1.addEventListener('pointerleave', () => { inside = false })
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick) }
    }).observe(p1)
    addEventListener('resize', () => { if (!raf) { x.v = x.t = rest().x; apply() } })
  }
}

/* ------------------------------------------------------------------ specimens: deck + index */
const LIVE = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor']
const ROMAN = ['I', 'II', 'III', 'IV']
const LOGO = {
  'mcp-emails': { src: '../_shared/products/mcp-emails/logo-mark.svg' },
  'fun-libs': { src: '../_shared/products/fun-libs/icon.png', full: true },
  toolrails: { src: '../_shared/products/toolrails/icon.svg', full: true },
  harbor: { src: '../_shared/products/harbor/harbor-mark-filled.svg' },
}
const NOTES = [523.25, 587.33, 659.25, 783.99]
{
  const index = $('[data-index]')
  index.innerHTML = LIVE.map((id, i) => {
    const p = product(id), l = LOGO[id]
    return `<li>
      <button class="row" type="button" aria-expanded="${i === 0}" aria-controls="pb-${id}" id="row-${id}" data-row="${id}">
        <span class="row__n">${ROMAN[i]}.</span>
        <span class="row__logo${l.full ? ' full' : ''}"><img src="${l.src}" alt="" width="52" height="52" loading="lazy"></span>
        <span class="row__name">${esc(p.name)}</span>
        <span class="chip" data-s="${p.status}">${p.status}</span>
      </button>
      <div class="panel-body" id="pb-${id}" role="region" aria-labelledby="row-${id}"><div><div class="panel-body__in">
        <p class="panel-body__line">${esc(p.line)}</p>
        ${p.figure ? `<p class="figure"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></p>` : ''}
        <ul class="facts">${(p.facts || []).map((f) => `<li>${esc(f)}</li>`).join('')}<li>since ${p.since}</li></ul>
        ${p.url ? `<a class="visit m-ink" href="${p.url}" rel="noopener">${esc(p.url.replace('https://', ''))} ↗</a>` : ''}
      </div></div></div>
    </li>`
  }).join('')

  const rows = $$('[data-row]', index)
  const setActive = (id) => rows.forEach((r) => r.setAttribute('aria-expanded', String(r.dataset.row === id)))

  const deckEl = $('[data-deck]')
  const arch = $('.cabinet__arch')
  const width = Math.max(220, Math.min(420, arch.clientWidth - 70))
  let top = 0
  const deck = createDeck(deckEl, LIVE.map((id, i) => {
    const p = product(id)
    return { id, front: `assets/products/plate-${id}.webp`, alt: `Plate ${ROMAN[i]}: ${p.name}`,
      back: `<p class="b-n">Plate ${ROMAN[i]} · since ${p.since} · ${p.status}</p><h3>${esc(p.name)}</h3><p>${esc(p.line)}</p>
        ${p.figure ? `<p class="b-fig">${esc(p.figure.value)}<small>${esc(p.figure.label)}</small></p>` : ''}
        <p class="b-f">${(p.facts || []).map(esc).join(' · ')}</p>` }
  }), {
    width,
    onChange: (d) => { top = LIVE.indexOf(d.id); setActive(d.id); sound.swish() },
    onFlip: (d, flipped) => sound.chime(NOTES[LIVE.indexOf(d.id)] * (flipped ? 1 : 0.75)),
  })
  let busy = false
  rows.forEach((row) => row.addEventListener('click', () => {
    const k = LIVE.indexOf(row.dataset.row)
    const open = row.getAttribute('aria-expanded') === 'true'
    if (open && k === top) return
    setActive(row.dataset.row)
    if (busy) return
    let steps = (k - top + LIVE.length) % LIVE.length
    if (steps === LIVE.length - 1) { deck.prev(); top = k; return }
    busy = true
    const go = () => { if (steps-- > 0) { deck.next(); setTimeout(go, REDUCED ? 20 : 330) } else busy = false }
    go()
  }))
}

/* ------------------------------------------------------------------ pressed & kept shelf + tooltip */
{
  const shelf = $('[data-shelf]')
  const RET = ['luma', 'polyglot-pilot', 'pinpoint', 'webvakt', 'joke-central', 'tryggere-hyring', 'early-apps']
  const SHORT = { 'joke-central': 'Joke Central', 'early-apps': 'Early apps' }
  shelf.innerHTML = RET.map((id) => {
    const p = product(id)
    const art = id === 'luma'
      ? `<span class="arch luma"><img src="../_shared/products/luma/logo.png" alt="" loading="lazy"></span>`
      : `<span class="arch"><img src="assets/products/retired/${id}.svg" alt="" loading="lazy"></span>`
    return `<li><button type="button" data-tip-for="${id}">${art}<span class="cap">${esc(SHORT[id] || p.name)}</span><span class="yr">${p.since}</span></button></li>`
  }).join('')

  const tip = $('[data-tip]'), tTitle = $('[data-tip-title]'), tBody = $('[data-tip-body]')
  let openTimer = 0, closeTimer = 0, lastClose = 0, current = null
  const place = (btn) => {
    const r = $('.arch', btn).getBoundingClientRect()
    const tw = tip.offsetWidth, th = tip.offsetHeight
    const cx = r.left + r.width / 2
    const x = Math.max(12, Math.min(innerWidth - tw - 12, cx - tw / 2))
    const y = Math.max(12, r.top - th - 14)
    tip.style.setProperty('--tx', `${x}px`); tip.style.setProperty('--ty', `${y}px`)
    tip.style.setProperty('--ax', `${cx - x}px`); tip.style.setProperty('--to', `${cx - x}px 100%`)
  }
  const show = (btn, instant) => {
    const p = product(btn.dataset.tipFor)
    if (current && current !== btn) current.removeAttribute('data-open')
    current = btn; btn.setAttribute('data-open', ''); btn.setAttribute('aria-describedby', 'tip')
    tTitle.textContent = `${p.name} · ${p.since}`
    tBody.textContent = p.line + (p.figure ? ` ${p.figure.value} ${p.figure.label}.` : '')
    place(btn)
    tip.dataset.state = instant ? 'instant-open' : 'delayed-open'
  }
  const hide = () => {
    if (!current) return
    current.removeAttribute('data-open'); current.removeAttribute('aria-describedby'); current = null
    tip.dataset.state = 'closed'; lastClose = performance.now()
  }
  const enter = (btn) => {
    clearTimeout(openTimer); clearTimeout(closeTimer)
    const skip = current || performance.now() - lastClose < 300  // Radix skipDelayDuration
    if (skip) show(btn, true); else openTimer = setTimeout(() => show(btn, false), 350)
  }
  const leave = () => { clearTimeout(openTimer); closeTimer = setTimeout(hide, 60) }
  $$('[data-tip-for]', shelf).forEach((btn) => {
    btn.addEventListener('pointerenter', () => enter(btn))
    btn.addEventListener('pointerleave', leave)
    btn.addEventListener('focus', () => { clearTimeout(openTimer); show(btn, !!current) })
    btn.addEventListener('blur', leave)
    btn.addEventListener('click', () => (current === btn ? hide() : show(btn, false)))
  })
  addEventListener('keydown', (e) => { if (e.key === 'Escape') hide() })
  addEventListener('scroll', () => { if (current) hide() }, { passive: true })
}

/* ------------------------------------------------------------------ stickers you can peel and move */
$$('[data-sticker]').forEach((el) => {
  const S = (v, k, c) => ({ v, t: v, vel: 0, k, c })
  const sx = S(0, 170, 15), sy = S(0, 170, 15), rot = S(0, 120, 9), lift = S(0, 300, 22)
  let drag = null, raf = 0, last = 0, px = 0
  const step = (s, dt) => { const a = -s.k * (s.v - s.t) - s.c * s.vel; s.vel += a * dt; s.v += s.vel * dt }
  const tick = (now) => {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now
    for (const s of [sx, sy, rot, lift]) { step(s, dt / 2); step(s, dt / 2) }
    el.style.transform = `translate3d(${sx.v}px, ${sy.v - lift.v * 6}px, 0) rotate(${rot.v}deg) scale(${1 + lift.v * 0.08})`
    el.style.filter = `drop-shadow(0 ${10 + lift.v * 22}px ${12 + lift.v * 16}px rgba(23,7,51,${0.35 - lift.v * 0.08}))`
    const settled = !drag && [sx, sy, rot, lift].every((s) => Math.abs(s.v - s.t) < 0.01 && Math.abs(s.vel) < 0.01)
    raf = settled ? 0 : requestAnimationFrame(tick)
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) } }
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); el.setPointerCapture(e.pointerId)
    drag = { id: e.pointerId, x0: e.clientX - sx.t, y0: e.clientY - sy.t }; px = e.clientX
    lift.t = 1; kick(); sound.chime(392, 0.025, 0.4)
  })
  el.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return
    sx.t = e.clientX - drag.x0; sy.t = e.clientY - drag.y0
    rot.t = Math.max(-22, Math.min(22, (e.clientX - px) * 0.9)); px = e.clientX
  })
  const up = (e) => { if (!drag || e.pointerId !== drag.id) return; drag = null; lift.t = 0; rot.t = 0; kick() }
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up)
})

/* ------------------------------------------------------------------ top bar turns solid over paper */
{
  const bar = $('.topbar'), work = $('#work')
  const check = () => bar.classList.toggle('is-solid', work.getBoundingClientRect().top < 70)
  addEventListener('scroll', check, { passive: true }); check()
}

/* ------------------------------------------------------------------ GSAP: rise, wings, magnetic, the arch story */
function archPolygon(W, H, p) {
  // a pointed (equilateral-ish) arch that grows from the horizon until it swallows the frame
  const e = p ** 2.4                           // slow start: a visible window first, then it swallows the frame
  const big = Math.max(W, H)
  const w = 2 + (W < 720 ? 0.5 : 0.22) * W * Math.min(1, p * 4) + big * 3.4 * e
  const by = H * 0.6 + (H * 0.5) * e       // bottom of the arch drops below the frame as it opens
  const straight = w * 0.45 + big * 1.4 * e
  const a = w / 2, r = w * 0.85, cx = W / 2
  const spring = by - straight
  const Cl = cx - a + r, Cr = cx + a - r
  const thApex = Math.acos((cx - Cl) / r)
  const pts = [[cx - a, by + 2], [cx - a, spring]]
  const N = 22
  for (let i = 1; i <= N; i++) { const th = Math.PI - (Math.PI - thApex) * (i / N); pts.push([Cl + r * Math.cos(th), spring - r * Math.sin(th)]) }
  for (let i = N - 1; i >= 0; i--) { const th = Math.PI - (Math.PI - thApex) * (i / N); pts.push([Cr - r * Math.cos(th), spring - r * Math.sin(th)]) }
  pts.push([cx + a, by + 2])
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`
}

async function motion() {
  if (REDUCED) return
  let gsap
  try { gsap = await loadGsap() } catch { return }
  document.documentElement.classList.add('m-js')
  const ST = window.ScrollTrigger
  gsap.ticker.lagSmoothing(0)   // entrances must always finish, even when frames are sparse

  horizonRise($('[data-m="rise"]'), { delay: 0.2 })
  $$('[data-m="wing"]').forEach((el) => wingbeat(el, { drift: el.dataset.drift !== 'off' }))
  $$('[data-m="aperture"]').forEach(aperture)
  $$('[data-m="magnetic"]').forEach((el) => magnetic(el))
  $$('.btn.primary').forEach((b) => b.addEventListener('pointermove', (e) => {
    const r = b.getBoundingClientRect(); b.style.setProperty('--hx', `${((e.clientX - r.left) / r.width) * 100}%`)
  }))

  // entrance for the rest of the hero
  gsap.from('[data-hero-copy] > *', { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.7 })
  gsap.from('.fieldlog', { y: 60, rotate: 6, opacity: 0, duration: 1.4, ease: 'elastic.out(1, .6)', delay: 1.1 })
  gsap.from('.lens-ring', { opacity: 0, duration: 1.5, delay: 1.2 })

  // the arch story: horizon at dusk -> pointed arch opens -> pinewood
  const story = $('[data-story]'), p2 = $('[data-p2]')
  story.classList.add('is-pinned')
  const st = { p: 0 }
  const paint = () => { p2.style.clipPath = archPolygon(p2.clientWidth, p2.clientHeight, st.p) }
  paint()
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: 1 } })
  tl.to('[data-back]', { scale: 1.12, yPercent: -3, duration: 0.6 }, 0)
    .to('[data-front]', { scale: 1.06, yPercent: 2, duration: 0.6 }, 0)
    .to('[data-word]', { yPercent: 70, duration: 0.45 }, 0)
    .to('.dusk', { opacity: 0.7, duration: 0.5 }, 0)
    .to(['[data-hero-copy]', '.fieldlog', '.cue', '[data-kicker]'], { opacity: 0, y: -50, duration: 0.18 }, 0)
    .to('.bf1', { x: -200, y: -260, rotate: -40, duration: 0.5 }, 0)
    .to('.bf2', { x: 160, y: -200, duration: 0.5 }, 0)
    .to(st, { p: 1, duration: 0.72, onUpdate: paint }, 0.16)
    .fromTo('[data-p2-inner]', { scale: 1.45 }, { scale: 1, duration: 0.72 }, 0.16)
    .fromTo('[data-weave]', { yPercent: 60, opacity: 0.2 }, { yPercent: 0, opacity: 1, duration: 0.4 }, 0.5)
    .fromTo('[data-p2-copy]', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2 }, 0.78)
    .to({}, { duration: 0.1 })
  addEventListener('resize', paint)
  ST.refresh()
}
motion()
