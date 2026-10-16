// Pure renderer for the products index. Used at runtime (from content.js)
// and once at authoring time to write the static fallback into index.html,
// so both produce identical markup and nothing shifts when JS arrives.

const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' }

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export function summary(products) {
  const n = s => products.filter(p => p.status === s).length
  return `${products.length} entries · ${n('live')} live · ${n('building')} building · ${n('paused')} paused · ${n('retired')} retired`
}

export function renderProducts(products) {
  return products.map((p, i) => {
    const host = p.url ? p.url.replace(/^https?:\/\//, '') : ''
    const name = p.url
      ? `<a class="p-name" href="${esc(p.url)}" data-host="${esc(host)}">${esc(p.name)}</a>`
      : `<span class="p-name">${esc(p.name)}</span>`
    const fig = p.figure
      ? `<span class="p-fig"><span class="p-fig-v">${esc(p.figure.value)}</span><span class="p-fig-l">${esc(p.figure.label)}</span></span>`
      : `<span class="p-fig p-fig-none" aria-hidden="true"></span>`
    const facts = p.facts ? `<span class="p-facts">${p.facts.map(esc).join(' · ')}</span>` : ''
    return `<li class="p p-${p.status}">` +
      `<span class="p-no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>` +
      `<span class="p-year">${p.since}</span>` +
      `<span class="p-main">${name}<span class="p-line">${esc(p.line)}</span>${facts}</span>` +
      `<span class="p-status"><i aria-hidden="true"></i>${STATUS[p.status] || esc(p.status)}</span>` +
      fig + `</li>`
  }).join('\n')
}
