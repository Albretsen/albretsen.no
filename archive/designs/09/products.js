// Renders the products list. Used at runtime by main.js, and once at authoring
// time to bake the identical static markup into index.html (so nothing shifts).

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// 4x4 bitmap status marks. live: solid. building: half. paused: hollow. retired: dithered, fading out.
const MARKS = {
  live: 'M0 0h4v4H0z',
  building: 'M0 0h2v4H0zM2 0h2v1H2zM2 3h2v1H2zM3 1h1v2H3z',
  paused: 'M0 0h4v1H0zM0 3h4v1H0zM0 1h1v2H0zM3 1h1v2H3z',
  retired: 'M0 0h1v1H0zM2 0h1v1H2zM1 1h1v1H1zM3 1h1v1H3zM0 2h1v1H0zM2 2h1v1H2zM1 3h1v1H1zM3 3h1v1H3z',
}
export const mark = status =>
  `<svg class="mk" viewBox="0 0 4 4" aria-hidden="true" shape-rendering="crispEdges"><path d="${MARKS[status] || MARKS.retired}"/></svg>`

export function renderProduct(p) {
  const name = p.url
    ? `<a href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a>`
    : esc(p.name)
  const figure = p.figure
    ? `<span class="fig"><b>${esc(p.figure.value)}</b> ${esc(p.figure.label)}</span>`
    : ''
  const facts = (p.facts || []).map(f => `<span>${esc(f)}</span>`).join('')
  return `<li class="p is-${esc(p.status)}" data-id="${esc(p.id)}">` +
    `<span class="yr">${esc(p.since)}</span>` +
    `<div class="pb">` +
      `<h3 class="pn">${name}</h3>` +
      `<span class="st">${mark(p.status)}${esc(p.status)}</span>` +
      `<p class="pl">${esc(p.line)}</p>` +
      (figure || facts ? `<p class="pm">${figure}${facts}</p>` : '') +
    `</div></li>`
}

export const renderProducts = products => products.map(renderProduct).join('')
