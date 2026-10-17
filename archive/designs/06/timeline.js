// Products as a timeline, 2016 to today. Pure function: content in, HTML out.
// The same function produced the static markup in index.html, so the page
// reads the same with or without JavaScript.

const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' }
const ONGOING = new Set(['live', 'building', 'paused'])

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export function renderTimeline(c) {
  const h = c.history
  const first = h.playDeveloperSince
  const last = Math.max(h.companySince, ...c.products.map(p => p.since))

  // Lanes: one per product that is still running, in order of start year.
  const lanes = c.products.filter(p => ONGOING.has(p.status)).sort((a, b) => a.since - b.since)
  const laneOf = id => lanes.findIndex(p => p.id === id)

  const rows = []
  for (let y = first; y <= last; y++) {
    const items = []
    if (y === h.playDeveloperSince) items.push({ note: 'First app published on Google Play.' })
    if (y === h.consultingSince) items.push({ note: 'Starts taking consulting work.' })
    if (y === h.companySince) items.push({ note: 'Albretsen AS is founded.' })
    for (const p of c.products) if (p.since === y) items.push({ p })
    if (!items.length) items.push({ empty: true })
    items.forEach((it, i) => rows.push({ y, first: i === 0, ...it }))
  }

  const axis = (row, idx) => {
    let s = '<span class="axis" aria-hidden="true"><i class="spine"></i>'
    lanes.forEach((p, k) => {
      const startIdx = rows.findIndex(r => r.p && r.p.id === p.id)
      if (idx < startIdx) return
      s += `<i class="lane lane--${p.status}${idx === startIdx ? ' lane--start' : ''}" style="--k:${k}"></i>`
    })
    if (row.p) {
      const k = laneOf(row.p.id)
      s += `<i class="node node--${row.p.status}" style="--k:${k < 0 ? -1 : k}"></i>`
    } else if (row.note) s += '<i class="node node--note" style="--k:-1"></i>'
    return s + '</span>'
  }

  const yearCell = row => `<span class="yr${row.first ? '' : ' yr--rep'}">${row.y}</span>`

  const body = rows.map((row, idx) => {
    if (row.empty) {
      return `<li class="tl-row tl-row--empty">${yearCell(row)}${axis(row, idx)}<span class="tl-quiet">Nothing listed.</span></li>`
    }
    if (row.note) {
      return `<li class="tl-row tl-row--note">${yearCell(row)}${axis(row, idx)}<span class="tl-note">${esc(row.note)}</span></li>`
    }
    const p = row.p
    const name = p.url ? `<a href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a>` : esc(p.name)
    const facts = p.facts && p.facts.length ? `<p class="tl-facts">${p.facts.map(esc).join('<span aria-hidden="true"> · </span>')}</p>` : ''
    const fig = p.figure ? `<p class="tl-fig"><b>${esc(p.figure.value)}</b> <span>${esc(p.figure.label)}</span></p>` : ''
    return `<li class="tl-row tl-row--product is-${p.status}">${yearCell(row)}${axis(row, idx)}` +
      `<div class="tl-body"><h3 class="tl-name">${name}</h3><p class="tl-line">${esc(p.line)}</p>${facts}</div>` +
      `<div class="tl-meta"><p class="tl-status"><span class="pip" aria-hidden="true"></span>${STATUS[p.status]} <span class="tl-since">started ${p.since}</span></p>${fig}</div></li>`
  }).join('\n')

  const words = ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
  const n = k => words[k] || String(k)
  const today = `<li class="tl-row tl-row--today"><span class="yr">Today</span>${axis({}, rows.length)}` +
    `<span class="tl-note">${tally(c.products, n)}</span></li>`

  return body + '\n' + today
}

function tally(products, n) {
  const count = s => products.filter(p => p.status === s).length
  const parts = [['live', 'live'], ['building', 'building'], ['paused', 'paused']]
    .map(([s, w]) => [count(s), w]).filter(([k]) => k).map(([k, w]) => `${n(k).toLowerCase()} ${w}`)
  const head = parts.join(', ').replace(/^./, ch => ch.toUpperCase())
  return `${head}. ${n(count('retired'))} retired, still listed.`
}
