import { content } from '../_shared/content.js'
import { createFeed, formatTime, describe } from '../_shared/feed.js'
import { ledeHTML, productsHTML } from './render.js'
import { createSound } from './sound.js'

const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const $ = s => document.querySelector(s)

// 1. Facts: re-render from content.js only if the baked markup has drifted.
const lede = $('#lede'), bill = $('#bill-acts')
const fresh = ledeHTML(content)
if (lede.innerHTML.trim() !== fresh) lede.innerHTML = fresh
const acts = productsHTML(content)
if (bill.innerHTML.trim() !== acts) bill.innerHTML = acts
$('#mcp').textContent = content.mcpCommand

// 2. The products talk. Each event becomes one line, numbers first.
const SAY = {
  'thread.read': e => [`${e.ms} ms.`, 'An agent read a thread.'],
  'draft.created': e => [`${e.ms} ms.`, 'An agent drafted a reply.'],
  'send.scheduled': e => [`${e.ms} ms.`, 'An agent scheduled a send.'],
  'inbox.searched': e => [`${e.ms} ms.`, 'An agent searched an inbox.'],
  'inbox.triaged': e => [`${e.ms} ms.`, 'Automation triaged an inbox.'],
  'inbox.connected': e => ['1 new inbox.', `${e.country}.`],
  'story.completed': e => ['1 story finished.', `${e.country}.`],
  'story.shared': e => ['1 story shared.', `${e.country}.`],
  'install': e => ['1 new player.', `${e.country}.`],
  'tool.searched': e => [`${e.ms} ms.`, 'An agent searched for a tool.'],
  'tool.executed': e => [`${e.ms} ms.`, 'An agent ran a tool.'],
  'page.served': e => [`${e.kb} KB`, `served from ${e.city}.`],
  'deploy': e => [`${e.kb} KB.`, `Deployed ${e.sha}.`],
}
const say = e => (SAY[e.kind] ? SAY[e.kind](e) : ['', describe(e)])

const list = $('#chat')
const MAX = 14
const GAP = () => parseFloat(getComputedStyle(list).getPropertyValue('--gap')) || 10

function bubble(e, animate) {
  const [num, rest] = say(e)
  const li = document.createElement('li')
  li.className = 'msg' + (e.product === 'albretsen.no' ? ' self' : '') + (animate ? ' enter' : '')
  li.dataset.p = e.product
  const words = rest.split(' ')
  li.innerHTML =
    `<span class="who">${e.label}</span>` +
    `<p class="b"><span class="n w" style="--i:0">${num}</span> ` +
    words.map((w, i) => `<span class="w" style="--i:${i + 1}">${w}</span>`).join(' ') + `</p>` +
    `<time datetime="${e.time.toISOString()}">${formatTime(e.time)}</time>`
  li.setAttribute('aria-label', `${e.label}: ${num} ${rest} ${formatTime(e.time)}`)
  return li
}

// Bubbles are absolutely placed and stacked from the bottom with transforms,
// so a new message never shifts layout.
function stack() {
  const gap = GAP()
  let y = 0
  const items = [...list.children]
  for (let i = items.length - 1; i >= 0; i--) {
    const li = items[i]
    li.style.transform = `translateY(${-y}px)`
    y += li.offsetHeight + gap
    if (y > list.clientHeight + 200 && i > 0) { items.slice(0, i).forEach(n => n.remove()); break }
  }
}

const feed = createFeed()
list.textContent = ''
list.classList.add('live')
for (const e of feed.recent(10).reverse()) list.append(bubble(e, false))
stack()
new ResizeObserver(stack).observe(list)
document.fonts?.ready.then(stack)

const sound = createSound()
const since = $('#since')
let arrived = 0
feed.subscribe(e => {
  const li = bubble(e, !reduce.matches)
  list.append(li)
  while (list.children.length > MAX) list.firstElementChild.remove()
  stack()
  arrived++
  since.textContent = arrived
  sound.event(e)
  if (!reduce.matches) li.addEventListener('animationend', () => li.classList.remove('enter'), { once: true })
})

// 3. Sound toggle.
const btn = $('#sound')
btn.hidden = false
btn.addEventListener('click', async () => {
  if (sound.on) sound.stop(); else await sound.start()
  btn.setAttribute('aria-pressed', String(sound.on))
  btn.querySelector('.state').textContent = sound.on ? 'on' : 'off'
})

// 4. The bill blooms into weight as each act reaches the reader.
if (!reduce.matches && 'IntersectionObserver' in window) {
  const names = [...document.querySelectorAll('.act-name .bloom')]
  const io = new IntersectionObserver(entries => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('open'); io.unobserve(en.target) }
  }, { rootMargin: '0px 0px -12% 0px' })
  for (const n of names) {
    const r = n.getBoundingClientRect()
    if (r.top > innerHeight) { n.classList.add('wait'); io.observe(n) }
  }
}
