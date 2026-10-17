// Renders the products table. Pure function: used by the browser and by
// the one-off node script that wrote the static fallback into index.html.

const GLYPH = { live: '●', building: '◐', paused: '◌', retired: '○' }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function counts(products) {
  const c = { live: 0, building: 0, paused: 0, retired: 0 }
  for (const p of products) c[p.status] = (c[p.status] || 0) + 1
  return c
}

export function productsHTML(products) {
  return products.map((p, i) => {
    const idx = String(i + 1).padStart(2, '0')
    const fig = p.figure
      ? `<span class="p-fig"><b>${esc(p.figure.value)}</b> ${esc(p.figure.label)}</span>`
      : `<span class="p-fig p-fig-none" aria-hidden="true">─</span>`
    const facts = p.facts ? `<span class="p-facts">${p.facts.map(esc).join(' · ')}</span>` : ''
    const inner =
      `<span class="c-idx">${idx}</span>` +
      `<span class="c-main"><span class="p-name">${esc(p.name)}</span><span class="p-line">${esc(p.line)}</span>${facts}</span>` +
      `<span class="c-side"><span class="p-status s-${p.status}"><span aria-hidden="true">${GLYPH[p.status] || '·'}</span> ${esc(p.status)}</span>` +
      `<span class="p-since">from ${p.since}</span>${fig}</span>`
    const tag = p.url
      ? `<a class="row-in" href="${esc(p.url)}" rel="noopener">${inner}</a>`
      : `<div class="row-in">${inner}</div>`
    return `<li class="row is-${p.status}">${tag}</li>`
  }).join('\n')
}
