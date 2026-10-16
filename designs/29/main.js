// room 24 · enhancement layer. the page reads fine without any of this.
import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { productsMarkup, collectionSummary } from './render.js'

const $ = s => document.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const root = document.documentElement

/* ---------------------------------------------------------------- facts from the source */
const works = $('[data-works]')
works.innerHTML = productsMarkup(content.products)
$('[data-summary]').textContent = collectionSummary(content.products)
$('[data-mcp]').textContent = content.mcpCommand
$('[data-availability]').textContent = content.availability.toLowerCase()
const email = $('[data-email]')
email.href = `mailto:${content.email}`
email.textContent = content.email

/* ---------------------------------------------------------------- slow reveal of the collection */
root.classList.add('enhanced')
const labels = [...works.children]
if (reduce.matches || !('IntersectionObserver' in window)) {
  labels.forEach(l => l.classList.add('seen'))
} else {
  const vh = innerHeight
  labels.forEach(l => { if (l.getBoundingClientRect().top < vh) l.classList.add('seen') })
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return
      const i = labels.indexOf(en.target) % 3
      en.target.style.transitionDelay = `${i * 220}ms`
      en.target.classList.add('seen')
      io.unobserve(en.target)
    })
  }, { rootMargin: '0px 0px -12% 0px' })
  labels.filter(l => !l.classList.contains('seen')).forEach(l => io.observe(l))
}

/* ---------------------------------------------------------------- sound: soft keys, opt-in */
const sound = (() => {
  let ctx = null, master = null, noise = null, on = false
  const setup = () => {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    ctx = new AC()
    master = ctx.createGain(); master.gain.value = 0.55
    const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 5200
    master.connect(soft).connect(ctx.destination)
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3)
    return true
  }
  const env = (g, t, peak, len) => {
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(peak, t + 0.0025)
    g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  }
  const key = ch => {
    if (!on || !ctx || document.hidden || ch === undefined) return
    const t = ctx.currentTime + 0.005
    const space = ch === ' '
    const src = ctx.createBufferSource(); src.buffer = noise
    src.playbackRate.value = 0.9 + Math.random() * 0.25
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'
    bp.frequency.value = space ? 1100 : 2300 + Math.random() * 1500; bp.Q.value = 1.4
    const g = ctx.createGain(); env(g, t, space ? 0.14 : 0.09, 0.04)
    src.connect(bp).connect(g).connect(master); src.start(t); src.stop(t + 0.06)
    const o = ctx.createOscillator(); o.type = 'sine'
    o.frequency.setValueAtTime(space ? 120 : 175 + Math.random() * 45, t)
    o.frequency.exponentialRampToValueAtTime(70, t + 0.035)
    const g2 = ctx.createGain(); env(g2, t, space ? 0.06 : 0.035, 0.045)
    o.connect(g2).connect(master); o.start(t); o.stop(t + 0.06)
  }
  return {
    get on() { return on },
    toggle() {
      if (!ctx && !setup()) return false
      on = !on
      if (on) { ctx.resume(); key('a'); setTimeout(() => key(' '), 110) }
      return on
    },
    key,
  }
})()

const soundBtn = $('[data-sound]')
if (window.AudioContext || window.webkitAudioContext) {
  soundBtn.hidden = false
  soundBtn.addEventListener('click', () => {
    const on = sound.toggle()
    soundBtn.setAttribute('aria-pressed', String(on))
    soundBtn.querySelector('[data-sound-state]').textContent = on ? 'on' : 'off'
  })
}

/* ---------------------------------------------------------------- the stack */
const stack = $('[data-stack]')
const since = $('[data-since]')
const feed = createFeed()
let cards = []

const detailOf = e =>
  e.country ? e.country
  : e.ms ? `${e.ms} ms`
  : e.sha ? `deploy ${e.sha}, ${e.kb} kb`
  : e.city ? `${e.city}, ${e.kb} kb`
  : ''

function makeCard(e) {
  const li = document.createElement('li')
  li.className = 'card'
  li.innerHTML = `
    <div class="card-face">
      <p class="card-product"></p>
      <p class="card-text"><span class="sr"></span><span class="typed" aria-hidden="true"></span></p>
      <p class="card-detail"></p>
    </div>
    <p class="card-meta" aria-hidden="true"><span class="card-time"></span><span class="card-sum"></span></p>`
  const low = s => String(s).toLowerCase()
  li.querySelector('.card-product').textContent = low(e.label)
  li.querySelector('.sr').textContent = `${low(describe(e))}, ${formatTime(e.time)}`
  li.querySelector('.typed').textContent = low(e.text)
  li.querySelector('.card-detail').textContent = low(detailOf(e))
  li.querySelector('.card-time').textContent = formatTime(e.time)
  li.querySelector('.card-sum').textContent = `${low(e.label)}  ${low(e.text)}`
  return { el: li, e }
}

const visible = () => parseInt(getComputedStyle(stack).getPropertyValue('--n'), 10) || 8

function layout() {
  const n = visible()
  cards.forEach((c, k) => {
    c.el.style.setProperty('--k', String(Math.min(k, n)))
    c.el.classList.toggle('is-front', k === 0)
    c.el.toggleAttribute('data-gone', k >= n)
    c.el.inert = k >= n
  })
}

function prune() {
  const n = visible()
  while (cards.length > Math.max(n + 1, 12)) cards.pop().el.remove()
}

// typing: one character at a time, at the pace of someone who is not in a hurry.
function typeIn(card) {
  const typed = card.el.querySelector('.typed')
  const detail = card.el.querySelector('.card-detail')
  const text = typed.textContent
  if (reduce.matches) { sound.key('a'); return }
  typed.textContent = ''
  detail.style.opacity = '0'
  const caret = document.createElement('i'); caret.className = 'caret'
  typed.after(caret)
  let i = 0
  const step = () => {
    if (!card.el.isConnected) return
    if (i >= text.length) {
      caret.remove()
      detail.style.transition = 'opacity 1600ms cubic-bezier(.22,.61,.12,1)'
      detail.style.opacity = ''
      return
    }
    const ch = text[i++]
    typed.textContent += ch
    sound.key(ch)
    setTimeout(step, 62 + Math.random() * 70 + (ch === ' ' ? 60 : 0))
  }
  setTimeout(step, 700)
}

function arrive(e) {
  const card = makeCard(e)
  card.el.setAttribute('data-new', '')
  stack.prepend(card.el)
  cards.unshift(card)
  typeIn(card)
  card.el.getBoundingClientRect() // commit the starting frame before the move
  requestAnimationFrame(() => {
    card.el.removeAttribute('data-new')
    layout()
  })
  setTimeout(prune, 1800)
}

// first hang: history, newest in front, no theatre.
stack.replaceChildren()
cards = feed.recent(12).map(makeCard)
cards.forEach(c => stack.append(c.el))
layout()

feed.subscribe(arrive)

let resizeT
addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(layout, 120) })

/* ---------------------------------------------------------------- the time since anything happened */
function tick() {
  const last = cards[0]?.e.time
  if (!last) return
  const s = Math.max(0, Math.round((Date.now() - last.getTime()) / 1000))
  if (s < 20) since.textContent = `last event ${s} s ago`
  else if (s < 60) since.textContent = `quiet for ${s} s. this is real.`
  else since.textContent = `quiet for ${Math.floor(s / 60)} min ${s % 60} s. still real.`
}
tick()
setInterval(tick, 1000)
