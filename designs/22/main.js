import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { productsHTML, summary } from './products.js'
import { Spring } from './spring.js'
import { createSound } from './sound.js'

const $ = s => document.querySelector(s)
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const sound = createSound()

/* Products: canonical facts from content.js (same markup as the static fallback) */
$('#plist').innerHTML = productsHTML(content.products)
$('#psum').textContent = summary(content.products)

/* Log: fixed slots, content shifts through them, motion is transform only */
const VISIBLE = 12, EXTRA = 3, TOTAL = VISIBLE + EXTRA
const list = $('#log')
list.textContent = ''
const slots = Array.from({ length: TOTAL }, (_, i) => {
  const li = document.createElement('li')
  li.className = 'row'
  if (i >= VISIBLE) li.setAttribute('aria-hidden', 'true')
  li.innerHTML = '<i class="px" aria-hidden="true"></i><time></time><span class="lp"></span><span class="lx"></span>'
  list.append(li)
  return li
})

const feed = createFeed()
let events = feed.recent(TOTAL)
let newestId = null, newTimer = 0, count = 0

function paint() {
  slots.forEach((li, i) => {
    const e = events[i]
    const [, t, p, x] = li.children
    if (!e) { t.textContent = p.textContent = x.textContent = ''; li.removeAttribute('data-product'); return }
    t.textContent = formatTime(e.time)
    t.dateTime = e.time.toISOString()
    p.textContent = e.label
    x.textContent = describe(e)
    li.dataset.product = e.product
    li.classList.toggle('is-new', e.id === newestId)
  })
}
paint()

const slide = new Spring({
  stiffness: 220, damping: 25, mass: 1,
  onUpdate: y => { list.style.transform = y ? `translate3d(0,${y.toFixed(2)}px,0)` : '' },
})

/* The mark's blue pixel: a pulse with a little give */
const dot = $('#pulse')
const pulse = new Spring({
  stiffness: 320, damping: 11, mass: 1, value: 1,
  onUpdate: s => { dot.style.transform = s === 1 ? '' : `scale(${s.toFixed(3)})` },
})

const countEl = $('#count')
feed.subscribe(e => {
  events.unshift(e); events.length = Math.min(events.length, TOTAL)
  newestId = e.id
  paint()
  clearTimeout(newTimer)
  newTimer = setTimeout(() => { newestId = null; paint() }, 2400)

  if (reduce.matches) slide.set(0)
  else {
    const h = slots[0].getBoundingClientRect().height
    slide.x = Math.max(slide.x - h, -EXTRA * h)
    slide.onUpdate(slide.x)
    slide.to(0)
  }

  if (reduce.matches) { dot.classList.remove('flash'); dot.getBoundingClientRect(); dot.classList.add('flash') }
  else pulse.kick(0.9, 0)

  count++
  countEl.textContent = `${count} ${count === 1 ? 'event' : 'events'}`
  sound.event(e.product)
})

/* Sist endret: only if the server actually said so */
const mod = new Date(document.lastModified)
if (!isNaN(mod) && Date.now() - mod.getTime() > 10000) {
  const pad = n => String(n).padStart(2, '0')
  $('#modified').textContent = `${mod.getFullYear()}-${pad(mod.getMonth() + 1)}-${pad(mod.getDate())}`
}

/* Sound toggle */
const btn = $('#sound')
document.documentElement.classList.add("js")
btn.addEventListener('click', () => {
  const on = sound.toggle()
  btn.setAttribute('aria-pressed', String(on))
  btn.querySelector('span span').textContent = on ? 'på' : 'av'
})

/* Index: a pixel that springs to the section you are reading */
const marker = $('#marker')
const links = [...document.querySelectorAll('.index a')]
const markSpring = new Spring({
  stiffness: 170, damping: 19, mass: 1,
  onUpdate: y => { marker.style.transform = `translate3d(0,${y.toFixed(2)}px,0)` },
})
let active = null
function placeMarker(link, instant) {
  if (!link) return
  links.forEach(a => a === link ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'))
  const y = link.offsetTop + link.offsetHeight / 2 - marker.offsetHeight / 2
  if (instant || reduce.matches || active === null) markSpring.set(y); else markSpring.to(y)
  marker.classList.add('on')
  active = link
}
const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean)
const io = new IntersectionObserver(entries => {
  for (const en of entries) if (en.isIntersecting) placeMarker(links.find(a => a.getAttribute('href') === '#' + en.target.id))
}, { rootMargin: '-35% 0px -60% 0px' })
placeMarker(links[0])
sections.forEach(s => io.observe(s))
addEventListener('resize', () => placeMarker(active, true))
addEventListener('scroll', () => {
  const end = innerHeight + scrollY >= document.documentElement.scrollHeight - 4
  if (end && active !== links.at(-1)) placeMarker(links.at(-1))
}, { passive: true })
links.forEach(a => a.addEventListener('click', () => sound.ui()))

/* Footer facts from the canonical source */
$('#avail').textContent = content.availability
const mail = $('#mail')
mail.href = `mailto:${content.email}`
mail.textContent = content.email
