// Pure markup for the products section. Used by the page at runtime and by
// build-static.mjs to write the identical no-JS fallback into index.html.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export function productRow(p) {
  const retired = p.status === 'retired'
  const name = p.url
    ? `<a class="p-name" href="${esc(p.url)}">${esc(p.name)}</a>`
    : `<span class="p-name">${esc(p.name)}</span>`
  const fig = p.figure
    ? `<span class="p-fig"><b>${esc(p.figure.value)}</b> <i>${esc(p.figure.label)}</i></span>`
    : ''
  return `<li class="p ln" data-status="${esc(p.status)}">` +
    `<span class="p-year">${retired ? '<span class="p-slash" aria-hidden="true">//</span>' : ''}${p.since}</span>` +
    `<span class="p-body"><span class="p-title">${name} <span class="p-status">${esc(p.status)}</span></span>` +
    `<span class="p-line">${esc(p.line)}</span></span>${fig}</li>`
}

export function productsHTML(products) {
  return products.map(productRow).join('\n')
}
