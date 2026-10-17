// Full Stop. The page is still; only the feed moves.
// Every event becomes one full stop in the sky. Four products, four clusters.
// No lines are drawn between them: the eye does that on its own.

import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { renderProducts } from './products.js'

const SVG = 'http://www.w3.org/2000/svg'
const MAX = 48

// Cluster centres and radii, in viewBox units. Desktop sky is 1000 x 700, narrow sky 1000 x 1000.
// Label positions in style.css are derived from these numbers; keep them in step.
const LAYOUT = {
  wide: { w: 1000, h: 700, c: {
    'mcp-emails': [330, 330, 175], 'fun-libs': [700, 300, 165],
    toolrails: [560, 570, 85], 'albretsen.no': [880, 560, 60] } },
  narrow: { w: 1000, h: 1000, c: {
    'mcp-emails': [300, 360, 210], 'fun-libs': [700, 640, 220],
    toolrails: [270, 830, 110], 'albretsen.no': [760, 200, 80] } },
}
// Events that change something get a heavier stop.
const HEAVY = new Set(['install', 'inbox.connected', 'deploy', 'send.scheduled', 'story.shared', 'tool.executed'])

const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const narrowQ = matchMedia('(max-width: 899px)')

// Deterministic place in the cluster for each event id.
function offset(id) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  let a = h >>> 0
  const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const d = Math.min(0.98, Math.sqrt(-2 * Math.log(1 - r())) * 0.42)
  const th = r() * Math.PI * 2
  return [Math.cos(th) * d, Math.sin(th) * d]
}

function short(e) {
  return describe(e)
}

function init() {
  const svg = document.getElementById('sky-dots')
  const log = document.getElementById('log')
  const labels = new Map([...document.querySelectorAll('[data-cluster]')].map(el => [el.dataset.cluster, el]))
  if (!svg) return

  const feed = createFeed()
  const events = feed.recent(MAX).reverse() // oldest first
  const nodes = new Map()
  let layout = narrowQ.matches ? LAYOUT.narrow : LAYOUT.wide

  function place(e) {
    const [cx, cy, r] = layout.c[e.product]
    const [ox, oy] = offset(e.id)
    return [cx + ox * r, cy + oy * r]
  }

  function draw(fresh) {
    svg.setAttribute('viewBox', `0 0 ${layout.w} ${layout.h}`)
    const n = events.length
    const live = new Set()
    events.forEach((e, i) => {
      const age = n - 1 - i // 0 = newest
      let c = nodes.get(e.id)
      if (!c) {
        c = document.createElementNS(SVG, 'circle')
        if (fresh && e.id === fresh && !reduced.matches) c.classList.add('arrive')
        svg.appendChild(c)
        nodes.set(e.id, c)
      }
      live.add(e.id)
      const [x, y] = place(e)
      const heavy = HEAVY.has(e.kind)
      const rad = (age === 0 ? 10 : heavy ? 6 : age < 6 ? 4.4 : 3.8) * (narrowQ.matches ? 1.4 : 1)
      c.setAttribute('cx', x.toFixed(1))
      c.setAttribute('cy', y.toFixed(1))
      c.setAttribute('r', rad.toFixed(1))
      c.setAttribute('class', `${c.classList.contains('arrive') ? 'arrive ' : ''}${age === 0 ? 'now' : age < 6 ? 'near' : 'far'}`)
      c.style.setProperty('--o', age < 6 ? 1 : Math.max(0.3, 1 - age / n).toFixed(2))
    })
    for (const [id, c] of nodes) if (!live.has(id)) { c.remove(); nodes.delete(id) }

    // Each cluster says its latest line. The newest one speaks in cream.
    const newest = events[n - 1]
    for (const [product, el] of labels) {
      const last = events.findLast(e => e.product === product)
      const line = el.querySelector('.voice__line')
      if (last && line) line.textContent = short(last)
      el.classList.toggle('voice--now', !!newest && newest.product === product)
    }

    if (log) {
      log.innerHTML = ''
      for (const e of events.slice(-8).reverse()) {
        const li = document.createElement('li')
        li.textContent = `${formatTime(e.time)}, ${e.label}: ${describe(e)}`
        log.appendChild(li)
      }
    }
  }

  draw()
  document.documentElement.classList.add('sky-on')

  feed.subscribe(e => {
    events.push(e)
    if (events.length > MAX) events.shift()
    draw(e.id)
  })
  narrowQ.addEventListener('change', () => { layout = narrowQ.matches ? LAYOUT.narrow : LAYOUT.wide; draw() })
}

// Products come from content.js; the static copy in index.html is the same markup.
const works = document.getElementById('works')
if (works) works.innerHTML = renderProducts(content.products)

init()
