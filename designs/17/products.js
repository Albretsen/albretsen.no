// Products table. The same function produced the static rows in index.html,
// so re-rendering from content.js on load changes nothing visually.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' }

export function rowHTML(p, i) {
  const no = String(i + 1).padStart(2, '0')
  const name = p.url
    ? `<a href="${esc(p.url)}">${esc(p.name)}</a>`
    : esc(p.name)
  const figure = p.figure
    ? `<span class="fig-v">${esc(p.figure.value)}</span> <span class="fig-l">${esc(p.figure.label)}</span>`
    : '<span class="fig-none" aria-label="no figure">&mdash;</span>'
  const facts = p.facts && p.facts.length
    ? `<span class="facts">${p.facts.map(esc).join(' / ')}</span>`
    : ''
  return `<li class="p p-${p.status}" data-id="${esc(p.id)}">` +
    `<span class="p-no">${no}</span>` +
    `<h3 class="p-name">${name}</h3>` +
    `<span class="p-status"><i aria-hidden="true"></i>${STATUS[p.status] || esc(p.status)}</span>` +
    `<span class="p-since">${p.since}</span>` +
    `<span class="p-fig">${figure}</span>` +
    `<p class="p-line">${esc(p.line)}${facts ? ' ' + facts : ''}</p>` +
    `</li>`
}

export function summary(products) {
  const n = s => products.filter(p => p.status === s).length
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
  const w = k => words[k] || String(k)
  const cap = t => t[0].toUpperCase() + t.slice(1)
  return `${cap(w(products.length))} entries. ${cap(w(n('live')))} live, ${w(n('building'))} under construction, ${w(n('paused'))} paused, ${w(n('retired'))} retired and left on the record.`
}

export function renderProducts(list, summaryEl, products) {
  list.innerHTML = products.map(rowHTML).join('')
  if (summaryEl) summaryEl.textContent = summary(products)
}
