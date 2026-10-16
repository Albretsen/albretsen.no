// Renders the products ("Contents") from content.js. The same function wrote the
// static markup inside index.html, so the page reads fine before JS runs and
// re-rendering on load changes nothing (no layout shift).

const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const host = url => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

function entry(p, i) {
  const no = String(i + 1).padStart(2, '0')
  const name = p.url
    ? `<a href="${esc(p.url)}">${esc(p.name)}</a>`
    : esc(p.name)
  const figure = p.figure
    ? `<p class="entry__figure"><span class="fig">${esc(p.figure.value)}</span><span class="fig-label">${esc(p.figure.label)}</span></p>`
    : ''
  const facts = p.facts && p.facts.length
    ? `<ul class="entry__facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`
    : ''
  const link = p.url ? `<p class="entry__host">${esc(host(p.url))}</p>` : ''
  return `<article class="entry entry--${esc(p.status)}" aria-labelledby="p-${esc(p.id)}">` +
    `<p class="entry__no" aria-hidden="true">${no}</p>` +
    `<p class="entry__meta small"><span class="status status--${esc(p.status)}">${STATUS[p.status] || esc(p.status)}</span><span>since ${esc(p.since)}</span></p>` +
    `<h4 class="entry__name" id="p-${esc(p.id)}">${name}</h4>` +
    `<p class="entry__line">${esc(p.line)}</p>` +
    `<div class="entry__foot">${figure}${facts}${link}</div>` +
    `</article>`
}

export function renderProducts(products) {
  const current = products.filter(p => p.status !== 'retired')
  const back = products.filter(p => p.status === 'retired')
  const shelf = (cls, title, list, offset) =>
    `<section class="shelf shelf--${cls}" aria-label="${title}"><h3 class="shelf__title small">${title} <span>${list.length}</span></h3>` +
    `<div class="shelf__row">${list.map((p, i) => entry(p, i + offset)).join('')}</div></section>`
  return shelf('current', 'In print', current, 0) + shelf('back', 'Back issues', back, current.length)
}
