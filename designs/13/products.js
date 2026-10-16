// Renders the product index as an HTML string. Used at runtime by main.js and
// once at authoring time to bake identical static markup into index.html.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const FEED_PRODUCTS = new Set(['mcp-emails', 'fun-libs', 'toolrails'])

export function renderProducts(products) {
  return products.map((p, i) => {
    const n = String(i + 1).padStart(2, '0')
    const name = p.url
      ? `<a href="${esc(p.url)}" rel="noopener">${esc(p.name)}<span class="arrow" aria-hidden="true">&#8599;</span></a>`
      : esc(p.name)
    const fig = p.figure
      ? `<p class="fig"><span class="fig-v">${esc(p.figure.value)}</span><span class="fig-l">${esc(p.figure.label)}</span></p>`
      : `<p class="fig fig-none" aria-hidden="true"><span class="fig-v">&#8212;</span></p>`
    const facts = p.facts && p.facts.length
      ? `<ul class="facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''
    const live = FEED_PRODUCTS.has(p.id)
      ? `<p class="since-arrival"><span data-count="${esc(p.id)}">0</span> events since you arrived</p>` : ''
    return `<li class="block s-${esc(p.status)}" id="p-${esc(p.id)}">
<p class="block-meta"><span class="n">${n}</span><span class="status">${esc(p.status)}</span><span class="year">${esc(p.since)}</span></p>
<h3 class="block-name">${name}</h3>
<p class="block-line">${esc(p.line)}</p>
${fig}${facts}${live}
</li>`
  }).join('\n')
}
