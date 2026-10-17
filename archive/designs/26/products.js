// Widescreen / products column markup. Pure string functions (no DOM), so the
// same code renders the static HTML fallback and the live page.

const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' }

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const host = url => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

export function productHTML(p, i) {
  const n = String(i + 1).padStart(2, '0')
  const facts = p.facts && p.facts.length
    ? `<ul class="p-facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`
    : ''
  const fig = p.figure
    ? `<p class="p-fig"><span class="p-val">${esc(p.figure.value)}</span> <span class="p-lab">${esc(p.figure.label)}</span></p>`
    : `<p class="p-fig p-fig-none" aria-hidden="true"></p>`
  const link = p.url
    ? `<a class="p-url" href="${esc(p.url)}" rel="noopener">${esc(host(p.url))}</a>`
    : `<span class="p-url">offline</span>`
  return `<li class="prod is-${esc(p.status)}">` +
    `<div class="p-top"><span class="p-idx">${n}</span><span class="p-status"><i class="px" aria-hidden="true"></i>${STATUS[p.status] || esc(p.status)}</span></div>` +
    `<h3 class="p-name">${esc(p.name)}</h3>` +
    `<p class="p-line">${esc(p.line)}</p>` +
    facts + fig +
    `<div class="p-foot"><span>Since ${esc(p.since)}</span>${link}</div>` +
    `</li>`
}

export const productsHTML = list => list.map(productHTML).join('')

export function tally(list) {
  const active = list.filter(p => p.status !== 'retired').length
  return { total: list.length, active, retired: list.length - active }
}
