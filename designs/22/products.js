// Pure renderer for the product index. Used by main.js at runtime and,
// once, to write the identical static markup into index.html.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function summary(products) {
  const n = s => products.filter(p => p.status === s).length
  const oldest = Math.min(...products.map(p => p.since))
  return `${products.length} entries, the oldest from ${oldest}: ${n('live')} live, ${n('building')} building, ${n('paused')} paused, ${n('retired')} retired. The retired ones stay on the list.`
}

export function productsHTML(products) {
  return products.map(p => {
    const name = p.url ? `<a href="${esc(p.url)}">${esc(p.name)}</a>` : esc(p.name)
    const facts = p.facts && p.facts.length ? `<span class="p-facts">${p.facts.map(esc).join(' · ')}</span>` : ''
    const fig = p.figure ? `<b>${esc(p.figure.value)}</b> ${esc(p.figure.label)}` : ''
    return `<li class="p is-${p.status}">` +
      `<span class="p-year">${p.since}</span>` +
      `<span class="p-name">${name}</span>` +
      `<span class="p-line">${esc(p.line)}${facts}</span>` +
      `<span class="p-status"><i class="px" aria-hidden="true"></i>${esc(p.status)}</span>` +
      `<span class="p-fig">${fig}</span>` +
      `</li>`
  }).join('\n')
}
