// Simulated live event feed with the same shape the real one will have.
// Real events will come from a Cloudflare Durable Object over WebSocket;
// for brand exploration this generates plausible events locally.
//
//   import { createFeed } from './kit/feed.js'   (copied from archive/designs/_shared)
//   const feed = createFeed()
//   feed.recent(12)              // newest first, Event[]
//   const off = feed.subscribe(e => render(e))   // called for each new event
//
// Event: { id, time: Date, product, label, kind, text, country?, ms?, sha?, kb? }
//   product: 'mcp-emails' | 'fun-libs' | 'toolrails' | 'albretsen.no'
//   kind:    short machine key, e.g. 'send.scheduled'
//   text:    plain human description, e.g. 'agent scheduled a send'

const COUNTRIES = ['Norway', 'Sweden', 'Denmark', 'Germany', 'United States', 'Brazil', 'India',
  'United Kingdom', 'Canada', 'Netherlands', 'Japan', 'Australia', 'France', 'Spain', 'Poland', 'Mexico']
const CITIES = ['Oslo', 'Stockholm', 'Frankfurt', 'Amsterdam', 'London', 'Ashburn', 'São Paulo', 'Tokyo', 'Singapore', 'Sydney']

const TEMPLATES = [
  // [weight, product, kind, text, extras]
  [7, 'mcp-emails', 'thread.read', 'agent read a thread', ['ms']],
  [5, 'mcp-emails', 'draft.created', 'agent drafted a reply', ['ms']],
  [3, 'mcp-emails', 'send.scheduled', 'agent scheduled a send', ['ms']],
  [4, 'mcp-emails', 'inbox.searched', 'agent searched an inbox', ['ms']],
  [2, 'mcp-emails', 'inbox.triaged', 'automation triaged an inbox', ['ms']],
  [1, 'mcp-emails', 'inbox.connected', 'new inbox connected', ['country']],
  [8, 'fun-libs', 'story.completed', 'story completed', ['country']],
  [3, 'fun-libs', 'story.shared', 'story shared', ['country']],
  [2, 'fun-libs', 'install', 'new player', ['country']],
  [2, 'toolrails', 'tool.searched', 'agent searched for a tool', ['ms']],
  [1, 'toolrails', 'tool.executed', 'agent ran a tool', ['ms']],
  [1, 'albretsen.no', 'page.served', 'page served', ['city', 'kb']],
  [0.3, 'albretsen.no', 'deploy', 'deploy', ['sha', 'kb']],
]
const LABELS = { 'mcp-emails': 'MCP Emails', 'fun-libs': 'Fun Libs', toolrails: 'Toolrails', 'albretsen.no': 'albretsen.no' }

function rng(seed) { // mulberry32
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

function makeEvent(r, time, n) {
  const total = TEMPLATES.reduce((s, t) => s + t[0], 0)
  let x = r() * total, t = TEMPLATES[0]
  for (const tpl of TEMPLATES) { if ((x -= tpl[0]) <= 0) { t = tpl; break } }
  const [, product, kind, text, extras] = t
  const e = { id: `${time.getTime().toString(36)}-${n}`, time, product, label: LABELS[product], kind, text }
  for (const k of extras) {
    if (k === 'ms') e.ms = Math.round(90 + r() * r() * 900)
    if (k === 'country') e.country = COUNTRIES[Math.floor(r() * r() * COUNTRIES.length)]
    if (k === 'city') e.city = CITIES[Math.floor(r() * CITIES.length)]
    if (k === 'kb') e.kb = +(10.5 + r() * 2.5).toFixed(1)
    if (k === 'sha') e.sha = Math.floor(r() * 0xfffffff).toString(16).padStart(7, '0')
  }
  return e
}

// Activity follows the clock: busy in the European/US day, quiet at night.
function meanGapSeconds(date) {
  const h = date.getUTCHours() + date.getUTCMinutes() / 60
  const activity = 0.25 + 0.75 * Math.max(0, Math.sin(((h - 5) / 24) * 2 * Math.PI)) // 0.25..1
  return 4 / activity // ~4s at peak, ~16s in the quiet hours
}

export function createFeed({ seed = Date.now() % 1e9, historySize = 50 } = {}) {
  const r = rng(seed)
  const events = []
  let n = 0
  let t = new Date(Date.now() - 1000)
  for (let i = 0; i < historySize; i++) { // build history backwards
    events.push(makeEvent(r, t, n++))
    t = new Date(t.getTime() - (-Math.log(1 - r()) * meanGapSeconds(t) * 1000))
  }
  const subs = new Set()
  let timer = null
  const schedule = () => {
    const gap = -Math.log(1 - Math.random()) * meanGapSeconds(new Date()) * 1000
    timer = setTimeout(() => {
      const e = makeEvent(Math.random, new Date(), n++)
      events.unshift(e); if (events.length > historySize) events.pop()
      subs.forEach(fn => fn(e))
      schedule()
    }, Math.min(gap, 30000))
  }
  schedule()
  return {
    recent: (count = 12) => events.slice(0, count),
    subscribe: fn => { subs.add(fn); return () => subs.delete(fn) },
    stop: () => clearTimeout(timer),
  }
}

// Helpers designs may use or ignore.
export const formatTime = d => d.toTimeString().slice(0, 8)
export function describe(e) {
  const tail = e.ms ? `${e.ms} ms` : e.country ? e.country : e.sha ? `${e.sha} · ${e.kb} KB` : e.city ? `${e.city} · ${e.kb} KB` : ''
  return tail ? `${e.text} · ${tail}` : e.text
}
