// Pure render helpers, shared by the page and by the one-off static prerender.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function productRows(products) {
  return products.map((p, i) => {
    const name = p.url
      ? `<a href="${esc(p.url)}">${esc(p.name)}</a>`
      : esc(p.name)
    const fig = p.figure
      ? `<span class="fig-v">${esc(p.figure.value)}</span> <span class="fig-l">${esc(p.figure.label)}</span>`
      : `<span class="fig-none" aria-label="no figure">&ndash;</span>`
    const facts = p.facts && p.facts.length
      ? `<span class="p-facts">${p.facts.map(esc).join(" &middot; ")}</span>` : ''
    return `<li class="p-row" data-id="${esc(p.id)}" data-status="${esc(p.status)}">` +
      `<span class="p-no">1.${i + 1}</span>` +
      `<span class="p-main"><span class="p-name">${name}</span><span class="p-line">${esc(p.line)}</span>${facts}</span>` +
      `<span class="p-since">${p.since}</span>` +
      `<span class="p-status">${esc(p.status)}</span>` +
      `<span class="p-fig">${fig}</span>` +
      `</li>`
  }).join('\n')
}

// One sentence, numbers first. Every number comes from content.js.
export function statement(content) {
  const by = s => content.products.filter(p => p.status === s).length
  const fl = content.products.find(p => p.id === 'fun-libs').figure
  const me = content.products.find(p => p.id === 'mcp-emails').figure
  return `${fl.value} ${fl.label}, ${me.value} ${me.label}, ${by('live')} products live, ${by('building')} building: ` +
    `Asgeir writes software, ships it, and keeps what pays for itself.`
}

export function counts(content) {
  const by = s => content.products.filter(p => p.status === s).length
  return { total: content.products.length, live: by('live'), building: by('building'), paused: by('paused'), retired: by('retired') }
}
