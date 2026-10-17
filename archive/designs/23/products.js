// Renders the products ledger from content.js. Used at runtime by main.js
// and once by hand to pre-render the same markup into index.html, so the
// page reads the same with or without JavaScript.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function tally(products) {
  const t = { live: 0, building: 0, paused: 0, retired: 0 }
  for (const p of products) t[p.status] = (t[p.status] || 0) + 1
  return t
}

export function productRows(products) {
  return products.map((p, i) => {
    const n = String(i + 1).padStart(2, '0')
    const host = p.url ? new URL(p.url).host : ''
    const name = p.url
      ? `<a href="${esc(p.url)}" data-cursor="${esc(host)} &#8599;">${esc(p.name)}</a>`
      : esc(p.name)
    const fig = p.figure
      ? `<p class="fig"><b>${esc(p.figure.value)}</b><span>${esc(p.figure.label)}</span></p>`
      : `<p class="fig fig-none"><b aria-hidden="true">&#8212;</b><span>no figure</span></p>`
    const facts = p.facts && p.facts.length
      ? `<ul class="facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`
      : ''
    return `<li class="row is-${esc(p.status)}" data-reveal>` +
      `<p class="idx"><span class="n">${n}</span><span class="yr">${p.since}</span></p>` +
      `<h3 class="pname">${name}</h3>` +
      fig +
      `<div class="pbody"><p class="st"><span>${esc(p.status)}</span></p><p class="pline">${esc(p.line)}</p>${facts}</div>` +
      `</li>`
  }).join('\n')
}
