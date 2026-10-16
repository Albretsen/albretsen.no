// Pure render functions: used at runtime, and once by hand to bake the
// no-JS fallback markup into index.html. Same output both ways = no shift.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const STATUS = { live: 'live', building: 'building', paused: 'paused', retired: 'retired' }

export function renderProducts(content) {
  return content.products.map((p, i) => {
    const name = p.url
      ? `<a class="p-name" href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a>`
      : `<span class="p-name">${esc(p.name)}</span>`
    const fig = p.figure
      ? `<p class="p-fig"><b>${esc(p.figure.value)}</b> <span>${esc(p.figure.label)}</span></p>`
      : `<p class="p-fig p-fig--none" aria-hidden="true">&mdash;</p>`
    const facts = p.facts ? `<p class="p-facts">${p.facts.map(esc).join(' <i>/</i> ')}</p>` : ''
    return `<li class="p p--${p.status}" style="--i:${i}">` +
      `<p class="p-year">${p.since}</p>` +
      `<div class="p-main"><h3>${name}</h3><p class="p-line">${esc(p.line)}</p>${facts}</div>` +
      `<p class="p-status"><span class="dot" aria-hidden="true"></span>${STATUS[p.status] || esc(p.status)}</p>` +
      fig + `</li>`
  }).join('\n')
}

export function renderRuler(content) {
  const start = content.history.playDeveloperSince, end = Math.max(...content.products.map(p => p.since))
  const years = []
  for (let y = start; y <= end; y++) {
    const ps = content.products.filter(p => p.since === y)
    const pos = ((y - start) / (end - start)) * 100
    years.push(`<li style="--x:${pos.toFixed(2)}%"><span class="r-stack">${ps.map(p => `<i class="r-m r-m--${p.status}" title="${esc(p.name)}"></i>`).join('')}</span><span class="r-y">${String(y).slice(2)}</span></li>`)
  }
  return years.join('')
}
