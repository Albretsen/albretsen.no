// Pure string renderers. Used at runtime (app.js) and to bake the static
// fallback markup into index.html, so the page reads the same with or without JS.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function counts(products) {
  const c = { live: 0, building: 0, paused: 0, retired: 0 }
  for (const p of products) c[p.status] = (c[p.status] || 0) + 1
  return c
}

export function ledeHTML(content) {
  const c = counts(content.products)
  const since = content.history.playDeveloperSince
  return `<span class="n">${c.live}</span> live. <span class="n">${c.building}</span> building. ` +
    `<span class="n">${c.paused}</span> paused. <span class="n">${c.retired}</span> retired. ` +
    `Since <span class="n">${since}</span>, software built to pay for itself.`
}

const figure = p => p.figure
  ? `<span class="fig"><span class="fig-v">${esc(p.figure.value)}</span> <span class="fig-l">${esc(p.figure.label)}</span></span>`
  : ''

function act(p, tier) {
  const name = p.url
    ? `<a href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a>`
    : esc(p.name)
  return `<li class="act act-${tier}" data-status="${p.status}">` +
    `<p class="act-note">${figure(p)}<span class="act-meta"><span class="yr">${p.since}</span> <span class="st">${p.status}</span></span></p>` +
    `<h3 class="act-name"><span class="bloom">${name}</span></h3>` +
    `<p class="act-line">${esc(p.line)}</p>` +
    `</li>`
}

function retired(p) {
  const fig = p.figure ? ` · ${esc(p.figure.value)} ${esc(p.figure.label)}` : ''
  return `<li class="old"><h3 class="old-name">${esc(p.name)}</h3>` +
    `<p class="old-meta"><span class="yr">${p.since}</span> retired${fig}</p>` +
    `<p class="old-line">${esc(p.line)}</p></li>`
}

export function productsHTML(content) {
  const ps = content.products
  const c = counts(ps)
  const head = ps.filter(p => p.status === 'live').sort((a, b) => a.since - b.since)
  const mid = ps.filter(p => p.status === 'building' || p.status === 'paused')
  const old = ps.filter(p => p.status === 'retired')
  return `<div class="tier-note m-l"><p><span class="n">${ps.length}</span> on the bill</p></div>` +
    `<ol class="tier tier-1" aria-label="Live">${head.map(p => act(p, 1)).join('')}</ol>` +
    `<ol class="tier tier-2" aria-label="Building and paused">${mid.map(p => act(p, 2)).join('')}</ol>` +
    `<div class="tier-note m-l"><p><span class="n">${c.retired}</span> retired, still on the bill</p></div>` +
    `<ol class="tier tier-3" aria-label="Retired">${old.map(retired).join('')}</ol>`
}
