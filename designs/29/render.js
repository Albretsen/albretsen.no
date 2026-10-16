// room 24 · pure string renderers, shared by the browser and the bake step.
// everything here comes from content.js; nothing is invented.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const low = s => esc(String(s).toLowerCase())

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
const word = n => WORDS[n] ?? String(n)

export function collectionSummary(products) {
  const count = s => products.filter(p => p.status === s).length
  const parts = [
    [count('live'), 'live'],
    [count('building'), 'in progress'],
    [count('paused'), 'paused'],
    [count('retired'), 'retired'],
  ].filter(([n]) => n > 0).map(([n, s]) => `${word(n)} ${s}`)
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]
  return `${word(products.length)} works: ${list}.`
}

export function productLabel(p, i) {
  const num = String(i + 1).padStart(2, '0')
  const name = p.url
    ? `<a href="${esc(p.url)}" rel="noopener">${low(p.name)}</a>`
    : low(p.name)
  const facts = p.facts?.length ? `<p class="work-medium">${p.facts.map(low).join(', ')}</p>` : ''
  const figure = p.figure
    ? `<p class="work-figure"><span class="work-figure-value">${low(p.figure.value)}</span> <span class="work-figure-label">${low(p.figure.label)}</span></p>`
    : `<p class="work-figure work-figure-none" aria-hidden="true"></p>`
  return `<li class="work" data-status="${esc(p.status)}">
  <p class="work-no" aria-hidden="true">${num}</p>
  <h3 class="work-name">${name}</h3>
  <p class="work-date"><span class="work-status"><i class="dot" aria-hidden="true"></i>${low(p.status)}</span><span class="work-since">${esc(p.since)}</span></p>
  <p class="work-line">${low(p.line)}</p>
  ${facts}
  ${figure}
</li>`
}

export function productsMarkup(products) {
  return products.map(productLabel).join('\n')
}
