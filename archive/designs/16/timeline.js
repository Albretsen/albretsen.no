// Full Stop / timeline: renders content.products as a 2016 -> today timeline.
// Pure function, used at runtime by main.js and once by hand to pre-render
// the static markup inside index.html (so the section reads without JS).

export const FIRST = 2016
export const NOW = 2026

// One hue per feed source (OKLCH hue angle). Seed 336 belongs to MCP Emails,
// the busiest lane, so the seed is the colour you see most.
export const HUES = { 'mcp-emails': 336, 'fun-libs': 96, toolrails: 216, 'albretsen.no': 156 }

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function counts(products) {
  const c = { total: products.length, live: 0, building: 0, paused: 0, retired: 0 }
  for (const p of products) c[p.status] = (c[p.status] || 0) + 1
  return c
}

function markers(history) {
  return [
    { year: history.playDeveloperSince, text: 'first app on Google Play' },
    { year: history.consultingSince, text: 'consulting starts' },
    { year: history.companySince, text: 'Albretsen AS', id: 'albretsen.no', hue: HUES['albretsen.no'] },
  ]
}

function rows(content) {
  const products = [...content.products].reverse()
    .map((p, i) => ({ type: 'p', year: p.since, i, p }))
  const marks = markers(content.history).map((m, i) => ({ type: 'm', year: m.year, i: -10 + i, m }))
  return [...marks, ...products].sort((a, b) => a.year - b.year || a.i - b.i)
}

const x = year => ((year - FIRST) / (NOW - FIRST)).toFixed(3)

function productRow(p) {
  const hue = HUES[p.id]
  const style = `--x:${x(p.since)}${hue !== undefined ? `;--h:${hue}` : ''}`
  const name = p.url ? `<a href="${esc(p.url)}">${esc(p.name)}</a>` : esc(p.name)
  const fig = p.figure
    ? `<span class="v">${esc(p.figure.value)}</span><span class="u">${esc(p.figure.label)}</span>`
    : `<span class="v none">&mdash;</span><span class="u">no figure</span>`
  const facts = p.facts ? `<p class="facts">${p.facts.map(esc).join(' / ')}</p>` : ''
  const tally = hue !== undefined
    ? `<p class="tally" data-tally="${p.id}"><span>0</span> events since you arrived</p>` : ''
  return `<li class="row s-${p.status}${hue !== undefined ? ' fed' : ''}" data-p="${p.id}" style="${style}">
  <div class="track" aria-hidden="true"><i class="run"></i><i class="dot"></i></div>
  <div class="fig">${fig}</div>
  <div class="who">
    <h3>${name}</h3>
    <p class="meta"><b>${p.since}</b> <span class="st">${p.status}</span></p>
    <p class="say">${esc(p.line)}</p>${facts}${tally}
  </div>
</li>`
}

function markerRow(m) {
  const style = `--x:${x(m.year)}${m.hue !== undefined ? `;--h:${m.hue}` : ''}`
  return `<li class="row mark${m.hue !== undefined ? ' fed' : ''}"${m.id ? ` data-p="${m.id}"` : ''} style="${style}">
  <div class="track" aria-hidden="true"><i class="dot"></i></div>
  <p class="note"><b>${m.year}</b> ${esc(m.text)}</p>
</li>`
}

export function renderTimeline(content) {
  const years = []
  for (let y = FIRST; y <= NOW; y++) years.push(`<span style="--x:${x(y)}">${y}</span>`)
  const body = rows(content).map(r => r.type === 'p' ? productRow(r.p) : markerRow(r.m)).join('\n')
  return `<div class="ruler" aria-hidden="true"><div class="years">${years.join('')}</div></div>
<ol class="rows">
${body}
</ol>`
}
