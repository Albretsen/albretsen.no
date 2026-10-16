// Renders the products "directory listing" from content.js.
// Used in the browser (main.js) and once by hand to bake the static
// fallback markup into index.html, so the page reads the same with or without JS.

// One character per product that appears on the tape. It is also its note.
export const GLYPH = { 'mcp-emails': '@', 'fun-libs': '_', toolrails: '#', 'albretsen.no': '~' }

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function row(p) {
  const tag = p.url ? 'a' : 'div'
  const href = p.url ? ` href="${esc(p.url)}" rel="noopener"` : ''
  const fig = p.figure ? `<b>${esc(p.figure.value)}</b> ${esc(p.figure.label)}` : '<span class="p__none">-</span>'
  const facts = p.facts && p.facts.length ? ` <span class="p__facts">${p.facts.map(esc).join(' · ')}</span>` : ''
  const glyph = GLYPH[p.id] || ' '
  return `<li class="p p--${p.status}">` +
    `<${tag} class="p__row"${href}>` +
    `<span class="p__cur" aria-hidden="true">${glyph === ' ' ? '&nbsp;' : esc(glyph)}</span>` +
    `<span class="p__name">${esc(p.name)}</span>` +
    `<span class="p__status"><span class="vh">status: </span>[${esc(p.status)}]</span>` +
    `<span class="p__since"><span class="vh">since </span>${p.since}</span>` +
    `<span class="p__fig">${fig}</span>` +
    `<span class="p__line">${esc(p.line)}${facts}</span>` +
    `</${tag}></li>`
}

export function renderProducts(products) {
  const active = products.filter(p => p.status !== 'retired')
  const retired = products.filter(p => p.status === 'retired')
  const count = s => products.filter(p => p.status === s).length
  const head = '<li class="p p--head" aria-hidden="true"><div class="p__row">' +
    '<span class="p__cur">&nbsp;</span><span class="p__name">NAME</span><span class="p__status">STATUS</span>' +
    '<span class="p__since">SINCE</span><span class="p__fig">FIGURE</span><span class="p__line">WHAT IT IS</span></div></li>'
  const shelf = '<li class="p p--shelf" aria-hidden="true"><div class="p__row"><span class="p__shelf">' +
    'retired. kept on the shelf with the lights off</span></div></li>'
  const list = `<ul class="dir" role="list">${head}${active.map(row).join('')}${shelf}${retired.map(row).join('')}</ul>`
  const summary = `<p class="dir__sum">${products.length} products &nbsp; ${count('live')} live &nbsp; ${count('building')} building &nbsp; ` +
    `${count('paused')} paused &nbsp; ${count('retired')} retired</p>`
  return list + summary
}
