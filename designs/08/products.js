// Renders the products section from content.js. Used at runtime (main.js)
// and once at author time (build.mjs) to bake the same markup into index.html,
// so the page reads correctly before, or without, JavaScript.

export const FEED_PRODUCTS = ['mcp-emails', 'fun-libs', 'toolrails']

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function productsHTML(content) {
  return content.products.map(p => {
    const name = p.url
      ? `<a href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a>`
      : esc(p.name)
    const fig = p.figure
      ? `<p class="p-fig"><b>${esc(p.figure.value)}</b> <span>${esc(p.figure.label)}</span></p>`
      : `<p class="p-fig p-fig--none" aria-hidden="true"><span>&middot;</span></p>`
    const facts = p.facts && p.facts.length
      ? `<p class="p-facts">${p.facts.map(esc).join('<i> / </i>')}</p>`
      : ''
    const strip = FEED_PRODUCTS.includes(p.id)
      ? `<span class="p-strip" data-strip="${esc(p.id)}" aria-hidden="true">${'<i></i>'.repeat(12)}</span>`
      : ''
    return `<li class="p" data-status="${esc(p.status)}">
  <span class="p-year">${esc(p.since)}</span>
  <span class="p-status"><i class="sq" aria-hidden="true"></i>${esc(p.status)}</span>
  <h3 class="p-name">${name}${strip}</h3>
  <div class="p-body"><p class="p-line">${esc(p.line)}</p>${facts}</div>
  ${fig}
</li>`
  }).join('\n')
}
