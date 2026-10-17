// Renders the products section from content.js. Used in the browser and,
// once, by node to write the static fallback into index.html.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const host = url => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

function card(p, i) {
  const fig = p.figure
  return `
    <article class="work work--${p.status}${i % 2 ? ' work--offset' : ''}" id="p-${esc(p.id)}">
      ${fig ? `<p class="work__ghost" aria-hidden="true">${esc(fig.value)}</p>` : ''}
      <h3 class="work__name">${esc(p.name)}</h3>
      <p class="work__meta"><span class="status status--${p.status}"><i aria-hidden="true"></i>${esc(p.status)}</span><span class="work__since">since ${p.since}</span></p>
      <p class="work__line">${esc(p.line)}</p>
      ${fig ? `<p class="work__figure"><span class="work__value">${esc(fig.value)}</span> <span class="work__label">${esc(fig.label)}</span></p>` : ''}
      ${p.facts ? `<p class="work__facts">${p.facts.map(esc).join('<span aria-hidden="true"> · </span><span class="sr">, </span>')}</p>` : ''}
      ${p.url ? `<a class="work__link" href="${esc(p.url)}">${esc(host(p.url))}</a>` : ''}
    </article>`
}

function retiredItem(p) {
  const fig = p.figure ? ` ${esc(p.figure.value)} ${esc(p.figure.label)}.` : ''
  return `<li><span class="ret__name">${esc(p.name)}</span> <span class="ret__year">${p.since}</span>. ${esc(p.line)}${fig}</li>`
}

export function renderProducts(products) {
  const current = products.filter(p => p.status !== 'retired')
  const retired = products.filter(p => p.status === 'retired')
  return `
    <div class="works">${current.map(card).join('')}
    </div>
    <div class="retired">
      <h3 class="retired__title">Retired.</h3>
      <p class="retired__sub">Kept on the list.</p>
      <ul class="retired__list">${retired.map(retiredItem).join('')}</ul>
    </div>`
}
