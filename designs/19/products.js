// Renders the products section from content.js. Pure function: used by the
// browser (main.js) and by tools/build.mjs to write the static fallback into index.html.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// One glyph per status, drawn in the same dot language as the map.
export const glyph = status => {
  const g = {
    live: '<circle cx="6" cy="6" r="4.6" class="g-spot"/>',
    building: '<circle cx="6" cy="6" r="4.2" class="g-ring"/><path d="M6 1.8a4.2 4.2 0 0 1 0 8.4z" class="g-ink"/>',
    paused: '<circle cx="6" cy="6" r="4.2" class="g-ring"/>',
    retired: '<path d="M1.5 6h9" class="g-line"/>',
  }[status] || ''
  return `<svg class="glyph" viewBox="0 0 12 12" aria-hidden="true">${g}</svg>`
}

function name(p) {
  return p.url ? `<a href="${esc(p.url)}">${esc(p.name)}</a>` : esc(p.name)
}

export function productsHTML(content) {
  const all = content.products
  const moving = all.filter(p => p.status !== 'retired')
  const retired = all.filter(p => p.status === 'retired')
  const first = Math.min(...all.map(p => p.since))

  const head = `
<header class="row sec-head">
  <div class="l"><span class="num">1</span></div>
  <div class="m"><h2 id="made">Things made</h2></div>
  <div class="r"><p class="note">${all.length} entries since ${first}. ${moving.length} still standing.</p></div>
</header>`

  const rows = moving.map(p => `
<li class="row product" data-status="${p.status}">
  <div class="l"><span class="year">${p.since}</span></div>
  <div class="m">
    <h3 class="pname">${name(p)}</h3>
    <p class="pline">${esc(p.line)}</p>
    ${p.facts ? `<p class="pfacts">${p.facts.map(esc).join('<span class="sep"> · </span>')}</p>` : ''}
  </div>
  <div class="r">
    <p class="status">${glyph(p.status)}<span>${p.status}</span></p>
    ${p.figure ? `<p class="figure"><span class="fv">${esc(p.figure.value)}</span> <span class="fl">${esc(p.figure.label)}</span></p>` : ''}
  </div>
</li>`).join('')

  const gone = retired.map(p => `
<li class="row retired">
  <div class="l"><span class="year">${p.since}</span></div>
  <div class="m"><p><span class="rname">${name(p)}</span> <span class="rline">${esc(p.line)}</span></p></div>
  <div class="r"><p class="status">${glyph('retired')}<span>retired</span>${p.figure ? `<span class="rfig">${esc(p.figure.value)} ${esc(p.figure.label)}</span>` : ''}</p></div>
</li>`).join('')

  return `${head}
<ol class="plist" aria-labelledby="made">${rows}
</ol>
<div class="row sub-head">
  <div class="l"><span class="label">Retired</span></div>
  <div class="m"><p class="note">Switched off, still listed.</p></div>
  <div class="r"></div>
</div>
<ol class="plist plist-retired" aria-label="Retired products">${gone}
</ol>`
}
