// Renders the products section from content.js. Used twice: once at authoring
// time (node) to bake static markup into index.html, and again in the browser
// so the page always reflects content.js. Same output both times, so no shift.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// Status is drawn as the sun's position against the horizon.
const STATUS = {
  live: { word: 'Live', note: 'sun up' },
  building: { word: 'Building', note: 'rising' },
  paused: { word: 'Paused', note: 'on the horizon' },
  retired: { word: 'Retired', note: 'set' },
}

export function sunGlyph(status) {
  // 20 x 14 box, horizon at y = 9
  const cy = { live: 4.5, building: 7, paused: 9.5, retired: 13.5 }[status] ?? 9
  const fill = status === 'retired' ? 'none' : 'currentColor'
  const clip = status === 'retired' ? '' : ` clip-path="url(#sky)"`
  return `<svg class="sun" viewBox="0 0 20 18" width="20" height="18" aria-hidden="true">` +
    `<circle cx="10" cy="${cy}" r="3.6" fill="${fill}" stroke="currentColor" stroke-width="1.2"${status === 'building' || status === 'paused' ? clip : ''}/>` +
    `<line x1="1" x2="19" y1="9.5" y2="9.5" stroke="currentColor" stroke-width="1.2"/></svg>`
}

function figure(p) {
  if (!p.figure) return `<p class="fig fig--none" aria-hidden="true">&nbsp;</p>`
  return `<p class="fig"><span class="fig-v">${esc(p.figure.value)}</span> <span class="fig-l">${esc(p.figure.label)}</span></p>`
}

export function renderProducts(content) {
  const active = content.products.filter(p => p.status !== 'retired')
  const retired = content.products.filter(p => p.status === 'retired')
  const n = i => String(i + 1).padStart(2, '0')

  const feature = active.map((p, i) => {
    const s = STATUS[p.status] || { word: p.status, note: '' }
    const name = p.url
      ? `<a href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a>`
      : esc(p.name)
    const facts = (p.facts || []).map(f => `<li>${esc(f)}</li>`).join('')
    return `<article class="work work--${esc(p.status)}">
  <header class="work-head">
    <span class="work-no">${n(i)}</span>
    <span class="status">${sunGlyph(p.status)}<span>${s.word}</span><span class="status-note">${s.note}</span></span>
    <span class="since">since ${esc(p.since)}</span>
  </header>
  <h3 class="work-name">${name}</h3>
  <p class="work-line">${esc(p.line)}</p>
  ${figure(p)}
  ${facts ? `<ul class="facts">${facts}</ul>` : ''}
</article>`
  }).join('\n')

  const archive = retired.map((p, i) => `<li class="arc">
  <span class="work-no">${n(active.length + i)}</span>
  <span class="arc-name">${esc(p.name)}</span>
  <span class="arc-line">${esc(p.line)}</span>
  <span class="arc-fig">${p.figure ? `${esc(p.figure.value)} ${esc(p.figure.label)}` : ''}</span>
  <span class="arc-year">${esc(p.since)}</span>
  <span class="status status--small">${sunGlyph('retired')}<span>Retired</span></span>
</li>`).join('\n')

  return `<div class="works">
${feature}
</div>
<div class="archive">
  <h3 class="archive-title">Below the horizon <span>Retired, kept on the record</span></h3>
  <ol class="arc-list">
${archive}
  </ol>
</div>`
}
