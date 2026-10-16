// UNCUT: one renderer for the cast list, used by the browser and by the
// static build step (node designs/30/build.mjs) so the no-JS markup and the
// enhanced markup are byte-identical. No layout shift by construction.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const STATUS = { live: 'LIVE', building: 'BUILDING', paused: 'PAUSED', retired: 'RETIRED' }

export function castRow(p) {
  const name = p.url
    ? `<a href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a>`
    : esc(p.name)
  const fig = p.figure
    ? `<span class="fig"><b>${esc(p.figure.value)}</b> ${esc(p.figure.label)}</span>`
    : `<span class="fig fig--none" aria-label="no figure">--</span>`
  const facts = p.facts?.length
    ? `<span class="facts">${p.facts.map(esc).join(' / ')}</span>`
    : ''
  return `<li class="row row--${p.status}" data-product="${esc(p.id)}">` +
    `<span class="yr">${p.since}</span>` +
    `<span class="nm">${name}</span>` +
    `<span class="ln">${esc(p.line)}${facts ? ' ' + facts : ''}</span>` +
    fig +
    `<span class="st st--${p.status}">${STATUS[p.status] || esc(p.status)}</span>` +
    `</li>`
}

export function renderCast(products) {
  const working = products.filter(p => p.status !== 'retired')
  const retired = products.filter(p => p.status === 'retired')
  return {
    working: working.map(castRow).join('\n'),
    retired: retired.map(castRow).join('\n'),
  }
}
