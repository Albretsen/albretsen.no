// Blue Hour Terrace · design 66
// 1. Dolly: the paper sheets shift by depth with the pointer (a few px, symmetric, damped).
// 2. Lamplighter: the windows light one beat apart after first paint; the switch turns them off and on.
// 3. The table: products glint when the live feed reports them; the espresso copies the MCP line.
// 4. Brass Ring cursor and the kit's motion study.
import { content } from '../../_shared/content.js'
import { createFeed } from '../../_shared/feed.js'
import { mountCursor } from '../assets/cursor/cursor.js'
import { initMotion } from '../assets/motion.js'

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const hero = document.querySelector('.hero')
const BEAT = 140

// ---------------------------------------------------------------- depth
hero.querySelectorAll('[data-depth]').forEach((el) => el.style.setProperty('--d', el.dataset.depth))

if (!reduced && matchMedia('(pointer: fine)').matches) {
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0, inView = true
  const step = () => {
    x += (tx - x) * 0.08; y += (ty - y) * 0.08
    hero.style.setProperty('--px', x.toFixed(4)); hero.style.setProperty('--py', y.toFixed(4))
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.0008 ? requestAnimationFrame(step) : 0
  }
  hero.addEventListener('pointermove', (e) => {
    if (!inView) return
    const r = hero.getBoundingClientRect()
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2
    if (!raf) raf = requestAnimationFrame(step)
  }, { passive: true })
  hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(step) })
  new IntersectionObserver(([en]) => { inView = en.isIntersecting }).observe(hero)
}

// ---------------------------------------------------------------- lamplighter
const lampBtn = hero.querySelector('.lamps')
const lampLabel = lampBtn.querySelector('.lamps__label')
function setLamps(on) {
  hero.classList.toggle('is-lit', on)
  lampBtn.setAttribute('aria-pressed', String(on))
  lampLabel.textContent = on ? 'Lamps on' : 'Lamps off'
}
lampBtn.addEventListener('click', () => setLamps(!hero.classList.contains('is-lit')))
// light them once the stage has painted (or straight away when motion is reduced)
const firstSheets = [...hero.querySelectorAll('.scene--front .layer > picture:first-child img')]
Promise.all(firstSheets.map((img) => img.decode?.().catch(() => {}) ?? Promise.resolve()))
  .then(() => setTimeout(() => setLamps(true), reduced ? 0 : BEAT * 5))

// ---------------------------------------------------------------- copy (the order pill and the espresso)
const announce = document.getElementById('announce')
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text })
    ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select()
    let ok = false; try { ok = document.execCommand('copy') } catch {}
    ta.remove(); return ok
  }
}
document.querySelectorAll('.js-copy').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const ok = await copy(btn.dataset.copy || content.mcpCommand)
    const msg = ok ? 'Copied' : 'Select and copy'
    announce.textContent = ok ? 'Command copied to the clipboard.' : 'Copy failed. Select the command to copy it.'
    const label = btn.querySelector('.order__copy-label')
    const note = btn.closest('.spot')?.querySelector('.js-cup-note')
    if (label) { label.textContent = msg; btn.classList.add('is-done') }
    if (note) note.textContent = ok ? 'Copied. Paste it in your terminal.' : 'Copy failed'
    clearTimeout(btn._t)
    btn._t = setTimeout(() => {
      if (label) { label.textContent = 'Copy'; btn.classList.remove('is-done') }
      if (note) note.textContent = 'Click to copy'
    }, BEAT * 12)
  })
})

// ---------------------------------------------------------------- feed: one line, and a glint on the table
const list = document.querySelector('.feed__list')
const feedBox = document.querySelector('.feed')
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
function line(e) {
  const li = document.createElement('li')
  const t = document.createElement('time'); t.dateTime = e.time.toISOString(); t.textContent = timeFmt.format(e.time)
  const b = document.createElement('b'); b.textContent = e.label
  const where = e.country ? `, ${e.country}` : e.city ? `, ${e.city}` : e.ms ? ` in ${e.ms} ms` : ''
  li.append(t, ' · ', b, ' · ', `${e.text}${where}`)
  return li
}
function show(e, animate) {
  const li = line(e)
  const old = [...list.children]
  if (!animate || reduced) { old.forEach((o) => o.remove()); list.append(li); return }
  li.classList.add('is-in'); list.append(li)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    li.classList.remove('is-in'); old.forEach((o) => o.classList.add('is-out'))
    setTimeout(() => old.forEach((o) => o.remove()), BEAT * 3)
  }))
  feedBox.classList.remove('is-new'); void feedBox.offsetWidth; feedBox.classList.add('is-new')
  const spot = hero.querySelector(`.spot[data-product="${e.product}"]`)
  if (spot && hero.classList.contains('is-lit')) {
    spot.classList.remove('is-glint'); void spot.offsetWidth; spot.classList.add('is-glint')
  }
}
const feed = createFeed()
show(feed.recent(1)[0], false)
let last = 0
feed.subscribe((e) => {
  // never faster than one line per two seconds: calm over complete
  const now = performance.now(); if (now - last < 2000) return; last = now
  show(e, true)
})

// ---------------------------------------------------------------- cursor + motion study
mountCursor()
initMotion()
