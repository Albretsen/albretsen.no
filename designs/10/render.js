// Pust: renders the products section from content.js.
// The same function produced the static markup baked into index.html,
// so the page reads the same before and after JavaScript.

export const STATUS = {
  live: { glyph: '▓', no: 'i drift', en: 'live' },
  building: { glyph: '▒', no: 'under arbeid', en: 'building' },
  paused: { glyph: '░', no: 'på pause', en: 'paused' },
  retired: { glyph: '·', no: 'lagt ned', en: 'retired' },
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const pad = n => String(n).padStart(2, '0')

function status(s) {
  const st = STATUS[s]
  return `<span class="st st--${s}"><span aria-hidden="true">${st.glyph}</span> ${st.en}<span class="st-no"> · ${st.no}</span></span>`
}

function active(p, i) {
  const name = p.url ? `<a href="${esc(p.url)}">${esc(p.name)}</a>` : esc(p.name)
  const fig = p.figure
    ? `<div class="p-fig" aria-hidden="true">${esc(p.figure.value)}</div>`
    : ''
  const figRow = p.figure
    ? `<div><dt>figure</dt><dd><b>${esc(p.figure.value)}</b> ${esc(p.figure.label)}</dd></div>`
    : ''
  const facts = p.facts?.length
    ? `<ul class="p-facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`
    : ''
  return `<article class="p p--${p.status}">${fig}<header><span class="p-no">${pad(i + 1)}</span><h3>${name}</h3></header><p class="p-line">${esc(p.line)}</p><dl class="p-meta"><div><dt>status</dt><dd>${status(p.status)}</dd></div><div><dt>since</dt><dd>${p.since}</dd></div>${figRow}</dl>${facts}</article>`
}

function retiredRow(p, i, offset) {
  const fig = p.figure ? `${esc(p.figure.value)} ${esc(p.figure.label)}` : '—'
  return `<tr><td class="r-no">${pad(offset + i + 1)}</td><td class="r-year">${p.since}</td><th scope="row">${esc(p.name)}</th><td class="r-line">${esc(p.line)}</td><td class="r-fig">${fig}</td></tr>`
}

export function productsHTML(content) {
  const live = content.products.filter(p => p.status !== 'retired')
  const gone = content.products.filter(p => p.status === 'retired')
  const count = s => content.products.filter(p => p.status === s).length
  const tally = ['live', 'building', 'paused', 'retired']
    .map(s => `<span>${STATUS[s].glyph} ${count(s)} ${STATUS[s].no}</span>`).join('')
  return `<header class="sec-head"><p class="kicker"><span>02</span> Produkter</p><h2>What runs, what is being built, and what was laid down.</h2><p class="tally" aria-label="Tally">${tally}</p></header><div class="grid">${live.map(active).join('')}</div><div class="gone"><h3 class="gone-head"><span>Lagt ned</span> retired, kept on the record</h3><table><thead><tr><th scope="col">nr</th><th scope="col">since</th><th scope="col">name</th><th scope="col">what it was</th><th scope="col">figure</th></tr></thead><tbody>${gone.map((p, i) => retiredRow(p, i, live.length)).join('')}</tbody></table></div>`
}
