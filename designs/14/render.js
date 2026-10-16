// Product markup. Pure function: runs in the browser and in node (bake.mjs
// uses it to write the static fallback into index.html, so first paint and
// the JS render are byte-identical).

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' }

// Asymmetric spans on the 12-column product grid, in content order.
const SPANS = ['s7', 's5', 's4', 's8']

const tag = (p) => `<span class="st st-${p.status}" aria-hidden="true"></span><span class="st-word">${STATUS[p.status]}</span>`

function card(p, i) {
  const name = p.url
    ? `<a class="p-name" href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a>`
    : `<span class="p-name">${esc(p.name)}</span>`
  const fig = p.figure
    ? `<p class="p-fig"><span class="p-fig-v">${esc(p.figure.value)}</span> <span class="p-fig-l">${esc(p.figure.label)}</span></p>`
    : ''
  const facts = p.facts ? `<p class="p-facts">${p.facts.map(esc).join(' / ')}</p>` : ''
  return `<li class="p-card ${SPANS[i] || 's6'}" data-product="${esc(p.id)}">
<p class="p-meta">${tag(p)}<span class="p-since">${p.since}</span></p>
<h3>${name}</h3>
<p class="p-line">${esc(p.line)}</p>
${fig}${facts}</li>`
}

function row(p) {
  const fig = p.figure ? `${esc(p.figure.value)} ${esc(p.figure.label)}` : '<span class="nil">--</span>'
  return `<tr data-product="${esc(p.id)}"><th scope="row">${tag(p)}<span class="r-name">${esc(p.name)}</span></th><td class="r-line">${esc(p.line)}</td><td class="r-since">${p.since}</td><td class="r-fig">${fig}</td></tr>`
}

export function renderProducts(content) {
  const active = content.products.filter(p => p.status !== 'retired')
  const retired = content.products.filter(p => p.status === 'retired')
  return `<ol class="p-grid" role="list">
${active.map(card).join('\n')}
</ol>
<div class="finder" role="region" aria-label="Retired products">
<p class="finder-bar"><span>Retired</span><span>${retired.length} items</span><span>kept on purpose</span></p>
<div class="finder-scroll"><table>
<thead><tr><th scope="col">Name</th><th scope="col">What it was</th><th scope="col">Since</th><th scope="col">Figure</th></tr></thead>
<tbody>
${retired.map(row).join('\n')}
</tbody></table></div>
</div>`
}

export function productCounts(content) {
  const all = content.products.length
  const retired = content.products.filter(p => p.status === 'retired').length
  return { all, active: all - retired, retired }
}
